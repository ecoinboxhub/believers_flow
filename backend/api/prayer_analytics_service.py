"""
Prayer Analytics Service — Charts, trends, and insights for prayer tracking.
"""
import logging
from datetime import datetime, timezone, timedelta
from typing import Optional, List, Dict

from fastapi import HTTPException

logger = logging.getLogger("beliversflow.prayer_analytics")


async def get_prayer_analytics(
    user_id: str,
    period: str = "30d",
) -> dict:
    """
    Get prayer analytics for a user.

    Args:
        user_id: User ID
        period: '7d', '30d', '90d', '1y', or 'all'

    Returns:
        dict with analytics data
    """
    from api.database import get_pool

    period_days = {
        "7d": 7,
        "30d": 30,
        "90d": 90,
        "1y": 365,
        "all": 3650,
    }

    days = period_days.get(period, 30)
    start_date = datetime.now(timezone.utc) - timedelta(days=days)

    pool = await get_pool()
    async with pool.acquire() as conn:
        # Get prayer logs
        rows = await conn.fetch("""
            SELECT date, minutes, notes
            FROM prayer_logs
            WHERE user_id = $1 AND date >= $2
            ORDER BY date ASC
        """, int(user_id), start_date.date())

    if not rows:
        return {
            "period": period,
            "total_prayers": 0,
            "total_minutes": 0,
            "average_minutes": 0,
            "current_streak": 0,
            "longest_streak": 0,
            "consistency_score": 0,
            "daily_data": [],
            "monthly_trend": [],
            "best_day": None,
            "worst_day": None,
        }

    # Calculate basic stats
    total_prayers = len(rows)
    total_minutes = sum(r["minutes"] for r in rows)
    average_minutes = total_minutes / total_prayers if total_prayers > 0 else 0

    # Calculate streaks
    dates = [r["date"] for r in rows]
    current_streak = _calculate_current_streak(dates)
    longest_streak = _calculate_longest_streak(dates)

    # Consistency score (0-100)
    expected_days = min(days, (datetime.now(timezone.utc).date() - start_date.date()).days + 1)
    consistency_score = round((total_prayers / expected_days) * 100) if expected_days > 0 else 0

    # Daily data for charts
    daily_data = []
    for r in rows:
        daily_data.append({
            "date": r["date"].isoformat(),
            "minutes": r["minutes"],
            "notes": r["notes"],
        })

    # Monthly trend
    monthly_trend = _calculate_monthly_trend(rows)

    # Best and worst days
    best_day = max(rows, key=lambda r: r["minutes"])
    worst_day = min(rows, key=lambda r: r["minutes"])

    return {
        "period": period,
        "total_prayers": total_prayers,
        "total_minutes": total_minutes,
        "average_minutes": round(average_minutes, 1),
        "current_streak": current_streak,
        "longest_streak": longest_streak,
        "consistency_score": min(consistency_score, 100),
        "daily_data": daily_data,
        "monthly_trend": monthly_trend,
        "best_day": {
            "date": best_day["date"].isoformat(),
            "minutes": best_day["minutes"],
        },
        "worst_day": {
            "date": worst_day["date"].isoformat(),
            "minutes": worst_day["minutes"],
        },
    }


def _calculate_current_streak(dates: List) -> int:
    """Calculate current consecutive prayer streak."""
    if not dates:
        return 0

    today = datetime.now(timezone.utc).date()
    streak = 0
    check_date = today

    date_set = set(dates)

    while check_date in date_set:
        streak += 1
        check_date -= timedelta(days=1)

    return streak


def _calculate_longest_streak(dates: List) -> int:
    """Calculate longest prayer streak."""
    if not dates:
        return 0

    sorted_dates = sorted(dates)
    longest = 1
    current = 1

    for i in range(1, len(sorted_dates)):
        if (sorted_dates[i] - sorted_dates[i-1]).days == 1:
            current += 1
            longest = max(longest, current)
        else:
            current = 1

    return longest


def _calculate_monthly_trend(rows: List) -> List[dict]:
    """Calculate monthly prayer trends."""
    monthly = {}
    for r in rows:
        month_key = r["date"].strftime("%Y-%m")
        if month_key not in monthly:
            monthly[month_key] = {"prayers": 0, "minutes": 0}
        monthly[month_key]["prayers"] += 1
        monthly[month_key]["minutes"] += r["minutes"]

    return [
        {"month": k, "prayers": v["prayers"], "minutes": v["minutes"]}
        for k, v in sorted(monthly.items())
    ]


