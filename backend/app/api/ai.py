from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.config import settings
from app.ai.config import GroqClientManager
from app.ai.orchestrator import AIOrchestrator
from app.ai.persistence import AnalysisPersistenceService
from app.schemas.ai_contract import (
    AnalysisResponse,
    RunAnalysisRequest,
    AnalysisUpdateRequest,
    AIHealthResponse,
)

router = APIRouter(tags=["AI Intelligence"])

# AI System Health
@router.get("/ai/health", response_model=AIHealthResponse)
def get_ai_health():
    """Returns safe AI provider status, model configuration, and readiness without exposing secrets."""
    is_conf = GroqClientManager.is_configured()
    return AIHealthResponse(
        ai_status="operational" if is_conf else "unconfigured",
        configured_model=settings.GROQ_MODEL,
        groq_api_configured=is_conf,
        temperature=settings.AI_TEMPERATURE,
        max_tokens=settings.AI_MAX_OUTPUT_TOKENS,
    )

# Run Full or Customized Analysis
@router.post("/investigations/{investigation_id}/analysis", response_model=AnalysisResponse, status_code=status.HTTP_200_OK)
def run_investigation_analysis(
    investigation_id: int,
    request: Optional[RunAnalysisRequest] = None,
    db: Session = Depends(get_db)
):
    """
    Executes the multi-node LangGraph workflow on the specified investigation and its source documents.
    Generates facts, evidence gaps, causes, 5 Whys, fishbone, and CAPA, then persists as a new version.
    """
    return AIOrchestrator.run_investigation_analysis(
        db=db,
        investigation_id=investigation_id,
        request=request or RunAnalysisRequest()
    )

# Targeted 5 Whys Execution
@router.post("/investigations/{investigation_id}/analysis/five-whys", response_model=AnalysisResponse)
def run_five_whys_analysis(
    investigation_id: int,
    db: Session = Depends(get_db)
):
    """Runs or regenerates 5 Whys causal deduction chain specifically."""
    req = RunAnalysisRequest(include_five_whys=True, include_fishbone=False, include_capa=False)
    return AIOrchestrator.run_investigation_analysis(db=db, investigation_id=investigation_id, request=req)

# Targeted Fishbone Execution
@router.post("/investigations/{investigation_id}/analysis/fishbone", response_model=AnalysisResponse)
def run_fishbone_analysis(
    investigation_id: int,
    db: Session = Depends(get_db)
):
    """Runs or regenerates 6M Ishikawa fishbone analysis specifically."""
    req = RunAnalysisRequest(include_five_whys=False, include_fishbone=True, include_capa=False)
    return AIOrchestrator.run_investigation_analysis(db=db, investigation_id=investigation_id, request=req)

# Targeted CAPA Execution
@router.post("/investigations/{investigation_id}/analysis/capa", response_model=AnalysisResponse)
def run_capa_analysis(
    investigation_id: int,
    db: Session = Depends(get_db)
):
    """Runs or regenerates CAPA recommendations based on latest investigation findings."""
    req = RunAnalysisRequest(include_five_whys=False, include_fishbone=False, include_capa=True)
    return AIOrchestrator.run_investigation_analysis(db=db, investigation_id=investigation_id, request=req)

# Retrieve Latest Analysis
@router.get("/investigations/{investigation_id}/analysis", response_model=AnalysisResponse)
def get_latest_investigation_analysis(
    investigation_id: int,
    db: Session = Depends(get_db)
):
    """Retrieves the latest persisted analysis version for the specified investigation."""
    analysis = AnalysisPersistenceService.get_latest_analysis(db, investigation_id)
    if not analysis:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"No AI analysis has been executed yet for investigation ID {investigation_id}."
        )
    return AnalysisPersistenceService.to_response_dto(analysis)

# Retrieve Analysis History (All Versions)
@router.get("/investigations/{investigation_id}/analysis/history", response_model=List[AnalysisResponse])
def get_investigation_analysis_history(
    investigation_id: int,
    db: Session = Depends(get_db)
):
    """Retrieves all prior analysis versions for an investigation to preserve version history."""
    history = AnalysisPersistenceService.get_analysis_history(db, investigation_id)
    return [AnalysisPersistenceService.to_response_dto(a) for a in history]

# Update Human Review State / User Edits
@router.patch("/investigations/{investigation_id}/analysis/{analysis_id}", response_model=AnalysisResponse)
def update_analysis_human_review(
    investigation_id: int,
    analysis_id: int,
    payload: AnalysisUpdateRequest,
    db: Session = Depends(get_db)
):
    """
    Saves human review edits, user modifications, and confirmed root cause decisions.
    Preserves the original AI output while recording the investigator's verified edits.
    """
    updated = AnalysisPersistenceService.update_analysis_review(
        db=db,
        analysis_id=analysis_id,
        update_data=payload,
    )
    return AnalysisPersistenceService.to_response_dto(updated)
