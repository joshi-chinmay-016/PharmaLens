from datetime import datetime
from typing import Optional, Any, Dict
from pydantic import BaseModel, Field, ConfigDict

class TextIntakeRequest(BaseModel):
    text: str = Field(..., min_length=5, description="Pasted incident text or investigation notes")
    investigation_id: Optional[int] = Field(None, description="Optional existing investigation to attach to")
    title_hint: Optional[str] = Field(None, description="Optional title or context hint")

class EmailIntakeRequest(BaseModel):
    subject: str = Field(..., min_length=2, description="Email subject line")
    sender: Optional[str] = Field(None, description="Sender email or name")
    received_date: Optional[str] = Field(None, description="Date/time email was received")
    body: str = Field(..., min_length=5, description="Email body content")
    investigation_id: Optional[int] = Field(None, description="Optional existing investigation to attach to")

class SourceDocumentResponse(BaseModel):
    id: int
    source_id: str
    source_type: str
    original_filename: Optional[str] = None
    file_size_bytes: Optional[int] = None
    extracted_text: Optional[str] = None
    extraction_status: str
    extraction_warning: Optional[str] = None
    metadata_json: Optional[str] = None
    investigation_id: Optional[int] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
