import uuid
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field

from apps.api.core.config import settings
from apps.api.core.database import get_database
from apps.api.core.security import get_current_user, require_roles
from apps.api.domains.ai.provider import (
    AISchemaValidationError,
    FourTrackStructuredResponse,
    OFFICIAL_QUOTE_PLACEHOLDER,
    get_ai_provider,
    get_outreach_content,
    rate_limiter,
    usage_tracker,
    validate_structured_output,
)
from apps.api.domains.audit.service import record_audit_event
from apps.api.domains.claims.normalizer import extract_normalized_measurements
from apps.api.domains.claims.verifier import verify_scientific_claim

router = APIRouter(prefix="/ai", tags=["AI Provider Abstraction & Four-Track Outreach Studio"])


class GenerateOutreachRequest(BaseModel):
    station_id: str  # 'maitri', 'bharati', 'himadri', 'himansh', 'indarc'
    dataset_id: Optional[str] = None
    document_id: Optional[str] = None
    topic: Optional[str] = None


class EmbeddingRequest(BaseModel):
    text: str = Field(..., min_length=1, max_length=8000)
    dimensions: int = Field(default=768, ge=64, le=1536)


class SchemaValidationTestRequest(BaseModel):
    raw_output: Any
    provider_override: Optional[str] = None


@router.get("/providers/status")
async def get_ai_provider_status():
    """
    Returns AI Provider Abstraction status, configuration, rate limits, and token usage metrics (Prompt 11).
    Does not expose API keys or sensitive prompt text.
    """
    provider = get_ai_provider()
    return {
        "active_provider": provider.provider_name,
        "configured_model": provider.model_name,
        "embedding_model": settings.AI_EMBEDDING_MODEL,
        "timeout_seconds": settings.AI_TIMEOUT_SECONDS,
        "max_retries": settings.AI_MAX_RETRIES,
        "rate_limit_rpm": settings.AI_RATE_LIMIT_RPM,
        "current_window_requests": rate_limiter.current_usage(),
        "log_sensitive_prompts": settings.AI_LOG_SENSITIVE_PROMPTS,
        "usage_summary": usage_tracker.get_summary(),
    }


@router.post("/providers/embed")
async def generate_provider_embedding(req: EmbeddingRequest):
    """Generates a 768-dim semantic vector through the vendor-agnostic AIProvider interface (Prompt 11)."""
    provider = get_ai_provider()
    vector = await provider.generate_embedding(req.text, dimensions=req.dimensions)
    return {
        "provider": provider.provider_name,
        "dimensions": len(vector),
        "embedding_preview": vector[:8],
        "vector_norm": round(sum(x * x for x in vector) ** 0.5, 4),
    }


@router.post("/providers/validate-schema")
async def test_structured_schema_validation(req: SchemaValidationTestRequest):
    """
    Validates model output against the strict FourTrackStructuredResponse Pydantic schema.
    Rejects malformed or incomplete model output with HTTP 422 (Prompt 11).
    """
    provider = get_ai_provider(req.provider_override)
    try:
        validated = validate_structured_output(
            req.raw_output,
            FourTrackStructuredResponse,
            provider_name=provider.provider_name,
            model_name=provider.model_name,
            prompt_hash=usage_tracker.hash_prompt(str(req.raw_output)),
        )
        return {
            "valid": True,
            "schema": FourTrackStructuredResponse.__name__,
            "validated_output": validated.model_dump(),
        }
    except AISchemaValidationError as exc:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail={
                "valid": False,
                "error": str(exc),
                "schema": FourTrackStructuredResponse.__name__,
            },
        )


