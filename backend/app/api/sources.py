from typing import Optional
from fastapi import APIRouter, Depends, UploadFile, File, Form, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.source_document import SourceDocument
from app.schemas.source_document import (
    TextIntakeRequest,
    EmailIntakeRequest,
    SourceDocumentResponse,
)
from app.services.document_service import DocumentService

router = APIRouter(prefix="/sources", tags=["Source Intake"])

@router.post("/text", response_model=SourceDocumentResponse, status_code=status.HTTP_201_CREATED)
def intake_pasted_text(
    payload: TextIntakeRequest,
    db: Session = Depends(get_db)
):
    """Intake and persist pasted incident report or investigation text."""
    return DocumentService.intake_text(
        db=db,
        text=payload.text,
        investigation_id=payload.investigation_id,
        title_hint=payload.title_hint
    )

@router.post("/email", response_model=SourceDocumentResponse, status_code=status.HTTP_201_CREATED)
def intake_email_content(
    payload: EmailIntakeRequest,
    db: Session = Depends(get_db)
):
    """Intake and persist pasted email content preserving header metadata."""
    return DocumentService.intake_email(
        db=db,
        subject=payload.subject,
        body=payload.body,
        sender=payload.sender,
        received_date=payload.received_date,
        investigation_id=payload.investigation_id
    )

@router.post("/pdf", response_model=SourceDocumentResponse, status_code=status.HTTP_201_CREATED)
async def intake_pdf_document(
    file: UploadFile = File(...),
    investigation_id: Optional[int] = Form(None),
    db: Session = Depends(get_db)
):
    """Upload a PDF file and extract text locally with PyPDF."""
    return await DocumentService.intake_pdf(
        db=db,
        file=file,
        investigation_id=investigation_id
    )

@router.get("/{source_id_or_pk}", response_model=SourceDocumentResponse)
def get_source_document(
    source_id_or_pk: str,
    db: Session = Depends(get_db)
):
    """Retrieve details and extracted text of a source document."""
    if source_id_or_pk.isdigit():
        doc = db.query(SourceDocument).filter(SourceDocument.id == int(source_id_or_pk)).first()
    else:
        doc = db.query(SourceDocument).filter(SourceDocument.source_id == source_id_or_pk).first()

    if not doc:
        raise HTTPException(
            status_code=404,
            detail=f"Source document '{source_id_or_pk}' not found."
        )
    return doc

@router.patch("/{source_id_or_pk}/attach", response_model=SourceDocumentResponse)
def attach_source_to_investigation(
    source_id_or_pk: str,
    investigation_id: int,
    db: Session = Depends(get_db)
):
    """Associate an existing source document with an investigation."""
    if source_id_or_pk.isdigit():
        doc = db.query(SourceDocument).filter(SourceDocument.id == int(source_id_or_pk)).first()
    else:
        doc = db.query(SourceDocument).filter(SourceDocument.source_id == source_id_or_pk).first()

    if not doc:
        raise HTTPException(status_code=404, detail="Source document not found.")

    doc.investigation_id = investigation_id
    db.commit()
    db.refresh(doc)
    return doc
