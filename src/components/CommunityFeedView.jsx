import { useState, useEffect, useCallback, useRef } from 'react'

const API_URL = import.meta.env.VITE_API_URL || ''

const timeAgo = (date) => {
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000)
  if (seconds < 60) return 'just now'
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days}d ago`
  return new Date(date).toLocaleDateString()
}

const CONTENT_TYPES = [
  { value: 'testimony', label: 'Testimony' },
  { value: 'prayer', label: 'Prayer Request' },
  { value: 'group', label: 'Group' },
  { value: 'event', label: 'Event' },
  { value: 'sermon', label: 'Sermon' },
  { value: 'encouragement', label: 'Encouragement' },
]

const FILTER_TABS = [
  { key: 'all', label: 'All' },
  { key: 'prayer', label: 'Prayer' },
  { key: 'testimony', label: 'Testimony' },
  { key: 'group', label: 'Groups' },
  { key: 'event', label: 'Events' },
  { key: 'sermon', label: 'Sermons' },
]

const SkeletonCard = () => (
  <div className="card community-skeleton">
    <div className="community-skeleton-header">
      <div className="skeleton-avatar" />
      <div className="skeleton-lines">
        <div className="skeleton-line skeleton-line-short" />
        <div className="skeleton-line skeleton-line-tiny" />
      </div>
    </div>
    <div className="skeleton-line" />
    <div className="skeleton-line skeleton-line-medium" />
    <div className="skeleton-line skeleton-line-short" />
  </div>
)

export default function CommunityFeedView({ showToast, isPremium, setShowAuth }) {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [cursor, setCursor] = useState(null)
  const [hasMore, setHasMore] = useState(true)
  const [showCompose, setShowCompose] = useState(false)
  const [composeData, setComposeData] = useState({ title: '', body: '', content_type: 'testimony', visibility: 'public' })
  const [submitting, setSubmitting] = useState(false)
  const [encouragement, setEncouragement] = useState(null)
  const [expandedComments, setExpandedComments] = useState(null)
  const [commentText, setCommentText] = useState('')
  const [comments, setComments] = useState({})
  const [loadingComments, setLoadingComments] = useState(false)

  const feedRef = useRef(null)
  const sentinelRef = useRef(null)

  const token = () => localStorage.getItem('bf_token')

  const fetchFeed = useCallback(async (reset = false) => {
    if (!isPremium) return
    setLoading(true)
    try {
      const params = new URLSearchParams({ limit: '20' })
      if (filter !== 'all') params.set('type', filter)
      const currentCursor = reset ? null : cursor
      if (currentCursor) params.set('cursor', currentCursor)
      const res = await fetch(`${API_URL}/api/community/feed?${params}`, {
        headers: { 'Authorization': `Bearer ${token()}` }
      })
      if (!res.ok) throw new Error()
      const data = await res.json()
      const newItems = data.items || []
      setItems(prev => reset ? newItems : [...prev, ...newItems])
      setCursor(data.next_cursor || null)
      setHasMore(!!data.next_cursor)
    } catch {
      showToast('Failed to load feed', 'warning')
    } finally { setLoading(false) }
  }, [isPremium, filter, cursor, showToast])

  const fetchEncouragement = useCallback(async () => {
    if (!isPremium || filter !== 'all') return
    try {
      const res = await fetch(`${API_URL}/api/community/encouragement`, {
        headers: { 'Authorization': `Bearer ${token()}` }
      })
      if (res.ok) {
        const data = await res.json()
        setEncouragement(data)
      }
    } catch {}
  }, [isPremium, filter])

  useEffect(() => {
    setItems([])
    setCursor(null)
    setHasMore(true)
    setLoading(true)
    fetchFeed(true)
    fetchEncouragement()
  }, [filter, fetchFeed, fetchEncouragement])

  useEffect(() => {
    if (!sentinelRef.current || !hasMore || loading) return
    const observer = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore && !loading) {
        fetchFeed(false)
      }
    }, { threshold: 0.1 })
    observer.observe(sentinelRef.current)
    return () => observer.disconnect()
  }, [hasMore, loading, fetchFeed])

  const createPost = useCallback(async () => {
    if (!composeData.body.trim()) return
    setSubmitting(true)
    try {
      const body = { content: composeData.body.trim(), content_type: composeData.content_type, visibility: composeData.visibility }
      if (composeData.title.trim()) body.title = composeData.title.trim()
      const res = await fetch(`${API_URL}/api/community/feed`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token()}` },
        body: JSON.stringify(body)
      })
      if (!res.ok) throw new Error()
      showToast('Posted to community!')
      setShowCompose(false)
      setComposeData({ title: '', body: '', content_type: 'testimony', visibility: 'public' })
      fetchFeed(true)
    } catch { showToast('Failed to create post', 'warning') }
    finally { setSubmitting(false) }
  }, [composeData, showToast, fetchFeed])

  const toggleReaction = useCallback(async (itemId) => {
    try {
      const res = await fetch(`${API_URL}/api/community/feed/${itemId}/react`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token()}` }
      })
      if (!res.ok) throw new Error()
      const data = await res.json()
      setItems(prev => prev.map(item => {
        if (item.id !== itemId) return item
        return { ...item, prayed: data.prayed, prayer_count: data.prayer_count }
      }))
    } catch { showToast('Failed to react', 'warning') }
  }, [showToast])

  const loadComments = useCallback(async (itemId) => {
    if (expandedComments === itemId) { setExpandedComments(null); return }
    setExpandedComments(itemId)
    setLoadingComments(true)
    try {
      const res = await fetch(`${API_URL}/api/community/feed/${itemId}/comments`, {
        headers: { 'Authorization': `Bearer ${token()}` }
      })
      if (!res.ok) throw new Error()
      const data = await res.json()
      setComments(prev => ({ ...prev, [itemId]: data.comments || [] }))
    } catch { showToast('Failed to load comments', 'warning') }
    finally { setLoadingComments(false) }
  }, [expandedComments, showToast])

  const postComment = useCallback(async (itemId) => {
    if (!commentText.trim()) return
    try {
      const res = await fetch(`${API_URL}/api/community/feed/${itemId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token()}` },
        body: JSON.stringify({ content: commentText.trim() })
      })
      if (!res.ok) throw new Error()
      setCommentText('')
      loadComments(itemId)
      setItems(prev => prev.map(item =>
        item.id === itemId ? { ...item, comment_count: (item.comment_count || 0) + 1 } : item
      ))
    } catch { showToast('Failed to post comment', 'warning') }
  }, [commentText, showToast, loadComments])

  if (!isPremium) {
    return (
      <section className="view fade-in">
        <div className="card">
          <div className="card-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" style={{width:32,height:32}}>
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
          </div>
          <h3>Community Feed</h3>
          <p>Sign in to share testimonies, join prayer requests, and connect with believers worldwide.</p>
          <button className="btn-primary" onClick={() => setShowAuth(true)}>Sign In</button>
        </div>
      </section>
    )
  }

  return (
    <section className="view fade-in">
      <div className="groups-nav">
        {FILTER_TABS.map(tab => (
          <button key={tab.key}
            className={`groups-nav-btn${filter === tab.key ? ' active' : ''}`}
            onClick={() => setFilter(tab.key)}
            aria-label={`Filter by ${tab.label}`}>
            {tab.label}
          </button>
        ))}
      </div>

      {filter === 'all' && encouragement && (
        <div className="card community-card community-encouragement">
          <div className="encouragement-header">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" style={{width:20,height:20}}>
              <path d="M12 2L2 7l10 5 10-5-10-5z" />
              <path d="M2 17l10 5 10-5" />
              <path d="M2 12l10 5 10-5" />
            </svg>
            <h3>Daily Encouragement</h3>
          </div>
          {encouragement.verse && (
            <div className="encouragement-verse">
              <p className="encouragement-verse-text">"{encouragement.verse.text}"</p>
              <span className="encouragement-verse-ref">{encouragement.verse.reference}</span>
            </div>
          )}
          {encouragement.reflection && <p className="encouragement-text">{encouragement.reflection}</p>}
          {encouragement.prayer && <p className="encouragement-text"><strong>Prayer:</strong> {encouragement.prayer}</p>}
          {encouragement.challenge && <p className="encouragement-text"><strong>Challenge:</strong> {encouragement.challenge}</p>}
          {encouragement.action_step && <p className="encouragement-text"><strong>Action Step:</strong> {encouragement.action_step}</p>}
        </div>
      )}

      <div className="card">
        <div className="card-header-row">
          <h3>Community</h3>
        </div>

        <div className="community-feed-list" ref={feedRef}>
          {loading && items.length === 0 && (
            <>
              <SkeletonCard />
              <SkeletonCard />
              <SkeletonCard />
            </>
          )}

          {!loading && items.length === 0 && (
            <p className="empty-state">
              {filter === 'all' && 'No posts yet. Be the first to share!'}
              {filter === 'prayer' && 'No prayer requests yet. Share a prayer need.'}
              {filter === 'testimony' && 'No testimonies yet. Share what God has done.'}
              {filter === 'group' && 'No group posts yet.'}
              {filter === 'event' && 'No events shared yet.'}
              {filter === 'sermon' && 'No sermons shared yet.'}
            </p>
          )}

          {items.map(item => (
            <div key={item.id} className="community-card">
              <div className="community-card-header">
                <div className="community-avatar">
                  {item.author_avatar
                    ? <img src={item.author_avatar} alt="" className="community-avatar-img" />
                    : <div className="community-avatar-placeholder">{(item.author_name || '?')[0].toUpperCase()}</div>
                  }
                </div>
                <div className="community-card-meta">
                  <strong>{item.author_name}</strong>
                  <span>{timeAgo(item.created_at)}</span>
                </div>
                <span className={`community-type-badge community-type-${item.content_type}`}>
                  {item.content_type}
                </span>
              </div>

              {item.title && <h4 className="community-card-title">{item.title}</h4>}

              <div className="community-card-body">
                <p>{item.content}</p>
              </div>

              {item.scripture_ref && (
                <div className="community-scripture">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" style={{width:14,height:14,flexShrink:0}}>
                    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                    <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
                  </svg>
                  <span>{item.scripture_ref}</span>
                </div>
              )}

              {item.ai_tags && item.ai_tags.length > 0 && (
                <div className="community-tags">
                  {item.ai_tags.map((tag, i) => (
                    <span key={i} className="community-tag">{tag}</span>
                  ))}
                </div>
              )}

              <div className="community-card-actions">
                {item.content_type === 'prayer' && (
                  <button
                    className={`community-action-btn${item.prayed ? ' prayed' : ''}`}
                    onClick={() => toggleReaction(item.id)}
                    aria-label="I prayed">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" style={{width:16,height:16}}>
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z" />
                      <path d="M12 8v4" />
                      <path d="M9.5 15c.83.67 1.83 1 3 1" />
                    </svg>
                    <span>{item.prayer_count || 0}</span>
                  </button>
                )}
                <button
                  className="community-action-btn"
                  onClick={() => loadComments(item.id)}
                  aria-label="Comments">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" style={{width:16,height:16}}>
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                  </svg>
                  <span>{item.comment_count || 0}</span>
                </button>
                <button className="community-action-btn" aria-label="Share">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" style={{width:16,height:16}}>
                    <circle cx="18" cy="5" r="3" />
                    <circle cx="6" cy="12" r="3" />
                    <circle cx="18" cy="19" r="3" />
                    <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
                    <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
                  </svg>
                </button>
              </div>

              {expandedComments === item.id && (
                <div className="community-comments">
                  {loadingComments && <div className="loading-spinner" />}
                  {!loadingComments && (!comments[item.id] || comments[item.id].length === 0) && (
                    <p className="empty-state">No comments yet. Be the first to respond.</p>
                  )}
                  {(comments[item.id] || []).map(c => (
                    <div key={c.id} className="community-comment">
                      <div className="community-comment-header">
                        <strong>{c.author_name}</strong>
                        <span>{timeAgo(c.created_at)}</span>
                      </div>
                      <p>{c.content}</p>
                    </div>
                  ))}
                  <div className="community-comment-input">
                    <input
                      type="text"
                      placeholder="Write a comment..."
                      aria-label="Write a comment"
                      value={expandedComments === item.id ? commentText : ''}
                      onChange={e => setCommentText(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter' && commentText.trim()) postComment(item.id) }}
                    />
                    <button className="btn-sm" onClick={() => postComment(item.id)} disabled={!commentText.trim()}>Post</button>
                  </div>
                </div>
              )}
            </div>
          ))}

          {hasMore && items.length > 0 && <div ref={sentinelRef} />}
          {loading && items.length > 0 && <div className="loading-spinner" style={{margin:'16px auto'}} />}
        </div>
      </div>

      {showCompose && (
        <div className="group-detail-overlay" onClick={() => setShowCompose(false)}>
          <div className="group-detail" onClick={e => e.stopPropagation()}>
            <div className="group-detail-header">
              <h3>Share with Community</h3>
              <button className="group-close" onClick={() => setShowCompose(false)} aria-label="Close compose">✕</button>
            </div>
            <div className="settings-form">
              <label className="settings-label">Title (optional)</label>
              <input type="text" placeholder="Give your post a title" aria-label="Post title"
                value={composeData.title}
                onChange={e => setComposeData(prev => ({ ...prev, title: e.target.value }))} />
              <label className="settings-label">Content</label>
              <textarea placeholder="Share your testimony, prayer request, or encouragement..." aria-label="Post content" rows={5}
                value={composeData.body}
                onChange={e => setComposeData(prev => ({ ...prev, body: e.target.value }))} />
              <label className="settings-label">Type</label>
              <select aria-label="Content type"
                value={composeData.content_type}
                onChange={e => setComposeData(prev => ({ ...prev, content_type: e.target.value }))}>
                {CONTENT_TYPES.map(ct => (
                  <option key={ct.value} value={ct.value}>{ct.label}</option>
                ))}
              </select>
              <label className="settings-label">Visibility</label>
              <select aria-label="Visibility"
                value={composeData.visibility}
                onChange={e => setComposeData(prev => ({ ...prev, visibility: e.target.value }))}>
                <option value="public">Public</option>
                <option value="friends">Friends</option>
                <option value="private">Private</option>
              </select>
              <button className="btn-primary" onClick={createPost} disabled={submitting || !composeData.body.trim()}>
                {submitting ? 'Posting...' : 'Post'}
              </button>
            </div>
          </div>
        </div>
      )}

      <button className="community-fab" onClick={() => setShowCompose(true)} aria-label="Create post">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{width:24,height:24}}>
          <line x1="12" y1="5" x2="12" y2="19" />
          <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
      </button>
    </section>
  )
}
