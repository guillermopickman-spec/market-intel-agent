"""
URL validation utilities for security and reliability.
"""
from urllib.parse import urlparse
from typing import Optional, Tuple
from core.logger import get_logger

logger = get_logger("Validators")

# Allowed URL schemes for scraping
ALLOWED_SCHEMES = {"http", "https"}

# Blocked private/internal network ranges (SSRF protection)
BLOCKED_NETLOCS = {
    "localhost",
    "127.0.0.1",
    "0.0.0.0",
    "::1",
    "169.254.169.254",  # AWS metadata service
    "metadata.google.internal",  # GCP metadata
}

def validate_url(url: str, allow_localhost: bool = False) -> Tuple[bool, Optional[str]]:
    """
    Validates a URL for security and format correctness.
    
    Args:
        url: The URL string to validate
        allow_localhost: If True, allows localhost/internal URLs (default: False for security)
    
    Returns:
        Tuple of (is_valid: bool, error_message: Optional[str])
    """
    if not url or not isinstance(url, str):
        return False, "URL must be a non-empty string"
    
    url = url.strip()
    
    if not url:
        return False, "URL cannot be empty"
    
    try:
        parsed = urlparse(url)
    except Exception as e:
        return False, f"Invalid URL format: {str(e)}"
    
    # Check scheme
    if not parsed.scheme:
        return False, "URL must include a scheme (http:// or https://)"
    
    if parsed.scheme.lower() not in ALLOWED_SCHEMES:
        return False, f"URL scheme must be http or https, got: {parsed.scheme}"
    
    # Check netloc (domain)
    if not parsed.netloc:
        return False, "URL must include a valid domain"
    
    # SSRF protection: block internal/private network access
    if not allow_localhost:
        netloc_lower = parsed.netloc.lower()
        # Check for blocked hostnames
        if any(blocked in netloc_lower for blocked in BLOCKED_NETLOCS):
            return False, f"Access to {parsed.netloc} is not allowed for security reasons"
        
        # Check for private IP ranges (basic check)
        if netloc_lower.startswith("10.") or netloc_lower.startswith("192.168.") or netloc_lower.startswith("172."):
            return False, "Access to private IP ranges is not allowed"
    
    # Basic length check (prevent extremely long URLs)
    if len(url) > 2048:
        return False, "URL exceeds maximum length of 2048 characters"
    
    return True, None


def validate_mission_input(user_input: str) -> Tuple[bool, Optional[str]]:
    """
    Validates mission input for security and basic sanity checks.
    
    Args:
        user_input: The user input string to validate
    
    Returns:
        Tuple of (is_valid: bool, error_message: Optional[str])
    """
    if not user_input or not isinstance(user_input, str):
        return False, "Input must be a non-empty string"
    
    user_input = user_input.strip()
    
    if not user_input:
        return False, "Input cannot be empty"
    
    if len(user_input) > 1000:
        return False, "Input exceeds maximum length of 1000 characters"
    
    if len(user_input) < 3:
        return False, "Input must be at least 3 characters"
    
    # Basic pattern detection for obvious injection attempts
    dangerous_patterns = [
        "<script",
        "javascript:",
        "onerror=",
        "onload=",
        "SELECT *",
        "DROP TABLE",
        "UNION SELECT",
        "INSERT INTO",
        "DELETE FROM",
        "UPDATE SET",
    ]
    
    user_input_lower = user_input.lower()
    for pattern in dangerous_patterns:
        if pattern in user_input_lower:
            return False, f"Input contains potentially dangerous pattern: {pattern}"
    
    return True, None
