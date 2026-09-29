import math
import re
from typing import Any, Dict, List, Optional, Tuple
from pydantic import BaseModel, Field

# ============================================================================
# Devanagari & Unicode Character Normalization Maps (Prompt 13)
# ============================================================================

DEVANAGARI_DIGIT_MAP = str.maketrans({
    "०": "0",
    "१": "1",
    "२": "2",
    "३": "3",
    "४": "4",
    "५": "5",
    "६": "6",
    "७": "7",
    "८": "8",
    "९": "9",
})

UNICODE_MINUS_CHARS = [
    "\u2212",  # Mathematical minus sign (−)
    "\u2013",  # En-dash (–)
    "\u2014",  # Em-dash (—)
    "\u2012",  # Figure dash (‒)
    "\uFE63",  # Small hyphen-minus (﹣)
    "\uFF0D",  # Fullwidth hyphen-minus (－)
]


class NormalizedMeasurement(BaseModel):
    """
    Structured representation of a scientific numerical assertion (Prompt 13).
    Retains original text, numeric value, unit, metric, location, qualifier, and source position.
    """
    original_text: str
    numeric_value: float
    canonical_value_si: float
    raw_unit: str
    canonical_unit: str
    dimension: str  # 'temperature' | 'wind_speed' | 'pressure' | 'humidity' | 'precipitation' | 'mass_balance' | 'radiation' | 'length' | 'unknown'
    metric: Optional[str] = None
    location: Optional[str] = None
    qualifier: Optional[str] = None  # 'observed' | 'minimum' | 'maximum' | 'mean' | 'peak'
    source_position: Dict[str, int] = Field(default_factory=lambda: {"start": 0, "end": 0})


# ============================================================================
# Canonical Unit & Dimension Registry
# ============================================================================

