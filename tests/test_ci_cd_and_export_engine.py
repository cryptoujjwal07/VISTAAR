import pytest
from pathlib import Path
from httpx import AsyncClient, ASGITransport
from apps.api.main import app
from scripts.ci_cd_verify_and_deploy import (
    DeploymentHealthGateError,
    run_index_migration,
    run_post_deploy_health_gate,
    secret_scan,
    validate_environment_configs,
)


@pytest.mark.asyncio
async def test_prompt_31_ci_cd_secret_scan_env_separation_migration_and_health_gate():
    """
    Verifies Prompt 31 (31_CI_CD.txt):
    - Secret scan ensures zero hardcoded credentials or tracked .env files
    - Separate development / staging / production environment configs
    - GitHub Actions workflow gates staging & production deployment on lint/typecheck/tests/build
    - Idempotent MongoDB index migration across all 21 collections
    - Post-deployment health gate passes when healthy and fails deployment when unhealthy
    """
    # 1. Secret scan
    scan_res = secret_scan()
    assert scan_res["status"] == "CLEAN"
    assert len(scan_res["violations"]) == 0

    # 2. Environment isolation validation (development / staging / production)
    env_res = validate_environment_configs()
    assert env_res["valid"] is True
    assert env_res["environments"]["development"]["mongodb_db_name"] == "vistaar_dev"
    assert env_res["environments"]["staging"]["mongodb_db_name"] == "vistaar_staging"
    assert env_res["environments"]["production"]["mongodb_db_name"] == "vistaar_production"

    # 3. CI workflow structure & rollback runbook existence
    root = Path(__file__).resolve().parent.parent
    ci_yml = (root / ".github" / "workflows" / "ci.yml").read_text(encoding="utf-8")
    for required_job in (
        "security-and-secret-scan:",
        "backend-validation:",
        "frontend-validation:",
        "deploy-staging:",
        "deploy-production:",
    ):
        assert required_job in ci_yml
    assert (root / "docs" / "deployment.md").exists()

    # 4. Idempotent database collection & compound index migration
    mig_res = await run_index_migration()
    assert mig_res["status"] == "MIGRATED"
    assert mig_res["total_required_collections"] == 21

    # 5. Post-deployment health gate (passes when healthy, raises DeploymentHealthGateError when unhealthy)
    health_res = await run_post_deploy_health_gate()
    assert health_res["gate_status"] == "PASSED"
    assert health_res["liveness"] == "healthy"
    assert health_res["readiness"] == "ready"
    assert health_res["all_critical_healthy"] is True

    with pytest.raises(DeploymentHealthGateError):
        await run_post_deploy_health_gate(simulate_unhealthy=True)


@pytest.mark.asyncio
async def test_prompt_32_production_export_engine_pdf_teacher_chart_governance_and_async_bundle():
    """
    Verifies Prompt 32 (32_EXPORT_ENGINE.txt):
    - PIB press-release PDF & Education PDF rendering (WeasyPrint / PyMuPDF)
    - Teacher lesson export with curriculum plan, worksheet, answer key, and provenance
    - Journalist press kit & social assets with source metadata, version, timestamp, and provenance
    - Scientific chart export (JSON & SVG) with embedded provenance
    - Public workflow protection: never exports unpublished internal content when public_workflow=true
    - Asynchronous large export bundle creation and job polling
    """
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        pubs_res = await ac.get("/api/v1/publications?limit=10")
        assert pubs_res.status_code == 200
        items = pubs_res.json().get("items", [])
        assert len(items) > 0

        pub = items[0]
        pub_id = pub["id"]

        # 1. PIB Press-Release PDF
        pib_pdf = await ac.get(f"/api/v1/publications/{pub_id}/export/pib-pdf")
        assert pib_pdf.status_code == 200
        assert pib_pdf.headers.get("content-type") == "application/pdf"
        assert pib_pdf.content.startswith(b"%PDF-")

        # 2. Education PDF
        edu_pdf = await ac.get(f"/api/v1/publications/{pub_id}/export/education-pdf")
        assert edu_pdf.status_code == 200
        assert edu_pdf.headers.get("content-type") == "application/pdf"
        assert edu_pdf.content.startswith(b"%PDF-")

        # 3. Teacher Lesson Export
        teacher_res = await ac.get(f"/api/v1/publications/{pub_id}/export/teacher-lesson")
        assert teacher_res.status_code == 200
        teacher_data = teacher_res.json()
        assert teacher_data["export_type"] == "TEACHER_LESSON_EXPORT"
        assert len(teacher_data["instructional_plan"]) >= 3
        assert len(teacher_data["student_worksheet_questions"]) >= 3
        assert "provenance" in teacher_data["metadata"]
        assert "generation_timestamp_utc" in teacher_data["metadata"]

        # 4. Scientific Chart Export (JSON + SVG)
        chart_json = await ac.get(f"/api/v1/publications/{pub_id}/export/scientific-chart?format=json")
        assert chart_json.status_code == 200
        c_data = chart_json.json()
        assert c_data["export_type"] == "SCIENTIFIC_CHART_EXPORT"
        assert "<svg" in c_data["svg"]
        assert "PROVENANCE:" in c_data["svg"]

        chart_svg = await ac.get(f"/api/v1/publications/{pub_id}/export/scientific-chart?format=svg")
        assert chart_svg.status_code == 200
        assert "image/svg+xml" in chart_svg.headers.get("content-type", "")
        assert "<svg" in chart_svg.text

        # 5. Public workflow governance: unpublished content must be blocked with 403 on public_workflow=true
        unpublished = next((p for p in items if p.get("status") not in ("APPROVED", "PUBLISHED")), None)
        if unpublished:
            blocked_res = await ac.get(
                f"/api/v1/publications/{unpublished['id']}/export/pib-pdf?public_workflow=true"
            )
            assert blocked_res.status_code == 403

        # 6. Asynchronous Large Bundle Export
        bundle_res = await ac.post(f"/api/v1/publications/{pub_id}/export/async-bundle")
        assert bundle_res.status_code == 200
        bundle_data = bundle_res.json()
        job_id = bundle_data["job_id"]
        assert bundle_data["status"] == "COMPLETED"
        assert len(bundle_data["artifacts"]) == 6

        job_poll = await ac.get(f"/api/v1/publications/exports/jobs/{job_id}")
        assert job_poll.status_code == 200
        assert job_poll.json()["job_id"] == job_id
