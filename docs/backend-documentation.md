# Backend (Python/FastAPI) Code Documentation

## Overview

This is a **FastAPI** backend application built with **Python 3.11+**. The app is a Market Intelligence Agent that uses AI/LLM services, web scraping, vector databases, and various integrations to perform autonomous market research and generate intelligence reports.

---

## 📁 Project Structure

```
backend/
├── main.py                 # FastAPI app entry point
├── database.py             # SQLAlchemy database setup
├── core/                   # Core utilities
│   ├── settings.py         # Environment configuration (Pydantic)
│   ├── logger.py          # Logging configuration
│   ├── prompts.py          # LLM prompt templates
│   └── validators.py       # URL validation & security
├── models/                 # SQLAlchemy database models
│   ├── base.py            # Base model class
│   ├── mission_log.py     # Mission log/report model
│   └── ...
├── routers/               # API route handlers
│   ├── agent.py          # Mission execution endpoints
│   ├── chat.py           # RAG chat endpoints
│   └── documents.py      # Document management endpoints
├── services/              # Business logic layer
│   ├── agent_service.py  # Main agent orchestration
│   ├── ai_service.py     # RAG query processing
│   ├── scraper_service.py # Web scraping (Playwright)
│   ├── search_service.py # Web search (DuckDuckGo)
│   ├── document_service.py # Document ingestion
│   ├── rag_service.py    # RAG search utilities
│   ├── notion_service.py # Notion integration
│   ├── email_service.py  # Email dispatch (Resend)
│   └── llm/              # LLM provider clients
│       ├── factory.py    # LLM factory pattern
│       ├── base.py       # Base LLM interface
│       ├── groq.py       # Groq API client
│       ├── gemini.py     # Google Gemini client
│       └── huggingface.py # HuggingFace client
├── chroma/                # ChromaDB integration
│   ├── client.py         # ChromaDB client singleton
│   └── collection.py     # Collection management
└── embeddings/            # Embedding generation
    ├── model.py          # Embedding model (Gemini)
    └── chunker.py        # Text chunking utilities
```

---

## 🔑 Key Concepts

### 1. **FastAPI Framework**
- Modern async Python web framework
- Automatic OpenAPI/Swagger documentation
- Type hints and Pydantic validation
- Async/await support throughout

### 2. **ReAct Pattern (Reasoning + Acting)**
- **Plan**: LLM generates execution plan (JSON steps)
- **Act**: Execute tools (web_search, web_research, etc.)
- **Observe**: Collect results into "intel pool"
- **Think**: Synthesize final report from intel pool

### 3. **Dual-Layer Memory**
- **Vector Store (ChromaDB)**: Semantic search for RAG
- **SQL Database (PostgreSQL/SQLite)**: Audit trail and reports

### 4. **Streaming Responses**
- Server-Sent Events (SSE) for real-time updates
- NDJSON format (newline-delimited JSON)
- Progress tracking and tool execution status

### 5. **LLM Provider Abstraction**
- Factory pattern for multiple providers (Groq, Gemini, HuggingFace)
- Singleton pattern to prevent re-initialization
- Automatic fallback and error handling

---

## 📄 File-by-File Breakdown

### **`main.py`** - Application Entry Point

**Purpose**: FastAPI application initialization, middleware setup, and lifecycle management.

**Key Features**:

1. **Lifespan Management**:
```python
@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Initialize database, ChromaDB
    # Shutdown: Cleanup resources
```

2. **Database Initialization**:
```python
Base.metadata.create_all(bind=engine)  # Create tables
```

3. **ChromaDB Pre-initialization**:
- Initializes ChromaDB in background (non-blocking)
- Caches status to avoid slow health checks
- Handles initialization errors gracefully

4. **CORS Configuration**:
```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_origin_regex=r"https://.*\.vercel\.app",  # Vercel wildcard
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
)
```

5. **Health Endpoints**:
- `/health` - Full health check (database + ChromaDB)
- `/ready` - Lightweight readiness check (for Render/Vercel)
- Uses cached ChromaDB status for performance

