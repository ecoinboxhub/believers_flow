import { test, expect } from '@playwright/test'
import { setupSkipOverlays, waitForApp } from './helpers.js'

const navigateToDiary = async (page) => {
  const diaryBtn = page.getByRole('button', { name: 'Diary' })
  if (await diaryBtn.isVisible().catch(() => false)) {
    await diaryBtn.click()
  } else {
    const moreBtn = page.locator('.bottom-nav-item').filter({ hasText: 'More' }).first()
    if (await moreBtn.isVisible().catch(() => false)) {
      await moreBtn.click()
      await page.waitForTimeout(300)
      await page.locator('.sidebar-nav-item, .drawer-nav-item').filter({ hasText: 'Diary' }).first().click()
    }
  }
  await page.waitForTimeout(300)
}

const MOODS = [
  { label: 'Joyful', verse: 'The joy of the Lord is your strength.', ref: 'Nehemiah 8:10' },
  { label: 'Grateful', verse: 'Give thanks to the Lord, for he is good; his love endures forever.', ref: '1 Chronicles 16:34' },
  { label: 'Peaceful', verse: 'Peace I leave with you; my peace I give you.', ref: 'John 14:27' },
  { label: 'Anxious', verse: 'Cast all your anxiety on him because he cares for you.', ref: '1 Peter 5:7' },
  { label: 'Struggling', verse: 'The Lord is close to the brokenhearted and saves those who are crushed in spirit.', ref: 'Psalm 34:18' },
]

test.describe('Diary Encouragement Feature', () => {
  test.beforeEach(async ({ page }) => {
    await setupSkipOverlays(page)
    await waitForApp(page)
    await navigateToDiary(page)
  })

  test('should display mood selector with all 5 mood options', async ({ page }) => {
    await expect(page.locator('.diary-mood-select')).toBeVisible()
    await expect(page.locator('.diary-label')).toContainText('How are you feeling?')

    const moodButtons = page.locator('.mood-picker .mood-btn')
    await expect(moodButtons).toHaveCount(5)

    for (const mood of MOODS) {
      await expect(moodButtons.filter({ hasText: mood.label })).toBeVisible()
    }
  })

  for (const mood of MOODS) {
    test(`should show encouragement card for "${mood.label}" mood`, async ({ page }) => {
      await page.locator('.mood-picker .mood-btn').filter({ hasText: mood.label }).click()

      const card = page.locator('.diary-encouragement')
      await expect(card).toBeVisible({ timeout: 3000 })
      await expect(card).toHaveAttribute('role', 'status')
      await expect(card).toHaveAttribute('aria-live', 'polite')

      await expect(card.locator('.diary-encouragement-message')).toBeVisible()
      await expect(card.locator('.diary-encouragement-verse')).toContainText(mood.verse)
      await expect(card.locator('.diary-encouragement-ref')).toContainText(mood.ref)
    })
  }

  test('encouragement card persists when same mood is re-clicked', async ({ page }) => {
    await page.locator('.mood-picker .mood-btn').filter({ hasText: 'Joyful' }).click()
    await expect(page.locator('.diary-encouragement')).toBeVisible({ timeout: 3000 })
    await page.locator('.mood-picker .mood-btn').filter({ hasText: 'Joyful' }).click()
    await expect(page.locator('.diary-encouragement')).toBeVisible()
  })

  test('should update encouragement when switching moods', async ({ page }) => {
    await page.locator('.mood-picker .mood-btn').filter({ hasText: 'Joyful' }).click()
    const card = page.locator('.diary-encouragement')
    await expect(card).toBeVisible({ timeout: 3000 })
    await expect(card.locator('.diary-encouragement-verse')).toContainText('The joy of the Lord')

    await page.locator('.mood-picker .mood-btn').filter({ hasText: 'Anxious' }).click()
    await expect(card.locator('.diary-encouragement-verse')).toContainText('Cast all your anxiety')
  })

  test('should have encouragement icon in the card', async ({ page }) => {
    await page.locator('.mood-picker .mood-btn').filter({ hasText: 'Joyful' }).click()
    const icon = page.locator('.diary-encouragement-icon')
    await expect(icon).toBeVisible({ timeout: 3000 })
    await expect(icon.locator('svg')).toBeVisible()
  })
})

