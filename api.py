from fastapi import FastAPI, HTTPException, UploadFile, File, Depends
from sqlalchemy.orm import Session
from datetime import datetime
import os
import shutil

from database import engine, Base, get_db
from models import Document, MedicalExtraction

Base.metadata.create_all(
    bind=engine
)

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

    os.makedirs(
        "uploads",
        exist_ok=True
    )

    file_path = os.path.join(
        "uploads",
        file.filename
    )

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

    extracted_record = {

        "image": file.filename,

        "ocr_text": ocr_text,

        "prediction": medical_information
    }

    # ========================================
    # 3. STANDARDIZATION
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
    # 4. SIMPLIFICATION
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
    # 5. HINDI TRANSLATION
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
    # 6. TREATMENT
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
    # 7. FINAL RESPONSE
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


# ========================================
# DOCUMENT APIs
# ========================================


# ========================================
# POST /documents
# UPLOAD DOCUMENT
# ========================================

@app.post("/documents")
async def create_document(
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):

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

    os.makedirs(
        "uploads",
        exist_ok=True
    )

    file_path = os.path.join(
        "uploads",
        file.filename
    )

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
            detail=f"Could not save file: {str(e)}"
        )

    document = Document(

        filename=file.filename,

        file_path=file_path,

        document_type="prescription",

        status="uploaded",

        created_at=datetime.utcnow()
    )

    db.add(
        document
    )

    db.commit()

    db.refresh(
        document
    )

    return {

        "status": "success",

        "message":
            "Document uploaded successfully",

        "document_id":
            document.id,

        "filename":
            document.filename,

        "document_type":
            document.document_type,

        "status":
            document.status
    }


# ========================================
# GET /documents
# GET ALL DOCUMENTS
# ========================================

@app.get("/documents")
def get_documents(
    db: Session = Depends(get_db)
):

    documents = db.query(
        Document
    ).all()

    return documents


# ========================================
# GET /documents/{id}
# GET SINGLE DOCUMENT
# ========================================

@app.get("/documents/{document_id}")
def get_document(
    document_id: int,
    db: Session = Depends(get_db)
):

    document = db.query(
        Document
    ).filter(
        Document.id == document_id
    ).first()

    if not document:

        raise HTTPException(
            status_code=404,
            detail="Document not found"
        )

    return document


# ========================================
# DELETE /documents/{id}
# DELETE DOCUMENT
# ========================================

@app.delete("/documents/{document_id}")
def delete_document(
    document_id: int,
    db: Session = Depends(get_db)
):

    document = db.query(
        Document
    ).filter(
        Document.id == document_id
    ).first()

    if not document:

        raise HTTPException(
            status_code=404,
            detail="Document not found"
        )

    # ----------------------------------------
    # Delete physical file
    # ----------------------------------------

    if document.file_path:

        if os.path.exists(
            document.file_path
        ):

            try:

                os.remove(
                    document.file_path
                )

            except Exception:

                pass

    # ----------------------------------------
    # Delete database record
    # ----------------------------------------

    db.delete(
        document
    )

    db.commit()

    return {

        "status": "success",

        "message":
            "Document deleted successfully",

        "document_id":
            document_id
    }


# ========================================
# POST /documents/{id}/process
# PROCESS DOCUMENT
# ========================================

