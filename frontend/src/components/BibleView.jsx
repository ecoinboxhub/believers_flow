import { BookIcon, BooksIcon, EditIcon, LightbulbIcon, ScaleIcon, SearchIcon, TypeIcon } from './bible/icons.jsx'
import ReadView from './bible/ReadView.jsx'
import ExplainView from './bible/ExplainView.jsx'
import CommentaryView from './bible/CommentaryView.jsx'
import ConcordanceView from './bible/ConcordanceView.jsx'
import CompareView from './bible/CompareView.jsx'
import InterlinearView from './bible/InterlinearView.jsx'
import NotesView from './NotesView.jsx'

const ico = { width: '1em', height: '1em', style: { verticalAlign: '-0.125em' } }

export default function BibleView(props) {
  const {
    bibleBook, setBibleBook, bibleChapter, setBibleChapter,
    bibleVersion, setBibleVersion, bibleText, bibleLoading, bibleError,
    bibleTestament, setBibleTestament, bibleStudyTab, setBibleStudyTab,
    recentReads, fetchChapter, goToBibleChapter,
    explanation, explanationLoading, explainVerse,
    commentary, commentaryLoading, commentarySources, commentarySourceId, setCommentarySourceId, getCommentary,
    concordanceQuery, setConcordanceQuery, concordanceResults, concordanceLoading, concordanceError,
    searchConcordance, dictionaryTerm, setDictionaryTerm, dictionaryMatches, dictionaryLoading, searchDictionary,
    comparison, comparisonLoading, compareVersions,
    isPremium, setShowAuth,
    interlinear, interlinearLoading, getInterlinear,
    notesAssist, showToast,
  } = props

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
        <ReadView
          bibleBook={bibleBook} setBibleBook={setBibleBook}
          bibleChapter={bibleChapter} setBibleChapter={setBibleChapter}
          bibleVersion={bibleVersion} setBibleVersion={setBibleVersion}
          bibleText={bibleText} bibleLoading={bibleLoading} bibleError={bibleError}
          bibleTestament={bibleTestament} setBibleTestament={setBibleTestament}
          recentReads={recentReads} fetchChapter={fetchChapter}
          goToBibleChapter={goToBibleChapter}
          explainVerse={explainVerse} getCommentary={() => getCommentary(commentarySourceId)} compareVersions={compareVersions}
        />
      )}

      {bibleStudyTab === 'explain' && (
        <ExplainView
          bibleBook={bibleBook} bibleChapter={bibleChapter} bibleText={bibleText}
          explanation={explanation} explanationLoading={explanationLoading}
          explainVerse={explainVerse} isPremium={isPremium} setShowAuth={setShowAuth}
        />
      )}

      {bibleStudyTab === 'commentary' && (
        <CommentaryView
          bibleBook={bibleBook} bibleChapter={bibleChapter} bibleText={bibleText}
          commentary={commentary} commentaryLoading={commentaryLoading}
          sources={commentarySources} sourceId={commentarySourceId} setSourceId={setCommentarySourceId}
          onGetCommentary={getCommentary} isPremium={isPremium} setShowAuth={setShowAuth}
        />
      )}

      {bibleStudyTab === 'concordance' && (
        <ConcordanceView
          concordanceQuery={concordanceQuery} setConcordanceQuery={setConcordanceQuery}
          concordanceResults={concordanceResults} concordanceLoading={concordanceLoading}
          concordanceError={concordanceError} searchConcordance={searchConcordance}
          dictionaryTerm={dictionaryTerm} setDictionaryTerm={setDictionaryTerm}
          dictionaryMatches={dictionaryMatches} dictionaryLoading={dictionaryLoading}
          searchDictionary={searchDictionary}
        />
      )}

      {bibleStudyTab === 'compare' && (
        <CompareView
          bibleBook={bibleBook} bibleChapter={bibleChapter} bibleText={bibleText}
          comparison={comparison} comparisonLoading={comparisonLoading}
          compareVersions={compareVersions} isPremium={isPremium} setShowAuth={setShowAuth}
        />
      )}

      {bibleStudyTab === 'interlinear' && (
        <InterlinearView
          bibleBook={bibleBook} bibleChapter={bibleChapter} bibleText={bibleText}
          interlinear={interlinear} interlinearLoading={interlinearLoading}
          getInterlinear={getInterlinear} isPremium={isPremium} setShowAuth={setShowAuth}
        />
      )}

      {bibleStudyTab === 'notes' && (
        <NotesView
          bibleBook={bibleBook}
          bibleChapter={bibleChapter}
          bibleVersion={bibleVersion}
          isPremium={isPremium}
          setShowAuth={setShowAuth}
          showToast={showToast}
          notesAssist={notesAssist}
        />
      )}
    </section>
  )
}