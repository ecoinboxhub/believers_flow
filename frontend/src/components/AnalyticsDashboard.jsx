import { useState, useEffect, useCallback } from 'react'

const API_URL = import.meta.env.VITE_API_URL || ''

const MetricCard = ({ label, value, sub, icon }) => (
  <div className="analytics-card">
    <div className="analytics-card-icon">{icon}</div>
    <div className="analytics-card-data">
      <span className="analytics-value">{typeof value === 'number' ? value.toLocaleString() : value || '0'}</span>
      <span className="analytics-label">{label}</span>
      {sub && <span className="analytics-sub">{sub}</span>}
    </div>
  </div>
)

export default function AnalyticsDashboard({ showToast }) {
  const [stats, setStats] = useState(null)
  const [registrations, setRegistrations] = useState([])
  const [engagement, setEngagement] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const fetchAnalytics = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [statsRes, regRes, engRes] = await Promise.all([
        fetch(`${API_URL}/api/analytics/stats`),
        fetch(`${API_URL}/api/analytics/registrations?days=30`),
        fetch(`${API_URL}/api/analytics/engagement?days=30`),
      ])
      if (!statsRes.ok) throw new Error('Failed to load analytics')
      setStats(await statsRes.json())
      if (regRes.ok) {
        const regData = await regRes.json()
        setRegistrations(regData.data || [])
      }
      if (engRes.ok) {
        const engData = await engRes.json()
        setEngagement(engData.prayer_activity || [])
      }
    } catch (err) {
      setError(err.message)
      showToast('Failed to load analytics', 'warning')
    } finally { setLoading(false) }
  }, [showToast])

  useEffect(() => { (async () => { try { await fetchAnalytics() } catch { /* ignore */ } })() }, [fetchAnalytics])

  const maxRegistration = Math.max(...registrations.map(r => r.count), 1)
  const maxEngagement = Math.max(...engagement.map(e => e.logs), 1)

  return (
    <section className="view fade-in" role="region" aria-label="Analytics Dashboard">
      {error && <div className="error-banner" role="alert">{error}</div>}

      <div className="card">
        <h3>Platform Analytics</h3>
        <p className="section-desc">Overall platform statistics and trends.</p>

        {loading && <div className="loading-spinner" aria-label="Loading analytics" />}

        {!loading && !error && stats && (
          <>
            <h4 className="section-subtitle">Users</h4>
            <div className="analytics-grid">
              <MetricCard label="Total Users" value={stats.users?.total}
                icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" style={{width:24,height:24}}><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>} />
              <MetricCard label="Premium" value={stats.users?.premium}
                sub={`${stats.users?.total ? ((stats.users.premium / stats.users.total) * 100).toFixed(1) : 0}%`}
                icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" style={{width:24,height:24}}><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>} />
              <MetricCard label="Last 30 Days" value={stats.users?.last_30d}
                icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" style={{width:24,height:24}}><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>} />
              <MetricCard label="Today" value={stats.users?.today}
                icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" style={{width:24,height:24}}><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>} />
            </div>

            <h4 className="section-subtitle">Engagement</h4>
            <div className="analytics-grid">
              <MetricCard label="Total Tasks" value={stats.engagement?.total_tasks}
                icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" style={{width:24,height:24}}><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h10"/></svg>} />
              <MetricCard label="Prayer Logs" value={stats.engagement?.total_prayer_logs}
                sub={`${stats.engagement?.prayer_logs_30d || 0} this month`}
                icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" style={{width:24,height:24}}><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z"/><polyline points="7 12 10 15 17 8"/></svg>} />
              <MetricCard label="Prayer Minutes" value={stats.engagement?.total_prayer_minutes}
                icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" style={{width:24,height:24}}><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>} />
              <MetricCard label="Feed Posts" value={stats.engagement?.total_feed_posts}
                icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" style={{width:24,height:24}}><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>} />
              <MetricCard label="Prayer Chains" value={stats.engagement?.total_prayer_chains}
                icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" style={{width:24,height:24}}><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>} />
              <MetricCard label="Testimonies" value={stats.engagement?.total_testimonies}
                icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" style={{width:24,height:24}}><path d="M7 11l5 5 10-11"/><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z"/></svg>} />
              <MetricCard label="Forum Threads" value={stats.engagement?.total_forum_threads}
                sub={`${stats.engagement?.total_forum_replies || 0} replies`}
                icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" style={{width:24,height:24}}><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>} />
            </div>

            <h4 className="section-subtitle">Community & Growth</h4>
            <div className="analytics-grid">
              <MetricCard label="Small Groups" value={stats.community?.total_groups}
                icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" style={{width:24,height:24}}><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>} />
              <MetricCard label="Churches" value={stats.community?.total_churches}
                icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" style={{width:24,height:24}}><path d="M18 2H6v7H3v13h18V9h-3V2z"/><line x1="12" y1="2" x2="12" y2="22"/></svg>} />
              <MetricCard label="Events" value={stats.community?.total_events}
                icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" style={{width:24,height:24}}><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>} />
              <MetricCard label="Sermon Notes" value={stats.community?.total_sermon_notes}
                icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" style={{width:24,height:24}}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>} />
              <MetricCard label="AI Queries" value={stats.ai?.total_queries}
                icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" style={{width:24,height:24}}><path d="M12 2a4 4 0 0 1 4 4v2a4 4 0 0 1-8 0V6a4 4 0 0 1 4-4z"/><path d="M18 14h.01"/><path d="M6 14h.01"/><path d="M12 14v4"/><path d="M8 18h8"/></svg>} />
              <MetricCard label="Transactions" value={stats.payments?.total_transactions}
                sub={`$${stats.payments?.total_revenue?.toFixed(2) || '0.00'} revenue`}
                icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" style={{width:24,height:24}}><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>} />
            </div>
          </>
        )}
      </div>

      {!loading && registrations.length > 0 && (
        <div className="card">
          <h3>Registrations (Last 30 Days)</h3>
          <div className="trend-bars" role="img" aria-label="Registration trend chart">
            {registrations.map((r, i) => {
              const height = (r.count / maxRegistration) * 100
              return (
                <div key={i} className="trend-bar-item" title={`${r.date}: ${r.count} registrations`}>
                  <div className="trend-bar-fill registrations-bar" style={{ height: `${height}%` }} />
                  <span className="trend-bar-value">{r.count}</span>
                  <span className="trend-bar-label">{new Date(r.date).getDate()}</span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {!loading && engagement.length > 0 && (
        <div className="card">
          <h3>Prayer Activity (Last 30 Days)</h3>
          <div className="trend-bars" role="img" aria-label="Prayer activity chart">
            {engagement.map((e, i) => {
              const height = (e.logs / maxEngagement) * 100
              return (
                <div key={i} className="trend-bar-item" title={`${e.date}: ${e.logs} logs, ${e.minutes} min`}>
                  <div className="trend-bar-fill engagement-bar" style={{ height: `${height}%` }} />
                  <span className="trend-bar-value">{e.logs}</span>
                  <span className="trend-bar-label">{new Date(e.date).getDate()}</span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {!loading && stats && (
        <div className="card">
          <h3>Quick Stats</h3>
          <div className="quick-stats-grid">
            <div className="quick-stat"><span className="qs-value">{stats.engagement?.total_feed_posts || 0}</span><span className="qs-label">Feed Posts</span></div>
            <div className="quick-stat"><span className="qs-value">{stats.engagement?.total_prayer_chains || 0}</span><span className="qs-label">Prayer Chains</span></div>
            <div className="quick-stat"><span className="qs-value">{stats.engagement?.total_testimonies || 0}</span><span className="qs-label">Testimonies</span></div>
            <div className="quick-stat"><span className="qs-value">{stats.community?.total_churches || 0}</span><span className="qs-label">Churches</span></div>
          </div>
        </div>
      )}
    </section>
  )
}