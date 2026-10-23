import json
import logging
from datetime import datetime, timezone
from typing import Optional, List, Dict, Any, Tuple
from sqlalchemy.orm import Session
from sqlalchemy import desc
from fastapi import HTTPException

from app.models.investigation import Investigation
from app.models.investigation_analysis import InvestigationAnalysis
from app.schemas.ai_contract import (
    InvestigationAIAnalysisContract,
    AnalysisResponse,
    AnalysisUpdateRequest,
)
from app.core.config import settings

logger = logging.getLogger("pharmalens.ai.persistence")

class AnalysisPersistenceService:
    @staticmethod
    def _get_next_version(db: Session, investigation_id: int) -> int:
        latest = (
            db.query(InvestigationAnalysis)
            .filter(InvestigationAnalysis.investigation_id == investigation_id)
            .order_by(desc(InvestigationAnalysis.version))
            .first()
        )
        return (latest.version + 1) if latest else 1

    @classmethod
    def save_analysis(
        cls,
        db: Session,
        investigation_id: int,
        contract: InvestigationAIAnalysisContract,
        requested_methods: str = "full",
        status: str = "completed",
        error_summary: Optional[str] = None,
    ) -> InvestigationAnalysis:
        """
        Persists a newly executed AI analysis run as a distinct version.
        Ensures previous versions and human review edits are preserved.
        """
        # Ensure investigation exists
        inv = db.query(Investigation).filter(Investigation.id == investigation_id).first()
        if not inv:
            raise HTTPException(status_code=404, detail=f"Investigation with ID {investigation_id} not found.")

        version = cls._get_next_version(db, investigation_id)
        
        # Serialize contract
        structured_json = json.dumps(contract.model_dump(), default=str)

        analysis = InvestigationAnalysis(
            investigation_id=investigation_id,
            version=version,
            status=status,
            requested_methods=requested_methods,
            structured_output_json=structured_json,
            user_edits_json=None,
            confirmed_root_cause=None,
            is_confirmed_by_human=0,
            model_identifier=settings.GROQ_MODEL,
            prompt_version="v2.0",
            error_summary=error_summary,
            completed_at=datetime.now(timezone.utc) if status != "pending" else None,
        )

        db.add(analysis)
        db.commit()
        db.refresh(analysis)
        logger.info("Saved InvestigationAnalysis v%s for investigation %s", version, investigation_id)
        return analysis

    @classmethod
    def get_latest_analysis(cls, db: Session, investigation_id: int) -> Optional[InvestigationAnalysis]:
        """Retrieves the most recent analysis version for an investigation."""
        return (
            db.query(InvestigationAnalysis)
            .filter(InvestigationAnalysis.investigation_id == investigation_id)
            .order_by(desc(InvestigationAnalysis.version))
            .first()
        )

    @classmethod
    def get_analysis_history(cls, db: Session, investigation_id: int) -> List[InvestigationAnalysis]:
        """Retrieves all prior analysis versions for an investigation."""
        return (
            db.query(InvestigationAnalysis)
            .filter(InvestigationAnalysis.investigation_id == investigation_id)
            .order_by(desc(InvestigationAnalysis.version))
            .all()
        )

    @classmethod
    def update_analysis_review(
        cls,
        db: Session,
        analysis_id: int,
        update_data: AnalysisUpdateRequest,
    ) -> InvestigationAnalysis:
        """
        Updates human review state and edits without overwriting the original AI-generated output.
        """
        analysis = db.query(InvestigationAnalysis).filter(InvestigationAnalysis.id == analysis_id).first()
        if not analysis:
            raise HTTPException(status_code=404, detail=f"Analysis with ID {analysis_id} not found.")

        if update_data.confirmed_root_cause is not None:
            analysis.confirmed_root_cause = update_data.confirmed_root_cause
        if update_data.is_confirmed_by_human is not None:
            analysis.is_confirmed_by_human = 1 if update_data.is_confirmed_by_human else 0
        if update_data.user_edits_json is not None:
            analysis.user_edits_json = update_data.user_edits_json

        db.commit()
        db.refresh(analysis)
        return analysis

    @staticmethod
    def to_response_dto(analysis: InvestigationAnalysis) -> AnalysisResponse:
        """Transforms ORM model to validated Pydantic response DTO."""
        raw_output = json.loads(analysis.structured_output_json)
        contract = InvestigationAIAnalysisContract(**raw_output)

        user_edits = None
        if analysis.user_edits_json:
            try:
                user_edits = json.loads(analysis.user_edits_json)
            except Exception:
                pass

        return AnalysisResponse(
            id=analysis.id,
            investigation_id=analysis.investigation_id,
            version=analysis.version,
            status=analysis.status,
            requested_methods=analysis.requested_methods,
            structured_output=contract,
            user_edits=user_edits,
            confirmed_root_cause=analysis.confirmed_root_cause,
            is_confirmed_by_human=bool(analysis.is_confirmed_by_human == 1),
            model_identifier=analysis.model_identifier,
            prompt_version=analysis.prompt_version,
            created_at=analysis.created_at,
            completed_at=analysis.completed_at,
        )
