import re
import math
from datetime import datetime, timezone
from typing import Optional, List, Dict, Any
from fastapi import APIRouter, HTTPException, Depends, status
from pydantic import BaseModel
from apps.api.core.database import get_database
from apps.api.core.security import get_current_user, require_roles

router = APIRouter(prefix="/claims", tags=["Deterministic Claim Verification Engine"])

class ClaimVerificationRequest(BaseModel):
    claim_id: Optional[str] = None
    claim_text: str
    metric: str                   # e.g., 'temperature', 'wind_speed', 'pressure', 'precipitation'
    value: float                  # claimed numeric value
    unit: str                     # claimed unit, e.g., '°C', 'm/s', 'hPa', 'mm/h'
    location: str                 # 'Maitri', 'Bharati', 'Himadri', 'Himansh'
    source_type: str              # 'DATASET' | 'PDF'
    source_id: str                # dataset_id or document_id
    field: Optional[str] = None   # field in dataset or chunk_id in PDF

def normalize_unit(unit_str: str) -> str:
    u = unit_str.strip().lower()
    if u in ['°c', 'c', 'deg c', 'degrees c', 'celsius', 'centigrade']:
        return "°C"
    if u in ['m/s', 'ms-1', 'mps', 'meter/sec', 'meters per second']:
        return "m/s"
    if u in ['knots', 'kt', 'kts']:
        return "knots"
    if u in ['hpa', 'mbar', 'millibar', 'hectopascal']:
        return "hPa"
    if u in ['mm/h', 'mm/hr', 'millimeters per hour']:
        return "mm/h"
    if u in ['%', 'percent', 'percentage']:
        return "%"
    if u in ['w/m2', 'w/m²', 'watts per square meter']:
        return "W/m²"
    return unit_str.strip()

def unit_compatible(u1: str, u2: str) -> bool:
    norm1 = normalize_unit(u1)
    norm2 = normalize_unit(u2)
    if norm1 == norm2:
        return True
    # Knot to m/s conversion factor check: 1 knot = 0.514444 m/s
    if (norm1 == "knots" and norm2 == "m/s") or (norm1 == "m/s" and norm2 == "knots"):
        return True
    return False

