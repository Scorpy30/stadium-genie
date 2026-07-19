# Judging Criteria — Evidence Checklist

Use this as your demo-day checklist. For each criterion, point to the exact
file/feature so judges can verify quickly.

- [ ] Code Quality — backend/app/ layered structure, type hints, docstrings, requirements.txt pinned versions, .gitignore, consistent naming.
- [ ] Security — .env.example (no real secrets committed), core/security.py rate-limit + CORS, Pydantic input validation on every router.
- [ ] Efficiency — async endpoints, streaming responses (llm_service.stream_completion), local Chroma cache instead of network round-trips for repeated FAQ queries.
- [ ] Testing — backend/tests/ pytest suite, .github/workflows/ci.yml runs it automatically.
- [ ] Accessibility — plain-language mode + voice input in frontend/components/ChatWidget.jsx, ARIA labels, high-contrast theme.
- [ ] Problem Statement Alignment — all 8 focus areas implemented as separate, demoable routers (see README table).

## Suggested 3-minute demo script

1. Fan flow (30s): ask ChatWidget "How do I get to Gate B in Spanish and where's the nearest ramp access?" — shows navigation + multilingual + accessibility.
2. Volunteer flow (45s): show a crowd alert firing and the GenAI-suggested action.
3. Organizer dashboard (45s): ask the ops assistant a natural-language question about today's incidents.
4. Sustainability (30s): show the waste-sorting/carbon-tip feature.
5. Close (30s): architecture slide + judging-criteria checklist above.
