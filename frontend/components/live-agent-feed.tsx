"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  FileSearch,
  Search,
  Globe,
  CheckCircle,
  FileSpreadsheet,
  Terminal,
  AlertTriangle,
  RotateCw,
} from "lucide-react";

export interface LogMessage {
  timestamp?: string;
  node?: string;
  level?: string;
  message: string;
}

interface LiveAgentFeedProps {
  currentNode: string | null;
  logs: LogMessage[];
  deadLinkCount: number;
  isRunning: boolean;
  isComplete: boolean;
}

const PIPELINE_STEPS = [
  { id: "parse_input", label: "Analysis", icon: FileSearch },
  { id: "search_web", label: "Search & Dorking", icon: Search },
  { id: "crawl_page", label: "Deep Crawling", icon: Globe },
  { id: "verify_contact", label: "Deliverability", icon: CheckCircle },
  { id: "sync_sheet", label: "Sheet Sync", icon: FileSpreadsheet },
];

export const LiveAgentFeed: React.FC<LiveAgentFeedProps> = ({
  currentNode,
  logs,
  deadLinkCount,
  isRunning,
  isComplete,
}) => {
  const [autoScroll, setAutoScroll] = useState(true);
  const terminalEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (autoScroll && terminalEndRef.current) {
      terminalEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [logs, autoScroll]);

  // Determine active step index
  const getActiveStepIndex = (): number => {
    if (isComplete) return 5;
    if (!currentNode) return -1;
    if (currentNode === "parse_input") return 0;
    if (currentNode === "expand_targets" || currentNode === "search_web" || currentNode === "social_dork_search") return 1;
    if (currentNode === "crawl_page" || currentNode === "dead_link_recovery") return 2;
    if (currentNode === "extract_decision_maker" || currentNode === "verify_contact") return 3;
    if (currentNode === "sync_sheet") return 4;
    return -1;
  };

  const activeIndex = getActiveStepIndex();

  const formatLogTime = (isoString?: string): string => {
    if (!isoString) return new Date().toLocaleTimeString();
    try {
      const date = new Date(isoString);
      return date.toLocaleTimeString([], { hour12: false, hour: "2-digit", minute: "2-digit", second: "2-digit" });
    } catch {
      return isoString;
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 my-6">
      {/* Column 1: Pipeline Stepper (5 Cols) */}
      <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <h3 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
              LangGraph Pipeline Execution
            </h3>
            <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-slate-800 text-slate-300">
              {isComplete ? "Completed" : isRunning ? "Running" : "Idle"}
            </span>
          </div>

          {/* Stepper Steps */}
          <div className="space-y-3.5 mt-4">
            {PIPELINE_STEPS.map((step, idx) => {
              const Icon = step.icon;
              const isCurrent = activeIndex === idx && isRunning;
              const isDone = isComplete || activeIndex > idx;

              return (
                <div
                  key={step.id}
                  className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${
                    isCurrent
                      ? "bg-indigo-500/10 border-indigo-500/40 shadow-sm shadow-indigo-500/10"
                      : isDone
                      ? "bg-slate-950/60 border-emerald-500/20 text-slate-300"
                      : "bg-slate-950/30 border-slate-800/80 text-slate-500"
                  }`}
                >
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 text-xs font-semibold ${
                      isCurrent
                        ? "bg-indigo-600 text-white animate-pulse"
                        : isDone
                        ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                        : "bg-slate-800 text-slate-400"
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className={`text-xs font-semibold ${isCurrent ? "text-indigo-400" : isDone ? "text-slate-200" : "text-slate-400"}`}>
                        {step.label}
                      </span>
                      {isCurrent && (
                        <span className="text-[10px] text-indigo-400 font-mono animate-pulse">ACTIVE</span>
                      )}
                      {isDone && (
                        <span className="text-[10px] text-emerald-400 font-mono">DONE</span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Dead Page Recovery Alert Badge */}
        {deadLinkCount > 0 && (
          <div className="mt-4 p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl flex items-center gap-2.5 text-xs text-amber-300">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
            <div>
              <p className="font-semibold">Autonomous Dead-Link Recovery Active</p>
              <p className="text-[11px] text-amber-400/80">
                {deadLinkCount} dead/404 URL(s) detected and safely pivoted via search dorking.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Column 2: JetBrains Mono Terminal Log Feed (7 Cols) */}
      <div className="lg:col-span-7 bg-[#05080E] border border-slate-800 rounded-2xl p-4 flex flex-col h-[400px]">
        {/* Terminal Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800/80 shrink-0">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500/80" />
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80" />
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80" />
            </div>
            <span className="text-xs font-mono text-slate-400 ml-2 flex items-center gap-1.5">
              <Terminal className="w-3.5 h-3.5 text-indigo-400" />
              Agent Activity Stream
            </span>
          </div>

          <button
            type="button"
            onClick={() => setAutoScroll(!autoScroll)}
            className={`text-[11px] font-mono px-2 py-0.5 rounded border transition-colors ${
              autoScroll
                ? "bg-slate-800 text-indigo-400 border-indigo-500/30"
                : "bg-slate-900 text-slate-500 border-slate-800"
            }`}
          >
            Auto-scroll: {autoScroll ? "ON" : "OFF"}
          </button>
        </div>

        {/* Terminal Content */}
        <div className="flex-1 overflow-y-auto font-mono text-[13px] leading-relaxed p-2 space-y-1.5 scrollbar-thin scrollbar-thumb-slate-800">
          {logs.length === 0 ? (
            <div className="text-slate-600 italic py-8 text-center">
              Agent idle. Submit a query or brochure to initiate live stream.
            </div>
          ) : (
            logs.map((item, index) => {
              const lvl = (item.level || "INFO").toUpperCase();
              const isWarning = lvl.includes("WARN");
              const isError = lvl.includes("ERR");
              const isSuccess = item.message.includes("VERIFIED LEAD") || item.message.includes("Complete");

              return (
                <div key={index} className="flex items-start gap-2.5 text-slate-300 hover:bg-slate-900/40 px-1.5 py-0.5 rounded transition-colors">
                  <span className="text-slate-500 shrink-0 select-none text-[11px]">
                    [{formatLogTime(item.timestamp)}]
                  </span>
                  {item.node && (
                    <span className="text-blue-400/90 shrink-0 text-xs">
                      [{item.node}]
                    </span>
                  )}
                  <span
                    className={`break-words ${
                      isError
                        ? "text-rose-400 font-semibold"
                        : isWarning
                        ? "text-amber-400 font-medium"
                        : isSuccess
                        ? "text-emerald-400 font-medium"
                        : "text-slate-300"
                    }`}
                  >
                    {item.message}
                  </span>
                </div>
              );
            })
          )}
          <div ref={terminalEndRef} />
        </div>
      </div>
    </div>
  );
};

