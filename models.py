from sqlalchemy import Column, Integer, String, Text, DateTime, JSON, Boolean
from database import Base


class Document(Base):
    __tablename__ = "documents"

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    filename = Column(
        String,
        nullable=False
    )

    file_path = Column(
        String,
        nullable=False
    )

    document_type = Column(
        String,
        nullable=True
    )

    status = Column(
        String,
        default="uploaded"
    )

    created_at = Column(
        DateTime,
        nullable=True
    )


class MedicalExtraction(Base):
    __tablename__ = "medical_extractions"

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    document_id = Column(
        Integer,
        nullable=False
    )

    patient_id = Column(
        Integer,
        nullable=True
    )

    document_type = Column(
        String,
        nullable=True
    )

    raw_text = Column(
        Text,
        nullable=True
    )

    processed_data = Column(
        JSON,
        nullable=True
    )

    simplified_text = Column(
        JSON,
        nullable=True
    )

    translated_text = Column(
        JSON,
        nullable=True
    )

    language = Column(
        String,
        nullable=True
    )

    processed_at = Column(
        DateTime,
        nullable=True
    )

class Reminder(Base):
    __tablename__ = "reminders"

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    user_id = Column(
        Integer,
        nullable=False,
        index=True
    )

    document_id = Column(
        Integer,
        nullable=True,
        index=True
    )

    medicine_name = Column(
        String,
        nullable=False
    )

    dosage = Column(
        String,
        nullable=True
    )

    frequency = Column(
        String,
        nullable=True
    )

    # List of "HH:MM" strings, e.g. ["08:00", "14:00", "20:00"]
    times = Column(
        JSON,
        nullable=True,
        default=list
    )

    start_date = Column(
        String,
        nullable=True
    )

    end_date = Column(
        String,
        nullable=True
    )

    notes = Column(
        String,
        nullable=True
    )

    is_active = Column(
        Boolean,
        default=True,
        nullable=False
    )

    created_at = Column(
        DateTime,
        nullable=True
    )
