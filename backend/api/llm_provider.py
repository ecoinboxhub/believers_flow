import os
import httpx
from typing import Optional
from fastapi import HTTPException
from pydantic import BaseModel, Field, validator

GROQ_API_KEY = os.environ.get("GROQ_API_KEY", "")
OPENAI_API_KEY = os.environ.get("OPENAI_API_KEY", "")
OPENROUTER_API_KEY = os.environ.get("OPENROUTER_API_KEY", "")

# Persistent HTTP client — reused across requests (connection pooling)
_http_client: Optional[httpx.AsyncClient] = None


class LLMRequest(BaseModel):
    messages: list
    model: Optional[str] = None
    provider: str = Field("groq", pattern="^(groq|openai|openrouter)$")
    temperature: float = Field(0.7, ge=0.0, le=2.0)
    max_tokens: int = Field(2048, ge=1, le=8192)

    @validator('messages')
    def validate_messages(cls, v):
        if not v:
            raise ValueError("Messages list cannot be empty")
        if len(v) > 50:
            raise ValueError("Too many messages (max 50)")
        for msg in v:
            if not isinstance(msg, dict):
                raise ValueError("Each message must be a dictionary")
            if 'role' not in msg or 'content' not in msg:
                raise ValueError("Each message must have 'role' and 'content' fields")
            if msg['role'] not in ('user', 'assistant', 'system'):
                raise ValueError("Message role must be 'user', 'assistant', or 'system'")
            if not isinstance(msg['content'], str):
                raise ValueError("Message content must be a string")
            if len(msg['content']) > 10000:
                raise ValueError("Message content too long (max 10000 chars)")
        return v


PROVIDER_CONFIG = {
    "groq": {
        "url": "https://api.groq.com/openai/v1/chat/completions",
        "key_env": "GROQ_API_KEY",
        "default_model": "openai/gpt-oss-120b",
    },
    "openai": {
        "url": "https://api.openai.com/v1/chat/completions",
        "key_env": "OPENAI_API_KEY",
        "default_model": "gpt-4o-mini",
    },
    "openrouter": {
        "url": "https://openrouter.ai/api/v1/chat/completions",
        "key_env": "OPENROUTER_API_KEY",
        "default_model": "meta-llama/llama-3.3-70b-instruct",
    },
}

EMBEDDING_PROVIDER_CONFIG = {
    "openai": {
        "url": "https://api.openai.com/v1/embeddings",
        "key_env": "OPENAI_API_KEY",
        "model": "text-embedding-3-small",
    },
    "openrouter": {
        "url": "https://openrouter.ai/api/v1/embeddings",
        "key_env": "OPENROUTER_API_KEY",
        "model": "openai/text-embedding-3-small",
    },
}


def _get_api_key(provider: str) -> str:
    config = PROVIDER_CONFIG.get(provider, PROVIDER_CONFIG["groq"])
    key = os.environ.get(config["key_env"], "")
    if not key:
        raise HTTPException(status_code=503, detail=f"{provider.upper()} API key not configured")
    return key


def get_available_providers() -> list:
    available = []
    for name, config in PROVIDER_CONFIG.items():
        if os.environ.get(config["key_env"], ""):
            available.append(name)
    return available


def _failover_order(preferred: str) -> list:
    """Order providers to try: the preferred one first, then any other configured provider.

    Providers without a configured API key are excluded so a missing key on the
    preferred provider falls through to the next configured one instead of erroring.
    """
    configured = [name for name, config in PROVIDER_CONFIG.items() if os.environ.get(config["key_env"], "")]
    if not configured:
        return [preferred]
    if preferred in configured:
        configured.remove(preferred)
        return [preferred, *configured]
    return configured


_FALLOVER_STATUSES = {401, 403, 429, 500, 502, 503, 504}


def _should_fail_over(exc) -> bool:
    """Fail over on upstream auth/rate/availability errors and network failures."""
    if isinstance(exc, httpx.HTTPStatusError):
        return exc.response.status_code in _FALLOVER_STATUSES
    if isinstance(exc, httpx.RequestError):
        return True
    return False


async def _get_http_client() -> httpx.AsyncClient:
    """Get or create persistent HTTP client with connection pooling."""
    global _http_client
    if _http_client is None or _http_client.is_closed:
        _http_client = httpx.AsyncClient(
            timeout=httpx.Timeout(60.0, connect=10.0),
            limits=httpx.Limits(
                max_connections=20,
                max_keepalive_connections=10,
                keepalive_expiry=300,
            ),
        )
    return _http_client


async def close_http_client():
    """Close the persistent HTTP client on shutdown."""
    global _http_client
    if _http_client and not _http_client.is_closed:
        await _http_client.aclose()
        _http_client = None


def _extract_choice_content(data) -> Optional[str]:
    """Extract the assistant message content from a chat completion response."""
    try:
        content = data["choices"][0]["message"].get("content")
    except (KeyError, IndexError, TypeError, AttributeError):
        return None
    return content if isinstance(content, str) else None


