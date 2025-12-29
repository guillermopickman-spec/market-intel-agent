import time
from typing import Optional
from playwright.sync_api import sync_playwright
from services.document_service import ingest_document

def scrape_and_ingest(url: str, conversation_id: Optional[int] = None):
    """
    Sequential execution to survive 512MB RAM:
    1. Open Browser -> Extract Text -> Close Browser (RAM Freed)
    2. Load AI Model -> Ingest to RAG (RAM Allocated)
    """
    scraped_text = ""
    page_title = "Unknown"

    # --- PHASE 1: SCRAPING (Memory Intensive) ---
    with sync_playwright() as p:
        browser = p.chromium.launch(
            headless=True,
            args=[
                "--no-sandbox", 
                "--disable-dev-shm-usage", 
                "--disable-gpu",
                "--single-process",
                "--no-zygote"
            ]
        )
        context = browser.new_context(
            user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36"
        )
        page = context.new_page()
        
        # Block heavy assets to keep memory footprint tiny
        page.route("**/*.{png,jpg,jpeg,gif,svg,css,woff,pdf}", lambda route: route.abort())
        
        try:
            print(f"🕵️ Robot visiting: {url}")
            # Use 'domcontentloaded' for balance between speed and content
            page.goto(url, wait_until="domcontentloaded", timeout=45000)
            time.sleep(1) # Brief pause for JS execution
            
            page_title = page.title()
            elements = page.query_selector_all("h1, h2, h3, p")
            scraped_text = "\n".join([el.inner_text().strip() for el in elements if len(el.inner_text().strip()) > 20])

        except Exception as e:
            print(f"❌ Scraper Error: {str(e)}")
            return f"Scraping failed: {str(e)}"
        finally:
            # IMPORTANT: We close the browser BEFORE moving to ingestion
            page.close()
            context.close()
            browser.close()

    # --- PHASE 2: INGESTION (AI Model RAM usage begins here) ---
    if not scraped_text or len(scraped_text) < 100:
        return "Error: The website did not return enough readable content."

    try:
        print(f"🧠 Browser closed. Starting RAG ingestion for: {page_title}")
        ingest_document(
            title=f"Web: {page_title}", 
            content=scraped_text, 
            conversation_id=conversation_id
        )
        
        return (
            f"Web Title: {page_title}\n"
            f"Content Snippet: {scraped_text[:1000]}...\n"
            f"Status: Scraper RAM released and data successfully saved to RAG."
        )
    except Exception as e:
        print(f"❌ Ingestion Error: {str(e)}")
        return f"Scraping succeeded but RAG ingestion failed: {str(e)}"