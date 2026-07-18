"""
Sermon Notes Service — Structured notes, scripture references, export, AI summariser.
"""
import logging
import json
from datetime import datetime, timezone
from typing import Optional, List, Dict

from fastapi import HTTPException

logger = logging.getLogger("beliversflow.sermon_notes")


async def create_sermon_note(
    user_id: str,
    title: str,
    church_id: Optional[str] = None,
    preacher: str = "",
    date: Optional[datetime] = None,
    scripture_refs: Optional[List[str]] = None,
    key_points: Optional[List[str]] = None,
    content: str = "",
    tags: Optional[List[str]] = None,
) -> dict:
    """Create a new sermon note."""
    from api.database import get_pool

    if not date:
        date = datetime.now(timezone.utc)

    pool = await get_pool()
    async with pool.acquire() as conn:
        row = await conn.fetchrow("""
            INSERT INTO sermon_notes (
                user_id, title, church_id, preacher, date,
                scripture_refs, key_points, content, tags
            ) VALUES ($1, $2, $3, $4, $5, $6::jsonb, $7::jsonb, $8, $9::jsonb)
            RETURNING id, created_at
        """, int(user_id), title,
            int(church_id) if church_id else None,
            preacher, date,
            json.dumps(scripture_refs or []),
            json.dumps(key_points or []),
            content,
            json.dumps(tags or []))

    logger.info(f"Sermon note created: {row['id']} by user {user_id}")
    return {
        "id": row["id"],
        "title": title,
        "created_at": row["created_at"].isoformat(),
    }


async def get_sermon_notes(
    user_id: str,
    church_id: Optional[str] = None,
    search: str = "",
    limit: int = 50,
) -> List[dict]:
    """Get sermon notes for a user."""
    from api.database import get_pool

    pool = await get_pool()
    async with pool.acquire() as conn:
        conditions = ["sn.user_id = $1"]
        params = [int(user_id)]
        param_idx = 2

        if church_id:
            conditions.append(f"sn.church_id = ${param_idx}")
            params.append(int(church_id))
            param_idx += 1

        if search:
            conditions.append(f"(sn.title ILIKE ${param_idx} OR sn.preacher ILIKE ${param_idx} OR sn.content ILIKE ${param_idx})")
            params.append(f"%{search}%")
            param_idx += 1

        where_clause = " AND ".join(conditions)

        rows = await conn.fetch(f"""
            SELECT sn.*, c.name as church_name
            FROM sermon_notes sn
            LEFT JOIN churches c ON sn.church_id = c.id
            WHERE {where_clause}
            ORDER BY sn.date DESC
            LIMIT ${param_idx}
        """, *params, limit)

    return [
        {
            "id": r["id"],
            "title": r["title"],
            "preacher": r["preacher"],
            "date": r["date"].isoformat() if r["date"] else None,
            "church_name": r["church_name"],
            "scripture_refs": json.loads(r["scripture_refs"]) if r["scripture_refs"] else [],
            "key_points": json.loads(r["key_points"]) if r["key_points"] else [],
            "content": r["content"],
            "tags": json.loads(r["tags"]) if r["tags"] else [],
            "created_at": r["created_at"].isoformat(),
        }
        for r in rows
    ]


async def get_sermon_note(note_id: str, user_id: str) -> dict:
    """Get a single sermon note."""
    from api.database import get_pool

    pool = await get_pool()
    async with pool.acquire() as conn:
        row = await conn.fetchrow("""
            SELECT sn.*, c.name as church_name
            FROM sermon_notes sn
            LEFT JOIN churches c ON sn.church_id = c.id
            WHERE sn.id = $1 AND sn.user_id = $2
        """, int(note_id), int(user_id))

    if not row:
        raise HTTPException(status_code=404, detail="Sermon note not found")

    return {
        "id": row["id"],
        "title": row["title"],
        "preacher": row["preacher"],
        "date": row["date"].isoformat() if row["date"] else None,
        "church_name": row["church_name"],
        "scripture_refs": json.loads(row["scripture_refs"]) if row["scripture_refs"] else [],
        "key_points": json.loads(row["key_points"]) if row["key_points"] else [],
        "content": row["content"],
        "tags": json.loads(row["tags"]) if row["tags"] else [],
        "created_at": row["created_at"].isoformat(),
    }


async def update_sermon_note(
    note_id: str,
    user_id: str,
    updates: dict,
) -> dict:
    """Update a sermon note."""
    from api.database import get_pool

    allowed_fields = {
        "title", "preacher", "date", "church_id", "content",
    }
    json_fields = {"scripture_refs", "key_points", "tags"}
    filtered = {}
    for k, v in updates.items():
        if k in allowed_fields:
            filtered[k] = v
        elif k in json_fields and isinstance(v, list):
            filtered[k] = json.dumps(v)

    if not filtered:
        raise HTTPException(status_code=400, detail="No valid fields to update")

    pool = await get_pool()
    async with pool.acquire() as conn:
        set_parts = []
        values = [int(note_id), int(user_id)]
        idx = 3
        for k, v in filtered.items():
            set_parts.append(f"{k} = ${idx}")
            values.append(v)
            idx += 1

        set_clause = ", ".join(set_parts)
        result = await conn.execute(f"""
            UPDATE sermon_notes
            SET {set_clause}
            WHERE id = $1 AND user_id = $2
        """, *values)

        if result == "UPDATE 0":
            raise HTTPException(status_code=404, detail="Sermon note not found")

    return {"status": "updated", "fields": list(filtered.keys())}


