# Community Experience — Product Design Document

**BelieversFlow v5.0 — Community Platform**
**Version:** 1.0 | **Date:** July 2026 | **Status:** Design Phase

---

## 1. Information Architecture

### 1.1 Top-Level Navigation

```
Community (Bottom Tab / Sidebar)
├── Feed          — Personalized community feed
├── Prayer        — Prayer requests & chains
├── Groups        — Small group communities
├── Church        — Local church directory
├── Events        — Christian event discovery
├── Sermons       — Sermon discovery & notes
├── Forum         — Discussion boards
├── Testimonies   — faith stories
├── Analytics     — Spiritual growth dashboard
└── Assistant     — AI Community Assistant (FAB)
```

### 1.2 Community Feed (Home)

```
Feed
├── Filter Bar [All | Prayer | Testimony | Groups | Events | Sermons]
├── Daily Encouragement Card (rotates daily)
│   ├── Verse of the Day
│   ├── AI Reflection
│   ├── Prayer
│   └── Action Step
├── Prayer Requests (from followed users + groups)
│   ├── "I Prayed" button
│   ├── Comment count
│   └── Share Scripture
├── Testimony Posts
│   ├── Story content
│   ├── AI-tagged themes
│   └── Reactions (Praise / Amen / Encourage)
├── Group Activity
│   ├── New posts from joined groups
│   ├── Upcoming group events
│   └── Group prayer highlights
├── Event Highlights
│   ├── Upcoming events nearby
│   ├── Events from followed churches
│   └── RSVP quick-action
├── Sermon Highlights
│   ├── Trending sermons
│   ├── New from followed pastors
│   └── AI summary preview
├── Volunteer Opportunities
│   ├── Church needs
│   ├── Group service projects
│   └── Mission trips
└── AI Suggestions
    ├── "You might like" groups
    ├── "Nearby" churches
    └── "Recommended" events
```

### 1.3 Prayer Tab

```
Prayer
├── Filter Bar [All | Mine | Answered | Urgent | Anonymous]
├── New Prayer Request (FAB)
│   ├── Content textarea
│   ├── Category selector (Health, Family, Work, Spiritual, Financial, Other)
│   ├── Visibility toggle (Public / Group / Anonymous)
│   ├── Urgency toggle
│   └── Share to groups (multi-select)
├── Prayer Feed
│   ├── Prayer card
│   │   ├── Author avatar + name (or "Anonymous")
│   │   ├── Category badge
│   │   ├── Urgency indicator (if urgent)
│   │   ├── Content
│   │   ├── Scripture suggestion (AI)
│   │   ├── "I Prayed" count + button
│   │   ├── Prayer chain count
│   │   ├── Time ago
│   │   └── Actions: Pray | Comment | Share | Private Prayer
│   ├── Answered prayer card (green highlight)
│   │   ├── Answered testimony
│   │   └── "Praise God" reactions
│   └── Prayer chain card
│       ├── Chain count
│       └── "Join Chain" button
├── My Prayers section
│   ├── Active requests
│   └── Answered prayers
├── Prayer Analytics mini-card
│   ├── Streak
│   ├── Total prayed
│   └── Link to full Analytics
└── AI Prayer Assistant
    ├── "Write a prayer for me"
    ├── "Find Scripture for my situation"
    └── "Summarize prayer needs"
```

### 1.4 Groups Tab (Enhanced)

