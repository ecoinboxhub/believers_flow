"""
Events Calendar Service — Church and group events with RSVP.
"""
import logging
from datetime import datetime, timezone, timedelta
from typing import Optional, List

from fastapi import HTTPException

logger = logging.getLogger("beliversflow.events")


async def create_event(
    creator_id: str,
    title: str,
    description: str = "",
    event_type: str = "church",
    church_id: Optional[str] = None,
    group_id: Optional[str] = None,
    location: str = "",
    start_time: datetime = None,
    end_time: Optional[datetime] = None,
    is_recurring: bool = False,
    recurrence_rule: Optional[str] = None,
    max_attendees: Optional[int] = None,
) -> dict:
    """
    Create a calendar event.

    Args:
        creator_id: User creating the event
        title: Event title
        description: Event description
        event_type: 'church', 'group', or 'personal'
        church_id: Associated church ID (optional)
        group_id: Associated group ID (optional)
        location: Event location
        start_time: Event start time
        end_time: Event end time (optional)
        is_recurring: Whether event repeats
        recurrence_rule: RRULE format (optional)
        max_attendees: Maximum attendees (optional)

    Returns:
        dict with event details
    """
    from api.database import get_pool

    if not start_time:
        start_time = datetime.now(timezone.utc) + timedelta(hours=1)

    pool = await get_pool()
    async with pool.acquire() as conn:
        row = await conn.fetchrow("""
            INSERT INTO events (
                title, description, event_type, church_id, group_id,
                creator_id, location, start_time, end_time,
                is_recurring, recurrence_rule, max_attendees
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
            RETURNING id, created_at
        """, title, description, event_type,
            int(church_id) if church_id else None,
            int(group_id) if group_id else None,
            int(creator_id), location, start_time, end_time,
            is_recurring, recurrence_rule, max_attendees)

        # Add creator as attendee
        await conn.execute("""
            INSERT INTO event_attendees (event_id, user_id, status)
            VALUES ($1, $2, 'going')
        """, row["id"], int(creator_id))

    logger.info(f"Event created: {row['id']} - {title}")
    return {
        "id": row["id"],
        "title": title,
        "start_time": start_time.isoformat(),
        "created_at": row["created_at"].isoformat(),
    }


async def get_events(
    user_id: str,
    church_id: Optional[str] = None,
    group_id: Optional[str] = None,
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
    event_type: Optional[str] = None,
    limit: int = 50,
) -> List[dict]:
    """Get events for a user's churches and groups."""
    from api.database import get_pool

    pool = await get_pool()
    async with pool.acquire() as conn:
        conditions = ["e.is_active = TRUE"]
        params = []
        param_idx = 1

        # Filter by user's memberships
        if church_id:
            conditions.append(f"e.church_id = ${param_idx}")
            params.append(int(church_id))
            param_idx += 1
        else:
            conditions.append(f"""
                (e.church_id IN (
                    SELECT church_id FROM church_members
                    WHERE user_id = ${param_idx} AND left_at IS NULL
                ) OR e.group_id IN (
                    SELECT group_id FROM group_members
                    WHERE user_id = ${param_idx} AND left_at IS NULL
                ) OR e.creator_id = ${param_idx})
            """)
            params.append(int(user_id))
            param_idx += 1

        if group_id:
            conditions.append(f"e.group_id = ${param_idx}")
            params.append(int(group_id))
            param_idx += 1

        if start_date:
            conditions.append(f"e.start_time >= ${param_idx}")
            params.append(start_date)
            param_idx += 1

        if end_date:
            conditions.append(f"e.start_time <= ${param_idx}")
            params.append(end_date)
            param_idx += 1

        if event_type:
            conditions.append(f"e.event_type = ${param_idx}")
            params.append(event_type)
            param_idx += 1

        where_clause = " AND ".join(conditions)

        rows = await conn.fetch(f"""
            SELECT e.*, u.name as creator_name,
                   (SELECT COUNT(*) FROM event_attendees WHERE event_id = e.id AND status = 'going') as attendee_count,
                   (SELECT EXISTS(
                       SELECT 1 FROM event_attendees
                       WHERE event_id = e.id AND user_id = ${param_idx} AND status = 'going'
                   )) as user_going
            FROM events e
            JOIN users u ON e.creator_id = u.id
            WHERE {where_clause}
            ORDER BY e.start_time ASC
            LIMIT ${param_idx + 1}
        """, *params, limit)

    return [
        {
            "id": r["id"],
            "title": r["title"],
            "description": r["description"],
            "event_type": r["event_type"],
            "location": r["location"],
            "start_time": r["start_time"].isoformat() if r["start_time"] else None,
            "end_time": r["end_time"].isoformat() if r["end_time"] else None,
            "creator_name": r["creator_name"],
            "attendee_count": r["attendee_count"],
            "user_going": r["user_going"],
            "max_attendees": r["max_attendees"],
        }
        for r in rows
    ]


