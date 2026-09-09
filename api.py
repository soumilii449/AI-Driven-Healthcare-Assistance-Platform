from fastapi import FastAPI, HTTPException, UploadFile, File, Depends, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from sqlalchemy import desc, Column, Integer, String
from pydantic import BaseModel
from datetime import datetime, timedelta
import os
import shutil
import hashlib
import secrets

from jose import JWTError, jwt

from database import engine, Base, get_db
from models import Document, MedicalExtraction

from ocr import extract_text
from medical_extractor import extract_medical_information
from standardizer import standardize_record
from simplifier import simplify_record
from translator import translate_to_hindi
from treatment import generate_treatment


# ============================================================
# APP
# ============================================================

app = FastAPI(
    title="AI Healthcare Assistance Platform",
    description="AI-powered healthcare assistance platform for rural communities",
    version="1.0.0"
)


# ============================================================
# CORS
# ============================================================

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ============================================================
# DATABASE
# ============================================================

Base.metadata.create_all(bind=engine)


# ============================================================
# JWT CONFIGURATION
# ============================================================

SECRET_KEY = "CHANGE_THIS_TO_A_LONG_RANDOM_SECRET_KEY_123456789"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60

oauth2_scheme = OAuth2PasswordBearer(
    tokenUrl="/auth/login"
)


# ============================================================
# UPLOAD DIRECTORY
# ============================================================

UPLOAD_DIR = "uploads"

os.makedirs(
    UPLOAD_DIR,
    exist_ok=True
)


# ============================================================
# USER MODEL
# ============================================================

class User(Base):
    __tablename__ = "users"

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    username = Column(
        String,
        unique=True,
        nullable=False,
        index=True
    )

    password_hash = Column(
        String,
        nullable=False
    )

    role = Column(
        String,
        nullable=False,
        default="patient"
    )


# ============================================================
# PATIENT MODEL
# ============================================================

class Patient(Base):
    __tablename__ = "patients"

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    name = Column(
        String,
        nullable=False
    )

    date_of_birth = Column(
        String,
        nullable=True
    )

    gender = Column(
        String,
        nullable=True
    )

    contact_information = Column(
        String,
        nullable=True
    )


Base.metadata.create_all(bind=engine)


# ============================================================
# PYDANTIC MODELS
# ============================================================

class UserCreate(BaseModel):
    username: str
    password: str
    role: str = "patient"


class PatientCreate(BaseModel):
    name: str
    date_of_birth: str = ""
    gender: str = ""
    contact_information: str = ""


# ============================================================
# PASSWORD FUNCTIONS
# ============================================================

def hash_password(password: str) -> str:

    salt = secrets.token_hex(16)

    password_hash = hashlib.pbkdf2_hmac(
        "sha256",
        password.encode("utf-8"),
        salt.encode("utf-8"),
        100000
    )

    return salt + ":" + password_hash.hex()


def verify_password(
    password: str,
    stored_password: str
) -> bool:

    try:

        salt, stored_hash = stored_password.split(":")

        password_hash = hashlib.pbkdf2_hmac(
            "sha256",
            password.encode("utf-8"),
            salt.encode("utf-8"),
            100000
        )

        return secrets.compare_digest(
            password_hash.hex(),
            stored_hash
        )

    except Exception:

        return False


# ============================================================
# JWT FUNCTIONS
# ============================================================

def create_access_token(
    data: dict,
    expires_delta: timedelta | None = None
):

    to_encode = data.copy()

    if expires_delta:

        expire = datetime.utcnow() + expires_delta

    else:

        expire = datetime.utcnow() + timedelta(
            minutes=15
        )

    to_encode.update(
        {
            "exp": expire
        }
    )

    return jwt.encode(
        to_encode,
        SECRET_KEY,
        algorithm=ALGORITHM
    )


# ============================================================
# CURRENT USER
# ============================================================

