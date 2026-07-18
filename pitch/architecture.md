# BelieversFlow — System Architecture

> Offline-first Christian productivity platform
> Version 4.1.0  ·  React 19  ·  FastAPI  ·  PostgreSQL  ·  Pinecone RAG  ·  Multi-LLM  ·  PWA  ·  Capacitor 8

---

## Visual Overview

```text
┌─────────────────────────────────────────────────────────────┐
│                        USER                                 │
│  	 Web Browser   ·  Android APK          		      │
└──────────────────────────┬──────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                    APP — React SPA                          │
│   Tasks  ·  Faith  ·  Diary  ·  Bible  ·  Hymns             │
│   		Devotional  ·  Settings                       │
│   7 views  ·  No router  ·  Works offline  		      │
│   Auth: Email + Google OAuth  ·  Freemium model            │
└──────────────────────────┬──────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                  DATA  +  APIS                              │
│                                                             │
│   ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│   │ Local Storage│  │   PostgreSQL │  │   Pinecone   │      │
│   │  		   │  │   (Aiven)    │  │   (RAG)      │      │
│   │  User data   │  │  User data   │  │ 54 Bible     │      │
│   │  No server DB│  │  Cloud sync  │  │  verses      │      │
│   └──────────────┘  └──────────────┘  └──────────────┘      │
│                                                             │
│   ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│   │   Bundled    │  │   External   │  │  Multi-LLM   │      │
│   │   Content    │  │    APIs      │  │  Providers   │      │
│   │ 1,001 Hymns  │  │   AI Model   │  │ GROQ/OpenAI  │      │
│   │ 365 Devos    │  │ bible-api    │  │ /OpenRouter   │      │
│   └──────────────┘  └──────────────┘  └──────────────┘      │
└──────────────────────────┬──────────────────────────────────┘
                           │
                           ▼
┌──────────────────────────┬──────────────────────────────────┐
│     FastAPI Backend      │         Deployment               │
│      Python ·  	   │  Vercel CDN · GitHub Actions     │
│      Auth, Sync, RAG     │  GitHub Releases (APK)           │
│      Multi-LLM, OAuth    │  Free tier · Auto-scaling        │
└──────────────────────────┴──────────────────────────────────┘
```

---

## Layer Breakdown

### 1. User Layer
Two entry points into the application:

| Entry | Details |
|-------|---------|
| **Web Browser / PWA** | React SPA served from Vercel. Installable as PWA (Chrome, Edge, Safari). Works fully offline. |
| **Android APK** | Native Android app via Capacitor 8 WebView. 3.75 MB. Signed release on GitHub. |

### 2. App Layer (Frontend)
Single-page React 19 application — no router library.

| Property | Value |
|----------|-------|
| **File** | `src/App.jsx` — 2,083 lines |
| **Views** | Tasks, Faith, Diary, Bible, Hymns, Devotional, Settings |
| **Components** | Auth.jsx (112 lines), PremiumGate.jsx |
| **Rendering** | All views conditional on `currentView` state variable |
| **State** | ~50 `useState` hooks, 20+ `useEffect` auto-sync hooks |
| **Styling** | `App.css` (1,900 lines) — CSS custom properties, data-attribute theming |
| **Accessibility** | ARIA labels, keyboard navigation, `focus-visible` outlines |
| **Error handling** | React ErrorBoundary wrapping entire app (Try Again + Reset Data) |
| **Offline** | 100% of core features work without internet |
| **Auth** | Email + Google OAuth with JWT tokens |
| **Premium** | Freemium model: free features (Tasks, Prayer, Diary, Bible, Hymns, Devotionals) vs premium features (AI Chat, Explanation, Commentary, Concordance, Cloud Sync) |

### 3. Data + APIs Layer

#### Local Storage (Red — User Data)
- **16 keys** under `btf_*` namespace
- Stores: tasks, prayer logs, diary entries, study plans, hymn favorites, settings, chat history, nav order
- **Auth tokens**: `bf_token`, `bf_user`
- Auto-synced via React `useEffect` hooks
- Bible text cached as `btf_bible_{version}_{book}_{chapter}`

#### PostgreSQL Database (Aiven)
- **Users table**: id, email, name, password_hash, plan (free/premium), created_at, updated_at
- **Sync data**: User data synced via push/pull endpoints
- **Connection**: asyncpg with SSL mode required
- **Host**: ibrahim5322022-d5ab.f.aivencloud.com:16448

