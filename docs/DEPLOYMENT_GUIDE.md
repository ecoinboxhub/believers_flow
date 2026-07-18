# BelieversFlow — Deployment Guide

## Architecture Overview

```
┌─────────────┐     ┌─────────────────┐     ┌──────────────┐
│   Frontend   │────▶│  Backend API    │────▶│  PostgreSQL   │
│   (Vercel)   │     │  (Railway)      │     │  (Railway)    │
└──────┬──────┘     └────────┬────────┘     └──────────────┘
       │                     │
       │                     ▼
       │              ┌──────────────┐
       │              │    Redis     │
       │              │  (Railway)   │
       │              └──────────────┘
       ▼
┌─────────────┐
│  Mobile APK  │
│  (Capacitor) │
└─────────────┘
```

---

## PART 1: Backend on Railway

### Step 1: Create Railway Account

1. Go to [railway.app](https://railway.app)
2. Click **Login** → Sign in with GitHub
3. You get **$5 free credit/month** (enough for this app)

### Step 2: Create PostgreSQL Database

1. In Railway dashboard, click **New Project**
2. Select **PostgreSQL** → Click **Add PostgreSQL**
3. Go to the **Variables** tab of the PostgreSQL service
4. Copy the `DATABASE_URL` (looks like `postgres://user:pass@roundhouse.proxy.rlwy.net:port/railway`)
5. **Keep this URL — you'll need it**

### Step 3: Add Redis

1. In the same project, click **New** → **Database** → **Redis**
2. Copy the `REDIS_URL` from its Variables tab

### Step 4: Deploy Backend Service

1. Click **New** → **GitHub Repo**
2. Select your `Christian_Todo` repository
3. Railway will detect it's a monorepo. Set these values:

**Service Settings:**
- **Name:** `believersflow-api`
- **Root Directory:** `backend`
- **Build Command:** `pip install -r requirements.txt`
- **Start Command:** `python -m uvicorn api.index:app --host 0.0.0.0 --port $PORT`

> Railway automatically assigns a `$PORT` environment variable.

### Step 5: Set Environment Variables

Go to the **Variables** tab of your backend service and add:

```env
# Database (paste the DATABASE_URL from Step 2)
DATABASE_URL=postgres://user:pass@roundhouse.proxy.rlwy.net:port/railway

# Redis (paste the REDIS_URL from Step 3)
REDIS_URL=redis://default:password@roundhouse.proxy.rlwy.net:port

# JWT Secret (generate a strong random string)
JWT_SECRET_KEY=your-super-secret-random-string-here

# App Environment
APP_ENV=production
APP_ENV=production

# CORS — Allow your Vercel frontend
ALLOWED_ORIGINS=https://your-app.vercel.app

# Rate Limiting
RATE_LIMIT_PER_MINUTE=60

# AI Provider (at least one)
GROQ_API_KEY=your-groq-api-key
# OPENAI_API_KEY=your-openai-api-key

# Google OAuth (optional)
# GOOGLE_CLIENT_ID=your-google-client-id
# GOOGLE_CLIENT_SECRET=your-google-client-secret

# Email (optional, for password reset)
# SMTP_HOST=smtp.gmail.com
# SMTP_PORT=587
# SMTP_USER=your-email@gmail.com
# SMTP_PASSWORD=your-app-password
# SMTP_FROM=noreply@yourdomain.com

# Pinecone (optional, for RAG features)
# PINECONE_API_KEY=your-pinecone-key
# PINECONE_INDEX=believersflow
# PINECONE_HOST=your-index-host.svc.xxx.pinecone.io

# Flutterwave (optional, for payments)
# FLUTTERWAVE_SECRET_KEY=your-secret-key
# FLUTTERWAVE_PUBLIC_KEY=your-public-key
# FLUTTERWAVE_WEBHOOK_SECRET=your-webhook-secret
```

### Step 6: Generate JWT Secret Key

Run this locally to generate a secure key:

```bash
python -c "import secrets; print(secrets.token_urlsafe(64))"
```

### Step 7: Get Your Backend URL

1. After deployment, click the backend service
2. Go to **Settings** → **Networking**
3. Click **Generate Domain** to get a public URL like:
   `believersflow-api.up.railway.app`
4. **Copy this URL** — you'll need it for the frontend

### Step 8: Verify Backend

Visit `https://your-app.up.railway.app/api/health` in your browser.

You should see:
```json
{"status": "ok", "version": "4.2.0", "providers": ["groq"]}
```

---

## PART 2: Frontend on Vercel

### Step 1: Create Vercel Account

1. Go to [vercel.com](https://vercel.com)
2. Click **Sign Up** → Sign in with GitHub
3. Free tier includes everything you need

### Step 2: Import Project

1. Click **Add New...** → **Project**
2. Select your `Christian_Todo` repository
3. Vercel auto-detects Vite. Configure:

**Framework Preset:** Vite
**Root Directory:** `./` (leave as default)
**Build Command:** `npm run build`
**Output Directory:** `dist`

### Step 3: Set Environment Variables

In the Vercel project settings → **Environment Variables**, add:

```env
# Backend API URL (your Railway URL from Part 1, Step 7)
VITE_API_URL=https://your-app.up.railway.app

# Google OAuth (if using Google sign-in)
VITE_GOOGLE_CLIENT_ID=your-google-client-id
```

### Step 4: Deploy

1. Click **Deploy**
2. Vercel builds and deploys automatically
3. You get a URL like `believers-flow.vercel.app`

### Step 5: Update CORS on Railway

Go back to Railway → Your backend service → **Variables**:
```env
ALLOWED_ORIGINS=https://believers-flow.vercel.app
```

### Step 6: Verify Frontend

Visit `https://your-app.vercel.app` and test:
- [ ] App loads without errors
- [ ] Bible reader works
- [ ] Community features load (auth required)
- [ ] No CORS errors in browser console (F12)

---

## PART 3: Mobile APK (Capacitor)

### Prerequisites

- Java JDK 17+ installed
- Android Studio installed
- Android SDK installed
- Keystore file (`believers-flow.jks`) — you should already have this

### Option A: Build Locally

#### Step 1: Build Frontend

```bash
# From project root
npm run build
```

This creates the `dist/` folder.

#### Step 2: Sync Capacitor

```bash
npx cap sync android
```

This copies `dist/` into the Android project.

#### Step 3: Open in Android Studio

```bash
npx cap open android
```

#### Step 4: Build APK in Android Studio

1. In Android Studio: **Build** → **Build Bundle(s) / APK(s)** → **Build APK(s)**
2. Wait for build to complete
3. APK location: `android/app/build/outputs/apk/debug/app-debug.apk`

#### Step 5: Build Signed Release APK

1. **Build** → **Generate Signed Bundle / APK**
2. Select **APK** → Next
3. Choose your keystore: `believers-flow.jks`
4. Enter keystore password
5. Select alias: `believersflow`
6. Enter alias password
7. Release → Finish
8. APK location: `android/app/build/outputs/apk/release/app-release.apk`

### Option B: Build via GitHub Actions (Recommended)

This automatically builds a signed APK on every push to `main`.

#### Step 1: Add GitHub Secrets

Go to your GitHub repo → **Settings** → **Secrets and variables** → **Actions** → **New repository secret**

Add these secrets:

| Secret Name | Value |
|:------------|:------|
| `KEYSTORE_BASE64` | Base64-encoded keystore file (see Step 2) |
| `KEYSTORE_PASSWORD` | Your keystore password |
| `KEY_ALIAS` | `believersflow` |
| `KEY_PASSWORD` | Your key password |
| `VITE_API_URL` | `https://your-app.up.railway.app` |
| `VITE_GOOGLE_CLIENT_ID` | Your Google OAuth client ID |

#### Step 2: Encode Keystore to Base64

```bash
# Windows (PowerShell)
[Convert]::ToBase64String([IO.File]::ReadAllBytes("believers-flow.jks")) | Set-Clipboard

# macOS/Linux
base64 believers-flow.jks | pbcopy
```

Paste the output as the `KEYSTORE_BASE64` secret value.

#### Step 3: Create GitHub Actions Workflow

Create `.github/workflows/build-apk.yml`:

```yaml
name: Build Signed APK

on:
  push:
    branches: [main]
    tags: ['v*']
  workflow_dispatch:

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Java
        uses: actions/setup-java@v4
        with:
          distribution: 'temurin'
          java-version: '17'

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20.x'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Build frontend
        run: npm run build
        env:
          VITE_API_URL: ${{ secrets.VITE_API_URL }}
          VITE_GOOGLE_CLIENT_ID: ${{ secrets.VITE_GOOGLE_CLIENT_ID }}

      - name: Sync Capacitor
        run: npx cap sync android

      - name: Decode keystore
        run: echo "${{ secrets.KEYSTORE_BASE64 }}" | base64 -d > believers-flow.jks

      - name: Build signed APK
        run: |
          cd android
          ./gradlew assembleRelease \
            -Pandroid.injected.signing.store.file=../believers-flow.jks \
            -Pandroid.injected.signing.store.password=${{ secrets.KEYSTORE_PASSWORD }} \
            -Pandroid.injected.signing.key.alias=${{ secrets.KEY_ALIAS }} \
            -Pandroid.injected.signing.key.password=${{ secrets.KEY_PASSWORD }}

      - name: Upload APK
        uses: actions/upload-artifact@v4
        with:
          name: believersflow-release
          path: android/app/build/outputs/apk/release/app-release.apk
          retention-days: 30

      - name: Create Release (on tag)
        if: startsWith(github.ref, 'refs/tags/')
        uses: softprops/action-gh-release@v2
        with:
          files: android/app/build/outputs/apk/release/app-release.apk
          draft: true
```

#### Step 4: Trigger Build

- **Automatic:** Push to `main` or create a tag like `v4.1.0`
- **Manual:** Go to Actions → "Build Signed APK" → Run workflow

#### Step 5: Download APK

1. Go to **Actions** → Click the workflow run
2. Scroll to **Artifacts** → Download `believersflow-release`
3. Extract the `.apk` file

---

## PART 4: Post-Deployment Checklist

### Backend Verification

```bash
# Health check
curl https://your-app.up.railway.app/api/health

# Bible API
curl "https://your-app.up.railway.app/api/bible?book=genesis&chapter=1&version=KJV"

# Auth test (register)
curl -X POST https://your-app.up.railway.app/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test1234!","name":"Test User"}'
```

### Frontend Verification

Open browser DevTools (F12) and check:
- [ ] No CORS errors in console
- [ ] API calls go to Railway URL (Network tab)
- [ ] PWA install prompt appears
- [ ] Offline mode works (Service Worker registered)

### Mobile Verification

1. Install APK on Android device
2. Test all features match web version
3. Check app icon and splash screen
4. Verify deep linking works

---

## Environment Variables Summary

### Frontend (.env / Vercel)

| Variable | Required | Description |
|:---------|:---------|:------------|
| `VITE_API_URL` | Yes | Backend URL (Railway) |
| `VITE_GOOGLE_CLIENT_ID` | No | Google OAuth client ID |

### Backend (Railway Variables)

| Variable | Required | Description |
|:---------|:---------|:------------|
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `REDIS_URL` | Yes | Redis connection string |
| `JWT_SECRET_KEY` | Yes | Random secret for JWT signing |
| `APP_ENV` | Yes | Set to `production` |
| `ALLOWED_ORIGINS` | Yes | Vercel frontend URL |
| `GROQ_API_KEY` | No* | AI features (*at least one AI key) |
| `OPENAI_API_KEY` | No* | Alternative AI provider |
| `GOOGLE_CLIENT_ID` | No | Google OAuth |
| `GOOGLE_CLIENT_SECRET` | No | Google OAuth |
| `SMTP_HOST` | No | Email for password reset |
| `SMTP_USER` | No | Email for password reset |
| `SMTP_PASSWORD` | No | Email for password reset |
| `PINECONE_API_KEY` | No | RAG vector search |
| `FLUTTERWAVE_SECRET_KEY` | No | Payment processing |
| `RATE_LIMIT_PER_MINUTE` | No | Default: 60 |

---

## Cost Estimate

| Service | Tier | Monthly Cost |
|:--------|:-----|:-------------|
| Vercel | Hobby (Free) | $0 |
| Railway | Hobby ($5 credit) | ~$5 |
| PostgreSQL (Railway) | Included | ~$1-2 |
| Redis (Railway) | Included | ~$1 |
| **Total** | | **~$5-8/month** |

---

## Troubleshooting

### "CORS error" in browser console

Your `ALLOWED_ORIGINS` on Railway must exactly match your Vercel URL:
```env
ALLOWED_ORIGINS=https://your-app.vercel.app
```

### Backend returns 502/503

1. Check Railway logs: Service → **Deployments** → Click latest → **View Logs**
2. Common causes:
   - Missing `DATABASE_URL` environment variable
   - `requirements.txt` not in `backend/` root
   - Port binding issue (use `$PORT` not hardcoded)

### Mobile APK install fails

1. Enable "Install from unknown sources" on Android
2. Check minimum SDK version (API 22+)
3. Verify keystore is correct

### Frontend shows blank page

1. Check Vercel build logs
2. Verify `VITE_API_URL` is set in Vercel environment variables
3. Run `npm run build` locally to test

---

## Continuous Deployment

| Trigger | Frontend (Vercel) | Backend (Railway) | APK (GitHub Actions) |
|:--------|:-------------------|:-------------------|:---------------------|
| Push to `main` | Auto-deploy | Auto-deploy | Auto-build |
| Push to `develop` | Preview deploy | No deploy | No build |
| Pull request | Preview deploy | No deploy | No build |
| Git tag `v*` | Auto-deploy | Auto-deploy | Build + Release |
