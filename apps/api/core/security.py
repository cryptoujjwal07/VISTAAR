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
    SUPER_ADMIN = "SUPER_ADMIN"
    OUTREACH_EDITOR = "OUTREACH_EDITOR"
    FIELD_SCIENTIST = "FIELD_SCIENTIST"
    PUBLIC_USER = "PUBLIC_USER"

class UserPersona(str, Enum):
    STUDENT = "STUDENT"
    TEACHER = "TEACHER"
    JOURNALIST = "JOURNALIST"
    SCIENTIST = "SCIENTIST"

ROLE_PERMISSIONS: Dict[str, Set[str]] = {
    "SUPER_ADMIN": {"*"},
    "OUTREACH_EDITOR": {
        "content:create", "content:edit", "content:review", "content:verify",
        "content:approve", "content:publish", "content:export", "content:archive",
        "datasets:view", "documents:view", "media:view", "media:upload"
    },
    "FIELD_SCIENTIST": {
        "datasets:upload", "documents:upload", "drafts:create",
        "submissions:read_own", "submissions:edit_own",
        "datasets:view", "documents:view", "media:view"
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

    # Attach computed permissions
    user_role = user.get("role", "PUBLIC_USER")
    permissions = ROLE_PERMISSIONS.get(user_role, set())
    user["permissions"] = list(permissions)
    user["current_jti"] = jti

    return user

def require_roles(allowed_roles: List[str]):
    """Enforces role-based access control (RBAC)."""
    async def role_checker(user: dict = Depends(get_current_user)):
        user_role = user.get("role", "PUBLIC_USER")
        if user_role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Operation not permitted. Required role: {', '.join(allowed_roles)}"
            )
        return user
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
    Grants access if the current user owns the resource, or has an authorized override role (e.g. SUPER_ADMIN).
    """
    authorized_roles = allow_roles or ["SUPER_ADMIN", "OUTREACH_EDITOR"]
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
