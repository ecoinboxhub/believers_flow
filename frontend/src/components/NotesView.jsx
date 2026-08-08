import { useState, useEffect, useCallback } from 'react'

const API_URL = import.meta.env.VITE_API_URL || ''

function loadState(key, fallback) {
  try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : fallback } catch { return fallback }
}
function saveState(key, val) { localStorage.setItem(key, JSON.stringify(val)) }

export default function NotesView({ bibleBook, bibleChapter, bibleVersion, showToast, notesAssist }) {
  const [notes, setNotes] = useState(() => loadState('btf_bibleNotes', {}))
  const [noteText, setNoteText] = useState('')
  const [syncingToServer, setSyncingToServer] = useState(false)
  const [noteTitle, setNoteTitle] = useState('')
  const [showHistory, setShowHistory] = useState(false)
  const [verseMarks, setVerseMarks] = useState(() => loadState('btf_verseMarks', {}))
  const [editingNote, setEditingNote] = useState(null)
  const [editText, setEditText] = useState('')
  const [editTitle, setEditTitle] = useState('')
  const [assistLoading, setAssistLoading] = useState(false)
  const [assistResult, setAssistResult] = useState(null)

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

  const runAssist = useCallback(async () => {
    if (!noteText.trim() || !notesAssist) return
    setAssistLoading(true); setAssistResult(null)
    try {
      const result = await notesAssist(noteText.trim(), `${bibleBook} ${bibleChapter}`)
      setAssistResult(result)
    } catch {
      if (showToast) showToast('Study assist failed. Please try again.', 'warning')
    } finally {
      setAssistLoading(false)
    }
  }, [noteText, notesAssist, bibleBook, bibleChapter, showToast])

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
        {notesAssist && (
          <button className="btn-outline" onClick={runAssist} disabled={assistLoading || !noteText.trim()}>
            {assistLoading ? 'Researching...' : 'Study Assist'}
          </button>
        )}
      </div>

      {assistResult && !assistLoading && (
        <div className="notes-assist-result">
          <h4>Study Assist</h4>

          {(assistResult.suggestions || []).length > 0 && (
            <div className="assist-suggestions">
              {(assistResult.suggestions || []).map((s, i) => (
                <div key={i} className="assist-suggestion">{s}</div>
              ))}
            </div>
          )}

          {(assistResult.related_verses || []).length > 0 && (
            <div className="assist-verses">
              <h5>Related Verses</h5>
              {(assistResult.related_verses || []).map((v, i) => (
                <div key={i} className="assist-verse">
                  <strong className="assist-verse-ref">{v.reference}</strong>
                  <span className="assist-verse-text">{v.text}</span>
                </div>
              ))}
            </div>
          )}

          {(assistResult.dictionary_terms || []).length > 0 && (
            <div className="assist-terms">
              <h5>Key Terms</h5>
              {(assistResult.dictionary_terms || []).map((t, i) => (
                <div key={i} className="assist-term">
                  <strong className="assist-term-name">{t.term}</strong>
                  <span className="assist-term-def">{t.definition}</span>
                </div>
              ))}
            </div>
          )}

          {(!assistResult.suggestions || assistResult.suggestions.length === 0) &&
            (!assistResult.related_verses || assistResult.related_verses.length === 0) && (
            <p className="bs-hint">No related material found. Try adding more note text.</p>
          )}
        </div>
      )}

      {currentNotes.length > 0 && (
        <div className="notes-list">
          <h4>Notes for {bibleBook} {bibleChapter}</h4>
          {currentNotes.map(note => (
            <div key={note.id} className="note-item">
              {editingNote === note.id ? (
                <div className="note-edit-form">
                  <input type="text" className="notes-title-input" placeholder="Note title"
                    value={editTitle} onChange={e => setEditTitle(e.target.value)} aria-label="Edit note title" />
                  <textarea className="notes-textarea" placeholder="Edit your notes..."
                    value={editText} onChange={e => setEditText(e.target.value)} rows={4} aria-label="Edit note text" />
                  <div className="note-edit-actions">
                    <button className="btn-primary" onClick={() => {
                      updateNote(note.id, editText, editTitle)
                      setEditingNote(null)
                      if (showToast) showToast('Note updated')
                    }} disabled={!editText.trim()}>Save</button>
                    <button className="btn-outline" onClick={() => setEditingNote(null)}>Cancel</button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="note-header">
                    <strong className="note-title">{note.title}</strong>
                    <div className="note-meta">
                      <span className="note-date">{new Date(note.createdAt).toLocaleDateString()}</span>
                      <button className="note-edit-btn" onClick={() => {
                        setEditingNote(note.id); setEditText(note.text); setEditTitle(note.title)
                      }} aria-label="Edit note">
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/></svg>
                      </button>
                      <button className="note-delete-btn" onClick={() => deleteNote(note.id)} aria-label="Delete note">
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
                      </button>
                    </div>
                  </div>
                  <p className="note-text">{note.text}</p>
                  <small className="note-version">{note.version}</small>
                </>
              )}
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
          <input type="number" className="verse-mark-input" min="1" max="200" placeholder="Verse #"
            aria-label="Verse number to mark"
            onKeyDown={e => { if (e.key === 'Enter' && e.target.value) { toggleVerseMark(parseInt(e.target.value)); e.target.value = '' } }} />
          <button className="btn-small" onClick={e => {
            const input = e.target.previousElementSibling
            if (input.value) { toggleVerseMark(parseInt(input.value)); input.value = '' }
          }}>Toggle Mark</button>
          <span>Marked: {getMarkedVerses().length} verse{getMarkedVerses().length !== 1 ? 's' : ''}</span>
        </div>
      </div>
    </div>
  )
}
