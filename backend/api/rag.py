import os
import json
import hashlib
import logging
from typing import List, Optional

from pydantic import BaseModel, Field

logger = logging.getLogger("beliversflow.rag")

PINECONE_API_KEY = os.environ.get("PINECONE_API_KEY")
PINECONE_INDEX = os.environ.get("PINECONE_INDEX", "believersflow")
PINECONE_HOST = os.environ.get("PINECONE_HOST")

_pc = None
_index = None


def get_index():
    global _pc, _index
    if _index is None and PINECONE_API_KEY:
        from pinecone import Pinecone
        _pc = Pinecone(api_key=PINECONE_API_KEY)
        _index = _pc.Index(PINECONE_INDEX)
    return _index


class RAGSearchRequest(BaseModel):
    query: str = Field(..., min_length=1, max_length=500)
    top_k: int = Field(5, ge=1, le=20)
    namespace: Optional[str] = None


class RAGSearchResult(BaseModel):
    id: str
    score: float
    text: str
    metadata: dict


class RAGSearchResponse(BaseModel):
    query: str
    results: List[RAGSearchResult]


class RAGIngestRequest(BaseModel):
    namespace: str = "bible"
    items: List[dict]


async def _get_embedding_async(text: str) -> List[float]:
    """Async embedding using persistent HTTP client."""
    from api.llm_provider import _get_http_client

    groq_key = os.environ.get("GROQ_API_KEY", "")
    openai_key = os.environ.get("OPENAI_API_KEY", "")

    # Try Groq first (fast, free)
    if groq_key:
        try:
            client = await _get_http_client()
            resp = await client.post(
                "https://api.groq.com/openai/v1/embeddings",
                headers={"Authorization": f"Bearer {groq_key}", "Content-Type": "application/json"},
                json={"input": text, "model": "llama-text-embed-v2"},
            )
            resp.raise_for_status()
            vec = resp.json()["data"][0]["embedding"]
            return vec[:1024] if len(vec) > 1024 else vec
        except Exception as e:
            logger.warning(f"Groq embedding failed, trying OpenAI: {e}")

    # Fallback to OpenAI
    if openai_key:
        try:
            client = await _get_http_client()
            resp = await client.post(
                "https://api.openai.com/v1/embeddings",
                headers={"Authorization": f"Bearer {openai_key}", "Content-Type": "application/json"},
                json={"input": text, "model": "text-embedding-3-small", "dimensions": 1024},
            )
            resp.raise_for_status()
            return resp.json()["data"][0]["embedding"]
        except Exception as e:
            logger.warning(f"OpenAI embedding failed: {e}")

    return [0.0] * 1024


def _cache_key(text: str) -> str:
    return hashlib.sha256(text.encode()).hexdigest()[:16]


async def rag_search(req: RAGSearchRequest) -> RAGSearchResponse:
    index = get_index()
    if not index:
        return RAGSearchResponse(query=req.query, results=[])

    try:
        # Check cache first
        from api.redis_client import cache_get, cache_set
        ck = _cache_key(req.query)
        cached = await cache_get("rag", ck)
        if cached:
            try:
                return RAGSearchResponse.model_validate_json(cached)
            except Exception:
                pass

        vector = await _get_embedding_async(req.query)
        is_zero = all(v == 0.0 for v in vector[:10])
        if is_zero:
            logger.warning(f"[RAG] Zero vector for query: {req.query[:50]}")
            return RAGSearchResponse(query=req.query, results=[])

        search_kwargs = {"vector": vector, "top_k": req.top_k, "include_metadata": True}
        if req.namespace:
            search_kwargs["namespace"] = req.namespace

        results = index.query(**search_kwargs)
        items = []
        for match in results.get("matches", []):
            meta = match.get("metadata", {})
            score = match.get("score", 0.0)
            if score is None:
                score = 0.0
            items.append(RAGSearchResult(
                id=match.get("id", ""),
                score=float(score),
                text=meta.get("text", ""),
                metadata=meta
            ))
        response = RAGSearchResponse(query=req.query, results=items)

        # Cache for 5 minutes
        try:
            await cache_set("rag", ck, response.model_dump_json(), ttl=300)
        except Exception:
            pass

        return response
    except Exception as e:
        logger.exception("RAG search failed")
        return RAGSearchResponse(query=req.query, results=[])


async def rag_ingest(req: RAGIngestRequest) -> dict:
    index = get_index()
    if not index:
        return {"status": "error", "detail": "Pinecone not configured"}

    try:
        vectors = []
        for i, item in enumerate(req.items):
            text = item.get("text", "")
            if not text:
                continue
            vector = await _get_embedding_async(text)
            meta = {k: v for k, v in item.items() if k != "text"}
            meta["text"] = text[:1000]
            vectors.append({
                "id": f"{req.namespace}-{item.get('id', i)}",
                "values": vector,
                "metadata": meta
            })

        if vectors:
            index.upsert(vectors=vectors, namespace=req.namespace)
        return {"status": "ok", "ingested": len(vectors)}
    except Exception as e:
        return {"status": "error", "detail": str(e)}
