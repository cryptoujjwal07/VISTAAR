import httpx
import json
import uuid
from typing import Optional, Dict, Any, List
from apps.api.core.config import settings
from apps.api.core.logging import get_logger

logger = get_logger("vistaar.ai.provider")

class AIProvider:
    async def generate_outreach(
        self,
        station_name: str,
        region: str,
        observed_metric: str,
        observed_value: float,
        unit: str,
        timestamp: str,
        dataset_id: str,
        record_id: str,
        checksum: str
    ) -> Dict[str, Any]:
        raise NotImplementedError

class GeminiProvider(AIProvider):
    def __init__(self, api_key: str):
        self.api_key = api_key
        self.models_to_try = [
            "gemini-3.8-flash",
            "gemini-flash-latest",
            "gemini-3.5-flash",
            "gemini-3.1-flash-lite"
        ]

    async def generate_outreach(
        self,
        station_name: str,
        region: str,
        observed_metric: str,
        observed_value: float,
        unit: str,
        timestamp: str,
        dataset_id: str,
        record_id: str,
        checksum: str
    ) -> Optional[Dict[str, Any]]:
        prompt = (
            f"You are the official scientific communication system for India's National Centre for Polar and Ocean Research (NCPOR), Ministry of Earth Sciences.\n"
            f"Based strictly on this real NPDC observation:\n"
            f"- Station: {station_name} ({region})\n"
            f"- Observation: {observed_metric} = {observed_value} {unit}\n"
            f"- Timestamp (UTC): {timestamp}\n"
            f"- Record ID: {record_id} (Dataset: {dataset_id})\n\n"
            f"STRICT RULES:\n"
            f"1. Never invent measurements, citations, quotes, dates, or conclusions.\n"
            f"2. For quotes, use exact placeholder: [Quote to be provided by authorized official]\n"
            f"3. Return strict JSON format with keys: pib_body, social_body, education_body, vernacular_body.\n"
        )

        for model in self.models_to_try:
            url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={self.api_key}"
            payload = {
                "contents": [{"parts": [{"text": prompt}]}],
                "generationConfig": {
                    "temperature": 0.2,
                    "maxOutputTokens": 1024
                }
            }
            try:
                async with httpx.AsyncClient(timeout=10.0) as client:
                    resp = await client.post(url, json=payload)
                    if resp.status_code == 200:
                        data = resp.json()
                        candidates = data.get("candidates", [])
                        if candidates and "content" in candidates[0]:
                            text = candidates[0]["content"]["parts"][0]["text"]
                            logger.info(f"Gemini model {model} successfully generated outreach.")
                            # Extract JSON if wrapped in markdown
                            if "```json" in text:
                                text = text.split("```json")[1].split("```")[0].strip()
                            elif "```" in text:
                                text = text.split("```")[1].split("```")[0].strip()
                            try:
                                return json.loads(text)
                            except Exception:
                                return None
                    else:
                        logger.warning(f"Gemini {model} returned HTTP {resp.status_code}: {resp.text[:120]}")
            except Exception as e:
                logger.warning(f"Gemini API attempt with {model} failed: {str(e)}")

        return None

class DeterministicPolarProvider(AIProvider):
    async def generate_outreach(
        self,
        station_name: str,
        region: str,
        observed_metric: str,
        observed_value: float,
        unit: str,
        timestamp: str,
        dataset_id: str,
        record_id: str,
        checksum: str
    ) -> Dict[str, Any]:
        clean_metric = observed_metric.replace("_", " ")
        ts_date = timestamp[:10] if timestamp else "Recent"
        
        pib_body = (
            f"PRESS INFORMATION BUREAU (GOVERNMENT OF INDIA)\n"
            f"MINISTRY OF EARTH SCIENCES / NATIONAL CENTRE FOR POLAR AND OCEAN RESEARCH\n\n"
            f"SCIENTIFIC OBSERVATION BULLETIN: {station_name.upper()}\n\n"
            f"In ongoing scientific monitoring under India's Polar Research Programme, {station_name} recorded a {clean_metric} "
            f"measurement of {observed_value} {unit} on {ts_date} (UTC).\n\n"
            f"Continuous automated environmental data collection is conducted in accordance with NPDC / MoES scientific standards.\n\n"
            f"[Quote to be provided by authorized official]\n\n"
            f"Authoritative Provenance: Dataset ID {dataset_id} (Record: {record_id}, SHA256: {checksum[:16]}...)."
        )

        social_body = (
            f"❄️ Scientific Update from {station_name} ({region}):\n\n"
            f"India's polar research station logged an observed {clean_metric} of {observed_value} {unit} ({ts_date} UTC).\n\n"
            f"Verified via @MoESGoI & @NCPOR_GoI National Polar Data Centre.\n"
            f"#PolarScience #IndiaAtPoles #NCPOR #ScienceOutreach"
        )

        edu_body = (
            f"LEARNING MODULE: POLAR CLIMATOLOGY & MEASUREMENTS\n\n"
            f"Concept: Atmospheric Monitoring at {station_name}.\n\n"
            f"Case Study:\n"
            f"On {ts_date}, calibrated automatic instruments recorded {observed_value} {unit} for {clean_metric}.\n\n"
            f"Curriculum Relevance (NCERT Classes 8-12 Science):\n"
            f"- Thermal dynamics and weather instruments in extreme polar environments.\n"
            f"- The role of polar research in global climate teleconnections.\n\n"
            f"Activity: Compare {station_name}'s observed {clean_metric} with the seasonal averages across peninsular India."
        )

        vernacular_body = (
            f"राष्ट्रीय ध्रुवीय एवं महासागर अनुसंधान केंद्र (NCPOR)\n"
            f"पृथ्वी विज्ञान मंत्रालय, भारत सरकार\n\n"
            f"वैज्ञानिक अवलोकन बुलेटिन: {station_name}\n\n"
            f"भारत के ध्रुवीय अनुसंधान कार्यक्रम के अंतर्गत, {station_name} ने {ts_date} को {clean_metric} "
            f"का मान {observed_value} {unit} दर्ज किया।\n\n"
            f"यह डेटा राष्ट्रीय ध्रुवीय डेटा केंद्र (NPDC) के माध्यम से सत्यापित है।\n\n"
            f"[Quote to be provided by authorized official]"
        )

        return {
            "pib_body": pib_body,
            "social_body": social_body,
            "education_body": edu_body,
            "vernacular_body": vernacular_body
        }

async def get_outreach_content(
    station_name: str,
    region: str,
    observed_metric: str,
    observed_value: float,
    unit: str,
    timestamp: str,
    dataset_id: str,
    record_id: str,
    checksum: str
) -> Dict[str, Any]:
    deterministic = DeterministicPolarProvider()
    
    if settings.GEMINI_API_KEY:
        gemini = GeminiProvider(settings.GEMINI_API_KEY)
        res = await gemini.generate_outreach(
            station_name, region, observed_metric, observed_value, unit, timestamp, dataset_id, record_id, checksum
        )
        if res and "pib_body" in res:
            return res

    # Reliable deterministic fallback preserving 100% provenance
    return await deterministic.generate_outreach(
        station_name, region, observed_metric, observed_value, unit, timestamp, dataset_id, record_id, checksum
    )
