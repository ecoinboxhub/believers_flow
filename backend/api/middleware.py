import os
import time
import hashlib
import logging
from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware

logger = logging.getLogger("beliversflow.middleware")

# NOTE: CSRF protection is not required for this application.
# All authenticated requests use Bearer tokens in the Authorization header
# (stored in localStorage, not cookies). CSRF attacks only target
# cookie-based authentication. Bearer tokens are immune to CSRF because
# browsers do not automatically attach them to cross-origin requests.

_raw_origins = os.environ.get("ALLOWED_ORIGINS", "").strip()
ALLOWED_ORIGINS = [o.strip() for o in _raw_origins.split(",") if o.strip()] if _raw_origins else []
RATE_LIMIT = int(os.environ.get("RATE_LIMIT_PER_MINUTE", "60"))
IS_PRODUCTION = os.environ.get("APP_ENV", "development") == "production"


def _is_dev_origin(origin: str) -> bool:
    """Allow localhost/127.0.0.1 origins in development mode."""
    if IS_PRODUCTION or not origin:
        return False
    from urllib.parse import urlparse
    try:
        parsed = urlparse(origin)
        host = parsed.hostname or ""
        return host in ("localhost", "127.0.0.1", "0.0.0.0") and parsed.scheme in ("http", "https")
    except Exception:
        return False


def _is_allowed_origin(origin: str) -> bool:
    """Check if origin is allowed via explicit list or dev-mode localhost."""
    if origin in ALLOWED_ORIGINS:
        return True
    if not ALLOWED_ORIGINS and _is_dev_origin(origin):
        return True
    return False


class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        response = await call_next(request)
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["X-XSS-Protection"] = "0"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        response.headers["Permissions-Policy"] = "camera=(), microphone=(), geolocation=()"
        csp_policy = (
            "default-src 'self'; "
            "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net https://accounts.google.com https://unpkg.com; "
            "style-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net https://unpkg.com; "
            "img-src 'self' data: https:; "
            "connect-src 'self' https://api.groq.com https://api.openai.com https://openrouter.ai https://cdn.jsdelivr.net https://unpkg.com; "
            "font-src 'self' https://cdn.jsdelivr.net https://fonts.gstatic.com; "
            "object-src 'none'; "
            "base-uri 'self'; "
            "form-action 'self'; "
            "frame-ancestors 'none'"
        )
        # Relax CSP for Swagger UI / ReDoc endpoints only (dev mode)
        if not IS_PRODUCTION and (request.url.path.startswith('/docs') or request.url.path.startswith('/redoc') or request.url.path.startswith('/openapi.json')):
            csp_policy = (
                "default-src 'self'; "
                "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net https://accounts.google.com https://unpkg.com; "
                "style-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net https://unpkg.com; "
                "img-src 'self' data: https:; "
                "connect-src 'self' https://api.groq.com https://api.openai.com https://openrouter.ai https://cdn.jsdelivr.net https://unpkg.com ws://localhost:*; "
                "font-src 'self' https://cdn.jsdelivr.net https://fonts.gstatic.com; "
                "object-src 'none'; "
                "base-uri 'self'; "
                "form-action 'self'; "
                "frame-ancestors 'none'"
            )
        response.headers["Content-Security-Policy"] = csp_policy
        if request.url.scheme == "https":
            response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains; preload"
        return response


class RateLimitMiddleware(BaseHTTPMiddleware):
    def __init__(self, app, requests_per_minute: int = 60):
        super().__init__(app)
        self.rpm = requests_per_minute
        self._redis = None

    async def _get_redis(self):
        if self._redis is not None:
            return self._redis
        try:
            from api.redis_client import get_redis
            self._redis = await get_redis()
        except Exception:
            pass
        return self._redis

    def _get_client_id(self, request: Request) -> str:
        forwarded = request.headers.get("X-Forwarded-For")
        if forwarded:
            ip = forwarded.split(",")[0].strip()
        else:
            ip = request.client.host if request.client else "unknown"
        return hashlib.sha256(ip.encode()).hexdigest()[:16]

    async def dispatch(self, request: Request, call_next):
        if request.url.path in ("/api/health", "/api/dbtest"):
            return await call_next(request)

        client_id = self._get_client_id(request)
        now = time.time()
        window_start = now - 60

        r = await self._get_redis()
        current_count = 0

        if r:
            try:
                pipe = r.pipeline()
                key = f"ratelimit:{client_id}"
                pipe.zremrangebyscore(key, 0, window_start)
                pipe.zadd(key, {str(now): now})
                pipe.zcard(key)
                pipe.expire(key, 61)
                results = await pipe.execute()
                current_count = results[2]
            except Exception as e:
                logger.warning(f"Redis rate limit error: {e}")
        else:
            # No Redis — allow all requests (safe default for dev)
            current_count = 0

        if current_count >= self.rpm:
            return Response(
                content='{"detail":"Rate limit exceeded. Try again later."}',
                status_code=429,
                media_type="application/json",
                headers={"Retry-After": "60", "X-RateLimit-Limit": str(self.rpm)}
            )

        response = await call_next(request)
        response.headers["X-RateLimit-Limit"] = str(self.rpm)
        response.headers["X-RateLimit-Remaining"] = str(max(0, self.rpm - current_count))
        return response


class CORSOptionsMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        origin = request.headers.get("Origin", "")

        if request.method == "OPTIONS":
            if _is_allowed_origin(origin) or (not ALLOWED_ORIGINS and not origin):
                headers = {
                    "Access-Control-Allow-Origin": origin or "*",
                    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
                    "Access-Control-Allow-Headers": "Authorization, Content-Type, Accept",
                    "Access-Control-Max-Age": "86400",
                }
                return Response(status_code=204, headers=headers)
            return Response(status_code=403)

        response = await call_next(request)

        if _is_allowed_origin(origin):
            response.headers["Access-Control-Allow-Origin"] = origin
            response.headers["Access-Control-Allow-Credentials"] = "true"

        return response
