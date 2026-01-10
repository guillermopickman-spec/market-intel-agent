import json
import re
import asyncio
import time
import os
import concurrent.futures
from typing import Optional, Dict, Any, List
from sqlalchemy.orm import Session
from datetime import datetime

from core.logger import get_logger
from core.settings import settings
from core.prompts import CLOUD_AGENT_PROMPT, REPORT_SYNTHESIS_PROMPT
from core.validators import validate_url
from services.llm.factory import LLMFactory

from services.scraper_service import scrape_web 
from services.notion_service import NotionService
from services.email_service import EmailService
from services.search_service import SearchService
from services.document_service import ingest_document 
import models 

logger = get_logger("AgentService")

class AgentService:
    def __init__(self, db: Optional[Session] = None):
        try:
            self.llm = LLMFactory.get_client()
            self.db = db
            self.notion = NotionService()
            self.email = EmailService()
            self.search_tool = SearchService()
            self.current_intel = "" 
            logger.info("🤖 MIA Agent Service v0.2.1 initialized (Gemini Optimized).")
        except Exception as e:
            logger.critical(f"🛑 Failed to initialize AgentService: {str(e)}")
            raise

    async def identify_intent(self, user_input: str) -> str:
        """
        REQUIRED BY ROUTER: Quickly identifies the goal of the user query.
        This prevents the 500 error on the /analyze endpoint.
        """
        logger.info(f"🧠 Identifying intent for: {user_input[:30]}...")
        prompt = f"Identify the core intent of this market intelligence query in 3 words: {user_input}"
        try:
            loop = asyncio.get_running_loop()
            return await loop.run_in_executor(None, self.llm.generate, prompt)
        except Exception as e:
            logger.error(f"Intent Identification Error: {e}")
            return "General Intelligence Gathering"

    async def generate_plan(self, user_input: str) -> List[Dict[str, Any]]:
        """Creates a structured execution plan using Gemini."""
        logger.info(f"📋 Generating execution plan for: '{user_input[:50]}...'")
        prompt = CLOUD_AGENT_PROMPT.format(user_input=user_input)
        
        loop = asyncio.get_running_loop()
        raw_response = await loop.run_in_executor(None, self.llm.generate, prompt)
        match = re.search(r"(\[.*\])", raw_response, re.DOTALL)
        
        if not match:
            logger.error("❌ Gemini failed to return a valid JSON plan array.")
            return []

        try:
            plan = json.loads(match.group(1))
            logger.info(f"✅ Plan generated with {len(plan)} steps.")
            return plan
        except json.JSONDecodeError:
            logger.error("❌ Critical JSON Parse Error in Agent Plan.")
            return []

    def _integrity_check(self, content: str) -> str:
        """Professional safeguard against hallucinated or empty data."""
        forbidden = ["placeholder", "insert here", "no data found", "error"]
        if not content or len(str(content)) < 50 or any(p in str(content).lower() for p in forbidden):
            logger.warning("⚠️ Data integrity check failed.")
            return self.current_intel if self.current_intel else "Mission failed: No meaningful data gathered."
        return content

    def _extract_price_data(self, text: str) -> bool:
        """
        Detects if price information exists in the given text.
        Returns True if price data is likely present, False otherwise.
        """
        if not text or len(text) < 20:
            return False
        
        text_lower = text.lower()
        
        # Check for currency symbols and price patterns
        price_indicators = [
            r'\$[\d,]+',  # Dollar amounts like $1,000
            r'€[\d,]+',  # Euro amounts
            r'£[\d,]+',  # Pound amounts
            r'[\d,]+\.?\d*\s*(usd|eur|gbp|dollars?|euros?|pounds?)',  # Currency words
            r'price[:\s]+[\$€£]?[\d,]+',  # "Price: $1000"
            r'cost[:\s]+[\$€£]?[\d,]+',  # "Cost: $1000"
            r'msrp[:\s]+[\$€£]?[\d,]+',  # "MSRP: $1000"
            r'retail[:\s]+[\$€£]?[\d,]+',  # "Retail: $1000"
            r'[\d,]+[\$€£]',  # Amounts with currency at end
        ]
        
        import re
        for pattern in price_indicators:
            if re.search(pattern, text_lower, re.IGNORECASE):
                return True
        
        # Check for negative indicators that suggest no price was found
        negative_indicators = [
            "no price found",
            "price not available",
            "pricing unavailable",
            "no confirmed pricing",
            "price information not found",
            "no pricing data",
        ]
        
        for indicator in negative_indicators:
            if indicator in text_lower:
                return False
        
        # If text contains price-related keywords but no actual prices, return False
        price_keywords = ["price", "cost", "pricing", "msrp", "retail"]
        has_keywords = any(keyword in text_lower for keyword in price_keywords)
        
        if has_keywords:
            # Check if there are actual numbers that could be prices
            numbers = re.findall(r'[\d,]+\.?\d*', text)
            if numbers:
                # Check if any number is in a reasonable price range (>= 10)
                for num_str in numbers:
                    try:
                        num = float(num_str.replace(',', ''))
                        if num >= 10:  # Reasonable minimum for product prices
                            return True
                    except ValueError:
                        continue
        
        return False

    def _extract_price_summary(self, intel_pool: str) -> str:
        """
        Extracts only price information from intel_pool and creates a compact summary format.
        Format: "Product: Price | Source"
        """
        if not intel_pool:
            return intel_pool
        
        import re
        price_entries = []
        seen_prices = set()  # Deduplicate by product+price
        
        # Split into sections
        sections = intel_pool.split("\n---\n")
        
        # Price patterns to extract
        price_patterns = [
            (r'(\$[\d,]+(?:\.\d+)?)', '$'),  # Dollar amounts
            (r'(€[\d,]+(?:\.\d+)?)', '€'),   # Euro amounts
            (r'(£[\d,]+(?:\.\d+)?)', '£'),   # Pound amounts
        ]
        
        # Product names to look for
        product_keywords = ['h100', 'h200', 'mi300', 'blackwell', 'rubin', 'nvidia', 'amd', 'gpu']
        
        for section in sections:
            section_lower = section.lower()
            
            # Extract product name from section
            product_name = None
            for keyword in product_keywords:
                if keyword in section_lower:
                    # Try to find full product name (e.g., "NVIDIA H100")
                    match = re.search(rf'(\w+\s+)?{keyword}(\s+\w+)?', section, re.IGNORECASE)
                    if match:
                        product_name = match.group(0).strip()
                        break
            
            if not product_name:
                # Try to extract from title or first line
                lines = section.split('\n')
                if lines:
                    first_line = lines[0]
                    for keyword in product_keywords:
                        if keyword in first_line.lower():
                            product_name = first_line.split(':')[0].strip()[:50]  # Limit length
                            break
            
            # Extract prices from section
            for pattern, currency in price_patterns:
                matches = re.finditer(pattern, section, re.IGNORECASE)
                for match in matches:
                    price = match.group(1)
                    
                    # Extract source URL if available
                    source_match = re.search(r'\(Source:\s*([^)]+)\)', section)
                    source = source_match.group(1) if source_match else "Unknown"
                    
                    # Create compact entry
                    if product_name:
                        entry = f"{product_name}: {price} | {source}"
                    else:
                        entry = f"Product: {price} | {source}"
                    
                    # Deduplicate
                    entry_key = f"{product_name or 'Unknown'}:{price}"
                    if entry_key not in seen_prices:
                        seen_prices.add(entry_key)
                        price_entries.append(entry)
        
        if price_entries:
            result = "\n".join(price_entries)
            logger.info(f"💰 Extracted {len(price_entries)} unique price entries from intel pool")
            return result
        else:
            # If no prices found, return original but truncated using calculated max
            max_chars = self._calculate_max_intel_pool_size()
            return intel_pool[:max_chars] if len(intel_pool) > max_chars else intel_pool

    def _calculate_max_intel_pool_size(self) -> int:
        """
        Calculate the maximum allowed intel_pool size based on Groq API payload limits.
        Accounts for prompt template, system message, JSON overhead, and safety margin.
        """
        # Groq API payload limit: 28KB (28000 bytes) - conservative limit
        MAX_PAYLOAD_BYTES = 28000
        
        # Calculate base payload size (without intel_pool)
        # This includes: system message, prompt template, model, temperature, max_tokens, JSON structure
        import json
        from core.prompts import REPORT_SYNTHESIS_PROMPT
        
        # Template size without intel_pool
        template_without_intel = REPORT_SYNTHESIS_PROMPT.format(intel_pool="")
        template_bytes = len(template_without_intel.encode('utf-8'))
        
        # System message
        system_message = "You are a professional market analyst. Output in Markdown."
        system_bytes = len(system_message.encode('utf-8'))
        
        # Simulate the payload structure to calculate JSON overhead
        # This includes all the JSON structure: brackets, quotes, field names, etc.
        test_intel = ""  # Empty intel for measurement
        test_prompt = REPORT_SYNTHESIS_PROMPT.format(intel_pool=test_intel)
        # Get actual model name from settings to calculate accurate payload size
        from core.settings import settings
        model_name = getattr(settings, 'GROQ_MODEL_NAME', 'llama-3.1-8b-instant')
        test_payload = {
            "model": model_name,
            "messages": [
                {"role": "system", "content": system_message},
                {"role": "user", "content": test_prompt}
            ],
            "temperature": 0.1,
            "max_tokens": 2048
        }
        base_payload_bytes = len(json.dumps(test_payload).encode('utf-8'))
        
        # Calculate available space for intel_pool
        # Account for: intel_pool growth in prompt + JSON overhead for that growth
        # Each char in intel_pool becomes ~1 byte when UTF-8 encoded
        # But when placed in JSON, it adds overhead (quotes, structure, etc.)
        # Estimate: intel_pool_size * 1.1 for JSON overhead (conservative)
        safety_margin = 2000  # 2KB safety margin
        available_bytes = MAX_PAYLOAD_BYTES - base_payload_bytes - safety_margin
        
        # Convert bytes to characters (UTF-8: most chars are 1 byte, but account for safety)
        # Use 0.9 multiplier to be conservative (account for multi-byte UTF-8 chars)
        max_chars = int(available_bytes * 0.9)
        
        # Cap at 8000 chars to be extra safe (was 12000, which was too high)
        max_chars = min(max_chars, 8000)
        
        logger.info(f"📊 Calculated max intel_pool size: {max_chars} chars (payload base: {base_payload_bytes} bytes, available: {available_bytes} bytes)")
        
        # #region agent log
        try:
            os.makedirs('.cursor', exist_ok=True)
            with open('.cursor/debug.log', 'a', encoding='utf-8') as f:
                f.write(json.dumps({"sessionId": "debug-session", "runId": "run1", "hypothesisId": "G", "location": "agent_service.py:221", "message": "Max intel_pool size calculation", "data": {"max_chars": max_chars, "base_payload_bytes": base_payload_bytes, "available_bytes": available_bytes, "template_bytes": template_bytes, "system_bytes": system_bytes}, "timestamp": int(time.time() * 1000)}) + "\n")
        except Exception:
            pass  # Silently fail if debug logging isn't available
        # #endregion
        
        return max_chars

    def _truncate_intel_pool(self, intel_pool: str, max_chars: Optional[int] = None) -> str:
        """
        Intelligently truncates the intel_pool to stay within API payload limits
        while preserving critical information like prices and product data.
        """
        if not intel_pool:
            return intel_pool
        
        # If max_chars not provided, calculate dynamically
        if max_chars is None:
            max_chars = self._calculate_max_intel_pool_size()
        else:
            max_chars = int(max_chars)  # Ensure it's an int
        
        original_size = len(intel_pool)
        
        # If already under limit, return as-is
        if original_size <= max_chars:
            logger.info(f"📊 Intel pool size: {original_size} chars (within limit of {max_chars})")
            return intel_pool
        
        logger.warning(f"⚠️ Intel pool too large: {original_size} chars, truncating to {max_chars} chars")
        
        # Split into sections (separated by "---")
        sections = intel_pool.split("\n---\n")
        
        # Categorize sections by priority
        high_priority = []  # Contains prices
        medium_priority = []  # Contains product names or key info
        low_priority = []  # Everything else
        
        price_patterns = [r'\$[\d,]+', r'€[\d,]+', r'£[\d,]+', r'price', r'cost', r'pricing', r'msrp', r'retail']
        
        import re
        for section in sections:
            section_lower = section.lower()
            
            # Check if section contains price information
            has_price = any(re.search(pattern, section_lower, re.IGNORECASE) for pattern in price_patterns)
            
            # Check if section contains product-related keywords
            has_product_info = any(keyword in section_lower for keyword in ['nvidia', 'amd', 'gpu', 'h100', 'h200', 'mi300', 'blackwell', 'rubin'])
            
            if has_price:
                high_priority.append(section)
            elif has_product_info:
                medium_priority.append(section)
            else:
                low_priority.append(section)
        
        # Build truncated result, prioritizing important sections
        truncated = []
        current_size = 0
        
        # Add high priority sections first (prices)
        for section in high_priority:
            section_with_sep = f"\n---\n{section}\n"
            if current_size + len(section_with_sep) <= max_chars:
                truncated.append(section)
                current_size += len(section_with_sep)
            else:
                # Truncate this section if needed
                remaining = max_chars - current_size - 10  # Reserve space for separator
                if remaining > 100:  # Only add if meaningful space remains
                    truncated.append(section[:remaining] + "... [truncated]")
                break
        
        # Add medium priority sections (product info)
        for section in medium_priority:
            section_with_sep = f"\n---\n{section}\n"
            if current_size + len(section_with_sep) <= max_chars:
                truncated.append(section)
                current_size += len(section_with_sep)
            else:
                remaining = max_chars - current_size - 10
                if remaining > 100:
                    truncated.append(section[:remaining] + "... [truncated]")
                break
        
        # Add low priority sections if space allows
        for section in low_priority:
            section_with_sep = f"\n---\n{section}\n"
            if current_size + len(section_with_sep) <= max_chars:
                truncated.append(section)
                current_size += len(section_with_sep)
            else:
                remaining = max_chars - current_size - 10
                if remaining > 100:
                    truncated.append(section[:remaining] + "... [truncated]")
                break
        
        result = "\n---\n".join(truncated)
        final_size = len(result)
        
        logger.info(f"✅ Truncated intel pool: {original_size} → {final_size} chars ({len(high_priority)} price sections, {len(medium_priority)} product sections preserved)")
        
        return result

    def _persist_to_memory(self, report: str, conversation_id: int):
        """Dual-Layer Persistence: Vector (RAG) & SQL (Audit)."""
        logger.info(f"💾 Persisting report to dual-layer memory.")
        try:
            ingest_document(
                title=f"Report_{conversation_id}_{datetime.now().strftime('%Y%m%d')}", 
                content=report, 
                conversation_id=conversation_id
            )
            
            if self.db:
                new_log = models.MissionLog(
                    conversation_id=conversation_id,
                    query="Market Intelligence Mission",
                    response=report,
                    status="COMPLETED"
                )
                self.db.add(new_log)
                self.db.commit()
                logger.info("✅ Persistence successful.")
        except Exception as e:
            logger.error(f"❌ Memory Persistence Error: {str(e)}")

    async def execute_tool(self, tool: str, args: Dict[str, Any], conversation_id: int = 0) -> str:
        """Universal Tool Orchestrator - Updated for Async compatibility."""
        logger.info(f"🛠️ Executing Tool: {tool}")
        try:
            if tool == "web_research":
                url = args.get("url") or args.get("link")
                if not url:
                    return "Error: No URL provided for web_research"
                
                url_str = str(url).strip()
                is_valid, error_msg = validate_url(url_str)
                if not is_valid:
                    logger.warning(f"Invalid URL rejected: {url_str} - {error_msg}")
                    return f"Error: Invalid URL - {error_msg}"
                
                result = await scrape_web(url_str, conversation_id)
                
                if any(m in result.lower() for m in ["cookie", "blocked", "verify", "robot"]) or len(result) < 500:
                    logger.warning(f"🛡️ Protection detected on {url}. Falling back.")
                    loop = asyncio.get_running_loop()
                    return await loop.run_in_executor(None, self.search_tool.search, f"Latest info from {url}")
                return result

            loop = asyncio.get_running_loop()
            
            if tool == "web_search":
                query = args.get("query") or "Market Intelligence Query"
                query_str = str(query)
                
                # Check if this is a price-related query
                price_keywords = ["price", "cost", "pricing", "buy", "retail", "msrp"]
                is_price_query = any(keyword in query_str.lower() for keyword in price_keywords)
                
                # Execute the initial search
                result = await loop.run_in_executor(None, self.search_tool.search, query_str)
                
                # If it's a price query and no price data was found, try alternative queries
                if is_price_query and not self._extract_price_data(result):
                    logger.info(f"💰 No price data found in initial search, trying alternative queries for: {query_str}")
                    
                    # Try to extract product name from query (remove price keywords and year)
                    import re
                    product_name = query_str
                    # Remove common price-related words and years
                    for keyword in price_keywords + ["2025", "2024", "2026"]:
                        product_name = re.sub(rf'\b{keyword}\b', '', product_name, flags=re.IGNORECASE)
                    product_name = product_name.strip()
                    
                    # If we can extract a product name, use the comprehensive price search
                    if product_name and len(product_name) > 3:
                        logger.info(f"🔍 Executing comprehensive price search for: {product_name}")
                        alternative_result = await loop.run_in_executor(
                            None, 
                            self.search_tool.search_prices, 
                            product_name,
                            2025  # Current year
                        )
                        
                        # Combine results if alternative search found something
                        if alternative_result and alternative_result != f"No price information found for {product_name}.":
                            result = f"{result}\n\n--- Additional Price Search Results ---\n{alternative_result}"
                            logger.info("✅ Found additional price data from alternative search")
                    else:
                        # If we can't extract product name, try a few alternative query variations
                        alternative_queries = [
                            query_str.replace("price", "cost") if "price" in query_str.lower() else query_str + " cost",
                            query_str.replace("cost", "pricing") if "cost" in query_str.lower() else query_str + " pricing",
                            query_str + " buy",
                            query_str + " MSRP",
                        ]
                        
                        for alt_query in alternative_queries[:2]:  # Try first 2 alternatives
                            try:
                                alt_result = await loop.run_in_executor(None, self.search_tool.search, alt_query)
                                if self._extract_price_data(alt_result):
                                    result = f"{result}\n\n--- Alternative Search: {alt_query} ---\n{alt_result}"
                                    logger.info(f"✅ Found price data from alternative query: {alt_query}")
                                    break
                            except Exception as e:
                                logger.warning(f"Alternative query '{alt_query}' failed: {str(e)}")
                                continue
                
                return result
            
            if tool == "save_to_notion":
                title = args.get("title", f"Report {datetime.now().date()}")
                content = self._integrity_check(args.get("content", ""))
                return "✅ Notion OK" if await loop.run_in_executor(None, self.notion.create_page, title, content) else "❌ Notion Error"
            
            if tool == "dispatch_email":
                content = self._integrity_check(args.get("content", ""))
                success = await loop.run_in_executor(None, self.email.send_email, settings.EMAIL_USER, f"Agent Report: {args.get('title', 'Update')}", content)
                return "✅ Email OK" if success else "❌ Email Error"
            
            return f"Error: Tool '{tool}' not found."
        except Exception as e:
            logger.error(f"❌ Tool Execution Failure ({tool}): {str(e)}")
            return f"Tool Failure: {str(e)}"

    async def process_mission(self, user_input: str, conversation_id: Optional[int] = None) -> Dict[str, Any]:
        """Simplified Orchestration Loop using the updated execute_tool."""
        mission_id = conversation_id or 999
        logger.info(f"🏁 Mission {mission_id} started.")
        
        plan = await self.generate_plan(user_input)
        self.current_intel = ""
        logs = []
        
        for step in [s for s in plan if s.get('tool') in ["web_research", "web_search"]]:
            res = await self.execute_tool(step['tool'], step['args'], mission_id)
            
            # Limit each search result to 2000 chars to prevent accumulation of huge intel pools
            if len(res) > 2000:
                logger.info(f"📏 Truncating search result from {len(res)} to 2000 chars")
                res = res[:2000] + "... [truncated]"
            
            self.current_intel += f"\n---\n{res}\n"
            logs.append({"tool": step['tool'], "status": "Gathered"})

        # Truncate intel pool if too large to prevent 413 Payload Too Large errors
        intel_pool_size = len(self.current_intel)
        logger.info(f"📊 Intel pool collected: {intel_pool_size} chars")
        
        # #region agent log
        try:
            os.makedirs('.cursor', exist_ok=True)
            with open('.cursor/debug.log', 'a', encoding='utf-8') as f:
                f.write(json.dumps({"sessionId": "debug-session", "runId": "run1", "hypothesisId": "A", "location": "agent_service.py:535", "message": "Intel pool size before truncation", "data": {"intel_pool_size": intel_pool_size}, "timestamp": int(time.time() * 1000)}) + "\n")
        except Exception:
            pass  # Silently fail if debug logging isn't available
        # #endregion
        
        # Calculate maximum allowed intel_pool size dynamically
        max_allowed_chars = self._calculate_max_intel_pool_size()
        
        # If intel pool is very large, extract price summary for compact format
        if intel_pool_size > max_allowed_chars * 1.5:  # If 50% larger than max
            logger.info(f"💰 Intel pool very large ({intel_pool_size} chars), extracting price summary for compact format")
            truncated_intel = self._extract_price_summary(self.current_intel)
            # If summary is still too large, truncate further using calculated limit
            if len(truncated_intel) > max_allowed_chars:
                truncated_intel = self._truncate_intel_pool(truncated_intel, max_chars=max_allowed_chars)
        else:
            # Truncate to stay within Groq API limits (dynamically calculated)
            truncated_intel = self._truncate_intel_pool(self.current_intel, max_chars=max_allowed_chars)
        
        # #region agent log
        try:
            os.makedirs('.cursor', exist_ok=True)
            with open('.cursor/debug.log', 'a', encoding='utf-8') as f:
                f.write(json.dumps({"sessionId": "debug-session", "runId": "run1", "hypothesisId": "B", "location": "agent_service.py:555", "message": "Intel pool size after truncation", "data": {"truncated_size": len(truncated_intel), "max_allowed_chars": max_allowed_chars}, "timestamp": int(time.time() * 1000)}) + "\n")
        except Exception:
            pass  # Silently fail if debug logging isn't available
        # #endregion
        
        # Calculate final prompt size
        prompt_template = REPORT_SYNTHESIS_PROMPT.format(intel_pool="")
        final_prompt = REPORT_SYNTHESIS_PROMPT.format(intel_pool=truncated_intel)
        final_prompt_size = len(final_prompt)
        logger.info(f"📊 Final prompt size: {final_prompt_size} chars (intel_pool: {len(truncated_intel)} chars, max allowed: {max_allowed_chars} chars)")

        # #region agent log
        try:
            os.makedirs('.cursor', exist_ok=True)
            with open('.cursor/debug.log', 'a', encoding='utf-8') as f:
                f.write(json.dumps({"sessionId": "debug-session", "runId": "run1", "hypothesisId": "C", "location": "agent_service.py:565", "message": "Final prompt size before sending to LLM", "data": {"final_prompt_size": final_prompt_size, "truncated_intel_size": len(truncated_intel), "template_size": len(prompt_template), "max_allowed_chars": max_allowed_chars}, "timestamp": int(time.time() * 1000)}) + "\n")
        except Exception:
            pass  # Silently fail if debug logging isn't available
        # #endregion

        loop = asyncio.get_running_loop()
        self.current_intel = await loop.run_in_executor(
            None, 
            self.llm.generate, 
            final_prompt
        )
        self._persist_to_memory(self.current_intel, mission_id)

        for step in [s for s in plan if s.get('tool') in ["save_to_notion", "dispatch_email"]]:
            step['args']['content'] = self.current_intel
            res = await self.execute_tool(step['tool'], step['args'], mission_id)
            logs.append({"tool": step['tool'], "result": res})

        logger.info(f"🏆 Mission {mission_id} complete.")
        return {
            "status": "complete", 
            "mission_id": mission_id,
            "report": self.current_intel, 
            "trace": logs
        }