import { useState, useEffect, useMemo } from 'react'
import { CHURCH_METADATA, CHURCH_NAMES, getChurchData } from '../churchDevotionals/index'
import { getDayOfYear, formatDateFull } from '../dateUtils'

const API_URL = import.meta.env.VITE_API_URL || ''

let devotionalsCache = null
async function getDevotionals() {
  if (devotionalsCache) return devotionalsCache
  const mod = await import('../devotional')
  devotionalsCache = mod.DEVOTIONALS
  return devotionalsCache
}

function daysInYear(year) {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0 ? 366 : 365
}

const svgIcon = { viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: '1.8', strokeLinecap: 'round', strokeLinejoin: 'round' }

const BookIcon = () => (
  <svg {...svgIcon} width="16" height="16"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5z"/><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/></svg>
)
const HeartIcon = () => (
  <svg {...svgIcon} width="16" height="16"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
)
const CalendarIcon = () => (
  <svg {...svgIcon} width="16" height="16"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
)
const ScrollIcon = () => (
  <svg {...svgIcon} width="16" height="16"><path d="M8 21h12a2 2 0 0 0 2-2v-2H10v2a2 2 0 1 1-4 0V5a2 2 0 1 0-4 0v3h4"/><path d="M19 17V5a2 2 0 0 0-2-2H4"/></svg>
)
const ChatIcon = () => (
  <svg {...svgIcon} width="16" height="16"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/><line x1="8" y1="9" x2="16" y2="9"/><line x1="8" y1="13" x2="13" y2="13"/></svg>
)
const SparkIcon = () => (
  <svg {...svgIcon} width="16" height="16"><path d="M12 3v4"/><path d="M12 17v4"/><path d="M5 12H1"/><path d="M23 12h-4"/><path d="M18 6l-2.5 2.5"/><path d="M6 18l-2.5 2.5"/><path d="M18 18l-2.5-2.5"/><path d="M6 6l2.5 2.5"/></svg>
)

function renderParagraphs(text) {
  if (!text) return null
  const paragraphs = String(text).split('\n\n').filter(p => p.trim().length > 0)
  return paragraphs.map((p, i) => <p key={i} className="devotional-paragraph">{p.trim()}</p>)
}

function cutDate(dayNumber) {
  if (!dayNumber) return null
  const year = new Date().getFullYear()
  const clamped = Math.min(dayNumber, daysInYear(year))
  return new Date(year, 0, clamped)
}

function SectionLabel({ label, className, icon }) {
  return (
    <div className={`devotional-section-label ${className || ''}`}>
      <span className="devotional-section-label-icon">{icon || <ScrollIcon />}</span>
      <span>{label}</span>
    </div>
  )
}

function DevotionalStructure({ devotion, verse, sections, prayer, fontSize }) {
  const f = {
    small: { verse: '0.9rem', text: '0.84rem' },
    medium: { verse: '1rem', text: '0.92rem' },
    large: { verse: '1.12rem', text: '1.04rem' },
  }[fontSize] || { verse: '1rem', text: '0.92rem' }

  if (!devotion) return null

  const showPrayer = prayer && !(sections && sections.some(s => s.type === 'prayer'))

  return (
    <div className="devotional-reader">
      {verse && verse.text && (
        <blockquote className="devotional-verse-block" style={{ fontSize: f.verse }}>
          <p className="devotional-verse-text">&ldquo;{verse.text}&rdquo;</p>
          {verse.ref && <footer className="devotional-verse-ref">&mdash; {verse.ref}</footer>}
        </blockquote>
      )}

      {sections && sections.length > 0 ? (
        sections.map((section, i) => {
          if (section.type === 'prayer') return null
          const labels = {
            memory: { label: 'Memory Verse', icon: <HeartIcon />, cls: 'memory' },
            scripture: { label: 'Scripture', icon: <ScrollIcon />, cls: 'scripture' },
            message: { label: 'The Message', icon: <ChatIcon />, cls: 'message' },
          }
          const meta = labels[section.type] || { label: 'The Message', icon: <ChatIcon />, cls: 'message' }
          return (
            <section key={i} className="devotional-section">
              <SectionLabel label={meta.label} className={meta.cls} icon={meta.icon} />
              <div className="devotional-section-content" style={{ fontSize: f.text }}>
                {renderParagraphs(section.content)}
              </div>
            </section>
          )
        })
      ) : (
        devotion.text && (
          <div className="devotional-text" style={{ fontSize: f.text }}>
            {renderParagraphs(devotion.text)}
          </div>
        )
      )}

      {showPrayer && (
        <section className="devotional-section">
          <SectionLabel label="Prayer" className="prayer" icon={<HeartIcon />} />
          <p className="devotional-prayer-text" style={{ fontSize: f.text }}>{prayer}</p>
        </section>
      )}
    </div>
  )
}

