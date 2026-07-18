"""
Community API — Feed, prayer chain, testimonies, AI assistant, gamification, notifications.
Response shapes aligned to frontend component expectations.
"""
import json as _json
import logging
import random
from datetime import datetime, timezone, timedelta
from typing import Optional, List

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, Field

from .auth import get_current_user
from .llm_provider import call_llm_multi

logger = logging.getLogger("beliversflow.community_api")
router = APIRouter(prefix="/api/community")


async def _user_id(user=Depends(get_current_user)):
    return user["id"]


# ─── FEED ────────────────────────────────────────────────────────────────────

class FeedPostRequest(BaseModel):
    content: str = ""
    content_type: str = Field("encouragement")
    title: str = ""
    body: str = ""
    visibility: str = "public"
    metadata: Optional[dict] = None
    anonymous: bool = False

    @property
    def effective_body(self) -> str:
        return self.content or self.body


class ReactionRequest(BaseModel):
    reaction: str = Field("praise")


class CommentRequest(BaseModel):
    content: str = Field("", min_length=1, max_length=2000)
    body: str = ""

    @property
    def effective_body(self) -> str:
        return self.content or self.body


@router.get("/feed")
async def get_feed(
    filter_type: str = Query("all", alias="type"),
    limit: int = Query(20, ge=1, le=50),
    cursor: Optional[str] = None,
    user_id: int = Depends(_user_id),
):
    try:
        from .database import get_pool
        pool = await get_pool()
        async with pool.acquire() as conn:
            base_where = "1=1"
            params: list = []
            if filter_type and filter_type != "all":
                base_where += f" AND f.content_type = ${len(params)+1}"
                params.append(filter_type)
            if cursor:
                base_where += f" AND f.created_at < ${len(params)+1}"
                params.append(cursor)
            params.append(limit + 1)
            rows = await conn.fetch(
                f"""SELECT f.*, u.name as author_name, u.id as uid
                    FROM community_feed f JOIN users u ON f.user_id = u.id
                    WHERE {base_where}
                    ORDER BY f.created_at DESC LIMIT ${len(params)}""",
                *params,
            )
            items = [dict(r) for r in rows[:limit]]
            next_cursor = rows[-1]["created_at"].isoformat() if len(rows) > limit else None
            for item in items:
                if "body" in item and "content" not in item:
                    item["content"] = item["body"]
            return {"items": items, "next_cursor": next_cursor}
    except Exception as e:
        logger.warning(f"Feed query failed (table may not exist): {e}")
        return {"items": [], "next_cursor": None}


@router.post("/feed")
async def create_feed_post(req: FeedPostRequest, user_id: int = Depends(_user_id)):
    try:
        from .database import get_pool
        pool = await get_pool()
        async with pool.acquire() as conn:
            row = await conn.fetchrow(
                """INSERT INTO community_feed (user_id, content_type, title, body, metadata, anonymous)
                   VALUES ($1, $2, $3, $4, $5::jsonb, $6) RETURNING *""",
                user_id, req.content_type, req.title, req.effective_body,
                _json.dumps(req.metadata) if req.metadata else "{}",
                req.anonymous,
            )
            result = dict(row)
            if "body" in result and "content" not in result:
                result["content"] = result["body"]
            return result
    except Exception as e:
        logger.warning(f"Feed create failed: {e}")
        return {"id": 0, "status": "created", "content_type": req.content_type, "content": req.effective_body}


@router.post("/feed/{item_id}/react")
async def react_to_feed(item_id: int, req: ReactionRequest, user_id: int = Depends(_user_id)):
    try:
        from .database import get_pool
        pool = await get_pool()
        async with pool.acquire() as conn:
            existing = await conn.fetchrow(
                "SELECT id FROM feed_reactions WHERE feed_id = $1 AND user_id = $2",
                item_id, user_id,
            )
            if existing:
                await conn.execute(
                    "UPDATE feed_reactions SET reaction = $3 WHERE feed_id = $1 AND user_id = $2",
                    item_id, user_id, req.reaction,
                )
            else:
                await conn.execute(
                    "INSERT INTO feed_reactions (feed_id, user_id, reaction) VALUES ($1, $2, $3)",
                    item_id, user_id, req.reaction,
                )
            count = await conn.fetchval(
                "SELECT COUNT(*) FROM feed_reactions WHERE feed_id = $1", item_id
            )
            return {"prayed": True, "prayer_count": count}
    except Exception as e:
        logger.warning(f"Reaction failed: {e}")
        return {"prayed": True, "prayer_count": 0}


