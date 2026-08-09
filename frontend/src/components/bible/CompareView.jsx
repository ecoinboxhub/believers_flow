import { ScaleIcon } from './icons.jsx'

const ico = { width: '1em', height: '1em', style: { verticalAlign: '-0.125em' } }

export default function CompareView({
  bibleBook, bibleText, comparison, comparisonLoading,
  compareVersions,
}) {
  const hasTable = comparison && (comparison.verses || []).length > 0
  const translations = comparison && comparison.translations ? comparison.translations : []

  return (
    <div className="card bs-panel">
      <div className="card-icon"><ScaleIcon width="1em" height="1em" /></div>
      <h3>Bible Comparison Tool</h3>
      <p>Compare how different translations render the same passage.</p>

      {!comparison && !comparisonLoading && (
        <button className="btn-primary" onClick={() => {
          compareVersions()
        }} disabled={!bibleText}>
          <ScaleIcon {...ico} /> Compare {bibleBook || 'This Chapter'}
        </button>
      )}

      {comparisonLoading && (
        <div className="skeleton-block">
          <div className="skeleton-line w-70" />
          <div className="skeleton-line w-90" />
          <div className="skeleton-line w-50" />
          <div className="skeleton-line w-75" />
        </div>
      )}

      {hasTable && !comparisonLoading && (
        <div className="comparison-content">
          <h4>{comparison.reference || `${comparison.book} ${comparison.chapter}`}</h4>

          <div className="comparison-translations">
            {translations.map(t => (
              <span key={t.id} className="comparison-transl-tag">{t.name || t.id}</span>
            ))}
          </div>

          <div className="compare-table-wrap">
            <table className="compare-table">
              <thead>
                <tr>
                  <th className="compare-verse-col">V</th>
                  {translations.map(t => (
                    <th key={t.id}>{t.name || t.id}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(comparison.verses || []).map((row, i) => (
                  <tr key={i}>
                    <td className="compare-verse">{row.verse}</td>
                    {translations.map(t => (
                      <td key={t.id}>{row[t.id] || ''}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {comparison.ai_insight && (
            <div className="comparison-insight">
              <strong>AI Comparison</strong>
              <p>{comparison.ai_insight}</p>
            </div>
          )}
        </div>
      )}

      {!comparison && !comparisonLoading && !bibleText && (
        <p className="bs-hint">Open a chapter first, then compare translations.</p>
      )}
    </div>
  )
}