UNIT_SYNONYMS: Dict[str, Tuple[str, str, float, float]] = {
    # Format: raw_lower -> (canonical_unit, dimension, scale_to_si, offset_to_si)
    # Temperature (SI reference here: °C for polar meteorology consistency)
    "°c": ("°C", "temperature", 1.0, 0.0),
    "c": ("°C", "temperature", 1.0, 0.0),
    "deg c": ("°C", "temperature", 1.0, 0.0),
    "degc": ("°C", "temperature", 1.0, 0.0),
    "degree c": ("°C", "temperature", 1.0, 0.0),
    "degrees c": ("°C", "temperature", 1.0, 0.0),
    "degrees celsius": ("°C", "temperature", 1.0, 0.0),
    "degree celsius": ("°C", "temperature", 1.0, 0.0),
    "celsius": ("°C", "temperature", 1.0, 0.0),
    "centigrade": ("°C", "temperature", 1.0, 0.0),
    "डिग्री सेल्सियस": ("°C", "temperature", 1.0, 0.0),
    "सेल्सियस": ("°C", "temperature", 1.0, 0.0),
    "°से": ("°C", "temperature", 1.0, 0.0),
    "°से.": ("°C", "temperature", 1.0, 0.0),
    "k": ("K", "temperature", 1.0, -273.15),
    "kelvin": ("K", "temperature", 1.0, -273.15),

    # Wind Speed (SI reference: m/s)
    "m/s": ("m/s", "wind_speed", 1.0, 0.0),
    "ms-1": ("m/s", "wind_speed", 1.0, 0.0),
    "m s-1": ("m/s", "wind_speed", 1.0, 0.0),
    "m s^-1": ("m/s", "wind_speed", 1.0, 0.0),
    "mps": ("m/s", "wind_speed", 1.0, 0.0),
    "meter/sec": ("m/s", "wind_speed", 1.0, 0.0),
    "meters per second": ("m/s", "wind_speed", 1.0, 0.0),
    "metres per second": ("m/s", "wind_speed", 1.0, 0.0),
    "मीटर/सेकंड": ("m/s", "wind_speed", 1.0, 0.0),
    "knots": ("knots", "wind_speed", 0.514444, 0.0),
    "knot": ("knots", "wind_speed", 0.514444, 0.0),
    "kt": ("knots", "wind_speed", 0.514444, 0.0),
    "kts": ("knots", "wind_speed", 0.514444, 0.0),
    "नॉट": ("knots", "wind_speed", 0.514444, 0.0),
    "km/h": ("km/h", "wind_speed", 1.0 / 3.6, 0.0),
    "kmph": ("km/h", "wind_speed", 1.0 / 3.6, 0.0),
    "kph": ("km/h", "wind_speed", 1.0 / 3.6, 0.0),
    "किमी/घंटा": ("km/h", "wind_speed", 1.0 / 3.6, 0.0),

    # Atmospheric Pressure (SI reference: hPa)
    "hpa": ("hPa", "pressure", 1.0, 0.0),
    "mbar": ("hPa", "pressure", 1.0, 0.0),
    "mb": ("hPa", "pressure", 1.0, 0.0),
    "millibar": ("hPa", "pressure", 1.0, 0.0),
    "millibars": ("hPa", "pressure", 1.0, 0.0),
    "hectopascal": ("hPa", "pressure", 1.0, 0.0),
    "hectopascals": ("hPa", "pressure", 1.0, 0.0),
    "हेक्टोपास्कल": ("hPa", "pressure", 1.0, 0.0),
    "मिलीबार": ("hPa", "pressure", 1.0, 0.0),

    # Relative Humidity (SI reference: %)
    "%": ("%", "humidity", 1.0, 0.0),
    "% rh": ("%", "humidity", 1.0, 0.0),
    "percent": ("%", "humidity", 1.0, 0.0),
    "percentage": ("%", "humidity", 1.0, 0.0),
    "प्रतिशत": ("%", "humidity", 1.0, 0.0),

    # Precipitation / Snow / Glaciological Mass Balance
    "mm/h": ("mm/h", "precipitation", 1.0, 0.0),
    "mm/hr": ("mm/h", "precipitation", 1.0, 0.0),
    "millimeters per hour": ("mm/h", "precipitation", 1.0, 0.0),
    "mm": ("mm", "precipitation", 1.0, 0.0),
    "मिमी": ("mm", "precipitation", 1.0, 0.0),
    "m w.e.": ("m w.e.", "mass_balance", 1.0, 0.0),
    "m we": ("m w.e.", "mass_balance", 1.0, 0.0),
    "mm w.e.": ("mm w.e.", "mass_balance", 0.001, 0.0),

    # Solar Radiation
    "w/m2": ("W/m²", "radiation", 1.0, 0.0),
    "w/m²": ("W/m²", "radiation", 1.0, 0.0),
    "wm-2": ("W/m²", "radiation", 1.0, 0.0),
    "watts per square meter": ("W/m²", "radiation", 1.0, 0.0),

    # Length / Elevation / Depth
    "m": ("m", "length", 1.0, 0.0),
    "meters": ("m", "length", 1.0, 0.0),
    "metres": ("m", "length", 1.0, 0.0),
    "m asl": ("m", "length", 1.0, 0.0),
    "मीटर": ("m", "length", 1.0, 0.0),
    "km": ("km", "length", 1000.0, 0.0),
    "km2": ("km²", "area", 1.0, 0.0),
    "km²": ("km²", "area", 1.0, 0.0),

    # Direction
    "deg": ("deg", "direction", 1.0, 0.0),
    "degrees": ("deg", "direction", 1.0, 0.0),
    "°": ("deg", "direction", 1.0, 0.0),
}

STATION_PATTERNS = {
    "Maitri": ["maitri", "मैत्री", "schirmacher"],
    "Bharati": ["bharati", "भारती", "larsemann"],
    "Himadri": ["himadri", "हिमाद्री", "ny-ålesund", "ny-alesund", "svalbard"],
    "Himansh": ["himansh", "हिमांश", "chandra basin", "spiti", "sutri dhaka"],
    "IndARC": ["indarc", "kongsfjorden"],
}