```
Groups
├── My Groups (default)
│   ├── Group card
│   │   ├── Group name + icon
│   │   ├── Member count
│   │   ├── Last activity
│   │   ├── Unread indicator
│   │   └── Active prayer count
│   └── Quick actions: Post | Pray | Event
├── Discover
│   ├── Search by name/topic
│   ├── Filter: Category | Denomination | Size | Activity
│   ├── Categories: Men, Women, Youth, Singles, Married, Business, Missions, Worship, Intercessors, Bible Study, Leadership
│   └── Recommended for you (AI)
├── Create Group
│   ├── Name, description, category
│   ├── Privacy: Public | Private | Invite-only
│   ├── Max members
│   ├── Image upload
│   └── Default roles setup
├── Group Detail
│   ├── Tabs: Posts | Prayer Wall | Events | Files | Members | Settings
│   ├── Posts tab
│   │   ├── Text posts
│   │   ├── Scripture sharing
│   │   ├── Polls
│   │   ├── Event announcements
│   │   └── AI discussion prompts
│   ├── Prayer Wall tab
│   │   ├── Group prayer requests
│   │   ├── "I Prayed" tracking
│   │   └── Answered prayer celebrations
│   ├── Events tab
│   │   ├── Group events
│   │   ├── Recurring studies
│   │   └── RSVP
│   ├── Files tab
│   │   ├── Shared documents
│   │   ├── Bible study materials
│   │   └── Links
│   ├── Members tab
│   │   ├── Member list with roles
│   │   ├── Activity status
│   │   └──Invite/remove (leaders)
│   └── Settings tab (leaders only)
│       ├── Edit group info
│       ├── Manage roles
│       ├── Invite code
│       ├── AI moderation settings
│       └── Dissolve group
├── Role Hierarchy
│   ├── Owner (can dissolve)
│   ├── Pastor (spiritual oversight)
│   ├── Leader (manage members, posts)
│   ├── Moderator (content moderation)
│   ├── Member (post, pray, attend)
│   └── Visitor (read-only)
└── Group AI Features
    ├── Discussion prompts
    ├── Bible study suggestions
    ├── Prayer reminders
    ├── Meeting summaries
    └── New member welcome
```

### 1.5 Church Tab (Enhanced)

```
Church
├── Nearby (default, uses geolocation)
│   ├── Map view with pins
│   ├── List view (sorted by distance)
│   └── Filter: Denomination | Distance | Size | Language
├── Search
│   ├── Text search
│   ├── City/state filter
│   ├── Denomination filter
│   └── Advanced: service times, languages, ministries
├── My Churches
│   ├── Joined churches
│   ├── Attendance history
│   └── Giving history (optional)
├── Church Profile
│   ├── Header: name, photo, denomination, distance
│   ├── About section
│   ├── Service times
│   ├── Ministries list
│   ├── Pastors/leaders
│   ├── Upcoming events
│   ├── Recent sermons
│   ├── Small groups
│   ├── Volunteer opportunities
│   ├── Announcements
│   ├── Live streaming (if available)
│   ├── Connect card (digital)
│   ├── Membership application
│   └── Giving (link to external)
├── Church AI Assistant
│   ├── "What are this church's beliefs?"
│   ├── "What ministries do they have?"
│   ├── "When are services?"
│   ├── "How do I join?"
│   └── "Recommend a ministry for me"
└── Visitor Features
    ├── Check-in (QR code)
    ├── Digital connect card
    ├── Welcome message
    └── Follow-up scheduling
```

### 1.6 Events Tab (Enhanced)

```
Events
├── Discover (default)
│   ├── Map view
│   ├── Calendar view (month/week/list)
│   ├── Filter: Type | Date | Distance | Church | Free/Paid
│   ├── Categories: Church, Conference, Retreat, Prayer, Study, Volunteer, Mission, Youth, Concert, Meetup
│   └── AI recommendations (based on interests + location)
├── My Events
│   ├── Upcoming (with calendar sync)
│   ├── Past (with check-in history)
│   └── Hosting (for event creators)
├── Create Event
│   ├── Title, description, location
│   ├── Date/time with recurrence
│   ├── Event type + category
│   ├── Capacity limit
│   ├── Ticketing (free/paid)
│   ├── Volunteer signup
│   ├── Cover image
│   └── Share to groups/churches
├── Event Detail
│   ├── Header with cover image
│   ├── Date/time/location with map link
│   ├── Description
│   ├── Organizer info
│   ├── Attendees list + count
│   ├── RSVP buttons (Going / Maybe / Not Going)
│   ├── Add to calendar (.ics)
│   ├── Share / Invite friends
│   ├── Volunteer signup
│   ├── Discussion
│   ├── Related events
│   └── AI: "What to expect" summary
└── Event AI Features
    ├── Personalized suggestions
    ├── "Events near you" alerts
    ├── Calendar conflict detection
    └── Post-event summary
```

