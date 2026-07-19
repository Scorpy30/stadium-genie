import pytest
from unittest.mock import patch
from httpx import AsyncClient, ASGITransport
from app.main import app


@pytest.mark.asyncio
@patch("app.services.llm_service.get_completion")
async def test_transport_recommend(mock_get_completion):
    mock_get_completion.return_value = "Take the PATH train to Journal Square, then board the free shuttle to the stadium."

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        payload = {
            "venue_id": "metlife",
            "origin_type": "train_station",
            "origin_name": "Journal Square PATH",
            "kickoff_time": "2026-07-20T18:00:00Z",
            "mode_preference": "transit"
        }
        resp = await client.post("/api/v1/transport/recommend", json=payload)

    assert resp.status_code == 200
    data = resp.json()
    assert "recommendation" in data
    assert data["recommendation"] == "Take the PATH train to Journal Square, then board the free shuttle to the stadium."
    assert data["venue_id"] == "metlife"
    mock_get_completion.assert_called_once()
