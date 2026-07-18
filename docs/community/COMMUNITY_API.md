# Community API Endpoints

**BelieversFlow v5.0 — REST API Specification**
**Base URL:** `/api/community`

---

## Authentication

All endpoints require `Authorization: Bearer <jwt>` unless marked `(public)`.

---

## 1. Community Feed

### GET /api/community/feed
Get personalized feed for the authenticated user.

**Query Parameters:**
| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `type` | string | `all` | Filter: `all`, `prayer`, `testimony`, `group`, `event`, `sermon` |
| `cursor` | string | — | Pagination cursor (timestamp) |
| `limit` | int | 20 | Items per page (max 50) |

**Response:**
```json
{
  "items": [{
    "id": "uuid",
    "author": { "id": "uuid", "name": "string", "avatar": "url" },
    "content_type": "prayer_request",
    "title": "string",
    "body": "string",
    "visibility": "public",
    "group": { "id": "uuid", "name": "string" } | null,
    "church": { "id": "uuid", "name": "string" } | null,
    "reactions": { "prayed": 12, "amen": 5, "encourage": 3 },
    "user_reactions": ["prayed"],
    "comment_count": 4,
    "ai_tags": ["healing", "faith"],
    "is_pinned": false,
    "time_ago": "2h ago",
    "created_at": "2026-07-18T10:00:00Z"
  }],
  "next_cursor": "2026-07-18T08:00:00Z",
  "has_more": true
}
```

### POST /api/community/feed
Create a new feed post.

**Request Body:**
```json
{
  "content_type": "testimony",
  "title": "God healed my mother",
  "body": "Last week my mother was diagnosed...",
  "visibility": "public",
  "group_id": "uuid" | null,
  "church_id": "uuid" | null,
  "scripture_ref": "Psalm 103:3" | null
}
```

### POST /api/community/feed/{id}/react
Add or remove a reaction.

**Request Body:**
```json
{
  "reaction_type": "prayed",
  "action": "toggle"
}
```

### GET /api/community/feed/{id}/comments
Get comments for a feed item.

**Query:** `cursor`, `limit` (default 20)

### POST /api/community/feed/{id}/comments
Post a comment.

**Request Body:**
```json
{
  "body": "God is faithful!",
  "parent_id": "uuid" | null,
  "is_scripture": true,
  "scripture_ref": "Romans 8:28"
}
```

### DELETE /api/community/feed/{id}
Delete own feed post.

---

## 2. Prayer Requests

### GET /api/community/prayers
Get prayer requests feed.

**Query Parameters:**
| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `filter` | string | `all` | `all`, `mine`, `answered`, `urgent`, `anonymous` |
| `category` | string | — | `health`, `family`, `work`, `spiritual`, `financial`, `other` |
| `group_id` | uuid | — | Filter by group |
| `cursor` | string | — | Pagination cursor |
| `limit` | int | 20 | Items per page |

**Response:**
```json
{
  "items": [{
    "id": "uuid",
    "author": { "id": "uuid", "name": "string", "avatar": "url" },
    "is_anonymous": false,
    "content": "Please pray for my mother's surgery...",
    "category": "health",
    "is_urgent": true,
    "is_answered": false,
    "pray_count": 24,
    "chain_count": 3,
    "groups": [{ "id": "uuid", "name": "Prayer Warriors" }],
    "ai_scripture": { "ref": "James 5:16", "text": "Therefore confess your sins..." },
    "user_has_prayed": true,
    "time_ago": "3h ago",
    "created_at": "2026-07-18T07:00:00Z"
  }],
  "next_cursor": "...",
  "has_more": true,
  "stats": { "total": 156, "urgent": 12, "answered": 45 }
}
```

### POST /api/community/prayers
Create a prayer request.

**Request Body:**
```json
{
  "content": "Please pray for...",
  "category": "health",
  "is_urgent": false,
  "is_anonymous": false,
  "visibility": "public",
  "group_ids": ["uuid1", "uuid2"]
}
```

