import json
from datetime import datetime
from typing import Any, Dict, List, Optional

from pydantic import BaseModel, Field

from api.database import get_connection

DATA_TYPES = ["tasks", "prayerLogs", "diary", "studyPlan", "chat", "settings", "customColors",
              "bibleVersion", "recentReads", "hymnFavorites", "recentHymns", "navOrder"]


class SyncItem(BaseModel):
    data_type: str
    data: Any
    updated_at: Optional[str] = None


class SyncPushRequest(BaseModel):
    items: List[SyncItem]


class SyncPullResponse(BaseModel):
    items: List[SyncItem]


async def pull_user_data(user_id: int) -> SyncPullResponse:
    conn = await get_connection()
    try:
        rows = await conn.fetch(
            "SELECT data_type, data, updated_at FROM user_data WHERE user_id = $1",
            user_id
        )
        items = [
            SyncItem(
                data_type=r["data_type"],
                data=r["data"],
                updated_at=r["updated_at"].isoformat() if r["updated_at"] else None
            )
            for r in rows
        ]
        return SyncPullResponse(items=items)
    finally:
        await conn.close()


async def push_user_data(user_id: int, req: SyncPushRequest) -> Dict[str, str]:
    conn = await get_connection()
    try:
        for item in req.items:
            if item.data_type not in DATA_TYPES:
                continue
            data_json = json.dumps(item.data, default=str)
            await conn.execute("""
                INSERT INTO user_data (user_id, data_type, data, updated_at)
                VALUES ($1, $2, $3::jsonb, NOW())
                ON CONFLICT (user_id, data_type)
                DO UPDATE SET
                    data = EXCLUDED.data,
                    updated_at = NOW()
            """, user_id, item.data_type, data_json)
        return {"status": "ok", "synced": len(req.items)}
    finally:
        await conn.close()
