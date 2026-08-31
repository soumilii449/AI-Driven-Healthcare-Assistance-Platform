def generate_treatment(record):
    """
    Generate basic healthcare advice from the available
    symptoms and diagnoses.

    This is a prototype rule-based treatment module.
    It does not replace a doctor's diagnosis or prescription.
    """

    symptoms = record.get("symptoms", [])
    diagnoses = record.get("diagnoses", [])

    if isinstance(symptoms, str):
        symptoms = [symptoms]

    if isinstance(diagnoses, str):
        diagnoses = [diagnoses]

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

    # No matching condition
    if not advice:
        advice.append(
            "Please consult a qualified healthcare professional "
            "for an appropriate diagnosis and treatment."
        )

    return " ".join(advice)