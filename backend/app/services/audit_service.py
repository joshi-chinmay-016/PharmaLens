import json
import logging
from typing import Optional, Dict, Any, List
from sqlalchemy.orm import Session
from sqlalchemy import desc
from app.models.audit_log import InvestigationAuditLog

logger = logging.getLogger("pharmalens.audit")

class AuditLogService:
    @staticmethod
    def log_event(
        db: Session,
        investigation_id: int,
        event_type: str,
        action_summary: str,
        actor: str = "QA Lead Investigator",
        entity_type: Optional[str] = None,
        entity_id: Optional[str] = None,
        details: Optional[Dict[str, Any]] = None,
        commit: bool = False,
    ) -> InvestigationAuditLog:
        """
        Records an append-only audit event in the same transaction as the business operation.
        Safely sanitizes details to prevent leaking secrets or excessive raw payloads.
        """
        details_str = None
        if details:
            # Filter out sensitive fields if present
            sanitized = {}
            for k, v in details.items():
                if "key" in k.lower() or "secret" in k.lower() or "password" in k.lower():
                    continue
                # Truncate very long string values (e.g. raw text > 500 chars)
                if isinstance(v, str) and len(v) > 500:
                    sanitized[k] = v[:500] + "... [truncated]"
                else:
                    sanitized[k] = v
            try:
                details_str = json.dumps(sanitized, default=str)
            except Exception:
                details_str = json.dumps({"note": "Failed to serialize details"})

        log_entry = InvestigationAuditLog(
            investigation_id=investigation_id,
            event_type=event_type,
            actor=actor,
            entity_type=entity_type,
            entity_id=str(entity_id) if entity_id is not None else None,
            action_summary=action_summary,
            details_json=details_str,
        )
        db.add(log_entry)
        if commit:
            db.commit()
            db.refresh(log_entry)
        logger.info(
            "Audit event recorded: [%s] on investigation %s by %s - %s",
            event_type,
            investigation_id,
            actor,
            action_summary,
        )
        return log_entry

    @staticmethod
    def get_audit_logs(
        db: Session,
        investigation_id: int,
        skip: int = 0,
        limit: int = 100,
    ) -> List[InvestigationAuditLog]:
        """Retrieves chronological audit logs for an investigation in descending order."""
        return (
            db.query(InvestigationAuditLog)
            .filter(InvestigationAuditLog.investigation_id == investigation_id)
            .order_by(desc(InvestigationAuditLog.created_at))
            .offset(skip)
            .limit(limit)
            .all()
        )
