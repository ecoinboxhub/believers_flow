import { useState, useEffect, useMemo } from 'react'
import { CHURCH_METADATA, CHURCH_NAMES, getChurchData, getChurchDevotional } from '../churchDevotionals/index'
import { getDayOfYear } from '../dateUtils'

const API_URL = import.meta.env.VITE_API_URL || ''

let devotionalsCache = null
async function getDevotionals() {
  if (devotionalsCache) return devotionalsCache
  const mod = await import('../devotional')
  devotionalsCache = mod.DEVOTIONALS
  return devotionalsCache
}

function _ord(n) {
  if (n >= 11 && n <= 13) return n + 'th'
  const s = ['th', 'st', 'nd', 'rd', 'th', 'th', 'th', 'th', 'th', 'th']
  return n + s[n % 10]
}

const MONTHS = ['january','february','march','april','may','june','july','august','september','october','november','december']
const TD = 'https://thedevotionals.com.ng'

function getDailyUrl(churchKey, date) {
  const d = date || new Date()
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  const monthName = MONTHS[d.getMonth()]
  const dayNum = d.getDate()
  const ord = _ord(dayNum)

  const urls = {
    believersloveworld: `https://rhapsodyofrealities.org/en/read/${year}/${month}/${day}`,
    dunamis: `https://dunamisgospel.org/${year}/${month}/${day}/`,
    rccg: `https://rccgonline.org/open-heaven-${dayNum}-${monthName}-${year}/`,
    dailymanna: 'https://www.dailymanna.app/',
    deeperlife: `${TD}/dclm-daily-manna-devotional-${ord}-${monthName}/`,
    mfm: `${TD}/mfm-daily-devotional-${ord}-${monthName}/`,
    cac: `https://cacsalvationcentre.org/devotional/${year}/${month}/${day}/`,
    fcs: 'https://fcsministries.org/devotional',
    foodfortheday: `${TD}/food-for-the-day-devotional-${ord}-${monthName}/`,
    winners: `https://faithfood.org/${year}/${month}/${day}/`,
    ourdailybread: `https://odb.org/${year}/${month}/${day}/`,
    davidjeremiah: `https://www.davidjeremiah.org/magazine/daily-devotional?showsignup=true&date=${year}-${month}-${day}`,
    intouch: `https://intouch.org/read/daily-devotions/${year}-${month}-${day}`,
    joelosteen: `https://joelosteen.com/pages/daily-devotional-${year}-${month}-${day}`,
    trem: `${TD}/devotional/trem-devotioal/`,
    joycemeyer: `${TD}/devotional/joyce-meyer/`,
    odbtd: `${TD}/devotional/odb/`,
    billygraham: `${TD}/devotional/billy-graham/`,
    josephprince: `${TD}/devotional/joseph-prince-devotional/`,
    cdr: `${TD}/devotional/cdr/`,
    kennethcopeland: `${TD}/devotional/kenneth-copeland-devotional/`,
  }
  return urls[churchKey] || ''
}

function daysInYear(year) {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0 ? 366 : 365
}

const svgBase = { width: 16, height: 16, verticalAlign: 'middle', marginRight: 4 }
const svgIcon = { viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: '1.8', strokeLinecap: 'round', strokeLinejoin: 'round' }

function BookIcon({ style }) {
  return (
    <span style={{ ...svgBase, ...style }}>
      <svg {...svgIcon} width="16" height="16"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5z"/><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/></svg>
    </span>
  )
}

function HeartIcon({ style }) {
  return (
    <span style={{ ...svgBase, ...style }}>
      <svg {...svgIcon} width="16" height="16"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
    </span>
  )
}

function CalendarIcon({ style }) {
  return (
    <span style={{ ...svgBase, ...style }}>
      <svg {...svgIcon} width="16" height="16"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
    </span>
  )
}

function ScrollIcon({ style }) {
  return (
    <span style={{ ...svgBase, ...style }}>
      <svg {...svgIcon} width="16" height="16"><path d="M8 21h12a2 2 0 0 0 2-2v-2H10v2a2 2 0 1 1-4 0V5a2 2 0 1 0-4 0v3h4"/><path d="M19 17V5a2 2 0 0 0-2-2H4"/></svg>
    </span>
  )
}

