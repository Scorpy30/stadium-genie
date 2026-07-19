import pytest
from unittest.mock import patch
from httpx import AsyncClient, ASGITransport
from app.main import app


@pytest.mark.asyncio
@patch("app.services.llm_service.get_completion")
async def test_ops_summary(mock_get_completion):
    mock_get_completion.return_value = "All quiet at MetLife. No major incidents reported."

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        resp = await client.get("/api/v1/ops/summary?incident_log=No+issues")

    assert resp.status_code == 200
    assert resp.json()["digest"] == "All quiet at MetLife. No major incidents reported."
    mock_get_completion.assert_called_once()


@pytest.mark.asyncio
@patch("app.services.llm_service.get_structured_completion")
async def test_ops_decision_support(mock_get_structured_completion):
    mock_get_structured_completion.return_value = {
        "actions": [
            {
                "action": "Open Gate D",
                "priority": "high",
                "rationale": "High crowd density approaching Gate C."
            }
        ]
    }

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        payload = {
            "zone_metrics": {"zone_c": 0.90},
            "active_incidents": ["Long queue at Gate C"]
        }
        resp = await client.post("/api/v1/ops/decision-support", json=payload)

    assert resp.status_code == 200
    actions = resp.json()["actions"]
    assert len(actions) == 1
    assert actions[0]["action"] == "Open Gate D"
    assert actions[0]["priority"] == "high"
    assert actions[0]["rationale"] == "High crowd density approaching Gate C."
    mock_get_structured_completion.assert_called_once()
