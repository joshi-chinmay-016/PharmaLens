import logging
from typing import Dict, Any, Optional
from sqlalchemy.orm import Session
from fastapi import HTTPException, status

from app.core.config import settings
from app.models.investigation import Investigation
from app.models.source_document import SourceDocument
from app.ai.state import InvestigationGraphState
from app.ai.graph import investigation_graph
from app.ai.config import GroqClientManager
from app.ai.persistence import AnalysisPersistenceService
from app.schemas.ai_contract import (
    InvestigationAIAnalysisContract,
    AnalysisResponse,
    RunAnalysisRequest,
)

logger = logging.getLogger("pharmalens.ai.orchestrator")

class AIOrchestrator:
    @classmethod
    def run_investigation_analysis(
        cls,
        db: Session,
        investigation_id: int,
        request: Optional[RunAnalysisRequest] = None,
    ) -> AnalysisResponse:
        """
        Executes the LangGraph analysis workflow for an existing investigation.
        Loads associated sources, normalizes context, executes sequential nodes,
        validates output contracts, and records versioned results in PostgreSQL.
        """
        # 1. Verify Groq API configuration
        if not GroqClientManager.is_configured():
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Groq AI API is not configured on the backend. Please configure GROQ_API_KEY in the server environment."
            )

        # 2. Retrieve investigation record
        inv = db.query(Investigation).filter(Investigation.id == investigation_id).first()
        if not inv:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Investigation with ID {investigation_id} not found."
            )

        # 3. Retrieve associated source documents
        sources = db.query(SourceDocument).filter(SourceDocument.investigation_id == investigation_id).all()

        # 4. Check for usable content
        has_inv_text = bool(
            (inv.incident_description and len(inv.incident_description.strip()) > 5)
            or (inv.title and len(inv.title.strip()) > 5)
            or (inv.actual_result and len(inv.actual_result.strip()) > 0)
        )
        has_source_text = any(bool(s.extracted_text and len(s.extracted_text.strip()) > 5) for s in sources)

        if not has_inv_text and not has_source_text:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="The investigation contains no incident details, observed results, or readable source documents. Please provide incident information before running AI analysis."
            )

        # 5. Build investigation snapshot (safe dictionary)
        inv_snapshot = {
            "id": inv.id,
            "investigation_id": inv.investigation_id,
            "title": inv.title,
            "incident_reference": inv.incident_reference,
            "incident_description": inv.incident_description,
            "product_name": inv.product_name,
            "batch_number": inv.batch_number,
            "manufacturing_site": inv.manufacturing_site,
            "process_step": inv.process_step,
            "incident_category": inv.incident_category,
            "actual_result": inv.actual_result,
            "acceptance_criterion": inv.acceptance_criterion,
            "expected_result": inv.expected_result,
            "immediate_impact": inv.immediate_impact,
            "immediate_containment": inv.immediate_containment,
            "reporter_name": inv.reporter_name,
            "known_facts": inv.known_facts,
            "initial_observations": inv.initial_observations,
            "evidence_available": inv.evidence_available,
            "investigation_notes": inv.investigation_notes,
        }

        source_docs_list = [
            {
                "id": s.id,
                "source_id": s.source_id,
                "source_type": s.source_type,
                "original_filename": s.original_filename,
                "extracted_text": s.extracted_text,
                "extraction_status": s.extraction_status,
            }
            for s in sources
        ]

        req = request or RunAnalysisRequest()

        initial_state: InvestigationGraphState = {
            "investigation_id": inv.id,
            "investigation_snapshot": inv_snapshot,
            "source_documents": source_docs_list,
            "source_texts": [s["extracted_text"] for s in source_docs_list if s.get("extracted_text")],
            "source_manifest": [],
            "normalized_source_context": "",
            "include_five_whys": req.include_five_whys,
            "include_fishbone": req.include_fishbone,
            "include_capa": req.include_capa,
            "extracted_facts": [],
            "validation_issues": [],
            "missing_fields": [],
            "evidence_gaps": [],
            "potential_root_causes": [],
            "contributing_factors": [],
            "five_whys": None,
            "fishbone_analysis": None,
            "capa_recommendations": [],
            "provenance_sources": [],
            "analysis_warnings": [],
            "execution_status": "running",
            "failed_nodes": [],
            "model_metadata": {},
            "analysis_version": 1,
        }

        # 6. Execute LangGraph workflow
        logger.info("Executing LangGraph investigation workflow for ID %s...", investigation_id)
        from app.services.audit_service import AuditLogService

        try:
            final_state = investigation_graph.invoke(initial_state)
        except Exception as e:
            error_cls = type(e).__name__
            error_msg = str(e)
            logger.error("LangGraph execution failure (%s): %s", error_cls, error_msg)

            # Classify error safely for client
            user_safe_message = "AI analysis workflow encountered an error during reasoning execution."
            if "rate limit" in error_msg.lower() or "429" in error_msg:
                user_safe_message = "Groq AI rate limit exceeded. Please retry in a few moments."
            elif "timeout" in error_msg.lower():
                user_safe_message = "AI model inference timed out. Please retry with a shorter context or selected RCA method."
            elif "authentication" in error_msg.lower() or "401" in error_msg or "api key" in error_msg.lower():
                user_safe_message = "AI provider authentication failed. Check GROQ_API_KEY configuration."
            elif "validation" in error_msg.lower():
                user_safe_message = "Structured reasoning validation failed against the pharmaceutical RCA contract."

            # Append audit event for failed execution without exposing secrets or stack traces
            AuditLogService.log_event(
                db=db,
                investigation_id=inv.id,
                event_type="analysis_failed",
                actor="System AI Engine",
                entity_type="investigation_analysis",
                action_summary=f"AI analysis execution failed: {user_safe_message}",
                details={"error_class": error_cls, "summary": user_safe_message},
                commit=True,
            )

            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=user_safe_message
            )

        # 7. Construct validated Pydantic output contract
        contract = InvestigationAIAnalysisContract(
            investigation_id=inv.id,
            extracted_facts=final_state.get("extracted_facts", []),
            missing_fields=final_state.get("missing_fields", []),
            evidence_gaps=final_state.get("evidence_gaps", []),
            potential_root_causes=final_state.get("potential_root_causes", []),
            contributing_factors=final_state.get("contributing_factors", []),
            five_whys=final_state.get("five_whys"),
            fishbone=final_state.get("fishbone_analysis"),
            capa_recommendations=final_state.get("capa_recommendations", []),
            analysis_warnings=final_state.get("analysis_warnings", []),
            provenance_sources=final_state.get("provenance_sources", []),
            model_metadata=final_state.get("model_metadata", {}),
        )

        # Determine method label
        methods_label = "full"
        if not req.include_five_whys and not req.include_fishbone:
            methods_label = "facts_and_gaps"
        elif req.include_five_whys and not req.include_fishbone:
            methods_label = "five_whys"
        elif req.include_fishbone and not req.include_five_whys:
            methods_label = "fishbone"

        # Check if graph execution failed due to provider errors across nodes
        exec_status = final_state.get("execution_status", "completed")
        if exec_status == "failed":
            failed_list = final_state.get("failed_nodes", [])
            warnings_list = final_state.get("analysis_warnings", [])
            warnings_text = " ".join(warnings_list).lower()

            detail_msg = "AI reasoning engine failed to complete analysis due to provider inference errors across multiple nodes."
            if "rate limit" in warnings_text or "429" in warnings_text:
                detail_msg = "Groq AI rate limit reached. Please retry in a few moments."
            elif "timeout" in warnings_text:
                detail_msg = "AI model inference timed out. Please retry with selected RCA methods."
            elif "auth" in warnings_text or "key" in warnings_text:
                detail_msg = "AI provider authentication failed. Check GROQ_API_KEY configuration."

            AuditLogService.log_event(
                db=db,
                investigation_id=inv.id,
                event_type="analysis_failed",
                actor="System AI Engine",
                entity_type="investigation_analysis",
                action_summary=f"AI reasoning workflow failed: {detail_msg}",
                details={"failed_nodes": failed_list, "summary": detail_msg},
                commit=True,
            )
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=detail_msg
            )

        # 8. Persist versioned analysis record
        saved_record = AnalysisPersistenceService.save_analysis(
            db=db,
            investigation_id=inv.id,
            contract=contract,
            requested_methods=methods_label,
            status=exec_status,
        )

        # 9. Transition status to 'AI Analysis Available' if currently in Draft or Under Investigation
        if inv.status in ("Draft", "Under Investigation"):
            old_status = inv.status
            inv.status = "AI Analysis Available"
            AuditLogService.log_event(
                db=db,
                investigation_id=inv.id,
                event_type="investigation_status_changed",
                actor="System AI Engine",
                entity_type="investigation",
                entity_id=inv.investigation_id,
                action_summary=f"Investigation status automatically updated from '{old_status}' to 'AI Analysis Available'",
                details={"previous_status": old_status, "new_status": "AI Analysis Available"},
                commit=False,
            )
            db.commit()
            db.refresh(inv)

        # 10. Audit log for analysis completion
        AuditLogService.log_event(
            db=db,
            investigation_id=inv.id,
            event_type="analysis_completed",
            actor="System AI Engine",
            entity_type="investigation_analysis",
            entity_id=str(saved_record.id),
            action_summary=f"AI analysis completed successfully (Version {saved_record.version}, methods: {methods_label})",
            details={
                "version": saved_record.version,
                "model": settings.GROQ_MODEL,
                "methods": methods_label,
                "facts_count": len(contract.extracted_facts),
                "causes_count": len(contract.potential_root_causes),
                "capa_count": len(contract.capa_recommendations),
            },
            commit=True,
        )

        return AnalysisPersistenceService.to_response_dto(saved_record)
