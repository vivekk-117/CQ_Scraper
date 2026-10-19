"""Unit tests for Unified LLM Provider Factory (Groq / OpenAI)."""

import pytest
from unittest.mock import patch

from config.settings import settings
from src.utils.llm_factory import get_llm, is_groq, is_llm_configured


class TestLLMFactory:
    def test_no_keys_configured(self):
        """When no valid keys are set, is_llm_configured should be False and get_llm should raise."""
        with patch.object(settings, "groq_api_key", None), \
             patch.object(settings, "openai_api_key", None):
            assert is_llm_configured() is False
            assert is_groq() is False
            with pytest.raises(ValueError, match="No valid LLM API key configured"):
                get_llm()

    def test_groq_prioritized_when_available(self):
        """When GROQ_API_KEY is present, get_llm should configure ChatOpenAI with Groq base_url."""
        with patch.object(settings, "groq_api_key", "gsk_valid_mock_groq_key_123456789"), \
             patch.object(settings, "groq_model", "llama-3.3-70b-versatile"), \
             patch.object(settings, "openai_api_key", None):
            assert is_llm_configured() is True
            assert is_groq() is True

            llm = get_llm(temperature=0.2)
            assert str(llm.openai_api_base).rstrip("/") == "https://api.groq.com/openai/v1"
            assert llm.model_name == "llama-3.3-70b-versatile"
            assert llm.temperature == 0.2

    def test_openai_fallback_when_groq_absent(self):
        """When only OPENAI_API_KEY is present, get_llm should configure standard OpenAI."""
        with patch.object(settings, "groq_api_key", None), \
             patch.object(settings, "openai_api_key", "sk-valid-mock-openai-key-123456789"):
            assert is_llm_configured() is True
            assert is_groq() is False

            llm = get_llm()
            assert llm.model_name == "gpt-4o"
            # OpenAI default base_url should not be Groq
            assert llm.openai_api_base is None or "groq.com" not in str(llm.openai_api_base)
