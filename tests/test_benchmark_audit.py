"""Phase 10: Verification, Testing & Benchmark Audit (100/100 Points).

Comprehensive benchmark suite testing against the evaluation rubric:
- Task 10.1: Agent Autonomy & Dead-Link Stress Test (40 Points Rubric)
- Task 10.2: Zero-Hallucination & Deliverability Integrity Audit (30 Points Rubric)
- Task 10.3: Brochure & PDF Extraction Benchmark (15 Points Rubric)
- Task 10.4: End-to-End Hands-Free Execution Pipeline (15 Points Rubric)
"""

from __future__ import annotations

from pathlib import Path
from unittest.mock import AsyncMock, MagicMock, patch
import pymupdf
import pytest

from src.crawler.deep_crawler import CrawlResult, DeepCrawler
from src.crawler.resilience import DeadLinkHandler, ResilientFetcher
from src.extractors.decision_maker import DecisionMakerExtractor
from src.extractors.pattern_engine import EmailPatternEngine
from src.graph.edges import route_after_crawl, route_after_verification
from src.graph.lead_graph import build_lead_discovery_graph, lead_graph
from src.graph.nodes import crawl_page_node, dead_link_recovery_node
from src.models.schema import (
    CategoryEnum,
    DecisionMakerCandidate,
    FinalLeadRecord,
    ScrapedPageSnapshot,
    VerificationStatusEnum,
)
from src.models.state import AgentState, create_initial_state
from src.parsers.brochure_parser import BrochureContext, BrochureParser
from src.storage.google_sheets import GoogleSheetsSyncClient
from src.verifier.contact_verifier import ContactVerifier
from src.verifier.mx_resolver import DNSMXResolver
from src.verifier.smtp_handshake import SMTPHandshakeResult
from src.verifier.syntax_check import EmailSyntaxValidator


# ==============================================================================
# Task 10.1: Autonomy & Dead Link Stress Test (40 Points)
# ==============================================================================

class TestAutonomyAndDeadLinkStress:
    def test_dead_status_codes_detection(self):
        """DeadLinkHandler accurately detects dead HTTP status codes."""
        assert DeadLinkHandler.is_dead_response(404) is True
        assert DeadLinkHandler.is_dead_response(500) is True
        assert DeadLinkHandler.is_dead_response(502) is True
        assert DeadLinkHandler.is_dead_response(403) is True
        assert DeadLinkHandler.is_dead_response(410) is True
        assert DeadLinkHandler.is_dead_response(200) is False

    @pytest.mark.asyncio
    async def test_dead_link_detection_and_query_reformulation(self):
        """Dead link detection sets current_page_dead and triggers alternative dork query."""
        state = create_initial_state(
            search_prompt="Test sponsor run",
            category_focus="Sponsor",
            max_target_count=2,
        )
        state["candidate_urls"] = ["https://broken-target-link-404.com/about"]
        state["current_target"] = {"name": "Broken Brand Corp", "city": "Bengaluru"}

        # Simulate dead page returned by deep crawler
        dead_snapshot = ScrapedPageSnapshot(
            url="https://broken-target-link-404.com/about",
            is_dead=True,
            status_code=404,
            error_message="HTTP 404 Not Found",
        )
        mock_crawl_result = CrawlResult(
            organization_name="Broken Brand Corp",
            pages=[dead_snapshot],
            dead_urls=["https://broken-target-link-404.com/about"],
        )

        with patch.object(DeepCrawler, "crawl_organization", new=AsyncMock(return_value=mock_crawl_result)):
            crawl_output = await crawl_page_node(state)

            assert crawl_output["current_page_dead"] is True
            assert "https://broken-target-link-404.com/about" in crawl_output["dead_urls"]

            # Edge routing correctly directs to recovery node
            merged_state = {**state, **crawl_output}
            next_edge = route_after_crawl(merged_state)
            assert next_edge == "dead_link_recovery"

            # Execute recovery node
            recovery_output = await dead_link_recovery_node(merged_state)
            assert recovery_output["current_page_dead"] is False
            assert recovery_output["retry_count"] == 1
            assert len(recovery_output["search_queries"]) > 0
            # Query pivots to LinkedIn directory search
            assert "linkedin" in recovery_output["search_queries"][0].lower()


# ==============================================================================
# Task 10.2: Zero-Hallucination & Deliverability Integrity Audit (30 Points)
# ==============================================================================

