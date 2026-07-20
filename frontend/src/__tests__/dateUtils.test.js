import { describe, it, expect, vi, afterEach } from 'vitest'
import {
  getDayOfYear,
  formatDateFull,
  formatDateTime,
  formatTimeShort,
  getGreeting,
  getTodayISO,
  getTodaySeed,
  getDateInTz,
  getNow,
  getAllTimezones,
  getUserTimezone,
  getUserTimezoneAbbr,
  getUserTimezoneOffset,
  getUserNow,
  DAYS,
  MONTHS,
} from '../dateUtils.js'

describe('getDayOfYear', () => {
  it('returns 1 for January 1', () => {
    const date = new Date(2026, 0, 1)
    expect(getDayOfYear(date)).toBe(1)
  })

  it('returns 365 for December 31 in non-leap year', () => {
    const date = new Date(2026, 11, 31)
    expect(getDayOfYear(date)).toBe(365)
  })

  it('returns 366 for December 31 in leap year', () => {
    const date = new Date(2028, 11, 31)
    expect(getDayOfYear(date)).toBe(366)
  })

  it('returns correct day for mid-year', () => {
    const date = new Date(2026, 5, 15)
    expect(getDayOfYear(date)).toBe(166)
  })
})

describe('formatDateFull', () => {
  it('formats a known date correctly', () => {
    const date = new Date(2026, 6, 4)
    const result = formatDateFull(date)
    expect(result).toBe('Saturday, July 4, 2026')
  })

  it('formats January 1 correctly', () => {
    const date = new Date(2026, 0, 1)
    const result = formatDateFull(date)
    expect(result).toBe('Thursday, January 1, 2026')
  })
})

describe('formatDateTime', () => {
  it('formats morning time correctly', () => {
    const date = new Date(2026, 6, 4, 9, 30)
    const result = formatDateTime(date)
    expect(result).toBe('Saturday, July 4, 2026 9:30 AM')
  })

  it('formats afternoon time correctly', () => {
    const date = new Date(2026, 6, 4, 14, 15)
    const result = formatDateTime(date)
    expect(result).toBe('Saturday, July 4, 2026 2:15 PM')
  })

  it('formats midnight correctly', () => {
    const date = new Date(2026, 6, 4, 0, 0)
    const result = formatDateTime(date)
    expect(result).toBe('Saturday, July 4, 2026 12:00 AM')
  })

  it('formats noon correctly', () => {
    const date = new Date(2026, 6, 4, 12, 0)
    const result = formatDateTime(date)
    expect(result).toBe('Saturday, July 4, 2026 12:00 PM')
  })
})

describe('formatTimeShort', () => {
  it('formats morning time', () => {
    const date = new Date(2026, 6, 4, 8, 5)
    expect(formatTimeShort(date)).toBe('8:05 AM')
  })

  it('formats afternoon time', () => {
    const date = new Date(2026, 6, 4, 15, 45)
    expect(formatTimeShort(date)).toBe('3:45 PM')
  })

  it('formats midnight', () => {
    const date = new Date(2026, 6, 4, 0, 0)
    expect(formatTimeShort(date)).toBe('12:00 AM')
  })

  it('formats noon', () => {
    const date = new Date(2026, 6, 4, 12, 0)
    expect(formatTimeShort(date)).toBe('12:00 PM')
  })

  it('pads single digit minutes', () => {
    const date = new Date(2026, 6, 4, 9, 3)
    expect(formatTimeShort(date)).toBe('9:03 AM')
  })
})

