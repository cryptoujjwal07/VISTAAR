import bcrypt
import time
import uuid
from enum import Enum
from datetime import datetime, timedelta, timezone
from typing import Optional, List, Set, Dict, Any
from fastapi import Depends, HTTPException, status, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import JWTError, jwt
from apps.api.core.config import settings
from apps.api.core.database import get_database

security_bearer = HTTPBearer(auto_error=False)

class UserRole(str, Enum):
    ADMIN = "ADMIN"
    SUPER_ADMIN = "SUPER_ADMIN"  # Administrative alias for system root
    SCIENTIST = "SCIENTIST"
    RESEARCHER = "RESEARCHER"
    TEACHER = "TEACHER"
    STUDENT = "STUDENT"
    # Legacy aliases mapped to core roles
    FIELD_SCIENTIST = "SCIENTIST"
    OUTREACH_EDITOR = "ADMIN"
    JOURNALIST = "RESEARCHER"
    PUBLIC_USER = "STUDENT"

class UserPersona(str, Enum):
    SCIENTIST = "SCIENTIST"
    RESEARCHER = "RESEARCHER"
    TEACHER = "TEACHER"
    STUDENT = "STUDENT"
    ADMIN = "ADMIN"

ROLE_PERMISSIONS: Dict[str, Set[str]] = {
    "ADMIN": {"*"},
    "SUPER_ADMIN": {"*"},
    "SCIENTIST": {
        "datasets:upload", "documents:upload", "drafts:create",
        "submissions:read_own", "submissions:edit_own",
        "datasets:view", "documents:view", "media:view", "media:upload", "media:upload_draft",
        "research:create", "research:edit_own"
    },
    "FIELD_SCIENTIST": {
        "datasets:upload", "documents:upload", "drafts:create",
        "submissions:read_own", "submissions:edit_own",
        "datasets:view", "documents:view", "media:view", "media:upload", "media:upload_draft",
        "research:create", "research:edit_own"
    },
    "RESEARCHER": {
        "datasets:view", "documents:view", "media:view", "rag:query",
        "search:execute", "citations:export", "projects:read",
        "findings:create", "findings:edit_own", "analysis:execute"
    },
    "TEACHER": {
        "content:read_public", "datasets:read_public", "media:read_public",
        "education:view", "classroom:manage", "quiz:create", "lesson:create",
        "activity:create", "analytics:classroom", "search:execute"
    },
    "STUDENT": {
        "content:read_public", "datasets:read_public", "media:read_public",
        "education:view", "quiz:submit", "activity:submit", "progress:read_own", "search:execute"
    },
    "PUBLIC_USER": {
        "content:read_public", "datasets:read_public", "media:read_public",
        "education:view", "search:execute"
    }
}

class LoginRateLimiter:
    """
    Sliding window rate limiter to prevent credential brute force.
    Locks key after max_attempts failures within window_seconds.
    """
    def __init__(self, max_attempts: int = 5, window_seconds: int = 300, lockout_seconds: int = 900):
        self.max_attempts = max_attempts
        self.window_seconds = window_seconds
        self.lockout_seconds = lockout_seconds
        self._attempts: Dict[str, List[float]] = {}
        self._lockouts: Dict[str, float] = {}

    def is_locked(self, key: str) -> tuple[bool, int]:
        now = time.time()
        if key in self._lockouts:
            remaining = int(self._lockouts[key] - now)
            if remaining > 0:
                return True, remaining
            del self._lockouts[key]
        return False, 0

    def record_failure(self, key: str):
        now = time.time()
        if key not in self._attempts:
            self._attempts[key] = []
        self._attempts[key] = [t for t in self._attempts[key] if now - t < self.window_seconds]
        self._attempts[key].append(now)
        if len(self._attempts[key]) >= self.max_attempts:
            self._lockouts[key] = now + self.lockout_seconds
            self._attempts[key] = []

    def clear(self, key: str):
        self._attempts.pop(key, None)
        self._lockouts.pop(key, None)

login_rate_limiter = LoginRateLimiter(max_attempts=5, window_seconds=300, lockout_seconds=900)

# In-memory revocation cache for instant sub-millisecond lookups
_revoked_token_jtis: Set[str] = set()

