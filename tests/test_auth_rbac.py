import pytest
import uuid
from httpx import AsyncClient, ASGITransport
from apps.api.main import app
from apps.api.core.config import settings
from apps.api.core.database import get_database
from apps.api.core.security import login_rate_limiter

@pytest.mark.asyncio
async def test_auth_login_and_tokens():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # Reset rate limiter for test
        login_rate_limiter.clear(settings.SUPER_ADMIN_EMAIL.lower())

        # Valid login
        resp = await client.post("/api/v1/auth/login", json={
            "email": settings.SUPER_ADMIN_EMAIL,
            "password": settings.SUPER_ADMIN_PASSWORD
        })
        assert resp.status_code == 200, resp.text
        data = resp.json()
        assert "access_token" in data
        assert "refresh_token" in data
        assert data["user"]["role"] == "SUPER_ADMIN"
        assert "*" in data["user"]["permissions"]

        token = data["access_token"]
        refresh_token = data["refresh_token"]

        # Test /auth/me with valid token
        me_resp = await client.get("/api/v1/auth/me", headers={"Authorization": f"Bearer {token}"})
        assert me_resp.status_code == 200
        assert me_resp.json()["email"] == settings.SUPER_ADMIN_EMAIL.lower()

        # Test /auth/refresh
        ref_resp = await client.post("/api/v1/auth/refresh", json={"refresh_token": refresh_token})
        assert ref_resp.status_code == 200
        new_tokens = ref_resp.json()
        assert "access_token" in new_tokens
        assert new_tokens["access_token"] != token

        # Test logout and token invalidation
        logout_resp = await client.post("/api/v1/auth/logout", headers={"Authorization": f"Bearer {token}"})
        assert logout_resp.status_code == 200

        # Now the old access token must be revoked!
        revoked_check = await client.get("/api/v1/auth/me", headers={"Authorization": f"Bearer {token}"})
        assert revoked_check.status_code == 401

@pytest.mark.asyncio
async def test_login_rate_limiter():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        test_email = "brute_force_tester@vistaar.ncpor.res.in"
        login_rate_limiter.clear(test_email)

        # Trigger 5 failed attempts
        for _ in range(5):
            fail_resp = await client.post("/api/v1/auth/login", json={
                "email": test_email,
                "password": "WrongPassword123!"
            })
            assert fail_resp.status_code == 401

        # 6th attempt should be blocked by rate limiter (HTTP 429)
        locked_resp = await client.post("/api/v1/auth/login", json={
            "email": test_email,
            "password": "WrongPassword123!"
        })
        assert locked_resp.status_code == 429
        assert "Rate limit exceeded" in locked_resp.json()["detail"]

        login_rate_limiter.clear(test_email)

@pytest.mark.asyncio
async def test_vertical_privilege_escalation_prevention():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # Attacker tries to register directly as SUPER_ADMIN
        hacker_resp = await client.post("/api/v1/auth/register", json={
            "email": "intruder@domain.com",
            "password": "HackerPassword@123",
            "name": "Intruder",
            "role": "SUPER_ADMIN"
        })
        assert hacker_resp.status_code == 403
        assert "Privilege Escalation Protection" in hacker_resp.json()["detail"]

        # Valid registration as PUBLIC_USER with SCIENTIST persona
        rnd_student = f"student_{uuid.uuid4().hex[:6]}@school.edu"
        reg_resp = await client.post("/api/v1/auth/register", json={
            "email": rnd_student,
            "password": "SecurePassword@123",
            "name": "Arjun Sharma",
            "role": "PUBLIC_USER",
            "persona": "SCIENTIST"
        })
        assert reg_resp.status_code == 200
        user_data = reg_resp.json()["user"]
        assert user_data["role"] == "PUBLIC_USER"
        assert user_data["persona"] == "SCIENTIST"
        # Persona does NOT grant administrative permissions
        assert "*" not in user_data["permissions"]
        assert "content:publish" not in user_data["permissions"]

