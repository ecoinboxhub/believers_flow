import { test, expect } from '@playwright/test'
import { setupSkipOverlays, waitForApp } from './helpers.js'

test('page loads with load event', async ({ page }) => {
  await setupSkipOverlays(page)
  await page.goto('/', { timeout: 15000, waitUntil: 'networkidle' })
  expect(await page.title()).toBe('BelieversFlow')

  const logoVisible = await page.locator('.header-brand-text').isVisible()
    || await page.locator('.sidebar-logo-text').isVisible()
    || await page.locator('.header-top-row .logo').isVisible()
  expect(logoVisible).toBe(true)
})