### 1.7 Sermons Tab (Enhanced)

```
Sermons
├── Discover (default)
│   ├── Trending sermons
│   ├── New releases
│   ├── Recommended for you (AI)
│   ├── Browse by: Pastor | Church | Topic | Series | Book
│   └── Search with filters
├── My Notes
│   ├── Sermon notes list
│   ├── Search / filter
│   └── Export
├── Sermon Detail
│   ├── Video/Audio player
│   ├── Transcript (auto-generated)
│   ├── AI Summary
│   ├── Key points extraction
│   ├── Scripture references (clickable)
│   ├── Discussion questions (AI-generated)
│   ├── Take notes
│   ├── Bookmark
│   ├── Share
│   └── Related sermons
├── Create Note
│   ├── Title, preacher, church
│   ├── Scripture references
│   ├── Key points
│   ├── Full notes
│   └── Tags
└── AI Sermon Features
    ├── Summarize
    ├── Create Bible study from sermon
    ├── Generate discussion guide
    ├── Generate youth lesson
    ├── Extract action items
    ├── Find all referenced verses
    ├── Create devotional from sermon
    ├── Generate quiz
    └── Translate key points
```

### 1.8 Forum Tab (Enhanced)

```
Forum
├── Categories
│   ├── Bible Questions
│   ├── Theology
│   ├── Christian Living
│   ├── Prayer
│   ├── Marriage & Relationships
│   ├── Youth
│   ├── Apologetics
│   ├── Missions
│   ├── Church Leadership
│   ├── Mental Health
│   ├── Career & Finance
│   ├── Parenting
│   ├── Technology
│   └── Welcome / Introductions
├── Thread List
│   ├── Sort: Recent | Popular | Unanswered | Solved
│   ├── Search with filters
│   ├── Tags
│   └── Pinned threads
├── Thread Detail
│   ├── Original post with Markdown
│   ├── Scripture references (auto-linked)
│   ├── Expert/Pastor badges
│   ├── Threaded replies
│   ├── Accepted answer (for questions)
│   ├── Voting (upvote/downvote)
│   ├── Share / Bookmark
│   └── Report
├── Create Thread
│   ├── Category selection
│   ├── Title + content (Markdown)
│   ├── Tags
│   ├── Scripture references
│   └── Anonymous mode option
└── Forum AI Features
    ├── Suggest related threads
    ├── Detect duplicates
    ├── Suggest Bible answers
    ├── Summarize long discussions
    ├── Toxicity detection
    └── Recommend thread to relevant users
```

### 1.9 Testimonies Tab

```
Testimonies
├── Feed
│   ├── Testimony card
│   │   ├── Author avatar + name
│   │   ├── Category badge (Salvation, Miracle, Healing, Mission, Growth, Other)
│   │   ├── AI-tagged themes
│   │   ├── Story content
│   │   ├── Reactions: Praise God | Amen | Encourage | Inspired
│   │   ├── Comment count
│   │   ├── Share button
│   │   └── Time ago
│   └── Filter: All | Mine | Following | Trending
├── Share Testimony (FAB)
│   ├── Title
│   ├── Category selector
│   ├── Story content (rich text)
│   ├── Optional: scripture reference
│   ├── Optional: photo
│   └── Visibility: Public | Friends | Groups
├── Testimony Detail
│   ├── Full story
│   ├── AI theme tags
│   ├── Comments section
│   ├── Related testimonies
│   └── "This encouraged me" count
└── AI Features
    ├── Auto-tag themes
    ├── Suggest related Scripture
    ├── Highlight trending testimonies
    └── Generate encouragement response
```

### 1.10 Analytics Tab (Enhanced)

