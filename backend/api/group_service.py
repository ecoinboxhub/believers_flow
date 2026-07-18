"""
Small Group Service — Group creation, invite system, shared prayer lists.
"""
import os
import logging
import secrets
from datetime import datetime, timezone
from typing import Optional, List

import httpx
from fastapi import HTTPException

logger = logging.getLogger("beliversflow.groups")

MAX_MEMBERS = 50
INVITE_CODE_LENGTH = 8


async def create_group(
    creator_id: str,
    name: str,
    description: str = "",
    max_members: int = MAX_MEMBERS,
) -> dict:
    """
    Create a new small group.

    Args:
        creator_id: User ID of the group creator
        name: Group name
        description: Group description
        max_members: Maximum members allowed (default 50)

    Returns:
        dict with group details and invite code
    """
    from api.database import get_pool

    invite_code = secrets.token_urlsafe(INVITE_CODE_LENGTH)[:INVITE_CODE_LENGTH].upper()

    pool = await get_pool()
    async with pool.acquire() as conn:
        # Create group
        row = await conn.fetchrow("""
            INSERT INTO small_groups (name, description, creator_id, invite_code, max_members)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING id, name, description, invite_code, max_members, created_at
        """, name, description, int(creator_id), invite_code, max_members)

        # Add creator as leader
        await conn.execute("""
            INSERT INTO group_members (group_id, user_id, role)
            VALUES ($1, $2, 'leader')
        """, row["id"], int(creator_id))

    logger.info(f"Group created: {row['id']} by user {creator_id}")
    return {
        "id": row["id"],
        "name": row["name"],
        "description": row["description"],
        "invite_code": row["invite_code"],
        "max_members": row["max_members"],
        "member_count": 1,
        "created_at": row["created_at"].isoformat(),
    }


async def join_group(invite_code: str, user_id: str) -> dict:
    """
    Join a group using an invite code.

    Args:
        invite_code: Group invite code
        user_id: User joining the group

    Returns:
        dict with join result
    """
    from api.database import get_pool

    pool = await get_pool()
    async with pool.acquire() as conn:
        # Find group
        group = await conn.fetchrow("""
            SELECT id, name, max_members, is_active
            FROM small_groups
            WHERE invite_code = $1 AND is_active = TRUE
        """, invite_code.upper())

        if not group:
            raise HTTPException(status_code=404, detail="Invalid or inactive invite code")

        # Check if already a member
        existing = await conn.fetchval("""
            SELECT EXISTS(
                SELECT 1 FROM group_members
                WHERE group_id = $1 AND user_id = $2 AND left_at IS NULL
            )
        """, group["id"], int(user_id))

        if existing:
            raise HTTPException(status_code=400, detail="Already a member of this group")

        # Check member count
        count = await conn.fetchval("""
            SELECT COUNT(*) FROM group_members
            WHERE group_id = $1 AND left_at IS NULL
        """, group["id"])

        if count >= group["max_members"]:
            raise HTTPException(status_code=400, detail="Group is full")

        # Join
        await conn.execute("""
            INSERT INTO group_members (group_id, user_id, role)
            VALUES ($1, $2, 'member')
        """, group["id"], int(user_id))

    logger.info(f"User {user_id} joined group {group['id']}")
    return {"status": "joined", "group_name": group["name"]}


async def leave_group(group_id: str, user_id: str) -> dict:
    """Leave a group."""
    from api.database import get_pool

    pool = await get_pool()
    async with pool.acquire() as conn:
        result = await conn.execute("""
            UPDATE group_members
            SET left_at = NOW()
            WHERE group_id = $1 AND user_id = $2 AND left_at IS NULL
        """, int(group_id), int(user_id))

        if result == "UPDATE 0":
            raise HTTPException(status_code=404, detail="Not a member of this group")

    return {"status": "left"}


async def get_user_groups(user_id: str) -> List[dict]:
    """Get all groups a user belongs to."""
    from api.database import get_pool

    pool = await get_pool()
    async with pool.acquire() as conn:
        rows = await conn.fetch("""
            SELECT g.id, g.name, g.description, g.invite_code, g.max_members,
                   gm.role, g.created_at,
                   (SELECT COUNT(*) FROM group_members WHERE group_id = g.id AND left_at IS NULL) as member_count
            FROM small_groups g
            JOIN group_members gm ON g.id = gm.group_id
            WHERE gm.user_id = $1 AND gm.left_at IS NULL AND g.is_active = TRUE
            ORDER BY g.created_at DESC
        """, int(user_id))

    return [
        {
            "id": r["id"],
            "name": r["name"],
            "description": r["description"],
            "invite_code": r["invite_code"],
            "max_members": r["max_members"],
            "member_count": r["member_count"],
            "role": r["role"],
            "created_at": r["created_at"].isoformat(),
        }
        for r in rows
    ]


