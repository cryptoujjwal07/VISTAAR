import re
import httpx
from typing import Dict, Any, List, Optional
from pydantic import BaseModel
from apps.api.core.config import settings
from apps.api.core.logging import get_logger

logger = get_logger("vistaar.localization")

SUPPORTED_LANGUAGES = {
    "hi": "Hindi (हिन्दी)",
    "ta": "Tamil (தமிழ்)",
    "bn": "Bengali (বাংলা)",
    "mr": "Marathi (मराठी)",
    "te": "Telugu (తెలుగు)",
    "gu": "Gujarati (ગુજરાતી)",
    "kn": "Kannada (ಕನ್ನಡ)",
    "ml": "Malayalam (മലയാളം)",
    "pa": "Punjabi (ਪੰਜਾਬੀ)",
    "or": "Odia (ଓଡ଼ିଆ)",
    "as": "Assamese (অসমীয়া)",
    "en": "English"
}

# Scientific terms and station names that must NEVER be modified or translated incorrectly
PRESERVED_SCIENTIFIC_TERMS = [
    "NCPOR", "MoES", "Maitri", "Bharati", "Himansh", "Himadri", "Dakshin Gangotri",
    "Larsemann Hills", "Schirmacher Oasis", "Spitsbergen", "Svalbard", "Chandra Basin",
    "Spiti Valley", "IndARC", "NPDC", "AWS", "Automatic Weather Station",
    "SHA-256", "VISTAAR"
]

class ClaimSegmentTranslation(BaseModel):
    segment_index: int
    source_segment: str
    translated_segment: str
    terminology_preserved: bool
    numerical_preserved: bool


class TranslationResult(BaseModel):
    source_text: str
    translated_text: str
    source_lang: str
    target_lang: str
    provider: str
    preserved_tokens_count: int
    terminology_validation_passed: bool = True
    numerical_preservation_passed: bool = True
    validation_passed: bool
    fallback_retained_original: bool = False
    claim_segments: List[ClaimSegmentTranslation] = []
    workflow_stages: List[str] = [
        "APPROVED_SOURCE",
        "CLAIM_SEGMENTATION",
        "TRANSLATION",
        "TERMINOLOGY_VALIDATION",
        "NUMERICAL_PRESERVATION",
        "REVIEW_CHECK",
    ]
    status: str
    details: Optional[str] = None


class TranslationProvider:
    """Abstract base interface for pluggable translation providers (Prompt 22)."""
    provider_name: str = "base"

    async def translate_masked(self, masked_text: str, source_lang: str, target_lang: str) -> Optional[str]:
        raise NotImplementedError


