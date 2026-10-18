import React, { useState } from "react";
import {
  Search,
  Download,
  ExternalLink,
  Copy,
  Check,
  Info,
  Users,
} from "lucide-react";
import { copyToClipboard } from "../lib/utils";

export function LeadsRoster({
  leads,
  googleSheetUrl,
  onSelectLead,
  outreachRecords,
}) {
  const [search, setSearch] = useState("");
  const [catFilter, setCatFilter] = useState("ALL");
  const [statFilter, setStatFilter] = useState("ALL");
  const [copiedId, setCopiedId] = useState(null);

  const filteredLeads = leads.filter((l) => {
    const org = (l["Organization Name"] || l.organization_name || "").toLowerCase();
    const cat = l["Category"] || l.category || "Sponsor";
    const loc = (l["Location"] || l.location || "").toLowerCase();
    const person = (l["Contact Person"] || l.contact_person || "").toLowerCase();
    const channel = (l["Contact Channel"] || l.contact_channel || "").toLowerCase();
    const status = l["Verification Status"] || l.verification_status || "Verified";

    const s = search.toLowerCase();
    const matchesSearch =
      !s ||
      org.includes(s) ||
      loc.includes(s) ||
      person.includes(s) ||
      channel.includes(s);

    const matchesCat = catFilter === "ALL" || cat === catFilter;
    const matchesStat = statFilter === "ALL" || status === statFilter;

    return matchesSearch && matchesCat && matchesStat;
  });

  const handleCopyChannel = async (e, text, id) => {
    e.stopPropagation();
    const ok = await copyToClipboard(text);
    if (ok) {
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 1500);
    }
  };

  const handleExportCSV = () => {
    if (leads.length === 0) {
      alert("No leads to export yet.");
      return;
    }
    const headers = [
      "Organization Name",
      "Category",
      "Location",
      "Contact Person",
      "Contact Channel",
      "Verification Status",
    ];
    const rows = [headers.join(",")];

    leads.forEach((l) => {
      const escape = (val) => `"${String(val || "").replace(/"/g, '""')}"`;
      rows.push(
        [
          escape(l["Organization Name"] || l.organization_name),
          escape(l["Category"] || l.category || "Sponsor"),
          escape(l["Location"] || l.location || "India"),
          escape(l["Contact Person"] || l.contact_person),
          escape(l["Contact Channel"] || l.contact_channel),
          escape(l["Verification Status"] || l.verification_status || "Verified"),
        ].join(",")
      );
    });

    const blob = new Blob([rows.join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `iit_kgp_leads_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-4">
      {/* Top Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-[#17202A]">Leads</h2>
          <p className="text-xs text-[#5F6B76]">
            {leads.length} lead{leads.length === 1 ? "" : "s"} discovered for your event
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleExportCSV}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-[#F1F3F5] text-[#5F6B76] border border-[#E2E6EA] rounded-lg text-xs font-semibold shadow-sm transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
          {googleSheetUrl && (
            <a
              href={googleSheetUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#EBF8F1] hover:bg-[#D4F3E2] text-[#18794E] border border-[#C3E6D2] rounded-lg text-xs font-semibold shadow-sm transition-colors"
            >
              <span>Open in Google Sheets</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          )}
        </div>
      </div>

      {/* Filter Row */}
      <div className="flex flex-wrap items-center gap-2.5">
        <div className="relative flex-1 min-w-[200px] max-w-xs">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#77818B]" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search organization, contact…"
            className="w-full pl-8 pr-3 py-1.5 border border-[#E2E6EA] rounded-lg text-xs text-[#17202A] placeholder-[#77818B] focus:outline-none focus:border-[#2457C5]"
          />
        </div>

        {/* Category Pills */}
        <div className="inline-flex bg-white p-0.5 rounded-lg border border-[#E2E6EA]">
          {[
            { id: "ALL", label: "All categories" },
            { id: "Sponsor", label: "Sponsors" },
            { id: "College Delegation", label: "Delegations" },
          ].map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setCatFilter(item.id)}
              className={`text-xs font-medium px-2.5 py-1 rounded-md transition-colors ${
                catFilter === item.id
                  ? item.id === "Sponsor"
                    ? "bg-[#E6F6F8] text-[#087F8C] font-semibold"
                    : item.id === "College Delegation"
                    ? "bg-[#F2EEFA] text-[#6B4DB3] font-semibold"
                    : "bg-[#F1F3F5] text-[#17202A] font-semibold"
                  : "text-[#5F6B76] hover:text-[#17202A]"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        {/* Status Pills */}
        <div className="inline-flex bg-white p-0.5 rounded-lg border border-[#E2E6EA]">
          {[
            { id: "ALL", label: "All statuses" },
            { id: "Verified", label: "Verified" },
            { id: "Pattern-Derived", label: "Inferred" },
          ].map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setStatFilter(item.id)}
              className={`text-xs font-medium px-2.5 py-1 rounded-md transition-colors ${
                statFilter === item.id
                  ? "bg-[#F1F3F5] text-[#17202A] font-semibold"
                  : "text-[#5F6B76] hover:text-[#17202A]"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* Leads Table */}
      <div className="bg-white border border-[#E2E6EA] rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#F1F3F5] border-b border-[#E2E6EA]">
                <th className="px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-[#77818B]">
                  Organization
                </th>
                <th className="px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-[#77818B]">
                  Type
                </th>
                <th className="px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-[#77818B]">
                  Location
                </th>
                <th className="px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-[#77818B]">
                  Best Contact
                </th>
                <th className="px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-[#77818B]">
                  Contact Channel
                </th>
                <th className="px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-[#77818B]">
                  Evidence
                </th>
                <th className="px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-[#77818B] text-right">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2E6EA] text-xs">
              {filteredLeads.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-[#77818B]">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Users className="w-7 h-7 text-[#77818B]/60" />
                      <p className="text-sm font-semibold text-[#5F6B76]">
                        {leads.length === 0 ? "No leads yet" : "No matching leads"}
                      </p>
                      <p className="text-xs text-[#77818B]">
                        {leads.length === 0
                          ? "Describe the sponsors or delegations you want to find to get started."
                          : "Try adjusting your search criteria or clearing active filters."}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredLeads.map((lead, idx) => {
                  const org = lead["Organization Name"] || lead.organization_name || "";
                  const cat = lead["Category"] || lead.category || "Sponsor";
                  const loc = lead["Location"] || lead.location || "India";
                  const person = lead["Contact Person"] || lead.contact_person || "";
                  const channel = lead["Contact Channel"] || lead.contact_channel || "";
                  const status = lead["Verification Status"] || lead.verification_status || "Verified";

                  const isUrl = channel.startsWith("http://") || channel.startsWith("https://");
                  const isContacted = !!outreachRecords?.[channel];

                  return (
                    <tr
                      key={idx}
                      onClick={() => onSelectLead(lead)}
                      className="hover:bg-[#F8FAFC] cursor-pointer transition-colors"
                    >
                      <td className="px-4 py-3 font-semibold text-[#17202A]">{org}</td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-block text-[11px] font-medium px-2 py-0.5 rounded ${
                            cat === "Sponsor"
                              ? "bg-[#E6F6F8] text-[#087F8C]"
                              : "bg-[#F2EEFA] text-[#6B4DB3]"
                          }`}
                        >
                          {cat}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-[#5F6B76]">{loc}</td>
                      <td className="px-4 py-3 font-medium text-[#17202A]">{person}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5 max-w-[200px]">
                          {isUrl ? (
                            <a
                              href={channel}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="text-[#2457C5] hover:underline flex items-center gap-1 truncate text-xs"
                            >
                              <span className="truncate">{channel}</span>
                              <ExternalLink className="w-3 h-3 shrink-0" />
                            </a>
                          ) : (
                            <span className="truncate text-[#17202A]">{channel}</span>
                          )}
                          <button
                            type="button"
                            onClick={(e) => handleCopyChannel(e, channel, idx)}
                            className="p-1 text-[#77818B] hover:text-[#17202A] hover:bg-[#F1F3F5] rounded transition-colors shrink-0"
                            title="Copy email"
                          >
                            {copiedId === idx ? (
                              <Check className="w-3 h-3 text-[#18794E]" />
                            ) : (
                              <Copy className="w-3 h-3" />
                            )}
                          </button>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded ${
                            status === "Verified"
                              ? "bg-[#EBF8F1] text-[#18794E]"
                              : "bg-[#FEF7E8] text-[#946200]"
                          }`}
                        >
                          {status === "Verified" ? (
                            <Check className="w-3 h-3" />
                          ) : (
                            <Info className="w-3 h-3" />
                          )}
                          <span>{status === "Verified" ? "Verified" : "Inferred"}</span>
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        {isContacted ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#18794E]">
                            <Check className="w-3 h-3" />
                            <span>Contacted</span>
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onSelectLead(lead);
                            }}
                            className="px-2.5 py-1 text-[11px] font-medium text-[#5F6B76] hover:text-[#2457C5] hover:border-[#2457C5] border border-[#E2E6EA] rounded-md transition-colors"
                          >
                            View details
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