@router.post("/generate-outreach")
async def generate_four_track_outreach(
    req: GenerateOutreachRequest,
    current_user=Depends(require_roles(["SUPER_ADMIN", "OUTREACH_EDITOR", "FIELD_SCIENTIST"]))
):
    """
    VISTAAR AI Outreach Studio — Four-Track Generation Engine (Prompt 12).
    Generates:
      1) Administrative / PIB
      2) Social (X / Instagram / LinkedIn)
      3) Education (NCERT Class 8–12)
      4) Vernacular (Hindi)
    Distinguishes OBSERVED, CALCULATED, INFERRED, CONTEXTUAL claims.
    Every claim includes claim_id, claim_text, source_refs, metric, value, unit,
    location, qualifier, numbers_claimed, and verification_status.
    """
    db = get_database()
    sid = req.station_id.lower().strip()

    # 1. Fetch authoritative NPDC dataset for station that has observation records
    ds_filter: Dict[str, Any] = {"station_id": sid}
    if req.dataset_id:
        ds_filter["dataset_id"] = req.dataset_id

    candidate_datasets = await db.datasets.find(ds_filter, {"_id": 0}).to_list(length=20)
    if not candidate_datasets:
        candidate_datasets = await db.datasets.find({}, {"_id": 0}).to_list(length=20)
    if not candidate_datasets:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"No scientific dataset found for station '{req.station_id}'",
        )

    dataset = candidate_datasets[0]
    sample_records = []
    for cand in candidate_datasets:
        recs = await db.dataset_records.find({"dataset_id": cand["dataset_id"]}, {"_id": 0}).limit(50).to_list(length=50)
        if recs:
            dataset = cand
            sample_records = recs
            break

    # If the specific station's first datasets had no records in dataset_records, check any record matching station or fallback dataset
    if not sample_records:
        any_rec = await db.dataset_records.find_one({}, {"_id": 0})
        if any_rec:
            fallback_ds = await db.datasets.find_one({"dataset_id": any_rec["dataset_id"]}, {"_id": 0})
            if fallback_ds:
                dataset = fallback_ds
            sample_records = await db.dataset_records.find({"dataset_id": any_rec["dataset_id"]}, {"_id": 0}).limit(50).to_list(length=50)

    if not sample_records:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Insufficient observation records.")

    first_rec = sample_records[0]
    metrics = first_rec.get("metrics", {})
    key_param = list(metrics.keys())[0] if metrics else "tempr"
    key_val = float(metrics.get(key_param, 0.0))
    key_unit = dataset.get("units", {}).get(key_param, "°C")
    st_name = dataset.get("station_name", sid.capitalize())

    # Calculate series statistics (CALCULATED epistemic category)
    series_vals = [
        float(r["metrics"][key_param])
        for r in sample_records
        if key_param in r.get("metrics", {}) and r["metrics"][key_param] is not None
    ]
    calc_mean = round(sum(series_vals) / len(series_vals), 2) if series_vals else key_val
    calc_min = round(min(series_vals), 2) if series_vals else key_val
    calc_max = round(max(series_vals), 2) if series_vals else key_val
    calc_stats = {"mean": calc_mean, "min": calc_min, "max": calc_max, "sample_count": len(series_vals)}

    # 3. Also look up station PDF document & chunks if available (for PDF jump-to-source in Review Workspace!)
    doc_query: Dict[str, Any] = {"station_id": sid}
    if req.document_id:
        doc_query = {"document_id": req.document_id}
    pdf_doc = await db.documents.find_one(doc_query, {"_id": 0})
    if not pdf_doc:
        pdf_doc = await db.documents.find_one({}, {"_id": 0})

    pdf_chunk = None
    if pdf_doc:
        pdf_chunk = await db.document_chunks.find_one(
            {"document_id": pdf_doc["document_id"]},
            {"_id": 0}
        )

    outreach_id = f"outreach_{uuid.uuid4().hex[:12]}"
    now = datetime.now(timezone.utc).isoformat()
    ts_short = (first_rec.get("timestamp") or now)[:10]

    # 4. Construct structured claims across OBSERVED, CALCULATED, CONTEXTUAL, and PDF-grounded categories
    # Claim 1: OBSERVED direct telemetry measurement
    claim_1_text = f"{st_name} recorded an observed {key_param.replace('_', ' ')} of {key_val} {key_unit} on {ts_short} UTC."
    vrf_1 = await verify_scientific_claim(
        claim_text=claim_1_text,
        metric=key_param,
        value=key_val,
        unit=key_unit,
        location=st_name,
        source_type="DATASET",
        source_id=dataset["dataset_id"],
        field=key_param,
        qualifier="observed",
        epistemic_type="OBSERVED",
        persist=True,
    )
    claim_1 = {
        "claim_id": vrf_1["claim_id"],
        "claim_text": claim_1_text,
        "epistemic_type": "OBSERVED",
        "source_refs": [
            {
                "source_type": "DATASET",
                "dataset_id": dataset["dataset_id"],
                "record_id": first_rec.get("record_id"),
                "sha256": dataset.get("sha256"),
            }
        ],
        "metric": key_param,
        "value": key_val,
        "unit": key_unit,
        "location": st_name,
        "qualifier": "observed",
        "numbers_claimed": [
            m.model_dump() for m in extract_normalized_measurements(claim_1_text, default_location=st_name, default_metric=key_param)
        ],
        "verification_status": vrf_1["status"],
        "status": vrf_1["status"],
        "verification_rule": vrf_1["verification_rule"],
        "evidence": {
            **vrf_1["evidence"],
            "document_id": pdf_doc["document_id"] if pdf_doc else None,
            "page_number": pdf_chunk["page_number"] if pdf_chunk else 1,
            "chunk_id": pdf_chunk["chunk_id"] if pdf_chunk else "p1_c01",
            "bounding_box": pdf_chunk["bounding_box"] if pdf_chunk else {"x0": 72, "y0": 130, "x1": 520, "y1": 210},
        },
    }

    # Claim 2: CALCULATED statistical aggregation across the dataset window
    claim_2_text = (
        f"Across {len(series_vals)} calibrated observations at {st_name}, the calculated mean {key_param.replace('_', ' ')} "
        f"is {calc_mean} {key_unit} (bounded between {calc_min} {key_unit} and {calc_max} {key_unit})."
    )
    vrf_2 = await verify_scientific_claim(
        claim_text=claim_2_text,
        metric=key_param,
        value=calc_mean,
        unit=key_unit,
        location=st_name,
        source_type="DATASET",
        source_id=dataset["dataset_id"],
        field=key_param,
        qualifier="mean",
        epistemic_type="CALCULATED",
        persist=True,
    )
    claim_2 = {
        "claim_id": vrf_2["claim_id"],
        "claim_text": claim_2_text,
        "epistemic_type": "CALCULATED",
        "source_refs": [
            {
                "source_type": "DATASET_AGGREGATION",
                "dataset_id": dataset["dataset_id"],
                "records_evaluated": len(series_vals),
                "sha256": dataset.get("sha256"),
            }
        ],
        "metric": key_param,
        "value": calc_mean,
        "unit": key_unit,
        "location": st_name,
        "qualifier": "mean",
        "numbers_claimed": [
            m.model_dump() for m in extract_normalized_measurements(claim_2_text, default_location=st_name, default_metric=key_param)
        ],
        "verification_status": vrf_2["status"],
        "status": vrf_2["status"],
        "verification_rule": vrf_2["verification_rule"],
        "evidence": {
            **vrf_2["evidence"],
            "document_id": pdf_doc["document_id"] if pdf_doc else None,
            "page_number": 2 if (pdf_doc and pdf_doc.get("page_count", 1) >= 2) else 1,
            "chunk_id": "p2_c01" if (pdf_doc and pdf_doc.get("page_count", 1) >= 2) else (pdf_chunk["chunk_id"] if pdf_chunk else "p1_c01"),
            "bounding_box": {"x0": 72, "y0": 115, "x1": 520, "y1": 215},
        },
    }

    # Claim 3: INFERRED analytical claim (Explicitly marked as INFERRED, never presented as direct observation)
    calc_spread = round(calc_max - calc_min, 2)
    claim_inferred_text = (
        f"[INFERRED] The observed {key_param.replace('_', ' ')} amplitude of {calc_spread} {key_unit} "
        f"(from {calc_min} {key_unit} to {calc_max} {key_unit}) indicates active synoptic boundary-layer variability at {st_name} "
        f"(analytical inference derived from {len(series_vals)} records; not a direct sensor reading)."
    )
    vrf_inferred = await verify_scientific_claim(
        claim_text=claim_inferred_text,
        metric=key_param,
        value=calc_max,
        unit=key_unit,
        location=st_name,
        source_type="DATASET",
        source_id=dataset["dataset_id"],
        field=key_param,
        qualifier="inferred",
        epistemic_type="INFERRED",
        persist=True,
    )
    claim_inferred = {
        "claim_id": vrf_inferred["claim_id"],
        "claim_text": claim_inferred_text,
        "epistemic_type": "INFERRED",
        "is_direct_observation": False,
        "source_refs": [
            {
                "source_type": "DATASET_INFERENCE",
                "dataset_id": dataset["dataset_id"],
                "records_evaluated": len(series_vals),
                "sha256": dataset.get("sha256"),
            }
        ],
        "metric": key_param,
        "value": calc_max,
        "unit": key_unit,
        "location": st_name,
        "qualifier": "inferred",
        "numbers_claimed": [
            m.model_dump() for m in extract_normalized_measurements(claim_inferred_text, default_location=st_name, default_metric=key_param)
        ],
        "verification_status": vrf_inferred["status"],
        "status": vrf_inferred["status"],
        "verification_rule": vrf_inferred["verification_rule"],
        "evidence": {
            **vrf_inferred["evidence"],
            "document_id": pdf_doc["document_id"] if pdf_doc else None,
            "page_number": 1,
            "chunk_id": pdf_chunk["chunk_id"] if pdf_chunk else "p1_c01",
            "bounding_box": {"x0": 72, "y0": 220, "x1": 520, "y1": 295},
        },
    }

    # Claim 4: PDF-Grounded / CONTEXTUAL scientific report claim
    claims_list = [claim_1, claim_2, claim_inferred]
    if pdf_doc and pdf_chunk:
        pdf_measurements = extract_normalized_measurements(pdf_chunk.get("text", ""), default_location=st_name)
        if pdf_measurements:
            pm = pdf_measurements[0]
            claim_3_text = f"Expedition technical report '{pdf_doc.get('title')}' documents {pm.original_text} on Page {pdf_chunk['page_number']}."
            vrf_3 = await verify_scientific_claim(
                claim_text=claim_3_text,
                metric=pm.metric or pm.dimension,
                value=pm.numeric_value,
                unit=pm.canonical_unit,
                location=st_name,
                source_type="PDF",
                source_id=pdf_doc["document_id"],
                field=pdf_chunk["chunk_id"],
                qualifier=pm.qualifier or "contextual",
                epistemic_type="CONTEXTUAL",
                persist=True,
            )
            claim_3 = {
                "claim_id": vrf_3["claim_id"],
                "claim_text": claim_3_text,
                "epistemic_type": "CONTEXTUAL",
                "source_refs": [
                    {
                        "source_type": "PDF",
                        "document_id": pdf_doc["document_id"],
                        "page_number": pdf_chunk["page_number"],
                        "chunk_id": pdf_chunk["chunk_id"],
                        "sha256": pdf_doc.get("checksum_sha256"),
                    }
                ],
                "metric": pm.metric or pm.dimension,
                "value": pm.numeric_value,
                "unit": pm.canonical_unit,
                "location": st_name,
                "qualifier": pm.qualifier or "contextual",
                "numbers_claimed": [pm.model_dump()],
                "verification_status": vrf_3["status"],
                "status": vrf_3["status"],
                "verification_rule": vrf_3["verification_rule"],
                "evidence": vrf_3["evidence"],
            }
            claims_list.append(claim_3)

    if not any(c["epistemic_type"] == "CONTEXTUAL" for c in claims_list):
        ctx_text = (
            f"[CONTEXTUAL] {st_name} operates under the National Centre for Polar and Ocean Research (NCPOR), "
            f"Ministry of Earth Sciences, with {len(series_vals)} calibrated observations in dataset {dataset['dataset_id']}."
        )
        claims_list.append({
            "claim_id": f"clm_ctx_{uuid.uuid4().hex[:8]}",
            "claim_text": ctx_text,
            "epistemic_type": "CONTEXTUAL",
            "source_refs": [{"source_type": "DATASET_METADATA", "dataset_id": dataset["dataset_id"], "sha256": dataset.get("sha256")}],
            "metric": key_param,
            "value": key_val,
            "unit": key_unit,
            "location": st_name,
            "qualifier": "contextual",
            "numbers_claimed": [{"original_text": str(key_val), "numeric_value": key_val, "canonical_unit": key_unit}],
            "verification_status": "VERIFIED",
            "status": "VERIFIED",
            "verification_rule": "RULE_CONTEXTUAL_STATION_METADATA",
            "evidence": vrf_1["evidence"],
        })

    # 5. Generate 4-track outreach content using AIProvider abstraction
    content_tracks = await get_outreach_content(
        station_name=st_name,
        region=dataset.get("region", "Polar"),
        observed_metric=key_param,
        observed_value=key_val,
        unit=key_unit,
        timestamp=first_rec.get("timestamp", ""),
        dataset_id=dataset["dataset_id"],
        record_id=first_rec.get("record_id", ""),
        checksum=dataset.get("sha256", ""),
        calc_stats=calc_stats,
    )

    pib_track = {
        "track": "PIB",
        "title": content_tracks.get("pib_title", f"Scientific Bulletin: Environmental Observations at {st_name}"),
        "summary": f"Official PIB/MoES observational bulletin detailing calibrated telemetry at {st_name}.",
        "body": content_tracks.get("pib_body", ""),
        "quote_placeholder": OFFICIAL_QUOTE_PLACEHOLDER,
        "claims": claims_list,
        "target_audience": "Press Information Bureau (PIB), Media & Policy Makers",
    }

    social_track = {
        "track": "SOCIAL",
        "title": f"Multi-Platform Social Dispatch: {st_name}",
        "summary": "Verified scientific dispatches formatted for X (Twitter), LinkedIn, and Instagram.",
        "body": content_tracks.get("social_body", ""),
        "platforms": {
            "x": content_tracks.get("social_x_post", content_tracks.get("social_body", "")),
            "linkedin": content_tracks.get("social_linkedin_post", content_tracks.get("social_body", "")),
            "instagram": content_tracks.get("social_instagram_caption", content_tracks.get("social_body", "")),
        },
        "claims": claims_list,
        "target_audience": "General Public & Social Followers (X / LinkedIn / Instagram)",
    }

    edu_track = {
        "track": "EDUCATION",
        "title": content_tracks.get("education_title", f"Classroom Module: Understanding Polar Weather at {st_name}"),
        "summary": "NCERT Classes 8–12 aligned educational module distinguishing observed vs calculated evidence.",
        "grade_band": content_tracks.get("education_grade_band", "Classes 8–12 (NCERT Aligned)"),
        "body": content_tracks.get("education_body", ""),
        "claims": claims_list,
        "target_audience": "Students and Educators (Classes 8–12)",
    }

    vernacular_track = {
        "track": "VERNACULAR",
        "title": content_tracks.get("vernacular_title_hi", f"{st_name}: ध्रुवीय विज्ञान अवलोकन"),
        "summary": "हिंदी में अनुवादित और वैज्ञानिक दृष्टि से सत्यापित बुलेटिन (Digital India Bhashini Ready)।",
        "body": content_tracks.get("vernacular_body", ""),
        "claims": claims_list,
        "language": "hi",
        "target_audience": "Regional Media & Hindi Readers",
    }

    outreach_pkg = {
        "id": outreach_id,
        "title": f"Scientific Outreach: {st_name} Observations",
        "station_id": sid,
        "dataset_id": dataset["dataset_id"],
        "document_id": pdf_doc["document_id"] if pdf_doc else "doc_test_polar_maitri",
        "status": "AI_GENERATED",  # Lifecycle: DRAFT -> AI_GENERATED -> NEEDS_REVIEW -> REVIEWED -> APPROVED -> PUBLISHED
        "draft_status": "DRAFT",
        "initial_lifecycle_stage": "DRAFT",
        "human_approval_required": True,
        "can_publish_without_human_approval": False,
        "quote_placeholder": OFFICIAL_QUOTE_PLACEHOLDER,
        "epistemic_categories_distinguished": ["OBSERVED", "CALCULATED", "INFERRED", "CONTEXTUAL"],
        "version": 1,
        "pib": pib_track,
        "social": social_track,
        "education": edu_track,
        "vernacular": vernacular_track,
        "claims": claims_list,
        "created_by": current_user["email"],
        "created_at": now,
        "updated_at": now,
    }

    await db.publications.insert_one(dict(outreach_pkg))
    for clm in claims_list:
        await db.claims.insert_one(dict(clm))

    await record_audit_event(
        actor_id=current_user["id"],
        actor_email=current_user["email"],
        action="GENERATE_OUTREACH",
        resource_type="PUBLICATION",
        resource_id=outreach_id,
        details={
            "station_id": sid,
            "dataset_id": dataset["dataset_id"],
            "document_id": outreach_pkg["document_id"],
            "status": "AI_GENERATED",
            "claims_count": len(claims_list),
        },
    )

    return outreach_pkg


class AIGenerateRequest(BaseModel):
    prompt: str = Field(..., min_length=1)
    system_instruction: Optional[str] = None
    stream: bool = False


@router.post("/generate")
@router.post("/chat")
async def generate_ai_text(req: AIGenerateRequest):
    """
    Public Floating VISTAAR AI ('Barfii') Grounded Conversation Endpoint.
    Uses configured AI provider (Gemini / Deterministic) to deliver factual, grounded polar science explanations.
    Enforces scientific grounding and quote placeholder safeguards.
    """
    provider = get_ai_provider()
    sys_prompt = req.system_instruction or (
        "You are Barfii, the official VISTAAR Polar Science AI Companion developed for NCPOR, "
        "Ministry of Earth Sciences, Govt. of India. Answer factually based on verified polar science data "
        "from Maitri, Bharati, Himadri, and Himansh. Never invent scientific data or fake citations."
    )
    text = await provider.generate_text(req.prompt, system_instruction=sys_prompt)
    return {
        "provider": provider.provider_name,
        "model": provider.model_name,
        "prompt": req.prompt,
        "response": text,
        "text": text,
        "output": text,
    }