```
Analytics
├── Overview Dashboard
│   ├── Spiritual Health Score (composite, 0-100)
│   ├── Streaks: Prayer | Bible | Devotion
│   ├── This Week summary
│   └── AI Next Step suggestion
├── Prayer Analytics
│   ├── Total prayers / minutes
│   ├── Streak history
│   ├── Best/worst days
│   ├── Monthly trend chart
│   ├── Answered prayer rate
│   └── Mood correlation
├── Bible Reading
│   ├── Chapters read
│   ├── Books completed
│   ├── Reading streak
│   ├── Translation diversity
│   └── Pace vs. plan
├── Community Impact
│   ├── Groups joined
│   ├── Events attended
│   ├── Volunteer hours
│   ├── Prayer requests answered for others
│   ├── Forum contributions
│   └── Testimonies shared
├── Growth Journey
│   ├── Timeline view
│   ├── Milestones achieved
│   ├── Badges earned
│   ├── Points total
│   └── Level progress
├── Goals
│   ├── Daily prayer goal
│   ├── Weekly Bible reading goal
│   ├── Monthly church attendance goal
│   ├── Custom goals
│   └── Progress tracking
├── Reports
│   ├── Weekly email digest
│   ├── Monthly reflection (AI-generated)
│   ├── Year in review
│   └── Export data
└── AI Insights
    ├── Personalized growth recommendations
    ├── Suggested mentors
    ├── Suggested groups
    ├── Suggested Bible plans
    ├── Habit coaching
    └── Faith journey narrative
```

### 1.11 AI Community Assistant

```
Assistant (Floating Action Button → Panel)
├── Quick Actions
│   ├── "Find a group for me"
│   ├── "Find a church nearby"
│   ├── "What should I read today?"
│   ├── "Help me write a prayer"
│   └── "Summarize this discussion"
├── Chat Interface
│   ├── Message input with voice toggle
│   ├── AI responses with Scripture citations
│   ├── Action cards (join group, RSVP, etc.)
│   └── Context-aware (knows your groups, churches, interests)
├── Capabilities
│   ├── Group recommendations
│   ├── Church finder
│   ├── Bible study suggestions
│   ├── Event recommendations
│   ├── Sermon recommendations
│   ├── Discussion explanations
│   ├── Conversation summaries
│   ├── Connection suggestions
│   ├── Prayer writing assistance
│   ├── Spiritual growth coaching
│   └── Content moderation help
└── Guardrails
    ├── Always defers to Scripture
    ├── Never replaces pastoral authority
    ├── Cites sources
    ├── Flags harmful content
    └── Escalates to humans when needed
```

---

## 2. User Flows

### 2.1 New User — First Community Experience

```
1. User opens Community tab (after premium activation)
2. Sees empty state: "Welcome to Community"
3. AI Assistant suggests: denomination, interests, location
4. User completes community profile ( denomination, interests, church)
5. AI generates personalized feed
6. User sees:
   a. Daily Encouragement card
   b. 3 recommended groups
   c. 3 nearby churches
   d. Upcoming events
   e. Trending sermons
7. User joins first group
8. User posts first prayer request
9. User receives first "I Prayed" notification
10. User is hooked
```

### 2.2 Prayer Request Flow

```
1. User taps "Prayer" tab or FAB
2. Writes prayer request
3. Selects category + visibility
4. Optionally shares to groups
5. Prayer appears in:
   a. User's "My Prayers" section
   b. Followers' feeds
   c. Shared groups' prayer walls
   d. Public prayer feed (if public)
6. Others see prayer → tap "I Prayed"
7. User gets notification: "5 people prayed for you"
8. AI suggests relevant Scripture
9. User marks as answered → celebration card in feed
10. Answered prayer appears in "Praise Reports" feed
```

### 2.3 Group Discovery & Engagement Flow

```
1. User opens Groups tab → "Discover"
2. AI recommends groups based on:
   a. Denomination
   b. Interests
   c. Location
   d. Friends' groups
3. User browses recommended groups
4. Taps group → sees preview (description, members, recent posts)
5. Taps "Join Group"
6. Gets welcome message from AI
7. Sees group's discussion prompts
8. Posts first message
9. Joins group prayer wall
10. Attends group event
11. Earns "Group Member" badge
```

### 2.4 Church Discovery Flow

```
1. User opens Church tab
2. App requests location permission
3. Shows nearby churches on map
4. User taps church pin → preview card
5. User taps "View Church" → full profile
6. Sees: service times, ministries, pastors, events
7. AI answers: "What are their beliefs?"
8. User taps "Join Church"
9. Gets digital connect card
10. Church admin sees new member
11. User gets welcome message
12. User checks in at next service (QR code)
```

