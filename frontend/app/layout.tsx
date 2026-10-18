import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "CQ Scraper — Autonomous Lead Discovery & Verification Agent",
  description:
    "LangGraph-powered autonomous AI agent for discovering and verifying B2B event sponsors and collegiate delegations with zero hallucinations.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen bg-[#080B11] text-slate-100 flex flex-col font-sans selection:bg-indigo-500/30 selection:text-indigo-200">
        {/* Top Navbar */}
        <header className="sticky top-0 z-50 border-b border-slate-800 bg-[#080B11]/80 backdrop-blur-md">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-indigo-400 flex items-center justify-center shadow-lg shadow-indigo-600/30">
                <span className="text-white font-bold text-sm">CQ</span>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-base font-bold text-slate-50 tracking-tight">CQ Scraper</h1>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                    Autonomous Agent
                  </span>
                </div>
                <p className="text-[11px] text-slate-400">
                  LangGraph B2B Sponsor & Collegiate Delegation Extractor
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-900 border border-slate-800 text-xs text-slate-400">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>Backend: Online</span>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content Shell */}
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {children}
        </main>

        {/* Footer */}
        <footer className="border-t border-slate-800/80 py-6 text-center text-xs text-slate-500">
          <p>
            Autonomous Lead Discovery & Verification Agent • Built with LangGraph & FastAPI • 100-Point Architecture
          </p>
        </footer>
      </body>
    </html>
  );
}

