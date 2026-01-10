import logging
from typing import List, Optional
from google import genai
from core.settings import settings

logger = logging.getLogger(__name__)

class GeminiEmbedder:
    """
    Handles high-performance 768-dimension vector generation 
    using Google Gemini text-embedding-004.
    """
    def __init__(self):
        if not settings.GEMINI_API_KEY or settings.GEMINI_API_KEY == "":
            logger.error("❌ GEMINI_API_KEY is missing for embeddings")
            raise ValueError("GEMINI_API_KEY is required when using Gemini embeddings.")

        # Client initialization (Ready for Docker/Render)
        self.client = genai.Client(api_key=settings.GEMINI_API_KEY)
        self.model_name = "text-embedding-004"

    def embed(self, texts: List[str]) -> List[List[float]]:
        """
        Converts a list of strings into high-dimensional numerical vectors.
        """
        if not texts:
            return []

        try:
            logger.info(f"📡 Requesting 768-dim Vectors for {len(texts)} chunks...")
            
            result = self.client.models.embed_content(
                model=self.model_name,
                contents=texts
            )
            
            if not result or not hasattr(result, "embeddings") or not result.embeddings:
                logger.error("❌ Gemini returned an empty or invalid embedding result")
                return []

            # Precise extraction logic for strict typing
            embeddings: List[List[float]] = [
                list(e.values) for e in result.embeddings 
                if e is not None and e.values is not None
            ]
            
            logger.info(f"✅ Received {len(embeddings)} vectors.")
            return embeddings
                
        except Exception as e:
            logger.error(f"❌ Gemini Embedding Error: {e}")
            return []


# Singleton Instance Management
_model: Optional[GeminiEmbedder] = None

def get_embedding_model():
    """
    Returns the singleton GeminiEmbedder instance.
    The system now uses Gemini embeddings exclusively.
    """
    global _model
    if _model is None:
        _model = GeminiEmbedder()
    return _model