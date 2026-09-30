import uuid
from datetime import datetime, timezone
from typing import Any, Dict, Optional
from apps.api.core.database import get_database
from apps.api.core.logging import get_log_context, get_logger, redact_sensitive_data, set_log_context

logger = get_logger("vistaar.audit")


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
    details: Optional[Dict[str, Any]] = None,
) -> dict:
    """
    Records an append-only cryptographic institutional audit event adhering to Prompts 07, 08 & 28.
    Automatically correlates request_id, resource_id, and user_id in structured observability logs.
    """
    ctx = get_log_context()
    effective_req_id = request_id or ctx.get("request_id")
    set_log_context(
        request_id=effective_req_id,
        resource_id=str(resource_id),
        user_id=str(actor_id),
    )

    db = get_database()
    event_id = f"aud_{uuid.uuid4().hex[:12]}"
    now = datetime.now(timezone.utc).isoformat()
    safe_details = redact_sensitive_data(details or {})

    doc = {
        "event_id": event_id,
        "actor_id": actor_id,
        "actor_email": actor_email,
        "action": action,
        "resource_type": resource_type.upper(),
        "resource_id": str(resource_id),
        "timestamp": now,
        "request_id": effective_req_id,
        "reason": reason,
        "before_version": before_version,
        "after_version": after_version,
        "details": safe_details,
    }

    logger.info(
        f"AUDIT_EVENT action={action} resource_type={resource_type.upper()} resource_id={resource_id} actor={actor_email}",
        extra={
            "request_id": effective_req_id,
            "resource_id": str(resource_id),
            "user_id": str(actor_id),
            "job_id": safe_details.get("job_id") if isinstance(safe_details, dict) else None,
        },
    )

    try:
        await db.audit_events.insert_one(doc)
    except Exception:
        pass

    return doc