QUALIFIER_PATTERNS = {
    "minimum": ["minimum", "min", "lowest", "न्यूनतम"],
    "maximum": ["maximum", "max", "peak", "highest", "gust", "अधिकतम"],
    "mean": ["mean", "average", "avg", "औसत"],
    "observed": ["observed", "recorded", "logged", "measured", "दर्ज", "प्रेक्षित"],
}

METRIC_KEYWORDS = {
    "temperature": ["temperature", "tempr", "airtemp", "air_temperature", "surface_temp", "तापमान"],
    "wind_speed": ["wind speed", "wind_speed", "ws", "katabatic", "gust", "पवन गति", "हवा की गति"],
    "pressure": ["pressure", "ap", "atmospheric_pressure", "barometric", "वायुदाब", "दबाव"],
    "humidity": ["humidity", "rh", "relative_humidity", "आर्द्रता", "नमी"],
    "precipitation": ["precipitation", "rainfall", "snowfall", "intensity", "वर्षा", "बर्फबारी"],
    "mass_balance": ["mass balance", "mass_balance", "glacier", "ablation", "swe", "द्रव्यमान संतुलन"],
    "radiation": ["radiation", "solar", "albedo", "विकिरण"],
}


def normalize_numeral_string(text: str) -> str:
    """Converts Devanagari digits and Unicode minus/dash symbols into standard ASCII."""
    if not text:
        return ""
    out = text.translate(DEVANAGARI_DIGIT_MAP)
    for minus_ch in UNICODE_MINUS_CHARS:
        out = out.replace(minus_ch, "-")
    return out


def normalize_unit_info(unit_str: str) -> Tuple[str, str, float, float]:
    """
    Returns (canonical_unit, dimension, scale_to_si, offset_to_si) for a raw unit string.
    """
    if not unit_str:
        return ("", "unknown", 1.0, 0.0)
    cleaned = normalize_numeral_string(unit_str).strip()
    # Normalize degree symbol spacing e.g. "° C" -> "°c"
    cleaned_lower = re.sub(r"°\s+([cCkKfFसे])", r"°\1", cleaned).lower()
    cleaned_lower = re.sub(r"\s+", " ", cleaned_lower).strip(" .,;:")

    if cleaned_lower in UNIT_SYNONYMS:
        return UNIT_SYNONYMS[cleaned_lower]

    return (cleaned, "unknown", 1.0, 0.0)


def normalize_unit(unit_str: str) -> str:
    """Returns the canonical unit string (e.g., '-38.4 C' -> '°C')."""
    canon_unit, _, _, _ = normalize_unit_info(unit_str)
    return canon_unit


def parse_scientific_number(num_str: str) -> float:
    """
    Parses a numeric string supporting:
    - Devanagari numerals (e.g., '-३८.४' -> -38.4)
    - Unicode minus signs ('−38.4' -> -38.4)
    - Thousand separators ('1,013.25' -> 1013.25)
    - Scientific notation ('1.5e-3', '1.5 × 10^-3', '1.5x10^-3')
    """
    norm = normalize_numeral_string(num_str).strip()
    # Handle explicit x10^ or ×10^ scientific notation
    sci_match = re.match(
        r"^([+-]?\d+(?:,\d{3})*(?:\.\d+)?)\s*[x×\*]\s*10\^?([+-]?\d+)$",
        norm,
        flags=re.IGNORECASE
    )
    if sci_match:
        mantissa = float(sci_match.group(1).replace(",", ""))
        exponent = int(sci_match.group(2))
        return mantissa * (10.0 ** exponent)

    # Remove thousand separator commas
    clean = norm.replace(",", "").replace(" ", "")
    return float(clean)


