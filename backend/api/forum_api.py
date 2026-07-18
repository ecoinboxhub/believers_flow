"""
Community Forum API — Discussion threads, replies, and moderation endpoints.
"""
import logging
from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel
from typing import Optional, List

from .auth import get_current_user
from .forum_service import (
    create_category,
    get_categories,
    create_thread,
    get_threads,
    get_thread,
    create_reply,
    mark_solution,
    delete_thread,
    delete_reply,
    pin_thread,
)

logger = logging.getLogger("beliversflow.forum_api")
router = APIRouter(prefix="/api/forum")


class CreateThreadRequest(BaseModel):
    category_id: str
    title: str
    content: str
    tags: Optional[List[str]] = None


class ReplyRequest(BaseModel):
    content: str


@router.post("/categories")
async def forum_categories_create(
    name: str,
    description: str = "",
    icon: str = "",
):
    """Create a forum category."""
    return await create_category(name=name, description=description, icon=icon)


@router.get("/categories")
async def forum_categories_list():
    """Get all forum categories."""
    categories = await get_categories()
    return {"categories": categories}


@router.post("/threads")
async def forum_threads_create(
    req: CreateThreadRequest,
    user=Depends(get_current_user),
):
    """Create a new forum thread."""
    return await create_thread(
        user_id=user["id"],
        category_id=req.category_id,
        title=req.title,
        content=req.content,
        tags=req.tags,
    )


@router.get("/threads")
async def forum_threads_list(
    category_id: Optional[str] = Query(None),
    search: str = Query(""),
    sort: str = Query("recent"),
    limit: int = Query(50),
    offset: int = Query(0),
):
    """Get forum threads."""
    threads = await get_threads(
        category_id=category_id,
        search=search,
        sort=sort,
        limit=limit,
        offset=offset,
    )
    return {"threads": threads}


@router.get("/threads/{thread_id}")
async def forum_threads_detail(thread_id: str):
    """Get a thread with replies."""
    return await get_thread(thread_id=thread_id)


@router.post("/threads/{thread_id}/replies")
async def forum_replies_create(
    thread_id: str,
    req: ReplyRequest,
    user=Depends(get_current_user),
):
    """Reply to a thread."""
    return await create_reply(
        thread_id=thread_id,
        user_id=user["id"],
        content=req.content,
    )


@router.post("/replies/{reply_id}/solution")
async def forum_replies_solution(
    reply_id: str,
    thread_id: str,
    user=Depends(get_current_user),
):
    """Mark a reply as the solution."""
    return await mark_solution(
        reply_id=reply_id,
        thread_id=thread_id,
        user_id=user["id"],
    )


@router.delete("/threads/{thread_id}")
async def forum_threads_delete(
    thread_id: str,
    user=Depends(get_current_user),
):
    """Delete a thread."""
    return await delete_thread(thread_id=thread_id, user_id=user["id"])


@router.delete("/replies/{reply_id}")
async def forum_replies_delete(
    reply_id: str,
    user=Depends(get_current_user),
):
    """Delete a reply."""
    return await delete_reply(reply_id=reply_id, user_id=user["id"])


@router.post("/threads/{thread_id}/pin")
async def forum_threads_pin(
    thread_id: str,
    user=Depends(get_current_user),
):
    """Pin/unpin a thread (moderator only)."""
    return await pin_thread(thread_id=thread_id, user_id=user["id"])
