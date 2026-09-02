def generate_treatment(record):
    """
    Generate basic healthcare advice from available
    symptoms, diagnoses, and medications.

    This is a prototype rule-based treatment module.
    It does not replace a doctor's diagnosis or prescription.
    """

    symptoms = record.get("symptoms", [])
    diagnoses = record.get("diagnoses", [])
    medications = record.get("medications", [])

    if isinstance(symptoms, str):
        symptoms = [symptoms]

    if isinstance(diagnoses, str):
        diagnoses = [diagnoses]

    if not isinstance(medications, list):
        medications = []

    symptoms_text = " ".join(
        str(item).lower()
        for item in symptoms
    )

    diagnoses_text = " ".join(
        str(item).lower()
        for item in diagnoses
    )

    text = symptoms_text + " " + diagnoses_text

    advice = []

    # Fever
    if "fever" in text:
        advice.append(
            "Drink plenty of fluids, get adequate rest, "
            "and monitor your temperature. "
            "Consult a doctor if the fever is high or persistent."
        )

    # Headache
    if "headache" in text:
        advice.append(
            "Get adequate rest, stay hydrated, and avoid excessive "
            "screen time. Consult a doctor if the headache is severe "
            "or persistent."
        )

    # Cough
    if "cough" in text:
        advice.append(
            "Drink warm fluids and get adequate rest. "
            "If the cough persists or breathing becomes difficult, "
            "consult a doctor."
        )

    # Abdominal pain
    if "abdominal pain" in text or "stomach pain" in text:
        advice.append(
            "Eat light meals, stay hydrated, and monitor the pain. "
            "Seek medical attention if the pain is severe or persistent."
        )

    # Nausea
    if "nausea" in text:
        advice.append(
            "Drink small amounts of fluids frequently and eat light foods. "
            "Consult a doctor if vomiting or severe symptoms occur."
        )

    # Diabetes
    if "diabetes" in text:
        advice.append(
            "Monitor blood glucose regularly and follow the treatment "
            "plan prescribed by your doctor."
        )

    # Hypertension
    if "hypertension" in text or "high blood pressure" in text:
        advice.append(
            "Monitor your blood pressure regularly and follow the "
            "medication and lifestyle advice provided by your doctor."
        )

    # Breathing difficulty
    if "difficulty breathing" in text or "shortness of breath" in text:
        advice.append(
            "Difficulty breathing can require urgent medical attention. "
            "Seek medical help promptly, especially if symptoms are severe."
        )

    # Medication-based information
    medication_advice = []

    for medication in medications:

        if not isinstance(medication, dict):
            continue

        name = str(medication.get("name", "")).lower()

        if not name:
            continue

        if "omeprazole" in name:
            medication_advice.append(
                "Omeprazole is commonly used to reduce stomach acid "
                "and is used for acid-related stomach conditions."
            )

        elif "pantoprazole" in name:
            medication_advice.append(
                "Pantoprazole is commonly used to reduce stomach acid "
                "and is used for acid-related digestive conditions."
            )

        elif "paracetamol" in name:
            medication_advice.append(
                "Paracetamol is commonly used to relieve pain and reduce fever."
            )

        elif "ibuprofen" in name:
            medication_advice.append(
                "Ibuprofen is commonly used to relieve pain, inflammation, "
                "and fever."
            )

        elif "azithromycin" in name:
            medication_advice.append(
                "Azithromycin is an antibiotic used for certain bacterial "
                "infections and should be taken only as prescribed."
            )

        elif "amoxicillin" in name:
            medication_advice.append(
                "Amoxicillin is an antibiotic used for certain bacterial "
                "infections and should be taken only as prescribed."
            )

        elif "cetirizine" in name:
            medication_advice.append(
                "Cetirizine is commonly used to relieve allergy symptoms."
            )

        elif "diclofenac" in name:
            medication_advice.append(
                "Diclofenac is commonly used to relieve pain and inflammation."
            )

        elif "atorvastatin" in name:
            medication_advice.append(
                "Atorvastatin is commonly used to help lower cholesterol "
                "and reduce cardiovascular risk."
            )

        elif "metformin" in name:
            medication_advice.append(
                "Metformin is commonly used to help control blood glucose "
                "in people with type 2 diabetes."
            )

    if medication_advice:
        advice.extend(medication_advice)

    # If nothing was recognized
    if not advice:
        advice.append(
            "Please consult a qualified healthcare professional "
            "for an appropriate diagnosis and treatment."
        )

    return " ".join(advice)