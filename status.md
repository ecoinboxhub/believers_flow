# BelieversFlow (Christian_Todo v2) — Status

**Last Updated:** June 11, 2026 09:38 (PWA + Draggable Nav + Hymn Numbering — v3.1.0)

---

## Implementation Status

| Feature | Status | Notes |
|---|---|---|
| Task CRUD | ✅ Complete | Add, complete, delete with undo |
| Task Filtering (All/Active/Completed) | ✅ Complete | |
| Categories (Spiritual/Personal/Service) | ✅ Complete | |
| Time input per task | ✅ Complete | |
| Daily Bible Verse | ✅ Complete | 12 curated verses, tap to cycle |
| Prayer Tracker with Streak | ✅ Complete | Log minutes, streak counter |
| Bible Study Planner | ✅ Complete | Suggestions + manual plan, "Study This" navigates directly to Bible reader |
| Spiritual Balance Bar | ✅ Complete | Visual % chart |
| Full Bible Reader (66 books) | ✅ Complete | OT/NT, chapter nav, offline cache |
| Bible Version Selector | ✅ Complete | 12 versions: KJV, NKJV, NIV, ESV, NASB, NLT, CSB, AMP, ASV, RSV, GNB, WEB |
| AI Verse Explanation | ✅ Complete | Tap any verse for plain meaning, context, lessons, application |
| AI Bible Commentary | ✅ Complete | Verse-by-verse commentary with cross-references |
| Bible Concordance | ✅ Complete | Search any word or topic across Scripture |
| Bible Comparison Tool | ✅ Complete | Side-by-side translation comparison |
| Diary/Journal with Mood Picker | ✅ Complete | CRUD with undo |
| AI Faith Assistant (GROQ) | ✅ Complete | llama-3.3-70b-versatile, task-aware, draggable FAB |
| AI Guide Panel | ✅ Complete | Capabilities, privacy & data handling info |
| Settings & Customization | ✅ Complete | 5 color themes + custom color picker, light/dark mode, font sizes, reading layouts (standard/wide/compact) |
| Profile Management | ✅ Complete | Name, email, bio |
| Notification Preferences | ✅ Complete | Task reminders, verse of day, prayer reminders |
| Backup & Restore | ✅ Complete | Export/import JSON, factory reset |
| Offline-First (localStorage) | ✅ Complete | All data persists under `btf_*` keys |
| Undo Support (6s) | ✅ Complete | Tasks & diary entries |
| Recent Reads History | ✅ Complete | Bible reader |
| Toast Notifications | ✅ Complete | |
| **Hymn Book (1,001 hymns)** | ✅ **Complete** | Full lyrics with hymn ID numbering (`#N Title`); search, categories, favorites, daily suggested hymn |
| **Hymn Music (26 hymns)** | ✅ **Complete** | Web Audio API triangle wave + lowpass organ sound; play/stop, player bar; backend API + local fallback |
| **Daily Devotional (365 days)** | ✅ **Complete** | Full year of scripture, reflection, and prayer; font controls, progress tracker |
| **AI Hymn Explanation** | ✅ **Complete** | `/api/hymns/explain` endpoint for hymn background and meaning |
| **AI Devotional Generator** | ✅ **Complete** | `/api/devotional/generate` endpoint for custom devotionals |
| **PWA Service Worker** | ✅ **Complete** | Offline caching via workbox, web manifest, installable on Chrome/Edge/Safari |
| **Draggable Navigation Tabs** | ✅ **Complete** | Drag-and-drop reorder with localStorage persistence (HTML5 DnD + touch events) |
| **Hymn Numbering** | ✅ **Complete** | All hymns display `#N Title` format in lists, detail view, and daily card |
| **React Error Boundary** | ✅ **Complete** | Catches render crashes with "Try Again" and "Reset App Data" buttons |
| **Accessibility** | ✅ **Complete** | ARIA labels, keyboard navigation (Enter/Space), focus-visible outlines, 44px touch targets |
| **Code Splitting** | ✅ **Complete** | Data chunks (hymns 408 KB, devotional 315 KB, tunes 10.5 KB) split from main app (262 KB) |
| **Web Audio Gesture Fix** | ✅ **Complete** | AudioContext initialized on first play click (browser autoplay policy) |

---

## Web App (Frontend)

| Item | Status |
|---|---|
| Local dev (`npm run dev`) | ✅ Works on `http://localhost:5173` |
| Production build (`dist/`) | ✅ Built (main 262 KB + data chunks, CSS 75 KB) |
| **Published URL** | ✅ **Live** — https://believers-flow-frontend.vercel.app |
| Backend API (Vercel) | ✅ **Live** (v3.1.0) — https://christian-task-manager.vercel.app |

> Backend health: https://christian-task-manager.vercel.app/api/health → `{"status":"ok","version":"3.1.0","groq_configured":true}`

---

## Backend API

