"""Single source of truth for API request/response contracts."""
from pydantic import BaseModel, Field
from typing import Literal


class NavigationQuery(BaseModel):
    """Schema representing a fan's wayfinding query.

    Attributes:
        question: The natural-language query describing the desired destination.
        language: The target language code (defaults to 'en').
        user_zone: The optional current zone where the user is located.
        venue_id: The venue identifier, automatically set by the frontend client.
    """
    question: str = Field(..., min_length=1, max_length=500, description="Wayfinding question")
    language: str = Field(default="en", max_length=10, description="Language of response")
    user_zone: str | None = Field(default=None, description="Current zone of user")
    venue_id: str | None = Field(default=None, description="ID of the venue")


class NavigationResponse(BaseModel):
    """Schema representing the generated navigation response.

    Attributes:
        answer: The full text of the wayfinding instructions.
        steps: Structured list of individual turn-by-turn steps.
        language: Language of the instructions.
    """
    answer: str = Field(..., description="Full textual wayfinding guidance")
    steps: list[str] = Field(..., description="Step-by-step navigation instructions")
    language: str = Field(..., description="Target language of the steps")


class CrowdIngest(BaseModel):
    """Schema representing live crowd counts pushed from sensors or staff.

    Attributes:
        zone_id: Identifier of the zone being updated.
        gate_id: Identifier of the associated gate.
        count: Current number of fans counted in the zone.
        capacity: Maximum safe capacity of the zone.
    """
    zone_id: str = Field(..., description="ID of the stadium zone")
    gate_id: str = Field(..., description="ID of the associated gate")
    count: int = Field(..., ge=0, description="Current fan count")
    capacity: int = Field(..., gt=0, description="Maximum zone capacity")


class CrowdStatus(BaseModel):
    """Schema representing the computed crowd status and warnings for a zone.

    Attributes:
        zone_id: Identifier of the zone.
        current_load_pct: Percentage of capacity currently occupied.
        trend: The direction of the crowd flow (rising, stable, falling).
        alert: Boolean flag indicating if congestion is critical.
    """
    zone_id: str = Field(..., description="ID of the stadium zone")
    current_load_pct: float = Field(..., description="Current occupancy percentage")
    trend: Literal["rising", "stable", "falling"] = Field(..., description="Flow density trend")
    alert: bool = Field(..., description="Flag indicating high density alert")


class AccessibilityQuery(BaseModel):
    """Schema representing an accessibility assistance request.

    Attributes:
        question: The assistance question (e.g. wheelchair ramp locations).
        mode: Input format (voice or text).
        plain_language: If true, requests simplified, clear guidance.
        venue_id: Scoped venue identifier.
        language: Target response language.
    """
    question: str = Field(..., description="Accessibility support query")
    mode: Literal["voice", "text"] = Field(default="text", description="Input mode")
    plain_language: bool = Field(default=True, description="Request simplified plain-language")
    venue_id: str | None = Field(default=None, description="ID of the venue")
    language: str = Field(default="en", description="Target language of query")


class TransportRequest(BaseModel):
    """Schema representing a matchday transport recommendation request.

    Attributes:
        venue_id: The venue destination.
        origin_type: Type of origin location (airport, bus_stop, etc.).
        origin_name: Name of the starting location.
        kickoff_time: Kickoff datetime in ISO 8601 format.
        mode_preference: Mode preference (any, transit, drive, walk).
    """
    venue_id: str | None = Field(default=None, description="Target venue ID")
    origin_type: Literal["airport", "bus_stop", "train_station", "other"] = Field(
        default="other", description="Type of starting location"
    )
    origin_name: str = Field(
        ..., min_length=1, max_length=200, description="Name/address of starting point"
    )
    kickoff_time: str = Field(..., description="ISO 8601 kickoff time")
    mode_preference: Literal["any", "transit", "drive", "walk"] = Field(
        default="any", description="Preferred transport mode"
    )


class SustainabilityQuery(BaseModel):
    """Schema representing a waste item classification request.

    Attributes:
        item_description: Short text describing the waste object.
    """
    item_description: str = Field(
        ..., min_length=1, max_length=300, description="Description of waste item"
    )


class SustainabilityClassification(BaseModel):
    """Schema representing the classification response from the Sustainability Coach.

    Attributes:
        predicted_category: The target waste bin category.
        disposal_instruction: One short instruction for how to throw it away.
        confidence: Confidence score of the classifier model.
    """
    predicted_category: Literal["recyclable", "compost", "landfill", "hazardous"] = Field(
        ..., description="Categorization of the waste item"
    )
    disposal_instruction: str = Field(..., description="Concise disposal instructions")
    confidence: float = Field(..., description="Classification model confidence")


class MultilingualChatQuery(BaseModel):
    """Schema representing a multilingual RAG chat message.

    Attributes:
        question: Message text from the fan.
        language: Code of the fan's language.
        session_id: Active chat session identifier.
        venue_id: Target venue ID.
    """
    question: str = Field(..., description="RAG chat question text")
    language: str = Field(default="en", description="Target language of conversation")
    session_id: str = Field(..., description="Session identifier for tracking state")
    venue_id: str | None = Field(default=None, description="Active venue ID")


class DecisionSupportRequest(BaseModel):
    """Schema representing a real-time operational decision support request.

    Attributes:
        zone_metrics: Dict mapping zones (e.g. zone_a) to load percentages (0.0-1.0).
        active_incidents: List of textual descriptions of active incident logs.
    """
    zone_metrics: dict[str, float] = Field(..., description="Live zone occupancy metrics")
    active_incidents: list[str] = Field(
        default_factory=list, description="Descriptions of active operational incidents"
    )


class RecommendedAction(BaseModel):
    """Schema representing a single recommended operational action.

    Attributes:
        action: Concrete action title.
        priority: Priority tier (low, medium, high, critical).
        rationale: Explanatory reasoning behind the action.
    """
    action: str = Field(..., description="Operational action recommended")
    priority: Literal["low", "medium", "high", "critical"] = Field(
        ..., description="Priority tier"
    )
    rationale: str = Field(..., description="Explanation for recommendations")


class DecisionSupportResponse(BaseModel):
    """Schema representing the response containing recommended operational actions.

    Attributes:
        actions: List of recommended actions.
    """
    actions: list[RecommendedAction] = Field(..., description="Recommended actions list")
