def test_create_and_retrieve_investigation(client):
    payload = {
        "title": "Residual Solvent Result Outside Acceptance Criteria",
        "incident_reference": "DEV-2026-014",
        "product_name": "Example API",
        "batch_number": "API-2026-014",
        "process_step": "Drying",
        "actual_result": "0.65%",
        "acceptance_criterion": "0.50%",
        "incident_category": "OOS Result",
        "incident_description": "Residual solvent reported as 0.65% exceeding illustrative acceptance limit of 0.50%.",
        "status": "Draft",
    }
    
    # 1. Create
    res = client.post("/api/investigations", json=payload)
    assert res.status_code == 201
    created = res.json()
    assert created["id"] is not None
    assert created["investigation_id"].startswith("INV-")
    assert created["title"] == payload["title"]
    assert created["batch_number"] == "API-2026-014"
    inv_id = created["id"]

    # 2. Retrieve single
    res_get = client.get(f"/api/investigations/{inv_id}")
    assert res_get.status_code == 200
    fetched = res_get.json()
    assert fetched["investigation_id"] == created["investigation_id"]
    assert fetched["process_step"] == "Drying"

    # 3. Retrieve list
    res_list = client.get("/api/investigations")
    assert res_list.status_code == 200
    items = res_list.json()
    assert len(items) >= 1
    assert any(item["id"] == inv_id for item in items)

def test_update_investigation(client):
    create_res = client.post("/api/investigations", json={
        "title": "Initial Deviation Investigation",
        "incident_reference": "DEV-2026-099",
        "status": "Draft"
    })
    assert create_res.status_code == 201
    inv_id = create_res.json()["id"]

    # Update status and observations
    update_res = client.patch(f"/api/investigations/{inv_id}", json={
        "status": "In Review",
        "initial_observations": "Walkthrough conducted. Vacuum level verified on dryer unit.",
        "has_unresolved_gaps": True
    })
    assert update_res.status_code == 200
    updated = update_res.json()
    assert updated["status"] == "In Review"
    assert "Vacuum level verified" in updated["initial_observations"]
    assert updated["has_unresolved_gaps"] is True

def test_investigation_search_and_filter(client):
    client.post("/api/investigations", json={"title": "Chromatography Column Pressure Spike", "status": "In Review"})
    client.post("/api/investigations", json={"title": "Buffer pH Deviation", "status": "Draft"})

    # Search
    search_res = client.get("/api/investigations?search=Pressure")
    assert search_res.status_code == 200
    search_items = search_res.json()
    assert len(search_items) >= 1
    assert any("Pressure" in item["title"] for item in search_items)

    # Filter
    filter_res = client.get("/api/investigations?status=In%20Review")
    assert filter_res.status_code == 200
    filter_items = filter_res.json()
    assert all(item["status"] == "In Review" for item in filter_items)

def test_investigation_validation_error(client):
    # Short title should fail validation (< 3 chars)
    res = client.post("/api/investigations", json={"title": "ab"})
    assert res.status_code == 422

def test_dashboard_metrics(client):
    res = client.get("/api/investigations/metrics")
    assert res.status_code == 200
    metrics = res.json()
    assert "total_investigations" in metrics
    assert "draft_investigations" in metrics
    assert "in_review_investigations" in metrics
    assert "unresolved_gaps_count" in metrics
    assert metrics["total_investigations"] >= 0
