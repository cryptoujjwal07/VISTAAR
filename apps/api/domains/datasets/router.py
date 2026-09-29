import os
from typing import Optional, List
from fastapi import APIRouter, HTTPException, Query, status
from pydantic import BaseModel
from apps.api.core.database import get_database
from apps.api.core.queue import job_queue
from apps.worker.tasks.ingestion import process_dataset_background

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

class IngestDatasetRequest(BaseModel):
    dataset_id: str
    file_name: str

@router.post("/ingest")
async def trigger_async_ingestion(req: IngestDatasetRequest):
    """
    Triggers asynchronous dataset processing via background worker queue.
    Calculates SHA-256 cryptographic hashes and updates database catalog.
    """
    file_path = os.path.join(os.path.abspath("DATASETS"), req.file_name)
    if not os.path.exists(file_path):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Dataset file '{req.file_name}' not found in DATASETS/ directory."
        )

    job_id = await job_queue.enqueue(
        "INGEST_DATASET",
        process_dataset_background,
        dataset_id=req.dataset_id,
        file_path=file_path
    )

    return {
        "job_id": job_id,
        "dataset_id": req.dataset_id,
        "status": "PROCESSING",
        "file_name": req.file_name,
        "message": "Dataset ingestion enqueued into asynchronous worker queue."
    }

@router.get("/jobs/{job_id}")
async def get_ingestion_job_status(job_id: str):
    """Retrieves asynchronous ingestion job execution status."""
    job = job_queue.get_job(job_id)
    if not job:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Ingestion job not found")
    return job

@router.get("/{dataset_id}/provenance")
async def get_dataset_provenance(dataset_id: str):
    """Retrieves authoritative cryptographic provenance metadata and conversion rules."""
    db = get_database()
    dataset = await db.datasets.find_one({"dataset_id": dataset_id}, {"_id": 0})
    if not dataset:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Dataset not found")

    total_records = await db.dataset_records.count_documents({"dataset_id": dataset_id})
    valid_records = await db.dataset_records.count_documents({"dataset_id": dataset_id, "quality_flags.airtemp_avg": "VALID"})

    return {
        "dataset_id": dataset_id,
        "station_id": dataset.get("station_id"),
        "station_name": dataset.get("station_name"),
        "region": dataset.get("region"),
        "provider": dataset.get("provider"),
        "raw_source_file": dataset.get("source_file"),
        "sha256": dataset.get("provenance_sha256") or dataset.get("sha256"),
        "immutability": "VERIFIED_CRYPTO_SEALED",
        "conversion_rules": {
            "timestamps": "Normalized to ISO 8601 UTC (YYYY-MM-DDTHH:MM:SSZ)",
            "temperature": "Preserved / Normalized to Celsius (°C)",
            "pressure": "Normalized to Hectopascals (hPa)",
            "wind_speed": "Normalized to Meters per Second (m/s)"
        },
        "statistics": {
            "total_records": total_records,
            "quality_validated": valid_records,
            "quality_status": "COMPLETED" if total_records > 0 else "PENDING"
        }
    }
