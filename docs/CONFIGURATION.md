# Configuration Reference

> BelieversFlow — Complete reference for all environment variables, build settings, theming, navigation, and Bible configuration.

---

## Table of Contents

1. [Environment Variables](#environment-variables)
2. [Build Configuration](#build-configuration)
3. [Android Configuration](#android-configuration)
4. [PWA Configuration](#pwa-configuration)
5. [Theming Configuration](#theming-configuration)
6. [Navigation Configuration](#navigation-configuration)
7. [Bible Configuration](#bible-configuration)

---

## Environment Variables

### Frontend (Vite)

These variables are embedded in the client bundle at build time. They must be prefixed with `VITE_` to be exposed by Vite.

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `VITE_API_URL` | No | `""` (empty) | Backend API base URL. When empty, the frontend calls GROQ directly from the browser. Set to your Vercel deployment URL when the backend is deployed. |
| `VITE_GROQ_API_KEY` | No | — | GROQ API key for the AI Believer Tips feature. Get a free key at https://console.groq.com/keys. |
| `VITE_GOOGLE_CLIENT_ID` | No | — | Google OAuth 2.0 client ID. This is a public identifier and is safe to embed in the client bundle. Obtain from https://console.cloud.google.com/apis/credentials. |

### Backend

Backend environment variables are read via `os.environ` (Python). The `.env.example` file in `backend/` documents all available variables.

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `DATABASE_URL` | Yes | — | PostgreSQL connection string. Format: `postgres://user:password@host:port/dbname?sslmode=require` |
| `JWT_SECRET_KEY` | Yes | — | Secret key for signing JWT tokens. Generate with: `python -c "import secrets; print(secrets.token_urlsafe(64))"` |
| `GOOGLE_CLIENT_ID` | No | — | Google OAuth client ID (for backend token verification). |
| `GOOGLE_CLIENT_SECRET` | No | — | Google OAuth client secret. |
| `GROQ_API_KEY` | No | — | GROQ API key for AI features (backend-side). |
| `OPENAI_API_KEY` | No | — | OpenAI API key for AI features. |
| `OPENROUTER_API_KEY` | No | — | OpenRouter API key for AI features. |
| `PINECONE_API_KEY` | No | — | Pinecone API key for RAG features. |
| `PINECONE_INDEX` | No | `believersflow` | Pinecone index name. |
| `PINECONE_HOST` | No | — | Pinecone host URL. |
| `ALLOWED_ORIGINS` | No | — | Comma-separated list of allowed CORS origins for production (e.g., `https://your-domain.com,https://www.your-domain.com`). |
| `RATE_LIMIT_PER_MINUTE` | No | `60` | Global API rate limit in requests per minute. |
| `REDIS_URL` | No | — | Redis connection URL for distributed rate limiting, brute-force protection, and caching (e.g., `redis://localhost:6379`). |
| `DB_POOL_MIN` | No | `5` | Minimum database connection pool size. |
| `DB_POOL_MAX` | No | `50` | Maximum database connection pool size. |
| `DB_COMMAND_TIMEOUT` | No | `30` | Database command timeout in seconds. |
| `SMTP_HOST` | No | `smtp.gmail.com` | SMTP server host for email features (password reset, verification). |
| `SMTP_PORT` | No | `587` | SMTP server port. |
| `SMTP_USER` | No | — | SMTP username. |
| `SMTP_PASSWORD` | No | — | SMTP password. |
| `SMTP_FROM` | No | `noreply@believersflow.app` | Sender email address. |
| `FLUTTERWAVE_SECRET_KEY` | No | — | Flutterwave payment secret key. |
| `FLUTTERWAVE_PUBLIC_KEY` | No | — | Flutterwave payment public key. |
| `FLUTTERWAVE_WEBHOOK_SECRET` | No | — | Flutterwave webhook verification secret. |
| `APP_ENV` | No | `development` | Application environment (`development` or `production`). |
| `LOG_FORMAT` | No | `text` | Log output format (`text` or `json`). |
| `LOG_LEVEL` | No | `INFO` | Python logging level. |

### Android (Gradle / Environment)

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `KEYSTORE_PASSWORD` | Production | — | APK signing keystore password. Read in `android/app/build.gradle` via `System.getenv()`. |
| `KEYSTORE_ALIAS_PASSWORD` | Production | — | APK signing key alias password. Falls back to `KEYSTORE_PASSWORD` if not set. |

---

## Build Configuration

### Vite (`vite.config.js`)

```javascript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      strategies: 'injectManifest',
      srcDir: 'src',
      filename: 'sw.js',
      includeAssets: ['favicon.svg', 'icon-192.png', 'icon-512.png'],
      manifest: { /* ... */ },
      injectManifest: {
        maximumFileSizeToCacheInBytes: 4 * 1024 * 1024,
        globPatterns: ['**/*.{js,css,html,svg,png,ico,json}'],
      },
    }),
  ],
  base: './',
})
```

| Setting | Value | Description |
|---------|-------|-------------|
| `registerType` | `autoUpdate` | Service worker auto-updates when a new version is available. |
| `strategies` | `injectManifest` | Custom service worker with precache manifest injection. |
| `srcDir` | `src` | Service worker source directory. |
| `filename` | `sw.js` | Custom service worker filename. |
| `maximumFileSizeToCacheInBytes` | `4194304` (4 MB) | Maximum file size for precaching. |
| `base` | `./` | Relative base path for all assets. |

### Playwright (`playwright.config.js`)

| Setting | Value | Description |
|---------|-------|-------------|
| `testDir` | `./e2e` | End-to-end test directory. |
| `fullyParallel` | `false` | Tests run sequentially. |
| `forbidOnly` | `true` in CI | Prevents `.only` from being committed in CI. |
| `retries` | 2 in CI, 1 locally | Retry failed tests. |
| `workers` | `1` | Single worker to avoid flakiness. |
| `reporter` | `github` in CI, `list` locally | CI-native reporting in GitHub Actions. |
| `timeout` | `30000` ms | Global test timeout. |
| `expect.timeout` | `5000` ms | Assertion timeout. |
| `baseURL` | `http://localhost:5173` (override via `BASE_URL`) | Dev server URL. |
| `trace` | `on-first-retry` | Capture trace only on retry. |
| `screenshot` | `only-on-failure` | Capture screenshot on failure. |
| `actionTimeout` | `10000` ms | Per-action timeout. |
| `navigationTimeout` | `15000` ms | Per-navigation timeout. |

#### Test Projects

| Project | Viewport | User Agent |
|---------|----------|------------|
| `desktop` | 1440 x 900 | Chrome 131 (Windows 10) |
| `tablet` | 810 x 1080 | Safari 17 (iPadOS) |
| `mobile` | 375 x 812 | Safari 17 (iOS) |

#### Web Server

```javascript
webServer: {
  command: 'npm run dev',
  port: 5173,
  reuseExistingServer: true,
  timeout: 30000,
}
```

### Capacitor (`capacitor.config.json`)

```json
{
  "appId": "com.believersguidelite.app",
  "appName": "BelieversFlow",
  "webDir": "dist",
  "bundledWebRuntime": false,
  "server": {
    "androidScheme": "https"
  },
  "android": {
    "buildOptions": {
      "keystorePath": "believers-flow.jks",
      "keystorePassword": "SET_VIA_ENV",
      "keystoreAlias": "believersflow",
      "keystoreAliasPassword": "SET_VIA_ENV"
    }
  }
}
```

| Setting | Value | Description |
|---------|-------|-------------|
| `appId` | `com.believersguidelite.app` | Android application ID. |
| `appName` | `BelieversFlow` | Display name. |
| `webDir` | `dist` | Built frontend output directory. |
| `bundledWebRuntime` | `false` | Uses system WebView runtime. |
| `androidScheme` | `https` | Forces HTTPS scheme in WebView for secure context. |

---

## Android Configuration

### SDK Versions (`android/variables.gradle`)

| Property | Value | Description |
|----------|-------|-------------|
| `minSdkVersion` | `24` | Minimum Android API level (Android 7.0 Nougat). |
| `compileSdkVersion` | `36` | SDK version used to compile the app. |
| `targetSdkVersion` | `36` | Target API level for runtime behavior. |

### Dependency Versions

| Property | Value | Description |
|----------|-------|-------------|
| `androidxActivityVersion` | `1.11.0` | AndroidX Activity library. |
| `androidxAppCompatVersion` | `1.7.1` | AndroidX AppCompat library. |
| `androidxCoordinatorLayoutVersion` | `1.3.0` | CoordinatorLayout. |
| `androidxCoreVersion` | `1.17.0` | AndroidX Core library. |
| `androidxFragmentVersion` | `1.8.9` | AndroidX Fragment library. |
| `coreSplashScreenVersion` | `1.2.0` | Core Splash Screen API. |
| `androidxWebkitVersion` | `1.14.0` | AndroidX WebKit library. |
| `junitVersion` | `4.13.2` | JUnit test framework. |
| `androidxJunitVersion` | `1.3.0` | AndroidX JUnit extensions. |
| `androidxEspressoCoreVersion` | `3.7.0` | Espresso UI testing. |
| `cordovaAndroidVersion` | `14.0.1` | Capacitor Cordova Android support. |

### Build Configuration (`android/app/build.gradle`)

| Setting | Value | Description |
|---------|-------|-------------|
| `namespace` | `com.believersguidelite.app` | Java package namespace. |
| `applicationId` | `com.believersguidelite.app` | Play Store application ID. |
| `versionCode` | `4` | Internal version code (incremental integer). |
| `versionName` | `4.1.0` | User-facing version string. |
| `minifyEnabled` | `true` | R8 code minification and obfuscation. |
| `shrinkResources` | `true` | Remove unused resources. |

### Signing

Release builds use a signing configuration that reads credentials from environment variables or a `signing.properties` file:

```
Environment: KEYSTORE_PASSWORD, KEYSTORE_ALIAS_PASSWORD
File fallback: signing.properties (STORE_FILE, STORE_PASSWORD, KEY_ALIAS, KEY_PASSWORD)
Keystore alias: believersflow
```

### Permissions

Only one permission is declared in `AndroidManifest.xml`:

```xml
<uses-permission android:name="android.permission.INTERNET" />
```

---

## PWA Configuration

### Web Manifest (`manifest.webmanifest`)

| Field | Value | Description |
|-------|-------|-------------|
| `name` | `BelieversFlow` | Full app name. |
| `short_name` | `BelieversFlow` | Abbreviated name for home screen. |
| `description` | `Christian task manager, Bible reader, hymn book, and spiritual growth tracker` | App description. |
| `start_url` | `/` | Entry point URL. |
| `display` | `standalone` | No browser chrome. |
| `background_color` | `#1a1a2e` | Splash screen background. |
| `theme_color` | `#1a1a2e` | Browser theme color. |
| `orientation` | `portrait-primary` | Locked to portrait. |
| `lang` | `en` | Default language. |
| `categories` | `religion`, `productivity`, `education` | App store categories. |

#### Icons

| Source | Size | Purpose |
|--------|------|---------|
| `/icon-192.png` | 192x192 | Standard icon. |
| `/icon-512.png` | 512x512 | Large icon. |
| `/icon-512.png` | 512x512 | Maskable icon (PWA). |

### Service Worker (`src/sw.js`)

The custom service worker handles caching and push notifications.

#### Cache Strategies

| Resource Type | Strategy | Cache Name |
|---------------|----------|------------|
| `bible-api.com` responses | Cache-first (no TTL) | `bible-api-cache` |
| Images (`destination === 'image'`) | Cache-first | `believersflow-v1` |
| Fonts (`destination === 'font'`) | Cache-first | `believersflow-v1` |
| All other requests | Network-first, cache fallback | `believersflow-v1` |
| Navigation / SPA fallback | Cache match, fallback to `index.html` | `believersflow-v1` |

#### Precache Manifest

The service worker injects the Vite build manifest (`__WB_MANIFEST`) into the precache list, along with:

```
./
./index.html
./manifest.webmanifest
```

#### Push Notifications

- Parses incoming push data as JSON with `title`, `body`, `icon`, `badge`, `data`, `actions`, `tag`.
- Falls back to plain text if JSON parsing fails.
- `notificationclick` opens `event.notification.data.url` or defaults to `./`.

---

## Theming Configuration

BelieversFlow supports 5 color themes and 3 mode themes, configurable by the user in Settings.

### Color Themes

Applied via the `data-theme` attribute on the `#app` element.

| ID | Name | Accent Colors | Background Gradient |
|----|------|---------------|---------------------|
| `believersflow` | BelieversFlow | Purple `#7b2d8e`, Gold `#f2c94c`, Blue `#3a7bd5` | `#0a0a1a` → `#1a0a2e` → `#16213e` → `#0f1a2e` |
| `royal` | Royal | Red `#8e2d2d`, Gold `#ffd700`, Red `#d54a3a` | `#1a0a0a` → `#2e0a0a` → `#3e1515` → `#2e0f0f` |
| `emerald` | Emerald | Green `#2d8e4a`, Lime `#c9f24c`, Green `#3ad57b` | `#0a1a0f` → `#0a2e15` → `#153e20` → `#0f2e18` |
| `ocean` | Ocean | Blue `#2d4a8e`, Cyan `#4cf2e8`, Blue `#3a7bd5` | `#0a0f1a` → `#0a152e` → `#15203e` → `#0f182e` |
| `sunset` | Sunset | Orange `#8e5a2d`, Orange `#f2a84c`, Orange `#d58b3a` | `#1a0f0a` → `#2e150a` → `#3e2015` → `#2e180f` |

#### Theme Properties

Each theme defines:

- `name` — Display name
- `bg` — 4-stop background gradient colors
- `header` — 3 header gradient values (rgba)
- `gold` — Accent color for highlights and active states
- `blue` — Secondary accent color
- `purple` — Primary brand color

### Mode Themes

Applied via the `data-mode` attribute on the `#app` element.

| Mode | Description |
|------|-------------|
| `dark` | Default dark theme with deep purple/blue tones. |
| `light` | Light background with white cards and dark text. |
| `grey` | Muted dark theme with reduced contrast. |

Modes override CSS variables for backgrounds, text colors, borders, and component styles throughout the application.

### Font Sizes

Set via the `fontSize` setting and applied as a CSS variable.

| Key | Pixel Value | Description |
|-----|-------------|-------------|
| `small` | `13px` | Compact text. |
| `medium` | `15px` | Default text size. |
| `large` | `17px` | Larger text for accessibility. |

### Custom Colors

Users can define custom accent colors stored in settings:

```javascript
const DEFAULT_CUSTOM_COLORS = {
  primary: '#3a7bd5',
  accent: '#f2c94c',
  background: '#0a0a1a'
}
```

### Default Settings

```javascript
const DEFAULT_SETTINGS = {
  theme: 'believersflow',
  mode: 'dark',
  fontSize: 'medium',
  readingLayout: 'standard',
  notifications: {
    prayerReminder: true,
    dailyVerse: true,
    taskReminders: true
  },
  language: 'en',
  profileName: '',
  profileEmail: '',
  backupEnabled: false
}
```

---

## Navigation Configuration

### Primary Navigation

Always visible in the bottom navigation bar on mobile and the side navigation on desktop.

```javascript
const primaryNav = ['bible', 'devotional', 'tasks', 'spiritual', 'diary', 'music']
```

| Key | View | Access |
|-----|------|--------|
| `bible` | Bible reader with chapter/verse navigation | Free |
| `devotional` | Daily devotionals with church-specific content | Free |
| `tasks` | Christian task manager with categories | Free |
| `spiritual` | Spiritual growth tracker with prayer logging | Free |
| `diary` | Personal diary with mood tracking | Free |
| `music` | Hymn book and worship songs | Free |

### Secondary Navigation

Visible for premium users only, accessible via the "More" section or expanded navigation.

```javascript
const secondaryNav = ['groups', 'church', 'events', 'sermons', 'forum', 'analytics']
```

| Key | View | Access |
|-----|------|--------|
| `groups` | Community groups | Premium |
| `church` | Church information | Premium |
| `events` | Church events calendar | Premium |
| `sermons` | Sermon archive | Premium |
| `forum` | Community discussion forum | Premium |
| `analytics` | Prayer analytics and insights | Premium |

### Navigation Behavior

- Primary nav items are shown when the user has a free account.
- Secondary nav items require a premium subscription (`isPremium`).
- The settings view is accessible from all views.
- Navigation order is configurable via drag-to-reorder in the UI.

---

## Bible Configuration

### Books

66 books across both testaments:

| Testament | Books | Chapters |
|-----------|-------|----------|
| Old Testament (OT) | 39 (Genesis → Malachi) | 929 total |
| New Testament (NT) | 27 (Matthew → Revelation) | 260 total |
| **Total** | **66** | **1189** |

### Translations

104 translations organized by language category:

| Category | Count | Examples |
|----------|-------|---------|
| English | 60 | KJV, NKJV, NIV, ESV, NASB, NLT, CSB, AMP, ASV, RSV, NRSV, MSG, CEV, WEB, NET, BBE, YLT, DBY, DRB, Geneva, Tyndale, Wycliffe |
| Hebrew | 1 | Westminster Leningrad Codex (WLC) |
| Greek | 3 | Textus Receptus (TR), SBLGNT, Septuagint (LXX) |
| Jewish | 4 | JPS 1917, JPS 1985, HNV, OJB |
| Latin | 2 | Vulgate, Nova Vulgata |
| European Languages | 8 | Luther (German), Segond (French), RVR (Spanish), Diodati (Italian), Almeida (Portuguese), Synodal (Russian), Statenvertaling (Dutch), Bible kralická (Czech), RCCV (Romanian) |
| African Languages | 7 | Yoruba, Igbo, Hausa, Swahili, Zulu, Afrikaans, Amharic |
| Asian Languages | 10 | Chinese Union, Chinese Traditional, Japanese, Korean, Hindi, Tamil, Indonesian, Vietnamese, Tagalog, Cherokee |

### Free Translations via bible-api.com

17 translations are available for free through the bible-api.com integration:

| ID | Translation |
|----|-------------|
| `kjv` | King James Version |
| `web` | World English Bible |
| `webbe` | World English Bible British Edition |
| `asv` | American Standard Version |
| `bbe` | Bible in Basic English |
| `darby` | Darby Bible |
| `dra` | Douay-Rheims Bible |
| `ylt` | Young's Literal Translation |
| `oeb-cw` | Open English Bible Commonwealth |
| `oeb-us` | Open English Bible US |
| `cuv` | Chinese Union Version |
| `almeida` | Almeida (Portuguese) |
| `clementine` | Latin Vulgate (Clementine) |
| `synodal` | Russian Synodal Bible |
| `bkr` | Bible kralická (Czech) |
| `rccv` | Protestant Romanian Bible |
| `cherokee` | Cherokee New Testament |

The `BIBLE_API_DIRECT` mapping in `src/constants.js` translates app translation IDs to bible-api.com identifiers. Some IDs (e.g., `AKJV`, `WBT`, `RV`) map to `kjv` as they are variants of the same translation.

### Book ID Mapping

Each book has both a display name (e.g., `"1 Samuel"`) and an OSIS-style abbreviation (e.g., `"1SA"`) defined in `BIBLE_BOOK_IDS` for API requests.
