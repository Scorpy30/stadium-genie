from fastapi import APIRouter
from app.models.schemas import AccessibilityQuery
from app.services import llm_service

router = APIRouter(prefix="/accessibility", tags=["accessibility"])

SYSTEM_PROMPT = (
    "You assist fans with disabilities at a FIFA World Cup venue. Use short "
    "sentences, plain language, and always mention the nearest accessible "
    "amenity (ramp, lift, accessible seating, quiet room) when relevant."
)


@router.post("/assist")
async def assist(query: AccessibilityQuery):
    answer = await llm_service.get_completion(SYSTEM_PROMPT, query.question)
    return {"answer": answer, "mode": query.mode}
