---
marp: true
theme: uncover
class:
  - lead
  - invert
paginate: true
---

<!-- 
_class: lead invert
_paginate: false
-->

# **BelieversFlow**

A Christian task manager and spiritual growth tracker

✝

---

<!-- 
_class: invert
-->

## Agenda

1. **Problem Definition** — The spiritual-productivity gap
2. **Solution Quality** — What BelieversFlow delivers
3. **Technical Execution** — Architecture and stack
4. **User Experience** — Design and usability
5. **Business Viability** — Market and sustainability
6. **Presentation & Communication** — Status and road ahead

---

<!-- 
_class: invert
-->

# 1. Problem Definition

---

## The Spiritual-Productivity Gap

Existing productivity tools are **secular by design** — they optimize for output, not spiritual growth.

Christians toggle between:
- 📋 Task app (Todoist, TickTick)
- 📖 Bible app (YouVersion)
- 🙏 Prayer journal (Notes app)
- 📓 Diary (separate app)

**No single tool connects them.**

---

## Pain Points

| Challenge | Impact |
|---|---|
| No prayer discipline tool | Inconsistent quiet time |
| Bible reading disconnected from tasks | No holistic planning |
| Privacy concerns with cloud journals | Sensitive data at risk |
| Spiritual balance invisible | Unaware of time allocation |
| Too many apps | Fatigue and fragmentation |

---

## Target Audience

| Segment | Description |
|---|---|
| **Primary** | Practicing Christians, 16–55, smartphone users |
| **Secondary** | Small groups, youth groups, ministry teams |
| **Geography** | Global English-speaking (5 languages planned) |
| **Device** | Android (primary) + Web (secondary) |

---

<!-- 
_class: invert
-->

# 2. Solution Quality

---

## What BelieversFlow Delivers

A **single app** combining everything a Christian needs for daily spiritual growth:

> ✝ Tasks — 🙏 Prayer — 📖 Bible — 📓 Diary — 🤖 AI Faith Assistant — ⚙️ Customization

**All offline-first. All private. All free.**

---

## Feature Completeness

| Feature | Status |
|---|---|
| Task CRUD + categories + filters | ✅ |
| Prayer tracker with 365-day streak | ✅ |
| Full Bible reader (66 books, offline cache) | ✅ |
| Diary/journal with mood picker | ✅ |
| AI Faith Assistant (GROQ-powered) | ✅ |
| 5 color themes + custom colors | ✅ |
| Light/dark mode | ✅ |
| Font sizes + reading layouts | ✅ |
| Backup/restore + factory reset | ✅ |
| Undo support (6s window) | ✅ |

---

## Competitive Landscape

| Feature | **BelieversFlow** | Todoist | YouVersion | Notion |
|---|---|---|---|---|
| Tasks | ✅ | ✅ | ❌ | ✅ |
| Bible reading | ✅ | ❌ | ✅ | ❌ |
| Prayer tracking | ✅ | ❌ | ❌ | ❌ |
| Spiritual balance | ✅ | ❌ | ❌ | ❌ |
| Faith AI | ✅ | ❌ | ❌ | ❌ |
| Mood journal | ✅ | ❌ | ❌ | ✅ |
| Offline-first | ✅ | ❌ | Partial | ❌ |
| Custom themes | ✅ | ❌ | ❌ | ✅ |
| Free & open source | ✅ | ✅ | ✅ | ✅ |

---

<!-- 
_class: invert
-->

# 3. Technical Execution

---

## Architecture Overview

```
┌─────────────────────────────────────┐
│   React 19 SPA (single-file)         │
│   ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐ │
│   │Tasks│ │Prayr│ │Bible│ │Diary│ │
│   └─────┘ └─────┘ └─────┘ └─────┘ │
│   ┌──────────┐ ┌──────────────────┐ │
│   │Settings  │ │  Theme Engine    │ │
│   │(5 views) │ │  (data-attrs)    │ │
│   └──────────┘ └──────────────────┘ │
│   ┌──────────────────────────────┐  │
│   │   localStorage (offline)     │  │
│   └──────────────────────────────┘  │
└─────────────────────────────────────┘
         │              │
         ▼              ▼
   GROQ AI API    bible-api.com
   (llama-3.3)    (KJV free)
         │
         ▼
   Vercel Backend
   (Python FastAPI)
```

---

## Tech Stack

| Layer | Technology |
|---|---|
| **UI** | React 19, Vite 8, vanilla CSS |
| **Mobile** | Capacitor 8 (Android APK) |
| **Backend** | Python FastAPI (serverless) |
| **AI** | GROQ (mixtral-8x7b / llama-3.3-70b) |
| **Storage** | Browser localStorage |
| **CI/CD** | GitHub Actions → Vercel |

---

## Key Technical Decisions

1. **Single-file SPA** — Entire app in one React component. Simple, fast, easy to maintain.

2. **CSS data-attribute theming** — Theme overrides via `#app[data-theme="..."]` selectors. Avoids full CSS refactor while supporting 5 themes + light mode.

3. **localStorage as DB** — No backend database. Private, portable, persistent. Backup/restore JSON.

