"""
Vercel Serverless Function wrapper for FastAPI backend.

This file allows Vercel to serve the FastAPI application as a serverless function.
Since Vercel's root is set to 'frontend/', we need to import from the parent directory.
"""
import sys
import os
from pathlib import Path

# Add parent directories to Python path to import backend code
# Vercel's working directory will be frontend/, so we need to go up one level
# to reach the project root where main.py lives
# Path resolution: frontend/api/index.py -> frontend/ -> project_root/
current_file = Path(__file__).resolve()
frontend_dir = current_file.parent.parent  # frontend/
project_root = frontend_dir.parent  # project root (one level up from frontend/)

# Add both project root and frontend to path for comprehensive import resolution
sys.path.insert(0, str(project_root))
sys.path.insert(0, str(frontend_dir))

# Change working directory to project root for relative imports
os.chdir(str(project_root))

# Import the FastAPI app from main.py
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
