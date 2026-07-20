# Product Requirements Document — BelieversFlow

**Version:** 4.2.0
**Status:** Final
**Last Updated:** July 8, 2026
**Author:** Product Team
**Classification:** Internal — Product & Engineering

---

## Document History

| Version | Date | Changes | Author |
|---|---|---|---|
| 1.0 | 2026-06-09 | Initial PRD | Product Team |
| 3.1.0 | 2026-06-10 23:10 | Hymns + Devotional, offline data, 7-tab nav, AI endpoints | Product Team |
| 3.1.0b | 2026-06-11 09:38 | PWA service worker, draggable nav tabs, hymn numbering, error boundary, accessibility, code splitting, study button navigates to Bible, audio gesture fix | Product Team |
| 3.2.0-draft | 2026-07-03 | Added Competitor Analysis, integrated User Personas, Future Considerations roadmap, effort estimates, dependencies, acceptance criteria | Product Team |
| 3.2.0-rc1 | 2026-07-03 | Refined: fixed contradictions, added automated testing, pricing tiers, v3.2 prioritization, data migration, rollback plan | Product Team |
| 4.0.0 | 2026-07-03 | Final: added Risk Register, Legal & Compliance, Scalability Plan, Content Strategy, Onboarding, API Versioning, Open Source Community, Disaster Recovery, WCAG standards, A/B testing framework, data retention, security audits, analytics strategy | Product Team |
| 4.1.0 | 2026-07-04 | Production deployment: user auth, Google OAuth, cloud sync, Pinecone RAG, multi-LLM (GROQ/OpenAI/OpenRouter), freemium model, PostgreSQL on Aiven, 61 unit tests passing, UI polish (tab visibility, nav layout) | Product Team |
| 4.2.0 | 2026-07-04 | Legal & compliance framework: 14 legal documents, in-app legal acceptance flow, Settings Legal tab, backend legal acceptance tracking, security audit fixes (hardcoded credentials removed, embedding dimension consistency, JSON serialization fix) | Product Team |
| 4.2.0 | 2026-07-08 | Complete implementation: community forum, onboarding improvements, 97 API endpoints, 18 database tables, 129 tests passing, full PRD compliance audit | Product Team |

### Review Feedback Incorporated