def _infer_context_metadata(text: str, start_idx: int, end_idx: int, dimension: str) -> Tuple[Optional[str], Optional[str], Optional[str]]:
    """Infers metric, location, and qualifier from surrounding text window."""
    window_start = max(0, start_idx - 100)
    window_end = min(len(text), end_idx + 100)
    context = text[window_start:window_end].lower()

    # 1. Location
    location = None
    for st_canon, keywords in STATION_PATTERNS.items():
        if any(kw in context for kw in keywords):
            location = st_canon
            break

    # 2. Qualifier
    qualifier = "observed"
    for qual_canon, keywords in QUALIFIER_PATTERNS.items():
        if any(kw in context for kw in keywords):
            qualifier = qual_canon
            break

    # 3. Metric
    metric = dimension if dimension != "unknown" else None
    for met_canon, keywords in METRIC_KEYWORDS.items():
        if any(kw in context for kw in keywords):
            metric = met_canon
            break

    return metric, location, qualifier


# Regex matching numbers (including Devanagari digits, Unicode minus, commas, decimals, scientific notation)
# followed by polar scientific units
_MEASUREMENT_REGEX = re.compile(
    r"(?P<number>[\+\-−–—]?\s*[0-9०-९]{1,3}(?:,[0-9०-९]{3})*(?:\.[0-9०-९]+)?(?:[eE][\+\-]?[0-9०-९]+|\s*[x×]\s*10\^?[\+\-]?[0-9०-९]+)?|[\+\-−–—]?\s*[0-9०-९]+(?:\.[0-9०-९]+)?)"
    r"\s*"
    r"(?P<unit>"
    r"°\s*[cCkKfF]|°\s*से\.?|डिग्री\s+सेल्सियस|सेल्सियस|degrees?\s+celsius|deg\s*c|celsius|centigrade|"
    r"m\s*w\.?e\.?|mm\s*w\.?e\.?|mm/hr?|मिमी|mm|"
    r"m/s|ms-1|m\s+s\^-1|mps|meters?\s+per\s+second|मीटर/सेकंड|"
    r"knots?|kts?|नॉट|"
    r"km/h|kmph|kph|किमी/घंटा|"
    r"hpa|mbar|millibars?|hectopascals?|हेक्टोपास्कल|मिलीबार|mb|"
    r"w/m[2²]|wm-2|"
    r"%\s*rh|percent(?:age)?|प्रतिशत|%|"
    r"m\s+asl|km[2²]|meters?|metres?|मीटर"
    r")(?![a-zA-Zअ-ह])",
    flags=re.IGNORECASE
)


def extract_normalized_measurements(
    text: str,
    default_location: Optional[str] = None,
    default_metric: Optional[str] = None
) -> List[NormalizedMeasurement]:
    """
    Extracts and normalizes all scientific numerical measurements from text (Prompt 13).
    Handles '-38.4°C', '-38.4 C', '−38.4 °C', Devanagari numerals, scientific notation, and units.
    """
    if not text:
        return []

    results: List[NormalizedMeasurement] = []
    for match in _MEASUREMENT_REGEX.finditer(text):
        raw_full = match.group(0)
        raw_num = match.group("number")
        raw_unit = match.group("unit")
        start_pos, end_pos = match.span()

        try:
            val = parse_scientific_number(raw_num)
        except ValueError:
            continue

        canon_unit, dimension, scale, offset = normalize_unit_info(raw_unit)
        si_val = round((val + offset) * scale, 6)

        metric, location, qualifier = _infer_context_metadata(text, start_pos, end_pos, dimension)
        if not location and default_location:
            location = default_location
        if (not metric or metric == "unknown") and default_metric:
            metric = default_metric

        results.append(
            NormalizedMeasurement(
                original_text=raw_full,
                numeric_value=val,
                canonical_value_si=si_val,
                raw_unit=raw_unit.strip(),
                canonical_unit=canon_unit,
                dimension=dimension,
                metric=metric,
                location=location,
                qualifier=qualifier,
                source_position={"start": start_pos, "end": end_pos}
            )
        )

    return results


