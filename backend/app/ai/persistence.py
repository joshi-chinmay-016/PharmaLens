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
from app.services.audit_service import AuditLogService

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
        db.flush()

        # Audit log for version creation
        AuditLogService.log_event(
            db=db,
            investigation_id=investigation_id,
            event_type="analysis_version_created",
            actor="System AI Engine",
            entity_type="investigation_analysis",
            entity_id=str(analysis.id),
            action_summary=f"Analysis version {version} created (status: {status}, methods: {requested_methods})",
            details={
                "version": version,
                "model": settings.GROQ_MODEL,
                "methods": requested_methods,
                "facts_count": len(contract.extracted_facts),
                "causes_count": len(contract.potential_root_causes),
                "capa_count": len(contract.capa_recommendations),
            },
            commit=False,
        )

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
        actor: str = "QA Lead Investigator"
    ) -> InvestigationAnalysis:
        """
        Updates human review state and edits without overwriting the original AI-generated output.
        Records specific audit events for cause confirmations, rejections, gap resolutions, and CAPA reviews.
        """
        analysis = db.query(InvestigationAnalysis).filter(InvestigationAnalysis.id == analysis_id).first()
        if not analysis:
            raise HTTPException(status_code=404, detail=f"Analysis with ID {analysis_id} not found.")

        inv = db.query(Investigation).filter(Investigation.id == analysis.investigation_id).first()

        confirmed_cause_updated = False
        if update_data.confirmed_root_cause is not None:
            analysis.confirmed_root_cause = update_data.confirmed_root_cause
            confirmed_cause_updated = True

        is_confirmed = False
        if update_data.is_confirmed_by_human is not None:
            analysis.is_confirmed_by_human = 1 if update_data.is_confirmed_by_human else 0
            is_confirmed = bool(update_data.is_confirmed_by_human)

        if confirmed_cause_updated or update_data.is_confirmed_by_human is not None:
            if is_confirmed and analysis.confirmed_root_cause:
                summary = f"Human investigator confirmed root cause: '{analysis.confirmed_root_cause}'"
                event_type = "root_cause_accepted"
            else:
                summary = f"Root cause review status updated: confirmed={is_confirmed}"
                event_type = "root_cause_review_updated"

            AuditLogService.log_event(
                db=db,
                investigation_id=analysis.investigation_id,
                event_type=event_type,
                actor=actor,
                entity_type="investigation_analysis",
                entity_id=str(analysis.id),
                action_summary=summary,
                details={
                    "analysis_id": analysis.id,
                    "version": analysis.version,
                    "confirmed_root_cause": analysis.confirmed_root_cause,
                    "is_confirmed_by_human": is_confirmed,
                },
                commit=False,
            )

            # Move investigation to 'In Review' if currently 'AI Analysis Available'
            if inv and inv.status in ("Draft", "Under Investigation", "AI Analysis Available"):
                inv.status = "In Review"

        # Handle detailed user edits
        if update_data.user_edits_json is not None:
            analysis.user_edits_json = update_data.user_edits_json
            try:
                edits = json.loads(update_data.user_edits_json)
                if isinstance(edits, dict):
                    # Audit root causes reviewed
                    if "causes" in edits and isinstance(edits["causes"], list):
                        for c in edits["causes"]:
                            c_id = c.get("cause_id", "PRC")
                            status = c.get("review_status", "")
                            if status in ("accepted", "human_confirmed"):
                                AuditLogService.log_event(
                                    db=db,
                                    investigation_id=analysis.investigation_id,
                                    event_type="root_cause_accepted",
                                    actor=actor,
                                    entity_type="potential_root_cause",
                                    entity_id=c_id,
                                    action_summary=f"Hypothesis {c_id} accepted as finding: '{c.get('title', '')}'",
                                    details={"cause": c},
                                    commit=False,
                                )
                            elif status == "rejected":
                                AuditLogService.log_event(
                                    db=db,
                                    investigation_id=analysis.investigation_id,
                                    event_type="root_cause_rejected",
                                    actor=actor,
                                    entity_type="potential_root_cause",
                                    entity_id=c_id,
                                    action_summary=f"Hypothesis {c_id} rejected by investigator: '{c.get('title', '')}'",
                                    details={"cause": c},
                                    commit=False,
                                )

                    # Audit CAPAs reviewed
                    if "capas" in edits and isinstance(edits["capas"], list):
                        for capa in edits["capas"]:
                            c_id = capa.get("action_id", "CAPA")
                            appr = capa.get("human_approval_status", "")
                            if appr in ("Accepted", "Rejected", "Modified"):
                                AuditLogService.log_event(
                                    db=db,
                                    investigation_id=analysis.investigation_id,
                                    event_type="capa_recommendation_reviewed",
                                    actor=actor,
                                    entity_type="capa_recommendation",
                                    entity_id=c_id,
                                    action_summary=f"CAPA {c_id} ({capa.get('action_type', '')}) marked '{appr}'",
                                    details={"capa": capa},
                                    commit=False,
                                )

                    # Audit evidence gaps reviewed
                    if "gaps" in edits and isinstance(edits["gaps"], list):
                        for gap in edits["gaps"]:
                            g_id = gap.get("gap_id", "GAP")
                            g_status = gap.get("status", "")
                            if g_status in ("resolved", "risk_accepted"):
                                AuditLogService.log_event(
                                    db=db,
                                    investigation_id=analysis.investigation_id,
                                    event_type="evidence_gap_updated",
                                    actor=actor,
                                    entity_type="evidence_gap",
                                    entity_id=g_id,
                                    action_summary=f"Evidence gap {g_id} updated to status '{g_status}'",
                                    details={"gap": gap},
                                    commit=False,
                                )
            except Exception as e:
                logger.warning("Could not parse user_edits_json for detailed audit events: %s", str(e))

        db.commit()
        db.refresh(analysis)
        return analysis

    @classmethod
    def apply_fact_to_investigation(
        cls,
        db: Session,
        investigation_id: int,
        field_name: str,
        new_value: Any,
        reason: Optional[str] = None,
        source_id: Optional[str] = None,
        actor: str = "QA Lead Investigator"
    ) -> Investigation:
        """
        Applies a verified/corrected fact to the underlying investigation record with full provenance audit.
        Preserves distinction between AI extraction and human verification.
        """
        inv = db.query(Investigation).filter(Investigation.id == investigation_id).first()
        if not inv:
            raise HTTPException(status_code=404, detail=f"Investigation with ID {investigation_id} not found.")

        if inv.status == "Completed":
            raise HTTPException(status_code=400, detail="Cannot update fields on a Completed investigation.")

        if not hasattr(inv, field_name):
            raise HTTPException(status_code=400, detail=f"Field '{field_name}' does not exist on Investigation.")

        old_value = getattr(inv, field_name)
        setattr(inv, field_name, str(new_value) if new_value is not None else None)

        AuditLogService.log_event(
            db=db,
            investigation_id=inv.id,
            event_type="fact_corrected",
            actor=actor,
            entity_type="investigation_field",
            entity_id=field_name,
            action_summary=f"Fact applied to investigation field '{field_name}': '{old_value}' -> '{new_value}'",
            details={
                "field_name": field_name,
                "old_value": str(old_value),
                "new_value": str(new_value),
                "reason": reason or "Human reviewer approved extracted fact",
                "source_id": source_id,
            },
            commit=False,
        )

        db.commit()
        db.refresh(inv)
        return inv

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