| Item | Status | URL |
|---|---|---|
| FastAPI server | ✅ Deployed on Vercel | https://christian-task-manager.vercel.app |
| Health endpoint | ✅ Working | `/api/health` |
| AI Chat endpoint | ✅ Working | `/api/chat` (POST) |
| AI Verse Explain endpoint | ✅ Working | `/api/bible/explain` (POST) |
| AI Commentary endpoint | ✅ Working | `/api/bible/commentary` (POST) |
| AI Concordance endpoint | ✅ Working | `/api/bible/concordance` (POST) |
| AI Compare endpoint | ✅ Working | `/api/bible/compare` (POST) |
| Bible Proxy endpoint | ✅ Working | `/api/bible` (GET) — proxies non-KJV via GROQ |
| Bible Versions endpoint | ✅ Working | `/api/bible/versions` (GET) |
| **AI Hymn Explanation** | ✅ **Working** | `/api/hymns/explain` (POST) |
| **AI Devotional Generator** | ✅ **Working** | `/api/devotional/generate` (POST) |
| **Hymn Tune API** | ✅ **Working** | `/api/hymns/tune/{id}` (GET) — 26 hymn melodies |
| GROQ API Key | ✅ Configured on server | |
| CORS Middleware | ✅ Allows `["*"]` | |

---

## APK / Mobile Build

| Item | Status |
|---|---|
| Signed Release APK | ✅ **Published** (v3.1.0 — PWA + Draggable Nav + Hymn Numbering) |
| APK Size | 3.89 MB (under 4 MB limit) |
| **Published APK link** | https://github.com/ecoinboxhub/Christian_task_manager/releases/download/v2.0.0/believersguidelite.apk |
| GitHub Release | https://github.com/ecoinboxhub/Christian_task_manager/releases/tag/v2.0.0 |

---

## Links

| Item | Link |
|---|---|
| GitHub Repository | https://github.com/ecoinboxhub/Christian_task_manager |
| GitHub Release v2.0.0 | https://github.com/ecoinboxhub/Christian_task_manager/releases/tag/v2.0.0 |
| Published APK | https://github.com/ecoinboxhub/Christian_task_manager/releases/download/v2.0.0/believersguidelite.apk |
| Backend API (Vercel) | https://christian-task-manager.vercel.app |
| Backend Health Check | https://christian-task-manager.vercel.app/api/health |
| Web Frontend | ✅ https://believers-flow-frontend.vercel.app |

---

## Environment & Stack

| Item | Value |
|---|---|
| Frontend | React 19 + Vite 8 + Capacitor 8 |
| Backend | Python FastAPI (Vercel serverless) v3.1.0 |
| AI Provider | GROQ (llama-3.3-70b-versatile) |
| APK Size | 3.89 MB |
| Storage | localStorage (offline-first, `btf_*` keys) |
| Data Files | hymns.js (1,001 hymns, 408 KB chunk), devotional.js (365 devotionals, 315 KB chunk) |
| Git Remote | `origin → https://github.com/ecoinboxhub/Christian_task_manager.git` |
| PWA | ✅ Workbox service worker, 16 precached entries (1.47 MB) |
| VERCEL_TOKEN | ✅ Saved as user env var |
| GH_TOKEN | ✅ Saved as user env var |

---

## Key Design Decisions

| Decision | Rationale |
|---|---|
| GROQ for non-KJV Bible text | Third-party Bible APIs returned 404; GROQ (llama-3.3-70b) generates any version on-demand; cached in localStorage |
| Data-attribute theming (`#app[data-theme]`) | CSS variables refactor too risky for 1600+ line CSS file |
| Single-file SPA (no router) | Simplicity, <10s time-to-interactive |
| Native drag events for nav tabs | HTML5 DnD + touch fallback; no library needed, persists order to localStorage |
| Plain-text AI system prompts | All prompts request plain English — no emojis, no markdown |
| GROQ API key server-side | Via Vercel backend proxy for security |
| Bundled hymns + devotional data | Pre-loaded JS chunks for instant offline access; split via rollupOptions.manualChunks |
| Static hymn tune import | Changed from dynamic to static import to eliminate play latency (10.5 KB chunk loaded eagerly) |
| AudioContext on user gesture | Created on first play button click to comply with browser autoplay policy |
| `base: './'` | Required for Capacitor APK to load assets from `file://` protocol |
| PWA service worker | workbox generateSW caches 16 assets; runtime cache for Bible API and backend API |

---

## Next Steps

1. **CI** — GitHub Actions for auto-build on push
2. **iOS build** — Capacitor supports iOS if built on macOS
3. **Hebrew Bible & Greek NT** — Add original language interlinear support
4. **Cloud sync** — Optional paid feature (Phase 2 monetization)
5. **Study notes** — Allow saving personal study notes per chapter
6. **Expand hymn tunes** — From 26 to 100+ with piano/pipe organ multi-octave tone
7. **PWA install prompt** — Guide users to install as standalone app
