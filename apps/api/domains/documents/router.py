import fitz  # PyMuPDF
import hashlib
import uuid
from datetime import datetime, timezone
from fastapi import APIRouter, HTTPException, UploadFile, File, Form, Depends, status
from typing import Optional, List
from apps.api.core.database import get_database
from apps.api.core.storage import storage_service
from apps.api.core.security import get_current_user, require_roles

router = APIRouter(prefix="/documents", tags=["PDF Document Intelligence"])

@router.post("/upload")
async def upload_document(
    file: UploadFile = File(...),
    title: Optional[str] = Form(None),
    station_id: Optional[str] = Form(None),
    expedition: Optional[str] = Form(None),
    current_user=Depends(require_roles(["SUPER_ADMIN", "OUTREACH_EDITOR", "FIELD_SCIENTIST"]))
):
    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Only PDF documents are supported.")

    content = await file.read()
    if len(content) > 50 * 1024 * 1024:
        raise HTTPException(status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE, detail="Document exceeds 50MB limit.")

    sha256 = hashlib.sha256(content).hexdigest()
    doc_id = f"doc_{uuid.uuid4().hex[:12]}"
    filename = f"{doc_id}_{file.filename}"
    
    # Save to storage
    file_path = await storage_service.save_file("documents", filename, content)

    # Process PDF layout with PyMuPDF
    try:
        doc = fitz.open(stream=content, filetype="pdf")
        page_count = len(doc)
        pages_data = []
        chunks_data = []

        for pno in range(page_count):
            page = doc[pno]
            rect = page.rect
            text = page.get_text("text")
            
            pages_data.append({
                "page_number": pno + 1,
                "width": rect.width,
                "height": rect.height,
                "text_length": len(text)
            })

            # Paragraph/block level chunking with deterministic IDs and bounding boxes
            blocks = page.get_text("blocks")
            for b_idx, block in enumerate(blocks):
                # block: (x0, y0, x1, y1, text, block_no, block_type)
                b_text = block[4].strip()
                if len(b_text) > 20: # ignore trivial whitespace
                    chunk_id = f"p{pno+1}_c{b_idx+1:02d}"
                    chunks_data.append({
                        "chunk_id": chunk_id,
                        "document_id": doc_id,
                        "page_number": pno + 1,
                        "text": b_text,
                        "bounding_box": [round(block[0], 1), round(block[1], 1), round(block[2], 1), round(block[3], 1)],
                        "token_estimate": len(b_text.split()),
                    })

        doc.close()
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=f"PDF parsing error: {str(e)}")

    db = get_database()
    doc_record = {
        "document_id": doc_id,
        "title": title or file.filename.replace(".pdf", ""),
        "original_filename": file.filename,
        "storage_path": file_path,
        "sha256": sha256,
        "size_bytes": len(content),
        "page_count": page_count,
        "station_id": station_id.lower() if station_id else None,
        "expedition": expedition,
        "uploaded_by": current_user["email"],
        "pages": pages_data,
        "chunk_count": len(chunks_data),
        "created_at": datetime.now(timezone.utc).isoformat(),
        "updated_at": datetime.now(timezone.utc).isoformat()
    }

    await db.documents.insert_one(doc_record)
    if chunks_data:
        await db.document_chunks.insert_many(chunks_data)

    from apps.api.domains.audit.service import record_audit_event
    await record_audit_event(
        actor_id=current_user["id"],
        actor_email=current_user["email"],
        action="UPLOAD_DOCUMENT",
        resource_type="DOCUMENT",
        resource_id=doc_id,
        details={"title": doc_record["title"], "page_count": page_count, "chunks": len(chunks_data)}
    )

    return {
        "document_id": doc_id,
        "title": doc_record["title"],
        "page_count": page_count,
        "chunk_count": len(chunks_data),
        "sha256": sha256
    }

@router.get("")
async def list_documents(station_id: Optional[str] = None, limit: int = 50, offset: int = 0):
    db = get_database()
    query = {}
    if station_id:
        query["station_id"] = station_id.lower()
    cursor = db.documents.find(query, {"_id": 0}).skip(offset).limit(limit)
    items = await cursor.to_list(length=limit)
    total = await db.documents.count_documents(query)
    return {"total": total, "items": items}

@router.get("/{document_id}")
async def get_document_details(document_id: str):
    db = get_database()
    doc = await db.documents.find_one({"document_id": document_id}, {"_id": 0})
    if not doc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document not found")
    return doc

@router.get("/{document_id}/chunks")
async def get_document_chunks(document_id: str, page_number: Optional[int] = None):
    db = get_database()
    query = {"document_id": document_id}
    if page_number:
        query["page_number"] = page_number
    cursor = db.document_chunks.find(query, {"_id": 0}).sort("page_number", 1)
    chunks = await cursor.to_list(length=500)
    return {"document_id": document_id, "chunks": chunks}