### POST /api/community/prayers/{id}/pray
Mark "I Prayed" for a request.

### POST /api/community/prayers/{id}/chain
Join a prayer chain.

### POST /api/community/prayers/{id}/answer
Mark a prayer as answered (owner only).

**Request Body:**
```json
{
  "note": "God answered! My mother's surgery was successful."
}
```

### GET /api/community/prayers/mine
Get user's own prayer requests.

### GET /api/community/prayers/analytics
Get prayer analytics.

**Query:** `period` = `7d`, `30d`, `90d`, `1y`, `all`

**Response:**
```json
{
  "total_prayers": 42,
  "total_minutes": 1260,
  "current_streak": 7,
  "best_streak": 14,
  "answered_count": 8,
  "answered_rate": 0.19,
  "best_day": "Sunday",
  "worst_day": "Wednesday",
  "monthly_trend": [{ "month": "Jul", "count": 30 }],
  "mood_correlation": [{ "mood": "peaceful", "prayer_count": 15 }]
}
```

---

## 3. Testimonies

### GET /api/community/testimonies
Get testimony feed.

**Query:** `filter` = `all`, `mine`, `following`, `trending`; `category`; `cursor`; `limit`

### POST /api/community/testimonies
Share a testimony.

**Request Body:**
```json
{
  "title": "God provided a job after 6 months",
  "body": "After being laid off...",
  "category": "provision",
  "scripture_ref": "Philippians 4:19",
  "image_url": "url" | null,
  "visibility": "public"
}
```

### GET /api/community/testimonies/{id}
Get testimony detail with comments.

### POST /api/community/testimonies/{id}/react
React to a testimony.

### GET /api/community/testimonies/trending
Get trending testimonies (most reactions in last 7 days).

---

## 4. Groups (Enhanced)

### GET /api/community/groups/discover
Discover groups (public).

**Query:** `search`, `category`, `denomination`, `min_members`, `max_members`, `cursor`, `limit`

**Response:**
```json
{
  "items": [{
    "id": "uuid",
    "name": "Prayer Warriors",
    "description": "Intercessory prayer group",
    "category": "intercessors",
    "privacy": "public",
    "member_count": 24,
    "post_count": 156,
    "prayer_count": 89,
    "last_activity_at": "2h ago",
    "icon": "🙏",
    "cover_image": "url"
  }],
  "recommended": [/* AI-recommended groups */]
}
```

### POST /api/community/groups
Create a group.

**Request Body:**
```json
{
  "name": "Faith Walkers",
  "description": "Growing together in faith",
  "category": "bible_study",
  "privacy": "public",
  "max_members": 50,
  "icon": "📖",
  "cover_image": "url"
}
```

### GET /api/community/groups/{id}
Get group detail with members, recent posts, upcoming events.

### PUT /api/community/groups/{id}
Update group (owner/leader only).

### DELETE /api/community/groups/{id}
Dissolve group (owner only).

### POST /api/community/groups/{id}/join
Join a group.

### POST /api/community/groups/{id}/leave
Leave a group.

### POST /api/community/groups/{id}/invite/refresh
Refresh invite code (leader+ only).

### GET /api/community/groups/{id}/posts
Get group posts.

### POST /api/community/groups/{id}/posts
Create a group post.

### GET /api/community/groups/{id}/prayers
Get group prayer wall.

### POST /api/community/groups/{id}/prayers
Post to group prayer wall.

### GET /api/community/groups/{id}/members
Get member list with roles.

### PUT /api/community/groups/{id}/members/{user_id}/role
Change member role (leader+ only).

### DELETE /api/community/groups/{id}/members/{user_id}
Remove member (leader+ only).

---

## 5. Churches (Enhanced)

### GET /api/community/churches/nearby
Find nearby churches.