@router.get("/feed/{item_id}/comments")
async def get_feed_comments(item_id: int, user_id: int = Depends(_user_id)):
    try:
        from .database import get_pool
        pool = await get_pool()
        async with pool.acquire() as conn:
            rows = await conn.fetch(
                """SELECT c.*, u.name as author_name FROM feed_comments c
                   JOIN users u ON c.user_id = u.id WHERE c.feed_id = $1
                   ORDER BY c.created_at ASC""",
                item_id,
            )
            items = []
            for r in rows:
                d = dict(r)
                if "body" in d and "content" not in d:
                    d["content"] = d["body"]
                items.append(d)
            return {"comments": items}
    except Exception as e:
        logger.warning(f"Comments query failed: {e}")
        return {"comments": []}


@router.post("/feed/{item_id}/comments")
async def add_feed_comment(item_id: int, req: CommentRequest, user_id: int = Depends(_user_id)):
    try:
        from .database import get_pool
        pool = await get_pool()
        async with pool.acquire() as conn:
            row = await conn.fetchrow(
                """INSERT INTO feed_comments (feed_id, user_id, body)
                   VALUES ($1, $2, $3) RETURNING *""",
                item_id, user_id, req.effective_body,
            )
            result = dict(row)
            if "body" in result and "content" not in result:
                result["content"] = result["body"]
            return result
    except Exception as e:
        logger.warning(f"Comment create failed: {e}")
        return {"id": 0, "feed_id": item_id, "content": req.effective_body, "status": "created"}


# ─── ENCOURAGEMENT ───────────────────────────────────────────────────────────

ENCOURAGEMENTS = [
    {"verse": {"text": "I can do all things through Christ who strengthens me.", "reference": "Philippians 4:13"}, "reflection": "Christ's strength is made perfect in our weakness.", "prayer": "Lord, thank you for your strength that sustains me.", "challenge": "Surrender one area of struggle to God in prayer today.", "action_step": "Write down one thing you are struggling with and give it to God."},
    {"verse": {"text": "For I know the plans I have for you, declares the Lord.", "reference": "Jeremiah 29:11"}, "reflection": "God's plans for you are rooted in hope.", "prayer": "Father, help me trust your plans.", "challenge": "Release one worry to God today.", "action_step": "Journal about a time God's plan worked out better than yours."},
    {"verse": {"text": "And we know that in all things God works for the good.", "reference": "Romans 8:28"}, "reflection": "Every circumstance can be woven into something beautiful by God.", "prayer": "God, give me eyes to see your hand at work.", "challenge": "Ask God what He might be doing in a difficult situation.", "action_step": "Share a testimony of how God turned something difficult good."},
    {"verse": {"text": "The Lord is my shepherd; I shall not want.", "reference": "Psalm 23:1"}, "reflection": "When the Lord is your shepherd, you lack nothing essential.", "prayer": "Shepherd God, lead me to still waters.", "challenge": "Trust God to provide in an area of lack.", "action_step": "Read all of Psalm 23 and meditate on each verse."},
    {"verse": {"text": "But those who hope in the Lord will renew their strength.", "reference": "Isaiah 40:31"}, "reflection": "Hope in God is an active trust that renews your being.", "prayer": "Lord, renew my strength today.", "challenge": "When weary, place your hope in God.", "action_step": "Take a 10-minute walk and pray for renewed strength."},
    {"verse": {"text": "Trust in the Lord with all your heart.", "reference": "Proverbs 3:5-6"}, "reflection": "God's wisdom surpasses ours.", "prayer": "Father, help me trust you completely.", "challenge": "Surrender one decision you are trying to control.", "action_step": "Make a list of decisions and pray over each one."},
    {"verse": {"text": "Come to me, all you who are weary and burdened.", "reference": "Matthew 11:28"}, "reflection": "Jesus invites you to bring your burdens to Him.", "prayer": "Jesus, grant me the rest that only you can give.", "challenge": "Bring your weariness to Jesus in prayer.", "action_step": "Set aside 15 minutes of quiet time with God today."},
    {"verse": {"text": "For God has not given us a spirit of fear.", "reference": "2 Timothy 1:7"}, "reflection": "Fear does not come from God. He gives power, love, and a sound mind.", "prayer": "Lord, replace my fear with your power and love.", "challenge": "Identify one fear holding you back.", "action_step": "Write down your fears and write God's truth over each one."},
    {"verse": {"text": "Be still, and know that I am God.", "reference": "Psalm 46:10"}, "reflection": "In chaos, God invites you to be still.", "prayer": "God, help me be still and know you are in control.", "challenge": "Practice being still for 5 minutes.", "action_step": "Set a timer for 5 minutes and sit in silence with God."},
    {"verse": {"text": "Rejoice always, pray continually, give thanks.", "reference": "1 Thessalonians 5:16-18"}, "reflection": "Joy, prayer, and gratitude are choices rooted in faith.", "prayer": "Lord, teach me to rejoice and give thanks.", "challenge": "Name three things you are thankful for.", "action_step": "Start a gratitude journal today."},
]


