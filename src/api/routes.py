"""FastAPI API Endpoints & Background Task Controller (Task 8.1).

Defines REST and SSE endpoints for initiating agent discovery runs,
streaming real-time LangGraph execution logs and verified leads, and retrieving
persisted results from the SQLite database.
"""

from __future__ import annotations

import asyncio
import datetime
import os
from pathlib import Path
from typing import Any, Optional
import uuid
from fastapi import APIRouter, File, Form, HTTPException, UploadFile, status
from fastapi.responses import JSONResponse, StreamingResponse
from loguru import logger
from pydantic import BaseModel, ConfigDict, Field

from src.api.stream import stream_manager
from src.graph.lead_graph import lead_graph
from src.models.schema import CategoryEnum, FinalLeadRecord
from src.models.state import AgentState, create_initial_state
from src.storage.database import LocalDatabase


router = APIRouter(prefix="/api", tags=["Lead Discovery Agent"])

UPLOADS_DIR = Path(__file__).resolve().parent.parent.parent / "data" / "uploads"
UPLOADS_DIR.mkdir(parents=True, exist_ok=True)


# ==============================================================================
# Request & Response Schemas
# ==============================================================================

class RunInitiatedResponse(BaseModel):
    """Response returned immediately upon starting an agent run."""
    model_config = ConfigDict(extra="ignore")

    session_id: str
    status: str = "started"
    message: str
    stream_url: str
    leads_url: str


class LeadSummaryResponse(BaseModel):
    """Summary of verified leads collected in a session."""
    model_config = ConfigDict(extra="ignore")

    session_id: str
    total_leads: int
    is_complete: bool
    google_sheet_url: Optional[str] = None
    leads: list[dict[str, Any]] = Field(default_factory=list)


class RunStatusResponse(BaseModel):
    """Execution status and metadata for a session."""
    model_config = ConfigDict(extra="ignore")

    session_id: str
    is_complete: bool
    total_leads_found: int
    google_sheet_url: Optional[str] = None
    started_at: Optional[str] = None
    completed_at: Optional[str] = None
    recent_logs: list[dict[str, Any]] = Field(default_factory=list)


# ==============================================================================
# Background Graph Execution Task
# ==============================================================================

