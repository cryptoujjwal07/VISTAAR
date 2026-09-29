import uuid
from datetime import datetime, timezone
from typing import Optional, List, Literal
from fastapi import APIRouter, HTTPException, Depends, status
from pydantic import BaseModel
from apps.api.core.database import get_database
from apps.api.core.security import get_current_user, require_roles

router = APIRouter(prefix="/publications", tags=["Publishing Governance & Review Workspace"])

class StatusTransitionRequest(BaseModel):
    new_status: Literal['NEEDS_REVIEW', 'REVIEWED', 'APPROVED', 'PUBLISHED', 'ARCHIVED']
    reason: Optional[str] = None
    reviewer_notes: Optional[str] = None

class EditTrackRequest(BaseModel):
    track: Literal['PIB', 'SOCIAL', 'EDUCATION', 'VERNACULAR']
    title: str
    summary: str
    body: str

@router.get("")
async def list_publications(
    status_filter: Optional[str] = None,
    station_id: Optional[str] = None,
    limit: int = 50,
    offset: int = 0
):
    db = get_database()
    query = {}
    if status_filter:
        query["status"] = status_filter
    if station_id:
        query["station_id"] = station_id.lower()

    cursor = db.publications.find(query, {"_id": 0}).sort("created_at", -1).skip(offset).limit(limit)
    items = await cursor.to_list(length=limit)
    total = await db.publications.count_documents(query)
    return {"total": total, "items": items}

@router.get("/published")
async def list_public_publications(station_id: Optional[str] = None, limit: int = 20):
    """Public endpoint: only returns APPROVED/PUBLISHED content for the public portal"""
    db = get_database()
    query = {"status": "PUBLISHED"}
    if station_id:
        query["station_id"] = station_id.lower()
    cursor = db.publications.find(query, {"_id": 0}).sort("published_at", -1).limit(limit)
    items = await cursor.to_list(length=limit)
    return items

@router.get("/{pub_id}")
async def get_publication(pub_id: str):
    db = get_database()
    pub = await db.publications.find_one({"id": pub_id}, {"_id": 0})
    if not pub:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Publication not found")
    return pub

@router.post("/{pub_id}/transition")
async def transition_status(
    pub_id: str,
    req: StatusTransitionRequest,
    current_user=Depends(require_roles(["SUPER_ADMIN", "OUTREACH_EDITOR"]))
):
    db = get_database()
    pub = await db.publications.find_one({"id": pub_id})
    if not pub:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Publication not found")

    old_status = pub.get("status")
    new_status = req.new_status

    # Validate state transition machine
    valid_transitions = {
        "DRAFT": ["AI_GENERATED", "NEEDS_REVIEW"],
        "AI_GENERATED": ["NEEDS_REVIEW", "REVIEWED"],
        "NEEDS_REVIEW": ["REVIEWED", "DRAFT"],
        "REVIEWED": ["APPROVED", "NEEDS_REVIEW"],
        "APPROVED": ["PUBLISHED", "NEEDS_REVIEW"],
        "PUBLISHED": ["ARCHIVED", "NEEDS_REVIEW"],
        "ARCHIVED": ["NEEDS_REVIEW"]
    }

    if new_status not in valid_transitions.get(old_status, []):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid publishing transition from '{old_status}' to '{new_status}'."
        )

    now = datetime.now(timezone.utc).isoformat()
    update_fields = {
        "status": new_status,
        "updated_at": now,
        "last_reviewer": current_user["email"]
    }
    if new_status == "PUBLISHED":
        update_fields["published_at"] = now
        update_fields["approved_by"] = current_user["email"]
    elif new_status == "APPROVED":
        update_fields["approved_by"] = current_user["email"]

    await db.publications.update_one({"id": pub_id}, {"$set": update_fields})

    # Append to immutable audit log
    await db.audit_events.insert_one({
        "event_id": f"aud_{uuid.uuid4().hex[:12]}",
        "actor_id": current_user["id"],
        "actor_email": current_user["email"],
        "action": f"TRANSITION_{new_status}",
        "resource_type": "PUBLICATION",
        "resource_id": pub_id,
        "timestamp": now,
        "details": {
            "from_status": old_status,
            "to_status": new_status,
            "reason": req.reason,
            "reviewer_notes": req.reviewer_notes
        }
    })

    return {
        "id": pub_id,
        "previous_status": old_status,
        "current_status": new_status,
        "transitioned_at": now
    }

@router.put("/{pub_id}/tracks")
async def update_publication_track(
    pub_id: str,
    req: EditTrackRequest,
    current_user=Depends(require_roles(["SUPER_ADMIN", "OUTREACH_EDITOR"]))
):
    db = get_database()
    pub = await db.publications.find_one({"id": pub_id})
    if not pub:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Publication not found")

    track_key = req.track.lower()
    now = datetime.now(timezone.utc).isoformat()
    
    update_data = {
        f"{track_key}.title": req.title,
        f"{track_key}.summary": req.summary,
        f"{track_key}.body": req.body,
        "updated_at": now,
        "version": pub.get("version", 1) + 1
    }

    await db.publications.update_one({"id": pub_id}, {"$set": update_data})

    return {"id": pub_id, "updated_track": req.track, "version": pub.get("version", 1) + 1}