def verify_password(plain_password: str, hashed_password: str) -> bool:
    try:
        pw_bytes = plain_password.encode('utf-8')[:72]
        return bcrypt.checkpw(pw_bytes, hashed_password.encode('utf-8'))
    except Exception:
        return False

def get_password_hash(password: str) -> str:
    pw_bytes = password.encode('utf-8')[:72]
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(pw_bytes, salt).decode('utf-8')

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + (expires_delta or timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES))
    jti = f"jti_{uuid.uuid4().hex[:16]}"
    to_encode.update({"exp": expire, "type": "access", "jti": jti})
    return jwt.encode(to_encode, settings.JWT_SECRET, algorithm=settings.JWT_ALGORITHM)

def create_refresh_token(data: dict) -> str:
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
    jti = f"jti_{uuid.uuid4().hex[:16]}"
    to_encode.update({"exp": expire, "type": "refresh", "jti": jti})
    return jwt.encode(to_encode, settings.JWT_SECRET, algorithm=settings.JWT_ALGORITHM)

async def revoke_token(jti: str, exp: Optional[int] = None):
    """Blacklists a token so it cannot be used again."""
    _revoked_token_jtis.add(jti)
    try:
        db = get_database()
        await db.revoked_tokens.insert_one({
            "jti": jti,
            "revoked_at": datetime.now(timezone.utc).isoformat(),
            "exp": exp
        })
    except Exception:
        pass

async def is_token_revoked(jti: Optional[str]) -> bool:
    if not jti:
        return False
    if jti in _revoked_token_jtis:
        return True
    try:
        db = get_database()
        record = await db.revoked_tokens.find_one({"jti": jti})
        if record:
            _revoked_token_jtis.add(jti)
            return True
    except Exception:
        pass
    return False

async def get_current_user(credentials: Optional[HTTPAuthorizationCredentials] = Depends(security_bearer)) -> dict:
    if not credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required",
            headers={"WWW-Authenticate": "Bearer"},
        )
    token = credentials.credentials
    try:
        payload = jwt.decode(token, settings.JWT_SECRET, algorithms=[settings.JWT_ALGORITHM])
        email: str = payload.get("sub")
        role: str = payload.get("role")
        token_type: str = payload.get("type")
        jti: Optional[str] = payload.get("jti")

        if email is None or token_type != "access":
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token payload or token type")

        if await is_token_revoked(jti):
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token has been revoked or logged out")

    except JWTError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token validation failed or expired")

    db = get_database()
    user = await db.users.find_one({"email": email})
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User account not found")
    if not user.get("is_active", True):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Inactive or suspended user account")

    # Attach computed permissions & structured logging user_id context (Prompt 28)
    user_role = user.get("role", "PUBLIC_USER")
    permissions = ROLE_PERMISSIONS.get(user_role, set())
    user["permissions"] = list(permissions)
    user["current_jti"] = jti

    from apps.api.core.logging import set_log_context
    set_log_context(user_id=str(user.get("id") or user.get("email")))

    return user

async def get_current_user_optional(credentials: Optional[HTTPAuthorizationCredentials] = Depends(security_bearer)) -> Optional[dict]:
    """Optional authentication dependency that returns user dict if valid or None otherwise."""
    if not credentials:
        return None
    try:
        return await get_current_user(credentials)
    except Exception:
        return None

def require_roles(allowed_roles: List[str]):
    """Enforces role-based access control (RBAC) with normalized role aliases."""
    ROLE_EQUIVALENTS: Dict[str, set] = {
        "ADMIN": {"ADMIN", "SUPER_ADMIN"},
        "SUPER_ADMIN": {"ADMIN", "SUPER_ADMIN"},
        "SCIENTIST": {"SCIENTIST", "FIELD_SCIENTIST"},
        "FIELD_SCIENTIST": {"SCIENTIST", "FIELD_SCIENTIST"},
        "RESEARCHER": {"RESEARCHER", "JOURNALIST"},
        "STUDENT": {"STUDENT", "PUBLIC_USER"},
        "PUBLIC_USER": {"STUDENT", "PUBLIC_USER"},
    }

    async def role_checker(user: dict = Depends(get_current_user)):
        user_role = user.get("role", "PUBLIC_USER")
        # Direct check
        if user_role in allowed_roles:
            return user
        
        # Check equivalent roles
        user_aliases = ROLE_EQUIVALENTS.get(user_role, {user_role})
        for role in allowed_roles:
            role_aliases = ROLE_EQUIVALENTS.get(role, {role})
            if user_aliases.intersection(role_aliases):
                return user

        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Operation not permitted. Required role: {', '.join(allowed_roles)}"
        )
    return role_checker