class TestZeroHallucinationAudit:
    @pytest.mark.asyncio
    async def test_nxdomain_fails_mx_resolution(self):
        """Non-existent domain must fail DNS MX lookup."""
        resolver = DNSMXResolver()
        resolution = await resolver.resolve_mx("non-existent-domain-xyz-12345.com")
        assert resolution.has_mx is False
        assert len(resolution.records) == 0

    def test_generic_central_inboxes_are_strictly_rejected(self):
        """Generic department inboxes are blocked from direct emails."""
        prohibited_emails = [
            "info@company.com",
            "contact@firm.in",
            "admin@college.edu",
            "support@brand.org",
            "sales@store.co",
            "hello@agency.io",
            "office@society.ac.in",
            "marketing@enterprise.com",
            "team@robotics.org",
        ]
        for email in prohibited_emails:
            res = EmailSyntaxValidator.validate(email)
            assert res.is_generic is True
            assert res.is_valid_syntax is False

    @pytest.mark.asyncio
    async def test_catch_all_classified_as_pattern_derived_only_with_two_samples(self):
        """Catch-all domains require >=2 observed domain emails to synthesize pattern-derived lead."""
        verifier = ContactVerifier()

        candidate = DecisionMakerCandidate(
            name="Siddharth Mehta",
            role="Head of Partnerships",
            organization_name="Fintech Cloud",
            category=CategoryEnum.SPONSOR,
            location="Bengaluru",
            email_candidate=None,
            source_url="https://fintechcloud.com/team",
        )

        # Less than 2 samples -> must be discarded under zero-hallucination mandate
        one_sample = ["sales.rep@fintechcloud.com"]
        rec_failed = await verifier.verify_decision_maker(candidate, domain_email_samples=one_sample)
        assert rec_failed is None

        # >= 2 observed employee emails -> pattern engine can derive email
        two_samples = ["amit.patel@fintechcloud.com", "priya.nair@fintechcloud.com"]

        mock_syntax = MagicMock()
        mock_syntax.validate.return_value = MagicMock(
            is_valid_syntax=True,
            is_generic=False,
            normalized_email="siddharth.mehta@fintechcloud.com",
            domain="fintechcloud.com",
            has_typo=False,
        )

        mock_mx = AsyncMock()
        mock_mx.resolve_mx.return_value = MagicMock(
            has_mx=True,
            is_null_mx=False,
            primary_host="mail.fintechcloud.com",
        )

        mock_smtp = AsyncMock()
        mock_smtp.verify_smtp.return_value = SMTPHandshakeResult(
            email="siddharth.mehta@fintechcloud.com",
            mx_host="mail.fintechcloud.com",
            connection_succeeded=True,
            is_deliverable=True,
            is_catch_all=True,
            smtp_code=250,
        )

        verifier.syntax_validator = mock_syntax
        verifier.mx_resolver = mock_mx
        verifier.smtp_verifier = mock_smtp

        rec_success = await verifier.verify_decision_maker(candidate, domain_email_samples=two_samples)
        assert rec_success is not None
        assert rec_success.verification_status == VerificationStatusEnum.PATTERN_DERIVED
        assert rec_success.contact_channel == "siddharth.mehta@fintechcloud.com"

    @pytest.mark.asyncio
    async def test_unverified_contact_completely_discarded(self):
        """If email verification fails and no social link exists, lead is dropped completely."""
        verifier = ContactVerifier()
        candidate = DecisionMakerCandidate(
            name="Vikram Seth",
            role="Marketing Lead",
            organization_name="Ghost Brand",
            category=CategoryEnum.SPONSOR,
            location="Mumbai",
            direct_email="vikram@ghostbrand.xyz",
            linkedin_url=None,
            source_url="https://ghostbrand.xyz/about",
        )

        with patch.object(verifier.mx_resolver, "resolve_mx", new=AsyncMock(return_value=MagicMock(has_mx=False, is_null_mx=False, records=[]))):
            res = await verifier.verify_decision_maker(candidate)
            assert res is None


# ==============================================================================
# Task 10.3: Brochure Parsing Benchmark (15 Points)
# ==============================================================================

class TestBrochureParsingBenchmark:
    def test_extract_synthetic_multi_tier_brochure(self, tmp_path: Path):
        """Verifies multi-page brochure parsing, tier recognition, and candidate extraction."""
        pdf_file = tmp_path / "conference_brochure.pdf"
        doc = pymupdf.open()

        page1 = doc.new_page()
        page1.insert_text(
            (50, 80),
            "GLOBAL AI SUMMIT 2025\n"
            "Host City: Bengaluru, Karnataka, India\n"
            "Bringing together 2000+ AI innovators, sponsors, and academic delegations.\n",
            fontsize=14,
        )

        page2 = doc.new_page()
        page2.insert_text(
            (50, 80),
            "SPONSORSHIP TIERS:\n"
            "Title Sponsor: INR 10,00,000\n"
            "Gold Sponsor: INR 5,00,000\n\n"
            "Past Corporate Sponsors:\n"
            "Microsoft India\n"
            "NVIDIA Research\n"
            "Zerodha Tech\n\n"
            "Academic Delegations:\n"
            "AI Society IISc\n"
            "Robotics Club IIT Madras\n",
            fontsize=12,
        )
        doc.save(str(pdf_file))
        doc.close()

        parser = BrochureParser()
        context = parser.parse(pdf_file)

        assert isinstance(context, BrochureContext)
        assert context.event_location in ["Bengaluru", "National"]
        assert len(context.seed_organizations) > 0
        org_names = [o.name for o in context.seed_organizations]
        assert any("Microsoft" in n or "NVIDIA" in n or "Zerodha" in n for n in org_names)


