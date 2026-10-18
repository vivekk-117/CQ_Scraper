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
    <div className="bg-[#FFFEFB] border border-[#E5E0D7] rounded-xl p-6 shadow-none mt-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            {!isComplete && (
              <span className="w-2 h-2 rounded-full bg-[#17664F] animate-pulse shrink-0" />
            )}
            <h3 className="text-sm font-bold text-[#222722]">
              {getStatusText(currentNode)}
            </h3>
          </div>
          <p className="text-xs text-[#69716C] mt-1">
            {isComplete
              ? `${leadCount} actionable lead${leadCount === 1 ? "" : "s"} found and verified for your event.`
              : "LangGraph cyclical agent is executing search queries and deliverability checks."}
          </p>
        </div>
        <div className="text-xs font-semibold text-[#17664F] bg-[#E8F1EC] px-3.5 py-1.5 rounded-lg border border-[#D0E2D8] whitespace-nowrap">
          {leadCount} leads discovered
        </div>
      </div>

      {/* 4-Stage Step Indicator */}
      <div className="flex items-center bg-[#F7F5F0] rounded-lg p-3 my-4">
        {steps.map((s, idx) => {
          const isDone = activeStep > idx || isComplete;
          const isActive = activeStep === idx && !isComplete;

          return (
            <React.Fragment key={s.label}>
              <div
                className={`flex items-center gap-2 text-xs font-medium flex-1 ${
                  isDone
                    ? "text-[#17664F] font-semibold"
                    : isActive
                    ? "text-[#17664F] font-semibold"
                    : "text-[#8C938E]"
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-semibold border ${
                    isDone
                      ? "bg-[#17664F] border-[#17664F] text-white"
                      : isActive
                      ? "bg-[#17664F] border-[#17664F] text-white"
                      : "bg-[#FFFEFB] border-[#E5E0D7] text-[#8C938E]"
                  }`}
                >
                  {s.step}
                </div>
                <span>{s.label}</span>
              </div>
              {idx < steps.length - 1 && (
                <span className="text-[#E5E0D7] mx-2 text-xs">→</span>
              )}
            </React.Fragment>
          );
        })}
      </div>

      {/* Completion Notification */}
      {isComplete && (
        <div className="p-3 bg-[#E8F1EC] border border-[#D0E2D8] text-[#17664F] text-xs font-medium rounded-lg flex items-center gap-2 my-2">
          <CheckCircle className="w-4 h-4 shrink-0 text-[#17664F]" />
          <span>Search complete. {leadCount} verified lead{leadCount === 1 ? "" : "s"} added to roster.</span>
        </div>
      )}

      {/* Error Notification */}
      {error && (
        <div className="p-3 bg-[#FEECEB] border border-[#FECDCA] text-[#B42318] text-xs font-medium rounded-lg flex items-center gap-2 my-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-[#B42318]" />
          <span>{error}</span>
        </div>
      )}

      {/* Technical Activity Disclosure */}
      <div className="mt-3 pt-3 border-t border-[#E5E0D7]">
        <button
          type="button"
          onClick={() => setIsLogOpen(!isLogOpen)}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-[#69716C] hover:text-[#222722] transition-colors"
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
            className="mt-2.5 max-h-48 overflow-y-auto bg-[#1E2420] text-[#E5EAE7] font-mono text-[11px] p-3 rounded-lg space-y-1 leading-relaxed"
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

