# Local Testing Guide

## ✅ Build Test - PASSED

The frontend has been successfully tested and builds without errors.

## Quick Start

### 1. Install Dependencies (if not already done)
```bash
cd frontend
npm install
```

### 2. Create Environment File
Create `frontend/.env.local`:
```env
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_USE_MOCK_API=true
```

### 3. Start Development Server
```bash
cd frontend
npm run dev
```

The frontend will be available at: **http://localhost:3000**

## Testing Checklist

### With Mock API (No Backend Needed)
1. Set `NEXT_PUBLIC_USE_MOCK_API=true` in `.env.local`
2. Start dev server: `npm run dev`
3. Open http://localhost:3000
4. Test:
   - ✅ Dashboard loads with mock data
   - ✅ Reports page shows mock reports
   - ✅ Agent Terminal works with mock responses

### With Real Backend
1. Ensure backend is running on `http://localhost:8000`
2. Set `NEXT_PUBLIC_USE_MOCK_API=false` in `.env.local`
3. Set `NEXT_PUBLIC_API_URL=http://localhost:8000`
4. Start dev server: `npm run dev`
5. Test:
   - ✅ Dashboard shows real health/stats
   - ✅ Reports page shows real mission logs
   - ✅ Agent Terminal can execute real missions

## Build Test
```bash
cd frontend
npm run build
```

Expected output: ✅ Build successful with no errors

## Fixed Issues

1. ✅ Removed unused `providers.tsx` (was using React Query not in dependencies)
2. ✅ Removed old component directories (agent/, dashboard/, reports/) that referenced missing dependencies
3. ✅ Installed ESLint for Next.js
4. ✅ Build completes successfully

## Available Routes

- `/` - Dashboard
- `/agent` - Agent Terminal (Phase 5)
- `/reports` - Reports page

## Notes

- The frontend uses mock API by default (set in `.env.local`)
- To test with real backend, ensure backend is running and set `NEXT_PUBLIC_USE_MOCK_API=false`
- All pages should load without errors
- Agent Terminal supports mission execution (Phase 5)
