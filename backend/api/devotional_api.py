import hashlib
import json
import logging
from datetime import date
from typing import Dict, Optional

from fastapi import APIRouter, Query
from pydantic import BaseModel, Field

from .devotional_service import fetch_devotional, CHURCH_SOURCES
from .devotional_study import answer_question, build_study_context

logger = logging.getLogger("beliversflow.devotional_api")
router = APIRouter(prefix="/api/devotional")


class StudyRequest(BaseModel):
    devotion: Dict = Field(...)
    question: Optional[str] = Field(None, max_length=2000)
    provider: Optional[str] = Field("groq", pattern="^(groq|openai|openrouter)$")


@router.post("/study")
async def devotional_study(req: StudyRequest):
    """Grounded AI study companion for the devotional currently being viewed.

    Retrieval is fully local (KJV + Matthew Henry + Easton's, all public
    domain). The LLM summarises the retrieved material when available and a
    grounded fallback is returned otherwise. Answers are cached by the
    devotional reference + question for fast repeat reads.
    """
    question = (req.question or "").strip()
    ref = (req.devotion or {}).get("verse", "")

    cache_key = f"devstudy:v1:{hashlib.sha256(f'{ref}::{question}'.encode()).hexdigest()[:24]}"
    try:
        from api.redis_client import cache_get, cache_set
        cached = await cache_get("devotional", cache_key)
        if cached:
            try:
                return json.loads(cached)
            except Exception:
                pass
    except Exception:
        pass

    if question:
        result = await answer_question(req.devotion, question, provider=req.provider)
        ttl = 21600
    else:
        result = {
            "answer": "",
            "ai": False,
            "overview": None,
            "context": await build_study_context(req.devotion or {}),
        }
        ttl = 86400

    try:
        from api.redis_client import cache_set
        await cache_set("devotional", cache_key, json.dumps(result, default=str), ttl=ttl)
    except Exception:
        pass

    return result


@router.get("/church")
async def get_church_devotional(
    church: str = Query(..., description="Church key identifier"),
    year: int = Query(None, ge=2020, le=2030),
    month: int = Query(None, ge=1, le=12),
    day: int = Query(None, ge=1, le=31),
):
    if year and month and day:
        try:
            request_date = date(year, month, day)
        except ValueError:
            return {"error": "Invalid date"}
    else:
        request_date = date.today()

    result = await fetch_devotional(church, request_date)
    result["requestedDate"] = request_date.isoformat()
    result["dayOfYear"] = request_date.timetuple().tm_yday
    return result


@router.get("/churches")
async def list_churches():
    return {
        "churches": [
            {
                "key": k,
                "name": v["name"],
                "url": v["url"],
                "dailyUrl": v["daily_url"](date.today()),
                "hasParser": v["parser"] is not None,
            }
            for k, v in CHURCH_SOURCES.items()
        ]
    }


@router.get("/sync-status")
async def sync_status():
    request_date = date.today()
    statuses = []
    for key, source in CHURCH_SOURCES.items():
        result = await fetch_devotional(key, request_date)
        statuses.append({
            "key": key,
            "name": source["name"],
            "dailyUrl": source["daily_url"](request_date),
            "synced": result.get("synced", False),
            "offline": result.get("offline", False),
            "error": result.get("error") if "error" in result else None,
            "hasTitle": bool(result.get("title")) if "error" not in result else False,
        })
    return {
        "date": request_date.isoformat(),
        "dayOfYear": request_date.timetuple().tm_yday,
        "churches": statuses,
        "synced": sum(1 for s in statuses if s["synced"]),
        "failed": sum(1 for s in statuses if s.get("error")),
        "total": len(statuses),
    }
