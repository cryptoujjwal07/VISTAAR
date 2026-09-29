from fastapi import APIRouter, HTTPException, Query, status
from typing import Optional, List
import numpy as np
from apps.api.core.database import get_database

router = APIRouter(prefix="/weather", tags=["Weather Intelligence"])

@router.get("/stations")
async def list_weather_stations():
    db = get_database()
    # Distinct station IDs with active datasets
    distinct_stations = await db.datasets.distinct("station_id")
    
    # Enrich with station descriptors
    station_meta = {
        "maitri": {
            "id": "maitri",
            "name": "Maitri Research Station",
            "region": "Antarctica",
            "location": "Schirmacher Oasis",
            "coordinates": {"lat": -70.7667, "lng": 11.7333, "elevation": 117},
            "status": "ACTIVE"
        },
        "bharati": {
            "id": "bharati",
            "name": "Bharati Research Station",
            "region": "Antarctica",
            "location": "Larsemann Hills",
            "coordinates": {"lat": -69.4072, "lng": 76.1956, "elevation": 35},
            "status": "ACTIVE"
        },
        "himadri": {
            "id": "himadri",
            "name": "Himadri Research Station",
            "region": "Arctic",
            "location": "Ny-Ålesund, Svalbard",
            "coordinates": {"lat": 78.9272, "lng": 11.9281, "elevation": 10},
            "status": "ACTIVE"
        },
        "himansh": {
            "id": "himansh",
            "name": "Himansh Glaciological Station",
            "region": "Himalayas",
            "location": "Spiti Valley, Chandra Basin",
            "coordinates": {"lat": 32.4042, "lng": 77.6167, "elevation": 4080},
            "status": "ACTIVE"
        }
    }

    result = []
    for sid in distinct_stations:
        sid_clean = sid.lower()
        if sid_clean in station_meta:
            result.append(station_meta[sid_clean])
        else:
            result.append({
                "id": sid_clean,
                "name": f"{sid.capitalize()} Observatory",
                "region": "Polar Region",
                "location": "Scientific Field Post",
                "coordinates": {"lat": 0, "lng": 0, "elevation": 0},
                "status": "ACTIVE"
            })
    return result

@router.get("/timeseries")
async def get_weather_timeseries(
    station_id: str,
    parameter: Optional[str] = None,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    limit: int = Query(500, ge=1, le=2000)
):
    db = get_database()
    sid = station_id.lower()
    
    # Find dataset for station
    ds = await db.datasets.find_one({"station_id": sid}, {"_id": 0})
    if not ds:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"No dataset found for station {station_id}")

    # Default parameter if not specified
    available_params = ds.get("parameters", [])
    if not available_params:
        available_params = ["tempr", "airtemp_avg", "intensity"]
        
    param = parameter if (parameter and parameter in available_params) else available_params[0]
    unit = ds.get("units", {}).get(param, "")

    query = {"station_id": sid, f"metrics.{param}": {"$ne": None}}
    if start_date or end_date:
        query["timestamp"] = {}
        if start_date:
            query["timestamp"]["$gte"] = start_date
        if end_date:
            query["timestamp"]["$lte"] = end_date

    cursor = db.dataset_records.find(query, {"_id": 0}).sort("timestamp", 1).limit(limit)
    records = await cursor.to_list(length=limit)

    points = []
    values = []
    for r in records:
        val = r["metrics"].get(param)
        if val is not None:
            values.append(val)
            points.append({
                "timestamp": r["timestamp"],
                "value": val,
                "unit": unit,
                "quality": r.get("quality_flags", {}).get(param, "VALID"),
                "record_id": r["record_id"],
                "provenance": r.get("provenance", {})
            })

    stats = {
        "count": len(values),
        "min": round(float(np.min(values)), 2) if values else None,
        "max": round(float(np.max(values)), 2) if values else None,
        "avg": round(float(np.mean(values)), 2) if values else None,
        "unit": unit
    }

    return {
        "station_id": sid,
        "station_name": ds.get("station_name", sid),
        "dataset_id": ds.get("dataset_id"),
        "parameter": param,
        "available_parameters": available_params,
        "unit": unit,
        "statistics": stats,
        "points": points
    }

@router.get("/records/{record_id}")
async def get_observation_provenance(record_id: str):
    db = get_database()
    record = await db.dataset_records.find_one({"record_id": record_id}, {"_id": 0})
    if not record:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Observation record not found")
    return record
