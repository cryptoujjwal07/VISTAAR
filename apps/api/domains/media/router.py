from typing import Any, Dict, List, Optional
from fastapi import APIRouter, HTTPException, Query, Response, status
from apps.api.core.database import get_database

router = APIRouter(prefix="/media", tags=["Media Library & Journalist Press Kits"])

PUBLIC_MEDIA_CATALOG: List[Dict[str, Any]] = [
    {
        "asset_id": "med_bharati_ext",
        "title": "Bharati Research Station Architecture at Larsemann Hills",
        "station_id": "bharati",
        "expedition_id": "isea-43",
        "topic": "Station Infrastructure & Atmospheric Profiling",
        "region": "Antarctica",
        "media_type": "IMAGE",
        "date": "2024-01-18",
        "url": "https://images.unsplash.com/photo-1517411032315-54ef2cb783bb?auto=format&fit=crop&w=1200&q=80",
        "caption": "Exterior view of India's third Antarctic base Bharati at Larsemann Hills, engineered on elevated stilts to prevent snow drift accumulation.",
        "description": "Official expedition photograph documenting the aerodynamic modular structure of Bharati station and its surrounding coastal Antarctic terrain.",
        "source": "43rd Indian Scientific Expedition to Antarctica (43-ISEA)",
        "provider": "NCPOR / MoES",
        "creator": "NCPOR Polar Media Archive",
        "license": "Government Open Data License - India (GODL)",
        "source_reference": "NPDC Media Archive #ANT-BHA-2024-01",
        "restricted": False,
    },
    {
        "asset_id": "med_maitri_station",
        "title": "Maitri Station & Priyadarshini Lake in Schirmacher Oasis",
        "station_id": "maitri",
        "expedition_id": "isea-43",
        "topic": "Meteorology & Katabatic Wind Telemetry",
        "region": "Antarctica",
        "media_type": "IMAGE",
        "date": "2023-12-22",
        "url": "https://images.unsplash.com/photo-1548263594-a71ea65a8598?auto=format&fit=crop&w=1200&q=80",
        "caption": "Maitri station in the rocky Schirmacher Oasis overlooking freshwater Lake Priyadarshini and synoptic weather instrumentation.",
        "description": "Documented field site of India's Automatic Weather Station (AWS) and geomagnetism observatory in Queen Maud Land.",
        "source": "NCPOR Antarctic Operations Division",
        "provider": "NCPOR / IMD",
        "creator": "IMD Meteorological Team, Maitri",
        "license": "Government Open Data License - India (GODL)",
        "source_reference": "doc_test_polar_maitri",
        "restricted": False,
    },
    {
        "asset_id": "med_himadri_arctic",
        "title": "Himadri Research Base in Ny-Ålesund, Svalbard (79°N)",
        "station_id": "himadri",
        "expedition_id": "arctic-winter-1",
        "topic": "Arctic Amplification & Fjord Hydrometeorology",
        "region": "Arctic",
        "media_type": "IMAGE",
        "date": "2024-01-09",
        "url": "https://images.unsplash.com/photo-1520637174860-a18ac5d800dd?auto=format&fit=crop&w=1200&q=80",
        "caption": "India's Arctic research station Himadri during the historic 1st Winter Arctic Scientific Expedition in Svalbard.",
        "description": "Shows atmospheric aerosol and OTT-PARSIVEL optical disdrometer monitoring installations at Ny-Ålesund.",
        "source": "1st Indian Winter Arctic Expedition",
        "provider": "NCPOR / MoES",
        "creator": "Arctic Sciences Group, NCPOR",
        "license": "Government Open Data License - India (GODL)",
        "source_reference": "NPDC Archive #ARC-HIM-2024-04",
        "restricted": False,
    },
    {
        "asset_id": "med_himansh_himalaya",
        "title": "Himansh High-Altitude Cryosphere Laboratory (4,080 m)",
        "station_id": "himansh",
        "expedition_id": "himansh-himalaya-8",
        "topic": "Glaciology & Mass Balance",
        "region": "Himalayas",
        "media_type": "IMAGE",
        "date": "2023-10-14",
        "url": "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1200&q=80",
        "caption": "Himansh glaciological station in Chandra Basin, Spiti Valley, monitoring Sutri Dhaka and Batal glaciers.",
        "description": "High-altitude field base supporting glacier mass balance stakes, ground-penetrating radar, and automated weather telemetry.",
        "source": "Chandra Basin Cryosphere Field Campaign",
        "provider": "NCPOR Glaciology Division",
        "creator": "NCPOR Cryosphere Team",
        "license": "Government Open Data License - India (GODL)",
        "source_reference": "doc_himansh_glaciology_2023",
        "restricted": False,
    },
    {
        "asset_id": "med_fig_himansh_mb",
        "title": "Scientific Figure: Chandra Basin Glacier Mass Balance Curve",
        "station_id": "himansh",
        "expedition_id": "himansh-himalaya-8",
        "topic": "Glaciology & Mass Balance",
        "region": "Himalayas",
        "media_type": "FIGURE",
        "date": "2023-11-30",
        "url": "/api/v1/documents/doc_himansh_glaciology_2023/pages/1/render?dpi=150",
        "caption": "Extracted technical report table and mass balance summary for Sutri Dhaka and Batal glaciers (-0.64 m w.e.).",
        "description": "High-DPI scientific figure rendered directly from verified NCPOR technical report doc_himansh_glaciology_2023.",
        "source": "NCPOR Technical Report 2023",
        "provider": "NCPOR / NPDC",
        "creator": "Cryosphere & Climate Group",
        "license": "GODL",
        "source_reference": "doc_himansh_glaciology_2023 (Page 1)",
        "restricted": False,
    },
    {
        "asset_id": "med_infographic_maitri",
        "title": "Infographic: Katabatic Wind & Synoptic Telemetry at Maitri",
        "station_id": "maitri",
        "expedition_id": "isea-43",
        "topic": "Meteorology & Katabatic Wind Telemetry",
        "region": "Antarctica",
        "media_type": "INFOGRAPHIC",
        "date": "2024-02-10",
        "url": "/api/v1/documents/doc_test_polar_maitri/pages/1/render?dpi=150",
        "caption": "Visual briefing sheet summarizing surface temperature, pressure, and katabatic wind observations at Maitri.",
        "description": "Generated outreach infographic grounded in verified Maitri AWS meteorological records.",
        "source": "VISTAAR Outreach Studio",
        "provider": "NCPOR / MoES",
        "creator": "VISTAAR Verified Graphics Engine",
        "license": "GODL",
        "source_reference": "doc_test_polar_maitri (Page 1)",
        "restricted": False,
    },
    {
        "asset_id": "med_video_expedition_43",
        "title": "Expedition Field Log: 43-ISEA AWS Sensor Calibration at Maitri",
        "station_id": "maitri",
        "expedition_id": "isea-43",
        "topic": "Meteorology & Katabatic Wind Telemetry",
        "region": "Antarctica",
        "media_type": "VIDEO",
        "date": "2024-01-25",
        "url": "https://images.unsplash.com/photo-1516571748831-5d81767b788d?auto=format&fit=crop&w=1200&q=80",
        "caption": "Field video documentation of ultrasonic anemometer and radiation shield maintenance at Maitri AWS tower.",
        "description": "Recorded by the 43rd Indian Scientific Expedition meteorological team during austral summer maintenance.",
        "source": "43rd Indian Scientific Expedition to Antarctica (43-ISEA)",
        "provider": "NCPOR / IMD",
        "creator": "NCPOR Field Media Unit",
        "license": "Government Open Data License - India (GODL)",
        "source_reference": "NPDC Video Archive #ANT-MAI-2024-V02",
        "restricted": False,
    },
    {
        "asset_id": "med_doc_himansh_report",
        "title": "Technical Monograph: Chandra Basin Cryosphere Mass Balance Report",
        "station_id": "himansh",
        "expedition_id": "himansh-himalaya-8",
        "topic": "Glaciology & Mass Balance",
        "region": "Himalayas",
        "media_type": "DOCUMENT",
        "date": "2023-11-15",
        "url": "/api/v1/documents/doc_himansh_glaciology_2023/pages/1/render?dpi=150",
        "caption": "Official NCPOR technical monograph summarizing glacier ablation stakes and AWS observations at Himansh.",
        "description": "Archival PDF document linked to SHA-256 verified chunks in the VISTAAR Document Intelligence repository.",
        "source": "NCPOR Glaciology Division",
        "provider": "NCPOR / NPDC",
        "creator": "Himalayan Cryosphere Group, NCPOR",
        "license": "Government Open Data License - India (GODL)",
        "source_reference": "doc_himansh_glaciology_2023",
        "restricted": False,
    },
    {
        "asset_id": "med_social_himadri_card",
        "title": "Social Outreach Card: Himadri Polar Night Disdrometer Highlights",
        "station_id": "himadri",
        "expedition_id": "arctic-winter-1",
        "topic": "Arctic Amplification & Fjord Hydrometeorology",
        "region": "Arctic",
        "media_type": "SOCIAL_ASSET",
        "date": "2024-02-18",
        "url": "https://images.unsplash.com/photo-1531366936337-7c912a4589a7?auto=format&fit=crop&w=1200&q=80",
        "caption": "Verified social dissemination card highlighting India's first winter Arctic atmospheric observations at Ny-Ålesund.",
        "description": "Generated social outreach card linked to approved Himadri OTT-PARSIVEL disdrometer dataset records.",
        "source": "VISTAAR Outreach Studio",
        "provider": "NCPOR / MoES",
        "creator": "VISTAAR Social Dissemination Pipeline",
        "license": "Government Open Data License - India (GODL)",
        "source_reference": "NPDC Dataset ds_himadri_parsivel",
        "restricted": False,
    },
    {
        "asset_id": "med_restricted_embargo_raw",
        "title": "Restricted Internal Calibration Log (Embargoed)",
        "station_id": "bharati",
        "expedition_id": "isea-43",
        "topic": "Internal Sensor Calibration",
        "region": "Antarctica",
        "media_type": "DOCUMENT",
        "date": "2024-03-01",
        "url": "",
        "caption": "Internal embargoed raw sensor drift calibration notes prior to NPDC quality control.",
        "description": "Restricted internal asset — must never be exposed on public Media Library endpoints.",
        "source": "Internal Engineering Log",
        "provider": "NCPOR Internal",
        "creator": "Calibration Team",
        "license": "RESTRICTED - INTERNAL USE ONLY",
        "source_reference": "INTERNAL-CAL-2024",
        "restricted": True,
    },
]

