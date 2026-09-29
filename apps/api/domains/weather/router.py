from typing import Any, Dict, List, Optional
import numpy as np
from fastapi import APIRouter, HTTPException, Query, status
from apps.api.core.database import get_database

router = APIRouter(prefix="/weather", tags=["Weather Intelligence"])


@router.get("/stations")
async def list_weather_stations():
    db = get_database()
    distinct_stations = await db.datasets.distinct("station_id")

    station_meta = {
        "maitri": {
            "id": "maitri",
            "name": "Maitri Research Station",
            "region": "Antarctica",
            "location": "Schirmacher Oasis",
            "provider": "NCPOR / National Polar Data Centre (NPDC)",
            "coordinates": {"lat": -70.7667, "lng": 11.7333, "elevation": 117},
            "status": "ACTIVE",
        },
        "bharati": {
            "id": "bharati",
            "name": "Bharati Research Station",
            "region": "Antarctica",
            "location": "Larsemann Hills",
            "provider": "NCPOR / National Polar Data Centre (NPDC)",
            "coordinates": {"lat": -69.4072, "lng": 76.1956, "elevation": 35},
            "status": "ACTIVE",
        },
        "himadri": {
            "id": "himadri",
            "name": "Himadri Research Station",
            "region": "Arctic",
            "location": "Ny-Ålesund, Svalbard",
            "provider": "NCPOR / National Polar Data Centre (NPDC)",
            "coordinates": {"lat": 78.9272, "lng": 11.9281, "elevation": 10},
            "status": "ACTIVE",
        },
        "himansh": {
            "id": "himansh",
            "name": "Himansh Glaciological Station",
            "region": "Himalayas",
            "location": "Spiti Valley, Chandra Basin",
            "provider": "NCPOR / National Polar Data Centre (NPDC)",
            "coordinates": {"lat": 32.4042, "lng": 77.6167, "elevation": 4080},
            "status": "ACTIVE",
        },
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
                "provider": "NCPOR / National Polar Data Centre (NPDC)",
                "coordinates": {"lat": 0, "lng": 0, "elevation": 0},
                "status": "ACTIVE",
            })
    return result


@router.get("/timeseries")
async def get_weather_timeseries(
    station_id: str,
    dataset_id: Optional[str] = None,
    provider: Optional[str] = None,
    parameter: Optional[str] = None,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    limit: int = Query(500, ge=1, le=2000),
):
    """
    Production VISTAAR Weather Intelligence endpoint (Prompt 16).
    Uses ONLY real ingested NPDC data. Dynamically detects available parameters,
    tracks missing data without replacing with zero, and links every chart point
    to its original dataset record and SHA-256 provenance.
    """
    db = get_database()
    sid = station_id.lower().strip()

    ds_query: Dict[str, Any] = {"station_id": sid}
    if dataset_id:
        ds_query["dataset_id"] = dataset_id
    if provider:
        ds_query["provider"] = {"$regex": provider, "$options": "i"}

    candidate_datasets = await db.datasets.find(ds_query, {"_id": 0}).to_list(length=20)
    if not candidate_datasets and provider:
        # Fallback if provider filter didn't match station's subset
        candidate_datasets = await db.datasets.find({"station_id": sid}, {"_id": 0}).to_list(length=20)
    if not candidate_datasets:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"No dataset found for station '{station_id}'",
        )

    # Select dataset that has ingested records
    ds = candidate_datasets[0]
    for cand in candidate_datasets:
        cnt = await db.dataset_records.count_documents({"dataset_id": cand["dataset_id"]})
        if cnt > 0:
            ds = cand
            break

    available_providers = sorted(
        list({c.get("provider", "NCPOR / NPDC") for c in candidate_datasets if c.get("provider")})
    ) or ["NCPOR / National Polar Data Centre (NPDC)"]

    available_params = ds.get("parameters", [])
    if not available_params:
        # Dynamically inspect first record metrics
        sample_rec = await db.dataset_records.find_one({"dataset_id": ds["dataset_id"]}, {"_id": 0})
        available_params = list((sample_rec or {}).get("metrics", {}).keys()) or ["tempr"]

    param = parameter if (parameter and parameter in available_params) else available_params[0]
    unit = ds.get("units", {}).get(param, "")

    query: Dict[str, Any] = {"dataset_id": ds["dataset_id"]}
    if start_date or end_date:
        query["timestamp"] = {}
        if start_date:
            query["timestamp"]["$gte"] = start_date
        if end_date:
            query["timestamp"]["$lte"] = end_date

    cursor = db.dataset_records.find(query, {"_id": 0}).sort("timestamp", 1).limit(limit)
    records = await cursor.to_list(length=limit)

    points = []
    missing_points = []
    values = []
    missing_count = 0
    quality_counts: Dict[str, int] = {"VALID": 0, "MISSING": 0, "SUSPECT": 0}

    for idx, r in enumerate(records):
        val = r.get("metrics", {}).get(param)
        q_flag = r.get("quality_flags", {}).get(param, "VALID" if val is not None else "MISSING")
        quality_counts[q_flag] = quality_counts.get(q_flag, 0) + 1

        if val is None:
            # Never replace missing values with zero (Prompt 16 strict rule)
            missing_count += 1
            missing_points.append({
                "index": idx,
                "timestamp": r.get("timestamp"),
                "record_id": r.get("record_id"),
                "quality_flag": "MISSING",
                "value": None,
            })
            continue

        values.append(float(val))
        points.append({
            "timestamp": r["timestamp"],
            "value": float(val),
            "unit": unit,
            "quality": q_flag,
            "quality_flag": q_flag,
            "record_id": r["record_id"],
            "provenance": r.get("provenance", {}),
        })

    period = {
        "start": points[0]["timestamp"] if points else None,
        "end": points[-1]["timestamp"] if points else None,
    }

    stats = {
        "count": len(values),
        "missing_count": missing_count,
        "min": round(float(np.min(values)), 2) if values else None,
        "max": round(float(np.max(values)), 2) if values else None,
        "avg": round(float(np.mean(values)), 2) if values else None,
        "unit": unit,
    }

    provider_name = ds.get("provider", "National Centre for Polar and Ocean Research (NCPOR) / NPDC")
    source_citation = (
        f"National Polar Data Centre (NPDC), MoES. Dataset '{ds.get('title', ds.get('dataset_id'))}' "
        f"(File: {ds.get('original_filename')}, SHA-256: {(ds.get('sha256') or '')[:16]}...)."
    )

    return {
        "station_id": sid,
        "station_name": ds.get("station_name", sid.capitalize()),
        "dataset_id": ds.get("dataset_id"),
        "available_datasets": [
            {"dataset_id": c["dataset_id"], "title": c.get("title", c["dataset_id"])}
            for c in candidate_datasets
        ],
        "provider": provider_name,
        "available_providers": available_providers,
        "period": period,
        "parameter": param,
        "available_parameters": available_params,
        "unit": unit,
        "source_citation": source_citation,
        "quality_breakdown": quality_counts,
        "statistics": stats,
        "points": points,
        "missing_points": missing_points,
        "series": points,
    }


