"""
Church Directory Service — Church profiles, search, and discovery.
"""
import logging
from datetime import datetime, timezone
from typing import Optional, List

from fastapi import HTTPException

logger = logging.getLogger("beliversflow.church_directory")


async def create_church(
    admin_id: str,
    name: str,
    denomination: str = "",
    address: str = "",
    city: str = "",
    country: str = "",
    phone: str = "",
    email: str = "",
    website: str = "",
    latitude: Optional[float] = None,
    longitude: Optional[float] = None,
    description: str = "",
) -> dict:
    """Create a church profile."""
    from api.database import get_pool

    pool = await get_pool()
    async with pool.acquire() as conn:
        row = await conn.fetchrow("""
            INSERT INTO churches (
                name, denomination, address, city, country, phone, email, website,
                latitude, longitude, description, admin_id
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
            RETURNING id, name, created_at
        """, name, denomination, address, city, country, phone, email, website,
            latitude, longitude, description, int(admin_id))

        # Add admin as church member
        await conn.execute("""
            INSERT INTO church_members (church_id, user_id, role)
            VALUES ($1, $2, 'admin')
        """, row["id"], int(admin_id))

    logger.info(f"Church created: {row['id']} - {name}")
    return {
        "id": row["id"],
        "name": row["name"],
        "created_at": row["created_at"].isoformat(),
    }


async def update_church(
    church_id: str,
    admin_id: str,
    updates: dict,
) -> dict:
    """Update church profile (admin only)."""
    from api.database import get_pool

    allowed_fields = {
        "name", "denomination", "address", "city", "country", "phone",
        "email", "website", "latitude", "longitude", "description",
    }
    filtered = {k: v for k, v in updates.items() if k in allowed_fields}

    if not filtered:
        raise HTTPException(status_code=400, detail="No valid fields to update")

    pool = await get_pool()
    async with pool.acquire() as conn:
        # Check admin
        is_admin = await conn.fetchval("""
            SELECT EXISTS(
                SELECT 1 FROM church_members
                WHERE church_id = $1 AND user_id = $2 AND role = 'admin'
            )
        """, int(church_id), int(admin_id))

        if not is_admin:
            raise HTTPException(status_code=403, detail="Only church admins can update")

        set_clause = ", ".join(f"{k} = ${i+3}" for i, k in enumerate(filtered.keys()))
        values = [int(church_id), int(admin_id)] + list(filtered.values())

        await conn.execute(f"""
            UPDATE churches
            SET {set_clause}, updated_at = NOW()
            WHERE id = $1
        """, *values)

    return {"status": "updated", "fields": list(filtered.keys())}


async def get_church(church_id: str) -> dict:
    """Get church details."""
    from api.database import get_pool

    pool = await get_pool()
    async with pool.acquire() as conn:
        church = await conn.fetchrow("""
            SELECT c.*, u.name as admin_name
            FROM churches c
            JOIN users u ON c.admin_id = u.id
            WHERE c.id = $1 AND c.is_active = TRUE
        """, int(church_id))

        if not church:
            raise HTTPException(status_code=404, detail="Church not found")

        members = await conn.fetch("""
            SELECT cm.user_id, cm.role, cm.joined_at, u.name
            FROM church_members cm
            JOIN users u ON cm.user_id = u.id
            WHERE cm.church_id = $1 AND cm.left_at IS NULL
            ORDER BY cm.joined_at ASC
        """, int(church_id))

    return {
        "id": church["id"],
        "name": church["name"],
        "denomination": church["denomination"],
        "address": church["address"],
        "city": church["city"],
        "country": church["country"],
        "phone": church["phone"],
        "email": church["email"],
        "website": church["website"],
        "latitude": church["latitude"],
        "longitude": church["longitude"],
        "description": church["description"],
        "admin_name": church["admin_name"],
        "member_count": len(members),
        "created_at": church["created_at"].isoformat(),
        "members": [
            {"user_id": m["user_id"], "name": m["name"], "role": m["role"]}
            for m in members
        ],
    }


