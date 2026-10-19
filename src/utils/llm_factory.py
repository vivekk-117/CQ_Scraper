"""Unified LLM Provider Factory.

Supports dynamic selection of LLM providers (Groq, OpenAI, Anthropic, or Auto)
and custom models directly via environment variables (.env).
"""

from __future__ import annotations

import os
from typing import Any, Optional
from loguru import logger

from config.settings import settings


def _is_valid_key(key: Optional[str]) -> bool:
    """Checks whether an API key is present and not a template placeholder."""
    return bool(key and not key.startswith("your_") and len(key.strip()) > 8)


def get_active_provider() -> str:
    """Resolves the active LLM provider based on settings.llm_provider and available keys."""
    req_provider = (settings.llm_provider or "auto").strip().lower()

    if req_provider == "groq" and _is_valid_key(settings.groq_api_key):
        return "groq"
    if req_provider == "openai" and _is_valid_key(settings.openai_api_key):
        return "openai"
    if req_provider == "anthropic" and _is_valid_key(settings.anthropic_api_key):
        return "anthropic"

    # Auto mode: prioritize configured keys (groq -> openai -> anthropic)
    if _is_valid_key(settings.groq_api_key):
        return "groq"
    if _is_valid_key(settings.openai_api_key):
        return "openai"
    if _is_valid_key(settings.anthropic_api_key):
        return "anthropic"

    return "none"


def is_llm_configured() -> bool:
    """Returns True if any supported LLM provider API key is present and valid."""
    return get_active_provider() != "none"


def is_groq() -> bool:
    """Returns True if Groq is the currently active provider."""
    return get_active_provider() == "groq"


def get_llm(temperature: float = 0.0, max_retries: int = 2):
    """Initializes and returns a LangChain Chat Model based on .env configuration.

    The provider can be chosen via LLM_PROVIDER (auto, groq, openai, anthropic).
    The model name can be customized via LLM_MODEL, GROQ_MODEL, OPENAI_MODEL, or ANTHROPIC_MODEL.
    """
    provider = get_active_provider()

    # 1. Groq Provider
    if provider == "groq":
        from langchain_openai import ChatOpenAI

        # Strictly respect user configuration from LLM_MODEL or GROQ_MODEL
        model_name = settings.llm_model or settings.groq_model or "openai/gpt-oss-120b"
        base_url = settings.groq_base_url or "https://api.groq.com/openai/v1"

        logger.debug(f"Initializing Groq LLM [model: '{model_name}', base_url: '{base_url}']")
        return ChatOpenAI(
            model=model_name,
            temperature=temperature,
            api_key=settings.groq_api_key,
            base_url=base_url,
            max_retries=max_retries,
            timeout=30.0,
        )

    # 2. OpenAI Provider
    if provider == "openai":
        from langchain_openai import ChatOpenAI

        model_name = settings.llm_model or settings.openai_model or "gpt-4o"
        kwargs: dict[str, Any] = {
            "model": model_name,
            "temperature": temperature,
            "api_key": settings.openai_api_key,
            "max_retries": max_retries,
            "timeout": 30.0,
        }
        if settings.openai_base_url:
            kwargs["base_url"] = settings.openai_base_url

        logger.debug(f"Initializing OpenAI LLM [model: '{model_name}']")
        return ChatOpenAI(**kwargs)

    # 3. Anthropic Provider
    if provider == "anthropic":
        from langchain_anthropic import ChatAnthropic

        model_name = settings.llm_model or settings.anthropic_model or "claude-3-5-sonnet-20241022"
        logger.debug(f"Initializing Anthropic LLM [model: '{model_name}']")
        return ChatAnthropic(
            model=model_name,
            temperature=temperature,
            api_key=settings.anthropic_api_key,
            max_retries=max_retries,
            timeout=30.0,
        )

    raise ValueError(
        f"No valid LLM credentials available for provider '{settings.llm_provider}'. "
        "Please configure GROQ_API_KEY, OPENAI_API_KEY, or ANTHROPIC_API_KEY in your .env file."
    )
