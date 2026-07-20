# Project Structure

> BelieversFlow — Detailed documentation of the repository structure.

---

## Overview

BelieversFlow is a full-stack Christian utility platform with a monolithic React frontend, a Python FastAPI backend, and an Android wrapper via Capacitor. The repository follows a flat layout optimized for simplicity and Vite's default configuration.

---

## Root Directory

```
Christian_Todo/
├── .editorconfig              # Editor formatting standards
├── .env.example               # Frontend environment template
├── .gitattributes             # Git line ending & binary handling
├── .gitignore                 # Comprehensive ignore rules
├── .github/                   # CI/CD workflows & templates
├── LICENSE                    # MIT License
├── README.md                  # Project overview & quick start
├── CONTRIBUTING.md            # Contribution guidelines
├── CHANGELOG.md               # Version history
├── CONFIGURATION.md           # Complete configuration reference
├── DEVELOPMENT_GUIDE.md       # Development workflow guide
├── PROJECT_STRUCTURE.md       # This document
├── TESTING.md                 # Testing guide
├── SECURITY.md                # Security documentation
├── DEPLOYMENT.md              # Deployment instructions
├── INSTALLATION.md            # Setup instructions
├── architecture.md            # System architecture document
├── MOBILE.md                  # Android/Capacitor documentation
├── PWA.md                     # Progressive Web App guide
├── SCALABILITY.md             # Scalability assessment
├── RELEASE_GUIDE.md           # Release process
├── CODE_OF_CONDUCT.md         # Community conduct rules
├── docker-compose.yml         # Docker Compose (3 services)
├── Dockerfile.frontend        # Frontend Docker build
├── nginx.conf                 # Nginx reverse proxy config
├── index.html                 # Vite SPA entry point
├── package.json               # Node.js dependencies & scripts
├── package-lock.json          # Lockfile (auto-generated)
├── vite.config.js             # Vite + PWA build configuration
├── playwright.config.js       # Playwright E2E configuration
├── capacitor.config.json      # Capacitor mobile configuration
├── eslint.config.js           # ESLint flat configuration
├── lighthouserc.js            # Lighthouse CI configuration
├── manifest.webmanifest       # PWA web app manifest
└── believers-flow.jks         # Android signing keystore (gitignored)
```

---

## Frontend (`src/`)

The frontend is a React 19 single-page application built with Vite.

