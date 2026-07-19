from fastapi import APIRouter
from app.models.schemas import DecisionSupportRequest, DecisionSupportResponse, RecommendedAction
from app.services import llm_service

router = APIRouter(prefix="/ops", tags=["ops"])

SUMMARY_PROMPT = (
    "You are writing a concise shift-handover digest for World Cup venue "
    "organizers, summarizing incidents and crowd trends in under 120 words."
)

DECISION_PROMPT = (
    "Given live zone metrics and active incidents at a World Cup stadium, "
    "output a JSON object: {\"actions\": [{\"action\": str, \"priority\": "
    "\"low|medium|high|critical\", \"rationale\": str}]}. Recommend at most "
    "4 concrete, operationally realistic actions."
)


@router.get("/summary")
async def summary(incident_log: str = "") -> dict[str, str]:
    """Generate a GenAI-written concise shift-handover digest for venue organizers.

    Args:
        incident_log: Raw log text of active incidents and shift activities.

    Returns:
        A dict containing the summarized 'digest' string.
    """
    text = await llm_service.get_completion(SUMMARY_PROMPT, incident_log or "No incidents logged.")
    return {"digest": text}


@router.post("/decision-support", response_model=DecisionSupportResponse)
async def decision_support(req: DecisionSupportRequest) -> DecisionSupportResponse:
    """Generate structured recommended-actions with priority based on live metrics.

    Uses LLM reasoning to evaluate current zone densities and active incidents,
    producing up to 4 concrete, actionable operational decisions.

    Args:
        req: DecisionSupportRequest containing zone_metrics and active_incidents list.

    Returns:
        A DecisionSupportResponse containing validated RecommendedAction structures.
    """
    user_prompt = (
        f"Zone metrics: {req.zone_metrics}\nActive incidents: {req.active_incidents}"
    )
    data = await llm_service.get_structured_completion(DECISION_PROMPT, user_prompt)
    actions = [RecommendedAction(**a) for a in data.get("actions", [])]
    return DecisionSupportResponse(actions=actions)