async function fetchStudy(devotion) {
  const resp = await fetch(`${API_URL}/api/devotional/study`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ devotion, question: undefined }),
    signal: AbortSignal.timeout(60000),
  })
  if (!resp.ok) throw new Error(`HTTP ${resp.status}`)
  return resp.json()
}

async function fetchAnswer(devotion, question) {
  const resp = await fetch(`${API_URL}/api/devotional/study`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ devotion, question }),
    signal: AbortSignal.timeout(60000),
  })
  if (!resp.ok) throw new Error(`HTTP ${resp.status}`)
  return resp.json()
}

function DevotionalStudy({ devotion }) {
  const [open, setOpen] = useState(false)
  const [context, setContext] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [asked, setAsked] = useState([])
  const [question, setQuestion] = useState('')
  const [asking, setAsking] = useState(false)

  const loadContext = async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await fetchStudy(devotion)
      setContext(data.context || null)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  const toggle = () => {
    const next = !open
    setOpen(next)
    if (next && !context && !loading) loadContext()
  }

  const ask = async () => {
    const q = question.trim()
    if (!q || asking) return
    setAsking(true)
    const entryId = `q-${Date.now()}`
    setAsked(prev => [...prev, { id: entryId, question: q, answer: '', loading: true, error: null }])
    setQuestion('')
    try {
      const data = await fetchAnswer(devotion, q)
      setAsked(prev => prev.map(e => e.id === entryId
        ? { ...e, answer: data.answer, ai: data.ai, note: data.note, references: data.references || [], loading: false }
        : e))
    } catch (e) {
      setAsked(prev => prev.map(el => el.id === entryId ? { ...el, loading: false, error: e.message } : el))
    } finally {
      setAsking(false)
    }
  }

  if (!devotion) return null

  return (
    <div className="devotional-study">
      <button className="devotional-study-toggle" onClick={toggle} aria-expanded={open}>
        <span className="devotional-study-toggle-icon"><SparkIcon /></span>
        Study this devotional
        <span className={`devotional-study-chevron${open ? ' open' : ''}`}><svg {...svgIcon} width="14" height="14"><polyline points="6 9 12 15 18 9"/></svg></span>
      </button>

      {open && (
        <div className="devotional-study-panel">
          {loading && (
            <div className="devotional-loading">
              <span className="devotional-loading-dot" />
              <span>Gathering scripture and commentary...</span>
            </div>
          )}
          {error && <p className="devotional-study-error">Could not load study notes. {error}</p>}

          {!loading && !error && context && (
            <div className="devotional-study-body">
              {context.passage && (
                <section className="devotional-study-section">
                  <SectionLabel label="Scripture Passage" className="scripture" icon={<ScrollIcon />} />
                  <div className="devotional-study-content">{renderParagraphs(context.passage)}</div>
                </section>
              )}

              {context.commentary && context.commentary.length > 0 && (
                <section className="devotional-study-section">
                  <SectionLabel label="Meaning and Context" className="message" icon={<BookIcon />} />
                  <div className="devotional-study-content">
                    {context.commentary.slice(0, 2).map((c, i) => (
                      <div className="devotional-commentary-note" key={i}>
                        <span className="devotional-commentary-ref">{c.reference}</span>
                        {renderParagraphs(c.text)}
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {context.related_passages && context.related_passages.length > 0 && (
                <section className="devotional-study-section">
                  <SectionLabel label="Key Scriptures" className="scripture" icon={<BookIcon />} />
                  <ul className="devotional-related-list">
                    {context.related_passages.map((p) => (
                      <li key={p.reference}>
                        <span className="devotional-related-ref">{p.reference}</span>
                        <span className="devotional-related-text">{p.text}</span>
                      </li>
                    ))}
                  </ul>
                </section>
              )}

              {context.key_terms && context.key_terms.length > 0 && (
                <section className="devotional-study-section">
                  <SectionLabel label="Key Terms" className="memory" icon={<ChatIcon />} />
                  <div className="devotional-study-content">
                    {context.key_terms.map((t) => (
                      <div className="devotional-term" key={t.term}>
                        <span className="devotional-term-name">{t.term}</span>
                        <span className="devotional-term-def">{t.definition}</span>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              <p className="devotional-study-sources">
                Grounded in {context.sources ? context.sources.join(', ') : 'public-domain scripture and commentary'}.
              </p>
            </div>
          )}

          <div className="devotional-study-qa">
            <SectionLabel label="Ask about this devotional" className="message" icon={<ChatIcon />} />
            <div className="devotional-qa-form">
              <input
                className="devotional-qa-input"
                type="text"
                placeholder="e.g. What does this passage teach about God?"
                value={question}
                onChange={e => setQuestion(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') ask() }}
                maxLength={2000}
                aria-label="Ask a question about this devotional"
              />
              <button className="devotional-qa-btn" onClick={ask} disabled={asking || !question.trim()}>
                {asking ? 'Thinking...' : 'Ask'}
              </button>
            </div>

            {asked.filter(e => e.answer || e.error).map(e => (
              <div className="devotional-qa-result" key={e.id}>
                <p className="devotional-qa-question">{e.question}</p>
                {e.loading && <div className="devotional-loading"><span className="devotional-loading-dot" /><span>Searching the Word...</span></div>}
                {e.error && <p className="devotional-study-error">{e.error}</p>}
                {!e.loading && !e.error && e.answer && (
                  <div className="devotional-qa-answer">
                    {e.ai && <span className="devotional-ai-badge">AI study note</span>}
                    {!e.ai && e.note && <span className="devotional-grounded-badge">Study note</span>}
                    {renderParagraphs(e.answer)}
                    {e.references && e.references.length > 0 && (
                      <ul className="devotional-answer-refs">
                        {e.references.map((r) => (
                          <li key={r.reference}>
                            <span className="devotional-related-ref">{r.reference}</span>
                            <span className="devotional-related-text">{r.text}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                    {e.note && <p className="devotional-study-note">{e.note}</p>}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function DevotionalContent({ devo, liveData, liveLoading, liveError, isLiveCapable, fontSize, setFontSize, churchName, churchColor }) {
  const showFallback = isLiveCapable && (liveError || (liveData && liveData.error))
  const hasLive = Boolean(liveData && !liveData.error)

  const verseText = hasLive
    ? (liveData.verseText || liveData.verse_text || (liveData.verse && liveData.verse.text) || '')
    : (devo.verse_text || devo.verseText || '')
  const verseRef = hasLive ? (liveData.verse || liveData.verseRef || '') : (devo.verse || '')
  const sections = hasLive && liveData.sections ? liveData.sections : null
  const prayer = hasLive ? (liveData.prayer || '') : (devo.prayer || '')

  const dayNumber = devo && devo.day ? devo.day : null
  const dateLabel = useMemo(() => (dayNumber ? formatDateFull(cutDate(dayNumber)) : ''), [dayNumber])

  if (!devo) return null

  return (
    <div className="devotional-content-card">
      <div className="devotional-header">
        <div className="devotional-meta">
          {dayNumber && <span className="devotional-day-badge"><CalendarIcon /> Day {dayNumber} of 365</span>}
          {dateLabel && <span className="devotional-date-label">{dateLabel}</span>}
        </div>
        <div className="devotional-font-controls">
          <button className={`dev-font-btn${fontSize === 'small' ? ' active' : ''}`} onClick={() => setFontSize('small')}>S</button>
          <button className={`dev-font-btn${fontSize === 'medium' ? ' active' : ''}`} onClick={() => setFontSize('medium')}>M</button>
          <button className={`dev-font-btn${fontSize === 'large' ? ' active' : ''}`} onClick={() => setFontSize('large')}>L</button>
        </div>
      </div>

      {liveLoading && (
        <div className="devotional-live-section">
          <div className="devotional-loading">
            <span className="devotional-loading-dot" />
            <span>Syncing with source...</span>
          </div>
        </div>
      )}

      {showFallback && (
        <div className="devotional-sync-badge offline"><span><BookIcon /> Using offline copy</span></div>
      )}
      {!isLiveCapable && (
        <div className="devotional-sync-badge offline"><span><BookIcon /> Offline devotional</span></div>
      )}

      {hasLive && (
        <div className="devotional-sync-badge" style={{ borderLeftColor: churchColor }}>
          <span><BookIcon /> Synced from {churchName}</span>
        </div>
      )}

      {(hasLive ? liveData.title : devo.title) && <h2 className="devotional-title">{hasLive ? liveData.title : devo.title}</h2>}

      <DevotionalStructure
        devotion={hasLive ? liveData : devo}
        verse={{ text: verseText, ref: verseRef }}
        sections={sections}
        prayer={prayer}
        fontSize={fontSize}
      />

      <DevotionalStudy devotion={hasLive ? liveData : devo} />
    </div>
  )
}

function ChurchGrid({ onSelect }) {
  return (
    <div className="card church-devotional-select">
      <div className="card-icon"><BookIcon /></div>
      <h3>Church Devotionals</h3>
      <p>Explore devotionals from various churches and ministries.</p>
      <div className="church-grid">
        {CHURCH_NAMES.map(church => {
          const meta = CHURCH_METADATA[church] || {}
          return (
            <button key={church} className={`church-card${meta.available === false ? ' unavailable' : ''}`} onClick={() => onSelect(church)}
              style={{ borderColor: meta.color }}>
              <span className="church-name">{meta.name}</span>
              <span className="church-pastor">{meta.pastor}</span>
              {meta.available === false && <span className="church-unavailable-tag">Content not available</span>}
            </button>
          )
        })}
      </div>
    </div>
  )
}

export default function DevotionalView({
  devotionalDay,
  devotionalFontSize, setDevotionalFontSize,
  selectedChurch, setSelectedChurch, churchDevotionalDay, setChurchDevotionalDay,
  nextDevotional, prevDevotional, goToTodaysDevotional,
}) {
  const [devotionals, setDevotionals] = useState(null)
  const [devotionalsLoading, setDevotionalsLoading] = useState(true)
  const [churchData, setChurchData] = useState(null)
  const [liveDevotional, setLiveDevotional] = useState(null)
  const [liveLoading, setLiveLoading] = useState(false)
  const [liveError, setLiveError] = useState(null)

  useEffect(() => {
    getDevotionals().then(d => { setDevotionals(d); setDevotionalsLoading(false) })
  }, [])

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      await Promise.resolve()
      if (cancelled) return
      if (!selectedChurch) { setChurchData(null); return }
      const data = await getChurchData(selectedChurch)
      if (!cancelled) setChurchData(data)
    })()
    return () => { cancelled = true }
  }, [selectedChurch])

  const currentDevotional = devotionals ? devotionals[((devotionalDay % 365) + 365) % 365] : null

  const churchInfo = selectedChurch ? CHURCH_METADATA[selectedChurch] : null
  const hasChurchContent = !!churchData && !!churchData.devotionals && churchData.devotionals.length > 0
  const churchTotal = hasChurchContent ? churchData.devotionals.length : 365
  const devo = hasChurchContent ? churchData.devotionals[churchDevotionalDay % churchTotal] : null

  const devoDate = useMemo(() => {
    if (!devo) return null
    const year = new Date().getFullYear()
    const clamped = Math.min(devo.day || (churchDevotionalDay % churchTotal) + 1, daysInYear(year))
    return new Date(year, 0, clamped)
  }, [devo, churchDevotionalDay, churchTotal])

  const isLiveCapable = !!devoDate

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      await Promise.resolve()
      if (cancelled) return
      if (!selectedChurch || !API_URL || !devoDate) {
        setLiveDevotional(null); setLiveLoading(false); setLiveError(null)
        return
      }
      setLiveLoading(true); setLiveError(null); setLiveDevotional(null)
      try {
        const resp = await fetch(
          `${API_URL}/api/devotional/church?church=${encodeURIComponent(selectedChurch)}&year=${devoDate.getFullYear()}&month=${devoDate.getMonth() + 1}&day=${devoDate.getDate()}`,
          { signal: AbortSignal.timeout(8000) }
        )
        if (!resp.ok) throw new Error(`HTTP ${resp.status}`)
        const data = await resp.json()
        if (!cancelled) {
          if (data.error) { setLiveError(data.error); setLiveDevotional(null) }
          else { setLiveDevotional(data); setLiveError(null) }
        }
      } catch (e) {
        if (!cancelled) { setLiveError(e.message); setLiveDevotional(null) }
      } finally {
        if (!cancelled) setLiveLoading(false)
      }
    })()
    return () => { cancelled = true }
  }, [selectedChurch, churchDevotionalDay, devoDate])

  const clampedToday = Math.min(getDayOfYear() - 1, 364)
  const handleChurchSelect = (church) => {
    setSelectedChurch(church)
    setChurchDevotionalDay(clampedToday)
  }

  return (
    <section className="view fade-in">
      {!selectedChurch ? (
        <>
          <div className="card">
            <div className="card-icon"><HeartIcon /></div>
            <h3>Daily Devotional</h3>
            <p>Start your day with scripture, reflection, and prayer.</p>
            <div className="devotional-nav">
              <button className="devotional-nav-btn" onClick={prevDevotional}>Previous</button>
              <span className="devotional-day-label">Day {currentDevotional?.day ?? '—'} of 365</span>
              <button className="devotional-nav-btn" onClick={nextDevotional}>Next</button>
            </div>
            <button className="btn-sm devotional-today-btn" onClick={goToTodaysDevotional}><CalendarIcon /> Today's Devotional</button>
          </div>

          {devotionalsLoading && (
            <div className="devotional-loading-card">
              <div className="devotional-loading-spinner" />
              <p>Loading devotional...</p>
            </div>
          )}
          {!devotionalsLoading && currentDevotional && (
            <DevotionalContent
              devo={currentDevotional}
              fontSize={devotionalFontSize}
              setFontSize={setDevotionalFontSize}
            />
          )}

          <div className="devotional-progress">
            <div className="devotional-progress-label">
              <span>Reading through the Word</span>
              <span>{Math.round(((currentDevotional?.day || 1) / 365) * 100)}%</span>
            </div>
            <div className="devotional-progress-track">
              <div className="devotional-progress-fill" style={{ width: `${((currentDevotional?.day || 1) / 365) * 100}%` }} />
            </div>
          </div>

          <ChurchGrid onSelect={handleChurchSelect} />
        </>
      ) : (
        <div className="church-devotional-view">
          <div className="card">
            <button className="back-btn" onClick={() => setSelectedChurch('')}>Back to Devotionals</button>
            <div className="church-detail-header" style={{ borderLeftColor: churchInfo.color }}>
              <h3>{churchInfo.name}</h3>
              <p>{churchInfo.pastor}</p>
            </div>
          </div>

          {!hasChurchContent && (
            <div className="card devotional-unavailable">
              <div className="card-icon"><BookIcon /></div>
              <h3>Devotionals not available</h3>
              <p>
                {churchInfo.name} devotionals are not yet available in this app.
                We only include content we are authorized to share, and we do not
                want to show you anything that is not genuine.
              </p>
              <p>Please try one of the other churches listed on the Devotionals home screen.</p>
              <button className="btn-sm devotional-today-btn" onClick={() => setSelectedChurch('')}>
                <BookIcon /> Back to all devotionals
              </button>
            </div>
          )}

          {hasChurchContent && (
            <>
              <div className="devotional-nav">
                <button className="devotional-nav-btn" onClick={() => setChurchDevotionalDay(Math.max(0, churchDevotionalDay - 1))} disabled={churchDevotionalDay === 0}>Previous</button>
                <span className="devotional-day-label">Day {devo ? devo.day : '—'} of {churchTotal}</span>
                <button className="devotional-nav-btn" onClick={() => setChurchDevotionalDay(Math.min(churchTotal - 1, churchDevotionalDay + 1))} disabled={churchDevotionalDay >= churchTotal - 1}>Next</button>
              </div>
              <button className="btn-sm devotional-today-btn" onClick={() => setChurchDevotionalDay(clampedToday)}><CalendarIcon /> Today's Devotional</button>

              {devo && (
                <DevotionalContent
                  key={`${selectedChurch}-${churchDevotionalDay}`}
                  devo={devo}
                  liveData={liveDevotional}
                  liveLoading={liveLoading}
                  liveError={liveError}
                  isLiveCapable={isLiveCapable}
                  fontSize={devotionalFontSize}
                  setFontSize={setDevotionalFontSize}
                  churchName={churchInfo.name}
                  churchColor={churchInfo.color}
                />
              )}
            </>
          )}
        </div>
      )}
    </section>
  )
}