import pytest
import os
from pathlib import Path
from httpx import AsyncClient, ASGITransport
from apps.api.main import app
from apps.api.core.database import get_database
from apps.api.core.storage import storage_service
from apps.api.domains.documents.service import (
    process_document_pipeline,
    render_page_image,
    compute_pdf_checksums,
    extract_pdf_metadata
)
from scripts.generate_sample_polar_pdf import create_sample_polar_pdf

SAMPLE_PDF_PATH = "./data/sample_documents/41st_ISEA_Maitri_Meteorology_Report.pdf"

@pytest.fixture(scope="session", autouse=True)
def ensure_sample_pdf():
    Path(SAMPLE_PDF_PATH).parent.mkdir(parents=True, exist_ok=True)
    if not Path(SAMPLE_PDF_PATH).exists():
        create_sample_polar_pdf(SAMPLE_PDF_PATH)

@pytest.mark.asyncio
async def test_pdf_checksum_and_metadata():
    with open(SAMPLE_PDF_PATH, "rb") as f:
        pdf_bytes = f.read()

    checksums = compute_pdf_checksums(pdf_bytes)
    assert "sha256" in checksums
    assert "md5" in checksums
    assert len(checksums["sha256"]) == 64
    assert len(checksums["md5"]) == 32

@pytest.mark.asyncio
async def test_pdf_intelligence_pipeline():
    db = get_database()
    with open(SAMPLE_PDF_PATH, "rb") as f:
        pdf_bytes = f.read()

    doc_id = "doc_test_polar_maitri"
    stored_path = await storage_service.save_file("documents", f"{doc_id}.pdf", pdf_bytes)

    await db.documents.update_one(
        {"document_id": doc_id},
        {"$set": {
            "document_id": doc_id,
            "title": "41st Indian Scientific Expedition to Antarctica - Maitri Report",
            "original_filename": "41st_ISEA_Maitri_Meteorology_Report.pdf",
            "storage_path": stored_path,
            "station_id": "maitri",
            "page_count": 2,
            "status": "PENDING",
            "retry_count": 0
        }},
        upsert=True
    )

    result = await process_document_pipeline(doc_id)
    assert result["status"] == "COMPLETED"
    assert result["page_count"] == 2
    assert result["chunk_count"] > 0
    assert result["table_count"] >= 1

    # Verify document record in database
    doc_record = await db.documents.find_one({"document_id": doc_id}, {"_id": 0})
    assert doc_record["status"] == "COMPLETED"
    assert len(doc_record["pages"]) == 2
    assert doc_record["pages"][0]["width"] == 595.0
    assert doc_record["pages"][0]["height"] == 842.0
    assert doc_record["pages"][0]["char_count"] > 200

    # Verify chunks with deterministic IDs, bounding boxes, character offsets, headings, embeddings
    chunks_cursor = db.document_chunks.find({"document_id": doc_id}, {"_id": 0}).sort("chunk_id", 1)
    chunks = await chunks_cursor.to_list(length=100)
    assert len(chunks) > 0

    first_chunk = chunks[0]
    assert first_chunk["document_id"] == doc_id
    assert first_chunk["page_number"] in [1, 2]
    # Deterministic chunk ID pattern (e.g. p1_c01 or p14_c02)
    assert first_chunk["chunk_id"].startswith("p")
    assert "_c" in first_chunk["chunk_id"]

    # Source bounding boxes intact [x0, y0, x1, y1]
    bbox = first_chunk["bounding_box"]
    assert len(bbox) == 4
    assert bbox[2] > bbox[0]
    assert bbox[3] > bbox[1]

    # Character offsets
    assert "character_offsets" in first_chunk
    assert "start" in first_chunk["character_offsets"]
    assert "end" in first_chunk["character_offsets"]

    # Heading context
    assert "heading_context" in first_chunk
    assert len(first_chunk["heading_context"]) > 0

    # Token estimate & embedding vector
    assert first_chunk["token_estimate"] > 0
    assert len(first_chunk["embedding"]) == 768

    # Verify tables collection
    tables_cursor = db.document_tables.find({"document_id": doc_id}, {"_id": 0})
    tables = await tables_cursor.to_list(length=10)
    assert len(tables) >= 1
    assert "markdown" in tables[0]
    assert "|" in tables[0]["markdown"]

@pytest.mark.asyncio
async def test_page_render_image():
    doc_id = "doc_test_polar_maitri"
    png_bytes = await render_page_image(doc_id, 1, dpi=72)
    # Check PNG magic bytes header
    assert png_bytes[:8] == b"\x89PNG\r\n\x1a\n"
    assert len(png_bytes) > 1000

@pytest.mark.asyncio
async def test_documents_api_endpoints():
    doc_id = "doc_test_polar_maitri"
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        # 1. List documents
        res = await ac.get("/api/v1/documents")
        assert res.status_code == 200
        data = res.json()
        assert "items" in data
        assert any(d["document_id"] == doc_id for d in data["items"])

        # 2. Get document details
        res = await ac.get(f"/api/v1/documents/{doc_id}")
        assert res.status_code == 200
        detail = res.json()
        assert detail["document_id"] == doc_id
        assert detail["status"] == "COMPLETED"

        # 3. Get document status
        res = await ac.get(f"/api/v1/documents/{doc_id}/status")
        assert res.status_code == 200
        status_info = res.json()
        assert status_info["status"] == "COMPLETED"
        assert status_info["progress"]["percentage"] == 100

        # 4. Get chunks
        res = await ac.get(f"/api/v1/documents/{doc_id}/chunks")
        assert res.status_code == 200
        chunks_data = res.json()
        assert chunks_data["total"] > 0
        assert len(chunks_data["chunks"]) > 0

        # 5. Get tables
        res = await ac.get(f"/api/v1/documents/{doc_id}/tables")
        assert res.status_code == 200
        tables_data = res.json()
        assert tables_data["table_count"] >= 1

        # 6. Render page to image
        res = await ac.get(f"/api/v1/documents/{doc_id}/pages/1/render?dpi=72")
        assert res.status_code == 200
        assert res.headers["content-type"] == "image/png"
        assert res.content[:8] == b"\x89PNG\r\n\x1a\n"

        # 7. Download document
        res = await ac.get(f"/api/v1/documents/{doc_id}/download")
        assert res.status_code == 200
        assert res.headers["content-type"] == "application/pdf"
        assert len(res.content) > 1000