@router.post("/verify")
async def verify_claim(req: ClaimVerificationRequest):
    db = get_database()
    norm_claimed_unit = normalize_unit(req.unit)
    norm_claimed_val = req.value

    # Deterministic verification against real database evidence
    verification_status = "UNSUPPORTED"
    explanation = ""
    evidence_details = {}

    if req.source_type == "DATASET":
        ds = await db.datasets.find_one({"dataset_id": req.source_id})
        if not ds:
            return {
                "claim_id": req.claim_id or "claim_adhoc",
                "status": "UNSUPPORTED",
                "explanation": f"Referenced scientific dataset '{req.source_id}' does not exist in authoritative catalog.",
                "verified_at": datetime.now(timezone.utc).isoformat()
            }

        # Check parameter availability in dataset
        params = ds.get("parameters", [])
        target_param = req.field if (req.field and req.field in params) else None
        if not target_param:
            # Map metric to parameter
            metric_map = {
                "temperature": ["tempr", "airtemp_avg", "airtemp_max", "airtemp_min"],
                "wind_speed": ["ws", "ws_avg", "ws_max"],
                "pressure": ["ap"],
                "humidity": ["rh", "rh_max", "rh_min"],
                "precipitation": ["intensity"]
            }
            candidates = metric_map.get(req.metric.lower(), [])
            for c in candidates:
                if c in params:
                    target_param = c
                    break

        if not target_param:
            return {
                "claim_id": req.claim_id or "claim_adhoc",
                "status": "UNSUPPORTED",
                "explanation": f"Dataset '{ds.get('title')}' does not record metric '{req.metric}'.",
                "verified_at": datetime.now(timezone.utc).isoformat()
            }

        ds_unit = ds.get("units", {}).get(target_param, "")
        if not unit_compatible(req.unit, ds_unit):
            return {
                "claim_id": req.claim_id or "claim_adhoc",
                "status": "CONFLICTING",
                "explanation": f"Unit mismatch: Claim asserts {req.unit}, but dataset '{req.source_id}' parameter '{target_param}' is calibrated in {ds_unit}.",
                "verified_at": datetime.now(timezone.utc).isoformat()
            }

        # Search for matching observation records
        # Allow tolerance of +/- 0.5 for rounding discrepancies
        tolerance = 0.5
        cursor = db.dataset_records.find({
            "dataset_id": req.source_id,
            f"metrics.{target_param}": {
                "$gte": norm_claimed_val - tolerance,
                "$lte": norm_claimed_val + tolerance
            }
        }).limit(5)
        matches = await cursor.to_list(length=5)

        if matches:
            best_match = matches[0]
            actual_val = best_match["metrics"][target_param]
            exact_match = abs(actual_val - norm_claimed_val) < 0.001
            
            verification_status = "VERIFIED" if exact_match else "NEEDS_REVIEW"
            explanation = (
                f"Deterministically confirmed by record '{best_match['record_id']}' at {best_match['timestamp']} UTC. "
                f"Observed value: {actual_val} {ds_unit} (Quality flag: {best_match.get('quality_flags', {}).get(target_param, 'VALID')})."
            )
            evidence_details = {
                "record_id": best_match["record_id"],
                "timestamp": best_match["timestamp"],
                "observed_value": actual_val,
                "unit": ds_unit,
                "source_file": best_match["provenance"].get("source_file"),
                "source_line": best_match["provenance"].get("source_line"),
                "sha256": best_match["provenance"].get("sha256")
            }
        else:
            # Check if value is out of bounds of dataset min/max
            cov = ds.get("quality_summary", {}).get("parameter_coverage", {}).get(target_param, {})
            p_min = cov.get("min")
            p_max = cov.get("max")
            if p_min is not None and (norm_claimed_val < p_min or norm_claimed_val > p_max):
                verification_status = "CONFLICTING"
                explanation = f"Claimed value {norm_claimed_val} {req.unit} falls outside documented dataset bounds [{p_min} to {p_max} {ds_unit}]."
            else:
                verification_status = "UNSUPPORTED"
                explanation = f"No record matching {norm_claimed_val} {req.unit} for parameter '{target_param}' found in dataset."

    elif req.source_type == "PDF":
        doc = await db.documents.find_one({"document_id": req.source_id})
        if not doc:
            return {
                "claim_id": req.claim_id or "claim_adhoc",
                "status": "UNSUPPORTED",
                "explanation": f"Document '{req.source_id}' not found in registry.",
                "verified_at": datetime.now(timezone.utc).isoformat()
            }
        # Search chunks for numeric mentions
        chunks_cursor = db.document_chunks.find({
            "document_id": req.source_id,
            "text": {"$regex": str(req.value), "$options": "i"}
        }).limit(3)
        chunks = await chunks_cursor.to_list(length=3)

        if chunks:
            match_chunk = chunks[0]
            verification_status = "VERIFIED"
            explanation = f"Found value '{req.value}' in chunk {match_chunk['chunk_id']} (Page {match_chunk['page_number']})."
            evidence_details = {
                "document_id": req.source_id,
                "page_number": match_chunk["page_number"],
                "chunk_id": match_chunk["chunk_id"],
                "bounding_box": match_chunk["bounding_box"],
                "context": match_chunk["text"][:180] + "..."
            }
        else:
            verification_status = "UNSUPPORTED"
            explanation = f"Numeric value '{req.value}' was not located within text chunks of document '{doc.get('title')}'."

    return {
        "claim_id": req.claim_id or "claim_adhoc",
        "claim_text": req.claim_text,
        "status": verification_status,
        "explanation": explanation,
        "evidence": evidence_details,
        "verified_at": datetime.now(timezone.utc).isoformat(),
        "verifier_version": "1.0.0-deterministic-npdc"
    }
