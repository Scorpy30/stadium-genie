from fastapi import APIRouter
from app.models.schemas import SustainabilityQuery, SustainabilityClassification
from app.services import llm_service

router = APIRouter(prefix="/sustainability", tags=["sustainability"])

SYSTEM_PROMPT = (
    "You are a waste-sorting assistant at a FIFA World Cup stadium. Given a "
    "short description of an item a fan wants to throw away, classify it and "
    "respond with ONLY a JSON object, no other text: "
    '{"predicted_category": "recyclable|compost|landfill|hazardous", '
    '"disposal_instruction": "<one short sentence telling the fan exactly '
    'which bin/station to use>", "confidence": <float 0.0-1.0>}'
)


@router.post("/classify", response_model=SustainabilityClassification)
async def classify_waste(query: SustainabilityQuery):
    """Text-based GenAI waste classification. A fan (or a volunteer on their
    behalf) describes the item in a sentence; the LLM classifies it and
    returns venue-appropriate disposal guidance. (Swap the input for an
    image + a vision-capable model later if the team wants full photo
    classification -- the response contract here won't need to change.)"""
    data = await llm_service.get_structured_completion(SYSTEM_PROMPT, query.item_description)
    return SustainabilityClassification(**data)