**Windows Compatibility**:
```python
if sys.platform == 'win32':
    asyncio.set_event_loop_policy(asyncio.WindowsProactorEventLoopPolicy())
```

---

### **`database.py`** - Database Configuration

**Purpose**: SQLAlchemy engine and session management.

**Key Features**:

1. **Connection Pooling** (PostgreSQL):
```python
engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    pool_size=5,              # Maintain 5 connections
    max_overflow=10,           # Allow 10 additional connections
    pool_pre_ping=True,        # Verify connections before use
    pool_recycle=300,          # Recycle after 5 minutes
    connect_args={"connect_timeout": 5}
)
```

2. **SQLite Configuration** (Local Dev):
```python
engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False}
)
```

3. **Session Factory**:
```python
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def get_db():
    """Dependency injection for FastAPI routes."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
```

---

### **`core/settings.py`** - Configuration Management

**Purpose**: Centralized settings using Pydantic Settings with environment variable support.

**Key Settings**:

```python
class Settings(BaseSettings):
    # Database
    DATABASE_URL: str
    
    # LLM Providers
    LLM_PROVIDER: str = "groq"  # groq, gemini, huggingface
    GROQ_API_KEY: str
    GEMINI_API_KEY: str
    GROQ_MODEL_NAME: str = "llama-3.1-8b-instant"
    
    # Embeddings (Gemini text-embedding-004)
    # Automatically configured
    
    # Integrations
    RESEND_API_KEY: str
    NOTION_TOKEN: str
    NOTION_PAGE_ID: str
    EMAIL_USER: str
    EMAIL_PASSWORD: str
    
    # ChromaDB
    CHROMA_SERVER_NO_ANALYTICS: bool = True
    
    # CORS
    CORS_ALLOWED_ORIGINS: str = "http://localhost:3000,..."
    
    # Timeouts
    HTTP_REQUEST_TIMEOUT: int = 30
    LLM_REQUEST_TIMEOUT: int = 60
    SCRAPER_TIMEOUT: int = 60
```

**Usage**:
```python
from core.settings import settings

api_key = settings.GROQ_API_KEY
```

**CORS Parsing**:
```python
def get_cors_origins(self) -> list[str]:
    """Parse comma-separated CORS origins."""
    return [origin.strip() for origin in self.CORS_ALLOWED_ORIGINS.split(",")]
```

---

### **`core/logger.py`** - Logging System

**Purpose**: Color-coded logging for development, structured logging for production.

**Features**:
- Color-coded console output (DEBUG=grey, INFO=blue, WARNING=yellow, ERROR=red)
- Prevents duplicate handlers
- Standardized format: `timestamp | level | name | message`

**Usage**:
```python
from core.logger import get_logger

logger = get_logger("MyService")
logger.info("Operation started")
logger.error("Operation failed", exc_info=True)
```

---

### **`core/prompts.py`** - LLM Prompt Templates

**Purpose**: Centralized prompt templates for LLM interactions.

**Key Prompts**:

1. **`CLOUD_AGENT_PROMPT`** - Mission Planning:
   - Instructs LLM to generate JSON execution plan
   - Lists available tools and their arguments
   - Includes pricing mission optimization (multiple query variations)
   - Enforces data persistence rules

2. **`REPORT_SYNTHESIS_PROMPT`** - Report Generation:
   - Analyzes gathered intelligence pool
   - Deduplicates and categorizes pricing data
   - Generates structured markdown report
   - Includes price comparison tables

**Example Output Format**:
```json
[
  {
    "step": 1,
    "tool": "web_search",
    "args": {"query": "NVIDIA H100 price 2025"},
    "thought": "Searching for current pricing..."
  },
  {
    "step": 2,
    "tool": "save_to_notion",
    "args": {
      "title": "H100 Pricing Report",
      "content": "Synthesize findings here..."
    }
  }
]
```

---

### **`core/validators.py`** - URL Validation

**Purpose**: Security-focused URL validation to prevent SSRF attacks.

