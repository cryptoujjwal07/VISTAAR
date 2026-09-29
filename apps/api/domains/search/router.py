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
    "43rd Indian Scientific Expedition to Antarctica (43-ISEA)",
    "1st Indian Winter Arctic Expedition (Himadri, Svalbard)",
    "Chandra Basin Himalayan Glaciology Campaign (Himansh)",
    "Katabatic wind speed at Maitri",
    "Glacier mass balance at Sutri Dhaka & Chhota Shigri",
    "Surface air temperature and barometric pressure",
    "OTT-PARSIVEL Laser Disdrometer precipitation",
    "Microwave Radiometer atmospheric humidity profile",
]

SEMANTIC_SYNONYM_MAP: Dict[str, List[str]] = {
    "wind": ["katabatic", "anemometer", "knots", "gust", "synoptic"],
    "katabatic": ["wind", "slope", "maitri", "schirmacher", "boundary"],
    "temperature": ["thermal", "celsius", "cold", "surface air", "aws"],
    "glacier": ["mass balance", "ablation", "himansh", "chandra", "sutri dhaka", "ice"],
    "rain": ["precipitation", "disdrometer", "parsivel", "radar", "mrr", "hydrometeor"],
    "humidity": ["radiometer", "hatpro", "moisture", "water vapor", "tropospheric"],
    "antarctica": ["maitri", "bharati", "schirmacher", "larsemann", "isea", "southern ocean"],
    "arctic": ["himadri", "svalbard", "kongsfjorden", "indarc", "ny-alesund"],
    "himalaya": ["himansh", "chandra", "spiti", "third pole", "glaciology"],
}


def _expand_query_terms(q: str) -> List[str]:
    q_low = q.strip().lower()
    raw_tokens = [t for t in re.split(r"[^a-z0-9\-°]+", q_low) if len(t) >= 2]
    terms = list(dict.fromkeys([q_low] + raw_tokens))
    for token in list(terms):
        for key, syns in SEMANTIC_SYNONYM_MAP.items():
            if key in token or token in key:
                for s in syns:
                    if s not in terms:
                        terms.append(s)
    return terms


def _compute_hybrid_score(text_blob: str, q: str, expanded_terms: List[str]) -> Dict[str, Any]:
    blob_low = text_blob.lower()
    q_low = q.strip().lower()
    exact_match = q_low in blob_low
    raw_tokens = [t for t in re.split(r"[^a-z0-9\-°]+", q_low) if len(t) >= 2] or [q_low]
    keyword_hits = sum(1 for t in raw_tokens if t in blob_low)
    semantic_hits = sum(1 for t in expanded_terms if t in blob_low)

    keyword_score = round(min(1.0, (0.6 if exact_match else 0.0) + 0.4 * (keyword_hits / max(1, len(raw_tokens)))), 3)
    semantic_score = round(min(1.0, semantic_hits / max(1, min(6, len(expanded_terms)))), 3)
    hybrid_score = round(0.65 * keyword_score + 0.35 * semantic_score, 3)
    return {
        "keyword_score": keyword_score,
        "semantic_score": semantic_score,
        "hybrid_score": hybrid_score,
    }


@router.get("/autocomplete")
async def search_autocomplete(q: str = Query(..., min_length=1)):
    """Fast prefix, token, and semantic autocomplete across polar stations, expeditions, instruments, and topics (Prompt 23)."""
    q_low = q.strip().lower()
    tokens = [t for t in q_low.split() if t]
    matches = [
        item
        for item in AUTOCOMPLETE_CORPUS
        if q_low in item.lower() or any(tok in item.lower() for tok in tokens)
    ]
    return {"query": q, "suggestions": matches[:8]}