async def delete_sermon_note(note_id: str, user_id: str) -> dict:
    """Delete a sermon note."""
    from api.database import get_pool

    pool = await get_pool()
    async with pool.acquire() as conn:
        result = await conn.execute("""
            DELETE FROM sermon_notes
            WHERE id = $1 AND user_id = $2
        """, int(note_id), int(user_id))

    if result == "DELETE 0":
        raise HTTPException(status_code=404, detail="Sermon note not found")

    return {"status": "deleted"}


async def summarize_sermon(
    user_id: str,
    sermon_text: str,
    provider: str = "groq",
) -> dict:
    """
    AI-powered sermon summarizer.

    Takes sermon text and returns structured summary with:
    - Main theme
    - Key points
    - Scripture references
    - Action items
    """
    from api.llm_provider import call_llm

    system = (
        "You are a Christian sermon analyst and summarizer. "
        "Analyze the sermon text and provide a structured summary. "
        "Write in plain natural language. Use only punctuation marks for formatting. "
        "Do not use emojis, asterisks, hash symbols, tildes, or markdown formatting. "
        "Use plain English with clear section headings."
    )

    prompt = (
        f"Analyze and summarize this sermon:\n\n"
        f"{sermon_text[:4000]}\n\n"
        f"Provide:\n"
        f"- Main Theme: The central message of the sermon (1-2 sentences)\n"
        f"- Key Points: List 3-5 main points with brief explanations\n"
        f"- Scripture References: All Bible verses mentioned, formatted as BOOK CHAPTER:VERSE\n"
        f"- Key Quotes: Notable quotes or phrases from the sermon\n"
        f"- Action Items: 3-5 practical applications for believers\n"
        f"- Summary: A 2-3 sentence overview of the entire sermon\n\n"
        f"Format with clear section headings. Be concise but thorough."
    )

    try:
        response = await call_llm(system, prompt, provider=provider, temperature=0.3)

        # Parse the response into structured data
        sections = _parse_summary(response)

        return {
            "summary": sections.get("summary", response),
            "main_theme": sections.get("main_theme", ""),
            "key_points": sections.get("key_points", []),
            "scripture_refs": sections.get("scripture_refs", []),
            "key_quotes": sections.get("key_quotes", []),
            "action_items": sections.get("action_items", []),
        }
    except Exception as e:
        logger.error(f"AI sermon summarization failed: {e}")
        raise HTTPException(status_code=500, detail=f"Summarization failed: {str(e)}")


def _parse_summary(text: str) -> dict:
    """Parse AI-generated summary into structured sections."""
    sections = {}
    current_section = None
    current_lines = []

    for line in text.split("\n"):
        line_lower = line.strip().lower()

        if "main theme" in line_lower:
            if current_section:
                sections[current_section] = "\n".join(current_lines).strip()
            current_section = "main_theme"
            current_lines = []
        elif "key point" in line_lower:
            if current_section:
                sections[current_section] = "\n".join(current_lines).strip()
            current_section = "key_points"
            current_lines = []
        elif "scripture" in line_lower and "ref" in line_lower:
            if current_section:
                sections[current_section] = "\n".join(current_lines).strip()
            current_section = "scripture_refs"
            current_lines = []
        elif "key quote" in line_lower:
            if current_section:
                sections[current_section] = "\n".join(current_lines).strip()
            current_section = "key_quotes"
            current_lines = []
        elif "action item" in line_lower or "practical" in line_lower:
            if current_section:
                sections[current_section] = "\n".join(current_lines).strip()
            current_section = "action_items"
            current_lines = []
        elif "summary" in line_lower and "overview" in line_lower:
            if current_section:
                sections[current_section] = "\n".join(current_lines).strip()
            current_section = "summary"
            current_lines = []
        else:
            if line.strip():
                current_lines.append(line.strip())

    if current_section:
        sections[current_section] = "\n".join(current_lines).strip()

    # Parse list items
    for key in ["key_points", "scripture_refs", "key_quotes", "action_items"]:
        if key in sections and sections[key]:
            items = []
            for line in sections[key].split("\n"):
                line = line.strip()
                if line.startswith("- ") or line.startswith("* "):
                    items.append(line[2:].strip())
                elif line.startswith(("1.", "2.", "3.", "4.", "5.")):
                    items.append(line.split(".", 1)[1].strip())
                elif line:
                    items.append(line)
            sections[key] = items

    return sections


async def export_sermon_notes(
    user_id: str,
    format: str = "json",
) -> dict:
    """Export all sermon notes."""
    notes = await get_sermon_notes(user_id, limit=1000)

    if format == "json":
        return {"format": "json", "notes": notes, "count": len(notes)}
    elif format == "markdown":
        md_parts = []
        for note in notes:
            md_parts.append(f"# {note['title']}\n")
            if note.get("preacher"):
                md_parts.append(f"**Preacher:** {note['preacher']}\n")
            if note.get("date"):
                md_parts.append(f"**Date:** {note['date']}\n")
            if note.get("scripture_refs"):
                md_parts.append(f"**Scripture:** {', '.join(note['scripture_refs'])}\n")
            if note.get("content"):
                md_parts.append(f"{note['content']}\n")
            md_parts.append("---\n")

        return {"format": "markdown", "content": "\n".join(md_parts), "count": len(notes)}
    else:
        raise HTTPException(status_code=400, detail="Unsupported format")
