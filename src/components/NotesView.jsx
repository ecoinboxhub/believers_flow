import { useState, useEffect, useCallback } from 'react'

const API_URL = import.meta.env.VITE_API_URL || ''

function loadState(key, fallback) {
  try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : fallback } catch { return fallback }
}
function saveState(key, val) { localStorage.setItem(key, JSON.stringify(val)) }

export default function NotesView({ bibleBook, bibleChapter, bibleVersion, isPremium, setShowAuth, showToast }) {
  const [notes, setNotes] = useState(() => loadState('btf_bibleNotes', {}))
  const [noteText, setNoteText] = useState('')
  const [saving, setSaving] = useState(false)
  const [syncingToServer, setSyncingToServer] = useState(false)
  const [activeNoteId, setActiveNoteId] = useState(null)
  const [noteTitle, setNoteTitle] = useState('')
  const [showHistory, setShowHistory] = useState(false)
  const [verseMarks, setVerseMarks] = useState(() => loadState('btf_verseMarks', {}))

  useEffect(() => { saveState('btf_bibleNotes', notes) }, [notes])
  useEffect(() => { saveState('btf_verseMarks', verseMarks) }, [verseMarks])

  const noteKey = `${bibleBook}_${bibleChapter}`
  const currentNotes = notes[noteKey] || []

  const addNote = useCallback(() => {
    if (!noteText.trim()) return
    const newNote = {
      id: Date.now(),
      text: noteText.trim(),
      title: noteTitle.trim() || `Note on ${bibleBook} ${bibleChapter}`,
      verse: bibleBook,
      chapter: bibleChapter,
      version: bibleVersion,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    setNotes(prev => ({
      ...prev,
      [noteKey]: [...(prev[noteKey] || []), newNote],
    }))
    setNoteText('')
    setNoteTitle('')
    if (showToast) showToast('Study note saved!')

    if (API_URL && localStorage.getItem('bf_token')) {
      setSyncingToServer(true)
      fetch(`${API_URL}/api/sync/push`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('bf_token')}`
        },
        body: JSON.stringify({ items: [{ data_type: 'bibleNotes', data: { ...notes, [noteKey]: [...(notes[noteKey] || []), newNote] } }] })
      }).catch(() => {}).finally(() => setSyncingToServer(false))
    }
  }, [noteText, noteTitle, noteKey, notes, bibleBook, bibleChapter, bibleVersion, showToast])

  const deleteNote = useCallback((id) => {
    setNotes(prev => ({
      ...prev,
      [noteKey]: (prev[noteKey] || []).filter(n => n.id !== id),
    }))
    if (showToast) showToast('Note removed')
  }, [noteKey, showToast])

  const updateNote = useCallback((id, text, title) => {
    setNotes(prev => ({
      ...prev,
      [noteKey]: (prev[noteKey] || []).map(n => n.id === id ? { ...n, text, title, updatedAt: new Date().toISOString() } : n),
    }))
  }, [noteKey])

  const toggleVerseMark = useCallback((verseNum) => {
    const key = `${bibleBook}_${bibleChapter}`
    setVerseMarks(prev => {
      const current = prev[key] || []
      return {
        ...prev,
        [key]: current.includes(verseNum) ? current.filter(v => v !== verseNum) : [...current, verseNum],
      }
    })
  }, [bibleBook, bibleChapter])

  const getMarkedVerses = () => verseMarks[`${bibleBook}_${bibleChapter}`] || []

  const allNoteKeys = Object.keys(notes).filter(k => notes[k]?.length > 0)

  return (
    <div className="card bs-panel">
      <div className="card-icon"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/></svg></div>
      <h3>Bible Study Notes</h3>
      <p>Save personal notes for {bibleBook} {bibleChapter}.</p>

      <div className="notes-input-area">
        <input type="text" className="notes-title-input" placeholder="Note title (optional)" aria-label="Note title"
          value={noteTitle} onChange={e => setNoteTitle(e.target.value)} />
        <textarea className="notes-textarea" placeholder="Write your study notes, observations, and reflections..." aria-label="Study notes"
          value={noteText} onChange={e => setNoteText(e.target.value)} rows={4} />
        <button className="btn-primary" onClick={addNote} disabled={!noteText.trim()}>
          {syncingToServer ? 'Saving...' : 'Save Note'}
        </button>
      </div>

      {currentNotes.length > 0 && (
        <div className="notes-list">
          <h4>Notes for {bibleBook} {bibleChapter}</h4>
          {currentNotes.map(note => (
            <div key={note.id} className="note-item">
              <div className="note-header">
                <strong className="note-title">{note.title}</strong>
                <div className="note-meta">
                  <span className="note-date">{new Date(note.createdAt).toLocaleDateString()}</span>
                  <button className="note-delete-btn" onClick={() => deleteNote(note.id)} aria-label="Delete note">✕</button>
                </div>
              </div>
              <p className="note-text">{note.text}</p>
              <small className="note-version">{note.version}</small>
            </div>
          ))}
        </div>
      )}

      {allNoteKeys.length > 0 && (
        <div className="notes-history-toggle">
          <button className="btn-outline" onClick={() => setShowHistory(!showHistory)}>
            {showHistory ? 'Hide' : 'Show'} All Notes ({allNoteKeys.length} chapters)
          </button>
          {showHistory && (
            <div className="notes-history-list">
              {allNoteKeys.sort().map(key => (
                <div key={key} className="notes-history-chapter">
                  <h5>{key.replace('_', ' ')}</h5>
                  <div className="notes-history-items">
                    {(notes[key] || []).map(n => (
                      <div key={n.id} className="note-item note-history-item">
                        <div className="note-header">
                          <strong className="note-title">{n.title}</strong>
                          <span className="note-date">{new Date(n.createdAt).toLocaleDateString()}</span>
                        </div>
                        <p className="note-text">{n.text}</p>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="verse-marking-area">
        <h4>Mark Verses</h4>
        <p>Track which verses you've studied in this chapter.</p>
        <div className="verse-marks-badge">
          Marked: {getMarkedVerses().length} verse{getMarkedVerses().length !== 1 ? 's' : ''}
        </div>
      </div>
    </div>
  )
}
