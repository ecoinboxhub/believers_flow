import { BooksIcon } from './icons.jsx'

const ico = { width: '1em', height: '1em', style: { verticalAlign: '-0.125em' } }

export default function CommentaryView({
  bibleBook, bibleText, commentary, commentaryLoading,
  sources, sourceId, setSourceId, onGetCommentary,
}) {
  const loaded = commentary && commentary.available !== false

  return (
    <div className="card bs-panel">
      <div className="card-icon"><BooksIcon width="1em" height="1em" /></div>
      <h3>Bible Commentary</h3>
      <p>Read verse-by-verse commentary from classic public-domain scholars.</p>

      {sources.length > 0 && (
        <div className="commentary-source-row">
          <label className="cs-label">Commentary Source</label>
          <select className="cs-select" value={sourceId} onChange={e => setSourceId(e.target.value)}>
            {sources.map(s => (
              <option key={s.id} value={s.id}>{s.title}</option>
            ))}
          </select>
          {sources.find(s => s.id === sourceId) && (
            <p className="cs-meta">{sources.find(s => s.id === sourceId).author}</p>
          )}
        </div>
      )}

      {!commentary && !commentaryLoading && (
        <button className="btn-primary" onClick={() => {
          onGetCommentary(sourceId)
        }} disabled={!bibleText}>
          <BooksIcon {...ico} /> Load {bibleBook || 'This Chapter'} Commentary
        </button>
      )}

      {commentaryLoading && (
        <div className="skeleton-block">
          <div className="skeleton-line w-85" />
          <div className="skeleton-line w-60" />
          <div className="skeleton-line w-70" />
          <div className="skeleton-line w-55" />
          <div className="skeleton-line w-80" />
        </div>
      )}

      {commentary && commentary.available === false && (
        <div className="commentary-unavailable">
          <p>{commentary.note || `No commentary available for this chapter from this source.`}</p>
        </div>
      )}

      {loaded && !commentaryLoading && (
        <div className="commentary-content">
          <div className="commentary-content-head">
            <h4>{commentary.book} {commentary.chapter}</h4>
            {commentary.source && <span className="commentary-source-tag">{commentary.source.title}</span>}
          </div>

          {commentary.ai_summary && (
            <div className="commentary-summary">
              <strong>AI Summary</strong>
              <div className="commentary-summary-text">{commentary.ai_summary}</div>
            </div>
          )}

          {(commentary.entries || []).length > 0 && (
            <div className="commentary-verses">
              {(commentary.entries || []).map((e, i) => (
                <div key={i} className="commentary-verse-block">
                  <div className="commentary-verse-ref">{e.reference}</div>
                  {e.verse_text && <div className="commentary-verse-text">{e.verse_text}</div>}
                  <div className="commentary-body">{e.text}</div>
                  {(e.cross_references || []).length > 0 && (
                    <div className="commentary-cross-refs">
                      {(e.cross_references || []).map((x, j) => (
                        <span key={j} className="cross-ref-chip">{x}</span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {!commentary && !commentaryLoading && !bibleText && (
        <p className="bs-hint">Open a chapter first, then load commentary.</p>
      )}
    </div>
  )
}