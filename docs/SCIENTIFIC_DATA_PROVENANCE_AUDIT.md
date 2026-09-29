# VISTAAR — Scientific Data Provenance Audit

**Auditor**: VISTAAR Lead Scientific Data Architect  
**Authority**: NCPOR (National Centre for Polar and Ocean Research), MoES  
**Audit Standard**: FAIR Guiding Principles for Scientific Data Management & Production Engineering Contract  
**Date**: 2026-09-29  

---

## 1. End-to-End Data Provenance Trace

The following table traces a representative real measurement from the raw file through to publication:

```
RAW FILE ──> INGESTION ──> NORMALIZATION ──> DATABASE ──> QUERY ──> CHART ──> AI CONTEXT ──> CLAIM ──> VERIFICATION ──> REVIEW ──> PUBLICATION
```

### Trace Sample 1: Himansh High-Altitude Meteorological Station
1. **Raw File**: `DATASETS/himansh.csv` (Size: 543,540 bytes)
2. **SHA-256 Checksum**: `1e310a2e5cae435518b8b90460e64aef0009ffc6605c454f442792481a01e952`
3. **Provider / Station**: NCPOR / Himansh Station (Spiti Valley, Chandra Basin, 4,080m AMSL)
4. **Raw Observation**:
   - Source Line: 2 (Row 0)
   - Raw Field: `airtemp_avg_date_time` = `4.086`
   - Raw Timestamp: `2015-10-18 18:30:00+00`
5. **Normalization & Quality Control**:
   - Normalized Parameter: `airtemp_avg`
   - Normalized Value: `4.086 °C`
   - Quality Assessment: `VALID` (Falls within physical sanity range of -90°C to +45°C)
6. **Database Persistence**:
   - Collection: `dataset_records` in `vistaar_production` MongoDB Atlas cluster
   - Record ID: `rec_himansh_0`
   - Dataset ID: `ds_himansh_aws`
   - Coordinates: `[32.4042°N, 77.6167°E, 4080m]`
7. **Query & Charting**:
   - API Endpoint: `GET /api/v1/weather/timeseries?station_id=himansh&parameter=airtemp_avg`
   - Point Rendered: `{ "timestamp": "2015-10-18T18:30:00+00:00", "value": 4.086, "quality": "VALID", "record_id": "rec_himansh_0" }`
8. **AI Synthesis & Claim Generation**:
   - Claim Text: *"Himansh recorded an observed air temperature of 4.086 °C at 2015-10-18."*
   - Generated Metric: `airtemp_avg` | Claimed Value: `4.086` | Unit: `°C`
9. **Deterministic Claim Verification**:
   - Engine: `apps/api/domains/claims/router.py`
   - Result: `VERIFIED`
   - Evidence Proof: Deterministically matched against `rec_himansh_0` in `ds_himansh_aws` (SHA256: `1e310a2e5cae4355...`).
10. **Human Review & Publication Governance**:
   - Outreach Package ID: `outreach_...`
   - Publishing Status: `AI_GENERATED` → `REVIEWED` → `APPROVED` → `PUBLISHED`
   - Reviewer: Authorized Outreach Editor (`admin@vistaar.ncpor.res.in`)
   - Public Availability: Appears on Public Portal only after explicit approval.

---

### Trace Sample 2: Maitri Station Long-Term Surface Synoptic Observation
1. **Raw File**: `DATASETS/imd_maitri.csv` (Size: 6,821,559 bytes, 155,169 rows)
2. **SHA-256 Checksum**: `1916258465883011618b00b2cebfbcf9c052c67b61b9dc640f54a5019ca28074`
3. **Provider / Station**: IMD (India Meteorological Department) / Maitri Station (Schirmacher Oasis, Antarctica)
4. **Missing Value Handling**:
   - Sentinels `-999` and `-999.0` correctly parsed as `None` / `MISSING`.
   - Missing values are **NEVER replaced with zero**. Zero indicates freezing point (0°C) or calm wind (0 knots) and has physical scientific meaning.
5. **Quality Assessment**:
   - Ambient temperatures and atmospheric pressures verified against polar extremes.
   - Decimated sampling preserves overall historical distribution while maintaining sub-second query latency on MongoDB Atlas.

---

## 2. Integrity Verification Checklist

- [x] **No Synthetic Data in Production**: All production records originate directly from files supplied by NCPOR/MoES.
- [x] **Raw Immutability**: All original files in `DATASETS/` remain unmodified in their native encoding and structure.
- [x] **Zero Silent Overwrites**: Audit trails log any update with before/after versioning.
- [x] **Explainable AI**: The AI provider only extracts context from verified records and places official quote placeholders `[Quote to be provided by authorized official]`.
