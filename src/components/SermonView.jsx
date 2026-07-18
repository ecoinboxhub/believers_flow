import { useState, useEffect, useCallback } from 'react'

const API_URL = import.meta.env.VITE_API_URL || ''

export default function SermonView({ showToast, isPremium, setShowAuth }) {
  const [notes, setNotes] = useState([])
  const [loading, setLoading] = useState(false)
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
  const [summary, setSummary] = useState(null)
  const [summarizing, setSummarizing] = useState(false)

  const token = () => localStorage.getItem('bf_token')

  const fetchNotes = useCallback(async () => {
    setLoading(true)
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
    } catch { showToast('Failed to load sermon notes', 'warning') }
    finally { setLoading(false) }
  }, [searchQuery, showToast])

  useEffect(() => { if (isPremium) fetchNotes() }, [isPremium, fetchNotes])

  const createNote = useCallback(async () => {
    if (!title.trim()) return
    setLoading(true)
    try {
      const body = {
        title: title.trim(),
        preacher: preacher.trim(),
        content: content.trim(),
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
      setSection('list')
      fetchNotes()
    } catch { showToast('Failed to save', 'warning') }
    finally { setLoading(false) }
  }, [title, preacher, content, scriptureRefs, keyPoints, date, showToast, fetchNotes])

  const viewNote = useCallback(async (id) => {
    try {
      const res = await fetch(`${API_URL}/api/sermons/${id}`, {
        headers: { 'Authorization': `Bearer ${token()}` }
      })
      if (!res.ok) throw new Error()
      const data = await res.json()
      setSelectedNote(data)
      setEditMode(false)
      setSummary(null)
    } catch { showToast('Failed to load note', 'warning') }
  }, [showToast])

  const deleteNote = useCallback(async (id) => {
    try {
      const res = await fetch(`${API_URL}/api/sermons/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token()}` }
      })
      if (!res.ok) throw new Error()
      showToast('Sermon note deleted')
      setSelectedNote(null)
      fetchNotes()
    } catch { showToast('Failed to delete', 'warning') }
  }, [showToast, fetchNotes])

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
      const data = await res.json()
      setSummary(data)
    } catch { showToast('Summarization failed', 'warning') }
    finally { setSummarizing(false) }
  }, [selectedNote, showToast])

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
    <section className="view fade-in">
      <div className="groups-nav">
        <button className={`groups-nav-btn${section === 'list' ? ' active' : ''}`} onClick={() => { setSection('list'); setSelectedNote(null) }}>My Notes</button>
        <button className={`groups-nav-btn${section === 'create' ? ' active' : ''}`} onClick={() => setSection('create')}>New Note</button>
      </div>

      {section === 'list' && !selectedNote && (
        <div className="card">
          <div className="card-header-row">
            <h3>Sermon Notes</h3>
            <button className="btn-sm" onClick={() => setSection('create')}>+ New</button>
          </div>
          <div className="search-bar">
            <input type="text" placeholder="Search notes..." aria-label="Search sermon notes" value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && fetchNotes()} />
            <button className="btn-sm" onClick={fetchNotes}>Search</button>
          </div>
          {loading && <div className="loading-spinner" />}
          {!loading && notes.length === 0 && <p className="empty-state">No sermon notes yet.</p>}
          <div className="sermon-list">
            {notes.map(n => (
              <div key={n.id} className="sermon-item" onClick={() => viewNote(n.id)}>
                <strong>{n.title}</strong>
                {n.preacher && <span className="sermon-preacher">{n.preacher}</span>}
                {n.date && <span className="sermon-date">{new Date(n.date).toLocaleDateString()}</span>}
                {n.church_name && <span className="sermon-church">{n.church_name}</span>}
                {n.tags?.length > 0 && (
                  <div className="sermon-tags">{[...n.tags].map(t => <span key={t} className="tag">{t}</span>)}</div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {section === 'create' && (
        <div className="card">
          <h3>New Sermon Note</h3>
          <div className="settings-form">
            <label className="settings-label">Title</label>
            <input type="text" placeholder="Sermon title" aria-label="Sermon title" value={title}
              onChange={e => setTitle(e.target.value)} />
            <label className="settings-label">Preacher</label>
            <input type="text" placeholder="Preacher name" aria-label="Preacher name" value={preacher}
              onChange={e => setPreacher(e.target.value)} />
            <label className="settings-label">Date</label>
            <input type="date" aria-label="Sermon date" value={date}
              onChange={e => setDate(e.target.value)} />
            <label className="settings-label">Scripture References (comma separated)</label>
            <input type="text" placeholder="e.g. John 3:16, Romans 8:28" aria-label="Scripture references" value={scriptureRefs}
              onChange={e => setScriptureRefs(e.target.value)} />
            <label className="settings-label">Key Points (one per line)</label>
            <textarea placeholder="Key point 1&#10;Key point 2&#10;Key point 3" aria-label="Key points" value={keyPoints}
              onChange={e => setKeyPoints(e.target.value)} rows={3} />
            <label className="settings-label">Notes / Content</label>
            <textarea placeholder="Write your sermon notes here..." aria-label="Sermon content" value={content}
              onChange={e => setContent(e.target.value)} rows={6} />
            <button className="btn-primary" onClick={createNote} disabled={loading || !title.trim()}>
              Save Note
            </button>
          </div>
        </div>
      )}

      {selectedNote && (
        <div className="card">
          <div className="group-detail-header">
            <h3>{selectedNote.title}</h3>
            <button className="group-close" onClick={() => setSelectedNote(null)}>✕</button>
          </div>
          <div className="sermon-note-detail">
            {selectedNote.preacher && <p><strong>Preacher:</strong> {selectedNote.preacher}</p>}
            {selectedNote.date && <p><strong>Date:</strong> {new Date(selectedNote.date).toLocaleDateString()}</p>}
            {selectedNote.church_name && <p><strong>Church:</strong> {selectedNote.church_name}</p>}
            {selectedNote.scripture_refs?.length > 0 && (
              <p><strong>Scripture:</strong> {selectedNote.scripture_refs.join(', ')}</p>
            )}
            {selectedNote.key_points?.length > 0 && (
              <div>
                <strong>Key Points:</strong>
                <ul>{selectedNote.key_points.map((p, i) => <li key={i}>{p}</li>)}</ul>
              </div>
            )}
            {selectedNote.content && (
              <div className="sermon-content">
                <strong>Notes:</strong>
                <p>{selectedNote.content}</p>
              </div>
            )}
            {selectedNote.tags?.length > 0 && (
              <div className="sermon-tags">{[...selectedNote.tags].map(t => <span key={t} className="tag">{t}</span>)}</div>
            )}
          </div>

          <div className="sermon-actions">
            <button className="btn-primary" onClick={summarize} disabled={summarizing || !selectedNote.content}>
              {summarizing ? 'Summarizing...' : 'AI Summarize'}
            </button>
            <button className="btn-danger" onClick={() => deleteNote(selectedNote.id)}>Delete</button>
          </div>

          {summary && (
            <div className="sermon-summary">
              <h4>AI Summary</h4>
              {summary.main_theme && <p><strong>Main Theme:</strong> {summary.main_theme}</p>}
              {summary.key_points?.length > 0 && (
                <div><strong>Key Points:</strong><ul>{summary.key_points.map((p, i) => <li key={i}>{p}</li>)}</ul></div>
              )}
              {summary.scripture_refs?.length > 0 && (
                <p><strong>Scripture References:</strong> {summary.scripture_refs.join(', ')}</p>
              )}
              {summary.action_items?.length > 0 && (
                <div><strong>Action Items:</strong><ul>{summary.action_items.map((a, i) => <li key={i}>{a}</li>)}</ul></div>
              )}
              {summary.summary && <p><strong>Overview:</strong> {summary.summary}</p>}
            </div>
          )}
        </div>
      )}
    </section>
  )
}
