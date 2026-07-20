# BelieversFlow — System Architecture

> Offline-first Christian productivity platform
> Version 3.1.0  ·  React 19  ·  FastAPI  ·  GROQ  ·  PWA  ·  Capacitor 8

---

## Visual Overview

```text
┌─────────────────────────────────────────────────────────────┐
│                        USER                                 │
│   Web Browser (PWA)  ·  Android APK (Capacitor 8)          │
└──────────────────────────┬──────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                    APP — React SPA                          │
│   Tasks  ·  Faith  ·  Diary  ·  Bible  ·  Hymns            │
│   Devotional  ·  Settings                                   │
│   1,932 lines  ·  7 views  ·  No router  ·  Works offline  │
└──────────────────────────┬──────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                  DATA  +  APIS                              │
│                                                             │
│   ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│   │ Local Storage │  │    Bundled   │  │  External    │     │
│   │  16 btf_* keys│  │   Content    │  │    APIs      │     │
│   │  User data    │  │ 1,001 Hymns  │  │ GROQ AI      │     │
│   │  No server DB │  │ 365 Devos    │  │ bible-api    │     │
│   └──────────────┘  └──────────────┘  └──────────────┘     │
└──────────────────────────┬──────────────────────────────────┘
                           │
                           ▼
┌──────────────────────────┬──────────────────────────────────┐
│     FastAPI Backend      │         Deployment               │
│      Python · 358 lines  │  Vercel CDN · GitHub Actions    │
│      Proxies GROQ        │  GitHub Releases (APK)          │
│      Serves hymn tunes   │  Free tier · Auto-scaling       │
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
| **File** | `src/App.jsx` — 1,932 lines |
| **Views** | Tasks, Faith, Diary, Bible, Hymns, Devotional, Settings |
| **Rendering** | All views conditional on `currentView` state variable |
| **State** | ~50 `useState` hooks, 20+ `useEffect` auto-sync hooks |
| **Styling** | `App.css` (96 KB) — CSS custom properties, data-attribute theming |
| **Accessibility** | ARIA labels, keyboard navigation, `focus-visible` outlines |
| **Error handling** | React ErrorBoundary wrapping entire app (Try Again + Reset Data) |
| **Offline** | 100% of core features work without internet |

### 3. Data + APIs Layer

#### Local Storage (Red — User Data)
- **16 keys** under `btf_*` namespace
- Stores: tasks, prayer logs, diary entries, study plans, hymn favorites, settings, chat history, nav order
- **No server-side database** — zero infrastructure cost
- Auto-synced via React `useEffect` hooks
- Bible text cached as `btf_bible_{version}_{book}_{chapter}`

#### Bundled Content (Green — Static Data)
- **1,001 hymns** (408 KB) — loaded via dynamic `import()` when user visits Hymns view
- **365 devotionals** (315 KB) — loaded via dynamic `import()` when user visits Devotional view
- **26 hymn tunes** (10.5 KB) — local fallback audio data for offline playback
- Content is part of the JS bundle, **no network request needed**

#### External APIs (Orange — Online Features)
| API | Purpose | Strategy |
|-----|---------|----------|
| **GROQ** (llama-3.3-70b) | AI Chat, Explain, Commentary, Concordance, Compare | Proxied through backend. Calls only when user explicitly asks. |
| **bible-api.com** | KJV Bible text by chapter | CacheFirst via service worker (7-day TTL, 50 entries). |

### 4. Backend + Deploy Layer

#### FastAPI Backend (Python)
- **358 lines** — single-file application (`backend/api/index.py`)
- **3 dependencies**: `fastapi`, `httpx`, `pydantic`
- **12 endpoints**: health, chat, bible (explain/commentary/concordance/compare), hymns (explain/tune), devotional
- Serves as **GROQ proxy** (AI key on server, not client)
- Runs **serverless** on Vercel Python runtime (30s max duration)

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