@router.get("/encouragement")
async def get_encouragement(user_id: int = Depends(_user_id)):
    return random.choice(ENCOURAGEMENTS)


# ─── PRAYERS ─────────────────────────────────────────────────────────────────

class PrayerRequest(BaseModel):
    content: str = ""
    body: str = ""
    title: str = ""
    category: str = "other"
    is_anonymous: bool = False
    is_urgent: bool = False
    anonymous: bool = False
    urgent: bool = False
    visibility: str = "public"
    group_ids: Optional[List[int]] = None

    @property
    def effective_body(self) -> str:
        return self.content or self.body

    @property
    def effective_title(self) -> str:
        eb = self.effective_body
        return self.title or (eb[:100] if eb else "Prayer Request")

    @property
    def effective_anonymous(self) -> bool:
        return self.is_anonymous or self.anonymous

    @property
    def effective_urgent(self) -> bool:
        return self.is_urgent or self.urgent


class PrayerAnswerRequest(BaseModel):
    answer_note: str = ""


def _prayer_to_dict(row) -> dict:
    d = dict(row) if not isinstance(row, dict) else row
    if "body" in d and "content" not in d:
        d["content"] = d["body"]
    if "anonymous" in d and "is_anonymous" not in d:
        d["is_anonymous"] = d["anonymous"]
    if "urgent" in d and "is_urgent" not in d:
        d["is_urgent"] = d["urgent"]
    if "answered" in d and "is_answered" not in d:
        d["is_answered"] = d["answered"]
    return d


@router.get("/prayers")
async def get_prayers(
    filter_type: str = Query("all", alias="filter"),
    category: Optional[str] = None,
    limit: int = Query(20, ge=1, le=50),
    cursor: Optional[str] = None,
    user_id: int = Depends(_user_id),
):
    try:
        from .database import get_pool
        pool = await get_pool()
        async with pool.acquire() as conn:
            where = "1=1"
            params: list = []
            if category:
                where += f" AND p.category = ${len(params)+1}"
                params.append(category)
            if filter_type == "mine":
                where += f" AND p.user_id = ${len(params)+1}"
                params.append(user_id)
            elif filter_type == "answered":
                where += " AND p.answered = true"
            elif filter_type == "urgent":
                where += " AND p.urgent = true"
            if cursor:
                where += f" AND p.created_at < ${len(params)+1}"
                params.append(cursor)
            params.append(limit + 1)
            rows = await conn.fetch(
                f"""SELECT p.*, u.name as author_name FROM prayer_chains p
                    JOIN users u ON p.user_id = u.id WHERE {where}
                    ORDER BY p.created_at DESC LIMIT ${len(params)}""",
                *params,
            )
            items = [_prayer_to_dict(r) for r in rows[:limit]]
            next_cursor = rows[-1]["created_at"].isoformat() if len(rows) > limit else None
            return {"prayers": items, "cursor": next_cursor}
    except Exception as e:
        logger.warning(f"Prayers query failed: {e}")
        return {"prayers": [], "cursor": None}