describe('getGreeting', () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  it('returns morning greeting for 6 AM', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2026, 6, 4, 6, 0, 0))
    const result = getGreeting()
    expect(result.msg).toContain('Good morning')
  })

  it('returns afternoon greeting for 1 PM', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2026, 6, 4, 13, 0, 0))
    const result = getGreeting()
    expect(result.msg).toContain('Good afternoon')
  })

  it('returns evening greeting for 7 PM', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2026, 6, 4, 19, 0, 0))
    const result = getGreeting()
    expect(result.msg).toContain('Good evening')
  })

  it('returns night greeting for 11 PM', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2026, 6, 4, 23, 0, 0))
    const result = getGreeting()
    expect(result.msg).toContain('Good night')
  })

  it('returns night greeting for 3 AM', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2026, 6, 4, 3, 0, 0))
    const result = getGreeting()
    expect(result.msg).toContain('Good night')
  })

  it('returns morning greeting for 10:59 AM (WAT-adjusted boundary)', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2026, 6, 4, 10, 59, 0))
    const result = getGreeting()
    expect(result.msg).toContain('Good morning')
  })

  it('returns afternoon greeting for 12:00 PM', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2026, 6, 4, 12, 0, 0))
    const result = getGreeting()
    expect(result.msg).toContain('Good afternoon')
  })

  it('returns morning greeting for 5 AM (boundary)', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2026, 6, 4, 5, 0, 0))
    const result = getGreeting()
    expect(result.msg).toContain('Good morning')
  })
})

describe('getTodayISO', () => {
  it('returns ISO format YYYY-MM-DD', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2026, 6, 4, 10, 0, 0))
    expect(getTodayISO()).toBe('2026-07-04')
  })

  it('pads single digit month and day', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2026, 0, 5, 10, 0, 0))
    expect(getTodayISO()).toBe('2026-01-05')
  })
})

describe('getTodaySeed', () => {
  it('returns numeric seed YYYYMMDD', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2026, 6, 4, 10, 0, 0))
    expect(getTodaySeed()).toBe(20260704)
  })

  it('pads single digit month and day', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2026, 0, 5, 10, 0, 0))
    expect(getTodaySeed()).toBe(20260105)
  })
})

describe('getDateInTz', () => {
  it('returns a Date object for WAT', () => {
    const result = getDateInTz('WAT')
    expect(result).toBeInstanceOf(Date)
    expect(result.getTime()).not.toBeNaN()
  })

  it('returns valid date for UTC', () => {
    const result = getDateInTz('UTC')
    expect(result).toBeInstanceOf(Date)
    expect(result.getTime()).not.toBeNaN()
  })

  it('returns valid date by IANA id', () => {
    const result = getDateInTz('Africa/Lagos')
    expect(result).toBeInstanceOf(Date)
    expect(result.getTime()).not.toBeNaN()
  })

  it('returns valid date for unknown timezone (falls back to system time)', () => {
    const before = Date.now()
    const result = getDateInTz('Invalid/Timezone')
    const after = Date.now()
    expect(result).toBeInstanceOf(Date)
    expect(result.getTime()).toBeGreaterThanOrEqual(before - 1000)
    expect(result.getTime()).toBeLessThanOrEqual(after + 1000)
  })

  it('WAT and UTC differ by 1 hour', () => {
    const wat = getDateInTz('WAT')
    const utc = getDateInTz('UTC')
    const diffMinutes = Math.round((wat.getTime() - utc.getTime()) / 60000)
    expect(diffMinutes).toBe(60)
  })

  it('returns correct WAT hour when system clock is set', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-07-17T10:37:00Z'))
    const wat = getDateInTz('WAT')
    expect(wat.getHours()).toBe(11)
    expect(wat.getMinutes()).toBe(37)
    vi.useRealTimers()
  })

  it('returns correct EST hour when system clock is set', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-07-17T15:00:00Z'))
    const est = getDateInTz('America/New_York')
    expect(est.getHours()).toBe(11)
    vi.useRealTimers()
  })

  it('returns correct JST hour when system clock is set', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-07-17T03:00:00Z'))
    const jst = getDateInTz('Asia/Tokyo')
    expect(jst.getHours()).toBe(12)
    vi.useRealTimers()
  })

  it('returns correct IST (India) half-hour offset', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-07-17T00:00:00Z'))
    const ist = getDateInTz('Asia/Kolkata')
    expect(ist.getHours()).toBe(5)
    expect(ist.getMinutes()).toBe(30)
    vi.useRealTimers()
  })
})