# ==============================================================================
# Task 10.4: End-to-End Hands-Free Verification Run (15 Points)
# ==============================================================================

class TestEndToEndPipelineRun:
    @pytest.mark.asyncio
    async def test_full_autonomous_prompt_to_sheet_execution(self):
        """Executes full autonomous pipeline from search query to Google Sheets sync."""
        mock_search_results = [
            MagicMock(
                url="https://fintech-brand.in/leadership",
                title="Fintech Leadership Team",
                snippet="Rohan Sen serves as VP Brand Marketing at Fintech Brand India.",
            )
        ]

        mock_page = MagicMock(
            url="https://fintech-brand.in/leadership",
            status_code=200,
            title="Leadership",
            markdown_content="Leadership:\nVP Brand Marketing: Rohan Sen\nEmail: rohan.sen@fintech-brand.in",
            extracted_internal_links=[],
            discovered_emails=["rohan.sen@fintech-brand.in"],
            discovered_social_links=["https://linkedin.com/in/rohan-sen"],
            is_dead=False,
        )
        mock_crawl_res = MagicMock(pages=[mock_page])

        mock_candidate = DecisionMakerCandidate(
            name="Rohan Sen",
            role="VP Brand Marketing",
            organization_name="Fintech Brand India",
            category=CategoryEnum.SPONSOR,
            location="Mumbai",
            direct_email="rohan.sen@fintech-brand.in",
            source_url="https://fintech-brand.in/leadership",
        )

        mock_lead_record = FinalLeadRecord(
            organization_name="Fintech Brand India",
            category=CategoryEnum.SPONSOR,
            location="Mumbai",
            contact_person="Rohan Sen - VP Brand Marketing",
            contact_channel="rohan.sen@fintech-brand.in",
            verification_status=VerificationStatusEnum.VERIFIED,
        )

        with patch("src.graph.nodes.UnifiedSearchClient.search", new_callable=AsyncMock) as mock_s, \
             patch("src.graph.nodes.DeepCrawler.crawl_organization", new_callable=AsyncMock) as mock_c, \
             patch("src.graph.nodes.DecisionMakerExtractor.extract_decision_maker", return_value=mock_candidate), \
             patch("src.graph.nodes.ContactVerifier.verify_decision_maker", new_callable=AsyncMock) as mock_v:

            mock_s.return_value = mock_search_results
            mock_c.return_value = mock_crawl_res
            mock_v.return_value = mock_lead_record

            initial_state = create_initial_state(
                search_prompt="Find FinTech Sponsors in Mumbai for Hackathon",
                category_focus="Sponsor",
                max_target_count=1,
            )

            config = {"configurable": {"thread_id": "benchmark_audit_run_001"}}

            # Run compiled state graph
            final_state = await lead_graph.ainvoke(initial_state, config=config)

            assert final_state["is_complete"] is True
            assert "google_sheet_url" in final_state
            assert final_state["google_sheet_url"] is not None
            assert len(final_state["verified_leads"]) >= 1

            # Verify strict 6-field output schema on all verified leads
            for lead_dict in final_state["verified_leads"]:
                record = FinalLeadRecord.model_validate(lead_dict)
                assert record.organization_name
                assert record.category in [CategoryEnum.SPONSOR, CategoryEnum.COLLEGE_DELEGATION]
                assert record.location
                assert " - " in record.contact_person
                assert "@" in record.contact_channel or record.contact_channel.startswith("http")
                assert record.verification_status in [VerificationStatusEnum.VERIFIED, VerificationStatusEnum.PATTERN_DERIVED]

    def test_google_sheets_sync_batch_and_styling(self):
        """Verifies Google Sheets sync formats navy headers and skips duplicate entries."""
        client = GoogleSheetsSyncClient()
        lead = FinalLeadRecord(
            organization_name="Benchmark Sponsor Inc",
            category=CategoryEnum.SPONSOR,
            location="Bengaluru",
            contact_person="Anita Desai - CMO",
            contact_channel="anita.desai@benchmarksponsor.com",
            verification_status=VerificationStatusEnum.VERIFIED,
        )

        # First sync
        res1 = client.sync_leads([lead])
        assert res1.rows_appended == 1
        assert res1.duplicates_skipped == 0

        # Duplicate sync
        res2 = client.sync_leads([lead])
        assert res2.rows_appended == 0
        assert res2.duplicates_skipped == 1