@app.post("/documents/{document_id}/process")
def process_document(
    document_id: int,
    db: Session = Depends(get_db)
):

    # ========================================
    # FIND DOCUMENT
    # ========================================

    document = db.query(
        Document
    ).filter(
        Document.id == document_id
    ).first()

    if not document:

        raise HTTPException(
            status_code=404,
            detail="Document not found"
        )

    # ========================================
    # CHECK FILE
    # ========================================

    if not os.path.exists(
        document.file_path
    ):

        raise HTTPException(
            status_code=404,
            detail="Uploaded file not found"
        )

    # ========================================
    # UPDATE STATUS
    # ========================================

    document.status = "processing"

    db.commit()

    # ========================================
    # 1. OCR
    # ========================================

    try:

        ocr_text = extract_text(
            document.file_path
        )

    except Exception as e:

        document.status = "failed"

        db.commit()

        raise HTTPException(
            status_code=500,
            detail=f"OCR failed: {str(e)}"
        )

    if not ocr_text:

        document.status = "failed"

        db.commit()

        raise HTTPException(
            status_code=400,
            detail="No text detected in document"
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

        document.status = "failed"

        db.commit()

        raise HTTPException(
            status_code=500,
            detail=f"Medical extraction failed: {str(e)}"
        )

    extracted_record = {

        "image": document.filename,

        "ocr_text": ocr_text,

        "prediction": medical_information
    }

    # ========================================
    # 3. STANDARDIZATION
    # ========================================

    try:

        standardized_record = (
            standardize_record(
                extracted_record
            )
        )

    except Exception as e:

        document.status = "failed"

        db.commit()

        raise HTTPException(
            status_code=500,
            detail=f"Standardization failed: {str(e)}"
        )

    # ========================================
    # 4. SIMPLIFICATION
    # ========================================

    try:

        simplified_record = (
            simplify_record(
                standardized_record
            )
        )

    except Exception as e:

        document.status = "failed"

        db.commit()

        raise HTTPException(
            status_code=500,
            detail=f"Simplification failed: {str(e)}"
        )

    # ========================================
    # 5. HINDI TRANSLATION
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

        document.status = "failed"

        db.commit()

        raise HTTPException(
            status_code=500,
            detail=f"Hindi translation failed: {str(e)}"
        )

    # ========================================
    # 6. TREATMENT GENERATION
    # ========================================

    try:

        treatment_english = generate_treatment(
            simplified_record
        )

        treatment_hindi = translate_to_hindi(
            treatment_english
        )

    except Exception as e:

        document.status = "failed"

        db.commit()

        raise HTTPException(
            status_code=500,
            detail=f"Treatment generation failed: {str(e)}"
        )

    # ========================================
    # 7. PREPARE DATABASE DATA
    # ========================================

    processed_data = {

        "medical_information":
            standardized_record,

        "treatment_english":
            treatment_english
    }

    translated_data = {

        "hindi_information":
            hindi_record,

        "treatment_hindi":
            treatment_hindi
    }

    # ========================================
    # 8. SAVE MEDICAL EXTRACTION
    # ========================================

    extraction = MedicalExtraction(

        document_id=document.id,

        patient_id=None,

        document_type=document.document_type,

        raw_text=ocr_text,

        processed_data=processed_data,

        simplified_text=simplified_record,

        translated_text=translated_data,

        language="hi",

        processed_at=datetime.utcnow()
    )

    db.add(
        extraction
    )

    # ========================================
    # 9. UPDATE DOCUMENT
    # ========================================

    document.status = "processed"

    db.commit()

    db.refresh(
        extraction
    )

    # ========================================
    # 10. RETURN RESULT
    # ========================================

    return {

        "status": "success",

        "message":
            "Document processed successfully",

        "document_id":
            document.id,

        "extraction_id":
            extraction.id,

        "ocr_text":
            ocr_text,

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
# ========================================
# GET /medical-extractions
# GET SAVED MEDICAL EXTRACTION RECORDS
# ========================================

@app.get("/medical-extractions")
def get_medical_extractions(
    db: Session = Depends(get_db)
):

    extractions = db.query(
        MedicalExtraction
    ).all()

    return [
        {
            "id": extraction.id,
            "document_id": extraction.document_id,
            "patient_id": extraction.patient_id,
            "document_type": extraction.document_type,
            "raw_text": extraction.raw_text,
            "processed_data": extraction.processed_data,
            "simplified_text": extraction.simplified_text,
            "translated_text": extraction.translated_text,
            "language": extraction.language,
            "processed_at": extraction.processed_at
        }

        for extraction in extractions
    ]