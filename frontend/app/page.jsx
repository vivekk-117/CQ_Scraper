"use client";

import React, { useState, useEffect, useRef } from "react";
import { Compass, ListFilter } from "lucide-react";
import { SearchBrief } from "../components/search-brief";
import { ProgressMonitor } from "../components/progress-monitor";
import { LeadsRoster } from "../components/leads-roster";
import { LeadDetailDrawer } from "../components/lead-detail-drawer";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState("discovery");
  const [isRunning, setIsRunning] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [currentNode, setCurrentNode] = useState(null);
  const [logs, setLogs] = useState([]);
  const [leads, setLeads] = useState([]);
  const [googleSheetUrl, setGoogleSheetUrl] = useState(null);
  const [error, setError] = useState(null);
  const [selectedLead, setSelectedLead] = useState(null);
  const [outreachRecords, setOutreachRecords] = useState({});

  const eventSourceRef = useRef(null);

  // Close event stream on unmount
  useEffect(() => {
    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
    };
  }, []);

  const handleStartSearch = async ({ prompt, file, categoryFocus, maxTargets }) => {
    setIsRunning(true);
    setIsComplete(false);
    setError(null);
    setCurrentNode(null);
    setLogs([]);
    setLeads([]);
    setGoogleSheetUrl(null);

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
        const errorData = await res.json().catch(() => ({ detail: "Server error" }));
        throw new Error(errorData.detail || "Failed to start discovery");
      }

      const data = await res.json();
      connectStream(data.session_id);
    } catch (err) {
      setIsRunning(false);
      setError(err.message || "Failed to connect to backend server.");
    }
  };

  const connectStream = (sessionId) => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    const es = new EventSource(`${API_BASE}/api/stream/${sessionId}`);
    eventSourceRef.current = es;

    es.addEventListener("session_start", () => {
      setLogs((prev) => [
        ...prev,
        {
          timestamp: new Date().toISOString(),
          level: "INFO",
          node: "session",
          message: "Discovery session started",
        },
      ]);
    });

    es.addEventListener("node_start", (e) => {
      try {
        const parsed = JSON.parse(e.data);
        if (parsed.data?.node) {
          setCurrentNode(parsed.data.node);
        }
      } catch (err) {}
    });

    es.addEventListener("log", (e) => {
      try {
        const parsed = JSON.parse(e.data);
        const item = parsed.data || parsed;
        setLogs((prev) => [...prev, item]);
      } catch (err) {}
    });

    es.addEventListener("lead_found", (e) => {
      try {
        const parsed = JSON.parse(e.data);
        if (parsed.data) {
          const lead = parsed.data;
          const channel = lead.contact_channel || lead["Contact Channel"];
          setLeads((prev) => {
            const exists = prev.some(
              (l) => (l.contact_channel || l["Contact Channel"]) === channel
            );
            if (!exists) return [...prev, lead];
            return prev;
          });
        }
      } catch (err) {}
    });

    es.addEventListener("sheet_synced", (e) => {
      try {
        const parsed = JSON.parse(e.data);
        if (parsed.data?.google_sheet_url) {
          setGoogleSheetUrl(parsed.data.google_sheet_url);
        }
      } catch (err) {}
    });

    es.addEventListener("complete", (e) => {
      try {
        const parsed = JSON.parse(e.data);
        if (parsed.data?.google_sheet_url) {
          setGoogleSheetUrl(parsed.data.google_sheet_url);
        }
      } catch (err) {}
      setIsRunning(false);
      setIsComplete(true);
      es.close();
    });

    es.addEventListener("error", () => {
      fetch(`${API_BASE}/api/status/${sessionId}`)
        .then((r) => r.json())
        .then((st) => {
          if (st.is_complete) {
            if (st.google_sheet_url) setGoogleSheetUrl(st.google_sheet_url);
            setIsRunning(false);
            setIsComplete(true);
            es.close();
          }
        })
        .catch(() => {});
    });
  };

  const handleToggleOutreach = () => {
    if (!selectedLead) return;
    const channel = selectedLead["Contact Channel"] || selectedLead.contact_channel || "";
    setOutreachRecords((prev) => ({
      ...prev,
      [channel]: !prev[channel],
    }));
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#F7F5F0] text-[#222722]">
      {/* Top Navbar */}
      <header className="sticky top-0 z-40 bg-[#F7F5F0] border-b border-[#E5E0D7] h-16 flex items-center">
        <div className="max-w-5xl w-full mx-auto px-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-md bg-[#17664F] text-white flex items-center justify-center font-bold text-xs tracking-tight">
              CQ
            </div>
            <div>
              <span className="text-[15px] font-bold text-[#222722] block leading-tight">
                CQ Scraper
              </span>
              <span className="text-xs text-[#69716C] font-normal">
                IIT Kharagpur · Event Lead Discovery
              </span>
            </div>
          </div>

          <nav className="flex items-center gap-6 h-16">
            <button
              type="button"
              onClick={() => setActiveTab("discovery")}
              className={`h-full inline-flex items-center text-sm transition-all border-b-2 px-0.5 ${
                activeTab === "discovery"
                  ? "border-[#17664F] text-[#17664F] font-semibold"
                  : "border-transparent text-[#69716C] hover:text-[#222722] font-medium"
              }`}
            >
              <span>Discovery</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("leads")}
              className={`h-full inline-flex items-center gap-2 text-sm transition-all border-b-2 px-0.5 ${
                activeTab === "leads"
                  ? "border-[#17664F] text-[#17664F] font-semibold"
                  : "border-transparent text-[#69716C] hover:text-[#222722] font-medium"
              }`}
            >
              <span>Leads</span>
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-[#E5E0D7] text-[#222722]">
                {leads.length}
              </span>
            </button>
          </nav>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-6 py-8">
        {activeTab === "discovery" && (
          <div className="space-y-6">
            <div className="mt-2 mb-6">
              <div className="text-[11px] font-bold tracking-wider text-[#17664F] uppercase mb-2">
                EVENT RESEARCH WORKSPACE
              </div>
              <h1 className="text-3xl font-bold text-[#222722] tracking-tight">
                Find the right sponsors and college delegations.
              </h1>
              <p className="text-[15px] text-[#69716C] mt-2">
                Discover relevant organizations for your IIT Kharagpur event, then review sources before outreach.
              </p>
            </div>

            <SearchBrief
              onStartSearch={handleStartSearch}
              isRunning={isRunning}
            />

            {(isRunning || isComplete || logs.length > 0) && (
              <ProgressMonitor
                currentNode={currentNode}
                logs={logs}
                leadCount={leads.length}
                isComplete={isComplete}
                error={error}
              />
            )}
          </div>
        )}

        {activeTab === "leads" && (
          <LeadsRoster
            leads={leads}
            googleSheetUrl={googleSheetUrl}
            onSelectLead={(lead) => setSelectedLead(lead)}
            outreachRecords={outreachRecords}
          />
        )}
      </main>

      {/* Lead Detail Drawer (Section 5.D) */}
      <LeadDetailDrawer
        lead={selectedLead}
        isOpen={!!selectedLead}
        onClose={() => setSelectedLead(null)}
        onToggleOutreach={handleToggleOutreach}
        isContacted={
          selectedLead
            ? !!outreachRecords[
                selectedLead["Contact Channel"] || selectedLead.contact_channel
              ]
            : false
        }
      />

      {/* Footer */}
      <footer className="border-t border-[#E5E0D7] bg-[#FFFEFB] py-4 text-center text-xs text-[#8C938E] mt-auto">
        CQ Scraper · IIT Kharagpur Event Lead Discovery · LangGraph Cyclical Pipeline
      </footer>
    </div>
  );
}

