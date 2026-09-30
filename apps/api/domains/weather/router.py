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
        sid_clean = sid.lower().strip()
        if sid_clean in ("unknown", ""):
            continue
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
    range_mode: Optional[str] = Query(
        None,
        description="Time-range control: LIVE | DAY | WEEK | MONTH | YEAR | CUSTOM (Sections 16 & 54)",
    ),
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    limit: int = Query(1500, ge=1, le=2000),
    downsample: Optional[int] = Query(None, ge=3, le=1000, description="LTTB peak-preserving downsampling target point count (Prompt 27)"),
):
    """
    Production VISTAAR Weather Intelligence endpoint (Prompt 16, 27 & Sections 15–18, 26, 54).
    Uses ONLY real ingested NPDC data. Dynamically detects available parameters,
    tracks missing data without replacing with zero, supports time-range controls
    (LIVE, DAY, WEEK, MONTH, YEAR, CUSTOM) with resolution adaptation, IQR/robust anomaly explanations,
    and links every chart point to its original dataset record and SHA-256 provenance.
    """
    from apps.api.core.performance import lttb_downsample, ttl_cache

    sid = station_id.lower().strip()
    mode_clean = (range_mode or ("CUSTOM" if (start_date or end_date) else "MONTH")).upper().strip()
    cache_key = f"weather:ts:v2:{sid}:{dataset_id}:{provider}:{parameter}:{mode_clean}:{start_date}:{end_date}:{limit}:{downsample}"
    cached = ttl_cache.get(cache_key)
    if cached is not None:
        return cached

    db = get_database()

    ds_query: Dict[str, Any] = {"station_id": sid}
    if dataset_id:
        ds_query["dataset_id"] = dataset_id
    if provider:
        ds_query["provider"] = {"$regex": provider, "$options": "i"}

    candidate_datasets = await db.datasets.find(ds_query, {"_id": 0}).to_list(length=20)
    if not candidate_datasets and provider:
        candidate_datasets = await db.datasets.find({"station_id": sid}, {"_id": 0}).to_list(length=20)
    if not candidate_datasets:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"No dataset found for station '{station_id}'",
        )

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

    # Apply range_mode windowing & adaptive resolution over real dataset records
    effective_limit = limit
    sort_dir = -1
    target_downsample = downsample
    resolution_label = "RAW_OBSERVATION"

    if mode_clean == "LIVE":
        effective_limit = 18
        sort_dir = -1
        target_downsample = None
        resolution_label = "LIVE_SENSOR_BURST (LATEST 18 OBS)"
    elif mode_clean == "DAY":
        effective_limit = 36
        sort_dir = -1
        target_downsample = None
        resolution_label = "DIURNAL_SYNOPTIC_WINDOW (36 OBS)"
    elif mode_clean == "WEEK":
        effective_limit = 84
        sort_dir = -1
        target_downsample = downsample or 84
        resolution_label = "WEEKLY_SYNOPTIC_RESOLUTION (84 OBS)"
    elif mode_clean == "MONTH":
        effective_limit = 240
        sort_dir = -1
        target_downsample = downsample or 96
        resolution_label = "MONTHLY_WINDOW_LTTB (240 RAW → 96 PTS)"
    elif mode_clean == "YEAR":
        effective_limit = 1500
        sort_dir = -1
        target_downsample = downsample or 140
        resolution_label = "ANNUAL_ARCHIVE_LTTB (FULL CYCLE → 140 PTS)"
    else:
        effective_limit = min(limit, 500)
        sort_dir = 1
        target_downsample = downsample or 150
        resolution_label = (
            f"CUSTOM_DATE_WINDOW ({start_date or 'START'} → {end_date or 'END'})"
            if (start_date or end_date)
            else "HISTORICAL_BASELINE_WINDOW (EARLIEST 500 OBS)"
        )

    cursor = db.dataset_records.find(query, {"_id": 0}).sort("timestamp", sort_dir).limit(effective_limit)
    records = await cursor.to_list(length=effective_limit)
    if sort_dir == -1:
        records.reverse()

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

    # Robust IQR + physical bounds anomaly detection with human-readable scientific explanations (Section 26)
    anomalies: List[Dict[str, Any]] = []
    if len(values) >= 4:
        arr = np.asarray(values, dtype=np.float64)
        q25, q75 = float(np.percentile(arr, 25)), float(np.percentile(arr, 75))
        iqr = max(q75 - q25, 1e-6)
        low_fence = q25 - 1.8 * iqr
        high_fence = q75 + 1.8 * iqr
        for pt in points:
            v = pt["value"]
            if v < low_fence or v > high_fence or pt["quality_flag"] not in ("VALID",):
                direction = "above" if v > high_fence else "below"
                pt["is_anomaly"] = True
                pt["anomaly_explanation"] = (
                    f"{param} observation ({v} {unit}) is significantly {direction} "
                    f"the station's robust interquartile distribution ([{round(low_fence, 2)}, {round(high_fence, 2)}] {unit}) for this period."
                )
                anomalies.append({
                    "record_id": pt["record_id"],
                    "timestamp": pt["timestamp"],
                    "value": v,
                    "unit": unit,
                    "explanation": pt["anomaly_explanation"],
                })
            else:
                pt["is_anomaly"] = False

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

    raw_point_count = len(points)
    if target_downsample and len(points) > target_downsample:
        points = lttb_downsample(points, target_downsample)

    provider_name = ds.get("provider", "National Centre for Polar and Ocean Research (NCPOR) / NPDC")
    source_citation = (
        f"National Polar Data Centre (NPDC), MoES. Dataset '{ds.get('title', ds.get('dataset_id'))}' "
        f"(File: {ds.get('original_filename')}, SHA-256: {(ds.get('sha256') or '')[:16]}...)."
    )

    payload = {
        "station_id": sid,
        "station_name": ds.get("station_name", sid.capitalize()),
        "dataset_id": ds.get("dataset_id"),
        "available_datasets": [
            {"dataset_id": c["dataset_id"], "title": c.get("title", c["dataset_id"])}
            for c in candidate_datasets
        ],
        "provider": provider_name,
        "available_providers": available_providers,
        "range_mode": mode_clean,
        "resolution": resolution_label,
        "supported_range_modes": ["LIVE", "DAY", "WEEK", "MONTH", "YEAR", "CUSTOM"],
        "period": period,
        "parameter": param,
        "available_parameters": available_params,
        "unit": unit,
        "source_citation": source_citation,
        "quality_breakdown": quality_counts,
        "statistics": stats,
        "anomalies": anomalies[:25],
        "anomaly_count": len(anomalies),
        "downsampled": bool(target_downsample and raw_point_count > len(points)),
        "raw_point_count": raw_point_count,
        "returned_point_count": len(points),
        "points": points,
        "missing_points": missing_points,
        "series": points,
    }
    ttl_cache.set(cache_key, payload, ttl_seconds=45.0)
    return payload