async def _run_agent_pipeline_background(
    session_id: str,
    initial_state: AgentState,
    db: LocalDatabase,
) -> None:
    """Executes the compiled LangGraph workflow asynchronously, emitting SSE events at each node."""
    logger.info(f"Starting background agent execution for session: {session_id}")
    seen_lead_channels: set[str] = set()
    latest_sheet_url: Optional[str] = None
    total_verified = 0

    all_verified_records: list[FinalLeadRecord] = []
    all_audit_logs: list[dict[str, Any]] = []

    try:
        # 1. Initialize DB run record
        await db.create_or_update_run(
            session_id=session_id,
            search_prompt=initial_state.get("search_prompt"),
            brochure_path=initial_state.get("brochure_path"),
            category_focus=initial_state.get("category_focus"),
            is_complete=False,
            total_leads_found=0,
        )

        await stream_manager.publish_event(
            session_id=session_id,
            event_type="session_start",
            data={
                "session_id": session_id,
                "search_prompt": initial_state.get("search_prompt"),
                "category_focus": initial_state.get("category_focus"),
                "has_brochure": bool(initial_state.get("brochure_path")),
            },
        )

        config = {"configurable": {"thread_id": session_id}}

        # 2. Iterate through LangGraph nodes via astream()
        async for state_chunk in lead_graph.astream(initial_state, config=config):
            for node_name, node_output in state_chunk.items():
                if not isinstance(node_output, dict):
                    continue

                # Publish node transition event
                await stream_manager.publish_event(
                    session_id=session_id,
                    event_type="node_start",
                    data={
                        "node": node_name,
                        "session_id": session_id,
                    },
                )

                # Publish new audit logs
                new_logs = node_output.get("audit_logs", [])
                for log_item in new_logs:
                    if isinstance(log_item, dict):
                        all_audit_logs.append(log_item)
                        await stream_manager.publish_event(
                            session_id=session_id,
                            event_type="log",
                            data=log_item,
                        )

                # Check for newly verified leads
                verified_leads = node_output.get("verified_leads", [])
                for lead in verified_leads:
                    # Unpack dict or FinalLeadRecord
                    record: Optional[FinalLeadRecord] = None
                    if isinstance(lead, FinalLeadRecord):
                        record = lead
                        lead_dict = lead.model_dump(by_alias=True)
                    elif isinstance(lead, dict):
                        try:
                            record = FinalLeadRecord.model_validate(lead)
                        except Exception:
                            record = None
                        lead_dict = lead
                    else:
                        lead_dict = {}

                    channel = lead_dict.get("contact_channel") or lead_dict.get("Contact Channel", "")

                    if channel and channel not in seen_lead_channels:
                        seen_lead_channels.add(channel)
                        total_verified += 1
                        if record:
                            all_verified_records.append(record)
                            try:
                                await db.save_lead(session_id, record)
                            except Exception as save_err:
                                logger.warning(f"Error saving lead to db: {save_err}")

                        await stream_manager.publish_event(
                            session_id=session_id,
                            event_type="lead_found",
                            data=lead_dict,
                        )

                # Capture updated sheet URL
                if node_output.get("google_sheet_url"):
                    latest_sheet_url = node_output["google_sheet_url"]
                    await stream_manager.publish_event(
                        session_id=session_id,
                        event_type="sheet_synced",
                        data={
                            "google_sheet_url": latest_sheet_url,
                            "rows_synced": node_output.get("rows_synced_count", total_verified),
                        },
                    )

        # 3. Finalize run and save audit logs in DB
        if all_audit_logs:
            try:
                await db.save_audit_logs(session_id, all_audit_logs)
            except Exception as log_err:
                logger.warning(f"Error saving audit logs to db: {log_err}")

        await db.create_or_update_run(
            session_id=session_id,
            is_complete=True,
            total_leads_found=total_verified,
            google_sheet_url=latest_sheet_url,
        )

        # 4. Dispatch complete event
        await stream_manager.publish_event(
            session_id=session_id,
            event_type="complete",
            data={
                "session_id": session_id,
                "is_complete": True,
                "total_leads": total_verified,
                "google_sheet_url": latest_sheet_url,
            },
        )
        logger.info(f"Agent session {session_id} completed successfully. Found {total_verified} leads.")

    except Exception as e:
        logger.error(f"Error in background execution for {session_id}: {e}")
        await stream_manager.publish_event(
            session_id=session_id,
            event_type="error",
            data={"message": str(e), "session_id": session_id},
        )
        await stream_manager.publish_event(
            session_id=session_id,
            event_type="complete",
            data={"session_id": session_id, "is_complete": True, "error": str(e)},
        )


# ==============================================================================
# API Endpoints
# ==============================================================================

@router.post(
    "/run",
    response_model=RunInitiatedResponse,
    status_code=status.HTTP_202_ACCEPTED,
    summary="Start an autonomous lead discovery run",
)
async def start_run(
    search_prompt: Optional[str] = Form(None),
    category_focus: Optional[str] = Form("Both"),
    max_targets: int = Form(10),
    brochure: Optional[UploadFile] = File(None),
) -> RunInitiatedResponse:
    """Accepts a natural language search query or uploaded brochure PDF and launches the agent."""
    clean_prompt = search_prompt.strip() if search_prompt else None

    # Validate input: either prompt or brochure must be provided
    if not clean_prompt and not brochure:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Either 'search_prompt' or 'brochure' (PDF file) must be provided.",
        )

    saved_brochure_path: Optional[str] = None
    if brochure:
        if not brochure.filename or not brochure.filename.lower().endswith(".pdf"):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid file format. Only PDF files are supported for event brochures.",
            )

        unique_filename = f"{uuid.uuid4().hex[:8]}_{brochure.filename}"
        dest_path = UPLOADS_DIR / unique_filename
        content = await brochure.read()
        dest_path.write_bytes(content)
        saved_brochure_path = str(dest_path)
        logger.info(f"Saved uploaded brochure ({len(content)} bytes) to {saved_brochure_path}")

    session_id = f"run_{uuid.uuid4().hex[:12]}"
    await stream_manager.create_session(session_id)

    db = LocalDatabase()
    await db.init_db()

    initial_state = create_initial_state(
        search_prompt=clean_prompt,
        brochure_path=saved_brochure_path,
        category_focus=category_focus or "Both",
        max_target_count=max(1, min(max_targets, 25)),
    )

    # Launch background task
    asyncio.create_task(
        _run_agent_pipeline_background(session_id, initial_state, db)
    )

    return RunInitiatedResponse(
        session_id=session_id,
        status="started",
        message="Autonomous lead discovery agent launched successfully.",
        stream_url=f"/api/stream/{session_id}",
        leads_url=f"/api/leads/{session_id}",
    )