def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
):

    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={
            "WWW-Authenticate": "Bearer"
        }
    )

    try:

        payload = jwt.decode(
            token,
            SECRET_KEY,
            algorithms=[ALGORITHM]
        )

        username = payload.get(
            "sub"
        )

        if username is None:

            raise credentials_exception

    except JWTError:

        raise credentials_exception

    user = (
        db.query(User)
        .filter(
            User.username == username
        )
        .first()
    )

    if user is None:

        raise credentials_exception

    return user


# ============================================================
# ROLE AUTHORIZATION
# ============================================================

def require_roles(
    *allowed_roles
):

    def role_checker(
        current_user: User = Depends(
            get_current_user
        )
    ):

        if current_user.role not in allowed_roles:

            raise HTTPException(
                status_code=403,
                detail="You do not have permission to access this resource."
            )

        return current_user

    return role_checker


# ============================================================
# ROOT
# ============================================================

@app.get("/")
def root():

    return {
        "message": "AI Healthcare Assistance Platform API",
        "status": "running"
    }


# ============================================================
# HEALTH
# ============================================================

@app.get("/health")
def health():

    return {
        "status": "healthy",
        "service": "AI Healthcare Assistance Platform"
    }


# ============================================================
# REGISTER
# ============================================================

@app.post("/auth/register")
def register(
    user_data: UserCreate,
    db: Session = Depends(get_db)
):

    username = user_data.username.strip()

    if not username:

        raise HTTPException(
            status_code=400,
            detail="Username cannot be empty"
        )

    if len(user_data.password) < 4:

        raise HTTPException(
            status_code=400,
            detail="Password must contain at least 4 characters"
        )

    role = user_data.role.lower().strip()

    if role not in [
        "admin",
        "doctor",
        "patient"
    ]:

        raise HTTPException(
            status_code=400,
            detail="Role must be admin, doctor, or patient"
        )

    existing_user = (
        db.query(User)
        .filter(
            User.username == username
        )
        .first()
    )

    if existing_user:

        raise HTTPException(
            status_code=400,
            detail="Username already exists"
        )

    new_user = User(
        username=username,
        password_hash=hash_password(
            user_data.password
        ),
        role=role
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    return {
        "message": "User registered successfully",
        "user": {
            "id": new_user.id,
            "username": new_user.username,
            "role": new_user.role
        }
    }


# ============================================================
# LOGIN
# ============================================================

@app.post("/auth/login")
def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db)
):

    user = (
        db.query(User)
        .filter(
            User.username == form_data.username
        )
        .first()
    )

    if user is None:

        raise HTTPException(
            status_code=401,
            detail="Incorrect username or password"
        )

    if not verify_password(
        form_data.password,
        user.password_hash
    ):

        raise HTTPException(
            status_code=401,
            detail="Incorrect username or password"
        )

    access_token_expires = timedelta(
        minutes=ACCESS_TOKEN_EXPIRE_MINUTES
    )

    access_token = create_access_token(
        data={
            "sub": user.username,
            "role": user.role
        },
        expires_delta=access_token_expires
    )

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "username": user.username,
            "role": user.role
        }
    }


# ============================================================
# CURRENT USER
# ============================================================

@app.get("/auth/me")
def get_me(
    current_user: User = Depends(
        get_current_user
    )
):

    return {
        "id": current_user.id,
        "username": current_user.username,
        "role": current_user.role
    }


# ============================================================
# GET USERS - ADMIN
# ============================================================

@app.get("/auth/users")
def get_users(
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_roles("admin")
    )
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


# ============================================================
# DELETE USER - ADMIN
# ============================================================

@app.delete("/auth/users/{user_id}")
def delete_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_roles("admin")
    )
):

    user = (
        db.query(User)
        .filter(
            User.id == user_id
        )
        .first()
    )

    if user is None:

        raise HTTPException(
            status_code=404,
            detail="User not found"
        )

    db.delete(user)
    db.commit()

    return {
        "message": "User deleted successfully"
    }


# ============================================================
# CREATE PATIENT
# ============================================================

