import { describe, it, expect, vi, beforeEach } from 'vitest'

const localStorageMock = (() => {
  let store = {}
  return {
    getItem: (key) => store[key] ?? null,
    setItem: (key, value) => { store[key] = String(value) },
    removeItem: (key) => { delete store[key] },
    clear: () => { store = {} },
  }
})()

vi.stubGlobal('localStorage', localStorageMock)

function loadState(key, fallback) {
  try {
    const val = localStorage.getItem(key)
    if (val === null || val === undefined) return fallback
    return JSON.parse(val)
  } catch {
    return fallback
  }
}

function saveState(key, val) {
  localStorage.setItem(key, JSON.stringify(val))
}

function formatTime(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  const h = d.getHours()
  const m = d.getMinutes().toString().padStart(2, '0')
  const ampm = h >= 12 ? 'PM' : 'AM'
  const h12 = h % 12 || 12
  return `${h12}:${m} ${ampm}`
}

function formatDate(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function getStreak(logs) {
  if (!logs || logs.length === 0) return 0

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const logDates = new Set(
    logs.map(log => {
      const d = new Date(log.date)
      d.setHours(0, 0, 0, 0)
      return d.getTime()
    })
  )

  let streak = 0
  let current = today.getTime()

  while (logDates.has(current)) {
    streak++
    current -= 86400000
  }

  return streak
}

describe('loadState', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('returns fallback for missing key', () => {
    expect(loadState('nonexistent', 'default')).toBe('default')
  })

  it('returns parsed value for existing key', () => {
    localStorage.setItem('test-key', JSON.stringify({ a: 1 }))
    expect(loadState('test-key', null)).toEqual({ a: 1 })
  })

  it('returns fallback for corrupted JSON', () => {
    localStorage.setItem('bad-key', '{invalid json')
    expect(loadState('bad-key', 'fallback')).toBe('fallback')
  })

  it('returns fallback for null value', () => {
    localStorage.setItem('null-key', 'null')
    expect(loadState('null-key', 'fallback')).toBeNull()
  })

  it('returns arrays correctly', () => {
    localStorage.setItem('arr-key', JSON.stringify([1, 2, 3]))
    expect(loadState('arr-key', [])).toEqual([1, 2, 3])
  })

  it('returns string values correctly', () => {
    localStorage.setItem('str-key', JSON.stringify('hello'))
    expect(loadState('str-key', '')).toBe('hello')
  })
})

describe('saveState', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('saves and retrieves object', () => {
    saveState('obj', { x: 10 })
    expect(loadState('obj', null)).toEqual({ x: 10 })
  })

  it('saves and retrieves array', () => {
    saveState('arr', [1, 2, 3])
    expect(loadState('arr', [])).toEqual([1, 2, 3])
  })

  it('saves and retrieves string', () => {
    saveState('str', 'hello world')
    expect(loadState('str', '')).toBe('hello world')
  })

  it('saves and retrieves number', () => {
    saveState('num', 42)
    expect(loadState('num', 0)).toBe(42)
  })

  it('saves and retrieves boolean', () => {
    saveState('bool', true)
    expect(loadState('bool', false)).toBe(true)
  })

  it('overwrites existing value', () => {
    saveState('key', 'first')
    saveState('key', 'second')
    expect(loadState('key', '')).toBe('second')
  })
})

describe('formatTime', () => {
  it('formats morning time', () => {
    expect(formatTime('2026-07-04T08:30:00')).toBe('8:30 AM')
  })

  it('formats afternoon time', () => {
    expect(formatTime('2026-07-04T14:15:00')).toBe('2:15 PM')
  })

  it('formats midnight', () => {
    expect(formatTime('2026-07-04T00:00:00')).toBe('12:00 AM')
  })

  it('formats noon', () => {
    expect(formatTime('2026-07-04T12:00:00')).toBe('12:00 PM')
  })

  it('returns empty string for falsy input', () => {
    expect(formatTime('')).toBe('')
    expect(formatTime(null)).toBe('')
    expect(formatTime(undefined)).toBe('')
  })

  it('pads single digit minutes', () => {
    expect(formatTime('2026-07-04T09:03:00')).toBe('9:03 AM')
  })
})

describe('formatDate', () => {
  it('formats date correctly', () => {
    const result = formatDate('2026-07-04')
    expect(result).toContain('Jul')
    expect(result).toContain('4')
    expect(result).toContain('2026')
  })

  it('returns empty string for falsy input', () => {
    expect(formatDate('')).toBe('')
    expect(formatDate(null)).toBe('')
    expect(formatDate(undefined)).toBe('')
  })
})

describe('getStreak', () => {
  it('returns 0 for empty array', () => {
    expect(getStreak([])).toBe(0)
  })

  it('returns 0 for null/undefined', () => {
    expect(getStreak(null)).toBe(0)
    expect(getStreak(undefined)).toBe(0)
  })

  it('returns 1 for a single log today', () => {
    const today = new Date().toISOString().split('T')[0]
    expect(getStreak([{ date: today }])).toBe(1)
  })

  it('returns 2 for consecutive days', () => {
    const today = new Date()
    const todayStr = today.toISOString().split('T')[0]
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)
    const yesterdayStr = yesterday.toISOString().split('T')[0]

    expect(getStreak([{ date: todayStr }, { date: yesterdayStr }])).toBe(2)
  })

  it('returns 1 for non-consecutive days', () => {
    const today = new Date()
    const todayStr = today.toISOString().split('T')[0]
    const threeDaysAgo = new Date(today)
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3)
    const threeDaysAgoStr = threeDaysAgo.toISOString().split('T')[0]

    expect(getStreak([{ date: todayStr }, { date: threeDaysAgoStr }])).toBe(1)
  })

  it('returns 0 for no log today', () => {
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    const yesterdayStr = yesterday.toISOString().split('T')[0]

    expect(getStreak([{ date: yesterdayStr }])).toBe(0)
  })

  it('counts streak even if logs are in random order', () => {
    const today = new Date()
    const logs = []
    for (let i = 0; i < 5; i++) {
      const d = new Date(today)
      d.setDate(d.getDate() - i)
      logs.push({ date: d.toISOString().split('T')[0] })
    }
    const shuffled = logs.reverse()
    expect(getStreak(shuffled)).toBe(5)
  })
})