async def get_prayer_insights(user_id: str) -> dict:
    """Get AI-powered prayer insights and recommendations."""
    analytics = await get_prayer_analytics(user_id, "30d")

    if analytics["total_prayers"] == 0:
        return {
            "insight": "You haven't logged any prayers yet. Start by logging your first prayer today!",
            "recommendations": [
                "Set a daily reminder for prayer time",
                "Start with just 5 minutes of prayer daily",
                "Use the prayer tracker to build consistency",
            ],
        }

    insights = []
    recommendations = []

    # Streak analysis
    if analytics["current_streak"] >= 7:
        insights.append(f"Amazing! You've been praying for {analytics['current_streak']} days straight. Keep up the great discipline!")
    elif analytics["current_streak"] >= 3:
        insights.append(f"You're on a {analytics['current_streak']}-day streak. Consistency is key to spiritual growth!")
    else:
        insights.append("Building a consistent prayer habit takes time. Every day is a new opportunity!")

    # Time analysis
    if analytics["average_minutes"] >= 30:
        insights.append(f"You average {analytics['average_minutes']} minutes per prayer session. That's a deep prayer life!")
    elif analytics["average_minutes"] >= 15:
        insights.append(f"Your {analytics['average_minutes']}-minute average is solid. Consider extending to 30 minutes for deeper communion.")
    else:
        insights.append(f"You average {analytics['average_minutes']} minutes. Even 15 minutes daily can transform your spiritual life.")

    # Consistency analysis
    if analytics["consistency_score"] >= 80:
        insights.append(f"Your consistency score is {analytics['consistency_score']}%. Excellent spiritual discipline!")
    elif analytics["consistency_score"] >= 50:
        insights.append(f"Your consistency score is {analytics['consistency_score']}%. Good progress, but there's room to grow.")
    else:
        insights.append(f"Your consistency score is {analytics['consistency_score']}%. Let's work on making prayer a daily habit.")

    # Recommendations
    if analytics["consistency_score"] < 70:
        recommendations.append("Set a fixed daily prayer time to build consistency")
    if analytics["average_minutes"] < 15:
        recommendations.append("Try to extend your prayer time by 5 minutes each week")
    if analytics["current_streak"] < 7:
        recommendations.append("Focus on building a 7-day streak first")
    if not recommendations:
        recommendations.append("Consider adding intercessory prayer for others")
        recommendations.append("Try praying through the Psalms for variety")

    return {
        "insights": insights,
        "recommendations": recommendations,
        "stats": {
            "streak": analytics["current_streak"],
            "average": analytics["average_minutes"],
            "consistency": analytics["consistency_score"],
        },
    }


async def get_prayer_goals(user_id: str) -> dict:
    """Get and manage prayer goals."""
    from api.database import get_pool

    pool = await get_pool()
    async with pool.acquire() as conn:
        row = await conn.fetchrow("""
            SELECT daily_goal_minutes, weekly_goal_days, created_at
            FROM prayer_goals
            WHERE user_id = $1
        """, int(user_id))

    if not row:
        return {
            "daily_goal_minutes": 15,
            "weekly_goal_days": 7,
            "has_goal": False,
        }

    return {
        "daily_goal_minutes": row["daily_goal_minutes"],
        "weekly_goal_days": row["weekly_goal_days"],
        "has_goal": True,
    }


async def set_prayer_goals(
    user_id: str,
    daily_goal_minutes: int = 15,
    weekly_goal_days: int = 7,
) -> dict:
    """Set prayer goals."""
    from api.database import get_pool

    pool = await get_pool()
    async with pool.acquire() as conn:
        await conn.execute("""
            INSERT INTO prayer_goals (user_id, daily_goal_minutes, weekly_goal_days)
            VALUES ($1, $2, $3)
            ON CONFLICT (user_id)
            DO UPDATE SET
                daily_goal_minutes = $2,
                weekly_goal_days = $3,
                updated_at = NOW()
        """, int(user_id), daily_goal_minutes, weekly_goal_days)

    return {
        "status": "updated",
        "daily_goal_minutes": daily_goal_minutes,
        "weekly_goal_days": weekly_goal_days,
    }
