"""Unit and Integration Tests for FastAPI Endpoints & Event Streaming (Phase 8).

Tests:
- Task 8.1: API server endpoints (health, run validation, status, leads retrieval).
- Task 8.2: Server-Sent Events (SSE) streaming generator, historical event replay, and live dispatch.
"""

from __future__ import annotations

import io
from unittest.mock import AsyncMock, patch
import pytest
from fastapi.testclient import TestClient

from src.api.app import app
from src.api.stream import stream_manager
from src.models.schema import (
    CategoryEnum,
    FinalLeadRecord,
    VerificationStatusEnum,
)
from src.storage.database import LocalDatabase


@pytest.fixture
def client():
    """Synchronous test client with lifespan support."""
    with TestClient(app) as c:
        yield c


class TestAPIEndpoints:
    def test_root_index_endpoint(self, client: TestClient):
        """GET / returns service metadata and docs links."""
        res = client.get("/")
        assert res.status_code == 200
        data = res.json()
        assert data["status"] == "online"
        assert "Autonomous Lead Discovery" in data["service"]

    def test_health_check_endpoint(self, client: TestClient):
        """GET /api/health returns service healthy."""
        res = client.get("/api/health")
        assert res.status_code == 200
        data = res.json()
        assert data["status"] == "healthy"
        assert data["service"] == "CQ_Scraper_API"

    def test_run_missing_inputs_returns_400(self, client: TestClient):
        """POST /api/run with no prompt and no brochure returns 400 Bad Request."""
        res = client.post("/api/run", data={})
        assert res.status_code == 400
        assert "Either 'search_prompt' or 'brochure'" in res.json()["detail"]

    def test_run_invalid_file_extension_returns_400(self, client: TestClient):
        """POST /api/run with non-PDF brochure returns 400 Bad Request."""
        file_content = b"fake image content"
        files = {"brochure": ("brochure.jpg", io.BytesIO(file_content), "image/jpeg")}
        res = client.post("/api/run", files=files)
        assert res.status_code == 400
        assert "Only PDF files are supported" in res.json()["detail"]

    def test_run_with_valid_prompt_initiates_session(self, client: TestClient):
        """POST /api/run with valid search prompt returns 202 Accepted and session URLs."""
        with patch("src.api.routes._run_agent_pipeline_background", new=AsyncMock()):
            res = client.post(
                "/api/run",
                data={
                    "search_prompt": "Find AI sponsors in Bengaluru",
                    "category_focus": "Sponsor",
                    "max_targets": "5",
                },
            )
            assert res.status_code == 202
            data = res.json()
            assert data["status"] == "started"
            assert data["session_id"].startswith("run_")
            assert "/api/stream/" in data["stream_url"]
            assert "/api/leads/" in data["leads_url"]

    def test_run_with_valid_pdf_brochure(self, client: TestClient, tmp_path):
        """POST /api/run with valid PDF uploads file and initiates session."""
        pdf_content = b"%PDF-1.4 simulated pdf brochure content"
        files = {"brochure": ("event_brochure.pdf", io.BytesIO(pdf_content), "application/pdf")}

        with patch("src.api.routes._run_agent_pipeline_background", new=AsyncMock()):
            res = client.post("/api/run", files=files)
            assert res.status_code == 202
            data = res.json()
            assert data["session_id"].startswith("run_")

    def test_get_leads_non_existent_session_returns_404(self, client: TestClient):
        """GET /api/leads/{session_id} for unknown session returns 404."""
        res = client.get("/api/leads/run_non_existent_99999")
        assert res.status_code == 404

    @pytest.mark.asyncio
    async def test_get_leads_returns_persisted_records(self, client: TestClient, tmp_path):
        """GET /api/leads/{session_id} retrieves 6-field leads from database."""
        db_path = tmp_path / "test_api_leads.db"
        db = LocalDatabase(db_path=db_path)
        await db.init_db()

        session_id = "run_test_api_session_01"
        await db.create_or_update_run(
            session_id=session_id,
            search_prompt="Test Prompt",
            is_complete=True,
            total_leads_found=1,
            google_sheet_url="https://docs.google.com/spreadsheets/d/test_sheet",
        )

        record = FinalLeadRecord(
            organization_name="Fintech Corp",
            category=CategoryEnum.SPONSOR,
            location="Mumbai",
            contact_person="Rohan Sen - CMO",
            contact_channel="rohan.sen@fintechcorp.com",
            verification_status=VerificationStatusEnum.VERIFIED,
        )
        await db.save_leads(session_id, [record])

        with patch("src.api.routes.LocalDatabase", return_value=db):
            res = client.get(f"/api/leads/{session_id}")
            assert res.status_code == 200
            data = res.json()
            assert data["session_id"] == session_id
            assert data["total_leads"] == 1
            assert data["is_complete"] is True
            assert data["google_sheet_url"] == "https://docs.google.com/spreadsheets/d/test_sheet"
            assert data["leads"][0]["organization_name"] == "Fintech Corp"
            assert data["leads"][0]["contact_person"] == "Rohan Sen - CMO"