async def get_event(event_id: str) -> dict:
    """Get event details with attendees."""
    from api.database import get_pool

    pool = await get_pool()
    async with pool.acquire() as conn:
        event = await conn.fetchrow("""
            SELECT e.*, u.name as creator_name
            FROM events e
            JOIN users u ON e.creator_id = u.id
            WHERE e.id = $1 AND e.is_active = TRUE
        """, int(event_id))

        if not event:
            raise HTTPException(status_code=404, detail="Event not found")

        attendees = await conn.fetch("""
            SELECT ea.user_id, ea.status, ea.rsvp_at, u.name
            FROM event_attendees ea
            JOIN users u ON ea.user_id = u.id
            WHERE ea.event_id = $1
            ORDER BY ea.rsvp_at ASC
        """, int(event_id))

    return {
        "id": event["id"],
        "title": event["title"],
        "description": event["description"],
        "event_type": event["event_type"],
        "location": event["location"],
        "start_time": event["start_time"].isoformat() if event["start_time"] else None,
        "end_time": event["end_time"].isoformat() if event["end_time"] else None,
        "creator_name": event["creator_name"],
        "max_attendees": event["max_attendees"],
        "attendees": [
            {"user_id": a["user_id"], "name": a["name"], "status": a["status"]}
            for a in attendees
        ],
    }


async def rsvp_event(
    event_id: str,
    user_id: str,
    status: str = "going",
) -> dict:
    """
    RSVP to an event.

    Args:
        event_id: Event ID
        user_id: User RSVPing
        status: 'going', 'maybe', or 'not_going'
    """
    from api.database import get_pool

    if status not in ("going", "maybe", "not_going"):
        raise HTTPException(status_code=400, detail="Invalid status")

    pool = await get_pool()
    async with pool.acquire() as conn:
        # Check max attendees
        if status == "going":
            event = await conn.fetchrow("""
                SELECT max_attendees FROM events WHERE id = $1
            """, int(event_id))

            if event and event["max_attendees"]:
                count = await conn.fetchval("""
                    SELECT COUNT(*) FROM event_attendees
                    WHERE event_id = $1 AND status = 'going'
                """, int(event_id))

                if count >= event["max_attendees"]:
                    raise HTTPException(status_code=400, detail="Event is full")

        await conn.execute("""
            INSERT INTO event_attendees (event_id, user_id, status)
            VALUES ($1, $2, $3)
            ON CONFLICT (event_id, user_id)
            DO UPDATE SET status = $3, rsvp_at = NOW()
        """, int(event_id), int(user_id), status)

    return {"status": "rsvp_updated", "rsvp": status}


async def cancel_event(event_id: str, user_id: str) -> dict:
    """Cancel an event (creator only)."""
    from api.database import get_pool

    pool = await get_pool()
    async with pool.acquire() as conn:
        result = await conn.execute("""
            UPDATE events
            SET is_active = FALSE, updated_at = NOW()
            WHERE id = $1 AND creator_id = $2
        """, int(event_id), int(user_id))

        if result == "UPDATE 0":
            raise HTTPException(status_code=404, detail="Event not found or not creator")

    return {"status": "cancelled"}


async def delete_event(event_id: str, user_id: str) -> dict:
    """Permanently delete an event (creator only)."""
    from api.database import get_pool

    pool = await get_pool()
    async with pool.acquire() as conn:
        result = await conn.execute("""
            DELETE FROM events
            WHERE id = $1 AND creator_id = $2
        """, int(event_id), int(user_id))

        if result == "DELETE 0":
            raise HTTPException(status_code=404, detail="Event not found or not creator")

    return {"status": "deleted"}