function ChatIcon({ style }) {
  return (
    <span style={{ ...svgBase, ...style }}>
      <svg {...svgIcon} width="16" height="16"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
    </span>
  )
}

function ChurchIcon({ style }) {
  return (
    <span style={{ ...svgBase, ...style }}>
      <svg {...svgIcon} width="16" height="16"><path d="M18 22V8l4-4"/><path d="M10 22V8L6 4"/><path d="M2 22h20"/><path d="M10 22V14h4v8"/><path d="M6 4h12"/><path d="M12 4v4"/></svg>
    </span>
  )
}

function renderParagraphs(text) {
  if (!text) return null
  const paragraphs = text.split('\n\n').filter(p => p.trim().length > 0)
  return paragraphs.map((p, i) => <p key={i} className="devotional-paragraph">{p.trim()}</p>)
}

function renderSections(sections) {
  if (!sections || !Array.isArray(sections) || sections.length === 0) return null
  let key = 0
  return sections.map((section) => {
    const sk = key++
    switch (section.type) {
      case 'memory':
        return (
          <div key={sk} className="devotional-section">
            <div className="devotional-section-label memory"><BookIcon /> Memory Verse</div>
            <div className="devotional-section-content">{renderParagraphs(section.content)}</div>
          </div>
        )
      case 'scripture':
        return (
          <div key={sk} className="devotional-section">
            <div className="devotional-section-label scripture"><ScrollIcon /> Scripture</div>
            <div className="devotional-section-content">{renderParagraphs(section.content)}</div>
          </div>
        )
      case 'message':
        return (
          <div key={sk} className="devotional-section">
            <div className="devotional-section-label message"><ChatIcon /> Message</div>
            <div className="devotional-section-content">{renderParagraphs(section.content)}</div>
          </div>
        )
      case 'prayer':
        return (
          <div key={sk} className="devotional-section">
            <div className="devotional-section-label prayer"><HeartIcon /> Prayer</div>
            <div className="devotional-section-content">{renderParagraphs(section.content)}</div>
          </div>
        )
      default:
        return (
          <div key={sk} className="devotional-section">
            <div className="devotional-section-content">{renderParagraphs(section.content)}</div>
          </div>
        )
    }
  })
}

function DevotionalContent({ devo, liveData, liveLoading, liveError, isLiveCapable, fontSize, setFontSize, sourceUrl, churchName, churchColor }) {
  const showLive = isLiveCapable && liveData && !liveData.error
  const showFallback = isLiveCapable && (liveError || (liveData && liveData.error))

  const fontStyle = {
    small: { verse: '0.88rem', text: '0.82rem' },
    medium: { verse: '0.95rem', text: '0.9rem' },
    large: { verse: '1.08rem', text: '1.02rem' },
  }
  const f = fontStyle[fontSize] || fontStyle.medium

  if (!devo) return null

  const title = showLive ? liveData.title : (devo.title || '')
  const verse = showLive ? (liveData.verse || liveData.verseText ? { ref: liveData.verse, text: liveData.verseText } : null) : (devo.verse || devo.verseText ? { ref: devo.verse, text: devo.verseText } : null)
  const sections = showLive && liveData.sections ? liveData.sections : null
  const rawText = showLive ? liveData.text : (devo.text || '')
  const prayer = showLive ? liveData.prayer : (devo.prayer || '')

  return (
    <div className="devotional-content-card">
      <div className="devotional-header">
        <span className="devotional-day-badge">Day {devo?.day ?? '—'}</span>
        {sourceUrl && <a href={sourceUrl || ''} target="_blank" rel="noopener noreferrer" className="source-link-sm">Read online ↗</a>}
        <div className="devotional-font-controls">
          <button className={`dev-font-btn${fontSize === 'small' ? ' active' : ''}`}
            onClick={() => setFontSize('small')}>S</button>
          <button className={`dev-font-btn${fontSize === 'medium' ? ' active' : ''}`}
            onClick={() => setFontSize('medium')}>M</button>
          <button className={`dev-font-btn${fontSize === 'large' ? ' active' : ''}`}
            onClick={() => setFontSize('large')}>L</button>
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

      {showLive && (
        <div className="devotional-sync-badge" style={{ borderLeftColor: churchColor }}>
          <span>✓ Synced from {churchName}</span>
          <a href={liveData.sourceUrl || sourceUrl} target="_blank" rel="noopener noreferrer" className="source-link-sm">Open ↗</a>
        </div>
      )}

      {showFallback && (
        <div className="devotional-sync-badge offline">
          <span><BookIcon /> Using offline copy</span>
          <a href={sourceUrl} target="_blank" rel="noopener noreferrer" className="source-link-sm">Read online ↗</a>
        </div>
      )}

      {!isLiveCapable && (
        <div className="devotional-sync-badge offline">
          <span><BookIcon /> Offline devotional</span>
          <a href={sourceUrl} target="_blank" rel="noopener noreferrer" className="source-link-sm">Read online ↗</a>
        </div>
      )}

      {title && <h2 className="devotional-title" style={{ fontSize: fontSize === 'small' ? '1.1rem' : fontSize === 'large' ? '1.4rem' : '1.25rem' }}>{title}</h2>}

      {verse && (
        <div className="devotional-verse-block">
          <p className="devotional-verse-text" style={{ fontSize: f.verse }}>&ldquo;{verse.text}&rdquo;</p>
          {verse.ref && <p className="devotional-verse-ref">&mdash; {verse.ref}</p>}
        </div>
      )}

      {/* Sections from API (structured) */}
      {sections && renderSections(sections)}

      {/* Raw text fallback (when no sections) */}
      {!sections && rawText && (
        <div className="devotional-text" style={{ fontSize: f.text }}>
          {renderParagraphs(rawText)}
        </div>
      )}

      {/* Prayer section (if not already in sections) */}
      {prayer && !(sections && sections.some(s => s.type === 'prayer')) && (
        <div className="devotional-prayer-block">
          <h4 className="devotional-prayer-title"><HeartIcon /> Prayer</h4>
          <p className="devotional-prayer-text" style={{ fontSize: f.text }}>{prayer}</p>
        </div>
      )}
    </div>
  )
}

