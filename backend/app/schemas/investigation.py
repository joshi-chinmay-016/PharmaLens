from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field, ConfigDict
from app.schemas.source_document import SourceDocumentResponse

class InvestigationBase(BaseModel):
    title: str = Field(..., min_length=3, max_length=255, description="Clear, descriptive title for the investigation")
    incident_reference: Optional[str] = Field(None, max_length=100, description="Deviation / Incident number, e.g., DEV-2026-014")
    status: Optional[str] = Field("Draft", description="Workflow status: Draft, In Review, Completed, Closed")
    
    # Incident Details
    incident_description: Optional[str] = Field(None, description="Detailed description of the deviation or incident")
    incident_datetime: Optional[datetime] = Field(None, description="Date and time when the incident occurred")
    discovery_datetime: Optional[datetime] = Field(None, description="Date and time when the deviation was discovered")
    product_name: Optional[str] = Field(None, max_length=255, description="Active Pharmaceutical Ingredient (API) or product name")
    batch_number: Optional[str] = Field(None, max_length=100, description="Batch or lot number involved")
    manufacturing_site: Optional[str] = Field(None, max_length=255, description="Manufacturing site, building, or production line")
    process_step: Optional[str] = Field(None, max_length=100, description="Process unit operation (e.g., Synthesis, Crystallization, Drying)")
    incident_category: Optional[str] = Field(None, max_length=100, description="Category (e.g., OOS Result, Environmental, Equipment Failure)")
    expected_result: Optional[str] = Field(None, description="Expected outcome, standard parameter, or specification")
    actual_result: Optional[str] = Field(None, description="Observed analytical or process result")
    acceptance_criterion: Optional[str] = Field(None, description="Applicable acceptance criteria or specification limit")
    immediate_impact: Optional[str] = Field(None, description="Observed or potential impact on product quality and safety")
    immediate_containment: Optional[str] = Field(None, description="Immediate actions taken to quarantine or secure the batch")
    reporter_name: Optional[str] = Field(None, max_length=150, description="Name or role of person reporting or initiating investigation")
    
    # Investigation Context
    known_facts: Optional[str] = Field(None, description="Verified facts directly established from evidence")
    initial_observations: Optional[str] = Field(None, description="Initial investigative observations and walkthrough notes")
    evidence_available: Optional[str] = Field(None, description="List of physical/digital records already collected")
    investigation_notes: Optional[str] = Field(None, description="Working notes, hypotheses, and team remarks")
    
    has_unresolved_gaps: Optional[bool] = Field(False, description="Flag indicating missing critical evidence or unresolved gaps")

class InvestigationCreate(InvestigationBase):
    source_document_ids: Optional[List[int]] = Field(None, description="Optional list of source document IDs to associate")

class InvestigationUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=3, max_length=255)
    incident_reference: Optional[str] = Field(None, max_length=100)
    status: Optional[str] = None
    
    incident_description: Optional[str] = None
    incident_datetime: Optional[datetime] = None
    discovery_datetime: Optional[datetime] = None
    product_name: Optional[str] = None
    batch_number: Optional[str] = None
    manufacturing_site: Optional[str] = None
    process_step: Optional[str] = None
    incident_category: Optional[str] = None
    expected_result: Optional[str] = None
    actual_result: Optional[str] = None
    acceptance_criterion: Optional[str] = None
    immediate_impact: Optional[str] = None
    immediate_containment: Optional[str] = None
    reporter_name: Optional[str] = None
    
    known_facts: Optional[str] = None
    initial_observations: Optional[str] = None
    evidence_available: Optional[str] = None
    investigation_notes: Optional[str] = None
    
    has_unresolved_gaps: Optional[bool] = None

class InvestigationSummary(BaseModel):
    id: int
    investigation_id: str
    title: str
    incident_reference: Optional[str] = None
    status: str
    product_name: Optional[str] = None
    batch_number: Optional[str] = None
    incident_category: Optional[str] = None
    process_step: Optional[str] = None
    has_unresolved_gaps: bool
    created_at: datetime
    updated_at: datetime
    source_documents_count: int = 0

    model_config = ConfigDict(from_attributes=True)

class InvestigationResponse(InvestigationBase):
    id: int
    investigation_id: str
    created_at: datetime
    updated_at: datetime
    source_documents: List[SourceDocumentResponse] = []

    model_config = ConfigDict(from_attributes=True)

class InvestigationTransitionRequest(BaseModel):
    target_status: str = Field(..., description="Target status: Draft, Under Investigation, AI Analysis Available, In Review, Completed")
    justification: Optional[str] = Field(None, description="Optional justification or notes for the transition")

class InvestigationReopenRequest(BaseModel):
    reason: str = Field(..., min_length=5, description="Mandatory regulatory/quality justification for reopening a completed investigation")
    target_status: Optional[str] = Field("In Review", description="Status to transition to upon reopening (default: In Review)")

class DashboardMetricsResponse(BaseModel):
    total_investigations: int
    draft_investigations: int
    in_review_investigations: int
    unresolved_gaps_count: int
    completed_investigations: int
    under_investigation_count: Optional[int] = 0
    ai_available_count: Optional[int] = 0
