"""FastAPI Application Server Configuration (Task 8.1).

Initializes the FastAPI application, CORS middleware, lifespan events,
and mounts the lead discovery API endpoints.
"""

from __future__ import annotations

from contextlib import asynccontextmanager
from pathlib import Path
from typing import Any, AsyncGenerator, Union
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import HTMLResponse, JSONResponse
from loguru import logger

from src.api.routes import router, UPLOADS_DIR
from src.storage.database import LocalDatabase

TEMPLATES_DIR = Path(__file__).resolve().parent / "templates"
DASHBOARD_HTML_FILE = TEMPLATES_DIR / "dashboard.html"


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

    def _get_dashboard_html() -> str:
        if DASHBOARD_HTML_FILE.exists():
            return DASHBOARD_HTML_FILE.read_text(encoding="utf-8")
        return "<html><body><h1>CQ Scraper Dashboard</h1></body></html>"

    @application.get("/dashboard", response_class=HTMLResponse, tags=["Dashboard"])
    async def dashboard_view() -> HTMLResponse:
        """Renders the full modern frontend dashboard."""
        return HTMLResponse(content=_get_dashboard_html())

    @application.get("/", tags=["Root"], response_model=None)
    async def root_index(request: Request) -> Any:
        accept_header = request.headers.get("accept", "")
        # If requested by a web browser directly, deliver the visual dashboard
        if "text/html" in accept_header and "application/json" not in accept_header:
            return HTMLResponse(content=_get_dashboard_html())

        return JSONResponse(content={
            "service": "Autonomous Lead Discovery & Verification Agent API",
            "status": "online",
            "version": "1.0.0",
            "docs_url": "/docs",
            "health_url": "/api/health",
            "dashboard_url": "/dashboard",
        })

    return application


app = create_app()