**Features**:
- Validates URL scheme (http/https only)
- Blocks private/internal network ranges
- Blocks localhost (unless explicitly allowed)
- Blocks AWS/GCP metadata services
- Length validation (max 2048 chars)

**Usage**:
```python
from core.validators import validate_url

is_valid, error_msg = validate_url(url)
if not is_valid:
    raise HTTPException(400, detail=error_msg)
```

**Blocked Networks**:
- `localhost`, `127.0.0.1`, `0.0.0.0`
- `169.254.169.254` (AWS metadata)
- `metadata.google.internal` (GCP metadata)
- Private IP ranges (10.x.x.x, 192.168.x.x, 172.x.x.x)

---

### **`routers/agent.py`** - Mission Execution Routes

**Purpose**: API endpoints for mission planning and execution.

**Endpoints**:

#### 1. `POST /analyze`
**Purpose**: Quick intent identification (no tool execution).

```python
@router.post("/analyze")
async def analyze_mission(data: MissionRequest):
    agent = AgentService()
    intent = await agent.identify_intent(data.user_input)
    return {"intent": intent}
```

#### 2. `POST /execute`
**Purpose**: Full mission execution (non-streaming).

```python
@router.post("/execute")
async def execute_mission(data: MissionRequest, db: Session = Depends(get_db)):
    agent = AgentService(db)
    result = await agent.process_mission(data.user_input, data.conversation_id)
    return result  # {"status": "complete", "report": "...", "trace": [...]}
```

#### 3. `POST /execute/stream` ⭐
**Purpose**: Streaming mission execution with real-time updates.

**Stream Format (NDJSON)**:
```json
{"type": "thinking", "content": "Analyzing mission..."}
{"type": "progress", "step": 1, "total": 10, "percentage": 10}
{"type": "tool_start", "tool": "web_search", "args": {"query": "..."}}
{"type": "tool_complete", "tool": "web_search", "summary": "Found results..."}
{"type": "action_start", "action": "save_to_notion", "title": "..."}
{"type": "action_complete", "action": "save_to_notion", "result": "..."}
{"type": "complete", "report": "Full report markdown..."}
```

**Implementation**:
```python
async def generate_stream():
    agent = AgentService(db)
    
    # Step 1: Analyze
    yield json.dumps({"type": "thinking", "content": "..."}) + "\n"
    
    # Step 2: Generate plan
    plan = await agent.generate_plan(data.user_input)
    
    # Step 3+: Execute research tools
    for step in research_steps:
        yield json.dumps({"type": "tool_start", ...}) + "\n"
        result = await agent.execute_tool(step['tool'], step['args'])
        yield json.dumps({"type": "tool_complete", ...}) + "\n"
    
    # Step N: Synthesize report
    final_report = await agent.synthesize_report(intel_pool)
    yield json.dumps({"type": "complete", "report": final_report}) + "\n"

return StreamingResponse(generate_stream(), media_type="application/x-ndjson")
```

#### 4. `GET /reports`
**Purpose**: Retrieve mission logs/reports.

```python
@router.get("/reports")
async def get_reports(db: Session = Depends(get_db), limit: int = 100):
    logs = db.query(MissionLog).order_by(desc(MissionLog.created_at)).limit(limit).all()
    return [{"id": log.id, "query": log.query, "response": log.response, ...} for log in logs]
```

#### 5. `GET /stats`
**Purpose**: Mission statistics for dashboard.

```python
@router.get("/stats")
async def get_stats(db: Session = Depends(get_db)):
    total = db.query(func.count(MissionLog.id)).scalar()
    completed = db.query(func.count(MissionLog.id)).filter(MissionLog.status == "COMPLETED").scalar()
    failed = db.query(func.count(MissionLog.id)).filter(MissionLog.status == "FAILED").scalar()
    return {"total_missions": total, "completed_missions": completed, "failed_missions": failed}
```

---

### **`services/agent_service.py`** - Agent Orchestration

**Purpose**: Core business logic for mission execution using ReAct pattern.

**Key Methods**:

