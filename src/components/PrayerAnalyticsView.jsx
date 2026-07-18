import { useState, useEffect, useCallback } from 'react'

const API_URL = import.meta.env.VITE_API_URL || ''

export default function PrayerAnalyticsView({ showToast, isPremium, setShowAuth }) {
  const [analytics, setAnalytics] = useState(null)
  const [insights, setInsights] = useState(null)
  const [goals, setGoals] = useState(null)
  const [loading, setLoading] = useState(false)
  const [period, setPeriod] = useState('30d')
  const [dailyGoal, setDailyGoal] = useState(15)
  const [weeklyGoal, setWeeklyGoal] = useState(7)

  const token = () => localStorage.getItem('bf_token')

  const fetchAnalytics = useCallback(async () => {
    setLoading(true)
    try {
      const [analyticsRes, insightsRes, goalsRes] = await Promise.all([
        fetch(`${API_URL}/api/prayer/analytics?period=${period}`, {
          headers: { 'Authorization': `Bearer ${token()}` }
        }),
        fetch(`${API_URL}/api/prayer/insights`, {
          headers: { 'Authorization': `Bearer ${token()}` }
        }),
        fetch(`${API_URL}/api/prayer/goals`, {
          headers: { 'Authorization': `Bearer ${token()}` }
        }),
      ])
      if (analyticsRes.ok) {
        const a = await analyticsRes.json()
        setAnalytics(a)
      }
      if (insightsRes.ok) {
        const i = await insightsRes.json()
        setInsights(i)
      }
      if (goalsRes.ok) {
        const g = await goalsRes.json()
        setGoals(g)
        if (g.has_goal) {
          setDailyGoal(g.daily_goal_minutes)
          setWeeklyGoal(g.weekly_goal_days)
        }
      }
    } catch { showToast('Failed to load analytics', 'warning') }
    finally { setLoading(false) }
  }, [period, showToast])

  useEffect(() => { if (isPremium) fetchAnalytics() }, [isPremium, fetchAnalytics])

  const saveGoals = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/api/prayer/goals`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token()}` },
        body: JSON.stringify({ daily_goal_minutes: dailyGoal, weekly_goal_days: weeklyGoal })
      })
      if (!res.ok) throw new Error()
      showToast('Prayer goals saved!')
      fetchAnalytics()
    } catch { showToast('Failed to save goals', 'warning') }
  }, [dailyGoal, weeklyGoal, showToast, fetchAnalytics])

  if (!isPremium) {
    return (
      <section className="view fade-in">
        <div className="card">
          <div className="card-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="3" y="12" width="4" height="9" rx="1" fill="currentColor" opacity="0.3"/><rect x="10" y="7" width="4" height="14" rx="1" fill="currentColor" opacity="0.5"/><rect x="17" y="3" width="4" height="18" rx="1" fill="currentColor" opacity="0.7"/><line x1="3" y1="3" x2="21" y2="3"/></svg></div>
          <h3>Prayer Analytics</h3>
          <p>Sign in to see insights, trends, and recommendations for your prayer life.</p>
          <button className="btn-primary" onClick={() => setShowAuth(true)}>Sign In</button>
        </div>
      </section>
    )
  }

  return (
    <section className="view fade-in">
      <div className="card">
        <h3>Prayer Analytics</h3>

        <div className="analytics-period-select">
          {['7d', '30d', '90d', '1y', 'all'].map(p => (
            <button key={p} className={`btn-sm${period === p ? ' active' : ''}`}
              onClick={() => setPeriod(p)}>
              {p === '7d' ? 'Week' : p === '30d' ? 'Month' : p === '90d' ? 'Quarter' : p === '1y' ? 'Year' : 'All'}
            </button>
          ))}
        </div>

        {loading && <div className="loading-spinner" />}

        {analytics && !loading && (
          <div className="analytics-grid">
            <div className="analytics-card">
              <span className="analytics-value">{analytics.total_prayers}</span>
              <span className="analytics-label">Total Prayers</span>
            </div>
            <div className="analytics-card">
              <span className="analytics-value">{analytics.total_minutes}</span>
              <span className="analytics-label">Total Minutes</span>
            </div>
            <div className="analytics-card">
              <span className="analytics-value">{analytics.average_minutes}</span>
              <span className="analytics-label">Avg Minutes</span>
            </div>
            <div className="analytics-card">
              <span className="analytics-value">{analytics.current_streak}</span>
              <span className="analytics-label">Current Streak</span>
            </div>
            <div className="analytics-card">
              <span className="analytics-value">{analytics.longest_streak}</span>
              <span className="analytics-label">Best Streak</span>
            </div>
            <div className="analytics-card">
              <span className="analytics-value">{analytics.consistency_score}%</span>
              <span className="analytics-label">Consistency</span>
            </div>
          </div>
        )}

        {analytics?.best_day && (
          <div className="analytics-days">
            <p><strong>Best Day:</strong> {new Date(analytics.best_day.date).toLocaleDateString()} ({analytics.best_day.minutes} min)</p>
            <p><strong>Worst Day:</strong> {new Date(analytics.worst_day.date).toLocaleDateString()} ({analytics.worst_day.minutes} min)</p>
          </div>
        )}

        {analytics?.monthly_trend?.length > 0 && (
          <div className="analytics-trend">
            <h4>Monthly Trend</h4>
            <div className="trend-bars">
              {analytics.monthly_trend.map((m, i) => {
                const maxMin = Math.max(...analytics.monthly_trend.map(x => x.minutes), 1)
                return (
                  <div key={i} className="trend-bar-item">
                    <div className="trend-bar-fill" style={{ height: `${(m.minutes / maxMin) * 100}%` }} />
                    <span className="trend-bar-label">{m.month}</span>
                    <span className="trend-bar-value">{m.minutes}m</span>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>

      {insights && !loading && (
        <div className="card">
          <h3>AI Insights</h3>
          <div className="insights-list">
            {(insights.insights || []).map((insight, i) => (
              <p key={i} className="insight-item">{insight}</p>
            ))}
          </div>
          <h4>Recommendations</h4>
          <ul className="recommendations-list">
            {(insights.recommendations || []).map((rec, i) => (
              <li key={i}>{rec}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="card">
        <h3>Prayer Goals</h3>
        <div className="goals-form">
          <label className="settings-label">Daily Goal (minutes)</label>
          <input type="number" min={1} max={120} aria-label="Daily prayer goal in minutes" value={dailyGoal}
            onChange={e => setDailyGoal(Number(e.target.value))} />
          <label className="settings-label">Weekly Target (days)</label>
          <input type="number" min={1} max={7} aria-label="Weekly prayer goal in days" value={weeklyGoal}
            onChange={e => setWeeklyGoal(Number(e.target.value))} />
          <button className="btn-primary" onClick={saveGoals}>Save Goals</button>
        </div>
        {goals?.has_goal && (
          <p className="goals-status">Goals set: {goals.daily_goal_minutes} min/day, {goals.weekly_goal_days} days/week</p>
        )}
      </div>

      {analytics?.daily_data?.length > 0 && (
        <div className="card">
          <h4>Recent Prayer Activity</h4>
          <div className="prayer-activity-list">
            {analytics.daily_data.slice(-14).reverse().map((d, i) => (
              <div key={i} className="prayer-activity-item">
                <span className="prayer-activity-date">{new Date(d.date).toLocaleDateString()}</span>
                <div className="prayer-activity-bar" style={{ width: `${Math.min((d.minutes / (goals?.daily_goal_minutes || 15)) * 100, 100)}%` }} />
                <span className="prayer-activity-minutes">{d.minutes} min</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  )
}
