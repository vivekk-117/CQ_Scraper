"""CLI & Service Runner for Autonomous Lead Discovery & Verification Agent.

Usage:
    # Run discovery via natural language prompt:
    python main.py --prompt "Find FinTech Sponsors in Bengaluru"

    # Run discovery via conference brochure PDF:
    python main.py --brochure path/to/brochure.pdf

    # Launch FastAPI Backend & Web Dashboard:
    python main.py --serve --port 8000
"""

from __future__ import annotations

import argparse
import asyncio
import os
import sys
import uuid
from loguru import logger

from src.graph.lead_graph import lead_graph
from src.models.state import create_initial_state


async def run_cli_agent(prompt: str | None = None, brochure_path: str | None = None) -> None:
    """Runs the LangGraph agent autonomously in CLI mode and outputs results to stdout."""
    session_id = f"cli_{uuid.uuid4().hex[:8]}"
    logger.info(f"Initializing Lead Discovery Agent [Session ID: {session_id}]")

    if not prompt and not brochure_path:
        logger.error("Must provide either --prompt or --brochure. Run with --help for usage.")
        sys.exit(1)

    if brochure_path and not os.path.exists(brochure_path):
        logger.error(f"Brochure file not found at: {brochure_path}")
        sys.exit(1)

    # Initialize state
    initial_state = create_initial_state(
        search_prompt=prompt,
        brochure_path=brochure_path,
    )

    logger.info("Starting autonomous LangGraph execution...")
    config = {"configurable": {"thread_id": session_id}}

    try:
        final_state = await lead_graph.ainvoke(initial_state, config=config)
    except Exception as exc:
        logger.exception(f"Agent execution encountered an error: {exc}")
        sys.exit(1)

    verified_leads = final_state.get("verified_leads", [])
    logger.info(f"Autonomous run complete. Verified Leads: {len(verified_leads)}")

    # Print formatted 6-field terminal table
    print("\n" + "=" * 115)
    print("VERIFIED 6-FIELD LEADS SUMMARY (ZERO-HALLUCINATION AUDITED)")
    print("=" * 115)
    col_fmt = "{:<25} | {:<18} | {:<14} | {:<28} | {:<32} | {:<15}"
    print(col_fmt.format("Organization Name", "Category", "Location", "Contact Person", "Contact Channel", "Status"))
    print("-" * 115)

    if not verified_leads:
        print("No deliverable leads passed strict verification gates for this query.")
    else:
        for lead in verified_leads:
            if isinstance(lead, dict):
                org = lead.get("organization_name") or lead.get("Organization Name", "")
                cat = lead.get("category") or lead.get("Category", "")
                loc = lead.get("location") or lead.get("Location", "")
                person = lead.get("contact_person") or lead.get("Contact Person", "")
                chan = lead.get("contact_channel") or lead.get("Contact Channel", "")
                status = lead.get("verification_status") or lead.get("Verification Status", "")
            else:
                org = lead.organization_name
                cat = lead.category.value if hasattr(lead.category, "value") else str(lead.category)
                loc = lead.location
                person = lead.contact_person
                chan = lead.contact_channel
                status = lead.verification_status.value if hasattr(lead.verification_status, "value") else str(lead.verification_status)

            print(col_fmt.format(
                str(org)[:24],
                str(cat)[:17],
                str(loc)[:13],
                str(person)[:27],
                str(chan)[:31],
                str(status)[:14],
            ))
    print("=" * 115)

    sheet_url = final_state.get("google_sheet_url")
    if sheet_url:
        print(f"\n📊 Google Sheet Live URL: {sheet_url}\n")


def main() -> None:
    """Main CLI entrypoint."""
    parser = argparse.ArgumentParser(
        description="Autonomous Lead Discovery & Verification Agent (CQ Scraper)",
        formatter_class=argparse.RawDescriptionHelpFormatter,
    )
    parser.add_argument(
        "--prompt",
        type=str,
        help="Natural language target query (e.g., 'Find AI & Cloud Sponsors in Mumbai')",
    )
    parser.add_argument(
        "--brochure",
        type=str,
        help="Path to sponsor brochure or conference program PDF",
    )
    parser.add_argument(
        "--serve",
        action="store_true",
        help="Launch the FastAPI REST API, SSE streaming service, and Web Dashboard",
    )
    parser.add_argument(
        "--host",
        type=str,
        default="0.0.0.0",
        help="Host for web server (default: 0.0.0.0)",
    )
    parser.add_argument(
        "--port",
        type=int,
        default=8000,
        help="Port for web server (default: 8000)",
    )

    args = parser.parse_args()

    if args.serve:
        import uvicorn
        logger.info(f"Starting CQ Scraper Web Server & Dashboard at http://{args.host}:{args.port}")
        uvicorn.run("src.api.app:app", host=args.host, port=args.port, reload=True)
    elif args.prompt or args.brochure:
        asyncio.run(run_cli_agent(prompt=args.prompt, brochure_path=args.brochure))
    else:
        parser.print_help()


if __name__ == "__main__":
    main()