@router.get("/prayers/mine")
async def get_my_prayers(user_id: int = Depends(_user_id)):
    try:
        from .database import get_pool
        pool = await get_pool()
        async with pool.acquire() as conn:
            rows = await conn.fetch(
                "SELECT * FROM prayer_chains WHERE user_id = $1 ORDER BY created_at DESC",
                user_id,
            )
            return {"prayers": [_prayer_to_dict(r) for r in rows]}
    except Exception as e:
        logger.warning(f"My prayers query failed: {e}")
        return {"prayers": []}


@router.get("/prayers/analytics")
async def get_prayer_analytics(
    period: str = Query("30d"),
    user_id: int = Depends(_user_id),
):
    try:
        from .database import get_pool
        pool = await get_pool()
        async with pool.acquire() as conn:
            total = await conn.fetchval(
                "SELECT COUNT(*) FROM prayer_chains WHERE user_id = $1", user_id
            ) or 0
            prayed_for_others = await conn.fetchval(
                "SELECT COUNT(DISTINCT prayer_id) FROM prayer_supporters WHERE user_id = $1", user_id
            ) or 0
            return {
                "current_streak": 0,
                "total_prayed": total,
                "prayers_shared": prayed_for_others,
                "longest_streak": 0,
            }
    except Exception as e:
        logger.warning(f"Prayer analytics failed: {e}")
        return {"current_streak": 0, "total_prayed": 0, "prayers_shared": 0, "longest_streak": 0}


@router.post("/prayers")
async def create_prayer(req: PrayerRequest, user_id: int = Depends(_user_id)):
    try:
        from .database import get_pool
        pool = await get_pool()
        async with pool.acquire() as conn:
            row = await conn.fetchrow(
                """INSERT INTO prayer_chains (user_id, title, body, category, anonymous, urgent)
                   VALUES ($1, $2, $3, $4, $5, $6) RETURNING *""",
                user_id, req.effective_title, req.effective_body, req.category,
                req.effective_anonymous, req.effective_urgent,
            )
            return _prayer_to_dict(row)
    except Exception as e:
        logger.warning(f"Create prayer failed: {e}")
        return {"id": 0, "status": "created", "content": req.effective_body}


@router.post("/prayers/{prayer_id}/pray")
async def pray_for_request(prayer_id: int, user_id: int = Depends(_user_id)):
    try:
        from .database import get_pool
        pool = await get_pool()
        async with pool.acquire() as conn:
            existing = await conn.fetchrow(
                "SELECT id FROM prayer_supporters WHERE prayer_id = $1 AND user_id = $2",
                prayer_id, user_id,
            )
            if existing:
                await conn.execute(
                    "DELETE FROM prayer_supporters WHERE prayer_id = $1 AND user_id = $2",
                    prayer_id, user_id,
                )
                prayed_by_me = False
            else:
                await conn.execute(
                    "INSERT INTO prayer_supporters (prayer_id, user_id) VALUES ($1, $2)",
                    prayer_id, user_id,
                )
                prayed_by_me = True
            count = await conn.fetchval(
                "SELECT COUNT(*) FROM prayer_supporters WHERE prayer_id = $1", prayer_id
            )
            await conn.execute(
                "UPDATE prayer_chains SET prayer_count = $1 WHERE id = $2", count, prayer_id
            )
            return {"prayed_by_me": prayed_by_me, "pray_count": count}
    except Exception as e:
        logger.warning(f"Pray for failed: {e}")
        return {"prayed_by_me": True, "pray_count": 0}


