"""Provider-agnostic LLM client.

Swap providers purely via .env — no code changes needed. This is what makes
the project runnable without GCP credits: default to Groq's free tier or a
local Ollama model for the demo, and switch to Gemini/OpenAI if a team member
has a key.
"""
import json
import httpx
from app.config import settings

PROVIDER_ENDPOINTS = {
    "groq": "https://api.groq.com/openai/v1/chat/completions",
    "openai": "https://api.openai.com/v1/chat/completions",
    "gemini": "https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent",
    "ollama": "http://localhost:11434/api/chat",
}


async def get_completion(system_prompt: str, user_prompt: str, json_mode: bool = False) -> str:
    """Return a single completion string. Raises on transport error so
    callers can fail safe (never let a broken LLM call silently corrupt an
    operational decision)."""
    provider = settings.LLM_PROVIDER

    async with httpx.AsyncClient(timeout=20) as client:
        if provider in ("groq", "openai"):
            resp = await client.post(
                PROVIDER_ENDPOINTS[provider],
                headers={"Authorization": f"Bearer {settings.LLM_API_KEY}"},
                json={
                    "model": settings.LLM_MODEL,
                    "messages": [
                        {"role": "system", "content": system_prompt},
                        {"role": "user", "content": user_prompt},
                    ],
                    "response_format": {"type": "json_object"} if json_mode else None,
                },
            )
            resp.raise_for_status()
            return resp.json()["choices"][0]["message"]["content"]

        if provider == "ollama":
            resp = await client.post(
                PROVIDER_ENDPOINTS["ollama"],
                json={
                    "model": settings.LLM_MODEL,
                    "messages": [
                        {"role": "system", "content": system_prompt},
                        {"role": "user", "content": user_prompt},
                    ],
                    "stream": False,
                },
            )
            resp.raise_for_status()
            return resp.json()["message"]["content"]

        if provider == "gemini":
            url = PROVIDER_ENDPOINTS["gemini"].format(model=settings.LLM_MODEL)
            resp = await client.post(
                f"{url}?key={settings.LLM_API_KEY}",
                json={"contents": [{"parts": [{"text": f"{system_prompt}\n\n{user_prompt}"}]}]},
            )
            resp.raise_for_status()
            return resp.json()["candidates"][0]["content"]["parts"][0]["text"]

    raise ValueError(f"Unsupported LLM_PROVIDER: {provider}")


async def get_structured_completion(system_prompt: str, user_prompt: str) -> dict:
    """Ask for JSON and parse it defensively — never trust raw LLM text for
    anything that will drive an operational recommendation."""
    raw = await get_completion(system_prompt, user_prompt, json_mode=True)
    cleaned = raw.strip().removeprefix("```json").removesuffix("```").strip()
    return json.loads(cleaned)
