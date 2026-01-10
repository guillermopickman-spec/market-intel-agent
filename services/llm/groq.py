import requests
import time
import json
import os
from services.llm.base import LLMClient
from core.settings import settings
from core.logger import get_logger
from fastapi import HTTPException

logger = get_logger("GroqClient")

class GroqClient(LLMClient):
    """
    Groq API Client - Fast inference with generous free tier.
    Free tier: ~14,400 requests/day
    """
    def __init__(self):
        if not settings.GROQ_API_KEY or settings.GROQ_API_KEY == "":
            logger.error("❌ GROQ_API_KEY is missing from .env")
            raise ValueError("GROQ_API_KEY is required when using Groq provider.")
        
        self.api_key = settings.GROQ_API_KEY
        self.model = settings.GROQ_MODEL_NAME
        self.api_url = "https://api.groq.com/openai/v1/chat/completions"
        # Groq API payload limit is approximately 32KB for the entire JSON payload
        # Use more conservative limit: 28000 bytes (27.3 KB) to ensure we never exceed
        self.max_payload_size = 28000  # Very conservative limit: 28KB to account for overhead and API variations
        logger.info(f"🚀 Groq Client initialized with model: {self.model}, max payload: {self.max_payload_size} bytes")
    
    def _calculate_payload_size(self, payload: dict) -> int:
        """Calculate the size of the JSON payload in bytes."""
        try:
            json_str = json.dumps(payload)
            return len(json_str.encode('utf-8'))
        except Exception as e:
            logger.warning(f"⚠️ Could not calculate payload size: {str(e)}")
            # Estimate based on string representation
            return len(str(payload).encode('utf-8'))

    def generate(self, prompt: str, max_retries: int = 3) -> str:
        """
        Generate response using Groq API.
        Uses OpenAI-compatible chat completions endpoint.
        """
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }

        payload = {
            "model": self.model,
            "messages": [
                {"role": "system", "content": "You are a professional market analyst. Output in Markdown."},
                {"role": "user", "content": prompt}
            ],
            "temperature": 0.1,
            "max_tokens": 2048
        }

        # Check payload size before sending
        payload_size = self._calculate_payload_size(payload)
        prompt_size = len(prompt)
        logger.info(f"📊 Groq payload size: {payload_size} bytes ({payload_size/1024:.2f} KB)")
        
        # #region agent log
        try:
            os.makedirs('.cursor', exist_ok=True)
            with open('.cursor/debug.log', 'a', encoding='utf-8') as f:
                f.write(json.dumps({"sessionId": "debug-session", "runId": "run1", "hypothesisId": "D", "location": "groq.py:68", "message": "Payload size calculation", "data": {"payload_size_bytes": payload_size, "payload_size_kb": payload_size/1024, "max_payload_size": self.max_payload_size, "prompt_size_chars": prompt_size, "prompt_size_bytes": len(prompt.encode('utf-8'))}, "timestamp": int(time.time() * 1000)}) + "\n")
        except Exception:
            pass  # Silently fail if debug logging isn't available
        # #endregion
        
        if payload_size > self.max_payload_size:
            error_msg = f"Payload too large: {payload_size} bytes (limit: {self.max_payload_size} bytes). Prompt size: {len(prompt)} chars"
            logger.error(f"❌ {error_msg}")
            
            # #region agent log
            try:
                os.makedirs('.cursor', exist_ok=True)
                with open('.cursor/debug.log', 'a', encoding='utf-8') as f:
                    f.write(json.dumps({"sessionId": "debug-session", "runId": "run1", "hypothesisId": "E", "location": "groq.py:80", "message": "Payload size exceeded limit", "data": {"payload_size_bytes": payload_size, "max_payload_size": self.max_payload_size, "excess_bytes": payload_size - self.max_payload_size, "prompt_size_chars": prompt_size}, "timestamp": int(time.time() * 1000)}) + "\n")
            except Exception:
                pass  # Silently fail if debug logging isn't available
            # #endregion
            
            raise HTTPException(
                status_code=413,
                detail=f"Payload too large for Groq API. Size: {payload_size} bytes, Limit: {self.max_payload_size} bytes. Please reduce the prompt size."
            )

        for attempt in range(max_retries):
            try:
                logger.info(f"🚀 Groq Request: {self.model} (Attempt {attempt + 1})")
                response = requests.post(
                    url=self.api_url,
                    headers=headers,
                    json=payload,
                    timeout=settings.LLM_REQUEST_TIMEOUT
                )

                if response.status_code == 429:
                    # Rate limit hit - wait and retry
                    wait_time = (attempt + 1) * 2
                    logger.warning(f"⏳ Rate limit hit. Waiting {wait_time}s...")
                    time.sleep(wait_time)
                    continue

                response.raise_for_status()
                data = response.json()

                content = data.get("choices", [{}])[0].get("message", {}).get("content")
                
                if content:
                    logger.info("✅ Groq Response Received.")
                    return content
                
                raise ValueError("Empty response from Groq")

            except requests.Timeout:
                logger.warning(f"⏳ Groq Request timed out after {settings.LLM_REQUEST_TIMEOUT}s (Attempt {attempt + 1})")
                if attempt == max_retries - 1:
                    raise HTTPException(
                        status_code=504,
                        detail=f"Groq request timed out after {settings.LLM_REQUEST_TIMEOUT}s"
                    )
                time.sleep(2)
                continue
            except requests.exceptions.HTTPError as e:
                if response.status_code == 429:
                    wait_time = (attempt + 1) * 2
                    logger.warning(f"⏳ Rate limit hit. Waiting {wait_time}s...")
                    time.sleep(wait_time)
                    continue
                logger.error(f"❌ Groq HTTP Error: {str(e)}")
                
                # #region agent log
                if response.status_code == 413:
                    try:
                        os.makedirs('.cursor', exist_ok=True)
                        with open('.cursor/debug.log', 'a', encoding='utf-8') as f:
                            f.write(json.dumps({"sessionId": "debug-session", "runId": "run1", "hypothesisId": "F", "location": "groq.py:143", "message": "413 error from Groq API", "data": {"status_code": 413, "payload_size_bytes": payload_size, "max_payload_size": self.max_payload_size, "prompt_size_chars": prompt_size, "response_text": response.text[:500] if hasattr(response, 'text') else "N/A"}, "timestamp": int(time.time() * 1000)}) + "\n")
                    except Exception:
                        pass  # Silently fail if debug logging isn't available
                # #endregion
                
                if attempt == max_retries - 1:
                    raise HTTPException(status_code=response.status_code, detail=f"Groq Error: {str(e)}")
                time.sleep(2)
                continue
            except Exception as e:
                if attempt == max_retries - 1:
                    logger.error(f"❌ Groq Final Failure: {str(e)}")
                    raise HTTPException(status_code=504, detail=f"Groq Error: {str(e)}")
                
                time.sleep(2)
        
        return "❌ Maximum retries reached. Groq API request failed."
