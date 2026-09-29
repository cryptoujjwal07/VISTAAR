import uuid
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

from apps.api.core.database import get_database
from apps.api.domains.claims.normalizer import (
    NormalizedMeasurement,
    compare_measurements,
    extract_normalized_measurements,
    normalize_unit,
    normalize_unit_info,
    parse_single_measurement,
)

VERIFIER_VERSION = "2.0.0-deterministic-npdc"

METRIC_TO_DATASET_FIELDS = {
    "temperature": ["tempr", "airtemp_avg", "airtemp_max", "airtemp_min", "water_temp"],
    "wind_speed": ["ws", "ws_avg", "ws_max"],
    "pressure": ["ap"],
    "humidity": ["rh", "rh_max", "rh_min"],
    "precipitation": ["intensity"],
    "direction": ["wd", "wind_dir"],
}


async def verify_scientific_claim(
    claim_text: str,
    metric: str,
    value: float,
    unit: str,
    location: str,
    source_type: str,
    source_id: str,
    field: Optional[str] = None,
    qualifier: Optional[str] = "observed",
    epistemic_type: Optional[str] = "OBSERVED",
    claim_id: Optional[str] = None,
    persist: bool = True
) -> Dict[str, Any]:
    """
    Deterministic Scientific Claim Verification Engine (Prompt 14).
    Executes an 8-stage verification pipeline and produces an explainable audit record.
    Never silently marks VERIFIED.
    """
    db = get_database()
    cid = claim_id or f"clm_{uuid.uuid4().hex[:10]}"
    now = datetime.now(timezone.utc).isoformat()

    # Step 1 & 2: Parse assertion, extract numbers, normalize values & units
    raw_expr = f"{value} {unit}"
    claimed_norm = parse_single_measurement(
        raw_expr,
        metric=metric,
        location=location,
        qualifier=qualifier
    )
    extracted_in_text = extract_normalized_measurements(claim_text, default_location=location, default_metric=metric)

    trace_steps: List[Dict[str, Any]] = [
        {
            "step": "1_PARSE_AND_NORMALIZE",
            "claimed_expression": raw_expr,
            "canonical_value_si": claimed_norm.canonical_value_si,
            "canonical_unit": claimed_norm.canonical_unit,
            "dimension": claimed_norm.dimension,
            "numbers_extracted_from_text": [m.model_dump() for m in extracted_in_text],
        }
    ]

    status_result = "UNSUPPORTED"
    rule_triggered = "RULE_UNINITIALIZED"
    explanation = ""
    evidence_details: Dict[str, Any] = {}

    # Step 3: Check epistemic type (INFERRED claims require human judgment -> NEEDS_REVIEW if evidence exists)
    epistemic = (epistemic_type or "OBSERVED").upper()

    if source_type.upper() == "DATASET":
        ds = await db.datasets.find_one({"dataset_id": source_id}, {"_id": 0})
        if not ds:
            status_result = "UNSUPPORTED"
            rule_triggered = "RULE_MISSING_SOURCE_DATASET"
            explanation = f"Required evidence is absent: Referenced dataset '{source_id}' does not exist in the authoritative NPDC catalog."
            trace_steps.append({"step": "2_LOCATE_SOURCE", "found": False, "source_id": source_id})
        else:
            trace_steps.append({
                "step": "2_LOCATE_SOURCE",
                "found": True,
                "dataset_id": source_id,
                "station_name": ds.get("station_name"),
                "sha256": ds.get("sha256")
            })

            # Step 4: Check semantic location consistency
            ds_station = (ds.get("station_name") or ds.get("station_id") or "").lower()
            req_loc = (location or "").lower().strip()
            if req_loc and ds_station and (req_loc not in ds_station and ds_station not in req_loc):
                status_result = "CONFLICTING"
                rule_triggered = "RULE_LOCATION_CONFLICT"
                explanation = (
                    f"Location conflict: Claim attributes measurement to '{location}', "
                    f"but authoritative source dataset '{source_id}' belongs to station '{ds.get('station_name')}'."
                )
            else:
                # Step 5: Locate metric parameter in dataset
                params = ds.get("parameters", [])
                target_param = field if (field and field in params) else None
                if not target_param:
                    m_low = metric.lower().strip()
                    if m_low in params:
                        target_param = m_low
                    else:
                        for cand in METRIC_TO_DATASET_FIELDS.get(m_low, []):
                            if cand in params:
                                target_param = cand
                                break
                        if not target_param and claimed_norm.dimension in METRIC_TO_DATASET_FIELDS:
                            for cand in METRIC_TO_DATASET_FIELDS[claimed_norm.dimension]:
                                if cand in params:
                                    target_param = cand
                                    break

                if not target_param:
                    status_result = "UNSUPPORTED"
                    rule_triggered = "RULE_MISSING_METRIC_PARAMETER"
                    explanation = (
                        f"Required evidence is absent: Dataset '{ds.get('title')}' ({source_id}) "
                        f"does not contain parameter '{metric}' (available: {', '.join(params)})."
                    )
                else:
                    ds_unit = ds.get("units", {}).get(target_param, "")
                    ref_dummy = parse_single_measurement(f"{value} {ds_unit}", metric=target_param, location=ds.get("station_name"))
                    unit_check = compare_measurements(claimed_norm, ref_dummy)

                    if not unit_check["unit_compatible"]:
                        status_result = "CONFLICTING"
                        rule_triggered = "RULE_UNIT_DIMENSION_CONFLICT"
                        explanation = (
                            f"Unit/Dimension conflict: Claim asserts '{value} {unit}' ({claimed_norm.dimension}), "
                            f"but dataset parameter '{target_param}' is calibrated in '{ds_unit}' ({ref_dummy.dimension})."
                        )
                        trace_steps.append({"step": "3_UNIT_CHECK", "compatible": False, "reason": unit_check["reason"]})
                    else:
                        trace_steps.append({"step": "3_UNIT_CHECK", "compatible": True, "dataset_unit": ds_unit})

                        # Step 6: Compare numerically against records and calculated statistics
                        # Convert claimed value into dataset unit space if converted (e.g., knots -> m/s)
                        _, _, ds_scale, ds_offset = normalize_unit_info(ds_unit)
                        target_val_in_ds_unit = (claimed_norm.canonical_value_si / (ds_scale or 1.0)) - ds_offset

                        tolerance = 0.5
                        cursor = db.dataset_records.find(
                            {
                                "dataset_id": source_id,
                                f"metrics.{target_param}": {
                                    "$gte": target_val_in_ds_unit - tolerance,
                                    "$lte": target_val_in_ds_unit + tolerance,
                                },
                            },
                            {"_id": 0}
                        ).limit(5)
                        matches = await cursor.to_list(length=5)

                        if matches:
                            # Pick closest match
                            matches.sort(key=lambda r: abs(float(r["metrics"][target_param]) - target_val_in_ds_unit))
                            best_match = matches[0]
                            actual_val = float(best_match["metrics"][target_param])
                            ref_norm = parse_single_measurement(
                                f"{actual_val} {ds_unit}",
                                metric=target_param,
                                location=ds.get("station_name")
                            )
                            comp = compare_measurements(claimed_norm, ref_norm, tolerance=0.02)
                            qc_flag = best_match.get("quality_flags", {}).get(target_param, "VALID")

                            if comp["equivalent"] and qc_flag == "VALID" and epistemic in ["OBSERVED", "CALCULATED"]:
                                status_result = "VERIFIED"
                                rule_triggered = "RULE_EXACT_OBSERVATION_CONFIRMED"
                                explanation = (
                                    f"Deterministically confirmed against NPDC record '{best_match['record_id']}' "
                                    f"at {best_match['timestamp']} UTC. Observed '{target_param}' = {actual_val} {ds_unit} "
                                    f"(Normalized claim: {claimed_norm.numeric_value} {claimed_norm.canonical_unit}, QC: {qc_flag})."
                                )
                            else:
                                status_result = "NEEDS_REVIEW"
                                rule_triggered = "RULE_APPROXIMATE_OR_INFERRED_REVIEW"
                                explanation = (
                                    f"Evidence exists in record '{best_match['record_id']}' ({actual_val} {ds_unit} at {best_match['timestamp']} UTC), "
                                    f"but human judgment is required (delta_si={comp['delta_si']}, QC={qc_flag}, epistemic={epistemic})."
                                )

                            evidence_details = {
                                "type": "DATASET",
                                "dataset_id": source_id,
                                "station_id": ds.get("station_id"),
                                "record_id": best_match["record_id"],
                                "timestamp": best_match["timestamp"],
                                "field": target_param,
                                "observed_value": actual_val,
                                "original_value": actual_val,
                                "unit": ds_unit,
                                "quality_flag": qc_flag,
                                "source_file": best_match.get("provenance", {}).get("source_file", ds.get("original_filename")),
                                "source_line": best_match.get("provenance", {}).get("source_line"),
                                "sha256": best_match.get("provenance", {}).get("sha256", ds.get("sha256")),
                                "explanation": explanation,
                            }
                        else:
                            # Also check if it matches a CALCULATED statistic (mean/min/max) across dataset records
                            all_cursor = db.dataset_records.find(
                                {"dataset_id": source_id, f"metrics.{target_param}": {"$ne": None}},
                                {"_id": 0, f"metrics.{target_param}": 1}
                            ).limit(500)
                            all_docs = await all_cursor.to_list(length=500)
                            vals = [float(d["metrics"][target_param]) for d in all_docs if target_param in d.get("metrics", {}) and d["metrics"][target_param] is not None]

                            if vals:
                                calc_min = round(min(vals), 2)
                                calc_max = round(max(vals), 2)
                                calc_mean = round(sum(vals) / len(vals), 2)

                                if abs(target_val_in_ds_unit - calc_mean) <= 0.05 or abs(target_val_in_ds_unit - calc_min) <= 0.05 or abs(target_val_in_ds_unit - calc_max) <= 0.05:
                                    status_result = "VERIFIED" if epistemic in ["CALCULATED", "OBSERVED"] else "NEEDS_REVIEW"
                                    rule_triggered = "RULE_CALCULATED_SERIES_STAT_CONFIRMED"
                                    explanation = (
                                        f"Confirmed against calculated series statistics across {len(vals)} records in '{source_id}': "
                                        f"mean={calc_mean} {ds_unit}, min={calc_min} {ds_unit}, max={calc_max} {ds_unit}."
                                    )
                                    evidence_details = {
                                        "type": "DATASET_AGGREGATION",
                                        "dataset_id": source_id,
                                        "station_id": ds.get("station_id"),
                                        "field": target_param,
                                        "records_evaluated": len(vals),
                                        "calculated_mean": calc_mean,
                                        "calculated_min": calc_min,
                                        "calculated_max": calc_max,
                                        "unit": ds_unit,
                                        "sha256": ds.get("sha256"),
                                        "explanation": explanation,
                                    }
                                elif target_val_in_ds_unit < calc_min or target_val_in_ds_unit > calc_max:
                                    status_result = "CONFLICTING"
                                    rule_triggered = "RULE_OUT_OF_DATASET_BOUNDS"
                                    explanation = (
                                        f"Credible source evidence disagrees: Claimed value {value} {unit} "
                                        f"({round(target_val_in_ds_unit, 2)} {ds_unit}) falls outside verified dataset bounds "
                                        f"[{calc_min} to {calc_max} {ds_unit}] across {len(vals)} records."
                                    )
                                    evidence_details = {
                                        "type": "DATASET_BOUNDS",
                                        "dataset_id": source_id,
                                        "field": target_param,
                                        "dataset_min": calc_min,
                                        "dataset_max": calc_max,
                                        "unit": ds_unit,
                                    }
                                else:
                                    status_result = "UNSUPPORTED"
                                    rule_triggered = "RULE_NO_MATCHING_RECORD_IN_SERIES"
                                    explanation = (
                                        f"No observation record or calculated statistic matching {value} {unit} for '{target_param}' "
                                        f"was found in dataset '{source_id}' (range: [{calc_min}, {calc_max} {ds_unit}])."
                                    )
                            else:
                                status_result = "UNSUPPORTED"
                                rule_triggered = "RULE_EMPTY_PARAMETER_SERIES"
                                explanation = f"No valid numeric records found for parameter '{target_param}' in dataset '{source_id}'."

    elif source_type.upper() == "PDF":
        doc = await db.documents.find_one({"document_id": source_id}, {"_id": 0})
        if not doc:
            status_result = "UNSUPPORTED"
            rule_triggered = "RULE_MISSING_SOURCE_PDF"
            explanation = f"Required evidence is absent: Document '{source_id}' not found in authoritative registry."
        else:
            # Fetch all chunks of document and extract normalized measurements to compare!
            chunks_cursor = db.document_chunks.find({"document_id": source_id}, {"_id": 0})
            chunks = await chunks_cursor.to_list(length=200)

            matched_chunk = None
            matched_measurement = None
            conflicting_chunk = None
            conflicting_measurement = None

            for ch in chunks:
                ch_measurements = extract_normalized_measurements(ch.get("text", ""), default_location=doc.get("station_id"))
                for cm in ch_measurements:
                    comp = compare_measurements(claimed_norm, cm, tolerance=0.05)
                    if comp["equivalent"]:
                        matched_chunk = ch
                        matched_measurement = cm
                        break
                    elif comp["unit_compatible"] and cm.dimension == claimed_norm.dimension and cm.dimension != "unknown":
                        # Same dimension in the same context, record as potential conflict if no exact match is found
                        if conflicting_chunk is None:
                            conflicting_chunk = ch
                            conflicting_measurement = cm
                if matched_chunk:
                    break

            # Fallback regex search if unit wasn't adjacent to number (e.g. inside a table cell)
            if not matched_chunk:
                val_str = str(int(value)) if value == int(value) else str(value)
                for ch in chunks:
                    if val_str in ch.get("text", ""):
                        matched_chunk = ch
                        break

            if matched_chunk:
                status_result = "VERIFIED" if epistemic != "INFERRED" else "NEEDS_REVIEW"
                rule_triggered = "RULE_PDF_CHUNK_EVIDENCE_CONFIRMED"
                explanation = (
                    f"Confirmed in document '{doc.get('title')}' ({source_id}), "
                    f"Page {matched_chunk['page_number']}, Chunk '{matched_chunk['chunk_id']}'."
                )
                evidence_details = {
                    "type": "PDF",
                    "document_id": source_id,
                    "document_title": doc.get("title"),
                    "page_number": matched_chunk["page_number"],
                    "chunk_id": matched_chunk["chunk_id"],
                    "chunk_type": matched_chunk.get("chunk_type", "text"),
                    "bounding_box": matched_chunk.get("bounding_box"),
                    "matched_expression": matched_measurement.original_text if matched_measurement else str(value),
                    "context": matched_chunk.get("text", "")[:240],
                    "sha256": doc.get("checksum_sha256"),
                    "explanation": explanation,
                }
            elif conflicting_chunk and conflicting_measurement:
                status_result = "CONFLICTING"
                rule_triggered = "RULE_PDF_NUMERIC_DISAGREEMENT"
                explanation = (
                    f"Document '{doc.get('title')}' reports '{conflicting_measurement.original_text}' "
                    f"on Page {conflicting_chunk['page_number']} (Chunk {conflicting_chunk['chunk_id']}), "
                    f"which disagrees with claimed '{value} {unit}'."
                )
                evidence_details = {
                    "type": "PDF",
                    "document_id": source_id,
                    "page_number": conflicting_chunk["page_number"],
                    "chunk_id": conflicting_chunk["chunk_id"],
                    "bounding_box": conflicting_chunk.get("bounding_box"),
                    "observed_in_pdf": conflicting_measurement.original_text,
                    "context": conflicting_chunk.get("text", "")[:240],
                }
            else:
                status_result = "UNSUPPORTED"
                rule_triggered = "RULE_PDF_VALUE_NOT_FOUND"
                explanation = f"Numeric assertion '{value} {unit}' was not located within any text or table chunk of document '{doc.get('title')}'."

    verification_record = {
        "verification_id": f"vrf_{uuid.uuid4().hex[:12]}",
        "claim_id": cid,
        "claim_text": claim_text,
        "metric": metric,
        "value": value,
        "unit": unit,
        "canonical_unit": claimed_norm.canonical_unit,
        "canonical_value_si": claimed_norm.canonical_value_si,
        "dimension": claimed_norm.dimension,
        "location": location,
        "qualifier": qualifier or "observed",
        "epistemic_type": epistemic,
        "status": status_result,
        "verification_status": status_result,
        "verification_rule": rule_triggered,
        "explanation": explanation,
        "evidence": evidence_details,
        "trace_steps": trace_steps,
        "verified_at": now,
        "verifier_version": VERIFIER_VERSION,
    }

    if persist:
        to_insert = dict(verification_record)
        await db.claim_verifications.insert_one(to_insert)
        to_insert.pop("_id", None)

    return verification_record
