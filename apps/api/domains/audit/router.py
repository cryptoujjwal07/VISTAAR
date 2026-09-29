from fastapi import APIRouter, Query, Depends
from typing import Optional
from apps.api.core.database import get_database
from apps.api.core.security import require_roles

router = APIRouter(prefix="/audit", tags=["Governance & Audit Logs"])

@router.get("")
async def get_audit_logs(
    resource_type: Optional[str] = None,
    action: Optional[str] = None,
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
    current_user=Depends(require_roles(["SUPER_ADMIN"]))
):
    db = get_database()
    query = {}
    if resource_type:
        query["resource_type"] = resource_type.upper()
    if action:
        query["action"] = action.upper()

    cursor = db.audit_events.find(query, {"_id": 0}).sort("timestamp", -1).skip(offset).limit(limit)
    items = await cursor.to_list(length=limit)
    total = await db.audit_events.count_documents(query)
    return {"total": total, "items": items, "limit": limit, "offset": offset}
