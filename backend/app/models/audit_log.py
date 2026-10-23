from datetime import datetime
from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, func
from sqlalchemy.orm import relationship
from app.core.database import Base

class InvestigationAuditLog(Base):
    """
    Append-only audit trail model for pharmaceutical compliance and decision integrity.
    Captures all material lifecycle, review, source, and AI actions.
    """
    __tablename__ = "investigation_audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    investigation_id = Column(
        Integer,
        ForeignKey("investigations.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )
    event_type = Column(String(60), nullable=False, index=True)
    actor = Column(String(100), default="QA Lead Investigator", nullable=False)
    entity_type = Column(String(50), nullable=True)
    entity_id = Column(String(100), nullable=True)
    action_summary = Column(Text, nullable=False)
    details_json = Column(Text, nullable=True)
    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
        index=True
    )

    # Relationships
    investigation = relationship("Investigation", back_populates="audit_logs")
