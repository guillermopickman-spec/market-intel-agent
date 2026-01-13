# Market Intelligence Agent - Implementation Plan

## Current Status

- ✅ **Phase 4**: Reports Endpoint Integration - **COMPLETE**
- ✅ **Phase 5**: Agent Terminal - Basic Mission Execution (Non-Streaming) - **COMPLETE**
- ⏭️ **Phase 6**: Agent Terminal - Streaming Implementation - **NEXT**
- ⏭️ **Phase 7**: Permissions & Security - Prevent Abuse - **PLANNED**

---

## PHASE 7: PERMISSIONS & SECURITY - PREVENT ABUSE

**Status**: [ ] Not Started

**Objective**: Add basic security measures to prevent abuse from testers, bots, or unauthorized users

### Tasks

1. **Add API Key Authentication (Simple)**
   - Create environment variable: `API_KEY` (secret key for backend)
   - Add middleware to check API key on `/execute` and `/execute/stream` endpoints
   - Frontend sends API key in request headers
   - Return `401 Unauthorized` if key is missing or invalid
   - Keep `/health` and `/stats` public (read-only endpoints)

2. **Rate Limiting (Simple)**
   - Add rate limiting to `/execute` endpoint (e.g., 5 missions per hour per IP)
   - Use simple in-memory tracking (or Redis if available)
   - Return `429 Too Many Requests` when limit exceeded
   - Log rate limit violations for monitoring

3. **Input Validation & Sanitization**
   - Validate mission input length (max 500 characters)
   - Sanitize user input to prevent injection attacks
   - Reject obviously malicious patterns (SQL injection, script tags, etc.)
   - Return `400 Bad Request` for invalid input

4. **Request Logging**
   - Log all `/execute` requests with IP address and timestamp
   - Track failed authentication attempts
   - Monitor for suspicious patterns (rapid requests, same IP, etc.)

### Deliverables

- ✅ API key protection on mission execution endpoints
- ✅ Rate limiting prevents abuse
- ✅ Input validation prevents malicious requests
- ✅ Basic request logging for monitoring

### Verification

- [ ] Test with valid API key - should work
- [ ] Test with invalid/missing API key - should return 401
- [ ] Test rate limiting - should block after limit
- [ ] Test input validation - should reject invalid input
- [ ] Verify logs capture requests correctly

### Environment Variables Needed

**Backend (Render)**:
```
API_KEY=your-secret-api-key-here
```

**Frontend (Vercel)**:
```
NEXT_PUBLIC_API_KEY=your-secret-api-key-here
```

### Files to Modify

**Backend**:
- `routers/agent.py` - Add API key check middleware
- `main.py` - Add rate limiting middleware
- `core/validators.py` - Add input validation functions

**Frontend**:
- `frontend/lib/api.ts` - Add API key to request headers

### Implementation Details

#### API Key Middleware (Simple)
```python
# In routers/agent.py or main.py
from fastapi import Header, HTTPException
import os

API_KEY = os.getenv("API_KEY", "")

async def verify_api_key(x_api_key: str = Header(None)):
    if not API_KEY or x_api_key != API_KEY:
        raise HTTPException(status_code=401, detail="Invalid or missing API key")
    return x_api_key
```

#### Rate Limiting (Simple In-Memory)
```python
# Simple rate limiter using dictionary
from collections import defaultdict
from datetime import datetime, timedelta

rate_limits = defaultdict(list)

def check_rate_limit(ip: str, max_requests: int = 5, window_minutes: int = 60):
    now = datetime.now()
    cutoff = now - timedelta(minutes=window_minutes)
    
    # Clean old entries
    rate_limits[ip] = [t for t in rate_limits[ip] if t > cutoff]
    
    if len(rate_limits[ip]) >= max_requests:
        return False
    
    rate_limits[ip].append(now)
    return True
```

#### Input Validation
```python
# In core/validators.py
def validate_mission_input(user_input: str) -> bool:
    # Length check
    if len(user_input) > 500:
        return False
    
    # Basic malicious pattern detection
    dangerous_patterns = [
        "<script",
        "javascript:",
        "onerror=",
        "onload=",
        "SELECT *",
        "DROP TABLE",
        "UNION SELECT"
    ]
    
    user_input_lower = user_input.lower()
    for pattern in dangerous_patterns:
        if pattern in user_input_lower:
            return False
    
    return True
```

### Security Notes

- **Keep it simple** - No complex auth systems needed
- **API key is shared** between frontend and backend (public in frontend env vars)
- **Rate limiting** prevents spam/abuse from bots
- **Input validation** prevents basic injection attacks
- **Logs** help identify abuse patterns for manual review

### Backend Requirements

- Middleware for API key validation
- Rate limiting implementation (simple in-memory is fine)
- Input validation functions
- Request logging

---

## Previous Phases

### Phase 4: Reports Endpoint Integration ✅
- Reports page displays real mission logs from backend
- All report data fields display correctly
- Loading and error states work

### Phase 5: Agent Terminal - Basic Mission Execution ✅
- Agent Terminal can submit missions
- Non-streaming execution works
- Results display correctly
- Error handling works

### Phase 6: Agent Terminal - Streaming Implementation ⏭️
- Real-time updates during mission execution
- Thinking steps displayed as they happen
- Tool execution progress shown
- Streaming endpoint: `/execute/stream`

---

## Next Steps After Phase 7

1. Test security measures thoroughly
2. Monitor logs for abuse patterns
3. Adjust rate limits if needed
4. Consider additional security if abuse continues
