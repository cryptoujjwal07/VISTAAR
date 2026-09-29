import pytest
import uuid
from httpx import AsyncClient, ASGITransport
from apps.api.main import app
from apps.api.core.config import settings

@pytest.mark.asyncio
async def test_audit_trail_and_immutability():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # Admin login
        admin_login = await client.post("/api/v1/auth/login", json={
            "email": settings.SUPER_ADMIN_EMAIL,
            "password": settings.SUPER_ADMIN_PASSWORD
        })
        token = admin_login.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}

        # 1. Query audit trail (Prompt 08 fields check)
        audit_res = await client.get("/api/v1/audit?limit=10", headers=headers)
        assert audit_res.status_code == 200
        data = audit_res.json()
        assert "items" in data
        assert "immutability" in data
        assert len(data["items"]) > 0

        first_event = data["items"][0]
        # Verify all mandatory Prompt 08 fields exist
        assert "event_id" in first_event
        assert "actor_id" in first_event
        assert "action" in first_event
        assert "resource_type" in first_event
        assert "resource_id" in first_event
        assert "timestamp" in first_event

        # 2. Append-Only Tamper Guards: Prohibit deletion and modification
        del_res = await client.delete("/api/v1/audit", headers=headers)
        assert del_res.status_code == 405
        assert "Append-Only Protection" in del_res.json()["detail"]

        del_one_res = await client.delete("/api/v1/audit/aud_test123", headers=headers)
        assert del_one_res.status_code == 405

        put_res = await client.put("/api/v1/audit/aud_test123", json={"action": "TAMPERED"}, headers=headers)
        assert put_res.status_code == 405
        assert "Immutability Protection" in put_res.json()["detail"]

        # 3. Audit Export Engine (JSON & CSV)
        json_export = await client.get("/api/v1/audit/export?format=json", headers=headers)
        assert json_export.status_code == 200
        assert "records" in json_export.json()

        csv_export = await client.get("/api/v1/audit/export?format=csv", headers=headers)
        assert csv_export.status_code == 200
        assert "text/csv" in csv_export.headers.get("content-type", "")
        assert "event_id,timestamp,actor_id" in csv_export.text

@pytest.mark.asyncio
async def test_publication_versioning_and_immutable_approved_snapshot():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # Editor login
        editor_login = await client.post("/api/v1/auth/login", json={
            "email": "editor@vistaar.ncpor.res.in",
            "password": "Editor@Vistaar2026!"
        })
        token = editor_login.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}

        # 1. Generate new outreach publication draft
        gen_res = await client.post("/api/v1/ai/generate-outreach", json={"station_id": "himansh"}, headers=headers)
        assert gen_res.status_code == 200
        pub = gen_res.json()
        pub_id = pub["id"]
        initial_version = pub.get("version", 1)

        # 2. Update a track -> Creates new revision v2
        edit_res = await client.put(f"/api/v1/publications/{pub_id}/tracks", json={
            "track": "PIB",
            "title": "Glaciological Telemetry Observation v2 Bulletin",
            "summary": "Updated summary of mass balance telemetry observations.",
            "body": "Detailed report from the Chandra Basin in Lahaul-Spiti."
        }, headers=headers)
        assert edit_res.status_code == 200
        v2_data = edit_res.json()
        assert v2_data["version"] == initial_version + 1
        assert "revision_id" in v2_data

        # 3. Verify revisions endpoint returns revision history
        revs_res = await client.get(f"/api/v1/publications/{pub_id}/revisions", headers=headers)
        assert revs_res.status_code == 200
        revs_data = revs_res.json()
        assert revs_data["current_version"] == initial_version + 1
        assert len(revs_data["revisions"]) > 0

        # 4. Transition: NEEDS_REVIEW -> REVIEWED -> APPROVED (v2 locked)
        await client.post(f"/api/v1/publications/{pub_id}/transition", json={
            "new_status": "NEEDS_REVIEW", "reason": "Draft ready for editorial check"
        }, headers=headers)

        await client.post(f"/api/v1/publications/{pub_id}/transition", json={
            "new_status": "REVIEWED", "reason": "Scientific review confirmed"
        }, headers=headers)

        approve_res = await client.post(f"/api/v1/publications/{pub_id}/transition", json={
            "new_status": "APPROVED", "reason": "Editorial board approval"
        }, headers=headers)
        assert approve_res.status_code == 200
        assert approve_res.json()["approved_version"] == initial_version + 1

        # 5. Publish publication
        publish_res = await client.post(f"/api/v1/publications/{pub_id}/transition", json={
            "new_status": "PUBLISHED", "reason": "Official public release"
        }, headers=headers)
        assert publish_res.status_code == 200

        # 6. Silent Overwrite Prevention:
        # Editor edits a new draft revision (v3) while v2 is published
        await client.put(f"/api/v1/publications/{pub_id}/tracks", json={
            "track": "PIB",
            "title": "UNAPPROVED DRAFT TITLE v3 SHOULD NOT LEAK TO PUBLIC",
            "summary": "Work in progress draft.",
            "body": "Incomplete unverified text."
        }, headers=headers)

        # 7. Check public portal endpoint: MUST STILL SERVE IMMUTABLE APPROVED v2!
        public_list = await client.get("/api/v1/publications/published")
        assert public_list.status_code == 200
        pub_item = next((p for p in public_list.json() if p["id"] == pub_id), None)
        assert pub_item is not None
        assert pub_item["version"] == initial_version + 1
        assert pub_item["pib"]["title"] == "Glaciological Telemetry Observation v2 Bulletin"
        assert "UNAPPROVED DRAFT TITLE" not in pub_item["pib"]["title"]

        # 8. Check resource audit history endpoint
        hist_res = await client.get(f"/api/v1/audit/resource/PUBLICATION/{pub_id}", headers=headers)
        assert hist_res.status_code == 200
        hist_data = hist_res.json()
        assert hist_data["event_count"] >= 4

