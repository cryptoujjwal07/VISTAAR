import uuid
from datetime import datetime, timezone
from typing import Optional, Literal, List
from fastapi import APIRouter, HTTPException, status, Depends, Request, Query
from pydantic import BaseModel, EmailStr, Field
from jose import JWTError, jwt

from apps.api.core.config import settings
from apps.api.core.database import get_database
from apps.api.core.security import (
    verify_password,
    get_password_hash,
    create_access_token,
    create_refresh_token,
    revoke_token,
    is_token_revoked,
    get_current_user,
    require_roles,
    require_permission,
    verify_ownership,
    login_rate_limiter,
    UserRole,
    UserPersona,
    ROLE_PERMISSIONS
)
from apps.api.domains.audit.service import record_audit_event

router = APIRouter(prefix="/auth", tags=["Authentication & RBAC"])

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class RegisterRequest(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=8)
    name: str = Field(..., min_length=2)
    role: Optional[str] = 'PUBLIC_USER'
    persona: Optional[Literal['STUDENT', 'TEACHER', 'JOURNALIST', 'RESEARCHER', 'SCIENTIST']] = 'STUDENT'
    organization: Optional[str] = None
    country: Optional[str] = "India"
    state: Optional[str] = None
    district: Optional[str] = None
    city: Optional[str] = None
    student_id: Optional[str] = None
    class_grade: Optional[str] = None
    subject: Optional[str] = None
    designation: Optional[str] = None
    research_domain: Optional[str] = None
    department: Optional[str] = None
    orcid: Optional[str] = None
    preferred_language: Optional[str] = "en"

class RefreshTokenRequest(BaseModel):
    refresh_token: str

class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str = Field(..., min_length=8)

class RoleUpdateRequest(BaseModel):
    role: Literal[
        'SUPER_ADMIN', 'ADMIN', 'OUTREACH_EDITOR', 'FIELD_SCIENTIST',
        'SCIENTIST', 'RESEARCHER', 'JOURNALIST', 'TEACHER', 'STUDENT', 'PUBLIC_USER'
    ]
    reason: Optional[str] = None

class RoleApplicationReviewRequest(BaseModel):
    action: Literal['APPROVE', 'REJECT', 'REQUEST_INFO', 'SUSPEND']
    reason: str = Field(..., min_length=3)

class StatusUpdateRequest(BaseModel):
    is_active: bool
    reason: Optional[str] = None

class DraftSubmissionRequest(BaseModel):
    title: str = Field(..., min_length=3)
    station_id: str
    category: Literal['DATASET', 'DOCUMENT', 'FIELD_OBSERVATION']
    summary: str
    content_payload: Optional[dict] = None

class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    user: dict

@router.post("/login", response_model=TokenResponse)
async def login(req: LoginRequest, request: Request):
    email_key = req.email.lower()
    
    # 1. Rate limiting check (Prompt 07)
    is_locked, remaining_seconds = login_rate_limiter.is_locked(email_key)
    if is_locked:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=f"Rate limit exceeded: Too many failed login attempts. Please retry in {remaining_seconds} seconds."
        )

    db = get_database()
    user = await db.users.find_one({"email": email_key})

    # Auto-seed initial root super admin if credentials match
    if not user and email_key == settings.SUPER_ADMIN_EMAIL.lower() and req.password == settings.SUPER_ADMIN_PASSWORD:
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

    # 2. Verify credentials
    if not user or not verify_password(req.password, user.get("password_hash", "")):
        login_rate_limiter.record_failure(email_key)
        await record_audit_event(
            actor_id="anonymous",
            actor_email=email_key,
            action="LOGIN_FAILED",
            resource_type="AUTH",
            resource_id=email_key,
            reason="Invalid credentials"
        )
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )

    # 3. Check account status
    if not user.get("is_active", True):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is deactivated. Contact system administrator."
        )

    # Clear rate limiter upon successful authentication
    login_rate_limiter.clear(email_key)

    # 4. Generate Tokens
    token_data = {"sub": user["email"], "role": user["role"], "uid": user["id"]}
    access_token = create_access_token(token_data)
    refresh_token = create_refresh_token(token_data)

    user_payload = {
        "id": user["id"],
        "email": user["email"],
        "name": user["name"],
        "role": user["role"],
        "persona": user.get("persona"),
        "organization": user.get("organization"),
        "permissions": list(ROLE_PERMISSIONS.get(user["role"], set()))
    }

    # 5. Audit Login
    await record_audit_event(
        actor_id=user["id"],
        actor_email=user["email"],
        action="LOGIN_SUCCESS",
        resource_type="AUTH",
        resource_id=user["id"]
    )

    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer",
        "user": user_payload
    }

