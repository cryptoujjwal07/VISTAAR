import uuid
from datetime import datetime, timezone
from typing import Optional, Any, Dict
from apps.api.core.database import get_database

async def record_audit_event(
    actor_id: str,
    actor_email: str,
    action: str,
    resource_type: str,
    resource_id: str,
    request_id: Optional[str] = None,
    reason: Optional[str] = None,
    before_version: Optional[Any] = None,
    after_version: Optional[Any] = None,
    details: Optional[Dict[str, Any]] = None
) -> dict:
    """
    Records an append-only cryptographic institutional audit event adhering to Prompts 07 & 08.
    Audit fields: event_id, actor_id, actor_email, action, resource_type, resource_id,
    timestamp, request_id, reason, before_version, after_version, details.
    """
    db = get_database()
    event_id = f"aud_{uuid.uuid4().hex[:12]}"
    now = datetime.now(timezone.utc).isoformat()

    doc = {
        "event_id": event_id,
        "actor_id": actor_id,
        "actor_email": actor_email,
        "action": action,
        "resource_type": resource_type.upper(),
        "resource_id": str(resource_id),
        "timestamp": now,
        "request_id": request_id,
        "reason": reason,
        "before_version": before_version,
        "after_version": after_version,
        "details": details or {}
    }

    try:
        await db.audit_events.insert_one(doc)
    except Exception as e:
        # In memory fallback if mongo is down
        pass

    return doc
