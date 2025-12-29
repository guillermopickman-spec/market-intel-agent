# Use an official Python slim image for a small footprint
FROM python:3.11-slim

# Prevent Python from writing .pyc files and buffer logs
ENV PYTHONDONTWRITEBYTECODE 1
ENV PYTHONUNBUFFERED 1

# Set the working directory
WORKDIR /app

# Install system dependencies
# We only need build-essential and libpq-dev for database drivers
# curl is kept for health checks if needed
RUN apt-get update && apt-get install -y \
    build-essential \
    libpq-dev \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements first to leverage Docker layer caching
COPY requirements.txt .

# Install Python dependencies
# --no-cache-dir keeps the image slim
RUN pip install --no-cache-dir -r requirements.txt

# Install Playwright and its system-level dependencies
# These are still required for the scraper_service.py
RUN pip install playwright && \
    playwright install chromium && \
    playwright install-deps chromium

# --- REMOVED: LOCAL MODEL DOWNLOAD ---
# We no longer need to pre-download or create /app/local_cache 
# as we are moving to the Hugging Face Inference API.

# Copy the rest of your application code
COPY . .

# Expose the port (Render uses the $PORT env var, but we'll expose 8000 as a default)
EXPOSE 8000

# Command to run the application
# Using the list format allows for proper signal handling (graceful shutdown)
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]