@router.post("/logout")
async def logout(current_user=Depends(get_current_user)):
    """Revokes the current JWT session and records audit event."""
    current_jti = current_user.get("current_jti")
    if current_jti:
        await revoke_token(current_jti)

    await record_audit_event(
        actor_id=current_user["id"],
        actor_email=current_user["email"],
        action="LOGOUT",
        resource_type="AUTH",
        resource_id=current_user["id"]
    )
    return {"message": "Successfully logged out and session revoked."}

@router.post("/refresh", response_model=TokenResponse)
async def refresh_access_token(req: RefreshTokenRequest):
    """
    Validates refresh token, implements single-use rotation, and returns new token pair.
    """
    try:
        payload = jwt.decode(req.refresh_token, settings.JWT_SECRET, algorithms=[settings.JWT_ALGORITHM])
        email: str = payload.get("sub")
        token_type: str = payload.get("type")
        jti: Optional[str] = payload.get("jti")

        if not email or token_type != "refresh":
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid refresh token")

        if await is_token_revoked(jti):
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Refresh token has been revoked")

    except JWTError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Refresh token expired or malformed")

    db = get_database()
    user = await db.users.find_one({"email": email})
    if not user or not user.get("is_active", True):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User account inactive or missing")

    # Rotate token: revoke old refresh token
    if jti:
        await revoke_token(jti)

    token_data = {"sub": user["email"], "role": user["role"], "uid": user["id"]}
    new_access_token = create_access_token(token_data)
    new_refresh_token = create_refresh_token(token_data)

    user_payload = {
        "id": user["id"],
        "email": user["email"],
        "name": user["name"],
        "role": user["role"],
        "persona": user.get("persona"),
        "organization": user.get("organization"),
        "permissions": list(ROLE_PERMISSIONS.get(user["role"], set()))
    }

    return {
        "access_token": new_access_token,
        "refresh_token": new_refresh_token,
        "token_type": "bearer",
        "user": user_payload
    }

@router.post("/register", response_model=TokenResponse)
async def register(req: RegisterRequest):
    """
    Registers a new public user or field scientist.
    Guarantees vertical privilege escalation prevention: non-admins cannot register as SUPER_ADMIN or OUTREACH_EDITOR.
    """
    if req.role in ['SUPER_ADMIN', 'OUTREACH_EDITOR']:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Privilege Escalation Protection: Direct registration for administrative roles is prohibited."
        )

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

    await record_audit_event(
        actor_id=user_id,
        actor_email=user_doc["email"],
        action="REGISTER",
        resource_type="AUTH",
        resource_id=user_id,
        details={"role": req.role, "persona": req.persona}
    )

    token_data = {"sub": user_doc["email"], "role": user_doc["role"], "uid": user_id}
    access_token = create_access_token(token_data)
    refresh_token = create_refresh_token(token_data)

    user_payload = {
        "id": user_id,
        "email": user_doc["email"],
        "name": user_doc["name"],
        "role": user_doc["role"],
        "persona": user_doc.get("persona"),
        "organization": user_doc.get("organization"),
        "permissions": list(ROLE_PERMISSIONS.get(user_doc["role"], set()))
    }

    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer",
        "user": user_payload
    }

@router.get("/me")
async def get_current_user_profile(user=Depends(get_current_user)):
    """Returns profile and computed permissions for currently authenticated user."""
    return {
        "id": user["id"],
        "email": user["email"],
        "name": user["name"],
        "role": user["role"],
        "persona": user.get("persona"),
        "organization": user.get("organization"),
        "permissions": user.get("permissions", [])
    }

