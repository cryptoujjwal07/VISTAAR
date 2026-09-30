import asyncio
import json
import pytest
from httpx import ASGITransport, AsyncClient
from apps.api.core.performance import (
    inflight_deduplicator,
    lttb_downsample,
    ttl_cache,
)
from apps.api.core.queue import AsyncJobQueue, TaskStatus
from apps.api.main import app


@pytest.mark.asyncio
async def test_health_endpoints():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        res = await ac.get("/health")
        assert res.status_code == 200
        data = res.json()
        assert data["status"] == "healthy"
        assert data["service"] == "vistaar-api"

        res_ready = await ac.get("/health/ready")
        assert res_ready.status_code == 200
        ready_data = res_ready.json()
        assert ready_data["status"] == "ready"
        assert ready_data["checks"]["database"]["status"] == "connected"


@pytest.mark.asyncio
async def test_weather_endpoints():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        res = await ac.get("/api/v1/weather/stations")
        assert res.status_code == 200
        stations = res.json()
        assert len(stations) > 0

        ts_res = await ac.get("/api/v1/weather/timeseries?station_id=himansh")
        assert ts_res.status_code == 200
        ts_data = ts_res.json()
        assert ts_data["station_id"] == "himansh"
        assert len(ts_data["points"]) > 0
        assert ts_data["statistics"]["count"] > 0


@pytest.mark.asyncio
async def test_prompt_27_performance_measurement_and_cursor_pagination():
    """
    Prompt 27 Verification:
    - Measure first (/health/performance)
    - Cursor pagination (/datasets, /datasets/{id}/records, /documents, /search)
    - Chunked streaming export (/datasets/{id}/records/stream)
    - LTTB peak-preserving chart downsampling
    """
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        # 1. Cursor pagination on /datasets
        ds_page1 = await ac.get("/api/v1/datasets?limit=1")
        assert ds_page1.status_code == 200
        p1_data = ds_page1.json()
        assert len(p1_data["items"]) == 1
        first_ds_id = p1_data["items"][0]["dataset_id"]

        if p1_data.get("has_more") and p1_data.get("next_cursor"):
            ds_page2 = await ac.get(f"/api/v1/datasets?limit=1&cursor={p1_data['next_cursor']}")
            assert ds_page2.status_code == 200
            p2_data = ds_page2.json()
            assert p2_data["offset"] == 1
            assert len(p2_data["items"]) == 1
            assert p2_data["items"][0]["dataset_id"] != first_ds_id

        # 2. Cursor pagination & chunked streaming on /datasets/{id}/records
        rec_p1 = await ac.get(f"/api/v1/datasets/{first_ds_id}/records?limit=2")
        assert rec_p1.status_code == 200
        rec_p1_json = rec_p1.json()
        assert "has_more" in rec_p1_json
        assert "next_cursor" in rec_p1_json
        if rec_p1_json.get("next_cursor"):
            rec_p2 = await ac.get(
                f"/api/v1/datasets/{first_ds_id}/records?limit=2&cursor={rec_p1_json['next_cursor']}"
            )
            assert rec_p2.status_code == 200
            assert rec_p2.json()["offset"] == 2

        # 3. Chunked streaming export (NDJSON & CSV)
        stream_ndjson = await ac.get(
            f"/api/v1/datasets/{first_ds_id}/records/stream?format=ndjson&batch_size=10&max_records=15"
        )
        assert stream_ndjson.status_code == 200
        assert stream_ndjson.headers.get("X-Stream-Mode") == "chunked"
        lines = [ln for ln in stream_ndjson.text.strip().split("\n") if ln.strip()]
        if rec_p1_json["total"] > 0:
            assert len(lines) > 0
            first_stream_obj = json.loads(lines[0])
            assert "record_id" in first_stream_obj

        stream_csv = await ac.get(
            f"/api/v1/datasets/{first_ds_id}/records/stream?format=csv&batch_size=10&max_records=15"
        )
        assert stream_csv.status_code == 200
        assert "text/csv" in stream_csv.headers.get("content-type", "")
        assert "record_id,dataset_id,station_id,timestamp" in stream_csv.text

        # 4. LTTB peak-preserving time-series downsampling unit & endpoint verification
        synthetic_points = [
            {"timestamp": f"2024-01-{i:02d}T00:00:00Z", "value": float(i if i != 15 else 999.0), "record_id": f"r_{i}"}
            for i in range(1, 31)
        ]
        synthetic_points[7]["value"] = -88.5  # global minimum
        downsampled = lttb_downsample(synthetic_points, 8)
        assert len(downsampled) == 8
        ds_vals = [p["value"] for p in downsampled]
        assert 999.0 in ds_vals  # global maximum preserved
        assert -88.5 in ds_vals  # global minimum preserved
        assert downsampled[0]["record_id"] == "r_1"
        assert downsampled[-1]["record_id"] == "r_30"

        ts_ds = await ac.get("/api/v1/weather/timeseries?station_id=himansh&downsample=3")
        assert ts_ds.status_code == 200
        ts_ds_json = ts_ds.json()
        assert ts_ds_json["returned_point_count"] <= 3

        # 5. Measure-first performance endpoint verification
        perf_res = await ac.get("/api/v1/health/performance")
        assert perf_res.status_code == 200
        perf_data = perf_res.json()
        assert perf_data["measured_first"] is True
        assert perf_data["profiler"]["total_requests_measured"] >= 5
        assert "p95_ms" in perf_data["profiler"]["overall_latency"]
        assert "hits" in perf_data["cache"]
        assert perf_data["database_indexes"]["count"] >= 20


