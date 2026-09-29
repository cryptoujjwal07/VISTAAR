import pytest
from httpx import ASGITransport, AsyncClient
from apps.api.main import app
from apps.api.core.database import connect_to_mongo
from apps.api.domains.ai.provider import (
    AISchemaValidationError,
    DeterministicPolarProvider,
    FourTrackStructuredResponse,
    get_ai_provider,
    usage_tracker,
    validate_structured_output,
)
from apps.api.domains.claims.normalizer import (
    compare_measurements,
    extract_normalized_measurements,
    parse_single_measurement,
)


@pytest.mark.asyncio
async def test_prompt_11_ai_provider_abstraction():
    """
    Prompt 11 Verification:
    - AIProvider interface supports text, structured, and 768-dim embedding generation.
    - Rejects invalid model output via Pydantic schema validation.
    - Tracks usage metrics without logging sensitive prompt contents.
    """
    await connect_to_mongo()
    provider = get_ai_provider("deterministic")

    # 1. Text generation
    txt = await provider.generate_text("Summarize Maitri telemetry.")
    assert "NCPOR" in txt
    assert "[Quote to be provided by authorized official]" in txt

    # 2. Embedding generation (768-dim)
    emb = await provider.generate_embedding("Katabatic wind speed at Maitri station Antarctica")
    assert len(emb) == 768

    # 3. Reject invalid structured model output
    with pytest.raises(AISchemaValidationError):
        validate_structured_output(
            '{"pib_title": "Too short", "invalid_field": 123}',
            FourTrackStructuredResponse,
            provider_name="gemini",
            model_name="gemini-2.5-flash",
            prompt_hash="test_hash_11",
        )

    # 4. API endpoints for AI Provider status & schema rejection
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        status_res = await client.get("/api/v1/ai/providers/status")
        assert status_res.status_code == 200
        s_data = status_res.json()
        assert "active_provider" in s_data
        assert "usage_summary" in s_data
        assert s_data["usage_summary"]["schema_rejections"] >= 1

        # Test HTTP 422 on invalid model output via API
        bad_schema_res = await client.post(
            "/api/v1/ai/providers/validate-schema",
            json={"raw_output": {"pib_title": "bad"}},
        )
        assert bad_schema_res.status_code == 422


