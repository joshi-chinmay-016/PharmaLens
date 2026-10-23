import pytest
import json
from unittest.mock import patch
from app.ai.config import GroqClientManager
from tests.test_ai_workflow import mock_groq_json_response

def test_audit_logs_on_investigation_lifecycle(client):
    # 1. Create an investigation
    create_res = client.post("/api/investigations", json={
        "title": "Audit Trail Validation Deviation",
        "incident_reference": "DEV-2026-AUD",
        "product_name": "Test API",
        "batch_number": "BAT-AUD-01",
        "process_step": "Drying",
        "actual_result": "0.62%",
        "acceptance_criterion": "0.50%",
        "status": "Draft",
    })
    assert create_res.status_code == 201
    inv_id = create_res.json()["id"]

    # Retrieve audit logs
    audit_res = client.get(f"/api/investigations/{inv_id}/audit-logs")
    assert audit_res.status_code == 200
    logs = audit_res.json()
    assert len(logs) >= 1
    assert any(log["event_type"] == "investigation_created" for log in logs)

    # 2. Update field
    update_res = client.patch(f"/api/investigations/{inv_id}", json={
        "initial_observations": "Oven temperature was checked by QA lead.",
    })
    assert update_res.status_code == 200

    audit_res2 = client.get(f"/api/investigations/{inv_id}/audit-logs")
    logs2 = audit_res2.json()
    assert any(log["event_type"] == "investigation_updated" for log in logs2)

def test_audit_logs_on_source_attachment_and_detachment(client):
    inv_res = client.post("/api/investigations", json={"title": "Source Audit Test"})
    inv_id = inv_res.json()["id"]

    # Ingest source directly associated with investigation
    src_res = client.post("/api/sources/text", json={
        "text": "Temperature deviation log in drying chamber #2.",
        "investigation_id": inv_id,
    })
    assert src_res.status_code == 201
    src_id = src_res.json()["id"]

    # Check audit log for source attachment
    audit_res = client.get(f"/api/investigations/{inv_id}/audit-logs")
    logs = audit_res.json()
    assert any(log["event_type"] == "source_attached" for log in logs)

    # Detach source
    detach_res = client.patch(f"/api/sources/{src_id}/detach?investigation_id={inv_id}")
    assert detach_res.status_code == 200

    # Check audit log for source detachment
    audit_res2 = client.get(f"/api/investigations/{inv_id}/audit-logs")
    logs2 = audit_res2.json()
    assert any(log["event_type"] == "source_detached" for log in logs2)

@patch.object(GroqClientManager, "generate_chat_json", side_effect=mock_groq_json_response)
def test_audit_logs_on_ai_analysis_and_human_review(mock_inference, client):
    inv_res = client.post("/api/investigations", json={
        "title": "AI Audit Run Test",
        "incident_description": "Batch API-2026-014 solvent result was 0.65% vs 0.50% limit.",
    })
    inv_id = inv_res.json()["id"]

    # Run AI analysis
    ai_res = client.post(f"/api/investigations/{inv_id}/analysis")
    assert ai_res.status_code == 200
    analysis_id = ai_res.json()["id"]

    # Verify audit logs captured analysis completion and status change
    audit_res = client.get(f"/api/investigations/{inv_id}/audit-logs")
    logs = audit_res.json()
    event_types = [l["event_type"] for l in logs]
    assert "analysis_completed" in event_types
    assert "analysis_version_created" in event_types
    assert "investigation_status_changed" in event_types

    # Human review updates
    review_payload = {
        "confirmed_root_cause": "Vacuum leak in secondary condenser.",
        "is_confirmed_by_human": True,
        "user_edits_json": json.dumps({
            "causes": [
                {"cause_id": "PRC-01", "title": "Incomplete Drying", "review_status": "accepted"}
            ],
            "capas": [
                {"action_id": "CAPA-01", "action_type": "Corrective Action", "human_approval_status": "Accepted"}
            ],
            "gaps": [
                {"gap_id": "GAP-01", "status": "resolved"}
            ]
        })
    }
    update_res = client.patch(f"/api/investigations/{inv_id}/analysis/{analysis_id}", json=review_payload)
    assert update_res.status_code == 200

    # Verify review audit logs
    audit_res2 = client.get(f"/api/investigations/{inv_id}/audit-logs")
    logs2 = audit_res2.json()
    event_types2 = [l["event_type"] for l in logs2]
    assert "root_cause_accepted" in event_types2
    assert "capa_recommendation_reviewed" in event_types2
    assert "evidence_gap_updated" in event_types2
