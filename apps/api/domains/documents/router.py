import fitz  # PyMuPDF
import hashlib
import uuid
import os
from datetime import datetime, timezone
from pathlib import Path
from fastapi import APIRouter, HTTPException, UploadFile, File, Form, Depends, status, BackgroundTasks, Query
from fastapi.responses import Response, FileResponse
from typing import Optional, List
from apps.api.core.database import get_database
from apps.api.core.storage import storage_service
from apps.api.core.security import (
    get_current_user,
    require_roles,
    sanitize_filename,
    sanitize_untrusted_document_text,
)
from apps.api.domains.documents.service import (
    process_document_pipeline,
    render_page_image,
    compute_pdf_checksums,
    extract_pdf_metadata
)

router = APIRouter(prefix="/documents", tags=["PDF Document Intelligence"])

@router.post("/upload")
async def upload_document(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    title: Optional[str] = Form(None),
    station_id: Optional[str] = Form(None),
    expedition: Optional[str] = Form(None),
    run_synchronously: bool = Form(True),
    current_user=Depends(require_roles(["SUPER_ADMIN", "OUTREACH_EDITOR", "FIELD_SCIENTIST"]))
):
    """
    Production scientific PDF upload and intelligence ingestion pipeline (Prompt 09 & Prompt 26).
    Enforces filename sanitization, magic-byte content-type spoofing protection, size limits,
    and untrusted document prompt-injection isolation.
    """
    safe_original_name = sanitize_filename(file.filename or "", allowed_extensions={".pdf"})

    content = await file.read()
    if len(content) > 50 * 1024 * 1024:
        raise HTTPException(status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE, detail="Document exceeds 50MB limit.")

    if not content.startswith(b"%PDF-"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Security violation: Content-type spoofing blocked. File does not begin with valid %PDF- magic bytes.",
        )

    checksums = compute_pdf_checksums(content)
    sha256 = checksums["sha256"]
    doc_id = f"doc_{uuid.uuid4().hex[:12]}"
    filename = f"{doc_id}_{safe_original_name}"
    
    # Save to storage
    file_path = await storage_service.save_file("documents", filename, content)

    # Initial PDF validation & untrusted prompt-injection scan
    try:
        quick_doc = fitz.open(stream=content, filetype="pdf")
        page_count = len(quick_doc)
        metadata = extract_pdf_metadata(quick_doc)
        raw_preview_text = "\n".join(quick_doc[i].get_text("text") for i in range(min(page_count, 5)))
        quick_doc.close()
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=f"Malformed PDF document: {str(e)}")

    scan_info = sanitize_untrusted_document_text(raw_preview_text)

    db = get_database()
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
        "updated_at": now
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
        }
    )

    # If small document or requested synchronously, process immediately
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
        # Schedule asynchronous processing with background task
        background_tasks.add_task(process_document_pipeline, doc_id)
        return {
            "document_id": doc_id,
            "title": doc_record["title"],
            "status": "PROCESSING",
            "page_count": page_count,
            "sha256": sha256,
            "message": "Document accepted for asynchronous PDF layout and table intelligence processing."
        }

@router.get("")
async def list_documents(
    station_id: Optional[str] = None,
    status_filter: Optional[str] = Query(None, alias="status"),
    search: Optional[str] = None,
    limit: int = 50,
    offset: int = 0
):
    """List scientific documents with filtering and pagination"""
    db = get_database()
    query = {}
    if station_id:
        query["station_id"] = station_id.lower()
    if status_filter:
        query["status"] = status_filter.upper()
    if search:
        query["$or"] = [
            {"title": {"$regex": search, "$options": "i"}},
            {"original_filename": {"$regex": search, "$options": "i"}},
            {"expedition": {"$regex": search, "$options": "i"}}
        ]
    cursor = db.documents.find(query, {"_id": 0}).sort("created_at", -1).skip(offset).limit(limit)
    items = await cursor.to_list(length=limit)
    total = await db.documents.count_documents(query)
    return {"total": total, "items": items}

@router.get("/{document_id}")
async def get_document_details(document_id: str):
    """Retrieve complete metadata, page summary, and processing progress for a document"""
    db = get_database()
    doc = await db.documents.find_one({"document_id": document_id}, {"_id": 0})
    if not doc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document not found")
    return doc

