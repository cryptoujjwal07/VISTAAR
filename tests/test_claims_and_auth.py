import pytest
from httpx import AsyncClient, ASGITransport
from apps.api.main import app
from apps.api.core.config import settings

@pytest.mark.asyncio
async def test_auth_workflow():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        # Test login with seed admin
        res = await ac.post("/api/v1/auth/login", json={
            "email": settings.SUPER_ADMIN_EMAIL,
            "password": settings.SUPER_ADMIN_PASSWORD
        })
        assert res.status_code == 200
        token_data = res.json()
        assert "access_token" in token_data
        assert token_data["user"]["role"] == "SUPER_ADMIN"
        
        token = token_data["access_token"]
        headers = {"Authorization": f"Bearer {token}"}
        
        # Test me endpoint
        me_res = await ac.get("/api/v1/auth/me", headers=headers)
        assert me_res.status_code == 200
        assert me_res.json()["email"] == settings.SUPER_ADMIN_EMAIL

@pytest.mark.asyncio
async def test_deterministic_claim_verification():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        # Claim with real Himansh dataset
        verify_req = {
            "claim_text": "Himansh station recorded an observed air temperature of 4.086 °C.",
            "metric": "airtemp_avg",
            "value": 4.086,
            "unit": "°C",
            "location": "Himansh",
            "source_type": "DATASET",
            "source_id": "ds_himansh_aws",
            "field": "airtemp_avg"
        }
        res = await ac.post("/api/v1/claims/verify", json=verify_req)
        assert res.status_code == 200
        data = res.json()
        assert data["status"] in ["VERIFIED", "NEEDS_REVIEW"]
        assert "evidence" in data
        assert "record_id" in data["evidence"]
