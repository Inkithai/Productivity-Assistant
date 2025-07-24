from fastapi.testclient import TestClient

from app.config import get_settings
from app.main import create_app

client = TestClient(create_app())
client.headers.update({"x-service-token": get_settings().ai_service_token})


def test_health():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


def test_api_routes_require_service_token():
    response = client.post(
        "/api/v1/tasks/extract",
        json={"text": "ship the release tomorrow"},
        headers={"x-service-token": "wrong-token"},
    )
    assert response.status_code == 401


def test_extract_task_endpoint():
    response = client.post(
        "/api/v1/tasks/extract",
        json={"text": "remind me to submit the tax forms tomorrow", "timezone": "UTC"},
    )

    assert response.status_code == 200
    body = response.json()["task"]
    assert body["title"].startswith("Submit the tax forms")
    assert body["due_date"] is not None
    assert body["priority"] in ("low", "medium", "high")


def test_extract_rejects_short_text():
    response = client.post("/api/v1/tasks/extract", json={"text": "hi"})
    assert response.status_code == 422


def test_extract_rejects_unknown_timezone():
    response = client.post(
        "/api/v1/tasks/extract",
        json={"text": "ship the release tomorrow", "timezone": "Mars/Olympus"},
    )
    assert response.status_code == 422


def test_prioritize_endpoint_orders_tasks():
    response = client.post(
        "/api/v1/tasks/prioritize",
        json={
            "tasks": [
                {"id": "1", "title": "Low", "priority": "low"},
                {"id": "2", "title": "Urgent", "priority": "high", "due_date": "2024-05-28T09:00:00Z"},
            ],
            "now": "2024-05-28T09:00:00Z",
        },
    )

    assert response.status_code == 200
    suggestions = response.json()["suggestions"]
    assert suggestions[0]["id"] == "2"
    assert suggestions[0]["bucket"] in ("high", "medium", "low")


def test_summarize_endpoint():
    response = client.post(
        "/api/v1/notes/summarize",
        json={
            "text": (
                "Standup notes. The migration is blocked on review. "
                "The migration must ship before the weekend. QA starts Thursday."
            ),
            "max_points": 3,
        },
    )

    assert response.status_code == 200
    body = response.json()
    assert body["provider"] == "rules"
    assert 1 <= len(body["key_points"]) <= 3
    assert body["summary"]


def test_search_endpoint_ranks_items():
    response = client.post(
        "/api/v1/search",
        json={
            "query": "interview preparation",
            "items": [
                {"id": "n1", "type": "note", "title": "Interview questions", "content": "prepare answers"},
                {"id": "n2", "type": "note", "title": "Grocery list", "content": "milk and eggs"},
            ],
            "limit": 5,
        },
    )

    assert response.status_code == 200
    body = response.json()
    assert body["provider"] == "fallback"
    assert body["results"], "expected at least one result"
    assert body["results"][0]["id"] == "n1"
    assert len(body["embeddings"]) == 2


def test_search_rejects_short_query():
    response = client.post("/api/v1/search", json={"query": "a", "items": []})
    assert response.status_code == 422


def test_day_plan_endpoint():
    response = client.post(
        "/api/v1/planner/day",
        json={
            "tasks": [
                {"id": "1", "title": "Write tests", "priority": "high"},
                {"id": "2", "title": "Reply to emails", "priority": "low"},
            ],
            "start_hour": 9,
            "max_blocks": 2,
        },
    )

    assert response.status_code == 200
    body = response.json()
    assert body["provider"] == "rules"
    assert len(body["blocks"]) == 2
    assert body["blocks"][0]["start"] == "09:00"


def test_summarize_rejects_empty_text():
    response = client.post("/api/v1/notes/summarize", json={"text": "short"})
    assert response.status_code == 422
