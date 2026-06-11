# Product Requirements Document — BelieversFlow

**Version:** 3.1.0
**Status:** Live
**Last Updated:** June 11, 2026 09:38
**Author:** Product Team

---

## Document History

| Version | Date | Changes | Author |
|---|---|---|---|
| 1.0 | 2026-06-09 | Initial PRD | Product Team |
| 3.1.0 | 2026-06-10 23:10 | Hymns + Devotional, offline data, 7-tab nav, AI endpoints | Product Team |
| 3.1.0b | 2026-06-11 09:38 | PWA service worker, draggable nav tabs, hymn numbering, error boundary, accessibility, code splitting, study button navigates to Bible, audio gesture fix | Product Team |

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Problem Statement](#2-problem-statement)
3. [Product Vision & Objectives](#3-product-vision--objectives)
4. [Target Audience](#4-target-audience)
5. [User Stories](#5-user-stories)
6. [Functional Requirements](#6-functional-requirements)
7. [Non-Functional Requirements](#7-non-functional-requirements)
8. [Success Metrics](#8-success-metrics)
9. [Release Criteria](#9-release-criteria)
10. [Timeline & Roadmap](#10-timeline--roadmap)
11. [Appendices](#11-appendices)

---

## 1. Executive Summary

BelieversFlow is a **single-page, offline-first Christian productivity application** that unifies task management, prayer tracking, Bible reading, journaling, and AI-powered faith guidance into one seamless experience. Unlike generic productivity tools that ignore spiritual dimensions, BelieversFlow is purpose-built for Christians who want to integrate their faith into their daily planning.

The app is currently **live** on web (Vercel), **published** as an Android APK (GitHub Releases), and operates at **zero ongoing cost** using free-tier infrastructure. It delivers 40+ features across 7 main views with full customization.

---

## 2. Problem Statement

### 2.1 The Core Problem

Christians lack an integrated digital tool that serves both their productivity needs and spiritual growth. Existing solutions force users to juggle multiple disconnected apps:

- **Todoist / TickTick** — Task management (secular, no faith context)
- **YouVersion** — Bible reading (no task integration)
- **Notes app / physical journal** — Prayer journal (no structure or streak)
- **Notion / Google Docs** — Bible study notes (overkill, no mobile-first design)

### 2.2 Pain Points

| # | Pain Point | Impact |
|---|---|---|
| P1 | No unified view of daily tasks + spiritual activities | Context switching, missed prayers, irregular Bible reading |
| P2 | No prayer discipline tracking | Inconsistent quiet time, no motivation to build habit |
| P3 | Privacy concerns with cloud-based prayer journals | Users self-censor or avoid writing altogether |
| P4 | Spiritual vs. secular balance is invisible | Unaware of how time is allocated |
| P5 | Bible reading plans exist separately from daily task planning | Reading happens inconsistently |
| P6 | No AI guidance tailored to Christian context | Users turn to generic AI or don't have access |

### 2.3 Why Now

- Smartphone penetration among Christians is at an all-time high
- Post-pandemic interest in spiritual disciplines has increased
- Privacy-conscious users are seeking offline-first alternatives
- GROQ and similar AI providers have made faith-aware AI economically viable

---

## 3. Product Vision & Objectives

### 3.1 Vision Statement

> To be the most trusted digital companion for daily Christian living — combining productivity, scripture, prayer, and AI guidance in a private, offline-first experience.

### 3.2 Product Objectives

| Objective | Metric | Target |
|---|---|---|
| O1 | Daily active users (DAU) | 1,000 by Q4 2026 |
| O2 | User retention (7-day) | >40% |
| O3 | Prayer streak adherence | >50% of DAU log prayer weekly |
| O4 | App Store rating | >4.5 stars |
| O5 | GitHub stars | >100 by Q4 2026 |

### 3.3 Key Differentiators

| Differentiator | BelieversFlow | Competitors |
|---|---|---|
| Integrated faith + productivity | ✅ Tasks + prayer + Bible + diary | ❌ Separate apps |
| Offline-first architecture | ✅ All features work offline | ❌ Most require internet |
| Zero data collection | ✅ No accounts, no tracking | ❌ Ad-based or data-harvesting |
| Customizable | ✅ 5 themes, light/dark, fonts, layouts | ❌ Limited or premium-only |
| Free & open source | ✅ Full source on GitHub | ⚠️ Often freemium |

---

## 4. Target Audience

### 4.1 Primary Audience

Practicing Christians aged 16–55 who own a smartphone and want to integrate their faith into daily productivity.

### 4.2 Secondary Audiences

| Segment | Needs | Features Used |
|---|---|---|
| Church small groups | Shared prayer lists, group reading plans | Bible, prayer tracker, diary |
| Youth groups | Engaging faith tools for teens | Themes, AI chat, streak gamification |
| Ministry leaders | Sermon prep notes, study planning | Bible reader, diary, backup |
| Missionaries | Offline access in low-connectivity areas | All offline features |

### 4.3 Geographic Scope

- **Primary:** English-speaking markets (US, UK, Canada, Australia, Nigeria, Philippines)
- **Secondary:** Spanish, French, German, Portuguese (language selector implemented)
- **Future:** More languages via community contributions

---

## 5. User Stories

### 5.1 Task Management

| ID | User Story | Priority | Status |
|---|---|---|---|
| US-01 | As a user, I want to add tasks with a category and time so I can organize my day | P0 | ✅ |
| US-02 | As a user, I want to mark tasks complete with one tap so I can track progress | P0 | ✅ |
| US-03 | As a user, I want to filter tasks by All/Active/Completed so I can focus | P1 | ✅ |
| US-04 | As a user, I want to undo a task deletion so I can recover from mistakes | P1 | ✅ |
| US-05 | As a user, I want to see my completion percentage so I feel motivated | P1 | ✅ |

### 5.2 Spiritual Growth

| ID | User Story | Priority | Status |
|---|---|---|---|
| US-06 | As a user, I want to log my daily prayer time so I can build a habit | P0 | ✅ |
| US-07 | As a user, I want to see my prayer streak so I stay motivated | P1 | ✅ |
| US-08 | As a user, I want a daily prayer suggestion so I know what to pray | P2 | ✅ |
| US-09 | As a user, I want to see my spiritual vs. secular task balance | P2 | ✅ |

### 5.3 Bible Reading

| ID | User Story | Priority | Status |
|---|---|---|---|
| US-10 | As a user, I want to read any Bible chapter so I can study scripture | P0 | ✅ |
| US-11 | As a user, I want chapters cached offline so I can read without internet | P1 | ✅ |
| US-12 | As a user, I want quick access to recent reads so I can continue studying | P2 | ✅ |
| US-13 | As a user, I want reading suggestions so I don't have to decide what to read | P2 | ✅ |

### 5.4 Diary & Journal

| ID | User Story | Priority | Status |
|---|---|---|---|
| US-14 | As a user, I want to write diary entries with a mood so I can reflect | P0 | ✅ |
| US-15 | As a user, I want to edit or delete past entries so I can correct mistakes | P1 | ✅ |
| US-16 | As a user, I want undo for accidental deletions so I don't lose content | P1 | ✅ |

### 5.5 AI Faith Assistant

| ID | User Story | Priority | Status |
|---|---|---|---|
| US-17 | As a user, I want to ask faith-related questions and get Biblical answers | P0 | ✅ |
| US-18 | As a user, I want the AI to know my tasks so it can give relevant advice | P1 | ✅ |
| US-19 | As a user, I want chat history to persist so I can revisit past conversations | P2 | ✅ |

### 5.6 Settings & Customization

| ID | User Story | Priority | Status |
|---|---|---|---|
| US-20 | As a user, I want to choose a color theme that feels personal | P1 | ✅ |
| US-21 | As a user, I want light/dark mode so I can use the app comfortably | P1 | ✅ |
| US-22 | As a user, I want to adjust font size for readability | P2 | ✅ |
| US-23 | As a user, I want to back up my data so I don't lose it | P1 | ✅ |
| US-24 | As a user, I want to restore from backup when switching devices | P1 | ✅ |

### 5.7 Dashboard & Daily Start

| ID | User Story | Priority | Status |
|---|---|---|---|
| US-25 | As a user, I want a daily verse when I open the app | P0 | ✅ |
| US-26 | As a user, I want a greeting based on the time of day | P2 | ✅ |
| US-27 | As a user, I want to see my stats (tasks, streak, prayer) at a glance | P1 | ✅ |

### 5.8 Hymns

| ID | User Story | Priority | Status |
|---|---|---|---|
| US-28 | As a user, I want to browse/search 1,001 hymns by title or number so I can find my favourite hymn | P0 | ✅ |
| US-29 | As a user, I want a daily hymn suggestion so I discover new hymns each day | P1 | ✅ |
| US-30 | As a user, I want to favourite hymns so I can quickly access them later | P1 | ✅ |

### 5.9 Daily Devotional

| ID | User Story | Priority | Status |
|---|---|---|---|
| US-31 | As a user, I want to read a daily devotional with a Bible verse and reflection so I can grow spiritually | P0 | ✅ |
| US-32 | As a user, I want to navigate between devotional days so I can read ahead or catch up | P1 | ✅ |

---

## 6. Functional Requirements

### 6.1 Task Management Module

| FR-ID | Requirement | Verification |
|---|---|---|
| FR-01 | System shall allow creating a task with text, time (optional), and category | Manual test |
| FR-02 | System shall support 3 categories: Spiritual, Personal, Service | Visual inspection |
| FR-03 | System shall toggle task completion state on checkbox click | Manual test |
| FR-04 | System shall filter tasks by All, Active, Completed | Manual test |
| FR-05 | System shall delete tasks with a 6-second undo window | Manual test |
| FR-06 | System shall persist tasks across sessions via localStorage | Test with reload |

### 6.2 Prayer Tracker Module

| FR-ID | Requirement | Verification |
|---|---|---|
| FR-07 | System shall allow logging prayer minutes once per day | Manual test |
| FR-08 | System shall enforce one prayer log per calendar day | Manual test |
| FR-09 | System shall calculate a streak going back up to 365 days | Unit test |
| FR-10 | System shall display last 5 prayer logs | Visual inspection |

### 6.3 Bible Reader Module

| FR-ID | Requirement | Verification |
|---|---|---|
| FR-11 | System shall display all 66 books of the Bible | Visual inspection |
| FR-12 | System shall load chapter text from bible-api.com | Integration test |
| FR-13 | System shall cache chapters in localStorage after first load | Test with offline |
| FR-14 | System shall navigate between chapters with prev/next buttons | Manual test |
| FR-15 | System shall track last 15 unique reads | Test with sequential reads |

### 6.4 Diary Module

| FR-ID | Requirement | Verification |
|---|---|---|
| FR-16 | System shall support CRUD operations on diary entries | Manual test |
| FR-17 | System shall provide a mood picker with 5 options | Visual inspection |
| FR-18 | System shall delete entries with 6-second undo | Manual test |
| FR-19 | System shall display entries with date, time, mood, title, content | Visual inspection |

### 6.5 AI Chat Module

| FR-ID | Requirement | Verification |
|---|---|---|
| FR-20 | System shall send user messages to GROQ API (direct or via backend) | Integration test |
| FR-21 | System shall include last 6 chat messages as context | Manual test |
| FR-22 | System shall include task list as context in system prompt | Manual test |
| FR-23 | System shall display typing indicator during loading | Visual inspection |
| FR-24 | System shall provide 4 quick-start suggestion chips on welcome | Visual inspection |

### 6.6 Settings Module

| FR-ID | Requirement | Verification |
|---|---|---|
| FR-25 | System shall support 5 preset color themes | Manual test |
| FR-26 | System shall support custom colors via native color picker | Manual test |
| FR-27 | System shall toggle between dark and light mode | Manual test |
| FR-28 | System shall support 3 font sizes (13px, 15px, 17px) | Visual inspection |
| FR-29 | System shall support 3 reading layouts (Standard, Wide, Compact) | Visual inspection |
| FR-30 | System shall export all data as a downloadable JSON file | Manual test |
| FR-31 | System shall import data from a JSON file via file picker | Manual test |
| FR-32 | System shall factory reset with confirmation dialog | Manual test |

### 6.7 Hymns Module

| FR-ID | Requirement | Verification |
|---|---|---|
| FR-33 | System shall include a hymn book of 1,001 hymns with title, number, and lyrics | Content audit |
| FR-34 | System shall allow searching hymns by title or number | Manual test |
| FR-35 | System shall group hymns by category (e.g., Worship, Christmas, Morning) | Visual inspection |
| FR-36 | System shall allow favouriting hymns for quick access | Manual test |
| FR-37 | System shall display a daily hymn suggestion on the hymns page | Visual inspection |

### 6.8 Daily Devotional Module

| FR-ID | Requirement | Verification |
|---|---|---|
| FR-38 | System shall include 365 daily devotionals with Bible verse, reflection, and prayer | Content audit |
| FR-39 | System shall auto-select today's devotional based on calendar date | Manual test |
| FR-40 | System shall allow navigating to any day via prev/next or day picker | Manual test |
| FR-41 | System shall support font size adjustments for devotional reading | Visual inspection |
| FR-42 | System shall track which devotionals have been read | Test with sequential reads |

---

## 7. Non-Functional Requirements

### 7.1 Performance

| NFR-ID | Requirement | Target |
|---|---|---|
| NFR-01 | App shell initial load time | <3s on 4G |
| NFR-02 | Bible chapter load time (first fetch) | <5s |
| NFR-03 | Bible chapter load time (cached) | <100ms |
| NFR-04 | UI responsiveness (tap-to-action) | <100ms |
| NFR-05 | JS bundle size | <250 KB gzipped |
| NFR-06 | CSS bundle size | <60 KB gzipped |
| NFR-07 | APK size | <5 MB |

### 7.2 Offline Capability

| NFR-ID | Requirement | Target |
|---|---|---|
| NFR-08 | All user data (tasks, prayer, diary, settings) must work offline | 100% |
| NFR-09 | Previously loaded Bible chapters must be available offline | 100% |
| NFR-10 | Pre-bundled content (verses, prayers, suggestions) must work offline | 100% |
| NFR-11 | AI chat must show graceful error when offline | Message shown |

### 7.3 Security & Privacy

| NFR-ID | Requirement | Target |
|---|---|---|
| NFR-12 | No user data shall be sent to any server without explicit user action | Verified |
| NFR-13 | AI chat requests must be proxied through backend (not direct from APK) | Verified |
| NFR-14 | No analytics, tracking, or telemetry shall be embedded | Verified |
| NFR-15 | Factory reset shall clear all data from localStorage | Verified |

### 7.4 Compatibility

| NFR-ID | Requirement | Target |
|---|---|---|
| NFR-16 | Web: Latest 2 versions of Chrome, Firefox, Safari, Edge | Verified |
| NFR-17 | Android: API 24+ (Android 7.0+) | Verified |
| NFR-18 | Screen sizes: 320px to 1920px width | Verified |

### 7.5 Reliability

| NFR-ID | Requirement | Target |
|---|---|---|
| NFR-19 | Bible API failures must show user-friendly error | Verified |
| NFR-20 | GROQ API failures must not crash the app | Verified |
| NFR-21 | localStorage failures must not crash the app | Verified |

---

## 8. Success Metrics

### 8.1 Product Metrics

| Metric | Definition | Current | Goal (Q4 2026) |
|---|---|---|---|
| DAU | Daily Active Users | <100 | 1,000 |
| Retention (D7) | Users returning on day 7 | — | >40% |
| Retention (D30) | Users returning on day 30 | — | >20% |
| Prayer streak avg | Mean streak across active users | — | >5 days |
| Tasks created/user | Avg tasks per user per day | — | >3 |
| AI chats/user | Avg AI interactions per user per week | — | >2 |

### 8.2 Quality Metrics

| Metric | Target | Measurement |
|---|---|---|
| Crash-free rate | >99.5% | Manual testing |
| User rating | >4.5 stars | App store reviews |
| Feature completion | 100% of P0 + P1 | PRD audit |
| Bug turnaround | <7 days for P0 bugs | Issue tracker |

---

## 9. Release Criteria

### 9.1 Go/No-Go Checklist

| Criterion | Requirement | v3.1.0 Status |
|---|---|---|---|
| All P0 user stories implemented | 100% | ✅ Pass |
| All P1 user stories implemented | 100% | ✅ Pass |
| No open P0 bugs | 0 | ✅ Pass |
| Build succeeds | Clean build | ✅ Pass |
| APK signs correctly | Signed release APK | ✅ Pass |
| Web deploy succeeds | Vercel deploy | ✅ Pass |
| Offline mode verified | All offline features work | ✅ Pass |
| Theme engine verified | 5 themes + light mode + custom | ✅ Pass |
| Backup/restore verified | Export + import + reset | ✅ Pass |
| Hymns content verified | 1,001 hymns with categories | ✅ Pass |
| Devotional content verified | 365 daily devotionals | ✅ Pass |
| Daily hymn suggestion | Auto-selects daily hymn | ✅ Pass |
| Devotional auto-select | Picks today's entry by date | ✅ Pass |

### 9.2 Known Limitations (v3.1.0)

| Limitation | Impact | Planned Fix |
|---|---|---|
| No iOS build | iPhone users cannot install APK | v3.2 (requires macOS) |
| No cloud sync | Data tied to single device | v3.2 (optional) |
| ~~Bible API is KJV-only~~ | **Resolved** — 12 versions (KJV, NKJV, NIV, ESV, NASB, NLT, CSB, AMP, ASV, RSV, GNB, WEB) | ✅ Complete |
| No push notifications | Toggles exist but not functional | v3.2 |
| No native push notifications | Android needs FCM, iOS needs APNs | v3.3 |
| Hymns audio not included | Users cannot play/ sing along to melodies | Future release |
| Devotional content is static | No community comments or sharing | Future release |

---

## 10. Timeline & Roadmap

### 10.1 Completed

| Version | Date | Features |
|---|---|---|
| v1.0 | Q1 2026 | Core MVP: tasks, prayer, diary, Bible reader |
| v2.0 | Q2 2026 | Settings, themes (5), light/dark mode, AI assistant, backup/restore |
| v2.0.1 | Q2 2026 | Bible Study Features: 12 versions, AI explanation, commentary, concordance, comparison; Faith Assistant polish: draggable FAB, AI Guide, plain-text responses |
| v3.1.0 | Q2 2026 | Hymns: 1,001 hymns with search, categories, favourites, daily hymn; Daily Devotional: 365 days with date auto-select, navigation, progress tracking |
| v3.1.0b | Q2 2026 | PWA service worker with offline caching, draggable navigation tabs, hymn numbering, React error boundary, accessibility (ARIA/keyboard), code splitting, study button navigates to Bible, Web Audio autoplay gesture fix |

### 10.2 Planned

| Version | Target | Features |
|---|---|---|
| v3.2 | Q3 2026 | iOS build (requires macOS), cloud sync (optional), push notifications, Hebrew/Greek interlinear Bible |
| v3.3 | Q4 2026 | Small group features, shared prayer lists, reading plans |
| v4.0 | Q1 2027 | Church directory, events calendar, sermon notes, AI sermon summariser |

---

## 11. Appendices

### 11.1 Glossary

| Term | Definition |
|---|---|
| **P0** | Critical — must-have for release |
| **P1** | Important — should have |
| **P2** | Nice-to-have — future |
| **DAU** | Daily Active Users |
| **MAU** | Monthly Active Users |
| **SPA** | Single Page Application |
| **GROQ** | AI inference provider (mixtral-8x7b, llama-3.3) |

### 11.2 References

- **Web App:** https://believers-flow-frontend.vercel.app
- **GitHub:** https://github.com/ecoinboxhub/Christian_task_manager
- **Backend API:** https://christian-task-manager.vercel.app
- **Status:** `status.md`
- **Design Thinking:** `pitch/Design_thinking.md`
- **Software Requirements:** `pitch/SWR.md`
- **User Personas:** `pitch/user_persona.md`
- **Monetization:** `pitch/monetization.md`
