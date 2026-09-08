from fastapi import FastAPI, HTTPException, UploadFile, File, Depends, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from sqlalchemy import desc, text, Column, Integer, String
from pydantic import BaseModel
from datetime import datetime, timedelta
import os
import shutil
import hashlib
import secrets
from jose import JWTError, jwt

from database import engine, Base, get_db
from models import Document, MedicalExtraction


# ========================================
# AUTHENTICATION & ROLE AUTHORIZATION
# ========================================

SECRET_KEY = "CHANGE_THIS_TO_A_LONG_RANDOM_SECRET_KEY"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, nullable=False, index=True)
    password_hash = Column(String, nullable=False)
    role = Column(String, nullable=False, default="patient")


class UserCreate(BaseModel):
    username: str
    password: str
    role: str = "patient"


def hash_password(password: str):
    salt = secrets.token_hex(16)
    password_hash = hashlib.pbkdf2_hmac(
        "sha256",
        password.encode(),
        salt.encode(),
        100000
    ).hex()
    return f"{salt}${password_hash}"


def verify_password(password: str, stored_hash: str):
    try:
        salt, stored = stored_hash.split("$", 1)
        calculated = hashlib.pbkdf2_hmac(
            "sha256",
            password.encode(),
            salt.encode(),
            100000
        ).hex()
        return secrets.compare_digest(calculated, stored)
    except Exception:
        return False


def create_access_token(data: dict):
    payload = data.copy()
    payload["exp"] = datetime.utcnow() + timedelta(
        minutes=ACCESS_TOKEN_EXPIRE_MINUTES
    )
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)


def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Invalid or expired authentication token",
        headers={"WWW-Authenticate": "Bearer"}
    )

    try:
        payload = jwt.decode(
            token,
            SECRET_KEY,
            algorithms=[ALGORITHM]
        )
        username = payload.get("sub")
        role = payload.get("role")

        if not username or not role:
            raise credentials_exception

    except JWTError:
        raise credentials_exception

    user = db.query(User).filter(
        User.username == username
    ).first()

    if not user:
        raise credentials_exception

    return user


def require_roles(*allowed_roles):
    def role_checker(
        current_user: User = Depends(get_current_user)
    ):
        if current_user.role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have permission to access this resource."
            )
        return current_user

    return role_checker

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
# AUTH APIs
# ========================================

@app.post("/auth/register")
def register_user(
    user_data: UserCreate,
    db: Session = Depends(get_db)
):
    allowed_roles = ["admin", "doctor", "patient"]

    if user_data.role not in allowed_roles:
        raise HTTPException(
            status_code=400,
            detail="Role must be admin, doctor, or patient."
        )

    if db.query(User).filter(
        User.username == user_data.username
    ).first():
        raise HTTPException(
            status_code=400,
            detail="Username already exists"
        )

    # In production, admin accounts should be created only
    # by an existing administrator.
    user = User(
        username=user_data.username,
        password_hash=hash_password(user_data.password),
        role=user_data.role
    )

    db.add(user)
    db.commit()
    db.refresh(user)

    return {
        "status": "success",
        "message": "User registered successfully",
        "user_id": user.id,
        "username": user.username,
        "role": user.role
    }


@app.post("/auth/login")
def login_user(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db)
):
    user = db.query(User).filter(
        User.username == form_data.username
    ).first()

    if not user or not verify_password(
        form_data.password,
        user.password_hash
    ):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"}
        )

    token = create_access_token({
        "sub": user.username,
        "role": user.role
    })

    return {
        "access_token": token,
        "token_type": "bearer",
        "role": user.role
    }


@app.get("/auth/me")
def get_my_profile(
    current_user: User = Depends(get_current_user)
):
    return {
        "status": "success",
        "user_id": current_user.id,
        "username": current_user.username,
        "role": current_user.role
    }


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
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("admin", "doctor"))
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
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("admin", "doctor"))
):

    documents = db.query(
        Document
    ).all()

    return documents




# ========================================
# GET /documents/search
# SEARCH DOCUMENTS
# ========================================

@app.get("/documents/search")
def search_documents(
    filename: str = None,
    status: str = None,
    document_type: str = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("admin", "doctor"))
):
    query = db.query(Document)

    if filename:
        query = query.filter(
            Document.filename.ilike(f"%{filename}%")
        )

    if status:
        query = query.filter(
            Document.status == status
        )

    if document_type:
        query = query.filter(
            Document.document_type == document_type
        )

    documents = query.all()

    return [
        {
            "id": document.id,
            "filename": document.filename,
            "document_type": document.document_type,
            "status": document.status,
            "created_at": document.created_at
        }
        for document in documents
    ]