def parse_single_measurement(
    expression: str,
    metric: Optional[str] = None,
    location: Optional[str] = None,
    qualifier: Optional[str] = None
) -> NormalizedMeasurement:
    """
    Parses a single measurement string such as '-38.4°C', '−38.4 °C', '-३८.४ °C', or '38.4 knots'
    into a NormalizedMeasurement.
    """
    extracted = extract_normalized_measurements(expression, default_location=location, default_metric=metric)
    if extracted:
        m = extracted[0]
        if metric:
            m.metric = metric
        if location:
            m.location = location
        if qualifier:
            m.qualifier = qualifier
        return m

    # Fallback split if unit isn't in standard regex
    norm_expr = normalize_numeral_string(expression).strip()
    m_num = re.match(r"^([+-]?\d+(?:,\d{3})*(?:\.\d+)?(?:[eE][+-]?\d+)?)\s*(.*)$", norm_expr)
    if not m_num:
        raise ValueError(f"Cannot parse scientific measurement from '{expression}'")

    val = parse_scientific_number(m_num.group(1))
    raw_u = m_num.group(2).strip()
    canon_u, dim, scale, offset = normalize_unit_info(raw_u)
    return NormalizedMeasurement(
        original_text=expression,
        numeric_value=val,
        canonical_value_si=round((val + offset) * scale, 6),
        raw_unit=raw_u,
        canonical_unit=canon_u,
        dimension=dim,
        metric=metric or dim,
        location=location,
        qualifier=qualifier or "observed",
        source_position={"start": 0, "end": len(expression)}
    )


def compare_measurements(
    claimed: NormalizedMeasurement,
    reference: NormalizedMeasurement,
    tolerance: float = 0.05
) -> Dict[str, Any]:
    """
    Deterministically compares two NormalizedMeasurements (Prompt 13 & 14).
    Strictly enforces:
    - Equal numeric values are NOT equivalent if metric/unit dimension differs (e.g. 38.4 knots != 38.4°C).
    - Equivalent forms (-38.4°C, -38.4 C, −38.4 °C, -३८.४ °C) match with exact equivalence.
    """
    # 1. Check physical dimension compatibility
    if claimed.dimension != "unknown" and reference.dimension != "unknown":
        if claimed.dimension != reference.dimension:
            return {
                "equivalent": False,
                "unit_compatible": False,
                "exact_numeric_match": False,
                "reason": (
                    f"Physical dimension mismatch: '{claimed.original_text}' ({claimed.canonical_unit}, {claimed.dimension}) "
                    f"is incompatible with '{reference.original_text}' ({reference.canonical_unit}, {reference.dimension})."
                ),
                "delta_si": None
            }

    # 2. Check explicit metric mismatch when dimensions might be unknown
    if claimed.metric and reference.metric and claimed.metric != reference.metric:
        # Allow synonyms like 'tempr' and 'temperature'
        c_dim = claimed.dimension
        r_dim = reference.dimension
        if c_dim != r_dim or c_dim == "unknown":
            return {
                "equivalent": False,
                "unit_compatible": False,
                "exact_numeric_match": False,
                "reason": f"Metric mismatch: claimed metric '{claimed.metric}' does not match reference metric '{reference.metric}'.",
                "delta_si": None
            }

    # 3. Compare in canonical SI space
    delta_si = abs(claimed.canonical_value_si - reference.canonical_value_si)
    exact_match = delta_si < 1e-4
    within_tolerance = delta_si <= tolerance

    return {
        "equivalent": within_tolerance,
        "unit_compatible": True,
        "exact_numeric_match": exact_match,
        "delta_si": round(delta_si, 6),
        "claimed_canonical": f"{claimed.numeric_value} {claimed.canonical_unit}",
        "reference_canonical": f"{reference.numeric_value} {reference.canonical_unit}",
        "reason": (
            f"Confirmed equivalence: {claimed.original_text} -> {claimed.numeric_value} {claimed.canonical_unit} "
            f"(SI: {claimed.canonical_value_si}) matches {reference.numeric_value} {reference.canonical_unit} "
            f"(delta={round(delta_si, 5)})."
            if within_tolerance else
            f"Numeric discrepancy in compatible unit ({claimed.canonical_unit}): claimed {claimed.numeric_value} vs reference {reference.numeric_value} (delta_si={round(delta_si, 4)})."
        )
    }