@router.get("/records/{record_id}")
async def get_observation_provenance(record_id: str):
    db = get_database()
    record = await db.dataset_records.find_one({"record_id": record_id}, {"_id": 0})
    if not record:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Observation record not found")
    return record


@router.get("/stations/{station_id}/explorer")
async def get_station_relational_explorer(station_id: str):
    """
    Production Station & Expedition Relational Explorer (Prompt 18).
    Uses live MongoDB database relationships across datasets, documents, published research,
    classroom modules, and media assets while preserving source provenance.
    """
    db = get_database()
    sid = station_id.lower().strip()
    all_stations = await list_weather_stations()
    station_info = next((s for s in all_stations if s["id"] == sid), None)
    if not station_info:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Station '{station_id}' not found")

    datasets = await db.datasets.find({"station_id": sid}, {"_id": 0}).to_list(length=25)
    documents = await db.documents.find({"station_id": sid}, {"_id": 0}).to_list(length=25)
    published_research = await db.publications.find(
        {"station_id": sid, "status": "PUBLISHED"}, {"_id": 0}
    ).to_list(length=15)

    from apps.api.domains.classroom.router import list_lessons
    from apps.api.domains.media.router import list_media_assets

    all_lessons = await list_lessons()
    related_education = [l for l in all_lessons if l.get("station_id") == sid or sid in l.get("station", "").lower()]
    related_media = await list_media_assets(station_id=sid)

    expedition_map = {
        "maitri": [
            {
                "id": "isea-43",
                "name": "43rd Indian Scientific Expedition to Antarctica (43-ISEA)",
                "season": "2023–2024",
                "vessel": "MV Vasiliy Golovnin",
                "topics": ["Katabatic Wind Dynamics", "Ice-Core Paleoclimate", "Geomagnetism"],
            }
        ],
        "bharati": [
            {
                "id": "isea-43",
                "name": "43rd Indian Scientific Expedition to Antarctica (43-ISEA)",
                "season": "2023–2024",
                "vessel": "MV Vasiliy Golovnin",
                "topics": ["Tropospheric Radiometry", "Prydz Bay Oceanography", "Sea-Ice Albedo"],
            }
        ],
        "himadri": [
            {
                "id": "arctic-winter-1",
                "name": "1st Indian Winter Arctic Scientific Expedition",
                "season": "2023–2024",
                "vessel": "Svalbard Polar Airlift & Kongsfjorden Mooring",
                "topics": ["Arctic Amplification", "Hydrometeor Disdrometry", "IndARC Sub-surface Mooring"],
            }
        ],
        "himansh": [
            {
                "id": "himansh-himalaya-8",
                "name": "8th Cryosphere Field Campaign (Chandra Basin, Spiti)",
                "season": "2023–2024",
                "vessel": "High-Altitude Terrestrial Convoy",
                "topics": ["Glacier Mass Balance", "Sutri Dhaka & Batal Ablation", "Third Pole AWS Telemetry"],
            }
        ],
    }

    return {
        "station": station_info,
        "expeditions": expedition_map.get(sid, []),
        "datasets": datasets,
        "documents": documents,
        "published_research": published_research,
        "education_modules": related_education,
        "media_assets": related_media,
    }

