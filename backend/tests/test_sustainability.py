import pytest
from unittest.mock import patch
from httpx import AsyncClient, ASGITransport
from app.main import app


@pytest.mark.asyncio
@patch("app.services.llm_service.get_structured_completion")
async def test_sustainability_classify(mock_get_structured_completion):
    mock_get_structured_completion.return_value = {
        "predicted_category": "recyclable",
        "disposal_instruction": "Throw it in the blue recycling bin.",
        "confidence": 0.95
    }

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        payload = {
            "item_description": "plastic water bottle"
        }
        resp = await client.post("/api/v1/sustainability/classify", json=payload)

    assert resp.status_code == 200
    data = resp.json()
    assert data["predicted_category"] == "recyclable"
    assert data["disposal_instruction"] == "Throw it in the blue recycling bin."
    assert data["confidence"] == 0.95
    mock_get_structured_completion.assert_called_once()
