import { test } from '@playwright/test'

const setupSkipOverlays = async (page) => {
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

const waitForApp = async (page) => {
  await page.goto('/', { waitUntil: 'networkidle', timeout: 15000 })
  await page.waitForSelector('#app', { timeout: 5000 })
  await page.waitForFunction(() => {
    const el = document.querySelector('#app')
    return el && el.children.length > 0
  }, { timeout: 5000 })
}

const viewports = {
  desktop: { width: 1440, height: 900 },
  tablet: { width: 810, height: 1080 },
  mobile: { width: 375, height: 812 },
}

const themes = ['dark', 'light', 'grey']

const views = [
  { name: 'home', nav: null },
  { name: 'bible', nav: 'Bible' },
  { name: 'devotional', nav: 'Daily' },
  { name: 'tasks', nav: 'Tasks' },
  { name: 'faith', nav: 'Faith' },
  { name: 'music', nav: 'Music' },
  { name: 'diary', nav: 'Diary' },
  { name: 'settings', nav: 'Settings' },
]

for (const [vpName, vpSize] of Object.entries(viewports)) {
  test.describe(`Screenshots — ${vpName}`, () => {
    test.use({ viewport: vpSize })

    test.beforeEach(async ({ page }) => {
      await setupSkipOverlays(page)
      await waitForApp(page)
    })

    for (const theme of themes) {
      for (const view of views) {
        test(`${theme}/${view.name}`, async ({ page }) => {
          await page.setViewportSize(vpSize)

          if (theme !== 'dark') {
            const btnSelector = vpName === 'mobile'
              ? `.header-mode-toggle-mobile button[aria-label="${theme.charAt(0).toUpperCase() + theme.slice(1)} mode"]`
              : `.sidebar-mode-toggle button[aria-label="${theme.charAt(0).toUpperCase() + theme.slice(1)} mode"]`
            const btn = page.locator(btnSelector)
            if (await btn.isVisible({ timeout: 2000 }).catch(() => false)) {
              await btn.click()
              await page.waitForTimeout(300)
            }
          }

          if (view.nav) {
            if (vpName === 'mobile') {
              const navItem = page.locator('.bottom-nav-item', { hasText: view.nav })
              if (await navItem.isVisible({ timeout: 2000 }).catch(() => false)) {
                await navItem.click()
              } else {
                await page.locator('.hamburger-btn').click()
                await page.waitForTimeout(400)
                await page.locator('.mobile-drawer-item', { hasText: view.nav }).click()
                await page.waitForTimeout(400)
              }
            } else {
              await page.locator('.sidebar-nav-item', { hasText: view.nav }).click()
            }
            await page.waitForTimeout(500)
          } else {
            if (vpName === 'mobile') {
              const dailyBtn = page.locator('.bottom-nav-item', { hasText: 'Daily' })
              if (await dailyBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
                await dailyBtn.click()
                await page.waitForTimeout(300)
              }
            }
          }

          await page.waitForTimeout(400)

          const dir = `screenshots/${vpName}`
          await page.screenshot({ path: `${dir}/${theme}-${view.name}.png`, fullPage: false })
        })
      }
    }
  })
}