@router.get(
    "/stream/{session_id}",
    summary="Subscribe to real-time agent execution events (SSE)",
)
async def stream_events(session_id: str) -> StreamingResponse:
    """Streams live Server-Sent Events (SSE) detailing node progression, logs, and discoveries."""
    return StreamingResponse(
        stream_manager.subscribe(session_id),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )


@router.get(
    "/leads/{session_id}",
    response_model=LeadSummaryResponse,
    summary="Retrieve verified leads for a session",
)
async def get_session_leads(session_id: str) -> LeadSummaryResponse:
    """Returns the verified 6-field leads and Google Sheet URL for a given run session."""
    db = LocalDatabase()
    await db.init_db()

    run = await db.get_run_summary(session_id)
    if not run and not stream_manager.get_event_history(session_id):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Session '{session_id}' not found.",
        )

    leads = await db.get_leads_by_session(session_id)
    if not leads:
        for ev in stream_manager.get_event_history(session_id):
            if ev.event_type == "lead_found" and ev.data:
                leads.append(ev.data)

    is_complete = bool(run.get("is_complete")) if run else stream_manager.is_session_complete(session_id)
    sheet_url = run.get("google_sheet_url") if run else None
    if not sheet_url:
        for ev in reversed(stream_manager.get_event_history(session_id)):
            if ev.event_type == "sheet_synced" and ev.data.get("google_sheet_url"):
                sheet_url = ev.data.get("google_sheet_url")
                break

    return LeadSummaryResponse(
        session_id=session_id,
        total_leads=len(leads),
        is_complete=is_complete,
        google_sheet_url=sheet_url,
        leads=leads,
    )


@router.get(
    "/status/{session_id}",
    response_model=RunStatusResponse,
    summary="Get execution status and logs for a session",
)
async def get_session_status(session_id: str) -> RunStatusResponse:
    """Returns execution status, timestamps, and recent audit logs for a run."""
    db = LocalDatabase()
    await db.init_db()

    run = await db.get_run_summary(session_id)
    if not run and not stream_manager.get_event_history(session_id):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Session '{session_id}' not found.",
        )

    logs = await db.get_audit_logs_by_session(session_id)
    if not logs:
        for ev in stream_manager.get_event_history(session_id):
            if ev.event_type == "log" and ev.data:
                logs.append(ev.data)

    is_complete = bool(run.get("is_complete")) if run else stream_manager.is_session_complete(session_id)
    sheet_url = run.get("google_sheet_url") if run else None
    if not sheet_url:
        for ev in reversed(stream_manager.get_event_history(session_id)):
            if ev.event_type == "sheet_synced" and ev.data.get("google_sheet_url"):
                sheet_url = ev.data.get("google_sheet_url")
                break

    leads_count = run.get("total_leads_found", 0) if run else sum(
        1 for ev in stream_manager.get_event_history(session_id) if ev.event_type == "lead_found"
    )

    return RunStatusResponse(
        session_id=session_id,
        is_complete=is_complete,
        total_leads_found=leads_count,
        google_sheet_url=sheet_url,
        started_at=run.get("started_at") if run else None,
        completed_at=run.get("completed_at") if run else None,
        recent_logs=logs[-20:] if logs else [],
    )


@router.get(
    "/health",
    summary="API Health Check",
)
async def health_check() -> dict[str, str]:
    """Health check endpoint to verify backend service readiness."""
    return {"status": "healthy", "service": "CQ_Scraper_API", "version": "1.0.0"}
