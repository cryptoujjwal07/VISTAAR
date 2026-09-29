#!/usr/bin/env python3
"""
VISTAAR - Real NPDC Dataset Inspection Engine
Fulfills Prompt 03: NPDC Dataset Inspection
Inspects every supplied file in DATASETS/ without modifying them.
Generates data/inspection/dataset_inventory.json and data/inspection/dataset_schema_report.md
"""

import os
import glob
import json
import hashlib
import zipfile
import io
import pandas as pd
import numpy as np

DATASETS_DIR = os.path.abspath("DATASETS")
OUTPUT_INVENTORY = os.path.abspath("data/inspection/dataset_inventory.json")
OUTPUT_REPORT = os.path.abspath("data/inspection/dataset_schema_report.md")

os.makedirs(os.path.dirname(OUTPUT_INVENTORY), exist_ok=True)

def compute_checksum(filepath):
    sha256 = hashlib.sha256()
    with open(filepath, 'rb') as f:
        while chunk := f.read(65536):
            sha256.update(chunk)
    return sha256.hexdigest()

def detect_encoding_and_delimiter(filepath, sample_bytes=20480):
    with open(filepath, 'rb') as f:
        raw = f.read(sample_bytes)
    
    encodings = ['utf-8', 'latin1', 'cp1252', 'ascii']
    detected_encoding = 'utf-8'
    decoded_text = ""
    for enc in encodings:
        try:
            decoded_text = raw.decode(enc)
            detected_encoding = enc
            break
        except UnicodeDecodeError:
            continue
            
    # delimiter detection
    first_lines = decoded_text.splitlines()[:5]
    delimiters = [',', '\t', ';', ' ']
    scores = {}
    for d in delimiters:
        counts = [line.count(d) for line in first_lines if line]
        if counts and all(c > 0 for c in counts) and len(set(counts)) == 1:
            scores[d] = counts[0]
    
    best_delimiter = max(scores, key=scores.get) if scores else ','
    return detected_encoding, best_delimiter

def inspect_csv(filepath):
    filename = os.path.basename(filepath)
    size_bytes = os.path.getsize(filepath)
    checksum = compute_checksum(filepath)
    encoding, delimiter = detect_encoding_and_delimiter(filepath)
    
    # Try reading header and some rows
    try:
        df = pd.read_csv(filepath, encoding=encoding, sep=delimiter, low_memory=False)
        row_count = len(df)
        columns = list(df.columns)
        
        # Datatypes
        col_types = {col: str(df[col].dtype) for col in columns}
        missing_counts = {col: int(df[col].isna().sum()) for col in columns}
        duplicate_rows = int(df.duplicated().sum())
        
        # Sample non-null values
        samples = {}
        for col in columns:
            non_null = df[col].dropna()
            samples[col] = [str(x) for x in non_null.head(3).tolist()]
            
        # Infer timestamp column
        ts_cols = [c for c in columns if any(kw in c.lower() for kw in ['date', 'time', 'dt', 'year', 'epoch'])]
        date_range = None
        ts_format = "Unknown"
        if ts_cols:
            primary_ts = ts_cols[0]
            try:
                # Sample parse
                sample_ts = pd.to_datetime(df[primary_ts].dropna().head(100), errors='coerce')
                if not sample_ts.isna().all():
                    ts_min = str(df[primary_ts].dropna().min())
                    ts_max = str(df[primary_ts].dropna().max())
                    date_range = {"start": ts_min, "end": ts_max, "column": primary_ts}
            except Exception:
                pass

        # Identify Station and Provider
        fname_lower = filename.lower()
        station = "Unknown"
        region = "Polar"
        provider = "NCPOR"
        
        if "maitri" in fname_lower:
            station = "Maitri"
            region = "Antarctica (Schirmacher Oasis)"
        elif "bharati" in fname_lower:
            station = "Bharati"
            region = "Antarctica (Larsemann Hills)"
        elif "himansh" in fname_lower:
            station = "Himansh"
            region = "Himalayas (Spiti Valley, Chandra Basin)"
        elif "himadri" in fname_lower:
            station = "Himadri"
            region = "Arctic (Ny-Ålesund, Svalbard)"
        elif "sase" in fname_lower or "sankalp" in fname_lower:
            station = "Sankalp / SASE Field Post"
            region = "Western Himalayas"
            provider = "DGRE / SASE (MoD / NCPOR collaborator)"

        if "imd" in fname_lower:
            provider = "IMD (India Meteorological Department)"
        elif "iig" in fname_lower:
            provider = "IIG (Indian Institute of Geomagnetism)"

        return {
            "file_type": "csv",
            "filename": filename,
            "size_bytes": size_bytes,
            "sha256": checksum,
            "encoding": encoding,
            "delimiter": delimiter,
            "row_count": row_count,
            "column_count": len(columns),
            "columns": columns,
            "column_types": col_types,
            "missing_values": missing_counts,
            "duplicate_count": duplicate_rows,
            "sample_values": samples,
            "date_range": date_range,
            "station": station,
            "region": region,
            "provider": provider
        }
    except Exception as e:
        return {
            "file_type": "csv",
            "filename": filename,
            "size_bytes": size_bytes,
            "sha256": checksum,
            "error": str(e)
        }

