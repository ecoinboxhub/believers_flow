import { describe, it, expect } from 'vitest'
import {
  startOfWeek,
  startOfMonth,
  endOfPeriod,
  shiftPeriod,
  daysInMonth,
  formatPeriodLabel,
  getFaithSummary,
} from '../faithSummaries.js'

const key = d => d.toLocaleDateString()
const dayFrom = d => new Date(d)

describe('period helpers', () => {
  it('startOfWeek returns the Monday of the week', () => {
    const wed = new Date(2026, 7, 5)
    const monday = startOfWeek(wed)
    expect(monday.getDay()).toBe(1)
    expect(monday.getDate()).toBeLessThanOrEqual(5)
    expect(monday.getMonth()).toBe(7)
  })

  it('startOfWeek treats Sunday as the last day of the week', () => {
    const sunday = new Date(2026, 7, 9)
    const monday = startOfWeek(sunday)
    const expected = new Date(2026, 7, 3)
    expect(monday.getTime()).toBe(expected.getTime())
  })

  it('startOfWeek is idempotent on a Monday', () => {
    const monday = new Date(2026, 7, 3)
    expect(startOfWeek(monday).getTime()).toBe(monday.getTime())
  })

  it('startOfMonth returns the first of the month', () => {
    expect(startOfMonth(new Date(2026, 7, 21)).getTime()).toBe(new Date(2026, 7, 1).getTime())
  })

  it('a week has 7 days', () => {
    const start = startOfWeek(new Date(2026, 7, 5))
    const end = endOfPeriod(start, 'week')
    expect((end.getTime() - start.getTime()) / 86400000).toBe(7)
  })

  it('shiftPeriod moves a week forward and backward', () => {
    const start = startOfWeek(new Date(2026, 7, 5))
    const next = shiftPeriod(start, 'week', 1)
    const prev = shiftPeriod(start, 'week', -1)
    expect((next.getTime() - start.getTime()) / 86400000).toBe(7)
    expect((start.getTime() - prev.getTime()) / 86400000).toBe(7)
    expect(next.getDay()).toBe(1)
  })

  it('shiftPeriod moves a month forward and backward', () => {
    const start = startOfMonth(new Date(2026, 7, 5))
    const next = shiftPeriod(start, 'month', 1)
    expect(next.getTime()).toBe(new Date(2026, 8, 1).getTime())
    expect(shiftPeriod(start, 'month', -1).getTime()).toBe(new Date(2026, 6, 1).getTime())
  })

  it('daysInMonth counts days in the month', () => {
    expect(daysInMonth(new Date(2026, 7, 1))).toBe(31)
    expect(daysInMonth(new Date(2026, 1, 1))).toBe(28)
    expect(daysInMonth(new Date(2028, 1, 1))).toBe(29)
  })

  it('formatPeriodLabel includes the year', () => {
    const start = startOfWeek(new Date(2026, 7, 5))
    const label = formatPeriodLabel(start, endOfPeriod(start, 'week'), 'week')
    expect(label).toContain('2026')
    const mLabel = formatPeriodLabel(new Date(2026, 7, 1), new Date(2026, 8, 1), 'month')
    expect(mLabel).toContain('2026')
  })
})

