#!/bin/bash
# BelieversFlow Development Helper Scripts
# ========================================
# Usage: ./scripts/dev.sh [command]

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"

cd "$ROOT_DIR"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_header() {
    echo -e "${BLUE}╔══════════════════════════════════════╗${NC}"
    echo -e "${BLUE}║     BelieversFlow Development        ║${NC}"
    echo -e "${BLUE}╚══════════════════════════════════════╝${NC}"
    echo ""
}

print_usage() {
    print_header
    echo "Usage: $0 <command>"
    echo ""
    echo "Commands:"
    echo "  dev           Start frontend dev server"
    echo "  backend       Start backend server"
    echo "  build         Build frontend for production"
    echo "  test          Run all tests (unit + E2E)"
    echo "  test:unit     Run unit tests only"
    echo "  test:e2e      Run E2E tests only"
    echo "  test:visual   Run visual regression tests"
    echo "  lint          Run ESLint"
    echo "  lint:fix      Run ESLint with auto-fix"
    echo "  setup         Full project setup (install + configure)"
    echo "  clean         Clean build artifacts and caches"
    echo "  sync          Build and sync to Android"
    echo "  docker        Start all services with Docker Compose"
    echo "  help          Show this help message"
    echo ""
}

cmd_dev() {
    echo -e "${GREEN}Starting Vite dev server...${NC}"
    npm run dev
}

cmd_backend() {
    echo -e "${GREEN}Starting backend server...${NC}"
    cd backend
    if [ ! -d "venv" ]; then
        echo -e "${YELLOW}Creating virtual environment...${NC}"
        python -m venv venv
    fi
    source venv/bin/activate 2>/dev/null || . venv/Scripts/activate 2>/dev/null
    pip install -r requirements.txt -q
    python -m uvicorn api.index:app --host 0.0.0.0 --port 8000 --reload
}

cmd_build() {
    echo -e "${GREEN}Building for production...${NC}"
    npm run build
    echo -e "${GREEN}Build complete: dist/${NC}"
}

cmd_test() {
    echo -e "${GREEN}Running all tests...${NC}"
    npm test
    echo ""
    echo -e "${GREEN}Running E2E tests...${NC}"
    npm run test:e2e
}

cmd_test_unit() {
    echo -e "${GREEN}Running unit tests...${NC}"
    npm test
}

cmd_test_e2e() {
    echo -e "${GREEN}Running E2E tests...${NC}"
    npm run test:e2e
}

cmd_test_visual() {
    echo -e "${GREEN}Running visual regression tests...${NC}"
    npx playwright test e2e/visual-regression.spec.js
}

cmd_lint() {
    echo -e "${GREEN}Running ESLint...${NC}"
    npm run lint
}

cmd_lint_fix() {
    echo -e "${GREEN}Running ESLint with auto-fix...${NC}"
    npm run lint -- --fix
}

cmd_setup() {
    echo -e "${GREEN}Setting up BelieversFlow...${NC}"
    npm install
    if [ ! -f ".env" ]; then
        cp .env.example .env
        echo -e "${YELLOW}Created .env from .env.example${NC}"
        echo -e "${YELLOW}Please edit .env with your API keys${NC}"
    fi
    echo -e "${GREEN}Setup complete! Run '$0 dev' to start.${NC}"
}

cmd_clean() {
    echo -e "${GREEN}Cleaning build artifacts and caches...${NC}"
    rm -rf dist/
    rm -rf node_modules/.vite/
    rm -rf test-results/
    rm -rf playwright-report/
    rm -rf .pytest_cache/
    rm -rf backend/__pycache__/
    rm -rf backend/api/__pycache__/
    echo -e "${GREEN}Clean complete.${NC}"
}

cmd_sync() {
    echo -e "${GREEN}Building and syncing to Android...${NC}"
    npm run build
    npx cap sync android
    echo -e "${GREEN}Sync complete.${NC}"
}

cmd_docker() {
    echo -e "${GREEN}Starting Docker Compose services...${NC}"
    docker-compose up -d
    echo -e "${GREEN}Services started. Use 'docker-compose logs -f' to view logs.${NC}"
}

# Main
case "${1:-help}" in
    dev)        cmd_dev ;;
    backend)    cmd_backend ;;
    build)      cmd_build ;;
    test)       cmd_test ;;
    test:unit)  cmd_test_unit ;;
    test:e2e)   cmd_test_e2e ;;
    test:visual) cmd_test_visual ;;
    lint)       cmd_lint ;;
    lint:fix)   cmd_lint_fix ;;
    setup)      cmd_setup ;;
    clean)      cmd_clean ;;
    sync)       cmd_sync ;;
    docker)     cmd_docker ;;
    help|*)     print_usage ;;
esac