**Query:** `lat`, `lng`, `radius_km` (default 25), `denomination`, `language`, `limit`

**Response:**
```json
{
  "items": [{
    "id": "uuid",
    "name": "Grace Community Church",
    "denomination": "Non-Denominational",
    "address": "123 Main St",
    "city": "Springfield",
    "distance_km": 3.2,
    "member_count": 450,
    "service_times": [{"day": "Sunday", "time": "10:00 AM"}],
    "languages": ["English", "Spanish"],
    "has_live_stream": true,
    "logo_url": "url",
    "rating": 4.5
  }]
}
```

### GET /api/community/churches/search
Search churches.

**Query:** `q`, `city`, `state`, `denomination`, `language`, `cursor`, `limit`

### GET /api/community/churches/{id}
Get church profile with ministries, events, sermons, groups.

### POST /api/community/churches/{id}/join
Join a church.

### POST /api/community/churches/{id}/leave
Leave a church.

### POST /api/community/churches/{id}/checkin
Check in at church (QR code or manual).

### GET /api/community/churches/{id}/sermons
Get church's sermons.

### GET /api/community/churches/{id}/events
Get church's events.

### GET /api/community/churches/{id}/groups
Get church's small groups.

---

## 6. Events (Enhanced)

### GET /api/community/events/discover
Discover events.

**Query:** `lat`, `lng`, `radius_km`, `type`, `category`, `date_from`, `date_to`, `free_only`, `cursor`, `limit`

### GET /api/community/events/my
Get user's events (attending, hosting).

### POST /api/community/events
Create an event.

**Request Body:**
```json
{
  "title": "Youth Conference 2026",
  "description": "Annual youth conference...",
  "event_type": "conference",
  "category": "youth",
  "location": "Grace Church",
  "latitude": 40.7128,
  "longitude": -74.0060,
  "start_time": "2026-08-15T09:00:00Z",
  "end_time": "2026-08-17T17:00:00Z",
  "recurrence": "none",
  "capacity": 200,
  "is_free": true,
  "cover_image": "url",
  "group_ids": ["uuid"],
  "church_id": "uuid"
}
```

### GET /api/community/events/{id}
Get event detail with attendees, related events.

### PUT /api/community/events/{id}
Update event (creator only).

### DELETE /api/community/events/{id}
Delete event (creator only).

### POST /api/community/events/{id}/rsvp
RSVP to event.

**Request Body:** `{ "status": "going" | "maybe" | "not_going" }`

### POST /api/community/events/{id}/checkin
Check in at event.

### GET /api/community/events/{id}/attendees
Get attendee list.

---

## 7. Sermons (Enhanced)

### GET /api/community/sermons/discover
Discover sermons.

**Query:** `search`, `pastor`, `church`, `topic`, `book`, `denomination`, `language`, `min_length`, `max_length`, `date_from`, `date_to`, `series`, `cursor`, `limit`

### GET /api/community/sermons/my
Get user's sermon notes.

### POST /api/community/sermons
Create a sermon note.

### GET /api/community/sermons/{id}
Get sermon detail.

### PUT /api/community/sermons/{id}
Update sermon note.

### DELETE /api/community/sermons/{id}
Delete sermon note.

### POST /api/community/sermons/{id}/summarize
AI-summarize sermon content.

### POST /api/community/sermons/{id}/study-guide
AI-generate Bible study guide from sermon.

### POST /api/community/sermons/{id}/discussion
AI-generate discussion questions.

### POST /api/community/sermons/{id}/quiz
AI-generate quiz from sermon.

### GET /api/community/sermons/{id}/verses
Extract all Scripture references from sermon.

### POST /api/community/sermons/export
Export sermon notes (PDF/Markdown).

---

## 8. Forum (Enhanced)

### GET /api/community/forum/categories
Get forum categories with thread counts.

### GET /api/community/forum/threads
Get threads.

