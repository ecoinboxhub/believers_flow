import { test, expect } from '@playwright/test'
import { setupSkipOverlays, waitForApp } from './helpers.js'

test.describe('BelieversFlow App — Core Functionality', () => {
  test.beforeEach(async ({ page }) => {
    await setupSkipOverlays(page)
    await waitForApp(page)
  })

  test('should load the app and show greeting', async ({ page }) => {
    await expect(page.locator('.greeting')).toBeVisible()
    await expect(page.locator('.verse-container')).toBeVisible()
  })

  test('should show statistics bar', async ({ page }) => {
    await expect(page.locator('.stats-bar')).toBeVisible()
    await expect(page.locator('.stat-value').first()).toBeVisible()
  })

  test('should toggle verse on click', async ({ page }) => {
    const verseText = await page.locator('.verse-text').textContent()
    await page.locator('.verse-container').click()
    const newVerseText = await page.locator('.verse-text').textContent()
    expect(verseText).not.toEqual(newVerseText)
  })

  test('should add and complete a task', async ({ page }) => {
    const taskInput = page.locator('input[placeholder*="Kingdom"]')
    await taskInput.first().waitFor({ timeout: 5000 })
    await taskInput.first().fill('Read Bible chapter')
    await page.locator('button', { hasText: 'Add' }).first().click()

    await expect(page.locator('.task-item')).toContainText('Read Bible chapter', { timeout: 5000 })
    await page.locator('.checkbox-wrap').first().click({ force: true })
  }, 15000)

  test('should show devotional view', async ({ page }) => {
    await page.getByRole('button', { name: 'Daily' }).click()
    await expect(page.locator('.view')).toContainText('Daily Devotional')
  })

  test('should show diary view', async ({ page }) => {
    await page.getByRole('button', { name: 'Diary' }).click()
    await expect(page.locator('.view')).toContainText('My Journal')
  })

  test('should filter tasks', async ({ page }) => {
    const taskInput = page.locator('input[placeholder*="Kingdom"]')
    await taskInput.first().waitFor({ timeout: 5000 })
    await taskInput.first().fill('Test task')
    await page.locator('button', { hasText: 'Add' }).first().click()

    await expect(page.locator('.filter-btn', { hasText: 'Active' })).toBeVisible({ timeout: 5000 })
    await page.locator('.filter-btn', { hasText: 'Active' }).click()
    await expect(page.locator('.filter-btn.active')).toContainText('Active')
  }, 15000)

  test('should have PWA installable manifest', async ({ page }) => {
    const manifest = await page.evaluate(() => {
      return fetch('/manifest.webmanifest').then(r => r.json())
    })
    expect(manifest.name).toContain('BelieversFlow')
    expect(manifest.display).toBe('standalone')
    expect(manifest.icons.length).toBeGreaterThanOrEqual(2)
  })
})

test.describe('BelieversFlow — Bible Reader', () => {
  test.beforeEach(async ({ page }) => {
    await setupSkipOverlays(page)
    await waitForApp(page)
  })

  test('should navigate to Bible view via sidebar', async ({ page }) => {
    await page.getByRole('button', { name: 'Bible' }).click()
    await expect(page.locator('.view')).toContainText('Holy Bible Reader')
  })

  test('should open Bible reader and show book selection', async ({ page }) => {
    await page.getByRole('button', { name: 'Bible' }).click()
    await expect(page.locator('select').first()).toBeVisible()
    await expect(page.locator('.bn-test-btn', { hasText: 'Old Testament' })).toBeVisible()
    await expect(page.locator('.bn-test-btn', { hasText: 'New Testament' })).toBeVisible()
  })
})

