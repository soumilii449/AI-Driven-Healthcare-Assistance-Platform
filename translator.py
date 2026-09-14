import os
import re

from sarvamai import SarvamAI

SARVAM_API_KEY = os.environ.get("SARVAM_API_KEY", "")

_client = SarvamAI(api_subscription_key=SARVAM_API_KEY) if SARVAM_API_KEY else None

# Public codes used everywhere else in this project (frontend dropdown,
# API ?lang= query param, etc.) — unchanged from before, so nothing else
# in the app needs to know these map to Sarvam's language codes.
SUPPORTED_LANGUAGES = {
    "en": "English",
    "hi": "Hindi",
    "bn": "Bengali",
    "ta": "Tamil",
    "te": "Telugu",
    "mr": "Marathi",
    "gu": "Gujarati",
    "kn": "Kannada",
    "ml": "Malayalam",
    "pa": "Punjabi",
    "ur": "Urdu",
}

# Sarvam expects BCP-47 style codes (e.g. "hi-IN"), not plain "hi".
_SARVAM_LANG_CODES = {
    "en": "en-IN",
    "hi": "hi-IN",
    "bn": "bn-IN",
    "ta": "ta-IN",
    "te": "te-IN",
    "mr": "mr-IN",
    "gu": "gu-IN",
    "kn": "kn-IN",
    "ml": "ml-IN",
    "pa": "pa-IN",
    "ur": "ur-IN",
}

# sarvam-translate:v1 accepts up to ~2000 characters per request;
# stay comfortably under that.
_MAX_CHARS = 1800


def _split_into_chunks(text, max_chars=_MAX_CHARS):
    """Split text on sentence boundaries so no chunk exceeds max_chars."""
    sentences = re.split(r'(?<=[.!?])\s+', text.strip())
    chunks = []
    current = ""

    for sentence in sentences:
        if len(current) + len(sentence) + 1 > max_chars:
            if current:
                chunks.append(current.strip())
            current = sentence
        else:
            current = f"{current} {sentence}".strip()

    if current:
        chunks.append(current)

    return chunks or [text]


def translate_to_language(text, target_lang="hi"):
    """
    Translate English text into any language in SUPPORTED_LANGUAGES
    using the Sarvam AI translation API.
    """

    if not isinstance(text, str) or not text.strip():
        return text

    if target_lang not in SUPPORTED_LANGUAGES or target_lang == "en":
        return text

    if _client is None:
        print("[translator] SARVAM_API_KEY is not set — returning original text.")
        return text

    sarvam_target = _SARVAM_LANG_CODES.get(target_lang)

    if not sarvam_target:
        return text

    try:
        chunks = _split_into_chunks(text)
        translated_chunks = []

        for chunk in chunks:
            response = _client.text.translate(
                input=chunk,
                source_language_code="en-IN",
                target_language_code=sarvam_target,
                model="sarvam-translate:v1",
            )
            translated_chunks.append(response.translated_text)

        return " ".join(translated_chunks)

    except Exception as e:
        print(f"[translator] '{target_lang}' translation failed: {e}")
        return text


def translate_to_hindi(text):
    """Kept so existing imports in api.py / pipeline.py keep working."""
    return translate_to_language(text, "hi")


def translate_text(text, target_lang="hi"):
    return {
        "english": text,
        target_lang: translate_to_language(text, target_lang),
    }