@pytest.mark.asyncio
async def test_prompt_27_deduplication_idempotency_retries_timeouts_and_etag():
    """
    Prompt 27 Verification:
    - In-flight request coalescing (InFlightDeduplicator)
    - HTTP Idempotency-Key header replay
    - AsyncJobQueue deduplication, automatic retries with exponential backoff, and timeout handling
    - PDF page render ETag & 304 Not Modified caching
    """
    # 1. InFlightDeduplicator coalescing concurrent identical calls
    execution_counter = 0

    async def _expensive_work():
        nonlocal execution_counter
        execution_counter += 1
        await asyncio.sleep(0.03)
        return {"computed": 42}

    results = await asyncio.gather(
        *[inflight_deduplicator.coalesce("test_coalesce_key", _expensive_work) for _ in range(5)]
    )
    assert execution_counter == 1
    assert all(r == {"computed": 42} for r in results)

    # 2. AsyncJobQueue deduplication, retries with backoff, and timeout enforcement
    q = AsyncJobQueue()
    await q.start()
    try:
        flaky_attempts = 0

        async def _flaky_task(val: int):
            nonlocal flaky_attempts
            flaky_attempts += 1
            if flaky_attempts < 3:
                raise RuntimeError("Transient sensor I/O glitch")
            return {"recovered_on_attempt": flaky_attempts, "val": val}

        jid1 = await q.enqueue(
            "FLAKY_TASK",
            _flaky_task,
            99,
            dedup_key="flaky_99",
            idempotency_key="idem_flaky_99",
            max_retries=3,
            base_backoff_seconds=0.02,
            timeout_seconds=2.0,
        )
        # Enqueue with identical idempotency key -> must deduplicate and return same job_id
        jid2 = await q.enqueue(
            "FLAKY_TASK",
            _flaky_task,
            99,
            dedup_key="flaky_99",
            idempotency_key="idem_flaky_99",
        )
        assert jid1 == jid2
        assert q.get_job(jid1)["deduplicated"] is True

        # Wait for retry completion
        for _ in range(40):
            if q.get_job(jid1)["status"] in (TaskStatus.COMPLETED, TaskStatus.FAILED):
                break
            await asyncio.sleep(0.02)

        completed_job = q.get_job(jid1)
        assert completed_job["status"] == TaskStatus.COMPLETED
        assert completed_job["retries"] == 2
        assert completed_job["result"]["recovered_on_attempt"] == 3

        # Test job timeout enforcement
        async def _slow_hanging_task():
            await asyncio.sleep(5.0)
            return "never"

        timeout_jid = await q.enqueue(
            "HANGING_TASK",
            _slow_hanging_task,
            max_retries=1,
            base_backoff_seconds=0.01,
            timeout_seconds=0.04,
        )
        for _ in range(40):
            if q.get_job(timeout_jid)["status"] in (TaskStatus.COMPLETED, TaskStatus.FAILED):
                break
            await asyncio.sleep(0.02)

        failed_job = q.get_job(timeout_jid)
        assert failed_job["status"] == TaskStatus.FAILED
        assert "Timeout" in (failed_job["error"] or "")
    finally:
        await q.stop()

    # 3. HTTP Idempotency-Key replay & ETag 304 Not Modified on PDF page render
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        idem_headers = {"Idempotency-Key": "vistaar-idem-embed-001"}
        r1 = await ac.post("/api/v1/ai/providers/embed", json={"text": "Maitri Station katabatic wind"}, headers=idem_headers)
        assert r1.status_code == 200
        assert r1.headers.get("X-Idempotent-Replay") == "false"

        r2 = await ac.post("/api/v1/ai/providers/embed", json={"text": "Maitri Station katabatic wind"}, headers=idem_headers)
        assert r2.status_code == 200
        assert r2.headers.get("X-Idempotent-Replay") == "true"
        assert r1.json() == r2.json()

        # Check ETag & 304 on PDF page render if a document exists on disk
        docs_res = await ac.get("/api/v1/documents?limit=5")
        assert docs_res.status_code == 200
        for doc in docs_res.json().get("items", []):
            doc_id = doc["document_id"]
            render_res = await ac.get(f"/api/v1/documents/{doc_id}/pages/1/render?dpi=100")
            if render_res.status_code == 200:
                etag = render_res.headers.get("ETag")
                assert etag is not None
                render_304 = await ac.get(
                    f"/api/v1/documents/{doc_id}/pages/1/render?dpi=100",
                    headers={"If-None-Match": etag},
                )
                assert render_304.status_code == 304
                break


