"""
Church Directory API — Church profiles, search, and membership endpoints.
"""
import logging
from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from typing import Optional, List

from .auth import get_current_user
from .church_service import (
    create_church,
    update_church,
    get_church,
    search_churches,
    join_church,
    leave_church,
    get_user_churches,
)

logger = logging.getLogger("beliversflow.church_api")
router = APIRouter(prefix="/api/churches")


class CreateChurchRequest(BaseModel):
    name: str
    denomination: str = ""
    address: str = ""
    city: str = ""
    country: str = ""
    phone: str = ""
    email: str = ""
    website: str = ""
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    description: str = ""


class UpdateChurchRequest(BaseModel):
    name: Optional[str] = None
    denomination: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    country: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    website: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    description: Optional[str] = None


@router.post("/create")
async def churches_create(
    req: CreateChurchRequest,
    user=Depends(get_current_user),
):
    """Create a new church profile."""
    return await create_church(
        admin_id=user["id"],
        name=req.name,
        denomination=req.denomination,
        address=req.address,
        city=req.city,
        country=req.country,
        phone=req.phone,
        email=req.email,
        website=req.website,
        latitude=req.latitude,
        longitude=req.longitude,
        description=req.description,
    )


@router.put("/{church_id}")
async def churches_update(
    church_id: str,
    req: UpdateChurchRequest,
    user=Depends(get_current_user),
):
    """Update church profile (admin only)."""
    updates = req.model_dump(exclude_none=True)
    return await update_church(church_id=church_id, admin_id=user["id"], updates=updates)


@router.get("/{church_id}")
async def churches_detail(church_id: str):
    """Get church details."""
    return await get_church(church_id=church_id)


@router.get("/search")
async def churches_search(
    q: str = Query("", description="Search query"),
    denomination: str = Query("", description="Filter by denomination"),
    city: str = Query("", description="Filter by city"),
    country: str = Query("", description="Filter by country"),
    lat: Optional[float] = Query(None, description="Latitude for proximity search"),
    lng: Optional[float] = Query(None, description="Longitude for proximity search"),
    radius: float = Query(50, description="Search radius in km"),
    limit: int = Query(20, description="Max results"),
):
    """Search for churches by name, denomination, location."""
    return await search_churches(
        query=q,
        denomination=denomination,
        city=city,
        country=country,
        latitude=lat,
        longitude=lng,
        radius_km=radius,
        limit=limit,
    )


@router.post("/{church_id}/join")
async def churches_join(
    church_id: str,
    user=Depends(get_current_user),
):
    """Join a church as a member."""
    return await join_church(church_id=church_id, user_id=user["id"])


@router.post("/{church_id}/leave")
async def churches_leave(
    church_id: str,
    user=Depends(get_current_user),
):
    """Leave a church."""
    return await leave_church(church_id=church_id, user_id=user["id"])


@router.get("/user/my")
async def churches_my(
    user=Depends(get_current_user),
):
    """Get churches the user belongs to."""
    churches = await get_user_churches(user["id"])
    return {"churches": churches}
