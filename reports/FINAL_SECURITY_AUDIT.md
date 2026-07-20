# Final Security & Production Readiness Audit

**Date:** 2026-07-06
**Auditor:** Automated Security Scan
**Version:** 4.2.0
**Overall Score:** 38/100 — NOT PRODUCTION READY

---

## Executive Summary

The codebase has improved significantly from the initial 28/100 score. Startup validation, middleware hardening, CORS lockdown, and auth on critical endpoints are all in place. However, **3 critical blockers** and **5 high-severity issues** remain that must be resolved before any public deployment.

---

## CRITICAL BLOCKERS (P0) — Deployment will fail or be compromised

### C1. Java KeyStore file committed to git with known password

**Evidence:**
- `believers-flow.jks` — tracked by git, 2740 bytes, in working tree
- `android/app/my-release-key.jks` — in git history (commit `27ab0a8`)
- Password `password123` hardcoded in:
  - `capacitor.config.json:12,14`
  - `android/app/build.gradle:22,24`
- Git history scan: `git log --all --diff-filter=A --name-only -- "*.jks"` confirms both files committed

**Impact:** Anyone with repo access can sign APKs as the developer. The signing key is compromised.

**Fix:** Remove JKS from git tracking, regenerate keystore, use env vars for passwords.

---

### C2. Token key inconsistency — Settings/Chat components broken

**Evidence (grep results):**
```
src/syncService.js:4     → localStorage.getItem('bf_token')
src/Auth.jsx:74          → localStorage.setItem('bf_token', data.token)
src/LegalScreen.jsx:390  → localStorage.getItem('bf_token')
src/App.jsx:600          → localStorage.setItem('bf_token', data.token)
src/App.jsx:529          → localStorage.getItem('btf_token')  ← WRONG
src/App.jsx:554          → localStorage.getItem('btf_token')  ← WRONG
src/components/ChatPanel.jsx:30 → localStorage.getItem('btf_token')  ← WRONG
src/components/Settings.jsx:66  → localStorage.getItem('btf_token')  ← WRONG
src/components/Settings.jsx:92  → localStorage.getItem('btf_token')  ← WRONG
```

**Impact:** Password change, email verification, account deletion, and chat history load all fail silently — they read `btf_token` which is never set (Auth stores as `bf_token`).

**Fix:** Replace all `btf_token` with `bf_token` in Settings.jsx, ChatPanel.jsx, and App.jsx:529,554.

---

### C3. `email_verified` column missing from DB schema

**Evidence:**
- `backend/api/auth.py:341`: `await conn.execute("UPDATE users SET email_verified = TRUE WHERE id = $1", user_id)`
- `backend/api/database.py:38-53`: Schema creates `users` table with columns: `id`, `email`, `name`, `password_hash`, `plan`, `created_at` — no `email_verified` column

**Impact:** Email verification endpoint causes runtime SQL error.

**Fix:** Add `ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT FALSE` to `database.py:init_db()`.

---

## HIGH SEVERITY (P1) — Security vulnerabilities

### H1. SSRF vulnerability in `fetch_bible_kjv`

**Evidence:**
```python
# index.py:297-299
async def fetch_bible_kjv(book: str, chapter: int) -> dict:
    import httpx
    url = f"https://bible-api.com/{book.replace(' ', '+')}+{chapter}"
```

No whitelist validation on `book` parameter. Attacker can pass `../../internal-service` to manipulate the URL path.

**Impact:** Server-side request forgery — attacker can probe internal services or abuse the server as a proxy.

**Fix:** Add a whitelist of valid Bible book names; reject unknown values.

---

### H2. 7 AI endpoints unprotected

**Evidence (endpoints without `Depends(get_current_user)`):**
- `/api/chat` (line 355)
- `/api/bible/explain` (line 377)
- `/api/bible/commentary` (line 400)
- `/api/bible/concordance` (line 426)
- `/api/bible/compare` (line 503)
- `/api/hymns/explain` (line 447)
- `/api/devotional/generate` (line 470)

**Impact:** Unauthenticated users can consume LLM quota, perform abuse, and run up costs.

**Fix:** Add `user=Depends(get_current_user)` to all 7 endpoints.

---

### H3. No brute-force protection

**Evidence:** Login endpoint at `index.py:138` has no per-user rate limiting, no account lockout, no progressive delays. Rate limit middleware is per-IP only (60 RPM).

**Impact:** Attacker can try thousands of passwords against any account.

**Fix:** Add per-user rate limiting or account lockout (e.g., 5 failed attempts → 15 min lockout).

---

### H4. No Content-Security-Policy header

