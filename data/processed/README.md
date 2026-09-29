# Processed & Normalized Scientific Telemetry
Contains normalized representations of NPDC observations with:
1. Canonical ISO 8601 UTC timestamps (`YYYY-MM-DDTHH:MM:SSZ`)
2. Calibrated physical SI units (Temperature: °C, Wind Speed: m/s, Pressure: hPa, Humidity: %)
3. Explainable Quality Flags (`VALID`, `SUSPECT`, `OUT_OF_BOUNDS`, `MISSING`)
4. Cryptographic Provenance pointers (`source_file`, `source_line`, `sha256`)
