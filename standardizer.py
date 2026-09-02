import json


def standardize_record(record):

    prediction = record["prediction"]

    standardized = {

        "patient": {
            "name": prediction["patient"]["name"],
            "date_of_birth": prediction["patient"]["date_of_birth"],
            "medical_record_number":
                prediction["patient"]["medical_record_number"],
            "gender": prediction["patient"]["gender"],
            "contact_information":
                prediction["patient"]["contact_information"]
        },

        "hospitalization": {
            "admission_date":
                prediction["hospitalization"]["admission_date"],
            "discharge_date":
                prediction["hospitalization"]["discharge_date"]
        },

        "diagnoses": prediction["diagnoses"],

        "symptoms": prediction["symptoms"],

        "medical_conditions":
            prediction["medical_conditions"],

        "allergies":
            prediction["allergies"],

        "medications": [],

        "procedures":
            prediction["procedures"],

        "investigations": {
            "imaging":
                prediction["investigations"]["imaging"],

            "laboratory_tests":
                prediction["investigations"]["laboratory_tests"],

            "laboratory_results":
                prediction["investigations"]["laboratory_results"]
        },

        "anatomy":
            prediction["anatomy"],

        "biomarkers":
            prediction["biomarkers"],

        "physicians":
            prediction["physicians"]
    }

    # Standardize medications
    for medication in prediction["medications"]:

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
                "image": record["image"],
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