@router.post("/change-password")
async def change_password(req: ChangePasswordRequest, current_user=Depends(get_current_user)):
    """Allows current user to change password after verifying current credentials."""
    if not verify_password(req.current_password, current_user.get("password_hash", "")):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Current password verification failed."
        )

    new_hash = get_password_hash(req.new_password)
    db = get_database()
    await db.users.update_one(
        {"id": current_user["id"]},
        {"$set": {"password_hash": new_hash, "updated_at": datetime.now(timezone.utc).isoformat()}}
    )

    await record_audit_event(
        actor_id=current_user["id"],
        actor_email=current_user["email"],
        action="PASSWORD_CHANGED",
        resource_type="AUTH",
        resource_id=current_user["id"]
    )

    return {"message": "Password updated successfully."}

# =========================================================================
# Administrative User & Role Governance Endpoints (SUPER_ADMIN only)
# =========================================================================

@router.get("/users")
async def list_users(
    role: Optional[str] = None,
    search: Optional[str] = None,
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
    current_user=Depends(require_roles(["SUPER_ADMIN"]))
):
    """SUPER_ADMIN only: retrieves platform user directory with role filters."""
    db = get_database()
    query = {}
    if role:
        query["role"] = role.upper()
    if search:
        query["$or"] = [
            {"email": {"$regex": search, "$options": "i"}},
            {"name": {"$regex": search, "$options": "i"}}
        ]

    cursor = db.users.find(query, {"password_hash": 0, "_id": 0}).skip(offset).limit(limit)
    items = await cursor.to_list(length=limit)
    total = await db.users.count_documents(query)

    return {"total": total, "items": items, "limit": limit, "offset": offset}

@router.patch("/users/{user_id}/role")
async def update_user_role(
    user_id: str,
    req: RoleUpdateRequest,
    current_user=Depends(require_roles(["SUPER_ADMIN"]))
):
    """
    SUPER_ADMIN only: modifies a user's role and audits the permission transition.
    Prevents demotion of root primary administrator.
    """
    db = get_database()
    target_user = await db.users.find_one({"id": user_id})
    if not target_user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Target user not found")

    if target_user["email"].lower() == settings.SUPER_ADMIN_EMAIL.lower() and req.role != "SUPER_ADMIN":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot demote the primary root super administrator account."
        )

    old_role = target_user.get("role", "PUBLIC_USER")
    new_role = req.role

    await db.users.update_one(
        {"id": user_id},
        {"$set": {"role": new_role, "updated_at": datetime.now(timezone.utc).isoformat()}}
    )

    await record_audit_event(
        actor_id=current_user["id"],
        actor_email=current_user["email"],
        action="ROLE_CHANGED",
        resource_type="USER",
        resource_id=user_id,
        reason=req.reason,
        before_version=old_role,
        after_version=new_role,
        details={"target_email": target_user["email"]}
    )

    return {
        "user_id": user_id,
        "email": target_user["email"],
        "previous_role": old_role,
        "current_role": new_role
    }

@router.patch("/users/{user_id}/status")
async def update_user_status(
    user_id: str,
    req: StatusUpdateRequest,
    current_user=Depends(require_roles(["SUPER_ADMIN"]))
):
    """
    SUPER_ADMIN only: activates or suspends a user account.
    """
    db = get_database()
    target_user = await db.users.find_one({"id": user_id})
    if not target_user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Target user not found")

    if target_user["email"].lower() == settings.SUPER_ADMIN_EMAIL.lower() and not req.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot deactivate the primary root super administrator account."
        )

    old_status = target_user.get("is_active", True)
    await db.users.update_one(
        {"id": user_id},
        {"$set": {"is_active": req.is_active, "updated_at": datetime.now(timezone.utc).isoformat()}}
    )

    await record_audit_event(
        actor_id=current_user["id"],
        actor_email=current_user["email"],
        action="USER_STATUS_CHANGED",
        resource_type="USER",
        resource_id=user_id,
        reason=req.reason,
        before_version={"is_active": old_status},
        after_version={"is_active": req.is_active},
        details={"target_email": target_user["email"]}
    )

    return {
        "user_id": user_id,
        "email": target_user["email"],
        "is_active": req.is_active
    }

