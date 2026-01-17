import re
from typing import Optional

def detect_mission_id(query: str) -> Optional[int]:
    """
    Detect mission ID from natural language query.
    Looks for patterns like:
    - "mission 123"
    - "mission_id 456"
    - "#789"
    - "tell me about mission 123"
    """
    if not query:
        return None
    
    # Pattern 1: "mission {id}" or "mission_id {id}" (case insensitive)
    pattern1 = r'(?:mission|mission_id)\s+(?:#)?(\d+)'
    match1 = re.search(pattern1, query, re.IGNORECASE)
    if match1:
        try:
            return int(match1.group(1))
        except (ValueError, IndexError):
            pass
    
    # Pattern 2: "#{id}" at start of query or after whitespace
    pattern2 = r'(?:^|\s)#(\d+)'
    match2 = re.search(pattern2, query)
    if match2:
        try:
            return int(match2.group(1))
        except (ValueError, IndexError):
            pass
    
    # Pattern 3: Standalone numeric ID after "mission" context
    # Look for "mission" followed by a number within 10 characters
    pattern3 = r'mission[^\d]*(\d{1,10})(?:\s|$|[^\d])'
    match3 = re.search(pattern3, query, re.IGNORECASE)
    if match3:
        try:
            mission_id = int(match3.group(1))
            # Reasonable range check (avoid matching years like 2025)
            if 1 <= mission_id <= 999999:
                return mission_id
        except (ValueError, IndexError):
            pass
    
    return None
