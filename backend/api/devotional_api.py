import logging
from datetime import date
from fastapi import APIRouter, Query
from .devotional_service import fetch_devotional, CHURCH_SOURCES

logger = logging.getLogger("beliversflow.devotional_api")
router = APIRouter(prefix="/api/devotional")


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
