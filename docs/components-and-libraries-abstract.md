# Market Intelligence Agent (MIA) v1.5.1 - Components & Libraries Abstract

> **Comprehensive documentation of all external libraries, internal components, and architectural elements used in the Market Intelligence Agent project.**

---

## Table of Contents

1. [External Libraries - Backend](#external-libraries---backend)
2. [External Libraries - Frontend](#external-libraries---frontend)
3. [Internal Components - Backend](#internal-components---backend)
4. [Internal Components - Frontend](#internal-components---frontend)
5. [Core Infrastructure](#core-infrastructure)
6. [Database & Storage](#database--storage)
7. [AI/ML Components](#aiml-components)
8. [Deployment & DevOps](#deployment--devops)

---

## External Libraries - Backend

### Web Framework & Server

#### **FastAPI 0.115.0**
- **Purpose**: Modern, high-performance Python web framework for building APIs
- **Usage**: Primary backend framework providing REST API endpoints, automatic OpenAPI documentation, async/await support, and Pydantic-based request/response validation
- **Key Features**: Type hints, dependency injection, automatic API documentation, WebSocket support

#### **Uvicorn 0.30.6**
- **Purpose**: Lightning-fast ASGI server implementation
- **Usage**: ASGI server running FastAPI application, handling HTTP/1.1 and WebSocket connections
- **Key Features**: High performance, async support, production-ready

#### **python-multipart 0.0.9**
- **Purpose**: File upload and multipart form data handling
- **Usage**: Enables FastAPI to handle file uploads and multipart form submissions
- **Key Features**: Multipart parsing, file handling

#### **Mangum >= 0.17.0**
- **Purpose**: ASGI to AWS Lambda adapter
- **Usage**: Enables deployment of FastAPI application to serverless environments (Vercel serverless functions)
- **Key Features**: Serverless compatibility, Lambda integration

---

### Database & ORM

#### **SQLAlchemy 2.0.32**
- **Purpose**: Python SQL toolkit and Object-Relational Mapping (ORM) library
- **Usage**: Database abstraction layer, model definitions, query building, session management
- **Key Features**: Declarative models, relationship mapping, query builder, connection pooling

#### **psycopg2-binary 2.9.9**
- **Purpose**: PostgreSQL database adapter for Python
- **Usage**: Low-level database driver connecting SQLAlchemy to PostgreSQL
- **Key Features**: Binary distribution, PostgreSQL protocol implementation

#### **Alembic >= 1.17.2**
- **Purpose**: Database migration tool for SQLAlchemy
- **Usage**: Version control for database schema, automatic migration generation, schema evolution
- **Key Features**: Migration tracking, rollback support, automatic diff generation

---

### AI/ML Libraries

#### **google-genai >= 1.56.0**
- **Purpose**: Official Google Generative AI SDK for Gemini models
- **Usage**: LLM inference via Gemini models (gemini-3-flash-preview) and embeddings (text-embedding-004)
- **Key Features**: Streaming support, embedding generation, multi-modal capabilities

#### **huggingface-hub 0.24.5**
- **Purpose**: Python client for Hugging Face Hub and Inference API
- **Usage**: Access to Hugging Face models (DeepSeek-V3) via cloud inference endpoints
- **Key Features**: Model inference, API integration, token management

#### **sentence-transformers >= 3.0.0**
- **Purpose**: Framework for sentence, text, and image embeddings
- **Usage**: Local embedding model support (all-MiniLM-L6-v2) as fallback option
- **Key Features**: Pre-trained models, local inference, embedding generation

#### **ChromaDB >= 1.4.0**
- **Purpose**: Open-source vector database for embeddings
- **Usage**: Persistent storage for RAG (Retrieval-Augmented Generation), conversation-isolated vector storage
- **Key Features**: Metadata filtering, similarity search, conversation isolation, persistent storage

---

### Web Automation & Scraping

#### **Playwright 1.46.0**
- **Purpose**: End-to-end browser automation framework
- **Usage**: Web scraping with Chromium browser, headless navigation, screenshot capture, dynamic content extraction
- **Key Features**: Multi-browser support, network interception, JavaScript execution, stealth capabilities

#### **playwright-stealth 1.0.6**
- **Purpose**: Anti-detection plugin for Playwright
- **Usage**: Bypasses bot detection mechanisms, mimics human browsing behavior
- **Key Features**: WebDriver property masking, fingerprint evasion, human-like interactions

---

### Search & HTTP

#### **duckduckgo-search >= 8.1.1**
- **Purpose**: DuckDuckGo search API wrapper
- **Usage**: Programmatic web search functionality for market intelligence gathering
- **Key Features**: Privacy-focused search, no API key required

#### **ddgs >= 9.10.0**
- **Purpose**: Alternative DuckDuckGo search client
- **Usage**: Additional search functionality and fallback option
- **Key Features**: Search result parsing, multiple result formats

#### **requests 2.32.3**
- **Purpose**: Python HTTP library for making API calls
- **Usage**: REST API communication, external service integration, HTTP requests
- **Key Features**: Session management, timeout handling, SSL verification

---

### Communication Services

#### **Resend 2.0.0**
- **Purpose**: Transactional email API service
- **Usage**: Email delivery for reports and notifications
- **Key Features**: SMTP alternative, reliable delivery, domain verification

---

### Configuration & Settings

#### **pydantic-settings 2.4.0**
- **Purpose**: Settings management using Pydantic models
- **Usage**: Environment variable loading, type validation, configuration schema definition
- **Key Features**: Type-safe settings, environment variable parsing, validation

#### **python-dotenv 1.0.1**
- **Purpose**: Load environment variables from .env files
- **Usage**: Local development configuration, environment variable management
- **Key Features**: .env file parsing, environment variable injection

---

## External Libraries - Frontend

### Core Framework

#### **Next.js 15.0.0**
- **Purpose**: React-based full-stack framework
- **Usage**: Frontend application framework with App Router, server-side rendering, API routes
- **Key Features**: App Router architecture, SSR/SSG, automatic code splitting, image optimization

#### **React 18.3.0**
- **Purpose**: JavaScript library for building user interfaces
- **Usage**: Component-based UI development, state management, virtual DOM rendering
- **Key Features**: Hooks, component composition, declarative UI

#### **React DOM 18.3.0**
- **Purpose**: React renderer for web browsers
- **Usage**: Renders React components to the DOM
- **Key Features**: Concurrent rendering, hydration

---

### Styling

#### **Tailwind CSS 3.4.0**
- **Purpose**: Utility-first CSS framework
- **Usage**: Rapid UI development with utility classes, custom dark theme (slate/zinc palette)
- **Key Features**: Responsive design, dark mode, custom configuration

#### **PostCSS 8.4.0**
- **Purpose**: CSS transformation tool
- **Usage**: Processes Tailwind CSS, applies plugins
- **Key Features**: Plugin ecosystem, CSS processing pipeline

#### **Autoprefixer 10.4.0**
- **Purpose**: PostCSS plugin to add vendor prefixes
- **Usage**: Automatically adds browser vendor prefixes to CSS
- **Key Features**: Browser compatibility, automatic prefixing

---

### UI Components & Utilities

#### **Lucide React 0.400.0**
- **Purpose**: Icon library for React
- **Usage**: Icon components throughout the UI
- **Key Features**: Tree-shakeable, customizable, consistent design

#### **class-variance-authority 0.7.0**
- **Purpose**: Component variant management utility
- **Usage**: Manages component variants (e.g., button sizes, styles) with type safety
- **Key Features**: Type-safe variants, composable API

#### **clsx 2.1.1**
- **Purpose**: Utility for constructing className strings conditionally
- **Usage**: Conditional CSS class application
- **Key Features**: Conditional classes, array/object support

#### **tailwind-merge 2.5.0**
- **Purpose**: Merge Tailwind CSS classes intelligently
- **Usage**: Resolves conflicting Tailwind classes, merges class strings
- **Key Features**: Conflict resolution, class merging

---

### Development Tools

#### **TypeScript 5.5.0**
- **Purpose**: Typed superset of JavaScript
- **Usage**: Type-safe frontend development, compile-time error checking
- **Key Features**: Static typing, type inference, modern JavaScript features

#### **ESLint 9.39.2**
- **Purpose**: JavaScript/TypeScript linter
- **Usage**: Code quality enforcement, error detection
- **Key Features**: Rule-based linting, extensible configuration

#### **eslint-config-next 16.1.1**
- **Purpose**: ESLint configuration for Next.js projects
- **Usage**: Pre-configured linting rules for Next.js best practices
- **Key Features**: Next.js-specific rules, React best practices

#### **@types/node 20.14.0**
- **Purpose**: TypeScript type definitions for Node.js
- **Usage**: Type safety for Node.js APIs in TypeScript
- **Key Features**: Complete Node.js API types

#### **@types/react 18.3.0**
- **Purpose**: TypeScript type definitions for React
- **Usage**: Type safety for React components and hooks
- **Key Features**: React component types, hook types

#### **@types/react-dom 18.3.0**
- **Purpose**: TypeScript type definitions for React DOM
- **Usage**: Type safety for React DOM APIs
- **Key Features**: DOM API types, React DOM types

---

## Internal Components - Backend

### Application Core

#### **main.py**
- **Purpose**: FastAPI application entry point and lifecycle management
- **Functionality**: 
  - Application initialization and lifespan management
  - CORS middleware configuration
  - Router registration (agent, chat, documents)
  - Health check endpoints (/health, /ready)
  - ChromaDB pre-initialization
  - Database schema synchronization
- **Key Features**: Lifespan context manager, health monitoring, graceful startup

---

### Routers (API Endpoints)

#### **routers/agent.py**
- **Purpose**: Agent mission execution endpoints
- **Functionality**: Handles agent mission requests, ReAct loop orchestration, streaming responses
- **Key Features**: Mission execution, tool selection, streaming NDJSON responses

#### **routers/chat.py**
- **Purpose**: Chat conversation management endpoints
- **Functionality**: Conversation CRUD operations, message handling, conversation history
- **Key Features**: RESTful API, conversation isolation, message persistence

#### **routers/documents.py**
- **Purpose**: Document management endpoints
- **Functionality**: Document upload, processing, RAG integration, document retrieval
- **Key Features**: File upload handling, document chunking, vector storage

---

### Services (Business Logic)

#### **services/agent_service.py**
- **Purpose**: Core agent orchestration and ReAct loop implementation
- **Functionality**: 
  - Mission planning and execution
  - Tool selection and invocation (scraper, RAG, search, Notion)
  - Iterative reasoning and action cycles
  - Mission log generation
- **Key Features**: ReAct architecture, tool integration, mission tracking

#### **services/ai_service.py**
- **Purpose**: AI/LLM service abstraction and orchestration
- **Functionality**: LLM provider management, prompt construction, response handling
- **Key Features**: Multi-provider support, streaming, error handling

#### **services/document_service.py**
- **Purpose**: Document processing and management
- **Functionality**: Document parsing, chunking, metadata extraction, storage
- **Key Features**: Multi-format support, chunking strategies, metadata management

#### **services/email_service.py**
- **Purpose**: Email delivery service
- **Functionality**: Email composition, sending via Resend API or SMTP, report delivery
- **Key Features**: Multi-provider support (Resend/SMTP), template support

#### **services/login_service.py**
- **Purpose**: Authentication and authorization
- **Functionality**: API key validation, user authentication
- **Key Features**: API key management, security validation

#### **services/notion_service.py**
- **Purpose**: Notion API integration
- **Functionality**: Notion page creation, content formatting, database operations
- **Key Features**: Notion API client, page management, content formatting

#### **services/rag_service.py**
- **Purpose**: Retrieval-Augmented Generation service
- **Functionality**: 
  - Vector similarity search in ChromaDB
  - Context retrieval for LLM prompts
  - Conversation-isolated context
- **Key Features**: Metadata filtering, conversation isolation, similarity search

#### **services/scraper_service.py**
- **Purpose**: Web scraping and content extraction
- **Functionality**: 
  - Playwright-based web scraping
  - Anti-detection measures
  - Dynamic content extraction
  - Pricing and specification extraction
- **Key Features**: Stealth scraping, JavaScript execution, screenshot capture

#### **services/search_service.py**
- **Purpose**: Web search orchestration
- **Functionality**: DuckDuckGo search integration, result parsing, search query management
- **Key Features**: Privacy-focused search, result formatting

---

### LLM Provider Implementations

#### **services/llm/base.py**
- **Purpose**: Abstract base class for LLM providers
- **Functionality**: Defines interface for LLM clients (streaming, completion, error handling)
- **Key Features**: Abstract methods, provider contract

#### **services/llm/factory.py**
- **Purpose**: Factory pattern for LLM provider instantiation
- **Functionality**: Creates appropriate LLM client based on configuration (Gemini, Groq, Hugging Face)
- **Key Features**: Singleton pattern, provider selection, lazy initialization

#### **services/llm/gemini.py**
- **Purpose**: Google Gemini LLM client implementation
- **Functionality**: Gemini API integration, streaming responses, model configuration
- **Key Features**: Streaming support, API key management

#### **services/llm/groq.py**
- **Purpose**: Groq LLM client implementation
- **Functionality**: Groq API integration (OpenAI-compatible), high-speed inference
- **Key Features**: Fast inference, multiple model support (llama-3.1, mixtral, gemma2)

#### **services/llm/huggingface.py**
- **Purpose**: Hugging Face Inference API client implementation
- **Functionality**: DeepSeek-V3 model integration, cloud inference
- **Key Features**: Inference API, token management

---

### Core Utilities

#### **core/settings.py**
- **Purpose**: Centralized configuration management
- **Functionality**: 
  - Environment variable loading
  - Type-safe settings with Pydantic
  - CORS configuration
  - API key management
  - Timeout configuration
- **Key Features**: Fail-fast validation, environment-based configuration

#### **core/logger.py**
- **Purpose**: Structured logging utility
- **Functionality**: Logger initialization, log formatting, log levels
- **Key Features**: Structured logging, log levels, context management

#### **core/prompts.py**
- **Purpose**: Prompt templates and system prompts
- **Functionality**: LLM prompt construction, system message templates, instruction formatting
- **Key Features**: Template management, prompt engineering

#### **core/rate_limiter.py**
- **Purpose**: Rate limiting utility
- **Functionality**: API rate limiting, request throttling
- **Key Features**: Rate limit enforcement, token bucket algorithm

#### **core/validators.py**
- **Purpose**: Data validation utilities
- **Functionality**: Input validation, data sanitization, type checking
- **Key Features**: Validation rules, error messages

---

### Database Models

#### **models/base.py**
- **Purpose**: SQLAlchemy base model and common functionality
- **Functionality**: Base class for all models, common fields (timestamps, IDs)
- **Key Features**: Declarative base, common attributes

#### **models/conversation.py**
- **Purpose**: Conversation data model
- **Functionality**: Represents chat conversations, relationships with messages
- **Key Features**: SQLAlchemy ORM, relationships, timestamps

#### **models/message.py**
- **Purpose**: Message data model
- **Functionality**: Represents individual messages within conversations
- **Key Features**: Foreign keys, content storage, metadata

#### **models/mission_log.py**
- **Purpose**: Mission execution log data model
- **Functionality**: Tracks agent mission execution, tool usage, reasoning steps
- **Key Features**: Mission tracking, tool logs, execution history

---

### Embeddings & Vector Processing

#### **embeddings/model.py**
- **Purpose**: Embedding model management
- **Functionality**: 
  - Gemini embedding client (text-embedding-004)
  - 768-dimensional vector generation
  - Singleton pattern for model reuse
- **Key Features**: High-performance embeddings, singleton instance, error handling

#### **embeddings/chunker.py**
- **Purpose**: Text chunking for RAG
- **Functionality**: Splits documents into chunks for embedding, maintains context
- **Key Features**: Chunking strategies, overlap handling, size management

---

### ChromaDB Integration

#### **chroma/client.py**
- **Purpose**: ChromaDB client initialization
- **Functionality**: Creates ChromaDB client with telemetry disabled
- **Key Features**: Telemetry configuration, client management

#### **chroma/collection.py**
- **Purpose**: ChromaDB collection management
- **Functionality**: Collection creation, metadata filtering, conversation isolation
- **Key Features**: Collection management, metadata queries, isolation

#### **chroma/chroma_telemetry_patch.py**
- **Purpose**: Patches ChromaDB telemetry to prevent errors
- **Functionality**: Disables ChromaDB analytics, prevents PostHog errors
- **Key Features**: Telemetry patching, error prevention

---

### Database Management

#### **database.py**
- **Purpose**: Database connection and session management
- **Functionality**: SQLAlchemy engine creation, session factory, connection pooling
- **Key Features**: Connection management, session handling, pool configuration

---

## Internal Components - Frontend

### Application Structure

#### **app/layout.tsx**
- **Purpose**: Root layout component
- **Functionality**: Global layout, metadata, navigation wrapper
- **Key Features**: Layout structure, global styles

#### **app/page.tsx**
- **Purpose**: Home page component
- **Functionality**: Landing page, application entry point
- **Key Features**: Home page UI

#### **app/agent/page.tsx**
- **Purpose**: Agent mission interface
- **Functionality**: Mission execution UI, streaming response display, mission controls
- **Key Features**: Real-time updates, streaming UI, mission management

#### **app/reports/page.tsx**
- **Purpose**: Reports viewing interface
- **Functionality**: Displays generated reports, report history
- **Key Features**: Report listing, report viewing

#### **app/error.tsx**
- **Purpose**: Error boundary component
- **Functionality**: Error handling, error display
- **Key Features**: Error boundaries, error UI

#### **app/not-found.tsx**
- **Purpose**: 404 page component
- **Functionality**: Not found page display
- **Key Features**: 404 handling

---

### UI Components

#### **components/Navigation.tsx**
- **Purpose**: Main navigation component
- **Functionality**: Navigation menu, route links, active state management
- **Key Features**: Responsive navigation, active states

#### **components/ui/badge.tsx**
- **Purpose**: Badge component (Shadcn/UI)
- **Functionality**: Status indicators, labels, tags
- **Key Features**: Variant support, styling

#### **components/ui/button.tsx**
- **Purpose**: Button component (Shadcn/UI)
- **Functionality**: Interactive buttons, various styles and sizes
- **Key Features**: Variants, sizes, disabled states

#### **components/ui/card.tsx**
- **Purpose**: Card component (Shadcn/UI)
- **Functionality**: Container component for content sections
- **Key Features**: Card layout, header/footer/content sections

#### **components/ui/input.tsx**
- **Purpose**: Input component (Shadcn/UI)
- **Functionality**: Text input fields, form inputs
- **Key Features**: Styling, validation states

#### **components/ui/scroll-area.tsx**
- **Purpose**: Scrollable area component (Shadcn/UI)
- **Functionality**: Custom scrollable containers
- **Key Features**: Custom scrollbars, overflow handling

#### **components/ui/skeleton.tsx**
- **Purpose**: Loading skeleton component (Shadcn/UI)
- **Functionality**: Loading state placeholders
- **Key Features**: Loading animations, placeholder UI

#### **components/ui/table.tsx**
- **Purpose**: Table component (Shadcn/UI)
- **Functionality**: Data tables, structured data display
- **Key Features**: Table layout, sorting, styling

#### **components/ui/textarea.tsx**
- **Purpose**: Textarea component (Shadcn/UI)
- **Functionality**: Multi-line text input
- **Key Features**: Resizable, validation states

---

### Frontend Libraries

#### **lib/api.ts**
- **Purpose**: API client and HTTP utilities
- **Functionality**: 
  - Centralized API calls
  - URL normalization
  - Error handling
  - Streaming support (NDJSON)
- **Key Features**: Type-safe API calls, error handling, streaming

#### **lib/apiTransformers.ts**
- **Purpose**: API response transformers
- **Functionality**: Transforms API responses to frontend data structures
- **Key Features**: Data transformation, type mapping

#### **lib/mockApi.ts**
- **Purpose**: Mock API for development/testing
- **Functionality**: Simulates API responses during development
- **Key Features**: Mock data, development support

#### **lib/queries.ts**
- **Purpose**: Data fetching queries
- **Functionality**: React Query or fetch utilities for data retrieval
- **Key Features**: Query management, caching

#### **lib/utils.ts**
- **Purpose**: Utility functions
- **Functionality**: Common helper functions, utilities
- **Key Features**: Reusable utilities, helper functions

#### **lib/validators.ts**
- **Purpose**: Frontend validation utilities
- **Functionality**: Form validation, input validation
- **Key Features**: Validation rules, error messages

---

### Configuration Files

#### **next.config.js**
- **Purpose**: Next.js configuration
- **Functionality**: Build configuration, environment variables, optimization settings
- **Key Features**: Build optimization, environment config

#### **tailwind.config.ts**
- **Purpose**: Tailwind CSS configuration
- **Functionality**: Custom theme, color palette, utility configuration
- **Key Features**: Dark theme, custom colors, responsive breakpoints

#### **tsconfig.json**
- **Purpose**: TypeScript configuration
- **Functionality**: TypeScript compiler options, path aliases, strict mode
- **Key Features**: Type checking, path resolution

#### **vercel.json**
- **Purpose**: Vercel deployment configuration
- **Functionality**: Deployment settings, routing, serverless function configuration
- **Key Features**: Deployment config, routing rules

---

## Core Infrastructure

### Package Management

#### **Poetry** (Python)
- **Purpose**: Python dependency management
- **Usage**: Manages Python dependencies via pyproject.toml and poetry.lock
- **Key Features**: Dependency resolution, lock files, virtual environment management

#### **npm** (Node.js)
- **Purpose**: Node.js package manager
- **Usage**: Manages frontend dependencies via package.json and package-lock.json
- **Key Features**: Dependency installation, script execution, version management

---

### Build & Development Tools

#### **Docker**
- **Purpose**: Containerization platform
- **Usage**: Multi-stage builds, containerized deployment, environment consistency
- **Key Features**: Containerization, layer caching, health checks

#### **Dockerfile**
- **Purpose**: Docker image definition
- **Usage**: Defines container build process, dependencies, runtime configuration
- **Key Features**: Multi-stage builds, optimization, security

#### **docker-compose.yml**
- **Purpose**: Multi-container orchestration
- **Usage**: Local development environment, service composition
- **Key Features**: Service definition, networking, volumes

---

## Database & Storage

### Relational Database

#### **PostgreSQL**
- **Purpose**: Primary relational database
- **Usage**: Stores conversations, messages, mission logs, application data
- **Key Features**: ACID compliance, relational queries, JSON support

### Vector Database

#### **ChromaDB**
- **Purpose**: Vector database for embeddings
- **Usage**: Stores document embeddings, enables similarity search for RAG
- **Key Features**: Metadata filtering, conversation isolation, persistent storage

---

## AI/ML Components

### LLM Providers

#### **Google Gemini**
- **Models**: gemini-3-flash-preview (LLM), text-embedding-004 (embeddings)
- **Usage**: Primary LLM and embedding provider
- **Key Features**: Multi-modal, streaming, high-quality embeddings

#### **Groq**
- **Models**: llama-3.1-8b-instant, llama-3.1-70b-versatile, mixtral-8x7b-32768, gemma2-9b-it
- **Usage**: High-speed inference alternative
- **Key Features**: Fast inference, OpenAI-compatible API

#### **Hugging Face**
- **Models**: deepseek-ai/DeepSeek-V3
- **Usage**: Cloud inference alternative
- **Key Features**: Inference API, model hosting

### Embedding Models

#### **Gemini text-embedding-004**
- **Dimensions**: 768
- **Usage**: Primary embedding model for RAG
- **Key Features**: High-quality embeddings, cloud-based

#### **Sentence Transformers all-MiniLM-L6-v2**
- **Dimensions**: 384
- **Usage**: Fallback local embedding model
- **Key Features**: Local inference, lightweight

---

## Deployment & DevOps

### Cloud Platforms

#### **Render**
- **Purpose**: Backend hosting platform
- **Usage**: Hosts FastAPI backend, PostgreSQL database
- **Key Features**: Docker deployment, auto-scaling, managed PostgreSQL

#### **Vercel**
- **Purpose**: Frontend hosting platform
- **Usage**: Hosts Next.js frontend, serverless functions
- **Key Features**: Edge network, automatic deployments, serverless functions

#### **Neon.tech**
- **Purpose**: PostgreSQL database hosting (alternative)
- **Usage**: Managed PostgreSQL database service
- **Key Features**: Serverless PostgreSQL, branching, auto-scaling

---

### Configuration Files

#### **render.yaml**
- **Purpose**: Render deployment configuration
- **Usage**: Defines services, databases, environment variables for Render
- **Key Features**: Infrastructure as code, service definitions

#### **.vercelignore**
- **Purpose**: Vercel deployment ignore patterns
- **Usage**: Excludes files from Vercel deployment
- **Key Features**: Deployment optimization

#### **.gitignore**
- **Purpose**: Git ignore patterns
- **Usage**: Excludes files from version control
- **Key Features**: Security, build artifacts

---

## Architecture Patterns

### Design Patterns

- **Factory Pattern**: LLM provider factory (services/llm/factory.py)
- **Singleton Pattern**: Embedding model, LLM client instances
- **Repository Pattern**: Database abstraction via SQLAlchemy
- **Service Layer Pattern**: Business logic separation in services/
- **Dependency Injection**: FastAPI dependency system

### AI Patterns

- **ReAct (Reasoning + Acting)**: Agent architecture with iterative reasoning
- **RAG (Retrieval-Augmented Generation)**: Context enhancement via vector search
- **Streaming Responses**: Real-time LLM output (NDJSON format)
- **Multi-Provider Support**: Abstraction over multiple LLM providers

---

## Summary Statistics

- **Total External Libraries**: ~35
- **Backend Python Libraries**: ~20
- **Frontend JavaScript/TypeScript Libraries**: ~15
- **Internal Backend Components**: ~25
- **Internal Frontend Components**: ~15
- **Database Systems**: 2 (PostgreSQL, ChromaDB)
- **LLM Providers**: 3 (Gemini, Groq, Hugging Face)
- **Deployment Platforms**: 2 (Render, Vercel)
- **Programming Languages**: 3 (Python, TypeScript, JavaScript)

---

*Last Updated: Based on project state as of v1.5.1*
