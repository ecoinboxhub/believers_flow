export default function DiaryReflectionCard({ reflection, loading, onRegenerate }) {
  if (!reflection) return null

  if (reflection.needsMore) {
    return (
      <div className="diary-reflection-card diary-reflection-empty" role="status" aria-live="polite">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ width: 16, height: 16, verticalAlign: 'middle', marginRight: 6 }}><path d="M12 2a3 3 0 013 3H9a3 3 0 013-3z" /><path d="M5 21l1.5-8H17.5l1.5 8H5z" /><path d="M9 21v-2a3 3 0 016 0v2" /></svg>
        <span>{reflection.message}</span>
      </div>
    )
  }

  const verses = Array.isArray(reflection.verses) ? reflection.verses : []

  return (
    <div className="diary-reflection-card" role="status" aria-live="polite">
      <div className="diary-reflection-head">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ width: 16, height: 16 }}><path d="M4 19.5A2.5 2.5 0 016.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z" /></svg>
        <span className="diary-reflection-title">AI Reflection &amp; Scripture</span>
        {onRegenerate && (
          <button className="diary-reflection-regen" onClick={onRegenerate} disabled={loading} title="Regenerate reflection" aria-label="Regenerate reflection">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: 14, height: 14 }}><path d="M23 4v6h-6" /><path d="M1 20v-6h6" /><path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15" /></svg>
          </button>
        )}
      </div>

      <div className="diary-reflection-section">
        <h5 className="diary-reflection-section-title">Reflection</h5>
        <p className="diary-reflection-body">{reflection.reflection}</p>
      </div>

      {verses.length > 0 && (
        <div className="diary-reflection-section">
          <h5 className="diary-reflection-section-title">Related Scriptures</h5>
          <ul className="diary-reflection-verses">
            {verses.map((v, i) => (
              <li key={i} className="diary-reflection-verse">
                <span className="diary-reflection-verse-ref">{v.reference}</span>
                <p className="diary-reflection-verse-text">&ldquo;{v.text}&rdquo;</p>
                {v.explanation && <p className="diary-reflection-verse-explain">{v.explanation}</p>}
              </li>
            ))}
          </ul>
        </div>
      )}

      {reflection.encouragement && (
        <div className="diary-reflection-section">
          <h5 className="diary-reflection-section-title">Encouragement</h5>
          <p className="diary-reflection-encourage">{reflection.encouragement}</p>
        </div>
      )}
    </div>
  )
}