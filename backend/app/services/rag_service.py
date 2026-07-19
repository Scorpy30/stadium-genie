"""Lightweight in-memory retrieval over venue knowledge (FAQ, signage text,
transit info), scoped per stadium.

Each of the ~16 FIFA World Cup 2026 host stadiums has different gates,
signage, and transit options -- "Gate C" at MetLife means something
completely different than "Gate C" at SoFi. Rather than guessing or
answering generically, this service keeps a separate knowledge base per
venue (one subfolder per venue under data/sample_stadium_docs/) and requires
a venue_id to retrieve anything. The venue_id is expected to come from the
app itself (QR check-in, geofencing, or venue selection at app open) -- not
from asking the fan mid-conversation, which is a poor experience and easy
to get wrong.

This intentionally avoids a vector database: for a hackathon-scale knowledge
base, simple keyword overlap scoring is fast, has zero native/C++ build
dependencies, and is transparent to judges. Swap for embeddings later if a
venue's knowledge base grows past a few hundred documents.
"""
import re
from pathlib import Path

_DOCS: dict[str, list[tuple[str, str]]] = {}  # venue_id -> [(filename, text), ...]

_PROJECT_ROOT = Path(__file__).resolve().parents[3]
_DEFAULT_DOCS_ROOT = _PROJECT_ROOT / "data" / "sample_stadium_docs"


def _tokenize(text: str) -> set[str]:
    """Tokenize text into a set of lowercased alphanumeric tokens."""
    return set(re.findall(r"[a-z0-9]+", text.lower()))


def index_docs(root: str | Path = _DEFAULT_DOCS_ROOT) -> dict[str, int]:
    """Load every venue subfolder under `root` into memory. Each subfolder
    name becomes a venue_id. Safe to call repeatedly -- rebuilds the whole
    index each time. Returns {venue_id: doc_count}."""
    global _DOCS
    _DOCS = {}
    root = Path(root)
    if not root.exists():
        return {}

    for venue_dir in root.iterdir():
        if not venue_dir.is_dir():
            continue
        docs = []
        for path in venue_dir.glob("*.*"):
            docs.append((path.name, path.read_text(encoding="utf-8")))
        if docs:
            _DOCS[venue_dir.name] = docs

    return {venue_id: len(docs) for venue_id, docs in _DOCS.items()}


def list_venues() -> list[str]:
    return list(_DOCS.keys())


def retrieve(query: str, venue_id: str | None, k: int = 3) -> list[str]:
    """Return the top-k documents for a SPECIFIC venue, ranked by token
    overlap with the query. Returns [] if venue_id is missing/unknown so the
    caller's prompt can honestly say it has no data for that venue, rather
    than silently mixing in another stadium's facts."""
    if not venue_id or venue_id not in _DOCS:
        return []

    query_tokens = _tokenize(query)
    scored = []
    for _, text in _DOCS[venue_id]:
        doc_tokens = _tokenize(text)
        overlap = len(query_tokens & doc_tokens)
        if overlap > 0:
            scored.append((overlap, text))

    scored.sort(key=lambda x: x[0], reverse=True)
    return [text for _, text in scored[:k]] or [text for _, text in _DOCS[venue_id][:k]]
