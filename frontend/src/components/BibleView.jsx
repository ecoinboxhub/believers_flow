import { BIBLE_BOOKS } from '../constants'
import NotesView from './NotesView.jsx'
import VersionSelector from './VersionSelector.jsx'

const svgBase = { viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: '1.8', strokeLinecap: 'round', strokeLinejoin: 'round' }

const BookIcon = (props) => <svg {...svgBase} {...props}><path d="M4 19.5A2.5 2.5 0 016.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z"/></svg>

const LightbulbIcon = (props) => <svg {...svgBase} {...props}><path d="M12 2a7 7 0 00-4 12.7V17h8v-2.3A7 7 0 0012 2z"/><path d="M9 21h6"/></svg>

const BooksIcon = (props) => <svg {...svgBase} {...props}><path d="M2 3h6a4 4 0 014 4v14a3 3 0 00-3-3H2z"/><path d="M22 3h-6a4 4 0 00-4 4v14a3 3 0 013-3h7z"/></svg>

const SearchIcon = (props) => <svg {...svgBase} {...props}><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>

const ScaleIcon = (props) => <svg {...svgBase} {...props}><path d="M12 3v18"/><path d="M5 7l7-4 7 4"/><path d="M5 7l4 7H3"/><path d="M19 7l-4 7h6"/></svg>

const TypeIcon = (props) => <svg {...svgBase} {...props}><polyline points="4 7 4 4 20 4 20 7"/><line x1="9" y1="20" x2="15" y2="20"/><line x1="12" y1="4" x2="12" y2="20"/></svg>

const EditIcon = (props) => <svg {...svgBase} {...props}><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>

const AlertTriangleIcon = (props) => <svg {...svgBase} {...props}><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>

const ClockIcon = (props) => <svg {...svgBase} {...props}><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>

const FileTextIcon = (props) => <svg {...svgBase} {...props}><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>

const HebrewFlagIcon = (props) => <svg {...svgBase} {...props}><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" y1="7.5" x2="21" y2="7.5"/><line x1="3" y1="16.5" x2="21" y2="16.5"/></svg>

const GreekFlagIcon = (props) => <svg {...svgBase} {...props}><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="3" y1="15" x2="21" y2="15"/><line x1="12" y1="3" x2="12" y2="15"/></svg>

const ico = { width: '1em', height: '1em', style: { verticalAlign: '-0.125em' } }

