"""
Groups API — Small group management endpoints.
"""
import logging
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Optional, List

from .auth import get_current_user
from .group_service import (
    create_group,
    join_group,
    leave_group,
    get_user_groups,
    get_group_details,
    post_prayer_request,
    mark_prayer_answered,
    remove_member,
    refresh_invite_code,
)

logger = logging.getLogger("beliversflow.group_api")
router = APIRouter(prefix="/api/groups")


class CreateGroupRequest(BaseModel):
    name: str
    description: str = ""
    max_members: int = 50


class JoinGroupRequest(BaseModel):
    invite_code: str


class PrayerRequest(BaseModel):
    content: str


@router.post("/create")
async def groups_create(
    req: CreateGroupRequest,
    user=Depends(get_current_user),
):
    """Create a new small group."""
    return await create_group(
        creator_id=user["id"],
        name=req.name,
        description=req.description,
        max_members=req.max_members,
    )


@router.post("/join")
async def groups_join(
    req: JoinGroupRequest,
    user=Depends(get_current_user),
):
    """Join a group using an invite code."""
    return await join_group(invite_code=req.invite_code, user_id=user["id"])


@router.post("/{group_id}/leave")
async def groups_leave(
    group_id: str,
    user=Depends(get_current_user),
):
    """Leave a group."""
    return await leave_group(group_id=group_id, user_id=user["id"])


@router.get("")
async def groups_list(
    user=Depends(get_current_user),
):
    """Get all groups the user belongs to."""
    groups = await get_user_groups(user["id"])
    return {"groups": groups}


@router.get("/{group_id}")
async def groups_detail(
    group_id: str,
    user=Depends(get_current_user),
):
    """Get group details including members and prayer requests."""
    return await get_group_details(group_id=group_id, user_id=user["id"])


@router.post("/{group_id}/prayer")
async def groups_prayer_post(
    group_id: str,
    req: PrayerRequest,
    user=Depends(get_current_user),
):
    """Post a prayer request to the group."""
    return await post_prayer_request(
        group_id=group_id,
        user_id=user["id"],
        content=req.content,
    )


@router.post("/prayer/{prayer_id}/answered")
async def groups_prayer_answered(
    prayer_id: str,
    user=Depends(get_current_user),
):
    """Mark a prayer request as answered."""
    return await mark_prayer_answered(prayer_id=prayer_id, user_id=user["id"])


@router.delete("/{group_id}/members/{member_id}")
async def groups_remove_member(
    group_id: str,
    member_id: str,
    user=Depends(get_current_user),
):
    """Remove a member from the group (leaders only)."""
    return await remove_member(
        group_id=group_id,
        member_id=member_id,
        requester_id=user["id"],
    )


@router.post("/{group_id}/refresh-invite")
async def groups_refresh_invite(
    group_id: str,
    user=Depends(get_current_user),
):
    """Generate a new invite code (leaders only)."""
    return await refresh_invite_code(group_id=group_id, user_id=user["id"])
