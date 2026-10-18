"""Server-Sent Events (SSE) Streaming Engine (Task 8.2).

Bridges LangGraph execution events, real-time node state transitions,
verified lead discoveries, and audit logs to browser clients over HTTP.
Maintains event history for catching up and supports multi-client subscriptions.
"""

from __future__ import annotations

import asyncio
import datetime
import json
from typing import Any, AsyncGenerator, Optional
from loguru import logger
from pydantic import BaseModel, ConfigDict, Field


class StreamEvent(BaseModel):
    """Standardized event envelope dispatched to SSE clients."""
    model_config = ConfigDict(extra="ignore")

    event_type: str = Field(..., description="e.g. node_start, log, lead_found, complete, error")
    data: dict[str, Any] = Field(default_factory=dict)
    timestamp: str = Field(
        default_factory=lambda: datetime.datetime.now(datetime.timezone.utc).isoformat()
    )

    def to_sse(self) -> str:
        """Formats the event into standard SSE wire protocol."""
        payload = {
            "type": self.event_type,
            "data": self.data,
            "timestamp": self.timestamp,
        }
        return f"event: {self.event_type}\ndata: {json.dumps(payload)}\n\n"


class SessionStreamManager:
    """Manages active streaming queues and event playback buffers for discovery runs."""

    def __init__(self) -> None:
        # session_id -> list[StreamEvent]
        self._history: dict[str, list[StreamEvent]] = {}
        # session_id -> set[asyncio.Queue[StreamEvent]]
        self._subscribers: dict[str, set[asyncio.Queue[StreamEvent]]] = {}
        # session_id -> bool
        self._completed: dict[str, bool] = {}
        self._lock = asyncio.Lock()

    async def create_session(self, session_id: str) -> None:
        """Registers a new session streaming channel."""
        async with self._lock:
            if session_id not in self._history:
                self._history[session_id] = []
                self._subscribers[session_id] = set()
                self._completed[session_id] = False

    async def publish_event(
        self,
        session_id: str,
        event_type: str,
        data: dict[str, Any],
    ) -> StreamEvent:
        """Publishes an event to all active subscribers and stores in playback buffer."""
        event = StreamEvent(event_type=event_type, data=data)

        async with self._lock:
            if session_id not in self._history:
                self._history[session_id] = []
                self._subscribers[session_id] = set()
                self._completed[session_id] = False

            self._history[session_id].append(event)
            if event_type in ("complete", "fatal_error"):
                self._completed[session_id] = True

            subscribers = list(self._subscribers[session_id])

        for q in subscribers:
            try:
                q.put_nowait(event)
            except Exception as e:
                logger.warning(f"Error publishing SSE to subscriber queue: {e}")

        return event

    async def subscribe(
        self,
        session_id: str,
        ping_interval: float = 15.0,
    ) -> AsyncGenerator[str, None]:
        """Subscribes an SSE client, replays historical events, then streams live events."""
        queue: asyncio.Queue[StreamEvent] = asyncio.Queue()

        async with self._lock:
            if session_id not in self._history:
                self._history[session_id] = []
                self._subscribers[session_id] = set()
                self._completed[session_id] = False

            # Snapshot existing history to catch up client
            historical_events = list(self._history[session_id])
            self._subscribers[session_id].add(queue)
            already_done = self._completed.get(session_id, False)

        try:
            # 1. Yield initial SSE connection confirmation
            yield f": connected to session {session_id}\n\n"

            # 2. Replay all previous events so far
            for event in historical_events:
                yield event.to_sse()
                if event.event_type in ("complete", "fatal_error"):
                    return

            # If session was already marked complete before subscription
            if already_done:
                return

            # 3. Stream live events
            while True:
                try:
                    event = await asyncio.wait_for(queue.get(), timeout=ping_interval)
                    yield event.to_sse()

                    if event.event_type in ("complete", "fatal_error"):
                        break

                except asyncio.TimeoutError:
                    # Send polite SSE keep-alive comment
                    yield ": ping\n\n"

        except asyncio.CancelledError:
            logger.debug(f"Client disconnected from SSE stream: {session_id}")
        finally:
            async with self._lock:
                if session_id in self._subscribers and queue in self._subscribers[session_id]:
                    self._subscribers[session_id].remove(queue)

    def get_event_history(self, session_id: str) -> list[StreamEvent]:
        """Returns the chronological event history for a session."""
        return list(self._history.get(session_id, []))

    def is_session_complete(self, session_id: str) -> bool:
        """Checks if the session has completed execution."""
        return self._completed.get(session_id, False)

    async def clear_session(self, session_id: str) -> None:
        """Cleans up session buffers and queues."""
        async with self._lock:
            self._history.pop(session_id, None)
            self._subscribers.pop(session_id, None)
            self._completed.pop(session_id, None)


# Global singleton instance
stream_manager = SessionStreamManager()

