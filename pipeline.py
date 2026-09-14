import json
import os

from standardizer import standardize_record
from simplifier import simplify_record
from translator import translate_to_language, translate_to_hindi, SUPPORTED_LANGUAGES
from treatment import generate_treatment
from medical_extractor import extract_medical_information


os.makedirs("output", exist_ok=True)


def translate_medical_record(record, target_lang="hi"):

    translated_record = {}

    patient = record.get("patient", {})
    translated_record["patient"] = patient.copy()

    translated_record["hospitalization"] = record.get(
        "hospitalization",
        {}
    ).copy()

    translated_record["diagnoses"] = [
        translate_to_language(str(item), target_lang)
        for item in record.get("diagnoses", [])
    ]

    translated_record["symptoms"] = [
        translate_to_language(str(item), target_lang)
        for item in record.get("symptoms", [])
    ]

    translated_record["medical_conditions"] = [
        translate_to_language(str(item), target_lang)
        for item in record.get("medical_conditions", [])
    ]

    translated_record["allergies"] = [
        translate_to_language(str(item), target_lang)
        for item in record.get("allergies", [])
    ]

    translated_record["medications"] = []

    for medication in record.get("medications", []):

        if not isinstance(medication, dict):
            continue

        translated_medication = {

            "name": medication.get(
                "name",
                ""
            ),

            "dosage": medication.get(
                "dosage",
                ""
            ),

            "frequency": medication.get(
                "frequency",
                ""
            ),

            "duration": medication.get(
                "duration",
                ""
            ),

            "route": medication.get(
                "route",
                ""
            ),

            "purpose": (
                translate_to_language(
                    medication.get(
                        "purpose",
                        ""
                    ),
                    target_lang
                )
                if medication.get(
                    "purpose",
                    ""
                )
                else ""
            ),

            "adverse_effects": [
                translate_to_language(str(effect), target_lang)
                for effect in medication.get(
                    "adverse_effects",
                    []
                )
            ]
        }

        translated_record["medications"].append(
            translated_medication
        )

    translated_record["procedures"] = [
        translate_to_language(str(item), target_lang)
        for item in record.get("procedures", [])
    ]

    investigations = record.get(
        "investigations",
        {}
    )

    translated_record["investigations"] = {

        "imaging": [
            translate_to_language(str(item), target_lang)
            for item in investigations.get(
                "imaging",
                []
            )
        ],

        "laboratory_tests": [
            translate_to_language(str(item), target_lang)
            for item in investigations.get(
                "laboratory_tests",
                []
            )
        ],

        "laboratory_results": [
            translate_to_language(str(item), target_lang)
            for item in investigations.get(
                "laboratory_results",
                []
            )
        ]
    }

    translated_record["anatomy"] = [
        translate_to_language(str(item), target_lang)
        for item in record.get("anatomy", [])
    ]

    translated_record["biomarkers"] = [
        translate_to_language(str(item), target_lang)
        for item in record.get("biomarkers", [])
    ]

    translated_record["physicians"] = record.get(
        "physicians",
        []
    )

    return translated_record


# ========================================
# PROCESS ONE MEDICAL RECORD
# ========================================

def process_record(record, target_lang="hi"):

    ocr_text = record.get(
        "ocr_text",
        ""
    )

    if not ocr_text.strip():

        return {
            "error": "OCR text is empty."
        }

    if target_lang not in SUPPORTED_LANGUAGES:
        target_lang = "hi"

    # ----------------------------------------
    # 1. Medical Extraction
    # ----------------------------------------

    medical_information = (
        extract_medical_information(
            ocr_text
        )
    )

    extracted_record = {

        "image": record.get(
            "image",
            ""
        ),

        "ocr_text": ocr_text,

        "prediction": medical_information
    }

    # ----------------------------------------
    # 2. Standardization
    # ----------------------------------------

    standardized_data = standardize_record(
        extracted_record
    )

    # ----------------------------------------
    # 3. Simplification
    # ----------------------------------------

    simplified_data = simplify_record(
        standardized_data
    )

    # ----------------------------------------
    # 4. Translation (any supported language)
    # ----------------------------------------

    translated_data = translate_medical_record(
        simplified_data,
        target_lang=target_lang
    )

    # ----------------------------------------
    # 5. Treatment / Advice
    # ----------------------------------------

    treatment_english = generate_treatment(
        simplified_data
    )

    treatment_translated = translate_to_language(
        treatment_english,
        target_lang
    )

    # ----------------------------------------
    # 6. Final Result
    # ----------------------------------------

    return {

        "image": record.get(
            "image",
            ""
        ),

        "ocr_text": ocr_text,

        "medical_information":
            standardized_data,

        "simplified_information":
            simplified_data,

        "language":
            target_lang,

        "translated_information":
            translated_data,

        "treatment_english":
            treatment_english,

        "treatment_translated":
            treatment_translated,

        # kept for backward compatibility with any code/files
        # still reading the old Hindi-only field names
        "hindi_information":
            translated_data if target_lang == "hi" else translate_medical_record(simplified_data, "hi"),

        "treatment_hindi":
            treatment_translated if target_lang == "hi" else translate_to_hindi(treatment_english)
    }


# ========================================
# PROCESS COMPLETE OCR FILE
# ========================================

def process_all_records(target_lang="hi"):

    with open(
        "output/ocr_results.json",
        "r",
        encoding="utf-8"
    ) as file:

        ocr_data = json.load(file)

    final_pipeline = []

    print("\n========================================")
    print("     OCR → MEDICAL EXTRACTION")
    print("========================================")

    for index, record in enumerate(
        ocr_data,
        start=1
    ):

        print(
            f"\nProcessing record "
            f"{index}/{len(ocr_data)}..."
        )

        try:

            result = process_record(
                record,
                target_lang=target_lang
            )

            final_pipeline.append(
                result
            )

        except Exception as e:

            print(
                "Processing error:",
                e
            )

    with open(
        "output/final_pipeline.json",
        "w",
        encoding="utf-8"
    ) as file:

        json.dump(
            final_pipeline,
            file,
            indent=2,
            ensure_ascii=False
        )

    print(
        "\nFinal pipeline output saved to:"
        " output/final_pipeline.json"
    )

    print("\n========================================")
    print("        COMPLETE PIPELINE FINISHED")
    print("========================================")

    return final_pipeline


# ========================================
# RUN PIPELINE DIRECTLY
# ========================================

if __name__ == "__main__":

    process_all_records(target_lang="hi")