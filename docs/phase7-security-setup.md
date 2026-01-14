# Phase 7 Security Setup Guide

This guide explains how to manually configure the security features added in Phase 7: API key authentication, rate limiting, input validation, and request logging.

---

## Overview

Phase 7 adds minimal security measures to prevent abuse:
- **API Key Authentication**: Optional shared secret between frontend and backend
- **Rate Limiting**: 10 requests per hour per IP address (in-memory)
- **Input Validation**: Validates mission input length and blocks dangerous patterns
- **Request Logging**: Logs all security-relevant information

**Important**: All security features are **backward compatible**. If you don't set `API_KEY`, authentication is skipped and the system works as before.

---

## Step 1: Generate an API Key

Generate a secure random string to use as your API key. You can use any of these methods:

### Option A: Using Python
```bash
python -c "import secrets; print(secrets.token_urlsafe(32))"
```

### Option B: Using OpenSSL
```bash
openssl rand -hex 32
```

### Option C: Using Online Generator
Visit: https://www.random.org/strings/ (generate a 32+ character random string)

**Example API Key**: `mia_api_key_abc123xyz789def456ghi012jkl345mno678pqr901stu234vwx567`

**Security Note**: 
- Use a long, random string (at least 32 characters)
- Keep it secret - don't commit it to version control
- Use different keys for development and production

---

## Step 2: Backend Configuration

### Local Development (`.env` file)

Create or update `.env` in the project root:

```env
# ... your existing environment variables ...

# Phase 7: Security
API_KEY=your-generated-api-key-here
```

**Location**: `c:\Users\Guill\Desktop\SCRIPTING\Market_Intel_Agent\MIA1.2\market-intel-agent-v1.2\.env`

### Production (Render)

1. Go to your Render dashboard: https://dashboard.render.com
2. Select your backend service
3. Navigate to **Environment** tab
4. Click **Add Environment Variable**
5. Add:
   - **Key**: `API_KEY`
   - **Value**: `your-generated-api-key-here`
6. Click **Save Changes**
7. Render will automatically redeploy your service

**Note**: After adding the environment variable, your service will restart automatically.

---

## Step 3: Frontend Configuration

### Local Development (`.env.local` file)

Create or update `frontend/.env.local`:

```env
# ... your existing environment variables ...

# Phase 7: Security
NEXT_PUBLIC_API_KEY=your-generated-api-key-here
```

**Location**: `c:\Users\Guill\Desktop\SCRIPTING\Market_Intel_Agent\MIA1.2\market-intel-agent-v1.2\frontend\.env.local`

**Important**: 
- The frontend API key must match the backend API key exactly
- `NEXT_PUBLIC_*` variables are exposed to the browser (this is intentional for this simple setup)

### Production (Vercel)

1. Go to your Vercel dashboard: https://vercel.com/dashboard
2. Select your project
3. Go to **Settings** → **Environment Variables**
4. Click **Add New**
5. Add:
   - **Key**: `NEXT_PUBLIC_API_KEY`
   - **Value**: `your-generated-api-key-here`
   - **Environment**: Select all (Production, Preview, Development)
6. Click **Save**
7. Redeploy your application (or wait for next deployment)

**Note**: After adding the environment variable, you may need to trigger a new deployment for it to take effect.

---

## Step 4: Verify Configuration

### Backend Verification

1. **Check if API key is loaded**:
   ```bash
   # In your backend terminal/logs, you should see no errors
   # The API key is loaded silently on startup
   ```

2. **Test without API key** (should work if `API_KEY` is not set):
   ```bash
   curl -X POST http://localhost:8000/execute \
     -H "Content-Type: application/json" \
     -d '{"user_input": "test mission"}'
   ```
   - If `API_KEY` is not set: Should work (backward compatible)
   - If `API_KEY` is set: Should return `401 Unauthorized`

3. **Test with API key** (should work if `API_KEY` is set):
   ```bash
   curl -X POST http://localhost:8000/execute \
     -H "Content-Type: application/json" \
     -H "X-API-Key: your-generated-api-key-here" \
     -d '{"user_input": "test mission"}'
   ```
   - Should work if API key matches

