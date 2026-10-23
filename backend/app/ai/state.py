from typing import TypedDict, List, Dict, Any, Optional
from app.schemas.ai_contract import (
    ExtractedFact,
    EvidenceGap,
    PotentialRootCause,
    FiveWhysAnalysis,
    FishboneAnalysis,
    CapaRecommendation,
)

class InvestigationGraphState(TypedDict, total=False):
    # Core Investigation Context
    investigation_id: int
    investigation_snapshot: Dict[str, Any]
    
    # Source Ingestion & Sanitization
    source_documents: List[Dict[str, Any]]
    source_texts: List[str]
    source_manifest: List[Dict[str, Any]]
    normalized_source_context: str
    
    # Flags for conditional execution
    include_five_whys: bool
    include_fishbone: bool
    include_capa: bool
    
    # Structured Outputs by Node
    extracted_facts: List[Dict[str, Any]]
    validation_issues: List[str]
    missing_fields: List[str]
    evidence_gaps: List[Dict[str, Any]]
    potential_root_causes: List[Dict[str, Any]]
    contributing_factors: List[str]
    five_whys: Optional[Dict[str, Any]]
    fishbone_analysis: Optional[Dict[str, Any]]
    capa_recommendations: List[Dict[str, Any]]
    
    # Workflow Metadata & Diagnostics
    provenance_sources: List[Dict[str, Any]]
    analysis_warnings: List[str]
    execution_status: str  # "running", "completed", "completed_with_warnings", "failed"
    failed_nodes: List[str]
    model_metadata: Dict[str, Any]
    analysis_version: int
