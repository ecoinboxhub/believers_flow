"""
Interlinear Bible API — Hebrew/Greek word-by-word analysis endpoints.
"""
import logging
from fastapi import APIRouter, Depends, Query
from .auth import get_current_user
from .interlinear_service import get_interlinear_verse, get_interlinear_chapter

logger = logging.getLogger("beliversflow.interlinear_api")
router = APIRouter(prefix="/api/interlinear")


@router.get("/{book}/{chapter}/{verse}")
async def interlinear_verse(
    book: str,
    chapter: int,
    verse: int,
    version: str = Query("KJV"),
    user=Depends(get_current_user),
):
    """Get a verse with Hebrew/Greek interlinear word analysis."""
    return await get_interlinear_verse(book, chapter, verse, version)


@router.get("/{book}/{chapter}")
async def interlinear_chapter(
    book: str,
    chapter: int,
    version: str = Query("KJV"),
    user=Depends(get_current_user),
):
    """Get a full chapter with interlinear data."""
    return await get_interlinear_chapter(book, chapter, version)
