"use client";

import React from "react";
import { Sparkles, Compass } from "lucide-react";

interface SearchInputProps {
  prompt: string;
  setPrompt: (val: string) => void;
  categoryFocus: string;
  setCategoryFocus: (val: string) => void;
  maxTargets: number;
  setMaxTargets: (val: number) => void;
  disabled?: boolean;
}

const EXAMPLE_CHIPS = [
  "Find FinTech Sponsors in Bengaluru for Hackathon",
  "Robotics Societies and Tech Teams in Delhi",
  "AI & SaaS Enterprise Sponsors in Mumbai",
  "Collegiate E-Cell Delegations in Hyderabad",
];

export const SearchInput: React.FC<SearchInputProps> = ({
  prompt,
  setPrompt,
  categoryFocus,
  setCategoryFocus,
  maxTargets,
  setMaxTargets,
  disabled = false,
}) => {
  return (
    <div className="space-y-4">
      <div className="relative">
        <textarea
          rows={3}
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          disabled={disabled}
          placeholder="E.g., Discover tech companies and corporate sponsors in Bengaluru interested in hackathon sponsorship, or robotic clubs in Tier-1 colleges..."
          className="w-full bg-slate-950/70 border border-slate-800 rounded-xl px-4 py-3 text-slate-100 placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all resize-none font-sans"
        />
      </div>

      {/* Example Chips */}
      <div>
        <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-2">
          <Compass className="w-3.5 h-3.5 text-indigo-400" />
          <span>Quick Example Prompts:</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {EXAMPLE_CHIPS.map((chip, idx) => (
            <button
              key={idx}
              type="button"
              disabled={disabled}
              onClick={() => setPrompt(chip)}
              className="text-xs bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/60 hover:border-indigo-500/40 text-slate-300 hover:text-white px-2.5 py-1 rounded-lg transition-all text-left flex items-center gap-1.5 active:scale-[0.98]"
            >
              <Sparkles className="w-3 h-3 text-indigo-400/80" />
              <span>{chip}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Target Category & Count Controls */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-800/80">
        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1.5">
            Category Focus
          </label>
          <div className="grid grid-cols-3 gap-1.5 bg-slate-950 p-1 rounded-lg border border-slate-800">
            {["Both", "Sponsor", "College Delegation"].map((cat) => (
              <button
                key={cat}
                type="button"
                disabled={disabled}
                onClick={() => setCategoryFocus(cat)}
                className={`py-1 px-2 text-xs font-medium rounded-md transition-all ${
                  categoryFocus === cat
                    ? "bg-indigo-600 text-white shadow-sm"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                {cat === "College Delegation" ? "Delegation" : cat}
              </button>
            ))}
          </div>
        </div>

        <div>
          <div className="flex justify-between items-center mb-1.5">
            <label className="text-xs font-medium text-slate-400">Target Extraction Limit</label>
            <span className="text-xs font-semibold text-indigo-400">{maxTargets} entities</span>
          </div>
          <input
            type="range"
            min={1}
            max={20}
            value={maxTargets}
            onChange={(e) => setMaxTargets(Number(e.target.value))}
            disabled={disabled}
            className="w-full accent-indigo-500 bg-slate-800 h-2 rounded-lg cursor-pointer"
          />
        </div>
      </div>
    </div>
  );
};

