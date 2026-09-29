from datetime import datetime, timezone
from typing import Any, Dict, List, Literal, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field

from apps.api.core.database import get_database
from apps.api.core.security import get_current_user, require_roles
from apps.api.domains.audit.service import record_audit_event
from apps.api.domains.claims.normalizer import (
    compare_measurements,
    extract_normalized_measurements,
    normalize_unit,
    parse_single_measurement,
)
from apps.api.domains.claims.verifier import verify_scientific_claim

router = APIRouter(prefix="/claims", tags=["Deterministic Claim Verification & Numerical Normalization"])


class ClaimVerificationRequest(BaseModel):
    claim_id: Optional[str] = None
    claim_text: str
    metric: str
    value: float
    unit: str
    location: str
    source_type: str = "DATASET"  # 'DATASET' | 'PDF'
    source_id: str
    field: Optional[str] = None
    qualifier: Optional[str] = "observed"
    epistemic_type: Optional[str] = "OBSERVED"


class NormalizeRequest(BaseModel):
    text: Optional[str] = None
    expression_a: Optional[str] = None
    expression_b: Optional[str] = None
    location: Optional[str] = None
    metric: Optional[str] = None
    tolerance: float = 0.05


class ClaimReviewActionRequest(BaseModel):
    action: Literal["ACCEPT", "REJECT", "REQUEST_REVISION", "RESOLVE_CONFLICT", "EDIT"]
    publication_id: Optional[str] = None
    updated_claim_text: Optional[str] = None
    updated_value: Optional[float] = None
    updated_unit: Optional[str] = None
    reviewer_notes: Optional[str] = None


@router.post("/normalize")
async def normalize_scientific_numbers(req: NormalizeRequest):
    """
    Scientific Numerical Normalization endpoint (Prompt 13).
    Extracts normalized measurements from text and optionally compares two expressions
    (e.g., '-38.4°C' vs '−38.4 °C' or '38.4 knots' vs '38.4°C').
    """
    extracted = []
    if req.text:
        measurements = extract_normalized_measurements(
            req.text, default_location=req.location, default_metric=req.metric
        )
        extracted = [m.model_dump() for m in measurements]

    comparison = None
    if req.expression_a and req.expression_b:
        ma = parse_single_measurement(req.expression_a, metric=req.metric, location=req.location)
        mb = parse_single_measurement(req.expression_b, metric=req.metric, location=req.location)
        comparison = {
            "measurement_a": ma.model_dump(),
            "measurement_b": mb.model_dump(),
            **compare_measurements(ma, mb, tolerance=req.tolerance),
        }

    return {
        "extracted_measurements": extracted,
        "comparison": comparison,
    }


@router.post("/verify")
async def verify_claim(req: ClaimVerificationRequest):
    """
    Deterministic Scientific Claim Verification Engine endpoint (Prompt 14).
    Statuses: VERIFIED, NEEDS_REVIEW, UNSUPPORTED, CONFLICTING.
    """
    return await verify_scientific_claim(
        claim_text=req.claim_text,
        metric=req.metric,
        value=req.value,
        unit=req.unit,
        location=req.location,
        source_type=req.source_type,
        source_id=req.source_id,
        field=req.field,
        qualifier=req.qualifier,
        epistemic_type=req.epistemic_type,
        claim_id=req.claim_id,
        persist=True,
    )


@router.get("/verifications")
async def list_claim_verifications(limit: int = 30):
    """Lists recent deterministic claim verification records with rule traces (Prompt 14)."""
    db = get_database()
    cursor = db.claim_verifications.find({}, {"_id": 0}).sort("verified_at", -1).limit(limit)
    items = await cursor.to_list(length=limit)
    return {"total": len(items), "items": items}


@router.post("/{claim_id}/review-action")
async def execute_claim_review_action(
    claim_id: str,
    req: ClaimReviewActionRequest,
    current_user=Depends(require_roles(["SUPER_ADMIN", "OUTREACH_EDITOR", "FIELD_SCIENTIST"]))
):
    """
    Executes a reviewer governance action on an individual scientific claim (Prompt 15):
    edit, accept, reject, request revision, resolve conflict.
    Audits every action and updates both db.claims and the parent publication's claims array.
    """
    db = get_database()
    now = datetime.now(timezone.utc).isoformat()

    status_map = {
        "ACCEPT": "VERIFIED",
        "RESOLVE_CONFLICT": "VERIFIED",
        "REJECT": "UNSUPPORTED",
        "REQUEST_REVISION": "NEEDS_REVIEW",
        "EDIT": "NEEDS_REVIEW",
    }
    new_status = status_map[req.action]

    claim_doc = await db.claims.find_one({"claim_id": claim_id}, {"_id": 0})
    update_fields: Dict[str, Any] = {
        "status": new_status,
        "verification_status": new_status,
        "reviewer_action": req.action,
        "reviewer_notes": req.reviewer_notes or f"Reviewer executed {req.action}",
        "reviewed_by": current_user["email"],
        "reviewed_at": now,
    }
    if req.updated_claim_text:
        update_fields["claim_text"] = req.updated_claim_text
    if req.updated_value is not None:
        update_fields["value"] = req.updated_value
    if req.updated_unit:
        update_fields["unit"] = req.updated_unit

    if claim_doc:
        await db.claims.update_one({"claim_id": claim_id}, {"$set": update_fields})

    # Also update claim inside parent publication if publication_id is supplied or found
    pub_query = {"id": req.publication_id} if req.publication_id else {"claims.claim_id": claim_id}
    pub = await db.publications.find_one(pub_query)
    if pub:
        updated_claims = []
        for c in pub.get("claims", []):
            if c.get("claim_id") == claim_id:
                c.update(update_fields)
            updated_claims.append(c)

        # Sync track-level claims as well
        pub_update: Dict[str, Any] = {"claims": updated_claims, "updated_at": now}
        for track_key in ["pib", "social", "education", "vernacular"]:
            if track_key in pub and isinstance(pub[track_key], dict):
                t_obj = dict(pub[track_key])
                t_claims = []
                for tc in t_obj.get("claims", []):
                    if tc.get("claim_id") == claim_id:
                        tc.update(update_fields)
                    t_claims.append(tc)
                t_obj["claims"] = t_claims
                pub_update[track_key] = t_obj

        await db.publications.update_one({"id": pub["id"]}, {"$set": pub_update})

    await record_audit_event(
        actor_id=current_user["id"],
        actor_email=current_user["email"],
        action=f"CLAIM_REVIEW_{req.action}",
        resource_type="CLAIM",
        resource_id=claim_id,
        details={
            "action": req.action,
            "new_status": new_status,
            "publication_id": req.publication_id or (pub["id"] if pub else None),
            "reviewer_notes": req.reviewer_notes,
        }
    )

    return {
        "claim_id": claim_id,
        "action": req.action,
        "new_status": new_status,
        "reviewed_by": current_user["email"],
        "reviewed_at": now,
        "reviewer_notes": update_fields["reviewer_notes"],
    }