@app.post("/patients")
def create_patient(
    patient_data: PatientCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_roles(
            "admin",
            "doctor"
        )
    )
):

    patient = Patient(
        name=patient_data.name,
        date_of_birth=patient_data.date_of_birth,
        gender=patient_data.gender,
        contact_information=patient_data.contact_information
    )

    db.add(patient)
    db.commit()
    db.refresh(patient)

    return {
        "message": "Patient created successfully",
        "patient": {
            "id": patient.id,
            "name": patient.name,
            "date_of_birth": patient.date_of_birth,
            "gender": patient.gender,
            "contact_information": patient.contact_information
        }
    }


# ============================================================
# GET PATIENTS
# ============================================================

@app.get("/patients")
def get_patients(
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_roles(
            "admin",
            "doctor"
        )
    )
):

    patients = db.query(Patient).all()

    return [
        {
            "id": patient.id,
            "name": patient.name,
            "date_of_birth": patient.date_of_birth,
            "gender": patient.gender,
            "contact_information": patient.contact_information
        }
        for patient in patients
    ]


# ============================================================
# GET PATIENT
# ============================================================

@app.get("/patients/{patient_id}")
def get_patient(
    patient_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        get_current_user
    )
):

    patient = (
        db.query(Patient)
        .filter(
            Patient.id == patient_id
        )
        .first()
    )

    if patient is None:

        raise HTTPException(
            status_code=404,
            detail="Patient not found"
        )

    return {
        "id": patient.id,
        "name": patient.name,
        "date_of_birth": patient.date_of_birth,
        "gender": patient.gender,
        "contact_information": patient.contact_information
    }


# ============================================================
# UPLOAD DOCUMENT
# ============================================================

@app.post("/documents")
async def create_document(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_roles(
            "admin",
            "doctor",
            "patient"
        )
    )
):

    if not file.filename:

        raise HTTPException(
            status_code=400,
            detail="No file selected"
        )

    allowed_extensions = [
        ".jpg",
        ".jpeg",
        ".png",
        ".pdf"
    ]

    extension = os.path.splitext(
        file.filename
    )[1].lower()

    if extension not in allowed_extensions:

        raise HTTPException(
            status_code=400,
            detail="Only JPG, JPEG, PNG and PDF files are allowed"
        )

    safe_filename = os.path.basename(
        file.filename
    )

    file_path = os.path.join(
        UPLOAD_DIR,
        safe_filename
    )

    with open(
        file_path,
        "wb"
    ) as buffer:

        shutil.copyfileobj(
            file.file,
            buffer
        )

    document = Document(
        filename=safe_filename,
        file_path=file_path,
        document_type="prescription",
        status="uploaded",
        created_at=datetime.utcnow()
    )

    db.add(document)
    db.commit()
    db.refresh(document)

    return {
        "message": "Document uploaded successfully",
        "document": {
            "id": document.id,
            "filename": document.filename,
            "status": document.status
        }
    }


# ============================================================
# GET DOCUMENTS
# ============================================================

@app.get("/documents")
def get_documents(
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_roles(
            "admin",
            "doctor",
            "patient"
        )
    )
):

    documents = (
        db.query(Document)
        .order_by(
            desc(Document.id)
        )
        .all()
    )

    return [
        {
            "id": document.id,
            "filename": document.filename,
            "file_path": document.file_path,
            "document_type": document.document_type,
            "status": document.status,
            "created_at": document.created_at
        }
        for document in documents
    ]


# ============================================================
# GET SINGLE DOCUMENT
# ============================================================

@app.get("/documents/{document_id}")
def get_document(
    document_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        get_current_user
    )
):

    document = (
        db.query(Document)
        .filter(
            Document.id == document_id
        )
        .first()
    )

    if document is None:

        raise HTTPException(
            status_code=404,
            detail="Document not found"
        )

    return {
        "id": document.id,
        "filename": document.filename,
        "file_path": document.file_path,
        "document_type": document.document_type,
        "status": document.status,
        "created_at": document.created_at
    }


# ============================================================
# DELETE DOCUMENT
# ============================================================

