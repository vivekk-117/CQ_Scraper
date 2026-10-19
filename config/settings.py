import os
from pathlib import Path
from typing import Optional
from dotenv import load_dotenv

# Load local environment variables from .env
BASE_DIR = Path(__file__).resolve().parent.parent
load_dotenv(BASE_DIR / ".env")

# Ensure Crawl4AI uses a local workspace cache
os.environ.setdefault("CRAWL4_AI_BASE_DIRECTORY", str(BASE_DIR / ".crawl4ai"))

try:
    from pydantic_settings import BaseSettings, SettingsConfigDict
    from pydantic import Field

    class Settings(BaseSettings):
        model_config = SettingsConfigDict(env_file=".env", extra="ignore")

        # LLM Provider Configuration (auto, groq, openai, anthropic)
        llm_provider: str = Field(default="auto", alias="LLM_PROVIDER")
        llm_model: Optional[str] = Field(default=None, alias="LLM_MODEL")

        # Groq Settings
        groq_api_key: Optional[str] = Field(default=None, alias="GROQ_API_KEY")
        groq_model: str = Field(default="openai/gpt-oss-120b", alias="GROQ_MODEL")
        groq_base_url: str = Field(default="https://api.groq.com/openai/v1", alias="GROQ_BASE_URL")

        # OpenAI Settings
        openai_api_key: Optional[str] = Field(default=None, alias="OPENAI_API_KEY")
        openai_model: str = Field(default="gpt-4o", alias="OPENAI_MODEL")
        openai_base_url: Optional[str] = Field(default=None, alias="OPENAI_BASE_URL")

        # Anthropic Settings
        anthropic_api_key: Optional[str] = Field(default=None, alias="ANTHROPIC_API_KEY")
        anthropic_model: str = Field(default="claude-3-5-sonnet-20241022", alias="ANTHROPIC_MODEL")

        # Search Provider Configuration (auto, langsearch, tavily, serper)
        search_provider: str = Field(default="auto", alias="SEARCH_PROVIDER")
        langsearch_api_key: Optional[str] = Field(default=None, alias="LANGSEARCH_API_KEY")
        tavily_api_key: Optional[str] = Field(default=None, alias="TAVILY_API_KEY")
        serper_api_key: Optional[str] = Field(default=None, alias="SERPER_API_KEY")

        google_application_credentials: Optional[str] = Field(
            default="config/google_credentials.json", alias="GOOGLE_APPLICATION_CREDENTIALS"
        )
        google_spreadsheet_id: Optional[str] = Field(default=None, alias="GOOGLE_SPREADSHEET_ID")
        environment: str = Field(default="development", alias="ENVIRONMENT")
        log_level: str = Field(default="INFO", alias="LOG_LEVEL")
        crawl_timeout_seconds: float = Field(default=12.0, alias="CRAWL_TIMEOUT_SECONDS")
        max_search_results_per_query: int = Field(default=5, alias="MAX_SEARCH_RESULTS_PER_QUERY")
        max_lead_targets: int = Field(default=15, alias="MAX_LEAD_TARGETS")

    settings = Settings()

except ImportError:
    # Graceful fallback before pydantic-settings is installed
    class FallbackSettings:
        def __init__(self):
            self.llm_provider = os.getenv("LLM_PROVIDER", "auto")
            self.llm_model = os.getenv("LLM_MODEL")
            self.groq_api_key = os.getenv("GROQ_API_KEY")
            self.groq_model = os.getenv("GROQ_MODEL", "openai/gpt-oss-120b")
            self.groq_base_url = os.getenv("GROQ_BASE_URL", "https://api.groq.com/openai/v1")
            self.openai_api_key = os.getenv("OPENAI_API_KEY")
            self.openai_model = os.getenv("OPENAI_MODEL", "gpt-4o")
            self.openai_base_url = os.getenv("OPENAI_BASE_URL")
            self.anthropic_api_key = os.getenv("ANTHROPIC_API_KEY")
            self.anthropic_model = os.getenv("ANTHROPIC_MODEL", "claude-3-5-sonnet-20241022")
            self.search_provider = os.getenv("SEARCH_PROVIDER", "auto")
            self.langsearch_api_key = os.getenv("LANGSEARCH_API_KEY")
            self.tavily_api_key = os.getenv("TAVILY_API_KEY")
            self.serper_api_key = os.getenv("SERPER_API_KEY")
            self.google_application_credentials = os.getenv(
                "GOOGLE_APPLICATION_CREDENTIALS", "config/google_credentials.json"
            )
            self.google_spreadsheet_id = os.getenv("GOOGLE_SPREADSHEET_ID")
            self.environment = os.getenv("ENVIRONMENT", "development")
            self.log_level = os.getenv("LOG_LEVEL", "INFO")
            self.crawl_timeout_seconds = float(os.getenv("CRAWL_TIMEOUT_SECONDS", "12.0"))
            self.max_search_results_per_query = int(os.getenv("MAX_SEARCH_RESULTS_PER_QUERY", "5"))
            self.max_lead_targets = int(os.getenv("MAX_LEAD_TARGETS", "15"))

    settings = FallbackSettings()

