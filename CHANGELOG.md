# Changelog

All notable changes to BelieversFlow will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [4.12.0] - 2026-08-08

### Fixed

- **Native task reminders on Android**: task alarms now fire with audio even when the app is backgrounded or closed. Added the Capacitor Local Notifications plugin with a high-importance alarm channel, custom `alarm.ogg` sound, notification icon, runtime `POST_NOTIFICATIONS` permission request, exact-alarm scheduling (`SCHEDULE_EXACT_ALARM`), and automatic rescheduling after device reboot.
- **Bible Read/Explain pipeline**: chapter fetches and all Bible study API calls (explain, commentary, concordance, dictionary, compare, interlinear) now target `VITE_API_URL`, fixing them inside the Capacitor app where relative `/api` URLs cannot reach the backend.
- **AI responses for guests**: guests can now use the Faith Assistant chat and Bible verse explanations without signing in; the backend `/api/bible/explain` endpoint now accepts guest (optional) auth.
- **Boom Christian layout**: result cards wrap cleanly on narrow screens — cover and info on one row, playback controls on a dedicated row below, no horizontal overflow.
- **Bottom navigation**: trimmed to five primary items (Tasks, Faith, Diary, Bible, Music) with the overflow drawer ("More") preserving access to all other features including Settings.

### Added

- Native reminder scheduling, cancellation, and reconciliation logic (`nativeReminders.js`) with stable 32-bit notification ids and `allowWhileIdle` Doze support.
- Hardened reminder time/date validation (rejects out-of-range hours, minutes, seconds, months, and days).
- Unit and source-contract tests for reminder scheduling and native integration (`taskReminders.test.js`).

## [Unreleased]

### Added

- Comprehensive `.gitignore` covering all project technologies
- `.editorconfig` for consistent code formatting across editors
- `.gitattributes` for line ending normalization and binary file handling
- `PROJECT_STRUCTURE.md` — detailed documentation of every directory and file
- `DEVELOPMENT_GUIDE.md` — complete development workflow documentation
- `.github/ISSUE_TEMPLATE/` — bug report, feature request, and documentation issue templates
- `.github/PULL_REQUEST_TEMPLATE.md` — standardized PR template with checklist
- `.github/CODEOWNERS` — code ownership rules for review assignments
- `.github/dependabot.yml` — automated dependency updates (npm, pip, GitHub Actions)

### Changed

- Rewrote `README.md` with enterprise-grade documentation, table of contents, and comprehensive feature/API reference
- Rewrote `CONTRIBUTING.md` with detailed contribution guidelines, branch strategy, commit conventions, and PR process
- Updated backend `.env.example` with all 40+ environment variables

### Improved

- Repository organization with standardized configuration files
- Developer onboarding experience with comprehensive documentation
- PR and issue templates for consistent contribution workflow
- Dependency management with Dependabot automation

## [4.1.0] - 2026-07-17

### Added

- Diary encouragement feature with mood-specific Bible verses
- 60 new E2E tests for diary encouragement
- Signed release APK with production keystore
- Dual-mode signing config (environment variables OR properties file)
- ViewSwitcher component for responsive preview
- 72 UI screenshots across 3 viewports and 3 themes
- Feature parity report (Web PWA vs Android APK)
- Lighthouse audit report
- Production readiness report

### Fixed

- VersionSelector dropdown clipping (overflow:hidden)
- CSS slideUp animation duplicate
- Timezone handling with `Intl.DateTimeFormat.formatToParts()`
- Mobile navigation selectors for E2E tests
- Smoke test logo detection

### Changed

- All decorative emojis replaced with inline SVG icons
- Music module navigation (hymns to music)
- Build configuration: `minifyEnabled` and `shrinkResources` enabled
- ProGuard rules for APK optimization

## [4.0.0] - 2026-07-01

### Added

- Music module with 5 sections (Hymns, Praise & Worship, Spotify, Boom, YouTube)
- Church devotionals from 21 pastors
- Community features (Groups, Church, Events, Sermons, Forum)
- Prayer Analytics
- AI Faith Assistant with RAG
- Cloud sync service
- Push notifications (VAPID)
- 14 legal compliance documents
- Premium features (PremiumGate)
- Onboarding flow
- Welcome screen
- Complete responsive navigation system
- 3 theme modes (Dark, Light, Grey)
- 5 color themes
- PWA with service worker

---

*This changelog follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) format.*
