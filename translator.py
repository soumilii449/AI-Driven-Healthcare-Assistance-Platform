from transformers import MarianMTModel, MarianTokenizer

MODEL_NAME = "Helsinki-NLP/opus-mt-en-hi"

print("Loading English → Hindi translation model...")

tokenizer = MarianTokenizer.from_pretrained(MODEL_NAME)
model = MarianMTModel.from_pretrained(MODEL_NAME)

print("Translation model loaded successfully!")


def translate_to_hindi(text):
    """
    Translate English medical text into Hindi.
    """

    if not isinstance(text, str) or not text.strip():
        return text

    inputs = tokenizer(
        text,
        return_tensors="pt",
        padding=True,
        truncation=True,
        max_length=512
    )

    translated = model.generate(
        **inputs,
        max_length=512,
        num_beams=5,
        early_stopping=True
    )

    hindi_text = tokenizer.decode(
        translated[0],
        skip_special_tokens=True
    )

    return hindi_text


def translate_text(text):
    """
    Return both English and Hindi versions.
    """

    hindi = translate_to_hindi(text)

    return {
        "english": text,
        "hindi": hindi
    }