import re
import asyncio
import os
from playwright.async_api import async_playwright, TimeoutError as PlaywrightTimeoutError
from playwright_stealth import stealth_async
from core.logger import get_logger
from core.settings import settings
from services.document_service import ingest_document

logger = get_logger("ScraperService")

def _is_docker_environment():
    """Detect if running in Docker container."""
    return os.path.exists("/.dockerenv") or os.path.exists("/proc/self/cgroup")

def _get_browser_args():
    """Get browser launch arguments optimized for the environment."""
    base_args = [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-gpu",
        "--disable-software-rasterizer",
        "--disable-background-networking",
        "--disable-background-timer-throttling",
        "--disable-renderer-backgrounding",
        "--disable-backgrounding-occluded-windows",
        "--disable-ipc-flooding-protection",
        "--disable-extensions",
        "--disable-default-apps",
        "--disable-sync",
        "--metrics-recording-only",
        "--mute-audio",
        "--no-first-run",
        "--disable-features=TranslateUI",
        "--disable-ipc-flooding-protection",
    ]
    
    # Only use --single-process in non-Docker environments (causes issues in Docker Desktop)
    if not _is_docker_environment():
        base_args.append("--single-process")
    else:
        # Docker-specific optimizations
        base_args.extend([
            "--disable-software-rasterizer",
            "--disable-background-networking",
            "--disable-background-timer-throttling",
        ])
    
    return base_args

