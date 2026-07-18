import { useState, useEffect, useCallback } from 'react'

const API_URL = import.meta.env.VITE_API_URL || ''

const CATEGORY_COLORS = {
  health: '#e74c3c', family: '#3498db', work: '#f39c12',
  spiritual: '#9b59b6', financial: '#27ae60', other: '#95a5a6',
}

const CATEGORIES = [
  { value: 'health', label: 'Health' }, { value: 'family', label: 'Family' },
  { value: 'work', label: 'Work' }, { value: 'spiritual', label: 'Spiritual' },
  { value: 'financial', label: 'Financial' }, { value: 'other', label: 'Other' },
]

const FILTERS = [
  { value: 'all', label: 'All' }, { value: 'mine', label: 'Mine' },
  { value: 'answered', label: 'Answered' }, { value: 'urgent', label: 'Urgent' },
  { value: 'anonymous', label: 'Anonymous' },
]

function timeAgo(date) {
  const s = Math.floor((Date.now() - new Date(date)) / 1000)
  if (s < 60) return 'just now'
  if (s < 3600) return `${Math.floor(s / 60)}m ago`
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`
  if (s < 604800) return `${Math.floor(s / 86400)}d ago`
  return new Date(date).toLocaleDateString()
}

function SkeletonCard() {
  return (
    <div className="card prayer-card-skeleton" aria-hidden="true">
      <div className="skeleton-header">
        <div className="skeleton-avatar" />
        <div className="skeleton-lines">
          <div className="skeleton-line w60" />
          <div className="skeleton-line w40" />
        </div>
      </div>
      <div className="skeleton-line w100" />
      <div className="skeleton-line w80" />
      <div className="skeleton-line w50" />
    </div>
  )
}

export default function PrayerFeedView({ showToast, isPremium, setShowAuth }) {
  const [prayers, setPrayers] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [category, setCategory] = useState('all')
  const [cursor, setCursor] = useState(null)
  const [hasMore, setHasMore] = useState(true)
  const [showComposer, setShowComposer] = useState(false)
  const [composer, setComposer] = useState({
    content: '', category: 'other', is_urgent: false, is_anonymous: false,
    visibility: 'public', group_ids: [],
  })
  const [submitting, setSubmitting] = useState(false)
  const [myPrayers, setMyPrayers] = useState([])
  const [analytics, setAnalytics] = useState(null)
  const [userGroups, setUserGroups] = useState([])
  const [showAnalytics, setShowAnalytics] = useState(false)

  const token = () => localStorage.getItem('bf_token')

  const fetchPrayers = useCallback(async (reset = false) => {
    if (!isPremium) return
    setLoading(true)
    try {
      const params = new URLSearchParams({ limit: '20' })
      if (filter !== 'all') params.set('filter', filter)
      if (category !== 'all') params.set('category', category)
      if (!reset && cursor) params.set('cursor', cursor)
      const res = await fetch(`${API_URL}/api/community/prayers?${params}`, {
        headers: { 'Authorization': `Bearer ${token()}` },
      })
      if (!res.ok) throw new Error()
      const data = await res.json()
      const items = data.prayers || []
      setPrayers(prev => reset ? items : [...prev, ...items])
      setCursor(data.cursor || null)
      setHasMore(items.length >= 20)
    } catch {
      showToast('Failed to load prayers', 'warning')
    } finally { setLoading(false) }
  }, [isPremium, filter, category, cursor, showToast])

  const fetchMyPrayers = useCallback(async () => {
    if (!isPremium) return
    try {
      const res = await fetch(`${API_URL}/api/community/prayers/mine`, {
        headers: { 'Authorization': `Bearer ${token()}` },
      })
      if (res.ok) {
        const data = await res.json()
        setMyPrayers(data.prayers || [])
      }
    } catch {}
  }, [isPremium])

  const fetchAnalytics = useCallback(async () => {
    if (!isPremium) return
    try {
      const res = await fetch(`${API_URL}/api/community/prayers/analytics?period=30d`, {
        headers: { 'Authorization': `Bearer ${token()}` },
      })
      if (res.ok) {
        const data = await res.json()
        setAnalytics(data)
      }
    } catch {}
  }, [isPremium])

  const fetchGroups = useCallback(async () => {
    if (!isPremium) return
    try {
      const res = await fetch(`${API_URL}/api/groups`, {
        headers: { 'Authorization': `Bearer ${token()}` },
      })
      if (res.ok) {
        const data = await res.json()
        setUserGroups(data.groups || [])
      }
    } catch {}
  }, [isPremium])

  useEffect(() => {
    if (isPremium) {
      fetchPrayers(true)
      fetchMyPrayers()
      fetchAnalytics()
      fetchGroups()
    }
  }, [isPremium, filter, category, fetchPrayers, fetchMyPrayers, fetchAnalytics, fetchGroups])

  const submitPrayer = useCallback(async () => {
    if (!composer.content.trim()) return
    setSubmitting(true)
    try {
      const res = await fetch(`${API_URL}/api/community/prayers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token()}` },
        body: JSON.stringify({
          content: composer.content.trim(),
          category: composer.category,
          is_urgent: composer.is_urgent,
          is_anonymous: composer.is_anonymous,
          visibility: composer.visibility,
          group_ids: composer.group_ids,
        }),
      })
      if (!res.ok) throw new Error()
      showToast('Prayer request shared!')
      setShowComposer(false)
      setComposer({ content: '', category: 'other', is_urgent: false, is_anonymous: false, visibility: 'public', group_ids: [] })
      fetchPrayers(true)
      fetchMyPrayers()
    } catch {
      showToast('Failed to share prayer', 'warning')
    } finally { setSubmitting(false) }
  }, [composer, showToast, fetchPrayers, fetchMyPrayers])

  const togglePray = useCallback(async (id) => {
    try {
      const res = await fetch(`${API_URL}/api/community/prayers/${id}/pray`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token()}` },
      })
      if (!res.ok) throw new Error()
      const data = await res.json()
      setPrayers(prev => prev.map(p =>
        p.id === id ? { ...p, prayed_by_me: data.prayed_by_me, pray_count: data.pray_count } : p
      ))
    } catch {
      showToast('Failed to record prayer', 'warning')
    }
  }, [showToast])

  const joinChain = useCallback(async (id) => {
    try {
      const res = await fetch(`${API_URL}/api/community/prayers/${id}/chain`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token()}` },
      })
      if (!res.ok) throw new Error()
      const data = await res.json()
      setPrayers(prev => prev.map(p =>
        p.id === id ? { ...p, chain_joined: data.chain_joined, chain_count: data.chain_count } : p
      ))
      showToast('Prayer chain joined!')
    } catch {
      showToast('Failed to join chain', 'warning')
    }
  }, [showToast])

  const markAnswered = useCallback(async (id) => {
    try {
      const res = await fetch(`${API_URL}/api/community/prayers/${id}/answer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token()}` },
      })
      if (!res.ok) throw new Error()
      showToast('Praise God! Prayer marked as answered!')
      fetchPrayers(true)
      fetchMyPrayers()
    } catch {
      showToast('Failed to mark as answered', 'warning')
    }
  }, [showToast, fetchPrayers, fetchMyPrayers])

  if (!isPremium) {
    return (
      <section className="view fade-in">
        <div className="card">
          <div className="card-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ width: 24, height: 24 }}>
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z" />
              <path d="M12 6v6l4 2" />
            </svg>
          </div>
          <h3>Prayer Feed</h3>
          <p>Sign in to share prayer requests, pray with others, and build a community of faith.</p>
          <button className="btn-primary" onClick={() => setShowAuth(true)}>Sign In</button>
        </div>
      </section>
    )
  }

  return (
    <section className="view fade-in">
      <div className="groups-nav" role="tablist" aria-label="Prayer feed filters">
        {FILTERS.map(f => (
          <button key={f.value}
            className={`groups-nav-btn${filter === f.value ? ' active' : ''}`}
            onClick={() => { setFilter(f.value); setCursor(null); setPrayers([]) }}
            role="tab" aria-selected={filter === f.value}>
            {f.label}
          </button>
        ))}
      </div>

      <div className="prayer-category-nav" role="tablist" aria-label="Prayer categories">
        <button className={`groups-nav-btn${category === 'all' ? ' active' : ''}`}
          onClick={() => { setCategory('all'); setCursor(null); setPrayers([]) }}
          role="tab" aria-selected={category === 'all'}>
          All Categories
        </button>
        {CATEGORIES.map(c => (
          <button key={c.value}
            className={`groups-nav-btn${category === c.value ? ' active' : ''}`}
            onClick={() => { setCategory(c.value); setCursor(null); setPrayers([]) }}
            role="tab" aria-selected={category === c.value}>
            {c.label}
          </button>
        ))}
      </div>

      {analytics && (
        <div className="card prayer-analytics-mini" role="region" aria-label="Prayer analytics summary">
          <div className="prayer-analytics-row">
            <div className="prayer-analytics-stat">
              <span className="prayer-analytics-value">{analytics.current_streak || 0}</span>
              <span className="prayer-analytics-label">Day Streak</span>
            </div>
            <div className="prayer-analytics-stat">
              <span className="prayer-analytics-value">{analytics.total_prayed || 0}</span>
              <span className="prayer-analytics-label">Prayed For</span>
            </div>
            <div className="prayer-analytics-stat">
              <span className="prayer-analytics-value">{analytics.prayers_shared || 0}</span>
              <span className="prayer-analytics-label">Shared</span>
            </div>
            <button className="btn-sm" onClick={() => setShowAnalytics(!showAnalytics)}
              aria-expanded={showAnalytics}>
              {showAnalytics ? 'Hide' : 'Details'}
            </button>
          </div>
        </div>
      )}

      {loading && prayers.length === 0 && (
        <div className="prayer-skeleton-list" aria-label="Loading prayers">
          <SkeletonCard /><SkeletonCard /><SkeletonCard />
        </div>
      )}

      {!loading && prayers.length === 0 && (
        <div className="card">
          <div className="empty-state">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ width: 48, height: 48, opacity: 0.4, margin: '0 auto 12px' }}>
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z" />
              <path d="M12 6v6l4 2" />
            </svg>
            <p>No prayers found. Be the first to share a prayer request!</p>
          </div>
        </div>
      )}

      {prayers.map(p => (
        <div key={p.id}
          className={`card prayer-card${p.is_answered ? ' prayer-answered' : ''}${p.is_urgent ? ' prayer-urgent' : ''}`}
          role="article" aria-label={`Prayer request by ${p.is_anonymous ? 'Anonymous' : p.author_name}`}>
          <div className="prayer-card-header">
            <div className="prayer-author">
              <div className="prayer-avatar" aria-hidden="true">
                {p.is_anonymous ? (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" style={{ width: 32, height: 32 }}>
                    <circle cx="12" cy="8" r="4" /><path d="M4 21v-2a6 6 0 0 1 12 0v2" />
                    <path d="M18 8l2 2-2 2" opacity="0.5" />
                  </svg>
                ) : (
                  <span className="prayer-avatar-text">
                    {(p.author_name || 'U').charAt(0).toUpperCase()}
                  </span>
                )}
              </div>
              <div className="prayer-author-info">
                <span className="prayer-author-name">{p.is_anonymous ? 'Anonymous' : p.author_name || 'Unknown'}</span>
                <span className="prayer-time">{timeAgo(p.created_at)}</span>
              </div>
            </div>
            <div className="prayer-badges">
              <span className="prayer-category-badge" style={{ backgroundColor: CATEGORY_COLORS[p.category] || CATEGORY_COLORS.other }}>
                {p.category || 'other'}
              </span>
              {p.is_urgent && (
                <span className="prayer-urgent-badge" aria-label="Urgent prayer">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 12, height: 12 }}>
                    <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
                  </svg>
                  Urgent
                </span>
              )}
              {p.is_answered && (
                <span className="prayer-answered-badge" aria-label="Answered prayer">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 12, height: 12 }}>
                    <path d="M7 11l5 5 10-11" /><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z" />
                  </svg>
                  Answered
                </span>
              )}
            </div>
          </div>

          <p className="prayer-content">{p.content}</p>

          {p.scripture_ref && (
            <div className="prayer-scripture" role="note" aria-label="AI-suggested scripture">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" style={{ width: 14, height: 14, flexShrink: 0 }}>
                <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
              </svg>
              <div>
                <span className="scripture-ref">{p.scripture_ref}</span>
                {p.scripture_text && <span className="scripture-text"> — {p.scripture_text}</span>}
              </div>
            </div>
          )}

          {p.is_answered && p.answer_testimony && (
            <div className="prayer-testimony">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" style={{ width: 14, height: 14 }}>
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
              </svg>
              <span><strong>Praise Report:</strong> {p.answer_testimony}</span>
            </div>
          )}

          <div className="prayer-card-actions">
            <button
              className={`prayer-action-btn${p.prayed_by_me ? ' active' : ''}`}
              onClick={() => togglePray(p.id)}
              aria-pressed={!!p.prayed_by_me}
              aria-label={`I prayed, ${p.pray_count || 0} prayers`}>
              <svg viewBox="0 0 24 24" fill={p.prayed_by_me ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.8" style={{ width: 16, height: 16 }}>
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
              </svg>
              <span>{p.pray_count || 0}</span>
            </button>

            <button className="prayer-action-btn" aria-label={`Comments, ${p.comment_count || 0}`}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" style={{ width: 16, height: 16 }}>
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
              <span>{p.comment_count || 0}</span>
            </button>

            {p.chain_count !== undefined && (
              <button
                className={`prayer-action-btn chain-btn${p.chain_joined ? ' active' : ''}`}
                onClick={() => joinChain(p.id)}
                aria-pressed={!!p.chain_joined}
                aria-label={`Prayer chain, ${p.chain_count || 0} members`}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" style={{ width: 16, height: 16 }}>
                  <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                  <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                </svg>
                <span>{p.chain_count || 0}</span>
              </button>
            )}

            {!p.is_answered && p.author_id && (
              <button className="prayer-action-btn answer-btn" onClick={() => markAnswered(p.id)}
                aria-label="Mark as answered">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 16, height: 16 }}>
                  <path d="M7 11l5 5 10-11" />
                </svg>
                <span>Praise God</span>
              </button>
            )}
          </div>
        </div>
      ))}

      {hasMore && prayers.length > 0 && !loading && (
        <div style={{ textAlign: 'center', padding: '12px 0' }}>
          <button className="btn-sm" onClick={() => fetchPrayers(false)} aria-label="Load more prayers">
            Load More
          </button>
        </div>
      )}
      {loading && prayers.length > 0 && <div className="loading-spinner" />}

      <button className="prayer-fab" onClick={() => setShowComposer(true)}
        aria-label="Create prayer request">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 24, height: 24 }}>
          <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
        </svg>
      </button>

      {showComposer && (
        <div className="prayer-modal-overlay" onClick={() => setShowComposer(false)}>
          <div className="prayer-modal card" onClick={e => e.stopPropagation()} role="dialog" aria-label="Create prayer request">
            <div className="prayer-modal-header">
              <h3>Share a Prayer Request</h3>
              <button className="group-close" onClick={() => setShowComposer(false)} aria-label="Close composer">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 18, height: 18 }}>
                  <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            <div className="prayer-composer">
              <textarea
                placeholder="Share what's on your heart..."
                aria-label="Prayer request content"
                value={composer.content}
                onChange={e => setComposer(prev => ({ ...prev, content: e.target.value }))}
                rows={5}
                autoFocus
              />

              <label className="settings-label">Category</label>
              <select value={composer.category} onChange={e => setComposer(prev => ({ ...prev, category: e.target.value }))}
                aria-label="Prayer category">
                {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>

              <label className="settings-label">Visibility</label>
              <div className="prayer-visibility-toggle" role="radiogroup" aria-label="Prayer visibility">
                {[{ value: 'public', label: 'Public' }, { value: 'group', label: 'Group' }, { value: 'anonymous', label: 'Anonymous' }].map(v => (
                  <button key={v.value}
                    className={`groups-nav-btn${composer.visibility === v.value ? ' active' : ''}`}
                    onClick={() => setComposer(prev => ({
                      ...prev, visibility: v.value,
                      is_anonymous: v.value === 'anonymous',
                    }))}
                    role="radio" aria-checked={composer.visibility === v.value}>
                    {v.label}
                  </button>
                ))}
              </div>

              <label className="prayer-toggle-row">
                <input type="checkbox" checked={composer.is_urgent}
                  onChange={e => setComposer(prev => ({ ...prev, is_urgent: e.target.checked }))} />
                <span>Mark as Urgent</span>
              </label>

              {composer.visibility === 'group' && userGroups.length > 0 && (
                <>
                  <label className="settings-label">Share to Groups</label>
                  <div className="prayer-group-multiselect" role="group" aria-label="Select groups">
                    {userGroups.map(g => (
                      <label key={g.id} className="prayer-group-option">
                        <input type="checkbox" checked={composer.group_ids.includes(g.id)}
                          onChange={e => setComposer(prev => ({
                            ...prev,
                            group_ids: e.target.checked
                              ? [...prev.group_ids, g.id]
                              : prev.group_ids.filter(id => id !== g.id),
                          }))} />
                        <span>{g.name}</span>
                      </label>
                    ))}
                  </div>
                </>
              )}

              <button className="btn-primary" onClick={submitPrayer}
                disabled={submitting || !composer.content.trim()}>
                {submitting ? 'Sharing...' : 'Share Prayer'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showAnalytics && analytics && (
        <div className="card prayer-analytics-detail">
          <h3>Your Prayer Analytics</h3>
          <div className="analytics-grid">
            <div className="analytics-card">
              <span className="analytics-value">{analytics.current_streak || 0}</span>
              <span className="analytics-label">Current Streak</span>
            </div>
            <div className="analytics-card">
              <span className="analytics-value">{analytics.longest_streak || 0}</span>
              <span className="analytics-label">Best Streak</span>
            </div>
            <div className="analytics-card">
              <span className="analytics-value">{analytics.total_prayed || 0}</span>
              <span className="analytics-label">Total Prayed For</span>
            </div>
            <div className="analytics-card">
              <span className="analytics-value">{analytics.prayers_shared || 0}</span>
              <span className="analytics-label">Prayers Shared</span>
            </div>
          </div>
        </div>
      )}

      {myPrayers.length > 0 && (
        <div className="card">
          <h3>My Prayers</h3>
          <div className="my-prayers-list">
            {myPrayers.map(p => (
              <div key={p.id}
                className={`my-prayer-item${p.is_answered ? ' answered' : ''}`}
                role="article" aria-label={`My prayer: ${p.content?.slice(0, 50)}`}>
                <div className="my-prayer-header">
                  <span className="prayer-category-badge" style={{ backgroundColor: CATEGORY_COLORS[p.category] || CATEGORY_COLORS.other, fontSize: '0.7rem' }}>
                    {p.category || 'other'}
                  </span>
                  <span className="prayer-time">{timeAgo(p.created_at)}</span>
                </div>
                <p className="my-prayer-content">{p.content}</p>
                <div className="my-prayer-footer">
                  <span className="my-prayer-stat">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" style={{ width: 12, height: 12 }}>
                      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                    </svg>
                    {p.pray_count || 0} prayed
                  </span>
                  {p.is_answered && <span className="prayer-answered-badge small">Answered</span>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  )
}
