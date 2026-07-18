import { test, expect } from '@playwright/test'
import { setupSkipOverlays, setupPremiumUser, waitForApp, navigateToView } from './helpers.js'

const mockApi = async (page) => {
  await page.route('**/api/groups**', route => {
    const url = route.request().url()
    if (url.includes('/create')) {
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ id: 'g1', name: 'Faith Walkers', description: 'Growing together', invite_code: 'FAITH123', max_members: 20, member_count: 3 }) })
    }
    if (url.includes('/join')) {
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ message: 'Joined group' }) })
    }
    return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) })
  })
  await page.route('**/api/churches**', route => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) }))
  await page.route('**/api/events**', route => {
    const url = route.request().url()
    if (url.includes('/create')) {
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ id: 'e1', title: 'Bible Study', description: 'Weekly study', location: 'Main Hall', start_time: new Date(Date.now() + 86400000).toISOString(), end_time: new Date(Date.now() + 90000000).toISOString(), event_type: 'church' }) })
    }
    return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) })
  })
  await page.route('**/api/sermons**', route => {
    const url = route.request().url()
    if (url.includes('/create')) {
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ id: 's1', title: 'Grace Beyond Measure', preacher: 'Pastor John', church_name: 'Grace Church', date: '2026-07-13', key_points: ['Grace is unmerited'], content: 'Full sermon content', scripture_references: ['Ephesians 2:8-9'], tags: ['grace'] }) })
    }
    if (url.includes('/summarize')) {
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ main_theme: 'Grace', key_points: ['Grace is free'], scripture_references: ['Ephesians 2:8'], action_items: ['Study grace'], overview: 'A message about grace.' }) })
    }
    return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) })
  })
  await page.route('**/api/forum**', route => {
    const url = route.request().url()
    const method = route.request().method()
    if (url.includes('/categories')) {
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([{ id: 'general', name: 'General', icon: '💬', thread_count: 2 }, { id: 'theology', name: 'Theology', icon: '📖', thread_count: 1 }]) })
    }
    if (url.includes('/threads') && method === 'POST') {
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ id: 't1', title: 'New Thread', content: 'Thread content', category: 'General', author: { name: 'Test User' }, created_at: new Date().toISOString(), reply_count: 0, view_count: 0 }) })
    }
    if (url.includes('/threads/') && url.includes('/replies') && method === 'POST') {
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ id: 'r1', content: 'Great point!', author: { name: 'Test User' }, created_at: new Date().toISOString() }) })
    }
    return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) })
  })
  await page.route('**/api/prayer/analytics**', route => route.fulfill({
    status: 200, contentType: 'application/json',
    body: JSON.stringify({ total_prayers: 42, total_minutes: 1260, avg_minutes: 30, current_streak: 7, best_streak: 14, consistency: 85, best_day: 'Sunday', worst_day: 'Wednesday', monthly_trend: [{ month: 'Jul', minutes: 300 }], recent_activity: [] }),
  }))
  await page.route('**/api/prayer/insights**', route => route.fulfill({
    status: 200, contentType: 'application/json',
    body: JSON.stringify({ insights: ['You pray most on Sundays'], recommendations: ['Try praying in the morning'] }),
  }))
  await page.route('**/api/prayer/goals', route => route.fulfill({
    status: 200, contentType: 'application/json',
    body: JSON.stringify({ daily_goal: 30, weekly_target: 5 }),
  }))
}

test.describe('Community Features — Premium Gating', () => {
  test.beforeEach(async ({ page }) => {
    await setupSkipOverlays(page)
    await waitForApp(page)
  })

  test('should NOT show community nav items for non-premium users on desktop', async ({ page }) => {
    await expect(page.locator('.sidebar-nav-item', { hasText: 'Groups' })).not.toBeVisible()
    await expect(page.locator('.sidebar-nav-item', { hasText: 'Church' })).not.toBeVisible()
    await expect(page.locator('.sidebar-nav-item', { hasText: 'Events' })).not.toBeVisible()
    await expect(page.locator('.sidebar-nav-item', { hasText: 'Sermons' })).not.toBeVisible()
    await expect(page.locator('.sidebar-nav-item', { hasText: 'Forum' })).not.toBeVisible()
    await expect(page.locator('.sidebar-nav-item', { hasText: 'Analytics' })).not.toBeVisible()
  })

  test('should NOT show community nav items for non-premium users in mobile drawer', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 })
    await setupSkipOverlays(page)
    await waitForApp(page)

    await page.locator('.hamburger-btn').click()
    await page.waitForTimeout(300)
    await expect(page.locator('.mobile-drawer')).toBeVisible({ timeout: 8000 })

    const communitySection = page.locator('.mobile-drawer-section-label', { hasText: 'Community' })
    await expect(communitySection).not.toBeVisible()
    await expect(page.locator('.mobile-drawer-item', { hasText: 'Groups' })).not.toBeVisible()
  })
})