@app.delete("/documents/{document_id}")
def delete_document(
    document_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_roles("admin")
    )
):

    document = (
        db.query(Document)
        .filter(
            Document.id == document_id
        )
        .first()
    )

    if document is None:

        raise HTTPException(
            status_code=404,
            detail="Document not found"
        )

    extractions = (
        db.query(MedicalExtraction)
        .filter(
            MedicalExtraction.document_id
            == document_id
        )
        .all()
    )

    for extraction in extractions:

        db.delete(extraction)

    if os.path.exists(
        document.file_path
    ):

        os.remove(
            document.file_path
        )

    db.delete(document)
    db.commit()

    return {
        "message": "Document deleted successfully"
    }


# ============================================================
# PROCESS DOCUMENT
# ============================================================

@app.post("/documents/{document_id}/process")
def process_document(
    document_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_roles(
            "admin",
            "doctor",
            "patient"
        )
    )
):

    document = (
        db.query(Document)
        .filter(
            Document.id == document_id
        )
        .first()
    )

    if document is None:

        raise HTTPException(
            status_code=404,
            detail="Document not found"
        )

    if not os.path.exists(
        document.file_path
    ):

        raise HTTPException(
            status_code=404,
            detail="Uploaded file not found"
        )

    try:

        document.status = "processing"

        db.commit()

        # ------------------------------------
        # OCR
        # ------------------------------------

        ocr_text = extract_text(
            document.file_path
        )

        # ------------------------------------
        # MEDICAL EXTRACTION
        # ------------------------------------

        medical_information = (
            extract_medical_information(
                ocr_text
            )
        )

        # ------------------------------------
        # STANDARDIZATION
        # ------------------------------------

        standardized_record = (
            standardize_record(
                medical_information
            )
        )

        # ------------------------------------
        # SIMPLIFICATION
        # ------------------------------------

        simplified_record = (
            simplify_record(
                standardized_record
            )
        )

        # ------------------------------------
        # HINDI TRANSLATION
        # ------------------------------------

        hindi_record = (
            translate_to_hindi(
                simplified_record
            )
        )

        # ------------------------------------
        # TREATMENT ENGLISH
        # ------------------------------------

        treatment_english = (
            generate_treatment(
                standardized_record
            )
        )

        # ------------------------------------
        # TREATMENT HINDI
        # ------------------------------------

        treatment_hindi = (
            translate_to_hindi(
                treatment_english
            )
        )

        # ------------------------------------
        # SAVE EXTRACTION
        # ------------------------------------

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

        db.add(extraction)

        document.status = "processed"

        db.commit()

        db.refresh(extraction)

        return {
            "status": "success",
            "document_id": document.id,
            "filename": document.filename,
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
                treatment_hindi,
            "extraction_id":
                extraction.id
        }

    except Exception as e:

        document.status = "failed"

        db.commit()

        raise HTTPException(
            status_code=500,
            detail=f"Processing failed: {str(e)}"
        )


# ============================================================
# DOCUMENT STATUS
# ============================================================

@app.get("/documents/{document_id}/status")
def document_status(
    document_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        get_current_user
    )
):

    document = (
        db.query(Document)
        .filter(
            Document.id == document_id
        )
        .first()
    )

    if document is None:

        raise HTTPException(
            status_code=404,
            detail="Document not found"
        )

    return {
        "document_id": document.id,
        "status": document.status
    }


# ============================================================
# DOCUMENT RESULT
# ============================================================

@app.get("/documents/{document_id}/result")
def document_result(
    document_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        get_current_user
    )
):

    extraction = (
        db.query(MedicalExtraction)
        .filter(
            MedicalExtraction.document_id
            == document_id
        )
        .order_by(
            desc(MedicalExtraction.id)
        )
        .first()
    )

    if extraction is None:

        raise HTTPException(
            status_code=404,
            detail="No processed result found"
        )

    return {
        "document_id":
            extraction.document_id,

        "extraction_id":
            extraction.id,

        "raw_text":
            extraction.raw_text,

        "processed_data":
            extraction.processed_data,

        "simplified_text":
            extraction.simplified_text,

        "translated_text":
            extraction.translated_text,

        "language":
            extraction.language,

        "processed_at":
            extraction.processed_at
    }