```
src/
├── main.jsx                   # React entrypoint (renders App)
├── App.jsx                    # Root component — all state lives here (1,442 lines)
├── App.css                    # Global styles
├── index.css                  # CSS reset & base styles
├── ErrorBoundary.jsx          # Top-level error boundary
├── Auth.jsx                   # Authentication (login/register/Google OAuth)
├── LegalScreen.jsx            # Legal consent screen (first-run)
├── PremiumGate.jsx            # Premium feature gate wrapper
├── constants.js               # Bible data, navigation config, themes (200+ KB)
├── apiClient.js               # HTTP client (JWT, retry, refresh, timeout)
├── syncService.js             # Cloud sync (push/pull/merge, 60s interval)
├── errorUtils.js              # Error configuration constants
├── dateUtils.js               # Timezone-aware date formatting
├── devotional.js              # Devotional data & logic
├── churchDevotionals.js       # Church devotional aggregator
├── hymns.js                   # Hymn data (1000+ entries)
├── hymnMusic.js               # Hymn audio/tune data
├── hymnFallbackTunes.js       # Fallback hymn tunes
├── gen_devos.js               # Devotional generation (frontend)
├── pushNotifications.js       # Web push notification setup
├── sw.js                      # Custom service worker (VitePWA injectManifest)
│
├── components/                # 28 React view components
│   ├── BibleView.jsx          # Bible reader with version selector
│   ├── ChatPanel.jsx          # AI Faith Assistant chat panel
│   ├── ChurchView.jsx         # Church directory
│   ├── CommunityAssistant.jsx # Community AI assistant
│   ├── CommunityFeedView.jsx  # Community feed (posts, reactions, comments)
│   ├── DevotionalView.jsx     # Daily devotional reader
│   ├── DiaryView.jsx          # Personal diary with mood tracking
│   ├── ErrorBoundary.jsx      # Per-view error boundary + InlineError
│   ├── EventsView.jsx         # Church events calendar
│   ├── ForumView.jsx          # Community discussion forum
│   ├── GamificationBadge.jsx  # Points, streaks, achievements
│   ├── GroupsView.jsx         # Community groups
│   ├── GuidePanel.jsx         # Help & guide panel
│   ├── HymnView.jsx           # Individual hymn display
│   ├── MusicView.jsx          # Music module (hymns, P&W, Spotify, etc.)
│   ├── NotesView.jsx          # Personal notes
│   ├── NotificationCenter.jsx # Notifications (bell + panel)
│   ├── Onboarding.jsx         # 4-step guided introduction
│   ├── PrayerAnalyticsView.jsx # Prayer analytics & insights
│   ├── PrayerFeedView.jsx     # Prayer chain feed
│   ├── SermonView.jsx         # Sermon archive
│   ├── SettingsView.jsx       # App settings & themes
│   ├── SpiritualView.jsx      # Faith & prayer tracker
│   ├── TasksView.jsx          # Task manager
│   ├── TestimonyView.jsx      # Testimonies
│   ├── VersionSelector.jsx    # Bible version dropdown
│   ├── ViewSwitcher.jsx       # Desktop preview mode
│   └── WelcomeScreen.jsx      # Welcome screen (first-run)
│
├── churchDevotionals/         # 23 church devotional data modules
│   ├── index.js               # Aggregator (exports all churches)
│   ├── believersloveworld.js  # Believers Loveworld
│   ├── billygraham.js         # Billy Graham
│   ├── cac.js                 # Christ Apostolic Church
│   ├── cdr.js                 # Christ Redeemer's Ministry
│   ├── dailymanna.js          # Daily Manna
│   ├── davidjeremiah.js       # David Jeremiah
│   ├── deeperlife.js          # Deeper Life Bible Church
│   ├── dunamis.js             # Dunamis Gospel Church
│   ├── fcs.js                 # Fountain of Life Church
│   ├── foodfortheday.js       # Food for the Day
│   ├── intouch.js             # In Touch (Charles Stanley)
│   ├── joelosteen.js          # Joel Osteen
│   ├── josephprince.js        # Joseph Prince
│   ├── joycemeyer.js          # Joyce Meyer
│   ├── kennethcopeland.js     # Kenneth Copeland
│   ├── lagoschurch.js         # Lagos Church
│   ├── mfm.js                 # Mountain of Fire
│   ├── odbtd.js               # Our Daily Bread (Traditional)
│   ├── ourdailybread.js       # Our Daily Bread
│   ├── rccg.js                # Redeemed Christian Church of God
│   ├── trem.js                # The Redeemed Evangelical Mission
│   ├── wcc.js                 = Winner's Chapel
│   └── winners.js             = Living Faith Church
│
└── __tests__/                 # Unit tests (83 tests)
    ├── appUtils.test.js       # App utility tests (27 tests)
    └── dateUtils.test.js      # Date utility tests (56 tests)
```

### Key Frontend Files

| File | Lines | Purpose |
|:-----|:------|:--------|
| `App.jsx` | 1,442 | Central state management, routing, view rendering |
| `constants.js` | 200+ KB | Bible data (104 translations), navigation, themes |
| `apiClient.js` | ~150 | HTTP client with JWT injection, auto-refresh, retry |
| `syncService.js` | ~200 | Cloud sync with push/pull/merge strategy |
| `components/CommunityFeedView.jsx` | 433 | Community feed with posts, reactions, comments |
| `components/PrayerFeedView.jsx` | 565 | Prayer chain with support tracking |
| `components/TestimonyView.jsx` | 475 | Testimony sharing and reactions |
| `components/DiaryView.jsx` | ~400 | Personal diary with mood tracking |
| `components/MusicView.jsx` | ~500 | Multi-section music module |
| `components/SettingsView.jsx` | ~600 | Comprehensive settings panel |

---

## Backend (`backend/`)

The backend is a Python FastAPI application with async PostgreSQL access.