test.describe('Community Features — Groups (Premium)', () => {
  test.beforeEach(async ({ page }) => {
    await setupSkipOverlays(page)
    await setupPremiumUser(page)
    await mockApi(page)
    await waitForApp(page)
  })

  test('should show community nav items in sidebar for premium users', async ({ page }) => {
    await expect(page.locator('.sidebar-nav-item', { hasText: 'Groups' })).toBeVisible()
    await expect(page.locator('.sidebar-nav-item', { hasText: 'Church' })).toBeVisible()
    await expect(page.locator('.sidebar-nav-item', { hasText: 'Events' })).toBeVisible()
    await expect(page.locator('.sidebar-nav-item', { hasText: 'Sermons' })).toBeVisible()
    await expect(page.locator('.sidebar-nav-item', { hasText: 'Forum' })).toBeVisible()
    await expect(page.locator('.sidebar-nav-item', { hasText: 'Analytics' })).toBeVisible()
  })

  test('should navigate to Groups view and show tabs', async ({ page }) => {
    await navigateToView(page, 'Groups')
    await expect(page.locator('.groups-nav-btn', { hasText: 'My Groups' })).toBeVisible()
    await expect(page.locator('.groups-nav-btn', { hasText: 'Create' })).toBeVisible()
    await expect(page.locator('.groups-nav-btn', { hasText: 'Join' })).toBeVisible()
  })

  test('should show empty state in My Groups', async ({ page }) => {
    await navigateToView(page, 'Groups')
    await expect(page.locator('.empty-state')).toContainText('No groups yet')
  })

  test('should switch to Create tab and show form', async ({ page }) => {
    await navigateToView(page, 'Groups')
    await page.locator('.groups-nav-btn', { hasText: 'Create' }).click()
    await page.waitForTimeout(200)
    await expect(page.locator('input[aria-label="Group name"]')).toBeVisible()
    await expect(page.locator('textarea[aria-label="Group description"]')).toBeVisible()
    await expect(page.locator('button', { hasText: 'Create Group' })).toBeVisible()
  })

  test('should switch to Join tab and show form', async ({ page }) => {
    await navigateToView(page, 'Groups')
    await page.locator('.groups-nav-btn', { hasText: 'Join' }).click()
    await page.waitForTimeout(200)
    await expect(page.locator('input[aria-label="Invite code"]')).toBeVisible()
    await expect(page.locator('button', { hasText: 'Join Group' })).toBeVisible()
  })

  test('should create a group via form', async ({ page }) => {
    await navigateToView(page, 'Groups')
    await page.locator('.groups-nav-btn', { hasText: 'Create' }).click()
    await page.waitForTimeout(200)
    await page.locator('input[aria-label="Group name"]').fill('Faith Walkers')
    await page.locator('textarea[aria-label="Group description"]').fill('Growing together in faith')
    await page.locator('button', { hasText: 'Create Group' }).click()
    await page.waitForTimeout(500)
  })

  test('should join a group via invite code', async ({ page }) => {
    await navigateToView(page, 'Groups')
    await page.locator('.groups-nav-btn', { hasText: 'Join' }).click()
    await page.waitForTimeout(200)
    await page.locator('input[aria-label="Invite code"]').fill('FAITH123')
    await page.locator('button', { hasText: 'Join Group' }).click()
    await page.waitForTimeout(500)
  })
})

