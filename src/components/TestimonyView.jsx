import { useState, useEffect, useCallback } from 'react'

const token = () => localStorage.getItem('bf_token')
const API = import.meta.env.VITE_API_URL || ''

const CATEGORIES = [
  { value: 'all', label: 'All' },
  { value: 'salvation', label: 'Salvation' },
  { value: 'miracle', label: 'Miracle' },
  { value: 'healing', label: 'Healing' },
  { value: 'provision', label: 'Provision' },
  { value: 'mission', label: 'Mission' },
  { value: 'growth', label: 'Growth' },
  { value: 'family', label: 'Family' },
  { value: 'other', label: 'Other' },
]

const CATEGORY_COLORS = {
  salvation: '#3b82f6',
  miracle: '#eab308',
  healing: '#22c55e',
  provision: '#f97316',
  mission: '#8b5cf6',
  growth: '#06b6d4',
  family: '#ec4899',
  testimony: '#6366f1',
  other: '#6b7280',
}

const REACTIONS = [
  { key: 'praise', label: 'Praise God', icon: '🙏' },
  { key: 'amen', label: 'Amen', icon: '✨' },
  { key: 'encourage', label: 'Encourage', icon: '❤️' },
  { key: 'inspired', label: 'Inspired', icon: '🔥' },
]

