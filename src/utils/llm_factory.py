"""Unified LLM Provider Factory.

Supports Groq (Llama-3.3-70b-versatile) and OpenAI (GPT-4o) with prioritized
zero-cost Groq acceleration and structured output compatibility.
"""

from __future__ import annotations

import os
from typing import Any, Optional
from loguru import logger

from config.settings import settings


def _is_valid_key(key: Optional[str]) -> bool:
    """Checks whether an API key is present and not a template placeholder."""
    return bool(key and not key.startswith("your_") and len(key.strip()) > 8)


def is_llm_configured() -> bool:
    """Returns True if any supported LLM provider API key is present and valid."""
    if _is_valid_key(settings.groq_api_key):
        return True
    if _is_valid_key(settings.openai_api_key):
        return True
    return False


def is_groq() -> bool:
    """Returns True if Groq is the prioritized active provider."""
    return _is_valid_key(settings.groq_api_key)


def get_llm(temperature: float = 0.0, max_retries: int = 2):
    """Initializes and returns a LangChain Chat Model.

    Prioritizes Groq when GROQ_API_KEY is configured, otherwise falls back to OpenAI.
    """
    from langchain_openai import ChatOpenAI

    # 1. Prioritize Groq (Blazing fast, zero-cost free tier, tool calling support)
    if _is_valid_key(settings.groq_api_key):
        model_name = settings.groq_model or "llama-3.3-70b-versatile"
        logger.debug(f"Initializing Groq LLM with model: '{model_name}'")
        return ChatOpenAI(
            model=model_name,
            temperature=temperature,
            api_key=settings.groq_api_key,
            base_url="https://api.groq.com/openai/v1",
            max_retries=max_retries,
            timeout=30.0,
        )

    # 2. OpenAI Fallback
    if _is_valid_key(settings.openai_api_key):
        logger.debug("Initializing OpenAI LLM with model: 'gpt-4o'")
        return ChatOpenAI(
            model="gpt-4o",
            temperature=temperature,
            api_key=settings.openai_api_key,
            max_retries=max_retries,
            timeout=30.0,
        )

    raise ValueError(
        "No valid LLM API key configured. Please set GROQ_API_KEY or OPENAI_API_KEY in your .env file."
    )

