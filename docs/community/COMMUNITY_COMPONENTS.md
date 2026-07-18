# Community Component Hierarchy

**BelieversFlow v5.0 — React Component Architecture**

---

## Updated App.jsx Component Tree

```
App.jsx
├── ErrorBoundary
├── LegalScreen (first-run)
├── Onboarding (first-run)
├── WelcomeScreen (first-run)
├── Auth (authentication)
├── PremiumGate
├── ── Layout ──
├── Sidebar (desktop/tablet) ← ADD: notifications bell, gamification badge
├── MobileDrawer (mobile) ← ADD: notification count, community section
├── BottomNav (mobile) ← ADD: notification badge
├── HeaderDesktop ← ADD: notification bell, AI assistant FAB
├── HeaderMobile ← ADD: notification bell
├── ── Views ──
├── HomeView
├── BibleView → VersionSelector
├── DevotionalView
├── TasksView
├── SpiritualView (Prayer Tracker)
├── DiaryView
├── MusicView → HymnView
├── SettingsView
├── ── Community Views (Enhanced) ──
├── CommunityFeedView ★ NEW
│   ├── DailyEncouragementCard
│   ├── FeedFilterBar
│   ├── FeedCard (×N)
│   │   ├── FeedCardHeader (avatar, name, time, menu)
│   │   ├── FeedCardBody (content)
│   │   ├── FeedCardTags (badges)
│   │   ├── FeedCardScripture (if applicable)
│   │   ├── FeedCardMedia (image if applicable)
│   │   └── FeedCardActions (react, comment, share)
│   ├── FeedCommentSection (expandable)
│   │   ├── CommentInput
│   │   └── CommentCard (×N)
│   └── FeedSkeleton (loading)
├── PrayerFeedView ★ NEW (replaces basic prayer in SpiritualView)
│   ├── PrayerFilterBar
│   ├── NewPrayerFAB
│   ├── PrayerComposer (modal)
│   ├── PrayerCard (×N)
│   │   ├── PrayerCardHeader (avatar, category badge, urgency)
│   │   ├── PrayerCardBody (content)
│   │   ├── PrayerScripture (AI-suggested)
│   │   ├── PrayerChainIndicator
│   │   └── PrayerCardActions (I Prayed, Comment, Share, Chain)
│   ├── PrayerAnsweredCard (green highlight)
│   ├── MyPrayersSection
│   └── PrayerAnalyticsMini
├── TestimonyView ★ NEW
│   ├── TestimonyFilterBar
│   ├── NewTestimonyFAB
│   ├── TestimonyComposer (modal)
│   ├── TestimonyCard (×N)
│   │   ├── TestimonyHeader (avatar, category, AI tags)
│   │   ├── TestimonyBody (story content)
│   │   ├── TestimonyScripture
│   │   ├── TestimonyImage (optional)
│   │   └── TestimonyActions (Praise God, Amen, Encourage, Comment)
│   └── TestimonySkeleton (loading)
├── GroupsView (Enhanced)
│   ├── GroupFilterBar [My Groups | Discover | Create]
│   ├── GroupCard (×N)
│   │   ├── GroupCardHeader (icon, name, member count)
│   │   ├── GroupCardBody (description, activity)
│   │   ├── GroupCardStats (posts, prayers, events)
│   │   └── GroupCardActions (Join, Post, Pray)
│   ├── GroupDetail
│   │   ├── GroupDetailHeader
│   │   ├── GroupTabs [Posts | Prayer | Events | Members | Settings]
│   │   ├── GroupPostCard (×N)
│   │   ├── GroupPrayerCard (×N)
│   │   ├── GroupEventCard (×N)
│   │   ├── GroupMemberCard (×N)
│   │   └── GroupPollCard (×N)
│   ├── GroupCreateForm
│   └── GroupJoinForm
├── ChurchView (Enhanced)
│   ├── ChurchMapView (map + list toggle)
│   ├── ChurchFilterBar
│   ├── ChurchSearchBar
│   ├── ChurchCard (×N)
│   │   ├── ChurchCardLogo
│   │   ├── ChurchCardInfo (name, denomination, distance)
│   │   ├── ChurchCardStats (members, sermons, events)
│   │   └── ChurchCardActions (View, Join)
│   ├── ChurchProfile
│   │   ├── ChurchProfileHeader (cover, logo, name)
│   │   ├── ChurchAbout
│   │   ├── ChurchServiceTimes
│   │   ├── ChurchMinistries
│   │   ├── ChurchPastors
│   │   ├── ChurchEvents (upcoming)
│   │   ├── ChurchSermons (recent)
│   │   ├── ChurchGroups (small groups)
│   │   ├── ChurchVolunteer
│   │   ├── ChurchConnectCard
│   │   └── ChurchAIAssistant
│   └── ChurchCheckIn (QR scanner)
├── EventsView (Enhanced)
│   ├── EventViewToggle [Map | Calendar | List]
│   ├── EventFilterBar
│   ├── EventCalendarView
│   ├── EventMapView
│   ├── EventCard (×N)
│   │   ├── EventCardCover
│   │   ├── EventCardDate (month/day)
│   │   ├── EventCardInfo (title, location, time)
│   │   ├── EventCardOrganizer
│   │   ├── EventCardAttendees (avatars + count)
│   │   └── EventCardActions (RSVP, Share, Directions)
│   ├── EventDetail
│   │   ├── EventDetailHeader (cover, title, date)
│   │   ├── EventDetailInfo (location, organizer, capacity)
│   │   ├── EventDetailDescription
│   │   ├── EventRSVPButtons
│   │   ├── EventAttendeeList
│   │   ├── EventDiscussion
│   │   ├── EventCalendarSync (.ics download)
│   │   ├── EventVolunteerSignup
│   │   └── EventAISummary ("What to expect")
│   └── EventCreateForm
├── SermonView (Enhanced)
│   ├── SermonDiscoverView
│   │   ├── SermonFilterBar (search + filters)
│   │   ├── SermonCategoryTabs [Trending | New | By Topic | By Pastor]
│   │   ├── SermonCard (×N)
│   │   │   ├── SermonCardVideo (thumbnail)
│   │   │   ├── SermonCardInfo (title, preacher, church, date)
│   │   │   ├── SermonCardDuration
│   │   │   ├── SermonCardTags
│   │   │   └── SermonCardActions (Watch, Notes, Share)
│   │   └── SermonAISummary (preview)
│   ├── SermonDetailView
│   │   ├── SermonPlayer (video/audio)
│   │   ├── SermonTranscript (toggle)
│   │   ├── SermonKeyPoints (AI)
│   │   ├── SermonScriptureRefs (clickable)
│   │   ├── SermonNotes (inline editor)
│   │   ├── SermonDiscussion (AI questions)
│   │   ├── SermonRelated
│   │   └── SermonAIPanel (summarize, study guide, quiz)
│   └── SermonNotesView (my notes CRUD)
├── ForumView (Enhanced)
│   ├── ForumCategoryList
│   ├── ForumThreadList
│   │   ├── ForumSortBar [Recent | Popular | Unanswered | Solved]
│   │   ├── ForumSearchBar
│   │   ├── ForumThreadCard (×N)
│   │   │   ├── ForumThreadHeader (title, author, badges)
│   │   │   ├── ForumThreadMeta (category, tags, time)
│   │   │   ├── ForumThreadPreview (content excerpt)
│   │   │   ├── ForumThreadStats (replies, views, votes)
│   │   │   └── ForumThreadBadges (pinned, solved)
│   │   └── ForumThreadSkeleton
│   ├── ForumThreadDetail
│   │   ├── ForumOriginalPost
│   │   ├── ForumReplyList
│   │   │   ├── ForumReplyCard (×N)
│   │   │   │   ├── ForumReplyHeader (author, badges, time)
│   │   │   │   ├── ForumReplyBody (content, scripture refs)
│   │   │   │   ├── ForumReplyActions (vote, solution, reply)
│   │   │   │   └── ForumAcceptedAnswer (if solution)
│   │   │   └── ForumReplyInput
│   │   └── ForumThreadAI (suggest answers, related threads)
│   └── ForumCreateThread
├── AnalyticsView (Enhanced — replaces PrayerAnalyticsView)
│   ├── AnalyticsOverview
│   │   ├── SpiritualHealthScore (gauge/ring)
│   │   ├── StreakCards (prayer, bible, devotion)
│   │   ├── WeeklySummary
│   │   └── AINextStep
│   ├── AnalyticsPrayer
│   │   ├── PrayerStatsGrid
│   │   ├── PrayerStreakChart
│   │   ├── PrayerTrendBars
│   │   ├── AnsweredPrayerRate
│   │   └── MoodCorrelation
│   ├── AnalyticsBible
│   │   ├── BibleReadingStats
│   │   ├── BooksCompleted (progress ring)
│   │   ├── ReadingStreak
│   │   └── PaceVsPlan
│   ├── AnalyticsCommunity
│   │   ├── CommunityImpactCards
│   │   ├── GroupsJoined
│   │   ├── EventsAttended
│   │   ├── VolunteerHours
│   │   └── ForumContributions
│   ├── AnalyticsJourney
│   │   ├── FaithJourneyTimeline
│   │   ├── MilestonesAchieved
│   │   ├── BadgesEarned
│   │   └── LevelProgress
│   ├── AnalyticsGoals
│   │   ├── GoalCards
│   │   ├── GoalProgress
│   │   └── GoalEditor
│   └── AnalyticsAI
│       ├── GrowthInsights
│       ├── SuggestedMentors
│       ├── SuggestedGroups
│       └── SuggestedPlans
├── ── Shared Community Components ──
├── CommunityAssistant ★ NEW (FAB + panel)
│   ├── AssistantFAB (floating button)
│   ├── AssistantPanel (slide-up modal)
│   │   ├── AssistantHeader
│   │   ├── AssistantQuickActions
│   │   ├── AssistantChatHistory
│   │   │   ├── AssistantMessage (×N)
│   │   │   └── UserMessage (×N)
│   │   ├── AssistantActionCards
│   │   └── AssistantInput (text + voice toggle)
│   └── AssistantContextCard (inline suggestion)
├── NotificationCenter ★ NEW
│   ├── NotificationBell (header icon + badge)
│   ├── NotificationDropdown / FullPage
│   │   ├── NotificationFilterBar
│   │   ├── NotificationCard (×N)
│   │   │   ├── NotificationIcon
│   │   │   ├── NotificationAvatar
│   │   │   ├── NotificationContent (title, body, time)
│   │   │   └── NotificationUnreadDot
│   │   └── NotificationEmpty
│   └── NotificationPreferences
├── GamificationBadge ★ NEW (header/sidebar)
│   ├── LevelIndicator (icon + level number)
│   ├── PointsDisplay (current points)
│   ├── StreakFlame (current streak)
│   └── BadgeShowcase (recent badges)
└── ContentReportModal ★ NEW
    ├── ReportReasonSelector
    ├── ReportDescription
    └── ReportSubmit
```

