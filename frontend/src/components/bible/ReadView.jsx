import { BIBLE_BOOKS } from '../../constants'
import { AlertTriangleIcon, BookIcon, BooksIcon, ClockIcon, FileTextIcon, LightbulbIcon, ScaleIcon } from './icons.jsx'
import VersionSelector from '../VersionSelector.jsx'

const ico = { width: '1em', height: '1em', style: { verticalAlign: '-0.125em' } }

export default function ReadView({
  bibleBook, setBibleBook, bibleChapter, setBibleChapter,
  bibleVersion, setBibleVersion, bibleText, bibleLoading, bibleError,
  bibleTestament, setBibleTestament, recentReads, fetchChapter,
  goToBibleChapter, explainVerse, getCommentary, compareVersions,
}) {
  const currentBook = BIBLE_BOOKS.find(b => b.id === bibleBook)
  const chapterCount = currentBook ? currentBook.chapters : 1

  return (
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
            <button className="bn-nav-btn" onClick={() => setBibleChapter(p => Math.max(1, p - 1))} disabled={bibleChapter <= 1}>
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
              Prev
            </button>
            <span className="bn-nav-ref">{bibleBook} {bibleChapter}</span>
            <button className="bn-nav-btn" onClick={() => setBibleChapter(p => Math.min(chapterCount, p + 1))} disabled={bibleChapter >= chapterCount}>
              Next
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
            </button>
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
                  <button className="verse-explain-btn" onClick={() => explainVerse(`${bibleBook} ${bibleChapter}:${v.verse}`, v.text)}
                    title="Explain this verse"><LightbulbIcon width="1em" height="1em" /></button>
                </p>
              ))}
            </div>
            <div className="bible-text-actions">
              <button className="btn-sm" onClick={getCommentary}><BooksIcon {...ico} /> Get Commentary</button>
              <button className="btn-sm" onClick={compareVersions}><ScaleIcon {...ico} /> Compare Versions</button>
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
  )
}