# =========================================================================
# Field Scientist Submissions & IDOR Protection (Prompt 07)
# =========================================================================

@router.post("/submissions")
async def create_draft_submission(
    req: DraftSubmissionRequest,
    current_user=Depends(require_roles(["SUPER_ADMIN", "OUTREACH_EDITOR", "FIELD_SCIENTIST"]))
):
    """
    FIELD_SCIENTIST / EDITOR / ADMIN: creates a new scientific draft submission.
    """
    db = get_database()
    sub_id = f"sub_{uuid.uuid4().hex[:12]}"
    now = datetime.now(timezone.utc).isoformat()

    doc = {
        "submission_id": sub_id,
        "title": req.title,
        "station_id": req.station_id.lower(),
        "category": req.category,
        "summary": req.summary,
        "content_payload": req.content_payload or {},
        "author_id": current_user["id"],
        "author_email": current_user["email"],
        "status": "DRAFT",
        "created_at": now,
        "updated_at": now
    }
    await db.submissions.insert_one(doc)

    await record_audit_event(
        actor_id=current_user["id"],
        actor_email=current_user["email"],
        action="CREATE_DRAFT_SUBMISSION",
        resource_type="SUBMISSION",
        resource_id=sub_id,
        details={"title": req.title, "station_id": req.station_id}
    )

    return {"submission_id": sub_id, "status": "DRAFT", "message": "Draft created successfully"}

@router.get("/submissions")
async def list_submissions(
    current_user=Depends(require_roles(["SUPER_ADMIN", "OUTREACH_EDITOR", "FIELD_SCIENTIST"]))
):
    """
    List submissions with strict IDOR protection:
    - FIELD_SCIENTIST can only view their OWN submissions.
    - SUPER_ADMIN and OUTREACH_EDITOR can view all submissions.
    """
    db = get_database()
    query = {}
    if current_user["role"] == "FIELD_SCIENTIST":
        query["author_id"] = current_user["id"]

    cursor = db.submissions.find(query, {"_id": 0}).sort("created_at", -1)
    items = await cursor.to_list(length=100)
    return {"items": items, "count": len(items)}

@router.get("/submissions/{submission_id}")
async def get_submission_details(
    submission_id: str,
    current_user=Depends(require_roles(["SUPER_ADMIN", "OUTREACH_EDITOR", "FIELD_SCIENTIST"]))
):
    """
    Retrieves draft submission details with IDOR verification.
    Raises 403 if a Field Scientist tries to inspect another scientist's submission.
    """
    db = get_database()
    sub = await db.submissions.find_one({"submission_id": submission_id}, {"_id": 0})
    if not sub:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Submission not found")

    # IDOR check: author must match current user, or user must be SUPER_ADMIN / OUTREACH_EDITOR
    verify_ownership(sub.get("author_id"), current_user, allow_roles=["SUPER_ADMIN", "OUTREACH_EDITOR"])

    return sub


# =========================================================================
# Structured Location Hierarchy & Role Verification Queue (Sections 10, 12, 36)
# =========================================================================

