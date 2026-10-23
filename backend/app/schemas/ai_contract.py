"""
Phase 2 AI Integration Contract Specifications.
Defines typed Pydantic v2 models for LangGraph orchestration, Groq model inference,
human-in-the-loop review, and PostgreSQL persistence.
"""

from datetime import datetime
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field, ConfigDict

class SourceProvenanceItem(BaseModel):
    source_id: str
    source_type: str
    original_filename: Optional[str] = None
    excerpt: str = Field(..., description="Short exact excerpt from source supporting the claim")
    relevance: Optional[str] = None

class ExtractedFact(BaseModel):
    field_name: str = Field(..., description="Target investigation field name, e.g. 'batch_number'")
    extracted_value: Any = Field(..., description="Value extracted directly from source")
    confidence_score: float = Field(default=0.9, ge=0.0, le=1.0, description="Extraction quality score")
    source_id: Optional[str] = Field(None, description="Identifier of the source document")
    source_snippet: Optional[str] = Field(None, description="Verbatim quote from source document")
    verification_status: str = Field("extracted_from_source", description="extracted_from_source, unverified, contradictory")
    proposed_for_form: bool = Field(False, description="True if value can update current investigation field")
    current_form_value: Optional[str] = Field(None, description="Existing value in the investigation form")

class EvidenceGap(BaseModel):
    gap_id: str
    category: str = Field(..., description="Equipment Calibration, Process Log, Analytical Method, Environmental, Raw Material")
    description: str = Field(..., description="Specific missing record or parameter needed for investigation")
    why_it_matters: str = Field(..., description="Scientific or quality impact of why this evidence matters")
    recommended_evidence_to_obtain: str = Field(..., description="Concrete actionable record or log to retrieve")
    priority: str = Field("Medium", description="High, Medium, Low")
    status: str = Field("missing", description="missing, partially_available, available_for_review")
    supporting_source_ids: List[str] = Field(default_factory=list)

class PotentialRootCause(BaseModel):
    cause_id: str
    title: str = Field(..., description="Concise hypothesis statement")
    explanation: str = Field(..., description="Evidence-backed reasoning describing the causal mechanism")
    category: str = Field("Process / Unit Operation", description="Process, Equipment, Analytical, Material, Human Error (requires evidence)")
    evidence_for: List[str] = Field(default_factory=list, description="Documented facts directly supporting this hypothesis")
    evidence_against_or_missing: List[str] = Field(default_factory=list, description="Missing records or contradictory evidence")
    supporting_source_ids: List[str] = Field(default_factory=list)
    supporting_excerpts: List[str] = Field(default_factory=list)
    plausibility: str = Field("Medium", description="High, Medium, Low")
    ranking_rationale: Optional[str] = Field(None, description="Explanation for prioritization based on evidence weight")
    investigation_questions: List[str] = Field(default_factory=list, description="Targeted inquiries for the investigator")
    recommended_next_step: Optional[str] = Field(None, description="Verification action to prove or disprove hypothesis")
    review_status: str = Field("suggested", description="suggested, under_investigation, supported, rejected, human_confirmed")
    is_confirmed_by_human: bool = Field(False, description="Strictly False until a qualified investigator confirms it")

class FiveWhysStep(BaseModel):
    level: int = Field(..., ge=1, le=5)
    question: str
    answer: str
    status: str = Field("tentative", description="supported, tentative, unresolved")
    supporting_evidence: Optional[str] = None
    source_id: Optional[str] = None
    missing_evidence_to_verify: Optional[str] = None

class FiveWhysAnalysis(BaseModel):
    problem_statement: str
    steps: List[FiveWhysStep] = []
    derived_root_cause_hypothesis: Optional[str] = None
    is_chain_complete: bool = False
    evidence_limitation_note: Optional[str] = None