class LocalizationEngine:
    def __init__(self):
        self.gemini_key = settings.GEMINI_API_KEY
        self.bhashini_key = settings.BHASHINI_API_KEY
        self.bhashini_user = settings.BHASHINI_USER_ID

    def segment_claims(self, text: str) -> List[str]:
        """Segments approved scientific text into atomic sentence/claim units (Prompt 22)."""
        if not text or not text.strip():
            return []
        parts = [p.strip() for p in re.split(r'(?<=[.!?])\s+|\n+', text.strip()) if p.strip()]
        return parts if parts else [text.strip()]

    def _extract_and_mask_terms(self, text: str) -> tuple[str, Dict[str, str], Dict[str, str]]:
        """
        Masks scientific terms/station/dataset names and numbers+units separately
        so terminology validation and numerical preservation can be independently audited.
        """
        masked_text = text
        term_map: Dict[str, str] = {}
        num_map: Dict[str, str] = {}
        token_idx = 0

        # 0. Mask dataset/document IDs (e.g., ds_maitri_imd, doc_himansh_glaciology_2023)
        id_pattern = re.compile(r'\b(?:ds|doc|pub|med|les)_[a-zA-Z0-9_]+\b')
        for m in reversed(list(id_pattern.finditer(masked_text))):
            letter_code = chr(65 + (token_idx % 26)) * (1 + token_idx // 26)
            token = f"__POLAR_ID_{letter_code}__"
            term_map[token] = m.group(0)
            masked_text = masked_text[:m.start()] + token + masked_text[m.end():]
            token_idx += 1

        # 1. Mask scientific terms and station names using alphabetic tokens
        for term in sorted(PRESERVED_SCIENTIFIC_TERMS, key=len, reverse=True):
            pattern = re.compile(re.escape(term), re.IGNORECASE)
            matches = list(pattern.finditer(masked_text))
            for m in reversed(matches):
                letter_code = chr(65 + (token_idx % 26)) * (1 + token_idx // 26)
                token = f"__POLAR_TERM_{letter_code}__"
                term_map[token] = m.group(0)
                masked_text = masked_text[:m.start()] + token + masked_text[m.end():]
                token_idx += 1

        # 2. Mask numbers with scientific units: e.g. -24.5 °C, 987.2 hPa, 18.2 m/s, 1,132 records, 70°45'S
        unit_pattern = re.compile(
            r'[-+−]?\d+(?:,\d{3})*(?:\.\d+)?\s*(?:°C|degC|hPa|mb|m/s|km/h|knots|kt|mm|cm|m\s*w\.e\.|%|meters|km|records)?'
        )
        for m in reversed(list(unit_pattern.finditer(masked_text))):
            val = m.group(0).strip()
            if val and any(char.isdigit() for char in val):
                letter_code = chr(65 + (token_idx % 26)) * (1 + token_idx // 26)
                token = f"__POLAR_NUM_{letter_code}__"
                num_map[token] = val
                masked_text = masked_text[:m.start()] + token + masked_text[m.end():]
                token_idx += 1

        return masked_text, term_map, num_map

    def _unmask_terms(self, text: str, token_map: Dict[str, str]) -> str:
        """Restores all masked tokens back to their exact original scientific strings."""
        restored = text
        for token, original in token_map.items():
            restored = restored.replace(token, original)
        return restored

    def _validate_terminology_preservation(self, translated: str, term_map: Dict[str, str]) -> bool:
        for original_term in term_map.values():
            if original_term not in translated:
                logger.warning(f"Terminology validation failed: '{original_term}' missing from translation.")
                return False
        return True

    def _validate_numerical_preservation(self, source: str, translated: str, num_map: Dict[str, str]) -> bool:
        """
        Verifies that every original number and unit is present in the translation.
        Prompt 22 requirement: Never silently alter scientific values.
        """
        for original_val in num_map.values():
            digits = re.findall(r'\d+(?:\.\d+)?', original_val)
            for d in digits:
                if d not in translated:
                    logger.warning(f"Numerical validation failed: '{d}' missing from translation.")
                    return False
        return True

    async def translate(self, text: str, target_lang: str, source_lang: str = "en") -> TranslationResult:
        if target_lang == source_lang or target_lang not in SUPPORTED_LANGUAGES:
            return TranslationResult(
                source_text=text,
                translated_text=text,
                source_lang=source_lang,
                target_lang=target_lang,
                provider="identity",
                preserved_tokens_count=0,
                terminology_validation_passed=True,
                numerical_preservation_passed=True,
                validation_passed=True,
                fallback_retained_original=False,
                claim_segments=[
                    ClaimSegmentTranslation(
                        segment_index=i,
                        source_segment=s,
                        translated_segment=s,
                        terminology_preserved=True,
                        numerical_preserved=True,
                    )
                    for i, s in enumerate(self.segment_claims(text))
                ],
                status="IDENTICAL",
            )

        masked_text, term_map, num_map = self._extract_and_mask_terms(text)
        combined_map = {**term_map, **num_map}

        raw_translated: Optional[str] = None
        provider_used = "deterministic_polar_lexicon"

        # 1. Attempt Digital India Bhashini if configured
        if self.bhashini_key and self.bhashini_user:
            try:
                res = await self._call_bhashini(masked_text, source_lang, target_lang)
                if res:
                    raw_translated = res
                    provider_used = "bhashini"
            except Exception as e:
                logger.warning(f"Bhashini translation failed: {str(e)}; falling back.")

        # 2. Attempt Gemini REST Provider
        if raw_translated is None and self.gemini_key:
            try:
                res = await self._call_gemini(masked_text, source_lang, target_lang)
                if res:
                    raw_translated = res
                    provider_used = "gemini_rest"
            except Exception as e:
                logger.warning(f"Gemini REST translation fallback: {str(e)}")

        # 3. Deterministic Domain Lexicon Provider (High-assurance fallback)
        if raw_translated is None:
            raw_translated = self._deterministic_translate(masked_text, target_lang)
            provider_used = "deterministic_polar_lexicon"

        unmasked = self._unmask_terms(raw_translated, combined_map)
        term_ok = self._validate_terminology_preservation(unmasked, term_map)
        num_ok = self._validate_numerical_preservation(text, unmasked, num_map)
        valid = term_ok and num_ok

        # Build claim segment breakdown
        src_segments = self.segment_claims(text)
        segment_results: List[ClaimSegmentTranslation] = []
        for idx, seg in enumerate(src_segments):
            s_mask, s_terms, s_nums = self._extract_and_mask_terms(seg)
            s_trans = self._unmask_terms(self._deterministic_translate(s_mask, target_lang), {**s_terms, **s_nums})
            s_t_ok = self._validate_terminology_preservation(s_trans, s_terms)
            s_n_ok = self._validate_numerical_preservation(seg, s_trans, s_nums)
            segment_results.append(
                ClaimSegmentTranslation(
                    segment_index=idx,
                    source_segment=seg,
                    translated_segment=s_trans if (s_t_ok and s_n_ok) else seg,
                    terminology_preserved=s_t_ok,
                    numerical_preserved=s_n_ok,
                )
            )

        return TranslationResult(
            source_text=text,
            translated_text=unmasked if valid else text,
            source_lang=source_lang,
            target_lang=target_lang,
            provider=provider_used,
            preserved_tokens_count=len(combined_map),
            terminology_validation_passed=term_ok,
            numerical_preservation_passed=num_ok,
            validation_passed=valid,
            fallback_retained_original=not valid,
            claim_segments=segment_results,
            status="VALIDATED" if valid else "FALLBACK_RETAINED_ORIGINAL",
        )

    async def _call_bhashini(self, text: str, source_lang: str, target_lang: str) -> Optional[str]:
        # Digital India Bhashini ULCA NMT request
        url = "https://dhruva-api.bhashini.gov.in/services/inference/translation"
        headers = {
            "Authorization": self.bhashini_key,
            "User-ID": self.bhashini_user,
            "Content-Type": "application/json"
        }
        payload = {
            "pipelineTasks": [
                {
                    "taskType": "translation",
                    "config": {
                        "language": {
                            "sourceLanguage": source_lang,
                            "targetLanguage": target_lang
                        }
                    }
                }
            ],
            "inputData": {
                "input": [{"source": text}]
            }
        }
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.post(url, json=payload, headers=headers)
            if resp.status_code == 200:
                data = resp.json()
                return data["pipelineResponse"][0]["output"][0]["target"]
        return None

    async def _call_gemini(self, text: str, source_lang: str, target_lang: str) -> Optional[str]:
        url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={self.gemini_key}"
        lang_name = SUPPORTED_LANGUAGES.get(target_lang, target_lang)
        prompt = (
            f"You are the official scientific translator for the National Centre for Polar and Ocean Research (NCPOR), Ministry of Earth Sciences, India.\n"
            f"Translate the following scientific observation text into {lang_name}.\n"
            f"CRITICAL RULES:\n"
            f"1. Preserved tokens like '__POLAR_TERM_0__' or '__POLAR_NUM_1__' MUST remain EXACTLY identical in the translation. Do NOT edit, delete, or alter them.\n"
            f"2. Output ONLY the translated text without commentary or preamble.\n\n"
            f"Source text:\n{text}"
        )
        payload = {
            "contents": [{"parts": [{"text": prompt}]}],
            "generationConfig": {"temperature": 0.1, "maxOutputTokens": 1000}
        }
        async with httpx.AsyncClient(timeout=12.0) as client:
            resp = await client.post(url, json=payload)
            if resp.status_code == 200:
                data = resp.json()
                return data["candidates"][0]["content"]["parts"][0]["text"].strip()
        return None

    def _deterministic_translate(self, text: str, target_lang: str) -> str:
        """High-assurance deterministic translations for core Polar outreach terms."""
        hindi_glossary = {
            "National Centre for Polar and Ocean Research": "राष्ट्रीय ध्रुवीय एवं महासागर अनुसंधान केंद्र",
            "Ministry of Earth Sciences": "पृथ्वी विज्ञान मंत्रालय",
            "Antarctic Expedition": "अंटार्कटिक अभियान",
            "Arctic Research": "आर्कटिक अनुसंधान",
            "Himalayan Cryosphere": "हिमालयी क्रायोस्फीयर",
            "Indian Polar Science Knowledge Portal": "भारतीय ध्रुवीय विज्ञान ज्ञान पोर्टल",
            "Weather Observation Bulletin": "मौसम प्रेक्षण बुलेटिन",
            "Temperature": "तापमान",
            "Wind Speed": "हवा की गति",
            "Pressure": "वायुमंडलीय दबाव",
            "Atmospheric telemetry confirmed": "वायुमंडलीय टेलीमेट्री की पुष्टि की गई",
            "Scientific Provenance Verified": "वैज्ञानिक प्रामाणिकता सत्यापित",
            "Observation recorded at": "प्रेक्षण यहाँ दर्ज किया गया",
            "Indian Antarctic Research Station": "भारतीय अंटार्कटिक अनुसंधान स्टेशन",
            "Himansh Glaciological Research Station": "हिमांशु हिमनद अनुसंधान स्टेशन",
            "Spiti Valley, Himachal Pradesh": "स्पीति घाटी, हिमाचल प्रदेश"
        }
        
        tamil_glossary = {
            "National Centre for Polar and Ocean Research": "தேசிய துருவ மற்றும் கடல்சார் ஆராய்ச்சி மையம்",
            "Ministry of Earth Sciences": "புவி அறிவியல் அமைச்சகம்",
            "Antarctic Expedition": "அண்டார்டிக் பயணம்",
            "Arctic Research": "ஆர்க்டிக் ஆராய்ச்சி",
            "Weather Observation Bulletin": "வானிலை கண்காணிப்பு புல்லட்டின்",
            "Temperature": "வெப்பநிலை",
            "Wind Speed": "காற்றின் வேகம்",
            "Atmospheric telemetry confirmed": "வளிமண்டல தொலை அளவியல் உறுதிப்படுத்தப்பட்டது"
        }

        glossary = hindi_glossary if target_lang == "hi" else (tamil_glossary if target_lang == "ta" else {})
        res = text
        for en_phrase, localized_phrase in glossary.items():
            res = res.replace(en_phrase, localized_phrase)
        return res

localization_engine = LocalizationEngine()
