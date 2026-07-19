# Architecture

```
                     +----------------------------+
                     |      Frontend (Next.js)    |
                     |  Fan App | Volunteer Console | Org Dashboard
                     +--------------+-------------+
                                    | REST + WebSocket
                     +--------------v-------------+
                     |        FastAPI Backend     |
                     |  routers/ (per feature)     |
                     +--+-----------+-----------+-+
                        |           |           |
             +----------v+  +-------v-+  +------v--------+
             |llm_service |  |rag_svc  | |crowd_predictor |
             | (LLM calls)|  |(Chroma) | | (heuristic +   |
             +------+-----+  +----+----+ |  LLM summary)  |
                    |             |      +----------------+
        +-----------v--+   +------v--------+
        | Groq/Gemini/  |   | Venue KB docs |
        | OpenAI/Ollama |   | (data/sample_ |
        |  (pluggable)  |   | stadium_docs) |
        +---------------+   +---------------+
```

## Data flow — real-time decision support example

1. Sensor/manual feed posts gate counts to `POST /crowd/ingest`.
2. `crowd_predictor.py` computes a short-horizon density trend (simple
   moving-average + threshold model — swappable for a real ML model later).
3. When a threshold is crossed, `llm_service.py` is called with a structured
   prompt containing current counts, trend, and static venue capacity data.
4. The LLM returns a ranked list of recommended actions (open gate, reroute
   signage, dispatch volunteers) as structured JSON (validated by a Pydantic
   schema) — never free text to the ops dashboard, to keep it actionable and
   auditable.
5. The dashboard renders the action list; volunteers see a simplified push
   notification version of the same recommendation.

## Security notes

- No user PII persisted beyond an anonymous session id.
- All LLM provider keys read from environment variables only, never committed.
- Every LLM output destined for an operational action is validated against a
  strict schema before it can trigger a UI recommendation (LLM never directly
  controls infrastructure).
- Rate limiting middleware stub in `backend/app/core/security.py`.

## Why not a heavy cloud stack

The brief explicitly rules out GCP credits. This design intentionally runs
entirely on commodity infra (a laptop, a $5 VM, or a free-tier host) using a
local vector store and a swappable LLM provider, so the team is not blocked by
cloud budget during the hackathon or the demo.
