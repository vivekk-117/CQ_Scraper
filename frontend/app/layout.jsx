import "./globals.css";

export const metadata = {
  title: "CQ Scraper — IIT Kharagpur Event Lead Discovery",
  description:
    "Autonomous workspace for discovering, evaluating, and organizing sponsors and collegiate delegations for IIT Kharagpur events.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen bg-[#F7F8FA] text-[#17202A] flex flex-col font-sans">
        {children}
      </body>
    </html>
  );
}

