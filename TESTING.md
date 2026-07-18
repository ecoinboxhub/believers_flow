# Testing Guide — BelieversFlow

## Test Overview

| Suite | Framework | Tests | Command |
|-------|-----------|-------|---------|
| Unit | Vitest 4.1.9 | 83 | `npm test` |
| E2E — Core | Playwright 1.52.0 | 37 | `npx playwright test e2e/app.spec.js` |
| E2E — Smoke | Playwright 1.52.0 | 3 | `npx playwright test e2e/smoke.spec.js` |
| E2E — Community | Playwright 1.52.0 | 44 | `npx playwright test e2e/community.spec.js` |
| E2E — Diary | Playwright 1.52.0 | 20 | `npx playwright test e2e/diary-encouragement.spec.js` |
| Visual Regression | Playwright | 114 | `npx playwright test e2e/visual-regression.spec.js` |
| Screenshots | Playwright | 216 | `npx playwright test e2e/screenshots.spec.js` |
| **Total** | — | **517** | — |

---

## Unit Tests (Vitest)

### Location

`src/__tests__/`

### Files

| File | Tests | Coverage |
|------|-------|----------|
| `appUtils.test.js` | 27 | `getGreeting`, `getDayOfYear`, `formatBibleReference` |
| `dateUtils.test.js` | 56 | Timezone handling, date formatting, greeting logic |

### Running

```bash
npm test              # Single run
npm run test:watch    # Watch mode (re-runs on file changes)
```

---

## E2E Tests (Playwright)

### Location

`e2e/`

### Configuration

`playwright.config.js`

### Projects (3 viewport profiles)

| Project | Viewport | User-Agent |
|---------|----------|------------|
| Desktop | 1440×900 | Chrome/Windows desktop |
| Tablet | 810×1080 | iPad Safari |
| Mobile | 375×812 | iPhone Safari |

All projects use custom user-agent strings (no device emulation) for consistent rendering.

### Shared Helpers

`e2e/helpers.js` — imported by all spec files to eliminate duplication:

```javascript
import { setupSkipOverlays, waitForApp, setupPremiumUser, navigateToView, switchTheme } from './helpers.js'
```

| Helper | Purpose |
|--------|---------|
| `setupSkipOverlays(page)` | Blocks external fonts/APIs, skips onboarding/welcome/legal |
| `waitForApp(page)` | Navigates to `/`, waits for `#app` with children |
| `setupPremiumUser(page)` | Injects premium user into localStorage |
| `navigateToView(page, name, isDesktop?)` | Navigates via sidebar (desktop) or hamburger drawer (mobile) |
| `switchTheme(page, theme)` | Clicks theme toggle button (desktop) |
| `switchThemeMobile(page, theme)` | Clicks theme toggle button (mobile) |
| `PREMIUM_USER` | Premium user fixture object |
| `LEGAL_ACCEPTED` | Legal consent fixture object |

### Test Files

| File | Tests | Coverage |
|------|-------|----------|
| `smoke.spec.js` | 1 | Page load, title, logo visibility |
| `app.spec.js` | 37 | Core UI, Bible reader, navigation (desktop/mobile/tablet), themes |
| `community.spec.js` | 44 | Premium gating, Groups, Church, Events, Sermons, Forum, Analytics, mobile nav, themes |
| `diary-encouragement.spec.js` | 20 | Mood selector, encouragement cards, CRUD, theme compat, a11y |
| `visual-regression.spec.js` | 114 | Screenshot baselines across all viewports/themes/views |

---

## Visual Regression Testing

### Overview

Pixel-diff screenshot comparisons across **3 viewports × 3 themes × 8 views + mobile extras = 114 baselines**.

### Views Captured

Home, Bible, Hymns/Music, Devotional/Daily, Prayer/Faith, Diary, Tasks, Settings

### Configuration

In `playwright.config.js`:

```javascript
expect: {
  toHaveScreenshot: {
    maxDiffPixelRatio: 0.05,  // 5% pixel tolerance
    threshold: 0.4,           // per-pixel color threshold
    animations: 'disabled',
  },
},
updateSnapshots: process.env.CI ? 'missing' : 'none',
```

### Generating Baselines

```bash
npx playwright test e2e/visual-regression.spec.js --update-snapshots
```

