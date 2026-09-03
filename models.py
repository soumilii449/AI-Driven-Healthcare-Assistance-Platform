from sqlalchemy import Column, Integer, String, Text, DateTime, JSON
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