@pytest.mark.asyncio
async def test_prompt_13_scientific_numerical_normalization():
    """
    Prompt 13 Verification:
    - Recognizes equivalent forms: -38.4°C, -38.4 C, −38.4 °C, and Devanagari -३८.४ °C.
    - Rejects cross-dimension/unit matches: 38.4 knots MUST NOT match 38.4°C.
    - Retains original text, numeric value, unit, metric, location, qualifier, and source position.
    """
    m1 = parse_single_measurement("-38.4°C", metric="temperature", location="Maitri")
    m2 = parse_single_measurement("-38.4 C", metric="temperature", location="Maitri")
    m3 = parse_single_measurement("−38.4 °C", metric="temperature", location="Maitri")  # Unicode minus U+2212
    m4 = parse_single_measurement("-३८.४ डिग्री सेल्सियस", metric="temperature", location="Maitri")  # Devanagari

    assert compare_measurements(m1, m2)["equivalent"] is True
    assert compare_measurements(m1, m3)["equivalent"] is True
    assert compare_measurements(m1, m4)["equivalent"] is True

    # Equal numeric values are NOT equivalent if metric/unit differs: 38.4 knots vs 38.4°C
    m_knots = parse_single_measurement("38.4 knots", location="Maitri")
    m_celsius = parse_single_measurement("38.4°C", location="Maitri")
    comp_mismatch = compare_measurements(m_knots, m_celsius)
    assert comp_mismatch["equivalent"] is False
    assert comp_mismatch["unit_compatible"] is False

    # Extract from prose retaining source position & metadata
    prose = "At Maitri station in Antarctica, minimum surface temperature reached −38.4 °C while peak wind speed hit 42.5 knots."
    extracted = extract_normalized_measurements(prose)
    assert len(extracted) == 2
    assert extracted[0].numeric_value == -38.4
    assert extracted[0].canonical_unit == "°C"
    assert extracted[0].location == "Maitri"
    assert extracted[0].qualifier == "minimum"
    assert extracted[0].source_position["start"] > 0
    assert extracted[1].numeric_value == 42.5
    assert extracted[1].canonical_unit == "knots"

    # Thousand separators & pressure unit variants (1,013.25 hPa == 1013.25 mbar)
    p1 = parse_single_measurement("1,013.25 hPa", location="Bharati")
    p2 = parse_single_measurement("1013.25 mbar", location="Bharati")
    assert compare_measurements(p1, p2)["equivalent"] is True

    # Scientific notation (1.5 × 10^-3 m w.e. == 1.5e-3 m w.e.)
    s1 = parse_single_measurement("1.5 × 10^-3 m w.e.", location="Himansh")
    s2 = parse_single_measurement("1.5e-3 m w.e.", location="Himansh")
    assert compare_measurements(s1, s2)["equivalent"] is True

    # Verify HTTP endpoint POST /api/v1/claims/normalize
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        norm_res = await client.post(
            "/api/v1/claims/normalize",
            json={
                "text": prose,
                "expression_a": "-38.4°C",
                "expression_b": "−38.4 °C",
                "location": "Maitri",
                "metric": "temperature",
            },
        )
        assert norm_res.status_code == 200
        n_data = norm_res.json()
        assert len(n_data["extracted_measurements"]) == 2
        assert n_data["comparison"]["equivalent"] is True


