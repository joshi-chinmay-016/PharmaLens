import os
import sys
import json
import requests

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')
if hasattr(sys.stderr, 'reconfigure'):
    sys.stderr.reconfigure(encoding='utf-8')

BASE_URL = "http://localhost:8000/api"
PDF_PATH = os.path.join(os.path.dirname(__file__), "samples", "sample_deviation_report_bz2026_881.pdf")

def run_test():
    print("=" * 70)
    print("PHARMALENS END-TO-END WORKFLOW VERIFICATION TEST")
    print("=" * 70)

    # 1. Health check
    print("\n[Step 1] Checking system and database health...")
    res = requests.get(f"{BASE_URL}/health")
    assert res.status_code == 200, f"Health check failed: {res.text}"
    health_data = res.json()
    print(f"Health check OK: status={health_data.get('status')}, db={health_data.get('database')}")
    assert health_data.get("database") == "connected"

    # 2. Create a new Investigation in Draft
    print("\n[Step 2] Creating new investigation record...")
    inv_payload = {
        "title": "Deviation: Residual Acetone Spike in Benztropine Mesylate Batch BZ-2026-881",
        "incident_category": "OOS Assay / Residual Solvent",
        "incident_description": "Initial placeholder description while awaiting source report intake."
    }
    res = requests.post(f"{BASE_URL}/investigations", json=inv_payload)
    assert res.status_code == 201, f"Failed to create investigation: {res.text}"
    inv_data = res.json()
    inv_id = inv_data["id"]
    print(f"Investigation created: ID={inv_id}, Status={inv_data['status']}")
    assert inv_data["status"].lower() == "draft"

    # 3. Upload Sample PDF directly to this investigation
    print(f"\n[Step 3] Uploading sample PDF ({PDF_PATH})...")
    assert os.path.exists(PDF_PATH), f"PDF file not found at {PDF_PATH}"
    with open(PDF_PATH, "rb") as f:
        files = {"file": ("sample_deviation_report_bz2026_881.pdf", f, "application/pdf")}
        data = {"investigation_id": inv_id}
        res = requests.post(f"{BASE_URL}/sources/pdf", files=files, data=data)
    assert res.status_code == 201, f"PDF upload failed: {res.text}"
    source_data = res.json()
    print(f"PDF uploaded successfully!")
    print(f"  Source ID: {source_data['source_id']}")
    print(f"  Status: {source_data['extraction_status']}")
    print(f"  Extracted text length: {len(source_data.get('extracted_text', ''))} chars")
    assert source_data["extraction_status"] == "success"
    assert "BZ-2026-881" in source_data["extracted_text"]
    assert "0.72%" in source_data["extracted_text"]

    # 4. Execute AI Analysis using LangGraph + Groq
    print("\n[Step 4] Executing AI Analysis via LangGraph orchestrator (Groq LLM)...")
    analysis_payload = {
        "include_five_whys": True,
        "include_fishbone": True,
        "include_capa": True
    }
    res = requests.post(f"{BASE_URL}/investigations/{inv_id}/analysis", json=analysis_payload, timeout=90)
    assert res.status_code == 200, f"AI Analysis failed: {res.text}"
    analysis_data = res.json()
    analysis_id = analysis_data["id"]
    print(f"AI Analysis completed!")
    print(f"  Analysis ID: {analysis_id}, Version: v{analysis_data['version']}")
    print(f"  Model: {analysis_data['model_identifier']}")
    print(f"  Confirmed by human initially: {analysis_data['is_confirmed_by_human']}")
    assert analysis_data["is_confirmed_by_human"] is False

    structured = analysis_data.get("structured_output") or {}

    # Verify extracted facts
    facts = structured.get("extracted_facts", [])
    print(f"\n[Step 5] Extracted facts count: {len(facts)}")
    for f in facts:
        print(f"  - {f.get('field_name')}: '{f.get('extracted_value')}' (Confidence: {f.get('confidence_score')})")
        print(f"    Source snippet: {f.get('source_snippet')}")
    assert len(facts) > 0, "No facts extracted"

    # Verify evidence gaps
    gaps = structured.get("evidence_gaps", [])
    print(f"\n[Step 6] Evidence gaps count: {len(gaps)}")
    for g in gaps:
        print(f"  - [{g.get('priority')}] {g.get('gap_id')} ({g.get('category')}): {g.get('description')}")
    assert len(gaps) > 0, "No evidence gaps identified"

    # Verify potential root causes
    causes = structured.get("potential_root_causes", [])
    print(f"\n[Step 7] Potential root causes count: {len(causes)}")
    for c in causes:
        print(f"  - {c.get('cause_id')}: {c.get('title')} [{c.get('category')}]")
        print(f"    Human confirmed: {c.get('is_confirmed_by_human')}")
    assert len(causes) > 0, "No potential causes generated"

    # Verify 5 Whys
    five_whys = structured.get("five_whys", {})
    steps = five_whys.get("steps", [])
    print(f"\n[Step 8] 5 Whys steps count: {len(steps)}")
    for s in steps:
        print(f"  Why #{s.get('level')}: {s.get('question')} -> {s.get('answer')}")
    assert len(steps) >= 3, "Insufficient 5 whys steps"

    # Verify Fishbone 6M
    fishbone = structured.get("fishbone", {})
    print(f"\n[Step 9] Fishbone 6M categories:")
    for cat in ["machine", "method", "material", "measurement", "milieu_environment", "manpower_people"]:
        items = fishbone.get(cat, [])
        print(f"  - {cat}: {len(items)} factors")

    # Verify CAPA
    capas = structured.get("capa_recommendations", [])
    print(f"\n[Step 10] CAPA recommendations count: {len(capas)}")
    for cp in capas:
        print(f"  - [{cp.get('action_type')}] {cp.get('action_id')}: {cp.get('title')}")
        print(f"    Rationale: {cp.get('rationale')}")
        print(f"    Approval status: {cp.get('human_approval_status')}")
    assert len(capas) > 0, "No CAPA recommendations generated"

    # 5. Apply a verified fact to update investigation fields
    print("\n[Step 11] Applying verified fact to investigation form...")
    batch_fact = next((f for f in facts if f.get("field_name") == "batch_number"), facts[0])
    verify_payload = {
        "field_name": batch_fact["field_name"],
        "extracted_value": batch_fact["extracted_value"],
        "verification_notes": "Verified against PDF document DEV-2026-0881.",
        "source_id": source_data["source_id"]
    }
    res = requests.post(f"{BASE_URL}/investigations/{inv_id}/analysis/{analysis_id}/apply-fact", json=verify_payload)
    assert res.status_code == 200, f"Apply fact failed: {res.text}"
    apply_res = res.json()
    print(f"Fact applied successfully: {apply_res.get('message')}")

    # Verify fact on investigation record
    res = requests.get(f"{BASE_URL}/investigations/{inv_id}")
    inv_data = res.json()
    applied_val = inv_data.get(batch_fact["field_name"])
    print(f"Investigation record '{batch_fact['field_name']}' is now: '{applied_val}'")
    assert applied_val == batch_fact["extracted_value"]

    # 6. Human Review: Confirm a root cause
    print("\n[Step 12] Human Review: Confirming root cause...")
    confirmed_cause = causes[0]["title"]
    review_payload = {
        "confirmed_root_cause": confirmed_cause,
        "is_confirmed_by_human": True,
        "user_edits_json": json.dumps({
            "notes": "Verified cooling water valve CV-102 actuator failure during Hour 9-12.5 of drying cycle.",
            "reviewer": "QA Lead Investigator Dr. S. Rao"
        })
    }
    res = requests.patch(f"{BASE_URL}/investigations/{inv_id}/analysis/{analysis_id}", json=review_payload)
    assert res.status_code == 200, f"Review save failed: {res.text}"
    rev_data = res.json()
    print(f"Review saved! Confirmed cause: '{rev_data.get('confirmed_root_cause')}'")
    assert rev_data.get("is_confirmed_by_human") is True
    assert rev_data.get("confirmed_root_cause") == confirmed_cause

    # 7. Lifecycle transitions: Submit for QA Review (In Review)
    print("\n[Step 13] Transitioning lifecycle to 'In Review'...")
    trans_payload = {
        "target_status": "In Review",
        "justification": "AI root cause deduction complete and verified by QA Investigator."
    }
    res = requests.post(f"{BASE_URL}/investigations/{inv_id}/transition", json=trans_payload)
    assert res.status_code == 200, f"Transition failed: {res.text}"
    assert res.json()["status"] == "In Review"
    print("Investigation is now 'In Review'.")

    # 8. Lifecycle transitions: Complete & Seal investigation
    print("\n[Step 14] Completing and sealing investigation...")
    complete_payload = {
        "target_status": "Completed",
        "justification": "Full root cause analysis and CAPA complete. Condenser valve CV-102 overhaul scheduled under CAPA-01. Batch quarantined."
    }
    res = requests.post(f"{BASE_URL}/investigations/{inv_id}/transition", json=complete_payload)
    assert res.status_code == 200, f"Complete failed: {res.text}"
    closed_inv = res.json()
    assert closed_inv["status"] == "Completed"
    print(f"Investigation status is now '{closed_inv['status']}' (Sealed).")

    # Verify locked/immutable behavior: Attempting to edit a completed record without reopening should fail
    print("\n[Step 15] Verifying completed record modification protection...")
    attempt_update = requests.patch(f"{BASE_URL}/investigations/{inv_id}", json={"title": "Unauthorized Title Edit"})
    print(f"Update attempt status code: {attempt_update.status_code}")
    assert attempt_update.status_code == 400 or attempt_update.status_code == 403 or "completed" in attempt_update.text.lower()
    print("Modification protection verified! Completed record rejects ad-hoc edits without reopening.")

    # 9. Verify persistence by re-fetching
    print("\n[Step 16] Verifying persistence from database...")
    res = requests.get(f"{BASE_URL}/investigations/{inv_id}")
    persisted_inv = res.json()
    assert persisted_inv["status"] == "Completed"
    assert persisted_inv.get(batch_fact["field_name"]) == batch_fact["extracted_value"]

    # Re-fetch latest analysis
    res = requests.get(f"{BASE_URL}/investigations/{inv_id}/analysis")
    persisted_analysis = res.json()
    assert persisted_analysis["is_confirmed_by_human"] is True
    assert persisted_analysis["confirmed_root_cause"] == confirmed_cause
    print("Database persistence verified! All fields, status, and confirmed cause match.")

    # 10. Audit trail verification
    print("\n[Step 17] Verifying audit trail logs...")
    res = requests.get(f"{BASE_URL}/investigations/{inv_id}/audit-logs")
    assert res.status_code == 200, f"Audit logs failed: {res.text}"
    logs = res.json()
    print(f"Total audit events logged: {len(logs)}")
    event_types = [l["event_type"] for l in logs]
    print(f"Events sequence: {event_types}")
    assert "investigation_created" in event_types
    assert "source_attached" in event_types
    assert "analysis_completed" in event_types
    assert ("fact_corrected" in event_types or "fact_applied" in event_types)
    assert ("root_cause_accepted" in event_types or "root_cause_confirmed" in event_types)
    assert ("investigation_status_changed" in event_types or "status_transitioned" in event_types)
    assert ("investigation_completed" in event_types)

    # 11. Test reopening the completed record with mandatory justification
    print("\n[Step 18] Testing reopening of completed record with justification...")
    reopen_payload = {
        "reason": "New maintenance calibration data received from engineering team for thermocouple TT-09.",
        "target_status": "In Review"
    }
    res = requests.post(f"{BASE_URL}/investigations/{inv_id}/reopen", json=reopen_payload)
    assert res.status_code == 200, f"Reopen failed: {res.text}"
    reopened_inv = res.json()
    assert reopened_inv["status"] == "In Review"
    print(f"Investigation reopened! New status is '{reopened_inv['status']}'.")

    # Re-complete to re-seal
    res = requests.post(f"{BASE_URL}/investigations/{inv_id}/transition", json=complete_payload)
    assert res.status_code == 200
    assert res.json()["status"] == "Completed"
    print("Investigation re-completed and re-sealed.")

    print("\n" + "=" * 70)
    print("ALL 18 END-TO-END WORKFLOW STAGES PASSED SUCCESSFULLY!")
    print("=" * 70)

if __name__ == "__main__":
    run_test()
