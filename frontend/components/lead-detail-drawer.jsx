import React from "react";
import { X, Copy, Check, ExternalLink, Clock } from "lucide-react";
import { copyToClipboard } from "../lib/utils";

export function LeadDetailDrawer({ lead, isOpen, onClose, onToggleOutreach, isContacted }) {
  const [copied, setCopied] = React.useState(false);

  if (!isOpen || !lead) return null;

  const org = lead["Organization Name"] || lead.organization_name || "";
  const cat = lead["Category"] || lead.category || "Sponsor";
  const loc = lead["Location"] || lead.location || "India";
  const person = lead["Contact Person"] || lead.contact_person || "";
  const channel = lead["Contact Channel"] || lead.contact_channel || "";
  const status = lead["Verification Status"] || lead.verification_status || "Verified";

  const isUrl = channel.startsWith("http://") || channel.startsWith("https://");

  const handleCopy = async () => {
    const ok = await copyToClipboard(channel);
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-[#222722]/40 z-50 flex justify-end transition-opacity"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md bg-[#FFFEFB] h-full shadow-2xl flex flex-col overflow-y-auto border-l border-[#E5E0D7]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drawer Header */}
        <div className="px-6 py-5 border-b border-[#E5E0D7] flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-[#222722]">{org}</h3>
            <span className="text-xs text-[#69716C]">IIT Kharagpur Event Lead</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#8C938E] hover:text-[#222722] hover:bg-[#F2EFE9] transition-colors"
            aria-label="Close detail panel"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Drawer Content */}
        <div className="p-6 flex-1 flex flex-col gap-5">
          {/* Category & Location */}
          <div>
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[#8C938E] block mb-1">
              Category & Location
            </span>
            <div className="flex items-center gap-2">
              <span
                className={`inline-block text-xs font-medium px-2 py-0.5 rounded ${
                  cat === "Sponsor"
                    ? "bg-[#E8F1EC] text-[#17664F]"
                    : "bg-[#F2EEFA] text-[#5A4588]"
                }`}
              >
                {cat}
              </span>
              <span className="text-sm text-[#69716C]">{loc}</span>
            </div>
          </div>

          {/* Contact Person */}
          <div>
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[#8C938E] block mb-1">
              Contact Person & Role
            </span>
            <div className="text-sm font-medium text-[#222722]">{person}</div>
          </div>

          {/* Contact Channel */}
          <div>
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[#8C938E] block mb-1">
              Deliverable Contact Channel
            </span>
            <div className="flex items-center gap-2 mt-1">
              {isUrl ? (
                <a
                  href={channel}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm font-medium text-[#17664F] hover:underline flex items-center gap-1 truncate"
                >
                  <span className="truncate">{channel}</span>
                  <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                </a>
              ) : (
                <span className="text-sm font-medium text-[#222722]">{channel}</span>
              )}
              <button
                type="button"
                onClick={handleCopy}
                className="p-1 text-[#8C938E] hover:text-[#222722] hover:bg-[#F2EFE9] rounded transition-colors"
                title="Copy contact"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-[#17664F]" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          {/* Verification Evidence */}
          <div>
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[#8C938E] block mb-1">
              Verification Evidence
            </span>
            <div
              className={`p-3.5 rounded-lg border text-xs leading-relaxed ${
                status === "Verified"
                  ? "bg-[#E8F1EC] border-[#D0E2D8] text-[#17664F]"
                  : "bg-[#FDF4E2] border-[#F8DFAC] text-[#8A5F00]"
              }`}
            >
              {status === "Verified" ? (
                <>
                  <strong>Verified Deliverable:</strong> Confirmed direct mailbox via DNS MX resolution and non-intrusive SMTP handshake (250 OK) or authentic personal social profile.
                </>
              ) : (
                <>
                  <strong>Inferred via Domain Pattern:</strong> Synthesized via corporate email naming pattern supported by ≥2 observed domain employee emails. Recommended for review before outreach.
                </>
              )}
            </div>
          </div>

          {/* Event Context & Outreach */}
          <div>
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[#8C938E] block mb-1">
              Outreach Workflow
            </span>
            <p className="text-xs text-[#69716C] mb-2">
              Mark this lead as contacted once outreach has been initiated by the student relations team.
            </p>
            <button
              type="button"
              onClick={onToggleOutreach}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
                isContacted
                  ? "bg-[#E8F1EC] text-[#17664F] border-[#D0E2D8]"
                  : "bg-[#FFFEFB] text-[#69716C] border-[#E5E0D7] hover:bg-[#F2EFE9]"
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>{isContacted ? "Status: Contacted (Click to undo)" : "Mark as Contacted"}</span>
            </button>
          </div>
        </div>

        {/* Drawer Footer */}
        <div className="p-4 border-t border-[#E5E0D7] bg-[#F2EFE9] flex gap-2">
          <button
            type="button"
            onClick={handleCopy}
            className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 bg-[#17664F] hover:bg-[#125340] text-white rounded-lg text-xs font-semibold transition-colors"
          >
            <Copy className="w-3.5 h-3.5" />
            <span>{copied ? "Copied!" : "Copy Contact"}</span>
          </button>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-[#FFFEFB] hover:bg-[#F2EFE9] text-[#69716C] border border-[#E5E0D7] rounded-lg text-xs font-semibold transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

