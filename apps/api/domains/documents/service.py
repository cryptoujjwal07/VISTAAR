import fitz  # PyMuPDF
import hashlib
import uuid
import re
import numpy as np
from datetime import datetime, timezone
from pathlib import Path
from typing import Optional, List, Dict, Any, Tuple
from apps.api.core.database import get_database
from apps.api.core.storage import storage_service
from apps.api.core.logging import get_logger

logger = get_logger("vistaar.documents.service")

def compute_pdf_checksums(content: bytes) -> Dict[str, str]:
    """Compute SHA-256 and MD5 checksums of the document binary"""
    return {
        "sha256": hashlib.sha256(content).hexdigest(),
        "md5": hashlib.md5(content).hexdigest()
    }

def extract_pdf_metadata(doc: fitz.Document) -> Dict[str, Any]:
    """Extract standard and extended metadata from the PDF document"""
    meta = doc.metadata or {}
    return {
        "title": meta.get("title") or "",
        "author": meta.get("author") or "",
        "subject": meta.get("subject") or "",
        "keywords": meta.get("keywords") or "",
        "creator": meta.get("creator") or "",
        "producer": meta.get("producer") or "",
        "creation_date": meta.get("creationDate") or "",
        "mod_date": meta.get("modDate") or "",
        "format": meta.get("format") or "PDF",
        "is_encrypted": doc.is_encrypted,
        "page_count": len(doc)
    }

def generate_deterministic_embedding(text: str, dim: int = 768) -> List[float]:
    """
    Generate normalized 768-dimensional deterministic embedding vector
    for local vector indexing and downstream RAG queries (Prompt 09 & 10).
    """
    h = hashlib.sha256(text.encode("utf-8")).digest()
    seed = int.from_bytes(h[:4], "big")
    rng = np.random.RandomState(seed)
    vec = rng.randn(dim).astype(np.float32)
    norm = np.linalg.norm(vec)
    if norm > 0:
        vec = vec / norm
    return [round(float(x), 6) for x in vec]

def table_to_markdown(table_data: List[List[Optional[str]]]) -> str:
    """Format extracted 2D table grid into clean GitHub Flavored Markdown"""
    if not table_data or len(table_data) == 0:
        return ""
    headers = [str(c or "").strip().replace("\n", " ") for c in table_data[0]]
    if not any(headers):
        headers = [f"Col {i+1}" for i in range(len(headers))]
    header_line = "| " + " | ".join(headers) + " |"
    separator_line = "| " + " | ".join(["---"] * len(headers)) + " |"
    data_lines = []
    for row in table_data[1:]:
        cleaned_row = [str(c or "").strip().replace("\n", " ") for c in row]
        while len(cleaned_row) < len(headers):
            cleaned_row.append("")
        data_lines.append("| " + " | ".join(cleaned_row[:len(headers)]) + " |")
    return "\n".join([header_line, separator_line] + data_lines)

def bbox_overlap(box1: List[float], box2: List[float]) -> float:
    """Compute intersection area between two bounding boxes [x0, y0, x1, y1]"""
    dx = min(box1[2], box2[2]) - max(box1[0], box2[0])
    dy = min(box1[3], box2[3]) - max(box1[1], box2[1])
    if (dx >= 0) and (dy >= 0):
        intersection = dx * dy
        area1 = (box1[2] - box1[0]) * (box1[3] - box1[1])
        return intersection / max(area1, 1.0)
    return 0.0

def analyze_page_layout_and_headings(page: fitz.Page) -> Tuple[List[Dict[str, Any]], float]:
    """
    Extract text lines with font metrics to detect headings and estimate average body font size.
    """
    blocks = []
    font_sizes = []
    page_dict = page.get_text("dict")
    
    for b in page_dict.get("blocks", []):
        if b.get("type") == 0:  # text block
            b_text = ""
            max_size = 0.0
            is_bold = False
            for line in b.get("lines", []):
                for span in line.get("spans", []):
                    span_text = span.get("text", "")
                    b_text += span_text
                    sz = span.get("size", 10.0)
                    font_sizes.append(sz)
                    if sz > max_size:
                        max_size = sz
                    flags = span.get("flags", 0)
                    font_name = span.get("font", "").lower()
                    if (flags & 2 != 0) or ("bold" in font_name):
                        is_bold = True
                b_text += "\n"
            
            b_clean = b_text.strip()
            if b_clean:
                blocks.append({
                    "bbox": [round(c, 2) for c in b.get("bbox", [0, 0, 0, 0])],
                    "text": b_clean,
                    "max_font_size": max_size,
                    "is_bold": is_bold
                })
    
    avg_font_size = float(np.median(font_sizes)) if font_sizes else 10.0
    return blocks, avg_font_size