---

## New Components to Create

| Component | File | Lines (est.) | Priority |
|-----------|------|-------------|----------|
| `CommunityFeedView.jsx` | `src/components/CommunityFeedView.jsx` | 450 | P0 |
| `PrayerFeedView.jsx` | `src/components/PrayerFeedView.jsx` | 400 | P0 |
| `TestimonyView.jsx` | `src/components/TestimonyView.jsx` | 350 | P1 |
| `CommunityAssistant.jsx` | `src/components/CommunityAssistant.jsx` | 300 | P1 |
| `NotificationCenter.jsx` | `src/components/NotificationCenter.jsx` | 250 | P1 |
| `GamificationBadge.jsx` | `src/components/GamificationBadge.jsx` | 200 | P2 |
| `AnalyticsView.jsx` | `src/components/AnalyticsView.jsx` | 500 | P2 |
| `ContentReportModal.jsx` | `src/components/ContentReportModal.jsx` | 150 | P2 |
| `FeedCard.jsx` | `src/components/FeedCard.jsx` | 200 | P0 |
| `PrayerCard.jsx` | `src/components/PrayerCard.jsx` | 180 | P0 |
| `TestimonyCard.jsx` | `src/components/TestimonyCard.jsx` | 160 | P1 |

**Total new component code:** ~3,140 lines

