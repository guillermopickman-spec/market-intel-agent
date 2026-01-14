# Market Intelligence Agent (MIA) v1.3 - Technology Stack Abstract

## Overview
This document provides a comprehensive list of all languages, frameworks, libraries, services, and technologies used in the Market Intelligence Agent project.

---

## Programming Languages

### Primary Languages
- **Python 3.11+** - Backend development (FastAPI, data processing, AI/ML)
- **TypeScript 5.5.0** - Frontend development (type-safe JavaScript)
- **JavaScript (ES2017+)** - Frontend runtime and build tooling

### Template/Markup Languages
- **TSX/JSX** - React component syntax
- **SQL** - Database queries (via SQLAlchemy ORM)
- **JSON** - Data serialization and API communication

---

## Frontend Technologies

### Core Framework
- **Next.js 15.0.0** - React-based full-stack framework
  - App Router architecture
  - Server-side rendering (SSR)
  - API routes
  - Built-in optimizations
- **React 18.3.0** - UI component library
- **React DOM 18.3.0** - React renderer for browsers

### Styling
- **Tailwind CSS 3.4.0** - Utility-first CSS framework
  - Custom dark theme (slate/zinc palette)
  - Responsive design utilities
- **PostCSS 8.4.0** - CSS processing
- **Autoprefixer 10.4.0** - CSS vendor prefixing

### UI Components & Utilities
- **Lucide React 0.400.0** - Icon library
- **class-variance-authority 0.7.0** - Component variant management
- **clsx 2.1.1** - Conditional class name utility
- **tailwind-merge 2.5.0** - Tailwind class merging utility
- **Shadcn/UI** - Component system (inferred from component structure)

### Type Definitions
- **@types/node 20.14.0** - Node.js TypeScript definitions
- **@types/react 18.3.0** - React TypeScript definitions
- **@types/react-dom 18.3.0** - React DOM TypeScript definitions

### Code Quality
- **ESLint 9.39.2** - JavaScript/TypeScript linter
- **eslint-config-next 16.1.1** - Next.js ESLint configuration

---

## Backend Technologies

### Web Framework
- **FastAPI 0.115.0** - Modern Python web framework
  - Async/await support
  - Automatic OpenAPI/Swagger documentation
  - Type validation with Pydantic
  - Dependency injection system

### ASGI Server
- **Uvicorn 0.30.6** - Lightning-fast ASGI server
  - ASGI protocol implementation
  - HTTP/1.1 and WebSocket support

### Request Handling
- **python-multipart 0.9** - File upload support for FastAPI

---

## AI/ML Libraries & Services

### LLM Providers (Multi-Provider Support)
- **Google Gemini** (google-genai >= 1.56.0)
  - Model: gemini-3-flash-preview`n  - Text generation API
  - Embeddings: 	ext-embedding-004 (768 dimensions)
  
- **Groq** (via OpenAI-compatible API)
  - Models: llama-3.1-8b-instant, llama-3.1-70b-versatile, mixtral-8x7b-32768, gemma2-9b-it`n  - High-speed inference
  