function timeAgo(date) {
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000)
  if (seconds < 60) return 'just now'
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days}d ago`
  const weeks = Math.floor(days / 7)
  if (weeks < 4) return `${weeks}w ago`
  return new Date(date).toLocaleDateString()
}

function SkeletonCard() {
  return (
    <div className="card" style={{ padding: 20, marginBottom: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
        <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'var(--skeleton, #e2e8f0)' }} />
        <div style={{ flex: 1 }}>
          <div style={{ width: 120, height: 14, borderRadius: 4, background: 'var(--skeleton, #e2e8f0)', marginBottom: 6 }} />
          <div style={{ width: 80, height: 10, borderRadius: 4, background: 'var(--skeleton, #e2e8f0)' }} />
        </div>
      </div>
      <div style={{ width: 60, height: 18, borderRadius: 8, background: 'var(--skeleton, #e2e8f0)', marginBottom: 10 }} />
      <div style={{ width: '100%', height: 14, borderRadius: 4, background: 'var(--skeleton, #e2e8f0)', marginBottom: 6 }} />
      <div style={{ width: '85%', height: 14, borderRadius: 4, background: 'var(--skeleton, #e2e8f0)', marginBottom: 6 }} />
      <div style={{ width: '60%', height: 14, borderRadius: 4, background: 'var(--skeleton, #e2e8f0)' }} />
    </div>
  )
}

export default function TestimonyView({ showToast, isPremium, setShowAuth }) {
  const [testimonies, setTestimonies] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [category, setCategory] = useState('all')
  const [cursor, setCursor] = useState(null)
  const [hasMore, setHasMore] = useState(true)
  const [showComposer, setShowComposer] = useState(false)
  const [composer, setComposer] = useState({
    title: '', body: '', category: 'testimony', scripture_ref: '', image_url: '', visibility: 'public',
  })
  const [submitting, setSubmitting] = useState(false)
  const [trending, setTrending] = useState([])
  const [expandedId, setExpandedId] = useState(null)

  const authenticated = !!token()

  const headers = useCallback(() => {
    const h = { 'Content-Type': 'application/json' }
    const t = token()
    if (t) h.Authorization = `Bearer ${t}`
    return h
  }, [])

  const fetchTestimonies = useCallback(async (reset = false) => {
    if (!authenticated) { setLoading(false); return }
    setLoading(true)
    try {
      const params = new URLSearchParams({ filter, category, limit: '20' })
      if (!reset && cursor) params.set('cursor', cursor)
      const res = await fetch(`${API}/api/community/testimonies?${params}`, { headers: headers() })
      if (!res.ok) throw new Error('Failed to load testimonies')
      const data = await res.json()
      const items = data.testimonies || data.data || data || []
      setTestimonies(prev => (reset ? items : [...prev, ...items]))
      setCursor(data.next_cursor || null)
      setHasMore(!!data.next_cursor)
    } catch (err) {
      showToast?.('Failed to load testimonies', 'error')
    } finally {
      setLoading(false)
    }
  }, [filter, category, cursor, authenticated, headers, showToast])

  const fetchTrending = useCallback(async () => {
    try {
      const res = await fetch(`${API}/api/community/testimonies/trending`, { headers: headers() })
      if (!res.ok) return
      const data = await res.json()
      setTrending(data.testimonies || data.data || data || [])
    } catch { /* silent */ }
  }, [headers])

  useEffect(() => {
    setTestimonies([])
    setCursor(null)
    setHasMore(true)
    fetchTestimonies(true)
  }, [filter, category])

  useEffect(() => { fetchTrending() }, [fetchTrending])

  const handleReact = async (id, reactionKey) => {
    if (!authenticated) { setShowAuth?.(); return }
    try {
      const res = await fetch(`${API}/api/community/testimonies/${id}/react`, {
        method: 'POST', headers: headers(), body: JSON.stringify({ reaction: reactionKey }),
      })
      if (!res.ok) throw new Error('Reaction failed')
      const data = await res.json()
      setTestimonies(prev => prev.map(t =>
        t.id === id ? { ...t, reactions: data.reactions || t.reactions, user_reactions: data.user_reactions || t.user_reactions } : t
      ))
    } catch {
      showToast?.('Could not save reaction', 'error')
    }
  }

  const handleSubmit = async () => {
    if (!composer.title.trim() || !composer.body.trim()) {
      showToast?.('Please fill in the title and story', 'error')
      return
    }
    setSubmitting(true)
    try {
      const res = await fetch(`${API}/api/community/testimonies`, {
        method: 'POST', headers: headers(), body: JSON.stringify(composer),
      })
      if (!res.ok) throw new Error('Failed to share')
      const data = await res.json()
      setTestimonies(prev => [data.testimony || data, ...prev])
      setShowComposer(false)
      setComposer({ title: '', body: '', category: 'testimony', scripture_ref: '', image_url: '', visibility: 'public' })
      showToast?.('Testimony shared! May it bless others 🙏', 'success')
    } catch {
      showToast?.('Failed to share testimony', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  const toggleExpand = (id) => setExpandedId(prev => prev === id ? null : id)

  const totalReactions = (r) => {
    if (!r) return 0
    return Object.values(r).reduce((a, b) => a + (typeof b === 'number' ? b : 0), 0)
  }

  const filterButtons = [
    { key: 'all', label: 'All' },
    { key: 'mine', label: 'Mine' },
    { key: 'following', label: 'Following' },
    { key: 'trending', label: 'Trending' },
  ]

  if (!authenticated) {
    return (
      <div className="view" style={{ padding: '60px 20px', textAlign: 'center' }}>
        <div className="empty-state">
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="var(--accent, #6366f1)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ margin: '0 auto 20px' }}>
            <path d="M12 2L2 7l10 5 10-5-10-5z" />
            <path d="M2 17l10 5 10-5" />
            <path d="M2 12l10 5 10-5" />
          </svg>
          <h3 style={{ marginBottom: 8, fontSize: '1.25rem' }}>Share Your Testimony</h3>
          <p style={{ color: 'var(--text-muted, #94a3b8)', marginBottom: 20, maxWidth: 400, margin: '0 auto 20px' }}>
            Join our community to share what God has done in your life and be encouraged by others.
          </p>
          <button className="btn btn-primary" onClick={() => setShowAuth?.()}>
            Sign In to Share
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="view fade-in" style={{ padding: '16px 20px', maxWidth: 720, margin: '0 auto' }}>
      <h2 style={{ fontSize: '1.35rem', fontWeight: 700, marginBottom: 16 }}>Testimonies</h2>

      <nav aria-label="Testimony filters" style={{ display: 'flex', gap: 8, marginBottom: 14, flexWrap: 'wrap' }}>
        {filterButtons.map(f => (
          <button key={f.key} className={`groups-nav-btn${filter === f.key ? ' active' : ''}`}
            onClick={() => setFilter(f.key)} aria-pressed={filter === f.key}>
            {f.label}
          </button>
        ))}
      </nav>

      <div style={{ display: 'flex', gap: 6, marginBottom: 18, overflowX: 'auto', paddingBottom: 4 }}>
        {CATEGORIES.map(c => (
          <button key={c.value}
            className={`btn-sm${category === c.value ? ' btn-primary' : ''}`}
            style={{ whiteSpace: 'nowrap', fontSize: '0.78rem', padding: '4px 10px' }}
            onClick={() => setCategory(c.value)}>
            {c.label}
          </button>
        ))}
      </div>

      {filter === 'trending' && trending.length > 0 && (
        <section style={{ marginBottom: 24 }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: 12 }}>
            <span style={{ marginRight: 6 }}>🔥</span> Trending This Week
          </h3>
          {trending.slice(0, 3).map(t => (
            <TestimonyCard key={`trend-${t.id}`} testimony={t} onReact={handleReact}
              expanded={expandedId === t.id} onToggle={() => toggleExpand(t.id)} />
          ))}
        </section>
      )}

      {loading && testimonies.length === 0 ? (
        <>
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </>
      ) : testimonies.length === 0 ? (
        <div className="empty-state" style={{ padding: '50px 20px', textAlign: 'center' }}>
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted, #94a3b8)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ margin: '0 auto 14px' }}>
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
          <p style={{ color: 'var(--text-muted, #94a3b8)' }}>No testimonies found. Be the first to share!</p>
        </div>
      ) : (
        testimonies.map(t => (
          <TestimonyCard key={t.id} testimony={t} onReact={handleReact}
            expanded={expandedId === t.id} onToggle={() => toggleExpand(t.id)} />
        ))
      )}

      {hasMore && !loading && testimonies.length > 0 && (
        <div style={{ textAlign: 'center', padding: '16px 0' }}>
          <button className="btn btn-sm" onClick={() => fetchTestimonies(false)}>
            Load More
          </button>
        </div>
      )}

      <button className="btn btn-primary" aria-label="Share a testimony"
        onClick={() => { if (!authenticated) { setShowAuth?.(); return } setShowComposer(true) }}
        style={{ position: 'fixed', bottom: 24, right: 24, width: 56, height: 56, borderRadius: '50%',
          display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 16px rgba(99,102,241,0.4)',
          zIndex: 100, fontSize: '1.5rem', padding: 0 }}>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
          <line x1="12" y1="5" x2="12" y2="19" />
          <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
      </button>

      {showComposer && (
        <div role="dialog" aria-modal="true" aria-label="Share testimony"
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex',
            alignItems: 'center', justifyContent: 'center', zIndex: 200, padding: 16 }}>
          <div className="card fade-in" style={{ width: '100%', maxWidth: 520, maxHeight: '90vh',
            overflowY: 'auto', padding: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 700 }}>Share Your Testimony</h3>
              <button onClick={() => setShowComposer(false)} aria-label="Close" style={{ background: 'none',
                border: 'none', cursor: 'pointer', padding: 4, fontSize: '1.3rem', color: 'var(--text-muted, #94a3b8)' }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            <label style={labelStyle}>
              Title
              <input style={inputStyle} value={composer.title} placeholder="What God has done..."
                onChange={e => setComposer(c => ({ ...c, title: e.target.value }))} />
            </label>

            <label style={labelStyle}>
              Category
              <select style={inputStyle} value={composer.category}
                onChange={e => setComposer(c => ({ ...c, category: e.target.value }))}>
                {CATEGORIES.filter(c => c.value !== 'all').map(c => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
            </label>

            <label style={labelStyle}>
              Your Story
              <textarea style={{ ...inputStyle, minHeight: 140, resize: 'vertical' }} value={composer.body}
                placeholder="Share how God has worked in your life..."
                onChange={e => setComposer(c => ({ ...c, body: e.target.value }))} />
            </label>

            <label style={labelStyle}>
              Scripture Reference <span style={{ color: 'var(--text-muted, #94a3b8)', fontWeight: 400 }}>(optional)</span>
              <input style={inputStyle} value={composer.scripture_ref} placeholder="e.g. Jeremiah 29:11"
                onChange={e => setComposer(c => ({ ...c, scripture_ref: e.target.value }))} />
            </label>

            <label style={labelStyle}>
              Image URL <span style={{ color: 'var(--text-muted, #94a3b8)', fontWeight: 400 }}>(optional)</span>
              <input style={inputStyle} value={composer.image_url} placeholder="https://..."
                onChange={e => setComposer(c => ({ ...c, image_url: e.target.value }))} />
            </label>

            <label style={labelStyle}>
              Visibility
              <select style={inputStyle} value={composer.visibility}
                onChange={e => setComposer(c => ({ ...c, visibility: e.target.value }))}>
                <option value="public">Public</option>
                <option value="friends">Friends</option>
                <option value="groups">Groups</option>
              </select>
            </label>

            <div style={{ display: 'flex', gap: 10, marginTop: 16, justifyContent: 'flex-end' }}>
              <button className="btn btn-sm" onClick={() => setShowComposer(false)}>Cancel</button>
              <button className="btn btn-primary btn-sm" disabled={submitting}
                onClick={handleSubmit}>
                {submitting ? 'Sharing...' : 'Share Testimony'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function TestimonyCard({ testimony: t, onReact, expanded, onToggle }) {
  const catColor = CATEGORY_COLORS[t.category] || CATEGORY_COLORS.other
  const truncated = !expanded && t.body?.length > 220
  const displayBody = truncated ? t.body.slice(0, 220) + '...' : t.body
  const themes = t.themes || t.ai_tags || []

  return (
    <article className="card" style={{ padding: 18, marginBottom: 14 }}
      aria-label={`Testimony by ${t.author?.name || 'Anonymous'}`}>

      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
        <img className="community-avatar"
          src={t.author?.avatar || t.author?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(t.author?.name || 'A')}&background=6366f1&color=fff`}
          alt="" style={{ width: 38, height: 38, borderRadius: '50%', objectFit: 'cover' }}
          onError={e => { e.target.src = `https://ui-avatars.com/api/?name=A&background=6366f1&color=fff` }} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 600, fontSize: '0.9rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {t.author?.name || 'Anonymous'}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted, #94a3b8)' }}>{timeAgo(t.created_at || t.date)}</div>
        </div>
        <span className="community-badge" style={{ background: catColor + '20', color: catColor, fontSize: '0.72rem',
          padding: '2px 8px', borderRadius: 10, fontWeight: 600, textTransform: 'capitalize' }}>
          {t.category}
        </span>
      </div>

      {t.title && (
        <h4 style={{ fontSize: '1rem', fontWeight: 700, margin: '0 0 8px' }}>{t.title}</h4>
      )}

      {themes.length > 0 && (
        <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginBottom: 8 }}>
          {themes.map((th, i) => (
            <span key={i} style={{ fontSize: '0.68rem', background: 'var(--tag-bg, rgba(99,102,241,0.1))',
              color: 'var(--accent, #6366f1)', padding: '1px 7px', borderRadius: 8 }}>
              {typeof th === 'string' ? th : th.label || th.name}
            </span>
          ))}
        </div>
      )}

      <p style={{ fontSize: '0.88rem', lineHeight: 1.6, margin: '0 0 8px', whiteSpace: 'pre-wrap' }}>
        {displayBody}
        {truncated && (
          <button onClick={onToggle} style={{ background: 'none', border: 'none', color: 'var(--accent, #6366f1)',
            cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem', padding: 0, marginLeft: 4 }}>
            Read more
          </button>
        )}
        {!truncated && t.body?.length > 220 && (
          <button onClick={onToggle} style={{ background: 'none', border: 'none', color: 'var(--accent, #6366f1)',
            cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem', padding: 0, marginLeft: 4 }}>
            Show less
          </button>
        )}
      </p>

      {t.scripture_ref && (
        <div style={{ fontSize: '0.82rem', color: 'var(--accent, #6366f1)', fontStyle: 'italic', marginBottom: 8,
          padding: '6px 10px', background: 'var(--accent-subtle, rgba(99,102,241,0.06))', borderRadius: 6 }}>
          📖 {t.scripture_ref}
        </div>
      )}

      {t.image_url && (
        <img src={t.image_url} alt="Testimony illustration" loading="lazy"
          style={{ width: '100%', maxHeight: 260, objectFit: 'cover', borderRadius: 8, marginBottom: 10 }}
          onError={e => { e.target.style.display = 'none' }} />
      )}

      <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexWrap: 'wrap', marginTop: 10, paddingTop: 10,
        borderTop: '1px solid var(--border, rgba(148,163,184,0.15))' }}>
        {REACTIONS.map(r => {
          const count = t.reactions?.[r.key] || 0
          const active = t.user_reactions?.[r.key]
          return (
            <button key={r.key} aria-label={`${r.label}: ${count}`} title={r.label}
              onClick={() => onReact(t.id, r.key)}
              style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '4px 8px',
                borderRadius: 8, border: `1px solid ${active ? 'var(--accent, #6366f1)' : 'var(--border, rgba(148,163,184,0.15))'}`,
                background: active ? 'var(--accent-subtle, rgba(99,102,241,0.1))' : 'transparent',
                cursor: 'pointer', fontSize: '0.78rem', color: active ? 'var(--accent, #6366f1)' : 'inherit' }}>
              <span>{r.icon}</span>
              {count > 0 && <span>{count}</span>}
            </button>
          )
        })}

        <div style={{ flex: 1 }} />

        <span style={{ fontSize: '0.78rem', color: 'var(--text-muted, #94a3b8)', display: 'flex', alignItems: 'center', gap: 4 }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
          {t.comment_count ?? t.comments?.length ?? 0}
        </span>

        <button aria-label="Share testimony" style={{ background: 'none', border: 'none', cursor: 'pointer',
          padding: '4px 6px', color: 'var(--text-muted, #94a3b8)' }}
          onClick={() => { navigator.clipboard?.writeText(window.location.href + '#testimony-' + t.id); }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" />
            <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" /><line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
          </svg>
        </button>
      </div>
    </article>
  )
}

const labelStyle = {
  display: 'block', marginBottom: 14, fontSize: '0.85rem', fontWeight: 600,
  color: 'var(--text, #e2e8f0)',
}

const inputStyle = {
  display: 'block', width: '100%', marginTop: 6, padding: '10px 12px', fontSize: '0.88rem',
  background: 'var(--input-bg, rgba(148,163,184,0.08))', border: '1px solid var(--border, rgba(148,163,184,0.2))',
  borderRadius: 8, color: 'var(--text, #e2e8f0)', outline: 'none', boxSizing: 'border-box',
}