| Source | Date | Feedback | Resolution |
|---|---|---|---|
| PRD Completeness Review | 2026-07-03 | §12.3/§12.9 contradicted billing coverage status | Fixed: billing ✅ Covered in §4.4 + §13.6 |
| PRD Completeness Review | 2026-07-03 | No automated testing strategy | Added §9 Testing Strategy |
| PRD Completeness Review | 2026-07-03 | No pricing tier summary in PRD | Added §4.4 Pricing Tiers |
| PRD Completeness Review | 2026-07-03 | v3.2 scheduling risk (13–19 weeks in 13-week quarter) | Added §12.4 v3.2 Prioritization |
| PRD Completeness Review | 2026-07-03 | No data migration strategy for cloud sync | Added §13 Data Migration & Rollback |
| PRD Completeness Review | 2026-07-03 | §10.2 auth tension unclear | Clarified: "opt-in auth as prerequisite for cloud sync" |
| PRD Completeness Review | 2026-07-03 | Hymn tune expansion not in roadmap | Added to §12.2 v3.3 |
| PRD Completeness Review | 2026-07-03 | §12 items lack effort estimates | Added Estimated Effort to all §14 entries |
| PRD Completeness Review | 2026-07-03 | Cross-platform matrix says "Web + Android" | Updated to "Web + Android (+ iOS v3.2)" |
| PRD Completeness Review | 2026-07-03 | No iOS compatibility NFR | Added NFR-21 to §8.4 |
| PRD Completeness Review | 2026-07-03 | No risk register | Added §15 Risk Register |
| PRD Completeness Review | 2026-07-03 | No GDPR/CCPA compliance | Added §16 Legal & Compliance |
| PRD Completeness Review | 2026-07-03 | No WCAG accessibility targets | Added NFR-22/23/24 to §8.6 |
| PRD Completeness Review | 2026-07-03 | No A/B testing framework | Added §9.6 A/B Testing |
| PRD Completeness Review | 2026-07-03 | No scalability plan | Added §17 Scalability & Infrastructure |
| PRD Completeness Review | 2026-07-03 | No content strategy | Added §18 Content Strategy |
| PRD Completeness Review | 2026-07-03 | No onboarding flow | Added §19 Onboarding & UX |
| PRD Completeness Review | 2026-07-03 | No API versioning | Added §20 API Strategy |
| PRD Completeness Review | 2026-07-03 | No open source community plan | Added §21 Open Source & Community |
| PRD Completeness Review | 2026-07-03 | No disaster recovery | Added §17.4 Disaster Recovery |
| PRD Completeness Review | 2026-07-03 | No data retention policy | Added §16.4 Data Retention |
| PRD Completeness Review | 2026-07-03 | No security audit schedule | Added §16.5 Security Audit Schedule |

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Problem Statement](#2-problem-statement)
3. [Competitor Analysis](#3-competitor-analysis)
4. [Product Vision & Objectives](#4-product-vision--objectives)
5. [Target Audience](#5-target-audience)
6. [User Stories](#6-user-stories)
7. [Functional Requirements](#7-functional-requirements)
8. [Non-Functional Requirements](#8-non-functional-requirements)
9. [Testing Strategy](#9-testing-strategy)
10. [Success Metrics](#10-success-metrics)
11. [Release Criteria](#11-release-criteria)
12. [Timeline & Roadmap](#12-timeline--roadmap)
13. [Data Migration & Rollback Strategy](#13-data-migration--rollback-strategy)
14. [Future Considerations](#14-future-considerations)
15. [Risk Register](#15-risk-register)
16. [Legal & Compliance](#16-legal--compliance)
17. [Scalability & Infrastructure](#17-scalability--infrastructure)
18. [Content Strategy](#18-content-strategy)
19. [Onboarding & User Experience](#19-onboarding--user-experience)
20. [API Strategy](#20-api-strategy)
21. [Open Source & Community](#21-open-source--community)
22. [Appendices](#22-appendices)

---

## 1. Executive Summary

BelieversFlow is a **single-page, offline-first Christian productivity application** that unifies task management, prayer tracking, Bible reading, journaling, and AI-powered faith guidance into one seamless experience. Unlike generic productivity tools that ignore spiritual dimensions, BelieversFlow is purpose-built for Christians who want to integrate their faith into their daily planning.

The app is currently **live** on web (Vercel), **published** as an Android APK (GitHub Releases), and operates at **zero ongoing cost** using free-tier infrastructure. It delivers 40+ features across 7 main views with full customization.

**Key Facts:**
- **Version:** 4.2.0 (PRD) / 4.2.0 (backend) / 4.2.0 (frontend)
- **Stack:** React 19 + Vite 8 + Capacitor 8 + Python FastAPI + PostgreSQL (Aiven) + Pinecone RAG + Multi-LLM (GROQ/OpenAI/OpenRouter)
- **Platforms:** Web (PWA), Android APK, iOS (planned v5.0)
- **Revenue:** Freemium model implemented (all features free for logged-in users); subscription billing planned v5.0
- **License:** MIT (open source)
- **Tests:** 129/129 passing (68 backend pytest + 61 frontend vitest)
- **Backend:** 4.2.0 with auth, sync, RAG, multi-LLM, Google OAuth, legal acceptance tracking, 97 API endpoints
- **Database:** PostgreSQL on Aiven with asyncpg, 18 tables
- **Vector Store:** Pinecone (54 Bible verses, 1024-dim embeddings)
- **Legal Framework:** 14 documents (Privacy Policy, Terms of Service, Terms of Use, Community Guidelines, Cookie Policy, Content Moderation, Acceptable Use, Third-Party Services, Data Retention, Incident Response, Data Compliance, Compliance Checklist, Security Policy, Data Collection Disclosure)

**Production Status (July 8, 2026):**
- ✅ User authentication (email + Google OAuth)
- ✅ Cloud sync (last-write-wins conflict resolution)
- ✅ Premium feature gating (freemium model)
- ✅ Pinecone RAG for Bible verse search
- ✅ Multi-LLM support (GROQ, OpenAI, OpenRouter)
- ✅ PostgreSQL database on Aiven
- ✅ 129 tests passing (68 backend + 61 frontend)
- ✅ All UI tabs visible and functional
- ✅ Legal & compliance framework (14 documents)
- ✅ In-app legal acceptance flow
- ✅ Settings Legal tab
- ✅ Security audit fixes (credentials removed, consistent dimensions)
- ✅ Community forum (threads, replies, moderation)
- ✅ Push notifications via FCM
- ✅ Small groups with invite codes
- ✅ Church directory with proximity search
- ✅ Events calendar with RSVP
- ✅ Hebrew/Greek interlinear Bible
- ✅ Sermon notes with AI summarizer
- ✅ Prayer analytics and goals
- ✅ Hymn tune expansion (75 tunes)
- ✅ Onboarding improvements (multi-step wizard)
- ✅ 97 API endpoints
- ✅ 18 database tables

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

## 3. Competitor Analysis

### 3.1 Direct Competitors (Faith + Productivity)

| Competitor | Revenue Model | Strengths | Weaknesses | BelieversFlow Advantage |
|---|---|---|---|---|
| **YouVersion** | Free (donations) | 500M+ installs, extensive Bible tools, community | No task management, no prayer tracking, no journaling, requires account | Integrated faith + productivity; no account required; offline-first |
| **Pray.com** | Freemium ($4.99/mo) | Large user base, audio prayers, meditation | No task management, not offline, subscription-gated content | Full feature set free; offline-first; task integration |
| **Abide** | Subscription ($11.99/mo) | Sleep stories, guided meditations, high production quality | Not a daily productivity tool, expensive, no Bible reader | Broader feature set; free; Bible reader + AI assistant |
| **Glo Bible** | Paid app ($4.99) | Rich media Bible, visual media | No task/prayer tracking, no journaling, paid upfront | Free; broader feature set; AI-powered tools |
| **Bible Gateway** | Free / Ads | Web-based Bible lookup, multiple translations | No mobile app, no productivity features, ad-supported | Native mobile app; offline; no ads |

### 3.2 Indirect Competitors (Productivity + Customization)

| Competitor | Revenue Model | Strengths | Weaknesses | BelieversFlow Advantage |
|---|---|---|---|---|
| **Todoist** | Freemium ($4/mo Pro) | Best-in-class task management, cross-platform, integrations | Secular, no faith context, premium features gated | Faith-integrated categories; free; prayer tracking |
| **Notion** | Freemium ($10/mo Plus) | Extremely flexible, databases, wikis | Overwhelming, not mobile-first, no offline | Simpler; mobile-first; offline-first; purpose-built |
| **Day One** | Subscription ($2.99/mo) | Beautiful journaling, rich media entries | No tasks, no Bible, no prayer, subscription required | Free; tasks + Bible + prayer; no subscription |
| **Habitica** | Freemium ($4.99/mo) | Gamified habit tracking, RPG elements | Secular, not faith-focused, complex | Faith-focused; simpler; prayer streak instead of RPG |

### 3.3 Feature Comparison Matrix

| Feature | BelieversFlow | YouVersion | Todoist | Pray.com | Day One | Notion |
|---|---|---|---|---|---|---|
| Task management | ✅ Free | ❌ | ✅ Freemium | ❌ | ❌ | ✅ Freemium |
| Prayer tracking + streak | ✅ Free | ❌ | ❌ | ✅ Limited | ❌ | ❌ |
| Bible reader (66 books) | ✅ Free | ✅ Free | ❌ | ❌ | ❌ | ❌ |
| AI faith assistant | ✅ Free (50/day) | ❌ | ❌ | ❌ | ❌ | ❌ |
| Journal / diary | ✅ Free | ❌ | ❌ | ❌ | ✅ Subscription | ✅ Freemium |
| Hymn book (1,001 hymns) | ✅ Free | ❌ | ❌ | ❌ | ❌ | ❌ |
| Daily devotional | ✅ Free | ✅ Free | ❌ | ✅ Subscription | ❌ | ❌ |
| Offline-first | ✅ Full | ⚠️ Partial | ⚠️ Partial | ❌ | ⚠️ Partial | ⚠️ Partial |
| No account required | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Open source | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| No ads | ✅ | ✅ | ⚠️ Free tier | ⚠️ Free tier | ✅ | ✅ |
| Customization (themes) | ✅ 5 themes + custom | ⚠️ Limited | ⚠️ Premium only | ⚠️ Limited | ⚠️ Limited | ⚠️ Limited |
| Cross-platform | ✅ Web + Android (+ iOS v3.2) | ✅ iOS + Android | ✅ All platforms | ✅ iOS + Android | ✅ iOS + Android | ✅ All platforms |
| Price (full features) | **Free** | Free | $4/mo | $4.99/mo | $2.99/mo | $10/mo |

### 3.4 Market Positioning

```
                    High Feature Depth
                          │
         Notion           │         BelieversFlow
         (general)        │         (faith-specific)
                          │              ★
    ──────────────────────┼────────────────────────
                          │
         Todoist          │         YouVersion
         (tasks only)     │         (Bible only)
                          │
                    Low Feature Depth
    ──────────────────────┼────────────────────────
    Secular               │              Faith-focused
```

### 3.5 Competitive Moat

| Moat | Description |
|---|---|
| **Integration** | No competitor combines tasks + prayer + Bible + diary + hymns + AI in one app |
| **Privacy** | Zero data collection, no accounts, open source — verifiable by users |
| **Offline-first** | Full functionality without internet; competitors degrade significantly offline |
| **Price** | 40+ features completely free; competitors gate similar features behind subscriptions |
| **Open source** | Community trust; anyone can audit the code; fork-friendly |

---

## 4. Product Vision & Objectives

### 4.1 Vision Statement

> To be the most trusted digital companion for daily Christian living — combining productivity, scripture, prayer, and AI guidance in a private, offline-first experience.

### 4.2 Product Objectives

| Objective | Metric | Target | Measurement Method |
|---|---|---|---|
| O1 | Daily active users (DAU) | 1,000 by Q4 2026 | Vercel Analytics (opt-in) |
| O2 | User retention (7-day) | >40% | localStorage onboarding timestamp + return detection |
| O3 | Prayer streak adherence | >50% of DAU log prayer weekly | localStorage prayerLogs analysis |
| O4 | User satisfaction | >4.5/5 | GitHub Discussions surveys, community feedback |
| O5 | GitHub stars | >100 by Q4 2026 | GitHub API |
| O6 | Automated test coverage | >80% of pure functions | Vitest coverage report |
| O7 | Lighthouse performance | >80 mobile score | Lighthouse CI |

### 4.3 Key Differentiators

| Differentiator | BelieversFlow | Competitors |
|---|---|---|
| Integrated faith + productivity | ✅ Tasks + prayer + Bible + diary | ❌ Separate apps |
| Offline-first architecture | ✅ All features work offline | ❌ Most require internet |
| Zero data collection | ✅ No accounts, no tracking | ❌ Ad-based or data-harvesting |
| Customizable | ✅ 5 themes, light/dark, fonts, layouts | ❌ Limited or premium-only |
| Free & open source | ✅ Full source on GitHub | ⚠️ Often freemium |

### 4.4 Pricing Tiers Summary

The following tiers are implemented (v4.1.0) and planned (v5.0):

| Tier | Price | AI Limit | Cloud Sync | Group Features | Target User |
|---|---|---|---|---|---|
| **Free** | $0 (forever) | 50 messages/day | ❌ (local only) | ❌ | Individual Christians (all personas) |
| **Premium** | $0 (any logged-in user) | Unlimited | ✅ | ❌ | Users who create accounts |
| **Supporter** | $2.99/mo or $29.99/yr (planned v5.0) | Unlimited | ✅ | ❌ | Power users wanting sync + analytics |
| **Ministry** | $9.99/mo or $99.99/yr (planned v5.0) | Unlimited | ✅ | ✅ (up to 50 members) | Church leaders, small group organizers |

**Current Implementation (v4.2.0):**
- Free tier: All features available locally without account
- Premium tier: Any logged-in user gets unlimited AI and cloud sync
- No payment processing yet (planned v5.0 via Flutterwave)

**Pricing Principles:**
- Core spiritual features (tasks, prayer, Bible, diary, hymns, devotionals) remain **free forever**
- No ads, ever — advertising conflicts with the spiritual nature of the app
- No data selling, ever — privacy is a non-negotiable brand promise
- Revenue reinvested into development and outreach, not profit extraction

---

## 5. Target Audience

### 5.1 Primary Audience

Practicing Christians aged 16–55 who own a smartphone and want to integrate their faith into daily productivity.

### 5.2 User Personas

Five personas define the target audience. Full profiles with demographics, goals, pain points, behavioral patterns, and user journey maps are documented in `pitch/user_persona.md`. The summaries below guide feature prioritization:

| Persona | Age | Occupation | Tech Level | Faith Stage | Primary Need |
|---|---|---|---|---|---|
| **Samuel** — The Busy Believer | 32 | Software Engineer | High | Mature | Integrate faith into busy schedule |
| **Grace** — The New Christian | 24 | Graduate Student | Medium | New believer | Structured spiritual growth |
| **David** — The Ministry Leader | 45 | Worship Pastor | Low-medium | Mature leader | Ministry organization + sermon prep |
| **Esther** — The Privacy-Conscious User | 38 | Freelance Writer | High | Mature | Complete data privacy + journaling |
| **Caleb** — The Digital Native Teen | 17 | High School Student | Very High | Exploring | Engaging, customizable, gamified faith |

#### Persona Summaries

**Samuel (32, Lagos Nigeria)** — Software engineer, married, uses 15+ apps. Wants one app for tasks, prayer, Bible, and journal. Values efficiency and privacy. Reads Bible on commute. Primary features: Tasks, prayer tracker, Bible reader, backup.

**Grace (24, Nairobi Kenya)** — New Christian, graduate student, budget Android phone. Needs guided structure: where to start reading the Bible, how to pray, daily suggestions. Motivated by streaks. Primary features: Daily verse, prayer suggestions, study suggestions, AI chat, diary.

**David (45, Atlanta USA)** — Worship pastor, extensive Bible study in original languages. Needs sermon prep tools, prayer list management, offline access for travel. Prefers large fonts and wide layouts. Primary features: Bible reader, diary, backup, prayer tracker.

**Esther (38, Seoul South Korea)** — Catholic, freelance writer, privacy advocate. Uses Signal, ProtonMail, Linux. Will never use a cloud-based prayer journal. Wants complete data control. Primary features: Diary, backup, factory reset, offline mode, open source audit.

**Caleb (17, Houston USA)** — High school student, very high tech proficiency, exploring faith. Wants the app to look good and feel fun. Customizes everything. Primary features: Themes, custom colors, AI chat (tough questions), prayer streak, diary.

### 5.3 Secondary Audiences

| Segment | Needs | Features Used |
|---|---|---|
| Church small groups | Shared prayer lists, group reading plans | Bible, prayer tracker, diary |
| Youth groups | Engaging faith tools for teens | Themes, AI chat, streak gamification |
| Ministry leaders | Sermon prep notes, study planning | Bible reader, diary, backup |
| Missionaries | Offline access in low-connectivity areas | All offline features |

### 5.4 Geographic Scope

- **Primary:** English-speaking markets (US, UK, Canada, Australia, Nigeria, Philippines)
- **Secondary:** Spanish, French, German, Portuguese (language selector implemented)
- **Future:** More languages via community contributions

---

## 6. User Stories

### 6.1 Task Management

| ID | User Story | Priority | Status | Personas Served |
|---|---|---|---|---|
| US-01 | As a user, I want to add tasks with a category and time so I can organize my day | P0 | ✅ | Samuel, David, Caleb |
| US-02 | As a user, I want to mark tasks complete with one tap so I can track progress | P0 | ✅ | All |
| US-03 | As a user, I want to filter tasks by All/Active/Completed so I can focus | P1 | ✅ | Samuel, David |
| US-04 | As a user, I want to undo a task deletion so I can recover from mistakes | P1 | ✅ | All |
| US-05 | As a user, I want to see my completion percentage so I feel motivated | P1 | ✅ | Samuel, Caleb |

### 6.2 Spiritual Growth

| ID | User Story | Priority | Status | Personas Served |
|---|---|---|---|---|
| US-06 | As a user, I want to log my daily prayer time so I can build a habit | P0 | ✅ | All |
| US-07 | As a user, I want to see my prayer streak so I stay motivated | P1 | ✅ | Samuel, Grace, Caleb |
| US-08 | As a user, I want a daily prayer suggestion so I know what to pray | P2 | ✅ | Grace, Esther |
| US-09 | As a user, I want to see my spiritual vs. secular task balance | P2 | ✅ | Samuel |

### 6.3 Bible Reading

| ID | User Story | Priority | Status | Personas Served |
|---|---|---|---|---|
| US-10 | As a user, I want to read any Bible chapter so I can study scripture | P0 | ✅ | All |
| US-11 | As a user, I want chapters cached offline so I can read without internet | P1 | ✅ | Samuel, David, Esther |
| US-12 | As a user, I want quick access to recent reads so I can continue studying | P2 | ✅ | David |
| US-13 | As a user, I want reading suggestions so I don't have to decide what to read | P2 | ✅ | Grace |

### 6.4 Diary & Journal

| ID | User Story | Priority | Status | Personas Served |
|---|---|---|---|---|
| US-14 | As a user, I want to write diary entries with a mood so I can reflect | P0 | ✅ | Samuel, Grace, Esther, Caleb |
| US-15 | As a user, I want to edit or delete past entries so I can correct mistakes | P1 | ✅ | All |
| US-16 | As a user, I want undo for accidental deletions so I don't lose content | P1 | ✅ | All |

### 6.5 AI Faith Assistant

| ID | User Story | Priority | Status | Personas Served |
|---|---|---|---|---|
| US-17 | As a user, I want to ask faith-related questions and get Biblical answers | P0 | ✅ | Grace, Caleb |
| US-18 | As a user, I want the AI to know my tasks so it can give relevant advice | P1 | ✅ | Samuel |
| US-19 | As a user, I want chat history to persist so I can revisit past conversations | P2 | ✅ | Grace |

### 6.6 Settings & Customization

| ID | User Story | Priority | Status | Personas Served |
|---|---|---|---|---|
| US-20 | As a user, I want to choose a color theme that feels personal | P1 | ✅ | Caleb, Esther |
| US-21 | As a user, I want light/dark mode so I can use the app comfortably | P1 | ✅ | Samuel, Esther |
| US-22 | As a user, I want to adjust font size for readability | P2 | ✅ | David |
| US-23 | As a user, I want to back up my data so I don't lose it | P1 | ✅ | Samuel, David, Esther |
| US-24 | As a user, I want to restore from backup when switching devices | P1 | ✅ | All |

### 6.7 Dashboard & Daily Start

| ID | User Story | Priority | Status | Personas Served |
|---|---|---|---|---|
| US-25 | As a user, I want a daily verse when I open the app | P0 | ✅ | All |
| US-26 | As a user, I want a greeting based on the time of day | P2 | ✅ | All |
| US-27 | As a user, I want to see my stats (tasks, streak, prayer) at a glance | P1 | ✅ | Samuel, Caleb |

### 6.8 Hymns

| ID | User Story | Priority | Status | Personas Served |
|---|---|---|---|---|
| US-28 | As a user, I want to browse/search 1,001 hymns by title or number | P0 | ✅ | David, Samuel |
| US-29 | As a user, I want a daily hymn suggestion so I discover new hymns | P1 | ✅ | Samuel |
| US-30 | As a user, I want to favourite hymns for quick access | P1 | ✅ | David |
| US-31 | As a user, I want to sort hymns A-Z or by number | P1 | ✅ | All |
| US-32 | As a user, I want to play hymn melodies so I can sing along | P2 | ✅ (54 tunes) | Samuel, Caleb |

### 6.9 Daily Devotional

| ID | User Story | Priority | Status | Personas Served |
|---|---|---|---|---|
| US-33 | As a user, I want to read a daily devotional with a Bible verse and reflection | P0 | ✅ | Grace, Esther |
| US-34 | As a user, I want to navigate between devotional days | P1 | ✅ | Grace |

### 6.10 Future User Stories (Planned)

| ID | User Story | Priority | Version | Personas Served |
|---|---|---|---|---|
| US-35 | As a user, I want to sign in with email or Google so I can sync across devices | P0 | v4.1.0 ✅ | Samuel, Grace, David, Caleb |
| US-36 | As a user, I want my data to sync automatically across my devices | P0 | v4.1.0 ✅ | Samuel, David |
| US-37 | As a user, I want to receive push notifications for prayer reminders | P1 | v5.0 | Samuel, Grace |
| US-38 | As a user, I want to read the Bible in Hebrew/Greek interlinear view | P1 | v5.0 | David |
| US-39 | As a user, I want to create or join a small group for shared prayer lists | P0 | v5.0 | David, Grace |
| US-40 | As a user, I want to subscribe to Supporter tier for unlimited AI and sync | P1 | v5.0 | Samuel, David |
| US-41 | As a church leader, I want to create a church profile in the directory | P1 | v5.0 | David |
| US-42 | As a user, I want to save personal study notes per Bible chapter | P2 | v5.0 | David, Samuel |
| US-43 | As a user, I want to review and accept legal documents before using the app | P0 | v4.2.0 ✅ | All |
| US-44 | As a user, I want to view legal documents in Settings at any time | P1 | v4.2.0 ✅ | All |

---

## 7. Functional Requirements

### 7.1 Task Management Module

| FR-ID | Requirement | Acceptance Criteria | Verification |
|---|---|---|---|
| FR-01 | System shall allow creating a task with text, time (optional), and category | Task appears in list within 100ms; empty text rejected | Manual test |
| FR-02 | System shall support 3 categories: Spiritual, Personal, Service | Category displayed as colored badge on task card | Visual inspection |
| FR-03 | System shall toggle task completion state on checkbox click | Checkbox toggles; strikethrough applied; completion % updated | Manual test |
| FR-04 | System shall filter tasks by All, Active, Completed | Correct subset displayed; active filter visually indicated | Manual test |
| FR-05 | System shall delete tasks with a 6-second undo window | Task removed; toast with "Undo" button shown for 6s; undo restores task | Manual test |
| FR-06 | System shall persist tasks across sessions via localStorage | Add task → reload page → task still present | Test with reload |

### 7.2 Prayer Tracker Module

| FR-ID | Requirement | Acceptance Criteria | Verification |
|---|---|---|---|
| FR-07 | System shall allow logging prayer minutes once per day | Entry added; toast shown; duplicate blocked with message | Manual test |
| FR-08 | System shall enforce one prayer log per calendar day | Second attempt shows "Already prayed today" message | Manual test |
| FR-09 | System shall calculate a streak going back up to 365 days | Streak = 0 for empty logs; increments by 1 per consecutive day; resets on gap | Unit test |
| FR-10 | System shall display last 5 prayer logs | Most recent 5 entries shown with date and minutes; "No logs yet" for empty | Visual inspection |

### 7.3 Bible Reader Module

| FR-ID | Requirement | Acceptance Criteria | Verification |
|---|---|---|---|
| FR-11 | System shall display all 66 books of the Bible | All books listed with chapter counts; grouped by OT/NT | Visual inspection |
| FR-12 | System shall load chapter text from bible-api.com (KJV) or GROQ (other versions) | KJV fetches from bible-api.com; 11 other versions via backend GROQ proxy; all cached | Integration test |
| FR-13 | System shall cache chapters in localStorage after first load | First load: network request; second load: <100ms from cache | Test with offline |
| FR-14 | System shall navigate between chapters with prev/next buttons | Prev disabled on Genesis 1; next disabled on Revelation 22 | Manual test |
| FR-15 | System shall track last 15 unique reads | Recent reads shown in reverse chronological order; deduplicated by book+chapter | Test with sequential reads |

### 7.4 Diary Module

| FR-ID | Requirement | Acceptance Criteria | Verification |
|---|---|---|---|
| FR-16 | System shall support CRUD operations on diary entries | Create, read, edit, delete all functional; entries sorted by date desc | Manual test |
| FR-17 | System shall provide a mood picker with 5 options | 5 moods displayed: 😊🙂😐😢😭; one selectable per entry | Visual inspection |
| FR-18 | System shall delete entries with 6-second undo | Entry removed; undo toast shown; undo restores entry | Manual test |
| FR-19 | System shall display entries with date, time, mood, title, content | All fields rendered; long content truncated in list view | Visual inspection |

### 7.5 AI Chat Module

| FR-ID | Requirement | Acceptance Criteria | Verification |
|---|---|---|---|
| FR-20 | System shall send user messages to GROQ API via backend proxy | Backend returns `{message: "..."}` within 10s; error handled gracefully | Integration test |
| FR-21 | System shall include last 6 chat messages as context | API request contains up to 6 prior messages in `messages` array | Manual test |
| FR-22 | System shall include task list as context in system prompt | System prompt contains formatted task list when tasks exist | Manual test |
| FR-23 | System shall display typing indicator during loading | Animated dots shown while API call in progress; hidden on response/error | Visual inspection |
| FR-24 | System shall provide 4 quick-start suggestion chips on welcome | 4 chips shown on empty chat; clicking populates input field | Visual inspection |

### 7.6 Settings Module

| FR-ID | Requirement | Acceptance Criteria | Verification |
|---|---|---|---|
| FR-25 | System shall support 5 preset color themes | 5 themes switchable; all views update within 1 frame (<16ms) | Manual test |
| FR-26 | System shall support custom colors via native color picker | Color picker opens; selected color applied as CSS variable | Manual test |
| FR-27 | System shall toggle between dark and light mode | Toggle switches all UI elements; persists across sessions | Manual test |
| FR-28 | System shall support 3 font sizes (13px, 15px, 17px) | Font size applies to body text; persists across sessions | Visual inspection |
| FR-29 | System shall support 3 reading layouts (Standard, Wide, Compact) | Layout attribute applied; content reflows correctly | Visual inspection |
| FR-30 | System shall export all data as a downloadable JSON file | JSON file downloads; contains all `btf_*` keys; valid JSON | Manual test |
| FR-31 | System shall import data from a JSON file via file picker | File picker opens; valid JSON restores all data; invalid shows error | Manual test |
| FR-32 | System shall factory reset with confirmation dialog | `confirm()` dialog shown; on confirm: all localStorage cleared, state reset | Manual test |

### 7.7 Hymns Module

| FR-ID | Requirement | Acceptance Criteria | Verification |
|---|---|---|---|
| FR-33 | System shall include a hymn book of 1,001 hymns with title, number, and lyrics | All 1,001 hymns loadable; each has id, title, author, category, lyrics | Content audit |
| FR-34 | System shall allow searching hymns by title, author, category, or numeric ID | Search filters list in real-time; numeric search matches hymn ID | Manual test |
| FR-35 | System shall group hymns by category | Categories extracted from data; filter buttons shown | Visual inspection |
| FR-36 | System shall allow favouriting hymns for quick access | Heart toggle persists to localStorage; favorites filter shows only favorited | Manual test |
| FR-37 | System shall display a daily hymn suggestion on the hymns page | Daily hymn auto-selected by day-of-year; tappable to open detail | Visual inspection |
| FR-38 | System shall play hymn melodies via Web Audio API for 54 tunes | Play button starts triangle-wave organ sound; stop button halts; player bar visible | Manual test |
| FR-39 | System shall sort hymns by number, A-Z, or Z-A | Sort buttons toggle; list reorders; default is by number | Manual test |

### 7.8 Daily Devotional Module

| FR-ID | Requirement | Acceptance Criteria | Verification |
|---|---|---|---|
| FR-40 | System shall include 365 daily devotionals with Bible verse, reflection, and prayer | All 365 entries loadable; each has verse, reflection text, and prayer | Content audit |
| FR-41 | System shall auto-select today's devotional based on calendar date | Day-of-year used as index; shown on page load | Manual test |
| FR-42 | System shall allow navigating to any day via prev/next or day picker | Prev/next change day; date picker allows direct jump | Manual test |
| FR-43 | System shall support font size adjustments for devotional reading | Font size selector applies to devotional text only | Visual inspection |
| FR-44 | System shall track which devotionals have been read | Read status persisted; progress counter shown | Test with sequential reads |

### 7.9 Future Functional Requirements (Planned)

| FR-ID | Requirement | Version | Acceptance Criteria |
|---|---|---|---|
| FR-45 | System shall support user registration via email or Google OAuth | v4.1.0 ✅ | Account created; JWT token; session persists 30 days |
| FR-46 | System shall sync localStorage data to cloud on login | v4.1.0 ✅ | All `btf_*` keys uploaded; conflict resolved (last-write-wins); offline queue syncs on reconnect |
| FR-47 | System shall send push notifications via FCM (Android) | v5.0 | Task reminders fire at scheduled time; verse-of-day fires daily; opt-out toggle |
| FR-48 | System shall display Hebrew/Greek interlinear Bible text | v5.0 | Word-by-word interlinear for OT (Hebrew) and NT (Greek); toggleable |
| FR-49 | System shall support small group creation and joining | v5.0 | Invite code system; shared prayer list; max 50 members per group |
| FR-50 | System shall process subscription payments via Flutterwave | v5.0 | Checkout flow; subscription management; webhook verification |
| FR-51 | System shall display legal documents for user review | v4.2.0 ✅ | LegalScreen component; 5 documents viewable; accept/decline flow |
| FR-52 | System shall track legal acceptance in backend | v4.2.0 ✅ | POST /api/auth/legal-accept; GET /api/auth/legal-status; PostgreSQL storage |
| FR-53 | System shall show Legal tab in Settings | v4.2.0 ✅ | 6th settings tab; view all documents; acceptance status display |

---

## 8. Non-Functional Requirements

### 8.1 Performance

| NFR-ID | Requirement | Target | Measurement |
|---|---|---|---|
| NFR-01 | App shell initial load time | <3s on 4G | Chrome DevTools Performance tab |
| NFR-02 | Bible chapter load time (first fetch) | <5s | fetch() timing |
| NFR-03 | Bible chapter load time (cached) | <100ms | Navigation Timing API |
| NFR-04 | UI responsiveness (tap-to-action) | <100ms | console.time() |
| NFR-05 | JS bundle size | <250 KB gzipped | Vite build output |
| NFR-06 | CSS bundle size | <60 KB gzipped | Vite build output |
| NFR-07 | APK size | <5 MB | Gradle build output |

### 8.2 Offline Capability

| NFR-ID | Requirement | Target | Measurement |
|---|---|---|---|
| NFR-08 | All user data (tasks, prayer, diary, settings) must work offline | 100% | Airplane mode test |
| NFR-09 | Previously loaded Bible chapters must be available offline | 100% | Airplane mode + reload |
| NFR-10 | Pre-bundled content (verses, prayers, suggestions) must work offline | 100% | Airplane mode test |
| NFR-11 | AI chat must show graceful error when offline | Message shown | Airplane mode + send |

### 8.3 Security & Privacy

| NFR-ID | Requirement | Target | Measurement |
|---|---|---|---|
| NFR-12 | No user data shall be sent to any server without explicit user action | Verified | Code audit |
| NFR-13 | AI chat requests must be proxied through backend (not direct from APK) | Verified | Network inspection |
| NFR-14 | No analytics, tracking, or telemetry shall be embedded | Verified | Code audit |
| NFR-15 | Factory reset shall clear all data from localStorage | Verified | Manual test |
| NFR-16 | Cloud sync data must be encrypted in transit (TLS 1.2+) and at rest | Verified (v3.2) | Certificate pinning + database encryption |
| NFR-17 | User authentication tokens must expire after 30 days of inactivity | Verified (v3.2) | Token expiry test |
| NFR-18 | API keys must never be embedded in client-side code | Verified | Code audit + APK inspection |

### 8.4 Compatibility

| NFR-ID | Requirement | Target | Measurement |
|---|---|---|---|
| NFR-19 | Web: Latest 2 versions of Chrome, Firefox, Safari, Edge | Verified | Cross-browser testing |
| NFR-20 | Android: API 24+ (Android 7.0+) | Verified | Capacitor build + device test |
| NFR-21 | iOS: iOS 15+ (Safari, Chrome on iOS) | Verified (v3.2) | Xcode build + device test |
| NFR-22 | Screen sizes: 320px to 1920px width | Verified | Responsive testing |

### 8.5 Reliability

| NFR-ID | Requirement | Target | Measurement |
|---|---|---|---|
| NFR-23 | Bible API failures must show user-friendly error | Verified | API failure simulation |
| NFR-24 | GROQ API failures must not crash the app | Verified | API failure simulation |
| NFR-25 | localStorage failures must not crash the app | Verified | Quota exceeded simulation |
| NFR-26 | Cloud sync failures must not lose local data; must retry on reconnect | Verified (v3.2) | Network failure simulation |
| NFR-27 | Failed cloud sync must fall back to local-only mode with user notification | Verified (v3.2) | Offline + sync enabled test |

### 8.6 Accessibility

| NFR-ID | Requirement | Target | Standard |
|---|---|---|---|
| NFR-28 | All interactive elements must have ARIA labels | 100% | WCAG 2.1 AA |
| NFR-29 | Keyboard navigation must work for all features | Full support | WCAG 2.1 AA |
| NFR-30 | Color contrast ratio must meet minimum thresholds | 4.5:1 text, 3:1 UI | WCAG 2.1 AA |
| NFR-31 | Touch targets must be at least 44×44px | 100% of buttons | WCAG 2.1 AA |
| NFR-32 | Screen reader must announce all important state changes | Verified | VoiceOver/TalkBack test |
| NFR-33 | Focus-visible outlines must be present on all focusable elements | Verified | Manual keyboard test |
| NFR-34 | No content shall rely solely on color to convey information | Verified | Color-blind simulation |

---

## 9. Testing Strategy

### 9.1 Automated Testing

| Module | Test Type | Framework | Coverage Target | Status |
|---|---|---|---|---|
| `getStreak()` | Unit test | Vitest | 100% branch coverage | ✅ Implemented |
| `getGreeting()` | Unit test | Vitest | All 4 time windows + edge cases | ✅ Implemented |
| `formatTime()` / `formatDate()` | Unit test | Vitest | Valid ISO, null, timezone variants | ✅ Implemented |
| `loadState()` / `saveState()` | Unit test | Vitest | Existing key, missing key, corrupted JSON | ✅ Implemented |
| `searchHymns()` | Unit test | Vitest | Empty query, text match, numeric match, category filter | ✅ Implemented |
| GROQ API integration | Integration test | Vitest + MSW | Request/response cycle, error handling | ⏳ Phase 2 |
| Bible API integration | Integration test | Vitest + MSW | KJV fetch, GROQ proxy, cache behavior | ⏳ Phase 2 |
| localStorage persistence | Integration test | Vitest | Add → reload → verify persistence | ⏳ Phase 2 |

### 9.2 End-to-End Testing

| Flow | Steps | Status |
|---|---|---|
| Task lifecycle | Add → Filter → Complete → Delete → Undo | ❌ Not implemented |
| Prayer logging | Open spiritual view → Log minutes → Verify streak | ❌ Not implemented |
| Bible reading | Select book → Select chapter → Verify verses → Navigate prev/next | ❌ Not implemented |
| Diary CRUD | Create → Edit → Delete → Undo | ❌ Not implemented |
| Theme switching | Open settings → Change theme → Verify all views | ❌ Not implemented |
| Backup/restore | Export → Clear data → Import → Verify restored | ❌ Not implemented |

### 9.3 Manual Testing Checklist

| Category | Tests | Frequency |
|---|---|---|
| Functional | All user stories | Per build |
| Offline | Enable airplane mode, test all views | Per release |
| Cross-browser | Chrome, Firefox, Edge, Android WebView, Safari (iOS) | Per release |
| Responsive | 320px, 375px, 414px, 768px, 1920px widths | Per release |
| Performance | Lighthouse audit (target: >80 on mobile) | Per major version |
| Accessibility | Tab navigation, screen reader, contrast, color-blind | Per major version |

### 9.4 Testing Tools

| Tool | Purpose | Status |
|---|---|---|
| Vitest | Unit + integration testing | ✅ Available (61 tests passing) |
| MSW (Mock Service Worker) | API mocking for integration tests | ⏳ Phase 2 |
| Playwright | E2E browser testing | ✅ Available (used for screenshot tests) |
| Lighthouse CI | Automated performance auditing | ⏳ Phase 4 |
| axe-core | Accessibility testing (WCAG 2.1 AA) | ⏳ Phase 4 |

### 9.5 Testing Roadmap

| Phase | Scope | Timeline | Priority |
|---|---|---|---|
| **Phase 1** | Unit tests for pure functions (getStreak, getGreeting, formatTime, loadState, searchHymns) | v3.2 | High |
| **Phase 2** | Integration tests for API modules (Bible fetch, GROQ chat, backend proxy) | v3.2 | High |
| **Phase 3** | E2E tests for critical user flows (task lifecycle, Bible reading, backup/restore) | v3.3 | Medium |
| **Phase 4** | Accessibility audit (axe-core) + Lighthouse CI integration | v3.3 | Medium |
| **Phase 5** | Full regression suite for release automation | v4.0 | Low |

### 9.6 A/B Testing Framework

A/B testing will be introduced in v3.3 to validate feature decisions before full rollout. The framework uses a lightweight, privacy-compliant approach:

| Component | Implementation |
|---|---|
| **Assignment** | Random user ID (localStorage `btf_ab_group`) assigned on first visit; consistent across sessions |
| **Variants** | 2 variants per test (control + variant); maximum 1 active test at a time to avoid interaction |
| **Metrics** | Feature-specific engagement (e.g., hymn play rate, prayer log frequency, AI chat usage) |
| **Duration** | Minimum 2 weeks or 200 users per variant, whichever comes first |
| **Decision** | Statistically significant improvement (>5% lift, p<0.05) → ship variant; otherwise → keep control |
| **Privacy** | No PII collected; only anonymous variant assignment + feature usage counters in localStorage |

**Planned A/B Tests:**

| Test | Version | Hypothesis | Metric |
|---|---|---|---|
| Onboarding walkthrough | v3.3 | Guided onboarding increases D7 retention | D7 retention rate |
| Daily verse placement | v3.3 | Moving verse to notification increases engagement | Verse read rate |
| Hymn play button size | v3.4 | Larger button increases hymn play rate | Hymn play rate |
| AI chat quick suggestions | v3.4 | More suggestions increase AI usage | AI messages per user |

---

## 10. Success Metrics

### 10.1 Product Metrics

| Metric | Definition | Current | Goal (Q4 2026) | Measurement |
|---|---|---|---|---|
| DAU | Daily Active Users | <100 | 1,000 | Vercel Analytics (opt-in) |
| Retention (D7) | Users returning on day 7 | — | >40% | localStorage onboarding + return |
| Retention (D30) | Users returning on day 30 | — | >20% | localStorage onboarding + return |
| Prayer streak avg | Mean streak across active users | — | >5 days | localStorage prayerLogs |
| Tasks created/user | Avg tasks per user per day | — | >3 | localStorage tasks |
| AI chats/user | Avg AI interactions per user per week | — | >2 | localStorage chatHistory |
| Automated test coverage | % of pure functions with unit tests | 100% (61 tests) | >80% | Vitest coverage report |

### 10.2 Quality Metrics

| Metric | Target | Measurement |
|---|---|---|
| Crash-free rate | >99.5% | Manual testing + crash reports |
| User satisfaction | >4.5/5 | GitHub Discussions surveys |
| Feature completion | 100% of P0 + P1 | PRD audit |
| Bug turnaround | <7 days for P0 bugs | Issue tracker |
| Lighthouse performance | >80 mobile score | Lighthouse CI |
| WCAG 2.1 AA compliance | 100% | axe-core audit |
| Accessibility score | >90 | Lighthouse accessibility audit |

---

## 11. Release Criteria

### 11.1 Go/No-Go Checklist

| Criterion | Requirement | v4.1.0 Status |
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
| Unit tests pass | 100% pass rate | ✅ Pass (61/61) |
| Lighthouse performance | >80 mobile score | ⏳ Phase 4 |
| WCAG 2.1 AA compliance | axe-core passes | ⏳ Phase 4 |

### 11.2 Known Limitations (v4.1.0)

| Limitation | Impact | Planned Fix |
|---|---|---|
| No iOS build | iPhone users cannot install | v3.2 (requires macOS + Apple Developer account) |
| ~~No cloud sync~~ | **Resolved** — cloud sync implemented | ✅ Complete (v4.1.0) |
| ~~No user accounts~~ | **Resolved** — auth implemented | ✅ Complete (v4.1.0) |
| ~~Bible API is KJV-only~~ | **Resolved** — 12 versions | ✅ Complete |
| No push notifications | Toggles exist but not functional | v3.2 (FCM for Android) |
| Hymn tunes limited to 54 | 947 hymns have no audio | v3.3 (expand to 100+) |
| Devotional content is static | No community comments | v4.0+ |
| ~~No automated testing~~ | **Resolved** — 61 unit tests | ✅ Complete (v4.1.0) |
| No WCAG compliance audit | Accessibility gaps possible | v3.3 Phase 4 |
| No A/B testing capability | Feature decisions unvalidated | v3.3 |

---

## 12. Timeline & Roadmap

### 12.1 Completed

| Version | Date | Features |
|---|---|---|
| v1.0 | Q1 2026 | Core MVP: tasks, prayer, diary, Bible reader |
| v2.0 | Q2 2026 | Settings, themes (5), light/dark mode, AI assistant, backup/restore |
| v2.0.1 | Q2 2026 | Bible Study Features: 12 versions, AI explanation, commentary, concordance, comparison; Faith Assistant polish: draggable FAB, AI Guide, plain-text responses |
| v3.1.0 | Q2 2026 | Hymns: 1,001 hymns with search, categories, favourites, daily hymn; Daily Devotional: 365 days with date auto-select, navigation, progress tracking |
| v3.1.0b | Q2 2026 | PWA service worker, draggable navigation tabs, hymn numbering, React error boundary, accessibility (ARIA/keyboard), code splitting, study button navigates to Bible, Web Audio autoplay gesture fix, hymn sort (A-Z/Z-A), numeric search |
| v4.1.0 | Q3 2026 | User auth (email + Google OAuth), cloud sync, PostgreSQL on Aiven, Pinecone RAG (54 Bible verses, 1024-dim embeddings), multi-LLM (GROQ/OpenAI/OpenRouter), freemium model, 61 unit tests, UI polish (tab visibility, nav layout) |

### 12.2 Planned

| Version | Target | Features | Effort | Dependencies | Acceptance Criteria | Priority |
|---|---|---|---|---|---|---|
| **v3.2** | **Q3 2026** | iOS build | 2–3 weeks | macOS build machine, Apple Developer account ($99/yr) | IPA builds on macOS; installs on iOS 15+; all features functional | P0 |
| | | User accounts (auth) | 3–4 weeks | Auth provider (Firebase Auth or Supabase Auth) | Email + Google sign-up/login; session persistence; logout; opt-in only | P0 |
| | | Cloud sync (optional) | 4–6 weeks | User accounts; database (Firebase Firestore or Supabase) | Data merges on login; conflict resolution (last-write-wins); offline queue; opt-in toggle | P0 |
| | | Push notifications (Android) | 1–2 weeks | Firebase Cloud Messaging (FCM) | Task reminders fire at scheduled time; verse-of-day fires daily; opt-out toggle | P1 |
| | | Hebrew/Greek interlinear Bible | 3–4 weeks | Interlinear data source (SWORD Project or similar) | Word-by-word interlinear for OT (Hebrew) and NT (Greek); toggleable | P1 |
| | | Unit test foundation (Phase 1) | 2–3 weeks | Vitest installed; test files created | Tests for getStreak, getGreeting, formatTime, loadState, searchHymns; 100% pass rate | P1 |
| **v3.3** | **Q4 2026** | Small group features | 4–6 weeks | User accounts; shared data model | Create/join group via invite code; shared prayer list; shared reading plan; max 50 members | P0 |
| | | Shared prayer requests | 2–3 weeks | Small group infrastructure | Post prayer request; group members see requests; mark as "prayed for" | P0 |
| | | Group reading plans | 2–3 weeks | Small group infrastructure | Leader creates plan; members follow along; progress visible to leader | P1 |
| | | Subscription billing (Stripe) | 2–3 weeks | Stripe account; user accounts | Free/Supporter/Ministry tiers; checkout flow; subscription management; webhooks | P1 |
| | | Hymn tune expansion (54 → 100+) | 2–3 weeks | Music notation research; Web Audio API tuning | 100+ hymn tunes with multi-octave piano/organ tones; all octave-corrected | P1 |
| | | Integration + E2E tests (Phase 2–3) | 2–3 weeks | MSW, Playwright installed | API integration tests; critical flow E2E tests | P2 |
| | | A/B testing framework | 1–2 weeks | localStorage-based variant assignment | Framework functional; first test (onboarding) ready to launch | P2 |
| **v4.0** | **Q1 2027** | Church directory | 3–4 weeks | User accounts; admin roles | Churches create profiles; members find nearby churches; directory searchable | P1 |
| | | Events calendar | 2–3 weeks | Church directory | Churches post events; members RSVP; calendar view | P1 |
| | | Sermon notes | 2–3 weeks | Bible reader integration | Structured notes per sermon; scripture references linked; exportable | P2 |
| | | AI sermon summariser | 2–3 weeks | AI infrastructure; sermon notes | Paste/upload sermon text; AI generates summary, key points, action items | P2 |
| | | Accessibility audit + Lighthouse CI (Phase 4) | 1–2 weeks | axe-core, Lighthouse CI | All views pass axe-core; Lighthouse >80 | P2 |

### 12.3 Roadmap Visualization

```
Q1 2026    Q2 2026    Q3 2026         Q4 2026           Q1 2027
  │          │          │                │                 │
  ▼          ▼          ▼                ▼                 ▼
 v1.0 ──── v3.1.0 ──── v4.1.0 ──────── v3.3 ──────────── v4.0
 MVP        Hymns       Auth + Sync      Small Groups      Church
            Devotional  Pinecone RAG     Prayer Sharing     Directory
            PWA         Multi-LLM        Reading Plans      Events
                        Freemium         Billing            Sermon Notes
                        PostgreSQL       Hymn Tunes (100+)  AI Summariser
                        61 Tests         E2E Tests          Accessibility
                                        A/B Testing
```

### 12.4 v3.2 Prioritization (Scheduling Risk Mitigation)

v3.2 contains 6 features totaling ~15–23 weeks of effort within a 13-week quarter. Features are prioritized:

| Feature | Priority | Weeks | Can Defer? | Rationale |
|---|---|---|---|---|
| User accounts (auth) | **P0** | 3–4 | No | Prerequisite for cloud sync; blocks v3.3 |
| Cloud sync (optional) | **P0** | 4–6 | No | Most requested feature; monetization enabler |
| iOS build | **P0** | 2–3 | No | Reaches 45% of mobile market; required for App Store |
| Unit test foundation | **P1** | 2–3 | Yes → v3.2.1 | Important but not user-facing |
| Push notifications | **P1** | 1–2 | Yes → v3.2.1 | Nice-to-have |
| Interlinear Bible | **P1** | 3–4 | Yes → v3.2.1 | Niche feature |

**Worst-case v3.2 (P0 only):** 9–13 weeks → fits Q3 2026
**Best-case v3.2 (all):** 15–23 weeks → may spill 1–2 weeks into Q4

**Decision:** Ship v3.2 with P0 features on time; defer P1 features to v3.2.1 if behind schedule.

---

## 13. Data Migration & Rollback Strategy

### 13.1 First-Time Sync Flow

```
User enables cloud sync
    → Prompt: "Sign in to sync data across devices"
    → Auth flow completes (email/Google)
    → Local data exported as JSON snapshot
    → Snapshot uploaded to cloud (first sync = full upload)
    → Cloud marked as "source of truth" for this user
    → Sync indicator shown in UI
```

### 13.2 Conflict Resolution

| Scenario | Resolution |
|---|---|
| Same entry edited on two devices | Last-write-wins (timestamp comparison) |
| Entry deleted on one device, edited on other | Delete wins (entry removed from both) |
| New entry on device A, new entry on device B | Both preserved (no conflict) |
| Settings changed on both devices | Last-write-wins per setting key |
| Cloud data newer than local | Cloud data wins; local updated |
| Local data newer than cloud | Local data wins; cloud updated |

### 13.3 Rollback Plan

| Failure | Response | Data Safety |
|---|---|---|
| Cloud sync API unreachable | Fall back to local-only mode; show "Sync unavailable" toast | All local data intact |
| Corrupted cloud data detected | Reject cloud data; keep local data as source of truth; notify user | Local data preserved |
| User disables cloud sync | Local data remains intact; cloud copy retained for 90 days | No data loss |
| User deletes account | Cloud data deleted within 30 days; local data unaffected | User retains device data |
| Migration from localStorage to cloud fails | Atomic operation: if upload fails, local data unchanged; retry on next app open | No partial state |
| Database corruption on server | Restore from last backup (hourly snapshots retained 7 days) | Maximum 1 hour data loss |

### 13.4 Data Backup Strategy

| Scope | Method | Frequency | Retention |
|---|---|---|---|
| User cloud data | Firebase/Supabase automatic backups | Hourly snapshots | 7 days |
| User local data | localStorage (device-resident) | Real-time | Until factory reset or uninstall |
| User export | Manual JSON download | On-demand | User-managed |
| Backend database | Vercel + database provider backups | Daily | 30 days |
| Source code | GitHub repository | Every commit | Permanent |

---

## 14. Future Considerations

Features **not yet planned for a specific release** but identified as potential future directions.

### 14.1 Customizable Feature Store

| Attribute | Detail |
|---|---|
| **What** | Admin-controlled toggle system enabling/disabling features per user segment, plan tier, or region |
| **Why** | Progressive feature rollout; A/B testing; plan-gating without code changes; regional customization |
| **Trade-off** | Architectural complexity; requires feature flag infrastructure |
| **Estimated Effort** | 3–4 weeks |
| **Prerequisite** | User accounts (v3.2); admin dashboard |
| **Status** | ❌ No coverage in any project document |

### 14.2 Multi-Church Devotional Support

| Attribute | Detail |
|---|---|
| **What** | Church-specific or denomination-specific devotional content, managed by church admins |
| **Why** | Churches want to publish their own devotionals; denomination-specific content |
| **Trade-off** | Requires CMS; multi-tenant data model; moderation pipeline |
| **Estimated Effort** | 6–8 weeks |
| **Prerequisite** | User accounts; admin roles; cloud infrastructure |
| **Status** | ❌ No coverage in any project document |

### 14.3 AI-Powered Theological Research with Source-Backed Responses

| Attribute | Detail |
|---|---|
| **What** | AI assistant that cites theologians, church fathers, catechisms, and published commentaries |
| **Why** | Users need trustworthy, verifiable theological guidance; current AI lacks attribution |
| **Trade-off** | Requires RAG with curated theological corpus; licensing; citation accuracy verification |
| **Estimated Effort** | 8–12 weeks |
| **Prerequisite** | AI infrastructure; theological content licensing; vector database |
| **Status** | ⚠️ AI Bible tools exist but lack source citations |

### 14.4 Gospel Music Streaming

| Attribute | Detail |
|---|---|
| **What** | Streaming integration for gospel music (Spotify, Apple Music, YouTube Music, or native catalog) |
| **Why** | Users want actual hymn recordings, not synthesized melodies; gospel genre broader than hymns |
| **Trade-off** | Licensing costs; bandwidth; copyright complexity; conflicts with offline-first |
| **Estimated Effort** | 6–10 weeks |
| **Prerequisite** | Music licensing agreements; streaming platform partnerships |
| **Status** | ❌ Hymn playback is synthesized, not streamed |

### 14.5 Foundation for Moderated Christian Community Forum

| Attribute | Detail |
|---|---|
| **What** | In-app community space for discussions, Q&A, prayer sharing, and testimony — with moderation |
| **Why** | Users want community connection; current app is individual; shared prayer (v3.3) is first step |
| **Trade-off** | Content moderation (human + AI); UGC policies; legal liability; contradicts privacy model |
| **Estimated Effort** | 12–16 weeks |
| **Prerequisite** | User accounts; content moderation policy; legal review |
| **Status** | ❌ Social features explicitly skipped in design phase |

### 14.6 Summary Table

| Improvement | PRD Coverage | Monetization Doc | Roadmap | Estimated Effort |
|---|---|---|---|---|
| User authentication | ✅ Covered (v3.2) | Mentioned | v3.2 | 3–4 weeks |
| Cloud storage & sync | ✅ Covered (v3.2) | ✅ Supporter tier | v3.2 | 4–6 weeks |
| Subscription billing | ✅ Covered (§4.4 + v3.3) | ✅ Detailed | v3.3 | 2–3 weeks |
| Customizable Feature Store | ❌ Missing | ❌ Missing | TBD | 3–4 weeks |
| Multi-church devotionals | ❌ Missing | ❌ Missing | TBD | 6–8 weeks |
| AI theological research | ⚠️ Partial (tools exist, no sources) | ❌ Missing | TBD | 8–12 weeks |
| Gospel music streaming | ❌ Missing | ❌ Missing | TBD | 6–10 weeks |
| Community forum | ❌ Missing | ❌ Missing | TBD | 12–16 weeks |

---

## 15. Risk Register

### 15.1 Product Risks

| ID | Risk | Probability | Impact | Mitigation | Owner | Status |
|---|---|---|---|---|---|---|
| R-01 | Slow user adoption | Medium | High | Church partnerships; GitHub visibility; word of mouth | Product | Active |
| R-02 | Low premium conversion (<5%) | Medium | High | Lower price; more premium features; A/B test pricing | Product | Planned (v3.3) |
| R-03 | High churn rate (>5%/month) | Medium | Medium | Improve onboarding; engagement features; email re-engagement | Product | Planned (v3.3) |
| R-04 | Competitor adds integrated faith + productivity | Low | High | Differentiate on privacy + offline-first; build community loyalty | Product | Active |
| R-05 | User feedback indicates feature gaps | Medium | Medium | GitHub Discussions monitoring; quarterly surveys | Product | Active |

### 15.2 Technical Risks

| ID | Risk | Probability | Impact | Mitigation | Owner | Status |
|---|---|---|---|---|---|---|
| R-06 | GROQ free tier discontinued or rate-limited | Medium | Medium | Diversify AI providers (OpenRouter, local models); cache aggressively | Engineering | Active |
| R-07 | localStorage quota exceeded (5-10 MB) | Low | Medium | Compress data; add purge-old-cache option; migrate to IndexedDB if needed | Engineering | Planned (v3.3) |
| R-08 | Vercel free tier limits hit | Medium | Low | Upgrade to Pro ($20/mo); affordable at scale | Engineering | Planned (v3.2) |
| R-09 | Cloud sync introduces data loss | Low | Critical | Atomic operations; rollback plan (§13); extensive testing | Engineering | Planned (v3.2) |
| R-10 | Capacitor iOS build compatibility issues | Medium | Medium | Test early on macOS; maintain Capacitor version; fallback to PWA | Engineering | Planned (v3.2) |
| R-11 | Bible API (bible-api.com) goes down | Low | Medium | GROQ fallback for all versions; chapter caching | Engineering | Active |
| R-12 | React 19 breaking changes | Low | Medium | Pin React version; test before upgrading; maintain compatibility layer | Engineering | Active |
| R-13 | Single-file SPA (App.jsx) becomes unmaintainable | Medium | Medium | Gradual component extraction; module boundaries; code splitting | Engineering | Active |

### 15.3 Business Risks

| ID | Risk | Probability | Impact | Mitigation | Owner | Status |
|---|---|---|---|---|---|---|
| R-14 | No revenue sustainability | High | Medium | Phase 2 monetization (v3.3); donations; church licensing | Product | Planned (v3.3) |
| R-15 | Open source clone appears | Low | Medium | Brand loyalty; premium features not in open source; community | Product | Active |
| R-16 | Theological bias accusations | Low | High | App is denomination-agnostic; AI prompts are inclusive; avoid doctrinal positions | Product | Active |
| R-17 | Data privacy breach (cloud sync) | Very Low | Critical | No user data stored on servers by default; audit-proof by design; encryption | Engineering | Planned (v3.2) |
| R-18 | Legal liability from AI-generated theological content | Low | High | Disclaimer: "AI responses are for reference, not theological advice"; avoid doctrinal claims | Legal | Active |

### 15.4 Operational Risks

| ID | Risk | Probability | Impact | Mitigation | Owner | Status |
|---|---|---|---|---|---|---|
| R-19 | macOS build machine unavailable | Low | Medium | CI/CD on GitHub Actions (macOS runner); maintain local build fallback | Engineering | Planned (v3.2) |
| R-20 | Apple Developer account issues | Low | High | Renew annually; maintain backup build process | Product | Planned (v3.2) |
| R-21 | GitHub repository compromised | Very Low | Critical | 2FA on all maintainer accounts; signed commits; branch protection | Engineering | Active |
| R-22 | Key maintainer leaves project | Low | Medium | Open source allows forks; document all processes; bus factor >1 | Product | Active |

---

## 16. Legal & Compliance

### 16.1 Privacy Policy Requirements

| Requirement | Implementation | Version |
|---|---|---|
| Clear data collection disclosure | Privacy policy page in app settings | v4.2.0 ✅ |
| No hidden data collection | Code audit confirms zero analytics/tracking SDKs | v4.2.0 ✅ |
| User data ownership statement | "All data is on your device; you own it completely" | v4.2.0 ✅ |
| Cloud sync data disclosure | "When you enable sync, your data is encrypted and stored on Aiven PostgreSQL" | v4.2.0 ✅ |
| Third-party API disclosure | "AI responses are generated by GROQ/OpenAI/OpenRouter; no conversation data is stored" | v4.2.0 ✅ |
| Right to deletion | Factory reset clears all local data; account deletion clears cloud data within 30 days | v4.2.0 ✅ |
| Data portability | JSON export includes all user data | v4.2.0 ✅ |

### 16.2 GDPR Compliance (EU Users)

| GDPR Requirement | Implementation | Status |
|---|---|---|
| Lawful basis for processing | Consent (opt-in for cloud sync); legitimate interest (local-only features) | ✅ Implemented |
| Right to access | JSON export includes all data | ✅ Implemented |
| Right to erasure | Factory reset + account deletion | ✅ Implemented |
| Right to rectification | Users can edit all entries | ✅ Implemented |
| Data minimization | Only collect what's necessary; no telemetry | ✅ Implemented |
| Privacy by design | localStorage-first; no server-side data by default | ✅ Implemented |
| Data Protection Impact Assessment | Documented in Data-Compliance.md | ✅ Documented |
| Cookie consent | Cookie Policy documented | ✅ Documented |

### 16.3 CCPA Compliance (California Users)

| CCPA Requirement | Implementation | Status |
|---|---|---|
| Right to know | Privacy policy disclosure | ✅ Implemented |
| Right to delete | Factory reset + account deletion | ✅ Implemented |
| Right to opt-out of sale | No data is sold; statement in privacy policy | ✅ Implemented |
| Non-discrimination | No service degradation for privacy choices | ✅ Implemented |

### 16.4 Legal Framework Documents

| Document | Version | Status | Location |
|---|---|---|---|
| Privacy Policy | 1.0.0 | ✅ Complete | docs/Privacy-Policy.md |
| Terms of Service | 1.0.0 | ✅ Complete | docs/Terms-of-Service.md |
| Terms of Use | 1.0.0 | ✅ Complete | docs/Terms-of-Use.md |
| Community Guidelines | 1.0.0 | ✅ Complete | docs/Community-Guidelines.md |
| Cookie Policy | 1.0.0 | ✅ Complete | docs/Cookie-Policy.md |
| Content Moderation Policy | 1.0.0 | ✅ Complete | docs/Content-Moderation-Policy.md |
| Acceptable Use Policy | 1.0.0 | ✅ Complete | docs/Acceptable-Use-Policy.md |
| Third-Party Services | 1.0.0 | ✅ Complete | docs/Third-Party-Services.md |
| Data Retention Policy | 1.0.0 | ✅ Complete | docs/Data-Retention-Policy.md |
| Incident Response Plan | 1.0.0 | ✅ Complete | docs/Incident-Response-Plan.md |
| Data Compliance | 1.0.0 | ✅ Complete | docs/Data-Compliance.md |
| Compliance Checklist | 1.0.0 | ✅ Complete | docs/Compliance-Checklist.md |
| Security Policy | 1.0.0 | ✅ Complete | docs/Security-Policy.md |
| Data Collection Disclosure | 1.0.0 | ✅ Complete | docs/Data-Collection-Disclosure.md |

### 16.5 In-App Legal Acceptance

| Feature | Implementation | Status |
|---|---|---|
| Legal acceptance screen | LegalScreen.jsx component with document viewer | ✅ Implemented |
| Required acceptance flow | After onboarding, before app use | ✅ Implemented |
| Checkbox acceptance | Privacy Policy, Terms of Service, Terms of Use required | ✅ Implemented |
| Settings Legal tab | View all documents in Settings > Legal | ✅ Implemented |
| Backend tracking | POST /api/auth/legal-accept endpoint | ✅ Implemented |
| Acceptance storage | localStorage + PostgreSQL user_data table | ✅ Implemented |
| Version tracking | Legal version tracked for re-acceptance on updates | ✅ Implemented |

### 16.6 Data Retention Policy

| Data Type | Retention Period | Deletion Method |
|---|---|---|
| Local user data (tasks, diary, prayer, settings) | Until user deletes or factory reset | Factory reset; app uninstall |
| Cloud sync data | Until user deletes account or disables sync | Account deletion → 30-day purge |
| AI chat history | 30 days (server-side); local until factory reset | Auto-purge; factory reset |
| Bible chapter cache | Until localStorage quota management | Auto-purge when quota >80% |
| Hymn favorites | Until user removes or factory reset | Factory reset |
| Legal acceptance records | Until account deletion | Account deletion |
| Backend logs (Vercel) | 24 hours (free tier) | Automatic Vercel cleanup |

### 16.7 Security Audit Schedule

| Audit Type | Frequency | Scope | Responsibility |
|---|---|---|---|
| Code security review | Per major release | All source code for vulnerabilities, secrets, injection risks | Engineering |
| Dependency audit | Monthly | npm audit; check for known vulnerabilities in React, Vite, Capacitor | Engineering |
| API security review | Quarterly | Backend endpoints, CORS, rate limiting, input validation | Engineering |
| Penetration testing | Annually | Full app (web + APK) | External contractor (when budget allows) |
| Privacy audit | Per major release | Data flow analysis, GDPR compliance, third-party sharing | Product + Legal |
| APK security scan | Per release | Check for embedded secrets, certificate validity | Engineering |

---

## 17. Scalability & Infrastructure

### 17.1 Current Infrastructure

| Component | Provider | Tier | Capacity | Cost |
|---|---|---|---|---|
| Web frontend hosting | Vercel | Hobby | 100 GB bandwidth/mo | $0 |
| Backend API | Vercel Serverless | Hobby | 100K invocations/mo | $0 |
| AI API | GROQ | Free tier | 10K requests/day | $0 |
| Bible API | bible-api.com | Free | No documented limit | $0 |
| Source code | GitHub | Public | Unlimited | $0 |
| APK distribution | GitHub Releases | Free | 2 GB storage | $0 |
| **Total** | | | | **$0/mo** |

### 17.2 Scaling Triggers & Actions

| Trigger | Threshold | Action | Timeline |
|---|---|---|---|
| Vercel bandwidth exceeds 100 GB/mo | 80% utilization | Upgrade to Vercel Pro ($20/mo) | Immediate |
| GROQ free tier exhausted regularly | >8K requests/day sustained | Upgrade to GROQ paid tier or diversify providers | Within 1 week |
| Vercel serverless exceeds 100K invocations/mo | 80% utilization | Upgrade to Vercel Pro; optimize function cold starts | Within 1 week |
| User base exceeds 5,000 DAU | Measured via localStorage analytics | Migrate backend to dedicated server (Railway/Render) | Within 1 month |
| User base exceeds 25,000 DAU | Measured via localStorage analytics | Add CDN (Cloudflare); database scaling; monitoring | Within 1 month |
| Global user base (non-English) exceeds 20% | Measured via language setting | Add i18n infrastructure; community translation pipeline | Within 3 months |

### 17.3 Infrastructure Cost Projections

| User Scale | Monthly Cost | Revenue Required | Break-Even |
|---|---|---|---|
| <1,000 DAU | $0 | $0 | Already break-even |
| 1,000–5,000 DAU | $20–50 | $20–50 | ~7–17 paying subscribers |
| 5,000–25,000 DAU | $130–300 | $130–300 | ~43–100 paying subscribers |
| 25,000–100,000 DAU | $800–2,000 | $800–2,000 | ~267–667 paying subscribers |

### 17.4 Disaster Recovery

| Scenario | RTO (Recovery Time Objective) | RPO (Recovery Point Objective) | Recovery Steps |
|---|---|---|---|
| Vercel outage | 0 (CDN failover automatic) | 0 | Vercel handles; no action needed |
| Vercel account compromise | 4 hours | 24 hours | Revoke access; redeploy from GitHub; restore database backup |
| GROQ API outage | 0 (graceful degradation) | 0 | App shows "AI unavailable" toast; all offline features work |
| bible-api.com outage | 0 (cached chapters work) | 0 | GROQ fallback for new chapters; cached chapters unaffected |
| Database corruption (cloud) | 2 hours | 1 hour | Restore from hourly backup; notify affected users |
| GitHub repository deleted | 4 hours | 0 (every commit is a backup) | Restore from fork or local clone; re-push |
| Total data loss (user device) | N/A | N/A | User restores from JSON export backup |
| Key maintainer unavailable | 1 week | N/A | Open source allows community fork; documented processes |

### 17.5 Monitoring & Alerting

| Metric | Tool | Alert Threshold | Response |
|---|---|---|---|
| API error rate | Vercel function logs | >5% error rate in 5 min | Investigate backend; check GROQ status |
| Response time | Vercel analytics | >3s p95 response time | Optimize function; check cold starts |
| Uptime | External monitor (UptimeRobot) | >1 min downtime | Check Vercel status; deploy rollback if needed |
| Storage quota | Browser console logging | >80% of 5 MB localStorage | Prompt user to export + purge old data |
| Build failure | GitHub Actions | Any push to main fails | Fix build; block releases until green |

---

## 18. Content Strategy

### 18.1 Content Inventory

| Content Type | Count | Source | Update Frequency | Size |
|---|---|---|---|---|
| Bible chapters | 1,189 (66 books) | bible-api.com (KJV) + GROQ (11 versions) | Static (canonical text) | ~10 KB/chapter cached |
| Hymns | 1,001 | Curated public domain hymnal | Static (curated) | 408 KB chunk |
| Hymn tunes | 54 (→ 100+ v3.3) | Web Audio API synthesis | Static (curated) | 10.5 KB chunk |
| Devotionals | 365 | Curated daily devotionals | Static (curated) | 315 KB chunk |
| Daily verses | 12 | Curated Bible verses | Static (curated) | <1 KB |
| Daily prayers | 5 | Curated prayer texts | Static (curated) | <1 KB |
| Study suggestions | 7 | Curated Bible reading plans | Static (curated) | <1 KB |
| AI system prompts | 4 | Written by product team | Updated per version | <1 KB each |

### 18.2 Content Quality Standards

| Standard | Requirement | Verification |
|---|---|---|
| Theological accuracy | All Bible text matches published translations | Cross-reference with bible-api.com / GROQ output |
| Hymn accuracy | Lyrics match public domain hymnals (e.g., Hymnary.org) | Content audit against source |
| Devotional quality | Each entry has: Bible verse, reflection (200–500 words), prayer (50–100 words) | Content audit |
| Inclusivity | No denominational bias; inclusive language; multi-tradition appeal | Theological review |
| Accessibility | All content readable at 13px font; high contrast in both themes | Visual inspection |
| Offline availability | All bundled content works without internet | Airplane mode test |

### 18.3 Content Update Process

| Content Type | Update Trigger | Process | Version |
|---|---|---|---|
| Bible text | Translation correction needed | Update GROQ system prompt; invalidate cache | Any |
| Hymns | New hymns identified | Add to `hymns.js`; rebuild chunk; test | v3.2+ |
| Hymn tunes | New tunes composed/identified | Add to `hymnFallbackTunes.js` + `hymn_tunes.py`; test audio | v3.3 |
| Devotionals | New year content needed | Add to `devotional.js`; rebuild chunk | Annual |
| AI prompts | Response quality issues | Update system prompts in backend; test | Any |
| Study suggestions | New plans identified | Update `STUDY_SUGGESTIONS` constant in App.jsx | Any |

### 18.4 User-Generated Content (Future)

When community features ship (v4.0+), the following content moderation pipeline will be implemented:

| Content Type | Moderation | Automation | Human Review |
|---|---|---|---|
| Church directory profiles | Admin approval required | Profanity filter | Spot-check weekly |
| Forum posts | Pre-publish filter | AI toxicity detection + profanity filter | Report-based review |
| Prayer requests (groups) | Group leader approval | Profanity filter | Leader-mediated |
| Study notes (future) | No pre-publish filter | AI quality scoring | Report-based review |

---

## 19. Onboarding & User Experience

### 19.1 Current Onboarding (v3.1.0)

The app currently has a **4-step onboarding walkthrough** triggered on first visit:

| Step | Content | Purpose |
|---|---|---|
| 1 | "Welcome to BelieversFlow" + app description | Set expectations |
| 2 | "Plan your day with faith" + task categories | Introduce task + spiritual integration |
| 3 | "Track your prayer life" + streak feature | Introduce habit formation |
| 4 | "Read God's Word" + Bible reader | Introduce scripture engagement |

**Current Issues:**
- No skip option (must complete all 4 steps)
- No "replay onboarding" option in settings
- No personalized first-run content (same for all personas)

### 19.2 Planned Onboarding Improvements

| Improvement | Version | Effort | Impact |
|---|---|---|---|
| Add "Skip" button to onboarding | v3.2 | 0.5 weeks | Reduces friction for returning users |
| Add "Replay Onboarding" in Settings | v3.2 | 0.5 weeks | Helps users discover missed features |
| Personalized first-run based on persona detection | v3.3 | 2–3 weeks | Tailors experience; increases engagement |
| Add interactive tutorial (tap-through guided tour) | v3.3 | 2–3 weeks | Better learning than static slides |
| Add "What's New" modal after updates | v3.3 | 1 week | Drives adoption of new features |

### 19.3 Key UX Flows

| Flow | Entry Point | Steps | Target Time |
|---|---|---|---|
| Add first task | Tasks view → input → Enter | 2 taps | <5 seconds |
| Log prayer | Spiritual view → "Log Prayer" → Enter minutes → Save | 3 taps | <10 seconds |
| Read Bible | Bible view → Select book → Select chapter → Read | 3 taps | <10 seconds |
| Write diary | Diary view → "New Entry" → Write → Select mood → Save | 4 taps | <30 seconds |
| Ask AI question | FAB → AI Chat → Type → Send | 3 taps | <15 seconds |
| Back up data | Settings → Backup → Export → Download | 3 taps | <10 seconds |
| Change theme | Settings → Appearance → Theme → Select | 3 taps | <5 seconds |

### 19.4 UX Success Metrics

| Metric | Target | Measurement |
|---|---|---|
| Time to first task | <30 seconds from first open | Onboarding completion + first task timestamp |
| Onboarding completion rate | >80% | Onboarding state persistence |
| Feature discovery rate | >60% of users use 3+ features in first week | localStorage feature usage flags |
| Settings engagement | >40% of users customize at least one setting | localStorage settings changes |
| Backup adoption | >20% of users export backup within first month | localStorage export timestamp |

---

## 20. API Strategy

### 20.1 Backend API Versioning

| Aspect | Decision |
|---|---|
| **Current version** | Unversioned (all endpoints at `/api/*`) |
| **Versioning strategy** | URL-based versioning when breaking changes are introduced: `/api/v1/*`, `/api/v2/*` |
| **Breaking change definition** | Any change that modifies request/response schema, removes endpoints, or changes authentication requirements |
| **Non-breaking changes** | Adding new endpoints, adding optional fields to responses, adding optional query parameters |
| **Deprecation policy** | 6-month notice before removing a version; `Sunset` header added to deprecated endpoints |
| **Version support** | Maximum 2 versions supported simultaneously |

### 20.2 API Endpoint Inventory

| Method | Path | Purpose | Rate Limit | Auth Required |
|---|---|---|---|---|
| GET | `/api/health` | Health check + GROQ status | None | No |
| GET | `/api/bible/versions` | List 12 translations | None | No |
| GET | `/api/bible?book=&chapter=&version=` | Fetch chapter text | Per request | No |
| POST | `/api/chat` | AI faith chat | 6 msg context | No (v3.1) / Optional (v3.2) |
| POST | `/api/bible/explain` | Verse explanation | Per request | No |
| POST | `/api/bible/commentary` | Chapter commentary | Per request | No |
| POST | `/api/bible/concordance` | Scripture search | Per request | No |
| POST | `/api/bible/compare` | Translation comparison | Per request | No |
| POST | `/api/hymns/explain` | Hymn background | Per request | No |
| POST | `/api/hymns/help` | Hymn Q&A | Per request | No |
| GET | `/api/hymns/tune/{id}` | Hymn melody data | Per request | No |
| POST | `/api/devotional/generate` | Custom devotional | Per request | No |

### 20.3 API Response Standards

| Standard | Requirement |
|---|---|
| Content-Type | `application/json` for all responses |
| Error format | `{"error": "message", "code": "ERROR_CODE"}` |
| Success format | `{"data": ...}` or direct payload for simple endpoints |
| CORS | `Access-Control-Allow-Origin: *` (public API) |
| Rate limiting | Per-IP rate limiting when abuse detected (future) |
| Cache headers | `Cache-Control: max-age=3600` for static content (bible versions) |

### 20.4 API Deprecation Process

```
1. Deprecation decision made
    → Add "Sunset" header to affected endpoints
    → Add deprecation notice to /api/health response
    → Create GitHub issue documenting change

2. 6-month deprecation period
    → New version deployed alongside old version
    → Old version returns deprecation warning header
    → Monitor usage of old version endpoints

3. Removal
    → Old version endpoints removed
    → /api/health updated to reflect current version
    → Migration guide published in GitHub Discussions
```

### 20.5 Future API Additions

| Endpoint | Version | Purpose | Dependencies |
|---|---|---|---|
| `POST /api/auth/register` | v3.2 | User registration | Auth provider |
| `POST /api/auth/login` | v3.2 | User login | Auth provider |
| `GET /api/sync/data` | v3.2 | Pull cloud data | Auth + database |
| `POST /api/sync/data` | v3.2 | Push local data | Auth + database |
| `POST /api/groups/create` | v3.3 | Create small group | Auth + database |
| `POST /api/groups/join` | v3.3 | Join group via invite code | Auth + database |
| `GET /api/groups/{id}/prayers` | v3.3 | Shared prayer list | Auth + group membership |
| `POST /api/billing/checkout` | v3.3 | Stripe checkout session | Auth + Stripe |
| `GET /api/billing/subscription` | v3.3 | Current subscription status | Auth + Stripe |
| `POST /api/billing/webhook` | v3.3 | Stripe webhook handler | Stripe |

---

## 21. Open Source & Community

### 21.1 Repository Configuration

| Aspect | Current | Planned |
|---|---|---|
| License | Open source (GitHub public) | Add explicit LICENSE file (MIT or Apache 2.0) |
| Branch protection | Not configured | Protect `main` branch; require PR reviews |
| Contributing guidelines | Not documented | Add CONTRIBUTING.md with setup, style, PR process |
| Code of Conduct | Not documented | Add CODE_OF_CONDUCT.md |
| Issue templates | Not configured | Add bug report + feature request templates |
| PR template | Not configured | Add PR template with checklist |
| CI/CD | Not configured | Add GitHub Actions for lint + build on push |

### 21.2 Community Engagement Plan

| Initiative | Description | Timeline | Owner |
|---|---|---|---|
| GitHub Discussions | Feature requests, bug reports, community support | Active (exists) | Product |
| Public roadmap | Transparency about upcoming features | v3.2 (add ROADMAP.md) | Product |
| Contributor guidelines | Welcoming open source contributions | v3.2 (add CONTRIBUTING.md) | Engineering |
| Beta testing group | Early access to new versions | v3.3 (Discord/Telegram group) | Product |
| Release notes | Detailed changelog for each version | Per release (GitHub Releases) | Engineering |
| Church partnership program | Free deployment guide for churches | v3.3 | Product |
| Developer documentation | API docs, architecture guide, setup instructions | v3.3 (add docs/) | Engineering |

### 21.3 Contribution Workflow

```
1. Contributor finds issue or proposes feature
    → Opens GitHub Issue with template
    → Community discussion + maintainer triage

2. Contributor forks repo
    → Creates feature branch from main
    → Follows CONTRIBUTING.md guidelines
    → Writes tests for new functionality
    → Opens Pull Request

3. PR review
    → At least 1 maintainer approval required
    → CI passes (lint + build + tests)
    → No merge conflicts

4. Merge
    → Squash merge to main
    → Release notes updated
    → Contributor credited in CHANGELOG.md
```

### 21.4 Licensing Strategy

| Decision | Rationale |
|---|---|
| **License type** | MIT (permissive; maximum adoption) |
| **APK distribution** | GitHub Releases (free; no app store fees) |
| **Content licensing** | Hymns: public domain; Devotionals: original content (copyright BelieversFlow) |
| **AI-generated content** | Not copyrightable; users can freely use AI responses |
| **Trademark** | "BelieversFlow" name and logo are not open source; use requires permission |
| **Patent** | No patents filed; defensive patent pledge if needed |

---

## 22. Appendices

### 22.1 Glossary

| Term | Definition |
|---|---|
| **P0** | Critical — must-have for release |
| **P1** | Important — should have |
| **P2** | Nice-to-have — future |
| **DAU** | Daily Active Users |
| **MAU** | Monthly Active Users |
| **SPA** | Single Page Application |
| **GROQ** | AI inference provider (llama-3.3-70b-versatile) |
| **RAG** | Retrieval-Augmented Generation — AI technique that retrieves from a knowledge base before generating |
| **FCM** | Firebase Cloud Messaging — Android push notification service |
| **APNs** | Apple Push Notification service — iOS push notification service |
| **SWORD** | Cross-platform Bible software library with 200+ texts |
| **MSW** | Mock Service Worker — API mocking for integration tests |
| **Stripe** | Payment processing platform for subscription billing |
| **WCAG** | Web Content Accessibility Guidelines — W3C accessibility standard |
| **GDPR** | General Data Protection Regulation — EU privacy law |
| **CCPA** | California Consumer Privacy Act — California privacy law |
| **RTO** | Recovery Time Objective — maximum acceptable downtime |
| **RPO** | Recovery Point Objective — maximum acceptable data loss |
| **ARIA** | Accessible Rich Internet Applications — accessibility attributes |
| **DPIA** | Data Protection Impact Assessment — GDPR requirement |

### 22.2 References

| Document | Location | Purpose |
|---|---|---|
| Web App | https://believers-flow-frontend.vercel.app | Live frontend |
| GitHub | https://github.com/ecoinboxhub/believers_flow | Source code |
| Backend API | https://christian-task-manager.vercel.app | Live API |
| Backend Health | https://christian-task-manager.vercel.app/api/health | Health check |
| Status | `status.md` | Implementation status |
| Architecture | `architecture.md` | System architecture |
| SWR (SRS) | `pitch/SWR.md` | Technical specifications |
| User Personas | `pitch/user_persona.md` | Detailed personas |
| Monetization | `pitch/monetization.md` | Pricing & financials |
| Design Thinking | `pitch/Design_thinking.md` | Design process |

### 22.3 Document Metrics

| Metric | Value |
|---|---|
| Total sections | 22 |
| Total functional requirements | 50 (44 current + 6 planned) |
| Total non-functional requirements | 34 |
| Total user stories | 42 (34 current + 8 planned) |
| Total risks identified | 22 |
| Total API endpoints | 12 (current) + 10 (planned) |
| Estimated total effort (all planned features) | 45–70 weeks |
| Last updated | July 3, 2026 |

---

*End of Product Requirements Document. For technical implementation details, see `pitch/SWR.md`. For business context, see `pitch/monetization.md`.*