- **Hugging Face Inference API** (huggingface-hub 0.24.5)
  - Model: deepseek-ai/DeepSeek-V3`n  - Cloud inference endpoints

### Embeddings
- **Sentence Transformers 3.0.0+** - Local embedding models
  - Model: sentence-transformers/all-MiniLM-L6-v2 (768 dimensions)
- **Gemini Embeddings** - Cloud-based embeddings (text-embedding-004)

### Vector Database
- **ChromaDB >= 1.4.0** - Vector database for RAG (Retrieval-Augmented Generation)
  - Persistent storage
  - Metadata filtering
  - Conversation isolation

---

## Databases & Storage

### Relational Database
- **PostgreSQL** - Primary relational database
  - Managed via Neon.tech or Render PostgreSQL
  - Used for conversations, messages, mission logs

### Database ORM
- **SQLAlchemy 2.0.32** - Python SQL toolkit and ORM
  - Declarative models
  - Session management
  - Query builder

### Database Driver
- **psycopg2-binary 2.9.9** - PostgreSQL adapter for Python

### Database Migrations
- **Alembic >= 1.17.2** - Database migration tool
  - Version control for schema
  - Automatic migration generation

---

## Web Automation & Scraping

### Browser Automation
- **Playwright 1.46.0** - End-to-end browser automation
  - Chromium browser engine
  - Headless and headed modes
  - Screenshot and PDF generation
  - Network interception

### Stealth Technology
- **playwright-stealth 1.0.6** - Anti-detection plugin
  - Mimics human behavior
  - Bypasses bot detection
  - WebDriver property masking

---

## Search & Web Services

### Search APIs
- **duckduckgo-search >= 8.1.1** - DuckDuckGo search integration
- **ddgs >= 9.10.0** - DuckDuckGo search client

### HTTP Client
- **Requests 2.32.3** - Python HTTP library
  - REST API calls
  - Session management
  - Timeout handling

---

## Communication & Integration Services

### Email Service
- **Resend 2.0.0** - Transactional email API
  - SMTP alternative
  - Email delivery service

### Productivity Platform
- **Notion API** (via custom integration)
  - Page creation
  - Content management
  - Database operations

### Email Backend (Alternative)
- Built-in SMTP support for Gmail/other providers
  - App password authentication
  - Email sending functionality

---

## Configuration & Settings

### Settings Management
- **Pydantic Settings 2.4.0** - Settings management
  - Environment variable loading
  - Type validation
  - Configuration schemas

### Environment Management
- **python-dotenv 1.0.1** - .env file support
  - Environment variable loading
  - Local development configuration

---

## Deployment & Infrastructure

### Containerization
- **Docker** - Container platform
  - Multi-stage builds
  - Layer caching
  - Health checks
  - Base image: Python 3.11-slim-bookworm

### Cloud Platforms
- **Render** - Backend hosting
  - Docker-based deployment
  - PostgreSQL managed service
  - Environment variable management
  - Auto-scaling
  - Region: Oregon
  
- **Vercel** - Frontend hosting
  - Next.js optimization
  - Edge network
  - Serverless functions support
  - Region: iad1 (US East)
  
- **Neon.tech** - PostgreSQL database (alternative to Render PostgreSQL)

### Container Registry
- **GitHub Container Registry** (inferred from Docker usage)

---

## Development Tools & Build Systems

### Python Package Management
- **Poetry** - Dependency management
  - Lock file (poetry.lock)
  - Dependency resolution
  - Virtual environment management (disabled in Docker)

### Node.js Package Management
- **npm** - Node.js package manager
  - Dependency installation
  - Script execution

### Build Tools
- **Docker BuildKit** - Advanced Docker build features
  - Cache mounts
  - Parallel builds
  - Build optimization

---

## Additional Python Libraries

### Validation
- **Pydantic** (via FastAPI) - Data validation
  - Type checking
  - Schema validation
  - Serialization

### Serverless Support
- **Mangum >= 0.17.0** - ASGI to AWS Lambda adapter
  - Serverless deployment support

---

## Security & Authentication

### CORS
- **FastAPI CORS Middleware** - Cross-Origin Resource Sharing
  - Configurable allowed origins
  - Credential support

### API Keys
- Multi-provider API key management
  - Environment-based configuration
  - Secure storage

---

## Architecture Patterns

### Design Patterns
- **Factory Pattern** - LLM provider factory (services/llm/factory.py)
- **Dependency Injection** - FastAPI dependency system
- **Repository Pattern** - Database abstraction
- **Service Layer Pattern** - Business logic separation

### AI Patterns
- **ReAct (Reasoning + Acting)** - Agent architecture
- **RAG (Retrieval-Augmented Generation)** - Context enhancement
- **Streaming Responses** - Real-time LLM output (NDJSON format)

---

## Project Structure Features

### Backend Structure
- **Modular Routers** - FastAPI router pattern
- **Service Layer** - Business logic separation
- **Model Layer** - SQLAlchemy ORM models
- **Core Utilities** - Settings, logging, validators

### Frontend Structure
- **App Router** - Next.js 13+ app directory structure
- **Component-Based** - React component architecture
- **Type Safety** - TypeScript throughout
- **API Client** - Centralized API utilities
  - URL normalization
  - Error handling
  - Streaming support (NDJSON)

---

## API Communication

### Protocols
- **REST API** - HTTP/HTTPS
- **JSON** - Data serialization
- **WebSocket** (via Uvicorn) - Real-time communication support

### API Features
- **Streaming Responses** - Server-sent events (SSE) / NDJSON
- **File Upload** - Multipart form data
- **Pagination** - Cursor-based pagination
- **Error Handling** - Standardized error responses

---

## Code Quality & Standards

### Type Safety
- **TypeScript** - Static type checking
- **Pydantic** - Runtime type validation
- **Type Hints** - Python type annotations

### Code Standards
- **ESLint** - JavaScript/TypeScript linting
- **Strict Mode** - TypeScript strict checking
- **PEP 8** (implicit) - Python code style

---

## Browser Support

### Target Browsers
- **Modern Browsers** - Chrome, Firefox, Safari, Edge
- **ES2017+** - JavaScript standard
- **CSS Grid/Flexbox** - Modern CSS features

---

## Monitoring & Observability

### Logging
- **Python Logging** - Built-in logging module
- **Structured Logging** - Custom logger implementation

### Health Checks
- **Health Endpoints** - /health and /ready`n- **Docker Healthcheck** - Container health monitoring

---

## System Requirements

### Runtime
- **Python 3.11+**
- **Node.js** (for frontend development)
- **PostgreSQL 12+**

### System Dependencies (Docker)
- **Debian Bookworm** (Python base image)
- **Build Tools** - build-essential, libpq-dev
- **Chromium** - Playwright browser

---

## Documentation

### API Documentation
- **OpenAPI/Swagger** - Auto-generated via FastAPI
- **Interactive Docs** - FastAPI UI

### Code Documentation
- **TypeScript JSDoc** - Type annotations
- **Python Docstrings** - Function documentation

---

## Summary Statistics

- **Programming Languages**: 3 (Python, TypeScript, JavaScript)
- **Major Frameworks**: 2 (FastAPI, Next.js)
- **AI/ML Providers**: 3 (Gemini, Groq, Hugging Face)
- **Database Systems**: 2 (PostgreSQL, ChromaDB)
- **Deployment Platforms**: 2 (Render, Vercel)
- **Total Python Dependencies**: ~20
- **Total Frontend Dependencies**: ~15
- **Containerization**: Docker
- **Package Managers**: Poetry, npm

---

*Last Updated: Based on project state as of v1.5*