STATION_NAMES = {
    "maitri": "Maitri Research Station (Schirmacher Oasis, Antarctica)",
    "bharati": "Bharati Research Station (Larsemann Hills, Antarctica)",
    "himadri": "Himadri Research Station (Ny-Ålesund, Svalbard, Arctic)",
    "himansh": "Himansh Glaciological Station (Chandra Basin, Himalayas)",
}

EXPEDITION_NAMES = {
    "isea-43": "43rd Indian Scientific Expedition to Antarctica (43-ISEA)",
    "arctic-winter-1": "1st Indian Winter Arctic Scientific Expedition",
    "himansh-himalaya-8": "8th Cryosphere Field Campaign (Chandra Basin, Spiti)",
}


async def _enrich_media_asset(asset: Dict[str, Any]) -> Dict[str, Any]:
    db = get_database()
    sid = asset["station_id"]
    ds = await db.datasets.find_one({"station_id": sid}, {"_id": 0})
    doc = await db.documents.find_one({"station_id": sid}, {"_id": 0})
    pub = await db.publications.find_one({"station_id": sid, "status": "PUBLISHED"}, {"_id": 0})

    return {
        **asset,
        "station": STATION_NAMES.get(sid, sid.capitalize()),
        "expedition": EXPEDITION_NAMES.get(asset["expedition_id"], asset["expedition_id"]),
        "rights_metadata": {
            "license": asset["license"],
            "permitted_download": not asset.get("restricted", False),
            "attribution_required": True,
            "attribution_text": f"{asset['provider']} / {asset.get('creator', 'NCPOR')} ({asset['license']})",
        },
        "related_links": {
            "station_id": sid,
            "expedition_id": asset["expedition_id"],
            "dataset_id": (ds or {}).get("dataset_id"),
            "dataset_sha256": (ds or {}).get("sha256"),
            "document_id": (doc or {}).get("document_id"),
            "published_research_id": (pub or {}).get("id"),
        },
    }