#### 1. `identify_intent(user_input: str) -> str`
Quickly identifies mission goal without tool execution.

#### 2. `generate_plan(user_input: str) -> List[Dict]`
Generates JSON execution plan using LLM.

**Process**:
1. Formats `CLOUD_AGENT_PROMPT` with user input
2. Calls LLM to generate plan
3. Extracts JSON array from response (regex)
4. Returns list of step dictionaries

#### 3. `execute_tool(tool: str, args: Dict, conversation_id: int) -> str`
Universal tool orchestrator.

**Supported Tools**:
- `web_research` - Scrapes URL using Playwright
- `web_search` - Searches web using DuckDuckGo
- `save_to_notion` - Saves report to Notion
- `dispatch_email` - Sends email via Resend

**Price Search Optimization**:
- Detects price-related queries
- Executes multiple query variations if no price found
- Uses `search_prices()` for comprehensive price discovery

#### 4. `process_mission(user_input: str, conversation_id: int) -> Dict`
Full mission execution loop.

**Flow**:
1. Generate plan
2. Execute research tools → build intel pool
3. Truncate intel pool if too large (API payload limits)
4. Synthesize report from intel pool
5. Execute action tools (save, email)
6. Persist to memory (ChromaDB + SQL)

**Intel Pool Management**:
- Limits each search result to 2000 chars
- Calculates max intel pool size based on API limits (Groq: 28KB)
- Extracts price summary if pool is very large
- Prioritizes price data during truncation

**Methods**:
- `_calculate_max_intel_pool_size()` - Calculates safe payload size
- `_extract_price_summary()` - Extracts only price data
- `_truncate_intel_pool()` - Intelligent truncation (preserves prices)
- `_extract_price_data()` - Detects if text contains prices
- `_integrity_check()` - Validates content quality
- `_persist_to_memory()` - Saves to ChromaDB + SQL

---

### **`services/scraper_service.py`** - Web Scraping

**Purpose**: Stealth web scraping using Playwright with anti-detection.

**Key Features**:

1. **Stealth Mode**:
```python
from playwright_stealth import stealth_async
await stealth_async(page)  # Hides automation signatures
```

2. **Environment Detection**:
```python
def _is_docker_environment():
    return os.path.exists("/.dockerenv")
```

3. **Browser Arguments**:
- Optimized for Docker (no `--single-process`)
- Headless mode
- Disabled GPU, extensions, background processes

4. **Timeout Management**:
- Top-level timeout wrapper (prevents infinite hangs)
- Multiple timeout layers (browser launch, page load, text extraction)
- Graceful fallback strategies

5. **Navigation Strategies**:
```python
# Try domcontentloaded first (faster)
await page.goto(url, wait_until="domcontentloaded")
# Fallback to commit if timeout
await page.goto(url, wait_until="commit")
```

6. **Background Ingestion**:
- Scraped content ingested to ChromaDB in background
- Doesn't block scraping response
- Prevents freezing when HuggingFace API is slow

**Usage**:
```python
from services.scraper_service import scrape_web

result = await scrape_web("https://example.com", conversation_id=123)
```

---

### **`services/search_service.py`** - Web Search

**Purpose**: DuckDuckGo search integration.

**Key Methods**:

1. `search(query: str) -> str`
   - Searches DuckDuckGo
   - Returns formatted results (title, body, source URL)
   - Used as fallback when scraping is blocked

2. `search_prices(product_name: str, year: int) -> str`
   - Comprehensive price search with multiple query variations
   - Deduplicates results by URL
   - Returns combined results from all variations

**Query Variations**:
```python
[
    f"{product_name} price {year}",
    f"{product_name} cost {year}",
    f"{product_name} pricing {year}",
    f"{product_name} buy {year}",
    f"{product_name} retail price {year}",
    f"{product_name} MSRP {year}",
]
```

---

### **`services/document_service.py`** - Document Ingestion

**Purpose**: Ingests documents into ChromaDB vector store.

