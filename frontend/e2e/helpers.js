import { expect } from '@playwright/test'

const LEGAL_DOCUMENTS = {
  privacy: true, tos: true, tou: true, community: true, 'data-collection': true,
  security: true, cookies: true, 'content-moderation': true, 'acceptable-use': true,
  'third-party': true, 'data-retention': true, 'incident-response': true,
  'data-compliance': true, 'compliance-checklist': true,
}

export const PREMIUM_USER = {
  id: 'test-user-1',
  email: 'test@believers.flow',
  name: 'Test User',
  plan: 'premium',
}

export const LEGAL_ACCEPTED = {
  version: '1.1.0',
  accepted_at: new Date().toISOString(),
  documents: LEGAL_DOCUMENTS,
}

export async function setupSkipOverlays(page) {
  await page.route('**://fonts.googleapis.com/**', route => route.abort())
  await page.route('**://fonts.gstatic.com/**', route => route.abort())
  await page.route('**://bible-api.com/**', route => route.abort())

  await page.addInitScript(() => {
    localStorage.setItem('btf_onboardingDone', 'true')
    localStorage.setItem('btf_welcomeDone', 'true')
    localStorage.setItem('bf_legal_accepted', JSON.stringify({
      version: '1.1.0',
      accepted_at: new Date().toISOString(),
      documents: {
        privacy: true, tos: true, tou: true, community: true, 'data-collection': true,
        security: true, cookies: true, 'content-moderation': true, 'acceptable-use': true,
        'third-party': true, 'data-retention': true, 'incident-response': true,
        'data-compliance': true, 'compliance-checklist': true,
      },
    }))
  })
}

export async function setupPremiumUser(page) {
  await page.addInitScript(() => {
    localStorage.setItem('bf_user', JSON.stringify(PREMIUM_USER))
    localStorage.setItem('bf_token', 'test-jwt-token')
  })
}

export async function waitForApp(page) {
  await page.goto('/', { waitUntil: 'networkidle', timeout: 15000 })
  await page.waitForSelector('#app', { timeout: 5000 })
  await page.waitForFunction(() => {
    const el = document.querySelector('#app')
    return el && el.children.length > 0
  }, { timeout: 5000 })
}

export async function navigateToView(page, viewName, isDesktop = true) {
  if (isDesktop) {
    const navBtn = page.locator('.sidebar-nav-item', { hasText: viewName })
    if (await navBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await navBtn.click()
      await page.waitForTimeout(500)
      return
    }
  }
  await page.locator('.hamburger-btn').click()
  await page.waitForTimeout(300)
  await expect(page.locator('.mobile-drawer')).toBeVisible({ timeout: 8000 })
  const item = page.locator('.mobile-drawer-item', { hasText: viewName })
  await item.click()
  await page.waitForTimeout(300)
}

export async function switchTheme(page, theme) {
  if (theme === 'dark') return
  const btn = page.locator(`.sidebar-mode-toggle button[aria-label="${theme.charAt(0).toUpperCase() + theme.slice(1)} mode"]`)
  if (await btn.isVisible({ timeout: 2000 }).catch(() => false)) {
    await btn.click()
    await page.waitForTimeout(500)
  }
}

export async function switchThemeMobile(page, theme) {
  if (theme === 'dark') return
  const btn = page.locator(`.header-mode-toggle-mobile button[aria-label="${theme.charAt(0).toUpperCase() + theme.slice(1)} mode"]`)
  if (await btn.isVisible({ timeout: 2000 }).catch(() => false)) {
    await btn.click()
    await page.waitForTimeout(500)
  }
}

export async function navigateToViewMobile(page, viewName) {
  await page.locator('.hamburger-btn').click()
  await page.waitForTimeout(300)
  await expect(page.locator('.mobile-drawer')).toBeVisible({ timeout: 8000 })
  await page.locator('.mobile-drawer-item', { hasText: viewName }).click()
  await page.waitForTimeout(300)
}
