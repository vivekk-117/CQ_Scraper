"use client";

import React, { useState, useRef } from "react";
import { UploadCloud, FileText, X, AlertCircle } from "lucide-react";

interface BrochureUploadProps {
  selectedFile: File | null;
  setSelectedFile: (file: File | null) => void;
  categoryFocus: string;
  setCategoryFocus: (val: string) => void;
  maxTargets: number;
  setMaxTargets: (val: number) => void;
  disabled?: boolean;
}

export const BrochureUpload: React.FC<BrochureUploadProps> = ({
  selectedFile,
  setSelectedFile,
  categoryFocus,
  setCategoryFocus,
  maxTargets,
  setMaxTargets,
  disabled = false,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled) setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (disabled) return;

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      validateAndSetFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      validateAndSetFile(e.target.files[0]);
    }
  };

  const validateAndSetFile = (file: File) => {
    setErrorMessage(null);
    if (!file.name.toLowerCase().endsWith(".pdf")) {
      setErrorMessage("Only PDF event brochures are supported (.pdf).");
      return;
    }
    if (file.size > 25 * 1024 * 1024) {
      setErrorMessage("File exceeds 25MB maximum brochure size limit.");
      return;
    }
    setSelectedFile(file);
  };

  const clearFile = () => {
    setSelectedFile(null);
    setErrorMessage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024 * 1024) {
      return `${(bytes / 1024).toFixed(1)} KB`;
    }
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  return (
    <div className="space-y-4">
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,application/pdf"
        className="hidden"
        onChange={handleFileChange}
        disabled={disabled}
      />

      {/* Dropzone Container */}
      {!selectedFile ? (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => !disabled && fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all duration-200 bg-gradient-to-b from-slate-900 to-slate-950 flex flex-col items-center justify-center min-h-[160px] ${
            isDragging
              ? "border-indigo-500 ring-4 ring-indigo-500/20 bg-indigo-950/20"
              : "border-slate-800 hover:border-indigo-500/50 hover:bg-slate-900/80"
          } ${disabled ? "opacity-60 cursor-not-allowed" : ""}`}
        >
          <div className="w-12 h-12 rounded-full bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 mb-3">
            <UploadCloud className="w-6 h-6 animate-pulse-subtle" />
          </div>
          <p className="text-sm font-semibold text-slate-200">
            Drop event brochure PDF here or <span className="text-indigo-400 underline">browse</span>
          </p>
          <p className="text-xs text-slate-500 mt-1">
            Supports multi-page digital PDFs & scanned raster sponsor decks up to 25MB
          </p>
        </div>
      ) : (
        <div className="bg-slate-950/80 border border-indigo-500/30 rounded-xl p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-200 font-sans truncate max-w-[280px] sm:max-w-[400px]">
                {selectedFile.name}
              </p>
              <p className="text-xs text-slate-400">{formatFileSize(selectedFile.size)} • PDF Ready</p>
            </div>
          </div>
          <button
            type="button"
            onClick={clearFile}
            disabled={disabled}
            className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition-colors"
            title="Remove uploaded brochure"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {errorMessage && (
        <div className="flex items-center gap-2 p-2.5 bg-rose-500/10 border border-rose-500/20 rounded-lg text-rose-400 text-xs">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

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

