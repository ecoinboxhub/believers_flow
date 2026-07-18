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
        "default_model": "llama-3.3-70b-versatile",
    },
    "openai": {
        "url": "https://api.openai.com/v1/chat/completions",
        "key_env": "OPENAI_API_KEY",
        "default_model": "gpt-4o-mini",
    },
    "openrouter": {
        "url": "https://openrouter.ai/api/v1/chat/completions",
        "key_env": "OPENROUTER_API_KEY",
        "default_model": "meta-llama/llama-3.3-70b-instruct:free",
    },
}

EMBEDDING_PROVIDER_CONFIG = {
    "groq": {
        "url": "https://api.groq.com/openai/v1/embeddings",
        "key_env": "GROQ_API_KEY",
        "model": "llama-text-embed-v2",
    },
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


async def call_llm(
    system_prompt: str,
    user_message: str,
    provider: str = "groq",
    model: Optional[str] = None,
    temperature: float = 0.7,
    max_tokens: int = 2048,
) -> str:
    config = PROVIDER_CONFIG.get(provider, PROVIDER_CONFIG["groq"])
    api_key = _get_api_key(provider)
    selected_model = model or config["default_model"]

    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json",
    }
    if provider == "openrouter":
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

    try:
        client = await _get_http_client()
        resp = await client.post(config["url"], headers=headers, json=payload)
        resp.raise_for_status()
        data = resp.json()
        return data["choices"][0]["message"]["content"]
    except httpx.HTTPStatusError as e:
        raise HTTPException(status_code=e.response.status_code, detail=f"{provider.upper()} API error: {e.response.status_code}")
    except httpx.RequestError:
        raise HTTPException(status_code=502, detail=f"Failed to reach {provider.upper()} API")


async def call_llm_multi(
    messages: list,
    provider: str = "groq",
    model: Optional[str] = None,
    temperature: float = 0.7,
    max_tokens: int = 2048,
) -> str:
    config = PROVIDER_CONFIG.get(provider, PROVIDER_CONFIG["groq"])
    api_key = _get_api_key(provider)
    selected_model = model or config["default_model"]

    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json",
    }
    if provider == "openrouter":
        headers["HTTP-Referer"] = "https://believersflow.com"
        headers["X-Title"] = "BelieversFlow"

    payload = {
        "model": selected_model,
        "messages": messages,
        "temperature": temperature,
        "max_tokens": max_tokens,
    }

    try:
        client = await _get_http_client()
        resp = await client.post(config["url"], headers=headers, json=payload)
        resp.raise_for_status()
        data = resp.json()
        return data["choices"][0]["message"]["content"]
    except httpx.HTTPStatusError as e:
        raise HTTPException(status_code=e.response.status_code, detail=f"{provider.upper()} API error: {e.response.status_code}")
    except httpx.RequestError:
        raise HTTPException(status_code=502, detail=f"Failed to reach {provider.upper()} API")


async def get_embedding(text: str, provider: str = "groq") -> list:
    config = EMBEDDING_PROVIDER_CONFIG.get(provider, EMBEDDING_PROVIDER_CONFIG["groq"])
    api_key = os.environ.get(config["key_env"], "")
    if not api_key:
        return [0.0] * 1024

    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json",
    }
    if provider == "openrouter":
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
        return [0.0] * 1024