test.describe('Community Features — Church (Premium)', () => {
  test.beforeEach(async ({ page }) => {
    await setupSkipOverlays(page)
    await setupPremiumUser(page)
    await mockApi(page)
    await waitForApp(page)
  })

  test('should navigate to Church view and show tabs', async ({ page }) => {
    await navigateToView(page, 'Church')
    await expect(page.locator('.groups-nav-btn', { hasText: 'Search' })).toBeVisible()
    await expect(page.locator('.groups-nav-btn', { hasText: 'My Churches' })).toBeVisible()
  })

  test('should show church search form', async ({ page }) => {
    await navigateToView(page, 'Church')
    await expect(page.locator('input[aria-label="Church name"]')).toBeVisible()
    await expect(page.locator('input[aria-label="City"]')).toBeVisible()
    await expect(page.locator('input[aria-label="Denomination"]')).toBeVisible()
    await expect(page.locator('.church-search-form button')).toBeVisible()
  })

  test('should show empty state in My Churches', async ({ page }) => {
    await navigateToView(page, 'Church')
    await page.locator('.groups-nav-btn', { hasText: 'My Churches' }).click()
    await page.waitForTimeout(200)
    await expect(page.locator('.empty-state')).toBeVisible()
  })

  test('should search churches', async ({ page }) => {
    await navigateToView(page, 'Church')
    await page.locator('input[aria-label="Church name"]').fill('Grace')
    await page.locator('.church-search-form button').click()
    await page.waitForTimeout(500)
  })
})

test.describe('Community Features — Events (Premium)', () => {
  test.beforeEach(async ({ page }) => {
    await setupSkipOverlays(page)
    await setupPremiumUser(page)
    await mockApi(page)
    await waitForApp(page)
  })

  test('should navigate to Events view and show create button', async ({ page }) => {
    await navigateToView(page, 'Events')
    await expect(page.locator('.btn-sm', { hasText: 'New Event' })).toBeVisible()
  })

  test('should toggle create form', async ({ page }) => {
    await navigateToView(page, 'Events')
    await page.locator('.btn-sm', { hasText: 'New Event' }).click()
    await page.waitForTimeout(200)
    await expect(page.locator('input[aria-label="Event title"]')).toBeVisible()
    await expect(page.locator('textarea[aria-label="Event description"]')).toBeVisible()
    await expect(page.locator('input[aria-label="Event location"]')).toBeVisible()
    await expect(page.locator('button', { hasText: 'Create Event' })).toBeVisible()

    await page.locator('.btn-sm', { hasText: 'Cancel' }).click()
    await page.waitForTimeout(200)
    await expect(page.locator('input[aria-label="Event title"]')).not.toBeVisible()
  })

  test('should show upcoming and past event tabs', async ({ page }) => {
    await navigateToView(page, 'Events')
    await expect(page.locator('.groups-nav-btn', { hasText: 'Upcoming' })).toBeVisible()
    await expect(page.locator('.groups-nav-btn', { hasText: 'Past' })).toBeVisible()
  })

  test('should show empty state for events', async ({ page }) => {
    await navigateToView(page, 'Events')
    await expect(page.locator('.empty-state')).toBeVisible()
  })

  test('should create an event', async ({ page }) => {
    await navigateToView(page, 'Events')
    await page.locator('.btn-sm', { hasText: 'New Event' }).click()
    await page.waitForTimeout(200)
    await page.locator('input[aria-label="Event title"]').fill('Bible Study Night')
    await page.locator('textarea[aria-label="Event description"]').fill('Weekly Bible study')
    await page.locator('input[aria-label="Event location"]').fill('Main Hall')
    await page.locator('input[aria-label="Start time"]').fill('2026-07-25T18:00')
    await page.locator('.event-create-form button').click()
    await page.waitForTimeout(500)
  })
})

test.describe('Community Features — Sermons (Premium)', () => {
  test.beforeEach(async ({ page }) => {
    await setupSkipOverlays(page)
    await setupPremiumUser(page)
    await mockApi(page)
    await waitForApp(page)
  })

  test('should navigate to Sermons view and show tabs', async ({ page }) => {
    await navigateToView(page, 'Sermons')
    await expect(page.locator('.groups-nav-btn', { hasText: 'My Notes' })).toBeVisible()
    await expect(page.locator('.groups-nav-btn', { hasText: 'New Note' })).toBeVisible()
  })

  test('should show sermon notes list with search', async ({ page }) => {
    await navigateToView(page, 'Sermons')
    await expect(page.locator('input[aria-label="Search sermon notes"]')).toBeVisible()
    await expect(page.locator('.empty-state')).toBeVisible()
  })

  test('should switch to New Note form', async ({ page }) => {
    await navigateToView(page, 'Sermons')
    await page.locator('.groups-nav-btn', { hasText: 'New Note' }).click()
    await page.waitForTimeout(200)
    await expect(page.locator('input[aria-label="Sermon title"]')).toBeVisible()
    await expect(page.locator('input[aria-label="Preacher name"]')).toBeVisible()
    await expect(page.locator('button', { hasText: 'Save Note' })).toBeVisible()
  })

  test('should create a sermon note', async ({ page }) => {
    await navigateToView(page, 'Sermons')
    await page.locator('.groups-nav-btn', { hasText: 'New Note' }).click()
    await page.waitForTimeout(200)
    await page.locator('input[aria-label="Sermon title"]').fill('Grace Beyond Measure')
    await page.locator('input[aria-label="Preacher name"]').fill('Pastor John')
    await page.locator('button', { hasText: 'Save Note' }).click()
    await page.waitForTimeout(500)
  })
})

