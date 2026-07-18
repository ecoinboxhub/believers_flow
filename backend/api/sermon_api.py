"""
Sermon Notes API — Sermon note management and AI summarization endpoints.
"""
import logging
from datetime import datetime
from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel
from typing import Optional, List

from .auth import get_current_user
from .sermon_service import (
    create_sermon_note,
    get_sermon_notes,
    get_sermon_note,
    update_sermon_note,
    delete_sermon_note,
    summarize_sermon,
    export_sermon_notes,
)

logger = logging.getLogger("beliversflow.sermon_api")
router = APIRouter(prefix="/api/sermons")


class CreateSermonNoteRequest(BaseModel):
    title: str
    church_id: Optional[str] = None
    preacher: str = ""
    date: Optional[datetime] = None
    scripture_refs: Optional[List[str]] = None
    key_points: Optional[List[str]] = None
    content: str = ""
    tags: Optional[List[str]] = None


class UpdateSermonNoteRequest(BaseModel):
    title: Optional[str] = None
    preacher: Optional[str] = None
    date: Optional[datetime] = None
    church_id: Optional[str] = None
    content: Optional[str] = None
    scripture_refs: Optional[List[str]] = None
    key_points: Optional[List[str]] = None
    tags: Optional[List[str]] = None


class SummarizeRequest(BaseModel):
    sermon_text: str
    provider: str = "groq"


@router.post("/create")
async def sermons_create(
    req: CreateSermonNoteRequest,
    user=Depends(get_current_user),
):
    """Create a new sermon note."""
    return await create_sermon_note(
        user_id=user["id"],
        title=req.title,
        church_id=req.church_id,
        preacher=req.preacher,
        date=req.date,
        scripture_refs=req.scripture_refs,
        key_points=req.key_points,
        content=req.content,
        tags=req.tags,
    )


@router.get("")
async def sermons_list(
    church_id: Optional[str] = Query(None),
    search: str = Query(""),
    limit: int = Query(50),
    user=Depends(get_current_user),
):
    """Get sermon notes."""
    notes = await get_sermon_notes(
        user_id=user["id"],
        church_id=church_id,
        search=search,
        limit=limit,
    )
    return {"notes": notes}


@router.get("/{note_id}")
async def sermons_detail(
    note_id: str,
    user=Depends(get_current_user),
):
    """Get a single sermon note."""
    if not note_id.isdigit():
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Sermon note not found")
    return await get_sermon_note(note_id=int(note_id), user_id=user["id"])


@router.put("/{note_id}")
async def sermons_update(
    note_id: str,
    req: UpdateSermonNoteRequest,
    user=Depends(get_current_user),
):
    """Update a sermon note."""
    if not note_id.isdigit():
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Sermon note not found")
    updates = req.model_dump(exclude_none=True)
    return await update_sermon_note(
        note_id=int(note_id),
        user_id=user["id"],
        updates=updates,
    )


@router.delete("/{note_id}")
async def sermons_delete(
    note_id: str,
    user=Depends(get_current_user),
):
    """Delete a sermon note."""
    if not note_id.isdigit():
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Sermon note not found")
    return await delete_sermon_note(note_id=int(note_id), user_id=user["id"])


@router.post("/summarize")
async def sermons_summarize(
    req: SummarizeRequest,
    user=Depends(get_current_user),
):
    """AI-powered sermon summarizer."""
    return await summarize_sermon(
        user_id=user["id"],
        sermon_text=req.sermon_text,
        provider=req.provider,
    )


@router.get("/export")
async def sermons_export(
    format: str = Query("json"),
    user=Depends(get_current_user),
):
    """Export sermon notes as JSON or Markdown."""
    return await export_sermon_notes(user_id=user["id"], format=format)