def _valid_content(content) -> bool:
    return isinstance(content, str) and bool(content.strip())


async def call_llm(
    system_prompt: str,
    user_message: str,
    provider: str = "groq",
    model: Optional[str] = None,
    temperature: float = 0.7,
    max_tokens: int = 2048,
    response_format: Optional[dict] = None,
) -> str:
    providers = _failover_order(provider)
    last_error = None
    for name in providers:
        config = PROVIDER_CONFIG.get(name, PROVIDER_CONFIG["groq"])
        api_key = _get_api_key(name)
        selected_model = model or config["default_model"]

        headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
        }
        if name == "openrouter":
            headers["HTTP-Referer"] = "https://believersflow.com"
            headers["X-Title"] = "BelieversFlow"

        payload = {
            "model": selected_model,
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_message},
            ],
            "temperature": temperature,
            "max_tokens": max_tokens,
        }
        if response_format:
            payload["response_format"] = response_format

        try:
            client = await _get_http_client()
            for _ in range(2):
                resp = await client.post(config["url"], headers=headers, json=payload)
                resp.raise_for_status()
                content = _extract_choice_content(resp.json())
                if _valid_content(content):
                    return content
            raise HTTPException(status_code=502, detail="The AI service returned an empty response. Please try again.")
        except httpx.HTTPStatusError as e:
            last_error = e
            if not _should_fail_over(e):
                raise HTTPException(status_code=e.response.status_code, detail=f"{name.upper()} API error: {e.response.status_code}")
        except httpx.RequestError as e:
            last_error = e
    if isinstance(last_error, httpx.RequestError):
        raise HTTPException(status_code=502, detail=f"Failed to reach {last_error.request.url.host if last_error.request else 'the'} API")
    if isinstance(last_error, httpx.HTTPStatusError):
        raise HTTPException(status_code=last_error.response.status_code, detail=f"{last_error.response.request.url.host or 'AI'} API error: {last_error.response.status_code}")
    raise HTTPException(status_code=502, detail="The AI service returned an empty response. Please try again.")


async def call_llm_multi(
    messages: list,
    provider: str = "groq",
    model: Optional[str] = None,
    temperature: float = 0.7,
    max_tokens: int = 2048,
    response_format: Optional[dict] = None,
) -> str:
    providers = _failover_order(provider)
    last_error = None
    for name in providers:
        config = PROVIDER_CONFIG.get(name, PROVIDER_CONFIG["groq"])
        api_key = _get_api_key(name)
        selected_model = model or config["default_model"]

        headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
        }
        if name == "openrouter":
            headers["HTTP-Referer"] = "https://believersflow.com"
            headers["X-Title"] = "BelieversFlow"

        payload = {
            "model": selected_model,
            "messages": messages,
            "temperature": temperature,
            "max_tokens": max_tokens,
        }
        if response_format:
            payload["response_format"] = response_format

        try:
            client = await _get_http_client()
            for _ in range(2):
                resp = await client.post(config["url"], headers=headers, json=payload)
                resp.raise_for_status()
                content = _extract_choice_content(resp.json())
                if _valid_content(content):
                    return content
            raise HTTPException(status_code=502, detail="The AI service returned an empty response. Please try again.")
        except httpx.HTTPStatusError as e:
            last_error = e
            if not _should_fail_over(e):
                raise HTTPException(status_code=e.response.status_code, detail=f"{name.upper()} API error: {e.response.status_code}")
        except httpx.RequestError as e:
            last_error = e
    if isinstance(last_error, httpx.RequestError):
        raise HTTPException(status_code=502, detail=f"Failed to reach {last_error.request.url.host if last_error.request else 'the'} API")
    if isinstance(last_error, httpx.HTTPStatusError):
        raise HTTPException(status_code=last_error.response.status_code, detail=f"{last_error.response.request.url.host or 'AI'} API error: {last_error.response.status_code}")
    raise HTTPException(status_code=502, detail="The AI service returned an empty response. Please try again.")


async def get_embedding(text: str, provider: str = "openai") -> list:
    providers = [p for p in (provider, "openai", "openrouter") if p in EMBEDDING_PROVIDER_CONFIG]
    for name in providers:
        config = EMBEDDING_PROVIDER_CONFIG.get(name, EMBEDDING_PROVIDER_CONFIG["openai"])
        api_key = os.environ.get(config["key_env"], "")
        if not api_key:
            continue

        headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
        }
        if name == "openrouter":
            headers["HTTP-Referer"] = "https://believersflow.com"
            headers["X-Title"] = "BelieversFlow"

        try:
            client = await _get_http_client()
            resp = await client.post(
                config["url"],
                headers=headers,
                json={"input": text, "model": config["model"]},
            )
            resp.raise_for_status()
            data = resp.json()
            return data["data"][0]["embedding"]
        except Exception:
            continue
    return [0.0] * 1024
