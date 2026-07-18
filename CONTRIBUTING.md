# Contributing to BelieversFlow

Thank you for your interest in contributing to BelieversFlow. This document provides guidelines and instructions for contributing to this project.

---

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [Code Standards](#code-standards)
- [Branch Strategy](#branch-strategy)
- [Commit Messages](#commit-messages)
- [Pull Request Process](#pull-request-process)
- [Testing Requirements](#testing-requirements)
- [Project Structure](#project-structure)
- [Style Guidelines](#style-guidelines)

---

## Code of Conduct

This project adheres to the [Contributor Covenant Code of Conduct](CODE_OF_CONDUCT.md). By participating, you are expected to uphold this code. Please report unacceptable behavior by opening an issue.

---

## Getting Started

### Prerequisites

| Tool | Version | Purpose |
|:-----|:--------|:--------|
| Node.js | 18+ (20 recommended) | Frontend build & dev server |
| npm | 9+ | Package management |
| Python | 3.12+ | Backend (FastAPI) |
| Git | 2.30+ | Version control |
| Java | 17+ | Android builds (optional) |

### Fork & Clone

```bash
# 1. Fork the repository on GitHub
# 2. Clone your fork
git clone https://github.com/YOUR_USERNAME/believers_flow.git
cd Christian_Todo

# 3. Add the upstream remote
git remote add upstream https://github.com/ecoinboxhub/believers_flow.git

# 4. Create a feature branch
git checkout -b feature/your-feature-name

# 5. Install dependencies
npm install

# 6. Configure environment
cp .env.example .env

# 7. Start development
npm run dev
```

The dev server starts on `http://localhost:5173`.

---

## Development Setup

### Frontend

```bash
npm install
cp .env.example .env
npm run dev
```

### Backend (Optional)

```bash
cd backend
python -m venv venv
source venv/bin/activate  # or venv\Scripts\activate on Windows
pip install -r requirements.txt
cp .env.example .env
python -m uvicorn api.index:app --host 0.0.0.0 --port 8000 --reload
```

### Android (Optional)

```bash
npm run build
npx cap sync android
cd android && ./gradlew assembleDebug
```

---

## Code Standards

| Area | Convention |
|:-----|:-----------|
| Language | JavaScript (ES Modules, no TypeScript) |
| Framework | React 19 with functional components |
| State Management | React `useState` hooks |
| Linting | ESLint with `react-hooks` and `react-refresh` plugins |
| Styling | CSS custom properties (variables) for theming |
| Components | Functional components only (no class components) |
| Testing | Vitest (unit), Playwright (E2E) |
| Formatting | EditorConfig (2-space indent, UTF-8, LF) |

### Frontend Rules

- All components must be functional (no class components)
- Use CSS custom properties for theme-dependent colors
- New features should include E2E test coverage
- UI changes must be verified across all 3 themes (Dark, Light, Grey)
- Run `npm run lint` before committing
- No emojis in source code (use inline SVG icons instead)

### Backend Rules

- Python 3.12+ with async/await
- FastAPI with type hints
- All database queries must be parameterized (no SQL injection)
- Environment variables for all secrets (never hardcode)
- See [backend/README.md](backend/README.md) for backend-specific guidelines

---

## Branch Strategy

```
main          ← Production-ready code
  ↑
develop       ← Integration branch (optional)
  ↑
feature/*     ← New features
fix/*         ← Bug fixes
docs/*        ← Documentation only
chore/*       ← Build, CI, tooling
```

### Branch Naming

| Prefix | Usage | Example |
|:-------|:------|:--------|
| `feature/` | New features | `feature/diary-mood-cards` |
| `fix/` | Bug fixes | `fix/bible-verse-clipping` |
| `docs/` | Documentation | `docs/update-testing-guide` |
| `chore/` | Maintenance | `chore/update-dependencies` |
| `hotfix/` | Urgent production fixes | `hotfix/auth-token-expiry` |

---

## Commit Messages

Follow [Conventional Commits](https://www.conventionalcommits.org/) format:

```
type(scope): description

[optional body]

[optional footer]
```

### Types

| Type | When to Use | Example |
|:-----|:-----------|:--------|
| `feat` | New feature | `feat(diary): add mood encouragement prompts` |
| `fix` | Bug fix | `fix(bible): handle offline chapter loading` |
| `docs` | Documentation only | `docs: update testing guide` |
| `style` | Formatting, no logic change | `style: fix trailing whitespace` |
| `refactor` | Code restructuring, no behavior change | `refactor: extract date utilities` |
| `test` | Adding or updating tests | `test(e2e): add diary encouragement tests` |
| `chore` | Build, CI, tooling | `chore: update playwright to 1.52.0` |
| `perf` | Performance improvement | `perf: add virtual scrolling for hymn list` |
| `ci` | CI/CD changes | `ci: add visual regression job` |
| `revert` | Revert a commit | `revert: undo community API changes` |

### Scopes

| Scope | Area |
|:------|:-----|
| `bible` | Bible reader & translations |
| `diary` | Personal diary |
| `tasks` | Task manager |
| `music` | Hymns & worship |
| `devotional` | Daily devotionals |
| `community` | Community features |
| `settings` | Settings & themes |
| `auth` | Authentication |
| `sync` | Cloud sync |
| `e2e` | End-to-end tests |
| `ci` | CI/CD pipeline |

---

## Pull Request Process

### Before Submitting

1. **Run all tests:**
   ```bash
   npm test && npm run test:e2e && npm run lint
   ```

2. **Verify your changes:**
   - Test across all 3 viewports (desktop, tablet, mobile)
   - Test across all 3 themes (Dark, Light, Grey)
   - Verify premium and free user views
   - Check for console errors or warnings

3. **Update documentation** if your change affects:
   - Public API or endpoints
   - Configuration options
   - Development workflow
   - Architecture decisions

### PR Checklist

- [ ] Tests pass locally (`npm test && npm run test:e2e`)
- [ ] No lint errors (`npm run lint`)
- [ ] No console errors or warnings introduced
- [ ] UI works across desktop, tablet, and mobile viewports
- [ ] Theme switching works (Dark, Light, Grey)
- [ ] Documentation updated if applicable
- [ ] Commit messages follow Conventional Commits format
- [ ] PR has a clear title and description

### PR Title Format

```
type(scope): description
```

Example: `feat(community): add prayer chain notifications`

### Review Process

1. Submit the PR with a clear description of changes
2. CI pipeline runs automatically (lint, unit tests, E2E tests)
3. Address review feedback
4. Maintainer approval required before merge
5. Squash and merge to main

---

## Testing Requirements

| Change Type | Required Tests |
|:------------|:---------------|
| Utility function | Unit test in `src/__tests__/` |
| New feature | E2E test in `e2e/` |
| UI change | Visual regression test in `e2e/visual-regression.spec.js` |
| Bug fix | Regression test covering the fixed behavior |
| API endpoint | Backend test in `backend/tests/` |

### Running Tests

```bash
# Unit tests
npm test

# E2E tests
npm run test:e2e

# Visual regression
npx playwright test e2e/visual-regression.spec.js

# Specific viewport
npx playwright test --project=desktop

# Interactive debugging
npm run test:e2e:ui
```

See [TESTING.md](TESTING.md) for detailed testing documentation.

---

## Project Structure

| Path | Description |
|:-----|:------------|
| `src/App.jsx` | Main app component (monolithic — handle with care) |
| `src/components/` | 28 React view components |
| `src/apiClient.js` | HTTP client with JWT, retry, refresh |
| `src/syncService.js` | Cloud sync service |
| `src/constants.js` | Bible data, moods, navigation config |
| `src/dateUtils.js` | Timezone utilities |
| `e2e/` | Playwright E2E tests + shared helpers |
| `backend/api/` | FastAPI modules (36 files) |
| `android/` | Capacitor Android project |
| `docs/` | Legal, compliance, and community docs |

See [PROJECT_STRUCTURE.md](PROJECT_STRUCTURE.md) for detailed documentation.

---

## Style Guidelines

### JavaScript

- Use `const` by default, `let` when reassignment is needed, never `var`
- Use template literals for string interpolation
- Use destructuring for object/array access
- Prefer arrow functions for callbacks
- Use optional chaining (`?.`) and nullish coalescing (`??`)
- No semicolons (project convention)
- 2-space indentation

### React

- Functional components only
- Props destructuring in function parameters
- Custom hooks for shared logic (prefix with `use`)
- Error boundaries around feature views
- `data-testid` attributes for E2E selectors

### CSS

- CSS custom properties for theme values
- BEM-inspired naming (not strict BEM)
- Mobile-first responsive design
- No CSS-in-JS libraries
- Animations via CSS transitions/keyframes

---

## Getting Help

- **Issues:** [GitHub Issues](https://github.com/ecoinboxhub/believers_flow/issues)
- **Discussions:** [GitHub Discussions](https://github.com/ecoinboxhub/believers_flow/discussions)
- **Security:** See [SECURITY.md](SECURITY.md) for reporting security vulnerabilities

---

*Thank you for contributing to BelieversFlow.*
