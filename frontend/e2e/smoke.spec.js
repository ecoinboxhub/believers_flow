import { test, expect } from '@playwright/test'
import { setupSkipOverlays, waitForApp } from './helpers.js'

test('page loads with load event', async ({ page }) => {
  await setupSkipOverlays(page)
  await page.goto('/', { timeout: 15000, waitUntil: 'networkidle' })
  expect(await page.title()).toBe('BelieversFlow')

  const appLoaded = await page.locator('.verse-text').isVisible()
    || await page.locator('.header-mobile-row').isVisible()
    || await page.locator('.sidebar-logo-text').isVisible()
  expect(appLoaded).toBe(true)
})