LOCATION_HIERARCHY = {
    "countries": [
        {
            "id": "IN",
            "name": "India",
            "states_and_uts": [
                {
                    "id": "GA",
                    "name": "Goa",
                    "districts": [
                        {
                            "id": "GA-SG",
                            "name": "South Goa",
                            "cities": ["Vasco da Gama", "Margao", "Mormugao"],
                            "institutions": ["National Centre for Polar and Ocean Research (NCPOR)", "Goa University"],
                        },
                        {
                            "id": "GA-NG",
                            "name": "North Goa",
                            "cities": ["Panaji", "Mapusa"],
                            "institutions": ["CSIR-National Institute of Oceanography (NIO)"],
                        },
                    ],
                },
                {
                    "id": "DL",
                    "name": "Delhi (NCT)",
                    "districts": [
                        {
                            "id": "DL-ND",
                            "name": "New Delhi",
                            "cities": ["New Delhi"],
                            "institutions": [
                                "Ministry of Earth Sciences (MoES), Prithvi Bhavan",
                                "India Meteorological Department (IMD)",
                                "NCERT",
                                "IIT Delhi",
                                "Jawaharlal Nehru University (JNU)",
                            ],
                        }
                    ],
                },
                {
                    "id": "HP",
                    "name": "Himachal Pradesh",
                    "districts": [
                        {
                            "id": "HP-LS",
                            "name": "Lahaul and Spiti",
                            "cities": ["Kaza", "Keylong", "Chandra Basin (Himansh)"],
                            "institutions": ["Himansh Glaciological Station (NCPOR)", "SASE / DGRE"],
                        }
                    ],
                },
                {
                    "id": "MH",
                    "name": "Maharashtra",
                    "districts": [
                        {
                            "id": "MH-MC",
                            "name": "Mumbai",
                            "cities": ["Mumbai", "Navi Mumbai"],
                            "institutions": ["Indian Institute of Geomagnetism (IIG)", "IIT Bombay"],
                        },
                        {
                            "id": "MH-PN",
                            "name": "Pune",
                            "cities": ["Pune"],
                            "institutions": ["Indian Institute of Tropical Meteorology (IITM)", "IMD Pune"],
                        },
                    ],
                },
                {
                    "id": "KA",
                    "name": "Karnataka",
                    "districts": [
                        {
                            "id": "KA-BL",
                            "name": "Bengaluru Urban",
                            "cities": ["Bengaluru"],
                            "institutions": ["Indian Institute of Science (IISc)", "ISRO / NRSC"],
                        }
                    ],
                },
                {
                    "id": "TN",
                    "name": "Tamil Nadu",
                    "districts": [
                        {
                            "id": "TN-CH",
                            "name": "Chennai",
                            "cities": ["Chennai"],
                            "institutions": ["National Institute of Ocean Technology (NIOT)", "IIT Madras"],
                        }
                    ],
                },
            ],
        },
        {
            "id": "NO",
            "name": "Norway (Svalbard Arctic Treaty Zone)",
            "states_and_uts": [
                {
                    "id": "NO-SV",
                    "name": "Svalbard",
                    "districts": [
                        {
                            "id": "NO-SV-NYA",
                            "name": "Kongsfjorden",
                            "cities": ["Ny-Ålesund"],
                            "institutions": ["Himadri Arctic Research Station (NCPOR)"],
                        }
                    ],
                }
            ],
        },
    ]
}


@router.get("/locations/hierarchy")
async def get_location_hierarchy():
    """Returns the structured Country -> State/UT -> District -> City -> Institution hierarchy (Section 12)."""
    return LOCATION_HIERARCHY


class RoleApplicationRequest(BaseModel):
    requested_role: Literal["SCIENTIST", "FIELD_SCIENTIST", "RESEARCHER", "JOURNALIST", "TEACHER"]
    institution: str = Field(..., min_length=2)
    designation: str = Field(..., min_length=2)
    research_domain: Optional[str] = None
    department: Optional[str] = None
    orcid: Optional[str] = None
    country: str = "India"
    state: Optional[str] = None
    district: Optional[str] = None
    city: Optional[str] = None
    supporting_notes: Optional[str] = None


