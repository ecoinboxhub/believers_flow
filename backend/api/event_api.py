"""
Events API — Calendar event management endpoints.
"""
import logging
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from typing import Optional, List

from .auth import get_current_user
from .event_service import (
    create_event,
    get_events,
    get_event,
    rsvp_event,
    cancel_event,
    delete_event,
)

logger = logging.getLogger("beliversflow.event_api")
router = APIRouter(prefix="/api/events")


class CreateEventRequest(BaseModel):
    title: str
    description: str = ""
    event_type: str = "church"
    church_id: Optional[str] = None
    group_id: Optional[str] = None
    location: str = ""
    start_time: datetime
    end_time: Optional[datetime] = None
    is_recurring: bool = False
    recurrence_rule: Optional[str] = None
    max_attendees: Optional[int] = None


@router.post("/create")
async def events_create(
    req: CreateEventRequest,
    user=Depends(get_current_user),
):
    """Create a new calendar event."""
    return await create_event(
        creator_id=user["id"],
        title=req.title,
        description=req.description,
        event_type=req.event_type,
        church_id=req.church_id,
        group_id=req.group_id,
        location=req.location,
        start_time=req.start_time,
        end_time=req.end_time,
        is_recurring=req.is_recurring,
        recurrence_rule=req.recurrence_rule,
        max_attendees=req.max_attendees,
    )


@router.get("")
async def events_list(
    church_id: Optional[str] = Query(None),
    group_id: Optional[str] = Query(None),
    start_date: Optional[datetime] = Query(None),
    end_date: Optional[datetime] = Query(None),
    event_type: Optional[str] = Query(None),
    limit: int = Query(50),
    user=Depends(get_current_user),
):
    """Get events for the user's churches and groups."""
    events = await get_events(
        user_id=user["id"],
        church_id=church_id,
        group_id=group_id,
        start_date=start_date,
        end_date=end_date,
        event_type=event_type,
        limit=limit,
    )
    return {"events": events}


@router.get("/{event_id}")
async def events_detail(event_id: str):
    """Get event details with attendees."""
    return await get_event(event_id=event_id)


@router.post("/{event_id}/rsvp")
async def events_rsvp(
    event_id: str,
    status: str = "going",
    user=Depends(get_current_user),
):
    """RSVP to an event (going/maybe/not_going)."""
    return await rsvp_event(event_id=event_id, user_id=user["id"], status=status)


@router.post("/{event_id}/cancel")
async def events_cancel(
    event_id: str,
    user=Depends(get_current_user),
):
    """Cancel an event (creator only)."""
    return await cancel_event(event_id=event_id, user_id=user["id"])


@router.delete("/{event_id}")
async def events_delete(
    event_id: str,
    user=Depends(get_current_user),
):
    """Delete an event permanently (creator only)."""
    return await delete_event(event_id=event_id, user_id=user["id"])