**Process**:
1. **Chunking**: Splits text into chunks (via `chunker.py`)
2. **Embedding**: Generates embeddings using Gemini model
3. **Storage**: Adds to ChromaDB collection with metadata

**Metadata**:
```python
{
    "title": str,
    "conversation_id": int,
    "timestamp": ISO datetime string
}
```

**Usage**:
```python
from services.document_service import ingest_document

chunks_ingested = ingest_document(
    title="Report_123_20241215",
    content="Full report text...",
    conversation_id=123
)
```

---

### **`services/ai_service.py`** - RAG Query Processing

**Purpose**: Retrieval-Augmented Generation for document Q&A.

**RAG Chain**:
1. **Embed Query**: Generate embeddings for user question
2. **Vector Search**: Query ChromaDB for relevant chunks
3. **Synthesize**: Use LLM to generate answer from context

**Implementation**:
```python
def ask_document_question(question: str, conversation_id: int = None) -> Tuple[str, List[str]]:
    # 1. Generate embeddings
    embeddings = model.embed([question])
    
    # 2. Search ChromaDB
    results = collection.query(
        query_embeddings=embeddings,
        n_results=7,
        where={"conversation_id": conversation_id}  # Filter by conversation
    )
    
    # 3. Build context
    context = "\n---\n".join(results['documents'][0])
    
    # 4. Generate answer
    prompt = f"Based on this context, answer: {question}\n\nCONTEXT:\n{context}"
    answer = llm_client.generate(prompt)
    
    return answer, sources
```

---

### **`services/llm/factory.py`** - LLM Factory

**Purpose**: Factory pattern for LLM provider selection.

**Implementation**:
```python
class LLMFactory:
    _client_instance = None  # Singleton cache
    
    @staticmethod
    def get_client():
        if LLMFactory._client_instance is None:
            provider = settings.LLM_PROVIDER.lower()
            
            if provider == "groq":
                LLMFactory._client_instance = GroqClient()
            elif provider == "gemini":
                LLMFactory._client_instance = GeminiClient()
            elif provider == "huggingface":
                LLMFactory._client_instance = HuggingFaceClient()
        
        return LLMFactory._client_instance
```

**Usage**:
```python
from services.llm.factory import LLMFactory

llm = LLMFactory.get_client()
response = llm.generate(prompt)
```

---

### **`services/llm/groq.py`** - Groq Client

**Purpose**: Groq API client with payload size management.

**Key Features**:

1. **Payload Size Management**:
```python
MAX_PAYLOAD_SIZE = 28000  # 28KB (conservative limit)
payload_size = self._calculate_payload_size(payload)
if payload_size > MAX_PAYLOAD_SIZE:
    raise HTTPException(413, "Payload too large")
```

2. **Rate Limit Handling**:
- Detects 429 status codes
- Exponential backoff (2s, 4s, 6s)
- Automatic retry

3. **Error Handling**:
- Timeout handling (504 Gateway Timeout)
- HTTP error handling
- Maximum retries (3 attempts)

**API Endpoint**:
```
POST https://api.groq.com/openai/v1/chat/completions
```

**Models Supported**:
- `llama-3.1-8b-instant` (default)
- `llama-3.1-70b-versatile`
- `mixtral-8x7b-32768`
- `gemma2-9b-it`

---

### **`services/llm/gemini.py`** - Gemini Client

**Purpose**: Google Gemini API client with free tier optimization.

**Key Features**:

1. **Model Detection**:
```python
candidate_models = [
    "gemini-3-flash-preview",
    "gemini-2.5-flash-lite",
    "gemini-1.5-flash",
    "gemini-1.5-flash-8b",
    "gemini-2.0-flash-exp",
]

# Tests each model with 5-second cooldown
# Returns first working model
```

2. **Free Tier Optimization**:
- 5-second cooldown between model tests
- Prevents 429 RESOURCE_EXHAUSTED errors
- Progressive backoff on quota errors (30s, 60s, 90s)

3. **Error Handling**:
- Detects quota exhaustion (429, RESOURCE_EXHAUSTED)
- Automatic retry with backoff
- Graceful fallback messages

