# Vercel Setup Guide - Critical Settings

## ⚠️ IMPORTANT: Framework Setting

**The framework in Vercel MUST be set to: `Next.js` (NOT FastAPI)**

### Why?

- **Vercel** = Frontend deployment (Next.js)
- **Render** = Backend deployment (FastAPI/Python)

Vercel should ONLY build and deploy the Next.js frontend. The FastAPI backend runs separately on Render.

## Vercel Project Settings

### 1. Framework Preset
- **Set to: `Next.js`** ✅
- **NOT: FastAPI** ❌
- **NOT: Other** ❌

### 2. Root Directory (CRITICAL!)
- **Set to: `frontend`** ✅
- This tells Vercel to only look at the `frontend/` directory
- This prevents Vercel from detecting Python files and trying to build the backend

### 3. Build Settings
- **Build Command**: `npm run build` (default - leave as is)
- **Output Directory**: `.next` (default - leave as is)
- **Install Command**: `npm install` (default - leave as is)

### 4. Environment Variables

Go to **Settings** → **Environment Variables** and add:

```
NEXT_PUBLIC_API_URL=https://your-backend-url.onrender.com
NEXT_PUBLIC_USE_MOCK_API=false
```

Replace `https://your-backend-url.onrender.com` with your actual Render backend URL.

## Common Issues & Solutions

### Issue: "Poetry error" or "Python build error"
**Solution**: 
1. Verify **Root Directory** is set to `frontend`
2. Verify **Framework Preset** is `Next.js`
3. The `.vercelignore` file should help, but Root Directory is the key fix

### Issue: "Cannot find module" or "Build fails"
**Solution**:
1. Check that **Root Directory** is `frontend`
2. Verify `package.json` exists in `frontend/` directory
3. Check build logs - should show `npm install`, not `poetry install`

### Issue: "Framework not detected"
**Solution**:
1. Manually set **Framework Preset** to `Next.js`
2. Ensure `frontend/package.json` has Next.js as a dependency
3. Verify **Root Directory** is `frontend`

## Step-by-Step Vercel Configuration

1. **Go to Vercel Dashboard** → Your Project → **Settings**

2. **General Settings**:
   - Framework Preset: **Next.js**
   - Root Directory: **frontend** ⚠️ MOST IMPORTANT
   - Build Command: `npm run build` (default)
   - Output Directory: `.next` (default)

3. **Environment Variables**:
   - `NEXT_PUBLIC_API_URL` = Your Render backend URL
   - `NEXT_PUBLIC_USE_MOCK_API` = `false`

4. **Deploy**:
   - Click "Redeploy" or push to GitHub (auto-deploy)

## Verification Checklist

After deployment, check build logs:
- ✅ Should see: `npm install`
- ✅ Should see: `npm run build`
- ❌ Should NOT see: `poetry install`
- ❌ Should NOT see: `python` or `pip`

## Architecture Overview

```
┌─────────────────┐         ┌─────────────────┐
│   Vercel        │         │   Render        │
│   (Frontend)    │────────▶│   (Backend)     │
│                 │  HTTP   │                 │
│   Next.js       │  API    │   FastAPI       │
│   React         │  Calls  │   Python        │
└─────────────────┘         └─────────────────┘
```

- **Vercel**: Serves the Next.js frontend to users
- **Render**: Runs the FastAPI backend API
- **Connection**: Frontend calls backend via `NEXT_PUBLIC_API_URL`

## If Still Having Issues

1. **Delete the Vercel project** and recreate it
2. **Set Root Directory to `frontend`** from the start
3. **Set Framework to Next.js** from the start
4. **Add environment variables** before first deploy
5. **Check build logs** - they should only show Node.js/npm commands

---

**Remember**: Vercel = Next.js Frontend | Render = FastAPI Backend
