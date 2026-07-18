"""
Prayer Analytics API — Prayer tracking analytics and goals endpoints.
"""
import logging
from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel
from typing import Optional

from .auth import get_current_user
from .prayer_analytics_service import (
    get_prayer_analytics,
    get_prayer_insights,
    get_prayer_goals,
    set_prayer_goals,
)

logger = logging.getLogger("beliversflow.prayer_analytics_api")
router = APIRouter(prefix="/api/prayer")


class PrayerGoalsRequest(BaseModel):
    daily_goal_minutes: int = 15
    weekly_goal_days: int = 7


@router.get("/analytics")
async def prayer_analytics(
    period: str = Query("30d", description="Period: 7d, 30d, 90d, 1y, all"),
    user=Depends(get_current_user),
):
    """Get prayer analytics with charts and trends."""
    return await get_prayer_analytics(user_id=user["id"], period=period)


@router.get("/insights")
async def prayer_insights(
    user=Depends(get_current_user),
):
    """Get AI-powered prayer insights and recommendations."""
    return await get_prayer_insights(user_id=user["id"])


@router.get("/goals")
async def prayer_goals_get(
    user=Depends(get_current_user),
):
    """Get prayer goals."""
    return await get_prayer_goals(user_id=user["id"])


@router.post("/goals")
async def prayer_goals_set(
    req: PrayerGoalsRequest,
    user=Depends(get_current_user),
):
    """Set prayer goals."""
    return await set_prayer_goals(
        user_id=user["id"],
        daily_goal_minutes=req.daily_goal_minutes,
        weekly_goal_days=req.weekly_goal_days,
    )
