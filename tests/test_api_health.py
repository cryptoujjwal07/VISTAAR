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
