import asyncio
import hashlib
import os
import uuid
from datetime import datetime, timezone
from pathlib import Path
from typing import List, Optional
import fitz  # PyMuPDF
from fastapi import APIRouter, BackgroundTasks, Depends, File, Form, HTTPException, Query, Request, UploadFile, status
from fastapi.responses import FileResponse, Response
from apps.api.core.database import get_database
from apps.api.core.performance import (
    decode_cursor,
    encode_cursor,
    inflight_deduplicator,
    ttl_cache,
)
from apps.api.core.security import (
    get_current_user,
    require_roles,
    sanitize_filename,
    sanitize_untrusted_document_text,
)
from apps.api.core.storage import storage_service
from apps.api.domains.documents.service import (
    compute_pdf_checksums,
    extract_pdf_metadata,
    process_document_pipeline,
    render_page_image,
)

router = APIRouter(prefix="/documents", tags=["PDF Document Intelligence"])


@router.post("/upload")
async def upload_document(
    request: Request,
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    title: Optional[str] = Form(None),
    station_id: Optional[str] = Form(None),
    expedition: Optional[str] = Form(None),
    run_synchronously: bool = Form(True),
    deduplicate: bool = Form(False),
    current_user=Depends(require_roles(["SUPER_ADMIN", "OUTREACH_EDITOR", "FIELD_SCIENTIST"])),
):
    """
    Production scientific PDF upload and intelligence ingestion pipeline (Prompt 09, 26 & 27).
    Enforces filename sanitization, magic-byte content-type spoofing protection, size limits,
    SHA-256 deduplication, and untrusted document prompt-injection isolation.
    """
    safe_original_name = sanitize_filename(file.filename or "", allowed_extensions={".pdf"})

    content = await file.read()
    if len(content) > 50 * 1024 * 1024:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE, detail="Document exceeds 50MB limit."
        )

    if not content.startswith(b"%PDF-"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Security violation: Content-type spoofing blocked. File does not begin with valid %PDF- magic bytes.",
        )

    checksums = compute_pdf_checksums(content)
    sha256 = checksums["sha256"]
    db = get_database()

    # Optional SHA-256 deduplication (via form parameter or X-Deduplicate header)
    should_dedup = deduplicate or (request.headers.get("X-Deduplicate", "").lower() == "true")
    if should_dedup:
        existing_doc = await db.documents.find_one({"sha256": sha256, "status": "COMPLETED"}, {"_id": 0})
        if existing_doc:
            inflight_deduplicator.deduplicated_documents += 1
            return {**existing_doc, "deduplicated": True}

    doc_id = f"doc_{uuid.uuid4().hex[:12]}"
    filename = f"{doc_id}_{safe_original_name}"

    file_path = await storage_service.save_file("documents", filename, content)

    try:
        quick_doc = fitz.open(stream=content, filetype="pdf")
        page_count = len(quick_doc)
        metadata = extract_pdf_metadata(quick_doc)
        raw_preview_text = "\n".join(quick_doc[i].get_text("text") for i in range(min(page_count, 5)))
        quick_doc.close()
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=f"Malformed PDF document: {str(e)}"
        )

    scan_info = sanitize_untrusted_document_text(raw_preview_text)

    now = datetime.now(timezone.utc).isoformat()
    doc_record = {
        "document_id": doc_id,
        "title": title or metadata.get("title") or safe_original_name.replace(".pdf", ""),
        "original_filename": safe_original_name,
        "storage_path": file_path,
        "sha256": sha256,
        "md5": checksums["md5"],
        "size_bytes": len(content),
        "page_count": page_count,
        "station_id": station_id.lower() if station_id else None,
        "expedition": expedition,
        "uploaded_by": current_user["email"],
        "status": "PENDING",
        "retry_count": 0,
        "progress": {"current_page": 0, "total_pages": page_count, "percentage": 0},
        "pages": [],
        "chunk_count": 0,
        "table_count": 0,
        "security_scan": {
            "untrusted_data_isolated": True,
            "prompt_injection_detected": scan_info["prompt_injection_detected"],
            "matched_patterns": scan_info["matched_patterns"],
        },
        "created_at": now,
        "updated_at": now,
    }

    await db.documents.insert_one(doc_record)

    from apps.api.domains.audit.service import record_audit_event

    await record_audit_event(
        actor_id=current_user["id"],
        actor_email=current_user["email"],
        action="UPLOAD_DOCUMENT",
        resource_type="DOCUMENT",
        resource_id=doc_id,
        details={
            "title": doc_record["title"],
            "page_count": page_count,
            "size_bytes": len(content),
            "prompt_injection_detected": scan_info["prompt_injection_detected"],
        },
    )

    if run_synchronously or page_count <= 10:
        result = await process_document_pipeline(doc_id)
        updated_doc = await db.documents.find_one({"document_id": doc_id}, {"_id": 0})
        return updated_doc or {
            "document_id": doc_id,
            "title": doc_record["title"],
            "status": "COMPLETED",
            "page_count": page_count,
            "chunk_count": result.get("chunk_count", 0),
            "table_count": result.get("table_count", 0),
            "sha256": sha256,
            "security_scan": doc_record["security_scan"],
        }
    else:
        background_tasks.add_task(process_document_pipeline, doc_id)
        return {
            "document_id": doc_id,
            "title": doc_record["title"],
            "status": "PROCESSING",
            "page_count": page_count,
            "sha256": sha256,
            "message": "Document accepted for asynchronous PDF layout and table intelligence processing.",
        }


