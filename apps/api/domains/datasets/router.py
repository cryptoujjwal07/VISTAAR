from fastapi import APIRouter, HTTPException, Query, status
from typing import Optional, List
from apps.api.core.database import get_database

router = APIRouter(prefix="/datasets", tags=["Scientific Datasets"])

@router.get("")
async def list_datasets(
    station_id: Optional[str] = None,
    region: Optional[str] = None,
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0)
):
    db = get_database()
    filter_query = {}
    if station_id:
        filter_query["station_id"] = station_id.lower()
    if region:
        filter_query["region"] = {"$regex": region, "$options": "i"}

    cursor = db.datasets.find(filter_query, {"_id": 0}).skip(offset).limit(limit)
    items = await cursor.to_list(length=limit)
    total = await db.datasets.count_documents(filter_query)

    return {
        "total": total,
        "items": items,
        "limit": limit,
        "offset": offset
    }

@router.get("/{dataset_id}")
async def get_dataset(dataset_id: str):
    db = get_database()
    dataset = await db.datasets.find_one({"dataset_id": dataset_id}, {"_id": 0})
    if not dataset:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Dataset not found")
    return dataset

@router.get("/{dataset_id}/records")
async def get_dataset_records(
    dataset_id: str,
    limit: int = Query(100, ge=1, le=500),
    offset: int = Query(0, ge=0)
):
    db = get_database()
    cursor = db.dataset_records.find({"dataset_id": dataset_id}, {"_id": 0}).skip(offset).limit(limit)
    records = await cursor.to_list(length=limit)
    total = await db.dataset_records.count_documents({"dataset_id": dataset_id})

    return {
        "dataset_id": dataset_id,
        "total": total,
        "limit": limit,
        "offset": offset,
        "records": records
    }
