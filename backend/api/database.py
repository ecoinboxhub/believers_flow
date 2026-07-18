import os
import time
import logging
import asyncpg
from typing import Optional

logger = logging.getLogger("beliversflow.db")

DATABASE_URL = os.environ.get("DATABASE_URL")
if not DATABASE_URL:
    raise ValueError("DATABASE_URL environment variable is required")

_pool: Optional[asyncpg.Pool] = None

# Production-grade pool settings
POOL_MIN = int(os.environ.get("DB_POOL_MIN", "5"))
POOL_MAX = int(os.environ.get("DB_POOL_MAX", "50"))
POOL_COMMAND_TIMEOUT = int(os.environ.get("DB_COMMAND_TIMEOUT", "30"))
POOL_MAX_INACTIVE = int(os.environ.get("DB_POOL_MAX_INACTIVE", "300"))
MAX_RETRIES = 3
RETRY_DELAY = 2


async def get_pool() -> asyncpg.Pool:
    global _pool
    if _pool is not None and not _pool._closed:
        return _pool

    for attempt in range(MAX_RETRIES):
        try:
            logger.info(f"[DB] Creating pool (attempt {attempt + 1}/{MAX_RETRIES})...")
            _pool = await asyncpg.create_pool(
                DATABASE_URL,
                min_size=POOL_MIN,
                max_size=POOL_MAX,
                command_timeout=POOL_COMMAND_TIMEOUT,
                max_inactive_connection_lifetime=POOL_MAX_INACTIVE,
            )
            logger.info(f"[DB] Pool created OK (min={POOL_MIN}, max={POOL_MAX})")
            return _pool
        except Exception as e:
            logger.error(f"[DB] Pool creation failed (attempt {attempt + 1}): {type(e).__name__}: {e}")
            if attempt < MAX_RETRIES - 1:
                time.sleep(RETRY_DELAY * (attempt + 1))
            else:
                raise


async def get_connection() -> asyncpg.Connection:
    """Get a standalone connection with retry logic."""
    for attempt in range(MAX_RETRIES):
        try:
            return await asyncpg.connect(DATABASE_URL, timeout=15)
        except Exception as e:
            logger.warning(f"[DB] Connection failed (attempt {attempt + 1}): {type(e).__name__}")
            if attempt < MAX_RETRIES - 1:
                time.sleep(RETRY_DELAY)
            else:
                raise