@router.get("")
async def list_documents(
    station_id: Optional[str] = None,
    status_filter: Optional[str] = Query(None, alias="status"),
    search: Optional[str] = None,
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
    cursor: Optional[str] = Query(None, description="Opaque cursor token for cursor-based pagination (Prompt 27)"),
):
    """List scientific documents with filtering and offset/cursor pagination."""
    db = get_database()
    effective_offset, _ = decode_cursor(cursor, default_offset=offset)
    query = {}
    if station_id:
        query["station_id"] = station_id.lower()
    if status_filter:
        query["status"] = status_filter.upper()
    if search:
        query["$or"] = [
            {"title": {"$regex": search, "$options": "i"}},
            {"original_filename": {"$regex": search, "$options": "i"}},
            {"expedition": {"$regex": search, "$options": "i"}},
        ]
    cursor_q = db.documents.find(query, {"_id": 0}).sort("created_at", -1).skip(effective_offset).limit(limit)
    items, total = await asyncio.gather(
        cursor_q.to_list(length=limit),
        db.documents.count_documents(query),
    )
    next_offset = effective_offset + len(items)
    has_more = next_offset < total
    last_id = items[-1].get("document_id", "") if items else ""
    next_cursor = encode_cursor(next_offset, last_id) if has_more else None

    return {
        "total": total,
        "items": items,
        "limit": limit,
        "offset": effective_offset,
        "has_more": has_more,
        "next_cursor": next_cursor,
    }


@router.get("/{document_id}")
async def get_document_details(document_id: str):
    """Retrieve complete metadata, page summary, and processing progress for a document."""
    db = get_database()
    doc = await db.documents.find_one({"document_id": document_id}, {"_id": 0})
    if not doc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document not found")
    return doc


@router.get("/{document_id}/status")
async def get_document_status(document_id: str):
    """Check asynchronous document processing status, progress, and retry counts (Prompt 09)."""
    db = get_database()
    doc = await db.documents.find_one(
        {"document_id": document_id},
        {
            "_id": 0,
            "document_id": 1,
            "status": 1,
            "progress": 1,
            "retry_count": 1,
            "error_message": 1,
            "chunk_count": 1,
            "table_count": 1,
        },
    )
    if not doc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document not found")
    return doc


@router.post("/{document_id}/reprocess")
async def reprocess_document(
    document_id: str,
    background_tasks: BackgroundTasks,
    current_user=Depends(require_roles(["SUPER_ADMIN", "OUTREACH_EDITOR"])),
):
    """Manually trigger asynchronous reprocessing of a document with automatic retry recovery."""
    db = get_database()
    doc = await db.documents.find_one({"document_id": document_id})
    if not doc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document not found")

    ttl_cache.invalidate_prefix(f"pdf_render:{document_id}:")
    background_tasks.add_task(process_document_pipeline, document_id, 0)

    from apps.api.domains.audit.service import record_audit_event

    await record_audit_event(
        actor_id=current_user["id"],
        actor_email=current_user["email"],
        action="REPROCESS_DOCUMENT",
        resource_type="DOCUMENT",
        resource_id=document_id,
        details={"reason": "Manual reprocessing triggered by authorized officer"},
    )

    return {"message": "Document reprocessing initiated asynchronously", "document_id": document_id}


