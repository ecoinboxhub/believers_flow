import { useState, useEffect, useCallback } from 'react'

const API_URL = import.meta.env.VITE_API_URL || ''

export default function ForumView({ showToast, isPremium, setShowAuth }) {
  const [categories, setCategories] = useState([])
  const [threads, setThreads] = useState([])
  const [loading, setLoading] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState(null)
  const [selectedThread, setSelectedThread] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [sort, setSort] = useState('recent')

  const [showNewThread, setShowNewThread] = useState(false)
  const [threadTitle, setThreadTitle] = useState('')
  const [threadContent, setThreadContent] = useState('')
  const [threadCategory, setThreadCategory] = useState('')

  const [replyContent, setReplyContent] = useState('')

  const token = () => localStorage.getItem('bf_token')

  const fetchCategories = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/api/forum/categories`)
      if (!res.ok) return
      const data = await res.json()
      setCategories(data.categories || [])
      if (data.categories?.length > 0 && !threadCategory) {
        setThreadCategory(data.categories[0].id)
      }
    } catch {}
  }, [])

  const fetchThreads = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (selectedCategory) params.set('category_id', selectedCategory)
      if (searchQuery.trim()) params.set('search', searchQuery.trim())
      params.set('sort', sort)
      params.set('limit', '50')
      const res = await fetch(`${API_URL}/api/forum/threads?${params}`)
      if (!res.ok) throw new Error()
      const data = await res.json()
      setThreads(data.threads || [])
    } catch { showToast('Failed to load threads', 'warning') }
    finally { setLoading(false) }
  }, [selectedCategory, searchQuery, sort, showToast])

  useEffect(() => { fetchCategories() }, [])
  useEffect(() => { fetchThreads() }, [fetchThreads])

  const createThread = useCallback(async () => {
    if (!threadTitle.trim() || !threadContent.trim() || !threadCategory) return
    setLoading(true)
    try {
      const res = await fetch(`${API_URL}/api/forum/threads`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token()}` },
        body: JSON.stringify({
          category_id: threadCategory,
          title: threadTitle.trim(),
          content: threadContent.trim(),
        })
      })
      if (!res.ok) throw new Error()
      showToast('Thread posted!')
      setShowNewThread(false)
      setThreadTitle(''); setThreadContent('')
      fetchThreads()
    } catch { showToast('Failed to create thread', 'warning') }
    finally { setLoading(false) }
  }, [threadTitle, threadContent, threadCategory, showToast, fetchThreads])

  const openThread = useCallback(async (id) => {
    setLoading(true)
    try {
      const res = await fetch(`${API_URL}/api/forum/threads/${id}`)
      if (!res.ok) throw new Error()
      const data = await res.json()
      setSelectedThread(data)
    } catch { showToast('Failed to load thread', 'warning') }
    finally { setLoading(false) }
  }, [showToast])

  const postReply = useCallback(async () => {
    if (!replyContent.trim() || !selectedThread) return
    try {
      const res = await fetch(`${API_URL}/api/forum/threads/${selectedThread.id}/replies`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token()}` },
        body: JSON.stringify({ content: replyContent.trim() })
      })
      if (!res.ok) throw new Error()
      showToast('Reply posted!')
      setReplyContent('')
      openThread(selectedThread.id)
    } catch { showToast('Failed to post reply', 'warning') }
  }, [replyContent, selectedThread, showToast, openThread])

  const deleteThread = useCallback(async (id) => {
    try {
      const res = await fetch(`${API_URL}/api/forum/threads/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token()}` }
      })
      if (!res.ok) throw new Error()
      showToast('Thread deleted')
      setSelectedThread(null)
      fetchThreads()
    } catch { showToast('Failed to delete', 'warning') }
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
    <section className="view fade-in">
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
                <select value={threadCategory} onChange={e => setThreadCategory(e.target.value)}>
                  {categories.map(c => (
                    <option key={c.id} value={c.id}>{c.icon} {c.name}</option>
                  ))}
                </select>
                <input type="text" placeholder="Thread title" aria-label="Thread title" value={threadTitle}
                  onChange={e => setThreadTitle(e.target.value)} />
                <textarea placeholder="Write your post..." aria-label="Thread content" value={threadContent}
                  onChange={e => setThreadContent(e.target.value)} rows={4} />
                <button className="btn-primary" onClick={createThread} disabled={loading || !threadTitle.trim() || !threadContent.trim()}>
                  Post Thread
                </button>
              </div>
            )}

            <div className="forum-search-bar">
              <input type="text" placeholder="Search threads..." aria-label="Search threads" value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && fetchThreads()} />
              <select value={sort} onChange={e => setSort(e.target.value)}>
                <option value="recent">Recent</option>
                <option value="popular">Popular</option>
                <option value="active">Active</option>
              </select>
            </div>
          </div>

          <div className="card forum-categories">
            <div className="forum-cat-list">
              <button className={`forum-cat-btn${!selectedCategory ? ' active' : ''}`}
                onClick={() => setSelectedCategory(null)}>All</button>
              {categories.map(c => (
                <button key={c.id} className={`forum-cat-btn${selectedCategory === c.id ? ' active' : ''}`}
                  onClick={() => setSelectedCategory(c.id)}>
                  {c.icon} {c.name} ({c.thread_count})
                </button>
              ))}
            </div>
          </div>

          <div className="card">
            {loading && <div className="loading-spinner" />}
            {!loading && threads.length === 0 && <p className="empty-state">No threads yet. Start a discussion!</p>}
            <div className="forum-threads-list">
              {threads.map(t => (
                <div key={t.id} className={`forum-thread-item${t.is_pinned ? ' pinned' : ''}`}
                  onClick={() => openThread(t.id)} role="button" tabIndex={0}
                  onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openThread(t.id) } }}>
                  <div className="forum-thread-info">
                    <div className="forum-thread-header">
                      {t.is_pinned && <span className="pinned-badge"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" style={{width:14,height:14,verticalAlign:'middle'}}><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg></span>}
                      <strong>{t.title}</strong>
                    </div>
                    <div className="forum-thread-meta">
                      <span>{t.author_name}</span>
                      <span>{t.category_name}</span>
                      <span>{new Date(t.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <div className="forum-thread-stats">
                    <span>{t.reply_count} replies</span>
                    <span>{t.view_count} views</span>
                  </div>
                </div>
              ))}
            </div>
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
            <div className="forum-post-author">{selectedThread.author_name}</div>
            <p>{selectedThread.content}</p>
            <div className="forum-thread-stats-bar">
              <span>{selectedThread.view_count} views</span>
              <span>{selectedThread.replies?.length || 0} replies</span>
            </div>
          </div>

          <div className="forum-replies">
            <h4>Replies</h4>
            {(selectedThread.replies || []).map(r => (
              <div key={r.id} className={`forum-reply${r.is_solution ? ' solution' : ''}`}>
                <div className="forum-reply-author">
                  <span>{r.author_name}</span>
                  <span className="forum-reply-date">{new Date(r.created_at).toLocaleDateString()}</span>
                  {r.is_solution && <span className="solution-badge">✓ Solution</span>}
                </div>
                <p>{r.content}</p>
              </div>
            ))}
            {(!selectedThread.replies || selectedThread.replies.length === 0) && (
              <p className="empty-state">No replies yet. Be the first to respond!</p>
            )}
          </div>

          <div className="forum-reply-input">
            <textarea placeholder="Write a reply..." aria-label="Write a reply" value={replyContent}
              onChange={e => setReplyContent(e.target.value)} rows={3} />
            <button className="btn-primary" onClick={postReply} disabled={!replyContent.trim()}>
              Post Reply
            </button>
          </div>

          <button className="btn-danger" onClick={() => deleteThread(selectedThread.id)} style={{ marginTop: 12 }}>
            Delete Thread
          </button>
        </div>
      )}
    </section>
  )
}
