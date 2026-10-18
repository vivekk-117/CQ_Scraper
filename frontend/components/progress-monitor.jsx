import React, { useState, useEffect, useRef } from "react";
import { ChevronDown, CheckCircle, AlertCircle } from "lucide-react";

export function ProgressMonitor({ currentNode, logs, leadCount, isComplete, error }) {
  const [isLogOpen, setIsLogOpen] = useState(false);
  const logBoxRef = useRef(null);

  // Auto-scroll technical log when updated
  useEffect(() => {
    if (logBoxRef.current && isLogOpen) {
      logBoxRef.current.scrollTop = logBoxRef.current.scrollHeight;
    }
  }, [logs, isLogOpen]);

  // Map LangGraph node names to 4-stage workflow step index
  const getStepIndex = (node) => {
    if (!node) return 0;
    if (["parse_input", "expand_targets", "search_web"].includes(node)) return 0;
    if (["crawl_page", "dead_link_recovery"].includes(node)) return 1;
    if (["extract_decision_maker", "social_dork_search", "verify_contact"].includes(node)) return 2;
    if (node === "sync_sheet" || isComplete) return 3;
    return 0;
  };

  const activeStep = isComplete ? 3 : getStepIndex(currentNode);

  const getStatusText = (node) => {
    if (isComplete) return "Discovery completed";
    const mapping = {
      parse_input: "Analyzing event search brief…",
      expand_targets: "Generating target organizations…",
      search_web: "Searching Google and web directories…",
      crawl_page: "Extracting leadership and contact details from pages…",
      dead_link_recovery: "Handling unreachable page — pivoting to alternate queries…",
      extract_decision_maker: "Identifying relevant decision-makers…",
      social_dork_search: "Validating personal social profiles…",
      verify_contact: "Verifying deliverability via DNS MX and SMTP socket handshakes…",
      sync_sheet: "Syncing verified rows into Google Sheets…",
    };
    return mapping[node] || "Finding relevant organizations…";
  };

  const steps = [
    { label: "Searching", step: 1 },
    { label: "Reviewing sources", step: 2 },
    { label: "Checking contacts", step: 3 },
    { label: "Ready", step: 4 },
  ];

  return (
    <div className="bg-white border border-[#E2E6EA] rounded-xl p-5 shadow-sm mt-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            {!isComplete && (
              <span className="w-2 h-2 rounded-full bg-[#2457C5] animate-pulse shrink-0" />
            )}
            <h3 className="text-sm font-semibold text-[#17202A]">
              {getStatusText(currentNode)}
            </h3>
          </div>
          <p className="text-xs text-[#5F6B76] mt-0.5">
            {isComplete
              ? `${leadCount} actionable lead${leadCount === 1 ? "" : "s"} found and verified for your event.`
              : "LangGraph cyclical agent is executing search queries and deliverability checks."}
          </p>
        </div>
        <div className="text-xs font-semibold text-[#17202A] bg-[#F1F3F5] px-3 py-1.5 rounded-lg border border-[#E2E6EA] whitespace-nowrap">
          {leadCount} leads discovered
        </div>
      </div>

      {/* 4-Stage Step Indicator */}
      <div className="flex items-center bg-[#F1F3F5] rounded-lg p-3 my-4">
        {steps.map((s, idx) => {
          const isDone = activeStep > idx || isComplete;
          const isActive = activeStep === idx && !isComplete;

          return (
            <React.Fragment key={s.label}>
              <div
                className={`flex items-center gap-2 text-xs font-medium flex-1 ${
                  isDone
                    ? "text-[#18794E]"
                    : isActive
                    ? "text-[#2457C5] font-semibold"
                    : "text-[#77818B]"
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-semibold border ${
                    isDone
                      ? "bg-[#18794E] border-[#18794E] text-white"
                      : isActive
                      ? "bg-[#2457C5] border-[#2457C5] text-white"
                      : "bg-white border-[#E2E6EA] text-[#77818B]"
                  }`}
                >
                  {s.step}
                </div>
                <span>{s.label}</span>
              </div>
              {idx < steps.length - 1 && (
                <span className="text-[#E2E6EA] mx-2 text-xs">→</span>
              )}
            </React.Fragment>
          );
        })}
      </div>

      {/* Completion Notification */}
      {isComplete && (
        <div className="p-3 bg-[#EBF8F1] border border-[#C3E6D2] text-[#18794E] text-xs font-medium rounded-lg flex items-center gap-2 my-2">
          <CheckCircle className="w-4 h-4 shrink-0" />
          <span>Search complete. {leadCount} verified lead{leadCount === 1 ? "" : "s"} added to roster.</span>
        </div>
      )}

      {/* Error Notification */}
      {error && (
        <div className="p-3 bg-[#FEE4E2] border border-[#FECDCA] text-[#B42318] text-xs font-medium rounded-lg flex items-center gap-2 my-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Technical Activity Disclosure */}
      <div className="mt-3 pt-3 border-t border-[#E2E6EA]">
        <button
          type="button"
          onClick={() => setIsLogOpen(!isLogOpen)}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-[#5F6B76] hover:text-[#17202A] transition-colors"
        >
          <ChevronDown
            className={`w-3.5 h-3.5 transition-transform duration-200 ${
              isLogOpen ? "rotate-180" : ""
            }`}
          />
          <span>Technical activity & execution logs</span>
        </button>

        {isLogOpen && (
          <div
            ref={logBoxRef}
            className="mt-2.5 max-h-48 overflow-y-auto bg-[#111827] text-[#E5E7EB] font-mono text-[11px] p-3 rounded-lg space-y-1 leading-relaxed"
          >
            {logs.length === 0 ? (
              <div className="text-gray-500 italic">No activity logged yet.</div>
            ) : (
              logs.map((log, i) => {
                const time = log.timestamp
                  ? new Date(log.timestamp).toLocaleTimeString([], { hour12: false })
                  : "";
                const isErr = log.level === "ERROR";
                const isWarn = log.level === "WARN";
                const isSuccess =
                  (log.message || "").includes("VERIFIED") ||
                  (log.message || "").includes("Deliverable");

                return (
                  <div key={i} className="flex gap-2 text-gray-300">
                    {time && <span className="text-gray-500 shrink-0">[{time}]</span>}
                    {log.node && (
                      <span className="text-blue-400 shrink-0">[{log.node}]</span>
                    )}
                    <span
                      className={`break-all ${
                        isErr
                          ? "text-red-400 font-semibold"
                          : isWarn
                          ? "text-yellow-400"
                          : isSuccess
                          ? "text-emerald-400 font-medium"
                          : ""
                      }`}
                    >
                      {log.message}
                    </span>
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>
    </div>
  );
}