---

### **`chroma/collection.py`** - ChromaDB Management

**Purpose**: ChromaDB client and collection management.

**Key Features**:

1. **Singleton Client**:
```python
_client_instance = None

def get_chroma_client():
    global _client_instance
    if _client_instance is None:
        _client_instance = chromadb.PersistentClient(path="chroma_db")
    return _client_instance
```

2. **Collection Management**:
```python
def get_collection():
    client = get_chroma_client()
    collection_name = "document_store_v3"
    
    try:
        return client.get_or_create_collection(name=collection_name)
    except Exception as e:
        # Auto-recovery for dimension mismatches
        if "dimension" in str(e).lower():
            client.reset()
            return client.create_collection(name=collection_name)
```

3. **Dimension Mismatch Recovery**:
- Detects dimension/index errors
- Automatically resets database
- Creates new collection if reset fails

---

### **`models/mission_log.py`** - Database Model

**Purpose**: SQLAlchemy model for mission logs/reports.

**Schema**:
```python
class MissionLog(Base):
    __tablename__ = "mission_logs"
    
    id = Column(Integer, primary_key=True)
    conversation_id = Column(Integer, index=True)
    query = Column(String(255))
    response = Column(Text)  # Full report
    status = Column(String(50))  # COMPLETED, FAILED, PENDING, IN_PROGRESS
    created_at = Column(DateTime, default=datetime.utcnow)
```

**Usage**:
```python
from models import MissionLog

new_log = MissionLog(
    conversation_id=123,
    query="Market Intelligence Mission",
    response=report_text,
    status="COMPLETED"
)
db.add(new_log)
db.commit()
```

---

## 🔄 Data Flow

### Mission Execution Flow

```
User Request (POST /execute/stream)
    ↓
AgentService.process_mission()
    ↓
1. generate_plan() → LLM generates JSON plan
    ↓
2. Execute research tools (web_search, web_research)
    ├─→ scrape_web() → Playwright scraping
    ├─→ search_tool.search() → DuckDuckGo search
    └─→ Results added to intel_pool
    ↓
3. Truncate intel_pool (if too large)
    ├─→ _calculate_max_intel_pool_size()
    ├─→ _extract_price_summary() (if very large)
    └─→ _truncate_intel_pool() (preserves prices)
    ↓
4. Synthesize report
    ├─→ Format REPORT_SYNTHESIS_PROMPT
    ├─→ LLM.generate() → Final report
    └─→ _persist_to_memory()
        ├─→ ingest_document() → ChromaDB
        └─→ MissionLog → SQL Database
    ↓
5. Execute action tools (save_to_notion, dispatch_email)
    ↓
6. Return final report
```

### RAG Query Flow

```
User Question (GET /chat/ask?query=...)
    ↓
ask_document_question()
    ↓
1. Generate embeddings (Gemini text-embedding-004)
    ↓
2. Query ChromaDB
    ├─→ Filter by conversation_id
    └─→ Return top 7 relevant chunks
    ↓
3. Build context from chunks
    ↓
4. LLM.generate() with context + question
    ↓
5. Return answer + sources
```

### Document Ingestion Flow

```
Document Upload (POST /documents/upload)
    ↓
ingest_document()
    ↓
1. chunk_text() → Split into chunks
    ↓
2. Generate embeddings for each chunk
    ↓
3. Create metadata (title, conversation_id, timestamp)
    ↓
4. collection.add() → Store in ChromaDB
    ↓
5. Return chunks_ingested count
```

---

## 🎨 Architecture Patterns

### 1. **Factory Pattern** (LLM Providers)
- Single interface (`LLMClient`)
- Multiple implementations (Groq, Gemini, HuggingFace)
- Runtime selection based on config

### 2. **Singleton Pattern** (ChromaDB, LLM)
- Prevents re-initialization overhead
- Shared client instances
- Thread-safe access

### 3. **Dependency Injection** (FastAPI)
- `Depends(get_db)` for database sessions
- Automatic cleanup
- Testable components