### 2.5 Event Discovery Flow

```
1. User opens Events tab
2. Sees events on map/calendar
3. AI suggests: "Based on your interests..."
4. User taps event → detail page
5. Sees: description, attendees, location, time
6. AI: "What to expect at this event"
7. User taps "Going"
8. Event added to calendar
9. User gets reminder 24h before
10. User checks in at event
11. Post-event: AI generates summary
12. User shares testimony about event
```

### 2.6 Forum Question Flow

```
1. User has a Bible question
2. Opens Forum → "Bible Questions" category
3. Searches existing threads
4. Doesn't find answer → creates new thread
5. Writes question with Scripture reference
6. AI suggests: "Similar questions answered here..."
7. Thread posted
8. AI tags thread with relevant topics
9. Expert/pastor users get notified
10. First reply with accepted answer
11. User marks as solved
12. Thread becomes reference for future users
```

### 2.7 Testimony Sharing Flow

```
1. User experienced something God did
2. Opens Testimonies tab
3. Taps "Share Testimony"
4. Writes story
5. AI auto-tags themes (miracle, healing, provision, etc.)
6. User reviews tags, adds photo
7. Posts to testimony feed
8. AI suggests related Scripture
9. Others react: "Praise God", "Amen", "Encourage"
10. Story appears in personalized feeds
11. User earns "Testimony Sharer" badge
```

---

## 3. Design System

### 3.1 Design Tokens

```css
:root {
  /* Community-specific colors */
  --community-primary: #6366f1;      /* Indigo — primary actions */
  --community-secondary: #10b981;    /* Emerald — positive/success */
  --community-prayer: #8b5cf6;       /* Violet — prayer features */
  --community-testimony: #f59e0b;    /* Amber — testimonies */
  --community-event: #3b82f6;        /* Blue — events */
  --community-forum: #06b6d4;        /* Cyan — forum */
  --community-sermon: #ec4899;       /* Pink — sermons */
  --community-church: #f97316;       /* Orange — church */
  --community-group: #14b8a6;        /* Teal — groups */
  --community-urgent: #ef4444;       /* Red — urgent prayers */
  --community-answered: #22c55e;     /* Green — answered prayers */

  /* Gamification colors */
  --gamification-bronze: #cd7f32;
  --gamification-silver: #c0c0c0;
  --gamification-gold: #ffd700;
  --gamification-platinum: #e5e4e2;
  --gamification-diamond: #b9f2ff;

  /* Spacing scale */
  --space-xs: 4px;
  --space-sm: 8px;
  --space-md: 16px;
  --space-lg: 24px;
  --space-xl: 32px;
  --space-2xl: 48px;

  /* Border radius */
  --radius-sm: 6px;
  --radius-md: 10px;
  --radius-lg: 16px;
  --radius-xl: 24px;
  --radius-full: 9999px;

  /* Shadows */
  --shadow-sm: 0 1px 2px rgba(0,0,0,0.05);
  --shadow-md: 0 4px 6px -1px rgba(0,0,0,0.1);
  --shadow-lg: 0 10px 15px -3px rgba(0,0,0,0.1);
  --shadow-glow: 0 0 20px rgba(99,102,241,0.3);

  /* Transitions */
  --transition-fast: 150ms ease;
  --transition-normal: 250ms ease;
  --transition-slow: 350ms ease;
}
```

### 3.2 Component Patterns

#### Card Pattern
```css
.community-card {
  background: var(--card-bg);
  border-radius: var(--radius-lg);
  padding: var(--space-lg);
  border: 1px solid var(--border-color);
  transition: transform var(--transition-fast), box-shadow var(--transition-fast);
}
.community-card:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
}
```

#### Badge Pattern
```css
.community-badge {
  display: inline-flex;
  align-items: center;
  gap: var(--space-xs);
  padding: var(--space-xs) var(--space-sm);
  border-radius: var(--radius-full);
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}
```

#### Avatar Pattern
```css
.community-avatar {
  width: 40px;
  height: 40px;
  border-radius: var(--radius-full);
  object-fit: cover;
  border: 2px solid var(--border-color);
}
.community-avatar-lg { width: 56px; height: 56px; }
.community-avatar-sm { width: 32px; height: 32px; }
```

