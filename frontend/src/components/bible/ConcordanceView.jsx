import { SearchIcon } from './icons.jsx'

export default function ConcordanceView({
  concordanceQuery, setConcordanceQuery, concordanceResults, concordanceLoading, concordanceError,
  searchConcordance, dictionaryTerm, setDictionaryTerm, dictionaryMatches, dictionaryLoading,
  searchDictionary,
}) {
  return (
    <div className="card bs-panel">
      <div className="card-icon"><SearchIcon width="1em" height="1em" /></div>
      <h3>Bible Concordance</h3>
      <p>Search for any word or topic across Scripture.</p>

      <div className="concordance-input-row">
        <input type="text" placeholder="Search word or topic (e.g., faith, love, prayer)" value={concordanceQuery}
          onChange={e => setConcordanceQuery(e.target.value)} onKeyDown={e => e.key === 'Enter' && searchConcordance()} />
        <button onClick={searchConcordance} disabled={concordanceLoading || !concordanceQuery.trim()}>Search</button>
      </div>

      {concordanceLoading && (
        <div className="skeleton-block">
          <div className="skeleton-line w-60" />
          <div className="skeleton-line w-80" />
          <div className="skeleton-line w-45" />
          <div className="skeleton-line w-70" />
        </div>
      )}

      {concordanceError && (
        <div className="concordance-error">{concordanceError}</div>
      )}

      {concordanceResults && !concordanceLoading && (
        <div className="concordance-results">
          <div className="concordance-results-head">
            <h4>Results for &quot;{concordanceResults.query}&quot;</h4>
            <span className="concordance-count">{concordanceResults.total} matches</span>
          </div>

          {concordanceResults.term_guide && (
            <div className="concordance-term-guide">
              <h5>{concordanceResults.term_guide.term}</h5>
              <p>{concordanceResults.term_guide.definition}</p>
              {(concordanceResults.term_guide.scripture_references || []).length > 0 && (
                <div className="concordance-refs">
                  {(concordanceResults.term_guide.scripture_references || []).map((r, i) => (
                    <span key={i} className="cross-ref-chip">{r}</span>
                  ))}
                </div>
              )}
              <small className="explain-term-source">{concordanceResults.term_guide.source}</small>
            </div>
          )}

          {(concordanceResults.groups || []).length > 0 && (
            <div className="concordance-groups">
              {(concordanceResults.groups || []).map(g => (
                <div key={g.book} className="concordance-group">
                  <div className="concordance-group-head">
                    <strong>{g.book}</strong>
                    <span className="concordance-group-count">{g.count}</span>
                  </div>
                  <p className="concordance-group-first">{g.first}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <hr className="concordance-divider" />

      <div className="dictionary-panel">
        <h4>Bible Dictionary</h4>
        <p>Look up terms from Easton's Bible Dictionary (public domain).</p>
        <div className="concordance-input-row">
          <input type="text" placeholder="Dictionary term (e.g., mercy, tabernacle)" value={dictionaryTerm}
            onChange={e => setDictionaryTerm(e.target.value)} onKeyDown={e => e.key === 'Enter' && searchDictionary()} />
          <button onClick={searchDictionary} disabled={dictionaryLoading || !dictionaryTerm.trim()}>Look Up</button>
        </div>
        {dictionaryLoading && (
          <div className="skeleton-block">
            <div className="skeleton-line w-70" />
            <div className="skeleton-line w-90" />
          </div>
        )}
        {dictionaryMatches && !dictionaryLoading && (
          <div className="dictionary-results">
            {dictionaryMatches.matches && dictionaryMatches.matches.length > 0 ? (
              dictionaryMatches.matches.map((m, i) => (
                <div key={i} className="dictionary-entry">
                  <h5>{m.term}</h5>
                  <p className="dictionary-definition">{m.definition}</p>
                  {(m.scripture_references || []).length > 0 && (
                    <div className="concordance-refs">
                      {(m.scripture_references || []).map((r, j) => (
                        <span key={j} className="cross-ref-chip">{r}</span>
                      ))}
                    </div>
                  )}
                </div>
              ))
            ) : (
              <p className="bs-hint">{dictionaryMatches.note || 'No dictionary entry found.'}</p>
            )}
          </div>
        )}
      </div>
    </div>
  )
}