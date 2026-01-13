# Vercel Deployment Fix - Poetry Error

## Problem
Vercel is trying to build Python/backend files when it should only build the Next.js frontend, causing Poetry errors.

## Solution

### Option 1: Set Root Directory in Vercel Dashboard (RECOMMENDED)

1. Go to your Vercel project settings
2. Navigate to **Settings** → **General**
3. Find **Root Directory** setting
4. Set it to: `frontend`
5. Save and redeploy

This tells Vercel to only look at the `frontend/` directory and ignore everything else.

### Option 2: Use .vercelignore (Already Added)

A `.vercelignore` file has been created in the root directory that tells Vercel to ignore all Python/backend files. This should work automatically.

### Option 3: Manual Configuration

If the above doesn't work, manually configure in Vercel dashboard:

1. Go to **Settings** → **General**
2. Set these values:
   - **Root Directory**: `frontend`
   - **Framework Preset**: `Next.js`
   - **Build Command**: `npm run build` (or leave default)
   - **Output Directory**: `.next` (or leave default)
   - **Install Command**: `npm install` (or leave default)

3. Go to **Settings** → **Environment Variables**
   - Add: `NEXT_PUBLIC_API_URL` = your backend URL
   - Add: `NEXT_PUBLIC_USE_MOCK_API` = `false`

## Verification

After deploying, check:
1. Build logs should show only Node.js/npm commands
2. No Poetry or Python-related errors
3. Build completes successfully
4. Frontend is accessible

## If Still Having Issues

1. **Delete and recreate the Vercel project** with Root Directory set to `frontend` from the start
2. **Check build logs** - they should start with `npm install` not `poetry install`
3. **Verify .vercelignore** is in the root directory and committed to git

## Files Changed

- ✅ Created `.vercelignore` to ignore Python files
- ✅ Simplified `frontend/vercel.json` to basic Next.js config
