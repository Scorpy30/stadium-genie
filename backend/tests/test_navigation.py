"""Unit tests for the wayfinding/navigation routes."""
import pytest
from unittest.mock import patch
from httpx import AsyncClient, ASGITransport
from app.main import app


@pytest.mark.asyncio
async def test_health_check() -> None:
    """Test the basic service health check endpoint."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        resp = await client.get("/health")
    assert resp.status_code == 200
    assert resp.json()["status"] == "ok"


@pytest.mark.asyncio
@patch("app.services.llm_service.get_completion")
async def test_ask_navigation(mock_get_completion) -> None:
    """Test the navigation route POST endpoint with LLM completion mocking."""
    mock_get_completion.return_value = "1. Turn left at Gate A.\n2. Walk 100m to Section 101."

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        payload = {
            "question": "How do I get to section 101?",
            "language": "en",
            "user_zone": "Zone A",
            "venue_id": "metlife"
        }
        resp = await client.post("/api/v1/navigation/ask", json=payload)

    assert resp.status_code == 200
    data = resp.json()
    assert data["answer"] == "1. Turn left at Gate A.\n2. Walk 100m to Section 101."
    assert data["steps"] == ["1. Turn left at Gate A.", "2. Walk 100m to Section 101."]
    assert data["language"] == "en"
    mock_get_completion.assert_called_once()
