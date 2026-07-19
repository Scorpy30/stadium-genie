"""Unit tests for the multilingual RAG chat routes."""
import pytest
from unittest.mock import patch
from httpx import AsyncClient, ASGITransport
from app.main import app


@pytest.mark.asyncio
@patch("app.services.llm_service.get_completion")
async def test_multilingual_chat(mock_get_completion) -> None:
    """Test the multilingual chat POST endpoint with LLM completion mocking."""
    mock_get_completion.return_value = "Hola! La entrada principal esta a 50 metros."

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        payload = {
            "question": "Donde esta la entrada?",
            "language": "es",
            "session_id": "test-session-123",
            "venue_id": "metlife"
        }
        resp = await client.post("/api/v1/multilingual/chat", json=payload)

    assert resp.status_code == 200
    data = resp.json()
    assert data["answer"] == "Hola! La entrada principal esta a 50 metros."
    assert data["session_id"] == "test-session-123"
    assert data["venue_id"] == "metlife"
    mock_get_completion.assert_called_once()
