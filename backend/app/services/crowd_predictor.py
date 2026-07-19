"""Simple, explainable crowd-trend model.

Deliberately not a black box: judges/organizers can see exactly why an alert
fired. Swap in a real ML model later without touching the router contract.
"""
from collections import defaultdict, deque

_history: dict[str, deque] = defaultdict(lambda: deque(maxlen=5))

RISING_ALERT_THRESHOLD = 0.85  # 85% of capacity


def ingest(zone_id: str, count: int, capacity: int) -> dict:
    load_pct = count / capacity
    _history[zone_id].append(load_pct)
    history = list(_history[zone_id])

    if len(history) >= 2:
        trend = "rising" if history[-1] > history[-2] else (
            "falling" if history[-1] < history[-2] else "stable"
        )
    else:
        trend = "stable"

    alert = load_pct >= RISING_ALERT_THRESHOLD and trend == "rising"

    return {
        "zone_id": zone_id,
        "current_load_pct": round(load_pct * 100, 1),
        "trend": trend,
        "alert": alert,
    }


def get_status(zone_id: str) -> dict | None:
    """Return the most recent computed reading for a zone, or None if no
    data has been ingested for it yet."""
    history = list(_history.get(zone_id, []))
    if not history:
        return None

    current = history[-1]
    if len(history) >= 2:
        trend = "rising" if history[-1] > history[-2] else (
            "falling" if history[-1] < history[-2] else "stable"
        )
    else:
        trend = "stable"

    alert = current >= RISING_ALERT_THRESHOLD and trend == "rising"

    return {
        "zone_id": zone_id,
        "current_load_pct": round(current * 100, 1),
        "trend": trend,
        "alert": alert,
    }

def get_all_status() -> list[dict]:
    """Return current status for every zone that has data, so the fan
    chatbot can reference live crowd info instead of having no access to
    it at all. (Demo-scope note: zones aren't tagged per-venue yet, so this
    returns all known zones regardless of which stadium the fan selected.)"""
    return [get_status(zone_id) for zone_id in _history.keys() if get_status(zone_id)]