# ============================================================
# OCR
# ============================================================

@app.get("/documents/{document_id}/ocr")
def document_ocr(
    document_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        get_current_user
    )
):

    extraction = (
        db.query(MedicalExtraction)
        .filter(
            MedicalExtraction.document_id
            == document_id
        )
        .order_by(
            desc(MedicalExtraction.id)
        )
        .first()
    )

    if extraction is None:

        raise HTTPException(
            status_code=404,
            detail="OCR result not found"
        )

    return {
        "document_id":
            document_id,

        "ocr_text":
            extraction.raw_text
    }


# ============================================================
# MEDICATIONS
# ============================================================

@app.get("/documents/{document_id}/medications")
def document_medications(
    document_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        get_current_user
    )
):

    extraction = (
        db.query(MedicalExtraction)
        .filter(
            MedicalExtraction.document_id
            == document_id
        )
        .order_by(
            desc(MedicalExtraction.id)
        )
        .first()
    )

    if extraction is None:

        raise HTTPException(
            status_code=404,
            detail="Medical extraction not found"
        )

    processed_data = (
        extraction.processed_data
        or {}
    )

    medical_information = (
        processed_data.get(
            "medical_information",
            {}
        )
    )

    medications = (
        medical_information.get(
            "medications",
            []
        )
    )

    return {
        "document_id":
            document_id,

        "medications":
            medications
    }


# ============================================================
# TREATMENT
# ============================================================

@app.get("/documents/{document_id}/treatment")
def document_treatment(
    document_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        get_current_user
    )
):

    extraction = (
        db.query(MedicalExtraction)
        .filter(
            MedicalExtraction.document_id
            == document_id
        )
        .order_by(
            desc(MedicalExtraction.id)
        )
        .first()
    )

    if extraction is None:

        raise HTTPException(
            status_code=404,
            detail="Treatment information not found"
        )

    processed_data = (
        extraction.processed_data
        or {}
    )

    translated_data = (
        extraction.translated_text
        or {}
    )

    return {
        "document_id":
            document_id,

        "treatment_english":
            processed_data.get(
                "treatment_english",
                ""
            ),

        "treatment_hindi":
            translated_data.get(
                "treatment_hindi",
                ""
            )
    }


# ============================================================
# TRANSLATION
# ============================================================

@app.get("/documents/{document_id}/translation")
def document_translation(
    document_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        get_current_user
    )
):

    extraction = (
        db.query(MedicalExtraction)
        .filter(
            MedicalExtraction.document_id
            == document_id
        )
        .order_by(
            desc(MedicalExtraction.id)
        )
        .first()
    )

    if extraction is None:

        raise HTTPException(
            status_code=404,
            detail="Translation not found"
        )

    translated_data = (
        extraction.translated_text
        or {}
    )

    return {
        "document_id":
            document_id,

        "language":
            extraction.language,

        "hindi_information":
            translated_data.get(
                "hindi_information",
                {}
            ),

        "treatment_hindi":
            translated_data.get(
                "treatment_hindi",
                ""
            )
    }


# ============================================================
# MEDICAL EXTRACTIONS
# ============================================================

@app.get("/medical-extractions")
def get_medical_extractions(
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_roles(
            "admin",
            "doctor",
            "patient"
        )
    )
):

    extractions = (
        db.query(MedicalExtraction)
        .order_by(
            desc(MedicalExtraction.id)
        )
        .all()
    )

    return [
        {
            "id": extraction.id,
            "document_id":
                extraction.document_id,
            "patient_id":
                extraction.patient_id,
            "document_type":
                extraction.document_type,
            "raw_text":
                extraction.raw_text,
            "processed_data":
                extraction.processed_data,
            "simplified_text":
                extraction.simplified_text,
            "translated_text":
                extraction.translated_text,
            "language":
                extraction.language,
            "processed_at":
                extraction.processed_at
        }
        for extraction in extractions
    ]


