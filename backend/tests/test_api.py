import pytest
from fastapi.testclient import TestClient

from app.core.config import MAX_UPLOAD_BYTES
from app.main import app

SAMPLE = b"date,order_id,product,category,quantity,unit_price\n2026-08-01,1,Produto A,Casa,2,12.50\n"


@pytest.fixture(scope="module")
def client():
    with TestClient(app) as test_client:
        yield test_client


def test_demo_analytics_and_filters(client):
    assert client.get("/api/health").json() == {"status": "ok"}
    dataset = client.get("/api/dataset").json()
    assert dataset["demo"] is True
    filters = {"start": "2026-10-01", "end": "2026-10-31", "category": "Eletrônicos"}
    summary = client.get("/api/summary", params=filters)
    assert summary.status_code == 200, summary.text
    assert summary.json()["current"]["revenue"] > 0
    assert [category["name"] for category in summary.json()["categories"]] == ["Eletrônicos"]
    series = client.get("/api/sales", params={**filters, "group": "day"})
    assert series.status_code == 200, series.text
    points = series.json()["points"]
    assert len(points) == 31
    assert round(sum(entry["revenue"] for entry in points), 2) == summary.json()["current"]["revenue"]
    assert client.get("/api/products", params=filters).json()["products"]
    assert client.get("/api/customers", params=filters).json()["unique"] > 0
    default = client.get("/api/forecast", params={"horizon": 7})
    assert default.status_code == 200, default.text
    assert len(default.json()["projection"]) == 7
    scenario = client.post("/api/scenario", json={**filters, "sales_growth": 10})
    assert scenario.status_code == 200
    assert scenario.json()["base"] == summary.json()["current"]
    assert client.get("/api/summary", params={"start": "2026-10-21", "end": "2026-10-01"}).status_code == 422


def test_import_is_isolated_and_can_be_removed(client):
    response = client.post("/api/datasets", content=SAMPLE, headers={"Content-Type": "text/csv"})
    assert response.status_code == 201, response.text
    headers = {"X-Dataset-Id": response.json()["dataset_id"]}
    assert response.json()["info"]["demo"] is False
    assert client.get("/api/dataset").json()["demo"] is True
    summary = client.get("/api/summary", headers=headers).json()
    assert summary["current"]["revenue"] == 25
    assert summary["previous_period"] is None
    assert client.get("/api/customers", headers=headers).json()["unique"] == 0
    assert client.get("/api/forecast", headers=headers).json()["projection"] == []
    assert client.delete("/api/datasets", headers=headers).status_code == 204
    assert client.get("/api/summary", headers=headers).status_code == 404


def test_upload_validates_size_media_and_columns(client):
    assert client.post("/api/datasets", content=SAMPLE).status_code == 415
    headers = {"Content-Type": "text/csv"}
    assert client.post("/api/datasets", content=b"x" * (MAX_UPLOAD_BYTES + 1), headers=headers).status_code == 413
    response = client.post("/api/datasets", content=b"nome,email\nPessoa,email", headers=headers)
    assert response.status_code == 422
    assert "Colunas obrigatórias" in response.json()["detail"]


def test_cors_preflight_allows_only_configured_origins(client):
    headers = {"Access-Control-Request-Method": "POST", "Access-Control-Request-Headers": "Content-Type,X-Dataset-Id"}
    allowed = client.options("/api/datasets", headers={**headers, "Origin": "http://localhost:3000"})
    assert allowed.headers["access-control-allow-origin"] == "http://localhost:3000"
    blocked = client.options("/api/datasets", headers={**headers, "Origin": "https://unknown.example"})
    assert "access-control-allow-origin" not in blocked.headers
