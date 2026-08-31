# simlifier.py

# Medical terminology dictionary
MEDICAL_DICTIONARY = {

    "hypertension": "high blood pressure",

    "gastroesophageal reflux disease": "acid reflux",

    "type II diabetes mellitus": "type 2 diabetes",

    "diabetes mellitus type 2": "type 2 diabetes",

    "adenocarcinoma": "a type of cancer that starts in gland cells",

    "colorectal cancer": "cancer of the colon or rectum",

    "metastatic colorectal cancer": "colorectal cancer that has spread to other parts of the body",

    "hemicolectomy": "surgery to remove part of the colon",

    "right hemicolectomy": "surgery to remove the right side of the colon",

    "laparoscopic": "surgery performed through small cuts using a camera",

    "lymph nodes": "small structures that help the body fight infection",

    "lymph node": "small structure that helps the body fight infection",

    "anemia": "low number of healthy red blood cells",

    "neutropenia": "low number of white blood cells that fight infection",

    "neuropathy": "nerve damage that can cause pain, tingling, or numbness",

    "hematuria": "blood in the urine",

    "jaundice": "yellowing of the skin or eyes",

    "biopsy": "removing a small tissue sample to check for disease",

    "chemotherapy": "medicines used to treat cancer",

    "adjuvant chemotherapy": "additional cancer treatment given after surgery",

    "antibiotics": "medicines used to treat bacterial infections",

    "analgesics": "pain-relieving medicines",

    "antiemetics": "medicines used to prevent or control nausea and vomiting",

    "hypertension control": "control of high blood pressure",

    "CRP": "a blood test that can show inflammation",

    "C-reactive protein": "a blood marker that can show inflammation",

    "CEA": "a blood marker that can be used to monitor some cancers",

    "carcinoembryonic antigen": "a blood marker that can be used to monitor some cancers",

    "FOLFOX": "a combination of chemotherapy medicines used to treat colorectal cancer",

    "fluorouracil": "a chemotherapy medicine used to treat cancer",

    "oxaliplatin": "a chemotherapy medicine used to treat cancer",

    "folinic acid": "a medicine used with some chemotherapy treatments",

    "leucovorin": "a medicine used with some chemotherapy treatments",

    "cisplatin": "a chemotherapy medicine used to treat cancer",

    "gemcitabine": "a chemotherapy medicine used to treat cancer",

    "methotrexate": "a medicine that can be used in cancer treatment",

    "morphine": "a strong medicine used to relieve pain",

    "acetaminophen": "a medicine used to relieve pain and reduce fever",

    "NSAIDs": "medicines used to reduce pain and inflammation",

    "CT scan": "an imaging test that creates detailed pictures inside the body",

    "MRI": "an imaging test that creates detailed pictures of organs and tissues",

    "radiation therapy": "treatment that uses radiation to destroy cancer cells",

    "SBRT": "a type of precise radiation treatment",

    "dehydration": "a condition where the body does not have enough fluid",

    "malnutrition": "a condition caused by not getting enough nutrients",

    "pulmonary complications": "problems affecting the lungs",

    "urinary retention": "difficulty emptying the bladder",

    "bowel obstruction": "a blockage that prevents food or waste from moving through the intestine",

    "ileal conduit": "a surgically created pathway that carries urine out of the body",

    "CRP": "a blood test that can indicate inflammation",

    "WBC": "white blood cell count"
}


def simplify_text(text):

    if not isinstance(text, str):
        return text

    text_lower = text.lower()

    for medical_term, simple_meaning in MEDICAL_DICTIONARY.items():

        if medical_term.lower() in text_lower:

            return simple_meaning

    return text


def simplify_value(value):

    if isinstance(value, str):

        return simplify_text(value)

    elif isinstance(value, list):

        return [simplify_value(item) for item in value]

    elif isinstance(value, dict):

        return {
            key: simplify_value(val)
            for key, val in value.items()
        }

    else:

        return value


def simplify_record(record):

    return simplify_value(record)