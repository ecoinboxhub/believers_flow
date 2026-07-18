# Community Database Schema

**BelieversFlow v5.0 — PostgreSQL Schema**
**Migration: 004_community_v2**

---

## Existing Tables (from migrations 001-003)

These tables already exist and will be extended:

```
users, user_data, refresh_tokens,
notification_devices, small_groups, group_members,
prayer_requests, churches, church_members,
events, event_attendees, sermon_notes, prayer_goals,
forum_categories, forum_threads, forum_replies, forum_moderators
```

---

## New Tables (Migration 004)

### 1. community_feed

Unified feed for all community content types.

```sql
CREATE TABLE community_feed (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    author_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    content_type VARCHAR(30) NOT NULL CHECK (content_type IN (
        'prayer_request', 'prayer_answered', 'testimony',
        'group_post', 'event_announcement', 'sermon_highlight',
        'volunteer_opportunity', 'church_announcement', 'daily_encouragement'
    )),
    content_id UUID NOT NULL,  -- FK to the source table
    title VARCHAR(200),
    body TEXT NOT NULL,
    visibility VARCHAR(20) NOT NULL DEFAULT 'public' CHECK (visibility IN (
        'public', 'followers', 'groups', 'church', 'private'
    )),
    group_id UUID REFERENCES small_groups(id) ON DELETE SET NULL,
    church_id UUID REFERENCES churches(id) ON DELETE SET NULL,
    is_pinned BOOLEAN NOT NULL DEFAULT false,
    is_featured BOOLEAN NOT NULL DEFAULT false,
    reaction_count INTEGER NOT NULL DEFAULT 0,
    comment_count INTEGER NOT NULL DEFAULT 0,
    share_count INTEGER NOT NULL DEFAULT 0,
    ai_tags JSONB DEFAULT '[]',
    ai_summary TEXT,
    report_count INTEGER NOT NULL DEFAULT 0,
    is_hidden BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);

CREATE INDEX idx_feed_author ON community_feed(author_id);
CREATE INDEX idx_feed_type ON community_feed(content_type);
CREATE INDEX idx_feed_created ON community_feed(created_at DESC);
CREATE INDEX idx_feed_group ON community_feed(group_id) WHERE group_id IS NOT NULL;
CREATE INDEX idx_feed_church ON community_feed(church_id) WHERE church_id IS NOT NULL;
CREATE INDEX idx_feed_visibility ON community_feed(visibility);
CREATE INDEX idx_feed_not_hidden ON community_feed(created_at DESC) WHERE is_hidden = false AND deleted_at IS NULL;
```

### 2. feed_comments

Comments on feed items.

```sql
CREATE TABLE feed_comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    feed_id UUID NOT NULL REFERENCES community_feed(id) ON DELETE CASCADE,
    author_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    parent_id UUID REFERENCES feed_comments(id) ON DELETE CASCADE,
    body TEXT NOT NULL,
    is_scripture BOOLEAN NOT NULL DEFAULT false,
    scripture_ref VARCHAR(100),
    reaction_count INTEGER NOT NULL DEFAULT 0,
    is_hidden BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);

CREATE INDEX idx_feed_comments_feed ON feed_comments(feed_id);
CREATE INDEX idx_feed_comments_author ON feed_comments(author_id);
CREATE INDEX idx_feed_comments_parent ON feed_comments(parent_id) WHERE parent_id IS NOT NULL;
```

### 3. feed_reactions

Reactions on feed items and comments.

