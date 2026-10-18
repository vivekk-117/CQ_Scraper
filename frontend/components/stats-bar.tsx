"use client";

import React from "react";
import { CheckCircle2, Sparkles, AlertTriangle, ExternalLink, ShieldCheck } from "lucide-react";

interface StatsBarProps {
  totalFound: number;
  totalVerified: number;
  totalDerived: number;
  totalDeadLinks: number;
  googleSheetUrl: string | null;
  isRunning: boolean;
}

export const StatsBar: React.FC<StatsBarProps> = ({
  totalFound,
  totalVerified,
  totalDerived,
  totalDeadLinks,
  googleSheetUrl,
  isRunning,
}) => {
  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-3 my-6">
      {/* Metric 1: Total Leads Discovered */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col justify-between">
        <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">
          Total Discovered
        </span>
        <div className="flex items-baseline justify-between mt-2">
          <span className="text-2xl font-bold text-slate-50 font-sans">{totalFound}</span>
          <span className="text-xs text-slate-500">raw entities</span>
        </div>
      </div>

      {/* Metric 2: Verified Leads */}
      <div className="bg-slate-900 border border-emerald-500/20 rounded-xl p-4 flex flex-col justify-between relative overflow-hidden">
        <div className="absolute top-0 right-0 w-16 h-16 bg-emerald-500/5 rounded-full blur-xl pointer-events-none" />
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Verified Leads
          </span>
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
        </div>
        <div className="flex items-baseline justify-between mt-2">
          <span className="text-2xl font-bold text-emerald-400 font-sans">{totalVerified}</span>
          <span className="text-xs text-emerald-500/80 font-medium">Direct / Live</span>
        </div>
      </div>

      {/* Metric 3: Pattern-Derived Leads */}
      <div className="bg-slate-900 border border-amber-500/20 rounded-xl p-4 flex flex-col justify-between">
        <span className="text-xs font-medium text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5" />
          Pattern Derived
        </span>
        <div className="flex items-baseline justify-between mt-2">
          <span className="text-2xl font-bold text-amber-400 font-sans">{totalDerived}</span>
          <span className="text-xs text-amber-500/80 font-medium">≥2 Samples</span>
        </div>
      </div>

      {/* Metric 4: Dead Links Handled */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col justify-between">
        <span className="text-xs font-medium text-rose-400 uppercase tracking-wider flex items-center gap-1.5">
          <AlertTriangle className="w-3.5 h-3.5" />
          Dead Pages Bypassed
        </span>
        <div className="flex items-baseline justify-between mt-2">
          <span className="text-2xl font-bold text-slate-50 font-sans">{totalDeadLinks}</span>
          <span className="text-xs text-rose-500/80 font-medium">Auto-Pivoted</span>
        </div>
      </div>

      {/* Metric 5: Google Sheets Action Link */}
      <div className="col-span-2 md:col-span-1 bg-gradient-to-br from-indigo-950/40 to-slate-900 border border-indigo-500/30 rounded-xl p-4 flex flex-col justify-between shadow-lg shadow-indigo-950/20">
        <span className="text-xs font-medium text-indigo-400 uppercase tracking-wider flex items-center gap-1">
          <ShieldCheck className="w-3.5 h-3.5" />
          Google Sheet Sync
        </span>
        <div className="mt-2">
          {googleSheetUrl ? (
            <a
              href={googleSheetUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-1.5 w-full py-1.5 px-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold transition-all duration-150 shadow-md hover:shadow-indigo-500/25 active:scale-[0.98]"
            >
              <span>Open in Sheets</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          ) : (
            <div className="flex items-center gap-1.5 text-xs text-slate-400">
              <span className="w-1.5 h-1.5 rounded-full bg-slate-500" />
              <span>{isRunning ? "Syncing rows..." : "Awaiting run"}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