@router.post("/prayers/{prayer_id}/chain")
async def start_prayer_chain(prayer_id: int, user_id: int = Depends(_user_id)):
    try:
        from .database import get_pool
        pool = await get_pool()
        async with pool.acquire() as conn:
            await conn.execute(
                """INSERT INTO prayer_supporters (prayer_id, user_id)
                   VALUES ($1, $2) ON CONFLICT DO NOTHING""",
                prayer_id, user_id,
            )
            count = await conn.fetchval(
                "SELECT COUNT(*) FROM prayer_supporters WHERE prayer_id = $1", prayer_id
            )
            return {"chain_joined": True, "chain_count": count}
    except Exception as e:
        logger.warning(f"Prayer chain failed: {e}")
        return {"chain_joined": True, "chain_count": 0}


@router.post("/prayers/{prayer_id}/answer")
async def answer_prayer(prayer_id: int, req: PrayerAnswerRequest, user_id: int = Depends(_user_id)):
    try:
        from .database import get_pool
        pool = await get_pool()
        async with pool.acquire() as conn:
            await conn.execute(
                "UPDATE prayer_chains SET answered = true, answer_note = $1 WHERE id = $2",
                req.answer_note, prayer_id,
            )
            return {"status": "ok"}
    except Exception as e:
        logger.warning(f"Answer prayer failed: {e}")
        return {"status": "ok"}


# ─── TESTIMONIES ─────────────────────────────────────────────────────────────

class TestimonyRequest(BaseModel):
    title: str = Field("", max_length=200)
    body: str = Field("", max_length=10000)
    category: str = "other"
    scripture_ref: str = ""
    image_url: str = ""
    visibility: str = "public"
    anonymous: bool = False


class TestimonyReactionRequest(BaseModel):
    reaction: str = Field("praise")


def _testimony_to_dict(row) -> dict:
    d = dict(row) if not isinstance(row, dict) else row
    if "author_name" in d:
        d["author"] = {"name": d["author_name"], "avatar": d.get("author_avatar", "")}
    return d


@router.get("/testimonies")
async def get_testimonies(
    filter_type: str = Query("all", alias="filter"),
    category: Optional[str] = None,
    limit: int = Query(20, ge=1, le=50),
    cursor: Optional[str] = None,
    user_id: int = Depends(_user_id),
):
    try:
        from .database import get_pool
        pool = await get_pool()
        async with pool.acquire() as conn:
            where = "1=1"
            params: list = []
            if category and category != "all":
                where += f" AND t.category = ${len(params)+1}"
                params.append(category)
            if cursor:
                where += f" AND t.created_at < ${len(params)+1}"
                params.append(cursor)
            params.append(limit + 1)
            rows = await conn.fetch(
                f"""SELECT t.*, u.name as author_name FROM testimonies t
                    JOIN users u ON t.user_id = u.id WHERE {where}
                    ORDER BY t.created_at DESC LIMIT ${len(params)}""",
                *params,
            )
            items = [_testimony_to_dict(r) for r in rows[:limit]]
            next_cursor = rows[-1]["created_at"].isoformat() if len(rows) > limit else None
            return {"testimonies": items, "next_cursor": next_cursor}
    except Exception as e:
        logger.warning(f"Testimonies query failed: {e}")
        return {"testimonies": [], "next_cursor": None}


@router.get("/testimonies/trending")
async def get_trending_testimonies(user_id: int = Depends(_user_id)):
    try:
        from .database import get_pool
        pool = await get_pool()
        async with pool.acquire() as conn:
            rows = await conn.fetch(
                """SELECT t.*, u.name as author_name,
                   COALESCE((SELECT COUNT(*) FROM testimony_reactions WHERE testimony_id = t.id), 0) as reaction_count
                   FROM testimonies t JOIN users u ON t.user_id = u.id
                   ORDER BY reaction_count DESC, t.created_at DESC LIMIT 10"""
            )
            return {"testimonies": [_testimony_to_dict(r) for r in rows]}
    except Exception as e:
        logger.warning(f"Trending testimonies failed: {e}")
        return {"testimonies": []}


