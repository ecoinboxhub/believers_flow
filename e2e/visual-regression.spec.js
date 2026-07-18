import { test, expect } from '@playwright/test'
import { setupSkipOverlays, waitForApp, navigateToView, switchTheme } from './helpers.js'

const VIEWS = ['home', 'bible', 'hymns', 'devotional', 'prayer', 'diary', 'tasks', 'settings']
const NAV_NAMES = {
  home: null,
  bible: 'Bible',
  hymns: 'Music',
  devotional: 'Daily',
  prayer: 'Faith',
  diary: 'Diary',
  tasks: 'Tasks',
  settings: 'Settings',
}

const THEMES = ['dark', 'light', 'grey']

function setupTheme(page, theme) {
  return switchTheme(page, theme)
}

for (const theme of THEMES) {
  test.describe(`Visual Regression — ${theme.charAt(0).toUpperCase() + theme.slice(1)} Mode — Desktop`, () => {
    test.use({ viewport: { width: 1440, height: 900 } })

    test.beforeEach(async ({ page }) => {
      await setupSkipOverlays(page)
      await waitForApp(page)
      await setupTheme(page, theme)
    })

    for (const view of VIEWS) {
      test(`${view}`, async ({ page }) => {
        if (NAV_NAMES[view]) {
          await navigateToView(page, NAV_NAMES[view], true)
        }
        await expect(page).toHaveScreenshot(`${view}-${theme}-desktop.png`)
      })
    }
  })
}

for (const theme of THEMES) {
  test.describe(`Visual Regression — ${theme.charAt(0).toUpperCase() + theme.slice(1)} Mode — Tablet`, () => {
    test.use({ viewport: { width: 810, height: 1080 } })

    test.beforeEach(async ({ page }) => {
      await setupSkipOverlays(page)
      await waitForApp(page)
      await setupTheme(page, theme)
    })

    for (const view of VIEWS) {
      test(`${view}`, async ({ page }) => {
        if (NAV_NAMES[view]) {
          await navigateToView(page, NAV_NAMES[view], true)
        }
        await expect(page).toHaveScreenshot(`${view}-${theme}-tablet.png`)
      })
    }
  })
}

for (const theme of THEMES) {
  test.describe(`Visual Regression — ${theme.charAt(0).toUpperCase() + theme.slice(1)} Mode — Mobile`, () => {
    test.use({ viewport: { width: 375, height: 812 } })

    test.beforeEach(async ({ page }) => {
      await setupSkipOverlays(page)
      await waitForApp(page)
    })

    for (const view of VIEWS) {
      test(`${view}`, async ({ page }) => {
        if (NAV_NAMES[view]) {
          await navigateToView(page, NAV_NAMES[view], false)
        }
        await expect(page).toHaveScreenshot(`${view}-${theme}-mobile.png`)
      })
    }

    test('mobile drawer', async ({ page }) => {
      await page.locator('.hamburger-btn').click()
      await page.waitForTimeout(300)
      await expect(page.locator('.mobile-drawer')).toBeVisible({ timeout: 8000 })
      await expect(page).toHaveScreenshot(`drawer-${theme}-mobile.png`)
    })

    test('bottom nav', async ({ page }) => {
      await expect(page.locator('.bottom-nav')).toBeVisible()
      await expect(page).toHaveScreenshot(`bottomnav-${theme}-mobile.png`)
    })
  })
}
