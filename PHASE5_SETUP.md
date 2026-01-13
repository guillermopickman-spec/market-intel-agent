# Phase 5 Setup Guide - Market Intelligence Agent

This guide will help you set up the frontend and backend for Phase 5 deployment with mission execution support.

## Overview

Phase 5 enables non-streaming mission execution from the Agent Terminal. The frontend has been replaced with the MIA_VercelTest structure and now includes:
- ✅ Dashboard with real-time health and stats
- ✅ Reports page with mission logs
- ✅ Agent Terminal with mission execution (Phase 5)

## Prerequisites

- Node.js 18+ and npm
- Python 3.11+ (for backend)
- Git
- Vercel account (for frontend deployment)
- Render account (for backend deployment) or local backend setup

## 1. Frontend Setup (Local Development)

### Step 1: Install Dependencies

```bash
cd frontend
npm install
```

### Step 2: Create Environment File

Create `frontend/.env.local`:

```env
# Backend API URL (use your Render backend URL or localhost for development)
NEXT_PUBLIC_API_URL=http://localhost:8000

# Set to false to use real backend API (true for mock mode)
NEXT_PUBLIC_USE_MOCK_API=false
```

**For Local Development:**
- `NEXT_PUBLIC_API_URL=http://localhost:8000` (if backend runs locally)
- `NEXT_PUBLIC_USE_MOCK_API=false` (to test with real backend)

**For Testing with Mock Data:**
- `NEXT_PUBLIC_USE_MOCK_API=true` (no backend needed)

### Step 3: Run Development Server

```bash
npm run dev
```

The frontend will be available at `http://localhost:3000`

## 2. Backend Setup

### Step 1: Verify Backend is Running

Ensure your FastAPI backend is running and accessible. Check:

- **Health endpoint**: `http://localhost:8000/health` (or your Render URL)
- **Execute endpoint**: `http://localhost:8000/execute` (POST)
- **Reports endpoint**: `http://localhost:8000/reports` (GET)
- **Stats endpoint**: `http://localhost:8000/stats` (GET)

### Step 2: Verify CORS Configuration

The backend should already be configured to allow Vercel domains. Check `main.py`:

```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_origin_regex=r"https://.*\.vercel\.app",  # Allows all Vercel subdomains
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)
```

### Step 3: Environment Variables (Backend)

Ensure your backend has these environment variables set:

```env
# Database
DATABASE_URL=postgresql://...

# LLM Configuration
LLM_PROVIDER=groq  # or gemini, huggingface
GROQ_API_KEY=...
GEMINI_API_KEY=...
HF_API_TOKEN=...

# CORS (important for Vercel)
CORS_ALLOWED_ORIGINS=http://localhost:3000,https://*.vercel.app

# Other integrations (optional)
RESEND_API_KEY=...
NOTION_TOKEN=...
NOTION_PAGE_ID=...
```

## 3. Vercel Deployment Setup

### Step 1: Connect Repository to Vercel

