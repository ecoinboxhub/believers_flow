import { MOODS } from '../constants'
import { useMemo } from 'react'

const ENCOURAGEMENTS = {
  '\uD83D\uDE0A': {
    message: 'What a blessing to experience joy! Let your heart overflow with gratitude to God, who is the source of every good thing.',
    verse: 'The joy of the Lord is your strength.',
    ref: 'Nehemiah 8:10',
    icon: 'sun',
  },
  '\uD83D\uDE42': {
    message: 'A grateful heart is a heart that trusts God\'s faithfulness. Keep counting your blessings \u2014 they are more numerous than you think.',
    verse: 'Give thanks to the Lord, for he is good; his love endures forever.',
    ref: '1 Chronicles 16:34',
    icon: 'heart',
  },
  '\uD83D\uDE10': {
    message: 'Peace is a gift from God. Rest in His presence and trust that He holds your future in His hands.',
    verse: 'Peace I leave with you; my peace I give you.',
    ref: 'John 14:27',
    icon: 'dove',
  },
  '\uD83D\uDE22': {
    message: 'It\'s okay to feel anxious \u2014 God knows your heart. Cast your worries on Him, for He cares for you deeply.',
    verse: 'Cast all your anxiety on him because he cares for you.',
    ref: '1 Peter 5:7',
    icon: 'hands',
  },
  '\uD83D\uDE2D': {
    message: 'Even in your darkest moments, God is with you. He is close to the brokenhearted and saves those who are crushed in spirit.',
    verse: 'The Lord is close to the brokenhearted and saves those who are crushed in spirit.',
    ref: 'Psalm 34:18',
    icon: 'light',
  },
}

const ENCOURAGEMENT_ICONS = {
  sun: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{width:20,height:20}}><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>,
  heart: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{width:20,height:20}}><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/></svg>,
  dove: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{width:20,height:20}}><path d="M18 8c0 0-2-2-6-2S6 8 6 8c0 0-2 2-2 6 0 2 1 4 4 4 1 0 2-.5 3-2 .5 1.5 1.5 2 3 2 3 0 4-2 4-4 0-4-2-6-2-6z"/><path d="M12 6V2"/></svg>,
  hands: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{width:20,height:20}}><path d="M18 11V6a2 2 0 00-2-2h-1a2 2 0 00-2 2v0"/><path d="M14 10V4a2 2 0 00-2-2h-1a2 2 0 00-2 2v2"/><path d="M10 10.5V6a2 2 0 00-2-2H7a2 2 0 00-2 2v9"/><path d="M18 8a2 2 0 012 2v5a6 6 0 01-6 6h-2a6 6 0 01-6-6v-1a2 2 0 012-2h2"/></svg>,
  light: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{width:20,height:20}}><line x1="12" y1="2" x2="12" y2="6"/><line x1="12" y1="18" x2="12" y2="22"/><line x1="4.93" y1="4.93" x2="7.76" y2="7.76"/><line x1="16.24" y1="16.24" x2="19.07" y2="19.07"/><line x1="2" y1="12" x2="6" y2="12"/><line x1="18" y1="12" x2="22" y2="12"/><line x1="4.93" y1="19.07" x2="7.76" y2="16.24"/><line x1="16.24" y1="7.76" x2="19.07" y2="4.93"/></svg>,
}

function formatTime(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

function formatDate(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  return d.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })
}

const getMoodLabel = (emoji) => MOODS.find(m => m.emoji === emoji)?.label || emoji

function EncouragementCard({ mood }) {
  const enc = ENCOURAGEMENTS[mood]
  if (!enc) return null

  return (
    <div className="diary-encouragement" role="status" aria-live="polite">
      <div className="diary-encouragement-icon">{ENCOURAGEMENT_ICONS[enc.icon]}</div>
      <div className="diary-encouragement-body">
        <p className="diary-encouragement-message">{enc.message}</p>
        <p className="diary-encouragement-verse">&ldquo;{enc.verse}&rdquo;</p>
        <span className="diary-encouragement-ref">&mdash; {enc.ref}</span>
      </div>
    </div>
  )
}

