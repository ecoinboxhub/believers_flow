"""
Community Forum Service — Discussion threads, moderation, categories.
"""
import logging
from datetime import datetime, timezone
from typing import Optional, List

from fastapi import HTTPException

logger = logging.getLogger("beliversflow.forum")


async def create_category(
    name: str,
    description: str = "",
    icon: str = "",
    sort_order: int = 0,
) -> dict:
    """Create a forum category."""
    from api.database import get_pool

    pool = await get_pool()
    async with pool.acquire() as conn:
        row = await conn.fetchrow("""
            INSERT INTO forum_categories (name, description, icon, sort_order)
            VALUES ($1, $2, $3, $4)
            RETURNING id, created_at
        """, name, description, icon, sort_order)

    return {"id": row["id"], "name": name, "created_at": row["created_at"].isoformat()}


async def get_categories() -> List[dict]:
    """Get all forum categories."""
    from api.database import get_pool

    pool = await get_pool()
    async with pool.acquire() as conn:
        rows = await conn.fetch("""
            SELECT fc.*,
                   (SELECT COUNT(*) FROM forum_threads WHERE category_id = fc.id AND is_active = TRUE) as thread_count
            FROM forum_categories fc
            WHERE fc.is_active = TRUE
            ORDER BY fc.sort_order, fc.name
        """)

    return [
        {
            "id": r["id"],
            "name": r["name"],
            "description": r["description"],
            "icon": r["icon"],
            "thread_count": r["thread_count"],
        }
        for r in rows
    ]


async def create_thread(
    user_id: str,
    category_id: str,
    title: str,
    content: str,
    tags: Optional[List[str]] = None,
) -> dict:
    """Create a new forum thread."""
    import json
    from api.database import get_pool

    pool = await get_pool()
    async with pool.acquire() as conn:
        row = await conn.fetchrow("""
            INSERT INTO forum_threads (category_id, user_id, title, content, tags)
            VALUES ($1, $2, $3, $4, $5::jsonb)
            RETURNING id, created_at
        """, int(category_id), int(user_id), title, content, json.dumps(tags or []))

    logger.info(f"Forum thread created: {row['id']} by user {user_id}")
    return {"id": row["id"], "title": title, "created_at": row["created_at"].isoformat()}


async def get_threads(
    category_id: Optional[str] = None,
    search: str = "",
    sort: str = "recent",
    limit: int = 50,
    offset: int = 0,
) -> List[dict]:
    """Get forum threads."""
    import json
    from api.database import get_pool

    pool = await get_pool()
    async with pool.acquire() as conn:
        conditions = ["ft.is_active = TRUE"]
        params = []
        param_idx = 1

        if category_id:
            conditions.append(f"ft.category_id = ${param_idx}")
            params.append(int(category_id))
            param_idx += 1

        if search:
            conditions.append(f"(ft.title ILIKE ${param_idx} OR ft.content ILIKE ${param_idx})")
            params.append(f"%{search}%")
            param_idx += 1

        where_clause = " AND ".join(conditions)

        order_map = {
            "recent": "ft.created_at DESC",
            "popular": "ft.view_count DESC",
            "active": "ft.last_reply_at DESC NULLS LAST",
        }
        order = order_map.get(sort, "ft.created_at DESC")

        rows = await conn.fetch(f"""
            SELECT ft.*, u.name as author_name,
                   (SELECT COUNT(*) FROM forum_replies WHERE thread_id = ft.id AND is_active = TRUE) as reply_count,
                   fc.name as category_name
            FROM forum_threads ft
            JOIN users u ON ft.user_id = u.id
            JOIN forum_categories fc ON ft.category_id = fc.id
            WHERE {where_clause}
            ORDER BY {order}
            LIMIT ${param_idx} OFFSET ${param_idx + 1}
        """, *params, limit, offset)

    return [
        {
            "id": r["id"],
            "title": r["title"],
            "content": r["content"],
            "author_name": r["author_name"],
            "category_name": r["category_name"],
            "category_id": r["category_id"],
            "tags": json.loads(r["tags"]) if r["tags"] else [],
            "view_count": r["view_count"],
            "reply_count": r["reply_count"],
            "is_pinned": r["is_pinned"],
            "created_at": r["created_at"].isoformat(),
            "last_reply_at": r["last_reply_at"].isoformat() if r["last_reply_at"] else None,
        }
        for r in rows
    ]