1. Go to [vercel.com](https://vercel.com) and sign in
2. Click **"Add New..."** → **"Project"**
3. Import your GitHub repository
4. **Important**: Set **Root Directory** to `frontend`

### Step 2: Configure Build Settings

Vercel should auto-detect Next.js, but verify:
- **Framework Preset**: Next.js
- **Root Directory**: `frontend`
- **Build Command**: `npm run build` (default)
- **Output Directory**: `.next` (default)

### Step 3: Set Environment Variables in Vercel

Go to **Project Settings** → **Environment Variables** and add:

```
NEXT_PUBLIC_API_URL=https://your-backend-url.onrender.com
NEXT_PUBLIC_USE_MOCK_API=false
```

**Important Notes:**
- Replace `https://your-backend-url.onrender.com` with your actual Render backend URL
- Set `NEXT_PUBLIC_USE_MOCK_API=false` to use real backend
- These variables are public (NEXT_PUBLIC_*) so they're available in the browser

### Step 4: Deploy

1. Click **"Deploy"**
2. Wait for build to complete
3. Your app will be live at `https://your-project.vercel.app`

## 4. Testing Phase 5 Functionality

### Test Checklist

1. **Dashboard**
   - ✅ Navigate to `/` (Dashboard)
   - ✅ Verify health status shows real backend data
   - ✅ Verify stats show mission counts
   - ✅ Check for any error messages

2. **Reports Page**
   - ✅ Navigate to `/reports`
   - ✅ Verify reports load from backend
   - ✅ Check report details display correctly

3. **Agent Terminal (Phase 5)**
   - ✅ Navigate to `/agent`
   - ✅ Type a mission query (e.g., "Find NVIDIA H100 pricing")
   - ✅ Click "Send" or press Enter
   - ✅ Verify loading indicator appears
   - ✅ Wait for mission execution to complete
   - ✅ Verify report appears in message list
   - ✅ Check Reports page for new mission log entry

### Example Test Queries

- `"Find NVIDIA H100 GPU pricing"`
- `"What is the current market price for AMD MI300?"`
- `"Research Blackwell architecture specifications"`

## 5. Troubleshooting

### Frontend Issues

**Problem**: "NEXT_PUBLIC_API_URL is not configured"
- **Solution**: Set `NEXT_PUBLIC_API_URL` in `.env.local` (local) or Vercel environment variables (production)

**Problem**: "Cannot connect to backend"
- **Solution**: 
  - Verify backend is running and accessible
  - Check `NEXT_PUBLIC_API_URL` is correct
  - Test backend URL in browser: `{API_URL}/health`

**Problem**: "CORS error"
- **Solution**: 
  - Verify backend CORS allows your Vercel domain
  - Check `CORS_ALLOWED_ORIGINS` includes `https://*.vercel.app`
  - Verify `allow_origin_regex` in `main.py` includes Vercel pattern

### Backend Issues

**Problem**: Mission execution fails
- **Solution**: 
  - Check backend logs for errors
  - Verify LLM API keys are set correctly
  - Check database connection
  - Verify all required environment variables are set

**Problem**: Reports not showing
- **Solution**: 
  - Verify `/reports` endpoint returns data
  - Check database has mission logs
  - Verify frontend is calling correct endpoint

## 6. Development Workflow

### Local Development

1. **Start Backend** (in project root):
   ```bash
   uvicorn main:app --reload --port 8000
   ```

2. **Start Frontend** (in frontend directory):
   ```bash
   cd frontend
   npm run dev
   ```

3. **Test Locally**:
   - Frontend: `http://localhost:3000`
   - Backend: `http://localhost:8000`
   - API Docs: `http://localhost:8000/docs`

### Mock Mode Testing

To test frontend without backend:

1. Set `NEXT_PUBLIC_USE_MOCK_API=true` in `.env.local`
2. Frontend will use mock data from `mockApi.ts`
3. No backend connection needed

### Production Deployment

1. **Backend** (Render):
   - Already deployed on Render
   - Ensure CORS allows Vercel domain
   - Verify all environment variables are set

2. **Frontend** (Vercel):
   - Push changes to GitHub
   - Vercel auto-deploys on push
   - Set environment variables in Vercel dashboard
   - Verify deployment succeeds

## 7. Next Steps (Phase 6)

Phase 6 will add streaming mission execution:
- Real-time updates during mission execution
- Thinking steps displayed as they happen
- Tool execution progress
- Streaming endpoint: `/execute/stream`

## 8. File Structure

```
frontend/
├── app/
│   ├── agent/
│   │   └── page.tsx          # Agent Terminal (Phase 5)
│   ├── reports/
│   │   └── page.tsx           # Reports page
│   ├── page.tsx               # Dashboard
│   ├── layout.tsx             # Root layout with Navigation
│   ├── error.tsx              # Error boundary
│   ├── not-found.tsx          # 404 page
│   └── global-error.tsx       # Global error boundary
├── components/
│   └── Navigation.tsx         # Navigation component
├── lib/
│   ├── api.ts                 # API client
│   ├── queries.ts             # React hooks (includes useMissionExecution)
│   ├── mockApi.ts             # Mock API for testing
│   ├── apiTransformers.ts     # Backend response transformers
│   └── utils.ts               # Utility functions
├── package.json
├── vercel.json
└── .env.local                 # Local environment variables (not in git)
```

## 9. Environment Variables Reference

### Frontend (Vercel)

| Variable | Description | Example |
|----------|-------------|---------|
| `NEXT_PUBLIC_API_URL` | Backend API URL | `https://market-intel-agent.onrender.com` |
| `NEXT_PUBLIC_USE_MOCK_API` | Use mock API (true/false) | `false` |

### Backend (Render)

| Variable | Description | Required |
|----------|-------------|----------|
| `DATABASE_URL` | PostgreSQL connection string | Yes |
| `LLM_PROVIDER` | LLM provider (groq/gemini/huggingface) | Yes |
| `GROQ_API_KEY` | Groq API key (if using Groq) | Conditional |
| `GEMINI_API_KEY` | Gemini API key (for embeddings) | Yes |
| `CORS_ALLOWED_ORIGINS` | Allowed CORS origins | Yes |
| `RESEND_API_KEY` | Resend API key (optional) | No |
| `NOTION_TOKEN` | Notion API token (optional) | No |

## Support

If you encounter issues:
1. Check browser console for errors
2. Check Vercel deployment logs
3. Check Render backend logs
4. Verify all environment variables are set correctly
5. Test backend endpoints directly (e.g., `/health`, `/stats`)

---

**Phase 5 Status**: ✅ Complete
**Next Phase**: Phase 6 - Streaming Mission Execution
