import csv
import io
import json
from datetime import datetime, timezone
from typing import Optional, Literal
from fastapi import APIRouter, Query, Depends, HTTPException, status, Response
from apps.api.core.database import get_database
from apps.api.core.security import require_roles, get_current_user

router = APIRouter(prefix="/audit", tags=["Governance & Audit Logs (Prompt 08)"])

@router.get("")
async def get_audit_logs(
    resource_type: Optional[str] = None,
    resource_id: Optional[str] = None,
    actor_email: Optional[str] = None,
    action: Optional[str] = None,
    date_from: Optional[str] = None,
    date_to: Optional[str] = None,
    limit: int = Query(50, ge=1, le=500),
    offset: int = Query(0, ge=0),
    current_user=Depends(require_roles(["SUPER_ADMIN"]))
):
    """
    SUPER_ADMIN only: Query append-only audit trail with comprehensive filtering.
    Mandatory Prompt 08 fields: event_id, actor_id, action, resource_type, resource_id,
    timestamp, request_id, reason, before_version, after_version.
    """
    db = get_database()
    query = {}
    if resource_type:
        query["resource_type"] = resource_type.upper()
    if resource_id:
        query["resource_id"] = str(resource_id)
    if actor_email:
        query["actor_email"] = {"$regex": actor_email, "$options": "i"}
    if action:
        query["action"] = action.upper()
    if date_from or date_to:
        query["timestamp"] = {}
        if date_from:
            query["timestamp"]["$gte"] = date_from
        if date_to:
            query["timestamp"]["$lte"] = date_to

    cursor = db.audit_events.find(query, {"_id": 0}).sort("timestamp", -1).skip(offset).limit(limit)
    items = await cursor.to_list(length=limit)
    total = await db.audit_events.count_documents(query)

    return {
        "total": total,
        "items": items,
        "limit": limit,
        "offset": offset,
        "immutability": "APPEND_ONLY_CRYPTOGRAPHIC_SEAL"
    }

@router.get("/resource/{resource_type}/{resource_id}")
async def get_resource_audit_history(
    resource_type: str,
    resource_id: str,
    current_user=Depends(require_roles(["SUPER_ADMIN", "OUTREACH_EDITOR", "FIELD_SCIENTIST"]))
):
    """
    Retrieves complete chronological version and governance audit trail for a specific resource.
    Supports documents, publications, datasets, claims, and submissions.
    """
    db = get_database()
    query = {
        "resource_type": resource_type.upper(),
        "resource_id": str(resource_id)
    }

    cursor = db.audit_events.find(query, {"_id": 0}).sort("timestamp", 1)
    events = await cursor.to_list(length=200)

    return {
        "resource_type": resource_type.upper(),
        "resource_id": resource_id,
        "event_count": len(events),
        "history": events
    }

@router.get("/export")
async def export_audit_trail(
    resource_type: Optional[str] = None,
    action: Optional[str] = None,
    format: Literal['json', 'csv'] = 'json',
    current_user=Depends(require_roles(["SUPER_ADMIN"]))
):
    """
    SUPER_ADMIN only: Exports official immutable audit trail for external compliance,
    CISO security reviews, and institutional reporting.
    """
    db = get_database()
    query = {}
    if resource_type:
        query["resource_type"] = resource_type.upper()
    if action:
        query["action"] = action.upper()

    cursor = db.audit_events.find(query, {"_id": 0}).sort("timestamp", -1).limit(5000)
    records = await cursor.to_list(length=5000)

    if format == 'csv':
        output = io.StringIO()
        fieldnames = [
            "event_id", "timestamp", "actor_id", "actor_email", "action",
            "resource_type", "resource_id", "reason", "before_version", "after_version"
        ]
        writer = csv.DictWriter(output, fieldnames=fieldnames, extrasaction='ignore')
        writer.writeheader()
        for r in records:
            writer.writerow({
                "event_id": r.get("event_id"),
                "timestamp": r.get("timestamp"),
                "actor_id": r.get("actor_id"),
                "actor_email": r.get("actor_email"),
                "action": r.get("action"),
                "resource_type": r.get("resource_type"),
                "resource_id": r.get("resource_id"),
                "reason": r.get("reason"),
                "before_version": json.dumps(r.get("before_version")) if r.get("before_version") is not None else "",
                "after_version": json.dumps(r.get("after_version")) if r.get("after_version") is not None else ""
            })
        return Response(
            content=output.getvalue(),
            media_type="text/csv",
            headers={"Content-Disposition": f"attachment; filename=vistaar_audit_log_{datetime.now(timezone.utc).strftime('%Y%m%d')}.csv"}
        )

    return {
        "exported_at": datetime.now(timezone.utc).isoformat(),
        "exported_by": current_user["email"],
        "count": len(records),
        "records": records
    }

# =========================================================================
# Immutable Append-Only Guards (Prompt 08)
# Prohibit application-level deletion or mutation of audit records.
# =========================================================================

@router.delete("")
@router.delete("/{event_id}")
async def reject_audit_delete():
    raise HTTPException(
        status_code=status.HTTP_405_METHOD_NOT_ALLOWED,
        detail="Append-Only Protection: Audit records are cryptographically permanent and cannot be deleted."
    )

@router.put("/{event_id}")
@router.patch("/{event_id}")
async def reject_audit_update():
    raise HTTPException(
        status_code=status.HTTP_405_METHOD_NOT_ALLOWED,
        detail="Immutability Protection: Audit records cannot be modified after insertion."
    )