#### Action Button Pattern
```css
.community-action-btn {
  display: inline-flex;
  align-items: center;
  gap: var(--space-xs);
  padding: var(--space-xs) var(--space-md);
  border-radius: var(--radius-full);
  font-size: 0.875rem;
  font-weight: 500;
  border: 1px solid var(--border-color);
  background: transparent;
  color: var(--text-secondary);
  transition: all var(--transition-fast);
}
.community-action-btn:hover {
  background: var(--hover-bg);
  border-color: var(--community-primary);
  color: var(--community-primary);
}
.community-action-btn.active {
  background: var(--community-primary);
  color: white;
  border-color: var(--community-primary);
}
```

### 3.3 Feed Card Structure

```html
<div class="feed-card">
  <div class="feed-card-header">
    <img class="community-avatar" src="..." alt="..." />
    <div class="feed-card-author">
      <span class="feed-card-name">Author Name</span>
      <span class="feed-card-meta">Category · 2h ago</span>
    </div>
    <button class="feed-card-menu">⋯</button>
  </div>
  <div class="feed-card-content">
    <!-- Post content / prayer request / testimony -->
  </div>
  <div class="feed-card-tags">
    <span class="community-badge">Prayer</span>
    <span class="community-badge">Health</span>
  </div>
  <div class="feed-card-actions">
    <button class="community-action-btn">🙏 I Prayed · 12</button>
    <button class="community-action-btn">💬 Comment · 3</button>
    <button class="community-action-btn">📤 Share</button>
  </div>
</div>
```

### 3.4 Empty States

Every view has a contextual empty state with illustration, message, and CTA:

```html
<div class="empty-state">
  <div class="empty-state-icon"><!-- SVG illustration --></div>
  <h3 class="empty-state-title">No prayer requests yet</h3>
  <p class="empty-state-text">Share what's on your heart. The community is here to pray with you.</p>
  <button class="btn-primary">Share a Prayer Request</button>
</div>
```

### 3.5 Loading States

```html
<!-- Skeleton loading -->
<div class="skeleton-card">
  <div class="skeleton-avatar skeleton-pulse"></div>
  <div class="skeleton-lines">
    <div class="skeleton-line skeleton-pulse" style="width: 60%"></div>
    <div class="skeleton-line skeleton-pulse" style="width: 80%"></div>
    <div class="skeleton-line skeleton-pulse" style="width: 40%"></div>
  </div>
</div>
```

### 3.6 Error States

```html
<div class="error-state">
  <div class="error-state-icon"><!-- Warning SVG --></div>
  <h3 class="error-state-title">Something went wrong</h3>
  <p class="error-state-text">We couldn't load the prayer feed. Please try again.</p>
  <button class="btn-primary" onclick="retry()">Try Again</button>
</div>
```

---

## 4. Gamification System

### 4.1 Points System

| Action | Points | Cooldown |
|--------|--------|----------|
| Daily prayer logged | 10 | Once/day |
| Bible chapter read | 5 | No limit |
| Devotional completed | 10 | Once/day |
| Prayer request posted | 5 | Once/hour |
| "I Prayed" for someone | 2 | 10/post |
| Testimony shared | 20 | Once/day |
| Forum thread created | 10 | Once/day |
| Forum reply posted | 5 | No limit |
| Group post created | 5 | Once/hour |
| Event attended (check-in) | 15 | Once/event |
| Volunteer hour logged | 20 | No limit |
| Church check-in | 10 | Once/Sunday |
| Streak maintained (7 days) | 50 | Weekly bonus |
| Streak maintained (30 days) | 200 | Monthly bonus |
| First group joined | 25 | One-time |
| First church joined | 25 | One-time |
| Profile completed | 50 | One-time |

### 4.2 Levels