```
backend/
├── .env                       # Environment secrets (gitignored)
├── .env.example               # Environment template
├── main.py                    # Entrypoint (legacy, use uvicorn)
├── vercel.json                # Vercel deployment config
├── requirements.txt           # Python dependencies
├── Dockerfile                 # Backend Docker build
├── entrypoint.sh              # Docker entrypoint
├── alembic.ini                # Alembic migration config
├── migrate.py                 # Database migration script
├── pytest.ini                 # Pytest configuration
├── README.md                  # Backend-specific documentation
│
├── api/                       # Core application modules (36 files)
│   ├── index.py               # FastAPI app & route registration
│   ├── auth.py                # JWT authentication & OAuth
│   ├── config.py              # Configuration management
│   ├── database.py            # PostgreSQL connection pool + schema
│   ├── middleware.py           # CORS, rate limiting, request logging
│   ├── sync.py                # Push/pull data synchronization
│   ├── bible_service.py       # Bible text retrieval
│   ├── llm_provider.py        # LLM integration (GROQ/OpenAI/OpenRouter)
│   ├── rag.py                 # RAG pipeline (Pinecone)
│   ├── redis_client.py        # Redis client wrapper
│   ├── email_service.py       # SMTP email service
│   ├── logging_config.py      # Structured logging setup
│   ├── community_api.py       # Community endpoints (18 routes)
│   ├── billing_api.py         # Payment/billing endpoints
│   ├── church_api.py          # Church feature endpoints
│   ├── devotional_api.py      # Devotional endpoints
│   ├── event_api.py           # Event management endpoints
│   ├── forum_api.py           # Forum endpoints
│   ├── group_api.py           # Group management endpoints
│   ├── hymn_api.py            # Hymn endpoints
│   ├── interlinear_api.py     # Interlinear Bible endpoints
│   ├── notification_api.py    # Push notification endpoints
│   ├── prayer_analytics_api.py # Prayer analytics endpoints
│   ├── sermon_api.py          # Sermon endpoints
│   ├── *_service.py           # Business logic for each feature
│   └── hymn_tunes.py          # Hymn tune data
│
├── tests/                     # Backend test suite
│   ├── conftest.py            # Pytest fixtures
│   ├── test_api.py            # API endpoint tests
│   └── test_hymn_service.py   # Hymn service tests
│
├── alembic/                   # Database migrations
│   ├── env.py                 # Alembic environment
│   ├── script.py.mako         # Migration template
│   └── versions/              # Migration scripts
│       ├── 001_initial.py     # Initial schema
│       ├── 002_features.py    # Feature tables
│       └── 003_forum.py       # Forum tables
│
└── bible_texts/               # Bible text storage (gitignored contents)
```

### Key Backend Files

| File | Purpose |
|:-----|:--------|
| `api/index.py` | FastAPI app, all route registrations (18+ routers) |
| `api/auth.py` | JWT creation, verification, refresh, Google OAuth |
| `api/database.py` | Connection pool, all CREATE TABLE statements |
| `api/middleware.py` | CORS middleware, rate limiting, request logging |
| `api/community_api.py` | 18 community endpoints (feed, prayers, testimonies, AI, gamification) |
| `api/llm_provider.py` | Multi-provider LLM integration |
| `api/sync.py` | Bidirectional data sync |

---

## Android (`android/`)

Capacitor-wrapped Android project with zero custom native code.

```
android/
├── build.gradle               # Root Gradle build
├── settings.gradle            # Project settings
├── variables.gradle           # SDK version management
├── capacitor.settings.gradle  # Capacitor plugin configuration
├── gradle.properties          # Gradle properties
├── gradlew / gradlew.bat      # Gradle wrapper scripts
├── gradle/wrapper/            # Gradle wrapper JAR
│
├── capacitor-cordova-android-plugins/  # Cordova plugin bridge
│
└── app/
    ├── build.gradle           # App-level build (signing, ProGuard, versions)
    ├── capacitor.build.gradle # Capacitor Gradle additions
    ├── proguard-rules.pro     # ProGuard obfuscation rules
    ├── signing.properties     # Signing config (gitignored)
    ├── believers-flow-release.jks  # Release keystore (gitignored)
    │
    └── src/main/
        ├── AndroidManifest.xml     # App manifest (INTERNET permission)
        ├── assets/
        │   ├── capacitor.config.json
        │   ├── capacitor.plugins.json
        │   └── public/             # Built web assets (from dist/)
        └── res/                    # Android resources
            ├── drawable/           # Splash screens, icons
            ├── mipmap-*/           # App launcher icons
            ├── values/             # Strings, colors, styles
            └── xml/                # Network security config
```

---

## Tests

### Unit Tests (`src/__tests__/`)

| File | Tests | Framework |
|:-----|:------|:----------|
| `appUtils.test.js` | 27 | Vitest |
| `dateUtils.test.js` | 56 | Vitest |

### E2E Tests (`e2e/`)

