"""
Hymn API Endpoints for BelieversFlow
Provides search, metadata, matching, and suggestion endpoints.
"""
import os
import json
from typing import Optional, List
from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel

from api.hymn_service import (
    search_hymns,
    get_hymn_suggestions,
    get_metadata,
    get_categories_with_counts,
    match_hymn,
)

router = APIRouter(prefix="/api/hymns", tags=["hymns"])


class HymnSearchRequest(BaseModel):
    query: str
    category: Optional[str] = None
    limit: int = 20
    offset: int = 0


class HymnMatchRequest(BaseModel):
    query: str
    hymn_id: int


def _load_hymns() -> List[dict]:
    """Load hymns from bundled data. This reads the frontend hymns.js file."""
    hymns_path = os.path.join(os.path.dirname(__file__), '..', '..', 'src', 'hymns.js')
    try:
        with open(hymns_path, 'r', encoding='utf-8') as f:
            content = f.read()
        # Parse the JS export: export const HYMNS = [...]
        start = content.index('[')
        end = content.rindex(']') + 1
        js_array = content[start:end]
        # Convert JS object notation to JSON
        # First, convert unquoted keys: { id: 1, title: "..." } -> {"id": 1, "title": "..."}
        import re
        js_array = re.sub(r'(\s)(\w+)(\s*:)', r'\1"\2"\3', js_array)
        # Convert single-quoted strings to double-quoted (only outside of double-quoted strings)
        # Simple approach: replace ' with " only when not inside a double-quoted string
        result = []
        in_string = False
        escape_next = False
        for ch in js_array:
            if escape_next:
                result.append(ch)
                escape_next = False
                continue
            if ch == '\\':
                result.append(ch)
                escape_next = True
                continue
            if ch == '"':
                in_string = not in_string
                result.append(ch)
            elif ch == "'" and not in_string:
                result.append('"')
            else:
                result.append(ch)
        js_array = ''.join(result)
        # Strip trailing commas before ] or } (valid JS but invalid JSON)
        js_array = re.sub(r',(\s*[}\]])', r'\1', js_array)
        hymns = json.loads(js_array)
        return hymns
    except Exception:
        return []


# Cache hymns in memory
_HYMNS_CACHE = None


def _get_hymns() -> List[dict]:
    global _HYMNS_CACHE
    if _HYMNS_CACHE is None:
        _HYMNS_CACHE = _load_hymns()
    return _HYMNS_CACHE


@router.get("/search")
async def hymn_search(
    q: str = Query(..., description="Search query"),
    category: Optional[str] = Query(None, description="Filter by category"),
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
):
    """
    Search hymns with fuzzy matching.
    
    Searches across title, author, first line, tags, and hymn number.
    Returns results ranked by confidence score.
    """
    hymns = _get_hymns()
    if not hymns:
        raise HTTPException(status_code=503, detail="Hymn data not available")
    
    # Filter by category if specified
    if category:
        hymns = [h for h in hymns if h.get('category', '').lower() == category.lower()]
    
    # Search with fuzzy matching
    results = search_hymns(q, hymns, threshold=0.15)
    
    # Paginate
    total = len(results)
    page_results = results[offset:offset + limit]
    
    return {
        "query": q,
        "total": total,
        "offset": offset,
        "limit": limit,
        "results": [
            {
                **hymn,
                "score": score,
                "metadata": get_metadata(hymn.get('id', 0)),
            }
            for hymn, score in page_results
        ],
    }


@router.get("/suggest")
async def hymn_suggest(
    q: str = Query(..., description="Autocomplete query"),
    limit: int = Query(5, ge=1, le=20),
):
    """
    Get autocomplete suggestions for a hymn query.
    Returns minimal data for fast autocomplete UI.
    """
    hymns = _get_hymns()
    if not hymns:
        return {"suggestions": []}
    
    suggestions = get_hymn_suggestions(q, hymns, limit=limit)
    return {"suggestions": suggestions}


@router.get("/categories")
async def hymn_categories_api():
    """
    Get all categories with their hymn counts.
    """
    hymns = _get_hymns()
    if not hymns:
        raise HTTPException(status_code=503, detail="Hymn data not available")
    
    categories = get_categories_with_counts(hymns)
    return {"categories": categories}


@router.get("/stats")
async def hymn_stats():
    """
    Get hymn statistics.
    """
    hymns = _get_hymns()
    if not hymns:
        raise HTTPException(status_code=503, detail="Hymn data not available")
    
    categories = get_categories_with_counts(hymns)
    authors = {}
    for h in hymns:
        a = h.get('author', 'Unknown')
        authors[a] = authors.get(a, 0) + 1
    
    return {
        "total_hymns": len(hymns),
        "total_categories": len(categories),
        "total_authors": len(authors),
        "top_authors": sorted(authors.items(), key=lambda x: -x[1])[:10],
    }


@router.post("/match")
async def hymn_match(req: HymnMatchRequest):
    """
    Calculate match confidence between a query and a specific hymn.
    """
    hymns = _get_hymns()
    hymn = next((h for h in hymns if h.get('id') == req.hymn_id), None)
    if not hymn:
        raise HTTPException(status_code=404, detail="Hymn not found")
    
    score = match_hymn(req.query, hymn)
    return {
        "query": req.query,
        "hymn_id": req.hymn_id,
        "title": hymn.get('title', ''),
        "confidence": score,
        "metadata": get_metadata(req.hymn_id),
    }


@router.get("/lyrics")
async def fetch_hymn_lyrics(slug: str = Query(..., description="gccsatx.com hymn slug, e.g. 'a-mighty-fortress'")):
    """
    Fetch hymn lyrics from gccsatx.com by slug.
    Scrapes the page and returns parsed verses, title, author, and key.
    """
    import httpx
    import re
    import json as json_lib

    url = f"https://gccsatx.com/hymns/{slug}/"
    async with httpx.AsyncClient(timeout=15, follow_redirects=True) as client:
        resp = await client.get(url)
        resp.raise_for_status()
        html = resp.text

    # Try extracting the window.hymnItem JSON blob
    match = re.search(r'window\.hymnItem\s*=\s*({.*?});', html, re.DOTALL)
    if not match:
        raise HTTPException(status_code=404, detail="Hymn not found on gccsatx.com")

    try:
        data = json_lib.loads(match.group(1))
    except json_lib.JSONDecodeError:
        raise HTTPException(status_code=502, detail="Failed to parse hymn data from source")

    # Parse verses from lyrics_html
    lyrics_html = data.get('lyrics_html', '')
    verses = []
    if lyrics_html:
        verse_blocks = re.findall(r'<p[^>]*>(.*?)</p>', lyrics_html, re.DOTALL)
        for block in verse_blocks:
            lines_raw = re.sub(r'<br\s*/?>', '\n', block)
            lines_raw = re.sub(r'<[^>]+>', '', lines_raw)
            lines = [l.strip() for l in lines_raw.split('\n') if l.strip()]
            if lines:
                verses.append(lines)

    result = {
        "title": data.get('title', ''),
        "author": data.get('author', ''),
        "key": data.get('key', ''),
        "meter": data.get('meter', ''),
        "verses": verses,
        "url": url,
    }
    return result


@router.get("/{hymn_id}/metadata")
async def hymn_metadata(hymn_id: int):
    """
    Get extended metadata for a specific hymn.
    """
    metadata = get_metadata(hymn_id)
    if not metadata:
        return {"id": hymn_id, "metadata": {}, "message": "No extended metadata available"}
    return {"id": hymn_id, "metadata": metadata}