| Level | Points Required | Title | Color |
|-------|----------------|-------|-------|
| 1 | 0 | Seeker | -- |
| 2 | 100 | Believer | Bronze |
| 3 | 500 | Disciple | Bronze |
| 4 | 1,500 | Faithful | Silver |
| 5 | 3,000 | Servant | Silver |
| 6 | 6,000 | Minister | Gold |
| 7 | 12,000 | Elder | Gold |
| 8 | 25,000 | Leader | Platinum |
| 9 | 50,000 | Shepherd | Platinum |
| 10 | 100,000 | Steward | Diamond |

### 4.3 Badges

| Badge | Requirement | Category |
|-------|------------|----------|
| First Prayer | Post first prayer request | Prayer |
| Prayer Warrior | 100 prayers logged | Prayer |
| Intercessor | Pray for 500 requests | Prayer |
| Prayer Streak | 30-day prayer streak | Prayer |
| Bible Explorer | Read from 10 different books | Bible |
| Bible Scholar | Read entire Bible | Bible |
| Daily Bread | 7-day devotion streak | Bible |
| Scripture Memory | Memorize 50 verses | Bible |
| Testimony Sharer | Share first testimony | Community |
| Community Builder | Join 5 groups | Community |
| Welcome Host | Welcome 10 new members | Community |
| Discussion Starter | Create 20 forum threads | Community |
| Problem Solver | 10 accepted answers | Community |
| Churchgoer | 4 consecutive Sundays | Church |
| Ministry Worker | Log 50 volunteer hours | Service |
| Missionary | Join a mission trip event | Service |
| Event Champion | Attend 20 events | Events |
| Mentor | Help 5 new members | Leadership |
| Streak Master | 90-day prayer streak | Consistency |
| Year of Faith | 365-day streak | Consistency |

### 4.4 Spiritual Milestones

Milestones appear on the faith journey timeline:

```
🌱 Joined BelieversFlow
📖 First Bible Chapter Read
🙏 First Prayer Logged
⛪ Joined a Church
👥 Joined First Group
💬 First Forum Post
✨ First Testimony Shared
🎯 First Goal Achieved
🔥 7-Day Streak
🔥🔥 30-Day Streak
🔥🔥🔥 90-Day Streak
📚 Completed First Bible Book
🏆 Reached Level 5
💎 Reached Level 10
```

---

## 5. Notification System

### 5.1 Notification Types

| Type | Trigger | Priority |
|------|---------|----------|
| `prayer.prayed` | Someone prayed for you | Normal |
| `prayer.answered` | Your prayer marked answered | High |
| `prayer.chain.joined` | Someone joined your prayer chain | Normal |
| `group.post` | New post in joined group | Normal |
| `group.event` | New event in joined group | Normal |
| `group.welcome` | Welcome message in new group | Normal |
| `group.prayer` | New prayer in group prayer wall | Normal |
| `church.announcement` | Church announcement | Normal |
| `church.event` | New church event | Normal |
| `church.sermon` | New sermon posted | Low |
| `event.reminder` | 24h before event | High |
| `event.update` | Event details changed | High |
| `forum.reply` | Reply to your thread | Normal |
| `forum.mention` | Someone mentioned you | Normal |
| `forum.solved` | Your question was answered | High |
| `testimony.reaction` | Reaction on your testimony | Normal |
| `testimony.featured` | Your testimony featured | High |
| `community.badge` | Badge earned | High |
| `community.level` | Level up | High |
| `community.milestone` | Milestone achieved | High |
| `assistant.suggestion` | AI recommendation | Low |

### 5.2 Notification Delivery

- **In-app**: Real-time badge + notification center
- **Push**: Mobile push notifications (high priority only)
- **Email**: Daily digest (configurable)
- **Frequency**: Immediate for high priority, batched for normal, daily for low

### 5.3 Notification Center UI

```
Notification Center (bell icon in header)
├── Unread count badge
├── Filter: All | Unread | Prayer | Group | Church
├── Notification item
│   ├── Icon (context-specific)
│   ├── Avatar (if user-related)
│   ├── Title + description
│   ├── Time ago
│   ├── Unread dot
│   └── Tap → deep link to relevant content
├── Mark all as read
└── Settings → notification preferences
```

---

## 6. Moderation & Safety

### 6.1 Content Moderation Layers

