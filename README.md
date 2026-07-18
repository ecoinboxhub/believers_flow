<div align="center">

# BelieversFlow

### Christian Task Manager, Bible Reader, Hymn Book & Spiritual Growth Tracker

**Version 4.1.0** | **MIT License (2025)**

[![CI/CD](https://github.com/ecoinboxhub/believers_flow/actions/workflows/ci-frontend.yml/badge.svg)](https://github.com/ecoinboxhub/believers_flow/actions/workflows/ci-frontend.yml)
[![Vite](https://img.shields.io/badge/Vite-8.0.12-646CFF?logo=vite)](https://vitejs.dev)
[![React](https://img.shields.io/badge/React-19.2.6-61DAFB?logo=react)](https://react.dev)
[![Capacitor](https://img.shields.io/badge/Capacitor-8.4.0-119EFF?logo=ionic)](https://capacitorjs.com)
[![FastAPI](https://img.shields.io/badge/FastAPI-Backend-009688?logo=fastapi)](https://fastapi.tiangolo.com)
[![Tests](https://img.shields.io/badge/Tests-517+-4CAF50)](#testing)
[![License](https://img.shields.io/badge/License-MIT-blue)](LICENSE)

A comprehensive faith-driven productivity platform for Christian believers. Manage daily tasks rooted in scripture, read the Bible across 104 translations, sing from a collection of 1000+ hymns, and track your spiritual growth journey — all in one beautifully designed app.

[Web App](https://believersflow.vercel.app) · [Report Bug](https://github.com/ecoinboxhub/believers_flow/issues) · [Request Feature](https://github.com/ecoinboxhub/believers_flow/issues) · [Documentation](docs/)

</div>

---

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Quick Start](#quick-start)
- [Available Scripts](#available-scripts)
- [Testing](#testing)
- [Project Structure](#project-structure)
- [Architecture](#architecture)
- [Configuration](#configuration)
- [Deployment](#deployment)
- [Mobile Development](#mobile-development)
- [PWA](#progressive-web-app)
- [API Reference](#api-reference)
- [Contributing](#contributing)
- [Security](#security)
- [License](#license)

---

## Features

| Feature | Description |
|:--------|:------------|
| **Bible Reader** | 104 translations across 20+ languages, covering all 66 books with chapter-by-chapter navigation |
| **Daily Devotional** | 365 built-in devotionals plus 21 church pastors (RCCG, MFM, Deeper Life, and more) |
| **Task Management** | Full CRUD with categories (Spiritual, Personal, Service), filters, and undo support |
| **Faith & Prayer Tracker** | Prayer request logging, streak tracking, Bible study plan, and analytics |
| **Personal Diary** | 5 mood options with encouragement cards and uplifting Bible verses |
| **Music Module** | 1000+ hymns (Web Audio synthesis), Praise & Worship, Spotify, Boom, and YouTube integration |
| **AI Faith Assistant** | Scripture-based chat, suggestions, and RAG-powered Bible search |
| **Community** | Feed, prayer chains, testimonies, AI assistant, gamification, notifications (premium) |
| **Groups & Church** | Community groups, church directory, events, sermons, and discussion forum |
| **Settings & Themes** | 5 color themes, Dark/Light/Grey modes, adjustable font sizes, backup & restore |
| **Cloud Sync** | Push/pull/merge with 60-second auto-sync |
| **Push Notifications** | VAPID Web Push notifications |
| **Legal Compliance** | 14 legal documents covering GDPR, CCPA, NDPR, and more |
| **Onboarding** | 4-step guided intro with a personalized welcome screen |
| **PWA** | Installable progressive web app with custom service worker |

---

## Tech Stack

| Layer | Technology |
|:------|:-----------|
| **Frontend** | React 19.2.6, Vite 8.0.12, Pure CSS (3,254-line design system) |
| **Mobile** | Capacitor 8.4.0 (Android) |
| **Backend** | Python FastAPI, PostgreSQL (asyncpg), Redis, Pinecone (RAG) |
| **AI Providers** | GROQ, OpenAI, OpenRouter |
| **Unit Tests** | Vitest 4.1.9 (83 tests) |
| **E2E Tests** | Playwright 1.52.0 (171 E2E + 114 visual regression + 216 screenshot tests) |
| **Deployment** | Vercel, Docker, Docker Compose |
| **PWA** | vite-plugin-pwa 1.3.0, custom service worker |
| **CI/CD** | GitHub Actions (5-job pipeline) |

---

## Quick Start

### Prerequisites

- **Node.js** 18+ (20 recommended)
- **npm** 9+
- **Python** 3.12+
- **PostgreSQL** (for backend)
- **Pinecone** account (for RAG features)
- API keys for at least one LLM provider (GROQ, OpenAI, or OpenRouter)

### Web Application

```bash
# Clone the repository
git clone https://github.com/ecoinboxhub/believers_flow.git
cd Christian_Todo

# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Edit .env with your API keys

# Start development server
npm run dev
```

The app will be available at `http://localhost:5173`.

### Backend

```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # or venv\Scripts\activate on Windows

# Install dependencies
pip install -r requirements.txt

# Configure environment
cp .env.example .env
# Edit backend/.env with your settings

# Start the server
python -m uvicorn api.index:app --host 0.0.0.0 --port 8000 --reload
```

### Android (Mobile)

```bash
npm run build
npx cap sync android
cd android && ./gradlew assembleDebug
```

### Docker

```bash
docker-compose up -d
```

See [INSTALLATION.md](INSTALLATION.md) for detailed setup instructions.

---

## Available Scripts

| Command | Description |
|:--------|:------------|
| `npm run dev` | Start Vite development server with HMR |
| `npm run build` | Production build with optimizations |
| `npm run preview` | Preview the production build locally |
| `npm run lint` | Lint all source files with ESLint |
| `npm test` | Run unit tests (Vitest) |
| `npm run test:watch` | Run unit tests in watch mode |
| `npm run test:e2e` | Run end-to-end tests (Playwright) |
| `npm run test:e2e:ui` | Run E2E tests with Playwright UI mode |
| `npm run lighthouse` | Run Lighthouse performance audit |

See [DEVELOPMENT_GUIDE.md](DEVELOPMENT_GUIDE.md) for complete development workflow documentation.

---

## Testing

BelieversFlow maintains comprehensive test coverage across three tiers:

| Suite | Framework | Count | Command |
|:------|:----------|:------|:--------|
| Unit | Vitest 4.1.9 | 83 | `npm test` |
| E2E | Playwright 1.52.0 | 171 | `npm run test:e2e` |
| Visual Regression | Playwright | 114 | `npx playwright test e2e/visual-regression.spec.js` |
| Screenshots | Playwright | 216 | `npx playwright test e2e/screenshots.spec.js` |
| **Total** | — | **517+** | — |

### Quick Test Commands

```bash
# Run all unit tests
npm test

# Run all E2E tests
npm run test:e2e

# Run visual regression only
npx playwright test e2e/visual-regression.spec.js

# Run specific viewport
npx playwright test --project=desktop
npx playwright test --project=mobile

# Run with UI mode (interactive debugging)
npm run test:e2e:ui
```

See [TESTING.md](TESTING.md) for detailed testing documentation, patterns, and CI/CD integration.

---

## Project Structure

```
Christian_Todo/
├── src/                            # React frontend source
│   ├── main.jsx                    # App entrypoint
│   ├── App.jsx                     # Root component (1,442 lines)
│   ├── components/                 # 28 React view components
│   │   ├── BibleView.jsx           # Bible reader
│   │   ├── TasksView.jsx           # Task manager
│   │   ├── SpiritualView.jsx       # Faith & prayer tracker
│   │   ├── DiaryView.jsx           # Personal diary
│   │   ├── MusicView.jsx           # Hymns & worship
│   │   ├── DevotionalView.jsx      # Daily devotionals
│   │   ├── CommunityFeedView.jsx   # Community feed
│   │   ├── PrayerFeedView.jsx      # Prayer chains
│   │   ├── TestimonyView.jsx       # Testimonies
│   │   ├── CommunityAssistant.jsx  # AI faith assistant
│   │   ├── GamificationBadge.jsx   # Points & achievements
│   │   ├── NotificationCenter.jsx  # Notifications
│   │   ├── SettingsView.jsx        # App settings
│   │   ├── ErrorBoundary.jsx       # Error boundary
│   │   └── ... (14 more views)
│   ├── apiClient.js                # HTTP client with JWT, retry, refresh
│   ├── syncService.js              # Cloud sync (push/pull/merge)
│   ├── errorUtils.js               # Error handling utilities
│   ├── dateUtils.js                # Timezone utilities
│   ├── constants.js                # Bible data, navigation, themes
│   ├── churchDevotionals/          # 23 church devotional data modules
│   └── __tests__/                  # Unit tests (83 tests)
├── e2e/                            # Playwright E2E tests
│   ├── helpers.js                  # Shared test helpers
│   ├── app.spec.js                 # Core functionality tests
│   ├── community.spec.js           # Community feature tests
│   ├── diary-encouragement.spec.js # Diary encouragement tests
│   ├── visual-regression.spec.js   # Visual regression (114 baselines)
│   ├── screenshots.spec.js         # Static screenshot capture
│   └── smoke.spec.js               # Smoke tests
├── backend/                        # Python FastAPI backend
│   ├── api/                        # Core application modules
│   │   ├── index.py                # FastAPI entrypoint & route registration
│   │   ├── auth.py                 # JWT authentication
│   │   ├── config.py               # Configuration management
│   │   ├── database.py             # PostgreSQL connection pool
│   │   ├── middleware.py            # CORS, rate limiting
│   │   ├── community_api.py        # Community endpoints (18 routes)
│   │   ├── sync.py                 # Data sync logic
│   │   ├── llm_provider.py         # LLM integration (GROQ/OpenAI)
│   │   ├── rag.py                  # RAG pipeline
│   │   └── ... (27 more modules)
│   ├── tests/                      # Backend test suite
│   ├── alembic/                    # Database migrations
│   ├── requirements.txt            # Python dependencies
│   └── vercel.json                 # Vercel deployment config
├── android/                        # Capacitor Android project
│   ├── app/
│   │   ├── build.gradle            # App-level Gradle build
│   │   └── src/main/               # Android manifest, resources, assets
│   ├── build.gradle                # Root Gradle build
│   ├── variables.gradle            # SDK version management
│   └── gradle/                     # Gradle wrapper
├── public/                         # Static assets (icons, manifest, SVGs)
├── docs/                           # Documentation
│   ├── COMMUNITY_API.md            # Community API reference
│   ├── COMMUNITY_SCHEMA.md         # Community database schema
│   ├── COMMUNITY_DESIGN.md         # Community product design
│   ├── COMMUNITY_COMPONENTS.md     # Community component architecture
│   └── ... (legal, compliance, policy docs)
├── scripts/                        # Utility scripts
├── screenshots/                    # App screenshots
├── pitch/                          # Investor pitch materials
├── .github/workflows/              # CI/CD pipelines
│   ├── ci-frontend.yml             # Frontend CI (5-job pipeline)
│   └── deploy-backend.yml          # Backend deployment
├── index.html                      # Vite SPA entry point
├── package.json                    # Node.js dependencies
├── vite.config.js                  # Vite + PWA configuration
├── playwright.config.js            # Playwright E2E configuration
├── capacitor.config.json           # Capacitor mobile configuration
├── eslint.config.js                # ESLint flat configuration
├── lighthouserc.js                 # Lighthouse CI configuration
├── docker-compose.yml              # Docker Compose (3 services)
├── Dockerfile.frontend             # Frontend Docker build
└── nginx.conf                      # Nginx reverse proxy config
```

See [PROJECT_STRUCTURE.md](PROJECT_STRUCTURE.md) for detailed documentation of each directory and file.

---

## Architecture

BelieversFlow follows a **monolithic frontend architecture** with a decoupled backend:

- **App.jsx** (1,442 lines) serves as the single source of truth, managing all application state via `useState` and persisting to `localStorage`
- **28 view components** in `src/components/` handle individual feature screens
- **Pure CSS design system** (3,254 lines) provides a custom component library without external UI frameworks
- **Backend** is a Python FastAPI service with async PostgreSQL access, Redis caching, and Pinecone vector search for RAG

### Data Flow

```
User Interaction → React setState → localStorage (btf_* keys)
                                          ↓
                              syncService.js (60s interval)
                                          ↓
                              POST /api/sync (Bearer token)
                                          ↓
                              FastAPI Backend
                              ├── PostgreSQL (persistent storage)
                              ├── Redis (caching/sessions)
                              └── Pinecone (vector search)
```

### AI Integration

The AI Faith Assistant uses a multi-provider strategy:
- **GROQ** for fast inference
- **OpenAI** for embeddings and GPT
- **OpenRouter** as a fallback provider
- **Pinecone** for RAG-powered scripture search

See [architecture.md](architecture.md) for the complete architecture document.

---

## Configuration

### Environment Variables

#### Frontend

| Variable | Required | Description |
|:---------|:---------|:------------|
| `VITE_API_URL` | No | Backend API URL (empty = direct GROQ calls) |
| `VITE_GROQ_API_KEY` | No | GROQ API key for AI features |
| `VITE_GOOGLE_CLIENT_ID` | No | Google OAuth client ID |

#### Backend

| Variable | Required | Description |
|:---------|:---------|:------------|
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `JWT_SECRET_KEY` | Yes | JWT signing secret |
| `GROQ_API_KEY` | No | GROQ API key |
| `OPENAI_API_KEY` | No | OpenAI API key |
| `OPENROUTER_API_KEY` | No | OpenRouter API key |
| `PINECONE_API_KEY` | No | Pinecone API key (for RAG) |
| `REDIS_URL` | No | Redis URL (for rate limiting) |

See [CONFIGURATION.md](CONFIGURATION.md) for the complete configuration reference (all 40+ variables).

---

## Deployment

### Vercel (Recommended)

1. Connect the GitHub repository to Vercel
2. Configure environment variables in the Vercel dashboard
3. Deployments trigger automatically on push to `main`

### Docker Compose

```bash
docker-compose up -d --build
```

| Service | Port | Description |
|:--------|:-----|:------------|
| frontend | 3000 | Nginx serving React SPA |
| backend | 8000 | FastAPI server |
| redis | 6379 | Cache and rate limiting |

### CI/CD Pipeline

GitHub Actions runs the full pipeline on every PR and push:

```
Lint → Unit Tests → E2E Tests → Visual Regression → Lighthouse → Deploy
```

See [DEPLOYMENT.md](DEPLOYMENT.md) for complete deployment instructions.

---

## Mobile Development

BelieversFlow targets Android via Capacitor 8.4.0:

- **Zero custom native code** — uses `BridgeActivity` from Capacitor
- **Single permission:** `INTERNET` only
- **APK size:** ~1.75 MB (signed release)
- **ProGuard:** `minifyEnabled` + `shrinkResources`

```bash
npm run build && npx cap sync android
cd android && ./gradlew assembleDebug
```

See [MOBILE.md](MOBILE.md) for complete mobile development documentation.

---

## Progressive Web App

- **Service Worker:** Custom `injectManifest` strategy for fine-grained caching
- **Offline Support:** App shell and previously-read content available without network
- **Push Notifications:** VAPID-based push messaging
- **Installable:** Prompts install on supported browsers

See [PWA.md](PWA.md) for complete PWA documentation.

---

## API Reference

### Authentication

| Method | Endpoint | Description |
|:-------|:---------|:------------|
| `POST` | `/api/auth/register` | Register new user |
| `POST` | `/api/auth/login` | Login |
| `POST` | `/api/auth/google` | Google OAuth |
| `POST` | `/api/auth/forgot-password` | Request password reset |
| `POST` | `/api/auth/reset-password` | Reset password with token |
| `POST` | `/api/auth/change-password` | Change password |

### Bible

| Method | Endpoint | Description |
|:-------|:---------|:------------|
| `GET` | `/api/bible` | Get Bible chapter |
| `GET` | `/api/bible/versions` | List Bible versions |
| `POST` | `/api/bible/explain` | Explain a verse |
| `POST` | `/api/bible/commentary` | Get chapter commentary |

### AI & RAG

| Method | Endpoint | Description |
|:-------|:---------|:------------|
| `POST` | `/api/chat` | Chat with AI assistant |
| `POST` | `/api/rag/search` | Search Bible with RAG |
| `POST` | `/api/rag/ingest` | Ingest content into RAG |

### Community (18 endpoints)

| Method | Endpoint | Description |
|:-------|:---------|:------------|
| `GET` | `/api/community/feed` | Community feed |
| `POST` | `/api/community/feed` | Create post |
| `GET` | `/api/community/prayers` | Prayer chain |
| `POST` | `/api/community/prayers` | Submit prayer |
| `GET` | `/api/community/testimonies` | Testimonies |
| `POST` | `/api/community/testimonies` | Share testimony |
| `POST` | `/api/community/ai/chat` | Community AI chat |
| `GET` | `/api/community/gamification/me` | User gamification |
| `GET` | `/api/community/notifications` | Notifications |

### Sync

| Method | Endpoint | Description |
|:-------|:---------|:------------|
| `GET` | `/api/sync/pull` | Pull user data |
| `POST` | `/api/sync/push` | Push user data |

See [docs/community/COMMUNITY_API.md](docs/community/COMMUNITY_API.md) for the complete API reference (80+ endpoints).

---

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for detailed contribution guidelines, code standards, and PR process.

### Quick Start

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Make changes and ensure tests pass: `npm test && npm run lint`
4. Commit with a descriptive message following [Conventional Commits](https://www.conventionalcommits.org/)
5. Push and create a Pull Request

---

## Security

See [SECURITY.md](SECURITY.md) for the complete security documentation, audit findings, and OWASP alignment.

### Quick Security Notes

- JWT tokens stored in `localStorage` (with React XSS mitigation)
- Bearer token authentication on all protected endpoints
- CORS configured for allowed origins
- Rate limiting via Redis (with in-memory fallback)
- HTTPS enforced for mobile WebView
- APK signing with ProGuard obfuscation

---

## License

This project is licensed under the **MIT License** — see the [LICENSE](LICENSE) file for details.

---

<div align="center">

**Built with faith for the believer's journey.**

[Back to top](#believersflow)

</div>