**Query:** `category_id`, `search`, `sort` = `recent`|`popular`|`unanswered`|`solved`, `tag`, `cursor`, `limit`

### POST /api/community/forum/threads
Create a thread.

**Request Body:**
```json
{
  "category_id": "bible_questions",
  "title": "What does Romans 8:28 mean?",
  "content": "I've been struggling to understand...",
  "tags": ["romans", "suffering"],
  "scripture_refs": ["Romans 8:28"],
  "is_anonymous": false
}
```

### GET /api/community/forum/threads/{id}
Get thread with replies.

### PUT /api/community/forum/threads/{id}
Update thread (author only).

### DELETE /api/community/forum/threads/{id}
Delete thread (author or moderator).

### POST /api/community/forum/threads/{id}/pin
Pin/unpin thread (moderator only).

### POST /api/community/forum/threads/{id}/vote
Vote on thread.

**Request Body:** `{ "direction": "up" | "down" | "none" }`

### POST /api/community/forum/threads/{id}/replies
Post a reply.

### PUT /api/community/forum/replies/{id}
Update reply (author only).

### DELETE /api/community/forum/replies/{id}
Delete reply (author or moderator).

### POST /api/community/forum/replies/{id}/solution
Mark reply as solution (thread author only).

### POST /api/community/forum/replies/{id}/vote
Vote on reply.

---

## 9. Notifications

### GET /api/community/notifications
Get notifications.

**Query:** `filter` = `all`|`unread`, `type`, `cursor`, `limit`

**Response:**
```json
{
  "items": [{
    "id": "uuid",
    "type": "prayer.prayed",
    "actor": { "id": "uuid", "name": "Sarah", "avatar": "url" },
    "title": "Sarah prayed for you",
    "body": "Your prayer for healing was prayed for",
    "entity_type": "prayer_request",
    "entity_id": "uuid",
    "is_read": false,
    "created_at": "2026-07-18T10:00:00Z"
  }],
  "unread_count": 5,
  "has_more": true
}
```

### POST /api/community/notifications/{id}/read
Mark notification as read.

### POST /api/community/notifications/read-all
Mark all notifications as read.

### GET /api/community/notifications/preferences
Get notification preferences.

### PUT /api/community/notifications/preferences
Update notification preferences.

---

## 10. User Profile & Social

### GET /api/community/users/{id}
Get public user profile.

### PUT /api/community/users/me/profile
Update community profile.

**Request Body:**
```json
{
  "denomination": "Baptist",
  "interests": ["prayer", "bible_study", "missions"],
  "spiritual_maturity": "growing",
  "bio": "Passionate about God's Word",
  "is_location_public": true
}
```

### POST /api/community/users/{id}/follow
Follow a user.

### DELETE /api/community/users/{id}/follow
Unfollow a user.

### GET /api/community/users/{id}/followers
Get follower list.

### GET /api/community/users/{id}/following
Get following list.

---

## 11. Gamification

### GET /api/community/gamification/me
Get own gamification stats.

**Response:**
```json
{
  "points": 2450,
  "level": 4,
  "level_title": "Faithful",
  "level_progress": 0.63,
  "next_level_points": 3000,
  "streaks": {
    "prayer": { "current": 12, "best": 30 },
    "bible": { "current": 8, "best": 21 },
    "devotion": { "current": 5, "best": 14 }
  },
  "badges": [
    { "id": "first_prayer", "name": "First Prayer", "earned_at": "2026-07-01" }
  ],
  "milestones": [
    { "id": "joined", "title": "Joined BelieversFlow", "date": "2026-06-15" }
  ],
  "recent_points": [
    { "action": "daily_prayer", "points": 10, "date": "2026-07-18" }
  ]
}
```

### GET /api/community/gamification/leaderboard
Get leaderboard (opt-in only).

**Query:** `scope` = `global`|`group`|`church`, `period` = `week`|`month`|`all`

### GET /api/community/gamification/badges
Get all available badges and progress.

---