async def get_thread(thread_id: str) -> dict:
    """Get a thread with replies."""
    import json
    from api.database import get_pool

    pool = await get_pool()
    async with pool.acquire() as conn:
        # Increment view count
        await conn.execute("""
            UPDATE forum_threads
            SET view_count = view_count + 1
            WHERE id = $1
        """, int(thread_id))

        thread = await conn.fetchrow("""
            SELECT ft.*, u.name as author_name, fc.name as category_name
            FROM forum_threads ft
            JOIN users u ON ft.user_id = u.id
            JOIN forum_categories fc ON ft.category_id = fc.id
            WHERE ft.id = $1 AND ft.is_active = TRUE
        """, int(thread_id))

        if not thread:
            raise HTTPException(status_code=404, detail="Thread not found")

        replies = await conn.fetch("""
            SELECT fr.*, u.name as author_name
            FROM forum_replies fr
            JOIN users u ON fr.user_id = u.id
            WHERE fr.thread_id = $1 AND fr.is_active = TRUE
            ORDER BY fr.created_at ASC
        """, int(thread_id))

    return {
        "id": thread["id"],
        "title": thread["title"],
        "content": thread["content"],
        "author_name": thread["author_name"],
        "author_id": thread["user_id"],
        "category_name": thread["category_name"],
        "category_id": thread["category_id"],
        "tags": json.loads(thread["tags"]) if thread["tags"] else [],
        "view_count": thread["view_count"] + 1,
        "is_pinned": thread["is_pinned"],
        "created_at": thread["created_at"].isoformat(),
        "replies": [
            {
                "id": r["id"],
                "content": r["content"],
                "author_name": r["author_name"],
                "author_id": r["user_id"],
                "is_solution": r["is_solution"],
                "created_at": r["created_at"].isoformat(),
            }
            for r in replies
        ],
    }


async def create_reply(
    thread_id: str,
    user_id: str,
    content: str,
) -> dict:
    """Reply to a thread."""
    from api.database import get_pool

    pool = await get_pool()
    async with pool.acquire() as conn:
        # Check thread exists
        exists = await conn.fetchval("""
            SELECT EXISTS(SELECT 1 FROM forum_threads WHERE id = $1 AND is_active = TRUE)
        """, int(thread_id))

        if not exists:
            raise HTTPException(status_code=404, detail="Thread not found")

        row = await conn.fetchrow("""
            INSERT INTO forum_replies (thread_id, user_id, content)
            VALUES ($1, $2, $3)
            RETURNING id, created_at
        """, int(thread_id), int(user_id), content)

        # Update last reply time
        await conn.execute("""
            UPDATE forum_threads
            SET last_reply_at = NOW()
            WHERE id = $1
        """, int(thread_id))

    return {"id": row["id"], "created_at": row["created_at"].isoformat()}


async def mark_solution(
    reply_id: str,
    thread_id: str,
    user_id: str,
) -> dict:
    """Mark a reply as the solution (thread author only)."""
    from api.database import get_pool

    pool = await get_pool()
    async with pool.acquire() as conn:
        # Check user is thread author
        is_author = await conn.fetchval("""
            SELECT EXISTS(
                SELECT 1 FROM forum_threads
                WHERE id = $1 AND user_id = $2
            )
        """, int(thread_id), int(user_id))

        if not is_author:
            raise HTTPException(status_code=403, detail="Only thread author can mark solutions")

        # Unmark existing solution
        await conn.execute("""
            UPDATE forum_replies
            SET is_solution = FALSE
            WHERE thread_id = $1
        """, int(thread_id))

        # Mark new solution
        result = await conn.execute("""
            UPDATE forum_replies
            SET is_solution = TRUE
            WHERE id = $1 AND thread_id = $2
        """, int(reply_id), int(thread_id))

        if result == "UPDATE 0":
            raise HTTPException(status_code=404, detail="Reply not found")

    return {"status": "marked_solution"}


async def delete_thread(thread_id: str, user_id: str) -> dict:
    """Soft delete a thread (author or moderator)."""
    from api.database import get_pool

    pool = await get_pool()
    async with pool.acquire() as conn:
        result = await conn.execute("""
            UPDATE forum_threads
            SET is_active = FALSE
            WHERE id = $1 AND (user_id = $2 OR $2 IN (
                SELECT user_id FROM forum_moderators WHERE is_active = TRUE
            ))
        """, int(thread_id), int(user_id))

        if result == "UPDATE 0":
            raise HTTPException(status_code=404, detail="Thread not found or not authorized")

    return {"status": "deleted"}


async def delete_reply(reply_id: str, user_id: str) -> dict:
    """Soft delete a reply (author or moderator)."""
    from api.database import get_pool

    pool = await get_pool()
    async with pool.acquire() as conn:
        result = await conn.execute("""
            UPDATE forum_replies
            SET is_active = FALSE
            WHERE id = $1 AND (user_id = $2 OR $2 IN (
                SELECT user_id FROM forum_moderators WHERE is_active = TRUE
            ))
        """, int(reply_id), int(user_id))

        if result == "UPDATE 0":
            raise HTTPException(status_code=404, detail="Reply not found or not authorized")

    return {"status": "deleted"}


async def pin_thread(thread_id: str, user_id: str) -> dict:
    """Pin/unpin a thread (moderator only)."""
    from api.database import get_pool

    pool = await get_pool()
    async with pool.acquire() as conn:
        is_mod = await conn.fetchval("""
            SELECT EXISTS(
                SELECT 1 FROM forum_moderators
                WHERE user_id = $1 AND is_active = TRUE
            )
        """, int(user_id))

        if not is_mod:
            raise HTTPException(status_code=403, detail="Moderator access required")

        row = await conn.fetchrow("""
            UPDATE forum_threads
            SET is_pinned = NOT is_pinned
            WHERE id = $1
            RETURNING is_pinned
        """, int(thread_id))

        if not row:
            raise HTTPException(status_code=404, detail="Thread not found")

    return {"status": "updated", "is_pinned": row["is_pinned"]}
