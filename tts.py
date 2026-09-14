import os
import base64

from sarvamai import SarvamAI

SARVAM_API_KEY = os.environ.get("SARVAM_API_KEY", "")

_client = SarvamAI(api_subscription_key=SARVAM_API_KEY) if SARVAM_API_KEY else None

# Sarvam expects BCP-47 style codes for speech synthesis too.
_SARVAM_TTS_LANG_CODES = {
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

# bulbul:v3 accepts up to 2500 characters per request; stay comfortably under.
_MAX_TTS_CHARS = 1800

DEFAULT_SPEAKER = "shubh"  # a valid bulbul:v3 voice


def text_to_speech_audio(text, lang, speaker=DEFAULT_SPEAKER):
    """
    Convert text into speech audio (WAV bytes) using Sarvam AI's
    Bulbul text-to-speech model. Returns None if generation fails
    or the client isn't configured, instead of raising.
    """

    if not isinstance(text, str) or not text.strip():
        return None

    if _client is None:
        print("[tts] SARVAM_API_KEY is not set — cannot generate speech.")
        return None

    target_lang = _SARVAM_TTS_LANG_CODES.get(lang)

    if not target_lang:
        print(f"[tts] '{lang}' is not supported for speech synthesis.")
        return None

    text = text[:_MAX_TTS_CHARS]

    try:
        response = _client.text_to_speech.convert(
            text=text,
            language_code=target_lang,
            speaker=speaker,
            model="bulbul:v3",
        )

        audio_base64 = "".join(response.audios)
        return base64.b64decode(audio_base64)

    except Exception as e:
        print(f"[tts] speech generation failed for '{lang}': {e}")
        return None