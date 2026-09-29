import uuid
from datetime import datetime, timezone
from fastapi import APIRouter, HTTPException, status, Depends
from pydantic import BaseModel, EmailStr
from typing import Optional, Literal
from apps.api.core.database import get_database
from apps.api.core.security import (
    verify_password,
    get_password_hash,
    create_access_token,
    create_refresh_token,
    get_current_user
)
from apps.api.core.config import settings

router = APIRouter(prefix="/auth", tags=["Authentication & RBAC"])

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class RegisterRequest(BaseModel):
    email: EmailStr
    password: str
    name: str
    role: Literal['PUBLIC_USER', 'FIELD_SCIENTIST', 'OUTREACH_EDITOR'] = 'PUBLIC_USER'
    persona: Optional[Literal['STUDENT', 'TEACHER', 'JOURNALIST', 'SCIENTIST']] = 'STUDENT'
    organization: Optional[str] = None

class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    user: dict

@router.post("/login", response_model=TokenResponse)
async def login(req: LoginRequest):
    db = get_database()
    user = await db.users.find_one({"email": req.email.lower()})
    
    # Auto-seed admin if logging in with configured admin credentials for the first time
    if not user and req.email.lower() == settings.SUPER_ADMIN_EMAIL.lower() and req.password == settings.SUPER_ADMIN_PASSWORD:
        admin_doc = {
            "id": f"usr_{uuid.uuid4().hex[:12]}",
            "email": settings.SUPER_ADMIN_EMAIL.lower(),
            "password_hash": get_password_hash(settings.SUPER_ADMIN_PASSWORD),
            "name": "VISTAAR Lead Administrator",
            "role": "SUPER_ADMIN",
            "is_active": True,
            "created_at": datetime.now(timezone.utc).isoformat(),
            "updated_at": datetime.now(timezone.utc).isoformat()
        }
        await db.users.insert_one(admin_doc)
        user = admin_doc

    if not user or not verify_password(req.password, user.get("password_hash", "")):
        # Audit failed login attempt
        await db.audit_events.insert_one({
            "event_id": f"aud_{uuid.uuid4().hex[:12]}",
            "actor_id": "anonymous",
            "actor_email": req.email,
            "action": "LOGIN_FAILED",
            "resource_type": "AUTH",
            "resource_id": req.email,
            "timestamp": datetime.now(timezone.utc).isoformat()
        })
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )

    token_data = {"sub": user["email"], "role": user["role"], "uid": user["id"]}
    access_token = create_access_token(token_data)
    refresh_token = create_refresh_token(token_data)

    user_payload = {
        "id": user["id"],
        "email": user["email"],
        "name": user["name"],
        "role": user["role"],
        "persona": user.get("persona"),
        "organization": user.get("organization")
    }

    # Audit successful login
    await db.audit_events.insert_one({
        "event_id": f"aud_{uuid.uuid4().hex[:12]}",
        "actor_id": user["id"],
        "actor_email": user["email"],
        "action": "LOGIN_SUCCESS",
        "resource_type": "AUTH",
        "resource_id": user["id"],
        "timestamp": datetime.now(timezone.utc).isoformat()
    })

    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer",
        "user": user_payload
    }

@router.post("/register", response_model=TokenResponse)
async def register(req: RegisterRequest):
    db = get_database()
    existing = await db.users.find_one({"email": req.email.lower()})
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An account with this email address already exists."
        )

    user_id = f"usr_{uuid.uuid4().hex[:12]}"
    now = datetime.now(timezone.utc).isoformat()
    user_doc = {
        "id": user_id,
        "email": req.email.lower(),
        "password_hash": get_password_hash(req.password),
        "name": req.name,
        "role": req.role,
        "persona": req.persona,
        "organization": req.organization,
        "is_active": True,
        "created_at": now,
        "updated_at": now
    }
    await db.users.insert_one(user_doc)

    token_data = {"sub": user_doc["email"], "role": user_doc["role"], "uid": user_id}
    access_token = create_access_token(token_data)
    refresh_token = create_refresh_token(token_data)

    user_payload = {
        "id": user_id,
        "email": user_doc["email"],
        "name": user_doc["name"],
        "role": user_doc["role"],
        "persona": user_doc.get("persona"),
        "organization": user_doc.get("organization")
    }

    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer",
        "user": user_payload
    }

@router.get("/me")
async def get_current_user_profile(user=Depends(get_current_user)):
    return {
        "id": user["id"],
        "email": user["email"],
        "name": user["name"],
        "role": user["role"],
        "persona": user.get("persona"),
        "organization": user.get("organization")
    }
