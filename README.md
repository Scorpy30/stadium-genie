# StadiumGenie — GenAI Copilot for FIFA World Cup 2026 Stadium Operations

StadiumGenie is a multilingual, GenAI-powered operations and experience layer for
World Cup venues. It serves three user groups from one platform:

- **Fans** — wayfinding, multilingual chat assistant, accessibility support, live
  transport/parking guidance, sustainability tips (gamified).
- **Volunteers / Venue Staff** — a real-time ops console with GenAI-generated
  incident summaries, crowd-density alerts, and suggested next actions.
- **Organizers** — an operational-intelligence dashboard aggregating gate flow,
  incident logs, and sustainability metrics, with an LLM that answers natural
  language questions ("Which gate is trending toward overcrowding in the next
  15 minutes?").

## Why this maps to the 8 focus areas

| Focus area | Feature | Where |
|---|---|---|
| Navigation | Turn-by-turn text wayfinding + AI chat ("nearest accessible restroom near Gate C") | `backend/app/routers/navigation.py`, `frontend/components/ChatWidget.jsx` |
| Crowd management | Density prediction + GenAI-written staff alerts | `backend/app/services/crowd_predictor.py`, `routers/crowd.py` |
| Accessibility | Screen-reader-first UI, plain-language mode, ARIA live regions, high-contrast support | `routers/accessibility.py`, frontend a11y patterns |
| Transportation | Live transit/parking summarized into a single recommendation by the LLM | `routers/transport.py` |
| Sustainability | Waste-sorting image classification + carbon-footprint chat coach | `routers/sustainability.py` |
| Multilingual assistance | RAG chatbot answering in 10+ languages from venue knowledge base | `services/rag_service.py`, `routers/multilingual.py` |
| Operational intelligence | Org dashboard: GenAI incident digest, anomaly flags | `routers/ops_dashboard.py`, `frontend/pages/dashboard.jsx` |
| Real-time decision support | Recommend actions (e.g., "open Gate D, reroute Zone 3") ranked by an LLM given live metrics | `services/llm_service.py` decision-support prompt chain |

## Judging-criteria alignment

| Criterion | How this repo addresses it |
|---|---|
| **Code Quality** | Layered architecture (routers → services → core), typed Pydantic schemas, linting config, docstrings, `.env.example`, no hard-coded secrets |
| **Security** | All secrets via env vars, input validation with Pydantic, rate limiting hook in `core/security.py`, CORS allow-list, no PII stored beyond session, dependency pin file |
| **Efficiency** | Async FastAPI endpoints, streaming LLM responses, response caching hook for repeated navigation/FAQ queries, lightweight in-memory keyword RAG instead of a heavy vector service |
| **Testing** | `backend/tests` with pytest unit tests for routers/services + CI workflow running them on every push |
| **Accessibility** | ARIA labels, keyboard-navigable components, high-contrast mode, plain-language toggle, `aria-live` response region |
| **Problem statement alignment** | Every one of the 8 requested capabilities (navigation, crowd mgmt, transportation, sustainability, multilingual, accessibility, ops intelligence, real-time decision support) has a dedicated, working module — see table above |

## Tech stack (no GCP credits required)

- **LLM provider (pick one via `.env`, code is provider-agnostic):**
  - Groq API (Llama 3.1 — generous free tier, very fast)
  - Google AI Studio Gemini API key (free tier, *not* GCP billing/credits)
  - OpenAI (pay-as-you-go or free trial)
  - Local via Ollama (fully free, offline) — good fallback for demo day
- **Backend:** FastAPI (Python 3.11), Pydantic v2, Uvicorn
- **RAG / knowledge base:** Lightweight in-memory keyword retrieval, scoped **per venue** (one subfolder per stadium under `data/sample_stadium_docs/`) — no vector DB, no native build dependencies, no cloud cost
- **Frontend:** Next.js + React, Tailwind, i18next for multilingual UI
- **Realtime:** WebSockets for crowd/gate updates
- **Infra:** Docker + docker-compose (runs entirely on a laptop or a free-tier VM — no GCP needed)
- **CI:** GitHub Actions (free for public repos)
- **Testing:** Pytest (backend), Jest/RTL (frontend, optional stretch)

## Multi-venue design (why the assistant never guesses a stadium)

FIFA World Cup 2026 has ~16 host stadiums, and "Gate C" means something
different at every one of them. Rather than asking the fan which stadium
they're at mid-conversation (a poor UX, and easy to get wrong), StadiumGenie
scopes its knowledge base **per venue**:

- Each stadium gets its own subfolder under `data/sample_stadium_docs/`
  (e.g. `metlife/`), loaded independently by `rag_service.py`.
- Every navigation/multilingual request carries a `venue_id` supplied by the
  app itself — from a QR check-in, geofencing, or a venue picker at app
  open — not typed by the fan.
- If `venue_id` is missing or unrecognized, retrieval deliberately returns
  no context, and the system prompt instructs the LLM to say plainly that
  it doesn't have that stadium's data loaded rather than guessing or
  blending in another venue's facts.

This is worth stating explicitly in a demo: it's a deliberate reliability
and scalability decision, not an oversight.

## Known limitations (and how to close them)

- **Sample data only.** `data/sample_stadium_docs/` currently contains three
  placeholder venues (`metlife/`, `sofi/`, `att/`) with fictional facts for
  demo purposes — none of this is real FIFA World Cup 2026 stadium data.
  Add a subfolder per real host stadium (matching its `venue_id`) and the
  same code picks it up automatically — no changes needed.
- **Hallucination guardrail.** Early testing showed the LLM would sometimes
  invent specific details (exact distances, entrance codes) not present in
  the retrieved context, even when correct data was available. The system
  prompts in `navigation.py` and `multilingual.py` now include explicit
  grounding rules: only state specifics that appear in the provided
  context, and say so plainly when the answer isn't in the knowledge base
  — instead of inventing a plausible-sounding but false answer. Worth
  calling out to judges as a deliberate reliability decision, not an
  oversight.

## Quick start

```bash
# 1. Copy the example env file into backend/ and fill in your API key
cp .env.example backend/.env
# (On Windows: copy .env.example backend\.env)

# 2. Edit backend/.env — set LLM_PROVIDER, LLM_API_KEY, LLM_MODEL, ALLOWED_ORIGINS
#    .env.example is a TEMPLATE only — never commit the real .env file.

# 3. Start everything
docker compose up --build     # backend :8000, frontend :3000
```

> **Note for Render / cloud deployments:** The `.env.example` at the repo root is
> a reference template showing the variable names. On Render, add the same
> variables (`LLM_PROVIDER`, `LLM_API_KEY`, `LLM_MODEL`, `ALLOWED_ORIGINS`,
> `RATE_LIMIT`) directly in the **Environment** tab of your backend service.
> Never commit a `.env` containing real secrets to the repo.

## Repository layout

See `docs/ARCHITECTURE.md` for the full component diagram and data flow.
