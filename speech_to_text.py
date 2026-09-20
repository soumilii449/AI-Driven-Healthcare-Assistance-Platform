import os

from sarvamai import SarvamAI

SARVAM_API_KEY = os.environ.get("SARVAM_API_KEY", "")

_client = SarvamAI(api_subscription_key=SARVAM_API_KEY) if SARVAM_API_KEY else None

# Sarvam's speech-to-text-translate endpoint auto-detects the spoken
# language and always returns an English transcript. This maps the
# BCP-47 style codes it reports back to the plain 2-letter codes used
# everywhere else in this project (frontend dropdown, ?lang= params,
# translator.py / tts.py), so the rest of the app never has to know
# about Sarvam's codes.
_LANG_CODE_TO_INTERNAL = {
    "en-IN": "en",
    "hi-IN": "hi",
    "bn-IN": "bn",
    "ta-IN": "ta",
    "te-IN": "te",
    "mr-IN": "mr",
    "gu-IN": "gu",
    "kn-IN": "kn",
    "ml-IN": "ml",
    "pa-IN": "pa",
    "ur-IN": "ur",
}

# Map common upload/recording extensions to the audio-codec identifiers
# Sarvam's API accepts, so browser recordings (usually .webm) come
# through correctly instead of being guessed at.
_EXTENSION_TO_CODEC = {
    "wav": "wav",
    "webm": "webm",
    "mp3": "mp3",
    "m4a": "x-m4a",
    "aac": "aac",
    "ogg": "ogg",
    "opus": "opus",
    "flac": "flac",
    "amr": "amr",
}


def _guess_codec(filename):
    if not filename or "." not in filename:
        return None

    extension = filename.rsplit(".", 1)[-1].lower()
    return _EXTENSION_TO_CODEC.get(extension)


def transcribe_and_translate(audio_bytes, filename="query.wav"):
    """
    Take spoken audio in any of the supported Indian languages (or
    English) and turn it into an English question, auto-detecting the
    language that was spoken.

    Returns an (english_text, detected_lang, error_reason) tuple.
    On success, english_text/detected_lang are set and error_reason is
    None. On failure, english_text/detected_lang are None and
    error_reason is a short string describing what went wrong — useful
    to surface to the caller instead of a generic message.
    """

    if not isinstance(audio_bytes, (bytes, bytearray)) or not audio_bytes:
        return None, None, "No audio was received by the server."

    if _client is None:
        reason = "SARVAM_API_KEY is not set on the backend — cannot transcribe audio."
        print(f"[speech_to_text] {reason}")
        return None, None, reason

    codec = _guess_codec(filename)

    try:
        kwargs = {
            "file": (filename, audio_bytes),
            "model": "saaras:v2.5",
        }

        if codec:
            kwargs["input_audio_codec"] = codec

        response = _client.speech_to_text.translate(**kwargs)

        english_text = (response.transcript or "").strip()

        if not english_text:
            reason = "Sarvam returned an empty transcript (no speech detected in the audio)."
            print(f"[speech_to_text] {reason}")
            return None, None, reason

        detected_lang = _LANG_CODE_TO_INTERNAL.get(
            response.language_code,
            "en"
        )

        return english_text, detected_lang, None

    except Exception as e:
        reason = f"{type(e).__name__}: {e}"
        print(f"[speech_to_text] transcription failed: {reason}")
        return None, None, reason