@router.post("/role-applications")
async def submit_role_application(
    req: RoleApplicationRequest,
    current_user=Depends(get_current_user),
):
    """
    Allows a Scientist, Researcher, Journalist, or Teacher applicant to submit a formal
    verification request for Admin review (Sections 10, 11, 36).
    """
    db = get_database()
    app_id = f"app_{uuid.uuid4().hex[:12]}"
    now = datetime.now(timezone.utc).isoformat()
    doc = {
        "application_id": app_id,
        "user_id": current_user["id"],
        "email": current_user["email"],
        "name": current_user.get("name"),
        "current_role": current_user.get("role", "PUBLIC_USER"),
        "requested_role": req.requested_role,
        "institution": req.institution,
        "designation": req.designation,
        "research_domain": req.research_domain,
        "department": req.department,
        "orcid": req.orcid,
        "location": {
            "country": req.country,
            "state": req.state,
            "district": req.district,
            "city": req.city,
        },
        "supporting_notes": req.supporting_notes,
        "verification_status": "PENDING_REVIEW",
        "created_at": now,
        "updated_at": now,
    }
    await db.role_applications.insert_one(doc)
    await record_audit_event(
        actor_id=current_user["id"],
        actor_email=current_user["email"],
        action="ROLE_APPLICATION_SUBMITTED",
        resource_type="ROLE_APPLICATION",
        resource_id=app_id,
        details={"requested_role": req.requested_role, "institution": req.institution},
    )
    doc.pop("_id", None)
    return doc


@router.get("/role-applications")
async def list_role_applications(
    status_filter: Optional[str] = Query(None, alias="status"),
    current_user=Depends(require_roles(["SUPER_ADMIN", "ADMIN"])),
):
    """SUPER_ADMIN / ADMIN only: retrieves pending and historical role verification requests (Section 36)."""
    db = get_database()
    q = {}
    if status_filter:
        q["verification_status"] = status_filter.upper()
    items = await db.role_applications.find(q, {"_id": 0}).sort("created_at", -1).to_list(length=100)
    return {"items": items, "count": len(items)}


@router.patch("/role-applications/{application_id}")
async def review_role_application(
    application_id: str,
    req: RoleApplicationReviewRequest,
    current_user=Depends(require_roles(["SUPER_ADMIN", "ADMIN"])),
):
    """
    SUPER_ADMIN / ADMIN only: Approve, Reject, Request More Information, or Suspend a role application.
    Records full audit log (user_id, admin_id, timestamp, action, reason, previous_state, new_state).
    """
    db = get_database()
    app_doc = await db.role_applications.find_one({"application_id": application_id})
    if not app_doc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Role application not found")

    prev_state = app_doc.get("verification_status", "PENDING_REVIEW")
    now = datetime.now(timezone.utc).isoformat()
    status_map = {
        "APPROVE": "APPROVED",
        "REJECT": "REJECTED",
        "REQUEST_INFO": "MORE_INFO_REQUESTED",
        "SUSPEND": "SUSPENDED",
    }
    new_state = status_map[req.action]

    await db.role_applications.update_one(
        {"application_id": application_id},
        {
            "$set": {
                "verification_status": new_state,
                "reviewed_by": current_user["id"],
                "reviewed_by_email": current_user["email"],
                "review_reason": req.reason,
                "updated_at": now,
            }
        },
    )

    if req.action == "APPROVE":
        await db.users.update_one(
            {"id": app_doc["user_id"]},
            {"$set": {"role": app_doc["requested_role"], "updated_at": now}},
        )
    elif req.action == "SUSPEND":
        await db.users.update_one(
            {"id": app_doc["user_id"]},
            {"$set": {"is_active": False, "updated_at": now}},
        )

    await record_audit_event(
        actor_id=current_user["id"],
        actor_email=current_user["email"],
        action=f"ROLE_APPLICATION_{req.action}",
        resource_type="ROLE_APPLICATION",
        resource_id=application_id,
        reason=req.reason,
        before_version={"verification_status": prev_state, "role": app_doc.get("current_role")},
        after_version={"verification_status": new_state, "role": app_doc.get("requested_role")},
        details={
            "user_id": app_doc["user_id"],
            "admin_id": current_user["id"],
            "timestamp": now,
            "action": req.action,
            "previous_state": prev_state,
            "new_state": new_state,
        },
    )

    return {
        "application_id": application_id,
        "user_id": app_doc["user_id"],
        "admin_id": current_user["id"],
        "timestamp": now,
        "action": req.action,
        "reason": req.reason,
        "previous_state": prev_state,
        "new_state": new_state,
    }

