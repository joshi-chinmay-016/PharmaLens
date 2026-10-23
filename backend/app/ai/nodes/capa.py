import logging
from typing import Dict, Any, List
from app.ai.state import InvestigationGraphState
from app.ai.config import GroqClientManager
from app.ai.prompts import CAPA_SYSTEM_PROMPT

logger = logging.getLogger("pharmalens.ai.capa")

def capa_node(state: InvestigationGraphState) -> Dict[str, Any]:
    """
    Node 8: Intelligent CAPA Recommendation Generator.
    Categorizes proposals into Containment, Corrective Actions, and Preventive Actions with effectiveness criteria.
    """
    if not state.get("include_capa", True):
        return {"capa_recommendations": []}

    context = state.get("normalized_source_context", "")
    causes = state.get("potential_root_causes", [])
    gaps = state.get("evidence_gaps", [])
    warnings = list(state.get("analysis_warnings", []))
    failed_nodes = list(state.get("failed_nodes", []))

    user_prompt = (
        f"Formulate structured CAPA recommendations for this deviation:\n\n"
        f"Context & Evidence:\n{context}\n\n"
        f"Identified Cause Hypotheses: {[c.get('title', '') for c in causes[:3]]}\n"
        f"Evidence Gaps Requiring Action: {[g.get('description', '') for g in gaps[:3]]}"
    )

    capa_recommendations: List[Dict[str, Any]] = []

    try:
        response_json = GroqClientManager.generate_chat_json(
            system_prompt=CAPA_SYSTEM_PROMPT,
            user_prompt=user_prompt,
        )
        capa_recommendations = response_json.get("capa_recommendations", [])

        # Quality Assurance Post-Processing: ensure status is strictly Proposed
        for capa in capa_recommendations:
            capa["human_approval_status"] = "Proposed"

    except Exception as e:
        logger.warning("CAPA node fallback due to error: %s", str(e))
        warnings.append(f"CAPA recommendation warning: {str(e)}")
        failed_nodes.append("capa")

        # Deterministic domain-appropriate CAPA recommendations
        capa_recommendations = [
            {
                "action_id": "CAPA-01",
                "action_type": "Correction / Containment",
                "title": "Quarantine Affected Lot & Re-Sample API-2026-014",
                "description": (
                    "Maintain physical and electronic ERP hold QA-Q-881 on batch API-2026-014. "
                    "Execute secondary representative stratified sampling across all dryer trays under QA supervision."
                ),
                "rationale": "Immediate containment prevents unintended release and provides representative re-test material.",
                "target_root_cause_or_gap": "Immediate batch release risk",
                "expected_outcome": "Complete segregation of affected material pending investigation resolution.",
                "suggested_owner_role": "QA Warehouse / Quality Control Lead",
                "suggested_priority": "High",
                "effectiveness_check_method": "Verify electronic ERP quarantine lock active and physical quarantine tags intact.",
                "evidence_needed_for_closure": "Quarantine log entry and verified sampling protocol record.",
                "human_approval_status": "Proposed",
            },
            {
                "action_id": "CAPA-02",
                "action_type": "Corrective Action",
                "title": "Execute Vacuum Line Leak-Rate Test and Sensor Re-Calibration",
                "description": (
                    "Perform helium or pressure-rise leak test on vacuum tray dryer unit 2 vacuum line, seals, and isolation valves. "
                    "Re-calibrate pressure transmitter and multi-point shelf temperature probes against NIST-traceable standards."
                ),
                "rationale": "Directly resolves mechanical vulnerability identified in PRC-01 and GAP-02.",
                "target_root_cause_or_gap": "PRC-01: Vacuum pressure loss / GAP-02: Sensor calibration",
                "expected_outcome": "Restoration of validated vacuum holding capacity and verified sensor accuracy.",
                "suggested_owner_role": "Manufacturing Maintenance & Calibration Lead",
                "suggested_priority": "High",
                "effectiveness_check_method": "Leak rate < 0.5 mbar/min over 30-minute hold test prior to next batch release.",
                "evidence_needed_for_closure": "Maintenance completion ticket and calibration certificates.",
                "human_approval_status": "Proposed",
            },
            {
                "action_id": "CAPA-03",
                "action_type": "Preventive Action",
                "title": "Implement Continuous SCADA Vacuum Fluctuation Alarm Interlock",
                "description": (
                    "Configure SCADA recipe interlock on all API tray dryers to automatically alert operators and trigger audit events "
                    "if vacuum levels deviate > 10% from validated profile for more than 15 consecutive minutes."
                ),
                "rationale": "Prevents recurrence across all similar production lines by providing automated in-process detection.",
                "target_root_cause_or_gap": "PRC-01: Unnoticed vacuum profile fluctuations",
                "expected_outcome": "Zero unmonitored vacuum profile drifts during API drying cycles across the facility.",
                "suggested_owner_role": "Automation Engineering / Quality Assurance Validation",
                "suggested_priority": "Medium",
                "effectiveness_check_method": "Review SCADA trend alarms across next 5 consecutive production batches on all dryer units.",
                "evidence_needed_for_closure": "Engineering change control signoff and alarm challenge test protocol.",
                "human_approval_status": "Proposed",
            }
        ]

    return {
        "capa_recommendations": capa_recommendations,
        "analysis_warnings": warnings,
        "failed_nodes": failed_nodes,
    }
