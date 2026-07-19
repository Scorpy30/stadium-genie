from fastapi import APIRouter
from app.models.schemas import TransportRequest
from app.services import llm_service, rag_service

router = APIRouter(prefix="/transport", tags=["transport"])

SYSTEM_PROMPT = (
    "You recommend the single best transport option (transit, drive, or "
    "walk) to reach a FIFA World Cup 2026 stadium before kickoff, tailored "
    "to the fan's specific starting point type (airport, bus stop, train "
    "station, or other) and factoring typical matchday congestion.\n\n"
    "GROUNDING RULES:\n"
    "1. Only state specific facts (line names, shuttle frequency, walk "
    "times, lot numbers) if they appear in the venue transit context below. "
    "Never invent specific numbers or names not in the context.\n"
    "2. If no venue context is provided, give only general transport advice "
    "appropriate to the origin type, and say plainly you don't have this "
    "specific stadium's transit details loaded.\n\n"
    "Be concise: one clear primary recommendation, plus one backup option."
)


@router.post("/recommend")
async def recommend(req: TransportRequest) -> dict[str, str | None]:
    """Recommend the single best transport option to reach a stadium.

    Retrieves transit docs from RAG based on the destination venue and fan's
    origin parameters, and uses the LLM to write a grounded transport advice.

    Args:
        req: TransportRequest containing the venue_id, origin_type, origin_name,
             kickoff_time, and mode_preference.

    Returns:
        A dict with the recommendation string and the venue_id.
    """
    context_docs = rag_service.retrieve(
        f"{req.origin_type} {req.origin_name} transit transport parking shuttle", req.venue_id
    )
    context = "\n".join(context_docs) if context_docs else "(no venue transit data available)"

    prompt = (
        f"Venue: {req.venue_id or 'not specified'}\n"
        f"Venue transit context:\n{context}\n\n"
        f"Fan's starting point type: {req.origin_type}\n"
        f"Fan's starting point: {req.origin_name}\n"
        f"Kickoff time: {req.kickoff_time}\n"
        f"Mode preference: {req.mode_preference}"
    )
    answer = await llm_service.get_completion(SYSTEM_PROMPT, prompt)
    return {"recommendation": answer, "venue_id": req.venue_id}