describe('getNow', () => {
  it('returns a Date in WAT timezone', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-07-17T10:37:00Z'))
    const now = getNow()
    expect(now.getHours()).toBe(11)
    expect(now.getMinutes()).toBe(37)
    vi.useRealTimers()
  })

  it('returns today\'s date in WAT', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-07-17T23:00:00Z'))
    const now = getNow()
    expect(now.getDate()).toBe(18)
    vi.useRealTimers()
  })
})

describe('getAllTimezones', () => {
  it('returns an array with all timezone entries', () => {
    const result = getAllTimezones()
    expect(Array.isArray(result)).toBe(true)
    expect(result.length).toBe(18)
  })

  it('each entry has hours and minutes strings', () => {
    const result = getAllTimezones()
    for (const tz of result) {
      expect(typeof tz.hours).toBe('string')
      expect(typeof tz.minutes).toBe('string')
      expect(tz.hours).toMatch(/^\d{2}$/)
      expect(tz.minutes).toMatch(/^\d{2}$/)
    }
  })

  it('UTC and WAT differ by 1 hour', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-07-17T10:00:00Z'))
    const result = getAllTimezones()
    const utc = result.find(t => t.id === 'UTC')
    const wat = result.find(t => t.id === 'WAT')
    expect(parseInt(wat.hours)).toBe(parseInt(utc.hours) + 1)
    vi.useRealTimers()
  })

  it('handles midnight rollover (WAT is next day vs UTC)', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-07-17T23:30:00Z'))
    const result = getAllTimezones()
    const utc = result.find(t => t.id === 'UTC')
    const wat = result.find(t => t.id === 'WAT')
    expect(utc.hours).toBe('23')
    expect(wat.hours).toBe('00')
    vi.useRealTimers()
  })
})

describe('getUserTimezone', () => {
  it('returns a string', () => {
    const result = getUserTimezone()
    expect(typeof result).toBe('string')
  })

  it('returns a non-empty string', () => {
    const result = getUserTimezone()
    expect(result.length).toBeGreaterThan(0)
  })
})

describe('getUserTimezoneAbbr', () => {
  it('returns a string', () => {
    const result = getUserTimezoneAbbr()
    expect(typeof result).toBe('string')
  })

  it('returns a non-empty string', () => {
    const result = getUserTimezoneAbbr()
    expect(result.length).toBeGreaterThan(0)
  })
})

describe('getUserTimezoneOffset', () => {
  it('returns a number', () => {
    const result = getUserTimezoneOffset()
    expect(typeof result).toBe('number')
  })

  it('returns a finite number', () => {
    const result = getUserTimezoneOffset()
    expect(Number.isFinite(result)).toBe(true)
  })
})

describe('getUserNow', () => {
  it('returns a Date object', () => {
    const result = getUserNow()
    expect(result).toBeInstanceOf(Date)
  })

  it('returns valid time', () => {
    const result = getUserNow()
    expect(result.getTime()).not.toBeNaN()
  })
})

describe('DAYS and MONTHS constants', () => {
  it('DAYS has 7 entries', () => {
    expect(DAYS).toHaveLength(7)
  })

  it('MONTHS has 12 entries', () => {
    expect(MONTHS).toHaveLength(12)
  })

  it('DAYS starts with Sunday', () => {
    expect(DAYS[0]).toBe('Sunday')
  })

  it('MONTHS starts with January', () => {
    expect(MONTHS[0]).toBe('January')
  })
})

describe('Cross-timezone consistency', () => {
  it('all 18 timezones return valid hours 0-23', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-07-17T12:00:00Z'))
    const result = getAllTimezones()
    for (const tz of result) {
      const h = parseInt(tz.hours)
      expect(h).toBeGreaterThanOrEqual(0)
      expect(h).toBeLessThanOrEqual(23)
    }
    vi.useRealTimers()
  })

  it('timezones are ordered by offset (WAT first, NZST last)', () => {
    const result = getAllTimezones()
    expect(result[0].id).toBe('WAT')
    expect(result[result.length - 1].id).toBe('NZST')
  })
})
