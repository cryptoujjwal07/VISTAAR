import uuid
from datetime import datetime, timezone
from typing import Optional, List, Dict, Any
from fastapi import APIRouter, HTTPException, Depends, status
from pydantic import BaseModel
from apps.api.core.database import get_database
from apps.api.core.security import get_current_user, require_roles
from apps.api.core.config import settings
from apps.api.domains.ai.provider import get_outreach_content

router = APIRouter(prefix="/ai", tags=["AI Outreach Studio & Four-Track Generation"])

class GenerateOutreachRequest(BaseModel):
    station_id: str                      # 'maitri', 'bharati', 'himadri', 'himansh'
    dataset_id: Optional[str] = None
    document_id: Optional[str] = None
    topic: Optional[str] = None

@router.post("/generate-outreach")
async def generate_four_track_outreach(
    req: GenerateOutreachRequest,
    current_user=Depends(require_roles(["SUPER_ADMIN", "OUTREACH_EDITOR", "FIELD_SCIENTIST"]))
):
    db = get_database()
    sid = req.station_id.lower()
    
    # 1. Fetch real dataset and representative records
    ds_filter = {"station_id": sid}
    if req.dataset_id:
        ds_filter["dataset_id"] = req.dataset_id
    dataset = await db.datasets.find_one(ds_filter, {"_id": 0})
    
    if not dataset:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"No scientific dataset found for station '{req.station_id}'"
        )

    # Fetch recent valid records from this dataset
    cursor = db.dataset_records.find({"dataset_id": dataset["dataset_id"]}, {"_id": 0}).limit(10)
    sample_records = await cursor.to_list(length=10)
    
    if not sample_records:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Insufficient observation records.")

    first_rec = sample_records[0]
    metrics = first_rec.get("metrics", {})
    
    # Determine key measured observation
    key_param = list(metrics.keys())[0] if metrics else "tempr"
    key_val = metrics.get(key_param)
    key_unit = dataset.get("units", {}).get(key_param, "")
    st_name = dataset.get("station_name", sid.capitalize())

    outreach_id = f"outreach_{uuid.uuid4().hex[:12]}"
    now = datetime.now(timezone.utc).isoformat()

    # Formulate verified deterministic claims from real NPDC observations
    claim_1_id = f"clm_{uuid.uuid4().hex[:8]}"
    claim_1 = {
        "claim_id": claim_1_id,
        "claim_text": f"{st_name} recorded an observed {key_param.replace('_', ' ')} of {key_val} {key_unit} at {first_rec.get('timestamp')[:10]}.",
        "metric": key_param,
        "value": key_val,
        "unit": key_unit,
        "location": st_name,
        "status": "VERIFIED",
        "evidence": {
            "type": "DATASET",
            "dataset_id": dataset["dataset_id"],
            "station_id": sid,
            "timestamp": first_rec.get("timestamp"),
            "record_id": first_rec.get("record_id"),
            "field": key_param,
            "original_value": key_val,
            "explanation": f"Corresponds to record {first_rec.get('record_id')} in {dataset['original_filename']} with SHA256 checksum {dataset['sha256'][:16]}..."
        }
    }

    # Generate content using configured AI provider (Gemini with deterministic fallback)
    content_tracks = await get_outreach_content(
        station_name=st_name,
        region=dataset.get("region", "Polar"),
        observed_metric=key_param,
        observed_value=key_val,
        unit=key_unit,
        timestamp=first_rec.get("timestamp", ""),
        dataset_id=dataset["dataset_id"],
        record_id=first_rec.get("record_id", ""),
        checksum=dataset.get("sha256", "")
    )

    pib_track = {
        "track": "PIB",
        "title": f"Scientific Bulletin: Environmental Observations at {st_name}",
        "summary": f"Official observational bulletin detailing meteorological measurements recorded at {st_name}.",
        "body": content_tracks.get("pib_body", ""),
        "claims": [claim_1],
        "target_audience": "Press, Media & Policy Makers"
    }

    social_track = {
        "track": "SOCIAL",
        "title": f"Social Dispatch: {st_name}",
        "summary": "Concise factual update prepared for social media broadcast.",
        "body": content_tracks.get("social_body", ""),
        "claims": [claim_1],
        "target_audience": "General Public & Social Followers"
    }

    edu_track = {
        "track": "EDUCATION",
        "title": f"Classroom Module: Understanding Polar Weather at {st_name}",
        "summary": "NCERT-aligned science educational explainer with real observational evidence.",
        "body": content_tracks.get("education_body", ""),
        "claims": [claim_1],
        "target_audience": "Students and Educators (Classes 8-12)"
    }

    vernacular_track = {
        "track": "VERNACULAR",
        "title": f"{st_name}: ध्रुवीय विज्ञान अवलोकन",
        "summary": "हिंदी में अनुवादित और वैज्ञानिक दृष्टि से सत्यापित बुलेटिन।",
        "body": content_tracks.get("vernacular_body", ""),
        "claims": [claim_1],
        "language": "hi",
        "target_audience": "Regional Media & Hindi Readers"
    }

    outreach_pkg = {
        "id": outreach_id,
        "title": f"Scientific Outreach: {st_name} Observations",
        "station_id": sid,
        "dataset_id": dataset["dataset_id"],
        "status": "AI_GENERATED", # Starts as AI_GENERATED, requires human review before publication
        "version": 1,
        "pib": pib_track,
        "social": social_track,
        "education": edu_track,
        "vernacular": vernacular_track,
        "claims": [claim_1],
        "created_by": current_user["email"],
        "created_at": now,
        "updated_at": now
    }

    await db.publications.insert_one(outreach_pkg)
    await db.claims.insert_one(claim_1)

    # Audit log
    await db.audit_events.insert_one({
        "event_id": f"aud_{uuid.uuid4().hex[:12]}",
        "actor_id": current_user["id"],
        "actor_email": current_user["email"],
        "action": "GENERATE_OUTREACH",
        "resource_type": "PUBLICATION",
        "resource_id": outreach_id,
        "timestamp": now,
        "details": {"station_id": sid, "status": "AI_GENERATED", "claims_count": 1}
    })

    return outreach_pkg
