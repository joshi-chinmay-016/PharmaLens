import pytest
from unittest.mock import patch
from app.ai.config import GroqClientManager
from tests.test_ai_workflow import mock_groq_json_response

def test_lifecycle_allowed_transitions(client):
    inv_res = client.post("/api/investigations", json={
        "title": "State Transition Test",
        "incident_reference": "DEV-2026-ST1",
        "status": "Draft",
    })
    inv_id = inv_res.json()["id"]
    assert inv_res.json()["status"] == "Draft"

    # Draft -> Under Investigation
    t1 = client.post(f"/api/investigations/{inv_id}/transition", json={
        "target_status": "Under Investigation",
        "justification": "Evidence intake initiated."
    })
    assert t1.status_code == 200
    assert t1.json()["status"] == "Under Investigation"

    # Under Investigation -> In Review
    t2 = client.post(f"/api/investigations/{inv_id}/transition", json={
        "target_status": "In Review",
        "justification": "Investigator beginning review."
    })
    assert t2.status_code == 200
    assert t2.json()["status"] == "In Review"

def test_lifecycle_invalid_transition_rejected(client):
    inv_res = client.post("/api/investigations", json={
        "title": "Invalid Transition Test",
        "status": "Draft",
    })
    inv_id = inv_res.json()["id"]

    # Draft directly to Completed is not allowed
    bad_trans = client.post(f"/api/investigations/{inv_id}/transition", json={
        "target_status": "Completed"
    })
    assert bad_trans.status_code == 400
    assert "Invalid transition" in bad_trans.json()["detail"]

def test_completion_guard_requires_confirmed_cause_and_resolved_gaps(client):
    # Investigation in 'In Review' but has no confirmed cause and has unresolved gaps
    inv_res = client.post("/api/investigations", json={
        "title": "Guard Test Deviation",
        "status": "In Review",
        "has_unresolved_gaps": True,
    })
    inv_id = inv_res.json()["id"]

    # Attempt to complete without confirmed cause or justification
    complete_res = client.post(f"/api/investigations/{inv_id}/transition", json={
        "target_status": "Completed"
    })
    assert complete_res.status_code == 400
    assert "Cannot complete investigation" in complete_res.json()["detail"]

    # Provide explicit QA justification
    complete_with_justification = client.post(f"/api/investigations/{inv_id}/transition", json={
        "target_status": "Completed",
        "justification": "QA Lead approved risk assessment RA-2026-088; verified safe."
    })
    assert complete_with_justification.status_code == 200
    assert complete_with_justification.json()["status"] == "Completed"

def test_completed_investigation_is_locked_and_can_be_reopened(client):
    # Create and complete an investigation
    inv_res = client.post("/api/investigations", json={
        "title": "Lock Test Deviation",
        "status": "In Review",
        "known_facts": "Verified root cause: sensor desynchronization during batch step.",
        "has_unresolved_gaps": False,
    })
    inv_id = inv_res.json()["id"]

    comp_res = client.post(f"/api/investigations/{inv_id}/transition", json={
        "target_status": "Completed",
        "justification": "Root cause verified by engineering."
    })
    assert comp_res.status_code == 200
    assert comp_res.json()["status"] == "Completed"

    # Attempt to edit directly -> should be rejected with 400
    edit_res = client.patch(f"/api/investigations/{inv_id}", json={
        "title": "Trying to edit completed investigation",
    })
    assert edit_res.status_code == 400
    assert "locked" in edit_res.json()["detail"].lower()

    # Reopen requires valid justification reason
    bad_reopen = client.post(f"/api/investigations/{inv_id}/reopen", json={"reason": "no"})
    assert bad_reopen.status_code == 422 or bad_reopen.status_code == 400

    # Reopen with proper justification
    reopen_res = client.post(f"/api/investigations/{inv_id}/reopen", json={
        "reason": "New analytical testing data received from contract testing lab.",
        "target_status": "In Review"
    })
    assert reopen_res.status_code == 200
    assert reopen_res.json()["status"] == "In Review"

    # Now editing is allowed again
    allow_edit = client.patch(f"/api/investigations/{inv_id}", json={
        "initial_observations": "Additional lab observations appended.",
    })
    assert allow_edit.status_code == 200
    assert "Additional lab" in allow_edit.json()["initial_observations"]