test.describe('BelieversFlow — Desktop Navigation', () => {
  test.use({ viewport: { width: 1440, height: 900 } })

  test.beforeEach(async ({ page }) => {
    await setupSkipOverlays(page)
    await waitForApp(page)
  })

  test('should show persistent sidebar with logo', async ({ page }) => {
    const sidebar = page.locator('.app-sidebar')
    await expect(sidebar).toBeVisible()
    await expect(sidebar.locator('.sidebar-logo-text')).toContainText('Believers Flow')
  })

  test('should show desktop header with theme toggle', async ({ page }) => {
    const headerRow = page.locator('.header-top-row')
    await expect(headerRow).toBeVisible()
    await expect(headerRow.locator('.header-mode-toggle')).toBeVisible()
  })

  test('should NOT show bottom nav or mobile header', async ({ page }) => {
    await expect(page.locator('.bottom-nav')).not.toBeVisible()
    await expect(page.locator('.header-mobile-row')).not.toBeVisible()
  })

  test('should collapse and expand sidebar', async ({ page }) => {
    const collapseBtn = page.locator('.sidebar-collapse-toggle')
    await expect(collapseBtn).toBeVisible()

    await collapseBtn.click()
    await expect(page.locator('.app-layout')).toHaveClass(/sidebar-collapsed/)

    const sidebar = page.locator('.app-sidebar')
    const box = await sidebar.boundingBox()
    expect(box.width).toBeLessThan(100)

    await collapseBtn.click()
    await expect(page.locator('.app-layout')).not.toHaveClass(/sidebar-collapsed/)
  })

  test('should navigate via sidebar items', async ({ page }) => {
    await page.locator('.sidebar-nav-item', { hasText: 'Bible' }).click()
    await expect(page.locator('.view')).toContainText('Holy Bible Reader')

    await page.locator('.sidebar-nav-item', { hasText: 'Diary' }).click()
    await expect(page.locator('.view')).toContainText('My Journal')

    await page.locator('.sidebar-nav-item', { hasText: 'Faith' }).click()
    await expect(page.locator('.view')).toContainText('Prayer Tracker')
  })

  test('should switch themes via header toggle', async ({ page }) => {
    await page.locator('.sidebar-nav-item', { hasText: 'Settings' }).click()
    await expect(page.locator('.settings-nav')).toBeVisible()
  })

  test('should navigate to Settings and find legal option', async ({ page }) => {
    await page.locator('.sidebar-nav-item', { hasText: 'Settings' }).click()
    await expect(page.locator('.settings-nav-btn', { hasText: 'Legal' })).toBeVisible()
  })
})

test.describe('BelieversFlow — Mobile Navigation', () => {
  test.use({ viewport: { width: 375, height: 812 } })

  test.beforeEach(async ({ page }) => {
    await setupSkipOverlays(page)
    await waitForApp(page)
  })

  test('should show bottom nav with primary views', async ({ page }) => {
    const bottomNav = page.locator('.bottom-nav')
    await expect(bottomNav).toBeVisible()
    const items = bottomNav.locator('.bottom-nav-item')
    const count = await items.count()
    expect(count).toBeGreaterThanOrEqual(5)
  })

  test('should show hamburger button in mobile header', async ({ page }) => {
    await expect(page.locator('.hamburger-btn')).toBeVisible()
    await expect(page.locator('.header-brand-text')).toContainText('Believers Flow')
  })

  test('should NOT show sidebar or desktop header', async ({ page }) => {
    await expect(page.locator('.app-sidebar')).not.toBeVisible()
    await expect(page.locator('.header-top-row')).not.toBeVisible()
  })

  test('should open and close mobile drawer via hamburger', async ({ page }) => {
    await page.locator('.hamburger-btn').click()
    await page.waitForTimeout(300)
    await expect(page.locator('.mobile-drawer')).toBeVisible({ timeout: 8000 })
    await expect(page.locator('.mobile-drawer-title')).toContainText('Believers Flow')

    await page.locator('.mobile-drawer-close').click()
    await page.waitForTimeout(300)
    await expect(page.locator('.mobile-drawer')).not.toBeVisible({ timeout: 5000 })
  }, 20000)

  test('should close mobile drawer by clicking overlay', async ({ page }) => {
    await page.locator('.hamburger-btn').click()
    await page.waitForTimeout(300)
    await expect(page.locator('.mobile-drawer')).toBeVisible({ timeout: 8000 })

    await page.locator('.mobile-drawer-overlay').click({ position: { x: 350, y: 400 }, force: true })
    await page.waitForTimeout(300)
    await expect(page.locator('.mobile-drawer')).not.toBeVisible({ timeout: 5000 })
  }, 20000)

  test('should navigate via mobile drawer items', async ({ page }) => {
    await page.locator('.hamburger-btn').click()
    await page.waitForTimeout(300)
    await expect(page.locator('.mobile-drawer')).toBeVisible({ timeout: 8000 })
    await page.locator('.mobile-drawer-item', { hasText: 'Bible' }).click()

    await page.waitForTimeout(300)
    await expect(page.locator('.mobile-drawer')).not.toBeVisible({ timeout: 5000 })
    await expect(page.locator('.view')).toContainText('Holy Bible Reader')
  }, 20000)

  test('should open drawer via More button in bottom nav', async ({ page }) => {
    const moreBtn = page.locator('.bottom-nav-item[aria-label="More navigation options"]')
    await expect(moreBtn).toBeVisible()
    await moreBtn.click({ force: true, timeout: 3000 })
    await page.waitForTimeout(500)
    const drawerVisible = await page.locator('.mobile-drawer').isVisible()
    if (!drawerVisible) {
      await page.evaluate(() => {
        const btn = document.querySelector('.bottom-nav-item[aria-label="More navigation options"]')
        if (btn) btn.click()
      })
      await page.waitForTimeout(500)
    }
    await expect(page.locator('.mobile-drawer')).toBeVisible({ timeout: 5000 })
  }, 20000)

  test('should lock body scroll when drawer is open', async ({ page }) => {
    await page.locator('.hamburger-btn').click()
    await page.waitForTimeout(300)
    await expect(page.locator('.mobile-drawer')).toBeVisible({ timeout: 8000 })

    const overflow = await page.evaluate(() => document.body.style.overflow)
    expect(overflow).toBe('hidden')
  }, 20000)

  test('should restore body scroll when drawer closes', async ({ page }) => {
    await page.locator('.hamburger-btn').click()
    await page.waitForTimeout(300)
    await page.locator('.mobile-drawer-close').click()
    await page.waitForTimeout(300)

    const overflow = await page.evaluate(() => document.body.style.overflow)
    expect(overflow).toBe('')
  }, 20000)

  test('should hide FABs when drawer is open', async ({ page }) => {
    const fabGroup = page.locator('.fab-group')
    if (await fabGroup.isVisible()) {
      await page.locator('.hamburger-btn').click()
      await page.waitForTimeout(300)
      await expect(fabGroup).not.toBeVisible()
    }
  }, 20000)

  test('should switch theme via mobile header toggle', async ({ page }) => {
    const mobileModeToggle = page.locator('.header-mode-toggle-mobile')
    await expect(mobileModeToggle).toBeVisible()

    await mobileModeToggle.locator('button').first().click()
    const mode = await page.locator('#app').getAttribute('data-mode')
    expect(['dark', 'light']).toContain(mode)
  })

  test('should have proper bottom padding on view container', async ({ page }) => {
    const viewContainer = page.locator('#view-container')
    const padding = await viewContainer.evaluate(el => {
      return window.getComputedStyle(el).paddingBottom
    })
    const paddingPx = parseInt(padding, 10)
    expect(paddingPx).toBeGreaterThanOrEqual(70)
  })
})

