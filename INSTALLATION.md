# BelieversFlow Installation Guide

Complete setup instructions for all platforms.

## System Requirements

| Tool | Minimum | Recommended |
|------|---------|-------------|
| Node.js | 18+ | 20 |
| npm | 9+ | Latest |
| yarn | 1.22+ | Latest |
| Git | 2.30+ | Latest |
| Python | 3.12+ | 3.12+ |
| Java | 17+ | 17+ |
| Android Studio | Hedgehog+ | Latest stable |

## Web Application

### Quick Start

```bash
# Clone the repository
git clone https://github.com/ecoinboxhub/Christian_task_manager.git
cd Christian_Todo

# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Edit .env with your API keys (see below)

# Start development server
npm run dev
```

The app will be available at `http://localhost:5173`.

### Environment Setup

Create a `.env` file in the project root:

```
VITE_API_URL=http://localhost:8000
VITE_GOOGLE_CLIENT_ID=your-google-client-id
```

#### Available Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `VITE_API_URL` | Yes | Backend API URL |
| `VITE_GOOGLE_CLIENT_ID` | No | Google OAuth client ID |

### Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start Vite dev server with HMR |
| `npm run build` | Production build |
| `npm run preview` | Preview production build |
| `npm run lint` | Run ESLint |
| `npm test` | Run unit tests (Vitest) |
| `npm run test:e2e` | Run end-to-end tests (Playwright) |

---

## Backend (Optional)

The backend provides API endpoints for sync, authentication, and AI features.

```bash
cd backend

# Create virtual environment
python -m venv venv

# Activate it
source venv/bin/activate        # macOS / Linux
venv\Scripts\activate           # Windows

# Install dependencies
pip install -r requirements.txt

# Configure environment
cp .env.example .env
# Edit backend/.env with your settings

# Start the server
python main.py
```

The backend will be available at `http://localhost:8000`.

---

## Android Mobile

### Prerequisites

- Android Studio installed
- Android SDK (API 33+)
- Java 17+

### Build Steps

```bash
# 1. Build the web app
npm run build

# 2. Sync web assets to Android project
npx cap sync android

# 3. Open in Android Studio
npx cap open android

# Or build from the command line
cd android
./gradlew assembleDebug      # Debug APK
./gradlew assembleRelease    # Signed release APK
```

The APK output will be at `android/app/build/outputs/apk/`.

### APK Signing

Release builds require a signing keystore. See [RELEASE_GUIDE.md](RELEASE_GUIDE.md) for details on configuring `signing.properties` or environment variables.

---

## Docker

### Full Stack

```bash
# Start all services
docker-compose up -d

# Check status
docker-compose ps

# View logs
docker-compose logs -f

# Stop all services
docker-compose down
```

### Docker Services

| Service | Port | Description |
|---------|------|-------------|
| frontend | 3000 | Nginx serving React SPA |
| backend | 8000 | FastAPI server |
| redis | 6379 | Cache and rate limiting |

---

## IDE Setup

**Recommended:** VS Code

### Extensions

Install these extensions for the best development experience:

| Extension | Purpose |
|-----------|---------|
| ESLint | Linting integration |
| Prettier | Code formatting |
| React Developer Tools | React component inspection |
| Playwright Test for VSCode | E2E test runner |
| Tailwind CSS IntelliSense | Tailwind class suggestions |

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Port 5173 already in use | `npx vite --port 5174` |
| `npm install` fails | Delete `node_modules` and `package-lock.json`, then run `npm install` |
| Android build fails | Run `npx cap sync android` before building |
| Tests fail | Ensure dev server is running (`npm run dev`) in a separate terminal |
| Python backend import errors | Activate virtual environment and run `pip install -r requirements.txt` |
| `capacitor` command not found | Run `npx cap` instead of `cap` |
| Gradle build fails | Verify Java 17+ is installed and `JAVA_HOME` is set |
