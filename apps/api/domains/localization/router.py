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
    publish: Optional[bool] = False
    notes: Optional[str] = None

@router.get("/languages")
async def get_supported_languages():
    """Returns the list of supported 8th Schedule Indian languages and metadata."""
    return {
        "supported_languages": SUPPORTED_LANGUAGES,
        "default_source": "en",
        "bhashini_enabled": bool(localization_engine.bhashini_key),
        "ai_translation_enabled": bool(localization_engine.gemini_key),
        "translation_provider_abstraction": "TranslationProvider",
        "workflow": [
            "APPROVED_SOURCE",
            "CLAIM_SEGMENTATION",
            "TRANSLATION",
            "TERMINOLOGY_VALIDATION",
            "NUMERICAL_PRESERVATION",
            "REVIEW",
            "PUBLISH",
        ],
    }

@router.post("/translate", response_model=TranslationResult)
async def translate_text(req: TranslateRequest):
    """
    Translates outreach text into target Indian language with strict numerical
    and scientific terminology preservation.
    """
    import time as _time
    from apps.api.core.performance import performance_profiler

    t0 = _time.perf_counter()
    if req.target_language not in SUPPORTED_LANGUAGES:
        performance_profiler.record_translation(False, round((_time.perf_counter() - t0) * 1000, 2))
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Target language '{req.target_language}' is not supported. Supported: {list(SUPPORTED_LANGUAGES.keys())}"
        )

    result = await localization_engine.translate(
        text=req.text,
        target_lang=req.target_language,
        source_lang=req.source_language or "en"
    )
    performance_profiler.record_translation(
        bool(result.validation_passed),
        round((_time.perf_counter() - t0) * 1000, 2),
    )
    return result

@router.post("/translate-publication")
async def translate_publication(
    req: PublicationTranslationRequest,
    current_user=Depends(require_roles(["SUPER_ADMIN", "OUTREACH_EDITOR"]))
):
    """
    Translates an approved publication track into a target regional language (Prompt 22).
    Workflow: approved source -> claim segmentation -> translation -> terminology validation
    -> numerical preservation -> review when necessary -> publish.
    Stores source_language, target_language, translation, provider, version, timestamp, and review_status.
    Never silently replaces approved source with failed/unverified translation.
    """
    import time as _time
    from apps.api.core.performance import performance_profiler

    t0 = _time.perf_counter()
    db = get_database()
    pub = await db.publications.find_one({"id": req.publication_id})
    if not pub:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Publication not found")

    track_key = (req.track or "pib").lower()
    # Use immutable published_snapshot if available so approved source is guaranteed
    snap = pub.get("published_snapshot") or {}
    track_data = snap.get(track_key) or pub.get(track_key)
    if not track_data:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Publication track '{req.track}' not found."
        )

    title_res = await localization_engine.translate(track_data.get("title", ""), req.target_language)
    body_res = await localization_engine.translate(track_data.get("body", ""), req.target_language)
    summary_res = await localization_engine.translate(track_data.get("summary", ""), req.target_language)

    existing_count = await db.translations.count_documents({
        "publication_id": req.publication_id,
        "track": track_key,
        "target_language": req.target_language,
    })
    version_num = existing_count + 1

    now = datetime.now(timezone.utc).isoformat()
    all_valid = title_res.validation_passed and body_res.validation_passed
    review_status = "VERIFIED" if all_valid else "PENDING_REVIEW"
    performance_profiler.record_translation(
        bool(all_valid),
        round((_time.perf_counter() - t0) * 1000, 2),
    )

    translation_doc = {
        "id": f"trans_{uuid.uuid4().hex[:12]}",
        "publication_id": req.publication_id,
        "track": track_key,
        "source_language": "en",
        "target_language": req.target_language,
        "target_language_name": SUPPORTED_LANGUAGES.get(req.target_language, req.target_language),
        "title": title_res.translated_text,
        "summary": summary_res.translated_text,
        "body": body_res.translated_text,
        "translation": {
            "title": title_res.translated_text,
            "summary": summary_res.translated_text,
            "body": body_res.translated_text,
        },
        "claim_segments": [s.model_dump() for s in body_res.claim_segments],
        "provider": body_res.provider or title_res.provider,
        "version": version_num,
        "timestamp": now,
        "terminology_validation_passed": title_res.terminology_validation_passed and body_res.terminology_validation_passed,
        "numerical_preservation_passed": title_res.numerical_preservation_passed and body_res.numerical_preservation_passed,
        "validation_passed": all_valid,
        "review_status": review_status,
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
            "version": version_num,
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
    """Allows an outreach editor to approve, publish, or reject a regional translation."""
    db = get_database()
    translation = await db.translations.find_one({"id": req.translation_id})
    if not translation:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Translation not found")

    if req.approved and not translation.get("validation_passed", True) and not req.notes:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Unverified translation requires explicit reviewer notes before approval."
        )

    now = datetime.now(timezone.utc).isoformat()
    if not req.approved:
        new_status = "REJECTED"
    elif req.publish:
        new_status = "PUBLISHED"
    else:
        new_status = "APPROVED"

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
        "review_status": new_status,
        "reviewed_by": current_user["email"],
        "reviewed_at": now
    }