describe('getFaithSummary — weekly', () => {
  const anchor = new Date(2026, 7, 5)
  const start = startOfWeek(anchor)
  const d1 = key(dayFrom(start))
  const d2 = key(dayFrom(new Date(start.getTime() + 1 * 86400000)))
  const d3 = key(dayFrom(new Date(start.getTime() + 2 * 86400000)))
  const outside = key(dayFrom(new Date(start.getTime() - 14 * 86400000)))

  const baseData = () => ({
    prayerLogs: [
      { date: d1, minutes: 30 },
      { date: d2, minutes: 20 },
      { date: d3, minutes: 50 },
      { date: outside, minutes: 90 },
    ],
    diaryEntries: [],
    tasks: [],
    recentReads: [],
    studyPlan: { book: '', chapter: '' },
  })

  it('aggregates prayer activity for the week only', () => {
    const s = getFaithSummary(baseData(), 'week', anchor)
    expect(s.daysWithActivity).toBe(3)
    expect(s.totalMinutes).toBe(100)
    expect(s.avgMinutes).toBe(33)
    expect(s.bestDay.minutes).toBe(50)
    expect(s.longestStreak).toBe(3)
    expect(s.totalDays).toBe(7)
  })

  it('counts diary reflections and moods within the period', () => {
    const data = baseData()
    data.diaryEntries = [
      { id: 1, mood: '😊', date: new Date(start.getTime() + 1 * 86400000).toISOString() },
      { id: 2, mood: '😊', date: new Date(start.getTime() + 2 * 86400000).toISOString() },
      { id: 3, mood: '😢', date: new Date(start.getTime() - 10 * 86400000).toISOString() },
    ]
    const s = getFaithSummary(data, 'week', anchor)
    expect(s.diaryCount).toBe(2)
    expect(s.moods[0]).toEqual({ emoji: '😊', count: 2 })
  })

  it('counts completed spiritual tasks by completion time', () => {
    const data = baseData()
    const inPeriod = new Date(start.getTime() + 1 * 86400000).toISOString()
    data.tasks = [
      { id: 1, category: 'spiritual', completed: true, reminderFiredAt: inPeriod },
      { id: 2, category: 'spiritual', completed: true, reminderFiredAt: new Date(start.getTime() - 30 * 86400000).toISOString() },
      { id: 3, category: 'personal', completed: true, reminderFiredAt: inPeriod },
      { id: 4, category: 'spiritual', completed: false, reminderFiredAt: inPeriod },
    ]
    const s = getFaithSummary(data, 'week', anchor)
    expect(s.spiritualTasksCompleted).toBe(1)
  })

  it('counts bible readings from recentReads timestamps', () => {
    const data = baseData()
    data.recentReads = [
      { book: 'Psalms', chapter: 1, time: start.getTime() + 3600000 },
      { book: 'Proverbs', chapter: 3, time: start.getTime() - 5 * 86400000 },
    ]
    const s = getFaithSummary(data, 'week', anchor)
    expect(s.readings).toBe(1)
  })

  it('marks current streak when today falls in the period', () => {
    const data = baseData()
    data.prayerLogs = [
      { date: key(dayFrom(anchor)), minutes: 10 },
      { date: key(dayFrom(new Date(anchor.getTime() - 1 * 86400000))), minutes: 10 },
      { date: key(dayFrom(new Date(anchor.getTime() - 2 * 86400000))), minutes: 10 },
    ]
    const s = getFaithSummary(data, 'week', anchor)
    expect(s.currentStreak).toBe(3)
  })

  it('exposes the active study plan', () => {
    const data = baseData()
    data.studyPlan = { book: 'Romans', chapter: '8' }
    const s = getFaithSummary(data, 'week', anchor)
    expect(s.studyPlan).toEqual({ book: 'Romans', chapter: '8' })
    const empty = getFaithSummary(baseData(), 'week', anchor)
    expect(empty.studyPlan).toBeNull()
  })

  it('returns a graceful empty state when no activity exists', () => {
    const s = getFaithSummary({ prayerLogs: [], diaryEntries: [], tasks: [], recentReads: [] }, 'week', anchor)
    expect(s.hasActivity).toBe(false)
    expect(s.daysWithActivity).toBe(0)
    expect(s.encouragement).toBeNull()
  })

  it('excludes logs from the previous week', () => {
    const prevStart = shiftPeriod(start, 'week', -1)
    const data = {
      prayerLogs: [
        { date: key(dayFrom(prevStart)), minutes: 60 },
        { date: key(dayFrom(prevStart.getTime() + 1 * 86400000)), minutes: 15 },
      ],
      diaryEntries: [], tasks: [], recentReads: [],
    }
    const s = getFaithSummary(data, 'week', anchor)
    expect(s.hasActivity).toBe(false)
  })
})

describe('getFaithSummary — monthly', () => {
  const anchor = new Date(2026, 7, 15)
  const monthStart = startOfMonth(anchor)

  const logs = []
  for (let i = 0; i < 6; i++) {
    logs.push({ date: key(dayFrom(new Date(2026, 7, i + 1))), minutes: 10 })
  }

  it('computes monthly aggregates over the full month', () => {
    const s = getFaithSummary({ prayerLogs: logs, diaryEntries: [], tasks: [], recentReads: [] }, 'month', anchor)
    expect(s.totalDays).toBe(31)
    expect(s.daysWithActivity).toBe(6)
    expect(s.totalMinutes).toBe(60)
    expect(s.avgMinutes).toBe(10)
    expect(s.longestStreak).toBe(6)
  })

  it('month shift keeps month bounds', () => {
    const next = shiftPeriod(monthStart, 'month', 1)
    expect(next.getTime()).toBe(new Date(2026, 8, 1).getTime())
    const s = getFaithSummary({ prayerLogs: [], diaryEntries: [], tasks: [], recentReads: [] }, 'month', anchor)
    expect(s.start.getTime()).toBe(monthStart.getTime())
  })
})
