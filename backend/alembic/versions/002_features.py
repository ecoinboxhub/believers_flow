"""Add notification devices, groups, churches, events, sermon notes, prayer goals

Revision ID: 002_features
Revises: 001_initial
Create Date: 2026-07-07

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = '002_features'
down_revision: Union[str, None] = '001_initial'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Notification devices
    op.execute("""
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
    op.create_index('idx_notification_devices_user_id', 'notification_devices', ['user_id'])

    # Small groups
    op.execute("""
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
    op.execute("""
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
    op.create_index('idx_group_members_group_id', 'group_members', ['group_id'])

    # Prayer requests
    op.execute("""
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
    op.create_index('idx_prayer_requests_group_id', 'prayer_requests', ['group_id'])

    # Churches
    op.execute("""
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
    op.execute("""
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
    op.create_index('idx_churches_city', 'churches', ['city'])
    op.create_index('idx_churches_denomination', 'churches', ['denomination'])

    # Events
    op.execute("""
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
    op.execute("""
        CREATE TABLE IF NOT EXISTS event_attendees (
            id SERIAL PRIMARY KEY,
            event_id INTEGER REFERENCES events(id) ON DELETE CASCADE,
            user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
            status VARCHAR(20) DEFAULT 'going',
            rsvp_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            UNIQUE(event_id, user_id)
        )
    """)
    op.create_index('idx_events_start_time', 'events', ['start_time'])
    op.create_index('idx_events_church_id', 'events', ['church_id'])
    op.create_index('idx_events_group_id', 'events', ['group_id'])
    op.create_index('idx_event_attendees_event_id', 'event_attendees', ['event_id'])

    # Sermon notes
    op.execute("""
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
    op.create_index('idx_sermon_notes_user_id', 'sermon_notes', ['user_id'])
    op.create_index('idx_sermon_notes_date', 'sermon_notes', ['date'])

    # Prayer goals
    op.execute("""
        CREATE TABLE IF NOT EXISTS prayer_goals (
            id SERIAL PRIMARY KEY,
            user_id INTEGER REFERENCES users(id) ON DELETE CASCADE UNIQUE,
            daily_goal_minutes INTEGER DEFAULT 15,
            weekly_goal_days INTEGER DEFAULT 7,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        )
    """)

    # Add plan_expires_at and updated_at to users
    op.execute("""
        DO $$ BEGIN
            ALTER TABLE users ADD COLUMN IF NOT EXISTS plan_expires_at TIMESTAMP WITH TIME ZONE;
        EXCEPTION WHEN duplicate_column THEN
            NULL;
        END $$;
    """)
    op.execute("""
        DO $$ BEGIN
            ALTER TABLE users ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
        EXCEPTION WHEN duplicate_column THEN
            NULL;
        END $$;
    """)


def downgrade() -> None:
    op.drop_table('prayer_goals')
    op.drop_table('sermon_notes')
    op.drop_table('event_attendees')
    op.drop_table('events')
    op.drop_table('church_members')
    op.drop_table('churches')
    op.drop_table('prayer_requests')
    op.drop_table('group_members')
    op.drop_table('small_groups')
    op.drop_table('notification_devices')
