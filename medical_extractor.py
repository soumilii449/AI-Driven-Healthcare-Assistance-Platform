import re


def extract_medications(text):
    medications = []

    pattern = r'\b(?:Tab|Tablet)\s*([A-Za-z]+)\s+(\d+(?:\.\d+)?\s*(?:mg|mcg|g|ml))\s+([01]-[01]-[01])'

    matches = re.findall(pattern, text, re.IGNORECASE)

    for medicine, dosage, frequency in matches:
        medications.append({
            "name": medicine.capitalize(),
            "dosage": dosage.replace(" ", ""),
            "frequency": frequency,
            "duration": "",
            "route": "",
            "purpose": "",
            "adverse_effects": []
        })

    return medications


def extract_medical_information(text):
    medications = extract_medications(text)

    physicians = []

    doctor_matches = re.findall(
        r'\bDr\.?\s*([A-Za-z]+(?:\s+[A-Za-z]+)?)',
        text,
        re.IGNORECASE
    )

    for doctor in doctor_matches:
        physicians.append(doctor.strip())

    dosages = re.findall(
        r'\b\d+(?:\.\d+)?\s*(?:mg|mcg|g|ml)\b',
        text,
        re.IGNORECASE
    )

    frequencies = re.findall(
        r'\b[01]-[01]-[01]\b',
        text
    )

    return {
        "patient": {
            "name": "",
            "date_of_birth": "",
            "medical_record_number": "",
            "gender": "",
            "contact_information": ""
        },

        "hospitalization": {
            "admission_date": "",
            "discharge_date": ""
        },

        "diagnoses": [],

        "symptoms": [],

        "medical_conditions": [],

        "allergies": [],

        "medications": medications,

        "procedures": [],

        "investigations": {
            "imaging": [],
            "laboratory_tests": [],
            "laboratory_results": []
        },

        "anatomy": [],

        "biomarkers": [],

        "physicians": physicians
    }


if __name__ == "__main__":

    test_text = """
    Dr. S Patel MBBS MD Rx
    Tab Omeprazole 500mg 1-0-0
    Tab Paracetamol 10mg 0-1-0
    Tab Pantoprazole 200mg 0-0-1
    """

    result = extract_medical_information(test_text)

    print("\n========== EXTRACTED MEDICAL INFORMATION ==========\n")

    print("Medicines:")

    for medicine in result["medications"]:
        print(
            f"Medicine: {medicine['name']}"
        )
        print(
            f"Dosage: {medicine['dosage']}"
        )
        print(
            f"Frequency: {medicine['frequency']}"
        )
        print()

    print("Physicians:")
    print(result["physicians"])