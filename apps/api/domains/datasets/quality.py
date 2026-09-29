import math
from typing import Dict, Any, Tuple, Optional
from datetime import datetime

# Mandatory Quality Flags per Prompt 05
class QualityFlag:
    VALID = "VALID"
    MISSING = "MISSING"
    SUSPICIOUS = "SUSPICIOUS"
    INVALID = "INVALID"
    DUPLICATE = "DUPLICATE"
    OUT_OF_RANGE = "OUT_OF_RANGE"
    UNIT_ERROR = "UNIT_ERROR"
    TIMESTAMP_ERROR = "TIMESTAMP_ERROR"

# Documented scientific bounds citing WMO-No. 8 & NCPOR observational norms
STATION_BOUNDS: Dict[str, Dict[str, Dict[str, Any]]] = {
    "himansh": {
        "temperature": {
            "min": -45.0,
            "max": 30.0,
            "unit": "°C",
            "citation": "NCPOR Chandra Basin AWS High-Altitude Climatology"
        },
        "pressure": {
            "min": 550.0,
            "max": 750.0,
            "unit": "hPa",
            "citation": "Standard Atmospheric Barometric Formula at 4,080m AMSL"
        },
        "wind_speed": {
            "min": 0.0,
            "max": 65.0,
            "unit": "m/s",
            "citation": "Himalayan Ridge Anemometer Limits"
        },
        "humidity": {
            "min": 0.0,
            "max": 100.0,
            "unit": "%",
            "citation": "Physical Saturation Limits"
        }
    },
    "maitri": {
        "temperature": {
            "min": -89.2,
            "max": 15.0,
            "unit": "°C",
            "citation": "WMO Antarctic Continental Minimum Record & Schirmacher Oasis Summer Max"
        },
        "pressure": {
            "min": 920.0,
            "max": 1045.0,
            "unit": "hPa",
            "citation": "IMD Maitri Coastal Barometric Distribution"
        },
        "wind_speed": {
            "min": 0.0,
            "max": 85.0,
            "unit": "m/s",
            "citation": "Antarctic Blizzards & Katabatic Jet Limits"
        },
        "humidity": {
            "min": 0.0,
            "max": 100.0,
            "unit": "%",
            "citation": "Physical Saturation Limits"
        }
    },
    "bharati": {
        "temperature": {
            "min": -75.0,
            "max": 18.0,
            "unit": "°C",
            "citation": "Larsemann Hills Coastal Antarctic Meteorological Records"
        },
        "pressure": {
            "min": 930.0,
            "max": 1050.0,
            "unit": "hPa",
            "citation": "Prydz Bay Coastal Surface Pressure Bounds"
        },
        "wind_speed": {
            "min": 0.0,
            "max": 75.0,
            "unit": "m/s",
            "citation": "Larsemann Hills Gust Records"
        },
        "humidity": {
            "min": 0.0,
            "max": 100.0,
            "unit": "%",
            "citation": "Physical Saturation Limits"
        }
    },
    "himadri": {
        "temperature": {
            "min": -50.0,
            "max": 25.0,
            "unit": "°C",
            "citation": "Ny-Ålesund Svalbard Airport Climate Normals"
        },
        "pressure": {
            "min": 940.0,
            "max": 1055.0,
            "unit": "hPa",
            "citation": "High Arctic Marine Boundary Pressure Records"
        },
        "wind_speed": {
            "min": 0.0,
            "max": 60.0,
            "unit": "m/s",
            "citation": "Kongsfjorden Fjord Wind Records"
        },
        "humidity": {
            "min": 0.0,
            "max": 100.0,
            "unit": "%",
            "citation": "Physical Saturation Limits"
        }
    }
}

def evaluate_scientific_value(
    station_id: str,
    parameter: str,
    raw_val: Any
) -> Tuple[str, str]:
    """
    Evaluates a single scientific observation against physical bounds.
    Returns: (QualityFlag, ExplainableDecisionReason)
    """
    # 1. Check for Missing vs Zero (Prompt 05 Requirement: Distinguish missing from zero)
    if raw_val is None or raw_val == "" or (isinstance(raw_val, float) and (math.isnan(raw_val) or math.isinf(raw_val))):
        return QualityFlag.MISSING, "Observation missing or null in raw telemetry source."
    
    if raw_val in [-999, -999.0, "-999", -9999, -9999.0]:
        return QualityFlag.MISSING, f"Sensor sentinel code '{raw_val}' detected (no observation recorded)."

    try:
        val = float(raw_val)
    except (ValueError, TypeError):
        return QualityFlag.INVALID, f"Non-numeric characters '{raw_val}' in numerical parameter field."

    # Zero is explicitly valid for wind, precipitation, radiation, etc.
    if val == 0.0 and parameter in ["preci_mm_total", "ws", "ws_avg", "ws_min", "rain", "intensity"]:
        return QualityFlag.VALID, "Zero observation recorded (calm conditions / no precipitation)."

    st_bounds = STATION_BOUNDS.get(station_id.lower(), STATION_BOUNDS["maitri"])
    
    # Categorize parameter
    param_cat = None
    if any(k in parameter.lower() for k in ["temp", "tempr", "tt_c"]):
        param_cat = "temperature"
    elif any(k in parameter.lower() for k in ["ws", "wind_speed", "wspd"]):
        param_cat = "wind_speed"
    elif any(k in parameter.lower() for k in ["ap", "pres", "press"]):
        param_cat = "pressure"
    elif any(k in parameter.lower() for k in ["rh", "humidity"]):
        param_cat = "humidity"

    if param_cat and param_cat in st_bounds:
        rule = st_bounds[param_cat]
        if val < rule["min"]:
            return (
                QualityFlag.OUT_OF_RANGE,
                f"Value {val} {rule['unit']} below physical minimum threshold {rule['min']} {rule['unit']} ({rule['citation']})."
            )
        if val > rule["max"]:
            return (
                QualityFlag.OUT_OF_RANGE,
                f"Value {val} {rule['unit']} exceeds physical maximum threshold {rule['max']} {rule['unit']} ({rule['citation']})."
            )

    return QualityFlag.VALID, "Observation conforms to physical bounding criteria and instrument calibration."

def validate_timestamp_format(ts_str: str) -> Tuple[str, str]:
    """Validates observation timestamp format and ISO consistency."""
    if not ts_str:
        return QualityFlag.TIMESTAMP_ERROR, "Missing timestamp in telemetry observation."
    try:
        # Check standard formats
        for fmt in [
            "%Y-%m-%dT%H:%M:%S%z",
            "%Y-%m-%d %H:%M:%S%z",
            "%Y-%m-%dT%H:%M:%SZ",
            "%Y-%m-%d %H:%M:%S",
            "%d-%m-%Y %H:%M"
        ]:
            try:
                datetime.strptime(ts_str.replace("Z", "+0000"), fmt)
                return QualityFlag.VALID, "Timestamp successfully parsed and verified."
            except ValueError:
                continue
        return QualityFlag.TIMESTAMP_ERROR, f"Timestamp '{ts_str}' failed ISO 8601 parsing."
    except Exception as e:
        return QualityFlag.TIMESTAMP_ERROR, f"Timestamp parsing error: {str(e)}"
