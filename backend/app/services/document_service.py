import os
import uuid
import json
from datetime import datetime
from typing import Optional, Tuple
from fastapi import UploadFile, HTTPException
from sqlalchemy.orm import Session
from pypdf import PdfReader
from app.core.config import settings
from app.models.source_document import SourceDocument
from app.models.investigation import Investigation

class DocumentService:
    @staticmethod
    def _generate_source_id(prefix: str = "SRC") -> str:
        current_year = datetime.now().year
        random_suffix = uuid.uuid4().hex[:6].upper()
        return f"{prefix}-{current_year}-{random_suffix}"

    @classmethod
    def intake_text(
        cls,
        db: Session,
        text: str,
        investigation_id: Optional[int] = None,
        title_hint: Optional[str] = None
    ) -> SourceDocument:
        cleaned_text = text.strip()
        if len(cleaned_text) < 5:
            raise HTTPException(status_code=400, detail="Incident text must be at least 5 characters.")

        if investigation_id:
            inv = db.query(Investigation).filter(Investigation.id == investigation_id).first()
            if not inv:
                raise HTTPException(status_code=404, detail=f"Investigation with id {investigation_id} not found.")

        meta = {"title_hint": title_hint} if title_hint else {}
        doc = SourceDocument(
            source_id=cls._generate_source_id("SRC-TXT"),
            source_type="pasted_text",
            original_filename="pasted_incident_text.txt",
            extracted_text=cleaned_text,
            extraction_status="success",
            file_size_bytes=len(cleaned_text.encode("utf-8")),
            metadata_json=json.dumps(meta) if meta else None,
            investigation_id=investigation_id,
        )
        db.add(doc)
        db.commit()
        db.refresh(doc)
        return doc

    @classmethod
    def intake_email(
        cls,
        db: Session,
        subject: str,
        body: str,
        sender: Optional[str] = None,
        received_date: Optional[str] = None,
        investigation_id: Optional[int] = None
    ) -> SourceDocument:
        cleaned_body = body.strip()
        if len(cleaned_body) < 5:
            raise HTTPException(status_code=400, detail="Email body must be at least 5 characters.")

        if investigation_id:
            inv = db.query(Investigation).filter(Investigation.id == investigation_id).first()
            if not inv:
                raise HTTPException(status_code=404, detail=f"Investigation with id {investigation_id} not found.")

        metadata = {
            "subject": subject,
            "sender": sender or "Not provided",
            "received_date": received_date or "Not provided",
        }
        
        # Format unified extracted text preserving headers
        formatted_text = (
            f"Subject: {subject}\n"
            f"From: {sender or 'Not provided'}\n"
            f"Received: {received_date or 'Not provided'}\n"
            f"----------------------------------------\n"
            f"{cleaned_body}"
        )

        doc = SourceDocument(
            source_id=cls._generate_source_id("SRC-EML"),
            source_type="email",
            original_filename=f"email_{subject[:30].strip().replace(' ', '_')}.eml",
            extracted_text=formatted_text,
            extraction_status="success",
            file_size_bytes=len(formatted_text.encode("utf-8")),
            metadata_json=json.dumps(metadata),
            investigation_id=investigation_id,
        )
        db.add(doc)
        db.commit()
        db.refresh(doc)
        return doc

    @classmethod
    async def intake_pdf(
        cls,
        db: Session,
        file: UploadFile,
        investigation_id: Optional[int] = None
    ) -> SourceDocument:
        if not file.filename or not file.filename.lower().endswith(".pdf"):
            raise HTTPException(
                status_code=400,
                detail="Invalid file type. Only standard PDF (.pdf) documents are accepted."
            )

        if investigation_id:
            inv = db.query(Investigation).filter(Investigation.id == investigation_id).first()
            if not inv:
                raise HTTPException(status_code=404, detail=f"Investigation with id {investigation_id} not found.")

        # Read file into memory and check size
        contents = await file.read()
        file_size = len(contents)
        max_bytes = settings.MAX_UPLOAD_SIZE_MB * 1024 * 1024

        if file_size == 0:
            raise HTTPException(status_code=400, detail="Uploaded PDF is empty (0 bytes).")
        if file_size > max_bytes:
            raise HTTPException(
                status_code=400,
                detail=f"File size exceeds maximum allowed limit of {settings.MAX_UPLOAD_SIZE_MB}MB."
            )

        # Generate safe storage filename
        safe_ext = ".pdf"
        unique_name = f"{uuid.uuid4().hex}{safe_ext}"
        storage_rel_path = os.path.join(settings.UPLOAD_DIR, unique_name)

        # Save to disk
        try:
            with open(storage_rel_path, "wb") as f:
                f.write(contents)
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Failed to persist uploaded document: {str(e)}")

        # Extract text using local PyPDF
        extracted_text, status, warning, page_count = cls._extract_pdf_text(storage_rel_path)

        meta = {
            "page_count": page_count,
            "original_filename": file.filename,
            "mime_type": file.content_type,
        }

        doc = SourceDocument(
            source_id=cls._generate_source_id("SRC-PDF"),
            source_type="pdf",
            original_filename=file.filename,
            stored_filepath=storage_rel_path,
            file_size_bytes=file_size,
            extracted_text=extracted_text,
            extraction_status=status,
            extraction_warning=warning,
            metadata_json=json.dumps(meta),
            investigation_id=investigation_id,
        )
        db.add(doc)
        db.commit()
        db.refresh(doc)
        return doc

    @staticmethod
    def _extract_pdf_text(filepath: str) -> Tuple[str, str, Optional[str], int]:
        """Extract text locally with graceful handling of empty or scanned documents."""
        try:
            reader = PdfReader(filepath)
            num_pages = len(reader.pages)
            if num_pages == 0:
                return "", "failed", "PDF contains no pages.", 0

            full_text_list = []
            for i, page in enumerate(reader.pages):
                page_text = page.extract_text() or ""
                if page_text.strip():
                    full_text_list.append(f"--- Page {i + 1} ---\n{page_text.strip()}")

            extracted_text = "\n\n".join(full_text_list).strip()

            if not extracted_text or len(extracted_text) < 15:
                # Document has pages but no extractable text -> scanned or image-based
                warning = (
                    "The uploaded PDF appears to be a scanned document or image-only file. "
                    "No selectable text could be extracted with local text extraction. "
                    "You may paste the incident text manually."
                )
                return extracted_text, "partial", warning, num_pages

            return extracted_text, "success", None, num_pages
        except Exception as e:
            return "", "failed", f"PDF extraction failed: {str(e)}", 0
