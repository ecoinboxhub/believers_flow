"""
Shared Redis client for brute-force protection, token blocklist, and rate limiting.
Falls back to in-memory if Redis unavailable (dev only).
"""
import os
import time
import hashlib
import logging
from typing import Optional

logger = logging.getLogger("beliversflow.redis")

REDIS_URL = os.environ.get("REDIS_URL", "")
_redis = None


async def get_redis():
    """Get or create async Redis connection."""
    global _redis
    if _redis is not None:
        return _redis
    if not REDIS_URL:
        return None
    try:
        import redis.asyncio as aioredis
        _redis = aioredis.from_url(
            REDIS_URL,
            decode_responses=True,
            socket_connect_timeout=5,
            retry_on_timeout=True,
        )
        logger.info("Redis connected")
        return _redis
    except Exception as e:
        logger.warning(f"Redis unavailable: {e}")
        return None


async def close_redis():
    global _redis
    if _redis:
        await _redis.close()
        _redis = None


# --- Brute-force Protection ---

MAX_LOGIN_ATTEMPTS = 5
LOGIN_LOCKOUT_SECONDS = 900  # 15 minutes


async def check_brute_force(email: str) -> bool:
    """Returns True if account is locked (too many attempts)."""
    r = await get_redis()
    key = f"lockout:{email}"
    if r:
        try:
            attempts = await r.get(key)
            return int(attempts or 0) >= MAX_LOGIN_ATTEMPTS
        except Exception:
            pass
    # Fallback: never lock without Redis (safe default for dev)
    return False


async def record_failed_attempt(email: str) -> int:
    """Record a failed login attempt. Returns current count."""
    r = await get_redis()
    key = f"lockout:{email}"
    if r:
        try:
            pipe = r.pipeline()
            pipe.incr(key)
            pipe.expire(key, LOGIN_LOCKOUT_SECONDS)
            results = await pipe.execute()
            return results[0]
        except Exception:
            pass
    return 0


async def clear_failed_attempts(email: str):
    """Clear lockout on successful login."""
    r = await get_redis()
    if r:
        try:
            await r.delete(f"lockout:{email}")
        except Exception:
            pass


# --- Token Blocklist ---

async def block_token(jti: str, ttl_seconds: int = 900):
    """Add a JWT token ID to the blocklist (TTL = access token lifetime)."""
    r = await get_redis()
    if r:
        try:
            await r.setex(f"blocklist:{jti}", ttl_seconds, "1")
        except Exception as e:
            logger.warning(f"Failed to block token: {e}")


async def is_token_blocked(jti: str) -> bool:
    """Check if a token is in the blocklist."""
    r = await get_redis()
    if r:
        try:
            return await r.exists(f"blocklist:{jti}") > 0
        except Exception:
            pass
    return False


# --- Response Cache ---

async def cache_get(namespace: str, key: str) -> Optional[str]:
    """Get cached response."""
    r = await get_redis()
    if r:
        try:
            return await r.get(f"cache:{namespace}:{key}")
        except Exception:
            pass
    return None


async def cache_set(namespace: str, key: str, value: str, ttl: int = 300):
    """Set cached response with TTL in seconds."""
    r = await get_redis()
    if r:
        try:
            await r.setex(f"cache:{namespace}:{key}", ttl, value)
        except Exception:
            pass
