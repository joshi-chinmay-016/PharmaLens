from datetime import datetime
from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, func
from sqlalchemy.orm import relationship
from app.core.database import Base

class SourceDocument(Base):
    __tablename__ = "source_documents"

    id = Column(Integer, primary_key=True, index=True)
    source_id = Column(String(50), unique=True, index=True, nullable=False)
    source_type = Column(String(50), nullable=False)  # "pasted_text", "pdf", "email"
    original_filename = Column(String(255), nullable=True)
    stored_filepath = Column(String(500), nullable=True)
    file_size_bytes = Column(Integer, nullable=True)
    extracted_text = Column(Text, nullable=True)
    extraction_status = Column(String(50), default="success", nullable=False)  # "success", "partial", "failed"
    extraction_warning = Column(Text, nullable=True)
    metadata_json = Column(Text, nullable=True)  # JSON-encoded extra details (e.g., email subject, sender, page count)
    
    investigation_id = Column(
        Integer,
        ForeignKey("investigations.id", ondelete="CASCADE"),
        nullable=True,
        index=True
    )
    
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    # Relationship
    investigation = relationship("Investigation", back_populates="source_documents")