#### Pinecone Vector Store
- **Index**: believersflow (1024-dim embeddings)
- **Namespace**: bible (54 Bible verses indexed)
- **Embeddings**: OpenAI text-embedding-3-small with dimensions=1024
- **Search**: RAG-based Bible verse search with relevance scoring

#### Bundled Content (Green — Static Data)
- **1,001 hymns** (408 KB) — loaded via dynamic `import()` when user visits Hymns view
- **365 devotionals** (315 KB) — loaded via dynamic `import()` when user visits Devotional view
- **54 hymn tunes** (10.5 KB) — local fallback audio data for offline playback
- Content is part of the JS bundle, **no network request needed**

#### External APIs (Orange — Online Features)
| API | Purpose | Strategy |
|-----|---------|----------|
| **GROQ** (llama-3.3-70b-versatile) | AI Chat, Explain, Commentary, Concordance, Compare | Proxied through backend. Calls only when user explicitly asks. |
| **OpenAI** (gpt-4o-mini) | AI Chat, embeddings for RAG | Proxied through backend. Per-request provider selection. |
| **OpenRouter** (meta-llama/llama-3.3-70b-instruct:free) | AI Chat fallback | Proxied through backend. Free tier access. |
| **Google OAuth** | User authentication | ID token verification on backend. |
| **bible-api.com** | KJV Bible text by chapter | CacheFirst via service worker (7-day TTL, 50 entries). |

### 4. Backend + Deploy Layer

#### FastAPI Backend (Python)
- **v4.1.0** — multi-file application (`backend/api/`)
- **Dependencies**: fastapi, httpx, pydantic, asyncpg, python-jose, passlib, bcrypt, pinecone
- **Endpoints**: health, auth (register/login/google), sync (push/pull), rag (search), llm (chat), legacy chat, bible study
- **Auth**: JWT tokens with 30-day expiry, Google OAuth ID token verification
- **Database**: PostgreSQL on Aiven with asyncpg
- **Vector Store**: Pinecone with 1024-dim embeddings
- **Multi-LLM**: GROQ, OpenAI, OpenRouter with per-request provider selection
- Runs **serverless** on Vercel Python runtime (60s max duration)

#### Deployment
| Service | Purpose | Cost |
|---------|---------|------|
| **Vercel** | Frontend CDN + Backend serverless | Free tier |
| **GitHub Actions** | CI/CD (auto-deploy on push to main) | Free |
| **GitHub Releases** | APK binary distribution | Free |
| **GROQ** | AI inference | Pay-per-token |

---

## Bundle Statistics

| Asset | Size | Gzipped |
|-------|------|---------|
| JS Bundle | 987 KB | 196 KB |
| CSS Bundle | 76 KB | 12.5 KB |
| Hymn Tunes (dynamic) | 10.5 KB | 1.15 KB |
| PWA Precache | 1.47 MB (16 entries) | — |
| APK | 3.75 MB | — |

---

## Data Flow

```text
User Action
    │
    ▼
React State Update (useState)
    │
    ├──► UI Re-render (instant)
    │
    └──► useEffect auto-sync
              │
              ▼
         localStorage (btf_* key)
              │
              ▼
         Persisted across sessions
```

```text
AI Request
    │
    ▼
Frontend → POST /api/chat
              │
              ▼
         FastAPI Backend
              │
              ▼
         GROQ (llama-3.3-70b)
              │
              ▼
         Response → Chat UI
              │
              ▼
         Saved to btf_chatHistory (localStorage)
```

---

## Security Model

| Concern | Approach |
|---------|----------|
| **Authentication** | None — no user accounts, no passwords, no sessions |
| **Data privacy** | All data in browser localStorage — never transmitted |
| **AI privacy** | Chat messages sent via HTTPS to backend proxy → GROQ |
| **Transport** | HTTPS at all layers (Vercel auto-TLS) |
| **Client security** | Pre-compiled bundles, no eval(), hashed filenames |
| **CORS** | Wildcard enabled for development |

---

## Key Design Decisions

1. **No router library** — All 7 views rendered conditionally in one file. Simpler, smaller bundle, faster.
2. **Offline-first localStorage** — All data persisted locally. Zero server cost. Privacy by design.
3. **Dynamic import for large data** — 408 KB hymns + 315 KB devotionals loaded only when needed.
4. **Two-tier AI** — Backend proxy when online, graceful degradation when offline.
5. **Web Audio API for hymns** — Synthesized organ sound via triangle wave + lowpass filter. No audio files needed.
6. **`base: './'`** — Required for Capacitor `file://` protocol compatibility.
7. **Monolithic build** — Avoids Rolldown code-splitting TDZ bugs found in Vite 8.
