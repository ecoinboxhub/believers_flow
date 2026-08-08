import { useState, useEffect, useCallback, useRef } from 'react'

const API_URL = import.meta.env.VITE_API_URL || ''
const AUTOSAVE_DELAY = 3000

export default function SermonView({ showToast, isPremium, setShowAuth }) {
  const [notes, setNotes] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [section, setSection] = useState('list')
  const [searchQuery, setSearchQuery] = useState('')

  const [title, setTitle] = useState('')
  const [preacher, setPreacher] = useState('')
  const [content, setContent] = useState('')
  const [scriptureRefs, setScriptureRefs] = useState('')
  const [keyPoints, setKeyPoints] = useState('')
  const [date, setDate] = useState('')
  const [selectedNote, setSelectedNote] = useState(null)
  const [editMode, setEditMode] = useState(false)
  const [editContent, setEditContent] = useState('')
  const [editTitle, setEditTitle] = useState('')
  const [summary, setSummary] = useState(null)
  const [summarizing, setSummarizing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [autosaveStatus, setAutosaveStatus] = useState('')
  const [bookmarked, setBookmarked] = useState(() => {
    try { return JSON.parse(localStorage.getItem('btf_sermonBookmarks') || '[]') } catch { return [] }
  })

  const autosaveTimer = useRef(null)
  const editorRef = useRef(null)

  const token = () => localStorage.getItem('bf_token')

  const persistBookmarks = (bmarks) => {
    setBookmarked(bmarks)
    localStorage.setItem('btf_sermonBookmarks', JSON.stringify(bmarks))
  }

  const fetchNotes = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams()
      if (searchQuery.trim()) params.set('search', searchQuery.trim())
      params.set('limit', '50')
      const res = await fetch(`${API_URL}/api/sermons?${params}`, {
        headers: { 'Authorization': `Bearer ${token()}` }
      })
      if (!res.ok) throw new Error()
      const data = await res.json()
      setNotes(data.notes || [])
    } catch {
      setError('Failed to load sermon notes')
      showToast('Failed to load sermon notes', 'warning')
    } finally { setLoading(false) }
  }, [searchQuery, showToast])

  useEffect(() => { (async () => { try { if (isPremium) await fetchNotes() } catch { /* ignore */ } })() }, [isPremium, fetchNotes])

  const createNote = useCallback(async () => {
    if (!title.trim()) return
    setLoading(true)
    setError(null)
    try {
      const body = {
        title: title.trim(), preacher: preacher.trim(), content: content.trim(),
        scripture_refs: scriptureRefs.split(',').map(s => s.trim()).filter(Boolean),
        key_points: keyPoints.split('\n').map(s => s.trim()).filter(Boolean),
      }
      if (date) body.date = new Date(date).toISOString()
      const res = await fetch(`${API_URL}/api/sermons/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token()}` },
        body: JSON.stringify(body)
      })
      if (!res.ok) throw new Error()
      showToast('Sermon note saved!')
      setTitle(''); setPreacher(''); setContent(''); setScriptureRefs(''); setKeyPoints(''); setDate('')
      setAutosaveStatus('')
      setSection('list')
      fetchNotes()
    } catch { showToast('Failed to save', 'warning') }
    finally { setLoading(false) }
  }, [title, preacher, content, scriptureRefs, keyPoints, date, showToast, fetchNotes])

  // Autosave draft to localStorage
  useEffect(() => {
    if (section !== 'create') return
    const draft = { title, preacher, content, scriptureRefs, keyPoints, date }
    if (title || content) {
      if (autosaveTimer.current) clearTimeout(autosaveTimer.current)
      autosaveTimer.current = setTimeout(() => {
        localStorage.setItem('btf_sermonDraft', JSON.stringify(draft))
        setAutosaveStatus('Draft saved')
        setTimeout(() => setAutosaveStatus(''), 2000)
      }, AUTOSAVE_DELAY)
    }
    return () => { if (autosaveTimer.current) clearTimeout(autosaveTimer.current) }
  }, [title, preacher, content, scriptureRefs, keyPoints, date, section])

  // Load draft on mount
  const restoreDraft = () => {
    try {
      const draft = JSON.parse(localStorage.getItem('btf_sermonDraft') || '{}')
      if (draft.title) {
        setTitle(draft.title || '')
        setPreacher(draft.preacher || '')
        setContent(draft.content || '')
        setScriptureRefs(draft.scriptureRefs || '')
        setKeyPoints(draft.keyPoints || '')
        setDate(draft.date || '')
      }
    } catch { /* ignore */ }
  }

  useEffect(() => {
    if (section === 'create') restoreDraft() // eslint-disable-line react-hooks/set-state-in-effect
  }, [section])

  const viewNote = useCallback(async (id) => {
    try {
      const res = await fetch(`${API_URL}/api/sermons/${id}`, {
        headers: { 'Authorization': `Bearer ${token()}` }
      })
      if (!res.ok) throw new Error()
      const data = await res.json()
      setSelectedNote(data)
      setEditMode(false)
      setEditContent(data.content || '')
      setEditTitle(data.title || '')
      setSummary(null)
    } catch { showToast('Failed to load note', 'warning') }
  }, [showToast])

  const updateNote = useCallback(async () => {
    if (!selectedNote || !editTitle.trim()) return
    setSaving(true)
    try {
      const res = await fetch(`${API_URL}/api/sermons/${selectedNote.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token()}` },
        body: JSON.stringify({ title: editTitle.trim(), content: editContent })
      })
      if (!res.ok) throw new Error()
      showToast('Note updated!')
      setEditMode(false)
      viewNote(selectedNote.id)
    } catch { showToast('Failed to update', 'warning') }
    finally { setSaving(false) }
  }, [selectedNote, editTitle, editContent, showToast, viewNote])

  const deleteNote = useCallback(async (id) => {
    try {
      const res = await fetch(`${API_URL}/api/sermons/${id}`, {
        method: 'DELETE', headers: { 'Authorization': `Bearer ${token()}` }
      })
      if (!res.ok) throw new Error()
      showToast('Sermon note deleted')
      setSelectedNote(null); fetchNotes()
    } catch { showToast('Failed to delete', 'warning') }
  }, [showToast, fetchNotes])

  const toggleBookmark = (id) => {
    const exists = bookmarked.includes(id)
    const updated = exists ? bookmarked.filter(b => b !== id) : [...bookmarked, id]
    persistBookmarks(updated)
    showToast(exists ? 'Bookmark removed' : 'Bookmarked!')
  }

  const shareNote = (note) => {
    const text = `${note.title}${note.preacher ? ` by ${note.preacher}` : ''}\n\n${note.content?.slice(0, 500) || ''}`
    if (navigator.share) {
      navigator.share({ title: note.title, text }).catch(() => {})
    } else {
      navigator.clipboard.writeText(text).then(() => showToast('Copied to clipboard!')).catch(() => {})
    }
  }

  const summarize = useCallback(async () => {
    if (!selectedNote?.content) return
    setSummarizing(true)
    try {
      const res = await fetch(`${API_URL}/api/sermons/summarize`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token()}` },
        body: JSON.stringify({ sermon_text: selectedNote.content })
      })
      if (!res.ok) throw new Error()
      setSummary(await res.json())
    } catch { showToast('Summarization failed', 'warning') }
    finally { setSummarizing(false) }
  }, [selectedNote, showToast])

  const filteredNotes = searchQuery.trim()
    ? notes.filter(n =>
        n.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        n.preacher?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        n.content?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : notes

  if (!isPremium) {
    return (
      <section className="view fade-in">
        <div className="card">
          <div className="card-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="8" y1="13" x2="16" y2="13"/><line x1="8" y1="17" x2="16" y2="17"/><line x1="8" y1="9" x2="10" y2="9"/></svg></div>
          <h3>Sermon Notes</h3>
          <p>Sign in to save and organize sermon notes with AI-powered summaries.</p>
          <button className="btn-primary" onClick={() => setShowAuth(true)}>Sign In</button>
        </div>
      </section>
    )
  }

  return (
    <section className="view fade-in" role="region" aria-label="Sermon Notes">
      <div className="groups-nav" role="tablist" aria-label="Sermon sections">
        <button className={`groups-nav-btn${section === 'list' ? ' active' : ''}`}
          onClick={() => { setSection('list'); setSelectedNote(null) }} role="tab">My Notes</button>
        <button className={`groups-nav-btn${section === 'create' ? ' active' : ''}`}
          onClick={() => { setSection('create'); setSelectedNote(null) }} role="tab">New Note</button>
      </div>

      {error && <div className="error-banner" role="alert">{error}</div>}

      {section === 'list' && !selectedNote && (
        <div className="card">
          <div className="card-header-row">
            <h3>Sermon Notes</h3>
            <button className="btn-sm" onClick={() => setSection('create')}>+ New</button>
          </div>
          <div className="search-bar" role="search">
            <input type="text" placeholder="Search notes by title, preacher, or content..." aria-label="Search sermon notes" value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)} autoFocus />
            <button className="btn-sm" onClick={fetchNotes}>Search</button>
          </div>
          {loading && <div className="loading-spinner" aria-label="Loading notes" />}
          {!loading && !error && filteredNotes.length === 0 && (
            <div className="empty-state" role="status">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{width:48,height:48,opacity:0.3,marginBottom:12}}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
              <p>No sermon notes yet. Start taking notes during your next service!</p>
            </div>
          )}
          {!loading && filteredNotes.length > 0 && (
            <div className="sermon-list" role="list">
              {filteredNotes.map(n => (
                <div key={n.id} className={`sermon-item${bookmarked.includes(n.id) ? ' bookmarked' : ''}`}
                  onClick={() => viewNote(n.id)} role="listitem" tabIndex={0}>
                  <div className="sermon-item-header">
                    <strong>{n.title}</strong>
                    {bookmarked.includes(n.id) && <span className="bookmark-badge" aria-label="Bookmarked"><svg viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="1.8" style={{width:14,height:14}}><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg></span>}
                  </div>
                  <div className="sermon-item-meta">
                    {n.preacher && <span className="sermon-preacher">{n.preacher}</span>}
                    {n.date && <span className="sermon-date">{new Date(n.date).toLocaleDateString()}</span>}
                    {n.church_name && <span className="sermon-church">{n.church_name}</span>}
                  </div>
                  {n.tags?.length > 0 && (
                    <div className="sermon-tags" role="list">{[...n.tags].map(t => <span key={t} className="tag" role="listitem">{t}</span>)}</div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {section === 'create' && (
        <div className="card">
          <div className="card-header-row">
            <h3>New Sermon Note</h3>
            {autosaveStatus && <span className="autosave-status">{autosaveStatus}</span>}
          </div>
          <div className="settings-form">
            <label className="settings-label" htmlFor="sermon-title">Title</label>
            <input id="sermon-title" type="text" placeholder="Sermon title" aria-label="Sermon title" value={title}
              onChange={e => setTitle(e.target.value)} autoFocus />
            <div className="form-row">
              <div className="form-field">
                <label className="settings-label" htmlFor="sermon-preacher">Preacher</label>
                <input id="sermon-preacher" type="text" placeholder="Preacher name" aria-label="Preacher name" value={preacher}
                  onChange={e => setPreacher(e.target.value)} />
              </div>
              <div className="form-field">
                <label className="settings-label" htmlFor="sermon-date">Date</label>
                <input id="sermon-date" type="date" aria-label="Sermon date" value={date}
                  onChange={e => setDate(e.target.value)} />
              </div>
            </div>
            <label className="settings-label" htmlFor="sermon-scripture">Scripture References (comma separated)</label>
            <input id="sermon-scripture" type="text" placeholder="e.g. John 3:16, Romans 8:28" aria-label="Scripture references" value={scriptureRefs}
              onChange={e => setScriptureRefs(e.target.value)} />
            <label className="settings-label" htmlFor="sermon-points">Key Points (one per line)</label>
            <textarea id="sermon-points" placeholder="Key point 1&#10;Key point 2&#10;Key point 3" aria-label="Key points" value={keyPoints}
              onChange={e => setKeyPoints(e.target.value)} rows={3} />
            <label className="settings-label" htmlFor="sermon-content">Notes / Content</label>
            <textarea id="sermon-content" ref={editorRef}
              placeholder="Write your sermon notes here..." aria-label="Sermon content" value={content}
              onChange={e => setContent(e.target.value)} rows={8} className="rich-textarea" />
            <div className="form-actions">
              <button className="btn-primary" onClick={createNote} disabled={loading || !title.trim()}>
                {loading ? <span className="btn-loading"><span className="spinner-sm" /> Saving...</span> : 'Save Note'}
              </button>
              <button className="btn-outline" onClick={() => { setSection('list'); setAutosaveStatus('') }}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {selectedNote && (
        <div className="card">
          <div className="group-detail-header">
            <div>
              {editMode ? (
                <div className="inline-edit">
                  <input type="text" value={editTitle} onChange={e => setEditTitle(e.target.value)}
                    aria-label="Edit title" className="edit-title-input" autoFocus />
                </div>
              ) : (
                <h3>{selectedNote.title}</h3>
              )}
              {selectedNote.preacher && <span className="sermon-preacher-label">by {selectedNote.preacher}</span>}
            </div>
            <button className="group-close" onClick={() => { setSelectedNote(null); setEditMode(false) }} aria-label="Close">✕</button>
          </div>

          <div className="sermon-actions-bar">
            <button className="btn-sm" onClick={() => toggleBookmark(selectedNote.id)}
              aria-label={bookmarked.includes(selectedNote.id) ? 'Remove bookmark' : 'Bookmark'}>
              <svg viewBox="0 0 24 24" fill={bookmarked.includes(selectedNote.id) ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.8" style={{width:14,height:14,verticalAlign:'middle',marginRight:4}}><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>
              {bookmarked.includes(selectedNote.id) ? 'Bookmarked' : 'Bookmark'}
            </button>
            <button className="btn-sm" onClick={() => shareNote(selectedNote)} aria-label="Share note">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" style={{width:14,height:14,verticalAlign:'middle',marginRight:4}}><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>
              Share
            </button>
            <button className="btn-sm" onClick={() => {
              if (editMode) updateNote()
              else { setEditMode(true); setEditContent(selectedNote.content || ''); setEditTitle(selectedNote.title || '') }
            }} aria-label={editMode ? 'Save changes' : 'Edit note'}>
              {editMode ? (saving ? 'Saving...' : 'Save') : 'Edit'}
            </button>
          </div>

          {editMode ? (
            <div className="edit-mode">
              <label className="settings-label">Content</label>
              <textarea value={editContent} onChange={e => setEditContent(e.target.value)}
                rows={10} className="rich-textarea" aria-label="Edit content" />
              <div className="form-actions" style={{ marginTop: 8 }}>
                <button className="btn-primary" onClick={updateNote} disabled={saving || !editTitle.trim()}>
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
                <button className="btn-outline" onClick={() => setEditMode(false)}>Cancel</button>
              </div>
            </div>
          ) : (
            <div className="sermon-note-detail">
              {selectedNote.preacher && <div className="detail-row"><span className="detail-label">Preacher</span><span>{selectedNote.preacher}</span></div>}
              {selectedNote.date && <div className="detail-row"><span className="detail-label">Date</span><span>{new Date(selectedNote.date).toLocaleDateString()}</span></div>}
              {selectedNote.church_name && <div className="detail-row"><span className="detail-label">Church</span><span>{selectedNote.church_name}</span></div>}
              {selectedNote.scripture_refs?.length > 0 && (
                <div className="detail-row"><span className="detail-label">Scripture</span><div className="refs-list">{selectedNote.scripture_refs.map((r, i) => <span key={i} className="scripture-ref">{r}</span>)}</div></div>
              )}
              {selectedNote.key_points?.length > 0 && (
                <div className="detail-section">
                  <span className="detail-label">Key Points</span>
                  <ul className="key-points-list">{selectedNote.key_points.map((p, i) => <li key={i}>{p}</li>)}</ul>
                </div>
              )}
              {selectedNote.content && (
                <div className="detail-section">
                  <span className="detail-label">Notes</span>
                  <div className="sermon-content-text">{selectedNote.content}</div>
                </div>
              )}
              {selectedNote.tags?.length > 0 && (
                <div className="sermon-tags" role="list">{[...selectedNote.tags].map(t => <span key={t} className="tag" role="listitem">{t}</span>)}</div>
              )}
            </div>
          )}

          {!editMode && (
            <div className="sermon-actions-section">
              <button className="btn-primary" onClick={summarize} disabled={summarizing || !selectedNote.content}>
                {summarizing ? <span className="btn-loading"><span className="spinner-sm" /> Summarizing...</span> : 'AI Summarize'}
              </button>
              <button className="btn-danger" onClick={() => { if (confirm('Delete this sermon note?')) deleteNote(selectedNote.id) }}>Delete</button>
            </div>
          )}

          {summary && (
            <div className="sermon-summary">
              <h4>AI Summary</h4>
              {summary.main_theme && <div className="detail-row"><span className="detail-label">Main Theme</span><span>{summary.main_theme}</span></div>}
              {summary.key_points?.length > 0 && (
                <div><span className="detail-label">Key Points</span><ul className="key-points-list">{summary.key_points.map((p, i) => <li key={i}>{p}</li>)}</ul></div>
              )}
              {summary.scripture_refs?.length > 0 && (
                <div className="detail-row"><span className="detail-label">Scripture</span><span>{summary.scripture_refs.join(', ')}</span></div>
              )}
              {summary.action_items?.length > 0 && (
                <div><span className="detail-label">Action Items</span><ul className="key-points-list">{summary.action_items.map((a, i) => <li key={i}>{a}</li>)}</ul></div>
              )}
              {summary.summary && <div className="detail-section"><span className="detail-label">Overview</span><p>{summary.summary}</p></div>}
            </div>
          )}
        </div>
      )}
    </section>
  )
}