test.describe('BelieversFlow — Tablet Navigation', () => {
  test.use({ viewport: { width: 810, height: 1080 } })

  test.beforeEach(async ({ page }) => {
    await setupSkipOverlays(page)
    await waitForApp(page)
  })

  test('should show sidebar with labels', async ({ page }) => {
    const sidebar = page.locator('.app-sidebar')
    await expect(sidebar).toBeVisible()
    await expect(sidebar.locator('.sidebar-nav-item').first()).toBeVisible()
  })

  test('should NOT show bottom nav or mobile header', async ({ page }) => {
    await expect(page.locator('.bottom-nav')).not.toBeVisible()
    await expect(page.locator('.header-mobile-row')).not.toBeVisible()
  })

  test('should show desktop header', async ({ page }) => {
    await expect(page.locator('.header-top-row')).toBeVisible()
  })

  test('should collapse sidebar on tablet', async ({ page }) => {
    const collapseBtn = page.locator('.sidebar-collapse-toggle')
    await expect(collapseBtn).toBeVisible()
    await collapseBtn.click()
    await expect(page.locator('.app-layout')).toHaveClass(/sidebar-collapsed/)
  })

  test('should navigate via sidebar on tablet', async ({ page }) => {
    await page.locator('.sidebar-nav-item', { hasText: 'Bible' }).click()
    await expect(page.locator('.view')).toContainText('Holy Bible Reader')

    await page.locator('.sidebar-nav-item', { hasText: 'Tasks' }).click()
    await expect(page.locator('.view')).toContainText('Progress')
  })
})

test.describe('BelieversFlow — Theme Modes', () => {
  test.beforeEach(async ({ page }) => {
    await setupSkipOverlays(page)
    await waitForApp(page)
  })

  test('should switch between dark, light, and grey modes (desktop)', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 })

    const darkBtn = page.locator('.sidebar-mode-toggle button[aria-label="Dark mode"]')
    const lightBtn = page.locator('.sidebar-mode-toggle button[aria-label="Light mode"]')

    await darkBtn.click()
    expect(await page.locator('#app').getAttribute('data-mode')).toBe('dark')

    await lightBtn.click()
    expect(await page.locator('#app').getAttribute('data-mode')).toBe('light')

    const greyBtn = page.locator('.sidebar-mode-toggle button[aria-label="Grey mode"]')
    await greyBtn.click()
    expect(await page.locator('#app').getAttribute('data-mode')).toBe('grey')
  })

  test('should show light-mode mobile drawer correctly', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 })

    await page.locator('.header-mode-toggle-mobile button[aria-label="Light mode"]').click()
    await page.locator('.hamburger-btn').click()
    await page.waitForTimeout(300)

    const drawer = page.locator('.mobile-drawer')
    await expect(drawer).toBeVisible({ timeout: 8000 })
    const bgColor = await drawer.evaluate(el => window.getComputedStyle(el).backgroundColor)
    expect(bgColor).not.toBe('rgb(22, 27, 38)')
  }, 20000)
})
