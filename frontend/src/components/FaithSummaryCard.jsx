import { useMemo, useState } from 'react'
import { getFaithSummary, shiftPeriod } from '../faithSummaries'
import { MOODS } from '../constants'

const MOOD_LABELS = Object.fromEntries(MOODS.map(m => [m.emoji, m.label]))

const WEEK_ICON = <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ width: 22, height: 22 }}><path d="M12 2c1.5 2 2.5 3 2.5 5a3.5 3.5 0 01-5 0c0-2 1-3 2.5-5z" /><rect x="8" y="9" width="8" height="12" rx="1" /></svg>

const MONTH_ICON = <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ width: 22, height: 22 }}><rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>

function Stat({ value, label }) {
  return (
    <div className="faith-summary-stat">
      <span className="faith-summary-value">{value}</span>
      <span className="faith-summary-label">{label}</span>
    </div>
  )
}

function formatBestDay(date) {
  return date.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })
}

export default function FaithSummaryCard({ type, data }) {
  const [anchor, setAnchor] = useState(() => {
    const d = new Date()
    d.setHours(0, 0, 0, 0)
    return d
  })

  const summary = useMemo(() => getFaithSummary(data, type, anchor), [data, type, anchor])

  const isCurrent = useMemo(() => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    return today >= summary.start && today < summary.end
  }, [summary])

  const navigate = (dir) => () => {
    setAnchor(shiftPeriod(summary.start, type, dir))
  }

  return (
    <div className="card hover-lift slide-up faith-summary-card">
      <div className="faith-summary-head">
        <div className="faith-summary-icon">{type === 'week' ? WEEK_ICON : MONTH_ICON}</div>
        <div className="faith-summary-heading">
          <h3>{type === 'week' ? 'Weekly Faith Summary' : 'Monthly Faith Summary'}</h3>
          <span className="faith-summary-range">{summary.label}{isCurrent ? ' · Current' : ''}</span>
        </div>
        <div className="faith-summary-nav" role="group" aria-label={`${type} navigation`}>
          <button className="faith-summary-nav-btn" onClick={navigate(-1)} aria-label={`Previous ${type}`}>&#8249;</button>
          <button className="faith-summary-nav-btn" onClick={navigate(1)} disabled={isCurrent} aria-label={`Next ${type}`}>&#8250;</button>
        </div>
      </div>

      {summary.hasActivity ? (
        <>
          <div className="faith-summary-grid">
            <Stat value={summary.daysWithActivity} label={type === 'week' ? 'Days Prayed' : 'Days Prayed'} />
            <Stat value={summary.totalMinutes} label="Prayer Minutes" />
            {type === 'month' && <Stat value={summary.avgMinutes} label="Avg Min/Day" />}
            <Stat value={summary.longestStreak} label="Best Streak" />
            <Stat value={summary.diaryCount} label="Reflections" />
            <Stat value={summary.spiritualTasksCompleted} label="Spiritual Tasks" />
            {type === 'month' && <Stat value={summary.readings} label="Chapters Read" />}
          </div>

          <div className="faith-summary-details">
            {summary.bestDay && (
              <p className="faith-summary-line">Best day: <strong>{formatBestDay(summary.bestDay.date)}</strong> <span>&middot;</span> {summary.bestDay.minutes} min</p>
            )}
            {summary.currentStreak > 0 && (
              <p className="faith-summary-line">Current streak: <strong>{summary.currentStreak} day{summary.currentStreak === 1 ? '' : 's'}</strong></p>
            )}
            {type === 'week' && summary.readings > 0 && (
              <p className="faith-summary-line">Bible chapters read: <strong>{summary.readings}</strong></p>
            )}
            {summary.moods.length > 0 && (
              <p className="faith-summary-line">Most common mood: <strong>{MOOD_LABELS[summary.moods[0].emoji] || summary.moods[0].emoji}</strong> <span>&middot;</span> {summary.moods[0].count}</p>
            )}
            {isCurrent && summary.studyPlan && (
              <p className="faith-summary-line">Current study: <strong>{summary.studyPlan.book} {summary.studyPlan.chapter}</strong></p>
            )}
          </div>

          {summary.encouragement && (
            <div className="faith-summary-encouragement" role="status" aria-live="polite">
              <p className="faith-summary-msg">{summary.encouragement.message}</p>
              <p className="faith-summary-verse">&ldquo;{summary.encouragement.verse}&rdquo;</p>
              <span className="faith-summary-ref">&mdash; {summary.encouragement.ref}</span>
            </div>
          )}
        </>
      ) : (
        <div className="empty-small meaningful">
          <p className="empty-mini-title">{type === 'week' ? 'No faith activity this week yet' : 'No faith activity recorded this month'}</p>
          <p className="empty-mini-text">Log a prayer, write a reflection, or complete a spiritual task to begin your {type === 'week' ? 'weekly' : 'monthly'} summary.</p>
        </div>
      )}
    </div>
  )
}
