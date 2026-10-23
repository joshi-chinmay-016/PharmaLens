import pytest
import json
from unittest.mock import patch
from app.ai.config import GroqClientManager


def mock_groq_demo_dispatcher(system_prompt: str, user_prompt: str, **kwargs):
    if "Extract structured facts" in system_prompt:
        return {
            "extracted_facts": [
                {
                    "field_name": "batch_number",
                    "extracted_value": "API-2026-014",
                    "confidence_score": 0.98,
                    "source_snippet": "Batch API-2026-014 exhibited residual solvent of 0.65%",
                    "source_id": "DEMO-SRC-01"
                },
                {
                    "field_name": "process_step",
                    "extracted_value": "Drying",
                    "confidence_score": 0.95,
                    "source_snippet": "Process step: Drying in vacuum tray dryer D-104",
                    "source_id": "DEMO-SRC-01"
                }
            ],
            "missing_fields": []
        }
    elif "evidence gaps" in system_prompt.lower():
        return {
            "evidence_gaps": [
                {
                    "gap_id": "GAP-01",
                    "category": "Process Instrumentation",
                    "description": "Vacuum condenser coolant temperature log between hours 04:00 and 08:00 is unverified.",
                    "recommended_evidence_to_obtain": "Retrieve SCADA coolant recirculator log for Dryer D-104.",
                    "why_it_matters": "Low coolant flow prevents solvent condensation and removal.",
                    "priority": "High"
                }
            ]
        }
    elif "potential root causes" in system_prompt.lower():
        return {
            "potential_root_causes": [
                {
                    "cause_id": "RC-01",
                    "title": "Sub-optimal Vacuum Condenser Cooling during Final 4 Hours of Drying Cycle",
                    "category": "machine",
                    "explanation": "Insufficient solvent recovery rate caused residual acetone retention on lower trays above the 0.50% specification limit.",
                    "supporting_excerpts": ["Condenser temperature trended up to 18C against 10C limit"],
                    "review_status": "unreviewed",
                    "is_confirmed_by_human": False,
                    "recommended_next_step": "Calibrate transmitter TT-104 and inspect chiller bypass valve."
                },
                {
                    "cause_id": "RC-02",
                    "title": "Uneven Cake Depth on Vacuum Tray Carts",
                    "category": "method",
                    "explanation": "Cake depth exceeded 35 mm limit leading to mass transfer limitation.",
                    "supporting_excerpts": [],
                    "review_status": "unreviewed",
                    "is_confirmed_by_human": False,
                    "recommended_next_step": "Review operator loading batch record sign-offs."
                }
            ],
            "contributing_factors": [
                "Ambient humidity elevated during loading operation"
            ]
        }
    elif "5 whys" in system_prompt.lower() or "iterative 5" in system_prompt.lower():
        return {
            "five_whys": {
                "problem_statement": "Residual acetone concentration of 0.65% exceeded 0.50% limit in Batch API-2026-014.",
                "steps": [
                    {
                        "level": 1,
                        "question": "Why did the batch exhibit residual solvent above the specification limit?",
                        "answer": "Acetone evaporation and condensation rate stalled during the terminal drying stage.",
                        "status": "supported",
                        "supporting_evidence": "GC testing confirmed 0.65% residual solvent.",
                        "source_id": "DEMO-SRC-01"
                    },
                    {
                        "level": 2,
                        "question": "Why did solvent condensation rate stall?",
                        "answer": "Condenser surface temperature rose from 10C to 18C.",
                        "status": "supported",
                        "supporting_evidence": "D-104 trend chart snippet.",
                        "source_id": "DEMO-SRC-01"
                    }
                ],
                "derived_root_cause_hypothesis": "Condenser chiller bypass valve failure.",
                "is_chain_complete": False,
                "evidence_limitation_note": "Awaiting physical actuator maintenance records."
            }
        }
    elif "fishbone" in system_prompt.lower() or "ishikawa" in system_prompt.lower():
        return {
            "fishbone": {
                "machine": [
                    {
                        "cause_id": "FB-M1",
                        "cause": "Dryer D-104 condenser coolant bypass valve sticking",
                        "status": "supported"
                    }
                ],
                "method": [
                    {
                        "cause_id": "FB-ME1",
                        "cause": "Tray loading SOP cake thickness variability",
                        "status": "tentative"
                    }
                ],
                "material": [],
                "measurement": [],
                "milieu_environment": [],
                "manpower_people": []
            }
        }
    elif "capa" in system_prompt.lower():
        return {
            "capa_recommendations": [
                {
                    "action_id": "CAPA-01",
                    "action_type": "Immediate Containment / Quarantine",
                    "title": "Quarantine Batch API-2026-014 and Place Physical/ERP Holds",
                    "description": "Segregate all drums of Batch API-2026-014 in QA Quarantine Warehouse with red hold tags.",
                    "rationale": "Prevent accidental dispensing or downstream processing while deviation is active.",
                    "target_root_cause_or_gap": "RC-01",
                    "suggested_priority": "Critical",
                    "suggested_owner_role": "QA Inventory Specialist",
                    "expected_outcome": "Zero risk of non-conforming batch release.",
                    "effectiveness_check_method": "Verification of physical hold tags and ERP system hold status.",
                    "evidence_needed_for_closure": "Signed QA Material Hold Notice Form QA-088.",
                    "human_approval_status": "Proposed"
                },
                {
                    "action_id": "CAPA-02",
                    "action_type": "Corrective Action",
                    "title": "Preventive Maintenance and Calibration of Dryer D-104 Condenser Bypass Valve",
                    "description": "Perform pneumatic stroke calibration and replace worn actuator seals on bypass valve V-204.",
                    "rationale": "Eliminate coolant temperature rise root cause.",
                    "target_root_cause_or_gap": "RC-01",
                    "suggested_priority": "High",
                    "suggested_owner_role": "Maintenance Engineering Lead",
                    "expected_outcome": "Steady 10C condenser temperature during full 12-hour drying runs.",
                    "effectiveness_check_method": "Evaluate next 3 vacuum drying cycle temperature profiles.",
                    "evidence_needed_for_closure": "Work order closure report WO-2026-8812.",
                    "human_approval_status": "Proposed"
                }
            ]
        }
    return {}