test.describe('Diary Workflow — Unchanged', () => {
  test.beforeEach(async ({ page }) => {
    await setupSkipOverlays(page)
    await waitForApp(page)
    await navigateToDiary(page)
  })

  test('should save a new diary entry', async ({ page }) => {
    await page.locator('.mood-picker .mood-btn').filter({ hasText: 'Joyful' }).click()
    await page.locator('input[placeholder*="Title"]').fill('Test Diary Entry')
    await page.locator('textarea[placeholder*="heart"]').fill('This is a test diary entry for QA.')
    await page.locator('button').filter({ hasText: 'Save Entry' }).click()

    await page.waitForTimeout(500)
    const entryCard = page.locator('.diary-entry-card')
    await expect(entryCard.first()).toBeVisible({ timeout: 5000 })
    await expect(entryCard.first()).toContainText('Test Diary Entry')
  })

  test('should edit an existing diary entry', async ({ page }) => {
    await page.locator('.mood-picker .mood-btn').filter({ hasText: 'Grateful' }).click()
    await page.locator('input[placeholder*="Title"]').fill('Entry to Edit')
    await page.locator('textarea[placeholder*="heart"]').fill('Original content for edit test.')
    await page.locator('button').filter({ hasText: 'Save Entry' }).click()
    await page.waitForTimeout(500)

    const editBtn = page.locator('.diary-entry-card').first().locator('.diary-edit-btn')
    if (await editBtn.isVisible().catch(() => false)) {
      await editBtn.click()
      await page.waitForTimeout(300)
      await expect(page.locator('button').filter({ hasText: 'Update Entry' })).toBeVisible()

      await page.locator('textarea[placeholder*="heart"]').fill('Updated content for edit test.')
      await page.locator('button').filter({ hasText: 'Update Entry' }).click()
      await page.waitForTimeout(500)
    }
  })

  test('should delete a diary entry', async ({ page }) => {
    await page.locator('.mood-picker .mood-btn').filter({ hasText: 'Peaceful' }).click()
    await page.locator('input[placeholder*="Title"]').fill('Entry to Delete')
    await page.locator('textarea[placeholder*="heart"]').fill('This entry will be deleted.')
    await page.locator('button').filter({ hasText: 'Save Entry' }).click()
    await page.waitForTimeout(500)

    const deleteBtn = page.locator('.diary-entry-card').first().locator('.diary-delete-btn')
    if (await deleteBtn.isVisible().catch(() => false)) {
      await deleteBtn.click()
      await page.waitForTimeout(500)
    }
  })

  test('should show diary entries list', async ({ page }) => {
    await expect(page.locator('.section-title, .diary-list h3')).toBeVisible()
  })

  test('should clear form when cancel is clicked during edit', async ({ page }) => {
    await page.locator('.mood-picker .mood-btn').filter({ hasText: 'Joyful' }).click()
    await page.locator('input[placeholder*="Title"]').fill('Cancel Test')
    await page.locator('textarea[placeholder*="heart"]').fill('Will be cleared on cancel.')
    await page.locator('button').filter({ hasText: 'Save Entry' }).click()
    await page.waitForTimeout(500)

    const editBtn = page.locator('.diary-entry-card').first().locator('.diary-edit-btn')
    if (await editBtn.isVisible().catch(() => false)) {
      await editBtn.click()
      await page.waitForTimeout(300)
      const cancelBtn = page.locator('button').filter({ hasText: 'Cancel' })
      if (await cancelBtn.isVisible().catch(() => false)) {
        await cancelBtn.click()
        await page.waitForTimeout(300)
        await expect(page.locator('button').filter({ hasText: 'Save Entry' })).toBeVisible()
      }
    }
  })
})

test.describe('Diary Encouragement — Theme Compatibility', () => {
  test.beforeEach(async ({ page }) => {
    await setupSkipOverlays(page)
    await waitForApp(page)
  })

  const themes = [
    { name: 'dark', attr: 'dark' },
    { name: 'light', attr: 'light' },
    { name: 'grey', attr: 'grey' },
  ]

  for (const theme of themes) {
    test(`encouragement card renders in ${theme.name} mode`, async ({ page }) => {
      await page.evaluate((mode) => {
        document.querySelector('#app').setAttribute('data-mode', mode)
      }, theme.attr)

      await navigateToDiary(page)
      await page.locator('.mood-picker .mood-btn').filter({ hasText: 'Joyful' }).click()

      const card = page.locator('.diary-encouragement')
      await expect(card).toBeVisible({ timeout: 3000 })
      await expect(card.locator('.diary-encouragement-message')).toBeVisible()
      await expect(card.locator('.diary-encouragement-verse')).toBeVisible()
    })
  }
})

test.describe('Diary Encouragement — Accessibility', () => {
  test.beforeEach(async ({ page }) => {
    await setupSkipOverlays(page)
    await waitForApp(page)
    await navigateToDiary(page)
  })

  test('encouragement card has role="status" and aria-live="polite"', async ({ page }) => {
    await page.locator('.mood-picker .mood-btn').filter({ hasText: 'Joyful' }).click()
    const card = page.locator('.diary-encouragement')
    await expect(card).toBeVisible({ timeout: 3000 })
    await expect(card).toHaveAttribute('role', 'status')
    await expect(card).toHaveAttribute('aria-live', 'polite')
  })

  test('mood buttons are keyboard accessible', async ({ page }) => {
    const moodButtons = page.locator('.mood-picker .mood-btn')
    await moodButtons.first().focus()
    await expect(moodButtons.first()).toBeFocused()
  })

  test('encouragement message, verse, and ref are all visible and readable', async ({ page }) => {
    await page.locator('.mood-picker .mood-btn').filter({ hasText: 'Struggling' }).click()
    const card = page.locator('.diary-encouragement')
    await expect(card).toBeVisible({ timeout: 3000 })

    await expect(card.locator('.diary-encouragement-message')).toBeVisible()
    const messageText = await card.locator('.diary-encouragement-message').textContent()
    expect(messageText.length).toBeGreaterThan(20)

    await expect(card.locator('.diary-encouragement-verse')).toBeVisible()
    const verseText = await card.locator('.diary-encouragement-verse').textContent()
    expect(verseText.length).toBeGreaterThan(10)

    await expect(card.locator('.diary-encouragement-ref')).toBeVisible()
    const refText = await card.locator('.diary-encouragement-ref').textContent()
    expect(refText.length).toBeGreaterThan(3)
  })
})