export default function BibleView({
  bibleBook, setBibleBook, bibleChapter, setBibleChapter, bibleVersion, setBibleVersion,
  bibleText, bibleLoading, bibleError, bibleTestament, setBibleTestament,
  bibleStudyTab, setBibleStudyTab, recentReads, fetchChapter, goToBibleChapter,
  explanation, explanationLoading, commentary, commentaryLoading,
  concordanceQuery, setConcordanceQuery, concordanceResults, concordanceLoading,
  comparison, comparisonLoading, explainVerse, getCommentary, searchConcordance, compareVersions,
  isPremium, setShowAuth,
  interlinear, interlinearLoading, getInterlinear,
  showToast,
}) {
  const currentBook = BIBLE_BOOKS.find(b => b.id === bibleBook)
  const chapterCount = currentBook ? currentBook.chapters : 1

  return (
    <section className="view fade-in">
      <div className="bible-study-tabs">
        {[
          { id: 'read', label: <><BookIcon {...ico} /> Read</> },
          { id: 'explain', label: <><LightbulbIcon {...ico} /> Explain</> },
          { id: 'commentary', label: <><BooksIcon {...ico} /> Commentary</> },
          { id: 'concordance', label: <><SearchIcon {...ico} /> Concordance</> },
          { id: 'compare', label: <><ScaleIcon {...ico} /> Compare</> },
          { id: 'interlinear', label: <><TypeIcon {...ico} /> Interlinear</> },
          { id: 'notes', label: <><EditIcon {...ico} /> Notes</> },
        ].map(t => (
          <button key={t.id} className={`bs-tab${bibleStudyTab === t.id ? ' active' : ''}`}
            onClick={() => setBibleStudyTab(t.id)}>{t.label}</button>
        ))}
      </div>

      {bibleStudyTab === 'read' && (
        <>
          <div className="bible-version-bar">
            <VersionSelector currentVersion={bibleVersion} onSelect={setBibleVersion} />
          </div>

          <div className="card">
            <div className="card-icon"><BookIcon width="1em" height="1em" /></div>
            <h3>Holy Bible Reader</h3>
            <p>Read all 66 books of the Bible. Chapters cached for offline reading.</p>

            <div className="bible-nav">
              <div className="bn-testaments">
                <button className={`bn-test-btn${bibleTestament === 'OT' ? ' active' : ''}`} onClick={() => setBibleTestament('OT')}>Old Testament</button>
                <button className={`bn-test-btn${bibleTestament === 'NT' ? ' active' : ''}`} onClick={() => setBibleTestament('NT')}>New Testament</button>
              </div>
              <div className="bn-book-row">
                <div className="bn-book-select">
                  <select value={bibleBook} onChange={e => setBibleBook(e.target.value)}>
                    {BIBLE_BOOKS.filter(b => b.testament === bibleTestament).map(b => (
                      <option key={b.id} value={b.id}>{b.id} ({b.chapters} ch)</option>
                    ))}
                  </select>
                </div>
                <div className="bn-chapter-select">
                  <select value={bibleChapter} onChange={e => setBibleChapter(Number(e.target.value))}>
                    {Array.from({ length: chapterCount }, (_, i) => (
                      <option key={i + 1} value={i + 1}>Chapter {i + 1}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="bn-chapter-nav">
                <button className="bn-nav-btn" onClick={() => setBibleChapter(p => Math.max(1, p - 1))} disabled={bibleChapter <= 1}>&#9664; Prev</button>
                <span className="bn-nav-ref">{bibleBook} {bibleChapter}</span>
                <button className="bn-nav-btn" onClick={() => setBibleChapter(p => Math.min(chapterCount, p + 1))} disabled={bibleChapter >= chapterCount}>Next &#9654;</button>
              </div>
            </div>
          </div>

          <div className="bible-content-card">
            {bibleLoading && (
              <div className="bible-loading">
                <span className="bible-loading-icon"><BookIcon width="1em" height="1em" /></span>
                <p>Loading {bibleBook} {bibleChapter}...</p>
                <div className="bible-loading-bar"><div className="bible-loading-fill" /></div>
              </div>
            )}
            {bibleError && (
              <div className="bible-error">
                <span className="bible-error-icon"><AlertTriangleIcon width="1em" height="1em" /></span>
                <p>{bibleError}</p>
                <button className="bn-nav-btn" onClick={() => fetchChapter(bibleBook, bibleChapter, bibleVersion)}>Retry</button>
              </div>
            )}
            {bibleText && !bibleLoading && (
              <div className="bible-text-container">
                <div className="bible-text-header">
                  <h2 className="bible-text-ref">{bibleText.reference || `${bibleBook} ${bibleChapter}`}</h2>
                  <span className="bv-badge">{bibleVersion}</span>
                </div>
                <div className="bible-verses">
                  {(bibleText.verses || []).map((v, i) => (
                    <p key={i} className="bible-verse">
                      <sup className="bible-verse-num">{v.verse}</sup>
                      <span className="bible-verse-text">{v.text}</span>
                      {bibleText.verses.length <= 30 && (
                        <button className="verse-explain-btn" onClick={() => {
                          if (!isPremium) { setShowAuth(true); return }
                          explainVerse(`${bibleBook} ${bibleChapter}:${v.verse}`, v.text)
                        }} title="Explain this verse"><LightbulbIcon width="1em" height="1em" /></button>
                      )}
                    </p>
                  ))}
                </div>
                <div className="bible-text-actions">
                  <button className="btn-sm" onClick={() => {
                    if (!isPremium) { setShowAuth(true); return }
                    getCommentary()
                  }}><BooksIcon {...ico} /> Get Commentary</button>
                  <button className="btn-sm" onClick={() => {
                    if (!isPremium) { setShowAuth(true); return }
                    compareVersions()
                  }}><ScaleIcon {...ico} /> Compare Versions</button>
                </div>
              </div>
            )}
            {!bibleText && !bibleLoading && !bibleError && (
              <div className="bible-empty">
                <span className="bible-empty-icon"><BookIcon width="1em" height="1em" /></span>
                <p>Select a book and chapter above to start reading.</p>
              </div>
            )}
          </div>

          {recentReads.length > 0 && (
            <div className="card">
              <h3><ClockIcon {...ico} /> Recent Reads</h3>
              <div className="recent-reads">
                {recentReads.slice(0, 5).map((r, i) => (
                  <button key={i} className="recent-read-btn" onClick={() => goToBibleChapter(r.book, r.chapter)}>
                    <FileTextIcon {...ico} /> {r.book} {r.chapter}
                  </button>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {bibleStudyTab === 'explain' && (
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
            </div>
          )}
          {!explanation && !explanationLoading && !bibleText && (
            <p className="bs-hint">Open a chapter first, then tap <LightbulbIcon {...ico} /> on any verse.</p>
          )}
        </div>
      )}

      {bibleStudyTab === 'commentary' && (
        <div className="card bs-panel">
          <div className="card-icon"><BooksIcon width="1em" height="1em" /></div>
          <h3>AI Bible Commentary</h3>
          <p>Get verse-by-verse commentary and theological insights.</p>
          {bibleText && !commentary && !commentaryLoading && (
            <button className="btn-primary" onClick={() => {
              if (!isPremium) { setShowAuth(true); return }
              getCommentary()
            }}><BooksIcon {...ico} /> Generate Commentary</button>
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
          {commentary && !commentaryLoading && (
            <div className="commentary-content">
              <h4>{commentary.book} {commentary.chapter}</h4>
              <div className="commentary-text">{commentary.commentary}</div>
            </div>
          )}
          {!bibleText && !commentary && (
            <p className="bs-hint">Open a chapter first, then generate commentary.</p>
          )}
        </div>
      )}

      {bibleStudyTab === 'concordance' && (
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
          {concordanceResults && !concordanceLoading && (
            <div className="concordance-results">
              <h4>Results for: &quot;{concordanceResults.query}&quot;</h4>
              <div className="concordance-text">{concordanceResults.results}</div>
            </div>
          )}
        </div>
      )}

      {bibleStudyTab === 'compare' && (
        <div className="card bs-panel">
          <div className="card-icon"><ScaleIcon width="1em" height="1em" /></div>
          <h3>Bible Comparison Tool</h3>
          <p>Compare how different translations render the same passage.</p>
          {bibleText && !comparison && !comparisonLoading && (
            <button className="btn-primary" onClick={() => {
              if (!isPremium) { setShowAuth(true); return }
              compareVersions()
            }}><ScaleIcon {...ico} /> Compare {bibleBook} {bibleChapter}</button>
          )}
          {comparisonLoading && (
            <div className="skeleton-block">
              <div className="skeleton-line w-70" />
              <div className="skeleton-line w-90" />
              <div className="skeleton-line w-50" />
              <div className="skeleton-line w-75" />
            </div>
          )}
          {comparison && !comparisonLoading && (
            <div className="comparison-content">
              <h4>{comparison.book} {comparison.chapter}</h4>
              <div className="comparison-text">{comparison.comparison}</div>
            </div>
          )}
          {!bibleText && !comparison && (
            <p className="bs-hint">Open a chapter first, then compare translations.</p>
          )}
        </div>
      )}

      {bibleStudyTab === 'interlinear' && (
        <div className="card bs-panel">
          <div className="card-icon"><TypeIcon width="1em" height="1em" /></div>
          <h3>Hebrew/Greek Interlinear Bible</h3>
          <p>Word-by-word original language analysis with Strong's numbers.</p>

          {bibleText && !interlinear && !interlinearLoading && (
            <button className="btn-primary" onClick={() => {
              if (!isPremium) { setShowAuth(true); return }
              getInterlinear()
            }}>
              <TypeIcon {...ico} /> View Interlinear for {bibleBook} {bibleChapter}
            </button>
          )}

          {interlinearLoading && (
            <div className="interlinear-loading">
              <span>Analyzing original language...</span>
            </div>
          )}

          {interlinear && !interlinearLoading && (
            <div className="interlinear-content">
              <div className="interlinear-header">
                <h4>{interlinear.reference}</h4>
                <span className="interlinear-lang-badge">
                  {interlinear.language === 'hebrew' ? <><HebrewFlagIcon {...ico} /> Hebrew (OT)</> : <><GreekFlagIcon {...ico} /> Greek (NT)</>}
                </span>
              </div>
              {(interlinear.verses || []).map((v, i) => (
                <div key={i} className="interlinear-verse-block">
                  <div className="interlinear-verse-num">Verse {v.verse}</div>
                  <div className="interlinear-words">
                    {(v.words || []).map((w, j) => (
                      <div key={j} className="interlinear-word" title={w.meaning}>
                        <span className="interlinear-word-original">{w.word}</span>
                        <span className="interlinear-word-translit">{w.transliteration}</span>
                        {w.strong && <span className="interlinear-word-strong">{w.strong}</span>}
                      </div>
                    ))}
                  </div>
                  <div className="interlinear-english">{v.text}</div>
                </div>
              ))}
            </div>
          )}

          {!bibleText && !interlinear && (
            <p className="bs-hint">Open a chapter first, then view interlinear analysis.</p>
          )}
        </div>
      )}

      {bibleStudyTab === 'notes' && (
        <NotesView
          bibleBook={bibleBook}
          bibleChapter={bibleChapter}
          bibleVersion={bibleVersion}
          isPremium={isPremium}
          setShowAuth={setShowAuth}
          showToast={showToast}
        />
      )}
    </section>
  )
}
