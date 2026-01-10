# Comprehensive Fix for Groq 413 Payload Too Large Error

## Problem Analysis
The 413 error persists because:
1. **Incomplete size accounting**: We only truncate intel_pool to 25000 chars, but don't account for:
   - Prompt template overhead (~200 chars)
   - System message (~60 chars)
   - JSON structure overhead (~500-1000 chars when serialized)
   - Character escaping in JSON (quotes, newlines, etc. add ~10-20% size)
   - Total payload limit is likely ~32KB for entire JSON

2. **Current limit too high**: 25000 chars for intel_pool is too much when combined with overhead

3. **No payload validation**: Groq client doesn't check payload size before sending

4. **Inefficient data format**: Keeping all raw search results instead of extracting just prices

## Solution Strategy

### 1. Reduce Intel Pool Limit Aggressively (`services/agent_service.py`)
- Change `max_chars` from 25000 to **12000** chars (conservative limit)
- This accounts for:
  - Prompt template: ~200 chars
  - System message: ~60 chars  
  - JSON overhead: ~1000-2000 chars
  - Escaping overhead: ~20% = ~2400 chars
  - Total: ~12000 + ~4000 overhead = ~16000 chars (well under 32KB limit)

### 2. Add Payload Size Validation in Groq Client (`services/llm/groq.py`)
- Add method to calculate actual JSON payload size before sending
- If payload exceeds limit, truncate the prompt further
- Log payload size for debugging
- Return clear error if still too large after truncation

### 3. Improve Truncation Logic (`services/agent_service.py`)
- Extract only price data from sections instead of keeping full text
- Create compact summary format: "Product: Price | Source"
- Remove redundant information (duplicate prices, verbose descriptions)
- Keep only unique price entries per product

### 4. Add Pre-emptive Truncation
- Truncate each search result as it's added to current_intel
- Limit each search result to max 2000 chars before adding
- This prevents accumulation of huge intel pools

## Implementation Details

### File: `services/agent_service.py`
1. Change `_truncate_intel_pool()` default `max_chars` to 12000
2. Add `_extract_price_summary()` method to create compact price-only format
3. Modify `process_mission()` to limit each search result to 2000 chars before adding
4. Use price summary format when intel_pool gets large

### File: `services/llm/groq.py`
1. Add `_calculate_payload_size()` method
2. Add payload size check before sending request
3. If too large, return error with size information
4. Add logging for payload sizes

## Key Principles
- **Conservative limits**: Better to truncate more than hit API limits
- **Price preservation**: Always keep price data, remove verbose text
- **Proactive**: Limit data as it's collected, not just at the end
- **Validation**: Check payload size before sending to API

## Expected Outcome
- No more 413 errors
- System handles any size of intel pool gracefully
- Reports still contain all critical price information
- Better visibility into payload sizes