test.describe('Community Features — Forum (Premium)', () => {
  test.beforeEach(async ({ page }) => {
    await setupSkipOverlays(page)
    await setupPremiumUser(page)
    await mockApi(page)
    await waitForApp(page)
  })

  test('should navigate to Forum view and show new thread button', async ({ page }) => {
    await navigateToView(page, 'Forum')
    await expect(page.locator('.btn-sm', { hasText: 'New Thread' })).toBeVisible()
    await expect(page.locator('.card', { hasText: 'Community Forum' })).toBeVisible()
  })

  test('should toggle new thread form', async ({ page }) => {
    await navigateToView(page, 'Forum')
    await page.locator('.btn-sm', { hasText: 'New Thread' }).click()
    await page.waitForTimeout(200)
    await expect(page.locator('.forum-new-thread select')).toBeVisible()
    await expect(page.locator('input[aria-label="Thread title"]')).toBeVisible()
    await expect(page.locator('textarea[aria-label="Thread content"]')).toBeVisible()
    await expect(page.locator('button', { hasText: 'Post Thread' })).toBeVisible()

    await page.locator('.btn-sm', { hasText: 'Cancel' }).click()
    await page.waitForTimeout(200)
    await expect(page.locator('input[aria-label="Thread title"]')).not.toBeVisible()
  })

  test('should show search and sort controls', async ({ page }) => {
    await navigateToView(page, 'Forum')
    await expect(page.locator('input[aria-label="Search threads"]')).toBeVisible()
  })

  test('should show category filter buttons', async ({ page }) => {
    await navigateToView(page, 'Forum')
    await expect(page.locator('.forum-cat-btn', { hasText: 'All' })).toBeVisible()
  })

  test('should show empty state for threads', async ({ page }) => {
    await navigateToView(page, 'Forum')
    await expect(page.locator('.empty-state')).toBeVisible()
  })

  test('should create a new thread', async ({ page }) => {
    await navigateToView(page, 'Forum')
    await page.locator('.btn-sm', { hasText: 'New Thread' }).click()
    await page.waitForTimeout(200)
    await page.locator('input[aria-label="Thread title"]').fill('How to pray effectively?')
    await page.locator('textarea[aria-label="Thread content"]').fill('I would like to learn more about effective prayer.')
    await page.locator('button', { hasText: 'Post Thread' }).click()
    await page.waitForTimeout(500)
  })
})

test.describe('Community Features — Analytics (Premium)', () => {
  test.beforeEach(async ({ page }) => {
    await setupSkipOverlays(page)
    await setupPremiumUser(page)
    await mockApi(page)
    await waitForApp(page)
  })

  test('should navigate to Analytics view and show period selector', async ({ page }) => {
    await navigateToView(page, 'Analytics')
    await expect(page.locator('.btn-sm', { hasText: 'Week' })).toBeVisible()
    await expect(page.locator('.btn-sm', { hasText: 'Month' })).toBeVisible()
    await expect(page.locator('.btn-sm', { hasText: 'Quarter' })).toBeVisible()
    await expect(page.locator('.btn-sm', { hasText: 'Year' })).toBeVisible()
    await expect(page.locator('.btn-sm', { hasText: 'All' })).toBeVisible()
  })

  test('should display analytics stat cards', async ({ page }) => {
    await navigateToView(page, 'Analytics')
    await expect(page.locator('.card', { hasText: 'Prayer Analytics' })).toBeVisible()
  })

  test('should switch period filters', async ({ page }) => {
    await navigateToView(page, 'Analytics')
    await page.locator('.btn-sm', { hasText: 'Week' }).click()
    await page.waitForTimeout(300)
    await page.locator('.btn-sm', { hasText: 'Month' }).click()
    await page.waitForTimeout(300)
    await page.locator('.btn-sm', { hasText: 'Year' }).click()
    await page.waitForTimeout(300)
    await page.locator('.btn-sm', { hasText: 'All' }).click()
    await page.waitForTimeout(300)
  })

  test('should show AI Insights card', async ({ page }) => {
    await navigateToView(page, 'Analytics')
    await expect(page.locator('.card', { hasText: 'AI Insights' })).toBeVisible()
  })

  test('should show Prayer Goals card', async ({ page }) => {
    await navigateToView(page, 'Analytics')
    await expect(page.locator('.card', { hasText: 'Prayer Goals' })).toBeVisible()
  })

  test('should show prayer goals form', async ({ page }) => {
    await navigateToView(page, 'Analytics')
    const dailyInput = page.locator('input[type="number"]').first()
    await expect(dailyInput).toBeVisible()
    await expect(page.locator('button', { hasText: 'Save Goals' })).toBeVisible()
  })
})