async def _scrape_web_internal(url: str, conversation_id: int = 0) -> str:
    """
    Internal scraper function - wrapped with timeout in main function.
    Optimized for Docker environments.
    """
    ua = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    
    timeout_seconds = min(settings.SCRAPER_TIMEOUT, 30)
    timeout_ms = timeout_seconds * 1000
    
    # Verify Playwright browser path in Docker
    if _is_docker_environment():
        browser_path = os.environ.get("PLAYWRIGHT_BROWSERS_PATH", "/ms-playwright")
        if not os.path.exists(browser_path):
            logger.warning(f"⚠️ Playwright browser path not found: {browser_path}")
    
    playwright_manager = None
    browser = None
    
    # Wrap Playwright initialization in timeout to prevent hangs
    try:
        logger.info("🔄 Initializing Playwright...")
        playwright_manager = async_playwright()
        p = await asyncio.wait_for(playwright_manager.__aenter__(), timeout=10.0)
        logger.info("✅ Playwright initialized")
    except asyncio.TimeoutError:
        logger.error("❌ Playwright initialization timed out (10s)")
        return "Error: Browser initialization timed out. Playwright may not be properly configured in this environment."
    except Exception as e:
        logger.error(f"❌ Playwright initialization failed: {str(e)}")
        return f"Error: Failed to initialize browser - {str(e)}"
    
    try:
        # Wrap browser launch in timeout to prevent hangs
        browser_args = _get_browser_args()
        logger.info(f"🚀 Launching browser with {len(browser_args)} args (Docker: {_is_docker_environment()})")
        
        try:
            browser = await asyncio.wait_for(
                p.chromium.launch(
                    headless=True,
                    args=browser_args,
                    timeout=20000,  # 20 second browser launch timeout
                ),
                timeout=20.0  # Aggressive timeout for browser launch
            )
            logger.info("✅ Browser launched successfully")
        except asyncio.TimeoutError:
            logger.error("❌ Browser launch timed out (20s)")
            if playwright_manager:
                try:
                    await playwright_manager.__aexit__(None, None, None)
                except:
                    pass
            return "Error: Browser launch timed out. The environment may not have sufficient resources."
        except Exception as e:
            logger.error(f"❌ Browser launch failed: {str(e)}")
            if playwright_manager:
                try:
                    await playwright_manager.__aexit__(None, None, None)
                except:
                    pass
            return f"Error: Browser launch failed - {str(e)}"
        
        try:
            logger.info(f"🔄 Creating browser context for {url}")
            context = await asyncio.wait_for(
                browser.new_context(
                    user_agent=ua,
                    viewport={"width": 1920, "height": 1080},
                    ignore_https_errors=True,
                ),
                timeout=5.0
            )
            context.set_default_timeout(timeout_ms)
            
            try:
                logger.info(f"🔄 Creating new page")
                page = await asyncio.wait_for(context.new_page(), timeout=5.0)
                page.set_default_timeout(timeout_ms)
                
                # Wrap stealth_async in timeout - this can hang
                try:
                    await asyncio.wait_for(stealth_async(page), timeout=3.0)
                    logger.info("✅ Stealth mode enabled")
                except asyncio.TimeoutError:
                    logger.warning("⚠️ stealth_async timed out, continuing without stealth")
                except Exception as e:
                    logger.warning(f"⚠️ stealth_async failed: {str(e)}, continuing without stealth")
                
                logger.info(f"🚀 Scraping: {url} (timeout: {timeout_seconds}s)")
                
                # Try domcontentloaded first (faster)
                try:
                    await asyncio.wait_for(
                        page.goto(url, wait_until="domcontentloaded", timeout=timeout_ms),
                        timeout=timeout_seconds
                    )
                    logger.info("✅ Page loaded (domcontentloaded)")
                except (PlaywrightTimeoutError, asyncio.TimeoutError):
                    logger.warning(f"⏱️ domcontentloaded timeout, trying commit strategy for {url}")
                    try:
                        await asyncio.wait_for(
                            page.goto(url, wait_until="commit", timeout=15000),
                            timeout=15.0
                        )
                        logger.info("✅ Page loaded (commit)")
                    except (PlaywrightTimeoutError, asyncio.TimeoutError):
                        logger.error(f"❌ Both navigation strategies failed for {url}")
                        return f"Error: Page navigation timed out after {timeout_seconds} seconds. The site may be blocking automated access or is too slow."
                
                # Wait a bit for dynamic content (with timeout)
                try:
                    await asyncio.wait_for(asyncio.sleep(1), timeout=2.0)
                    await asyncio.wait_for(page.mouse.wheel(0, 500), timeout=2.0)
                    await asyncio.wait_for(asyncio.sleep(1), timeout=2.0)
                except asyncio.TimeoutError:
                    logger.warning("⚠️ Content wait timed out, proceeding anyway")
                
                # Get text with timeout
                try:
                    raw_text = await asyncio.wait_for(
                        page.inner_text("body"),
                        timeout=10.0
                    )
                    clean_text = re.sub(r'\n\s*\n', '\n', raw_text).strip()
                except asyncio.TimeoutError:
                    logger.error("❌ Text extraction timed out")
                    return f"Error: Text extraction timed out for {url}"
                
                if len(clean_text) < 100:
                    logger.warning(f"⚠️ Very little content extracted from {url} ({len(clean_text)} chars)")
                    return f"Error: Page loaded but very little content extracted ({len(clean_text)} chars). Site may be blocking automated access."
                
                # Run ingestion in background - don't block scraping
                # This prevents freezing when HuggingFace API is slow or warming up
                async def _ingest_async():
                    try:
                        await asyncio.to_thread(
                            ingest_document, 
                            f"Scrape: {url}", 
                            clean_text[:5000], 
                            conversation_id
                        )
                        logger.info(f"✅ Background ingestion completed for {url}")
                    except Exception as e:
                        logger.error(f"⚠️ Background ingestion failed for {url}: {str(e)}")
                
                # Start ingestion in background without waiting
                asyncio.create_task(_ingest_async())
                
                logger.info(f"✅ Successfully scraped {url} ({len(clean_text)} chars)")
                return clean_text
                
            finally:
                try:
                    await asyncio.wait_for(context.close(), timeout=5.0)
                except:
                    pass
        except PlaywrightTimeoutError as e:
            logger.error(f"❌ Playwright timeout: {str(e)}")
            return f"Error: Request timed out after {timeout_seconds} seconds. The site may be blocking automated access."
        except asyncio.TimeoutError as e:
            logger.error(f"❌ Operation timeout: {str(e)}")
            return f"Error: Operation timed out. The site may be blocking automated access or is too slow."
        except Exception as e:
            error_msg = str(e)
            logger.error(f"❌ Scrape failed: {error_msg}")
            return f"Error: {error_msg}"
        finally:
            if browser:
                try:
                    await asyncio.wait_for(browser.close(), timeout=5.0)
                    logger.info("✅ Browser closed")
                except:
                    logger.warning("⚠️ Browser close timed out or failed")
                    pass
    finally:
        if playwright_manager:
            try:
                await asyncio.wait_for(playwright_manager.__aexit__(None, None, None), timeout=5.0)
                logger.info("✅ Playwright manager closed")
            except:
                logger.warning("⚠️ Playwright manager close timed out or failed")
                pass

async def scrape_web(url: str, conversation_id: int = 0) -> str:
    """
    Async Scraper with top-level timeout wrapper to prevent infinite hangs.
    This ensures the function ALWAYS returns within the timeout period.
    """
    timeout_seconds = min(settings.SCRAPER_TIMEOUT, 30)
    
    try:
        # Wrap entire operation in timeout - this is the key fix
        result = await asyncio.wait_for(
            _scrape_web_internal(url, conversation_id),
            timeout=timeout_seconds
        )
        return result
    except asyncio.TimeoutError:
        logger.error(f"❌ Scrape operation timed out after {timeout_seconds}s: {url}")
        return f"Error: Scrape operation timed out after {timeout_seconds} seconds. The site may be blocking automated access or is too slow."
    except Exception as e:
        logger.error(f"❌ Unexpected error in scrape_web: {str(e)}")
        return f"Error: {str(e)}"
