// faithSummaries.js
// Pure helpers that compute Weekly and Monthly Faith Summaries from the user's
// recorded faith activity. All functions are deterministic, never mutate input
// data, and work fully offline from local state (no storage writes).

// Weeks start on Monday to match standard calendar conventions. Period bounds
// follow the same day-key convention used to record prayer logs
// (Date.prototype.toLocaleDateString), so summaries stay consistent with the
// app's existing streak logic across locales.

export function startOfWeek(date) {
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate())
  const diff = (d.getDay() + 6) % 7 // days since Monday (0 = Mon ... 6 = Sun)
  d.setDate(d.getDate() - diff)
  return d
}

export function startOfMonth(date) {
  return new Date(date.getFullYear(), date.getMonth(), 1)
}

export function startOfPeriod(date, periodType) {
  return periodType === 'month' ? startOfMonth(date) : startOfWeek(date)
}

// Exclusive end of a period (start of the following period).
export function endOfPeriod(start, periodType) {
  const d = new Date(start)
  if (periodType === 'month') d.setMonth(d.getMonth() + 1)
  else d.setDate(d.getDate() + 7)
  return d
}

// Shift a period start forward (dir = 1) or backward (dir = -1).
export function shiftPeriod(start, periodType, dir) {
  const d = new Date(start)
  if (periodType === 'month') d.setMonth(d.getMonth() + dir)
  else d.setDate(d.getDate() + 7 * dir)
  return startOfPeriod(d, periodType)
}

export function formatPeriodLabel(start, end, periodType) {
  if (periodType === 'month') {
    return start.toLocaleDateString([], { month: 'long', year: 'numeric' })
  }
  const lastDay = new Date(end)
  lastDay.setDate(lastDay.getDate() - 1)
  const fmt = date => date.toLocaleDateString([], { month: 'short', day: 'numeric' })
  return `${fmt(start)} – ${fmt(lastDay)}, ${lastDay.getFullYear()}`
}

export function daysInMonth(monthStart) {
  return new Date(monthStart.getFullYear(), monthStart.getMonth() + 1, 0).getDate()
}

// Build the list of day objects (date + locale key) spanning [start, end).
function buildDays(start, end) {
  const days = []
  const d = new Date(start)
  while (d < end) {
    const copy = new Date(d)
    days.push({ date: copy, key: copy.toLocaleDateString() })
    d.setDate(d.getDate() + 1)
  }
  return days
}

function getLongestStreak(days, activityKeys) {
  let longest = 0
  let run = 0
  for (const day of days) {
    if (activityKeys.has(day.key)) run++
    else run = 0
    if (run > longest) longest = run
  }
  return longest
}

// Consecutive prayer days ending on `today` (mirrors the app's getStreak).
function getCurrentStreak(allPrayerKeys, today) {
  let streak = 0
  for (let i = 0; i < 366; i++) {
    const d = new Date(today)
    d.setDate(d.getDate() - i)
    if (allPrayerKeys.has(d.toLocaleDateString())) streak++
    else if (i > 0) break
  }
  return streak
}

function pickEncouragement(summary, periodType) {
  if (periodType === 'week') {
    const n = summary.daysWithActivity
    if (n >= 6) return { message: `Remarkable week of prayer — you met with God on ${n} of 7 days!`, verse: 'Let us not become weary in doing good, for at the proper time we will reap a harvest if we do not give up.', ref: 'Galatians 6:9' }
    if (n >= 4) return { message: `Great rhythm! You carved out time for the Lord on ${n} days this week.`, verse: 'Draw near to God and he will draw near to you.', ref: 'James 4:8' }
    if (n >= 2) return { message: `You're building a beautiful habit — ${n} days of prayer this week. Keep showing up.`, verse: 'The Lord is near to all who call on him.', ref: 'Psalm 145:18' }
    if (n === 1) return { message: 'Every step matters. A day spent in prayer is the beginning of something beautiful.', verse: 'In all your ways acknowledge him, and he will make straight your paths.', ref: 'Proverbs 3:6' }
    if (summary.diaryCount > 0 || summary.spiritualTasksCompleted > 0 || summary.readings > 0) {
      return { message: 'You stayed engaged with your faith this week through reflection and service.', verse: 'But seek first his kingdom and his righteousness.', ref: 'Matthew 6:33' }
    }
    return null
  }

  const totalDays = summary.totalDays
  const pct = totalDays > 0 ? Math.round((summary.daysWithActivity / totalDays) * 100) : 0
  if (pct >= 75) return { message: `Exceptional faithfulness — you prayed on ${summary.daysWithActivity} of ${totalDays} days this month!`, verse: 'Great is his faithfulness; his mercies begin afresh each morning.', ref: 'Lamentations 3:23' }
  if (pct >= 50) return { message: `A strong month of spiritual growth — ${summary.daysWithActivity} days of prayer and counting.`, verse: 'But those who hope in the Lord will renew their strength.', ref: 'Isaiah 40:31' }
  if (pct >= 25) return { message: 'Good progress this month. Consistency, not perfection, deepens a walk with God.', verse: 'Delight yourself in the Lord, and he will give you the desires of your heart.', ref: 'Psalm 37:4' }
  if (pct > 0) return { message: `You made room for God on ${summary.daysWithActivity} day${summary.daysWithActivity === 1 ? '' : 's'} this month. He rejoices in every step.`, verse: 'The Lord takes delight in his people.', ref: 'Psalm 149:4' }
  if (summary.diaryCount > 0 || summary.spiritualTasksCompleted > 0 || summary.readings > 0) {
    return { message: 'This month you nurtured your spirit through journaling and service.', verse: 'Let everything that has breath praise the Lord.', ref: 'Psalm 150:6' }
  }
  return null
}

