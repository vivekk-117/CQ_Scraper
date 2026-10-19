import asyncio
import sys
from pathlib import Path

ROOT_DIR = Path(__file__).resolve().parent.parent
if str(ROOT_DIR) not in sys.path:
    sys.path.insert(0, str(ROOT_DIR))

from loguru import logger

from config.settings import settings
from src.search.search_client import UnifiedSearchClient
from src.utils.llm_factory import get_llm, is_groq, is_llm_configured


async def verify_langsearch():
    print("\n🔍 Testing LangSearch API...")
    if not settings.langsearch_api_key or settings.langsearch_api_key.startswith("your_"):
        print("❌ LANGSEARCH_API_KEY is missing or contains placeholder in .env")
        return False

    client = UnifiedSearchClient()
    try:
        results = await client._search_langsearch("IIT Kharagpur annual fest sponsors", max_results=2)
        if results:
            print(f"✅ LangSearch connected successfully! Retrieved {len(results)} live results:")
            for i, r in enumerate(results, 1):
                print(f"   [{i}] {r.title[:60]} -> {r.url}")
            return True
        else:
            print("⚠️ LangSearch returned 0 results. Check query or quota.")
            return False
    except Exception as e:
        print(f"❌ LangSearch error: {e}")
        return False


def verify_groq():
    print("\n🤖 Testing Groq LLM API...")
    if not settings.groq_api_key or settings.groq_api_key.startswith("your_"):
        print("❌ GROQ_API_KEY is missing or contains placeholder in .env")
        return False

    try:
        llm = get_llm(temperature=0.0)
        print(f"   Provider: {'Groq' if is_groq() else 'OpenAI'} | Model: {settings.groq_model}")
        resp = llm.invoke("Reply with exactly: 'Groq connected successfully!'")
        print(f"✅ Groq response: {resp.content.strip()}")
        return True
    except Exception as e:
        print(f"❌ Groq error: {e}")
        return False


async def main():
    print("=" * 60)
    print(" CQ Scraper: API Key Verification Utility")
    print("=" * 60)

    ls_ok = await verify_langsearch()
    grq_ok = verify_groq()

    print("\n" + "=" * 60)
    if ls_ok and grq_ok:
        print("🎉 Both Groq and LangSearch are fully configured and functional!")
        print("You can now run:")
        print("  python main.py --prompt \"Your search brief here\"")
        print("or start the dashboard:")
        print("  uvicorn src.api.app:app --host 0.0.0.0 --port 8000 --reload")
    else:
        print("⚠️ Some keys are not configured or failed. Please check your .env file.")
    print("=" * 60)


if __name__ == "__main__":
    asyncio.run(main())
