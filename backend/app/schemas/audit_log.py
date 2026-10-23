from datetime import datetime
from typing import Optional, Dict, Any
from pydantic import BaseModel, ConfigDict

class InvestigationAuditLogResponse(BaseModel):
    id: int
    investigation_id: int
    event_type: str
    actor: str
    entity_type: Optional[str] = None
    entity_id: Optional[str] = None
    action_summary: str
    details_json: Optional[str] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