```sql
CREATE TABLE feed_reactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    feed_id UUID REFERENCES community_feed(id) ON DELETE CASCADE,
    comment_id UUID REFERENCES feed_comments(id) ON DELETE CASCADE,
    reaction_type VARCHAR(20) NOT NULL CHECK (reaction_type IN (
        'prayed', 'amen', 'praise_god', 'encourage', 'inspired',
        'like', 'love', 'hug', 'fire', 'clap'
    )),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT feed_reactions_target_check CHECK (
        (feed_id IS NOT NULL AND comment_id IS NULL) OR
        (feed_id IS NULL AND comment_id IS NOT NULL)
    ),
    CONSTRAINT feed_reactions_unique_feed UNIQUE (user_id, feed_id, reaction_type),
    CONSTRAINT feed_reactions_unique_comment UNIQUE (user_id, comment_id, reaction_type)
);

CREATE INDEX idx_reactions_feed ON feed_reactions(feed_id) WHERE feed_id IS NOT NULL;
CREATE INDEX idx_reactions_comment ON feed_reactions(comment_id) WHERE comment_id IS NOT NULL;
CREATE INDEX idx_reactions_user ON feed_reactions(user_id);
```

### 4. prayer_chains

Groups of people praying together for a request.

```sql
CREATE TABLE prayer_chains (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    prayer_request_id UUID NOT NULL REFERENCES prayer_requests(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    prayed_at TIMESTAMPTZ,
    CONSTRAINT prayer_chains_unique UNIQUE (prayer_request_id, user_id)
);

CREATE INDEX idx_prayer_chains_request ON prayer_chains(prayer_request_id);
CREATE INDEX idx_prayer_chains_user ON prayer_chains(user_id);
```

### 5. testimonies

User testimony posts.

```sql
CREATE TABLE testimonies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    author_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(200) NOT NULL,
    body TEXT NOT NULL,
    category VARCHAR(30) NOT NULL CHECK (category IN (
        'salvation', 'miracle', 'healing', 'provision',
        'mission', 'growth', 'family', 'other'
    )),
    scripture_ref VARCHAR(100),
    image_url TEXT,
    visibility VARCHAR(20) NOT NULL DEFAULT 'public',
    ai_tags JSONB DEFAULT '[]',
    ai_theme_summary TEXT,
    reaction_count INTEGER NOT NULL DEFAULT 0,
    comment_count INTEGER NOT NULL DEFAULT 0,
    is_featured BOOLEAN NOT NULL DEFAULT false,
    report_count INTEGER NOT NULL DEFAULT 0,
    is_hidden BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);

CREATE INDEX idx_testimonies_author ON testimonies(author_id);
CREATE INDEX idx_testimonies_category ON testimonies(category);
CREATE INDEX idx_testimonies_created ON testimonies(created_at DESC);
CREATE INDEX idx_testimonies_featured ON testimonies(is_featured) WHERE is_featured = true;
```

### 6. notifications

In-app notification queue.

```sql
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    actor_id UUID REFERENCES users(id) ON DELETE SET NULL,
    notification_type VARCHAR(50) NOT NULL,
    entity_type VARCHAR(30) NOT NULL,
    entity_id UUID NOT NULL,
    title VARCHAR(200) NOT NULL,
    body TEXT,
    metadata JSONB DEFAULT '{}',
    is_read BOOLEAN NOT NULL DEFAULT false,
    is_emailed BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_notifications_user ON notifications(user_id, created_at DESC);
CREATE INDEX idx_notifications_unread ON notifications(user_id) WHERE is_read = false;
CREATE INDEX idx_notifications_type ON notifications(notification_type);
```

### 7. user_follows

User-to-user follow relationships.

```sql
CREATE TABLE user_follows (
    follower_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    following_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (follower_id, following_id),
    CONSTRAINT no_self_follow CHECK (follower_id != following_id)
);

CREATE INDEX idx_follows_following ON user_follows(following_id);
```

### 8. user_community_profile

Extended profile for community features.