@router.get("/{document_id}/chunks")
async def get_document_chunks(
    document_id: str,
    page_number: Optional[int] = None,
    is_table: Optional[bool] = None,
    include_embeddings: bool = Query(True),
    limit: int = Query(200, ge=1, le=500),
    offset: int = Query(0, ge=0),
    cursor: Optional[str] = Query(None, description="Opaque cursor token for cursor-based pagination (Prompt 27)"),
):
    """
    Retrieve deterministic chunks retaining document_id, page_number, chunk_id (e.g. p14_c02),
    bounding boxes, character offsets, heading/context, token estimates, and embeddings (Prompt 09 & 27).
    """
    db = get_database()
    effective_offset, _ = decode_cursor(cursor, default_offset=offset)
    query = {"document_id": document_id}
    if page_number is not None:
        query["page_number"] = page_number
    if is_table is not None:
        query["is_table"] = is_table

    projection = {"_id": 0} if include_embeddings else {"_id": 0, "embedding": 0}
    cursor_q = (
        db.document_chunks.find(query, projection)
        .sort([("page_number", 1), ("chunk_id", 1)])
        .skip(effective_offset)
        .limit(limit)
    )
    chunks, total = await asyncio.gather(
        cursor_q.to_list(length=limit),
        db.document_chunks.count_documents(query),
    )

    next_offset = effective_offset + len(chunks)
    has_more = next_offset < total
    last_id = chunks[-1].get("chunk_id", "") if chunks else ""
    next_cursor = encode_cursor(next_offset, last_id) if has_more else None

    return {
        "document_id": document_id,
        "total": total,
        "limit": limit,
        "offset": effective_offset,
        "has_more": has_more,
        "next_cursor": next_cursor,
        "chunks": chunks,
    }


@router.get("/{document_id}/tables")
async def get_document_tables(document_id: str, page_number: Optional[int] = None):
    """Retrieve all structured tables extracted from the document using PyMuPDF table finder."""
    db = get_database()
    query = {"document_id": document_id}
    if page_number is not None:
        query["page_number"] = page_number

    cursor = db.document_tables.find(query, {"_id": 0}).sort("page_number", 1)
    tables = await cursor.to_list(length=100)
    return {"document_id": document_id, "table_count": len(tables), "tables": tables}


@router.get("/{document_id}/pages/{page_number}/render")
async def render_page(request: Request, document_id: str, page_number: int, dpi: int = Query(150, ge=72, le=300)):
    """
    Render a specific PDF page to high-resolution PNG image using PyMuPDF pixmap.
    Supports bounded TTL cache, ETag conditional requests (304 Not Modified), and Cache-Control (Prompt 27).
    """
    cache_key = f"pdf_render:{document_id}:{page_number}:{dpi}"
    was_cached = ttl_cache._store.get(cache_key) is not None

    try:
        png_bytes = await render_page_image(document_id, page_number, dpi=dpi)
        etag = ttl_cache.compute_etag(png_bytes)
        if_none_match = request.headers.get("If-None-Match")
        if if_none_match and if_none_match == etag:
            return Response(
                status_code=status.HTTP_304_NOT_MODIFIED,
                headers={
                    "ETag": etag,
                    "Cache-Control": "public, max-age=3600",
                    "X-Cache": "HIT",
                },
            )
        return Response(
            content=png_bytes,
            media_type="image/png",
            headers={
                "Cache-Control": "public, max-age=3600",
                "ETag": etag,
                "X-Cache": "HIT" if was_cached else "MISS",
            },
        )
    except IndexError as ie:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(ie))
    except (ValueError, FileNotFoundError) as fe:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(fe))
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Page render failure: {str(e)}")


@router.get("/{document_id}/download")
async def download_document(document_id: str):
    """Download the original scientific PDF document via streaming FileResponse."""
    db = get_database()
    doc = await db.documents.find_one({"document_id": document_id}, {"_id": 0})
    if not doc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document not found")

    storage_path = doc.get("storage_path")
    if not storage_path or not os.path.exists(storage_path):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document binary not found on storage")

    filename = doc.get("original_filename") or f"{document_id}.pdf"
    etag = f'W/"{doc.get("sha256", document_id)[:24]}"'
    return FileResponse(
        path=storage_path,
        media_type="application/pdf",
        filename=filename,
        headers={
            "Cache-Control": "public, max-age=3600",
            "ETag": etag,
        },
    )
