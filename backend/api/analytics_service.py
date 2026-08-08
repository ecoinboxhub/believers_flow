"""
Analytics Service — Dashboard aggregations, user statistics, engagement metrics.
"""
import logging
from datetime import datetime, timezone, timedelta
from typing import Optional

from fastapi import HTTPException

logger = logging.getLogger("beliversflow.analytics")


async def track_event(
    user_id: str = None,
    event_type: str = "",
    event_data: dict = None,
    ip_address: str = None,
    user_agent: str = None,
):
    """Track an analytics event."""
    from api.database import get_pool
    pool = await get_pool()
    async with pool.acquire() as conn:
        await conn.execute("""
            INSERT INTO analytics_events (user_id, event_type, event_data, ip_address, user_agent)
            VALUES ($1, $2, $3::jsonb, $4, $5)
        """,
            int(user_id) if user_id else None,
            event_type,
            json.dumps(event_data) if event_data else '{}',
            ip_address,
            user_agent,
        )


async def get_user_statistics() -> dict:
    """Get overall platform statistics."""
    from api.database import get_pool
    pool = await get_pool()
    async with pool.acquire() as conn:
        total_users = await conn.fetchval("SELECT COUNT(*) FROM users")
        premium_users = await conn.fetchval(
            "SELECT COUNT(*) FROM users WHERE plan = 'premium'"
        )
        users_30d = await conn.fetchval(
            "SELECT COUNT(*) FROM users WHERE created_at >= NOW() - INTERVAL '30 days'"
        )
        users_7d = await conn.fetchval(
            "SELECT COUNT(*) FROM users WHERE created_at >= NOW() - INTERVAL '7 days'"
        )
        users_today = await conn.fetchval(
            "SELECT COUNT(*) FROM users WHERE created_at >= CURRENT_DATE"
        )

        total_tasks = await conn.fetchval(
            "SELECT SUM(jsonb_array_length(data)) FROM user_data WHERE data_type = 'tasks'"
        ) or 0

        total_prayer_logs = await conn.fetchval("SELECT COUNT(*) FROM prayer_logs")
        prayer_logs_30d = await conn.fetchval(
            "SELECT COUNT(*) FROM prayer_logs WHERE date >= CURRENT_DATE - INTERVAL '30 days'"
        ) or 0

        total_prayer_minutes = await conn.fetchval(
            "SELECT COALESCE(SUM(minutes), 0) FROM prayer_logs"
        ) or 0

        total_feed_posts = await conn.fetchval("SELECT COUNT(*) FROM community_feed")
        total_prayer_chains = await conn.fetchval("SELECT COUNT(*) FROM prayer_chains")
        total_testimonies = await conn.fetchval("SELECT COUNT(*) FROM testimonies")
        total_forum_threads = await conn.fetchval("SELECT COUNT(*) FROM forum_threads")
        total_forum_replies = await conn.fetchval("SELECT COUNT(*) FROM forum_replies")
        total_groups = await conn.fetchval("SELECT COUNT(*) FROM small_groups")
        total_churches = await conn.fetchval("SELECT COUNT(*) FROM churches")
        total_events = await conn.fetchval("SELECT COUNT(*) FROM events")
        total_sermon_notes = await conn.fetchval("SELECT COUNT(*) FROM sermon_notes")

        total_ai_queries = await conn.fetchval(
            "SELECT COUNT(*) FROM analytics_events WHERE event_type LIKE 'ai_%'"
        ) or 0

        total_payments = await conn.fetchval(
            "SELECT COUNT(*) FROM payment_transactions WHERE status = 'completed'"
        ) or 0
        total_revenue = await conn.fetchval(
            "SELECT COALESCE(SUM(amount), 0) FROM payment_transactions WHERE status = 'completed'"
        ) or 0

    return {
        "users": {
            "total": total_users,
            "premium": premium_users,
            "last_30d": users_30d,
            "last_7d": users_7d,
            "today": users_today,
        },
        "engagement": {
            "total_tasks": total_tasks,
            "total_prayer_logs": total_prayer_logs,
            "prayer_logs_30d": prayer_logs_30d,
            "total_prayer_minutes": total_prayer_minutes,
            "total_feed_posts": total_feed_posts,
            "total_prayer_chains": total_prayer_chains,
            "total_testimonies": total_testimonies,
            "total_forum_threads": total_forum_threads,
            "total_forum_replies": total_forum_replies,
        },
        "community": {
            "total_groups": total_groups,
            "total_churches": total_churches,
            "total_events": total_events,
            "total_sermon_notes": total_sermon_notes,
        },
        "ai": {
            "total_queries": total_ai_queries,
        },
        "payments": {
            "total_transactions": total_payments,
            "total_revenue": float(total_revenue),
        },
    }