def require_permission(permission: str):
    """Enforces fine-grained permission checks."""
    async def permission_checker(user: dict = Depends(get_current_user)):
        perms = set(user.get("permissions", []))
        if "*" not in perms and permission not in perms:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access denied. Missing required permission: {permission}"
            )
        return user
    return permission_checker

def verify_ownership(resource_owner_id: str, current_user: dict, allow_roles: Optional[List[str]] = None) -> bool:
    """
    Prevents Insecure Direct Object References (IDOR).
    Grants access if the current user owns the resource, or has an authorized override role (e.g. SUPER_ADMIN, ADMIN).
    """
    authorized_roles = allow_roles or ["SUPER_ADMIN", "ADMIN", "OUTREACH_EDITOR"]
    user_role = current_user.get("role", "PUBLIC_USER")

    if user_role in authorized_roles:
        return True

    user_id = str(current_user.get("id"))
    user_email = str(current_user.get("email"))

    if user_id == str(resource_owner_id) or user_email == str(resource_owner_id):
        return True

    raise HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail="IDOR Protection: Access denied. You do not own this resource and lack administrative override permissions."
    )


# ============================================================================
# Prompt 26 Security Hardening Guards
# (Path Traversal, Malicious Filenames, CSV Injection, SSRF, Prompt Injection, Log Redaction)
# ============================================================================

import ipaddress
import os
import re
from urllib.parse import urlparse

DANGEROUS_EXTENSIONS = {
    ".exe", ".bat", ".cmd", ".sh", ".ps1", ".vbs", ".js", ".jar",
    ".msi", ".dll", ".so", ".php", ".jsp", ".asp", ".aspx", ".html", ".htm", ".svg"
}

PROMPT_INJECTION_PATTERNS = [
    re.compile(r"ignore\s+(all\s+)?(previous|prior|above)\s+instructions", re.IGNORECASE),
    re.compile(r"disregard\s+(all\s+)?(previous|prior|system)\s+(instructions|rules|prompts)", re.IGNORECASE),
    re.compile(r"system\s+prompt\s*:", re.IGNORECASE),
    re.compile(r"you\s+are\s+now\s+(in\s+developer\s+mode|unrestricted|dan)", re.IGNORECASE),
    re.compile(r"override\s+system\s+instructions", re.IGNORECASE),
    re.compile(r"<\s*script\b[^>]*>.*?<\s*/\s*script\s*>", re.IGNORECASE | re.DOTALL),
]


def sanitize_filename(filename: str, allowed_extensions: Optional[Set[str]] = None) -> str:
    """
    Validates and sanitizes uploaded or referenced filenames (Prompt 26).
    Blocks path traversal (../, ..\\), null bytes, control chars, shell metacharacters,
    and malicious double extensions (.pdf.exe, .exe.pdf).
    """
    if not filename or not filename.strip():
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid or empty filename.")

    if "\x00" in filename or ".." in filename or "/" in filename or "\\" in filename:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Security violation: Path traversal or illegal path separator in filename.",
        )

    base = os.path.basename(filename.strip())
    if not re.match(r"^[A-Za-z0-9._\- ()]+$", base):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Security violation: Filename contains disallowed special or control characters.",
        )

    parts = base.lower().split(".")
    if len(parts) < 2:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Filename must include a valid file extension.")

    for sub_ext in [f".{p}" for p in parts[1:]]:
        if sub_ext in DANGEROUS_EXTENSIONS:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Security violation:Executable or dangerous extension '{sub_ext}' is prohibited.",
            )

    final_ext = f".{parts[-1]}"
    if allowed_extensions and final_ext not in {ext.lower() for ext in allowed_extensions}:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported file extension '{final_ext}'. Allowed: {sorted(allowed_extensions)}",
        )

    return base