### Frontend Verification

1. **Check environment variable**:
   - Open browser console on your frontend
   - Type: `console.log(process.env.NEXT_PUBLIC_API_KEY)`
   - Should show your API key (or `undefined` if not set)

2. **Test in browser**:
   - Open your frontend application
   - Go to Agent Terminal page
   - Try to execute a mission
   - Check browser Network tab:
     - Look for requests to `/execute` or `/execute/stream`
     - Check Request Headers
     - Should see `X-API-Key: your-generated-api-key-here` header

---

## Step 5: Testing Security Features

### Test 1: API Key Authentication

**Without API Key** (when `API_KEY` is configured):
```bash
curl -X POST https://your-backend.onrender.com/execute \
  -H "Content-Type: application/json" \
  -d '{"user_input": "test"}'
```
**Expected**: `401 Unauthorized` with message "Invalid or missing API key"

**With Valid API Key**:
```bash
curl -X POST https://your-backend.onrender.com/execute \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your-generated-api-key-here" \
  -d '{"user_input": "test"}'
```
**Expected**: Mission execution starts (or completes)

**With Invalid API Key**:
```bash
curl -X POST https://your-backend.onrender.com/execute \
  -H "Content-Type: application/json" \
  -H "X-API-Key: wrong-key" \
  -d '{"user_input": "test"}'
```
**Expected**: `401 Unauthorized`

### Test 2: Rate Limiting

1. Make 10 successful requests within 1 hour from the same IP
2. Make an 11th request
3. **Expected**: `429 Too Many Requests` with message "Rate limit exceeded. Maximum 10 requests per hour."

**Note**: Rate limiting is per IP address. Different IPs have separate limits.

### Test 3: Input Validation

**Too Short** (less than 3 characters):
```bash
curl -X POST https://your-backend.onrender.com/execute \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your-generated-api-key-here" \
  -d '{"user_input": "ab"}'
```
**Expected**: `400 Bad Request` with message "Input must be at least 3 characters"

**Too Long** (more than 1000 characters):
```bash
curl -X POST https://your-backend.onrender.com/execute \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your-generated-api-key-here" \
  -d '{"user_input": "'$(python -c "print('a' * 1001)")'"}'
```
**Expected**: `400 Bad Request` with message "Input exceeds maximum length of 1000 characters"

**Dangerous Pattern** (script tag):
```bash
curl -X POST https://your-backend.onrender.com/execute \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your-generated-api-key-here" \
  -d '{"user_input": "test <script>alert(1)</script>"}'
```
**Expected**: `400 Bad Request` with message about dangerous pattern

### Test 4: Public Endpoints (No Auth Required)

These endpoints should work without API key:
- `GET /health`
- `GET /ready`
- `GET /stats`
- `GET /reports`

```bash
curl https://your-backend.onrender.com/health
```
**Expected**: Should work without API key

---

## Step 6: Monitoring & Logs

### Backend Logs

Check your backend logs for security events:

**Successful Request**:
```
INFO | AgentRouter | Mission execution request - IP: 192.168.1.1, API Key: valid, Input length: 25, Rate limit remaining: 9
```

**Rate Limit Exceeded**:
```
WARNING | AgentRouter | Rate limit exceeded for IP 192.168.1.1
```

**Invalid Input**:
```
WARNING | AgentRouter | Invalid input from 192.168.1.1: Input must be at least 3 characters
```

**Missing API Key**:
```
INFO | AgentRouter | Mission execution request - IP: 192.168.1.1, API Key: missing, Input length: 25, Rate limit remaining: 9
```

### Where to View Logs

**Local Development**:
- Check your terminal where you ran `uvicorn main:app`

**Render (Production)**:
1. Go to Render dashboard
2. Select your backend service
3. Click **Logs** tab
4. View real-time logs

---

## Troubleshooting