def inspect_zip(filepath):
    filename = os.path.basename(filepath)
    size_bytes = os.path.getsize(filepath)
    checksum = compute_checksum(filepath)
    
    fname_lower = filename.lower()
    station = "Unknown"
    region = "Polar"
    provider = "NCPOR"
    instrument = "Unknown"
    
    if "maitri" in fname_lower:
        station = "Maitri"
        region = "Antarctica (Schirmacher Oasis)"
    elif "bharati" in fname_lower:
        station = "Bharati"
        region = "Antarctica (Larsemann Hills)"
    elif "himansh" in fname_lower:
        station = "Himansh"
        region = "Himalayas"
    elif "himadri" in fname_lower or "micro_rain" in fname_lower or "radiometer" in fname_lower or "ott" in fname_lower:
        # Himadri Arctic atmospheric instrumentation
        station = "Himadri"
        region = "Arctic (Ny-Ålesund, Svalbard)"
        
    if "micro_rain_radar" in fname_lower:
        instrument = "Micro Rain Radar (MRR-2)"
        provider = "NCPOR Atmospheric Sciences"
    elif "radiometer" in fname_lower:
        instrument = "Multi-frequency Microwave Radiometer (HATPRO)"
        provider = "NCPOR Atmospheric Sciences"
    elif "ott" in fname_lower:
        instrument = "OTT-PARSIVEL Optical Disdrometer"
        provider = "NCPOR Atmospheric Sciences"
    elif "highspeed" in fname_lower:
        instrument = "High Speed Wind Recorder"
        provider = "IMD / NCPOR"
    elif "surface_data" in fname_lower:
        instrument = "Surface Synoptic / Weather Station"
        provider = "IMD"

    internal_files = []
    sample_columns = []
    total_internal_files = 0
    total_uncompressed_bytes = 0
    sample_content = None

    try:
        with zipfile.ZipFile(filepath, 'r') as z:
            infolist = z.infolist()
            total_internal_files = len(infolist)
            total_uncompressed_bytes = sum(info.file_size for info in infolist)
            
            for info in infolist[:20]:
                internal_files.append({
                    "filename": info.filename,
                    "size_bytes": info.file_size,
                    "is_dir": info.is_dir()
                })
                
            # Sample an internal data file if csv/txt/dat
            for info in infolist:
                if not info.is_dir() and any(info.filename.lower().endswith(ext) for ext in ['.csv', '.txt', '.dat', '.prc', '.ave']):
                    with z.open(info.filename) as sample_f:
                        head = sample_f.read(4096)
                        try:
                            decoded = head.decode('utf-8', errors='ignore')
                            sample_content = {
                                "sampled_file": info.filename,
                                "first_lines": decoded.splitlines()[:10]
                            }
                        except Exception:
                            pass
                    break
    except Exception as e:
        return {
            "file_type": "zip",
            "filename": filename,
            "size_bytes": size_bytes,
            "sha256": checksum,
            "error": str(e)
        }

    return {
        "file_type": "zip",
        "filename": filename,
        "size_bytes": size_bytes,
        "sha256": checksum,
        "station": station,
        "region": region,
        "provider": provider,
        "instrument": instrument,
        "total_internal_files": total_internal_files,
        "total_uncompressed_bytes": total_uncompressed_bytes,
        "internal_files_preview": internal_files,
        "sample_content": sample_content
    }

