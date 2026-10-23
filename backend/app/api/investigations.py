from typing import List, Optional
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.schemas.investigation import (
    InvestigationCreate,
    InvestigationUpdate,
    InvestigationResponse,
    InvestigationSummary,
    DashboardMetricsResponse,
)
from app.services.investigation_service import InvestigationService

router = APIRouter(prefix="/investigations", tags=["Investigations"])

@router.get("/metrics", response_model=DashboardMetricsResponse)
def get_dashboard_metrics(db: Session = Depends(get_db)):
    """Retrieve actual aggregate metrics for dashboard summary cards."""
    return InvestigationService.get_dashboard_metrics(db)

@router.post("", response_model=InvestigationResponse, status_code=status.HTTP_201_CREATED)
def create_investigation(
    payload: InvestigationCreate,
    db: Session = Depends(get_db)
):
    """Create a new pharmaceutical investigation record."""
    return InvestigationService.create_investigation(db, payload)

@router.get("", response_model=List[InvestigationSummary])
def list_investigations(
    search: Optional[str] = Query(None, description="Search by ID, title, deviation ref, batch or product"),
    status: Optional[str] = Query(None, description="Filter by workflow status: Draft, In Review, Completed"),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    db: Session = Depends(get_db)
):
    """Retrieve paginated investigations with search and status filtering."""
    results, _ = InvestigationService.get_investigations(db, search=search, status=status, skip=skip, limit=limit)
    summaries = []
    for inv in results:
        summaries.append(
            InvestigationSummary(
                id=inv.id,
                investigation_id=inv.investigation_id,
                title=inv.title,
                incident_reference=inv.incident_reference,
                status=inv.status,
                product_name=inv.product_name,
                batch_number=inv.batch_number,
                incident_category=inv.incident_category,
                process_step=inv.process_step,
                has_unresolved_gaps=inv.has_unresolved_gaps,
                created_at=inv.created_at,
                updated_at=inv.updated_at,
                source_documents_count=len(inv.source_documents),
            )
        )
    return summaries

@router.get("/{id_or_code}", response_model=InvestigationResponse)
def get_investigation(
    id_or_code: str,
    db: Session = Depends(get_db)
):
    """Retrieve full details of a specific investigation including linked sources."""
    return InvestigationService.get_investigation_by_id(db, id_or_code)

@router.patch("/{id_or_code}", response_model=InvestigationResponse)
def update_investigation(
    id_or_code: str,
    payload: InvestigationUpdate,
    db: Session = Depends(get_db)
):
    """Update editable investigation fields."""
    return InvestigationService.update_investigation(db, id_or_code, payload)

@router.delete("/{id_or_code}", status_code=status.HTTP_204_NO_CONTENT)
def delete_investigation(
    id_or_code: str,
    db: Session = Depends(get_db)
):
    """Safely delete an investigation and associated sources."""
    InvestigationService.delete_investigation(db, id_or_code)
    return None