@pytest.mark.asyncio
async def test_prompt_28_observability_structured_logs_redaction_and_metrics():
    """
    Prompt 28 Verification:
    - Structured logs with request_id, job_id, resource_id, and user_id correlation
    - Secret redaction (passwords, JWTs, API keys, Bearer tokens, MongoDB URIs)
    - Health/readiness checks for worker, DB, Redis, and storage
    - All 10 required observability metrics on /health/metrics
    - Production-safe error responses without stack traces
    """
    import logging
    from apps.api.core.logging import (
        StructuredJsonFormatter,
        clear_log_context,
        redact_sensitive_data,
        redact_sensitive_text,
        set_log_context,
    )

    # 1. Verify StructuredJsonFormatter correlates request_id, job_id, resource_id, and user_id
    formatter = StructuredJsonFormatter()
    clear_log_context()
    set_log_context(
        request_id="req_obs_001",
        job_id="job_obs_002",
        resource_id="ds_himansh_003",
        user_id="usr_scientist_004",
    )
    record = logging.LogRecord(
        name="vistaar.test",
        level=logging.INFO,
        pathname=__file__,
        lineno=10,
        msg='User login password="SuperSecretPassword123!" token=Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjMifQ.sig',
        args=(),
        exc_info=None,
    )
    formatted_json = json.loads(formatter.format(record))
    clear_log_context()

    assert formatted_json["request_id"] == "req_obs_001"
    assert formatted_json["job_id"] == "job_obs_002"
    assert formatted_json["resource_id"] == "ds_himansh_003"
    assert formatted_json["user_id"] == "usr_scientist_004"
    assert "SuperSecretPassword123!" not in formatted_json["message"]
    assert "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9" not in formatted_json["message"]
    assert "[REDACTED]" in formatted_json["message"]

    # 2. Verify dictionary & nested structure redaction
    raw_nested = {
        "user": "scientist@ncpor.res.in",
        "password": "my_raw_password",
        "GEMINI_API_KEY": "AIzaSySecretKey999999999999999999",
        "nested": {
            "authorization": "Bearer secret_jwt_token_value",
            "mongo": "mongodb+srv://admin:Pass1234@cluster0.mongodb.net/vistaar",
        },
    }
    scrubbed = redact_sensitive_data(raw_nested)
    assert scrubbed["password"] == "[REDACTED]"
    assert scrubbed["GEMINI_API_KEY"] == "[REDACTED]"
    assert scrubbed["nested"]["authorization"] == "[REDACTED]"
    assert "Pass1234" not in scrubbed["nested"]["mongo"]

    # 3. Verify /health/ready exposes database, worker, redis, and storage health
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        ready_res = await ac.get("/health/ready", headers={"X-Request-ID": "req_ready_check_28"})
        assert ready_res.status_code == 200
        assert ready_res.headers.get("X-Request-ID") == "req_ready_check_28"
        ready_body = ready_res.json()
        checks = ready_body["checks"]
        assert checks["database"]["healthy"] is True
        assert checks["worker"]["healthy"] is True
        assert checks["redis"]["healthy"] is True
        assert checks["storage"]["healthy"] is True

        # Trigger a search and translation so latency/failure metrics record live samples
        await ac.get("/api/v1/search?q=Maitri")
        trans_res = await ac.post(
            "/api/v1/localization/translate",
            json={"text": "Maitri Research Station in Antarctica", "source_language": "en", "target_language": "hi"},
        )
        assert trans_res.status_code == 200

        # 4. Verify all 10 required Prompt 28 observability metrics on /health/metrics
        metrics_res = await ac.get("/api/v1/health/metrics")
        assert metrics_res.status_code == 200
        m_body = metrics_res.json()
        obs = m_body["observability_metrics"]

        required_10_metrics = [
            "request_latency",
            "error_rate",
            "db_latency_ms",
            "queue_depth",
            "worker_utilization",
            "job_failures",
            "ai_latency_and_failures",
            "translation_failures",
            "storage_usage",
            "search_latency_ms",
        ]
        for key in required_10_metrics:
            assert key in obs, f"Missing required Prompt 28 metric: {key}"

        assert obs["request_latency"]["count"] >= 1
        assert "error_rate_pct" in obs["error_rate"]
        assert obs["db_latency_ms"]["current_ping_ms"] >= 0
        assert "worker_utilization_pct" in obs["worker_utilization"]
        assert obs["translation_failures"]["total_requests"] >= 1
        assert obs["search_latency_ms"]["count"] >= 1

        # 5. Verify production-safe error response (never expose stack traces publicly)
        not_found_res = await ac.get("/api/v1/datasets/non_existent_dataset_99999")
        assert not_found_res.status_code == 404
        assert "Traceback" not in not_found_res.text
        assert "File \"" not in not_found_res.text