@pytest.mark.asyncio
async def test_dataset_metadata_versioning():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # Scientist login
        sci_login = await client.post("/api/v1/auth/login", json={
            "email": "scientist@vistaar.ncpor.res.in",
            "password": "Scientist@Vistaar2026!"
        })
        token = sci_login.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}

        # List any dataset to target
        datasets_res = await client.get("/api/v1/datasets?limit=1")
        assert datasets_res.status_code == 200
        d_items = datasets_res.json()["items"]
        if d_items:
            target_ds = d_items[0]["dataset_id"]

            # Update metadata
            update_res = await client.patch(f"/api/v1/datasets/{target_ds}/metadata", json={
                "description": "Updated meteorological metadata documentation with WMO-No. 8 calibration notes.",
                "citation": "NCPOR Cryospheric Field Observatories Technical Bulletin 2026.",
                "reason": "Calibration update"
            }, headers=headers)
            assert update_res.status_code == 200
            up_data = update_res.json()
            assert up_data["version"] > up_data["previous_version"]

            # Get metadata revisions
            revs_res = await client.get(f"/api/v1/datasets/{target_ds}/revisions", headers=headers)
            assert revs_res.status_code == 200
            assert len(revs_res.json()["revisions"]) > 0


@pytest.mark.asyncio
async def test_prompt_24_publishing_governance_lifecycle():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        editor_login = await client.post("/api/v1/auth/login", json={
            "email": "editor@vistaar.ncpor.res.in",
            "password": "Editor@Vistaar2026!"
        })
        token = editor_login.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}

        # 1. Generate AI outreach draft -> starts in AI_GENERATED or DRAFT
        gen_res = await client.post("/api/v1/ai/generate-outreach", json={"station_id": "maitri"}, headers=headers)
        assert gen_res.status_code == 200
        pub_id = gen_res.json()["id"]

        # 2. Enforce at API layer: AI cannot directly publish (AI_GENERATED/DRAFT -> PUBLISHED must fail 400)
        illegal_pub = await client.post(
            f"/api/v1/publications/{pub_id}/transition",
            json={"new_status": "PUBLISHED", "reason": "Bypassing approval"},
            headers=headers,
        )
        assert illegal_pub.status_code == 400

        # 3. Reject to DRAFT -> then transition DRAFT -> AI_GENERATED -> NEEDS_REVIEW -> REVIEWED -> APPROVED -> PUBLISHED
        rej_res = await client.post(
            f"/api/v1/publications/{pub_id}/reject",
            json={"reason": "Initial draft rejected for calibration check"},
            headers=headers,
        )
        assert rej_res.status_code == 200
        assert rej_res.json()["current_status"] == "DRAFT"

        ai_gen_res = await client.post(
            f"/api/v1/publications/{pub_id}/transition",
            json={"new_status": "AI_GENERATED", "reason": "AI synthesis pass completed"},
            headers=headers,
        )
        assert ai_gen_res.status_code == 200
        assert ai_gen_res.json()["current_status"] == "AI_GENERATED"

        rev_req = await client.post(
            f"/api/v1/publications/{pub_id}/request-revision",
            json={"reason": "Submit for scientific review"},
            headers=headers,
        )
        assert rev_req.status_code == 200
        assert rev_req.json()["current_status"] == "NEEDS_REVIEW"

        reviewed_res = await client.post(
            f"/api/v1/publications/{pub_id}/transition",
            json={"new_status": "REVIEWED", "reason": "Verified against Maitri AWS telemetry"},
            headers=headers,
        )
        assert reviewed_res.status_code == 200
        assert reviewed_res.json()["current_status"] == "REVIEWED"

        approved_res = await client.post(
            f"/api/v1/publications/{pub_id}/transition",
            json={"new_status": "APPROVED", "reason": "Approved by NCPOR Editorial Board"},
            headers=headers,
        )
        assert approved_res.status_code == 200
        assert approved_res.json()["current_status"] == "APPROVED"
        assert approved_res.json()["approved_version"] is not None

        published_res = await client.post(
            f"/api/v1/publications/{pub_id}/transition",
            json={"new_status": "PUBLISHED", "reason": "Published to public portal"},
            headers=headers,
        )
        assert published_res.status_code == 200
        assert published_res.json()["current_status"] == "PUBLISHED"
        assert published_res.json()["published_version"] == approved_res.json()["approved_version"]

        # 4. Unpublish -> removes from public feed and returns to APPROVED
        unpub_res = await client.post(
            f"/api/v1/publications/{pub_id}/unpublish",
            json={"reason": "Temporarily unpublished for embargoes check"},
            headers=headers,
        )
        assert unpub_res.status_code == 200
        assert unpub_res.json()["current_status"] == "APPROVED"

        pub_feed = await client.get("/api/v1/publications/published")
        assert all(item["id"] != pub_id for item in pub_feed.json())

        # 5. Archive -> transitions to ARCHIVED
        arch_res = await client.post(
            f"/api/v1/publications/{pub_id}/archive",
            json={"reason": "Season concluded; moved to permanent archive"},
            headers=headers,
        )
        assert arch_res.status_code == 200
        assert arch_res.json()["current_status"] == "ARCHIVED"

        # 6. Verify every transition created an audit event
        hist_res = await client.get(f"/api/v1/audit/resource/PUBLICATION/{pub_id}", headers=headers)
        assert hist_res.status_code == 200
        assert hist_res.json()["event_count"] >= 7

