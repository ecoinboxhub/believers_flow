import { AlertTriangleIcon, LightbulbIcon } from './icons.jsx'

const ico = { width: '1em', height: '1em', style: { verticalAlign: '-0.125em' } }

export default function ExplainView({
  bibleBook, bibleChapter, bibleText, explanation, explanationLoading, explainVerse, isPremium, setShowAuth,
}) {
  return (
    <div className="card bs-panel">
      <div className="card-icon"><LightbulbIcon width="1em" height="1em" /></div>
      <h3>AI Verse Explanation</h3>
      <p>Select a <LightbulbIcon {...ico} /> button next to any verse in the Read tab, or click a verse below.</p>
      {bibleText && (
        <div className="explain-quick-verses">
          {(bibleText.verses || []).slice(0, 10).map((v, i) => (
            <button key={i} className="explain-verse-chip" onClick={() => {
              if (!isPremium) { setShowAuth(true); return }
              explainVerse(`${bibleBook} ${bibleChapter}:${v.verse}`, v.text)
            }}>
              <sup>{v.verse}</sup> {v.text.slice(0, 60)}...
            </button>
          ))}
        </div>
      )}
      {explanationLoading && (
        <div className="skeleton-block">
          <div className="skeleton-line w-75" />
          <div className="skeleton-line w-50" />
          <div className="skeleton-line w-90" />
          <div className="skeleton-line w-60" />
        </div>
      )}
      {explanation && !explanationLoading && (
        <div className="explanation-content">
          <h4 className="explanation-ref">{explanation.reference}</h4>
          <div className="explanation-text">{explanation.explanation}</div>

          {(explanation.key_terms || []).length > 0 && (
            <div className="explain-terms">
              <h5>Key Terms</h5>
              {(explanation.key_terms || []).map((t, i) => (
                <div key={i} className="explain-term">
                  <strong className="explain-term-name">{t.term}</strong>
                  <span className="explain-term-note">{t.note}</span>
                  <small className="explain-term-source">{t.source}</small>
                </div>
              ))}
            </div>
          )}

          {(explanation.cross_references || []).length > 0 && (
            <div className="explain-cross-refs">
              <h5>Cross References</h5>
              <div className="explain-cross-ref-list">
                {(explanation.cross_references || []).map((c, i) => (
                  <span key={i} className="cross-ref-chip">{c}</span>
                ))}
              </div>
            </div>
          )}

          {(explanation.sources || []).length > 0 && (
            <div className="explain-sources">
              {(explanation.sources || []).map((s, i) => (
                <small key={i} className="source-tag">{s}</small>
              ))}
            </div>
          )}

          {explanation.limited && (
            <div className="explain-limited">
              <AlertTriangleIcon {...ico} /> {explanation.limited}
            </div>
          )}
        </div>
      )}
      {!explanation && !explanationLoading && !bibleText && (
        <p className="bs-hint">Open a chapter first, then tap <LightbulbIcon {...ico} /> on any verse.</p>
      )}
    </div>
  )
}