**Evidence:** `middleware.py` `SecurityHeadersMiddleware` sets X-Content-Type-Options, X-Frame-Options, X-XSS-Protection, Referrer-Policy, Permissions-Policy, HSTS — but no CSP.

**Impact:** Vulnerable to XSS attacks if any injection point exists.

**Fix:** Add `Content-Security-Policy` header to `SecurityHeadersMiddleware`.

---

### H5. No refresh tokens or token revocation

**Evidence:** `auth.py` issues JWT with 30-day expiry. No refresh token mechanism. No token blocklist or revocation endpoint.

**Impact:** Stolen tokens are valid for 30 days with no way to revoke.

**Fix:** Implement refresh tokens + token revocation endpoint.

---

## MEDIUM SEVERITY (P2) — Functional gaps

### M1. No email delivery

**Evidence:** `auth.py` `request_password_reset` and `request_email_verification` return `{"status": "ok", "message": "..."}` but never send any email. SMTP not configured.

**Impact:** Password reset and email verification are non-functional.

**Fix:** Configure SMTP and implement email sending.

---

### M2. `print()` used instead of `logging` (49+ occurrences)

**Evidence:** Grep shows `print(` in `database.py:16,24,26` and throughout backend. Only `index.py` and `config.py` use `logging`.

**Impact:** No log levels, no structured logging, no log rotation, debug output in production.

**Fix:** Replace all `print()` with `logger.info()`/`logger.error()`/`logger.debug()`.

---

### M3. No account lockout

**Evidence:** Same as H3 — no mechanism to lock accounts after failed attempts.

**Impact:** Brute-force attacks feasible.

---

### M4. `believers-guidelite.apk` deleted from git but `.idsig` still tracked

**Evidence:** `git status` shows `D believersguidelite.apk` and `?? believersguidelite.apk.idsig`. The `.idsig` file (APK signature) is untracked.

**Impact:** Minor — but `.idsig` should be in `.gitignore`.

---

## LOW SEVERITY (P3) — Nice to have

### L1. 24+ PRD features not implemented

Billing, push notifications, church model, admin dashboard, feature flags, diary encryption, Bible notes/bookmarks, community forum, analytics, offline queue, etc.

---

### L2. App.jsx still ~2300 lines

Partial extraction done (Settings, ChatPanel, Onboarding, GuidePanel). Remaining components (BibleReader, HymnLibrary, Devotional, Diary, etc.) still inline.

---

## Verified Working ✅

| Check | Status | Evidence |
|-------|--------|----------|
| Git history clean (no API keys) | ✅ PASS | Full scan: zero matches for `sk-proj-*`, `pcsk_*`, `sk-or-v1-*`, `gsk_*` |
| `.env` clean (no real secrets) | ✅ PASS | Only comments with placeholders |
| `client_secret*.json` deleted | ✅ PASS | `git status` shows no tracked files |
| `config.py` startup validation | ✅ PASS | Fails on missing `DATABASE_URL` or `JWT_SECRET_KEY` |
| `middleware.py` security headers | ✅ PASS | X-Content-Type-Options, X-Frame-Options, etc. |
| `middleware.py` CORS locked | ✅ PASS | `CORSOptionsMiddleware` blocks unknown origins |
| `middleware.py` rate limiting | ✅ PASS | 60 RPM per IP, skips health/dbtest |
| Auth on RAG/LLM endpoints | ✅ PASS | `Depends(get_current_user)` on rag/search, rag/ingest, llm/chat |
| Auth on sync endpoints | ✅ PASS | `Depends(get_current_user)` on sync/pull, sync/push |
| Auth on password change/delete | ✅ PASS | `Depends(get_current_user)` on change-password, delete-account |
| Health endpoint version | ✅ PASS | Returns `"4.2.0"` |
| `.gitignore` covers secrets | ✅ PASS | `.env`, `client_secret*.json`, `credentials*.json`, `*.pem`, `*.key` |
| `backend/.env.example` exists | ✅ PASS | Complete template for all env vars |
| Python syntax validation | ✅ PASS | `config.py`, `middleware.py` compile clean |

---

## Priority Fix Order

1. **C1** — Remove JKS from git, regenerate keystore, use env vars
2. **C2** — Fix token key (`bf_token` vs `btf_token`)
3. **C3** — Add `email_verified` column to DB schema
4. **H1** — Add book name whitelist for SSRF prevention
5. **H2** — Add auth to 7 unprotected AI endpoints
6. **H3** — Add brute-force protection
7. **H4** — Add CSP header
8. **H5** — Implement refresh tokens
9. **M1** — Configure SMTP for email delivery
10. **M2** — Replace `print()` with `logging`
