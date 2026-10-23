from datetime import datetime
from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, func
from sqlalchemy.orm import relationship
from app.core.database import Base

class InvestigationAnalysis(Base):
    __tablename__ = "investigation_analyses"

    id = Column(Integer, primary_key=True, index=True)
    investigation_id = Column(
        Integer,
        ForeignKey("investigations.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )
    version = Column(Integer, default=1, nullable=False)
    status = Column(String(50), default="completed", nullable=False)  # pending, running, completed, completed_with_warnings, failed
    requested_methods = Column(String(100), default="full", nullable=False)  # full, five_whys, fishbone, capa
    
    # AI-Generated Validated Output (Strictly preserves the generated version)
    structured_output_json = Column(Text, nullable=False)
    
    # User-Edited Overrides (Preserves human modifications separately without overwriting original AI output)
    user_edits_json = Column(Text, nullable=True)
    
    # Human Confirmed Root Cause (Explicit human review gate)
    confirmed_root_cause = Column(Text, nullable=True)
    is_confirmed_by_human = Column(Integer, default=0, nullable=False)  # 0: Unconfirmed, 1: Human Confirmed
    
    # Provenance and Model Metadata
    model_identifier = Column(String(100), nullable=False)
    prompt_version = Column(String(50), default="v2.0", nullable=False)
    error_summary = Column(Text, nullable=True)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    completed_at = Column(DateTime(timezone=True), nullable=True)

    # Relationships
    investigation = relationship("Investigation", back_populates="analyses")