| File | Tests | Coverage |
|:-----|:------|:---------|
| `helpers.js` | — | Shared setup/navigation/mock functions |
| `smoke.spec.js` | 1 | Page load verification |
| `app.spec.js` | 37 | Core UI, Bible, navigation, themes |
| `community.spec.js` | 44 | Premium gating, Groups, Church, Events, Forum |
| `diary-encouragement.spec.js` | 20 | Mood selector, encouragement cards, CRUD |
| `visual-regression.spec.js` | 114 | Screenshot baselines (3 viewports × 3 themes) |
| `screenshots.spec.js` | 216 | Static screenshot capture for documentation |

---

## Documentation (`docs/`)

```
docs/
├── README.md                      # Documentation index
├── community/                     # Community feature documentation
│   ├── COMMUNITY_DESIGN.md        # Complete product design (800+ lines)
│   ├── COMMUNITY_SCHEMA.md        # Database schema (10 new tables)
│   ├── COMMUNITY_API.md           # API reference (80+ endpoints)
│   └── COMMUNITY_COMPONENTS.md    # Component architecture & patterns
└── legal/                         # Legal & compliance documents
    ├── Privacy-Policy.md          # GDPR/CCPA privacy policy
    ├── Terms-of-Service.md        # Terms of service
    ├── Terms-of-Use.md            # Terms of use
    ├── Cookie-Policy.md           # Cookie policy
    ├── Acceptable-Use-Policy.md   # Acceptable use policy
    ├── Community-Guidelines.md    # Community behavior guidelines
    ├── Content-Moderation-Policy.md # Content moderation rules
    ├── Data-Collection-Disclosure.md # Data collection disclosure
    ├── Data-Compliance.md         # Data compliance overview
    ├── Data-Retention-Policy.md   # Data retention rules
    ├── Incident-Response-Plan.md  # Security incident response
    ├── Security-Policy.md         # Security policy
    ├── Third-Party-Services.md    # Third-party service disclosure
    └── Compliance-Checklist.md    # Compliance verification checklist
```

---

## Scripts (`scripts/`)

| File | Language | Purpose |
|:-----|:---------|:--------|
| `generate-icons.cjs` | Node.js | Generate app icons from SVG |
| `generate_features_plan.py` | Python | Feature plan generator |
| `generate_tunes.py` | Python | Hymn tune data generator |
| `import_bible_texts.cjs` | Node.js | Bible text importer |

---

## CI/CD (`.github/workflows/`)

| File | Purpose |
|:-----|:--------|
| `ci-frontend.yml` | Frontend CI pipeline (5 jobs) |
| `deploy-backend.yml` | Backend deployment pipeline |

### Pipeline Stages

```
lint-and-unit → e2e → visual-regression → lighthouse → deploy
     ↓              ↓              ↓              ↓         ↓
  ESLint+Vitest  Playwright    Screenshot    Lighthouse  Vercel
  (Node 18+20)  (3 projects)  comparisons   audit only  deploy
```

---

## Configuration Files

| File | Purpose |
|:-----|:--------|
| `vite.config.js` | Vite build + PWA plugin configuration |
| `playwright.config.js` | Playwright test projects & settings |
| `capacitor.config.json` | Capacitor mobile app configuration |
| `eslint.config.js` | ESLint flat config with React plugins |
| `lighthouserc.js` | Lighthouse CI thresholds |
| `docker-compose.yml` | Docker Compose orchestration (3 services) |
| `Dockerfile.frontend` | Multi-stage frontend build |
| `nginx.conf` | Production reverse proxy config |
| `manifest.webmanifest` | PWA web app manifest |

---

## Static Assets (`public/`)

| Path | Purpose |
|:-----|:--------|
| `favicon.svg` | App favicon |
| `icon-192.png` | PWA standard icon |
| `icon-512.png` | PWA large/splash icon |
| `icons/` | Additional icon assets |

---

## Other Directories

| Directory | Purpose |
|:----------|:--------|
| `screenshots/` | App screenshots (desktop, mobile, tablet, auth, e2e) |
| `screens/` | Design screen mockups |
| `pitch/` | Investor pitch materials (PRD, architecture, market analysis) |
| `presentation_assets/` | Architecture diagrams, screenshots for presentations |
| `backup_old/` | Legacy Cordova backup (gitignored) |

---

*Last updated: July 2026 — BelieversFlow v4.1.0*