/**
 * Compute a Faith Summary for a period.
 * @param {Object} data - { prayerLogs, diaryEntries, tasks, recentReads, studyPlan }
 * @param {'week'|'month'} periodType
 * @param {Date} [anchor] - any date inside the desired period (defaults to local now)
 * @returns {Object} summary
 */
export function getFaithSummary(data = {}, periodType = 'week', anchor) {
  const now = anchor ? new Date(anchor) : new Date()
  const start = startOfPeriod(now, periodType)
  const end = endOfPeriod(start, periodType)
  const days = buildDays(start, end)

  const prayerLogs = data.prayerLogs || []
  const diaryEntries = data.diaryEntries || []
  const tasks = data.tasks || []
  const recentReads = data.recentReads || []

  // --- Prayer activity (logs store date as toLocaleDateString) ---
  const prayerByKey = {}
  const allPrayerKeys = new Set()
  for (const log of prayerLogs) {
    if (!log || !log.date) continue
    allPrayerKeys.add(log.date)
    if (!prayerByKey[log.date]) prayerByKey[log.date] = { minutes: 0 }
    prayerByKey[log.date].minutes += parseInt(log.minutes, 10) || 0
  }

  let daysWithActivity = 0
  let totalMinutes = 0
  let bestDay = null
  for (const day of days) {
    const rec = prayerByKey[day.key]
    if (!rec) continue
    daysWithActivity++
    totalMinutes += rec.minutes
    if (!bestDay || rec.minutes > bestDay.minutes) {
      bestDay = { date: day.date, minutes: rec.minutes }
    }
  }

  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const inCurrent = now.getTime() >= start.getTime() && now.getTime() < end.getTime()

  // --- Diary reflections ---
  const moodCounts = {}
  let diaryCount = 0
  for (const e of diaryEntries) {
    if (!e || !e.date) continue
    const d = new Date(e.date)
    if (isNaN(d.getTime()) || d < start || d >= end) continue
    diaryCount++
    if (e.mood) moodCounts[e.mood] = (moodCounts[e.mood] || 0) + 1
  }
  const moods = Object.entries(moodCounts)
    .map(([emoji, count]) => ({ emoji, count }))
    .sort((a, b) => b.count - a.count)

  // --- Spiritual tasks completed ---
  let spiritualTasksCompleted = 0
  for (const t of tasks) {
    if (!t || !t.completed || t.category !== 'spiritual') continue
    const ts = t.reminderFiredAt || t.createdAt
    if (!ts) continue
    const d = new Date(ts)
    if (!isNaN(d.getTime()) && d >= start && d < end) spiritualTasksCompleted++
  }

  // --- Bible readings ---
  let readings = 0
  for (const r of recentReads) {
    if (!r || typeof r.time !== 'number') continue
    const d = new Date(r.time)
    if (!isNaN(d.getTime()) && d >= start && d < end) readings++
  }

  const hasActivity = daysWithActivity > 0 || diaryCount > 0 || spiritualTasksCompleted > 0 || readings > 0

  const summary = {
    periodType,
    start,
    end,
    label: formatPeriodLabel(start, end, periodType),
    totalDays: days.length,
    daysWithActivity,
    totalMinutes,
    avgMinutes: daysWithActivity ? Math.round(totalMinutes / daysWithActivity) : 0,
    bestDay,
    longestStreak: getLongestStreak(days, new Set(Object.keys(prayerByKey))),
    currentStreak: inCurrent ? getCurrentStreak(allPrayerKeys, today) : 0,
    diaryCount,
    moods,
    spiritualTasksCompleted,
    readings,
    studyPlan: data.studyPlan && data.studyPlan.book ? { book: data.studyPlan.book, chapter: data.studyPlan.chapter } : null,
    hasActivity,
    encouragement: pickEncouragement({ daysWithActivity, diaryCount, spiritualTasksCompleted, readings, totalDays: days.length }, periodType),
  }

  return summary
}
