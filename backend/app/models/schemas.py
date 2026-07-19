"""Single source of truth for API request/response contracts."""
from pydantic import BaseModel, Field
from typing import Literal


class NavigationQuery(BaseModel):
    question: str = Field(..., min_length=1, max_length=500)
    language: str = Field(default="en", max_length=10)
    user_zone: str | None = None
    venue_id: str | None = None  # e.g. "metlife" -- set by the app (QR/geofence/venue picker), not asked in chat


class NavigationResponse(BaseModel):
    answer: str
    steps: list[str]
    language: str


class CrowdIngest(BaseModel):
    zone_id: str
    gate_id: str
    count: int = Field(..., ge=0)
    capacity: int = Field(..., gt=0)


class CrowdStatus(BaseModel):
    zone_id: str
    current_load_pct: float
    trend: Literal["rising", "stable", "falling"]
    alert: bool


class AccessibilityQuery(BaseModel):
    question: str
    mode: Literal["voice", "text"] = "text"
    plain_language: bool = True
    venue_id: str | None = None
    language: str = "en"


class TransportRequest(BaseModel):
    venue_id: str | None = None
    origin_type: Literal["airport", "bus_stop", "train_station", "other"] = "other"
    origin_name: str = Field(..., min_length=1, max_length=200)  # e.g. "JFK Airport", "Journal Square PATH"
    kickoff_time: str  # ISO 8601
    mode_preference: Literal["any", "transit", "drive", "walk"] = "any"


class SustainabilityQuery(BaseModel):
    item_description: str = Field(..., min_length=1, max_length=300)


class SustainabilityClassification(BaseModel):
    predicted_category: Literal["recyclable", "compost", "landfill", "hazardous"]
    disposal_instruction: str
    confidence: float


class MultilingualChatQuery(BaseModel):
    question: str
    language: str = "en"
    session_id: str
    venue_id: str | None = None  # e.g. "metlife" -- set by the app, not asked in chat


class DecisionSupportRequest(BaseModel):
    zone_metrics: dict[str, float]
    active_incidents: list[str] = []


class RecommendedAction(BaseModel):
    action: str
    priority: Literal["low", "medium", "high", "critical"]
    rationale: str


class DecisionSupportResponse(BaseModel):
    actions: list[RecommendedAction]