### Running in CI

The `visual-regression` CI job runs automatically on every push/PR. Snapshots are uploaded as artifacts.

### Updating Baselines After Intentional UI Changes

1. Run locally with `--update-snapshots` to regenerate baselines
2. Commit the updated snapshot files in `e2e/visual-regression.spec.js-snapshots/`
3. Push — CI will compare against the new baselines

---

## Screenshot Tests (Static Capture)

`e2e/screenshots.spec.js` captures full-page screenshots for documentation:

- **8 views × 3 themes × 3 viewports = 72 unique screenshots**
- **Output**: `screenshots/{desktop,tablet,mobile}/`
- **Naming**: `{theme}-{view}.png`

---

## Running Tests

### All Tests

```bash
npm test && npm run test:e2e
```

### By Project

```bash
npx playwright test --project=desktop
npx playwright test --project=tablet
npx playwright test --project=mobile
```

### By File

```bash
npx playwright test e2e/smoke.spec.js
npx playwright test e2e/app.spec.js
npx playwright test e2e/community.spec.js
npx playwright test e2e/diary-encouragement.spec.js
npx playwright test e2e/visual-regression.spec.js
```

### Visual Regression Only

```bash
npx playwright test e2e/visual-regression.spec.js --project=desktop
```

### With UI Mode

```bash
npx playwright test --ui
```

---

## Test Configuration

| Setting | Value |
|---------|-------|
| Workers | 1 (sequential for stability) |
| Retries | 1 (local), 2 (CI) |
| Test timeout | 30s |
| Expect timeout | 5s |
| Action timeout | 10s |
| Navigation timeout | 15s |
| WebServer | auto-starts `npm run dev` on port 5173 |
| updateSnapshots | `missing` (CI), `none` (local) |

---

## Test Patterns

### Skipping Overlays

Every E2E test skips first-run overlays (onboarding, welcome screen, legal consent) to reach the app:

```javascript
import { setupSkipOverlays, waitForApp } from './helpers.js'

test.beforeEach(async ({ page }) => {
  await setupSkipOverlays(page)
  await waitForApp(page)
})
```

### Premium User Testing

```javascript
import { setupSkipOverlays, setupPremiumUser, waitForApp } from './helpers.js'

test.beforeEach(async ({ page }) => {
  await setupSkipOverlays(page)
  await setupPremiumUser(page)
  await waitForApp(page)
})
```

### Mobile Navigation

Uses sequential `isVisible()` checks rather than parallel assertions to avoid race conditions on narrow viewports.

### Theme Testing

Reads the `data-mode` attribute on the root element to verify theme state:

```javascript
const mode = await page.locator('#app').getAttribute('data-mode')
expect(mode).toBe('dark')
```

---

## CI/CD Pipeline

The `ci-frontend.yml` workflow runs 5 jobs:

| Job | Trigger | What It Does |
|-----|---------|--------------|
| `lint-and-unit` | Always | ESLint + Vitest on Node 18+20 |
| `e2e` | After lint | Playwright across all 3 projects, uploads report |
| `visual-regression` | After lint | Visual regression baselines, uploads snapshots |
| `lighthouse` | Main only | Lighthouse performance audit |
| `deploy` | Main push | Vercel production deploy (requires all checks pass) |

Artifacts uploaded on failure for debugging: Playwright report, test results, visual regression snapshots.

---

## Writing New Tests

```javascript
import { test, expect } from '@playwright/test'
import { setupSkipOverlays, waitForApp } from './helpers.js'

test.describe('Feature Name', () => {
  test.beforeEach(async ({ page }) => {
    await setupSkipOverlays(page)
    await waitForApp(page)
  })

  test('should do something', async ({ page }) => {
    await page.click('[data-testid="feature-button"]')
    await expect(page.locator('.feature-output')).toBeVisible()
  })
})
```

### Guidelines

- Always import from `./helpers.js` — never duplicate setup logic.
- Always skip overlays in `beforeEach` — never rely on specific UI state at test start.
- Use `data-testid` attributes for stable selectors; fall back to `role`, `text`, or CSS selectors.
- Keep tests independent — each test should work in isolation.
- Test across all three viewport projects when adding responsive behavior.
- Add visual regression coverage for new views in `visual-regression.spec.js`.
