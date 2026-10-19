"""Unit tests for Unified LLM Provider Factory (Groq / OpenAI / Anthropic)."""

import pytest
from unittest.mock import patch

from config.settings import settings
from src.utils.llm_factory import get_llm, is_groq, is_llm_configured


class TestLLMFactory:
    def test_no_keys_configured(self):
        """When no valid keys are set, is_llm_configured should be False and get_llm should raise."""
        with patch.object(settings, "groq_api_key", None), \
             patch.object(settings, "openai_api_key", None), \
             patch.object(settings, "anthropic_api_key", None):
            assert is_llm_configured() is False
            assert is_groq() is False
            with pytest.raises(ValueError, match="No valid LLM credentials available"):
                get_llm()

    def test_groq_prioritized_in_auto_mode(self):
        """In auto mode, when GROQ_API_KEY is present, get_llm should configure ChatOpenAI with Groq base_url."""
        with patch.object(settings, "llm_provider", "auto"), \
             patch.object(settings, "groq_api_key", "gsk_valid_mock_groq_key_123456789"), \
             patch.object(settings, "groq_model", "openai/gpt-oss-120b"), \
             patch.object(settings, "openai_api_key", None):
            assert is_llm_configured() is True
            assert is_groq() is True

            llm = get_llm(temperature=0.2)
            assert str(llm.openai_api_base).rstrip("/") == "https://api.groq.com/openai/v1"
            assert llm.model_name == "openai/gpt-oss-120b"
            assert llm.temperature == 0.2

    def test_groq_custom_model_strictly_respected(self):
        """Custom models specified in .env should be used directly without hardcoded overrides."""
        with patch.object(settings, "llm_provider", "groq"), \
             patch.object(settings, "groq_api_key", "gsk_valid_mock_groq_key_123456789"), \
             patch.object(settings, "llm_model", "custom-model-id-999"):
            llm = get_llm()
            assert llm.model_name == "custom-model-id-999"

    def test_explicit_provider_selection_overrides_priority(self):
        """When LLM_PROVIDER is set to openai, it must select OpenAI even if Groq key exists."""
        with patch.object(settings, "llm_provider", "openai"), \
             patch.object(settings, "groq_api_key", "gsk_valid_mock_groq_key_123456789"), \
             patch.object(settings, "openai_api_key", "sk-valid-mock-openai-key-123456789"):
            assert is_groq() is False

            llm = get_llm()
            assert llm.model_name == "gpt-4o"
            assert llm.openai_api_base is None or "groq.com" not in str(llm.openai_api_base)
