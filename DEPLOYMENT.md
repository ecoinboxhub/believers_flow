# BelieversFlow Deployment Guide

Comprehensive deployment instructions for all environments.

---

## Prerequisites

| Tool | Version | Purpose |
|------|---------|---------|
| Node.js | 18+ / 20+ | Frontend build & dev server |
| Python | 3.12+ | Backend (FastAPI) |
| Docker & Docker Compose | Latest | Containerized deployment |
| Android Studio | Latest | Android APK builds |
| Java (JDK) | 17+ | Gradle builds |

---

## Web Deployment (Vercel)

1. Connect your GitHub repository to Vercel.
2. Configure environment variables in the Vercel dashboard:
   - `VITE_API_URL` — Backend API base URL
   - `VITE_GOOGLE_CLIENT_ID` — Google OAuth client ID
3. Vercel settings:
   - **Build command:** `npm run build`
   - **Output directory:** `dist`
   - **Node.js version:** 20
4. Push to the connected branch to trigger automatic deployment.

---

## Docker Deployment

### Quick Start

```bash
docker-compose up -d
```

### Services

| Service | Image | Port | Notes |
|---------|-------|------|-------|
| `redis` | `redis:7-alpine` | 6379 | 256MB max memory, append-only persistence |
| `backend` | Python FastAPI | 8000 | Application API server |
| `frontend` | `nginx:alpine` | 3000 → 80 | Proxies `/api/` requests to backend |

All services include health checks.

### Docker Compose Configuration

- **Redis:** Memory-limited to 256MB with AOF persistence enabled.
- **Backend:** Connects to Redis and the application database.
- **Frontend:** Nginx serves the built SPA and reverse-proxies API calls to the backend container.

---

## Android APK Build

```bash
npm run build
npx cap sync android
cd android
```

### Debug APK

```bash
./gradlew assembleDebug
```

### Signed Release APK

Requires keystore credentials via environment variables or `signing.properties`:

```bash
KEYSTORE_PASSWORD=xxx KEY_ALIAS_PASSWORD=xxx ./gradlew assembleRelease
```

---

## CI/CD Pipeline (GitHub Actions)

The pipeline runs the following stages in order:

1. **Lint** — ESLint across the codebase.
2. **Unit Tests** — Vitest test suite.
3. **E2E Tests** — Playwright across 3 viewports.
4. **Lighthouse Audit** — Performance and accessibility audit (main branch only).
5. **Deploy to Vercel** — Triggered on push to `main` only.

---

## Nginx Configuration

The production Nginx config includes:

- **Gzip compression** enabled for text-based assets.
- **Security headers:** `X-Frame-Options`, `X-Content-Type-Options: nosniff`, `X-XSS-Protection`.
- **Static asset caching:** 1-year immutable cache headers for hashed assets.
- **SPA fallback routing:** All non-file routes serve `index.html`.
- **API proxy:** `/api/` requests forwarded to the backend service.

---

## Environment Variables

### Frontend (Vite)

| Variable | Required | Description |
|----------|----------|-------------|
| `VITE_API_URL` | Yes | Backend API base URL |
| `VITE_GOOGLE_CLIENT_ID` | Yes | Google OAuth client ID |

### Backend

| Variable | Required | Description |
|----------|----------|-------------|
| `JWT_SECRET_KEY` | Yes | Secret key for JWT signing |
| `DATABASE_URL` | Yes | Database connection string |
| `REDIS_URL` | Yes | Redis connection string |
| `API_KEY_*` | Varies | External service API keys |

All production environments must have these variables configured before deployment.
