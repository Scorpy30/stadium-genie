"""Tests for the venues router."""
import pytest
from httpx import AsyncClient, ASGITransport
from app.main import app
from app.services import rag_service


@pytest.mark.asyncio
async def test_list_venues():
    """Test that the venues endpoint returns a list with expected venue IDs."""
    rag_service.index_docs()
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        resp = await client.get("/api/v1/venues")

    assert resp.status_code == 200
    data = resp.json()
    assert "venues" in data
    assert len(data["venues"]) > 0
    venue_ids = [v["venue_id"] for v in data["venues"]]
    assert "metlife" in venue_ids
    assert "sofi" in venue_ids
