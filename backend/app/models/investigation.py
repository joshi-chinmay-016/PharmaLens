from datetime import datetime
from sqlalchemy import Column, Integer, String, Text, DateTime, Boolean, func
from sqlalchemy.orm import relationship
from app.core.database import Base

class Investigation(Base):
    __tablename__ = "investigations"

    id = Column(Integer, primary_key=True, index=True)
    investigation_id = Column(String(50), unique=True, index=True, nullable=False)
    title = Column(String(255), nullable=False)
    incident_reference = Column(String(100), nullable=True, index=True)
    status = Column(String(50), default="Draft", index=True, nullable=False)
    
    # Incident Details
    incident_description = Column(Text, nullable=True)
    incident_datetime = Column(DateTime(timezone=True), nullable=True)
    discovery_datetime = Column(DateTime(timezone=True), nullable=True)
    product_name = Column(String(255), nullable=True)
    batch_number = Column(String(100), nullable=True, index=True)
    manufacturing_site = Column(String(255), nullable=True)
    process_step = Column(String(100), nullable=True)
    incident_category = Column(String(100), nullable=True)
    expected_result = Column(Text, nullable=True)
    actual_result = Column(Text, nullable=True)
    acceptance_criterion = Column(Text, nullable=True)
    immediate_impact = Column(Text, nullable=True)
    immediate_containment = Column(Text, nullable=True)
    reporter_name = Column(String(150), nullable=True)
    
    # Investigation Context
    known_facts = Column(Text, nullable=True)
    initial_observations = Column(Text, nullable=True)
    evidence_available = Column(Text, nullable=True)
    investigation_notes = Column(Text, nullable=True)
    
    # Gap Tracking (Evidence Before Conclusions)
    has_unresolved_gaps = Column(Boolean, default=False, nullable=False)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    # Relationships
    source_documents = relationship(
        "SourceDocument",
        back_populates="investigation",
        cascade="all, delete-orphan",
        lazy="selectin"
    )
    analyses = relationship(
        "InvestigationAnalysis",
        back_populates="investigation",
        cascade="all, delete-orphan",
        lazy="selectin"
    )
    audit_logs = relationship(
        "InvestigationAuditLog",
        back_populates="investigation",
        cascade="all, delete-orphan",
        order_by="desc(InvestigationAuditLog.created_at)",
        lazy="selectin"
    )
