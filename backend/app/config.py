"""Centralised, env-driven configuration. No secrets are hard-coded."""
import os
from dotenv import load_dotenv

load_dotenv()


class Settings:
    LLM_PROVIDER: str = os.getenv("LLM_PROVIDER", "groq")  # groq | gemini | openai | ollama
    LLM_API_KEY: str = os.getenv("LLM_API_KEY", "")
    LLM_MODEL: str = os.getenv("LLM_MODEL", "openai/gpt-oss-120b")
    ALLOWED_ORIGINS: list[str] = os.getenv("ALLOWED_ORIGINS", "http://localhost:3000").split(",")
    RATE_LIMIT: str = os.getenv("RATE_LIMIT", "60/minute")


settings = Settings()
