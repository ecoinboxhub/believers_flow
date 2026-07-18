# Development Guide

> BelieversFlow — Complete guide for setting up, developing, and contributing to the project.

---

## Table of Contents

- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Environment Configuration](#environment-configuration)
- [Development Workflow](#development-workflow)
- [Running the Application](#running-the-application)
- [Testing](#testing)
- [Building](#building)
- [Linting & Formatting](#linting--formatting)
- [Git Workflow](#git-workflow)
- [IDE Setup](#ide-setup)
- [Troubleshooting](#troubleshooting)

---

## Prerequisites

| Tool | Minimum | Recommended | Purpose |
|:-----|:--------|:------------|:--------|
| Node.js | 18+ | 20 LTS | Frontend build & dev server |
| npm | 9+ | Latest | Package management |
| Python | 3.12+ | 3.12+ | Backend (FastAPI) |
| Git | 2.30+ | Latest | Version control |
| Java (JDK) | 17+ | 17+ | Android builds (optional) |
| Android Studio | Hedgehog+ | Latest | Android development (optional) |
| PostgreSQL | 14+ | 15+ | Database (for backend) |
| Redis | 6+ | 7 | Caching (for backend) |

---

## Installation

### 1. Clone the Repository

```bash
git clone https://github.com/ecoinboxhub/Christian_task_manager.git
cd Christian_Todo
```

### 2. Install Frontend Dependencies

```bash
npm install
```

### 3. Configure Environment

```bash
cp .env.example .env
```

Edit `.env` with your API keys. See [CONFIGURATION.md](CONFIGURATION.md) for all available variables.

### 4. Start Development

```bash
npm run dev
```

The app will be available at `http://localhost:5173`.

---

## Environment Configuration

### Frontend Variables

| Variable | Required | Description |
|:---------|:---------|:------------|
| `VITE_API_URL` | No | Backend API URL (empty = direct GROQ calls from browser) |
| `VITE_GROQ_API_KEY` | No | GROQ API key for AI features |
| `VITE_GOOGLE_CLIENT_ID` | No | Google OAuth client ID |

### Backend Variables

```bash
cd backend
cp .env.example .env
```

| Variable | Required | Description |
|:---------|:---------|:------------|
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `JWT_SECRET_KEY` | Yes | JWT signing secret |
| `GROQ_API_KEY` | No | GROQ API key |
| `OPENAI_API_KEY` | No | OpenAI API key |
| `PINECONE_API_KEY` | No | Pinecone API key (for RAG) |
| `REDIS_URL` | No | Redis URL (for rate limiting) |

See [CONFIGURATION.md](CONFIGURATION.md) for the complete reference (40+ variables).

---

## Development Workflow

### Frontend Development

```bash
# Start dev server with HMR
npm run dev
```

Vite provides instant hot module replacement. Changes to any source file will instantly update the browser.

### Backend Development

```bash
cd backend

# Activate virtual environment
source venv/bin/activate  # or venv\Scripts\activate on Windows

# Start with auto-reload
python -m uvicorn api.index:app --host 0.0.0.0 --port 8000 --reload
```

The `--reload` flag watches for file changes and restarts the server automatically.

### Full-Stack Development

Run frontend and backend simultaneously:

```bash
# Terminal 1: Frontend
npm run dev

# Terminal 2: Backend
cd backend && source venv/bin/activate && python -m uvicorn api.index:app --host 0.0.0.0 --port 8000 --reload
```

Set `VITE_API_URL=http://localhost:8000` in your `.env` to connect the frontend to the local backend.

---

## Running the Application

### Web Application

| Command | Description |
|:--------|:------------|
| `npm run dev` | Start Vite dev server with HMR on port 5173 |
| `npm run build` | Production build to `dist/` |
| `npm run preview` | Preview production build on port 4173 |

### Backend

| Command | Description |
|:--------|:------------|
| `python -m uvicorn api.index:app --reload` | Development server with auto-reload |
| `python -m uvicorn api.index:app --host 0.0.0.0 --port 8000` | Production-like server |

### Docker

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop all services
docker-compose down
```

| Service | Port | Description |
|:--------|:-----|:------------|
| frontend | 3000 | Nginx serving React SPA |
| backend | 8000 | FastAPI server |
| redis | 6379 | Cache and rate limiting |

### Android

```bash
# Build and sync
npm run build
npx cap sync android

# Open in Android Studio
npx cap open android

# Build APK from command line
cd android && ./gradlew assembleDebug
```

---

## Testing

### Unit Tests (Vitest)

```bash
# Run all unit tests
npm test

# Run in watch mode
npm run test:watch

# Run with coverage
npm test -- --coverage
```

83 unit tests covering `src/__tests__/`.

### E2E Tests (Playwright)

```bash
# Run all E2E tests
npm run test:e2e

# Run specific project (viewport)
npx playwright test --project=desktop
npx playwright test --project=tablet
npx playwright test --project=mobile

# Run specific test file
npx playwright test e2e/app.spec.js

# Run with interactive UI
npm run test:e2e:ui
```

### Visual Regression Tests

```bash
# Run visual regression
npx playwright test e2e/visual-regression.spec.js

# Update baselines
npx playwright test e2e/visual-regression.spec.js --update-snapshots

# Run for specific viewport
npx playwright test e2e/visual-regression.spec.js --project=desktop
```

### Screenshot Tests

```bash
# Capture screenshots for documentation
npx playwright test e2e/screenshots.spec.js
```

### Smoke Tests

```bash
npx playwright test e2e/smoke.spec.js
```

### Running All Tests

```bash
npm test && npm run test:e2e
```

See [TESTING.md](TESTING.md) for detailed testing documentation, patterns, and CI/CD integration.

---

## Building

### Web (Vite)

```bash
# Production build
npm run build

# Preview production build
npm run preview
```

Output directory: `dist/`

### Android

```bash
# 1. Build web assets
npm run build

# 2. Sync to Android project
npx cap sync android

# 3. Build debug APK
cd android && ./gradlew assembleDebug

# 4. Build signed release APK
KEYSTORE_PASSWORD=xxx KEY_ALIAS_PASSWORD=xxx ./gradlew assembleRelease
```

APK output: `android/app/build/outputs/apk/`

### Docker

```bash
# Build and start all services
docker-compose up -d --build

# Build frontend only
docker build -f Dockerfile.frontend -t believersflow-frontend .
```

---

## Linting & Formatting

### ESLint

```bash
# Run linter
npm run lint

# Fix auto-fixable issues
npm run lint -- --fix
```

ESLint is configured with:
- `react-hooks` plugin for hook rules
- `react-refresh` plugin for fast refresh compatibility

### EditorConfig

The `.editorconfig` file ensures consistent formatting across editors:
- 2-space indentation for JS/JSX/HTML/CSS
- 4-space indentation for Python/Java
- UTF-8 encoding
- LF line endings (CRLF for Windows batch files)

---

## Git Workflow

### Branch Naming

| Prefix | Usage | Example |
|:-------|:------|:--------|
| `feature/` | New features | `feature/diary-mood-cards` |
| `fix/` | Bug fixes | `fix/bible-verse-clipping` |
| `docs/` | Documentation | `docs/update-testing-guide` |
| `chore/` | Maintenance | `chore/update-dependencies` |
| `hotfix/` | Urgent fixes | `hotfix/auth-token-expiry` |

### Commit Messages

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
type(scope): description

# Examples:
feat(diary): add mood encouragement prompts
fix(bible): handle offline chapter loading
docs: update testing guide
test(e2e): add diary encouragement tests
chore: update playwright to 1.52.0
```

### Pre-Commit Checklist

```bash
# Run all checks before committing
npm test && npm run test:e2e && npm run lint
```

---

## IDE Setup

### Recommended: VS Code

#### Required Extensions

| Extension | Purpose |
|:----------|:--------|
| [ESLint](https://marketplace.visualstudio.com/items?itemName=dbaeumer.vscode-eslint) | Linting integration |
| [Prettier](https://marketplace.visualstudio.com/items?itemName=esbenp.prettier-vscode) | Code formatting |
| [EditorConfig](https://marketplace.visualstudio.com/items?itemName=EditorConfig.EditorConfig) | Formatting standards |
| [React Developer Tools](https://marketplace.visualstudio.com/items?itemName=dsznajder.es7-react-js-snippets) | React snippets |

#### Optional Extensions

| Extension | Purpose |
|:----------|:--------|
| [Playwright Test](https://marketplace.visualstudio.com/items?itemName=ms-playwright.playwright) | E2E test runner |
| [Python](https://marketplace.visualstudio.com/items?itemName=ms-python.python) | Backend development |
| [GitLens](https://marketplace.visualstudio.com/items?itemName=eamodio.gitlens) | Git history & blame |

#### VS Code Settings

Create `.vscode/settings.json`:

```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": "explicit"
  },
  "emmet.includeLanguages": {
    "javascript": "javascriptreact"
  }
}
```

---

## Troubleshooting

### Common Issues

| Issue | Solution |
|:------|:---------|
| Port 5173 already in use | `npx vite --port 5174` or kill the process using the port |
| `npm install` fails | Delete `node_modules` and `package-lock.json`, then `npm install` |
| Android build fails | Run `npx cap sync android` before building |
| Tests fail | Ensure dev server is running (`npm run dev`) in a separate terminal |
| Python backend import errors | Activate virtual environment: `source venv/bin/activate` |
| `capacitor` command not found | Use `npx cap` instead of `cap` |
| Gradle build fails | Verify Java 17+ is installed and `JAVA_HOME` is set |
| ESLint errors | Run `npm run lint -- --fix` to auto-fix |
| Visual regression failures | Update baselines: `npx playwright test e2e/visual-regression.spec.js --update-snapshots` |

### Resetting the Environment

```bash
# Complete reset
rm -rf node_modules
npm install
cp .env.example .env

# Backend reset
cd backend
rm -rf venv
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
```

### Database Setup (Backend)

```bash
cd backend

# Run migrations
python migrate.py

# Or use Alembic
alembic upgrade head
```

---

*Last updated: July 2026 — BelieversFlow v4.1.0*