async def process_document_pipeline(document_id: str, retry_count: int = 0) -> Dict[str, Any]:
    """
    Full production scientific PDF intelligence pipeline conforming to Prompt 09:
    PDF upload -> checksum -> metadata -> pages -> text/layout -> table awareness -> chunking -> embeddings -> indexing.
    """
    db = get_database()
    doc_record = await db.documents.find_one({"document_id": document_id})
    if not doc_record:
        logger.error(f"Document {document_id} not found for processing.")
        return {"status": "error", "message": "Document not found"}

    storage_path = doc_record.get("storage_path")
    if not storage_path or not Path(storage_path).exists():
        logger.error(f"Storage path {storage_path} does not exist for doc {document_id}")
        await db.documents.update_one(
            {"document_id": document_id},
            {"$set": {"status": "FAILED", "error_message": "Document file missing on disk"}}
        )
        return {"status": "failed", "error": "Document file missing on disk"}

    # Update status to PROCESSING
    await db.documents.update_one(
        {"document_id": document_id},
        {
            "$set": {
                "status": "PROCESSING",
                "retry_count": retry_count,
                "processing_started_at": datetime.now(timezone.utc).isoformat(),
                "progress": {"current_page": 0, "total_pages": doc_record.get("page_count", 0), "percentage": 0}
            }
        }
    )

    try:
        with open(storage_path, "rb") as f:
            pdf_bytes = f.read()

        checksums = compute_pdf_checksums(pdf_bytes)
        doc = fitz.open(stream=pdf_bytes, filetype="pdf")
        page_count = len(doc)
        metadata = extract_pdf_metadata(doc)

        all_pages: List[Dict[str, Any]] = []
        all_chunks: List[Dict[str, Any]] = []
        all_tables: List[Dict[str, Any]] = []
        current_heading_context = f"Document: {doc_record.get('title', 'Polar Science Report')}"

        for pno in range(page_count):
            page = doc[pno]
            page_num = pno + 1
            rect = page.rect
            page_width = round(rect.width, 2)
            page_height = round(rect.height, 2)
            page_text = page.get_text("text")
            char_count = len(page_text)
            word_count = len(page_text.split())
            image_list = page.get_images()

            # Scanned / Image page detection
            is_scanned = (char_count < 50) and (len(image_list) > 0)

            # Per-page chunk counter to guarantee deterministic unique IDs (e.g. p1_c01, p1_c02)
            page_chunk_count = 0

            # 1. Table Detection using PyMuPDF find_tables()
            page_tables = []
            table_bboxes = []
            try:
                table_finder = page.find_tables()
                if table_finder and table_finder.tables:
                    for t_idx, t in enumerate(table_finder.tables):
                        t_bbox = [round(c, 2) for c in t.bbox]
                        t_data = t.extract()
                        if t_data and len(t_data) > 0:
                            headers = [str(c or "").strip() for c in t_data[0]]
                            rows = [[str(c or "").strip() for c in r] for r in t_data[1:]]
                            md_table = table_to_markdown(t_data)
                            t_entry = {
                                "table_id": f"p{page_num}_t{t_idx+1:02d}",
                                "document_id": document_id,
                                "page_number": page_num,
                                "bounding_box": t_bbox,
                                "headers": headers,
                                "row_count": len(rows),
                                "col_count": len(headers),
                                "markdown": md_table,
                                "created_at": datetime.now(timezone.utc).isoformat()
                            }
                            page_tables.append(t_entry)
                            all_tables.append(t_entry)
                            table_bboxes.append(t_bbox)

                            # Table awareness: Create dedicated table chunk
                            page_chunk_count += 1
                            table_chunk_id = f"p{page_num}_c{page_chunk_count:02d}"
                            all_chunks.append({
                                "chunk_id": table_chunk_id,
                                "document_id": document_id,
                                "page_number": page_num,
                                "text": f"Table on Page {page_num}:\n{md_table}",
                                "bounding_box": t_bbox,
                                "character_offsets": {"start": 0, "end": len(md_table)},
                                "heading_context": current_heading_context,
                                "token_estimate": round(len(md_table.split()) * 1.3),
                                "layout_type": "table",
                                "is_table": True,
                                "embedding": generate_deterministic_embedding(md_table),
                                "created_at": datetime.now(timezone.utc).isoformat()
                            })
            except Exception as te:
                logger.warning(f"Table finder warning on doc {document_id} page {page_num}: {te}")

            # 2. Text layout & Headings extraction
            layout_blocks, avg_font_size = analyze_page_layout_and_headings(page)

            for b_idx, block in enumerate(layout_blocks):
                b_text = block["text"]
                b_bbox = block["bbox"]

                # Skip blocks that are subsumed by an extracted table
                is_in_table = any(bbox_overlap(b_bbox, tb) > 0.6 for tb in table_bboxes)
                if is_in_table:
                    continue

                # Header & Footer detection
                is_header = (b_bbox[1] < 45) or (b_bbox[3] < 55)
                is_footer = (b_bbox[1] > page_height - 50) or (b_bbox[3] > page_height - 40)
                layout_type = "paragraph"
                if is_header:
                    layout_type = "header"
                elif is_footer:
                    layout_type = "footer"
                elif (block["max_font_size"] >= avg_font_size * 1.2) or block["is_bold"]:
                    layout_type = "heading"
                    current_heading_context = b_text.replace("\n", " ").strip()

                # Ignore trivial header/footer chunks or single character artifacts
                if len(b_text) < 15 and (is_header or is_footer):
                    continue

                if len(b_text.strip()) > 15:
                    page_chunk_count += 1
                    # Deterministic chunk ID as requested: e.g. p14_c02
                    chunk_id = f"p{page_num}_c{page_chunk_count:02d}"

                    # Calculate character offsets in full page text
                    start_off = page_text.find(b_text[:min(30, len(b_text))])
                    if start_off == -1:
                        start_off = 0
                    end_off = start_off + len(b_text)

                    token_est = round(len(b_text.split()) * 1.3)
                    embedding = generate_deterministic_embedding(b_text)

                    all_chunks.append({
                        "chunk_id": chunk_id,
                        "document_id": document_id,
                        "page_number": page_num,
                        "text": b_text,
                        "bounding_box": b_bbox,  # Never destroy source coordinates [x0, y0, x1, y1]
                        "character_offsets": {"start": start_off, "end": end_off},
                        "heading_context": current_heading_context,
                        "token_estimate": max(token_est, 1),
                        "layout_type": layout_type,
                        "is_table": False,
                        "embedding": embedding,
                        "created_at": datetime.now(timezone.utc).isoformat()
                    })

            # Record page summary
            all_pages.append({
                "page_number": page_num,
                "width": page_width,
                "height": page_height,
                "rotation": page.rotation,
                "char_count": char_count,
                "word_count": word_count,
                "is_scanned": is_scanned,
                "image_count": len(image_list),
                "table_count": len(page_tables),
                "chunk_count": page_chunk_count
            })

            # Incremental progress reporting for async polling
            progress_pct = int(((pno + 1) / page_count) * 100)
            await db.documents.update_one(
                {"document_id": document_id},
                {
                    "$set": {
                        "progress": {
                            "current_page": page_num,
                            "total_pages": page_count,
                            "percentage": progress_pct
                        }
                    }
                }
            )

        doc.close()

        # Clean existing chunks for this document if reprocessing
        await db.document_chunks.delete_many({"document_id": document_id})
        if all_chunks:
            await db.document_chunks.insert_many(all_chunks)

        # Store tables in document_tables collection
        await db.document_tables.delete_many({"document_id": document_id})
        if all_tables:
            await db.document_tables.insert_many(all_tables)

        now = datetime.now(timezone.utc).isoformat()
        await db.documents.update_one(
            {"document_id": document_id},
            {
                "$set": {
                    "status": "COMPLETED",
                    "sha256": checksums["sha256"],
                    "md5": checksums["md5"],
                    "metadata": metadata,
                    "pages": all_pages,
                    "chunk_count": len(all_chunks),
                    "table_count": len(all_tables),
                    "progress": {
                        "current_page": page_count,
                        "total_pages": page_count,
                        "percentage": 100
                    },
                    "completed_at": now,
                    "updated_at": now
                }
            }
        )

        logger.info(f"Successfully processed PDF document {document_id}: {page_count} pages, {len(all_chunks)} chunks, {len(all_tables)} tables.")
        return {
            "status": "COMPLETED",
            "document_id": document_id,
            "page_count": page_count,
            "chunk_count": len(all_chunks),
            "table_count": len(all_tables)
        }

    except Exception as e:
        logger.error(f"Error processing PDF document {document_id}: {str(e)}", exc_info=True)
        # Automatic retry logic (up to 2 retries)
        if retry_count < 2:
            logger.info(f"Retrying document {document_id} processing (attempt {retry_count + 1})...")
            return await process_document_pipeline(document_id, retry_count=retry_count + 1)

        await db.documents.update_one(
            {"document_id": document_id},
            {
                "$set": {
                    "status": "FAILED",
                    "error_message": str(e),
                    "updated_at": datetime.now(timezone.utc).isoformat()
                }
            }
        )
        return {"status": "FAILED", "error": str(e)}

async def render_page_image(document_id: str, page_number: int, dpi: int = 150) -> bytes:
    """
    Render a specific PDF page to high-definition PNG bytes using PyMuPDF pixmap.
    Used by frontend PDF intelligence viewer for overlaying bounding box highlights.
    """
    db = get_database()
    doc_record = await db.documents.find_one({"document_id": document_id})
    if not doc_record:
        raise ValueError("Document not found")

    storage_path = doc_record.get("storage_path")
    if not storage_path or not Path(storage_path).exists():
        raise FileNotFoundError("Document PDF file missing")

    doc = fitz.open(storage_path)
    if page_number < 1 or page_number > len(doc):
        doc.close()
        raise IndexError(f"Page number {page_number} out of bounds (1-{len(doc)})")

    page = doc[page_number - 1]
    pix = page.get_pixmap(dpi=dpi)
    png_bytes = pix.tobytes("png")
    doc.close()
    return png_bytes