## 12. AI Assistant

### POST /api/community/ai/chat
Chat with AI Community Assistant.

**Request Body:**
```json
{
  "message": "Find me a Bible study group near Springfield",
  "context": {
    "current_view": "groups",
    "location": { "lat": 39.78, "lng": -89.65 },
    "interests": ["bible_study", "theology"]
  }
}
```

**Response:**
```json
{
  "response": "I found 3 Bible study groups near Springfield...",
  "action_cards": [
    { "type": "join_group", "group_id": "uuid", "group_name": "Wednesday Bible Study" }
  ],
  "scripture_refs": ["Hebrews 10:24-25"],
  "tokens_used": 250
}
```

### POST /api/community/ai/summarize
Summarize a discussion/thread.

### POST /api/community/ai/suggest
Get AI suggestions (groups, churches, events, sermons).

### POST /api/community/ai/prayer-help
AI prayer writing assistance.

### POST /api/community/ai/moderate
Check content for toxicity (called before publishing).

---

## 13. Moderation

### POST /api/community/report
Report content.

**Request Body:**
```json
{
  "entity_type": "feed_post",
  "entity_id": "uuid",
  "reason": "harassment",
  "description": "This post contains personal attacks..."
}
```

### GET /api/community/moderation/reports
Get pending reports (moderator/admin only).

### PUT /api/community/moderation/reports/{id}
Action on a report (moderator only).

**Request Body:**
```json
{
  "action": "remove",
  "note": "Content violates community guidelines"
}
```

### GET /api/community/moderation/stats
Get moderation stats (admin only).

---

## 14. Search

### GET /api/community/search
Universal search across all community content.

**Query:** `q` (search term), `type` = `all`|`groups`|`churches`|`events`|`sermons`|`threads`|`users`, `limit`

**Response:**
```json
{
  "groups": [{ "id": "uuid", "name": "...", "member_count": 24 }],
  "churches": [{ "id": "uuid", "name": "...", "distance_km": 3.2 }],
  "events": [{ "id": "uuid", "title": "...", "date": "2026-08-15" }],
  "sermons": [{ "id": "uuid", "title": "...", "preacher": "..." }],
  "threads": [{ "id": "uuid", "title": "...", "category": "..." }],
  "users": [{ "id": "uuid", "name": "...", "denomination": "..." }]
}
```

---

## 15. Daily Encouragement

### GET /api/community/encouragement
Get today's AI-generated encouragement.

**Response:**
```json
{
  "verse": { "ref": "Philippians 4:13", "text": "I can do all things through Christ..." },
  "reflection": "Today, remember that strength doesn't come from...",
  "prayer": "Lord, help me to rely on Your strength...",
  "challenge": "Reach out to someone who might need encouragement today.",
  "action_step": "Text or call one person today to share God's love."
}
```

---

## Rate Limits Summary

| Category | Limit | Window |
|----------|-------|--------|
| GET (reads) | 100/min | Sliding window |
| POST (writes) | 30/min | Sliding window |
| AI endpoints | 10/min | Sliding window |
| Search | 20/min | Sliding window |
| Auth | 5/min | Sliding window |

---

## Pagination

All list endpoints use cursor-based pagination:

```
GET /api/community/feed?limit=20
→ Response includes next_cursor

GET /api/community/feed?cursor=2026-07-18T08:00:00Z&limit=20
→ Returns next 20 items
```

---

## Error Responses

```json
{
  "error": {
    "code": "forbidden",
    "message": "You must be a premium member to access community features",
    "status": 403
  }
}
```

| Code | Status | Description |
|------|--------|-------------|
| `unauthorized` | 401 | Missing or invalid token |
| `forbidden` | 403 | Insufficient permissions |
| `not_found` | 404 | Resource not found |
| `validation_error` | 422 | Invalid request body |
| `rate_limited` | 429 | Too many requests |
| `server_error` | 500 | Internal server error |
