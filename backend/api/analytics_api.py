"""
Analytics API — Dashboard endpoints for platform statistics and user analytics.
"""
import logging
from fastapi import APIRouter, Depends, Query
from typing import Optional

from .auth import get_current_user
from .analytics_service import (
    get_user_statistics,
    get_registration_trend,
    get_engagement_trend,
    get_user_analytics,
)

logger = logging.getLogger("beliversflow.analytics_api")
router = APIRouter(prefix="/api/analytics")


@router.get("/stats")
async def analytics_stats():
    """Get overall platform statistics (public)."""
    return await get_user_statistics()


@router.get("/registrations")
async def analytics_registrations(
    days: int = Query(30, ge=1, le=365),
):
    """Get user registration trend."""
    return await get_registration_trend(days=days)


@router.get("/engagement")
async def analytics_engagement(
    days: int = Query(30, ge=1, le=365),
):
    """Get daily engagement metrics."""
    return await get_engagement_trend(days=days)


@router.get("/me")
async def analytics_me(
    user=Depends(get_current_user),
):
    """Get personal analytics for the current user."""
    return await get_user_analytics(str(user["id"]))