class FishboneCauseItem(BaseModel):
    cause_id: str
    cause: str
    category: str = Field(..., description="machine, method, material, measurement, milieu_environment, manpower_people")
    status: str = Field("tentative", description="directly_supported, tentative, unresolved")
    evidence: Optional[str] = None
    source_id: Optional[str] = None
    verification_action: Optional[str] = None
    review_status: str = Field("suggested", description="suggested, under_investigation, rejected")

class FishboneAnalysis(BaseModel):
    # 6M standard pharmaceutical categories
    machine: List[FishboneCauseItem] = Field(default_factory=list)
    method: List[FishboneCauseItem] = Field(default_factory=list)
    material: List[FishboneCauseItem] = Field(default_factory=list)
    measurement: List[FishboneCauseItem] = Field(default_factory=list)
    milieu_environment: List[FishboneCauseItem] = Field(default_factory=list)
    manpower_people: List[FishboneCauseItem] = Field(default_factory=list)
    summary_observations: Optional[str] = None

class CapaRecommendation(BaseModel):
    action_id: str
    action_type: str = Field(..., description="'Correction / Containment', 'Corrective Action', or 'Preventive Action'")
    title: str
    description: str
    rationale: str = Field(..., description="Why this action addresses the hypothesis or evidence gap")
    target_root_cause_or_gap: str
    expected_outcome: str
    suggested_owner_role: Optional[str] = None
    suggested_priority: str = Field("Medium", description="High, Medium, Low")
    effectiveness_check_method: Optional[str] = Field(None, description="KPI, re-test criteria, or monitoring period to verify effectiveness")
    evidence_needed_for_closure: Optional[str] = None
    human_approval_status: str = Field("Proposed", description="Proposed, Accepted, Modified, Rejected")

class InvestigationAIAnalysisContract(BaseModel):
    """Complete validated output contract for LangGraph workflow execution."""
    investigation_id: int
    extracted_facts: List[ExtractedFact] = []
    missing_fields: List[str] = []
    evidence_gaps: List[EvidenceGap] = []
    potential_root_causes: List[PotentialRootCause] = []
    contributing_factors: List[str] = []
    five_whys: Optional[FiveWhysAnalysis] = None
    fishbone: Optional[FishboneAnalysis] = None
    capa_recommendations: List[CapaRecommendation] = []
    analysis_warnings: List[str] = []
    provenance_sources: List[Dict[str, Any]] = []
    model_metadata: Dict[str, Any] = Field(default_factory=dict)
    disclaimer: str = (
        "AI-generated hypotheses and recommendations are decision-support outputs only. "
        "They must be reviewed and confirmed by qualified pharmaceutical quality personnel."
    )

    model_config = ConfigDict(from_attributes=True)

# API Request / Response Schemas
class RunAnalysisRequest(BaseModel):
    include_five_whys: bool = Field(True, description="Execute 5 Whys causal deduction node")
    include_fishbone: bool = Field(True, description="Execute 6M Ishikawa fishbone analysis node")
    include_capa: bool = Field(True, description="Execute CAPA recommendation node")

class AnalysisUpdateRequest(BaseModel):
    confirmed_root_cause: Optional[str] = Field(None, description="Human-confirmed root cause conclusion")
    is_confirmed_by_human: Optional[bool] = Field(None, description="Explicit confirmation state")
    user_edits_json: Optional[str] = Field(None, description="JSON-serialized user modifications to causes, 5 Whys, fishbone, or CAPAs")

class AnalysisResponse(BaseModel):
    id: int
    investigation_id: int
    version: int
    status: str
    requested_methods: str
    structured_output: InvestigationAIAnalysisContract
    user_edits: Optional[Dict[str, Any]] = None
    confirmed_root_cause: Optional[str] = None
    is_confirmed_by_human: bool
    model_identifier: str
    prompt_version: str
    created_at: datetime
    completed_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)

class AIHealthResponse(BaseModel):
    ai_status: str
    configured_model: str
    groq_api_configured: bool
    temperature: float
    max_tokens: int
    supported_methods: List[str] = ["fact_extraction", "evidence_gaps", "potential_causes", "five_whys", "fishbone_6m", "capa_recommendations"]