def test_fictional_demo_end_to_end_scenario(client):
    """
    Demonstrates the complete Phase 3 PharmaLens lifecycle and hardening:
    1. Create fictional demo investigation (Residual solvent 0.65% vs 0.50% limit).
    2. Associate source document.
    3. Transition through states: Draft -> Under Investigation.
    4. Run AI Intelligence workflow (persists analysis, logs audit trail, sets AI Analysis Available).
    5. Fact verification and application: Apply extracted fact to investigation with audit trail.
    6. Investigator Human Review:
       - Transition to In Review.
       - Select and confirm root cause.
       - Resolve evidence gap.
       - Accept CAPA actions.
       - Save review decisions to PostgreSQL.
    7. Completion: QA completes investigation with disposition.
    8. Immutability guard: Verify completed investigation rejects direct edits.
    9. Explicit Reopen: Quality justification reopens investigation.
    10. Audit Trail: Verify comprehensive append-only chronological history.
    """
    # Step 1: Create Investigation in Draft
    create_payload = {
        "title": "Elevated Residual Solvent Deviation - Batch API-2026-014 (Fictional Demonstration)",
        "batch_number": "API-2026-014",
        "process_step": "Drying",
        "severity": "Major",
        "incident_description": "QC release analysis detected residual acetone of 0.65%, exceeding the 0.50% specification limit in vacuum tray dryer D-104.",
    }
    create_res = client.post("/api/investigations", json=create_payload)
    assert create_res.status_code == 201
    inv_data = create_res.json()
    inv_id = inv_data["id"]
    assert inv_data["status"] == "Draft"

    # Step 2: Intake and Associate Source
    text_payload = {
        "text": "DEVIATION REPORT (Fictional Demonstration)\nBatch ID: API-2026-014\nProcess step: Drying in vacuum tray dryer D-104\nObserved residual solvent: 0.65% acetone (Acceptance Limit: 0.50% max).\nCondenser temperature trended up to 18C against 10C limit during cycle hours 04:00 to 08:00.",
        "investigation_id": inv_id,
        "title_hint": "Dev Report Batch API-2026-014"
    }
    source_res = client.post("/api/sources/text", json=text_payload)
    assert source_res.status_code == 201
    source_data = source_res.json()
    assert source_data["investigation_id"] == inv_id

    # Step 3: Transition to Under Investigation
    trans_res = client.post(
        f"/api/investigations/{inv_id}/transition",
        json={"target_status": "Under Investigation", "justification": "Evidence collection initiated with QC report"}
    )
    assert trans_res.status_code == 200
    assert trans_res.json()["status"] == "Under Investigation"

    # Step 4: Run AI Analysis Orchestration
    with patch.object(GroqClientManager, "generate_chat_json", side_effect=mock_groq_demo_dispatcher):
        ai_res = client.post(
            f"/api/investigations/{inv_id}/analysis",
            json={"include_five_whys": True, "include_fishbone": True, "include_capa": True}
        )
        assert ai_res.status_code == 200
        analysis_data = ai_res.json()
        assert analysis_data["version"] >= 1
        assert analysis_data["is_confirmed_by_human"] is False  # AI never confirms itself!
        analysis_id = analysis_data["id"]

    # Verify state auto-transitioned to "AI Analysis Available"
    check_inv = client.get(f"/api/investigations/{inv_id}").json()
    assert check_inv["status"] == "AI Analysis Available"

    # Step 5: Fact Verification & Application Endpoint
    fact_payload = {
        "field_name": "batch_number",
        "extracted_value": "API-2026-014",
        "verification_notes": "Verified against production batch record cover page."
    }
    fact_res = client.post(f"/api/investigations/{inv_id}/analysis/{analysis_id}/apply-fact", json=fact_payload)
    assert fact_res.status_code == 200

    # Step 6: Investigator Human Review
    # Transition to In Review
    client.post(
        f"/api/investigations/{inv_id}/transition",
        json={"target_status": "In Review", "justification": "Investigator beginning root cause and CAPA assessment"}
    )

    # Human Review decisions
    review_payload = {
        "confirmed_root_cause": "Sub-optimal Vacuum Condenser Cooling during Final 4 Hours of Drying Cycle",
        "is_confirmed_by_human": True,
        "user_edits_json": json.dumps({
            "notes": "Confirmed by Lead Investigator. Evidence supports coolant bypass valve fault.",
            "causes": [
                {
                    "cause_id": "RC-01",
                    "review_status": "confirmed",
                    "notes": "Evidence verified from SCADA condenser trend."
                },
                {
                    "cause_id": "RC-02",
                    "review_status": "rejected",
                    "notes": "Loading records show uniform 25mm cake depth."
                }
            ],
            "capas": [
                {
                    "action_id": "CAPA-01",
                    "human_approval_status": "Accepted",
                    "notes": "Physical quarantine tags already placed."
                },
                {
                    "action_id": "CAPA-02",
                    "human_approval_status": "Accepted",
                    "notes": "Maintenance work order scheduled."
                }
            ],
            "gaps": [
                {
                    "gap_id": "GAP-01",
                    "status": "resolved",
                    "notes": "SCADA trend log retrieved and analyzed."
                }
            ]
        })
    }
    review_res = client.patch(f"/api/investigations/{inv_id}/analysis/{analysis_id}", json=review_payload)
    assert review_res.status_code == 200
    rev_data = review_res.json()
    assert rev_data["is_confirmed_by_human"] is True
    assert rev_data["confirmed_root_cause"] == "Sub-optimal Vacuum Condenser Cooling during Final 4 Hours of Drying Cycle"

    # Step 7: Complete Investigation
    complete_res = client.post(
        f"/api/investigations/{inv_id}/transition",
        json={"target_status": "Completed", "justification": "Root cause confirmed and CAPA assigned. Disposition: QA batch rejection and rework."}
    )
    assert complete_res.status_code == 200
    assert complete_res.json()["status"] == "Completed"

    # Step 8: Immutability Guard Check
    edit_res = client.patch(f"/api/investigations/{inv_id}", json={"severity": "Minor"})
    assert edit_res.status_code == 400
    assert "locked against direct edits" in edit_res.json()["detail"]

    # Step 9: Reopen with Documented Justification
    reopen_res = client.post(
        f"/api/investigations/{inv_id}/reopen",
        json={"reason": "Reopened to attach supplemental actuator inspection report."}
    )
    assert reopen_res.status_code == 200
    assert reopen_res.json()["status"] == "In Review"

    # Step 10: Verify Comprehensive Audit Trail
    audit_res = client.get(f"/api/investigations/{inv_id}/audit-logs")
    assert audit_res.status_code == 200
    logs = audit_res.json()
    event_types = [log["event_type"] for log in logs]

    assert "investigation_created" in event_types
    assert "source_attached" in event_types
    assert "investigation_status_changed" in event_types
    assert "analysis_completed" in event_types
    assert "fact_corrected" in event_types
    assert "root_cause_accepted" in event_types
    assert "root_cause_rejected" in event_types
    assert "capa_recommendation_reviewed" in event_types
    assert "evidence_gap_updated" in event_types
    assert "investigation_reopened" in event_types