```sql
CREATE TABLE user_community_profile (
    user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    denomination VARCHAR(100),
    interests JSONB DEFAULT '[]',
    spiritual_maturity VARCHAR(20) CHECK (spiritual_maturity IN (
        'new_believer', 'growing', 'mature', 'leader', 'pastor'
    )),
    location_city VARCHAR(100),
    location_state VARCHAR(100),
    location_country VARCHAR(100),
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    bio TEXT,
    testimony_count INTEGER NOT NULL DEFAULT 0,
    prayer_count INTEGER NOT NULL DEFAULT 0,
    group_count INTEGER NOT NULL DEFAULT 0,
    forum_count INTEGER NOT NULL DEFAULT 0,
    volunteer_hours DECIMAL(10, 2) NOT NULL DEFAULT 0,
    is_location_public BOOLEAN NOT NULL DEFAULT false,
    notification_preferences JSONB DEFAULT '{"push": true, "email": "daily", "types": {}}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

### 9. user_gamification

Points, level, badges, streaks.

```sql
CREATE TABLE user_gamification (
    user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    points INTEGER NOT NULL DEFAULT 0,
    level INTEGER NOT NULL DEFAULT 1,
    prayer_streak_current INTEGER NOT NULL DEFAULT 0,
    prayer_streak_best INTEGER NOT NULL DEFAULT 0,
    bible_streak_current INTEGER NOT NULL DEFAULT 0,
    bible_streak_best INTEGER NOT NULL DEFAULT 0,
    devotion_streak_current INTEGER NOT NULL DEFAULT 0,
    devotion_streak_best INTEGER NOT NULL DEFAULT 0,
    last_prayer_date DATE,
    last_bible_date DATE,
    last_devotion_date DATE,
    badges JSONB DEFAULT '[]',
    milestones JSONB DEFAULT '[]',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

### 10. user_badges

Earned badges history.

```sql
CREATE TABLE user_badges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    badge_id VARCHAR(50) NOT NULL,
    badge_name VARCHAR(100) NOT NULL,
    badge_category VARCHAR(30) NOT NULL,
    earned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    points_awarded INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT user_badges_unique UNIQUE (user_id, badge_id)
);

CREATE INDEX idx_badges_user ON user_badges(user_id);
```

### 11. content_reports

User reports for moderation.

```sql
CREATE TABLE content_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reporter_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    entity_type VARCHAR(30) NOT NULL,
    entity_id UUID NOT NULL,
    reason VARCHAR(50) NOT NULL CHECK (reason IN (
        'spam', 'harassment', 'inappropriate', 'false_teaching',
        'hate_speech', 'scam', 'other'
    )),
    description TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN (
        'pending', 'reviewing', 'resolved', 'dismissed'
    )),
    moderator_id UUID REFERENCES users(id) ON DELETE SET NULL,
    moderator_action VARCHAR(50),
    moderator_note TEXT,
    resolved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_reports_status ON content_reports(status) WHERE status = 'pending';
CREATE INDEX idx_reports_entity ON content_reports(entity_type, entity_id);
```

### 12. ai_conversation_logs

AI assistant conversation history (for context and improvement).

```sql
CREATE TABLE ai_conversation_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    session_id UUID NOT NULL,
    role VARCHAR(10) NOT NULL CHECK (role IN ('user', 'assistant')),
    message TEXT NOT NULL,
    context JSONB DEFAULT '{}',
    tokens_used INTEGER,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_ai_logs_user ON ai_conversation_logs(user_id, created_at DESC);
CREATE INDEX idx_ai_logs_session ON ai_conversation_logs(session_id);
```

---

## Modified Existing Tables

### prayer_requests (extend)

```sql
ALTER TABLE prayer_requests ADD COLUMN IF NOT EXISTS category VARCHAR(30) DEFAULT 'other';
ALTER TABLE prayer_requests ADD COLUMN IF NOT EXISTS is_urgent BOOLEAN DEFAULT false;
ALTER TABLE prayer_requests ADD COLUMN IF NOT EXISTS is_anonymous BOOLEAN DEFAULT false;
ALTER TABLE prayer_requests ADD COLUMN IF NOT EXISTS visibility VARCHAR(20) DEFAULT 'public';
ALTER TABLE prayer_requests ADD COLUMN IF NOT EXISTS group_ids UUID[] DEFAULT '{}';
ALTER TABLE prayer_requests ADD COLUMN IF NOT EXISTS pray_count INTEGER DEFAULT 0;
ALTER TABLE prayer_requests ADD COLUMN IF NOT EXISTS chain_count INTEGER DEFAULT 0;
ALTER TABLE prayer_requests ADD COLUMN IF NOT EXISTS ai_scripture_ref VARCHAR(100);
ALTER TABLE prayer_requests ADD COLUMN IF NOT EXISTS ai_scripture_text TEXT;
ALTER TABLE prayer_requests ADD COLUMN IF NOT EXISTS answered_at TIMESTAMPTZ;
ALTER TABLE prayer_requests ADD COLUMN IF NOT EXISTS answered_note TEXT;
ALTER TABLE prayer_requests ADD COLUMN IF NOT EXISTS feed_id UUID REFERENCES community_feed(id);
```

### small_groups (extend)

```sql
ALTER TABLE small_groups ADD COLUMN IF NOT EXISTS category VARCHAR(50);
ALTER TABLE small_groups ADD COLUMN IF NOT EXISTS privacy VARCHAR(20) DEFAULT 'public' CHECK (privacy IN ('public', 'private', 'invite_only'));
ALTER TABLE small_groups ADD COLUMN IF NOT EXISTS cover_image TEXT;
ALTER TABLE small_groups ADD COLUMN IF NOT EXISTS icon VARCHAR(10);
ALTER TABLE small_groups ADD COLUMN IF NOT EXISTS post_count INTEGER DEFAULT 0;
ALTER TABLE small_groups ADD COLUMN IF NOT EXISTS prayer_count INTEGER DEFAULT 0;
ALTER TABLE small_groups ADD COLUMN IF NOT EXISTS last_activity_at TIMESTAMPTZ;
ALTER TABLE small_groups ADD COLUMN IF NOT EXISTS ai_moderation_enabled BOOLEAN DEFAULT true;
ALTER TABLE small_groups ADD COLUMN IF NOT EXISTS ai_welcome_enabled BOOLEAN DEFAULT true;
```

### group_members (extend)

```sql
ALTER TABLE group_members ADD COLUMN IF NOT EXISTS role VARCHAR(20) DEFAULT 'member' CHECK (role IN (
    'owner', 'pastor', 'leader', 'moderator', 'member', 'visitor'
));
ALTER TABLE group_members ADD COLUMN IF NOT EXISTS nickname VARCHAR(100);
ALTER TABLE group_members ADD COLUMN IF NOT EXISTS post_count INTEGER DEFAULT 0;
ALTER TABLE group_members ADD COLUMN IF NOT EXISTS prayer_count INTEGER DEFAULT 0;
ALTER TABLE group_members ADD COLUMN IF NOT EXISTS last_active_at TIMESTAMPTZ;
```

### churches (extend)

```sql
ALTER TABLE churches ADD COLUMN IF NOT EXISTS cover_image TEXT;
ALTER TABLE churches ADD COLUMN IF NOT EXISTS logo_url TEXT;
ALTER TABLE churches ADD COLUMN IF NOT EXISTS website TEXT;
ALTER TABLE churches ADD COLUMN IF NOT EXISTS phone VARCHAR(30);
ALTER TABLE churches ADD COLUMN IF NOT EXISTS email VARCHAR(200);
ALTER TABLE churches ADD COLUMN IF NOT EXISTS service_times JSONB DEFAULT '[]';
ALTER TABLE churches ADD COLUMN IF NOT EXISTS ministries JSONB DEFAULT '[]';
ALTER TABLE churches ADD COLUMN IF NOT EXISTS languages JSONB DEFAULT '["English"]';
ALTER TABLE churches ADD COLUMN IF NOT EXISTS member_count INTEGER DEFAULT 0;
ALTER TABLE churches ADD COLUMN IF NOT EXISTS sermon_count INTEGER DEFAULT 0;
ALTER TABLE churches ADD COLUMN IF NOT EXISTS event_count INTEGER DEFAULT 0;
ALTER TABLE churches ADD COLUMN IF NOT EXISTS has_live_stream BOOLEAN DEFAULT false;
ALTER TABLE churches ADD COLUMN IF NOT EXISTS streaming_url TEXT;
ALTER TABLE churches ADD COLUMN IF NOT EXISTS beliefs TEXT;
ALTER TABLE churches ADD COLUMN IF NOT EXISTS pastor_names JSONB DEFAULT '[]';
```

### forum_threads (extend)

```sql
ALTER TABLE forum_threads ADD COLUMN IF NOT EXISTS tags JSONB DEFAULT '[]';
ALTER TABLE forum_threads ADD COLUMN IF NOT EXISTS scripture_refs JSONB DEFAULT '[]';
ALTER TABLE forum_threads ADD COLUMN IF NOT EXISTS is_anonymous BOOLEAN DEFAULT false;
ALTER TABLE forum_threads ADD COLUMN IF NOT EXISTS upvotes INTEGER DEFAULT 0;
ALTER TABLE forum_threads ADD COLUMN IF NOT EXISTS downvotes INTEGER DEFAULT 0;
ALTER TABLE forum_threads ADD COLUMN IF NOT EXISTS ai_tags JSONB DEFAULT '[]';
ALTER TABLE forum_threads ADD COLUMN IF NOT EXISTS accepted_reply_id UUID;
```

### forum_replies (extend)

```sql
ALTER TABLE forum_replies ADD COLUMN IF NOT EXISTS upvotes INTEGER DEFAULT 0;
ALTER TABLE forum_replies ADD COLUMN IF NOT EXISTS downvotes INTEGER DEFAULT 0;
ALTER TABLE forum_replies ADD COLUMN IF NOT EXISTS scripture_refs JSONB DEFAULT '[]';
ALTER TABLE forum_replies ADD COLUMN IF NOT EXISTS is_anonymous BOOLEAN DEFAULT false;
```

### forum_categories (extend)

```sql
ALTER TABLE forum_categories ADD COLUMN IF NOT EXISTS color VARCHAR(7);
ALTER TABLE forum_categories ADD COLUMN IF NOT EXISTS thread_count INTEGER DEFAULT 0;
ALTER TABLE forum_categories ADD COLUMN IF NOT EXISTS description TEXT;
```

---

## Entity Relationship Summary

```
users ──┬── user_community_profile (1:1)
        ├── user_gamification (1:1)
        ├── user_follows (M:N)
        ├── community_feed (1:N)
        ├── feed_comments (1:N)
        ├── feed_reactions (1:N)
        ├── testimonies (1:N)
        ├── notifications (1:N)
        ├── user_badges (1:N)
        ├── content_reports (1:N)
        ├── ai_conversation_logs (1:N)
        ├── prayer_requests (1:N) [existing]
        ├── group_members (M:N) [existing]
        ├── church_members (M:N) [existing]
        └── prayer_chains (M:N)

community_feed ──┬── feed_comments (1:N)
                 └── feed_reactions (1:N)

prayer_requests ──┬── prayer_chains (1:N)
                  └── community_feed (1:1 via feed_id)

small_groups ──┬── group_members (1:N) [existing]
               ├── community_feed (1:N via group_id)
               └── events (1:N) [existing]

churches ──┬── church_members (1:N) [existing]
           ├── community_feed (1:N via church_id)
           ├── events (1:N) [existing]
           └── sermon_notes (1:N) [existing]

forum_threads ──┬── forum_replies (1:N) [existing]
                └── forum_votes (1:N)
```
