import React, { useState } from "react";
import { Search, ChevronDown, FileText, X, Loader2, ShieldCheck } from "lucide-react";

export function SearchBrief({ onStartSearch, isRunning }) {
  const [prompt, setPrompt] = useState("");
  const [category, setCategory] = useState("Both");
  const [selectedFile, setSelectedFile] = useState(null);
  const [isBrochureOpen, setIsBrochureOpen] = useState(false);

  const suggestions = [
    "FinTech sponsors in Bengaluru",
    "Robotics teams in Delhi",
    "AI companies in Mumbai",
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
    <div>
      <div className="bg-[#FFFEFB] border border-[#E5E0D7] rounded-xl p-7 shadow-none">
        {/* Search Brief Label */}
        <div className="flex items-baseline justify-between mb-2">
          <label htmlFor="search-brief" className="text-base font-bold text-[#222722]">
            Search brief
          </label>
          <span className="text-xs text-[#69716C]">Describe your ideal leads</span>
        </div>

        {/* Search Input Area */}
        <textarea
          id="search-brief"
          rows={3}
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="e.g. Indian robotics companies that sponsor student events, or collegiate technical teams in Delhi"
          className="w-full px-4 py-3 border border-[#E5E0D7] rounded-lg text-sm text-[#222722] placeholder-[#8C938E] bg-[#FFFEFB] focus:outline-none focus:border-[#17664F] focus:ring-2 focus:ring-[#17664F]/10 resize-none transition-all"
          disabled={isRunning}
        />

        {/* Suggestion Chips */}
        <div className="flex flex-wrap items-center gap-2 mt-3">
          <span className="text-xs text-[#69716C] mr-1">Try:</span>
          {suggestions.map((sug, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setPrompt(sug)}
              className="text-xs font-medium text-[#17664F] bg-[#E8F1EC] hover:bg-[#DDEAE2] px-3.5 py-1 rounded-full transition-colors"
            >
              {sug}
            </button>
          ))}
        </div>

        {/* Controls: Target Category & Submit */}
        <div className="flex flex-wrap items-end justify-between gap-4 mt-6 pt-5 border-t border-[#E5E0D7]">
          <div>
            <span className="text-xs font-bold text-[#222722] block mb-2">
              Find
            </span>
            <div className="inline-flex bg-[#FFFEFB] p-0.5 rounded-lg border border-[#E5E0D7]">
              {["Both", "Sponsor", "College Delegation"].map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setCategory(cat)}
                  className={`text-xs px-4 py-1.5 rounded-md transition-all ${
                    category === cat
                      ? "bg-[#E8F1EC] text-[#17664F] font-semibold border border-[#D0E2D8]"
                      : "text-[#69716C] hover:text-[#222722] font-medium"
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
            className="inline-flex items-center gap-2 px-6 py-2.5 bg-[#17664F] hover:bg-[#125340] text-white text-sm font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
        <div className="mt-5 pt-4 border-t border-[#E5E0D7]">
          <button
            type="button"
            onClick={() => setIsBrochureOpen(!isBrochureOpen)}
            className="inline-flex items-center gap-2 text-xs font-medium text-[#222722] hover:text-[#17664F] transition-colors text-left"
          >
            <ChevronDown
              className={`w-3.5 h-3.5 flex-shrink-0 transition-transform duration-200 ${
                isBrochureOpen ? "rotate-180" : ""
              }`}
            />
            <FileText className="w-3.5 h-3.5 flex-shrink-0 text-[#222722]" />
            <span className="inline-flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
              <span className="font-semibold">Add event brochure (PDF)</span>
              <span className="text-[#69716C] font-normal">Optional · helps tailor sponsor relevance</span>
            </span>
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
                  className="border border-dashed border-[#E5E0D7] hover:border-[#17664F] bg-[#F7F5F0] hover:bg-[#E8F1EC] rounded-lg p-5 text-center cursor-pointer transition-colors"
                >
                  <p className="text-xs font-medium text-[#222722]">
                    Drop event brochure PDF here or{" "}
                    <span className="text-[#17664F] underline">browse files</span>
                  </p>
                  <p className="text-[11px] text-[#69716C] mt-1">
                    PDF up to 25 MB · Digital brochures or scanned decks
                  </p>
                </div>
              ) : (
                <div className="flex items-center justify-between p-3 bg-[#F7F5F0] border border-[#E5E0D7] rounded-lg">
                  <div className="flex items-center gap-2.5">
                    <FileText className="w-4 h-4 text-[#17664F]" />
                    <div>
                      <p className="text-xs font-medium text-[#222722] truncate max-w-[260px]">
                        {selectedFile.name}
                      </p>
                      <p className="text-[10px] text-[#69716C]">
                        {(selectedFile.size / 1024).toFixed(1)} KB · Ready
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedFile(null)}
                    className="p-1 text-[#69716C] hover:text-[#B42318] rounded"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Trust Note beneath main surface */}
      <div className="flex items-center gap-2 text-xs text-[#69716C] mt-4 px-0.5">
        <ShieldCheck className="w-4 h-4 text-[#17664F] shrink-0" />
        <span>Review source links and contact verification before outreach.</span>
      </div>
    </div>
  );
}

