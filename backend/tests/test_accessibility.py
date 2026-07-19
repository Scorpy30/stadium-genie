import pytest
from unittest.mock import patch
from httpx import AsyncClient, ASGITransport
from app.main import app


@pytest.mark.asyncio
@patch("app.services.llm_service.get_completion")
async def test_accessibility_assist(mock_get_completion):
    mock_get_completion.return_value = "The nearest elevator is located next to Gate C."

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        payload = {
            "question": "Where is the nearest elevator?",
            "mode": "text",
            "plain_language": True,
            "venue_id": "metlife",
            "language": "en"
        }
        resp = await client.post("/api/v1/accessibility/assist", json=payload)

    assert resp.status_code == 200
    assert resp.json()["answer"] == "The nearest elevator is located next to Gate C."
    assert resp.json()["mode"] == "text"
    mock_get_completion.assert_called_once()