function ChurchGrid({ onSelect, churches }) {
  const list = churches || CHURCH_NAMES
  return (
    <div className="card church-devotional-select">
      <div className="card-icon"><ChurchIcon style={{ width: 24, height: 24 }} /></div>
      <h3>Church Devotionals</h3>
      <p>Explore devotionals from various churches and ministries.</p>
      <div className="church-grid">
        {list.map(church => (
          <button key={church} className="church-card" onClick={() => onSelect(church)}
            style={{ borderColor: CHURCH_METADATA[church]?.color }}>
            <span className="church-name">{CHURCH_METADATA[church]?.name}</span>
            <span className="church-pastor">{CHURCH_METADATA[church]?.pastor}</span>
          </button>
        ))}
      </div>
    </div>
  )
}

export default function DevotionalView({
  devotionalDay, setDevotionalDay, devotionalFontSize, setDevotionalFontSize,
  selectedChurch, setSelectedChurch, churchDevotionalDay, setChurchDevotionalDay,
  nextDevotional, prevDevotional, goToTodaysDevotional,
}) {
  const [devotionals, setDevotionals] = useState(null)
  const [devotionalsLoading, setDevotionalsLoading] = useState(true)
  const [churchData, setChurchData] = useState(null)
  const [churchDataLoading, setChurchDataLoading] = useState(false)

  useEffect(() => {
    getDevotionals().then(d => {
      setDevotionals(d)
      setDevotionalsLoading(false)
    })
  }, [])

  useEffect(() => {
    if (!selectedChurch) { setChurchData(null); return }
    setChurchDataLoading(true)
    getChurchData(selectedChurch).then(data => {
      setChurchData(data)
      setChurchDataLoading(false)
    })
  }, [selectedChurch])

  const currentDevotional = devotionals ? devotionals[devotionalDay % 365] : null
  const [liveDevotional, setLiveDevotional] = useState(null)
  const [liveLoading, setLiveLoading] = useState(false)
  const [liveError, setLiveError] = useState(null)

  const churchInfo = selectedChurch ? CHURCH_METADATA[selectedChurch] : null
  const devo = churchData ? churchData.devotionals[churchDevotionalDay] : null

  const devoDate = useMemo(() => {
    if (!devo) return null
    const year = new Date().getFullYear()
    const dim = daysInYear(year)
    if (devo.day > dim) return null
    return new Date(year, 0, devo.day)
  }, [devo])

  const isLiveCapable = !!devoDate
  const sourceUrl = selectedChurch ? getDailyUrl(selectedChurch, devoDate || new Date()) : ''

  useEffect(() => {
    if (!selectedChurch || !API_URL || !devoDate) {
      setLiveDevotional(null)
      setLiveLoading(false)
      setLiveError(null)
      return
    }

    let cancelled = false

    const fetchLive = async () => {
      setLiveLoading(true)
      setLiveError(null)
      setLiveDevotional(null)
      try {
        const resp = await fetch(
          `${API_URL}/api/devotional/church?church=${selectedChurch}&year=${devoDate.getFullYear()}&month=${devoDate.getMonth() + 1}&day=${devoDate.getDate()}`,
          { signal: AbortSignal.timeout(8000) }
        )
        if (!resp.ok) throw new Error(`HTTP ${resp.status}`)
        const data = await resp.json()
        if (!cancelled) {
          if (data.error) {
            setLiveError(data.error)
            setLiveDevotional(null)
          } else {
            setLiveDevotional(data)
            setLiveError(null)
          }
        }
      } catch (e) {
        if (!cancelled) {
          setLiveError(e.message)
          setLiveDevotional(null)
        }
      } finally {
        if (!cancelled) setLiveLoading(false)
      }
    }
    fetchLive()
    return () => { cancelled = true }
  }, [selectedChurch, churchDevotionalDay, devoDate])

  const handleChurchSelect = (church) => {
    setSelectedChurch(church)
    const today = getDayOfYear() - 1
    setChurchDevotionalDay(today)
  }

  const totalDays = churchData ? churchData.devotionals.length : 0

  return (
    <section className="view fade-in">
      {!selectedChurch ? (
        <>
          <div className="card">
            <div className="card-icon"><HeartIcon style={{ width: 24, height: 24 }} /></div>
            <h3>Daily Devotional</h3>
            <p>Start your day with scripture, reflection, and prayer.</p>
            <div className="devotional-nav">
              <button className="devotional-nav-btn" onClick={prevDevotional}>◀ Previous</button>
              <span className="devotional-day-label">Day {currentDevotional?.day ?? '—'} of 365</span>
              <button className="devotional-nav-btn" onClick={nextDevotional}>Next ▶</button>
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
              <span>{Math.round((devotionalDay / 365) * 100)}%</span>
            </div>
            <div className="devotional-progress-track">
              <div className="devotional-progress-fill" style={{ width: `${(devotionalDay / 365) * 100}%` }} />
            </div>
          </div>

          <ChurchGrid onSelect={handleChurchSelect} />
        </>
      ) : (
        <div className="church-devotional-view">
          <div className="card">
            <button className="back-btn" onClick={() => setSelectedChurch('')}>← Back to Devotionals</button>
            <div className="church-detail-header" style={{ borderLeftColor: churchInfo.color }}>
              <h3>{churchInfo.name}</h3>
              <p>{churchInfo.pastor}</p>
              <a href={sourceUrl} target="_blank" rel="noopener noreferrer" className="source-link">
                <BookIcon /> Read at source ↗
              </a>
            </div>
          </div>

          <div className="devotional-nav">
            <button className="devotional-nav-btn" onClick={() => setChurchDevotionalDay(Math.max(0, churchDevotionalDay - 1))} disabled={churchDevotionalDay === 0}>◀ Previous</button>
            <span className="devotional-day-label">Day {devo ? devo.day : '—'} of {totalDays}</span>
            <button className="devotional-nav-btn" onClick={() => setChurchDevotionalDay(Math.min(totalDays - 1, churchDevotionalDay + 1))} disabled={churchDevotionalDay >= totalDays - 1}>Next ▶</button>
          </div>
          <button className="btn-sm devotional-today-btn" onClick={() => setChurchDevotionalDay(getDayOfYear() - 1)}><CalendarIcon /> Today's Devotional</button>

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
              sourceUrl={sourceUrl}
              churchName={churchInfo.name}
              churchColor={churchInfo.color}
            />
          )}
        </div>
      )}
    </section>
  )
}