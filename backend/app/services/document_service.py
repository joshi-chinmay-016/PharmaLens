import os
import io
import uuid
import json
import csv
import zipfile
import re
import xml.etree.ElementTree as ET
from datetime import datetime
from typing import Optional, Tuple, Dict, Any
from fastapi import UploadFile, HTTPException
from sqlalchemy.orm import Session
from pypdf import PdfReader
from app.core.config import settings
from app.models.source_document import SourceDocument
from app.models.investigation import Investigation

# Supported structured and document file extensions mapping to (source_type, id_prefix)
SUPPORTED_EXTENSIONS: Dict[str, Tuple[str, str]] = {
    ".pdf": ("pdf", "SRC-PDF"),
    ".txt": ("text", "SRC-TXT"),
    ".text": ("text", "SRC-TXT"),
    ".log": ("text", "SRC-TXT"),
    ".md": ("text", "SRC-TXT"),
    ".markdown": ("text", "SRC-TXT"),
    ".rtf": ("text", "SRC-TXT"),
    ".eml": ("email", "SRC-EML"),
    ".msg": ("email", "SRC-EML"),
    ".csv": ("csv", "SRC-CSV"),
    ".tsv": ("csv", "SRC-CSV"),
    ".json": ("json", "SRC-JSON"),
    ".docx": ("docx", "SRC-DOC"),
    ".xml": ("xml", "SRC-DAT"),
    ".html": ("html", "SRC-DAT"),
    ".htm": ("html", "SRC-DAT"),
}

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
        db.flush()

        if investigation_id:
            from app.services.audit_service import AuditLogService
            AuditLogService.log_event(
                db=db,
                investigation_id=investigation_id,
                event_type="source_attached",
                actor="QA Lead Investigator",
                entity_type="source_document",
                entity_id=doc.source_id,
                action_summary=f"Pasted text source attached ({doc.source_id})",
                details={"source_type": doc.source_type, "source_id": doc.source_id},
                commit=False,
            )

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
        db.flush()

        if investigation_id:
            from app.services.audit_service import AuditLogService
            AuditLogService.log_event(
                db=db,
                investigation_id=investigation_id,
                event_type="source_attached",
                actor="QA Lead Investigator",
                entity_type="source_document",
                entity_id=doc.source_id,
                action_summary=f"Incident email source attached ({doc.source_id}): '{subject[:40]}'",
                details={"source_type": doc.source_type, "source_id": doc.source_id, "subject": subject},
                commit=False,
            )

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
        """PDF-specific intake endpoint with backwards compatibility."""
        if not file.filename or not file.filename.lower().endswith(".pdf"):
            raise HTTPException(
                status_code=400,
                detail="Invalid file type. Only standard PDF (.pdf) documents are accepted."
            )
        return await cls.intake_file(db=db, file=file, investigation_id=investigation_id)

    @classmethod
    async def intake_file(
        cls,
        db: Session,
        file: UploadFile,
        investigation_id: Optional[int] = None
    ) -> SourceDocument:
        """Universal multi-format structured file intake (PDF, TXT, CSV, JSON, DOCX, EML, etc.)."""
        if not file.filename:
            raise HTTPException(status_code=400, detail="Uploaded file missing filename.")

        # Determine file extension and validation
        ext = os.path.splitext(file.filename)[1].lower()
        if ext not in SUPPORTED_EXTENSIONS:
            supported_list = ", ".join(sorted(set(SUPPORTED_EXTENSIONS.keys())))
            raise HTTPException(
                status_code=400,
                detail=f"Invalid file type '{ext}'. Supported structured formats include: {supported_list}."
            )

        source_type, prefix = SUPPORTED_EXTENSIONS[ext]

        if investigation_id:
            inv = db.query(Investigation).filter(Investigation.id == investigation_id).first()
            if not inv:
                raise HTTPException(status_code=404, detail=f"Investigation with id {investigation_id} not found.")

        # Read file into memory and check size
        contents = await file.read()
        file_size = len(contents)
        max_bytes = settings.MAX_UPLOAD_SIZE_MB * 1024 * 1024

        if file_size == 0:
            raise HTTPException(status_code=400, detail="Uploaded file is empty (0 bytes).")
        if file_size > max_bytes:
            raise HTTPException(
                status_code=400,
                detail=f"File size exceeds maximum allowed limit of {settings.MAX_UPLOAD_SIZE_MB}MB."
            )

        # Generate safe storage filename and persist
        unique_name = f"{uuid.uuid4().hex}{ext}"
        storage_rel_path = os.path.join(settings.UPLOAD_DIR, unique_name)
        os.makedirs(settings.UPLOAD_DIR, exist_ok=True)

        try:
            with open(storage_rel_path, "wb") as f:
                f.write(contents)
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Failed to persist uploaded document: {str(e)}")

        # Extract structured content based on extension
        extracted_text = ""
        status = "success"
        warning = None
        meta: Dict[str, Any] = {
            "original_filename": file.filename,
            "mime_type": file.content_type,
            "file_extension": ext,
        }

        if ext == ".pdf":
            extracted_text, status, warning, page_count = cls._extract_pdf_text(storage_rel_path)
            meta["page_count"] = page_count
        elif ext in [".txt", ".text", ".log", ".md", ".markdown", ".rtf"]:
            extracted_text, status, warning, text_meta = cls._extract_text_file(contents, ext, file.filename)
            meta.update(text_meta)
        elif ext in [".eml", ".msg"]:
            extracted_text, status, warning, eml_meta = cls._extract_email_file(contents, file.filename)
            meta.update(eml_meta)
        elif ext in [".csv", ".tsv"]:
            extracted_text, status, warning, csv_meta = cls._extract_csv_file(contents, ext, file.filename)
            meta.update(csv_meta)
        elif ext == ".json":
            extracted_text, status, warning, json_meta = cls._extract_json_file(contents, file.filename)
            meta.update(json_meta)
        elif ext == ".docx":
            extracted_text, status, warning, docx_meta = cls._extract_docx_file(contents, file.filename)
            meta.update(docx_meta)
        elif ext in [".xml", ".html", ".htm"]:
            extracted_text, status, warning, markup_meta = cls._extract_markup_file(contents, ext, file.filename)
            meta.update(markup_meta)

        doc = SourceDocument(
            source_id=cls._generate_source_id(prefix),
            source_type=source_type,
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
        db.flush()

        if investigation_id:
            from app.services.audit_service import AuditLogService
            AuditLogService.log_event(
                db=db,
                investigation_id=investigation_id,
                event_type="source_attached",
                actor="QA Lead Investigator",
                entity_type="source_document",
                entity_id=doc.source_id,
                action_summary=f"Structured document attached ({doc.source_id}): '{file.filename}' [{source_type.upper()}]",
                details={
                    "source_type": doc.source_type,
                    "source_id": doc.source_id,
                    "filename": file.filename,
                    "extraction_status": status,
                },
                commit=False,
            )

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
                warning = (
                    "The uploaded PDF appears to be a scanned document or image-only file. "
                    "No selectable text could be extracted with local text extraction. "
                    "You may paste the incident text manually."
                )
                return extracted_text, "partial", warning, num_pages

            return extracted_text, "success", None, num_pages
        except Exception as e:
            return "", "failed", f"PDF extraction failed: {str(e)}", 0

    @staticmethod
    def _extract_text_file(contents: bytes, ext: str, filename: str) -> Tuple[str, str, Optional[str], Dict[str, Any]]:
        """Extract plain text, markdown, or log files."""
        try:
            decoded = contents.decode("utf-8")
        except UnicodeDecodeError:
            decoded = contents.decode("latin-1", errors="replace")

        cleaned = decoded.strip()
        meta = {
            "file_type": ext.lstrip("."),
            "char_count": len(cleaned),
            "line_count": len(cleaned.splitlines()),
        }
        if len(cleaned) < 5:
            return cleaned, "partial", "File contains less than 5 characters.", meta

        return cleaned, "success", None, meta

    @staticmethod
    def _extract_email_file(contents: bytes, filename: str) -> Tuple[str, str, Optional[str], Dict[str, Any]]:
        """Extract email message headers and plain body from an .eml file."""
        import email
        from email import policy

        try:
            msg = email.message_from_bytes(contents, policy=policy.default)
            subject = str(msg.get("Subject", "No Subject"))
            sender = str(msg.get("From", "Not provided"))
            received_date = str(msg.get("Date", "Not provided"))
            to_recipients = str(msg.get("To", "Not provided"))

            body_text = ""
            body_part = msg.get_body(preferencelist=('plain', 'html'))
            if body_part:
                body_text = body_part.get_content()
            else:
                if msg.is_multipart():
                    for part in msg.walk():
                        if part.get_content_type() == "text/plain":
                            payload = part.get_payload(decode=True)
                            if payload:
                                body_text = payload.decode(errors="replace")
                                break
                else:
                    payload = msg.get_payload(decode=True)
                    if payload:
                        body_text = payload.decode(errors="replace")

            formatted_text = (
                f"Subject: {subject}\n"
                f"From: {sender}\n"
                f"To: {to_recipients}\n"
                f"Received: {received_date}\n"
                f"----------------------------------------\n"
                f"{body_text.strip()}"
            )

            meta = {
                "subject": subject,
                "sender": sender,
                "received_date": received_date,
                "to": to_recipients,
            }
            return formatted_text, "success", None, meta
        except Exception as e:
            return "", "failed", f"Failed to parse email file: {str(e)}", {}

    @staticmethod
    def _extract_csv_file(contents: bytes, ext: str, filename: str) -> Tuple[str, str, Optional[str], Dict[str, Any]]:
        """Extract tabular CSV or TSV files into readable structured records."""
        try:
            decoded = contents.decode("utf-8")
        except UnicodeDecodeError:
            decoded = contents.decode("latin-1", errors="replace")

        delimiter = "\t" if ext == ".tsv" else ","
        try:
            reader = csv.reader(io.StringIO(decoded), delimiter=delimiter)
            rows = [row for row in reader if any(cell.strip() for cell in row)]
        except Exception as e:
            return "", "failed", f"Failed to parse CSV/TSV table: {str(e)}", {}

        if not rows:
            return "", "partial", "Tabular file contains no data rows.", {"row_count": 0}

        headers = rows[0]
        data_rows = rows[1:]

        lines = [
            f"STRUCTURED TABULAR DATA (Source: {filename})",
            f"Columns ({len(headers)}): {', '.join(headers)}",
            f"Total Data Records: {len(data_rows)}",
            "----------------------------------------",
        ]

        max_rows_preview = 100
        for idx, row in enumerate(data_rows[:max_rows_preview]):
            fields = []
            for h, val in zip(headers, row):
                fields.append(f"{h}: {val}")
            if len(row) > len(headers):
                fields.extend(row[len(headers):])
            lines.append(f"Record {idx + 1}: " + " | ".join(fields))

        if len(data_rows) > max_rows_preview:
            lines.append(f"... [{len(data_rows) - max_rows_preview} additional records omitted for brevity]")

        meta = {
            "format": "csv",
            "columns": headers,
            "row_count": len(data_rows),
            "column_count": len(headers),
        }
        return "\n".join(lines), "success", None, meta

    @staticmethod
    def _extract_json_file(contents: bytes, filename: str) -> Tuple[str, str, Optional[str], Dict[str, Any]]:
        """Extract structured JSON documents into clean formatted text."""
        try:
            decoded = contents.decode("utf-8")
        except UnicodeDecodeError:
            decoded = contents.decode("latin-1", errors="replace")

        try:
            data = json.loads(decoded)
        except json.JSONDecodeError as e:
            return "", "failed", f"Invalid JSON format: {str(e)}", {"format": "json"}

        formatted = json.dumps(data, indent=2, ensure_ascii=False)
        extracted_text = (
            f"STRUCTURED JSON DOCUMENT (Source: {filename})\n"
            f"----------------------------------------\n"
            f"{formatted}"
        )
        meta = {
            "format": "json",
            "item_count": len(data) if isinstance(data, (dict, list)) else 1,
        }
        return extracted_text, "success", None, meta

    @staticmethod
    def _extract_docx_file(contents: bytes, filename: str) -> Tuple[str, str, Optional[str], Dict[str, Any]]:
        """Extract paragraphs from Word .docx documents using internal XML without external dependencies."""
        try:
            with zipfile.ZipFile(io.BytesIO(contents)) as docx_zip:
                xml_content = docx_zip.read('word/document.xml')
                tree = ET.fromstring(xml_content)
                paragraphs = []
                for elem in tree.iter():
                    if elem.tag.endswith('p'):
                        p_text = ''.join(node.text for node in elem.iter() if node.tag.endswith('t') and node.text)
                        if p_text.strip():
                            paragraphs.append(p_text.strip())

                extracted_text = "\n\n".join(paragraphs).strip()
                meta = {
                    "format": "docx",
                    "paragraph_count": len(paragraphs),
                }
                if not extracted_text:
                    return "", "partial", "Word document contains no readable text paragraphs.", meta
                return extracted_text, "success", None, meta
        except Exception as e:
            return "", "failed", f"Failed to extract Word .docx document: {str(e)}", {}

    @staticmethod
    def _extract_markup_file(contents: bytes, ext: str, filename: str) -> Tuple[str, str, Optional[str], Dict[str, Any]]:
        """Extract clean text from XML or HTML documents."""
        try:
            decoded = contents.decode("utf-8")
        except UnicodeDecodeError:
            decoded = contents.decode("latin-1", errors="replace")

        text = re.sub(r'<script.*?</script>', '', decoded, flags=re.DOTALL | re.IGNORECASE)
        text = re.sub(r'<style.*?</style>', '', text, flags=re.DOTALL | re.IGNORECASE)
        text = re.sub(r'<br\s*/?>', '\n', text, flags=re.IGNORECASE)
        text = re.sub(r'</p>', '\n\n', text, flags=re.IGNORECASE)
        text = re.sub(r'</div>', '\n', text, flags=re.IGNORECASE)
        text = re.sub(r'<[^>]+>', ' ', text)
        cleaned = re.sub(r'[ \t]+', ' ', text).strip()

        meta = {
            "format": ext.lstrip("."),
            "char_count": len(cleaned),
        }
        return cleaned, "success", None, meta