---

## State Management Pattern

Each community component is self-contained (consistent with existing pattern):

```javascript
// Self-contained component pattern
function CommunityFeedView({ showToast, isPremium, setShowAuth }) {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [cursor, setCursor] = useState(null)
  const [hasMore, setHasMore] = useState(true)

  const token = () => localStorage.getItem('bf_token')
  const API = import.meta.env.VITE_API_URL || ''

  // Fetch feed
  const fetchFeed = useCallback(async (reset = false) => { ... }, [filter])

  // Create post
  const createPost = useCallback(async (data) => { ... }, [])

  // React to post
  const react = useCallback(async (feedId, reactionType) => { ... }, [])

  // Comment
  const comment = useCallback(async (feedId, body) => { ... }, [])

  useEffect(() => { fetchFeed(true) }, [filter])

  if (!isPremium) return <PremiumCard />

  return (
    <div className="view fade-in">
      {/* Filter bar */}
      {/* Feed cards */}
      {/* Compose FAB */}
      {/* Loading skeleton */}
    </div>
  )
}
```

---

## Shared Sub-Components

### FeedCard.jsx (Reusable across Feed, Groups, Forum)

```javascript
function FeedCard({ item, onReact, onComment, onShare, onDelete }) {
  return (
    <div className="community-card feed-card">
      <div className="feed-card-header">
        <img className="community-avatar" src={item.author.avatar} alt="" />
        <div className="feed-card-author-info">
          <span className="feed-card-name">{item.author.name}</span>
          <span className="feed-card-meta">{item.time_ago}</span>
        </div>
        <button className="feed-card-menu-btn" aria-label="More options">⋯</button>
      </div>
      {item.title && <h3 className="feed-card-title">{item.title}</h3>}
      <div className="feed-card-body">{item.body}</div>
      {item.ai_tags?.length > 0 && (
        <div className="feed-card-tags">
          {item.ai_tags.map(tag => (
            <span key={tag} className="community-badge">{tag}</span>
          ))}
        </div>
      )}
      <div className="feed-card-actions">
        {item.content_type === 'prayer_request' && (
          <button className={`community-action-btn ${item.user_has_prayed ? 'active' : ''}`}>
            🙏 I Prayed · {item.reactions?.prayed || 0}
          </button>
        )}
        <button className="community-action-btn">
          💬 · {item.comment_count || 0}
        </button>
        <button className="community-action-btn">📤 Share</button>
      </div>
    </div>
  )
}
```

