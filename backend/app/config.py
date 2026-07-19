"""Centralised, env-driven configuration. No secrets are hard-coded."""
import os
from dotenv import load_dotenv

load_dotenv()


class Settings:
    """Central configuration class loading values from environment variables.

    Attributes:
        LLM_PROVIDER: LLM API provider choice (e.g. groq, gemini, openai, ollama).
        LLM_API_KEY: Authentication key for the selected LLM provider.
        LLM_MODEL: Model identifier string.
        ALLOWED_ORIGINS: List of origins allowed by CORS.
        RATE_LIMIT: Global rate limit string (e.g. '60/minute').
    """
    LLM_PROVIDER: str = os.getenv("LLM_PROVIDER", "groq")
    LLM_API_KEY: str = os.getenv("LLM_API_KEY", "")
    LLM_MODEL: str = os.getenv("LLM_MODEL", "openai/gpt-oss-120b")
    ALLOWED_ORIGINS: list[str] = os.getenv("ALLOWED_ORIGINS", "http://localhost:3000").split(",")
    RATE_LIMIT: str = os.getenv("RATE_LIMIT", "60/minute")


settings = Settings()
