# BelieversFlow Architecture Document

**Version:** 4.x  
**Last Updated:** July 2026  
**Status:** Current

---

## 1. System Overview

BelieversFlow is a full-stack Christian utility platform combining a React single-page application (PWA) with a Python FastAPI backend, PostgreSQL database, Redis caching, Pinecone vector database for RAG (Retrieval-Augmented Generation), and an Android wrapper via Capacitor.

### Core Components

| Component | Technology | Purpose |
|-----------|-----------|---------|
| Frontend | React SPA (Vite) | Client-side UI, served as PWA |
| Backend | Python FastAPI | REST API, authentication, AI integration |
| Database | PostgreSQL | Persistent data storage |
| Cache | Redis | Session management, rate limiting |
| Vector DB | Pinecone | RAG search for AI assistant |
| Mobile | Capacitor 8.4 | Android WebView wrapper |

---

## 2. Frontend Architecture

### 2.1 Entry Point

```
index.html
  └── src/main.jsx
        └── src/App.jsx (1442 lines)
```

### 2.2 Application Structure

The frontend follows a monolithic architecture centered on `App.jsx`, which manages all application state via React `useState` hooks and persists to `localStorage`.

#### Component Hierarchy

```
App.jsx
├── ErrorBoundary
├── Onboarding (first-run)
├── WelcomeScreen (first-run)
├── LegalScreen (legal acceptance)
├── Auth (authentication)
├── PremiumGate (premium features)
├── ViewSwitcher (desktop preview)
├── Sidebar (desktop/tablet navigation)
├── MobileDrawer (mobile navigation)
├── BottomNav (mobile)
├── ChatPanel (AI assistant)
├── GuidePanel (help)
├── BibleView → VersionSelector
├── DevotionalView
├── TasksView
├── SpiritualView
├── DiaryView
├── MusicView → HymnView
├── GroupsView
├── ChurchView
├── EventsView
├── SermonView
├── ForumView
├── NotesView
├── PrayerAnalyticsView
└── SettingsView
```

### 2.3 State Management

- **Primary State:** React `useState` hooks in `App.jsx`
- **Persistence:** `localStorage` with 14+ keys (all prefixed `btf_`)
- **No State Library:** Redux, Zustand, or Context API are not used
- **Data Flow:** User interaction → `setState` → `localStorage` write

#### localStorage Keys

| Key | Purpose |
|-----|---------|
| `btf_user` | Current user profile |
| `btf_token` | JWT authentication token |
| `btf_bible_version` | Selected Bible translation |
| `btf_bible_chapter` | Last read chapter |
| `btf_bible_verse` | Last read verse |
| `btf_dark_mode` | Theme preference |
| `btf_tasks` | User task list |
| `btf_notes` | Personal notes |
| `btf_diary` | Journal entries |
| `btf_prayer` | Prayer requests |
| `btf_groups` | Community groups |
| `btf_settings` | App preferences |
| `btf_onboarding` | Onboarding completion |
| `btf_premium` | Premium subscription status |

### 2.4 API Communication

- **HTTP Client:** Native `fetch` API (no axios)
- **Authentication:** Bearer token in Authorization header
- **Token Refresh:** Automatic on 401 responses
- **Sync Service:** `syncService.js` performs 60-second auto-sync to backend
- **RAG Search:** `/api/rag/search` endpoint for AI context retrieval

### 2.5 Code Splitting

Currently, only 2 views are lazy-loaded:
- `DevotionalView`
- `HymnView`

All other components are eagerly loaded in the bundle.

### 2.6 CSS Architecture

- **Total Size:** 3,254 lines
- **Methodology:** CSS custom properties (variables)
- **Themes:** 3 built-in themes (light, dark, system)
- **Responsiveness:** Full responsive design for mobile, tablet, desktop

### 2.7 Testing

| Type | Count | Framework |
|------|-------|-----------|
| Unit Tests | 83 | Vitest |
| E2E Tests (Playwright) | 105 | Playwright (desktop/tablet/mobile) |
| Visual Regression | 114 | Playwright toHaveScreenshot |
| Screenshot Tests | 216 | Playwright static capture |
| **Total** | **518** | — |

#### Shared Test Helpers (`e2e/helpers.js`)

All E2E spec files import shared setup functions to eliminate duplication:

- `setupSkipOverlays` — blocks external resources, skips onboarding/welcome/legal screens
- `waitForApp` — navigates to `/`, waits for `#app` with rendered children
- `setupPremiumUser` — injects premium user into localStorage
- `navigateToView` — navigates via sidebar (desktop) or hamburger drawer (mobile)
- `switchTheme` / `switchThemeMobile` — theme toggle helpers

#### Visual Regression

114 screenshot baselines across 3 viewports × 3 themes × 8 views + mobile extras. Configured with 5% pixel tolerance and 0.4 per-pixel color threshold.

---

## 3. Data Flow

```
User Interaction
      │
      ▼
setState (React)
      │
      ▼
localStorage Write (btf_* keys)
      │
      ▼
syncService.js (60s interval)
      │
      ▼
POST /api/sync (Bearer token)
      │
      ▼
FastAPI Backend
      │
      ├── PostgreSQL (persistent storage)
      ├── Redis (caching/sessions)
      └── Pinecone (vector search)
```

