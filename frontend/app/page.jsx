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
    <div className="flex flex-col min-h-screen bg-[#F7F8FA]">
      {/* Top Navbar */}
      <header className="sticky top-0 z-40 bg-white border-b border-[#E2E6EA] h-14 flex items-center">
        <div className="max-w-5xl w-full mx-auto px-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#2457C5] text-white flex items-center justify-center font-bold text-xs">
              CQ
            </div>
            <div>
              <span className="text-sm font-semibold text-[#17202A] block leading-tight">
                CQ Scraper
              </span>
              <span className="text-[11px] text-[#77818B] font-medium">
                IIT Kharagpur Event Lead Discovery
              </span>
            </div>
          </div>

          <nav className="flex items-center gap-1 bg-[#F1F3F5] p-1 rounded-lg">
            <button
              type="button"
              onClick={() => setActiveTab("discovery")}
              className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs rounded-md transition-all ${
                activeTab === "discovery"
                  ? "bg-white text-[#2457C5] font-semibold shadow-sm"
                  : "text-[#5F6B76] hover:text-[#17202A] font-medium"
              }`}
            >
              <Compass className="w-3.5 h-3.5" />
              <span>Discovery</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("leads")}
              className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs rounded-md transition-all ${
                activeTab === "leads"
                  ? "bg-white text-[#2457C5] font-semibold shadow-sm"
                  : "text-[#5F6B76] hover:text-[#17202A] font-medium"
              }`}
            >
              <ListFilter className="w-3.5 h-3.5" />
              <span>Leads</span>
              <span
                className={`text-[10px] font-semibold px-1.5 py-0.2 rounded-full ${
                  activeTab === "leads"
                    ? "bg-[#EBF0FA] text-[#2457C5]"
                    : "bg-[#E2E6EA] text-[#5F6B76]"
                }`}
              >
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
            <div>
              <h1 className="text-2xl font-bold text-[#17202A] tracking-tight">
                Find potential sponsors and delegations
              </h1>
              <p className="text-sm text-[#5F6B76] mt-1">
                Describe the organizations you want to find for your IIT Kharagpur event.
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
      <footer className="border-t border-[#E2E6EA] bg-white py-4 text-center text-xs text-[#77818B]">
        CQ Scraper · IIT Kharagpur Event Lead Discovery · LangGraph Cyclical Pipeline
      </footer>
    </div>
  );
}

