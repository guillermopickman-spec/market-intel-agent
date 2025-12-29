import sys
import asyncio
from fastapi import FastAPI
from dotenv import load_dotenv

# --- 1. OS COMPATIBILITY PATCH ---
# Only use Proactor on Windows; Linux (Render) uses the default loop.
if sys.platform == 'win32':
    asyncio.set_event_loop_policy(asyncio.WindowsProactorEventLoopPolicy())

load_dotenv()

# Import DB components after load_dotenv
from database import engine, Base
import models  

# Create tables (SQLAlchemy handles "if not exists" automatically)
try:
    Base.metadata.create_all(bind=engine)
    print("✅ Database initialized successfully.")
except Exception as e:
    print(f"❌ Database error during startup: {e}")

from routers.documents import router as documents_router
from routers.chat import router as chat_router
from routers.agent import router as agent_router

app = FastAPI(
    title="Market Intelligence Agent API",
    version="1.0.0"
)

app.include_router(documents_router, prefix="/documents", tags=["RAG"])
app.include_router(chat_router, prefix="/chat", tags=["Chat"])
app.include_router(agent_router, prefix="/agent", tags=["Agent"])

@app.get("/")
def read_root():
    return {"status": "active", "platform": sys.platform}

@app.get("/health")
def health_check():
    return {"status": "healthy"}