@pytest.mark.asyncio
async def test_rbac_and_idor_protection():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # 1. Register Scientist A
        rnd_a = f"scientist_a_{uuid.uuid4().hex[:6]}@ncpor.res.in"
        res_a = await client.post("/api/v1/auth/register", json={
            "email": rnd_a,
            "password": "PolarPassword@2026",
            "name": "Dr. A. Sen",
            "role": "FIELD_SCIENTIST"
        })
        assert res_a.status_code == 200
        token_a = res_a.json()["access_token"]
        headers_a = {"Authorization": f"Bearer {token_a}"}

        # 2. Register Scientist B
        rnd_b = f"scientist_b_{uuid.uuid4().hex[:6]}@ncpor.res.in"
        res_b = await client.post("/api/v1/auth/register", json={
            "email": rnd_b,
            "password": "PolarPassword@2026",
            "name": "Dr. B. Verma",
            "role": "FIELD_SCIENTIST"
        })
        assert res_b.status_code == 200
        token_b = res_b.json()["access_token"]
        headers_b = {"Authorization": f"Bearer {token_b}"}

        # 3. Scientist A creates a draft submission
        sub_create = await client.post("/api/v1/auth/submissions", json={
            "title": "Maitri Ionospheric Telemetry Observation Notes",
            "station_id": "maitri",
            "category": "FIELD_OBSERVATION",
            "summary": "Observation of riometer absorption anomalies during solar flare."
        }, headers=headers_a)
        assert sub_create.status_code == 200
        sub_id = sub_create.json()["submission_id"]

        # 4. Scientist A can access own submission
        own_view = await client.get(f"/api/v1/auth/submissions/{sub_id}", headers=headers_a)
        assert own_view.status_code == 200
        assert own_view.json()["title"] == "Maitri Ionospheric Telemetry Observation Notes"

        # 5. Scientist B attempts to access Scientist A's submission -> IDOR BLOCKED (403)
        idor_attempt = await client.get(f"/api/v1/auth/submissions/{sub_id}", headers=headers_b)
        assert idor_attempt.status_code == 403
        assert "IDOR Protection" in idor_attempt.json()["detail"]

        # 6. Scientist A attempts to access Super Admin Audit logs -> RBAC BLOCKED (403)
        audit_forbidden = await client.get("/api/v1/audit", headers=headers_a)
        assert audit_forbidden.status_code == 403

        # 7. Scientist A attempts unauthorized publishing transition -> RBAC BLOCKED (403)
        publish_forbidden = await client.post(
            "/api/v1/publications/pub_test_dummy/transition",
            json={"new_status": "PUBLISHED"},
            headers=headers_a
        )
        assert publish_forbidden.status_code == 403

@pytest.mark.asyncio
async def test_admin_user_governance_and_audit():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # Admin login
        admin_login = await client.post("/api/v1/auth/login", json={
            "email": settings.SUPER_ADMIN_EMAIL,
            "password": settings.SUPER_ADMIN_PASSWORD
        })
        admin_token = admin_login.json()["access_token"]
        admin_headers = {"Authorization": f"Bearer {admin_token}"}

        # 1. Admin lists users
        users_resp = await client.get("/api/v1/auth/users", headers=admin_headers)
        assert users_resp.status_code == 200
        items = users_resp.json()["items"]
        assert len(items) > 0

        # Find target user to update role
        target = items[0]
        target_id = target["id"]

        # 2. Admin modifies role
        if target["email"] != settings.SUPER_ADMIN_EMAIL.lower():
            role_resp = await client.patch(
                f"/api/v1/auth/users/{target_id}/role",
                json={"role": "OUTREACH_EDITOR", "reason": "Assigned editor privileges"},
                headers=admin_headers
            )
            assert role_resp.status_code == 200
            assert role_resp.json()["current_role"] == "OUTREACH_EDITOR"

            # 3. Verify audit log captures ROLE_CHANGED
            audit_resp = await client.get("/api/v1/audit?action=ROLE_CHANGED", headers=admin_headers)
            assert audit_resp.status_code == 200
            assert audit_resp.json()["total"] > 0
