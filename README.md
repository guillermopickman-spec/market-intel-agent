# 🤖 Autonomous Market Intelligence Agent

A state-of-the-art autonomous research agent built with **FastAPI**. This agent uses a **ReAct (Reasoning + Acting)** architecture to browse the web, extract data via **RAG (Retrieval-Augmented Generation)**, and automate business reporting.



## 🌟 Core Features
- **Autonomous Mission Execution**: Give the agent a high-level goal, and it decides which tools to use.
- **Isolated RAG Memory**: Uses **ChromaDB** with metadata filtering to ensure conversation context never leaks between different users/IDs.
- **Live Web Research**: Powered by **Playwright** to scrape and ingest real-time data from any URL.
- **Automated Deliverables**:
  - **Notion**: Automatically creates structured intelligence reports.
  - **Email**: Dispatches summaries to stakeholders via SMTP.

## 🛠️ Tech Stack
- **Backend**: FastAPI (Python 3.11+)
- **Intelligence**: DeepSeek-V3 via Hugging Face Inference API.
- **Storage**: PostgreSQL (SQLAlchemy) & ChromaDB (Vector Store).
- **Automation**: Playwright, Notion API, SMTP.
- **Infrastructure**: Docker & Render.



## 🏗️ System Architecture
The agent operates in a closed loop:
1. **Perception**: Receives a mission from the user.
2. **Reasoning**: The LLM determines the next step (e.g., "I need to find the CEO's name").
3. **Action**: Executes a tool (Scraper, Notion, or Email).
4. **Learning**: Ingests new findings into ChromaDB to inform the next step.



## 🚀 Getting Started

### 1. Prerequisites
- Docker installed.
- API Keys: Hugging Face (Token), Notion (Internal Integration Secret).

### 2. Setup Environment (`.env`)
```env
DATABASE_URL=postgresql://user:pass@localhost:5432/market_db
HF_API_TOKEN=your_huggingface_token
NOTION_TOKEN=your_notion_token
NOTION_PAGE_ID=your_parent_page_id
EMAIL_SENDER=your_email@gmail.com
EMAIL_PASSWORD=your_app_specific_password

📂 Project Structure
Plaintext

market-intel-agent/
├── core/               # Agent logic and ReAct loop
├── chroma/             # Vector database configuration
├── embeddings/         # Lightweight FastEmbed implementation
├── models/             # Database schemas (SQLAlchemy/Pydantic)
├── services/           # Business logic (AI, Scraper, Notion, SMTP)
├── routers/            # FastAPI endpoints
├── main.py             # Application entry point
├── Dockerfile          # Container configuration
└── requirements.txt    # Optimized dependencies

📦 Deployment & Execution
Running locally with Docker
Build the image:

Bash

docker build -t market-intel-agent .
Launch the container:

Bash

docker run -p 8000:8000 --env-file .env market-intel-agent
Access the API: Open http://localhost:8000/docs to interact with the Swagger UI.

🧠 Advanced RAG Implementation
Unlike standard implementations, this agent uses Context Isolation:

Vectorization: Powered by FastEmbed (BGE-Small), providing high-performance embeddings without the heavy footprint of PyTorch.

Filtering: Every chunk stored in ChromaDB is tagged with a conversation_id.

Retrieval: The agent only "remembers" information relevant to the current session, preventing data leakage between different research missions.

🚦 API Endpoints
POST /agent/mission: Trigger a full autonomous research cycle.

POST /ingest/url: Manually feed a URL into the agent's memory.

GET /health: Check system and database status.

📝 Usage Example: The Research Mission
To start an autonomous research task, send a POST request to /agent/mission:

Request Body:

JSON

{
  "mission": "Research the latest reusable rocket milestones from SpaceX and create a summary report in Notion.",
  "conversation_id": 101,
  "recipient_email": "stakeholder@example.com"
}
What happens under the hood:

Search: The agent identifies it needs data and triggers Playwright.

Ingest: Scraped content is chunked and embedded into ChromaDB.

Reason: The agent queries the local RAG to synthesize the "milestones."

Deliver: A new page is formatted in Notion, and a confirmation email is sent.

🛠️ Troubleshooting & Development
Database: By default, it uses a local volume for ChromaDB. For production, ensure DATABASE_URL points to a persistent PostgreSQL instance.

Type Safety: This project uses strict Pylance type-hinting and cast operations to ensure data integrity during vector operations.

Memory: The container is optimized to run on 512MB RAM, making it compatible with Render's Free Tier.

📜 License
Distributed under the MIT License. See LICENSE for more information.