from fastapi import APIRouter, Query
from typing import Optional, List
from apps.api.core.database import get_database

router = APIRouter(prefix="/search", tags=["Unified Scientific Search"])

@router.get("")
async def unified_search(
    q: str = Query(..., min_length=1),
    station_id: Optional[str] = None,
    content_type: Optional[str] = None, # 'datasets' | 'publications' | 'documents'
    limit: int = Query(20, ge=1, le=50)
):
    db = get_database()
    regex_pattern = {"$regex": q, "$options": "i"}
    results = {"query": q, "datasets": [], "publications": [], "documents": []}

    # 1. Search Datasets
    if not content_type or content_type == "datasets":
        ds_query = {
            "$or": [
                {"title": regex_pattern},
                {"provider": regex_pattern},
                {"instrument": regex_pattern},
                {"region": regex_pattern}
            ]
        }
        if station_id:
            ds_query["station_id"] = station_id.lower()
        ds_cursor = db.datasets.find(ds_query, {"_id": 0}).limit(limit)
        results["datasets"] = await ds_cursor.to_list(length=limit)

    # 2. Search Publications
    if not content_type or content_type == "publications":
        pub_query = {
            "status": "PUBLISHED",
            "$or": [
                {"title": regex_pattern},
                {"pib.body": regex_pattern},
                {"education.body": regex_pattern}
            ]
        }
        if station_id:
            pub_query["station_id"] = station_id.lower()
        pub_cursor = db.publications.find(pub_query, {"_id": 0}).limit(limit)
        results["publications"] = await pub_cursor.to_list(length=limit)

    # 3. Search Documents
    if not content_type or content_type == "documents":
        doc_query = {"title": regex_pattern}
        if station_id:
            doc_query["station_id"] = station_id.lower()
        doc_cursor = db.documents.find(doc_query, {"_id": 0}).limit(limit)
        results["documents"] = await doc_cursor.to_list(length=limit)

    results["total_count"] = (
        len(results["datasets"]) + len(results["publications"]) + len(results["documents"])
    )
    return results