async def search_churches(
    query: str = "",
    denomination: str = "",
    city: str = "",
    country: str = "",
    latitude: Optional[float] = None,
    longitude: Optional[float] = None,
    radius_km: float = 50,
    limit: int = 20,
) -> List[dict]:
    """Search for churches."""
    from api.database import get_pool

    pool = await get_pool()
    async with pool.acquire() as conn:
        conditions = ["c.is_active = TRUE"]
        params = []
        param_idx = 1

        if query:
            conditions.append(f"(c.name ILIKE ${param_idx} OR c.denomination ILIKE ${param_idx})")
            params.append(f"%{query}%")
            param_idx += 1

        if denomination:
            conditions.append(f"c.denomination ILIKE ${param_idx}")
            params.append(f"%{denomination}%")
            param_idx += 1

        if city:
            conditions.append(f"c.city ILIKE ${param_idx}")
            params.append(f"%{city}%")
            param_idx += 1

        if country:
            conditions.append(f"c.country ILIKE ${param_idx}")
            params.append(f"%{country}%")
            param_idx += 1

        where_clause = " AND ".join(conditions)

        # If coordinates provided, use Haversine for distance
        if latitude is not None and longitude is not None:
            query_sql = f"""
                SELECT c.id, c.name, c.denomination, c.city, c.country,
                       c.latitude, c.longitude,
                       (6371 * acos(
                           cos(radians($1)) * cos(radians(c.latitude)) *
                           cos(radians(c.longitude) - radians($2)) +
                           sin(radians($1)) * sin(radians(c.latitude))
                       )) as distance_km
                FROM churches c
                WHERE {where_clause}
                HAVING distance_km <= $3
                ORDER BY distance_km ASC
                LIMIT $4
            """
            params = [latitude, longitude, radius_km, limit] + params
        else:
            query_sql = f"""
                SELECT c.id, c.name, c.denomination, c.city, c.country,
                       c.latitude, c.longitude, NULL as distance_km
                FROM churches c
                WHERE {where_clause}
                ORDER BY c.name ASC
                LIMIT ${param_idx}
            """
            params.append(limit)

        rows = await conn.fetch(query_sql, *params)

    return [
        {
            "id": r["id"],
            "name": r["name"],
            "denomination": r["denomination"],
            "city": r["city"],
            "country": r["country"],
            "latitude": r["latitude"],
            "longitude": r["longitude"],
            "distance_km": round(r["distance_km"], 1) if r["distance_km"] else None,
        }
        for r in rows
    ]


async def join_church(church_id: str, user_id: str) -> dict:
    """Join a church as a member."""
    from api.database import get_pool

    pool = await get_pool()
    async with pool.acquire() as conn:
        # Check if already a member
        existing = await conn.fetchval("""
            SELECT EXISTS(
                SELECT 1 FROM church_members
                WHERE church_id = $1 AND user_id = $2 AND left_at IS NULL
            )
        """, int(church_id), int(user_id))

        if existing:
            raise HTTPException(status_code=400, detail="Already a member of this church")

        await conn.execute("""
            INSERT INTO church_members (church_id, user_id, role)
            VALUES ($1, $2, 'member')
        """, int(church_id), int(user_id))

    return {"status": "joined"}


async def leave_church(church_id: str, user_id: str) -> dict:
    """Leave a church."""
    from api.database import get_pool

    pool = await get_pool()
    async with pool.acquire() as conn:
        result = await conn.execute("""
            UPDATE church_members
            SET left_at = NOW()
            WHERE church_id = $1 AND user_id = $2 AND left_at IS NULL
        """, int(church_id), int(user_id))

        if result == "UPDATE 0":
            raise HTTPException(status_code=404, detail="Not a member of this church")

    return {"status": "left"}


async def get_user_churches(user_id: str) -> List[dict]:
    """Get churches the user belongs to."""
    from api.database import get_pool

    pool = await get_pool()
    async with pool.acquire() as conn:
        rows = await conn.fetch("""
            SELECT c.id, c.name, c.denomination, c.city, c.country, cm.role
            FROM churches c
            JOIN church_members cm ON c.id = cm.church_id
            WHERE cm.user_id = $1 AND cm.left_at IS NULL AND c.is_active = TRUE
        """, int(user_id))

    return [
        {
            "id": r["id"],
            "name": r["name"],
            "denomination": r["denomination"],
            "city": r["city"],
            "country": r["country"],
            "role": r["role"],
        }
        for r in rows
    ]
