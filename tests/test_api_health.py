import pytest
from httpx import AsyncClient, ASGITransport
from apps.api.main import app

@pytest.mark.asyncio
async def test_health_endpoints():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        # Test liveness probe
        res = await ac.get("/health")
        assert res.status_code == 200
        data = res.json()
        assert data["status"] == "healthy"
        assert data["service"] == "vistaar-api"

        # Test readiness probe
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

        # Query Himansh time series
        ts_res = await ac.get("/api/v1/weather/timeseries?station_id=himansh")
        assert ts_res.status_code == 200
        ts_data = ts_res.json()
        assert ts_data["station_id"] == "himansh"
        assert len(ts_data["points"]) > 0
        assert ts_data["statistics"]["count"] > 0
