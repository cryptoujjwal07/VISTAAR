import contextvars
import json
import logging
import re
import sys
from datetime import datetime, timezone
from typing import Any, Dict, Optional

# Context variables for structured observability correlation (Prompt 28)
request_id_ctx: contextvars.ContextVar[Optional[str]] = contextvars.ContextVar("request_id", default=None)
job_id_ctx: contextvars.ContextVar[Optional[str]] = contextvars.ContextVar("job_id", default=None)
resource_id_ctx: contextvars.ContextVar[Optional[str]] = contextvars.ContextVar("resource_id", default=None)
user_id_ctx: contextvars.ContextVar[Optional[str]] = contextvars.ContextVar("user_id", default=None)

SENSITIVE_KEY_NAMES = {
    "password",
    "passwd",
    "secret",
    "secret_key",
    "jwt_secret_key",
    "token",
    "access_token",
    "refresh_token",
    "api_key",
    "gemini_api_key",
    "bhashini_api_key",
    "authorization",
    "private_key",
    "credential",
    "credentials",
}

# Regex patterns to scrub secrets, tokens, API keys, passwords, and DB credentials from log strings
SECRET_PATTERNS = [
    (re.compile(r"Bearer\s+[A-Za-z0-9\-_\.~+/]+=*", re.IGNORECASE), "Bearer [REDACTED]"),
    (re.compile(r"\beyJ[A-Za-z0-9\-_]+\.[A-Za-z0-9\-_]+\.[A-Za-z0-9\-_]+\b"), "[REDACTED_JWT]"),
    (re.compile(r"\bAIza[0-9A-Za-z\-_]{20,}\b"), "[REDACTED_API_KEY]"),
    (re.compile(r"\bsk-[A-Za-z0-9]{16,}\b"), "[REDACTED_API_KEY]"),
    (re.compile(r"(mongodb(?:\+srv)?://[^:\s/]+:)([^@\s]+)(@)", re.IGNORECASE), r"\1[REDACTED]\3"),
    (
        re.compile(
            r"((?:password|passwd|secret|api_key|token|authorization)\s*[:=]\s*['\"]?)([^'\"\s,&;]+)",
            re.IGNORECASE,
        ),
        r"\1[REDACTED]",
    ),
]


def redact_sensitive_text(text: str) -> str:
    """Scrubs passwords, JWTs, Bearer tokens, API keys, and DB URI credentials from strings (Prompt 28)."""
    if not text or not isinstance(text, str):
        return str(text) if text is not None else ""
    redacted = text
    for pattern, replacement in SECRET_PATTERNS:
        redacted = pattern.sub(replacement, redacted)
    return redacted


def redact_sensitive_data(data: Any) -> Any:
    """Recursively scrubs sensitive keys and values from dictionaries, lists, and strings."""
    if isinstance(data, dict):
        cleaned = {}
        for k, v in data.items():
            k_low = str(k).lower()
            if k_low in SENSITIVE_KEY_NAMES or any(
                sub in k_low for sub in ("password", "passwd", "secret", "api_key", "token", "private_key", "credential")
            ):
                cleaned[k] = "[REDACTED]"
            else:
                cleaned[k] = redact_sensitive_data(v)
        return cleaned
    if isinstance(data, list):
        return [redact_sensitive_data(item) for item in data]
    if isinstance(data, str):
        return redact_sensitive_text(data)
    return data


def set_log_context(
    request_id: Optional[str] = None,
    job_id: Optional[str] = None,
    resource_id: Optional[str] = None,
    user_id: Optional[str] = None,
) -> None:
    """Sets correlation identifiers in async contextvars for structured logging."""
    if request_id is not None:
        request_id_ctx.set(request_id)
    if job_id is not None:
        job_id_ctx.set(job_id)
    if resource_id is not None:
        resource_id_ctx.set(resource_id)
    if user_id is not None:
        user_id_ctx.set(user_id)


def clear_log_context() -> None:
    """Clears correlation identifiers for the current async context."""
    request_id_ctx.set(None)
    job_id_ctx.set(None)
    resource_id_ctx.set(None)
    user_id_ctx.set(None)


def get_log_context() -> Dict[str, Optional[str]]:
    return {
        "request_id": request_id_ctx.get(),
        "job_id": job_id_ctx.get(),
        "resource_id": resource_id_ctx.get(),
        "user_id": user_id_ctx.get(),
    }


class StructuredJsonFormatter(logging.Formatter):
    """
    Production Structured JSON Log Formatter (Prompt 28).
    Emits timestamp, level, message, logger, and contextual correlation IDs
    (request_id, job_id, resource_id, user_id) while redacting all sensitive credentials.
    """

    def format(self, record: logging.LogRecord) -> str:
        raw_msg = record.getMessage()
        safe_msg = redact_sensitive_text(raw_msg)

        log_obj: Dict[str, Any] = {
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "level": record.levelname,
            "message": safe_msg,
            "logger": record.name,
        }

        req_id = getattr(record, "request_id", None) or request_id_ctx.get()
        job_id = getattr(record, "job_id", None) or job_id_ctx.get()
        res_id = getattr(record, "resource_id", None) or resource_id_ctx.get()
        usr_id = getattr(record, "user_id", None) or user_id_ctx.get()

        if req_id:
            log_obj["request_id"] = req_id
        if job_id:
            log_obj["job_id"] = job_id
        if res_id:
            log_obj["resource_id"] = res_id
        if usr_id:
            log_obj["user_id"] = usr_id

        if record.exc_info:
            log_obj["exception"] = redact_sensitive_text(self.formatException(record.exc_info))
        return json.dumps(log_obj)


def get_logger(name: str) -> logging.Logger:
    logger = logging.getLogger(name)
    if not logger.handlers:
        handler = logging.StreamHandler(sys.stdout)
        handler.setFormatter(StructuredJsonFormatter())
        logger.addHandler(handler)
        logger.setLevel(logging.INFO)
    return logger
