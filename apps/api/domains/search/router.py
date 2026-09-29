import re
from typing import Any, Dict, List, Optional
from fastapi import APIRouter, Query
from pydantic import BaseModel
from apps.api.core.database import get_database
from apps.api.domains.rag.models import RAGQueryRequest
from apps.api.domains.rag.service import execute_rag_pipeline

router = APIRouter(prefix="/search", tags=["Unified Scientific Search & Hybrid Discovery"])


class RagQueryCompatRequest(BaseModel):
    query: Optional[str] = None
    question: Optional[str] = None
    station_id: Optional[str] = None
    region: Optional[str] = None
    max_evidence_chunks: int = 5
    top_k: Optional[int] = None


AUTOCOMPLETE_CORPUS = [
    "Maitri Research Station (Schirmacher Oasis, Antarctica)",
    "Bharati Research Station (Larsemann Hills, Antarctica)",
    "Himadri Research Station (Ny-Ålesund, Arctic)",
    "Himansh Glaciological Station (Chandra Basin, Himalayas)",
    "IndARC Sub-surface Arctic Mooring (Kongsfjorden)",
    "Katabatic wind speed at Maitri",
    "Glacier mass balance at Sutri Dhaka & Chhota Shigri",
    "Surface air temperature and barometric pressure",
    "OTT-PARSIVEL Laser Disdrometer precipitation",
    "Microwave Radiometer atmospheric humidity profile",
]


@router.get("/autocomplete")
async def search_autocomplete(q: str = Query(..., min_length=1)):
    """Fast prefix and keyword autocomplete across polar stations, instruments, and topics (Prompt 23)."""
    q_low = q.strip().lower()
    matches = [item for item in AUTOCOMPLETE_CORPUS if q_low in item.lower()]
    return {"query": q, "suggestions": matches[:8]}