def sanitize_csv_cell(value: Any) -> str:
    """
    Prevents CSV Formula Injection (DDE / Excel macro injection) while preserving
    legitimate negative scientific measurements like -38.4 (Prompt 26).
    """
    if value is None:
        return ""
    text = str(value)
    if not text:
        return ""

    # Allow legitimate negative/positive numbers (e.g., -38.4, +12.5)
    if re.match(r"^[-+]?\d+(\.\d+)?([eE][-+]?\d+)?$", text.strip()):
        return text

    if text[0] in ("=", "+", "-", "@", "\t", "\r"):
        return f"'{text}"
    return text


def validate_outbound_url_against_ssrf(url: str) -> str:
    """
    Blocks Server-Side Request Forgery (SSRF) against loopback, link-local cloud metadata
    (169.254.169.254), private RFC1918 networks, and non-HTTP(S) schemes (Prompt 26).
    """
    parsed = urlparse(url.strip())
    if parsed.scheme not in ("http", "https"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"SSRF Protection: Disallowed URL scheme '{parsed.scheme}'. Only http/https allowed.",
        )

    host = (parsed.hostname or "").lower().strip()
    if not host or host in ("localhost", "0.0.0.0", "::1", "metadata.google.internal"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="SSRF Protection: Loopback and internal metadata hosts are blocked.",
        )

    try:
        ip_obj = ipaddress.ip_address(host)
        if (
            ip_obj.is_loopback
            or ip_obj.is_private
            or ip_obj.is_link_local
            or ip_obj.is_multicast
            or ip_obj.is_reserved
            or ip_obj.is_unspecified
        ):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"SSRF Protection: Private, loopback, or link-local IP '{host}' is blocked.",
            )
    except ValueError:
        # Hostname is a domain name; block internal suffixes
        if host.endswith(".local") or host.endswith(".internal"):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="SSRF Protection: Internal domain suffixes are blocked.",
            )

    return url


def sanitize_untrusted_document_text(text: str) -> Dict[str, Any]:
    """
    Treats uploaded documents and retrieved chunks strictly as untrusted DATA (Prompt 26).
    Neutralizes prompt injection instructions ('Ignore previous instructions', etc.) and XSS tags
    so retrieved text never overrides system instructions.
    """
    if not text:
        return {
            "clean_text": "",
            "prompt_injection_detected": False,
            "matched_patterns": [],
            "data_envelope": "<UNTRUSTED_SCIENTIFIC_DATA></UNTRUSTED_SCIENTIFIC_DATA>",
        }

    cleaned = text
    matched: List[str] = []
    for pat in PROMPT_INJECTION_PATTERNS:
        found = pat.findall(cleaned)
        if found:
            matched.append(pat.pattern)
            cleaned = pat.sub("[REDACTED_UNTRUSTED_INSTRUCTION]", cleaned)

    # Neutralize raw HTML script/iframe tags for XSS safety
    cleaned = re.sub(r"<\s*(script|iframe|object|embed)\b[^>]*>", "[REDACTED_HTML_TAG]", cleaned, flags=re.IGNORECASE)

    return {
        "clean_text": cleaned,
        "prompt_injection_detected": len(matched) > 0,
        "matched_patterns": matched,
        "data_envelope": f"<UNTRUSTED_SCIENTIFIC_DATA>{cleaned}</UNTRUSTED_SCIENTIFIC_DATA>",
    }


def redact_sensitive_log_text(message: str) -> str:
    """
    Redacts API keys, Bearer JWTs, and password fields from log lines to prevent secret exposure (Prompt 26).
    """
    if not message:
        return ""
    msg = re.sub(r"(Bearer\s+)[A-Za-z0-9\-._~+/]+=*", r"\1[REDACTED_TOKEN]", message)
    msg = re.sub(r"\bAIza[0-9A-Za-z\-_]{20,}\b", "[REDACTED_GEMINI_KEY]", msg)
    msg = re.sub(r"\bsk-[0-9A-Za-z\-_]{16,}\b", "[REDACTED_API_KEY]", msg)
    msg = re.sub(r'("password"\s*:\s*)"[^"]*"', r'\1"[REDACTED]"', msg, flags=re.IGNORECASE)
    return msg

