import { useState, useEffect, useCallback } from 'react'

const API_URL = import.meta.env.VITE_API_URL || ''

export default function ForumView({ showToast, isPremium, setShowAuth }) {
  const [categories, setCategories] = useState([])
  const [threads, setThreads] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [selectedCategory, setSelectedCategory] = useState(null)
  const [selectedThread, setSelectedThread] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [sort, setSort] = useState('recent')
  const [page, setPage] = useState(1)
  const [totalThreads, setTotalThreads] = useState(0)

  const [showNewThread, setShowNewThread] = useState(false)
  const [threadTitle, setThreadTitle] = useState('')
  const [threadContent, setThreadContent] = useState('')
  const [threadCategory, setThreadCategory] = useState('')

  const [replyContent, setReplyContent] = useState('')
  const [replyingTo, setReplyingTo] = useState(null)
  const [replyError, setReplyError] = useState(null)

  const token = () => localStorage.getItem('bf_token')
  const isModerator = () => {
    const user = (() => { try { return JSON.parse(localStorage.getItem('bf_user') || 'null') } catch { return null } })()
    return user?.role === 'moderator' || user?.plan === 'premium'
  }

  const fetchCategories = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/api/forum/categories`)
      if (!res.ok) return
      const data = await res.json()
      setCategories(data.categories || [])
      if (data.categories?.length > 0 && !threadCategory) {
        setThreadCategory(data.categories[0].id)
      }
    } catch { /* ignore */ }
  }, [])

  const fetchThreads = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams()
      if (selectedCategory) params.set('category_id', selectedCategory)
      if (searchQuery.trim()) params.set('search', searchQuery.trim())
      params.set('sort', sort)
      params.set('limit', '20')
      params.set('page', String(page))
      const res = await fetch(`${API_URL}/api/forum/threads?${params}`)
      if (!res.ok) throw new Error()
      const data = await res.json()
      setThreads(data.threads || [])
      setTotalThreads(data.total || data.threads?.length || 0)
    } catch { setError('Failed to load threads'); showToast('Failed to load threads', 'warning') }
    finally { setLoading(false) }
  }, [selectedCategory, searchQuery, sort, page, showToast])

  useEffect(() => { (async () => { try { await fetchCategories() } catch { /* ignore */ } })() }, [])
  useEffect(() => { (async () => { try { await fetchThreads() } catch { /* ignore */ } })() }, [fetchThreads])

  const createThread = useCallback(async () => {
    if (!threadTitle.trim() || !threadContent.trim() || !threadCategory) return
    setLoading(true)
    try {
      const res = await fetch(`${API_URL}/api/forum/threads`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token()}` },
        body: JSON.stringify({ category_id: threadCategory, title: threadTitle.trim(), content: threadContent.trim() })
      })
      if (!res.ok) throw new Error()
      showToast('Thread posted!')
      setShowNewThread(false); setThreadTitle(''); setThreadContent(''); setPage(1)
      fetchThreads()
    } catch { showToast('Failed to create thread', 'warning') }
    finally { setLoading(false) }
  }, [threadTitle, threadContent, threadCategory, showToast, fetchThreads])

  const openThread = useCallback(async (id) => {
    setLoading(true)
    try {
      const res = await fetch(`${API_URL}/api/forum/threads/${id}`)
      if (!res.ok) throw new Error()
      setSelectedThread(await res.json())
      setReplyingTo(null); setReplyError(null)
    } catch { showToast('Failed to load thread', 'warning') }
    finally { setLoading(false) }
  }, [showToast])

  const postReply = useCallback(async () => {
    if (!replyContent.trim() || !selectedThread) return
    if (replyContent.length > 5000) { setReplyError('Reply is too long (max 5000 characters)'); return }
    setReplyError(null)
    try {
      const body = { content: replyContent.trim() }
      if (replyingTo) body.parent_id = replyingTo
      const res = await fetch(`${API_URL}/api/forum/threads/${selectedThread.id}/replies`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token()}` },
        body: JSON.stringify(body)
      })
      if (!res.ok) throw new Error()
      showToast('Reply posted!')
      setReplyContent(''); setReplyingTo(null)
      openThread(selectedThread.id)
    } catch { setReplyError('Failed to post reply') }
  }, [replyContent, selectedThread, replyingTo, showToast, openThread])

  const reactToPost = useCallback(async (threadId, type = 'like') => {
    try {
      const res = await fetch(`${API_URL}/api/forum/threads/${threadId}/reactions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token()}` },
        body: JSON.stringify({ reaction: type })
      })
      if (!res.ok) throw new Error()
      await res.json()
      showToast(type === 'like' ? 'Liked!' : 'Reacted!')
    } catch { showToast('Reaction failed', 'warning') }
  }, [showToast])

  const deleteThread = useCallback(async (id) => {
    if (!isModerator()) { showToast('Only moderators can delete threads', 'warning'); return }
    try {
      const res = await fetch(`${API_URL}/api/forum/threads/${id}`, {
        method: 'DELETE', headers: { 'Authorization': `Bearer ${token()}` }
      })
      if (!res.ok) throw new Error()
      showToast('Thread deleted')
      setSelectedThread(null); fetchThreads()
    } catch { showToast('Failed to delete', 'warning') }
  }, [showToast, fetchThreads])

  const pinThread = useCallback(async (id) => {
    if (!isModerator()) return
    try {
      const res = await fetch(`${API_URL}/api/forum/threads/${id}/pin`, {
        method: 'POST', headers: { 'Authorization': `Bearer ${token()}` }
      })
      if (!res.ok) throw new Error()
      showToast('Thread pinned!')
      fetchThreads()
    } catch { showToast('Failed to pin', 'warning') }
  }, [showToast, fetchThreads])

  if (!isPremium) {
    return (
      <section className="view fade-in">
        <div className="card">
          <div className="card-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/><line x1="8" y1="8" x2="16" y2="8"/><line x1="8" y1="12" x2="13" y2="12"/></svg></div>
          <h3>Community Forum</h3>
          <p>Sign in to join discussions, ask questions, and share insights with the community.</p>
          <button className="btn-primary" onClick={() => setShowAuth(true)}>Sign In</button>
        </div>
      </section>
    )
  }

  return (
    <section className="view fade-in" role="region" aria-label="Community Forum">
      {error && <div className="error-banner" role="alert">{error}</div>}

      {!selectedThread ? (
        <>
          <div className="card">
            <div className="card-header-row">
              <h3>Community Forum</h3>
              <button className="btn-sm" onClick={() => setShowNewThread(!showNewThread)}>
                {showNewThread ? 'Cancel' : '+ New Thread'}
              </button>
            </div>

            {showNewThread && (
              <div className="forum-new-thread">
                <select value={threadCategory} onChange={e => setThreadCategory(e.target.value)} aria-label="Category">
                  {categories.map(c => (
                    <option key={c.id} value={c.id}>{c.icon} {c.name}</option>
                  ))}
                </select>
                <input type="text" placeholder="Thread title" aria-label="Thread title" value={threadTitle}
                  onChange={e => setThreadTitle(e.target.value)} autoFocus />
                <textarea placeholder="Write your post..." aria-label="Thread content" value={threadContent}
                  onChange={e => setThreadContent(e.target.value)} rows={4} />
                <button className="btn-primary" onClick={createThread} disabled={loading || !threadTitle.trim() || !threadContent.trim()}>
                  {loading ? 'Posting...' : 'Post Thread'}
                </button>
              </div>
            )}

            <div className="forum-search-bar" role="search">
              <input type="text" placeholder="Search threads..." aria-label="Search threads" value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && fetchThreads()} />
              <select value={sort} onChange={e => setSort(e.target.value)} aria-label="Sort threads">
                <option value="recent">Recent</option>
                <option value="popular">Popular</option>
                <option value="active">Active</option>
              </select>
            </div>
          </div>

          <div className="card forum-categories">
            <div className="forum-cat-list" role="tablist" aria-label="Categories">
              <button className={`forum-cat-btn${!selectedCategory ? ' active' : ''}`}
                onClick={() => setSelectedCategory(null)} role="tab">All</button>
              {categories.map(c => (
                <button key={c.id} className={`forum-cat-btn${selectedCategory === c.id ? ' active' : ''}`}
                  onClick={() => setSelectedCategory(c.id)} role="tab" aria-selected={selectedCategory === c.id}>
                  {c.icon} {c.name} <span className="cat-count">({c.thread_count})</span>
                </button>
              ))}
            </div>
          </div>

          <div className="card">
            {loading && <div className="loading-spinner" aria-label="Loading threads" />}
            {!loading && !error && threads.length === 0 && (
              <div className="empty-state" role="status">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{width:48,height:48,opacity:0.3,marginBottom:12}}><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                <p>No threads yet. Start a discussion!</p>
              </div>
            )}
            {!loading && threads.length > 0 && (
              <>
                <div className="forum-threads-list" role="list">
                  {threads.map(t => (
                    <div key={t.id} className={`forum-thread-item${t.is_pinned ? ' pinned' : ''}`}
                      onClick={() => openThread(t.id)} role="listitem" tabIndex={0}>
                      <div className="forum-thread-info">
                        <div className="forum-thread-header">
                          {t.is_pinned && <span className="pinned-badge" aria-label="Pinned"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" style={{width:14,height:14,verticalAlign:'middle'}}><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg></span>}
                          <strong>{t.title}</strong>
                        </div>
                        <div className="forum-thread-meta">
                          <span className="thread-author">{t.author_name}</span>
                          <span className="thread-category">{t.category_name}</span>
                          <span className="thread-date">{new Date(t.created_at).toLocaleDateString()}</span>
                        </div>
                      </div>
                      <div className="forum-thread-stats">
                        <span className="stat-replies">{t.reply_count} replies</span>
                        <span className="stat-views">{t.view_count} views</span>
                      </div>
                    </div>
                  ))}
                </div>
                {totalThreads > 20 && (
                  <div className="pagination" role="navigation" aria-label="Thread pagination">
                    <button className="btn-sm" disabled={page <= 1} onClick={() => setPage(p => Math.max(1, p - 1))}>Previous</button>
                    <span className="page-indicator">Page {page}</span>
                    <button className="btn-sm" disabled={threads.length < 20} onClick={() => setPage(p => p + 1)}>Next</button>
                  </div>
                )}
              </>
            )}
          </div>
        </>
      ) : (
        <div className="card">
          <div className="group-detail-header">
            <div>
              <h3>{selectedThread.title}</h3>
              <span className="forum-thread-category">{selectedThread.category_name}</span>
            </div>
            <button className="group-close" onClick={() => setSelectedThread(null)} aria-label="Close thread">✕</button>
          </div>

          <div className="forum-thread-content">
            <div className="forum-post-header">
              <span className="forum-post-author">{selectedThread.author_name}</span>
              <span className="forum-post-date">{new Date(selectedThread.created_at).toLocaleDateString()}</span>
            </div>
            <div className="forum-post-body">{selectedThread.content}</div>
            <div className="forum-thread-actions">
              <button className="btn-sm" onClick={() => reactToPost(selectedThread.id, 'like')} aria-label="Like">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" style={{width:14,height:14,verticalAlign:'middle',marginRight:4}}><path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3H14zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"/></svg>
                Like
              </button>
              <span className="forum-thread-stats-bar">
                <span>{selectedThread.view_count} views</span>
                <span>{selectedThread.replies?.length || 0} replies</span>
              </span>
            </div>
          </div>

          <div className="forum-replies">
            <h4>Replies ({selectedThread.replies?.length || 0})</h4>
            {(selectedThread.replies || []).map(r => (
              <div key={r.id} className={`forum-reply${r.is_solution ? ' solution' : ''}`}
                id={`reply-${r.id}`}>
                <div className="forum-reply-header">
                  <div className="forum-reply-author-info">
                    <span className="forum-reply-author">{r.author_name}</span>
                    <span className="forum-reply-date">{new Date(r.created_at).toLocaleDateString()}</span>
                    {r.is_solution && <span className="solution-badge">✓ Solution</span>}
                  </div>
                  <button className="btn-sm btn-outline" onClick={() => {
                    setReplyingTo(r.id)
                    document.querySelector('.forum-reply-input textarea')?.focus()
                  }} aria-label="Reply to this comment">Reply</button>
                </div>
                <div className="forum-reply-body">{r.content}</div>
                {r.replies?.length > 0 && (
                  <div className="nested-replies">
                    {r.replies.map(nr => (
                      <div key={nr.id} className="nested-reply">
                        <div className="forum-reply-author-info">
                          <span className="forum-reply-author">{nr.author_name}</span>
                          <span className="forum-reply-date">{new Date(nr.created_at).toLocaleDateString()}</span>
                        </div>
                        <div className="forum-reply-body">{nr.content}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
            {(!selectedThread.replies || selectedThread.replies.length === 0) && (
              <p className="empty-state">No replies yet. Be the first to respond!</p>
            )}
          </div>

          <div className="forum-reply-input">
            {replyingTo && (
              <div className="replying-to">
                <span>Replying to a comment</span>
                <button className="btn-sm" onClick={() => setReplyingTo(null)}>Cancel</button>
              </div>
            )}
            <textarea placeholder="Write a reply..." aria-label="Write a reply" value={replyContent}
              onChange={e => setReplyContent(e.target.value)} rows={3} />
            {replyError && <div className="error-text" role="alert">{replyError}</div>}
            <button className="btn-primary" onClick={postReply} disabled={!replyContent.trim()}>
              Post Reply
            </button>
          </div>

          {isModerator() && (
            <div className="moderation-actions">
              <h4>Moderation</h4>
              <div className="mod-buttons">
                <button className="btn-sm" onClick={() => pinThread(selectedThread.id)}>
                  {selectedThread.is_pinned ? 'Unpin' : 'Pin Thread'}
                </button>
                <button className="btn-danger btn-sm" onClick={() => deleteThread(selectedThread.id)}>
                  Delete Thread
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </section>
  )
}