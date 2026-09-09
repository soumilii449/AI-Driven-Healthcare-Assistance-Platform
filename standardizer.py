import json


def standardize_record(record):

    # Support both formats:
    # 1. Direct medical information
    # 2. {"prediction": {...}}

    if "prediction" in record:
        prediction = record["prediction"]
    else:
        prediction = record

    standardized = {

        "patient": {
            "name": prediction.get("patient", {}).get("name", ""),
            "date_of_birth": prediction.get("patient", {}).get("date_of_birth", ""),
            "medical_record_number":
                prediction.get("patient", {}).get("medical_record_number", ""),
            "gender": prediction.get("patient", {}).get("gender", ""),
            "contact_information":
                prediction.get("patient", {}).get("contact_information", "")
        },

        "hospitalization": {
            "admission_date":
                prediction.get("hospitalization", {}).get("admission_date", ""),
            "discharge_date":
                prediction.get("hospitalization", {}).get("discharge_date", "")
        },

        "diagnoses":
            prediction.get("diagnoses", []),

        "symptoms":
            prediction.get("symptoms", []),

        "medical_conditions":
            prediction.get("medical_conditions", []),

        "allergies":
            prediction.get("allergies", []),

        "medications": [],

        "procedures":
            prediction.get("procedures", []),

        "investigations": {
            "imaging":
                prediction.get("investigations", {}).get("imaging", []),

            "laboratory_tests":
                prediction.get("investigations", {}).get("laboratory_tests", []),

            "laboratory_results":
                prediction.get("investigations", {}).get("laboratory_results", [])
        },

        "anatomy":
            prediction.get("anatomy", []),

        "biomarkers":
            prediction.get("biomarkers", []),

        "physicians":
            prediction.get("physicians", [])
    }

    # Standardize medications
    for medication in prediction.get("medications", []):

        if not isinstance(medication, dict):
            continue

        standardized_medication = {
            "name": medication.get("name", ""),
            "dosage": medication.get("dosage", ""),
            "frequency": medication.get("frequency", ""),
            "duration": medication.get("duration", ""),
            "route": medication.get("route", ""),
            "purpose": medication.get("purpose", ""),
            "adverse_effects":
                medication.get("adverse_effects", [])
        }

        standardized["medications"].append(
            standardized_medication
        )

    return standardized


if __name__ == "__main__":

    with open(
        "output/extraction.json",
        "r",
        encoding="utf-8"
    ) as file:

        records = json.load(file)

    standardized_records = []

    for record in records:

        try:
            standardized = standardize_record(record)

            standardized_records.append({
                "image": record.get("image", ""),
                "standardized": standardized
            })

        except Exception as e:

            print(
                f"Error processing {record.get('image', 'unknown')}: {e}"
            )

    with open(
        "output/standardized.json",
        "w",
        encoding="utf-8"
    ) as file:

        json.dump(
            standardized_records,
            file,
            indent=2,
            ensure_ascii=False
        )

    print(
        f"Standardization completed: "
        f"{len(standardized_records)} records"
    )