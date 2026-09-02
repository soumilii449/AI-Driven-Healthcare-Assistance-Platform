import re


MEDICINE_TRANSLATIONS = {
    "omeprazole":
        "Omeprazole का उपयोग पेट के एसिड को कम करने के लिए किया जाता है।",

    "paracetamol":
        "Paracetamol का उपयोग दर्द से राहत देने और बुखार कम करने के लिए किया जाता है।",

    "pantoprazole":
        "Pantoprazole का उपयोग पेट के एसिड को कम करने के लिए किया जाता है।",

    "metformin":
        "Metformin का उपयोग रक्त शर्करा को नियंत्रित करने के लिए किया जाता है।",

    "azithromycin":
        "Azithromycin एक एंटीबायोटिक है जिसका उपयोग कुछ बैक्टीरियल संक्रमणों के इलाज के लिए किया जाता है।",

    "cetirizine":
        "Cetirizine का उपयोग एलर्जी के लक्षणों से राहत देने के लिए किया जाता है।",

    "ibuprofen":
        "Ibuprofen का उपयोग दर्द, सूजन और बुखार को कम करने के लिए किया जाता है।",

    "amoxicillin":
        "Amoxicillin एक एंटीबायोटिक है जिसका उपयोग कुछ बैक्टीरियल संक्रमणों के इलाज के लिए किया जाता है।",

    "diclofenac":
        "Diclofenac का उपयोग दर्द और सूजन को कम करने के लिए किया जाता है।",

    "atorvastatin":
        "Atorvastatin का उपयोग कोलेस्ट्रॉल कम करने और हृदय संबंधी जोखिम को कम करने के लिए किया जाता है।"
}


def translate_to_hindi(text):
    """
    Convert known medical treatment statements into Hindi.

    Medicine names, dosages and frequencies are preserved.
    """

    if not isinstance(text, str) or not text.strip():
        return text

    sentences = re.split(
        r'(?<=[.!?])\s+',
        text.strip()
    )

    hindi_sentences = []

    for sentence in sentences:

        if not sentence.strip():
            continue

        sentence_lower = sentence.lower()

        translated = False

        for medicine, hindi_text in MEDICINE_TRANSLATIONS.items():

            if re.search(
                r'\b' + re.escape(medicine) + r'\b',
                sentence_lower
            ):
                hindi_sentences.append(hindi_text)
                translated = True
                break

        if not translated:
            hindi_sentences.append(sentence)

    return " ".join(hindi_sentences)


def translate_text(text):
    """
    Return both English and Hindi versions.
    """

    hindi = translate_to_hindi(text)

    return {
        "english": text,
        "hindi": hindi
    }