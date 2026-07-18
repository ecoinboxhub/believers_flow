@echo off
REM BelieversFlow Development Helper Scripts (Windows)
REM ====================================================
REM Usage: scripts\dev.bat [command]

setlocal

set SCRIPT_DIR=%~dp0
set ROOT_DIR=%SCRIPT_DIR%..

cd /d "%ROOT_DIR%"

if "%1"=="" goto help
if "%1"=="help" goto help
if "%1"=="dev" goto dev
if "%1"=="backend" goto backend
if "%1"=="build" goto build
if "%1"=="test" goto test_all
if "%1"=="test:unit" goto test_unit
if "%1"=="test:e2e" goto test_e2e
if "%1"=="test:visual" goto test_visual
if "%1"=="lint" goto lint
if "%1"=="lint:fix" goto lint_fix
if "%1"=="setup" goto setup
if "%1"=="clean" goto clean
if "%1"=="sync" goto sync
if "%1"=="docker" goto docker
goto help

:help
echo BelieversFlow Development Helper
echo =================================
echo.
echo Usage: scripts\dev.bat [command]
echo.
echo Commands:
echo   dev           Start frontend dev server
echo   backend       Start backend server
echo   build         Build frontend for production
echo   test          Run all tests (unit + E2E)
echo   test:unit     Run unit tests only
echo   test:e2e      Run E2E tests only
echo   test:visual   Run visual regression tests
echo   lint          Run ESLint
echo   lint:fix      Run ESLint with auto-fix
echo   setup         Full project setup (install + configure)
echo   clean         Clean build artifacts and caches
echo   sync          Build and sync to Android
echo   docker        Start all services with Docker Compose
echo   help          Show this help message
echo.
goto end

:dev
echo Starting Vite dev server...
call npm run dev
goto end

:backend
echo Starting backend server...
cd /d "%ROOT_DIR%\backend"
if not exist "venv" (
    echo Creating virtual environment...
    python -m venv venv
)
call venv\Scripts\activate.bat
call pip install -r requirements.txt -q
call python -m uvicorn api.index:app --host 0.0.0.0 --port 8000 --reload
goto end

:build
echo Building for production...
call npm run build
echo Build complete: dist\
goto end

:test_all
echo Running all tests...
call npm test
echo.
echo Running E2E tests...
call npm run test:e2e
goto end

:test_unit
echo Running unit tests...
call npm test
goto end

:test_e2e
echo Running E2E tests...
call npm run test:e2e
goto end

:test_visual
echo Running visual regression tests...
call npx playwright test e2e/visual-regression.spec.js
goto end

:lint
echo Running ESLint...
call npm run lint
goto end

:lint_fix
echo Running ESLint with auto-fix...
call npm run lint -- --fix
goto end

:setup
echo Setting up BelieversFlow...
call npm install
if not exist ".env" (
    copy .env.example .env
    echo Created .env from .env.example
    echo Please edit .env with your API keys
)
echo Setup complete! Run 'scripts\dev.bat dev' to start.
goto end

:clean
echo Cleaning build artifacts and caches...
if exist "dist" rmdir /s /q "dist"
if exist "test-results" rmdir /s /q "test-results"
if exist "playwright-report" rmdir /s /q "playwright-report"
if exist ".pytest_cache" rmdir /s /q ".pytest_cache"
echo Clean complete.
goto end

:sync
echo Building and syncing to Android...
call npm run build
call npx cap sync android
echo Sync complete.
goto end

:docker
echo Starting Docker Compose services...
call docker-compose up -d
echo Services started.
goto end

:end
endlocal