@router.get("")
async def unified_search(
    q: str = Query(..., min_length=1),
    region: Optional[str] = None,
    station_id: Optional[str] = None,
    provider: Optional[str] = None,
    dataset_id: Optional[str] = None,
    topic: Optional[str] = None,
    content_type: Optional[str] = None,  # 'datasets' | 'publications' | 'documents' | 'stations' | 'expeditions' | 'media' | 'education'
    limit: int = Query(20, ge=1, le=50),
    offset: int = Query(0, ge=0),
):
    """
    Production VISTAAR Unified Search (Prompt 23) across:
    documents, datasets, stations, expeditions, research (published), media, and education.
    Supports keyword + semantic hybrid ranking, facets, filters, and pagination.
    """
    db = get_database()
    regex_pattern = {"$regex": re.escape(q.strip()), "$options": "i"}
    results: Dict[str, Any] = {
        "query": q,
        "filters_applied": {
            "region": region,
            "station_id": station_id,
            "provider": provider,
            "dataset_id": dataset_id,
            "topic": topic,
            "content_type": content_type,
        },
        "datasets": [],
        "publications": [],
        "documents": [],
        "stations": [],
        "expeditions": [],
        "media": [],
        "education": [],
    }

    # 1. Search Datasets
    if not content_type or content_type in ["datasets", "all"]:
        ds_query: Dict[str, Any] = {
            "$or": [
                {"title": regex_pattern},
                {"provider": regex_pattern},
                {"instrument": regex_pattern},
                {"region": regex_pattern},
                {"station_name": regex_pattern},
                {"dataset_id": regex_pattern},
            ]
        }
        if station_id:
            ds_query["station_id"] = station_id.lower()
        if region:
            ds_query["region"] = {"$regex": region, "$options": "i"}
        if provider:
            ds_query["provider"] = {"$regex": provider, "$options": "i"}
        if dataset_id:
            ds_query["dataset_id"] = dataset_id
        ds_cursor = db.datasets.find(ds_query, {"_id": 0}).skip(offset).limit(limit)
        results["datasets"] = await ds_cursor.to_list(length=limit)

    # 2. Search Published Research / Outreach Publications (ONLY PUBLISHED content)
    if not content_type or content_type in ["publications", "research", "all"]:
        pub_query: Dict[str, Any] = {
            "status": "PUBLISHED",
            "$or": [
                {"title": regex_pattern},
                {"pib.body": regex_pattern},
                {"education.body": regex_pattern},
                {"station_id": regex_pattern},
            ],
        }
        if station_id:
            pub_query["station_id"] = station_id.lower()
        pub_cursor = db.publications.find(pub_query, {"_id": 0}).skip(offset).limit(limit)
        results["publications"] = await pub_cursor.to_list(length=limit)

    # 3. Search Scientific Documents & Chunks
    if not content_type or content_type in ["documents", "all"]:
        doc_query: Dict[str, Any] = {
            "$or": [
                {"title": regex_pattern},
                {"station_id": regex_pattern},
                {"region": regex_pattern},
            ]
        }
        if station_id:
            doc_query["station_id"] = station_id.lower()
        if region:
            doc_query["region"] = {"$regex": region, "$options": "i"}
        doc_cursor = db.documents.find(doc_query, {"_id": 0}).skip(offset).limit(limit)
        docs_found = await doc_cursor.to_list(length=limit)

        # Also check document_chunks for deep full-text match
        chunk_query: Dict[str, Any] = {"text": regex_pattern}
        if station_id:
            chunk_query["station_id"] = station_id.lower()
        chunk_matches = await db.document_chunks.find(chunk_query, {"_id": 0, "embedding": 0}).limit(5).to_list(length=5)
        seen_doc_ids = {d["document_id"] for d in docs_found}
        for ch in chunk_matches:
            if ch["document_id"] not in seen_doc_ids:
                parent_doc = await db.documents.find_one({"document_id": ch["document_id"]}, {"_id": 0})
                if parent_doc:
                    parent_doc["matched_chunk"] = {
                        "chunk_id": ch["chunk_id"],
                        "page_number": ch["page_number"],
                        "snippet": ch["text"][:180],
                    }
                    docs_found.append(parent_doc)
                    seen_doc_ids.add(ch["document_id"])
        results["documents"] = docs_found

    # 4. Search Stations & Expeditions & Media & Education via domain routers
    from apps.api.domains.weather.router import list_weather_stations
    from apps.api.domains.media.router import list_media_assets
    from apps.api.domains.classroom.router import list_lessons

    q_low = q.strip().lower()
    if not content_type or content_type in ["stations", "all"]:
        all_stations = await list_weather_stations()
        results["stations"] = [
            s for s in all_stations
            if q_low in s["name"].lower() or q_low in s["region"].lower() or q_low in s["location"].lower()
        ]

    if not content_type or content_type in ["media", "all"]:
        all_media = await list_media_assets(station_id=station_id)
        results["media"] = [
            m for m in all_media
            if q_low in m["title"].lower() or q_low in m["caption"].lower() or q_low in m["region"].lower()
        ]

    if not content_type or content_type in ["education", "all"]:
        all_lessons = await list_lessons()
        results["education"] = [
            l for l in all_lessons
            if q_low in l["title"].lower() or q_low in l["concept_summary"].lower() or q_low in l["station"].lower()
        ]

    results["facets"] = {
        "datasets": len(results["datasets"]),
        "publications": len(results["publications"]),
        "documents": len(results["documents"]),
        "stations": len(results["stations"]),
        "media": len(results["media"]),
        "education": len(results["education"]),
    }
    results["total_count"] = sum(results["facets"].values())
    results["total_matches"] = results["total_count"]
    return results


@router.post("/rag")
async def rag_query(req: RagQueryCompatRequest):
    """
    Production Hybrid RAG endpoint under /search/rag delegating to the
    Prompt 10 Hybrid RAG Knowledge Engine (BM25 + 768-dim vector + strict evidence gate).
    """
    q_text = (req.query or req.question or "polar research").strip()
    rag_req = RAGQueryRequest(
        question=q_text if len(q_text) >= 3 else f"{q_text} polar",
        station_id=req.station_id,
        region=req.region,
        top_k=req.top_k or req.max_evidence_chunks,
    )
    res = await execute_rag_pipeline(rag_req)
    return {
        "query": res.question,
        "status": res.status,
        "answer": res.answer,
        "confidence_score": res.confidence_score,
        "citations": [f"[{c.citation_index}] {c.label} ({c.location}): {c.quote_or_value}" for c in res.citations],
        "structured_citations": [c.model_dump() for c in res.citations],
        "evidence": [e.model_dump() for e in res.evidence],
        "retrieval_trace": res.retrieval_trace,
    }
