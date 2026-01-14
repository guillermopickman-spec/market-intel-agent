"""
Simple in-memory rate limiting utility.
Tracks requests by IP address with configurable limits.
"""
from collections import defaultdict
from datetime import datetime, timedelta
from typing import Tuple

_rate_limits = defaultdict(list)


def check_rate_limit(ip: str, max_requests: int = 10, window_minutes: int = 60) -> Tuple[bool, int]:
    """
    Check if an IP address has exceeded the rate limit.
    
    Args:
        ip: The IP address to check
        max_requests: Maximum number of requests allowed in the time window
        window_minutes: Time window in minutes
    
    Returns:
        Tuple of (is_allowed: bool, remaining_requests: int)
        - is_allowed: True if request is allowed, False if rate limit exceeded
        - remaining_requests: Number of requests remaining in the window (0 if exceeded)
    """
    now = datetime.utcnow()
    cutoff = now - timedelta(minutes=window_minutes)
    
    # Clean old entries
    _rate_limits[ip] = [t for t in _rate_limits[ip] if t > cutoff]
    
    current_count = len(_rate_limits[ip])
    
    if current_count >= max_requests:
        return False, 0
    
    # Add current request timestamp
    _rate_limits[ip].append(now)
    
    remaining = max_requests - (current_count + 1)
    return True, remaining


def get_rate_limit_status(ip: str, max_requests: int = 10, window_minutes: int = 60) -> dict:
    """
    Get current rate limit status for an IP address without incrementing the counter.
    
    Args:
        ip: The IP address to check
        max_requests: Maximum number of requests allowed in the time window
        window_minutes: Time window in minutes
    
    Returns:
        Dictionary with rate limit status information
    """
    now = datetime.utcnow()
    cutoff = now - timedelta(minutes=window_minutes)
    
    # Clean old entries
    _rate_limits[ip] = [t for t in _rate_limits[ip] if t > cutoff]
    
    current_count = len(_rate_limits[ip])
    remaining = max(0, max_requests - current_count)
    
    return {
        "current_count": current_count,
        "max_requests": max_requests,
        "remaining": remaining,
        "window_minutes": window_minutes,
        "limit_exceeded": current_count >= max_requests
    }
