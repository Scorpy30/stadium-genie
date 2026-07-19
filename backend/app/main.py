"""Main FastAPI application entry point.

Initializes the FastAPI application, sets up lifespan events (loading venue documentation),
adds security middlewares, registers routers, and exposes global health endpoints.
"""
from contextlib import asynccontextmanager
from typing import AsyncGenerator
from fastapi import FastAPI
from app.core.security import add_security_middleware
from app.core.logging_config import configure_logging
from app.services import rag_service
from app.routers import (
    navigation,
    crowd,
    accessibility,
    transport,
    sustainability,
    multilingual,
    ops_dashboard,
    venues,
)

logger = configure_logging()


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    """Load the venue knowledge base into memory every time the server
    starts. Without this, the in-memory RAG index resets on every restart
    (including uvicorn --reload triggering on file changes), and the
    assistant would correctly-but-unhelpfully report having no venue data."""
    count = rag_service.index_docs()
    logger.info(f"Loaded venue knowledge bases: {count}")
    yield


app = FastAPI(
    title="StadiumGenie API",
    description="GenAI copilot for FIFA World Cup 2026 stadium operations",
    version="1.0.0",
    lifespan=lifespan,
)

add_security_middleware(app)

for router in (
    navigation.router,
    crowd.router,
    accessibility.router,
    transport.router,
    sustainability.router,
    multilingual.router,
    ops_dashboard.router,
    venues.router,
):
    app.include_router(router, prefix="/api/v1")


@app.get("/health")
async def health() -> dict[str, str]:
    """Expose a simple health check endpoint.

    Returns:
        A dictionary containing the API status.
    """
    return {"status": "ok"}
