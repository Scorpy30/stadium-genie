from fastapi import APIRouter, HTTPException
from app.models.schemas import CrowdIngest, CrowdStatus
from app.services.crowd_predictor import ingest, get_status

router = APIRouter(prefix="/crowd", tags=["crowd"])


@router.post("/ingest", response_model=CrowdStatus)
async def ingest_crowd(data: CrowdIngest):
    result = ingest(data.zone_id, data.count, data.capacity)
    return CrowdStatus(**result)


@router.get("/status", response_model=CrowdStatus)
async def crowd_status(zone_id: str):
    result = get_status(zone_id)
    if result is None:
        raise HTTPException(status_code=404, detail=f"No data yet for zone '{zone_id}'. POST to /crowd/ingest first.")
    return CrowdStatus(**result)