test.describe('Community Features — Mobile Navigation', () => {
  test.beforeEach(async ({ page }) => {
    await setupSkipOverlays(page)
    await setupPremiumUser(page)
    await mockApi(page)
    await waitForApp(page)
    await page.setViewportSize({ width: 375, height: 812 })
  })

  test('should show community section in mobile drawer for premium users', async ({ page }) => {
    await page.locator('.hamburger-btn').click()
    await page.waitForTimeout(300)
    await expect(page.locator('.mobile-drawer')).toBeVisible({ timeout: 8000 })

    const communitySection = page.locator('.mobile-drawer-section-label', { hasText: 'Community' })
    await expect(communitySection).toBeVisible()

    await expect(page.locator('.mobile-drawer-item', { hasText: 'Groups' })).toBeVisible()
    await expect(page.locator('.mobile-drawer-item', { hasText: 'Church' })).toBeVisible()
    await expect(page.locator('.mobile-drawer-item', { hasText: 'Events' })).toBeVisible()
    await expect(page.locator('.mobile-drawer-item', { hasText: 'Sermons' })).toBeVisible()
    await expect(page.locator('.mobile-drawer-item', { hasText: 'Forum' })).toBeVisible()
    await expect(page.locator('.mobile-drawer-item', { hasText: 'Analytics' })).toBeVisible()
  })

  test('should navigate to Groups via mobile drawer', async ({ page }) => {
    await navigateToView(page, 'Groups', false)
    await expect(page.locator('.groups-nav-btn', { hasText: 'My Groups' })).toBeVisible()
  })

  test('should navigate to Church via mobile drawer', async ({ page }) => {
    await navigateToView(page, 'Church', false)
    await expect(page.locator('.groups-nav-btn', { hasText: 'Search' })).toBeVisible()
  })

  test('should navigate to Events via mobile drawer', async ({ page }) => {
    await navigateToView(page, 'Events', false)
    await expect(page.locator('.btn-sm', { hasText: 'New Event' })).toBeVisible()
  })

  test('should navigate to Sermons via mobile drawer', async ({ page }) => {
    await navigateToView(page, 'Sermons', false)
    await expect(page.locator('.groups-nav-btn', { hasText: 'My Notes' })).toBeVisible()
  })

  test('should navigate to Forum via mobile drawer', async ({ page }) => {
    await navigateToView(page, 'Forum', false)
    await expect(page.locator('.btn-sm', { hasText: 'New Thread' })).toBeVisible()
  })

  test('should navigate to Analytics via mobile drawer', async ({ page }) => {
    await navigateToView(page, 'Analytics', false)
    await expect(page.locator('.btn-sm', { hasText: 'Week' })).toBeVisible()
  })
})

test.describe('Community Features — Theme Compatibility', () => {
  for (const mode of ['dark', 'light', 'grey']) {
    test(`should render community views correctly in ${mode} mode`, async ({ page }) => {
      await setupSkipOverlays(page)
      await setupPremiumUser(page)
      await mockApi(page)
      await waitForApp(page)

      await page.evaluate((m) => {
        document.documentElement.setAttribute('data-mode', m)
      }, mode)

      await navigateToView(page, 'Groups')
      await expect(page.locator('.groups-nav-btn').first()).toBeVisible()

      await navigateToView(page, 'Church')
      await expect(page.locator('.groups-nav-btn').first()).toBeVisible()

      await navigateToView(page, 'Events')
      await expect(page.locator('.card').first()).toBeVisible()

      await navigateToView(page, 'Analytics')
      await expect(page.locator('.btn-sm').first()).toBeVisible()
    })
  }
})