async def init_db():
    pool = await get_pool()
    async with pool.acquire() as conn:
        await conn.execute("""
            CREATE TABLE IF NOT EXISTS users (
                id SERIAL PRIMARY KEY,
                email VARCHAR(255) UNIQUE NOT NULL,
                name VARCHAR(255) NOT NULL,
                password_hash VARCHAR(255) NOT NULL,
                plan VARCHAR(20) DEFAULT 'free',
                created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
            )
        """)
        await conn.execute("""
            DO $$ BEGIN
                ALTER TABLE users ADD COLUMN IF NOT EXISTS plan VARCHAR(20) DEFAULT 'free';
            EXCEPTION WHEN duplicate_column THEN
                NULL;
            END $$;
        """)
        await conn.execute("""
            DO $$ BEGIN
                ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT FALSE;
            EXCEPTION WHEN duplicate_column THEN
                NULL;
            END $$;
        """)
        await conn.execute("""
            DO $$ BEGIN
                ALTER TABLE users ADD COLUMN IF NOT EXISTS plan_expires_at TIMESTAMP WITH TIME ZONE;
            EXCEPTION WHEN duplicate_column THEN
                NULL;
            END $$;
        """)
        await conn.execute("""
            DO $$ BEGIN
                ALTER TABLE users ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
            EXCEPTION WHEN duplicate_column THEN
                NULL;
            END $$;
        """)
        await conn.execute("""
            CREATE TABLE IF NOT EXISTS user_data (
                id SERIAL PRIMARY KEY,
                user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                data_type VARCHAR(50) NOT NULL,
                data JSONB NOT NULL DEFAULT '[]'::jsonb,
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                UNIQUE(user_id, data_type)
            )
        """)
        await conn.execute("""
            CREATE INDEX IF NOT EXISTS idx_user_data_user_id ON user_data(user_id)
        """)
        await conn.execute("""
            CREATE TABLE IF NOT EXISTS refresh_tokens (
                id SERIAL PRIMARY KEY,
                user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                token VARCHAR(255) UNIQUE NOT NULL,
                expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
            )
        """)
        await conn.execute("""
            CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user_id ON refresh_tokens(user_id)
        """)
        await conn.execute("""
            CREATE INDEX IF NOT EXISTS idx_refresh_tokens_token ON refresh_tokens(token)
        """)
        # Notification devices table
        await conn.execute("""
            CREATE TABLE IF NOT EXISTS notification_devices (
                id SERIAL PRIMARY KEY,
                user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                fcm_token VARCHAR(512) UNIQUE NOT NULL,
                device_type VARCHAR(20) NOT NULL DEFAULT 'android',
                preferences JSONB NOT NULL DEFAULT '{}'::jsonb,
                active BOOLEAN DEFAULT TRUE,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
            )
        """)
        await conn.execute("""
            CREATE INDEX IF NOT EXISTS idx_notification_devices_user_id ON notification_devices(user_id)
        """)
        await conn.execute("""
            CREATE UNIQUE INDEX IF NOT EXISTS idx_notification_devices_token ON notification_devices(user_id, fcm_token)
        """)
        # Small groups tables
        await conn.execute("""
            CREATE TABLE IF NOT EXISTS small_groups (
                id SERIAL PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                description TEXT DEFAULT '',
                creator_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
                invite_code VARCHAR(20) UNIQUE NOT NULL,
                max_members INTEGER DEFAULT 50,
                is_active BOOLEAN DEFAULT TRUE,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
            )
        """)
        await conn.execute("""
            CREATE TABLE IF NOT EXISTS group_members (
                id SERIAL PRIMARY KEY,
                group_id INTEGER REFERENCES small_groups(id) ON DELETE CASCADE,
                user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                role VARCHAR(20) DEFAULT 'member',
                joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                left_at TIMESTAMP WITH TIME ZONE,
                UNIQUE(group_id, user_id)
            )
        """)
        await conn.execute("""
            CREATE INDEX IF NOT EXISTS idx_group_members_group_id ON group_members(group_id)
        """)
        await conn.execute("""
            CREATE TABLE IF NOT EXISTS prayer_requests (
                id SERIAL PRIMARY KEY,
                group_id INTEGER REFERENCES small_groups(id) ON DELETE CASCADE,
                user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
                content TEXT NOT NULL,
                is_answered BOOLEAN DEFAULT FALSE,
                answered_at TIMESTAMP WITH TIME ZONE,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
            )
        """)
        await conn.execute("""
            CREATE INDEX IF NOT EXISTS idx_prayer_requests_group_id ON prayer_requests(group_id)
        """)
        # Churches directory tables
        await conn.execute("""
            CREATE TABLE IF NOT EXISTS churches (
                id SERIAL PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                denomination VARCHAR(100) DEFAULT '',
                address TEXT DEFAULT '',
                city VARCHAR(100) DEFAULT '',
                country VARCHAR(100) DEFAULT '',
                phone VARCHAR(50) DEFAULT '',
                email VARCHAR(255) DEFAULT '',
                website VARCHAR(500) DEFAULT '',
                latitude DOUBLE PRECISION,
                longitude DOUBLE PRECISION,
                description TEXT DEFAULT '',
                admin_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
                is_active BOOLEAN DEFAULT TRUE,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
            )
        """)
        await conn.execute("""
            CREATE TABLE IF NOT EXISTS church_members (
                id SERIAL PRIMARY KEY,
                church_id INTEGER REFERENCES churches(id) ON DELETE CASCADE,
                user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                role VARCHAR(20) DEFAULT 'member',
                joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                left_at TIMESTAMP WITH TIME ZONE,
                UNIQUE(church_id, user_id)
            )
        """)
        await conn.execute("""
            CREATE INDEX IF NOT EXISTS idx_churches_city ON churches(city)
        """)
        await conn.execute("""
            CREATE INDEX IF NOT EXISTS idx_churches_denomination ON churches(denomination)
        """)
        # Events tables
        await conn.execute("""
            CREATE TABLE IF NOT EXISTS events (
                id SERIAL PRIMARY KEY,
                title VARCHAR(255) NOT NULL,
                description TEXT DEFAULT '',
                event_type VARCHAR(50) DEFAULT 'church',
                church_id INTEGER REFERENCES churches(id) ON DELETE SET NULL,
                group_id INTEGER REFERENCES small_groups(id) ON DELETE SET NULL,
                creator_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
                location TEXT DEFAULT '',
                start_time TIMESTAMP WITH TIME ZONE NOT NULL,
                end_time TIMESTAMP WITH TIME ZONE,
                is_recurring BOOLEAN DEFAULT FALSE,
                recurrence_rule VARCHAR(255),
                max_attendees INTEGER,
                is_active BOOLEAN DEFAULT TRUE,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
            )
        """)
        await conn.execute("""
            CREATE TABLE IF NOT EXISTS event_attendees (
                id SERIAL PRIMARY KEY,
                event_id INTEGER REFERENCES events(id) ON DELETE CASCADE,
                user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                status VARCHAR(20) DEFAULT 'going',
                rsvp_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                UNIQUE(event_id, user_id)
            )
        """)
        await conn.execute("""
            CREATE INDEX IF NOT EXISTS idx_events_start_time ON events(start_time)
        """)
        await conn.execute("""
            CREATE INDEX IF NOT EXISTS idx_events_church_id ON events(church_id)
        """)
        await conn.execute("""
            CREATE INDEX IF NOT EXISTS idx_events_group_id ON events(group_id)
        """)
        await conn.execute("""
            CREATE INDEX IF NOT EXISTS idx_event_attendees_event_id ON event_attendees(event_id)
        """)
        # Sermon notes table
        await conn.execute("""
            CREATE TABLE IF NOT EXISTS sermon_notes (
                id SERIAL PRIMARY KEY,
                user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                title VARCHAR(255) NOT NULL,
                church_id INTEGER REFERENCES churches(id) ON DELETE SET NULL,
                preacher VARCHAR(255) DEFAULT '',
                date TIMESTAMP WITH TIME ZONE,
                scripture_refs JSONB DEFAULT '[]'::jsonb,
                key_points JSONB DEFAULT '[]'::jsonb,
                content TEXT DEFAULT '',
                tags JSONB DEFAULT '[]'::jsonb,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
            )
        """)
        await conn.execute("""
            CREATE INDEX IF NOT EXISTS idx_sermon_notes_user_id ON sermon_notes(user_id)
        """)
        await conn.execute("""
            CREATE INDEX IF NOT EXISTS idx_sermon_notes_date ON sermon_notes(date)
        """)
        # Prayer goals table
        await conn.execute("""
            CREATE TABLE IF NOT EXISTS prayer_goals (
                id SERIAL PRIMARY KEY,
                user_id INTEGER REFERENCES users(id) ON DELETE CASCADE UNIQUE,
                daily_goal_minutes INTEGER DEFAULT 15,
                weekly_goal_days INTEGER DEFAULT 7,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
            )
        """)
        # Forum tables
        await conn.execute("""
            CREATE TABLE IF NOT EXISTS forum_categories (
                id SERIAL PRIMARY KEY,
                name VARCHAR(100) NOT NULL,
                description TEXT DEFAULT '',
                icon VARCHAR(50) DEFAULT '',
                sort_order INTEGER DEFAULT 0,
                is_active BOOLEAN DEFAULT TRUE,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
            )
        """)
        await conn.execute("""
            CREATE TABLE IF NOT EXISTS forum_threads (
                id SERIAL PRIMARY KEY,
                category_id INTEGER REFERENCES forum_categories(id) ON DELETE CASCADE,
                user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
                title VARCHAR(255) NOT NULL,
                content TEXT NOT NULL,
                tags JSONB DEFAULT '[]'::jsonb,
                view_count INTEGER DEFAULT 0,
                is_pinned BOOLEAN DEFAULT FALSE,
                is_active BOOLEAN DEFAULT TRUE,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                last_reply_at TIMESTAMP WITH TIME ZONE
            )
        """)
        await conn.execute("""
            CREATE INDEX IF NOT EXISTS idx_forum_threads_category_id ON forum_threads(category_id)
        """)
        await conn.execute("""
            CREATE TABLE IF NOT EXISTS forum_replies (
                id SERIAL PRIMARY KEY,
                thread_id INTEGER REFERENCES forum_threads(id) ON DELETE CASCADE,
                user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
                content TEXT NOT NULL,
                is_solution BOOLEAN DEFAULT FALSE,
                is_active BOOLEAN DEFAULT TRUE,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
            )
        """)
        await conn.execute("""
            CREATE INDEX IF NOT EXISTS idx_forum_replies_thread_id ON forum_replies(thread_id)
        """)
        await conn.execute("""
            CREATE TABLE IF NOT EXISTS forum_moderators (
                id SERIAL PRIMARY KEY,
                user_id INTEGER REFERENCES users(id) ON DELETE CASCADE UNIQUE,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                is_active BOOLEAN DEFAULT TRUE
            )
        """)

        # ── Community tables ──────────────────────────────────────────────────
        await conn.execute("""
            CREATE TABLE IF NOT EXISTS community_feed (
                id SERIAL PRIMARY KEY,
                user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                content_type VARCHAR(30) NOT NULL DEFAULT 'encouragement',
                title VARCHAR(200) DEFAULT '',
                body TEXT DEFAULT '',
                metadata JSONB DEFAULT '{}'::jsonb,
                anonymous BOOLEAN DEFAULT FALSE,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
            )
        """)
        await conn.execute("CREATE INDEX IF NOT EXISTS idx_feed_user ON community_feed(user_id)")
        await conn.execute("CREATE INDEX IF NOT EXISTS idx_feed_type ON community_feed(content_type)")
        await conn.execute("CREATE INDEX IF NOT EXISTS idx_feed_created ON community_feed(created_at DESC)")

        await conn.execute("""
            CREATE TABLE IF NOT EXISTS feed_reactions (
                id SERIAL PRIMARY KEY,
                feed_id INTEGER REFERENCES community_feed(id) ON DELETE CASCADE,
                user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                reaction VARCHAR(20) DEFAULT 'praise',
                created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                UNIQUE(feed_id, user_id)
            )
        """)
        await conn.execute("CREATE INDEX IF NOT EXISTS idx_feed_reactions_feed ON feed_reactions(feed_id)")

        await conn.execute("""
            CREATE TABLE IF NOT EXISTS feed_comments (
                id SERIAL PRIMARY KEY,
                feed_id INTEGER REFERENCES community_feed(id) ON DELETE CASCADE,
                user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                body TEXT NOT NULL,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
            )
        """)
        await conn.execute("CREATE INDEX IF NOT EXISTS idx_feed_comments_feed ON feed_comments(feed_id)")

        await conn.execute("""
            CREATE TABLE IF NOT EXISTS prayer_chains (
                id SERIAL PRIMARY KEY,
                user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                title VARCHAR(200) DEFAULT 'Prayer Request',
                body TEXT DEFAULT '',
                category VARCHAR(50) DEFAULT 'other',
                anonymous BOOLEAN DEFAULT FALSE,
                urgent BOOLEAN DEFAULT FALSE,
                answered BOOLEAN DEFAULT FALSE,
                answer_note TEXT DEFAULT '',
                prayer_count INTEGER DEFAULT 0,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
            )
        """)
        await conn.execute("CREATE INDEX IF NOT EXISTS idx_prayer_chains_user ON prayer_chains(user_id)")
        await conn.execute("CREATE INDEX IF NOT EXISTS idx_prayer_chains_created ON prayer_chains(created_at DESC)")

        await conn.execute("""
            CREATE TABLE IF NOT EXISTS prayer_supporters (
                id SERIAL PRIMARY KEY,
                prayer_id INTEGER REFERENCES prayer_chains(id) ON DELETE CASCADE,
                user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                UNIQUE(prayer_id, user_id)
            )
        """)
        await conn.execute("CREATE INDEX IF NOT EXISTS idx_prayer_supporters_prayer ON prayer_supporters(prayer_id)")

        await conn.execute("""
            CREATE TABLE IF NOT EXISTS testimonies (
                id SERIAL PRIMARY KEY,
                user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                title VARCHAR(200) DEFAULT '',
                body TEXT DEFAULT '',
                category VARCHAR(50) DEFAULT 'other',
                anonymous BOOLEAN DEFAULT FALSE,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
            )
        """)
        await conn.execute("CREATE INDEX IF NOT EXISTS idx_testimonies_user ON testimonies(user_id)")
        await conn.execute("CREATE INDEX IF NOT EXISTS idx_testimonies_created ON testimonies(created_at DESC)")

        await conn.execute("""
            CREATE TABLE IF NOT EXISTS testimony_reactions (
                id SERIAL PRIMARY KEY,
                testimony_id INTEGER REFERENCES testimonies(id) ON DELETE CASCADE,
                user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                reaction VARCHAR(20) DEFAULT 'praise',
                created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                UNIQUE(testimony_id, user_id)
            )
        """)
        await conn.execute("CREATE INDEX IF NOT EXISTS idx_testimony_reactions_testimony ON testimony_reactions(testimony_id)")

        await conn.execute("""
            CREATE TABLE IF NOT EXISTS user_gamification (
                id SERIAL PRIMARY KEY,
                user_id INTEGER REFERENCES users(id) ON DELETE CASCADE UNIQUE,
                points INTEGER DEFAULT 0,
                level INTEGER DEFAULT 1,
                streak INTEGER DEFAULT 0,
                badges JSONB DEFAULT '[]'::jsonb,
                total_prayers INTEGER DEFAULT 0,
                total_testimonies INTEGER DEFAULT 0,
                total_comments INTEGER DEFAULT 0,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
            )
        """)

        await conn.execute("""
            CREATE TABLE IF NOT EXISTS notifications (
                id SERIAL PRIMARY KEY,
                user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                type VARCHAR(50) DEFAULT 'system',
                title VARCHAR(200) DEFAULT '',
                description TEXT DEFAULT '',
                avatar VARCHAR(500) DEFAULT '',
                read BOOLEAN DEFAULT FALSE,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
            )
        """)
        await conn.execute("CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id)")
        await conn.execute("CREATE INDEX IF NOT EXISTS idx_notifications_unread ON notifications(user_id, read) WHERE read = FALSE")

        # ── Prayer logs (prayer analytics) ────────────────────────────────────
        await conn.execute("""
            CREATE TABLE IF NOT EXISTS prayer_logs (
                id SERIAL PRIMARY KEY,
                user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                date DATE NOT NULL DEFAULT CURRENT_DATE,
                minutes INTEGER DEFAULT 0,
                notes TEXT DEFAULT '',
                created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
            )
        """)
        await conn.execute("CREATE INDEX IF NOT EXISTS idx_prayer_logs_user_date ON prayer_logs(user_id, date)")


async def close_pool():
    global _pool
    if _pool:
        await _pool.close()
        _pool = None