@router.get("")
async def unified_search(
    q: str = Query(..., min_length=1),
    region: Optional[str] = None,
    station_id: Optional[str] = None,
    provider: Optional[str] = None,
    dataset_id: Optional[str] = None,
    date: Optional[str] = None,
    topic: Optional[str] = None,
    content_type: Optional[str] = None,  # 'datasets' | 'publications' | 'research' | 'documents' | 'stations' | 'expeditions' | 'media' | 'education' | 'all'
    limit: int = Query(20, ge=1, le=50),
    offset: int = Query(0, ge=0),
):
    """
    Production VISTAAR Unified Search (Prompt 23) across:
    documents, datasets, stations, expeditions, research (published), media, and education.
    Supports keyword + semantic hybrid ranking, provenance metadata, facets, filters, and pagination.
    """
    db = get_database()
    expanded_terms = _expand_query_terms(q)
    pattern_str = "|".join(re.escape(t) for t in expanded_terms[:8]) if expanded_terms else re.escape(q.strip())
    regex_pattern = {"$regex": pattern_str, "$options": "i"}

    results: Dict[str, Any] = {
        "query": q,
        "retrieval_mode": "hybrid_keyword_and_semantic",
        "expanded_terms": expanded_terms[:8],
        "filters_applied": {
            "region": region,
            "station_id": station_id,
            "provider": provider,
            "dataset_id": dataset_id,
            "date": date,
            "topic": topic,
            "content_type": content_type,
        },
        "datasets": [],
        "publications": [],
        "research": [],
        "documents": [],
        "stations": [],
        "expeditions": [],
        "media": [],
        "education": [],
    }

    # 1. Search Datasets (with provenance & hybrid scoring)
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
        if date:
            ds_query["$and"] = ds_query.get("$and", []) + [
                {
                    "$or": [
                        {"temporal_coverage": {"$regex": re.escape(date), "$options": "i"}},
                        {"ingested_at": {"$regex": re.escape(date), "$options": "i"}},
                    ]
                }
            ]
        if topic:
            ds_query["$and"] = ds_query.get("$and", []) + [
                {
                    "$or": [
                        {"title": {"$regex": re.escape(topic), "$options": "i"}},
                        {"instrument": {"$regex": re.escape(topic), "$options": "i"}},
                    ]
                }
            ]
        ds_cursor = db.datasets.find(ds_query, {"_id": 0}).skip(offset).limit(limit)
        raw_datasets = await ds_cursor.to_list(length=limit)
        for ds in raw_datasets:
            blob = f"{ds.get('title', '')} {ds.get('instrument', '')} {ds.get('provider', '')} {ds.get('region', '')} {ds.get('station_name', '')}"
            scores = _compute_hybrid_score(blob, q, expanded_terms)
            ds["retrieval_scores"] = scores
            ds["provenance"] = {
                "source_type": "NPDC_DATASET",
                "dataset_id": ds.get("dataset_id"),
                "provider": ds.get("provider", "NCPOR / NPDC"),
                "station_id": ds.get("station_id"),
                "sha256": ds.get("sha256"),
                "verified": True,
            }
        raw_datasets.sort(key=lambda x: x["retrieval_scores"]["hybrid_score"], reverse=True)
        results["datasets"] = raw_datasets

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
        if dataset_id:
            pub_query["dataset_ids"] = dataset_id
        if date:
            pub_query["published_at"] = {"$regex": re.escape(date), "$options": "i"}
        if topic:
            pub_query["$and"] = [
                {
                    "$or": [
                        {"title": {"$regex": re.escape(topic), "$options": "i"}},
                        {"pib.body": {"$regex": re.escape(topic), "$options": "i"}},
                    ]
                }
            ]
        pub_cursor = db.publications.find(pub_query, {"_id": 0}).skip(offset).limit(limit)
        raw_pubs = await pub_cursor.to_list(length=limit)
        for pub in raw_pubs:
            blob = f"{pub.get('title', '')} {pub.get('pib', {}).get('body', '')} {pub.get('station_id', '')}"
            pub["retrieval_scores"] = _compute_hybrid_score(blob, q, expanded_terms)
            pub["provenance"] = {
                "source_type": "PUBLISHED_RESEARCH_BULLETIN",
                "publication_id": pub.get("id"),
                "provider": "NCPOR Editorial Board",
                "station_id": pub.get("station_id"),
                "dataset_ids": pub.get("dataset_ids", []),
                "verified": pub.get("status") == "PUBLISHED",
            }
        raw_pubs.sort(key=lambda x: x["retrieval_scores"]["hybrid_score"], reverse=True)
        results["publications"] = raw_pubs
        results["research"] = raw_pubs

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
        if topic:
            doc_query["title"] = {"$regex": re.escape(topic), "$options": "i"}
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

        for d in docs_found:
            snippet = d.get("matched_chunk", {}).get("snippet", "")
            blob = f"{d.get('title', '')} {d.get('region', '')} {d.get('station_id', '')} {snippet}"
            d["retrieval_scores"] = _compute_hybrid_score(blob, q, expanded_terms)
            d["provenance"] = {
                "source_type": "SCIENTIFIC_MONOGRAPH_PDF",
                "document_id": d.get("document_id"),
                "provider": d.get("source_organization", "NCPOR / MoES"),
                "station_id": d.get("station_id"),
                "sha256": d.get("sha256"),
                "verified": True,
            }
        docs_found.sort(key=lambda x: x["retrieval_scores"]["hybrid_score"], reverse=True)
        results["documents"] = docs_found[offset : offset + limit] if offset else docs_found[:limit]

    # 4. Search Stations, Expeditions, Media & Education via domain routers
    from apps.api.domains.weather.router import list_weather_stations, list_expeditions
    from apps.api.domains.media.router import list_media_assets
    from apps.api.domains.classroom.router import list_lessons

    def _matches_terms(blob: str) -> bool:
        b_low = blob.lower()
        return any(term in b_low for term in expanded_terms)

    if not content_type or content_type in ["stations", "all"]:
        all_stations = await list_weather_stations()
        matched_stations = []
        for s in all_stations:
            if station_id and s["id"].lower() != station_id.lower():
                continue
            if region and region.lower() not in s["region"].lower():
                continue
            blob = f"{s['name']} {s['region']} {s['location']} {' '.join(s.get('key_research_areas', []))} {' '.join(s.get('instruments', []))}"
            if topic and topic.lower() not in blob.lower():
                continue
            if _matches_terms(blob):
                s_copy = dict(s)
                s_copy["retrieval_scores"] = _compute_hybrid_score(blob, q, expanded_terms)
                s_copy["provenance"] = {
                    "source_type": "POLAR_OBSERVATORY_STATION",
                    "station_id": s["id"],
                    "provider": "NCPOR / IMD",
                    "datasets": s.get("datasets", []),
                    "verified": True,
                }
                matched_stations.append(s_copy)
        matched_stations.sort(key=lambda x: x["retrieval_scores"]["hybrid_score"], reverse=True)
        results["stations"] = matched_stations[offset : offset + limit]

    if not content_type or content_type in ["expeditions", "all"]:
        all_expeditions = await list_expeditions(station_id=station_id)
        matched_expeditions = []
        for exp in all_expeditions:
            objs = exp.get("objectives", "")
            objs_str = " ".join(objs) if isinstance(objs, list) else str(objs)
            season_str = exp.get("season", exp.get("period", ""))
            vessel_str = exp.get("vessel", exp.get("vessel_or_platform", ""))
            blob = (
                f"{exp['name']} {exp['id']} {season_str} "
                f"{vessel_str} {objs_str} "
                f"{' '.join(exp.get('topics', []))} {' '.join(exp.get('stations', []))}"
            )
            if region and region.lower() not in blob.lower():
                continue
            if date and date.lower() not in season_str.lower():
                continue
            if topic and topic.lower() not in blob.lower():
                continue
            if _matches_terms(blob):
                exp_copy = dict(exp)
                exp_copy.setdefault("period", season_str)
                exp_copy.setdefault("vessel_or_platform", vessel_str)
                exp_copy["retrieval_scores"] = _compute_hybrid_score(blob, q, expanded_terms)
                exp_copy["provenance"] = {
                    "source_type": "SCIENTIFIC_EXPEDITION_RECORD",
                    "expedition_id": exp["id"],
                    "provider": exp.get("leader", "NCPOR / MoES"),
                    "station_ids": exp.get("station_ids", []),
                    "verified": True,
                }
                matched_expeditions.append(exp_copy)
        matched_expeditions.sort(key=lambda x: x["retrieval_scores"]["hybrid_score"], reverse=True)
        results["expeditions"] = matched_expeditions[offset : offset + limit]

    if not content_type or content_type in ["media", "all"]:
        all_media = await list_media_assets(
            station_id=station_id,
            topic=topic,
            date=date,
            source=provider,
        )
        matched_media = []
        for m in all_media:
            if region and region.lower() not in m.get("region", "").lower():
                continue
            if dataset_id and m.get("dataset_id") != dataset_id:
                continue
            blob = f"{m['title']} {m['caption']} {m.get('region', '')} {m.get('station_id', '')} {m.get('topic', '')}"
            if _matches_terms(blob):
                m_copy = dict(m)
                m_copy["retrieval_scores"] = _compute_hybrid_score(blob, q, expanded_terms)
                matched_media.append(m_copy)
        matched_media.sort(key=lambda x: x["retrieval_scores"]["hybrid_score"], reverse=True)
        results["media"] = matched_media[offset : offset + limit]

    if not content_type or content_type in ["education", "all"]:
        all_lessons = await list_lessons(class_grade=None)
        matched_lessons = []
        for l in all_lessons:
            if station_id and l.get("station_id", "").lower() != station_id.lower() and station_id.lower() not in l.get("station", "").lower():
                continue
            if region and region.lower() not in l.get("station", "").lower() and region.lower() not in l.get("concept_summary", "").lower():
                continue
            if dataset_id and l.get("real_dataset_ref") != dataset_id:
                continue
            blob = f"{l['title']} {l['concept_summary']} {l['station']} {l.get('subject', '')} {l.get('scientific_concept', '')}"
            if topic and topic.lower() not in blob.lower():
                continue
            if _matches_terms(blob):
                l_copy = dict(l)
                l_copy["retrieval_scores"] = _compute_hybrid_score(blob, q, expanded_terms)
                matched_lessons.append(l_copy)
        matched_lessons.sort(key=lambda x: x["retrieval_scores"]["hybrid_score"], reverse=True)
        results["education"] = matched_lessons[offset : offset + limit]

    results["facets"] = {
        "datasets": len(results["datasets"]),
        "publications": len(results["publications"]),
        "documents": len(results["documents"]),
        "stations": len(results["stations"]),
        "expeditions": len(results["expeditions"]),
        "media": len(results["media"]),
        "education": len(results["education"]),
    }
    results["total_count"] = sum(results["facets"].values())
    results["total_matches"] = results["total_count"]
    results["pagination"] = {
        "limit": limit,
        "offset": offset,
        "returned_count": results["total_count"],
        "has_more": any(count >= limit for count in results["facets"].values()),
    }
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

