"use client";

import React, { useState } from "react";
import { Search, FileUp, Play, Loader2, RefreshCw } from "lucide-react";
import { SearchInput } from "./search-input";
import { BrochureUpload } from "./brochure-upload";

interface InputZoneProps {
  onStartRun: (params: {
    prompt: string | null;
    file: File | null;
    categoryFocus: string;
    maxTargets: number;
  }) => Promise<void>;
  isRunning: boolean;
  onReset: () => void;
  hasRunSession: boolean;
}

export const InputZone: React.FC<InputZoneProps> = ({
  onStartRun,
  isRunning,
  onReset,
  hasRunSession,
}) => {
  const [activeTab, setActiveTab] = useState<"prompt" | "brochure">("prompt");
  const [prompt, setPrompt] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [categoryFocus, setCategoryFocus] = useState("Both");
  const [maxTargets, setMaxTargets] = useState(8);

  const canSubmit = !isRunning && (Boolean(prompt.trim()) || Boolean(selectedFile));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;

    onStartRun({
      prompt: activeTab === "prompt" && prompt.trim() ? prompt.trim() : null,
      file: activeTab === "brochure" && selectedFile ? selectedFile : null,
      categoryFocus,
      maxTargets,
    });
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-2xl backdrop-blur-sm max-w-5xl mx-auto">
      {/* Tab Switcher */}
      <div className="flex items-center justify-between border-b border-slate-800/80 pb-3 mb-4">
        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={isRunning}
            onClick={() => setActiveTab("prompt")}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === "prompt"
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
            }`}
          >
            <Search className="w-3.5 h-3.5" />
            <span>Natural Language Search Prompt</span>
          </button>

          <button
            type="button"
            disabled={isRunning}
            onClick={() => setActiveTab("brochure")}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === "brochure"
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
            }`}
          >
            <FileUp className="w-3.5 h-3.5" />
            <span>Upload Event Brochure (PDF)</span>
          </button>
        </div>

        {hasRunSession && !isRunning && (
          <button
            type="button"
            onClick={onReset}
            className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200 hover:bg-slate-800 px-2.5 py-1 rounded-lg transition-colors"
          >
            <RefreshCw className="w-3 h-3" />
            <span>New Session</span>
          </button>
        )}
      </div>

      {/* Tab Content */}
      <form onSubmit={handleSubmit} className="space-y-4">
        {activeTab === "prompt" ? (
          <SearchInput
            prompt={prompt}
            setPrompt={setPrompt}
            categoryFocus={categoryFocus}
            setCategoryFocus={setCategoryFocus}
            maxTargets={maxTargets}
            setMaxTargets={setMaxTargets}
            disabled={isRunning}
          />
        ) : (
          <BrochureUpload
            selectedFile={selectedFile}
            setSelectedFile={setSelectedFile}
            categoryFocus={categoryFocus}
            setCategoryFocus={setCategoryFocus}
            maxTargets={maxTargets}
            setMaxTargets={setMaxTargets}
            disabled={isRunning}
          />
        )}

        {/* Action Button */}
        <div className="pt-2 flex justify-end">
          <button
            type="submit"
            disabled={!canSubmit}
            className={`relative inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold text-white shadow-xl transition-all duration-200 ${
              canSubmit
                ? "bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 hover:shadow-indigo-500/25 active:scale-[0.98] cursor-pointer"
                : "bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700/50"
            }`}
          >
            {isRunning ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-indigo-300" />
                <span>Agent Pipeline Running...</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-current" />
                <span>Start Autonomous Discovery & Extraction</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

