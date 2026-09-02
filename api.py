from fastapi import FastAPI, HTTPException, UploadFile, File
import os
import shutil

from ocr import extract_text
from medical_extractor import extract_medical_information
from standardizer import standardize_record
from simplifier import simplify_record
from translator import translate_to_hindi
from treatment import generate_treatment


app = FastAPI(
    title="AI Healthcare Assistance API",
    description="AI-powered healthcare assistance for rural communities",
    version="1.0.0"
)


# ========================================
# HOME
# ========================================

@app.get("/")
def home():

    return {
        "message": "AI Healthcare Assistance API is running",
        "status": "success"
    }


# ========================================
# PROCESS PRESCRIPTION IMAGE
# ========================================

@app.post("/process")
async def process_medical_image(
    file: UploadFile = File(...)
):

    # ----------------------------------------
    # Validate file
    # ----------------------------------------

    allowed_types = [
        "image/png",
        "image/jpeg",
        "image/jpg"
    ]

    if file.content_type not in allowed_types:

        raise HTTPException(
            status_code=400,
            detail="Please upload a PNG or JPG image."
        )

    # ----------------------------------------
    # Create upload folder
    # ----------------------------------------

    os.makedirs(
        "uploads",
        exist_ok=True
    )

    file_path = os.path.join(
        "uploads",
        file.filename
    )

    # ----------------------------------------
    # Save uploaded image
    # ----------------------------------------

    try:

        with open(
            file_path,
            "wb"
        ) as buffer:

            shutil.copyfileobj(
                file.file,
                buffer
            )

    except Exception as e:

        raise HTTPException(
            status_code=500,
            detail=f"Could not save image: {str(e)}"
        )

    # ========================================
    # 1. OCR
    # ========================================

    try:

        ocr_text = extract_text(
            file_path
        )

    except Exception as e:

        raise HTTPException(
            status_code=500,
            detail=f"OCR failed: {str(e)}"
        )

    if not ocr_text:

        raise HTTPException(
            status_code=400,
            detail="No text detected in the uploaded image."
        )

    # ========================================
    # 2. MEDICAL EXTRACTION
    # ========================================

    try:

        medical_information = (
            extract_medical_information(
                ocr_text
            )
        )

    except Exception as e:

        raise HTTPException(
            status_code=500,
            detail=f"Medical extraction failed: {str(e)}"
        )

    # ========================================
    # 3. CREATE RECORD
    # ========================================

    extracted_record = {

        "image": file.filename,

        "ocr_text": ocr_text,

        "prediction": medical_information
    }

    # ========================================
    # 4. STANDARDIZATION
    # ========================================

    try:

        standardized_record = (
            standardize_record(
                extracted_record
            )
        )

    except Exception as e:

        raise HTTPException(
            status_code=500,
            detail=f"Standardization failed: {str(e)}"
        )

    # ========================================
    # 5. SIMPLIFICATION
    # ========================================

    try:

        simplified_record = (
            simplify_record(
                standardized_record
            )
        )

    except Exception as e:

        raise HTTPException(
            status_code=500,
            detail=f"Simplification failed: {str(e)}"
        )

    # ========================================
    # 6. HINDI TRANSLATION
    # ========================================

    try:

        hindi_record = {}

        for key, value in simplified_record.items():

            if key == "medications":

                hindi_record[key] = []

                for medication in value:

                    hindi_medication = medication.copy()

                    if medication.get("purpose"):

                        hindi_medication["purpose"] = (
                            translate_to_hindi(
                                medication["purpose"]
                            )
                        )

                    if medication.get("adverse_effects"):

                        hindi_medication[
                            "adverse_effects"
                        ] = [

                            translate_to_hindi(
                                str(effect)
                            )

                            for effect in medication[
                                "adverse_effects"
                            ]
                        ]

                    hindi_record[key].append(
                        hindi_medication
                    )

            elif key in [
                "patient",
                "hospitalization",
                "physicians"
            ]:

                hindi_record[key] = value

            elif isinstance(value, list):

                hindi_record[key] = [

                    translate_to_hindi(
                        str(item)
                    )

                    for item in value
                ]

            elif isinstance(value, dict):

                hindi_record[key] = value

            else:

                hindi_record[key] = value

    except Exception as e:

        raise HTTPException(
            status_code=500,
            detail=f"Hindi translation failed: {str(e)}"
        )

    # ========================================
    # 7. TREATMENT
    # ========================================

    try:

        treatment_english = generate_treatment(
            simplified_record
        )

        treatment_hindi = translate_to_hindi(
            treatment_english
        )

    except Exception as e:

        raise HTTPException(
            status_code=500,
            detail=f"Treatment generation failed: {str(e)}"
        )

    # ========================================
    # 8. FINAL RESPONSE
    # ========================================

    return {

        "status": "success",

        "image": file.filename,

        "ocr_text": ocr_text,

        "medical_information":
            standardized_record,

        "simplified_information":
            simplified_record,

        "hindi_information":
            hindi_record,

        "treatment_english":
            treatment_english,

        "treatment_hindi":
            treatment_hindi
    }