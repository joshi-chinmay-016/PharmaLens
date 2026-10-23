def test_health_check(client):
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert "PharmaLens" in data["service"]
    assert data["database"] == "connected"

def test_root_endpoint(client):
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert data["product"] == "PharmaLens"
    assert data["tagline"] == "See Beyond the Deviation."
