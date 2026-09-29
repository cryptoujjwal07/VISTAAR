import uuid
from datetime import datetime, timezone
from typing import Optional, List, Dict, Any
from fastapi import APIRouter, HTTPException, Depends, status
from pydantic import BaseModel
from apps.api.core.database import get_database
from apps.api.core.security import get_current_user, require_roles
from apps.api.core.config import settings

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

    # Track 1: PIB Press Release
    pib_body = (
        f"PRESS INFORMATION BUREAU (GOVERNMENT OF INDIA)\n"
        f"MINISTRY OF EARTH SCIENCES / NATIONAL CENTRE FOR POLAR AND OCEAN RESEARCH\n\n"
        f"SCIENTIFIC OBSERVATION BULLETIN: {st_name.upper()}\n\n"
        f"In ongoing scientific monitoring under India's Polar Research Programme, {st_name} recorded a {key_param.replace('_', ' ')} "
        f"measurement of {key_val} {key_unit} on {first_rec.get('timestamp')[:10]}.\n\n"
        f"Continuous automated environmental data collection is conducted in accordance with NPDC / MoES scientific standards.\n\n"
        f"[Quote to be provided by authorized official]\n\n"
        f"Authoritative Provenance: Dataset ID {dataset['dataset_id']} (Checksum: {dataset['sha256'][:16]})."
    )

    pib_track = {
        "track": "PIB",
        "title": f"Scientific Bulletin: Environmental Observations at {st_name}",
        "summary": f"Official observational bulletin detailing meteorological measurements recorded at {st_name}.",
        "body": pib_body,
        "claims": [claim_1],
        "target_audience": "Press, Media & Policy Makers"
    }

    # Track 2: Social Media (X / LinkedIn)
    social_body = (
        f"❄️ Scientific Update from {st_name} ({dataset.get('region')}):\n\n"
        f"India's polar research station logged a {key_param.replace('_', ' ')} of {key_val} {key_unit} ({first_rec.get('timestamp')[:10]}).\n\n"
        f"Verified via @MoESGoI & @NCPOR_GoI National Polar Data Centre.\n"
        f"#PolarScience #IndiaAtPoles #NCPOR #ScienceOutreach"
    )

    social_track = {
        "track": "SOCIAL",
        "title": f"Social Dispatch: {st_name}",
        "summary": "Concise factual update prepared for social media broadcast.",
        "body": social_body,
        "claims": [claim_1],
        "target_audience": "General Public & Social Followers"
    }

    # Track 3: Education (Class 8-12)
    edu_body = (
        f"LEARNING MODULE: POLAR CLIMATOLOGY & MEASUREMENTS\n\n"
        f"Concept: How Indian Scientists Measure Atmospheric Parameters at {st_name}.\n\n"
        f"Case Study:\n"
        f"On {first_rec.get('timestamp')[:10]}, automatic calibrated instruments recorded {key_val} {key_unit} for {key_param.replace('_', ' ')}.\n\n"
        f"Curriculum Relevance (NCERT Classes 8-12 Science):\n"
        f"- Thermal dynamics and weather instruments in extreme polar environments.\n"
        f"- The role of polar research in global climate teleconnections.\n\n"
        f"Activity: Compare {st_name}'s observed {key_param.replace('_', ' ')} with the average conditions of peninsular India."
    )

    edu_track = {
        "track": "EDUCATION",
        "title": f"Classroom Module: Understanding Polar Weather at {st_name}",
        "summary": "NCERT-aligned science educational explainer with real observational evidence.",
        "body": edu_body,
        "claims": [claim_1],
        "target_audience": "Students and Educators (Classes 8-12)"
    }

    # Track 4: Vernacular (Hindi)
    vernacular_body = (
        f"राष्ट्रीय ध्रुवीय एवं महासागर अनुसंधान केंद्र (NCPOR)\n"
        f"पृथ्वी विज्ञान मंत्रालय, भारत सरकार\n\n"
        f"वैज्ञानिक अवलोकन बुलेटिन: {st_name}\n\n"
        f"भारत के ध्रुवीय अनुसंधान कार्यक्रम के अंतर्गत, {st_name} ने {first_rec.get('timestamp')[:10]} को {key_param.replace('_', ' ')} "
        f"का मान {key_val} {key_unit} दर्ज किया।\n\n"
        f"यह डेटा राष्ट्रीय ध्रुवीय डेटा केंद्र (NPDC) के माध्यम से सत्यापित है।\n\n"
        f"[Quote to be provided by authorized official]"
    )

    vernacular_track = {
        "track": "VERNACULAR",
        "title": f"{st_name}: ध्रुवीय विज्ञान अवलोकन",
        "summary": "हिंदी में अनुवादित और वैज्ञानिक दृष्टि से सत्यापित बुलेटिन।",
        "body": vernacular_body,
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
