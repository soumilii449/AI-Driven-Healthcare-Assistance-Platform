import json


def standardize_record(record):

    prediction = record["prediction"]

    demographics = prediction["patient_demographics"]
    temporal = prediction["temporal_entities"]
    clinical = prediction["clinical_diagnoses_and_conditions"]
    medications = prediction["medications"]
    procedures = prediction["procedures_and_interventions"]
    anatomy = prediction["anatomical_and_physiological_entities"]
    professional = prediction["professional_and_organizational_entities"]
    other = prediction["other_domain_specific_entities"]

    standardized = {

        "patient": {
            "name": demographics["patient_names"][0]
            if demographics["patient_names"] else "",

            "date_of_birth": demographics["dates_of_birth"][0]
            if demographics["dates_of_birth"] else "",

            "medical_record_number":
                demographics["medical_record_numbers"][0]
                if demographics["medical_record_numbers"] else "",

            "gender": demographics["gender"],

            "contact_information":
                demographics["contact_information"]
        },

        "hospitalization": {
            "admission_date": temporal["admission_date"],
            "discharge_date": temporal["discharge_date"]
        },

        "diagnoses": clinical["diseases"],

        "symptoms": clinical["symptoms"],

        "medical_conditions": clinical["medical_conditions"],

        "allergies": clinical["allergies"],

        "medications": [],

        "procedures": procedures["surgical_procedures"],

        "investigations": {
            "imaging": procedures["imaging_examinations"],
            "laboratory_tests": procedures["laboratory_tests"],
            "laboratory_results": anatomy["laboratory_results"]
        },

        "anatomy": anatomy["anatomical_parts"],

        "biomarkers": other["biomarkers"],

        "physicians": professional["physician_names"]
    }

    # Standardize medications
    for medication in medications:

        standardized_medication = {
            "name": medication["name"],
            "dosage": medication["dosages"][0]
            if medication["dosages"] else "",

            "frequency": "",
            "duration": "",
            "route": "",

            "purpose": medication["treatment_for"][0]
            if medication["treatment_for"] else "",

            "adverse_effects": medication["adverse_effects"]
        }

        standardized["medications"].append(
            standardized_medication
        )

    return standardized