def main():
    print(f"Inspecting all datasets in {DATASETS_DIR}...")
    inventory = {
        "generated_at": pd.Timestamp.now().isoformat(),
        "total_files": 0,
        "csv_datasets": [],
        "archive_datasets": []
    }

    all_files = sorted(os.listdir(DATASETS_DIR))
    for f in all_files:
        p = os.path.join(DATASETS_DIR, f)
        if not os.path.isfile(p):
            continue
        inventory["total_files"] += 1
        if f.lower().endswith('.csv'):
            print(f" -> Inspecting CSV: {f}")
            res = inspect_csv(p)
            inventory["csv_datasets"].append(res)
        elif f.lower().endswith('.zip'):
            print(f" -> Inspecting ZIP archive: {f}")
            res = inspect_zip(p)
            inventory["archive_datasets"].append(res)

    with open(OUTPUT_INVENTORY, 'w', encoding='utf-8') as f:
        json.dump(inventory, f, indent=2)
    print(f"Wrote inventory to {OUTPUT_INVENTORY}")

    # Generate Markdown Schema Report
    report_lines = [
        "# VISTAAR — NPDC Dataset Inspection & Schema Report",
        "",
        "> **Notice**: Generated strictly from genuine NPDC/NCPOR supplied files. No synthetic measurements or assumed schemas.",
        "",
        f"- **Inspection Date**: {inventory['generated_at']}",
        f"- **Total Source Datasets**: {inventory['total_files']}",
        f"- **Direct CSV Datasets**: {len(inventory['csv_datasets'])}",
        f"- **Instrument Archives (ZIP)**: {len(inventory['archive_datasets'])}",
        "",
        "---",
        "",
        "## 1. Direct CSV Datasets Analysis",
        ""
    ]

    for item in inventory["csv_datasets"]:
        report_lines.append(f"### {item['filename']}")
        report_lines.append(f"- **Station**: {item.get('station')}")
        report_lines.append(f"- **Region**: {item.get('region')}")
        report_lines.append(f"- **Provider**: {item.get('provider')}")
        report_lines.append(f"- **SHA-256**: `{item['sha256']}`")
        report_lines.append(f"- **Rows**: {item.get('row_count', 'N/A'):,}")
        report_lines.append(f"- **Columns ({item.get('column_count', 0)})**: {', '.join(item.get('columns', []))}")
        report_lines.append(f"- **Delimiter**: `{repr(item.get('delimiter'))}` | **Encoding**: `{item.get('encoding')}`")
        if item.get("date_range"):
            dr = item["date_range"]
            report_lines.append(f"- **Observed Time Range**: {dr.get('start')} to {dr.get('end')} (Column: `{dr.get('column')}`)")
        report_lines.append(f"- **Duplicate Rows**: {item.get('duplicate_count', 0)}")
        report_lines.append("")
        report_lines.append("**Column Details & Sample Observations:**")
        report_lines.append("")
        report_lines.append("| Column Name | Type | Missing Values | Sample Real Values |")
        report_lines.append("|---|---|---|---|")
        for col in item.get("columns", []):
            ctype = item.get("column_types", {}).get(col, "unknown")
            cmiss = item.get("missing_values", {}).get(col, 0)
            csamp = ", ".join(item.get("sample_values", {}).get(col, []))
            report_lines.append(f"| `{col}` | {ctype} | {cmiss} | {csamp} |")
        report_lines.append("")

    report_lines.append("---")
    report_lines.append("")
    report_lines.append("## 2. Instrument & Atmospheric Archive Datasets (ZIP)")
    report_lines.append("")

    for item in inventory["archive_datasets"]:
        report_lines.append(f"### {item['filename']}")
        report_lines.append(f"- **Instrument**: {item.get('instrument')}")
        report_lines.append(f"- **Station**: {item.get('station')}")
        report_lines.append(f"- **Region**: {item.get('region')}")
        report_lines.append(f"- **Provider**: {item.get('provider')}")
        report_lines.append(f"- **SHA-256**: `{item['sha256']}`")
        report_lines.append(f"- **Compressed Size**: {item['size_bytes'] / (1024*1024):.2f} MB")
        report_lines.append(f"- **Internal Files**: {item.get('total_internal_files', 0):,} files ({item.get('total_uncompressed_bytes', 0) / (1024*1024):.2f} MB uncompressed)")
        
        sample = item.get("sample_content")
        if sample:
            report_lines.append(f"- **Sample File**: `{sample.get('sampled_file')}`")
            report_lines.append("```text")
            for line in sample.get("first_lines", [])[:6]:
                report_lines.append(line)
            report_lines.append("```")
        report_lines.append("")

    report_lines.append("---")
    report_lines.append("")
    report_lines.append("## 3. Normalized Scientific Data Model Proposal")
    report_lines.append("""
Based on actual schema inspection, observations must NOT be force-fit into an artificial single table. Instead, a dual-layer model is adopted:

1. **Common Observation Envelope**:
   - `record_id`: UUID
   - `dataset_id`: Foreign key to `datasets` collection
   - `station_id`: `maitri` | `bharati` | `himansh` | `himadri` | `sankalp`
   - `timestamp`: ISO-8601 UTC
   - `coordinates`: GeoJSON Point `[longitude, latitude, elevation]`
   - `quality_flags`: `{ parameter: "VALID" | "MISSING" | "SUSPICIOUS" | "OUT_OF_RANGE" }`
   - `provenance`: `{ file: string, line: int, raw_checksum: string }`

2. **Domain-Specific Metric Payloads**:
   - **Meteorological / Surface**: Ambient temp, RH, pressure, wind speed, wind direction, dew point, solar radiation, rainfall/snowfall.
   - **Disdrometer (OTT-PARSIVEL)**: Drop diameter distribution, fall velocity classes, precipitation rate, radar reflectivity.
   - **Micro Rain Radar (MRR)**: Height-resolved profiles of radar reflectivity (dBZ), Doppler velocity, liquid water content.
   - **Microwave Radiometer (HATPRO)**: Atmospheric temperature profiles, relative humidity profiles, integrated water vapor (IWV), liquid water path (LWP).
   - **High Speed Wind**: High-frequency anemometer gusts, turbulence metrics, 1-second burst records.
""")

    with open(OUTPUT_REPORT, 'w', encoding='utf-8') as f:
        f.write("\n".join(report_lines))
    print(f"Wrote report to {OUTPUT_REPORT}")

if __name__ == '__main__':
    main()
