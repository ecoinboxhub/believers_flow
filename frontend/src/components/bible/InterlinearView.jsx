import { GreekFlagIcon, HebrewFlagIcon, TypeIcon } from './icons.jsx'

const ico = { width: '1em', height: '1em', style: { verticalAlign: '-0.125em' } }

export default function InterlinearView({
  bibleBook, bibleChapter, bibleText, interlinear, interlinearLoading,
  getInterlinear, isPremium, setShowAuth,
}) {
  return (
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
  )
}