1. **AI Pre-screening**: All posts checked for toxicity, spam, inappropriate content before publishing
2. **Community Reporting**: Users can report content with reasons
3. **Moderator Review**: Group/forum moderators review flagged content
4. **Admin Oversight**: Platform admins handle severe cases
5. **Appeal Process**: Users can appeal moderation decisions

### 6.2 Toxicity Detection

- AI checks for: hate speech, harassment, explicit content, spam, scams
- Severity levels: Low (warn), Medium (hide + review), High (auto-remove + ban)
- False positive handling: appeals, context awareness

### 6.3 Reporting Flow

```
User sees inappropriate content
  → Taps "Report"
  → Selects reason (Spam, Harassment, Inappropriate, False teaching, Other)
  → Adds optional description
  → Report submitted
  → Content flagged for moderator review
  → Moderator reviews → Remove / Warn / Dismiss
  → Reporter notified of action
```

### 6.4 Privacy Controls

| Setting | Options |
|---------|---------|
| Profile visibility | Public / Members only / Private |
| Prayer visibility | Public / Groups / Friends / Private |
| Testimony visibility | Public / Friends / Groups |
| Online status | Visible / Hidden |
| Location | Exact / City only / Hidden |
| Read receipts | On / Off |
| Data sharing | Full / Minimal / None |

---

## 7. Scalability Architecture

### 7.1 Database Design Principles

- **UUID primary keys** for all tables (distributed-friendly)
- **Soft deletes** (deleted_at timestamp) for data recovery
- **Audit columns** (created_at, updated_at, created_by) on all tables
- **Indexing strategy**: Composite indexes on frequently queried columns
- **Partitioning**: Prayer requests, feed posts, notifications partitioned by date
- **Read replicas**: PostgreSQL streaming replication for read-heavy workloads

### 7.2 Caching Strategy

| Data | Cache Layer | TTL |
|------|------------|-----|
| Feed content | Redis | 5 min |
| User profiles | Redis | 15 min |
| Group member counts | Redis | 5 min |
| Church search results | Redis | 10 min |
| Prayer analytics | Redis | 1 hour |
| Notification counts | Redis | Real-time (pub/sub) |
| AI suggestions | Redis | 1 hour |

### 7.3 API Rate Limiting

| Endpoint Category | Limit | Window |
|-------------------|-------|--------|
| Read endpoints | 100 req | 1 min |
| Write endpoints | 30 req | 1 min |
| AI endpoints | 10 req | 1 min |
| Auth endpoints | 5 req | 1 min |
| Search endpoints | 20 req | 1 min |

### 7.4 Real-time Features

- **WebSocket** for: notifications, prayer chain updates, live discussion, online status
- **Server-Sent Events** for: feed updates, group posts
- **Polling fallback**: For environments where WebSocket is blocked

### 7.5 CDN & Media

- **Images**: Uploaded to S3 → served via CloudFront CDN
- **Sermon media**: External embeds (YouTube, Vimeo, podcast RSS)
- **Audio posts**: S3 + CloudFront with range request support
- **Documents**: S3 with signed URLs for private files

---

## 8. Security & Privacy

### 8.1 Authentication

- JWT with 15-minute access tokens, 7-day refresh tokens
- Token rotation on refresh
- Device tracking for suspicious activity
- Rate limiting on auth endpoints

### 8.2 Authorization

- Role-based access control (RBAC) per group/church
- Row-level security in PostgreSQL
- API middleware validates permissions on every request
- Content ownership checks before edit/delete

### 8.3 Data Protection

- All data encrypted at rest (AES-256)
- All data encrypted in transit (TLS 1.3)
- PII minimization in logs
- Right to deletion (GDPR/CCPA compliance)
- Data export functionality
- No selling of user data — ever

### 8.4 Content Security

- Input sanitization (XSS prevention)
- CSRF protection on state-changing endpoints
- Content Security Policy headers
- File upload validation (type, size, malware scan)
- SQL injection prevention (parameterized queries)

---

*This document defines the complete Community experience for BelieversFlow v5.0. Implementation proceeds in phases: Core Feed → Prayer → Groups → Church → Events → Sermons → Forum → Testimonies → Analytics → AI Assistant → Gamification → Notifications → Moderation.*
