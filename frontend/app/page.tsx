"use client";

import React, { useState, useEffect, useRef } from "react";
import { StatsBar } from "../components/stats-bar";
import { InputZone } from "../components/input-zone";
import { LiveAgentFeed, LogMessage } from "../components/live-agent-feed";
import { LeadsTable, LeadRecord } from "../components/leads-table";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export default function DashboardPage() {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [currentNode, setCurrentNode] = useState<string | null>(null);
  const [logs, setLogs] = useState<LogMessage[]>([]);
  const [leads, setLeads] = useState<LeadRecord[]>([]);
  const [googleSheetUrl, setGoogleSheetUrl] = useState<string | null>(null);
  const [deadLinkCount, setDeadLinkCount] = useState(0);

  const eventSourceRef = useRef<EventSource | null>(null);

  // Close SSE stream when unmounting
  useEffect(() => {
    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
    };
  }, []);

  const handleStartRun = async ({
    prompt,
    file,
    categoryFocus,
    maxTargets,
  }: {
    prompt: string | null;
    file: File | null;
    categoryFocus: string;
    maxTargets: number;
  }) => {
    setIsRunning(true);
    setIsComplete(false);
    setCurrentNode(null);
    setLogs([]);
    setLeads([]);
    setGoogleSheetUrl(null);
    setDeadLinkCount(0);

    const formData = new FormData();
    if (prompt) formData.append("search_prompt", prompt);
    if (file) formData.append("brochure", file);
    formData.append("category_focus", categoryFocus);
    formData.append("max_targets", String(maxTargets));

    try {
      const res = await fetch(`${API_BASE}/api/run`, {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ detail: "Unknown server error" }));
        throw new Error(errorData.detail || "Failed to start agent run");
      }

      const data = await res.json();
      const newSessionId = data.session_id;
      setSessionId(newSessionId);

      // Connect to SSE stream
      connectStream(newSessionId);
    } catch (err: any) {
      console.error("Run initiation error:", err);
      setIsRunning(false);
      setLogs((prev) => [
        ...prev,
        {
          timestamp: new Date().toISOString(),
          level: "ERROR",
          node: "system",
          message: `Initialization failed: ${err.message}`,
        },
      ]);
    }
  };

  const connectStream = (activeSessionId: string) => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    const streamUrl = `${API_BASE}/api/stream/${activeSessionId}`;
    const es = new EventSource(streamUrl);
    eventSourceRef.current = es;

    es.addEventListener("session_start", (e: MessageEvent) => {
      try {
        const parsed = JSON.parse(e.data);
        setLogs((prev) => [
          ...prev,
          {
            timestamp: parsed.timestamp,
            node: "init",
            level: "INFO",
            message: `Discovery session initiated [${activeSessionId}]`,
          },
        ]);
      } catch {}
    });

    es.addEventListener("node_start", (e: MessageEvent) => {
      try {
        const parsed = JSON.parse(e.data);
        const nodeName = parsed.data?.node;
        if (nodeName) {
          setCurrentNode(nodeName);
          if (nodeName === "dead_link_recovery") {
            setDeadLinkCount((c) => c + 1);
          }
        }
      } catch {}
    });

    es.addEventListener("log", (e: MessageEvent) => {
      try {
        const parsed = JSON.parse(e.data);
        const logData = parsed.data || {};
        setLogs((prev) => [
          ...prev,
          {
            timestamp: logData.timestamp || parsed.timestamp,
            node: logData.node,
            level: logData.level || "INFO",
            message: logData.message || JSON.stringify(logData),
          },
        ]);
      } catch {}
    });

    es.addEventListener("lead_found", (e: MessageEvent) => {
      try {
        const parsed = JSON.parse(e.data);
        const lead = parsed.data;
        if (lead) {
          setLeads((prev) => {
            const channel = lead.contact_channel || lead["Contact Channel"];
            if (prev.some((p) => (p.contact_channel || p["Contact Channel"]) === channel)) {
              return prev;
            }
            return [...prev, lead];
          });
        }
      } catch {}
    });

    es.addEventListener("sheet_synced", (e: MessageEvent) => {
      try {
        const parsed = JSON.parse(e.data);
        if (parsed.data?.google_sheet_url) {
          setGoogleSheetUrl(parsed.data.google_sheet_url);
        }
      } catch {}
    });

    es.addEventListener("complete", (e: MessageEvent) => {
      try {
        const parsed = JSON.parse(e.data);
        if (parsed.data?.google_sheet_url) {
          setGoogleSheetUrl(parsed.data.google_sheet_url);
        }
      } catch {}
      setIsRunning(false);
      setIsComplete(true);
      es.close();
    });

    es.addEventListener("error", (e) => {
      console.warn("SSE stream closed or interrupted", e);
      // If complete wasn't sent yet, check status
      fetchStatus(activeSessionId);
    });
  };

  const fetchStatus = async (activeSessionId: string) => {
    try {
      const res = await fetch(`${API_BASE}/api/status/${activeSessionId}`);
      if (res.ok) {
        const status = await res.json();
        if (status.is_complete) {
          setIsRunning(false);
          setIsComplete(true);
          if (status.google_sheet_url) {
            setGoogleSheetUrl(status.google_sheet_url);
          }
        }
      }
    } catch {}
  };

  const handleReset = () => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }
    setSessionId(null);
    setIsRunning(false);
    setIsComplete(false);
    setCurrentNode(null);
    setLogs([]);
    setLeads([]);
    setGoogleSheetUrl(null);
    setDeadLinkCount(0);
  };

  // Compute stats
  const totalVerified = leads.filter(
    (l) => (l["Verification Status"] || l.verification_status) === "Verified"
  ).length;
  const totalDerived = leads.filter(
    (l) => (l["Verification Status"] || l.verification_status) === "Pattern-Derived"
  ).length;

  return (
    <div className="space-y-6">
      {/* Hero Header */}
      <div className="text-center max-w-2xl mx-auto my-4">
        <h2 className="text-3xl font-extrabold text-slate-50 tracking-tight sm:text-4xl">
          Autonomous Lead Discovery & Verification
        </h2>
        <p className="mt-2 text-sm text-slate-400">
          Transform event brochures and search queries into verified sponsor and delegation leads.
          Real-time deliverability checks and automatic Google Sheets sync.
        </p>
      </div>

      {/* Input Zone: Tabbed Query or Brochure Upload */}
      <InputZone
        onStartRun={handleStartRun}
        isRunning={isRunning}
        onReset={handleReset}
        hasRunSession={Boolean(sessionId)}
      />

      {/* Live Stats Bar */}
      <StatsBar
        totalFound={leads.length}
        totalVerified={totalVerified}
        totalDerived={totalDerived}
        totalDeadLinks={deadLinkCount}
        googleSheetUrl={googleSheetUrl}
        isRunning={isRunning}
      />

      {/* Execution Monitor: Pipeline Stepper + Terminal Feed */}
      <LiveAgentFeed
        currentNode={currentNode}
        logs={logs}
        deadLinkCount={deadLinkCount}
        isRunning={isRunning}
        isComplete={isComplete}
      />

      {/* The 6-Field Master Leads Table */}
      <LeadsTable
        leads={leads}
        googleSheetUrl={googleSheetUrl}
        isRunning={isRunning}
      />
    </div>
  );
}

