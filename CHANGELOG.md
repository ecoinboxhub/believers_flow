# Changelog

All notable changes to BelieversFlow will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [4.23.0] - 2026-08-19

### Removed
- **Young's Literal Translation (YLT) no longer listed or selectable**: the upstream bible-api.com source only serves the New Testament for YLT, so Old Testament chapters returned HTTP 404. The translation was removed from the frontend selectors, backend version registry, and compare defaults.
- **Church devotionals with no viewable content removed**: the app now ships only the ten churches with full, readable content — Dunamis, RCCG Open Heaven, MFM, Deeper Life, Rhapsody of Realities, FCS, Food for the Day, Daily Manna, Winners Chapel, and CAC. Churches that previously showed "Content not available" (Our Daily Bread, David Jeremiah, In Touch, Joel Osteen, TREM, Joyce Meyer, Billy Graham, Joseph Prince, CDR, Kenneth Copeland) were removed from the app and the devotional API.

### Changed
- **Devotional scripture references open the Bible**: tapping a devotional's verse reference (e.g. "John 3:16") now opens that passage in the app's Bible reader.
- **Header greeting is center-aligned** on mobile.

## [4.22.0] - 2026-08-15

### Fixed
- **Music > Spotify Christian shows only working playlists**: removed the "Best Worship Songs" and "Deep Worship" playlists, whose Spotify embed IDs no longer exist and displayed a "Page not available / Something went wrong" error. The tab now shows six playlists (Top Christian Hits, Top Christian Worship, Top 50 Christian Songs, New Christian Music, Christian Hits, Alabanzas Cristianas), all verified to load, and search filtering still covers worship, praise, gospel, and more.

## [4.21.0] - 2026-08-15

### Fixed
- **Settings > Legal always returns to the app**: the "Review All Legal Documents" list overlay now has a visible **Done** button, and the legal document detail view in Settings now has a **Close & Return to App** action. Users can consistently go back into the app from every entry point in the Legal feature (list view, any individual document opened from Settings, or the Review All screen), including on mobile full-screen views where the outside-tap escape was unavailable.

## [4.20.0] - 2026-08-15

### Changed

- **Legal documents reformatted**: all fourteen legal documents (Privacy Policy, Terms of Service, Terms of Use, Community Guidelines, Data Collection Disclosure, Security Policy, Cookie Policy, Content Moderation Policy, Acceptable Use Policy, Third-Party Services, Data Retention Policy, Incident Response Plan, Data Compliance, and Compliance Checklist) are now presented as clearly structured, natural-language sections with headings, bullet lists, and highlighted key terms instead of raw plain text.
- **Legal overlay improved**: the "Terms and Privacy" review screen and individual document views now render as a proper full-screen overlay with a styled panel, header, effective-date/version meta line, scrollable document body, and Back/Close controls.
- **Settings > Legal responsive**: legal document entries now respond on tap/hover (pointer cursor, highlight, lift, and arrow slide), and the Legal Acceptance Status badges are color-coded (green when accepted, red when not) with a prominent full-width "Review All Legal Documents" button.

## [4.19.0] - 2026-08-15

### Fixed

- **First-run legal gate removed**: the full-screen "Terms and Privacy" overlay no longer appears automatically after onboarding, so first-time users go straight into the app.
- **Privacy Policy in Settings**: Settings > Legal > Privacy Policy now opens the full policy document directly (with Back to the full legal list) instead of landing on the generic legal checklist.

## [4.16.0] - 2026-08-09

### Added

- **No account required**: the app now works fully without signing up or logging in. Bible study tools that were previously account-locked are free for guests:
  - **Commentary** (public-domain) - `/api/bible/commentary`
  - **Concordance** search - `/api/bible/concordance`
  - **Notes assist** - `/api/bible/notes-assist`
  - **Interlinear** Hebrew/Greek word-by-word analysis - `/api/interlinear/*`
  - **Compare** multiple translations - `/api/bible/compare`
- Sync/backup, push notifications, and payment remain optional account features accessed from Settings for users who want them.

### Changed

- Frontend: removed the six "sign in to unlock" (premium) guards across the Bible study tab so a guest can tap Commentary, Concordance, Dictionary, Compare, Interlinear, and Notes Assist directly.
- Backend: the five above endpoint families now accept guest (optional) auth instead of requiring a valid token.

## [4.15.1] - 2026-08-08

### Fixed

- **Faith Assistant API URL on Android**: app builds produced by CI (the downloadable `BelieversFlow.apk`) had a blank `VITE_API_URL`, so every API call in the WebView resolved to `https://localhost/api/...` and failed — surfacing as "empty response". Production values are now committed to `frontend/.env.production` and the build no longer overrides them with unset CI secrets. The APK now talks to the real backend (`https://believers-flow.onrender.com`).

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

## [4.15.0] - 2026-08-08

### Fixed

- **Faith Assistant "empty response" on mobile**: the PWA service worker's catch-all fetch handler was silently returning the app's HTML shell (HTTP 200) whenever any network request failed — including `/api/chat`. The assistant then parsed the HTML as JSON, failed, and reported "empty response". The service worker now only falls back to the app shell for page (navigation) requests; API requests propagate real failures so the assistant shows an honest message.
- **Backend AI empty-content guard**: the chat/LLM helpers now treat missing or blank model content as a failure, retry once, and return a clear 502 instead of ever serializing `{"message": null}`.
- **Assistant blank-message handling**: the Faith Assistant now treats an empty/blank model reply as a problem and surfaces a clear retry message rather than a blank bubble.

## [4.14.0] - 2026-08-08

### Fixed

- **Music playback honesty**: no app-side timer ever caps playback. Live Praise radio streams play continuously; Boom song results play the actual Apple Music preview sample with a timeline matching the real sample length. "Full" shows the complete track length; nothing artificially cuts a track short.
- **Time display toggle**: track progress now shows elapsed or remaining time (toggle button, render-only — never restarts or seeks playback). Live streams show a `LIVE` badge with a live elapsed indicator instead of a fake duration.
- **AI mobile chat error states**: the Faith Assistant now reports typed errors (session expired, assistant busy, service unavailable, network) instead of a single generic message.
- **Embedded player fallback**: Boom station player timeout increased, and the fallback message honestly states when a provider does not permit embedded playback from the location.

### Added

- `stopActiveAudio()` module helper so switching music tabs (or leaving the Music view) pauses any active stream/preview and prevents overlapping players.
- Unit tests for the time toggle, live indicator, honest preview/full labeling, and tab-switch playback protection.

## [4.13.0] - 2026-08-08

### Fixed

- **`/api/chat` connectivity**: the Faith Assistant and diary reflection requests now target `VITE_API_URL` (absolute URL), matching how the rest of the app reaches the backend inside the Capacitor app.
- **AI explain/reflection parsing**: tolerant JSON extraction (`_extract_json_object`) handles markdown fences and incidental prose; diary reflection and Bible explain now request JSON output from the LLM and parse it robustly.
- **OpenRouter model**: replaced the removed `:free` slug with the working `meta-llama/llama-3.3-70b-instruct` model.
- **Music progress**: live radio streams no longer show a misleading full-duration timeline; embedded players gained a retry fallback.
- **Guest AI**: backend endpoints use optional auth so guests can chat and get verse explanations without signing in.

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
