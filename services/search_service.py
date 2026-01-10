from typing import Optional
from ddgs import DDGS
from core.logger import get_logger

logger = get_logger("SearchService")

class SearchService:
    def search(self, query: str) -> str:
        """Fallback search when direct scraping is blocked."""
        try:
            logger.info(f"🔍 Plan B: Searching the web for '{query}'")
            with DDGS() as ddgs:
                results = []
                search_results = ddgs.text(query, max_results=15)
                
                # Handle case where results might be None or not iterable
                if search_results:
                    for r in search_results:
                        # Ensure r is a dictionary
                        if not isinstance(r, dict):
                            continue
                        
                        # Safely access dictionary keys with defaults
                        href = r.get('href', '')
                        title = r.get('title', 'No title')
                        body = r.get('body', 'No description')
                        
                        if href:  # Only add if we have a valid URL
                            results.append(f"{title}: {body} (Source: {href})")
                
                if not results:
                    return "No search results found."
                return "\n\n".join(results)
        except Exception as e:
            logger.error(f"Search failed: {e}")
            return f"Search error: {str(e)}"
    
    def search_prices(self, product_name: str, year: Optional[int] = None) -> str:
        """
        Comprehensive price search with multiple query variations.
        Generates and executes multiple search queries to maximize price discovery.
        """
        try:
            # Validate product_name
            if not product_name or not isinstance(product_name, str):
                logger.error(f"Invalid product_name provided: {product_name}")
                return f"Error: Invalid product name provided."
            
            product_name = product_name.strip()
            if len(product_name) < 2:
                logger.error(f"Product name too short: {product_name}")
                return f"Error: Product name too short."
            
            year_suffix = f" {year}" if year else " 2025"
            
            # Generate multiple query variations for comprehensive price discovery
            query_variations = [
                f"{product_name} price{year_suffix}",
                f"{product_name} cost{year_suffix}",
                f"{product_name} pricing{year_suffix}",
                f"{product_name} buy{year_suffix}",
                f"{product_name} retail price{year_suffix}",
                f"{product_name} MSRP{year_suffix}",
            ]
            
            logger.info(f"💰 Price search: '{product_name}' with {len(query_variations)} query variations")
            
            all_results = []
            seen_urls = set()
            
            with DDGS() as ddgs:
                for query in query_variations:
                    try:
                        logger.info(f"🔍 Searching: '{query}'")
                        results = ddgs.text(query, max_results=10)
                        
                        # Handle case where results might be None or not iterable
                        if not results:
                            continue
                        
                        for r in results:
                            # Ensure r is a dictionary
                            if not isinstance(r, dict):
                                continue
                            
                            # Safely access dictionary keys with defaults
                            href = r.get('href', '')
                            title = r.get('title', 'No title')
                            body = r.get('body', 'No description')
                            
                            # Skip if missing essential data
                            if not href:
                                continue
                            
                            # Deduplicate by URL to avoid repeating the same source
                            if href not in seen_urls:
                                seen_urls.add(href)
                                all_results.append(f"{title}: {body} (Source: {href})")
                    except KeyError as e:
                        logger.warning(f"Query '{query}' failed - missing key: {str(e)}")
                        continue
                    except Exception as e:
                        logger.warning(f"Query '{query}' failed: {str(e)}")
                        continue
            
            if not all_results:
                return f"No price information found for {product_name}."
            
            logger.info(f"✅ Found {len(all_results)} unique price-related results for {product_name}")
            return "\n\n".join(all_results)
            
        except Exception as e:
            logger.error(f"Price search failed: {e}")
            return f"Price search error: {str(e)}"