export default function DiaryView({
  diaryEntries, diaryTitle, setDiaryTitle, diaryContent, setDiaryContent,
  diaryMood, setDiaryMood, editingDiary, setEditingDiary,
  addDiaryEntry, editDiaryEntry, deleteDiaryEntry,
}) {
  const showEncouragement = useMemo(() => {
    return ENCOURAGEMENTS[diaryMood] ? diaryMood : null
  }, [diaryMood])

  return (
    <section className="view fade-in">
      <div className="card">
        <div className="card-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{width:24,height:24}}><path d="M4 4.5A2.5 2.5 0 016.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15z"/><path d="M4 19.5A2.5 2.5 0 006.5 22H20"/><line x1="8" y1="7" x2="16" y2="7"/><line x1="8" y1="11" x2="14" y2="11"/></svg></div>
        <h3>{editingDiary ? 'Edit Entry' : 'New Diary Entry'}</h3>
        <p>Record your thoughts, prayers, and reflections.</p>

        <div className="diary-mood-select">
          <label className="diary-label">How are you feeling?</label>
          <div className="mood-picker">
            {MOODS.map(m => (
              <button key={m.emoji} className={`mood-btn${diaryMood === m.emoji ? ' active' : ''}`}
                onClick={() => setDiaryMood(m.emoji)} title={m.label}>
                {m.label}
              </button>
            ))}
          </div>
        </div>

        {showEncouragement && <EncouragementCard mood={showEncouragement} key={showEncouragement} />}

        <input type="text" placeholder="Title (optional)" value={diaryTitle}
          onChange={e => setDiaryTitle(e.target.value)} />

        <textarea className="diary-textarea" placeholder="Write your heart out..." value={diaryContent}
          onChange={e => setDiaryContent(e.target.value)} rows={5} />

        <div className="diary-actions">
          <button onClick={addDiaryEntry}>{editingDiary ? <><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{width:14,height:14,verticalAlign:'middle',marginRight:4}}><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg> Update Entry</> : <><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{width:14,height:14,verticalAlign:'middle',marginRight:4}}><path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg> Save Entry</>}</button>
          {editingDiary && (
            <button className="btn-outline" onClick={() => { setEditingDiary(null); setDiaryTitle(''); setDiaryContent(''); setDiaryMood('\uD83D\uDE0A') }}>Cancel</button>
          )}
        </div>
      </div>

      <div className="diary-list">
        <h3 className="section-title"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{width:18,height:18,verticalAlign:'middle',marginRight:6}}><path d="M4 19.5A2.5 2.5 0 016.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z"/></svg> My Journal</h3>
        {diaryEntries.map(entry => (
          <div key={entry.id} className="diary-entry-card">
            <div className="diary-entry-header">
              <span className="diary-entry-mood">{getMoodLabel(entry.mood)}</span>
              <div className="diary-entry-info">
                <span className="diary-entry-title">{entry.title || 'Untitled'}</span>
                <span className="diary-entry-date">{formatDate(entry.date)}{entry.date && ` at ${formatTime(entry.date)}`}</span>
              </div>
            </div>
            <p className="diary-entry-content">{entry.content}</p>
            <div className="diary-entry-actions">
              <button className="diary-edit-btn" onClick={() => editDiaryEntry(entry)}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{width:14,height:14,verticalAlign:'middle',marginRight:4}}><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg> Edit</button>
              <button className="diary-delete-btn" onClick={() => deleteDiaryEntry(entry.id)}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{width:14,height:14,verticalAlign:'middle',marginRight:4}}><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg> Delete</button>
            </div>
          </div>
        ))}
        {diaryEntries.length === 0 && (
          <div className="empty-state meaningful">
            <div className="empty-icon-wrap"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{width:48,height:48}}><path d="M4 4.5A2.5 2.5 0 016.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15z"/><path d="M4 19.5A2.5 2.5 0 006.5 22H20"/><line x1="8" y1="7" x2="16" y2="7"/><line x1="8" y1="11" x2="14" y2="11"/></svg></div>
            <h4 className="empty-title">No notes yet</h4>
            <p className="empty-hint">Highlight verses and write your personal reflections. Your journal is a safe place to grow in faith.</p>
          </div>
        )}
      </div>
    </section>
  )
}