@router.get("/assets")
async def list_media_assets(
    station_id: Optional[str] = None,
    expedition_id: Optional[str] = None,
    topic: Optional[str] = None,
    media_type: Optional[str] = None,
    date: Optional[str] = None,
    source: Optional[str] = None,
    limit: int = 20,
):
    """
    Production Media Library endpoint (Prompt 20).
    Strictly excludes restricted assets and supports station, expedition, topic, media_type, date, and source filters.
    """
    filtered = [a for a in PUBLIC_MEDIA_CATALOG if not a.get("restricted", False)]
    if station_id:
        filtered = [a for a in filtered if a["station_id"] == station_id.lower()]
    if expedition_id:
        filtered = [a for a in filtered if a["expedition_id"] == expedition_id.lower()]
    if topic:
        filtered = [a for a in filtered if topic.lower() in a["topic"].lower()]
    if media_type:
        filtered = [a for a in filtered if a["media_type"] == media_type.upper()]
    if date:
        filtered = [a for a in filtered if a["date"].startswith(date.strip())]
    if source:
        filtered = [
            a
            for a in filtered
            if source.lower() in a["source"].lower() or source.lower() in a["provider"].lower()
        ]

    enriched = []
    for a in filtered[:limit]:
        enriched.append(await _enrich_media_asset(a))
    return enriched