@router.get("/records/{record_id}")
async def get_observation_provenance(record_id: str):
    db = get_database()
    record = await db.dataset_records.find_one({"record_id": record_id}, {"_id": 0})
    if not record:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Observation record not found")
    return record


EXPEDITIONS_CATALOG: List[Dict[str, Any]] = [
    {
        "id": "isea-43",
        "name": "43rd Indian Scientific Expedition to Antarctica (43-ISEA)",
        "season": "2023–2024",
        "vessel": "MV Vasiliy Golovnin",
        "leader": "National Centre for Polar and Ocean Research (NCPOR), MoES",
        "status": "ACTIVE",
        "station_ids": ["maitri", "bharati"],
        "stations": ["Maitri Research Station (Schirmacher Oasis)", "Bharati Research Station (Larsemann Hills)"],
        "objectives": (
            "Continuous synoptic surface meteorology, high-frequency ultrasonic anemometry, "
            "tropospheric microwave radiometry, ice-core paleoclimate synthesis, and Prydz Bay oceanography."
        ),
        "topics": [
            "Katabatic Wind Dynamics",
            "Tropospheric Radiometry",
            "Ice-Core Paleoclimate",
            "Prydz Bay Oceanography",
            "Geomagnetism",
        ],
        "timeline": [
            {
                "phase": "Expedition Mobilization & Cape Town Charter",
                "period": "Oct–Nov 2023",
                "station": "Goa / Cape Town Staging",
                "description": "Calibration of AWS sensors, radiometers, and cargo loading aboard MV Vasiliy Golovnin.",
            },
            {
                "phase": "Maitri & Bharati Austral Summer Operations",
                "period": "Dec 2023 – Mar 2024",
                "station": "Maitri & Bharati Stations",
                "description": "Continuous 1-minute and hourly surface meteorological logging, radiosonde launches, and ice-shelf surveys.",
            },
            {
                "phase": "Austral Wintering Telemetry & NPDC Archival",
                "period": "Apr 2024 – Present",
                "station": "Maitri & Bharati Observatories",
                "description": "Automated telemetry transmission, quality-flagging, and SHA-256 dataset ingestion into NPDC.",
            },
        ],
    },
    {
        "id": "arctic-winter-1",
        "name": "1st Indian Winter Arctic Scientific Expedition",
        "season": "2023–2024",
        "vessel": "Svalbard Polar Airlift & Kongsfjorden Mooring",
        "leader": "Arctic Operations Division, NCPOR / MoES",
        "status": "ACTIVE",
        "station_ids": ["himadri"],
        "stations": ["Himadri Research Station (Ny-Ålesund, Svalbard)"],
        "objectives": (
            "Year-round high-Arctic polar night atmospheric physics, laser optical disdrometry (PARSIVEL), "
            "Kongsfjorden hydrography, and IndARC sub-surface mooring telemetry."
        ),
        "topics": [
            "Arctic Amplification",
            "Hydrometeor Disdrometry",
            "Polar Night Atmospheric Physics",
            "IndARC Sub-surface Mooring",
        ],
        "timeline": [
            {
                "phase": "Inaugural Polar Night Deployment",
                "period": "Dec 2023",
                "station": "Himadri Station, Ny-Ålesund",
                "description": "Historic deployment of Indian winter scientific team to Svalbard for year-round Arctic observation.",
            },
            {
                "phase": "PARSIVEL Optical Disdrometer & Precipitation Campaign",
                "period": "Jan – May 2024",
                "station": "Himadri Atmospheric Roof Lab",
                "description": "Continuous hydrometeor size-velocity spectrum capture and rain/snow phase transitions.",
            },
            {
                "phase": "Kongsfjorden Summer Mooring Turnaround",
                "period": "Jun – Sep 2024",
                "station": "Kongsfjorden & Himadri",
                "description": "Retrieval and re-deployment of IndARC mooring sensors and NPDC dataset publication.",
            },
        ],
    },
    {
        "id": "himansh-himalaya-8",
        "name": "8th Cryosphere Field Campaign (Chandra Basin, Spiti)",
        "season": "2023–2024",
        "vessel": "High-Altitude Terrestrial Convoy",
        "leader": "Himalayan Cryosphere Group, NCPOR",
        "status": "ACTIVE",
        "station_ids": ["himansh"],
        "stations": ["Himansh Glaciological Station (Spiti Valley, 4080 m a.s.l.)"],
        "objectives": (
            "Glacier mass-balance monitoring across Sutri Dhaka and Chhota Shigri glaciers, "
            "high-altitude automated weather station (AWS) telemetry, and snow-water equivalent profiling."
        ),
        "topics": [
            "Glacier Mass Balance",
            "Sutri Dhaka & Batal Ablation",
            "Third Pole AWS Telemetry",
            "Himalayan Meltwater Hydrology",
        ],
        "timeline": [
            {
                "phase": "Pre-Monsoon AWS Sensor Verification",
                "period": "May – Jun 2024",
                "station": "Himansh Base (4,080 m a.s.l.)",
                "description": "Maintenance of Campbell Scientific AWS towers and radiation shields in Chandra Basin.",
            },
            {
                "phase": "Peak Ablation Glacier Stake Measurements",
                "period": "Jul – Sep 2024",
                "station": "Sutri Dhaka & Batal Glaciers",
                "description": "DGPS kinematic surveys, ground-penetrating radar ice thickness profiling, and discharge gauging.",
            },
            {
                "phase": "High-Altitude Winter Telemetry Archival",
                "period": "Oct 2024 – Present",
                "station": "Himansh Observatory",
                "description": "Automated sub-zero temperature, relative humidity, and wind vector archival in NPDC.",
            },
        ],
    },
]


