import urllib.request
import json

def test_api():
    base = "http://127.0.0.1:8000/api"
    
    # 1. Health
    res = urllib.request.urlopen(f"{base}/health")
    health = json.loads(res.read())
    print("1. Health Check:", health)
    assert health["status"] == "healthy"
    assert health["database"] == "connected"

    # 2. Text Intake
    text_payload = json.dumps({
        "text": "Deviation observed in drying oven #2. Solvent 0.65% vs 0.50% limit.",
        "title_hint": "Solvent OOS"
    }).encode("utf-8")
    req = urllib.request.Request(f"{base}/sources/text", data=text_payload, headers={"Content-Type": "application/json"})
    src_res = json.loads(urllib.request.urlopen(req).read())
    print("2. Text Intake:", src_res["source_id"], "status:", src_res["extraction_status"])
    assert src_res["extraction_status"] == "success"

    # 3. Create Investigation
    inv_payload = json.dumps({
        "title": "Residual Solvent Result Outside Acceptance Criteria",
        "incident_reference": "DEV-2026-014",
        "product_name": "Example API",
        "batch_number": "API-2026-014",
        "process_step": "Drying",
        "actual_result": "0.65%",
        "acceptance_criterion": "0.50%",
        "incident_category": "OOS Result",
        "status": "Draft",
        "source_document_ids": [src_res["id"]]
    }).encode("utf-8")
    req = urllib.request.Request(f"{base}/investigations", data=inv_payload, headers={"Content-Type": "application/json"})
    inv = json.loads(urllib.request.urlopen(req).read())
    print("3. Created Investigation:", inv["investigation_id"], "with linked sources:", len(inv["source_documents"]))
    assert inv["investigation_id"].startswith("INV-")
    assert len(inv["source_documents"]) == 1

    # 4. Metrics
    res = urllib.request.urlopen(f"{base}/investigations/metrics")
    metrics = json.loads(res.read())
    print("4. Metrics:", metrics)
    assert metrics["total_investigations"] >= 1

    # 5. List
    res = urllib.request.urlopen(f"{base}/investigations?search=DEV-2026-014")
    items = json.loads(res.read())
    print(f"5. Search returned {len(items)} items matching DEV-2026-014")
    assert len(items) >= 1

    print("\nALL END-TO-END VERIFICATION CHECKS PASSED ON POSTGRESQL!")

if __name__ == "__main__":
    test_api()