### PrayerCard.jsx

```javascript
function PrayerCard({ prayer, onPray, onComment, onChain }) {
  return (
    <div className={`community-card prayer-card ${prayer.is_urgent ? 'urgent' : ''} ${prayer.is_answered ? 'answered' : ''}`}>
      <div className="prayer-card-header">
        <img className="community-avatar" src={prayer.is_anonymous ? null : prayer.author.avatar} alt="" />
        <div className="prayer-author-info">
          <span className="prayer-author-name">
            {prayer.is_anonymous ? 'Anonymous' : prayer.author.name}
          </span>
          <div className="prayer-badges">
            <span className={`community-badge badge-${prayer.category}`}>{prayer.category}</span>
            {prayer.is_urgent && <span className="community-badge badge-urgent">Urgent</span>}
            {prayer.is_answered && <span className="community-badge badge-answered">Answered</span>}
          </div>
        </div>
        <span className="prayer-time">{prayer.time_ago}</span>
      </div>
      <p className="prayer-content">{prayer.content}</p>
      {prayer.ai_scripture && (
        <div className="prayer-scripture">
          <span className="scripture-ref">{prayer.ai_scripture.ref}</span>
          <span className="scripture-text">{prayer.ai_scripture.text}</span>
        </div>
      )}
      {prayer.chain_count > 0 && (
        <div className="prayer-chain-indicator">
          <span className="chain-icon">🔗</span>
          <span>{prayer.chain_count} in prayer chain</span>
        </div>
      )}
      <div className="prayer-card-actions">
        <button className={`community-action-btn ${prayer.user_has_prayed ? 'active' : ''}`} onClick={onPray}>
          🙏 I Prayed · {prayer.pray_count}
        </button>
        <button className="community-action-btn" onClick={onComment}>
          💬 Comment
        </button>
        <button className="community-action-btn" onClick={onChain}>
          🔗 Chain · {prayer.chain_count}
        </button>
      </div>
    </div>
  )
}
```

---

## CSS Additions (append to App.css)

All new CSS follows existing patterns: `.view`, `.fade-in`, `.card`, `.btn-sm`, `.btn-primary`, `.empty-state`, `.loading-spinner`.

New CSS classes use the community design tokens and follow the naming convention established by existing community components (e.g., `.groups-nav-btn`, `.event-item`, `.forum-thread-item`).

See `COMMUNITY_DESIGN.md` Section 3 for full design token specification.
