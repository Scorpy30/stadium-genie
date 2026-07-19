# API Spec (v1)

Base URL: /api/v1

| Method | Path | Purpose |
|---|---|---|
| POST | /navigation/ask | Natural-language wayfinding query -> route + steps |
| POST | /crowd/ingest | Push gate/zone counts |
| GET  | /crowd/status | Current density + trend per zone |
| POST | /accessibility/assist | Voice/text accessibility query, returns plain-language + audio-ready response |
| POST | /transport/recommend | Given venue, origin type (airport/bus stop/train station/other), origin name, and kickoff time, return best transit/parking option |
| POST | /sustainability/classify | Text description of an item -> waste category + disposal instructions |
| POST | /multilingual/chat | RAG chatbot over venue KB, any supported language |
| GET  | /ops/summary | GenAI-written shift/incident digest for organizers |
| POST | /ops/decision-support | Structured recommended-actions list given live metrics |
| GET  | /venues | List every venue currently loaded (venue_id + display name), for the frontend venue selector |

All POST bodies and responses are defined as Pydantic models in
backend/app/models/schemas.py — keep request/response contracts there so
frontend and backend stay in sync.