### 3.1 Authentication Flow

1. User enters credentials
2. `POST /api/auth/login` → receives JWT
3. Token stored in `btf_token`
4. All subsequent requests include `Authorization: Bearer <token>`
5. On 401, automatic token refresh attempted
6. On refresh failure, user redirected to login

---

## 4. Service Worker

### 4.1 Strategy

- **Approach:** `injectManifest` (custom `sw.js`)
- **Build:** Generated via Vite PWA plugin

### 4.2 Cache Strategies

| Resource | Strategy | Notes |
|----------|----------|-------|
| Images | Cache-first | Offline availability |
| Fonts | Cache-first | Offline availability |
| Bible API | Network-first | Fresh content priority |
| App Shell | SPA fallback | Offline support |

### 4.3 Push Notifications

- Uses Web Push API with VAPID keys
- Supports devotional reminders
- Configurable notification preferences

---

## 5. Backend Architecture (Reference)

> **Note:** Backend code resides in a separate repository/service. This section documents the API contract and architecture for frontend integration.

### 5.1 Technology Stack

- **Framework:** FastAPI (async)
- **Database:** PostgreSQL via asyncpg
- **Migrations:** Alembic
- **Auth:** JWT middleware
- **Cache:** Redis (rate limiting)
- **Vector DB:** Pinecone (RAG)

### 5.2 API Endpoints

The backend exposes 20+ REST endpoints covering:

- Authentication (login, register, refresh)
- Bible data retrieval
- Devotional content
- User tasks/notes/diary
- Community groups
- Prayer analytics
- AI chat with RAG context
- Premium subscription management

### 5.3 Rate Limiting

- Redis-backed rate limiter
- Falls back to disabled if Redis is unavailable
- Configurable limits per endpoint

---

## 6. Mobile Architecture

### 6.1 Capacitor Wrapper

- **Version:** Capacitor 8.4
- **Build Target:** Android
- **Approach:** Wraps Vite-built `dist/` directory
- **Native Code:** None (BridgeActivity only)
- **Permissions:** INTERNET only
- **WebView:** HTTPS scheme

### 6.2 Build Pipeline

```
Vite Build (dist/)
      │
      ▼
Capacitor Sync
      │
      ▼
Android Project (android/)
      │
      ▼
Gradle Build → APK
```

### 6.3 Signed APKs

| Variant | Purpose |
|---------|---------|
| Debug | Development/testing |
| Release (unsigned) | Distribution |
| Release (signed) | Production store |

---

## 7. Deployment Architecture

### 7.1 Docker

- `Dockerfile.frontend` for frontend build
- `docker-compose.yml` for full-stack local development
- `nginx.conf` for production reverse proxy

### 7.2 CI/CD

- GitHub Actions workflows:
  - `ci-frontend.yml` — 5-job pipeline:
    - `lint-and-unit` — ESLint + Vitest (Node 18+20 matrix)
    - `e2e` — Playwright across all 3 viewport projects, uploads report artifact
    - `visual-regression` — Screenshot baseline comparisons, uploads snapshots artifact
    - `lighthouse` — Performance audit (main branch only)
    - `deploy` — Vercel production deploy (requires all checks pass)
  - `deploy-backend.yml` — Backend deployment

### 7.3 Environment Variables

- `.env` — Local development
- `.env.example` — Template for configuration
- Sensitive keys excluded from version control

---

## 8. File Structure

```
Christian_Todo/
├── index.html                  # Vite entry point
├── src/
│   ├── main.jsx                # React bootstrap
│   ├── App.jsx                 # Root component (1442 lines)
│   ├── components/             # 21 view components
│   ├── services/               # syncService.js, API helpers
│   └── styles/                 # CSS design system (3254 lines)
├── public/
│   ├── favicon.svg
│   ├── icons/
│   └── manifest.webmanifest
├── e2e/                        # Playwright tests + shared helpers
│   ├── helpers.js              # Shared setup/navigation/mock functions
│   ├── smoke.spec.js           # Page load verification
│   ├── app.spec.js             # Core functionality (37 tests)
│   ├── community.spec.js       # Premium community features (44 tests)
│   ├── diary-encouragement.spec.js  # Diary mood feature (20 tests)
│   ├── visual-regression.spec.js    # Screenshot baselines (114 tests)
│   └── screenshots.spec.js     # Static screenshot capture (216 tests)
├── docs/                       # Legal/compliance docs
├── capacitor.config.json       # Mobile config
├── vite.config.js              # Build config
├── playwright.config.js        # Test config
├── eslint.config.js            # Linting config
├── lighthouserc.js             # Performance audit
├── docker-compose.yml          # Docker orchestration
├── Dockerfile.frontend         # Frontend container
└── nginx.conf                  # Reverse proxy config
```

---

## 9. Security Considerations

- JWT tokens stored in localStorage (not httpOnly)
- Bearer token authentication on all protected endpoints
- CORS configured for allowed origins
- Content Security Policy via service worker
- HTTPS enforced for mobile WebView
- Keystore management for Android signing

---

*This document describes the architecture as of BelieversFlow v4.x. Refer to `PRODUCTION_READINESS_AUDIT.md` and `FINAL_SECURITY_AUDIT.md` for additional operational context.*