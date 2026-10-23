import pytest
from unittest.mock import patch
from app.ai.config import GroqClientManager
from tests.test_ai_workflow import mock_groq_json_response

def test_apply_verified_fact_to_investigation(client):
    inv_res = client.post("/api/investigations", json={
        "title": "Fact Application Test",
        "batch_number": "OLD-BATCH-000",
    })
    inv_id = inv_res.json()["id"]

    # Apply fact correction
    apply_res = client.post(f"/api/investigations/{inv_id}/analysis/1/apply-fact", json={
        "field_name": "batch_number",
        "new_value": "API-2026-014",
        "reason": "Corrected from verified certificate of analysis",
        "source_id": "SRC-TXT-101",
    })
    assert apply_res.status_code == 200
    assert apply_res.json()["status"] == "success"

    # Verify investigation record is updated
    check_inv = client.get(f"/api/investigations/{inv_id}")
    assert check_inv.status_code == 200
    assert check_inv.json()["batch_number"] == "API-2026-014"

    # Verify audit log recorded fact correction
    audit_res = client.get(f"/api/investigations/{inv_id}/audit-logs")
    logs = audit_res.json()
    assert any(l["event_type"] == "fact_corrected" for l in logs)

def test_cross_investigation_source_hijacking_forbidden(client):
    inv1 = client.post("/api/investigations", json={"title": "Investigation 1"}).json()
    inv2 = client.post("/api/investigations", json={"title": "Investigation 2"}).json()

    # Create source attached to investigation 1
    src = client.post("/api/sources/text", json={
        "text": "Confidential investigation 1 report.",
        "investigation_id": inv1["id"]
    }).json()

    # Attempt to reassign / attach source to investigation 2 -> must return 409 Conflict
    reassign_res = client.patch(f"/api/sources/{src['id']}/attach?investigation_id={inv2['id']}")
    assert reassign_res.status_code == 409
    assert "Cross-investigation" in reassign_res.json()["detail"] or "already assigned" in reassign_res.json()["detail"]

@patch.object(GroqClientManager, "generate_chat_json")
def test_failed_ai_analysis_does_not_overwrite_previous_successful_analysis(mock_inf, client):
    # First run succeeds
    mock_inf.side_effect = mock_groq_json_response
    inv = client.post("/api/investigations", json={
        "title": "Preservation Test",
        "incident_description": "First successful run context.",
    }).json()
    inv_id = inv["id"]

    res1 = client.post(f"/api/investigations/{inv_id}/analysis")
    assert res1.status_code == 200
    assert res1.json()["version"] == 1

    # Second run fails with a provider error
    mock_inf.side_effect = Exception("Groq rate limit 429: Rate limit reached for model.")
    res2 = client.post(f"/api/investigations/{inv_id}/analysis")
    assert res2.status_code == 500
    assert "rate limit" in res2.json()["detail"].lower()

    # Verify latest analysis is STILL Version 1 and not corrupted or deleted
    latest_res = client.get(f"/api/investigations/{inv_id}/analysis")
    assert latest_res.status_code == 200
    assert latest_res.json()["version"] == 1
    assert latest_res.json()["structured_output"] is not None

    # Verify audit log captured analysis_failed
    audit_res = client.get(f"/api/investigations/{inv_id}/audit-logs")
    logs = audit_res.json()
    assert any(l["event_type"] == "analysis_failed" for l in logs)