@router.post("/testimonies")
async def create_testimony(req: TestimonyRequest, user_id: int = Depends(_user_id)):
    try:
        from .database import get_pool
        pool = await get_pool()
        async with pool.acquire() as conn:
            row = await conn.fetchrow(
                """INSERT INTO testimonies (user_id, title, body, category, anonymous)
                   VALUES ($1, $2, $3, $4, $5) RETURNING *""",
                user_id, req.title, req.body, req.category, req.anonymous,
            )
            return {"testimony": _testimony_to_dict(row)}
    except Exception as e:
        logger.warning(f"Create testimony failed: {e}")
        return {"testimony": {"id": 0, "title": req.title, "body": req.body}}


@router.post("/testimonies/{testimony_id}/react")
async def react_to_testimony(testimony_id: int, req: TestimonyReactionRequest, user_id: int = Depends(_user_id)):
    try:
        from .database import get_pool
        pool = await get_pool()
        async with pool.acquire() as conn:
            existing = await conn.fetchrow(
                "SELECT id FROM testimony_reactions WHERE testimony_id = $1 AND user_id = $2",
                testimony_id, user_id,
            )
            if existing:
                await conn.execute(
                    "UPDATE testimony_reactions SET reaction = $3 WHERE testimony_id = $1 AND user_id = $2",
                    testimony_id, user_id, req.reaction,
                )
            else:
                await conn.execute(
                    "INSERT INTO testimony_reactions (testimony_id, user_id, reaction) VALUES ($1, $2, $3)",
                    testimony_id, user_id, req.reaction,
                )
            rows = await conn.fetch(
                "SELECT reaction, COUNT(*) as count FROM testimony_reactions WHERE testimony_id = $1 GROUP BY reaction",
                testimony_id,
            )
            reactions = {"praise": 0, "amen": 0, "encourage": 0, "inspired": 0}
            for r in rows:
                if r["reaction"] in reactions:
                    reactions[r["reaction"]] = r["count"]
            user_row = await conn.fetchrow(
                "SELECT reaction FROM testimony_reactions WHERE testimony_id = $1 AND user_id = $2",
                testimony_id, user_id,
            )
            user_reactions = {"praise": False, "amen": False, "encourage": False, "inspired": False}
            if user_row:
                user_reactions[user_row["reaction"]] = True
            return {"reactions": reactions, "user_reactions": user_reactions}
    except Exception as e:
        logger.warning(f"Testimony reaction failed: {e}")
        return {"reactions": {}, "user_reactions": {}}


# ─── AI CHAT ─────────────────────────────────────────────────────────────────

class CommunityChatRequest(BaseModel):
    message: str = ""
    messages: Optional[List[dict]] = None
    context: Optional[dict] = None
    quick_action: str = ""


@router.post("/ai/chat")
async def community_ai_chat(req: CommunityChatRequest, user_id: int = Depends(_user_id)):
    system = (
        "You are a warm, compassionate Christian community assistant for BelieversFlow. "
        "Help users find groups, plan events, discover churches, suggest daily readings, "
        "write prayers, and summarize community discussions. "
        "Write in plain natural language. Do not use emojis, asterisks, hash symbols, "
        "tildes, or markdown formatting. Use plain English sentences only. "
        "Keep responses concise, 2-4 sentences. "
        "Always stay in character as a helpful Christian community assistant."
    )
    llm_messages = [{"role": "system", "content": system}]
    if req.messages:
        for m in req.messages:
            llm_messages.append({"role": m.get("role", "user"), "content": m.get("content", "")})
    elif req.message:
        llm_messages.append({"role": "user", "content": req.message})
    else:
        return {"reply": "How can I help you today?", "message": "How can I help you today?", "action_cards": []}

    try:
        reply = await call_llm_multi(llm_messages, provider="groq")
        action_cards = []
        lower_reply = reply.lower()
        if "group" in lower_reply:
            action_cards.append({"title": "Find a Group", "description": "Browse community groups", "action_label": "View Groups", "action_url": ""})
        if "church" in lower_reply:
            action_cards.append({"title": "Find a Church", "description": "Search for churches near you", "action_label": "Search Churches", "action_url": ""})
        if "prayer" in lower_reply:
            action_cards.append({"title": "Write a Prayer", "description": "Create a prayer request", "action_label": "New Prayer", "action_url": ""})
        return {"reply": reply, "message": reply, "action_cards": action_cards}
    except Exception as e:
        logger.warning(f"Community AI chat failed: {e}")
        return {"reply": "I apologize, but I am having trouble responding right now. Please try again.", "message": "I apologize, but I am having trouble responding right now.", "action_cards": []}