### Problem: Frontend gets 401 Unauthorized

**Possible Causes**:
1. `NEXT_PUBLIC_API_KEY` not set in frontend environment
2. API key mismatch between frontend and backend
3. API key not set in backend

**Solutions**:
1. Check `frontend/.env.local` (local) or Vercel environment variables (production)
2. Verify both frontend and backend use the same API key
3. Check backend `.env` (local) or Render environment variables (production)
4. Restart frontend dev server after changing `.env.local`
5. Redeploy frontend after changing Vercel environment variables

### Problem: Rate limiting too strict

**Solution**: The rate limit is hardcoded to 10 requests/hour. To change it:
1. Edit `routers/agent.py`
2. Find: `check_rate_limit(client_ip, max_requests=10, window_minutes=60)`
3. Change `max_requests=10` to your desired limit
4. Change `window_minutes=60` to your desired time window

### Problem: Input validation too strict

**Solution**: Edit `core/validators.py`:
1. Change `len(user_input) > 1000` to your desired max length
2. Modify or remove dangerous patterns in `dangerous_patterns` list

### Problem: API key not working after setting

**Solutions**:
1. **Backend**: Restart your backend server after changing `.env`
2. **Frontend**: Restart dev server after changing `.env.local`
3. **Production**: 
   - Backend: Render auto-restarts after env var changes
   - Frontend: Trigger new Vercel deployment
4. Verify environment variable names are exactly:
   - Backend: `API_KEY` (no prefix)
   - Frontend: `NEXT_PUBLIC_API_KEY` (with prefix)

### Problem: Rate limit resets on server restart

**Expected Behavior**: Rate limiting is in-memory and resets on server restart. This is by design for minimal security. For persistent rate limiting, you would need Redis or a database.

---

## Security Best Practices

1. **Use Different Keys for Dev/Prod**:
   - Development: `dev_key_abc123...`
   - Production: `prod_key_xyz789...`

2. **Rotate Keys Periodically**:
   - Change API keys every 3-6 months
   - Update both frontend and backend simultaneously

3. **Monitor Logs**:
   - Check for repeated 401 errors (possible brute force)
   - Check for rate limit violations (possible abuse)
   - Check for invalid input attempts (possible attacks)

4. **Keep Keys Secret**:
   - Never commit `.env` or `.env.local` to git
   - Use environment variables in production
   - Don't share keys in chat/email

5. **Backup Keys**:
   - Store keys securely (password manager)
   - Document which key is used where

---

## Disabling Security (Backward Compatibility)

If you want to disable security features:

1. **Disable API Key Authentication**:
   - Remove or leave empty `API_KEY` in backend `.env`
   - Remove or leave empty `NEXT_PUBLIC_API_KEY` in frontend `.env.local`
   - System will work without authentication

2. **Keep Security but Adjust Limits**:
   - Edit `routers/agent.py` to change rate limit values
   - Edit `core/validators.py` to adjust input validation rules

---

## Quick Reference

### Environment Variables

**Backend**:
```env
API_KEY=your-generated-api-key-here
```

**Frontend**:
```env
NEXT_PUBLIC_API_KEY=your-generated-api-key-here
```

### Default Limits

- **Rate Limit**: 10 requests per hour per IP
- **Input Length**: 3-1000 characters
- **API Key**: Optional (backward compatible)

### Protected Endpoints

- `POST /execute` - Requires API key (if configured)
- `POST /execute/stream` - Requires API key (if configured)

### Public Endpoints (No Auth)

- `GET /health`
- `GET /ready`
- `GET /stats`
- `GET /reports`
- `POST /analyze`

---

## Support

If you encounter issues:
1. Check backend logs for error messages
2. Verify environment variables are set correctly
3. Test with curl commands to isolate frontend vs backend issues
4. Check that API keys match exactly (no extra spaces/characters)

---

**Phase 7 Status**: ✅ Complete
**Security Level**: Minimal (suitable for preventing basic abuse)
**Backward Compatible**: Yes (works without API key if not configured)
