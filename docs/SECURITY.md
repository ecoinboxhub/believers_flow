# Security Documentation

> BelieversFlow — Security posture, audit findings, and remediation guidance.

---

## Table of Contents

1. [Authentication](#authentication)
2. [Environment Variables](#environment-variables)
3. [Critical Findings](#critical-findings)
4. [Medium Findings](#medium-findings)
5. [Low Findings](#low-findings)
6. [Security Recommendations](#security-recommendations)
7. [OWASP Top 10 Alignment](#owasp-top-10-alignment)
8. [Mobile Security](#mobile-security)
9. [PWA Security](#pwa-security)
10. [Server-Side Security](#server-side-security)

---

## Authentication

BelieversFlow uses a JWT-based authentication system with refresh token rotation.

### Flow

1. User signs in via email/password or Google OAuth.
2. Backend issues an **access token** (short-lived) and a **refresh token** (long-lived).
3. Both tokens are stored in `localStorage` under `bf_token` and `bf_refresh_token`.
4. All authenticated API requests send the access token as a `Bearer` token in the `Authorization` header.
5. On a `401` response, `callRefreshed()` in `src/syncService.js` automatically requests a new access token using the refresh token, then retries the original request.

### Google OAuth

- Implemented via Google Sign-In (GSI) library loaded from `https://accounts.google.com/gsi/client`.
- The `VITE_GOOGLE_CLIENT_ID` is embedded in the client bundle — this is by design; Google client IDs are public identifiers.
- On successful Google sign-in, the ID token is sent to the backend (`/api/auth/google`), which verifies it and issues JWT access + refresh tokens.

### CSRF Considerations

- Bearer token authentication is immune to CSRF attacks because browsers do not automatically include the `Authorization` header in cross-origin requests. No CSRF token mechanism is needed.

### Token Storage Trade-offs

| Storage | XSS Risk | CSRF Risk | Persistence |
|---------|----------|-----------|-------------|
| `localStorage` (current) | High | None | Survives browser restart |
| `httpOnly` cookie | Low | Medium (mitigated by SameSite) | Session or persistent |
| In-memory only | None | None | Lost on page reload |

`localStorage` is used for simplicity and to support offline PWA functionality. The XSS risk is mitigated by React's automatic JSX escaping and the absence of `dangerouslySetInnerHTML` with user-controlled content.

---

## Environment Variables

### Frontend (Vite — `VITE_` prefix)

All `VITE_`-prefixed variables are embedded in the client bundle at build time. Only variables safe for public exposure should use this prefix.

| Variable | Required | Description |
|----------|----------|-------------|
| `VITE_API_URL` | No | Backend API base URL. Leave empty for direct GROQ calls from the browser. Set to Vercel deployment URL when backend is deployed. |
| `VITE_GROQ_API_KEY` | No | GROQ API key for the AI Believer Tips feature. |
| `VITE_GOOGLE_CLIENT_ID` | No | Google OAuth client ID. Public by design — not a secret. |

### Backend (`System.getenv` / `os.environ`)

| Variable | Required | Description |
|----------|----------|-------------|
| `KEYSTORE_PASSWORD` | Production | APK signing keystore password. Used by `android/app/build.gradle`. |
| `KEYSTORE_ALIAS_PASSWORD` | Production | APK signing key alias password. Falls back to `KEYSTORE_PASSWORD` if unset. |
| `DATABASE_URL` | Yes | PostgreSQL connection string. |
| `JWT_SECRET_KEY` | Yes | Secret for signing JWTs. Generate with `python -c "import secrets; print(secrets.token_urlsafe(64))"`. |
| `GOOGLE_CLIENT_ID` | No | Google OAuth client ID (backend verification). |
| `GOOGLE_CLIENT_SECRET` | No | Google OAuth client secret. |
| `GROQ_API_KEY` | No | GROQ API key for AI features. |
| `OPENAI_API_KEY` | No | OpenAI API key for AI features. |
| `OPENROUTER_API_KEY` | No | OpenRouter API key for AI features. |
| `PINECONE_API_KEY` | No | Pinecone API key for RAG features. |
| `PINECONE_INDEX` | No | Pinecone index name (default: `believersflow`). |
| `PINECONE_HOST` | No | Pinecone host URL. |
| `ALLOWED_ORIGINS` | No | Comma-separated CORS allowed origins for production. |
| `RATE_LIMIT_PER_MINUTE` | No | Requests per minute limit (default: `60`). |
| `REDIS_URL` | No | Redis URL for distributed rate limiting. |
| `DB_POOL_MIN` | No | Minimum database pool connections (default: `5`). |
| `DB_POOL_MAX` | No | Maximum database pool connections (default: `50`). |
| `DB_COMMAND_TIMEOUT` | No | Database command timeout in seconds (default: `30`). |
| `SMTP_HOST` | No | SMTP server host for email features. |
| `SMTP_PORT` | No | SMTP server port. |
| `SMTP_USER` | No | SMTP username. |
| `SMTP_PASSWORD` | No | SMTP password. |
| `SMTP_FROM` | No | Sender email address. |
| `FLUTTERWAVE_SECRET_KEY` | No | Flutterwave payment secret key. |
| `FLUTTERWAVE_PUBLIC_KEY` | No | Flutterwave payment public key. |
| `FLUTTERWAVE_WEBHOOK_SECRET` | No | Flutterwave webhook verification secret. |
| `APP_ENV` | No | Application environment (`development` / `production`). |
| `LOG_FORMAT` | No | Log format (`text` or `json`). |
| `LOG_LEVEL` | No | Python logging level (default: `INFO`). |

### `.gitignore` Coverage

The following patterns are excluded from version control:

```
.env
.env.local
.env.*.local
backend/.env
*.jks
*.apk
client_secret*.json
credentials*.json
```

---

## Critical Findings

### 1. Live API Keys in `backend/.env`

**Risk**: The production `backend/.env` file contains live secrets (`JWT_SECRET_KEY`, `GOOGLE_CLIENT_SECRET`, `GROQ_API_KEY`, `OPENAI_API_KEY`, etc.).

**Mitigation**: Verify that `backend/.env` has never been committed to git history. Run:

```bash
git log --all --full-history -- backend/.env
```

**Action**: Rotate all exposed keys immediately if any commit is found.

### 2. Hardcoded JWT Test Secret in CI

**File**: `.github/workflows/deploy-backend.yml:26`

```yaml
JWT_SECRET_KEY: test-key-for-ci-only-32chars-minimum!
```

**Risk**: A predictable JWT signing key is used in CI tests. While this only affects the test environment, it could be exploited if the test database is accessible or if the key is reused.

**Action**: Move to GitHub Secrets:

```yaml
JWT_SECRET_KEY: ${{ secrets.JWT_SECRET_KEY }}
```

### 3. CSP Allows `unsafe-inline` and `unsafe-eval`

**Risk**: Content Security Policy with `unsafe-inline` and `unsafe-eval` allows inline script execution and `eval()`, significantly increasing XSS attack surface.

**Action**: For production, implement a strict CSP:

```
Content-Security-Policy: default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self' https://bible-api.com https://generativelanguage.googleapis.com; font-src 'self' https://fonts.gstatic.com;
```

---

## Medium Findings

### 4. JWTs Stored in localStorage

**Risk**: `localStorage` is accessible to any JavaScript running on the page, making tokens vulnerable to XSS exfiltration.

**Mitigation**: React's automatic JSX escaping, absence of `dangerouslySetInnerHTML` with user input, and the Bearer token pattern (no CSRF) provide defense-in-depth.

**Future improvement**: Migrate to `httpOnly` cookies with `SameSite=Strict`.

### 5. Rate Limiting Disabled When Redis Unavailable

**File**: `backend/api/middleware.py`

The `RateLimitMiddleware` catches Redis connection errors and logs a warning, but continues processing requests without rate limiting.

**Action**: Implement an in-memory fallback rate limiter when Redis is unavailable.

### 6. Service Worker Push Opens Arbitrary URLs

**File**: `src/sw.js:92`

```javascript
const urlToOpen = event.notification.data?.url || './'
```

**Risk**: Push notification data can specify any URL to open, potentially redirecting users to malicious sites.

**Action**: Validate URLs against an allowlist (same origin only):

```javascript
const urlToOpen = event.notification.data?.url || './'
const parsed = new URL(urlToOpen, self.location.origin)
if (parsed.origin !== self.location.origin) {
  urlToOpen = './'
}
```

### 7. bible-api.com Responses Cached Without TTL

**File**: `src/sw.js:32-41`

Bible API responses are cached in `bible-api-cache` with no expiration. Stale content persists until the service worker updates.

**Action**: Add a TTL-based expiration check when serving cached responses.

### 8. `dangerouslySetInnerHTML` Usage

**Locations**: `src/components/Onboarding.jsx` (4 locations), `src/components/WelcomeScreen.jsx` (1 location).

All 5 usages render static SVG markup defined in code constants, not user input. **Risk is low** but these should be audited if the SVG sources ever change.

### 9. Google Fonts from External CDN

**File**: `index.html:15-17`

Fonts (`EB Garamond`, `Hanken Grotesk`) are loaded from `fonts.googleapis.com` / `fonts.gstatic.com`.

**Privacy risk**: Google can track users via font requests. **Availability risk**: Font loading is a single point of failure.

**Action**: Self-host fonts for production to improve privacy and reliability.

---

## Low Findings

### 10. `android:allowBackup="true"`

**File**: `android/app/src/main/AndroidManifest.xml:6`

**Risk**: Allows Android backup to include app data, which contains JWT tokens in `localStorage`. An attacker with physical access or a compromised backup could extract tokens.

**Action**: Set `android:allowBackup="false"` or configure `android:fullBackupContent` to exclude sensitive data.

### 11. CORS Not Configured for Production

**File**: `backend/.env.example:34`

The `ALLOWED_ORIGINS` variable is not set in production, potentially allowing requests from any origin.

**Action**: Set `ALLOWED_ORIGINS` to the production frontend domain(s) in the backend environment.

### 12. PWA Manifest Missing Screenshots/Shortcuts

**File**: `manifest.webmanifest`

The manifest lacks `screenshots` and `shortcuts` fields, which are recommended for a complete PWA install experience. This does not affect security.

---

## Security Recommendations

### Priority 1 — Critical

| # | Action | Status |
|---|--------|--------|
| 1 | Rotate all API keys (JWT_SECRET_KEY, GOOGLE_CLIENT_SECRET, GROQ_API_KEY, OPENAI_API_KEY, FLUTTERWAVE keys) | Pending |
| 2 | Verify `backend/.env` is not in git history (`git log --all -- backend/.env`) | Pending |
| 3 | Verify `believers-flow.jks` is not in git history | Pending |

### Priority 2 — High

| # | Action | Status |
|---|--------|--------|
| 4 | Move `JWT_SECRET_KEY` in CI to GitHub Secrets | Pending |
| 5 | Implement strict CSP without `unsafe-inline` / `unsafe-eval` | Pending |
| 6 | Configure production CORS via `ALLOWED_ORIGINS` | Pending |

### Priority 3 — Medium

| # | Action | Status |
|---|--------|--------|
| 7 | Add in-memory rate limiting fallback when Redis is unavailable | Pending |
| 8 | Validate push notification URLs (same-origin only) | Pending |
| 9 | Add TTL to bible-api.com cache in service worker | Pending |
| 10 | Self-host Google Fonts | Pending |

### Priority 4 — Low

| # | Action | Status |
|---|--------|--------|
| 11 | Set `android:allowBackup="false"` | Pending |
| 12 | Add `screenshots` and `shortcuts` to PWA manifest | Pending |

---

## OWASP Top 10 Alignment

| OWASP Category | Status | Notes |
|----------------|--------|-------|
| **A01: Broken Access Control** | Covered | JWT + Bearer token pattern, role-based access (free vs premium views), `allowBackup` concern on Android. |
| **A02: Cryptographic Failures** | Covered | HTTPS enforced on Android via Capacitor `androidScheme: "https"`. Secrets managed via environment variables. CI test secret is hardcoded (see Finding #2). |
| **A03: Injection** | Covered | React JSX auto-escapes all rendered values. No raw HTML injection with user input. SQL injection prevented by parameterized queries in backend. |
| **A04: Insecure Design** | Covered | SPA architecture with client-side rendering. `localStorage` for token persistence is a known trade-off for offline PWA support. |
| **A05: Security Misconfiguration** | Needs work | CSP needs hardening (Finding #3). CORS needs production configuration (Finding #11). nginx config includes security headers (`X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`). |
| **A06: Vulnerable and Outdated Components** | Monitor | Dependencies updated via npm. Regular audits recommended. |
| **A07: Identification and Authentication Failures** | Covered | JWT + refresh token pattern with automatic token refresh. Brute-force protection via Redis (`MAX_LOGIN_ATTEMPTS`, `LOGIN_LOCKOUT_SECONDS`). Google OAuth integration. |
| **A08: Software and Data Integrity Failures** | Covered | Service worker uses precache manifest for integrity. PWA manifest defines app scope. `injectManifest` strategy for precise cache control. |
| **A09: Security Logging and Monitoring** | Partial | Backend uses Python logging. Structured logging recommended for production. No client-side error tracking configured. |
| **A10: Server-Side Request Forgery (SSRF)** | Low risk | `bible-api.com` is the only external data fetch. Backend AI calls go to configured API endpoints (GROQ, OpenAI, OpenRouter). |

---

## Mobile Security

### Android Permissions

Only `android.permission.INTERNET` is declared in `AndroidManifest.xml`. No access to camera, contacts, location, or other sensitive permissions.

### APK Signing

- Keystore: `believers-flow.jks` (alias: `believersflow`)
- Passwords provided via `KEYSTORE_PASSWORD` and `KEYSTORE_ALIAS_PASSWORD` environment variables
- Fallback to `signing.properties` file if env vars are unavailable
- Release keystore (`believers-flow-release.jks`) is separate from the development keystore

### ProGuard / R8

Release builds enable:

```groovy
minifyEnabled true
shrinkResources true
proguardFiles getDefaultProguardFile('proguard-android.txt'), 'proguard-rules.pro'
```

This obfuscates code and removes unused resources, making reverse engineering more difficult.

### Capacitor WebView Security

```json
{
  "server": {
    "androidScheme": "https"
  }
}
```

Forces all Capacitor-served content through `https://` scheme, enabling secure context features and preventing mixed-content issues.

---

## PWA Security

### Service Worker (`src/sw.js`)

- **Cache strategy**: Cache-first for images, fonts, and bible-api.com responses. Network-first with cache fallback for other requests.
- **Precache**: App shell (`index.html`, `manifest.webmanifest`, static assets) via `__WB_MANIFEST`.
- **Cache versioning**: `believersflow-v1` — old caches cleaned on activation.
- **Push notifications**: Process JSON or plain text payloads. `notificationclick` opens URLs from notification data.

### Manifest (`manifest.webmanifest`)

- `display: "standalone"` — no browser chrome
- `scope: "."` — app is scoped to its own directory
- `orientation: "portrait-primary"` — locked orientation
- Icons: 192px and 512px PNG

---

## Server-Side Security

### Rate Limiting

- Global: `RateLimitMiddleware` in `backend/api/middleware.py` (default 60 RPM via `RATE_LIMIT_PER_MINUTE`)
- Auth-specific: Per-account rate limiting via `_check_auth_rate_limit()` (3 attempts per 5-minute window for register/reset)
- Brute-force protection: `MAX_LOGIN_ATTEMPTS` with `LOGIN_LOCKOUT_SECONDS` via Redis

### Nginx Security Headers

```nginx
X-Frame-Options: DENY
X-Content-Type-Options: nosniff
X-XSS-Protection: 1; mode=block
Referrer-Policy: strict-origin-when-cross-origin
```

### Database

- Connection pooling: `DB_POOL_MIN` (5) / `DB_POOL_MAX` (50)
- Command timeout: `DB_COMMAND_TIMEOUT` (30s)
- SSL required via `sslmode=require` in connection string
