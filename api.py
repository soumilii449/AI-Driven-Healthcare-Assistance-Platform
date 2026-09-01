from fastapi import FastAPI, HTTPException
from pydantic import BaseModel

from pipeline import process_record


# ---------------------------------------
# Create FastAPI application
# ---------------------------------------

app = FastAPI(
    title="AI Healthcare Assistance API",
    description="AI-powered healthcare assistance for rural communities",
    version="1.0.0"
)


# ---------------------------------------
# Request model
# ---------------------------------------

class MedicalRecord(BaseModel):

    symptoms: list[str] = []
    diagnoses: list[str] = []
    medications: list = []
    procedures: list[str] = []
    investigations: dict = {}
    anatomy: list[str] = []
    biomarkers: list[str] = []
    physicians: list[str] = []


# ---------------------------------------
# Home
# ---------------------------------------

@app.get("/")
def home():

    return {
        "message": "AI Healthcare Assistance API is running",
        "status": "success"
    }


# ---------------------------------------
# Complete AI Pipeline
# ---------------------------------------

@app.post("/process")
def process_medical_record(
    record: MedicalRecord
):

    data = record.model_dump()

    # Check empty input
    if not any(data.values()):

        raise HTTPException(
            status_code=400,
            detail="Please provide at least one medical record field."
        )

    try:

        result = process_record(data)

        return {
            "status": "success",
            "result": result
        }

    except Exception as e:

        raise HTTPException(
            status_code=500,
            detail=str(e)
        )