async def get_registration_trend(days: int = 30) -> dict:
    """Get user registration trend over time."""
    from api.database import get_pool
    pool = await get_pool()
    async with pool.acquire() as conn:
        rows = await conn.fetch("""
            SELECT DATE(created_at) as date, COUNT(*) as count
            FROM users
            WHERE created_at >= NOW() - ($1::text || ' days')::interval
            GROUP BY DATE(created_at)
            ORDER BY date ASC
        """, str(days))

    return {
        "period": f"{days}d",
        "data": [
            {"date": r["date"].isoformat(), "count": r["count"]}
            for r in rows
        ],
    }


async def get_engagement_trend(days: int = 30) -> dict:
    """Get daily engagement metrics over time."""
    from api.database import get_pool
    pool = await get_pool()
    async with pool.acquire() as conn:
        prayer_rows = await conn.fetch("""
            SELECT date, COUNT(*) as logs, SUM(minutes) as minutes
            FROM prayer_logs
            WHERE date >= CURRENT_DATE - ($1::text || ' days')::interval
            GROUP BY date
            ORDER BY date ASC
        """, str(days))

        feed_rows = await conn.fetch("""
            SELECT DATE(created_at) as date, COUNT(*) as posts
            FROM community_feed
            WHERE created_at >= NOW() - ($1::text || ' days')::interval
            GROUP BY DATE(created_at)
            ORDER BY date ASC
        """, str(days))

    prayers_by_date = {
        r["date"].isoformat(): {
            "logs": r["logs"], "minutes": r["minutes"]
        }
        for r in prayer_rows
    }
    feeds_by_date = {
        r["date"].isoformat(): r["posts"]
        for r in feed_rows
    }

    all_dates = sorted(set(list(prayers_by_date.keys()) + list(feeds_by_date.keys())))

    return {
        "period": f"{days}d",
        "prayer_activity": [
            {"date": d, "logs": prayers_by_date.get(d, {}).get("logs", 0),
             "minutes": prayers_by_date.get(d, {}).get("minutes", 0)}
            for d in all_dates
        ],
        "community_activity": [
            {"date": d, "posts": feeds_by_date.get(d, 0)}
            for d in all_dates
        ],
    }


async def get_user_analytics(user_id: str) -> dict:
    """Get personal analytics for a specific user."""
    from api.database import get_pool
    pool = await get_pool()
    async with pool.acquire() as conn:
        row = await conn.fetchrow("""
            SELECT plan, created_at FROM users WHERE id = $1
        """, int(user_id))

        tasks_row = await conn.fetchrow("""
            SELECT jsonb_array_length(data) as task_count
            FROM user_data WHERE user_id = $1 AND data_type = 'tasks'
        """, int(user_id))

        prayer_count = await conn.fetchrow("""
            SELECT COUNT(*) as count, COALESCE(SUM(minutes), 0) as minutes
            FROM prayer_logs WHERE user_id = $1
        """, int(user_id))

        diary_count = await conn.fetchrow("""
            SELECT jsonb_array_length(data) as count
            FROM user_data WHERE user_id = $1 AND data_type = 'diary'
        """, int(user_id))

        feed_count = await conn.fetchrow("""
            SELECT COUNT(*) FROM community_feed WHERE user_id = $1
        """, int(user_id))

        thread_count = await conn.fetchrow("""
            SELECT COUNT(*) FROM forum_threads WHERE user_id = $1
        """, int(user_id))

        ai_queries = await conn.fetchval("""
            SELECT COUNT(*) FROM analytics_events
            WHERE user_id = $1 AND event_type LIKE 'ai_%'
        """, int(user_id)) or 0

    return {
        "account_age_days": (
            (datetime.now(timezone.utc) - row["created_at"]).days
            if row and row["created_at"] else 0
        ),
        "plan": row["plan"] if row else "free",
        "tasks": tasks_row["task_count"] if tasks_row else 0,
        "prayers": {
            "total_logs": prayer_count["count"] if prayer_count else 0,
            "total_minutes": prayer_count["minutes"] if prayer_count else 0,
        },
        "diary_entries": diary_count["count"] if diary_count else 0,
        "community_posts": feed_count["count"] if feed_count else 0,
        "forum_threads": thread_count["count"] if thread_count else 0,
        "ai_queries": ai_queries,
    }


import json