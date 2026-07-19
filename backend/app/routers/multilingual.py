from fastapi import APIRouter
from app.models.schemas import MultilingualChatQuery
from app.services import llm_service, rag_service

router = APIRouter(prefix="/multilingual", tags=["multilingual"])

SYSTEM_PROMPT = (
    "You are a multilingual FIFA World Cup 2026 venue assistant. Reply "
    "fluently in the fan's requested language.\n\n"
    "GROUNDING RULES (follow strictly):\n"
    "1. Only state specific facts (distances, directions, gate/entrance "
    "names, times) if they appear in the venue context provided below. "
    "Never invent specific numbers, entrance codes, or directions that are "
    "not in the context.\n"
    "2. If no venue context is provided, say plainly that you don't have "
    "this stadium's information loaded, offer only general guidance (e.g. "
    "accessible entrances are typically marked with the wheelchair symbol "
    "and staffed), and do NOT guess which stadium the fan means.\n"
    "3. If venue context IS provided but doesn't cover this question, say "
    "so honestly rather than inventing an answer."
)


@router.post("/chat")
async def chat(query: MultilingualChatQuery):
    context_docs = rag_service.retrieve(query.question, query.venue_id)
    context = "\n".join(context_docs) if context_docs else "(no venue data available)"
    prompt = (
        f"Venue: {query.venue_id or 'not specified'}\n"
        f"Context:\n{context}\n\n"
        f"Language: {query.language}\nQuestion: {query.question}"
    )
    answer = await llm_service.get_completion(SYSTEM_PROMPT, prompt)
    return {"answer": answer, "session_id": query.session_id, "venue_id": query.venue_id}
