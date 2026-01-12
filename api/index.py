"""
Vercel Serverless Function wrapper for FastAPI backend.

This file allows Vercel to serve the FastAPI application as a serverless function.
Since Vercel's root is now at the project root, we can import directly from main.py.
"""
# Import the FastAPI app from main.py (same directory level)
from main import app

# Use mangum to convert FastAPI (ASGI) to AWS Lambda/Vercel format
# Strip /api prefix so FastAPI routes match correctly
# (e.g., /api/health -> /health for FastAPI)
try:
    from mangum import Mangum
    handler = Mangum(app, lifespan="off", strip_base_path="/api")
except ImportError:
    # Fallback if mangum is not available (shouldn't happen with requirements.txt)
    raise ImportError("mangum is required for Vercel serverless functions. Add it to requirements.txt")

# Export the handler for Vercel
__all__ = ["handler"]