4. **Capacitor over React Native** — Web-first app; Capacitor wraps the existing Vite build with minimal overhead.

---

## Performance

| Metric | Value |
|---|---|
| JS bundle (gzipped) | 72 KB |
| CSS bundle (gzipped) | 8.5 KB |
| APK size | 3.75 MB |
| Bible cache lookup | <1ms |
| Offline features | All except AI chat |

---

<!-- 
_class: invert
-->

# 4. User Experience

---

## Design Philosophy

> **"Delightful simplicity with spiritual depth."**

- **Warmth** — Gold gradients, purple accents, emoji-rich UI
- **Focus** — One primary action per view
- **Encouragement** — Toast rewards, streak counters, progress bars

---

## User Flow

```
┌──────────────────────┐
│  Header: Verse + Stats│
├──────────────────────┤
│    Bottom Nav (5 tabs)│
│ 📋 ✨ 📓 📖 ⚙️      │
├──────────────────────┤
│  Content Area         │
│  (tasks / spiritual / │
│   diary / bible /     │
│   settings)           │
├──────────────────────┤
│  FAB: 💬 AI Chat     │
└──────────────────────┘
```

---

## UX Patterns

| Pattern | In BelieversFlow |
|---|---|
| **Feedback** | Toast on every action |
| **Error prevention** | Confirm before reset, disable when done |
| **Recovery** | 6-second undo for deletions |
| **Progressive disclosure** | Settings in 5 sub-sections |
| **Mobile-first** | Single column, sticky nav, bottom FAB |

---

## Theme Engine

| Option | Choices |
|---|---|
| **Color themes** | BelieversFlow, Royal, Emerald, Ocean, Sunset |
| **Custom colors** | Native color picker (primary, accent, background) |
| **Mode** | Dark, Light |
| **Font size** | Small (13px), Medium (15px), Large (17px) |
| **Reading layout** | Standard, Wide, Compact |

---

<!-- 
_class: invert
-->

# 5. Business Viability

---

## Market Opportunity

| Metric | Value |
|---|---|
| Christians worldwide | ~2.5 billion |
| Christian app market | ~$1.2B (2024 est.) |
| Top Bible app | 500M+ installs |
| Faith-productivity niche | **Underserved** |

---

## Revenue Model

**Phase 1 — Free & Open Source (current)**
- $0/month operating cost
- Build community and audience

**Phase 2 — Optional Premium (planned)**

| Tier | Price | Features |
|---|---|---|
| Free | $0 | Everything current |
| Supporter | $2.99/mo | Cloud sync, multi-device |
| Ministry | $9.99/mo | Groups, leader dashboard |

---

## Competitive Advantage

1. **Integrated** — No other free app combines tasks, prayer, Bible, diary, and AI
2. **Offline-first** — Most Christian apps require internet
3. **Privacy-first** — No accounts, no cloud, data stays on device
4. **Zero operating cost** — Runs on free tiers ($0/mo)
5. **Open source** — Community-driven development

---

## Risks

| Risk | Mitigation |
|---|---|
| YouVersion competition | Different focus (tasks + productivity) |
| GROQ rate limits | Backend proxy + caching |
| No cloud sync | Phase 2; backup/restore as workaround |
| Android only | iOS via Capacitor (needs macOS) |

---

<!-- 
_class: invert
-->

# 6. Presentation & Communication

---

## Current Status

| Channel | URL |
|---|---|
| **Web App** | https://believers-flow-frontend.vercel.app |
| **Android APK** | GitHub Releases (v2.0.1) |
| **GitHub** | github.com/ecoinboxhub/Christian_task_manager |
| **Backend API** | https://christian-task-manager.vercel.app |

---

## Roadmap

| Version | Focus | Status |
|---|---|---|
| v1.0 | Core MVP | ✅ Done |
| v2.0 | Settings, themes, AI, backup | ✅ Done |
| v2.1 | iOS build, cloud sync | 🔜 Planned |
| v2.2 | Small group features | 📅 Future |
| v3.0 | Church directory, events | 🌟 Vision |

---

## 36 Features — All Complete

| Category | Count |
|---|---|
| Task Management | 4 |
| Spiritual Growth | 5 |
| Bible Reading | 5 |
| Diary/Journal | 2 |
| AI Assistant | 3 |
| Settings & Themes | 8 |
| Data Management | 3 |
| Notifications & UI | 6 |

---

## Call to Action

### Try BelieversFlow Today

> ✝ **Free** • **Offline-first** • **Open source**

- 🌐 **Web:** https://believers-flow-frontend.vercel.app
- 📱 **APK:** GitHub Releases
- 💻 **Contribute:** github.com/ecoinboxhub/Christian_task_manager

---

<!-- 
_class: lead invert
_paginate: false
-->

# Thank You

✝

**BelieversFlow** — Built with faith, for believers.

> *"I can do all things through Christ who strengthens me."*
> — Philippians 4:13

---

<!-- 
_class: invert
_paginate: false
-->

## Appendix

- Full pitch document: `pitch/believersflow-pitch.md`
- Source code: `src/App.jsx` (1178 lines)
- Status: `status.md`
- Version: 3.1.0
- Generated: June 11, 2026 09:38