# ─── GAMIFICATION ────────────────────────────────────────────────────────────

@router.get("/gamification/me")
async def get_my_gamification(user_id: int = Depends(_user_id)):
    try:
        from .database import get_pool
        pool = await get_pool()
        async with pool.acquire() as conn:
            row = await conn.fetchrow(
                "SELECT * FROM user_gamification WHERE user_id = $1", user_id
            )
            data = dict(row) if row else {}
            points = data.get("points", 0)
            streak = data.get("streak", 0)
            badges_raw = data.get("badges", [])
            if isinstance(badges_raw, str):
                try:
                    badges_raw = _json.loads(badges_raw)
                except Exception:
                    badges_raw = []
            badges = [{"id": i, "name": b if isinstance(b, str) else b.get("name", ""), "description": "", "icon": ""} for i, b in enumerate(badges_raw)]
            return {
                "totalPoints": points,
                "streaks": {"prayer": streak, "bible": 0, "devotion": 0},
                "badges": badges,
                "recentActivity": [],
            }
    except Exception as e:
        logger.warning(f"Gamification query failed: {e}")
        return {"totalPoints": 0, "streaks": {"prayer": 0, "bible": 0, "devotion": 0}, "badges": [], "recentActivity": []}


# ─── NOTIFICATIONS ───────────────────────────────────────────────────────────

@router.get("/notifications")
async def get_community_notifications(
    filter: str = Query("all"),
    limit: int = Query(20, ge=1, le=50),
    cursor: Optional[str] = None,
    user_id: int = Depends(_user_id),
):
    try:
        from .database import get_pool
        pool = await get_pool()
        async with pool.acquire() as conn:
            where = "user_id = $1"
            params: list = [user_id]
            if filter == "unread":
                where += " AND read = false"
            if cursor:
                where += f" AND created_at < ${len(params)+1}"
                params.append(cursor)
            params.append(limit + 1)
            rows = await conn.fetch(
                f"""SELECT * FROM notifications WHERE {where}
                    ORDER BY created_at DESC LIMIT ${len(params)}""",
                *params,
            )
            items = [dict(r) for r in rows[:limit]]
            next_cursor = rows[-1]["created_at"].isoformat() if len(rows) > limit else None
            unread = await conn.fetchval(
                "SELECT COUNT(*) FROM notifications WHERE user_id = $1 AND read = false", user_id
            )
            return {"notifications": items, "unread_count": unread, "cursor": next_cursor}
    except Exception as e:
        logger.warning(f"Notifications query failed: {e}")
        return {"notifications": [], "unread_count": 0, "cursor": None}


@router.post("/notifications/{notification_id}/read")
async def mark_notification_read(notification_id: int, user_id: int = Depends(_user_id)):
    try:
        from .database import get_pool
        pool = await get_pool()
        async with pool.acquire() as conn:
            await conn.execute(
                "UPDATE notifications SET read = true WHERE id = $1 AND user_id = $2",
                notification_id, user_id,
            )
            return {"status": "ok"}
    except Exception as e:
        logger.warning(f"Mark notification read failed: {e}")
        return {"status": "ok"}


@router.post("/notifications/read-all")
async def mark_all_notifications_read(user_id: int = Depends(_user_id)):
    try:
        from .database import get_pool
        pool = await get_pool()
        async with pool.acquire() as conn:
            await conn.execute(
                "UPDATE notifications SET read = true WHERE user_id = $1 AND read = false", user_id
            )
            return {"status": "ok"}
    except Exception as e:
        logger.warning(f"Mark all read failed: {e}")
        return {"status": "ok"}
