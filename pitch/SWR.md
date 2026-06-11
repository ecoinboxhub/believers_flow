# Software Requirements Specification — BelieversFlow

**Document Type:** Software Requirements Specification (SRS)
**Version:** 3.1.0
**Status:** Final
**Last Updated:** June 11, 2026 09:38
**Prepared By:** Engineering Team

---

## Table of Contents

1. [Introduction](#1-introduction)
2. [System Architecture](#2-system-architecture)
3. [External Interface Requirements](#3-external-interface-requirements)
4. [Functional Requirements](#4-functional-requirements)
5. [Data Requirements](#5-data-requirements)
6. [Performance Requirements](#6-performance-requirements)
7. [Security Requirements](#7-security-requirements)
8. [Environmental Constraints](#8-environmental-constraints)
9. [Testing Requirements](#9-testing-requirements)
10. [Appendices](#10-appendices)

---

## 1. Introduction

### 1.1 Purpose

This Software Requirements Specification (SRS) defines the complete technical requirements for BelieversFlow, an offline-first Christian productivity application. It is intended for developers, testers, and maintainers of the system.

### 1.2 Scope

BelieversFlow is a single-page React application with the following subsystems:

| Subsystem | Description |
|---|---|
| **Task Manager** | CRUD operations, filtering, categorization, undo |
| **Prayer Tracker** | Daily logging, streak calculation, history |
| **Bible Reader** | 66-book navigation, chapter display, offline caching |
| **Diary/Journal** | CRUD with mood picker, undo |
| **AI Chat** | GROQ-powered conversational faith assistant |
| **Settings Engine** | Theming, display modes, backup/restore, profile |
| **Theme Engine** | Runtime CSS theme switching via data attributes |
| **Persistence Layer** | localStorage-based offline storage |
| **Hymn Book** | Searchable hymn library with lyrics, categories, favorites, numbering, and audio playback (26 hymns with Web Audio API) |
| **Daily Devotional** | Curated daily devotionals with customizable reading experience |
| **Hymn Music** | Web Audio API playback (triangle wave + lowpass filter), backend API + local fallback |
| **PWA** | Workbox service worker (16 precached assets, 1.47 MB), web manifest for installability |
| **Draggable Navigation** | HTML5 DnD + touch events for tab reordering with localStorage persistence |
| **Error Boundary** | React class component with "Try Again" and "Reset App Data" recovery |

### 1.3 Definitions, Acronyms, and Abbreviations

| Term | Definition |
|---|---|
| **SPA** | Single Page Application |
| **SRS** | Software Requirements Specification |
| **GROQ** | AI inference provider (API) |
| **localStorage** | Browser key-value storage API |
| **Capacitor** | Cross-platform mobile runtime (wraps web apps) |
| **FAB** | Floating Action Button |
| **Toast** | Temporary notification overlay |
| **CRUD** | Create, Read, Update, Delete |
| **OT/NT** | Old Testament / New Testament |

### 1.4 References

| Document | Location |
|---|---|
| PRD | `pitch/PRD.md` |
| Design Thinking | `pitch/Design_thinking.md` |
| User Personas | `pitch/user_persona.md` |
| Monetization | `pitch/monetization.md` |
| API Reference | `backend/api/index.py` |
| UI Styles | `src/App.css` |

---

## 2. System Architecture

### 2.1 High-Level Architecture

```
┌──────────────────────────────────────────────────────────────┐
│                   CLIENT LAYER (Browser / APK)                │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │              React 19 Application (SPA)               │   │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌────────┐ │   │
│  │  │ App.jsx  │ │ App.css  │ │index.css │ │vite.svg│ │   │
│  │  │(1800 ln) │ │(1450 ln) │ │  (46 ln) │ │(icons) │ │   │
│  │  └──────────┘ └──────────┘ └──────────┘ └────────┘ │   │
│  │                                                      │   │
│  │  ┌──────────────────────────────────────────────┐   │   │
│  │  │           State Management (useState)          │   │   │
│  │  │  tasks │ prayerLogs │ studyPlan │ diaryEntries │   │   │
│  │  │  bible │ chatHistory │ settings │ customColors │   │   │
│  │  │  recentReads │ undoStack │ ...view state      │   │   │
│  │  └──────────────────────────────────────────────┘   │   │
│  │                                                      │   │
│  │  ┌──────────────────────────────────────────────┐   │   │
│  │  │         Persistence (localStorage)             │   │   │
│  │  │  12 keys: btf_tasks, btf_prayerLogs, ...      │   │   │
│  │  └──────────────────────────────────────────────┘   │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │              Capacitor 8 Runtime (APK only)           │   │
│  │  ┌─────────────┐ ┌──────────────┐ ┌──────────────┐  │   │
│  │  │ WebView     │ │ Android      │ │ Native       │  │   │
│  │  │ (Chrome)    │ │ Permissions  │ │ Haptics      │  │   │
│  │  └─────────────┘ └──────────────┘ └──────────────┘  │   │
│  └──────────────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────────────┘
         │                        │
         ▼                        ▼
┌──────────────────┐   ┌──────────────────────┐
│  GROQ API        │   │  bible-api.com       │
│  api.groq.com    │   │  bible-api.com       │
│  /v1/chat/compl  │   │  /{book}+{chapter}   │
│  (mixtral/llama) │   │  (KJV, no key req)   │
└──────────────────┘   └──────────────────────┘
         │
         ▼
┌──────────────────────────────────────┐
│  BACKEND LAYER (Vercel Serverless)    │
│                                       │
│  ┌────────────────────────────────┐   │
│  │  Python FastAPI                │   │
│  │  /api/health  → {status: ok}  │   │
│  │  /api/chat    → {message: ...} │   │
│  │  Model: llama-3.3-70b-versatile│   │
│  │  Proxy: GROQ API key server-side│   │
│  └────────────────────────────────┘   │
└──────────────────────────────────────┘
```

### 2.2 Component Architecture (Single-File SPA)

The entire application lives in `App.jsx` as a single React component. State management is handled via React hooks:

| Hook | Purpose |
|---|---|
| `useState` | All application state (20+ state variables) |
| `useCallback` | Memoized event handlers (addTask, toggleTask, etc.) |
| `useEffect` | Side effects (localStorage sync, DOM attribute updates) |
| `useRef` | DOM references (chat input, chat scroll, toast timer) |

**View switching** is handled by a `currentView` state variable toggled via the bottom navigation bar. No router library is used.

### 2.3 Build Pipeline

```
Source (JSX + CSS)
    │
    ▼
Vite 8.0 Bundler
    │
    ├──→ Development: `npm run dev` → localhost:5173 (HMR)
    │
    └──→ Production: `npm run build`
              │
              ├──→ dist/index.html
              ├──→ dist/assets/*.js (234 KB gzipped: 72 KB)
              ├──→ dist/assets/*.css (50 KB gzipped: 8.5 KB)
              │
              ├──→ Vercel Deploy (web frontend)
              │         │
              │         └──→ https://believers-flow-frontend.vercel.app
              │
              └──→ npx cap sync android
                        │
                        └──→ .\gradlew assembleRelease
                                  │
                                  └──→ app-release.apk (3.75 MB)
                                            │
                                            └──→ GitHub Release
```

---

## 3. External Interface Requirements

### 3.1 User Interfaces

#### 3.1.1 Navigation System

| Component | Requirement |
|---|---|
| Bottom nav bar | 5 tabs: Tasks, Spiritual, Diary, Bible, Settings |
| Active tab highlight | Gold underline + gold text color |
| FAB buttons | AI Chat (💬) + Guide (❓), bottom-right position |
| Settings sub-nav | Horizontal scrollable: Appearance, Profile, Notifications, Backup, About |

#### 3.1.2 Responsive Breakpoints

| Breakpoint | Layout |
|---|---|
| <480px | Single column, full-width cards |
| 480-768px | Single column, max-width 480px centered |
| >768px | Single column, max-width 600px centered |

#### 3.1.3 Input Controls

| Control | Type | Validation |
|---|---|---|
| Task text | `<input type="text">` | Non-empty |
| Task time | `<input type="time">` | Optional |
| Task category | `<select>` | One of: spiritual, personal, service |
| Prayer minutes | `<input type="number">` | Integer >0 |
| Diary title | `<input type="text">` | Optional |
| Diary content | `<textarea>` | Non-empty |
| Bible book | `<select>` | From BIBLE_BOOKS array |
| Bible chapter | `<select>` | 1 to book's max chapters |
| Chat input | `<input type="text">` | Non-empty |
| Settings: name | `<input type="text">` | Optional |
| Settings: email | `<input type="email">` | Optional |
| Settings: language | `<select>` | 5 language options |
| Settings: colors | `<input type="color">` | Hex color |
| Hymn search | `<input type="text">` | Match hymn title, lyrics, or category |
| Devotional date | `<input type="date">` | Valid date in range |
| Devotional font size | `<select>` | Small, medium, large |

### 3.2 Hardware Interfaces

| Interface | Requirement |
|---|---|
| Vibration API | `navigator.vibrate()` for task add (10ms), complete (20ms), prayer log (15ms) |
| Touch events | All interactions are touch-based |
| Screen orientation | Portrait preferred, no lock enforced |

### 3.3 Software Interfaces

#### 3.3.1 GROQ API (Direct Mode)

```
POST https://api.groq.com/openai/v1/chat/completions
Authorization: Bearer ${GROQ_API_KEY}
Content-Type: application/json

Request:
{
  "model": "mixtral-8x7b-32768",
  "messages": [
    {"role": "system", "content": "You are a compassionate Christian mentor..."},
    {"role": "user", "content": "..."}
  ]
}

Response:
{
  "choices": [{"message": {"content": "..."}}]
}
```

#### 3.3.2 Backend API (Proxy Mode)

```
POST ${API_URL}/api/chat
Content-Type: application/json

Request:
{
  "messages": [{"role": "user", "content": "..."}],
  "taskContext": "The user's tasks are: ..."
}

Response:
{
  "message": "AI response text"
}
```

#### 3.3.3 Bible API

```
GET https://bible-api.com/{book}+{chapter}

Response:
{
  "reference": "Genesis 1",
  "verses": [
    {"verse": 1, "text": "In the beginning God created..."}
  ]
}
```

#### 3.3.4 localStorage API

| Method | Usage |
|---|---|
| `localStorage.getItem(key)` | Read persisted data |
| `localStorage.setItem(key, value)` | Write persisted data |
| `localStorage.removeItem(key)` | Clear specific key |
| `localStorage.clear()` | Factory reset |

### 3.4 Communication Interfaces

| Protocol | Usage | Port |
|---|---|---|
| HTTPS | All API communication | 443 |
| HTTP | Dev server only | 5173 (Vite default) |
| WebSocket | Not used | — |

---

## 4. Functional Requirements

### 4.1 Task Management Module

| FR-ID | Requirement | Input | Output | Error Handling |
|---|---|---|---|---|
| FR-01 | Create task | text, time(opt), category | Task added to state + localStorage, toast shown | No-op if empty text |
| FR-02 | Toggle completion | task id | Task.completed flipped, toast + vibration | No-op if invalid id |
| FR-03 | Delete task | task id | Task removed, undo action created (6s) | No-op if invalid id |
| FR-04 | Filter tasks | filter type ('all'/'active'/'completed') | Filtered task list rendered | Default to 'all' |
| FR-05 | Undo delete | undo id | Task restored, undo entry removed | No-op if expired |

### 4.2 Prayer Tracker Module

| FR-ID | Requirement | Input | Output | Error Handling |
|---|---|---|---|---|
| FR-06 | Log prayer | minutes (int >0) | Entry added to prayerLogs, toast | Reject if already logged today |
| FR-07 | Calculate streak | prayerLogs array | Integer (0-365) | Return 0 for empty array |
| FR-08 | Display history | — | Last 5 entries rendered | Show "No logs yet" for empty |

### 4.3 Bible Reader Module

| FR-ID | Requirement | Input | Output | Error Handling |
|---|---|---|---|---|
| FR-09 | Select book + chapter | bookId, chapterNum | Fetch chapter from API or cache | Loading spinner, error message |
| FR-10 | Cache chapter | bookId + chapterNum | Save API response to localStorage | Silent failure (fetch next time) |
| FR-11 | Navigate chapters | direction (+1/-1) | Update bibleChapter state | Clamp to valid range |
| FR-12 | Track recent reads | book, chapter, ref | Add to recentReads (max 15) | Deduplicate by book+chapter |

### 4.4 Diary Module

| FR-ID | Requirement | Input | Output | Error Handling |
|---|---|---|---|---|
| FR-13 | Create entry | title(opt), content, mood | Entry added to diaryEntries, toast | No-op if empty content |
| FR-14 | Edit entry | id, title, content, mood | Entry updated in state, toast | No-op if invalid id |
| FR-15 | Delete entry | id | Entry removed, undo action created | No-op if invalid id |
| FR-16 | Undo delete | undo id | Entry restored | No-op if expired |

### 4.5 AI Chat Module

| FR-ID | Requirement | Input | Output | Error Handling |
|---|---|---|---|---|
| FR-17 | Send message | message text | Add user message + AI reply to chatHistory | Show error message on API failure |
| FR-18 | Include context | last 6 messages + task list | Included in API request | Truncate to 6 messages |
| FR-19 | Show typing indicator | loading state | Animated dots during API call | Auto-hide on response or error |
| FR-20 | Persist history | chatHistory array | Save to localStorage on every change | Silent failure |

### 4.6 Settings Module

| FR-ID | Requirement | Input | Output | Error Handling |
|---|---|---|---|---|
| FR-21 | Change theme | theme id | Update settings.theme, apply data-theme attr | Default to 'believersflow' |
| FR-22 | Toggle dark/light | mode string | Update settings.mode, apply data-mode attr | Default to 'dark' |
| FR-23 | Change font size | size id | Update settings.fontSize, apply CSS | Default to 'medium' |
| FR-24 | Change layout | layout id | Update settings.readingLayout, apply attr | Default to 'standard' |
| FR-25 | Update custom colors | key, hex value | Update customColors state, apply CSS vars | Validate hex format |
| FR-26 | Export backup | — | Generate + download JSON file | Show toast on completion |
| FR-27 | Import backup | JSON file | Parse + restore all data states | Show error for invalid file |
| FR-28 | Factory reset | confirmation | Clear localStorage, reset all state | Require confirm() dialog |

### 4.7 Theme Engine Module

| FR-ID | Requirement | CSS Mechanism |
|---|---|---|
| FR-41 | Apply data-theme attribute | `#app[data-theme="royal"] { ... }` selectors |
| FR-42 | Apply data-mode attribute | `#app[data-mode="light"] { ... }` selectors |
| FR-43 | Apply data-reading-layout | `#app[data-reading-layout="wide"] { ... }` selectors |
| FR-44 | Apply font size | `app.style.fontSize = FONT_SIZES[settings.fontSize]` |
| FR-45 | Apply custom colors | `app.style.setProperty('--custom-primary', value)` |

### 4.8 Hymn Book Module

| FR-ID | Requirement | Input | Output | Error Handling |
|---|---|---|---|---|
| FR-29 | Search hymns | search query | Filtered hymn list displayed | Show "No hymns found" for no matches |
| FR-30 | Select hymn | hymn id | Hymn lyrics displayed with category info | Show error for invalid hymn id |
| FR-31 | Filter by category | category string | Filtered hymn list displayed | Default to "All" category |
| FR-32 | Toggle favorite | hymn id | Toggle hymnFavorites state, update localStorage | No-op if invalid id |
| FR-33 | View hymn lyrics | hymn id | Full lyrics rendered with scrolling | Loading state while loading |
| FR-34 | Persist favorites | hymnFavorites array | Save to localStorage on every change | Silent failure |

### 4.9 Daily Devotional Module

| FR-ID | Requirement | Input | Output | Error Handling |
|---|---|---|---|---|
| FR-35 | Load today's devotional | date string | Devotional content displayed | Show "No devotional for this date" |
| FR-36 | Navigate devotional days | offset (+1/-1) | Update devotionalDay, show content | Clamp to valid date range |
| FR-37 | Adjust devotional font size | size id | Update devotionalFontSize, re-render text | Default to "medium" |
| FR-38 | Mark devotional as read | — | Update devotionalDay state, persist | No-op if already marked |
| FR-39 | Show reading progress | devotionalDay array | Progress indicator rendered | Show 0/0 for no data |
| FR-40 | Persist reading progress | devotionalDay array | Save to localStorage on every change | Silent failure |

---

## 5. Data Requirements

### 5.1 Data Schema

#### 5.1.1 Task Object

```typescript
interface Task {
  id: number;           // Date.now() timestamp
  text: string;         // Task description
  time: string;         // HH:MM format or empty string
  category: 'spiritual' | 'personal' | 'service';
  completed: boolean;
  createdAt: string;    // ISO 8601 date string
}
```

**Storage Key:** `btf_tasks`
**Example:** `[{"id": 1719000000000, "text": "Read Psalm 23", "time": "08:00", "category": "spiritual", "completed": false, "createdAt": "2026-06-10T23:10:00Z"}]`

#### 5.1.2 Prayer Log Object

```typescript
interface PrayerLog {
  date: string;    // Locale date string (e.g., "6/9/2026")
  minutes: number; // Duration in minutes
}
```

**Storage Key:** `btf_prayerLogs`
**Constraint:** One entry per calendar day per device

#### 5.1.3 Diary Entry Object

```typescript
interface DiaryEntry {
  id: number;      // Date.now() timestamp
  title: string;   // Optional title
  content: string; // Journal text
  mood: string;    // Emoji character (😊🙂😐😢😭)
  date: string;    // ISO 8601 date string
}
```

**Storage Key:** `btf_diary`

#### 5.1.4 Settings Object

```typescript
interface Settings {
  theme: 'believersflow' | 'royal' | 'emerald' | 'ocean' | 'sunset' | 'custom';
  mode: 'dark' | 'light';
  fontSize: 'small' | 'medium' | 'large';
  readingLayout: 'standard' | 'wide' | 'compact';
  notifications: {
    prayerReminder: boolean;
    dailyVerse: boolean;
    taskReminders: boolean;
  };
  language: 'en' | 'es' | 'fr' | 'de' | 'pt';
  profileName: string;
  profileEmail: string;
  backupEnabled: boolean;
}
```

**Storage Key:** `btf_settings`

#### 5.1.5 Custom Colors Object

```typescript
interface CustomColors {
  primary: string;    // Hex color (e.g., "#3a7bd5")
  accent: string;    // Hex color
  background: string; // Hex color
}
```

**Storage Key:** `btf_customColors`

#### 5.1.6 Chat Message Object

```typescript
interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}
```

**Storage Key:** `btf_chat`

#### 5.1.7 Bible Cache

```typescript
interface BibleCache {
  reference: string;
  verses: Array<{ verse: number; text: string }>;
  // Stored under dynamic key: btf_bible_{book}_{chapter}
}
```

**Storage Key Pattern:** `btf_bible_Genesis_1`

#### 5.1.8 Hymn Favorites

```typescript
interface HymnFavorite {
  hymnId: number;    // Unique hymn identifier
  title: string;     // Hymn title
  category: string;  // Hymn category
}
```

**Storage Key:** `btf_hymnFavorites`

#### 5.1.9 Devotional Day

```typescript
interface DevotionalDay {
  date: string;     // ISO 8601 date string
  read: boolean;    // Whether devotional was read
}
```

**Storage Key:** `btf_devotionalDay`

### 5.2 Storage Budget

| Data | Estimated Max Size | Growth Rate |
|---|---|---|
| Tasks | 50 KB (500 tasks) | ~0.1 KB/day |
| Prayer logs | 20 KB (365 days) | ~0.05 KB/day |
| Diary entries | 100 KB (100 entries) | ~1 KB/entry |
| Chat history | 200 KB (1000 messages) | ~0.2 KB/msg |
| Bible cache | 500 KB (50 chapters) | ~10 KB/chapter |
| Settings | 1 KB | Static |
| **Total** | **~871 KB** | — |

localStorage limit is typically 5-10 MB per origin, so the app has a comfortable margin.

### 5.3 Data Flow Diagrams

#### Task Creation Flow

```
User types text + selects time/category
    → Click "Add" or press Enter
    → addTask() called
        → Validate non-empty
        → Create new Task object with Date.now() id
        → Prepend to tasks array (immutable update)
        → Toast: "Task added! ✨"
        → Vibration: navigator.vibrate(10)
        → useEffect fires → saveState('btf_tasks', tasks)
```

#### AI Chat Flow

```
User types message
    → Click "Send" or press Enter
    → sendChat() called
        → Validate non-empty, not loading
        → Add user message to chatHistory
        → Build API request (direct GROQ or backend proxy)
        → Set chatLoading = true
        → Fetch API
            → Success: Add assistant reply to chatHistory
            → Failure: Add error message to chatHistory
        → Set chatLoading = false
        → Auto-scroll to bottom
```

---

## 6. Performance Requirements

### 6.1 Timing Requirements

| Operation | Target | Measurement |
|---|---|---|
| App initial render | <500ms | Chrome DevTools Performance tab |
| Task add → state update | <50ms | console.time() |
| Bible chapter load (cached) | <100ms | Navigation Timing API |
| Bible chapter load (first fetch) | <5s | fetch() timing |
| AI chat response | <10s (typical) | fetch() timing |
| Theme switch | <16ms (1 frame) | requestAnimationFrame callback |
| Backup export | <100ms | JSON.stringify timing |

### 6.2 Resource Requirements

| Resource | Budget | Notes |
|---|---|---|
| CPU | Single core | Mobile devices, no heavy computation |
| Memory | <100 MB heap | React app with cached Bible data |
| Network | <100 KB per Bible chapter | bible-api.com response size |
| Storage | <5 MB total | localStorage quota |

### 6.3 Scalability

The app does not have a server-side data store (no user accounts). Each user's data is entirely client-side. The only server endpoints are:

| Endpoint | Scalability Limit | Mitigation |
|---|---|---|
| GROQ API | 10K requests/day (free tier) | Backend proxy, caching |
| bible-api.com | No documented limit | Chapter caching |
| Vercel backend | 100K requests/month (free tier) | Upgrade to Pro ($20/mo) |

---

## 7. Security Requirements

### 7.1 Authentication & Authorization

| Requirement | Implementation |
|---|---|
| No user accounts | All data is device-local |
| No passwords | Not applicable |
| No session management | Not applicable |
| No API keys in APK | GROQ key is server-side via backend proxy |

### 7.2 Data Security

| Requirement | Implementation |
|---|---|
| Data at rest | localStorage (browser sandbox) |
| Data in transit | HTTPS for all API calls |
| Data export | User-initiated JSON download |
| Data deletion | Factory reset (localStorage.clear()) |

### 7.3 API Security

| Requirement | Implementation |
|---|---|
| Backend CORS | `allow_origins=["*"]` (public API) |
| GROQ key storage | Server environment variable, not in APK |
| Rate limiting | Backend has no rate limiting (future work) |

### 7.4 Vulnerability Mitigation

| Threat | Mitigation |
|---|---|
| XSS | No user input rendered as HTML; all text is textContent |
| CSRF | No authenticated endpoints |
| localStorage injection | JSON.parse wrapped in try/catch |
| Reverse engineering APK | Code is open source; no secrets in APK |

---

## 8. Environmental Constraints

### 8.1 Development Environment

| Tool | Version |
|---|---|
| Node.js | 24.x |
| npm | 11.x |
| Vite | 8.0.x |
| React | 19.2.x |
| ESLint | 10.3.x |

### 8.2 Build Environment

| Tool | Version |
|---|---|
| JDK | 21 (Temurin) |
| Android SDK | API 24-36 |
| Gradle | 8.14.3 |
| Capacitor | 8.4.x |
| Android Studio | Latest (for native debugging) |

### 8.3 Deployment Environment

| Platform | Configuration |
|---|---|
| **Web hosting** | Vercel (Hobby tier) |
| **Backend hosting** | Vercel Serverless Functions |
| **APK distribution** | GitHub Releases |
| **Source control** | GitHub (public repo) |

### 8.4 Target Runtime

| Platform | Minimum | Recommended |
|---|---|---|
| Web browsers | Chrome 90+, Firefox 90+, Safari 15+, Edge 90+ | Latest versions |
| Android | API 24 (Android 7.0) | API 30+ (Android 11+) |
| Screen width | 320px | 360-414px |
| Internet | Optional (offline-first) | Required for AI chat + new Bible chapters |

---

## 9. Testing Requirements

### 9.1 Unit Testing

| Module | Test Cases | Priority |
|---|---|---|
| `getStreak()` | Empty logs, 1-day streak, broken streak, 365-day streak | High |
| `getGreeting()` | All 4 time windows, edge cases (exactly 5:00, 12:00, etc.) | Medium |
| `formatTime()` | Valid ISO, null/undefined, various timezones | Low |
| `formatDate()` | Valid ISO, null/undefined | Low |
| `loadState()` | Existing key, missing key, corrupted JSON | High |
| `saveState()` | Valid data, circular reference | Medium |

### 9.2 Integration Testing

| Test | Procedure |
|---|---|
| GROQ API integration | Send test message, verify response structure |
| Bible API integration | Fetch Genesis 1, verify verse array |
| Backend API integration | POST to /api/chat, verify {message} response |
| localStorage persistence | Add data, reload page, verify data persists |

### 9.3 End-to-End Testing

| Flow | Steps |
|---|---|
| Task lifecycle | Add → Filter → Complete → Delete → Undo |
| Prayer logging | Open spiritual view → Log minutes → Verify streak → Verify "Prayed today" badge |
| Bible reading | Select book → Select chapter → Verify verses render → Navigate prev/next |
| Diary CRUD | Create entry → Edit entry → Delete entry → Undo |
| Theme switching | Open settings → Change theme → Verify all views reflect change |
| Backup/restore | Export → Clear data → Import → Verify all data restored |

### 9.4 Manual Testing Checklist

| Category | Tests | Frequency |
|---|---|---|
| Functional | All user stories | Per build |
| Offline | Enable airplane mode, test all views | Per release |
| Cross-browser | Chrome, Firefox, Edge, Android WebView | Per release |
| Responsive | 320px, 375px, 414px, 768px widths | Per release |
| Performance | Lighthouse audit (target: >80 on mobile) | Per major version |
| Accessibility | Tab navigation, screen reader, contrast | Per major version |

---

## 10. Appendices

### 10.1 File Manifest

| File | Lines | Purpose |
|---|---|---|
| `src/App.jsx` | 1800 | Main application (all logic + views) |
| `src/App.css` | 1450 | All application styles |
| `src/hymns.js` | — | Hymn data (lyrics + metadata) |
| `src/devotional.js` | — | Devotional content data |
| `src/index.css` | 46 | Base reset + CSS variables |
| `src/main.jsx` | 8 | React entry point |
| `index.html` | 16 | HTML shell |
| `vite.config.js` | 10 | Build configuration |
| `capacitor.config.json` | 10 | Capacitor mobile config |
| `package.json` | 38 | Dependencies + scripts |
| `backend/api/index.py` | 45 | FastAPI server |
| `backend/main.py` | 13 | Local backend dev server |

### 10.2 localStorage Key Inventory

| Key | Type | Created | Cleared By |
|---|---|---|---|
| `btf_tasks` | Array | First task added | Factory reset / import |
| `btf_prayerLogs` | Array | First prayer logged | Factory reset / import |
| `btf_studyPlan` | Object | First study saved | Factory reset / import |
| `btf_diary` | Array | First diary entry | Factory reset / import |
| `btf_bibleVersion` | String | On version change | Factory reset / import |
| `btf_chat` | Array | First chat message | Factory reset / import |
| `btf_recentReads` | Array | First Bible read | Factory reset / import |
| `btf_settings` | Object | Settings change | Factory reset / import |
| `btf_customColors` | Object | Custom color set | Factory reset / import |
| `btf_verseIndex` | Number | App initialization | Factory reset |
| `btf_verseDate` | String | App initialization | Factory reset |
| `btf_bible_*` | Object | Bible chapter loaded | Factory reset |
| `btf_hymnFavorites` | Array | Hymn favorited | Factory reset / import |
| `btf_devotionalDay` | Array | Devotional read | Factory reset / import |

### 10.3 State Variable Inventory (App.jsx)

| Variable | Type | Initial Value | localStorage Key |
|---|---|---|---|
| `tasks` | Array | `[]` | `btf_tasks` |
| `prayerLogs` | Array | `[]` | `btf_prayerLogs` |
| `studyPlan` | Object | `{book: '', chapter: ''}` | `btf_studyPlan` |
| `diaryEntries` | Array | `[]` | `btf_diary` |
| `bibleVersion` | String | `'KJV'` | `btf_bibleVersion` |
| `chatHistory` | Array | `[]` | `btf_chat` |
| `recentReads` | Array | `[]` | `btf_recentReads` |
| `settings` | Object | `DEFAULT_SETTINGS` | `btf_settings` |
| `customColors` | Object | `DEFAULT_CUSTOM_COLORS` | `btf_customColors` |
| `currentView` | String | `'tasks'` | Not persisted |
| `currentFilter` | String | `'all'` | Not persisted |
| `chatOpen` | Boolean | `false` | Not persisted |
| `chatLoading` | Boolean | `false` | Not persisted |
| `undoStack` | Array | `[]` | Not persisted |
| `hymnSearch` | String | `''` | Not persisted |
| `selectedHymn` | Number | `null` | Not persisted |
| `hymnCategory` | String | `'All'` | Not persisted |
| `hymnFavorites` | Array | `[]` | `btf_hymnFavorites` |
| `todaysHymn` | Object | `null` | Not persisted |
| `devotionalDay` | Array | `[]` | `btf_devotionalDay` |
| `devotionalFontSize` | String | `'medium'` | Not persisted |

---

*End of Software Requirements Specification. For product and business context, see PRD.md, Design_thinking.md, user_persona.md, and monetization.md.*