### 4. **Async/Await Throughout**
- Non-blocking I/O operations
- Concurrent tool execution
- Better performance under load

### 5. **Error Handling Strategy**
- Try-catch at service boundaries
- Graceful degradation
- User-friendly error messages
- Logging for debugging

---

## 🔧 Environment Variables

Required in `.env`:

```bash
# Database
DATABASE_URL=postgresql://user:pass@host:5432/dbname

# LLM Provider (choose one)
LLM_PROVIDER=groq  # or "gemini" or "huggingface"
GROQ_API_KEY=your_groq_key
GEMINI_API_KEY=your_gemini_key
GROQ_MODEL_NAME=llama-3.1-8b-instant

# Integrations
RESEND_API_KEY=your_resend_key
NOTION_TOKEN=your_notion_token
NOTION_PAGE_ID=your_notion_page_id
EMAIL_USER=your_email@example.com
EMAIL_PASSWORD=your_email_password

# ChromaDB
CHROMA_SERVER_NO_ANALYTICS=True

# CORS
CORS_ALLOWED_ORIGINS=http://localhost:3000,https://yourdomain.com

# Timeouts
HTTP_REQUEST_TIMEOUT=30
LLM_REQUEST_TIMEOUT=60
SCRAPER_TIMEOUT=60
```

---

## 📦 Dependencies

**Core**:
- `fastapi` (0.115.0) - Web framework
- `uvicorn` (0.30.6) - ASGI server
- `sqlalchemy` (2.0.32) - ORM
- `pydantic-settings` (2.4.0) - Settings management

**AI/ML**:
- `chromadb` (>=1.4.0) - Vector database
- `google-genai` (>=1.56.0) - Gemini API
- `huggingface-hub` (0.24.5) - HuggingFace models
- `sentence-transformers` (>=3.0.0) - Embeddings

**Web Scraping**:
- `playwright` (1.46.0) - Browser automation
- `playwright-stealth` (1.0.6) - Anti-detection

**Search**:
- `ddgs` (>=9.10.0) - DuckDuckGo search
- `duckduckgo-search` (>=8.1.1) - Alternative search

**Integrations**:
- `resend` (2.0.0) - Email service
- `requests` (2.32.3) - HTTP client

**Database**:
- `psycopg2-binary` (2.9.9) - PostgreSQL driver
- `alembic` (>=1.17.2) - Database migrations

---

## 🚀 Key Patterns & Best Practices

### 1. **Async/Await**
All I/O operations use async/await:
```python
async def execute_tool(tool: str, args: Dict):
    if tool == "web_research":
        result = await scrape_web(url)
    elif tool == "web_search":
        loop = asyncio.get_running_loop()
        result = await loop.run_in_executor(None, search_tool.search, query)
```