class TestSSEStreamingEngine:
    @pytest.mark.asyncio
    async def test_stream_manager_publish_and_history(self):
        """StreamManager records history and dispatches live events to subscribers."""
        session_id = "test_stream_session_01"
        await stream_manager.create_session(session_id)

        # Publish initial events
        await stream_manager.publish_event(
            session_id, "node_start", {"node": "parse_input"}
        )
        await stream_manager.publish_event(
            session_id, "lead_found", {"organization_name": "Acme Inc"}
        )

        history = stream_manager.get_event_history(session_id)
        assert len(history) == 2
        assert history[0].event_type == "node_start"
        assert history[1].event_type == "lead_found"

    @pytest.mark.asyncio
    async def test_stream_endpoint_replays_events(self, client: TestClient):
        """GET /api/stream/{session_id} replayed historical events over SSE connection."""
        session_id = "test_stream_replay_02"
        await stream_manager.create_session(session_id)

        await stream_manager.publish_event(
            session_id, "node_start", {"node": "expand_targets"}
        )
        await stream_manager.publish_event(
            session_id, "complete", {"is_complete": True, "total_leads": 1}
        )

        res = client.get(f"/api/stream/{session_id}")
        assert res.status_code == 200
        assert "text/event-stream" in res.headers["content-type"]
        text = res.text

        assert f": connected to session {session_id}" in text
        assert "event: node_start" in text
        assert "event: complete" in text

    @pytest.mark.asyncio
    async def test_run_agent_pipeline_background_execution(self, client: TestClient, tmp_path):
        """_run_agent_pipeline_background iterates graph, saves leads to DB, and dispatches events."""
        from src.api.routes import _run_agent_pipeline_background
        from src.models.state import create_initial_state

        db_path = tmp_path / "test_pipeline.db"
        db = LocalDatabase(db_path=db_path)
        await db.init_db()

        session_id = "run_full_bg_pipeline_test"
        await stream_manager.create_session(session_id)
        initial_state = create_initial_state(
            search_prompt="Test Prompt for sponsors",
            category_focus="Sponsor",
            max_target_count=1,
        )

        test_lead = FinalLeadRecord(
            organization_name="AI Robotics Labs",
            category=CategoryEnum.SPONSOR,
            location="Hyderabad",
            contact_person="Dr. Arvind Rao - Director",
            contact_channel="arvind.rao@airobotics.in",
            verification_status=VerificationStatusEnum.VERIFIED,
        )

        async def mock_astream(state, config=None):
            yield {"parse_input": {"audit_logs": [{"node": "parse_input", "message": "Parsed query", "level": "INFO"}]}}
            yield {
                "verify_contact": {
                    "verified_leads": [test_lead],
                    "audit_logs": [{"node": "verify_contact", "message": "Verified Dr. Arvind Rao", "level": "INFO"}],
                }
            }
            yield {
                "sync_sheet": {
                    "google_sheet_url": "https://docs.google.com/spreadsheets/d/mock_sheet_pipeline",
                    "rows_synced_count": 1,
                    "audit_logs": [{"node": "sync_sheet", "message": "Sheet updated", "level": "INFO"}],
                }
            }

        with patch("src.api.routes.lead_graph.astream", side_effect=mock_astream):
            await _run_agent_pipeline_background(session_id, initial_state, db)

        # Verify DB records
        leads_in_db = await db.get_leads_by_session(session_id)
        assert len(leads_in_db) == 1
        assert leads_in_db[0]["organization_name"] == "AI Robotics Labs"
        assert leads_in_db[0]["contact_person"] == "Dr. Arvind Rao - Director"

        run_summary = await db.get_run_summary(session_id)
        assert run_summary is not None
        assert run_summary["is_complete"] == 1
        assert run_summary["total_leads_found"] == 1
        assert run_summary["google_sheet_url"] == "https://docs.google.com/spreadsheets/d/mock_sheet_pipeline"

        logs_in_db = await db.get_audit_logs_by_session(session_id)
        assert len(logs_in_db) >= 2

        # Verify stream events
        events = stream_manager.get_event_history(session_id)
        event_types = [e.event_type for e in events]
        assert "session_start" in event_types
        assert "node_start" in event_types
        assert "lead_found" in event_types
        assert "sheet_synced" in event_types
        assert "complete" in event_types

        # Verify REST endpoints retrieve persisted data
        with patch("src.api.routes.LocalDatabase", return_value=db):
            status_res = client.get(f"/api/status/{session_id}")
            assert status_res.status_code == 200
            status_data = status_res.json()
            assert status_data["is_complete"] is True
            assert status_data["total_leads_found"] == 1
            assert status_data["google_sheet_url"] == "https://docs.google.com/spreadsheets/d/mock_sheet_pipeline"
            assert len(status_data["recent_logs"]) > 0

            leads_res = client.get(f"/api/leads/{session_id}")
            assert leads_res.status_code == 200
            leads_data = leads_res.json()
            assert leads_data["total_leads"] == 1
            assert leads_data["leads"][0]["organization_name"] == "AI Robotics Labs"

