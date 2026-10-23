"""
Phase 2 AI Integration Contract Specifications.
Defines typed Pydantic models for future LangGraph orchestration & Groq model inference.
Ensures zero breaking changes when transitioning from Phase 1 to Phase 2.
"""

from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field

class ExtractedFact(BaseModel):
    field_name: str = Field(..., description="Target field name, e.g. 'batch_number'")
    extracted_value: Any = Field(..., description="Value extracted from source")
    confidence_score: float = Field(..., ge=0.0, le=1.0, description="Extraction confidence")
    source_snippet: Optional[str] = Field(None, description="Verbatim quote from source document")

class EvidenceGap(BaseModel):
    gap_id: str
    category: str = Field(..., description="E.g., Equipment Calibration, Process Log, Analytical Method")
    description: str = Field(..., description="Description of the missing record or unverified condition")
    impact_level: str = Field(..., description="High, Medium, Low")
    suggested_action: str = Field(..., description="Recommendation to verify this gap")

class PotentialRootCause(BaseModel):
    cause_id: str
    hypothesis: str = Field(..., description="Hypothesized root cause")
    evidence_for: List[str] = Field(default_factory=list, description="Documented facts supporting this hypothesis")
    evidence_against_or_missing: List[str] = Field(default_factory=list, description="Missing or contradicting data")
    is_confirmed_by_human: bool = Field(False, description="Whether human investigator has confirmed this")
    plausibility: str = Field("Medium", description="High, Medium, Low")

class FiveWhysStep(BaseModel):
    level: int = Field(..., ge=1, le=5)
    question: str
    answer: str
    is_verified_fact: bool = Field(False, description="True if proven by data, False if hypothesis")
    supporting_evidence: Optional[str] = None

class FiveWhysAnalysis(BaseModel):
    problem_statement: str
    steps: List[FiveWhysStep] = []
    derived_root_cause: Optional[str] = None

class FishboneCauseItem(BaseModel):
    cause: str
    is_contributing: bool = False
    evidence: Optional[str] = None

class FishboneAnalysis(BaseModel):
    # 6M standard pharmaceutical categories
    machine: List[FishboneCauseItem] = Field(default_factory=list)
    method: List[FishboneCauseItem] = Field(default_factory=list)
    material: List[FishboneCauseItem] = Field(default_factory=list)
    measurement: List[FishboneCauseItem] = Field(default_factory=list)
    milieu_environment: List[FishboneCauseItem] = Field(default_factory=list)
    manpower_people: List[FishboneCauseItem] = Field(default_factory=list)

class CapaRecommendation(BaseModel):
    action_type: str = Field(..., description="'Corrective' (address immediate/past) or 'Preventive' (prevent recurrence)")
    title: str
    description: str
    target_root_cause: str
    recommended_owner_role: Optional[str] = None
    target_timeline_days: Optional[int] = None
    suggested_verification_method: Optional[str] = None
    human_approval_status: str = Field("Pending Review", description="Pending Review, Accepted, Modified, Rejected")

class InvestigationAIAnalysisContract(BaseModel):
    """Structured contract for Phase 2 LangGraph workflow outputs."""
    investigation_id: int
    extracted_facts: List[ExtractedFact] = []
    missing_fields: List[str] = []
    evidence_gaps: List[EvidenceGap] = []
    potential_root_causes: List[PotentialRootCause] = []
    contributing_factors: List[str] = []
    five_whys: Optional[FiveWhysAnalysis] = None
    fishbone: Optional[FishboneAnalysis] = None
    capa_recommendations: List[CapaRecommendation] = []
    model_metadata: Dict[str, Any] = Field(default_factory=dict)
    disclaimer: str = (
        "AI-generated hypotheses and recommendations are decision-support outputs only. "
        "They must be reviewed and confirmed by qualified pharmaceutical quality personnel."
    )