@pytest.mark.asyncio
async def test_prompt_29_backup_disaster_recovery_and_provenance_restore():
    """
    Prompt 29 Verification:
    - Honest environment-based RPO/RTO profile (unsupported_guarantees_claimed is False)
    - Sanitized configuration backup (no raw passwords or API keys)
    - Snapshot creation (.json.gz + SHA-256 manifest + storage mirror)
    - Provenance-intact restore of published scientific content
    - Verification of docs/disaster-recovery.md operational checklists
    """
    from pathlib import Path
    from apps.api.core.backup import (
        build_sanitized_config_snapshot,
        create_backup_snapshot,
        get_actual_rpo_rto_profile,
        restore_published_content_with_provenance,
        verify_provenance_integrity,
    )
    from apps.api.core.database import get_database

    # 1. Verify honest RPO/RTO profile without unsupported guarantees
    rpo_rto = get_actual_rpo_rto_profile()
    assert rpo_rto["unsupported_guarantees_claimed"] is False
    assert "mongodb_database" in rpo_rto["components"]
    assert "object_and_media_storage" in rpo_rto["components"]
    assert "configuration_and_governance" in rpo_rto["components"]
    assert "audit_trail_retention" in rpo_rto["components"]

    # 2. Verify sanitized configuration backup never leaks secrets
    cfg_snap = build_sanitized_config_snapshot({"strict_claim_verification": True, "secret_api_key": "DO_NOT_LEAK"})
    assert cfg_snap["RUNTIME_ADMIN_CONFIG"]["secret_api_key"] == "[REDACTED]"
    assert "JWT_SECRET_KEY" not in cfg_snap

    # 3. Create a DR snapshot and verify provenance-intact restore
    snap_meta = await create_backup_snapshot(label="pytest_dr_29", include_storage_copy=False)
    assert snap_meta["snapshot_id"].startswith("snap_")
    assert len(snap_meta["payload_sha256"]) == 64
    assert Path(snap_meta["archive_path"]).exists()

    # Simulate accidental corruption of a published article's title in MongoDB and restore from snapshot
    db = get_database()
    sample_pub = await db.publications.find_one({"status": "PUBLISHED"}, {"_id": 0})
    if sample_pub:
        id_field = "publication_id" if "publication_id" in sample_pub else "id"
        pub_id = sample_pub[id_field]
        original_title = sample_pub["title"]
        await db.publications.update_one({id_field: pub_id}, {"$set": {"title": "CORRUPTED_DURING_OUTAGE"}})

        restore_res = await restore_published_content_with_provenance(
            snapshot_id=snap_meta["snapshot_id"],
            publication_id=pub_id,
            restore_storage_files=False,
        )
        assert restore_res["status"] == "restored"
        assert restore_res["checksum_verified"] is True
        assert restore_res["provenance_verification"]["all_provenance_intact"] is True

        restored_pub = await db.publications.find_one({id_field: pub_id}, {"_id": 0})
        assert restored_pub["title"] == original_title
        assert restored_pub.get("evidence_links") == sample_pub.get("evidence_links")

    # 4. Verify docs/disaster-recovery.md contains all required Prompt 29 sections & checklists
    dr_doc = Path("docs/disaster-recovery.md").read_text(encoding="utf-8")
    for required_heading in [
        "RPO & RTO",
        "MongoDB Backup",
        "Object-Storage & Media Backup",
        "Configuration Backup",
        "Audit Retention",
        "Database Restore",
        "Media & Object-Storage Restore",
        "Deployment Rollback",
        "Operational Recovery Checklists",
    ]:
        assert required_heading in dr_doc, f"Missing section in docs/disaster-recovery.md: {required_heading}"


