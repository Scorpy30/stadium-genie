"""FastAPI router to list loaded venues.

Enables the frontend to populate the stadium selector from active documentation folders.
"""
from fastapi import APIRouter
from app.services import rag_service

router = APIRouter(prefix="/venues", tags=["venues"])

# Friendly display names for known venue_ids. Add an entry here whenever a
# new venue subfolder is added under data/sample_stadium_docs/ -- if a
# venue_id has no entry, we fall back to a titleized version of the id so
# nothing breaks.
VENUE_DISPLAY_NAMES = {
    "metlife": "MetLife Stadium (New York/New Jersey)",
    "sofi": "SoFi Stadium (Los Angeles)",
    "att": "AT&T Stadium (Dallas)",
}


@router.get("")
async def list_venues() -> dict[str, list[dict[str, str]]]:
    """Return every venue currently loaded in the knowledge base, for the
    frontend's venue selector.

    Only venues with real subfolders under data/sample_stadium_docs/ show up
    here -- this list is never hand-maintained separately from the actual data.

    Returns:
        A dict with the 'venues' list, where each item contains venue_id and name.
    """
    venue_ids = rag_service.list_venues()
    return {
        "venues": [
            {"venue_id": vid, "name": VENUE_DISPLAY_NAMES.get(vid, vid.replace("-", " ").title())}
            for vid in sorted(venue_ids)
        ]
    }
