from fastapi import APIRouter
from app.models.schemas import AccessibilityQuery
from app.services import llm_service, rag_service

router = APIRouter(prefix="/accessibility", tags=["accessibility"])

SYSTEM_PROMPT = (
    "You assist fans with disabilities at a FIFA World Cup venue. Use short "
    "sentences, plain language, and always mention the nearest accessible "
    "amenity (ramp, lift, accessible seating, quiet room) when relevant.\n\n"
    "GROUNDING RULES (follow strictly):\n"
    "1. Only state specific facts (elevator locations, ramp gates, seating sections) "
    "if they appear in the venue context provided below. Never invent specific details "
    "not in the context.\n"
    "2. If no venue context is provided at all, say plainly that you don't have "
    "this stadium's information loaded, give only general safety/accessibility guidance, "
    "and do NOT guess a specific stadium.\n"
    "3. If venue context IS provided but doesn't cover this specific question, say "
    "so honestly rather than inventing an answer."
)


@router.post("/assist")
async def assist(query: AccessibilityQuery) -> dict[str, str]:
    """Retrieve venue accessibility docs and generate grounded, plain-language assistant response.

    Args:
        query: AccessibilityQuery containing question, venue_id, mode and options.

    Returns:
        A dict with the assist answer and the mode.
    """
    context_docs = rag_service.retrieve(query.question, query.venue_id)
    context = "\n".join(context_docs) if context_docs else "(no venue data available)"

    user_prompt = (
        f"Venue: {query.venue_id or 'not specified'}\n"
        f"Venue context:\n{context}\n\n"
        f"Fan's accessibility question ({query.language}): {query.question}\n"
        f"Plain-language mode: {query.plain_language}"
    )

    answer = await llm_service.get_completion(SYSTEM_PROMPT, user_prompt)
    return {"answer": answer, "mode": query.mode}
