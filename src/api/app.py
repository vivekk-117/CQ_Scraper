"""FastAPI Application Server Configuration (Task 8.1).

Initializes the FastAPI application, CORS middleware, lifespan events,
and mounts the lead discovery API endpoints.
"""

from __future__ import annotations

from contextlib import asynccontextmanager
from typing import AsyncGenerator
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from loguru import logger

from src.api.routes import router, UPLOADS_DIR
from src.storage.database import LocalDatabase


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    """Startup and shutdown lifecycle manager."""
    logger.info("Initializing CQ Scraper FastAPI server...")
    # Ensure database tables and upload folders are ready
    UPLOADS_DIR.mkdir(parents=True, exist_ok=True)
    db = LocalDatabase()
    await db.init_db()
    logger.info("Local SQLite database initialized and ready.")
    yield
    logger.info("Shutting down CQ Scraper FastAPI server.")


def create_app() -> FastAPI:
    """Application factory for CQ Scraper API."""
    application = FastAPI(
        title="CQ Scraper - Autonomous Lead Discovery & Verification API",
        description=(
            "LangGraph-powered autonomous agent for extracting and verifying "
            "B2B sponsors and collegiate delegations from event brochures and search prompts."
        ),
        version="1.0.0",
        lifespan=lifespan,
    )

    # Configure CORS for Next.js and frontend dashboards
    application.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # Mount API routers
    application.include_router(router)

    @application.get("/", tags=["Root"])
    async def root_index() -> dict[str, str]:
        return {
            "service": "Autonomous Lead Discovery & Verification Agent API",
            "status": "online",
            "version": "1.0.0",
            "docs_url": "/docs",
            "health_url": "/api/health",
        }

    return application


app = create_app()

