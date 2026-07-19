from fastapi import APIRouter
from app.models.schemas import MultilingualChatQuery
from app.services import llm_service, rag_service, crowd_predictor

router = APIRouter(prefix="/multilingual", tags=["multilingual"])

SYSTEM_PROMPT = (
    "You are a multilingual FIFA World Cup 2026 venue assistant. Reply "
    "fluently in the fan's requested language.\n\n"
    "GROUNDING RULES (follow strictly):\n"
    "1. Only state specific facts (distances, directions, gate/entrance "
    "names, times) if they appear in the venue context below. Never invent "
    "specific numbers, entrance codes, or directions that are not in the "
    "context.\n"
    "2. If no venue context is provided, say plainly that you don't have "
    "this stadium's information loaded, offer only general guidance, and "
    "do NOT guess which stadium the fan means.\n"
    "3. If venue context IS provided but doesn't cover this question, say "
    "so honestly rather than inventing an answer.\n"
    "4. If the fan asks about crowds/busy areas/wait times, use the LIVE "
    "CROWD STATUS section below if present. If it's empty or doesn't cover "
    "the zone they asked about, say plainly that no live data is "
    "available for that zone right now."
)


@router.post("/chat")
async def chat(query: MultilingualChatQuery) -> dict[str, str | None]:
    """Process a multilingual RAG chat query for a specific venue.

    Retrieves context docs based on the query and current venue_id, compiles
    live crowd alerts, and sends a prompt to the LLM to get a grounded response
    in the requested language.

    Args:
        query: MultilingualChatQuery containing the query question, language,
               session_id and venue_id.

    Returns:
        A dict with keys: answer, session_id, and venue_id.
    """
    context_docs = rag_service.retrieve(query.question, query.venue_id)
    context = "\n".join(
        context_docs) if context_docs else "(no venue data available)"

    crowd_statuses = crowd_predictor.get_all_status()
    crowd_summary = (
        "\n".join(
            f"Zone {c['zone_id']}: {c['current_load_pct']}% capacity, trend={c['trend']}, alert={c['alert']}"
            for c in crowd_statuses
        )
        if crowd_statuses
        else "(no live crowd data has been reported yet)"
    )

    prompt = (
        f"Venue: {query.venue_id or 'not specified'}\n"
        f"Venue context:\n{context}\n\n"
        f"LIVE CROWD STATUS:\n{crowd_summary}\n\n"
        f"Language: {query.language}\nQuestion: {query.question}"
    )
    answer = await llm_service.get_completion(SYSTEM_PROMPT, prompt)
    return {"answer": answer, "session_id": query.session_id, "venue_id": query.venue_id}
