import uuid
from datetime import datetime, timezone
from typing import Optional, List
from fastapi import APIRouter, HTTPException, Depends, status
from pydantic import BaseModel
from apps.api.core.database import get_database
from apps.api.core.security import get_current_user, require_roles
from apps.api.domains.localization.provider import (
    localization_engine, SUPPORTED_LANGUAGES, TranslationResult
)

router = APIRouter(prefix="/localization", tags=["Multilingual Localization & Bhashini"])

class TranslateRequest(BaseModel):
    text: str
    target_language: str
    source_language: Optional[str] = "en"
    context: Optional[dict] = None

class PublicationTranslationRequest(BaseModel):
    publication_id: str
    target_language: str
    track: Optional[str] = "pib"  # 'pib', 'social', 'education'

class ApproveTranslationRequest(BaseModel):
    translation_id: str
    approved: bool
    notes: Optional[str] = None

@router.get("/languages")
async def get_supported_languages():
    """Returns the list of supported 8th Schedule Indian languages and metadata."""
    return {
        "supported_languages": SUPPORTED_LANGUAGES,
        "default_source": "en",
        "bhashini_enabled": bool(localization_engine.bhashini_key),
        "ai_translation_enabled": bool(localization_engine.gemini_key)
    }

@router.post("/translate", response_model=TranslationResult)
async def translate_text(req: TranslateRequest):
    """
    Translates outreach text into target Indian language with strict numerical
    and scientific terminology preservation.
    """
    if req.target_language not in SUPPORTED_LANGUAGES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Target language '{req.target_language}' is not supported. Supported: {list(SUPPORTED_LANGUAGES.keys())}"
        )
    
    result = await localization_engine.translate(
        text=req.text,
        target_lang=req.target_language,
        source_lang=req.source_language or "en"
    )
    return result

@router.post("/translate-publication")
async def translate_publication(
    req: PublicationTranslationRequest,
    current_user=Depends(require_roles(["SUPER_ADMIN", "OUTREACH_EDITOR"]))
):
    """
    Translates an approved publication track into a target regional language.
    Strictly guarantees that numbers, station names, coordinates, and units
    remain immutable.
    """
    db = get_database()
    pub = await db.publications.find_one({"id": req.publication_id})
    if not pub:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Publication not found")

    track_data = pub.get(req.track.lower())
    if not track_data:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Publication track '{req.track}' not found."
        )

    title_res = await localization_engine.translate(track_data.get("title", ""), req.target_language)
    body_res = await localization_engine.translate(track_data.get("body", ""), req.target_language)
    summary_res = await localization_engine.translate(track_data.get("summary", ""), req.target_language)

    now = datetime.now(timezone.utc).isoformat()
    translation_doc = {
        "id": f"trans_{uuid.uuid4().hex[:12]}",
        "publication_id": req.publication_id,
        "track": req.track.lower(),
        "source_language": "en",
        "target_language": req.target_language,
        "target_language_name": SUPPORTED_LANGUAGES.get(req.target_language, req.target_language),
        "title": title_res.translated_text,
        "summary": summary_res.translated_text,
        "body": body_res.translated_text,
        "provider": title_res.provider,
        "validation_passed": title_res.validation_passed and body_res.validation_passed,
        "review_status": "PENDING_REVIEW" if not (title_res.validation_passed and body_res.validation_passed) else "VERIFIED",
        "created_at": now,
        "created_by": current_user["email"]
    }

    await db.translations.insert_one(translation_doc)
    translation_doc.pop("_id", None)

    # Log to audit trail
    await db.audit_events.insert_one({
        "event_id": f"aud_{uuid.uuid4().hex[:12]}",
        "actor_id": current_user["id"],
        "actor_email": current_user["email"],
        "action": "TRANSLATE_PUBLICATION",
        "resource_type": "TRANSLATION",
        "resource_id": translation_doc["id"],
        "timestamp": now,
        "details": {
            "publication_id": req.publication_id,
            "target_language": req.target_language,
            "validation_passed": translation_doc["validation_passed"]
        }
    })

    return translation_doc

@router.get("/translations/{pub_id}")
async def get_publication_translations(pub_id: str):
    """Fetches all stored translations for a given publication."""
    db = get_database()
    cursor = db.translations.find({"publication_id": pub_id}, {"_id": 0}).sort("created_at", -1)
    translations = await cursor.to_list(length=50)
    return {"publication_id": pub_id, "translations": translations}

@router.post("/approve")
async def approve_translation(
    req: ApproveTranslationRequest,
    current_user=Depends(require_roles(["SUPER_ADMIN", "OUTREACH_EDITOR"]))
):
    """Allows an outreach editor to approve or reject a regional translation."""
    db = get_database()
    translation = await db.translations.find_one({"id": req.translation_id})
    if not translation:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Translation not found")

    now = datetime.now(timezone.utc).isoformat()
    new_status = "APPROVED" if req.approved else "REJECTED"

    await db.translations.update_one(
        {"id": req.translation_id},
        {"$set": {
            "review_status": new_status,
            "reviewer": current_user["email"],
            "reviewer_notes": req.notes,
            "reviewed_at": now
        }}
    )

    return {
        "translation_id": req.translation_id,
        "status": new_status,
        "reviewed_by": current_user["email"],
        "reviewed_at": now
    }