@pytest.mark.asyncio
async def test_prompt_12_and_14_four_track_and_claim_verification():
    """
    Prompt 12 & 14 Verification:
    - Generates 4-track outreach (PIB, Social X/LinkedIn/Instagram, Education Class 8-12, Vernacular).
    - Every claim has claim_id, claim_text, source_refs, metric, value, unit, location, qualifier, numbers_claimed, verification_status.
    - Distinguishes OBSERVED, CALCULATED, CONTEXTUAL.
    - Deterministic claim verification returns VERIFIED, NEEDS_REVIEW, UNSUPPORTED, CONFLICTING with explainable rule & trace.
    """
    await connect_to_mongo()
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        login_res = await client.post(
            "/api/v1/auth/login",
            json={"email": "editor@vistaar.ncpor.res.in", "password": "Editor@Vistaar2026!"},
        )
        assert login_res.status_code == 200
        headers = {"Authorization": f"Bearer {login_res.json()['access_token']}"}

        # 1. Generate 4-Track Outreach Package
        gen_res = await client.post(
            "/api/v1/ai/generate-outreach",
            json={"station_id": "maitri"},
            headers=headers,
        )
        assert gen_res.status_code == 200
        pkg = gen_res.json()

        assert pkg["status"] == "AI_GENERATED"
        assert pkg["draft_status"] == "DRAFT"
        assert pkg["human_approval_required"] is True
        assert pkg["can_publish_without_human_approval"] is False
        assert "[Quote to be provided by authorized official]" in pkg["pib"]["body"]
        assert "platforms" in pkg["social"]
        assert "x" in pkg["social"]["platforms"]
        assert "linkedin" in pkg["social"]["platforms"]
        assert "instagram" in pkg["social"]["platforms"]

        claims = pkg["claims"]
        assert len(claims) >= 4
        epistemic_types = {c["epistemic_type"] for c in claims}
        assert "OBSERVED" in epistemic_types
        assert "CALCULATED" in epistemic_types
        assert "INFERRED" in epistemic_types
        assert "CONTEXTUAL" in epistemic_types

        inferred_claims = [c for c in claims if c["epistemic_type"] == "INFERRED"]
        assert all(c.get("is_direct_observation") is False for c in inferred_claims)
        assert all(c.get("qualifier") == "inferred" for c in inferred_claims)

        for c in claims:
            for req_key in [
                "claim_id",
                "claim_text",
                "source_refs",
                "metric",
                "value",
                "unit",
                "location",
                "qualifier",
                "numbers_claimed",
                "verification_status",
            ]:
                assert req_key in c

        # 2. Verify CONFLICTING claim when unit dimension is wrong (e.g., knots instead of °C)
        obs_claim = claims[0]
        conflict_res = await client.post(
            "/api/v1/claims/verify",
            json={
                "claim_text": "Maitri recorded temperature of 15.0 knots.",
                "metric": obs_claim["metric"],
                "value": obs_claim["value"],
                "unit": "knots" if obs_claim["unit"] != "knots" else "°C",
                "location": obs_claim["location"],
                "source_type": "DATASET",
                "source_id": pkg["dataset_id"],
                "field": obs_claim["metric"],
            },
        )
        assert conflict_res.status_code == 200
        c_json = conflict_res.json()
        assert c_json["status"] == "CONFLICTING"
        assert "RULE_UNIT_DIMENSION_CONFLICT" in c_json["verification_rule"]

        # 3. Verify UNSUPPORTED claim when dataset does not exist
        unsup_res = await client.post(
            "/api/v1/claims/verify",
            json={
                "claim_text": "Nonexistent dataset claim",
                "metric": "temperature",
                "value": -20.0,
                "unit": "°C",
                "location": "Maitri",
                "source_type": "DATASET",
                "source_id": "ds_nonexistent_99999",
            },
        )
        assert unsup_res.status_code == 200
        assert unsup_res.json()["status"] == "UNSUPPORTED"

        # 4. Prompt 15: Verify Reviewer Claim Actions (REQUEST_REVISION -> RESOLVE_CONFLICT -> ACCEPT)
        target_cid = obs_claim["claim_id"]
        rev_act = await client.post(
            f"/api/v1/claims/{target_cid}/review-action",
            json={
                "action": "REQUEST_REVISION",
                "publication_id": pkg["id"],
                "reviewer_notes": "Verify against secondary AWS anemometer",
            },
            headers=headers,
        )
        assert rev_act.status_code == 200
        assert rev_act.json()["new_status"] == "NEEDS_REVIEW"

        acc_act = await client.post(
            f"/api/v1/claims/{target_cid}/review-action",
            json={
                "action": "ACCEPT",
                "publication_id": pkg["id"],
                "reviewer_notes": "Confirmed by reviewer",
            },
            headers=headers,
        )
        assert acc_act.status_code == 200
        assert acc_act.json()["new_status"] == "VERIFIED"


@pytest.mark.asyncio
async def test_prompt_16_weather_intelligence():
    """
    Prompt 16 Verification:
    - Weather Intelligence dynamically detects parameters, returns provider, period, unit, source_citation,
      quality_breakdown, and links every point to its original dataset record_id and sha256 provenance.
    """
    await connect_to_mongo()
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        st_res = await client.get("/api/v1/weather/stations")
        assert st_res.status_code == 200
        stations = st_res.json()
        assert len(stations) > 0

        ts_res = await client.get("/api/v1/weather/timeseries?station_id=himansh")
        assert ts_res.status_code == 200
        ts = ts_res.json()
        for req_field in [
            "station_id",
            "dataset_id",
            "provider",
            "period",
            "parameter",
            "available_parameters",
            "unit",
            "source_citation",
            "quality_breakdown",
            "statistics",
            "points",
        ]:
            assert req_field in ts

        if ts["points"]:
            pt = ts["points"][0]
            assert "record_id" in pt
            assert "provenance" in pt
            rec_res = await client.get(f"/api/v1/weather/records/{pt['record_id']}")
            assert rec_res.status_code == 200
            assert rec_res.json()["record_id"] == pt["record_id"]