# ========================================
# GET /documents/{id}
# GET SINGLE DOCUMENT
# ========================================

@app.get("/documents/{document_id}")
def get_document(
    document_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("admin", "doctor", "patient"))
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
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("admin"))
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
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("admin", "doctor"))
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
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("admin", "doctor"))
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


# ========================================
# GET /documents/{id}/status
# GET DOCUMENT PROCESSING STATUS
# ========================================

@app.get("/documents/{document_id}/status")
def get_document_status(
    document_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("admin", "doctor", "patient"))
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

    return {
        "status": "success",
        "document_id": document.id,
        "filename": document.filename,
        "document_status": document.status
    }


# ========================================
# GET /documents/{id}/result
# GET COMPLETE PROCESSED RESULT
# ========================================

@app.get("/documents/{document_id}/result")
def get_document_result(
    document_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("admin", "doctor", "patient"))
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

    extraction = db.query(
        MedicalExtraction
    ).filter(
        MedicalExtraction.document_id == document_id
    ).order_by(
        desc(MedicalExtraction.processed_at)
    ).first()

    if not extraction:
        raise HTTPException(
            status_code=404,
            detail="No processed result found for this document"
        )

    processed_data = extraction.processed_data or {}
    translated_data = extraction.translated_text or {}

    return {
        "status": "success",
        "document_id": document.id,
        "extraction_id": extraction.id,
        "filename": document.filename,
        "document_status": document.status,
        "ocr_text": extraction.raw_text,
        "medical_information": processed_data.get(
            "medical_information", {}
        ),
        "simplified_information": extraction.simplified_text,
        "hindi_information": translated_data.get(
            "hindi_information", {}
        ),
        "treatment_english": processed_data.get(
            "treatment_english", ""
        ),
        "treatment_hindi": translated_data.get(
            "treatment_hindi", ""
        ),
        "language": extraction.language,
        "processed_at": extraction.processed_at
    }


# ========================================
# GET /documents/{id}/ocr
# GET OCR TEXT
# ========================================

@app.get("/documents/{document_id}/ocr")
def get_document_ocr(
    document_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("admin", "doctor", "patient"))
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

    extraction = db.query(
        MedicalExtraction
    ).filter(
        MedicalExtraction.document_id == document_id
    ).order_by(
        desc(MedicalExtraction.processed_at)
    ).first()

    if not extraction:
        raise HTTPException(
            status_code=404,
            detail="OCR result not found"
        )

    return {
        "status": "success",
        "document_id": document_id,
        "filename": document.filename,
        "ocr_text": extraction.raw_text
    }


# ========================================
# GET /documents/{id}/medications
# GET EXTRACTED MEDICATIONS
# ========================================

@app.get("/documents/{document_id}/medications")
def get_document_medications(
    document_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("admin", "doctor", "patient"))
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

    extraction = db.query(
        MedicalExtraction
    ).filter(
        MedicalExtraction.document_id == document_id
    ).order_by(
        desc(MedicalExtraction.processed_at)
    ).first()

    if not extraction:
        raise HTTPException(
            status_code=404,
            detail="Medical extraction not found"
        )

    processed_data = extraction.processed_data or {}
    medical_information = processed_data.get(
        "medical_information", {}
    )

    medications = medical_information.get(
        "medications", []
    )

    return {
        "status": "success",
        "document_id": document_id,
        "filename": document.filename,
        "medications": medications
    }


# ========================================
# GET /documents/{id}/treatment
# GET TREATMENT INFORMATION
# ========================================

@app.get("/documents/{document_id}/treatment")
def get_document_treatment(
    document_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("admin", "doctor", "patient"))
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

    extraction = db.query(
        MedicalExtraction
    ).filter(
        MedicalExtraction.document_id == document_id
    ).order_by(
        desc(MedicalExtraction.processed_at)
    ).first()

    if not extraction:
        raise HTTPException(
            status_code=404,
            detail="Treatment result not found"
        )

    processed_data = extraction.processed_data or {}
    translated_data = extraction.translated_text or {}

    return {
        "status": "success",
        "document_id": document_id,
        "treatment_english": processed_data.get(
            "treatment_english", ""
        ),
        "treatment_hindi": translated_data.get(
            "treatment_hindi", ""
        )
    }


# ========================================
# GET /documents/{id}/translation
# GET HINDI TRANSLATION
# ========================================

