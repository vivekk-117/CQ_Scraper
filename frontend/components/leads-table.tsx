"use client";

import React, { useState } from "react";
import {
  Search,
  ExternalLink,
  Copy,
  Check,
  Building2,
  MapPin,
  UserCheck,
  Sparkles,
  ShieldCheck,
  Download,
  Filter,
} from "lucide-react";
import { copyToClipboard } from "../lib/utils";

export interface LeadRecord {
  organization_name?: string;
  "Organization Name"?: string;
  category?: string;
  Category?: string;
  location?: string;
  Location?: string;
  contact_person?: string;
  "Contact Person"?: string;
  contact_channel?: string;
  "Contact Channel"?: string;
  verification_status?: string;
  "Verification Status"?: string;
}

interface LeadsTableProps {
  leads: LeadRecord[];
  googleSheetUrl: string | null;
  isRunning: boolean;
}

export const LeadsTable: React.FC<LeadsTableProps> = ({
  leads,
  googleSheetUrl,
  isRunning,
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("ALL");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [copiedChannel, setCopiedChannel] = useState<string | null>(null);

  // Normalize accessors
  const getOrg = (l: LeadRecord) => l["Organization Name"] || l.organization_name || "";
  const getCat = (l: LeadRecord) => l["Category"] || l.category || "Sponsor";
  const getLoc = (l: LeadRecord) => l["Location"] || l.location || "";
  const getPerson = (l: LeadRecord) => l["Contact Person"] || l.contact_person || "";
  const getChannel = (l: LeadRecord) => l["Contact Channel"] || l.contact_channel || "";
  const getStatus = (l: LeadRecord) => l["Verification Status"] || l.verification_status || "Verified";

  const handleCopy = async (text: string) => {
    const success = await copyToClipboard(text);
    if (success) {
      setCopiedChannel(text);
      setTimeout(() => setCopiedChannel(null), 2000);
    }
  };

  // Filter leads
  const filteredLeads = leads.filter((lead) => {
    const org = getOrg(lead).toLowerCase();
    const person = getPerson(lead).toLowerCase();
    const channel = getChannel(lead).toLowerCase();
    const loc = getLoc(lead).toLowerCase();
    const cat = getCat(lead);
    const status = getStatus(lead);

    const matchesSearch =
      !searchTerm ||
      org.includes(searchTerm.toLowerCase()) ||
      person.includes(searchTerm.toLowerCase()) ||
      channel.includes(searchTerm.toLowerCase()) ||
      loc.includes(searchTerm.toLowerCase());

    const matchesCategory =
      categoryFilter === "ALL" ||
      (categoryFilter === "SPONSOR" && cat === "Sponsor") ||
      (categoryFilter === "DELEGATION" && cat === "College Delegation");

    const matchesStatus =
      statusFilter === "ALL" ||
      (statusFilter === "VERIFIED" && status === "Verified") ||
      (statusFilter === "PATTERN" && status === "Pattern-Derived");

    return matchesSearch && matchesCategory && matchesStatus;
  });

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl my-6">
      {/* Table Header Controls */}
      <div className="p-5 border-b border-slate-800 bg-slate-900/90 flex flex-col md:flex-row gap-4 items-center justify-between">
        <div>
          <h2 className="text-base font-semibold text-slate-100 flex items-center gap-2">
            <Building2 className="w-5 h-5 text-indigo-400" />
            <span>Master Leads Roster (Strict 6-Field Output Schema)</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-800 border border-slate-700 text-slate-300 font-mono">
              {filteredLeads.length} / {leads.length} leads
            </span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Real human decision-makers verified through MX DNS, SMTP handshake, or authentic social profiles.
          </p>
        </div>

        {/* Action Controls & Google Sheet CTA */}
        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
          {googleSheetUrl && (
            <a
              href={googleSheetUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-emerald-950/20 transition-all active:scale-[0.98]"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Open in Google Sheets</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          )}
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="p-4 bg-slate-950/50 border-b border-slate-800/80 flex flex-col sm:flex-row gap-3 items-center justify-between">
        {/* Search Input */}
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Filter by org, name, role, email..."
            className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>

        {/* Category & Status Filter Pills */}
        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          <div className="flex items-center bg-slate-900 border border-slate-800 rounded-lg p-0.5 text-xs">
            <button
              onClick={() => setCategoryFilter("ALL")}
              className={`px-2 py-1 rounded-md transition-colors ${
                categoryFilter === "ALL" ? "bg-indigo-600 text-white" : "text-slate-400 hover:text-slate-200"
              }`}
            >
              All Categories
            </button>
            <button
              onClick={() => setCategoryFilter("SPONSOR")}
              className={`px-2 py-1 rounded-md transition-colors ${
                categoryFilter === "SPONSOR" ? "bg-teal-600 text-white" : "text-slate-400 hover:text-slate-200"
              }`}
            >
              Sponsors
            </button>
            <button
              onClick={() => setCategoryFilter("DELEGATION")}
              className={`px-2 py-1 rounded-md transition-colors ${
                categoryFilter === "DELEGATION" ? "bg-violet-600 text-white" : "text-slate-400 hover:text-slate-200"
              }`}
            >
              Delegations
            </button>
          </div>

          <div className="flex items-center bg-slate-900 border border-slate-800 rounded-lg p-0.5 text-xs">
            <button
              onClick={() => setStatusFilter("ALL")}
              className={`px-2 py-1 rounded-md transition-colors ${
                statusFilter === "ALL" ? "bg-indigo-600 text-white" : "text-slate-400 hover:text-slate-200"
              }`}
            >
              All Status
            </button>
            <button
              onClick={() => setStatusFilter("VERIFIED")}
              className={`px-2 py-1 rounded-md transition-colors ${
                statusFilter === "VERIFIED" ? "bg-emerald-600 text-white" : "text-slate-400 hover:text-slate-200"
              }`}
            >
              Verified
            </button>
            <button
              onClick={() => setStatusFilter("PATTERN")}
              className={`px-2 py-1 rounded-md transition-colors ${
                statusFilter === "PATTERN" ? "bg-amber-600 text-white" : "text-slate-400 hover:text-slate-200"
              }`}
            >
              Pattern-Derived
            </button>
          </div>
        </div>
      </div>

      {/* Leads Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-800 bg-slate-950/80 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              <th className="py-3 px-4">Organization Name</th>
              <th className="py-3 px-4">Category</th>
              <th className="py-3 px-4">Location</th>
              <th className="py-3 px-4">Contact Person</th>
              <th className="py-3 px-4">Contact Channel</th>
              <th className="py-3 px-4">Verification Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 text-xs">
            {filteredLeads.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-12 text-center text-slate-500">
                  {leads.length === 0 ? (
                    <div className="flex flex-col items-center justify-center gap-2">
                      <UserCheck className="w-8 h-8 text-slate-600" />
                      <p className="text-sm font-medium text-slate-400">No leads discovered yet</p>
                      <p className="text-xs text-slate-500">
                        Upload an event brochure PDF or enter a natural language search query above.
                      </p>
                    </div>
                  ) : (
                    <div>No leads match your current search and filter criteria.</div>
                  )}
                </td>
              </tr>
            ) : (
              filteredLeads.map((lead, idx) => {
                const org = getOrg(lead);
                const cat = getCat(lead);
                const loc = getLoc(lead);
                const person = getPerson(lead);
                const channel = getChannel(lead);
                const status = getStatus(lead);
                const isEmail = channel.includes("@");
                const isUrl = channel.startsWith("http://") || channel.startsWith("https://");

                return (
                  <tr
                    key={idx}
                    className="hover:bg-slate-800/40 transition-colors group"
                  >
                    {/* 1. Organization Name */}
                    <td className="py-3 px-4 font-semibold text-slate-100">
                      <div className="flex items-center gap-2">
                        <Building2 className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                        <span className="truncate max-w-[200px]" title={org}>
                          {org}
                        </span>
                      </div>
                    </td>

                    {/* 2. Category */}
                    <td className="py-3 px-4">
                      {cat === "Sponsor" ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium bg-teal-500/10 text-teal-400 border border-teal-500/20">
                          Sponsor
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium bg-violet-500/10 text-violet-400 border border-violet-500/20">
                          College Delegation
                        </span>
                      )}
                    </td>

                    {/* 3. Location */}
                    <td className="py-3 px-4 text-slate-300">
                      <div className="flex items-center gap-1.5">
                        <MapPin className="w-3 h-3 text-slate-500 shrink-0" />
                        <span>{loc || "India"}</span>
                      </div>
                    </td>

                    {/* 4. Contact Person */}
                    <td className="py-3 px-4 font-medium text-slate-200">
                      <span className="truncate max-w-[220px] inline-block" title={person}>
                        {person}
                      </span>
                    </td>

                    {/* 5. Contact Channel */}
                    <td className="py-3 px-4 font-mono text-[13px]">
                      {isUrl ? (
                        <a
                          href={channel}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-indigo-400 hover:text-indigo-300 hover:underline max-w-[220px] truncate"
                          title={channel}
                        >
                          <span className="truncate">{channel}</span>
                          <ExternalLink className="w-3 h-3 shrink-0" />
                        </a>
                      ) : (
                        <div className="flex items-center gap-1.5 text-slate-300">
                          <span className="truncate max-w-[190px]" title={channel}>
                            {channel}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleCopy(channel)}
                            className="p-1 hover:text-white text-slate-500 hover:bg-slate-800 rounded transition-colors"
                            title="Copy email to clipboard"
                          >
                            {copiedChannel === channel ? (
                              <Check className="w-3.5 h-3.5 text-emerald-400" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      )}
                    </td>

                    {/* 6. Verification Status */}
                    <td className="py-3 px-4">
                      {status === "Verified" ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[11px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          <Check className="w-3 h-3 text-emerald-400" />
                          <span>Verified</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[11px] font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20">
                          <Sparkles className="w-3 h-3 text-amber-400" />
                          <span>Pattern-Derived</span>
                        </span>
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
  );
};

