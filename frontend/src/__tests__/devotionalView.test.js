import { describe, it, expect, beforeAll } from 'vitest'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const DEV_VIEW_PATH = join(__dirname, '..', 'components', 'DevotionalView.jsx')

let source
beforeAll(() => {
  source = readFileSync(DEV_VIEW_PATH, 'utf8')
})

describe('DevotionalView — in-app rendering', () => {
  it('contains no external links or redirects', () => {
    expect(source).not.toMatch(/href=|<a\s|window\.open|location\.href/)
    expect(source).not.toMatch(/https?:\/\//)
  })

  it('renders the devotional body inline (no sourceUrl redirect)', () => {
    expect(source).toContain('devotional-reader')
    expect(source).toContain('devotional-verse-block')
    expect(source).not.toContain('sourceUrl')
  })

  it('supports VerseText-field devotionals', () => {
    expect(source).toContain('verse_text')
    expect(source).toContain('verseText')
  })

  it('provides prev / next / today navigation', () => {
    expect(source).toContain('nextDevotional')
    expect(source).toContain('prevDevotional')
    expect(source).toContain('goToTodaysDevotional')
  })

  it('keeps an in-app AI study companion calling /api/devotional/study', () => {
    expect(source).toContain('/api/devotional/study')
    expect(source).toContain('devotional-study-toggle')
    expect(source).toContain('devotional-qa-btn')
  })
})

describe('DevotionalView — calendar sync', () => {
  it('uses an offset derived from getDayOfYear with a 364 clamp', () => {
    expect(source).toMatch(/Math\.min\(getDayOfYear\(\) - 1, 364\)/)
  })

  it('wraps the index modulo 365 to stay in bounds', () => {
    expect(source).toContain('% 365')
  })

  it('sets church default day to today when a church is selected', () => {
    expect(source).toMatch(/setChurchDevotionalDay\(clampedToday\)/)
  })

  it('clamps church navigation to the actual total entry count', () => {
    expect(source).toContain('churchTotal')
    expect(source).toMatch(/Math\.min\(churchTotal - 1, churchDevotionalDay \+ 1\)/)
  })
})

describe('DevotionalView — date label', () => {
  it('formats the day label from the devotional day number', () => {
    expect(source).toContain('formatDateFull')
    expect(source).toContain('devotional-date-label')
    expect(source).toMatch(/Day \{dayNumber\} of 365/)
  })
})