@app.get("/documents/{document_id}/translation")
def get_document_translation(
    document_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("admin", "doctor", "patient"))
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

    extraction = db.query(
        MedicalExtraction
    ).filter(
        MedicalExtraction.document_id == document_id
    ).order_by(
        desc(MedicalExtraction.processed_at)
    ).first()

    if not extraction:
        raise HTTPException(
            status_code=404,
            detail="Translation result not found"
        )

    translated_data = extraction.translated_text or {}

    return {
        "status": "success",
        "document_id": document_id,
        "language": extraction.language,
        "hindi_information": translated_data.get(
            "hindi_information", {}
        ),
        "treatment_hindi": translated_data.get(
            "treatment_hindi", ""
        )
    }


# ========================================
# GET /medical-extractions/{id}
# GET SINGLE MEDICAL EXTRACTION
# ========================================

@app.get("/medical-extractions/{extraction_id}")
def get_medical_extraction(
    extraction_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("admin", "doctor", "patient"))
):
    extraction = db.query(
        MedicalExtraction
    ).filter(
        MedicalExtraction.id == extraction_id
    ).first()

    if not extraction:
        raise HTTPException(
            status_code=404,
            detail="Medical extraction not found"
        )

    return {
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


# ========================================
# DELETE /medical-extractions/{id}
# DELETE MEDICAL EXTRACTION
# ========================================

@app.delete("/medical-extractions/{extraction_id}")
def delete_medical_extraction(
    extraction_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("admin"))
):
    extraction = db.query(
        MedicalExtraction
    ).filter(
        MedicalExtraction.id == extraction_id
    ).first()

    if not extraction:
        raise HTTPException(
            status_code=404,
            detail="Medical extraction not found"
        )

    db.delete(extraction)
    db.commit()

    return {
        "status": "success",
        "message": "Medical extraction deleted successfully",
        "extraction_id": extraction_id
    }


# ========================================
# POST /documents/{id}/reprocess
# REPROCESS DOCUMENT
# ========================================

@app.post("/documents/{document_id}/reprocess")
def reprocess_document(
    document_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("admin", "doctor"))
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

    if not document.file_path or not os.path.exists(
        document.file_path
    ):
        raise HTTPException(
            status_code=404,
            detail="Uploaded file not found"
        )

    return process_document(
        document_id=document_id,
        db=db
    )



# ========================================
# ADMIN USER MANAGEMENT
# ========================================

@app.get("/auth/users")
def get_users(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("admin"))
):
    users = db.query(User).all()

    return [
        {
            "id": user.id,
            "username": user.username,
            "role": user.role
        }
        for user in users
    ]


@app.delete("/auth/users/{user_id}")
def delete_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("admin"))
):
    user = db.query(User).filter(
        User.id == user_id
    ).first()

    if not user:
        raise HTTPException(
            status_code=404,
            detail="User not found"
        )

    if user.id == current_user.id:
        raise HTTPException(
            status_code=400,
            detail="Admin cannot delete their own account"
        )

    db.delete(user)
    db.commit()

    return {
        "status": "success",
        "message": "User deleted successfully",
        "user_id": user_id
    }


# ========================================
# GET /health
# CHECK API AND DATABASE HEALTH
# ========================================

@app.get("/health")
def health_check(
    db: Session = Depends(get_db)
):
    try:
        db.execute(text("SELECT 1"))

        return {
            "status": "healthy",
            "api": "running",
            "database": "connected"
        }

    except Exception as e:
        return {
            "status": "unhealthy",
            "api": "running",
            "database": "disconnected",
            "error": str(e)
        }


# ========================================
# GET /statistics
# GET SYSTEM STATISTICS
# ========================================

@app.get("/statistics")
def get_statistics(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("admin"))
):
    total_documents = db.query(
        Document
    ).count()

    uploaded_documents = db.query(
        Document
    ).filter(
        Document.status == "uploaded"
    ).count()

    processing_documents = db.query(
        Document
    ).filter(
        Document.status == "processing"
    ).count()

    processed_documents = db.query(
        Document
    ).filter(
        Document.status == "processed"
    ).count()

    failed_documents = db.query(
        Document
    ).filter(
        Document.status == "failed"
    ).count()

    total_extractions = db.query(
        MedicalExtraction
    ).count()

    return {
        "status": "success",
        "documents": {
            "total": total_documents,
            "uploaded": uploaded_documents,
            "processing": processing_documents,
            "processed": processed_documents,
            "failed": failed_documents
        },
        "medical_extractions": total_extractions
    }