@router.get("/stations/{station_id}/explorer")
async def get_station_relational_explorer(station_id: str):
    """
    Production Station & Expedition Relational Explorer (Prompt 18).
    Uses live MongoDB database relationships across datasets, documents, weather telemetry,
    published research, classroom modules, and media assets while preserving source provenance.
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

    expeditions = [exp for exp in EXPEDITIONS_CATALOG if sid in exp["station_ids"]]

    # Compute database-backed weather telemetry summary for this station
    total_records = await db.dataset_records.count_documents({"station_id": sid})
    latest_rec = await db.dataset_records.find_one({"station_id": sid}, {"_id": 0}, sort=[("timestamp", -1)])
    earliest_rec = await db.dataset_records.find_one({"station_id": sid}, {"_id": 0}, sort=[("timestamp", 1)])
    primary_ds = datasets[0] if datasets else {}

    weather_summary = {
        "station_id": sid,
        "total_records": total_records,
        "dataset_count": len(datasets),
        "primary_dataset_id": primary_ds.get("dataset_id"),
        "primary_dataset_sha256": primary_ds.get("sha256"),
        "parameters": primary_ds.get("parameters", []),
        "units": primary_ds.get("units", {}),
        "period": {
            "start": earliest_rec.get("timestamp") if earliest_rec else None,
            "end": latest_rec.get("timestamp") if latest_rec else None,
        },
        "latest_observation": {
            "record_id": latest_rec.get("record_id") if latest_rec else None,
            "timestamp": latest_rec.get("timestamp") if latest_rec else None,
            "metrics": latest_rec.get("metrics", {}) if latest_rec else {},
        },
    }

    research_topics: List[str] = []
    for exp in expeditions:
        for t in exp.get("topics", []):
            if t not in research_topics:
                research_topics.append(t)

    return {
        "station": station_info,
        "expeditions": expeditions,
        "datasets": datasets,
        "documents": documents,
        "weather_summary": weather_summary,
        "published_research": published_research,
        "education_modules": related_education,
        "media_assets": related_media,
        "research_topics": research_topics,
    }


@router.get("/expeditions")
async def list_expeditions(station_id: Optional[str] = None):
    """
    Production Expedition Directory (Prompt 18).
    Enriches each expedition with live relational database counts across datasets,
    scientific PDFs, published outreach, education modules, and media assets.
    """
    db = get_database()
    from apps.api.domains.classroom.router import list_lessons
    from apps.api.domains.media.router import list_media_assets

    all_lessons = await list_lessons()
    results = []

    for exp in EXPEDITIONS_CATALOG:
        if station_id and station_id.lower().strip() not in exp["station_ids"]:
            continue

        sids = exp["station_ids"]
        ds_count = await db.datasets.count_documents({"station_id": {"$in": sids}})
        doc_count = await db.documents.count_documents({"station_id": {"$in": sids}})
        pub_count = await db.publications.count_documents({"station_id": {"$in": sids}, "status": "PUBLISHED"})
        edu_count = len([
            l for l in all_lessons
            if l.get("station_id") in sids or any(s in l.get("station", "").lower() for s in sids)
        ])
        media_items = []
        for s in sids:
            media_items.extend(await list_media_assets(station_id=s))

        results.append({
            **exp,
            "counts": {
                "datasets": ds_count,
                "documents": doc_count,
                "published_content": pub_count,
                "education_modules": edu_count,
                "media_assets": len({m["asset_id"]: m for m in media_items}),
            },
        })

    return results


@router.get("/expeditions/{expedition_id}/explorer")
async def get_expedition_relational_explorer(expedition_id: str):
    """
    Production Expedition Relational Explorer (Prompt 18).
    Connects expedition overview, timeline, scientific documents, NPDC datasets,
    media assets, scientific topics, related education, and related public content
    via database relationships while preserving SHA-256 source provenance.
    """
    db = get_database()
    eid = expedition_id.lower().strip()
    exp = next((e for e in EXPEDITIONS_CATALOG if e["id"] == eid), None)
    if not exp:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Expedition '{expedition_id}' not found")

    sids = exp["station_ids"]
    datasets = await db.datasets.find({"station_id": {"$in": sids}}, {"_id": 0}).to_list(length=30)
    documents = await db.documents.find({"station_id": {"$in": sids}}, {"_id": 0}).to_list(length=30)
    published_items = await db.publications.find(
        {"station_id": {"$in": sids}, "status": "PUBLISHED"}, {"_id": 0}
    ).to_list(length=20)

    # Preserve immutable published_snapshot on related_public_content
    related_public_content = []
    for item in published_items:
        snap = item.get("published_snapshot") or {}
        related_public_content.append({
            "id": item.get("id"),
            "status": item.get("status"),
            "station_id": item.get("station_id"),
            "dataset_id": item.get("dataset_id"),
            "version": snap.get("version", item.get("version")),
            "published_at": item.get("published_at"),
            "pib": snap.get("pib", item.get("pib")),
            "education": snap.get("education", item.get("education")),
            "approved_by": item.get("approved_by"),
        })

    from apps.api.domains.classroom.router import list_lessons
    from apps.api.domains.media.router import list_media_assets

    all_lessons = await list_lessons()
    related_education = [
        l for l in all_lessons
        if l.get("station_id") in sids or any(s in l.get("station", "").lower() for s in sids)
    ]

    media_map: Dict[str, Any] = {}
    for s in sids:
        for asset in await list_media_assets(station_id=s):
            media_map[asset["asset_id"]] = asset
    related_media = list(media_map.values())

    return {
        "expedition": exp,
        "timeline": exp["timeline"],
        "scientific_topics": exp["topics"],
        "datasets": datasets,
        "documents": documents,
        "media_assets": related_media,
        "related_education": related_education,
        "related_public_content": related_public_content,
        "provenance": {
            "provider": "National Centre for Polar and Ocean Research (NCPOR) / NPDC",
            "station_ids": sids,
            "dataset_sha256_fingerprints": [
                {"dataset_id": d.get("dataset_id"), "sha256": d.get("sha256"), "filename": d.get("original_filename")}
                for d in datasets
            ],
            "document_sha256_fingerprints": [
                {"document_id": doc.get("document_id"), "sha256": doc.get("sha256"), "filename": doc.get("original_filename")}
                for doc in documents
            ],
        },
    }