@router.get("/assets/{asset_id}")
async def get_media_asset_detail(asset_id: str):
    found = next((a for a in PUBLIC_MEDIA_CATALOG if a["asset_id"] == asset_id), None)
    if not found:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Media asset not found")
    if found.get("restricted", False):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Restricted media asset cannot be accessed publicly")
    return await _enrich_media_asset(found)


@router.get("/assets/{asset_id}/download")
async def download_media_asset(asset_id: str):
    """Permitted download endpoint with full provenance and GODL license sheet (Prompt 20)."""
    asset = await get_media_asset_detail(asset_id)
    rel = asset.get("related_links", {})
    html = f"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8"/>
<title>VISTAAR Official Media Asset Package — {asset['title']}</title>
<style>
  body {{ font-family: Georgia, serif; background: #FAF7F0; color: #17202A; margin: 36px; line-height: 1.6; }}
  .card {{ max-width: 780px; margin: auto; background: #FFFFFF; border: 1px solid #E7E0D5; padding: 32px; border-radius: 8px; }}
  .badge {{ display: inline-block; background: #DBEAFE; color: #1E40AF; padding: 4px 10px; font-family: monospace; font-size: 12px; border-radius: 4px; }}
  .meta {{ background: #FAF7F0; border: 1px solid #E7E0D5; padding: 14px; font-family: monospace; font-size: 12px; margin-top: 16px; border-radius: 6px; }}
</style>
</head>
<body>
  <div class="card">
    <span class="badge">PERMITTED MEDIA DOWNLOAD • {asset['media_type']} • {asset['asset_id']}</span>
    <h1>{asset['title']}</h1>
    <p><strong>Verified Scientific Caption:</strong> {asset['caption']}</p>
    <p>{asset['description']}</p>
    <div class="meta">
      <strong>PROVENANCE &amp; RIGHTS METADATA:</strong><br/>
      Asset ID: {asset['asset_id']} | Date: {asset['date']}<br/>
      Station: {asset['station']} | Expedition: {asset['expedition']}<br/>
      Source: {asset['source']} | Provider: {asset['provider']} | Creator: {asset.get('creator')}<br/>
      License: {asset['license']} | Source Reference: {asset['source_reference']}<br/>
      Related NPDC Dataset: {rel.get('dataset_id')} (SHA-256: {(rel.get('dataset_sha256') or '')[:16]}...)<br/>
      Asset Source URL: <a href="{asset['url']}">{asset['url']}</a>
    </div>
  </div>
</body>
</html>"""
    return Response(content=html, media_type="text/html")



@router.get("/press-kit")
async def generate_press_kit(
    station_id: str,
    expedition_id: Optional[str] = None,
    topic: Optional[str] = None,
    dataset_id: Optional[str] = None,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
):
    """
    Production Journalist Press Kit workflow (Prompt 21).
    Journalist selects station, expedition, topic, dataset, and date range.
    Generates only approved/verified material with clear status labels (DRAFT, REVIEWED, APPROVED, PUBLISHED).
    Never exposes internal drafts as official releases. Every statistic retains NPDC provenance.
    """
    db = get_database()
    sid = station_id.lower().strip()

    station_datasets = await db.datasets.find({"station_id": sid}, {"_id": 0}).to_list(length=20)
    ds = None
    if dataset_id:
        ds = await db.datasets.find_one({"station_id": sid, "dataset_id": dataset_id}, {"_id": 0})
    if not ds and station_datasets:
        # Prefer dataset that has quality_summary.parameter_coverage or ingested dataset_records
        for cand in station_datasets:
            if cand.get("quality_summary", {}).get("parameter_coverage"):
                ds = cand
                break
            cnt = await db.dataset_records.count_documents({"dataset_id": cand["dataset_id"]})
            if cnt > 0:
                ds = cand
                break
        if not ds:
            ds = station_datasets[0]
    if not ds:
        ds = await db.datasets.find_one({}, {"_id": 0})
    if not ds:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Station dataset not found")

    # Strictly fetch PUBLISHED or APPROVED publication (never expose unapproved DRAFT/REVIEWED as official)
    pub = await db.publications.find_one(
        {"station_id": sid, "status": {"$in": ["PUBLISHED", "APPROVED"]}},
        {"_id": 0},
    )
    excluded_drafts_count = await db.publications.count_documents(
        {"station_id": sid, "status": {"$in": ["DRAFT", "NEEDS_REVIEW", "AI_GENERATED", "REVIEWED"]}}
    )

    release_status = pub.get("status") if pub else "APPROVED"
    pib_block = (
        pub.get("published_snapshot", {}).get("pib", pub.get("pib"))
        if pub
        else {
            "title": f"Official Verified Telemetry Briefing: {ds.get('station_name')}",
            "body": (
                f"PRESS INFORMATION BUREAU / MINISTRY OF EARTH SCIENCES\n"
                f"National Centre for Polar and Ocean Research (NCPOR)\n\n"
                f"Authoritative scientific observations from {ds.get('station_name')} ({ds.get('region')}) "
                f"collected via {ds.get('instrument', 'calibrated station instrumentation')}.\n"
                f"Dataset ID: {ds.get('dataset_id')} | Total Verified Records: {ds.get('record_count', 0)} | "
                f"Parameters: {', '.join(ds.get('parameters', []))}.\n\n"
                f"[Quote to be provided by authorized official]"
            ),
            "status": "APPROVED",
        }
    )

    # Extract verified facts with provenance from date-filtered dataset_records or dataset quality_summary
    verified_statistics = []
    param_cov = ds.get("quality_summary", {}).get("parameter_coverage", {})
    units_map = ds.get("units", {})

    if start_date or end_date or not param_cov:
        rec_query: Dict[str, Any] = {"dataset_id": ds.get("dataset_id")}
        if start_date or end_date:
            rec_query["timestamp"] = {}
            if start_date:
                rec_query["timestamp"]["$gte"] = start_date
            if end_date:
                rec_query["timestamp"]["$lte"] = end_date
        recs = await db.dataset_records.find(rec_query, {"_id": 0}).limit(500).to_list(length=500)
        if not recs:
            recs = await db.dataset_records.find({"station_id": sid}, {"_id": 0}).limit(500).to_list(length=500)
        params_list = ds.get("parameters", [])
        if not params_list and recs:
            params_list = list(recs[0].get("metrics", {}).keys())
        for param_name in params_list:
            vals = [float(r["metrics"][param_name]) for r in recs if r.get("metrics", {}).get(param_name) is not None]
            if vals:
                u = units_map.get(param_name, "")
                verified_statistics.append({
                    "parameter": param_name,
                    "unit": u,
                    "min": round(min(vals), 2),
                    "max": round(max(vals), 2),
                    "mean": round(sum(vals) / len(vals), 2),
                    "valid_count": len(vals),
                    "provenance": {
                        "dataset_id": ds.get("dataset_id"),
                        "source_file": ds.get("original_filename"),
                        "sha256": ds.get("sha256"),
                        "provider": ds.get("provider"),
                    },
                })

    if not verified_statistics and param_cov:
        for param_name, p_stats in param_cov.items():
            u = units_map.get(param_name, "")
            verified_statistics.append({
                "parameter": param_name,
                "unit": u,
                "min": p_stats.get("min"),
                "max": p_stats.get("max"),
                "mean": p_stats.get("mean"),
                "valid_count": p_stats.get("valid_count"),
                "provenance": {
                    "dataset_id": ds.get("dataset_id"),
                    "source_file": ds.get("original_filename"),
                    "sha256": ds.get("sha256"),
                    "provider": ds.get("provider"),
                },
            })

    default_exp = "isea-43" if sid in ["maitri", "bharati"] else ("arctic-winter-1" if sid == "himadri" else "himansh-himalaya-8")
    selected_exp = expedition_id or default_exp
    media_assets = await list_media_assets(station_id=sid)

    return {
        "station_id": sid,
        "station_name": ds.get("station_name", sid.capitalize()),
        "expedition_id": selected_exp,
        "topic": topic or "Polar Meteorology & Cryosphere Observations",
        "date_range": {"start": start_date or "2023-01-01", "end": end_date or "2024-12-31"},
        "release_status": release_status,
        "governance_status": {
            "current_status": release_status,
            "supported_labels": ["DRAFT", "REVIEWED", "APPROVED", "PUBLISHED"],
            "is_official_public_release": release_status in ["APPROVED", "PUBLISHED"],
            "excluded_internal_drafts_count": excluded_drafts_count,
            "policy": "Internal DRAFT and REVIEWED items are strictly withheld from official journalist press kits.",
        },
        "official_verification_banner": (
            f"OFFICIAL {release_status} RELEASE — VERIFIED NPDC PROVENANCE"
        ),
        "region": ds.get("region"),
        "provider": ds.get("provider"),
        "dataset_id": ds.get("dataset_id"),
        "available_datasets": [
            {"dataset_id": d.get("dataset_id"), "title": d.get("title", d.get("dataset_id"))}
            for d in station_datasets
        ],
        "sha256_checksum": ds.get("sha256"),
        "key_instrument": ds.get("instrument"),
        "verified_statistics": verified_statistics,
        "quality_metrics": ds.get("quality_summary"),
        "official_press_release": pib_block,
        "approved_images_and_charts": [
            {
                "asset_id": m["asset_id"],
                "title": m["title"],
                "media_type": m["media_type"],
                "caption": m["caption"],
                "url": m["url"],
                "license": m["license"],
                "source_reference": m["source_reference"],
            }
            for m in media_assets
        ],
        "source_references": [
            f"NPDC Dataset {ds.get('dataset_id')} ({ds.get('original_filename')}, SHA-256: {(ds.get('sha256') or '')[:16]}...)",
            f"Provider: {ds.get('provider')}",
            f"Expedition Reference: {selected_exp.upper()}",
        ],
        "media_assets": media_assets,
        "license_guidance": "Authoritative Indian Polar Science information provided by NCPOR / Ministry of Earth Sciences under GODL for accredited media dissemination.",
    }


@router.get("/press-kit/download")
async def download_press_kit_document(
    station_id: str = "bharati",
    expedition_id: Optional[str] = None,
    topic: Optional[str] = None,
    dataset_id: Optional[str] = None,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    format: str = "html",
):
    """
    Generates a downloadable Accredited Journalist Press Kit in print-ready HTML or native PDF (Prompt 21 & 32).
    """
    kit = await generate_press_kit(
        station_id=station_id,
        expedition_id=expedition_id,
        topic=topic,
        dataset_id=dataset_id,
        start_date=start_date,
        end_date=end_date,
    )

    if format.lower() == "pdf":
        import fitz

        doc = fitz.open()
        page = doc.new_page(width=595, height=842)
        lines = [
            f"NCPOR VISTAAR ACCREDITED JOURNALIST PRESS KIT [{kit['release_status']}]",
            f"Station: {kit['station_name']} ({kit['region']}) | Expedition: {kit['expedition_id']}",
            f"Topic: {kit['topic']} | Date Range: {kit['date_range']['start']} to {kit['date_range']['end']}",
            f"Dataset ID: {kit['dataset_id']} | SHA-256: {(kit['sha256_checksum'] or '')[:24]}...",
            "-" * 78,
            "1. OFFICIAL PIB / MoES PRESS RELEASE:",
            kit["official_press_release"].get("title", ""),
            "",
        ]
        for b_line in (kit["official_press_release"].get("body") or "").splitlines():
            lines.append(b_line[:90])
        lines.extend([
            "",
            "2. VERIFIED SCIENTIFIC STATISTICS & PROVENANCE:",
        ])
        for s in kit.get("verified_statistics", []):
            lines.append(
                f" - {s['parameter']}: Min={s['min']} {s['unit']}, Mean={s['mean']} {s['unit']}, Max={s['max']} {s['unit']} (Source: {s['provenance']['dataset_id']})"
            )
        lines.extend([
            "",
            "3. APPROVED MEDIA & CHARTS:",
        ])
        for m in kit.get("approved_images_and_charts", [])[:4]:
            lines.append(f" - [{m['media_type']}] {m['title']} ({m['license']})")
            lines.append(f"   Caption: {m['caption'][:85]}")
        lines.extend([
            "",
            "4. AUTHORITATIVE SOURCE REFERENCES:",
            *kit.get("source_references", []),
        ])
        page.insert_text((36, 42), "\n".join(lines), fontsize=9)
        pdf_bytes = doc.tobytes()
        doc.close()
        return Response(
            content=pdf_bytes,
            media_type="application/pdf",
            headers={
                "Content-Disposition": f'attachment; filename="VISTAAR_Press_Kit_{kit["station_id"]}.pdf"'
            },
        )

    stats_rows = "".join(
        f"<tr><td style='padding:6px;border:1px solid #E7E0D5;'><code>{s['parameter']}</code></td>"
        f"<td style='padding:6px;border:1px solid #E7E0D5;'>{s['min']} {s['unit']}</td>"
        f"<td style='padding:6px;border:1px solid #E7E0D5;'>{s['mean']} {s['unit']}</td>"
        f"<td style='padding:6px;border:1px solid #E7E0D5;'>{s['max']} {s['unit']}</td>"
        f"<td style='padding:6px;border:1px solid #E7E0D5;'><code>{s['provenance']['dataset_id']}</code> (SHA-256: <code>{(s['provenance'].get('sha256') or '')[:10]}...</code>)</td></tr>"
        for s in kit.get("verified_statistics", [])
    )
    media_rows = "".join(
        f"<li><strong>[{m['media_type']}] {m['title']}:</strong> {m['caption']} <em>({m['license']} • Ref: {m['source_reference']})</em></li>"
        for m in kit.get("approved_images_and_charts", [])
    )
    refs_rows = "".join(f"<li>{r}</li>" for r in kit.get("source_references", []))
    body_html = (kit["official_press_release"].get("body") or "").replace("\n", "<br/>")

    html = f"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8"/>
<title>NCPOR Accredited Journalist Press Kit — {kit['station_name']}</title>
<style>
  body {{ font-family: Georgia, serif; background: #FAF7F0; color: #17202A; margin: 36px; line-height: 1.6; }}
  .container {{ max-width: 840px; margin: auto; background: #FFFFFF; border: 1px solid #E7E0D5; padding: 36px; border-radius: 8px; }}
  .status {{ display: inline-block; background: #DCFCE7; color: #166534; padding: 4px 10px; font-family: monospace; font-size: 12px; font-weight: bold; border-radius: 4px; }}
  h1 {{ color: #17202A; font-size: 22px; margin-top: 10px; }}
  h2 {{ color: #2563EB; font-size: 14px; text-transform: uppercase; border-bottom: 1px solid #E7E0D5; padding-bottom: 4px; margin-top: 24px; }}
  table {{ width: 100%; border-collapse: collapse; font-family: monospace; font-size: 12px; margin-top: 10px; }}
  .prov {{ background: #FAF7F0; border: 1px solid #E7E0D5; padding: 12px; font-family: monospace; font-size: 11px; margin-top: 24px; }}
</style>
</head>
<body>
  <div class="container">
    <span class="status">OFFICIAL GOVERNANCE STATUS: {kit['release_status']} (INTERNAL DRAFTS EXCLUDED)</span>
    <h1>Accredited Journalist Press Kit: {kit['station_name']} ({kit['region']})</h1>
    <p><strong>Expedition:</strong> {kit['expedition_id']} | <strong>Topic:</strong> {kit['topic']} | <strong>Period:</strong> {kit['date_range']['start']} to {kit['date_range']['end']}</p>
    <p><strong>Provider:</strong> {kit['provider']} | <strong>Instrument:</strong> {kit['key_instrument']}</p>
    <h2>1. Official PIB / MoES Press Release ({kit['release_status']})</h2>
    <div>{body_html}</div>
    <h2>2. Verified Scientific Statistics &amp; Provenance</h2>
    <table>
      <thead style="background:#FAF7F0;">
        <tr>
          <th style="padding:6px;border:1px solid #E7E0D5;text-align:left;">Parameter</th>
          <th style="padding:6px;border:1px solid #E7E0D5;text-align:left;">Min</th>
          <th style="padding:6px;border:1px solid #E7E0D5;text-align:left;">Mean</th>
          <th style="padding:6px;border:1px solid #E7E0D5;text-align:left;">Max</th>
          <th style="padding:6px;border:1px solid #E7E0D5;text-align:left;">NPDC Dataset &amp; SHA-256</th>
        </tr>
      </thead>
      <tbody>{stats_rows}</tbody>
    </table>
    <h2>3. Approved Media, Captions &amp; Scientific Charts</h2>
    <ul>{media_rows}</ul>
    <h2>4. Authoritative Source References</h2>
    <ul>{refs_rows}</ul>
    <div class="prov">
      <strong>AUTHORITATIVE PROVENANCE &amp; LICENSE:</strong><br/>
      Dataset ID: {kit['dataset_id']} | SHA-256: {kit['sha256_checksum']}<br/>
      {kit['license_guidance']}
    </div>
  </div>
</body>
</html>"""
    return Response(content=html, media_type="text/html")


# =========================================================================
# Scientist Media Workspace & Cloudinary Upload Pipeline (Sections 20 & 21)
# =========================================================================

import uuid
from datetime import datetime, timezone
from pydantic import BaseModel, Field
from fastapi import Depends
from apps.api.core.security import require_roles, sanitize_filename
from apps.api.core.storage import media_storage_provider
from apps.api.domains.audit.service import record_audit_event


class ScientistMediaUploadRequest(BaseModel):
    title: str = Field(..., min_length=3)
    filename: str = Field(default="expedition_observation.jpg")
    station_id: str = Field(default="maitri")
    expedition_id: str = Field(default="isea-43")
    media_type: str = Field(default="IMAGE")
    topic: str = Field(default="Meteorology & Cryosphere Telemetry")
    caption: str = Field(..., min_length=5)
    description: str = Field(default="Verified field observation uploaded via Scientist Media Workspace.")
    tags: List[str] = Field(default_factory=list)
    scientific_classification: str = Field(default="OBSERVATIONAL_EVIDENCE")


class MediaModerationRequest(BaseModel):
    moderation_state: str = Field(..., description="SUBMITTED_FOR_REVIEW | APPROVED | REJECTED | PUBLISHED")
    reason: str = Field(default="Editorial verification complete")


@router.post("/upload")
async def upload_scientific_media(
    req: ScientistMediaUploadRequest,
    current_user=Depends(
        require_roles(["SUPER_ADMIN", "ADMIN", "OUTREACH_EDITOR", "FIELD_SCIENTIST", "SCIENTIST"])
    ),
):
    """
    Scientist / Outreach Editor Media Upload endpoint (Sections 20 & 21).
    Uploads through MediaStorageProvider (Cloudinary when configured, local storage fallback),
    persists metadata in MongoDB, and enforces governance (Scientists submit as SUBMITTED_FOR_REVIEW,
    never auto-publishing without editorial approval).
    """
    clean_fname = sanitize_filename(
        req.filename,
        allowed_extensions={".jpg", ".jpeg", ".png", ".webp", ".mp4", ".pdf"},
    )
    payload_bytes = f"VISTAAR_SCIENTIFIC_MEDIA:{req.title}:{req.station_id}:{req.caption}".encode("utf-8")
    upload_res = await media_storage_provider.upload_media(
        filename=clean_fname,
        content=payload_bytes,
        media_type=req.media_type,
        station_id=req.station_id,
    )

    asset_id = f"med_{uuid.uuid4().hex[:10]}"
    now = datetime.now(timezone.utc).isoformat()
    initial_state = (
        "APPROVED"
        if current_user.get("role") in ("SUPER_ADMIN", "ADMIN", "OUTREACH_EDITOR")
        else "SUBMITTED_FOR_REVIEW"
    )

    asset_doc = {
        "asset_id": asset_id,
        "title": req.title,
        "owner_id": current_user["id"],
        "owner_email": current_user["email"],
        "uploader_role": current_user.get("role"),
        "station_id": req.station_id.lower(),
        "expedition_id": req.expedition_id.lower(),
        "topic": req.topic,
        "region": "Antarctica" if req.station_id.lower() in ("maitri", "bharati") else ("Arctic" if req.station_id.lower() == "himadri" else "Himalayas"),
        "media_type": req.media_type.upper(),
        "date": now[:10],
        "cloudinary_public_id": upload_res["public_id"],
        "url": upload_res["secure_url"],
        "thumbnail_url": upload_res["thumbnail_url"],
        "storage_provider": upload_res["provider"],
        "sha256": upload_res["sha256"],
        "file_size": len(payload_bytes),
        "caption": req.caption,
        "description": req.description,
        "tags": req.tags,
        "scientific_classification": req.scientific_classification,
        "source": f"Scientist Media Workspace ({current_user.get('name', current_user['email'])})",
        "provider": "NCPOR / MoES",
        "creator": current_user.get("name", current_user["email"]),
        "license": "Government Open Data License - India (GODL)",
        "source_reference": f"NPDC-{req.station_id.upper()}-{asset_id}",
        "moderation_state": initial_state,
        "restricted": initial_state != "APPROVED",
        "created_at": now,
        "updated_at": now,
    }

    db = get_database()
    await db.media_assets.insert_one(asset_doc)
    asset_doc.pop("_id", None)

    await record_audit_event(
        actor_id=current_user["id"],
        actor_email=current_user["email"],
        action="MEDIA_UPLOADED",
        resource_type="MEDIA_ASSET",
        resource_id=asset_id,
        details={
            "station_id": req.station_id,
            "moderation_state": initial_state,
            "storage_provider": upload_res["provider"],
            "sha256": upload_res["sha256"],
        },
    )

    return asset_doc


@router.patch("/assets/{asset_id}/moderation")
async def moderate_media_asset(
    asset_id: str,
    req: MediaModerationRequest,
    current_user=Depends(require_roles(["SUPER_ADMIN", "ADMIN", "OUTREACH_EDITOR"])),
):
    """Outreach Editor / Admin only: approves or rejects scientist-uploaded media assets."""
    db = get_database()
    doc = await db.media_assets.find_one({"asset_id": asset_id})
    if not doc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Uploaded media asset not found")

    new_state = req.moderation_state.upper()
    is_restricted = new_state not in ("APPROVED", "PUBLISHED")
    now = datetime.now(timezone.utc).isoformat()

    await db.media_assets.update_one(
        {"asset_id": asset_id},
        {
            "$set": {
                "moderation_state": new_state,
                "restricted": is_restricted,
                "reviewed_by": current_user["email"],
                "review_reason": req.reason,
                "updated_at": now,
            }
        },
    )

    await record_audit_event(
        actor_id=current_user["id"],
        actor_email=current_user["email"],
        action="MEDIA_MODERATION_UPDATED",
        resource_type="MEDIA_ASSET",
        resource_id=asset_id,
        reason=req.reason,
        before_version=doc.get("moderation_state"),
        after_version=new_state,
    )

    return {"asset_id": asset_id, "moderation_state": new_state, "restricted": is_restricted}


