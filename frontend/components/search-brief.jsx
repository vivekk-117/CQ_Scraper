import React, { useState } from "react";
import { Search, ChevronDown, FileText, X, Loader2 } from "lucide-react";

export function SearchBrief({ onStartSearch, isRunning }) {
  const [prompt, setPrompt] = useState("");
  const [category, setCategory] = useState("Both");
  const [selectedFile, setSelectedFile] = useState(null);
  const [isBrochureOpen, setIsBrochureOpen] = useState(false);

  const suggestions = [
    "FinTech sponsors in Bengaluru",
    "Robotics college teams in Delhi",
    "AI and cloud companies in Mumbai",
  ];

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      setSelectedFile(e.dataTransfer.files[0]);
    }
  };

  const handleSubmit = () => {
    if (!prompt.trim() && !selectedFile) return;
    onStartSearch({
      prompt: prompt.trim() || null,
      file: selectedFile,
      categoryFocus: category,
      maxTargets: 10,
    });
  };

  return (
    <div className="bg-white border border-[#E2E6EA] rounded-xl p-6 shadow-sm">
      {/* Search Brief Label */}
      <div className="flex items-baseline justify-between mb-2">
        <label htmlFor="search-brief" className="text-sm font-semibold text-[#17202A]">
          Search brief
        </label>
        <span className="text-xs text-[#77818B]">Natural language query</span>
      </div>

      {/* Search Input Area */}
      <textarea
        id="search-brief"
        rows={3}
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        placeholder="Find Indian robotics companies that sponsor student events, or collegiate technical teams in Delhi"
        className="w-full px-3.5 py-2.5 border border-[#E2E6EA] rounded-lg text-sm text-[#17202A] placeholder-[#77818B] focus:outline-none focus:border-[#2457C5] focus:ring-2 focus:ring-[#2457C5]/10 resize-none transition-all"
        disabled={isRunning}
      />

      {/* Suggestion Chips */}
      <div className="flex flex-wrap items-center gap-1.5 mt-2.5">
        <span className="text-xs text-[#77818B] mr-1">Suggestions:</span>
        {suggestions.map((sug, i) => (
          <button
            key={i}
            type="button"
            onClick={() => setPrompt(sug)}
            className="text-xs text-[#5F6B76] bg-[#F1F3F5] hover:bg-[#EDF2FC] hover:text-[#2457C5] hover:border-[#C3D4F5] border border-[#E2E6EA] px-2.5 py-1 rounded-md transition-colors"
          >
            {sug}
          </button>
        ))}
      </div>

      {/* Controls: Target Category & Submit */}
      <div className="flex flex-wrap items-center justify-between gap-4 mt-6 pt-5 border-t border-[#E2E6EA]">
        <div>
          <span className="text-xs font-semibold text-[#17202A] block mb-1.5">
            Target category
          </span>
          <div className="inline-flex bg-[#F1F3F5] p-0.5 rounded-lg border border-[#E2E6EA]">
            {["Both", "Sponsor", "College Delegation"].map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setCategory(cat)}
                className={`text-xs font-medium px-3.5 py-1.5 rounded-md transition-all ${
                  category === cat
                    ? "bg-white text-[#17202A] font-semibold shadow-sm"
                    : "text-[#5F6B76] hover:text-[#17202A]"
                }`}
              >
                {cat === "College Delegation" ? "College delegations" : cat === "Sponsor" ? "Sponsors" : "Both"}
              </button>
            ))}
          </div>
        </div>

        <button
          type="button"
          onClick={handleSubmit}
          disabled={isRunning || (!prompt.trim() && !selectedFile)}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#2457C5] hover:bg-[#1B44A0] text-white text-sm font-semibold rounded-lg shadow-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isRunning ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Searching…</span>
            </>
          ) : (
            <>
              <Search className="w-4 h-4" />
              <span>Find leads</span>
            </>
          )}
        </button>
      </div>

      {/* Brochure Upload Disclosure */}
      <div className="mt-5 pt-4 border-t border-[#E2E6EA]">
        <button
          type="button"
          onClick={() => setIsBrochureOpen(!isBrochureOpen)}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-[#5F6B76] hover:text-[#17202A] transition-colors"
        >
          <ChevronDown
            className={`w-3.5 h-3.5 transition-transform duration-200 ${
              isBrochureOpen ? "rotate-180" : ""
            }`}
          />
          <span>Attach event brochure (PDF)</span>
          <span className="text-[#77818B] font-normal">— optional, extracts sponsor context</span>
        </button>

        {isBrochureOpen && (
          <div className="mt-3">
            <input
              type="file"
              id="brochure-file"
              accept=".pdf,application/pdf"
              className="hidden"
              onChange={handleFileChange}
            />

            {!selectedFile ? (
              <div
                onClick={() => document.getElementById("brochure-file")?.click()}
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleDrop}
                className="border border-dashed border-[#E2E6EA] hover:border-[#2457C5] bg-[#F1F3F5] hover:bg-[#F4F7FD] rounded-lg p-5 text-center cursor-pointer transition-colors"
              >
                <p className="text-xs font-medium text-[#17202A]">
                  Drop event brochure PDF here or{" "}
                  <span className="text-[#2457C5] underline">browse files</span>
                </p>
                <p className="text-[11px] text-[#77818B] mt-1">
                  PDF up to 25 MB · Digital brochures or scanned decks
                </p>
              </div>
            ) : (
              <div className="flex items-center justify-between p-3 bg-[#F1F3F5] border border-[#E2E6EA] rounded-lg">
                <div className="flex items-center gap-2.5">
                  <FileText className="w-4 h-4 text-[#2457C5]" />
                  <div>
                    <p className="text-xs font-medium text-[#17202A] truncate max-w-[260px]">
                      {selectedFile.name}
                    </p>
                    <p className="text-[10px] text-[#77818B]">
                      {(selectedFile.size / 1024).toFixed(1)} KB · Ready
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedFile(null)}
                  className="p-1 text-[#77818B] hover:text-[#B42318] rounded"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

