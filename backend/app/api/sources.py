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

from app.models.investigation import Investigation
from app.services.audit_service import AuditLogService

@router.get("/{source_id_or_pk}", response_model=SourceDocumentResponse)
def get_source_document(
    source_id_or_pk: str,
    investigation_id: Optional[int] = None,
    db: Session = Depends(get_db)
):
    """Retrieve details and extracted text of a source document with optional investigation boundary check."""
    if source_id_or_pk.isdigit():
        doc = db.query(SourceDocument).filter(SourceDocument.id == int(source_id_or_pk)).first()
    else:
        doc = db.query(SourceDocument).filter(SourceDocument.source_id == source_id_or_pk).first()

    if not doc:
        raise HTTPException(
            status_code=404,
            detail=f"Source document '{source_id_or_pk}' not found."
        )

    if investigation_id is not None and doc.investigation_id is not None and doc.investigation_id != investigation_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Source document does not belong to the requested investigation."
        )
    return doc

@router.patch("/{source_id_or_pk}/attach", response_model=SourceDocumentResponse)
def attach_source_to_investigation(
    source_id_or_pk: str,
    investigation_id: int,
    db: Session = Depends(get_db)
):
    """Associate an existing unassigned source document with an investigation."""
    if source_id_or_pk.isdigit():
        doc = db.query(SourceDocument).filter(SourceDocument.id == int(source_id_or_pk)).first()
    else:
        doc = db.query(SourceDocument).filter(SourceDocument.source_id == source_id_or_pk).first()

    if not doc:
        raise HTTPException(status_code=404, detail="Source document not found.")

    # Cross-investigation isolation: prevent hijacking sources belonging to another investigation
    if doc.investigation_id is not None and doc.investigation_id != investigation_id:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Source document '{source_id_or_pk}' is already assigned to investigation ID {doc.investigation_id}. Cross-investigation source hijacking is forbidden."
        )

    # Verify target investigation exists
    inv = db.query(Investigation).filter(Investigation.id == investigation_id).first()
    if not inv:
        raise HTTPException(status_code=404, detail=f"Target investigation ID {investigation_id} not found.")

    doc.investigation_id = investigation_id
    AuditLogService.log_event(
        db=db,
        investigation_id=investigation_id,
        event_type="source_attached",
        actor="QA Lead Investigator",
        entity_type="source_document",
        entity_id=doc.source_id,
        action_summary=f"Source document '{doc.source_id}' attached to investigation",
        details={"source_type": doc.source_type, "filename": doc.original_filename},
        commit=False,
    )
    db.commit()
    db.refresh(doc)
    return doc

@router.patch("/{source_id_or_pk}/detach", response_model=SourceDocumentResponse)
def detach_source_from_investigation(
    source_id_or_pk: str,
    investigation_id: int,
    db: Session = Depends(get_db)
):
    """Disassociate a source document from an investigation with audit logging."""
    if source_id_or_pk.isdigit():
        doc = db.query(SourceDocument).filter(SourceDocument.id == int(source_id_or_pk)).first()
    else:
        doc = db.query(SourceDocument).filter(SourceDocument.source_id == source_id_or_pk).first()

    if not doc:
        raise HTTPException(status_code=404, detail="Source document not found.")

    if doc.investigation_id != investigation_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Source document is not associated with investigation ID {investigation_id}."
        )

    doc.investigation_id = None
    AuditLogService.log_event(
        db=db,
        investigation_id=investigation_id,
        event_type="source_detached",
        actor="QA Lead Investigator",
        entity_type="source_document",
        entity_id=doc.source_id,
        action_summary=f"Source document '{doc.source_id}' detached from investigation",
        details={"source_type": doc.source_type, "filename": doc.original_filename},
        commit=False,
    )
    db.commit()
    db.refresh(doc)
    return doc
