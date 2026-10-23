from datetime import datetime
from typing import List, Optional, Tuple, Set, Dict
from sqlalchemy.orm import Session
from sqlalchemy import or_, func, desc
from fastapi import HTTPException
from app.models.investigation import Investigation
from app.models.source_document import SourceDocument
from app.schemas.investigation import (
    InvestigationCreate,
    InvestigationUpdate,
    DashboardMetricsResponse,
)
from app.services.audit_service import AuditLogService

VALID_STATUSES: Set[str] = {
    "Draft",
    "Under Investigation",
    "AI Analysis Available",
    "In Review",
    "Completed",
}

ALLOWED_TRANSITIONS: Dict[str, Set[str]] = {
    "Draft": {"Under Investigation", "AI Analysis Available", "In Review"},
    "Under Investigation": {"Draft", "AI Analysis Available", "In Review"},
    "AI Analysis Available": {"Under Investigation", "In Review"},
    "In Review": {"Under Investigation", "AI Analysis Available", "Completed"},
    "Completed": set(),  # Completed cannot transition directly; requires explicit reopen
}

class InvestigationService:
    @staticmethod
    def _generate_investigation_id(db: Session) -> str:
        current_year = datetime.now().year
        prefix = f"INV-{current_year}-"
        
        latest = (
            db.query(Investigation)
            .filter(Investigation.investigation_id.like(f"{prefix}%"))
            .order_by(desc(Investigation.id))
            .first()
        )
        
        if latest and latest.investigation_id:
            try:
                last_seq = int(latest.investigation_id.split("-")[-1])
                next_seq = last_seq + 1
            except ValueError:
                next_seq = 1
        else:
            total = db.query(Investigation).count()
            next_seq = total + 1
            
        return f"{prefix}{next_seq:04d}"

    @classmethod
    def _validate_completion_criteria(
        cls, db: Session, inv: Investigation, justification: Optional[str] = None
    ):
        """
        Ensures mandatory human review and quality requirements are met before completing.
        Must be in 'In Review', have reviewed/confirmed findings, and no unresolved blocking gaps.
        """
        if inv.status.lower() != "in review":
            raise HTTPException(
                status_code=400,
                detail=f"Investigation must be 'In Review' before completion. Current status is '{inv.status}'."
            )

        # Check for confirmed root causes or documented disposition
        has_confirmed_cause = False
        for a in inv.analyses:
            if a.is_confirmed_by_human == 1 or (a.confirmed_root_cause and len(a.confirmed_root_cause.strip()) > 3):
                has_confirmed_cause = True
                break

        if not has_confirmed_cause and inv.known_facts and len(inv.known_facts.strip()) > 10:
            has_confirmed_cause = True

        if not has_confirmed_cause and not (justification and len(justification.strip()) >= 5):
            raise HTTPException(
                status_code=400,
                detail="Cannot complete investigation without a human-reviewed root cause or documented QA disposition rationale."
            )

        # Check unresolved gaps
        if inv.has_unresolved_gaps and not (justification and len(justification.strip()) >= 5):
            raise HTTPException(
                status_code=400,
                detail="Cannot complete investigation while critical evidence gaps remain unresolved without explicit QA justification."
            )

    @classmethod
    def validate_transition(
        cls,
        db: Session,
        inv: Investigation,
        target_status: str,
        justification: Optional[str] = None,
    ):
        """Validates that a status change adheres to allowed lifecycle transitions."""
        # Normalize status formatting
        normalized_target = None
        for s in VALID_STATUSES:
            if s.lower() == target_status.strip().lower():
                normalized_target = s
                break

        if not normalized_target:
            valid_list = ", ".join(sorted(list(VALID_STATUSES)))
            raise HTTPException(
                status_code=400,
                detail=f"Invalid status '{target_status}'. Must be one of: {valid_list}."
            )

        if inv.status == normalized_target:
            return normalized_target

        if inv.status == "Completed":
            raise HTTPException(
                status_code=400,
                detail="Investigation is Completed and locked. To make modifications, perform an explicit Reopen action."
            )

        allowed = ALLOWED_TRANSITIONS.get(inv.status, set())
        if normalized_target not in allowed:
            allowed_str = ", ".join(sorted(list(allowed))) if allowed else "None (Locked)"
            raise HTTPException(
                status_code=400,
                detail=f"Invalid transition from '{inv.status}' to '{normalized_target}'. Allowed transitions: {allowed_str}."
            )

        if normalized_target == "Completed":
            cls._validate_completion_criteria(db, inv, justification)

        return normalized_target

    @classmethod
    def create_investigation(cls, db: Session, obj_in: InvestigationCreate) -> Investigation:
        investigation_id = cls._generate_investigation_id(db)
        data = obj_in.model_dump(exclude={"source_document_ids"})
        
        # Evidence before conclusions: calculate if key evidence is missing
        if data.get("has_unresolved_gaps") is None or not data.get("has_unresolved_gaps"):
            missing_critical = (
                not data.get("batch_number")
                or not data.get("actual_result")
                or not data.get("acceptance_criterion")
            )
            data["has_unresolved_gaps"] = missing_critical

        # Default initial status
        if not data.get("status") or data["status"] not in VALID_STATUSES:
            data["status"] = "Draft"

        investigation = Investigation(
            investigation_id=investigation_id,
            **data
        )
        db.add(investigation)
        db.flush()

        # Associate source documents if provided
        associated_count = 0
        if obj_in.source_document_ids:
            docs = (
                db.query(SourceDocument)
                .filter(SourceDocument.id.in_(obj_in.source_document_ids))
                .all()
            )
            for doc in docs:
                doc.investigation_id = investigation.id
                associated_count += 1

        # Record audit event for investigation creation
        AuditLogService.log_event(
            db=db,
            investigation_id=investigation.id,
            event_type="investigation_created",
            actor=obj_in.reporter_name or "QA Lead Investigator",
            entity_type="investigation",
            entity_id=investigation.investigation_id,
            action_summary=f"Investigation created: '{investigation.title}' ({investigation.investigation_id})",
            details={
                "title": investigation.title,
                "incident_reference": investigation.incident_reference,
                "batch_number": investigation.batch_number,
                "status": investigation.status,
                "sources_associated": associated_count,
            },
            commit=False,
        )

        db.commit()
        db.refresh(investigation)
        return investigation

    @classmethod
    def get_investigations(
        cls,
        db: Session,
        search: Optional[str] = None,
        status: Optional[str] = None,
        skip: int = 0,
        limit: int = 100
    ) -> Tuple[List[Investigation], int]:
        query = db.query(Investigation)
        
        if status and status.lower() != "all":
            query = query.filter(func.lower(Investigation.status) == status.lower())
            
        if search:
            search_term = f"%{search.strip()}%"
            query = query.filter(
                or_(
                    Investigation.investigation_id.ilike(search_term),
                    Investigation.title.ilike(search_term),
                    Investigation.incident_reference.ilike(search_term),
                    Investigation.batch_number.ilike(search_term),
                    Investigation.product_name.ilike(search_term),
                    Investigation.incident_category.ilike(search_term),
                )
            )
            
        total = query.count()
        results = query.order_by(desc(Investigation.created_at)).offset(skip).limit(limit).all()
        return results, total

    @classmethod
    def get_investigation_by_id(cls, db: Session, id_or_code: str) -> Investigation:
        if id_or_code.isdigit():
            inv = db.query(Investigation).filter(Investigation.id == int(id_or_code)).first()
        else:
            inv = db.query(Investigation).filter(Investigation.investigation_id == id_or_code).first()
            
        if not inv:
            raise HTTPException(
                status_code=404,
                detail=f"Investigation '{id_or_code}' not found."
            )
        return inv

    @classmethod
    def update_investigation(
        cls,
        db: Session,
        id_or_code: str,
        obj_in: InvestigationUpdate,
        actor: str = "QA Lead Investigator"
    ) -> Investigation:
        inv = cls.get_investigation_by_id(db, id_or_code)
        
        # Completed investigations are locked against editing
        if inv.status == "Completed":
            raise HTTPException(
                status_code=400,
                detail="Completed investigations are locked against direct edits. Please use the explicit Reopen workflow to modify this investigation."
            )

        update_dict = obj_in.model_dump(exclude_unset=True)
        changed_fields = {}
        old_status = inv.status

        # If status is changing, validate transition
        if "status" in update_dict and update_dict["status"] != inv.status:
            new_status = cls.validate_transition(db, inv, update_dict["status"])
            update_dict["status"] = new_status
            changed_fields["status"] = {"old": old_status, "new": new_status}

        for field, value in update_dict.items():
            old_val = getattr(inv, field, None)
            if old_val != value:
                changed_fields[field] = {"old": str(old_val)[:100], "new": str(value)[:100]}
                setattr(inv, field, value)
            
        if changed_fields:
            if "status" in changed_fields:
                event_type = "investigation_completed" if inv.status == "Completed" else "investigation_status_changed"
                summary = f"Status transitioned from '{old_status}' to '{inv.status}'"
            else:
                event_type = "investigation_updated"
                summary = f"Updated {len(changed_fields)} investigation fields: {', '.join(list(changed_fields.keys())[:5])}"

            AuditLogService.log_event(
                db=db,
                investigation_id=inv.id,
                event_type=event_type,
                actor=actor,
                entity_type="investigation",
                entity_id=inv.investigation_id,
                action_summary=summary,
                details={"changed_fields": changed_fields},
                commit=False,
            )

        db.commit()
        db.refresh(inv)
        return inv

    @classmethod
    def transition_investigation(
        cls,
        db: Session,
        id_or_code: str,
        target_status: str,
        justification: Optional[str] = None,
        actor: str = "QA Lead Investigator"
    ) -> Investigation:
        """Explicit workflow state transition with validation and audit logging."""
        inv = cls.get_investigation_by_id(db, id_or_code)
        old_status = inv.status
        new_status = cls.validate_transition(db, inv, target_status, justification=justification)

        inv.status = new_status
        event_type = "investigation_completed" if new_status == "Completed" else "investigation_status_changed"
        summary = f"Investigation status transitioned from '{old_status}' to '{new_status}'"
        if justification:
            summary += f" (Justification: {justification})"

        AuditLogService.log_event(
            db=db,
            investigation_id=inv.id,
            event_type=event_type,
            actor=actor,
            entity_type="investigation",
            entity_id=inv.investigation_id,
            action_summary=summary,
            details={
                "previous_status": old_status,
                "new_status": new_status,
                "justification": justification,
            },
            commit=False,
        )

        db.commit()
        db.refresh(inv)
        return inv

    @classmethod
    def reopen_investigation(
        cls,
        db: Session,
        id_or_code: str,
        reason: str,
        target_status: str = "In Review",
        actor: str = "QA Lead Investigator"
    ) -> Investigation:
        """
        Reopens a Completed investigation with mandatory regulatory/quality justification.
        Transitions status back to In Review or Under Investigation and appends audit log.
        """
        inv = cls.get_investigation_by_id(db, id_or_code)
        if inv.status != "Completed":
            raise HTTPException(
                status_code=400,
                detail=f"Only Completed investigations can be reopened. Current status is '{inv.status}'."
            )

        if not reason or len(reason.strip()) < 5:
            raise HTTPException(
                status_code=400,
                detail="A valid documented justification (at least 5 characters) is required to reopen an investigation."
            )

        valid_targets = {"In Review", "Under Investigation", "Draft"}
        norm_target = None
        for t in valid_targets:
            if t.lower() == target_status.strip().lower():
                norm_target = t
                break
        if not norm_target:
            norm_target = "In Review"

        old_status = inv.status
        inv.status = norm_target

        AuditLogService.log_event(
            db=db,
            investigation_id=inv.id,
            event_type="investigation_reopened",
            actor=actor,
            entity_type="investigation",
            entity_id=inv.investigation_id,
            action_summary=f"Investigation reopened from Completed to '{norm_target}' - Reason: {reason}",
            details={
                "previous_status": old_status,
                "new_status": norm_target,
                "reopen_reason": reason,
            },
            commit=False,
        )

        db.commit()
        db.refresh(inv)
        return inv

    @classmethod
    def delete_investigation(cls, db: Session, id_or_code: str) -> bool:
        inv = cls.get_investigation_by_id(db, id_or_code)
        if inv.status == "Completed":
            raise HTTPException(
                status_code=400,
                detail="Completed investigations cannot be deleted. Compliance records must be preserved."
            )
        db.delete(inv)
        db.commit()
        return True

    @classmethod
    def get_dashboard_metrics(cls, db: Session) -> DashboardMetricsResponse:
        total = db.query(Investigation).count()
        drafts = db.query(Investigation).filter(func.lower(Investigation.status) == "draft").count()
        under_inv = db.query(Investigation).filter(func.lower(Investigation.status) == "under investigation").count()
        ai_available = db.query(Investigation).filter(func.lower(Investigation.status) == "ai analysis available").count()
        in_review = db.query(Investigation).filter(func.lower(Investigation.status) == "in review").count()
        unresolved_gaps = db.query(Investigation).filter(Investigation.has_unresolved_gaps == True).count()
        completed = db.query(Investigation).filter(func.lower(Investigation.status) == "completed").count()

        return DashboardMetricsResponse(
            total_investigations=total,
            draft_investigations=drafts,
            in_review_investigations=in_review,
            unresolved_gaps_count=unresolved_gaps,
            completed_investigations=completed,
            under_investigation_count=under_inv,
            ai_available_count=ai_available,
        )