@router.get("/{document_id}/status")
async def get_document_status(document_id: str):
    """Check asynchronous document processing status, progress, and retry counts (Prompt 09)"""
    db = get_database()
    doc = await db.documents.find_one(
        {"document_id": document_id},
        {"_id": 0, "document_id": 1, "status": 1, "progress": 1, "retry_count": 1, "error_message": 1, "chunk_count": 1, "table_count": 1}
    )
    if not doc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document not found")
    return doc

@router.post("/{document_id}/reprocess")
async def reprocess_document(
    document_id: str,
    background_tasks: BackgroundTasks,
    current_user=Depends(require_roles(["SUPER_ADMIN", "OUTREACH_EDITOR"]))
):
    """Manually trigger asynchronous reprocessing of a document with automatic retry recovery"""
    db = get_database()
    doc = await db.documents.find_one({"document_id": document_id})
    if not doc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document not found")

    background_tasks.add_task(process_document_pipeline, document_id, 0)
    
    from apps.api.domains.audit.service import record_audit_event
    await record_audit_event(
        actor_id=current_user["id"],
        actor_email=current_user["email"],
        action="REPROCESS_DOCUMENT",
        resource_type="DOCUMENT",
        resource_id=document_id,
        details={"reason": "Manual reprocessing triggered by authorized officer"}
    )

    return {"message": "Document reprocessing initiated asynchronously", "document_id": document_id}

@router.get("/{document_id}/chunks")
async def get_document_chunks(
    document_id: str,
    page_number: Optional[int] = None,
    is_table: Optional[bool] = None,
    limit: int = 200,
    offset: int = 0
):
    """
    Retrieve deterministic chunks retaining document_id, page_number, chunk_id (e.g. p14_c02),
    bounding boxes, character offsets, heading/context, token estimates, and embeddings (Prompt 09).
    """
    db = get_database()
    query = {"document_id": document_id}
    if page_number is not None:
        query["page_number"] = page_number
    if is_table is not None:
        query["is_table"] = is_table

    total = await db.document_chunks.count_documents(query)
    cursor = db.document_chunks.find(query, {"_id": 0}).sort([("page_number", 1), ("chunk_id", 1)]).skip(offset).limit(limit)
    chunks = await cursor.to_list(length=limit)
    return {"document_id": document_id, "total": total, "chunks": chunks}

@router.get("/{document_id}/tables")
async def get_document_tables(document_id: str, page_number: Optional[int] = None):
    """Retrieve all structured tables extracted from the document using PyMuPDF table finder"""
    db = get_database()
    query = {"document_id": document_id}
    if page_number is not None:
        query["page_number"] = page_number

    cursor = db.document_tables.find(query, {"_id": 0}).sort("page_number", 1)
    tables = await cursor.to_list(length=100)
    return {"document_id": document_id, "table_count": len(tables), "tables": tables}

@router.get("/{document_id}/pages/{page_number}/render")
async def render_page(document_id: str, page_number: int, dpi: int = 150):
    """
    Render a specific PDF page to high-resolution PNG image using PyMuPDF pixmap.
    Powers interactive bounding box visual verification in the frontend PDF viewer.
    """
    try:
        png_bytes = await render_page_image(document_id, page_number, dpi=dpi)
        return Response(
            content=png_bytes,
            media_type="image/png",
            headers={"Cache-Control": "public, max-age=3600"}
        )
    except IndexError as ie:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(ie))
    except (ValueError, FileNotFoundError) as fe:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(fe))
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Page render failure: {str(e)}")

@router.get("/{document_id}/download")
async def download_document(document_id: str):
    """Download the original scientific PDF document"""
    db = get_database()
    doc = await db.documents.find_one({"document_id": document_id}, {"_id": 0})
    if not doc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document not found")

    storage_path = doc.get("storage_path")
    if not storage_path or not os.path.exists(storage_path):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document binary not found on storage")

    filename = doc.get("original_filename") or f"{document_id}.pdf"
    return FileResponse(
        path=storage_path,
        media_type="application/pdf",
        filename=filename
    )