async def get_group_details(group_id: str, user_id: str) -> dict:
    """Get group details including members."""
    from api.database import get_pool

    pool = await get_pool()
    async with pool.acquire() as conn:
        # Check membership
        is_member = await conn.fetchval("""
            SELECT EXISTS(
                SELECT 1 FROM group_members
                WHERE group_id = $1 AND user_id = $2 AND left_at IS NULL
            )
        """, int(group_id), int(user_id))

        if not is_member:
            raise HTTPException(status_code=403, detail="Not a member of this group")

        # Get group info
        group = await conn.fetchrow("""
            SELECT g.*, u.name as creator_name
            FROM small_groups g
            JOIN users u ON g.creator_id = u.id
            WHERE g.id = $1
        """, int(group_id))

        # Get members
        members = await conn.fetch("""
            SELECT gm.user_id, gm.role, gm.joined_at, u.name, u.email
            FROM group_members gm
            JOIN users u ON gm.user_id = u.id
            WHERE gm.group_id = $1 AND gm.left_at IS NULL
            ORDER BY gm.joined_at ASC
        """, int(group_id))

        # Get shared prayer requests
        prayers = await conn.fetch("""
            SELECT pr.id, pr.content, pr.is_answered, pr.created_at, u.name as author_name
            FROM prayer_requests pr
            JOIN users u ON pr.user_id = u.id
            WHERE pr.group_id = $1
            ORDER BY pr.created_at DESC
            LIMIT 20
        """, int(group_id))

    return {
        "id": group["id"],
        "name": group["name"],
        "description": group["description"],
        "invite_code": group["invite_code"],
        "max_members": group["max_members"],
        "member_count": len(members),
        "creator_name": group["creator_name"],
        "created_at": group["created_at"].isoformat(),
        "members": [
            {
                "user_id": m["user_id"],
                "name": m["name"],
                "role": m["role"],
                "joined_at": m["joined_at"].isoformat(),
            }
            for m in members
        ],
        "prayer_requests": [
            {
                "id": p["id"],
                "content": p["content"],
                "is_answered": p["is_answered"],
                "author_name": p["author_name"],
                "created_at": p["created_at"].isoformat(),
            }
            for p in prayers
        ],
    }


async def post_prayer_request(
    group_id: str,
    user_id: str,
    content: str,
) -> dict:
    """Post a prayer request to a group."""
    from api.database import get_pool

    pool = await get_pool()
    async with pool.acquire() as conn:
        # Check membership
        is_member = await conn.fetchval("""
            SELECT EXISTS(
                SELECT 1 FROM group_members
                WHERE group_id = $1 AND user_id = $2 AND left_at IS NULL
            )
        """, int(group_id), int(user_id))

        if not is_member:
            raise HTTPException(status_code=403, detail="Not a member of this group")

        row = await conn.fetchrow("""
            INSERT INTO prayer_requests (group_id, user_id, content)
            VALUES ($1, $2, $3)
            RETURNING id, content, created_at
        """, int(group_id), int(user_id), content)

    return {
        "id": row["id"],
        "content": row["content"],
        "created_at": row["created_at"].isoformat(),
    }


async def mark_prayer_answered(
    prayer_id: str,
    user_id: str,
) -> dict:
    """Mark a prayer request as answered."""
    from api.database import get_pool

    pool = await get_pool()
    async with pool.acquire() as conn:
        result = await conn.execute("""
            UPDATE prayer_requests
            SET is_answered = TRUE, answered_at = NOW()
            WHERE id = $1 AND user_id = $2
        """, int(prayer_id), int(user_id))

        if result == "UPDATE 0":
            raise HTTPException(status_code=404, detail="Prayer request not found")

    return {"status": "marked_answered"}


async def remove_member(
    group_id: str,
    member_id: str,
    requester_id: str,
) -> dict:
    """Remove a member from group (leaders only)."""
    from api.database import get_pool

    pool = await get_pool()
    async with pool.acquire() as conn:
        # Check requester is leader
        is_leader = await conn.fetchval("""
            SELECT EXISTS(
                SELECT 1 FROM group_members
                WHERE group_id = $1 AND user_id = $2 AND role = 'leader' AND left_at IS NULL
            )
        """, int(group_id), int(requester_id))

        if not is_leader:
            raise HTTPException(status_code=403, detail="Only leaders can remove members")

        # Can't remove yourself via this endpoint
        if member_id == requester_id:
            raise HTTPException(status_code=400, detail="Use leave group instead")

        result = await conn.execute("""
            UPDATE group_members
            SET left_at = NOW()
            WHERE group_id = $1 AND user_id = $2 AND left_at IS NULL
        """, int(group_id), int(member_id))

        if result == "UPDATE 0":
            raise HTTPException(status_code=404, detail="Member not found")

    return {"status": "removed"}


async def refresh_invite_code(group_id: str, user_id: str) -> dict:
    """Generate a new invite code (leaders only)."""
    from api.database import get_pool

    new_code = secrets.token_urlsafe(INVITE_CODE_LENGTH)[:INVITE_CODE_LENGTH].upper()

    pool = await get_pool()
    async with pool.acquire() as conn:
        is_leader = await conn.fetchval("""
            SELECT EXISTS(
                SELECT 1 FROM group_members
                WHERE group_id = $1 AND user_id = $2 AND role = 'leader' AND left_at IS NULL
            )
        """, int(group_id), int(user_id))

        if not is_leader:
            raise HTTPException(status_code=403, detail="Only leaders can refresh invite codes")

        await conn.execute("""
            UPDATE small_groups
            SET invite_code = $1, updated_at = NOW()
            WHERE id = $2
        """, new_code, int(group_id))

    return {"invite_code": new_code}
