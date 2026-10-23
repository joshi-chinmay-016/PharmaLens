from datetime import datetime
from typing import List, Optional, Tuple
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

class InvestigationService:
    @staticmethod
    def _generate_investigation_id(db: Session) -> str:
        current_year = datetime.now().year
        prefix = f"INV-{current_year}-"
        
        # Find latest investigation for current year
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
            # Fallback to total count + 1
            total = db.query(Investigation).count()
            next_seq = total + 1
            
        return f"{prefix}{next_seq:04d}"

    @classmethod
    def create_investigation(cls, db: Session, obj_in: InvestigationCreate) -> Investigation:
        investigation_id = cls._generate_investigation_id(db)
        data = obj_in.model_dump(exclude={"source_document_ids"})
        
        # Evidence before conclusions: calculate if key evidence is missing
        if data.get("has_unresolved_gaps") is None or not data.get("has_unresolved_gaps"):
            # Check if critical parameters are absent
            missing_critical = (
                not data.get("batch_number")
                or not data.get("actual_result")
                or not data.get("acceptance_criterion")
            )
            data["has_unresolved_gaps"] = missing_critical

        investigation = Investigation(
            investigation_id=investigation_id,
            **data
        )
        db.add(investigation)
        db.commit()
        db.refresh(investigation)

        # Associate source documents if provided
        if obj_in.source_document_ids:
            docs = (
                db.query(SourceDocument)
                .filter(SourceDocument.id.in_(obj_in.source_document_ids))
                .all()
            )
            for doc in docs:
                doc.investigation_id = investigation.id
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
        obj_in: InvestigationUpdate
    ) -> Investigation:
        inv = cls.get_investigation_by_id(db, id_or_code)
        
        update_dict = obj_in.model_dump(exclude_unset=True)
        for field, value in update_dict.items():
            setattr(inv, field, value)
            
        db.commit()
        db.refresh(inv)
        return inv

    @classmethod
    def delete_investigation(cls, db: Session, id_or_code: str) -> bool:
        inv = cls.get_investigation_by_id(db, id_or_code)
        db.delete(inv)
        db.commit()
        return True

    @classmethod
    def get_dashboard_metrics(cls, db: Session) -> DashboardMetricsResponse:
        total = db.query(Investigation).count()
        drafts = db.query(Investigation).filter(func.lower(Investigation.status) == "draft").count()
        in_review = db.query(Investigation).filter(func.lower(Investigation.status) == "in review").count()
        unresolved_gaps = db.query(Investigation).filter(Investigation.has_unresolved_gaps == True).count()
        completed = db.query(Investigation).filter(func.lower(Investigation.status) == "completed").count()

        return DashboardMetricsResponse(
            total_investigations=total,
            draft_investigations=drafts,
            in_review_investigations=in_review,
            unresolved_gaps_count=unresolved_gaps,
            completed_investigations=completed,
        )
