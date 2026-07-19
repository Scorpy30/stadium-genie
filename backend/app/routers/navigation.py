from fastapi import APIRouter
from app.models.schemas import NavigationQuery, NavigationResponse
from app.services import llm_service, rag_service

router = APIRouter(prefix="/navigation", tags=["navigation"])

SYSTEM_PROMPT = (
    "You are a stadium wayfinding assistant for the FIFA World Cup 2026. "
    "Answer concisely with numbered steps.\n\n"
    "GROUNDING RULES (follow strictly):\n"
    "1. Only state specific facts (distances, directions, gate/entrance "
    "names) if they appear in the venue context provided below. Never "
    "invent specific numbers, entrance codes, or directions that are not "
    "in the context.\n"
    "2. If no venue context is provided at all, say plainly that you don't "
    "have this stadium's information loaded, give only general safety/"
    "accessibility guidance, and do NOT guess a specific stadium.\n"
    "3. If venue context IS provided but doesn't cover this specific "
    "question, say so honestly rather than inventing an answer."
)


@router.post("/ask", response_model=NavigationResponse)
async def ask_navigation(query: NavigationQuery):
    context_docs = rag_service.retrieve(query.question, query.venue_id)
    context = "\n".join(context_docs) if context_docs else "(no venue data available)"
    user_prompt = (
        f"Venue: {query.venue_id or 'not specified'}\n"
        f"Venue context:\n{context}\n\n"
        f"Fan is in zone: {query.user_zone or 'unknown'}\n"
        f"Question ({query.language}): {query.question}"
    )
    answer = await llm_service.get_completion(SYSTEM_PROMPT, user_prompt)
    steps = [line.strip() for line in answer.split("\n") if line.strip()]
    return NavigationResponse(answer=answer, steps=steps, language=query.language)