### 2. **Error Handling**
- Try-catch at service boundaries
- Log errors with context
- Return user-friendly messages
- Continue execution when possible (tool failures don't stop mission)

### 3. **Payload Size Management**
- Calculate payload size before API calls
- Truncate intel pool intelligently
- Preserve critical data (prices) during truncation
- Raise 413 errors when limit exceeded

### 4. **Timeout Management**
- Multiple timeout layers (browser launch, page load, text extraction)
- Top-level timeout wrapper for entire operations
- Graceful fallback strategies
- Prevents infinite hangs

### 5. **Logging**
- Structured logging with context
- Color-coded for development
- Log levels: DEBUG, INFO, WARNING, ERROR, CRITICAL
- Include timestamps and service names

### 6. **Security**
- URL validation (SSRF protection)
- Input sanitization
- CORS configuration
- Environment variable secrets

### 7. **Performance**
- Connection pooling (database)
- Singleton pattern (ChromaDB, LLM)
- Background ingestion (non-blocking)
- Cached ChromaDB status

---

## 💡 Code Snippets You Can Copy

### **Creating a New Route**
```python
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from database import get_db

router = APIRouter(tags=["MyService"])

@router.get("/my-endpoint")
async def my_endpoint(db: Session = Depends(get_db)):
    # Your logic here
    return {"status": "ok"}
```

### **Using Agent Service**
```python
from services.agent_service import AgentService
from database import get_db

db = next(get_db())
agent = AgentService(db)

# Generate plan
plan = await agent.generate_plan("Analyze NVIDIA Blackwell")

# Execute tool
result = await agent.execute_tool("web_search", {"query": "NVIDIA H100 price"})

# Full mission
result = await agent.process_mission("Analyze market trends", conversation_id=123)
```

### **Using LLM**
```python
from services.llm.factory import LLMFactory

llm = LLMFactory.get_client()
response = llm.generate("Your prompt here")
```

### **Scraping Web**
```python
from services.scraper_service import scrape_web

result = await scrape_web("https://example.com", conversation_id=123)
```

### **Searching Web**
```python
from services.search_service import SearchService

search = SearchService()
results = search.search("NVIDIA H100 price 2025")
price_results = search.search_prices("NVIDIA H100", year=2025)
```

### **Ingesting Document**
```python
from services.document_service import ingest_document

chunks = ingest_document(
    title="Report_123",
    content="Full text content...",
    conversation_id=123
)
```

### **RAG Query**
```python
from services.ai_service import ask_document_question

answer, sources = ask_document_question(
    "What was the H100 pricing?",
    conversation_id=123
)
```

### **Database Operations**
```python
from models import MissionLog
from database import get_db

db = next(get_db())

# Create
new_log = MissionLog(
    conversation_id=123,
    query="Mission query",
    response="Report text",
    status="COMPLETED"
)
db.add(new_log)
db.commit()

# Query
logs = db.query(MissionLog).filter(MissionLog.status == "COMPLETED").all()
```

### **Streaming Response**
```python
from fastapi.responses import StreamingResponse
import json

async def generate_stream():
    yield json.dumps({"type": "progress", "step": 1, "total": 10}) + "\n"
    yield json.dumps({"type": "complete", "report": "..."}) + "\n"

return StreamingResponse(
    generate_stream(),
    media_type="application/x-ndjson"
)
```

### **URL Validation**
```python
from core.validators import validate_url

is_valid, error_msg = validate_url(url)
if not is_valid:
    raise HTTPException(400, detail=error_msg)
```

---

## 🐛 Common Issues & Solutions

### **Issue: ChromaDB dimension mismatch**
- **Solution**: Collection auto-resets on dimension errors
- **Prevention**: Use consistent embedding model

### **Issue: Payload too large (413)**
- **Solution**: Intel pool truncation with price preservation
- **Prevention**: Monitor intel pool size, adjust max_chars

### **Issue: Playwright timeout**
- **Solution**: Multiple timeout layers, graceful fallback
- **Prevention**: Adjust `SCRAPER_TIMEOUT` setting

### **Issue: LLM rate limits (429)**
- **Solution**: Automatic retry with exponential backoff
- **Prevention**: Use different provider, reduce request frequency

### **Issue: Database connection errors**
- **Solution**: Connection pooling with `pool_pre_ping=True`
- **Prevention**: Check `DATABASE_URL`, ensure database is running

### **Issue: CORS errors**
- **Solution**: Configure `CORS_ALLOWED_ORIGINS` in settings
- **Prevention**: Include frontend URL in allowed origins

---

## 📝 Summary

This backend is a **robust, production-ready FastAPI application** with:

✅ **ReAct pattern** for autonomous mission execution  
✅ **Dual-layer memory** (vector + SQL)  
✅ **Streaming responses** for real-time updates  
✅ **Multiple LLM providers** with factory pattern  
✅ **Stealth web scraping** with Playwright  
✅ **RAG capabilities** for document Q&A  
✅ **Comprehensive error handling** and logging  
✅ **Security features** (SSRF protection, URL validation)  
✅ **Performance optimizations** (connection pooling, singletons)  
✅ **Production-ready** (timeout management, graceful degradation)  

The codebase follows Python best practices, uses async/await throughout, and is well-structured for maintainability and scalability.