# ============================================================
# SINGLE MEDICAL EXTRACTION
# ============================================================

@app.get("/medical-extractions/{extraction_id}")
def get_medical_extraction(
    extraction_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        get_current_user
    )
):

    extraction = (
        db.query(MedicalExtraction)
        .filter(
            MedicalExtraction.id
            == extraction_id
        )
        .first()
    )

    if extraction is None:

        raise HTTPException(
            status_code=404,
            detail="Medical extraction not found"
        )

    return {
        "id": extraction.id,
        "document_id":
            extraction.document_id,
        "patient_id":
            extraction.patient_id,
        "document_type":
            extraction.document_type,
        "raw_text":
            extraction.raw_text,
        "processed_data":
            extraction.processed_data,
        "simplified_text":
            extraction.simplified_text,
        "translated_text":
            extraction.translated_text,
        "language":
            extraction.language,
        "processed_at":
            extraction.processed_at
    }


# ============================================================
# DELETE MEDICAL EXTRACTION
# ============================================================

@app.delete("/medical-extractions/{extraction_id}")
def delete_medical_extraction(
    extraction_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_roles("admin")
    )
):

    extraction = (
        db.query(MedicalExtraction)
        .filter(
            MedicalExtraction.id
            == extraction_id
        )
        .first()
    )

    if extraction is None:

        raise HTTPException(
            status_code=404,
            detail="Medical extraction not found"
        )

    db.delete(extraction)
    db.commit()

    return {
        "message":
            "Medical extraction deleted successfully"
    }


# ============================================================
# REPROCESS DOCUMENT
# ============================================================

@app.post("/documents/{document_id}/reprocess")
def reprocess_document(
    document_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_roles(
            "admin",
            "doctor",
            "patient"
        )
    )
):

    document = (
        db.query(Document)
        .filter(
            Document.id == document_id
        )
        .first()
    )

    if document is None:

        raise HTTPException(
            status_code=404,
            detail="Document not found"
        )

    old_extractions = (
        db.query(MedicalExtraction)
        .filter(
            MedicalExtraction.document_id
            == document_id
        )
        .all()
    )

    for extraction in old_extractions:

        db.delete(extraction)

    db.commit()

    return process_document(
        document_id=document_id,
        db=db,
        current_user=current_user
    )


# ============================================================
# SEARCH DOCUMENTS
# ============================================================

@app.get("/documents/search")
def search_documents(
    query: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_roles(
            "admin",
            "doctor",
            "patient"
        )
    )
):

    documents = (
        db.query(Document)
        .filter(
            Document.filename.contains(query)
        )
        .order_by(
            desc(Document.id)
        )
        .all()
    )

    return [
        {
            "id": document.id,
            "filename": document.filename,
            "document_type":
                document.document_type,
            "status": document.status,
            "created_at":
                document.created_at
        }
        for document in documents
    ]


# ============================================================
# STATISTICS
# ============================================================

@app.get("/statistics")
def statistics(
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_roles("admin")
    )
):

    total_documents = (
        db.query(Document).count()
    )

    processed_documents = (
        db.query(Document)
        .filter(
            Document.status == "processed"
        )
        .count()
    )

    pending_documents = (
        db.query(Document)
        .filter(
            Document.status == "uploaded"
        )
        .count()
    )

    failed_documents = (
        db.query(Document)
        .filter(
            Document.status == "failed"
        )
        .count()
    )

    total_users = (
        db.query(User).count()
    )

    total_patients = (
        db.query(Patient).count()
    )

    total_extractions = (
        db.query(MedicalExtraction).count()
    )

    return {
        "total_documents":
            total_documents,

        "processed_documents":
            processed_documents,

        "pending_documents":
            pending_documents,

        "failed_documents":
            failed_documents,

        "total_users":
            total_users,

        "total_patients":
            total_patients,

        "total_medical_extractions":
            total_extractions
    }