import pytest
from httpx import AsyncClient, ASGITransport
from apps.api.main import app


@pytest.mark.asyncio
async def test_station_explorer_and_weather_intelligence():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        res = await client.get("/api/v1/weather/stations/maitri/explorer")
        assert res.status_code == 200
        data = res.json()
        assert data["station"]["id"] == "maitri"
        assert "expeditions" in data
        assert "datasets" in data
        assert len(data["expeditions"]) >= 1

        # Weather timeseries with missing data integrity
        tel = await client.get("/api/v1/weather/timeseries?station_id=maitri&limit=24")
        assert tel.status_code == 200
        tel_data = tel.json()
        assert tel_data["station_id"] == "maitri"
        assert "statistics" in tel_data
        assert "missing_count" in tel_data["statistics"]
        assert "source_citation" in tel_data


@pytest.mark.asyncio
async def test_classroom_and_printable_teacher_export():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        res = await client.get("/api/v1/classroom/lessons")
        assert res.status_code == 200
        lessons = res.json()
        assert isinstance(lessons, list)
        assert len(lessons) >= 4
        assert "key_terms" in lessons[0]
        assert "sources" in lessons[0]

        lesson_id = lessons[0]["id"]
        exp = await client.get(f"/api/v1/classroom/lessons/{lesson_id}/export")
        assert exp.status_code == 200
        assert "text/html" in exp.headers["content-type"]
        assert "NCPOR" in exp.text


@pytest.mark.asyncio
async def test_media_library_and_press_kit_builder():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        assets = await client.get("/api/v1/media/assets")
        assert assets.status_code == 200
        items = assets.json()
        assert isinstance(items, list)
        # Restricted assets must be hidden from public requests by default
        assert all(not a.get("restricted", False) for a in items)

        kit_json = await client.get("/api/v1/media/press-kit?station_id=maitri")
        assert kit_json.status_code == 200
        assert "verified_statistics" in kit_json.json()

        pk = await client.get("/api/v1/media/press-kit/download?station_id=maitri")
        assert pk.status_code == 200
        assert "Accredited Journalist Press Kit" in pk.text


@pytest.mark.asyncio
async def test_unified_search_autocomplete_and_rag():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        s_res = await client.get("/api/v1/search?q=Maitri")
        assert s_res.status_code == 200
        s_data = s_res.json()
        assert s_data["total_matches"] >= 1
        assert "facets" in s_data

        auto = await client.get("/api/v1/search/autocomplete?q=mait")
        assert auto.status_code == 200
        assert len(auto.json()["suggestions"]) >= 1

        rag = await client.post("/api/v1/search/rag", json={"query": "Maitri temperature", "top_k": 3})
        assert rag.status_code == 200
        rag_data = rag.json()
        assert "answer" in rag_data
        assert "citations" in rag_data


@pytest.mark.asyncio
async def test_security_headers_and_observability_metrics():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        health = await client.get("/health")
        assert health.status_code == 200
        assert health.headers.get("X-Content-Type-Options") == "nosniff"
        assert health.headers.get("X-Frame-Options") == "DENY"

        metrics = await client.get("/health/metrics")
        assert metrics.status_code == 200
        m_data = metrics.json()
        assert "collections" in m_data
        assert "counts" in m_data
        assert "ai_telemetry" in m_data
        assert "storage" in m_data
