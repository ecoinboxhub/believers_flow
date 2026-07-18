import { useMemo, useState, useEffect, useCallback, useRef } from 'react'
import { getDayOfYear } from '../dateUtils'

const HYMN_WITH_TUNES = new Set([1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,32,33,34,35,36,37,38,39,40,41,42,43,44,45,46,47,48,49,50,52,63,64,75,79,94,97,100])

const HYMN_METADATA = {
  1: { meter:'8.8.8.6', scripture:'Ephesians 2:8-9', year:1779, tags:['grace','salvation','testimony','conversion'], tune:'New Britain' },
  2: { meter:'10.10.10.10', scripture:'Psalm 23', year:1865, tags:['psalm','shepherd','comfort','providence'], tune:'Crimond' },
  3: { meter:'8.8.8.8.8.8', scripture:'Revelation 4:8', year:1744, tags:['trinity','worship','praise','holiness'], tune:'Holy, Holy, Holy' },
  4: { meter:'8.8.8.8', scripture:'Psalm 103:1', year:1774, tags:['praise','doxology','psalm','thanksgiving'], tune:'Old 100th' },
  5: { meter:'10.10.10.4', scripture:'Philippians 4:6-7', year:1882, tags:['prayer','mercy','penitence'], tune:'Pass Me Not' },
  6: { meter:'8.8.8.8.8.8', scripture:'Isaiah 53:5', year:1707, tags:['cross','crucifixion','love','sacrifice'], tune:'Martyn' },
  7: { meter:'8.7.8.7.8.7', scripture:'Psalm 91:1-2', year:1779, tags:['protection','psalm','refuge','trust'], tune:'Germany' },
  8: { meter:'10.10.10.10', scripture:'Romans 8:38-39', year:1874, tags:['trust','patience','sovereignty','comfort'], tune:'Finlandia' },
  9: { meter:'8.8.8.8', scripture:'Psalm 46:10', year:1850, tags:['peace','trust','surrender'], tune:'St. Columba' },
  10: { meter:'8.8.8.8.8.8', scripture:'Psalm 34:1-3', year:1779, tags:['praise','psalm','universal'], tune:'Old Hundredth' },
}

function normalize(text) {
  return text.toLowerCase().replace(/[^\w\s]/g, '').replace(/\s+/g, ' ').trim()
}

function fuzzyScore(query, text) {
  const q = normalize(query)
  const t = normalize(text)
  if (!q || !t) return 0
  if (t.includes(q)) return 1.0
  if (q.includes(t)) return 0.95
  const qTokens = q.split(' ')
  const tTokens = t.split(' ')
  const overlap = qTokens.filter(tok => tTokens.some(tt => tt.includes(tok) || tok.includes(tt))).length
  const coverage = overlap / qTokens.length
  const lenRatio = Math.min(q.length, t.length) / Math.max(q.length, t.length)
  return coverage * 0.7 + lenRatio * 0.3
}

function searchHymns(query, hymns) {
  if (!query || !query.trim()) return hymns
  const q = query.trim()
  const num = parseInt(q, 10)
  return hymns
    .map(h => {
      let score = 0
      if (!isNaN(num) && h.id === num) score = 1.0
      else if (!isNaN(num) && h.id.toString().includes(q)) score = 0.9
      else {
        score = Math.max(
          fuzzyScore(q, h.title),
          fuzzyScore(q, h.author || '') * 0.8,
          fuzzyScore(q, h.category || '') * 0.6,
          ...(h.lyrics ? [fuzzyScore(q, h.lyrics.split('\n')[0]) * 0.85] : []),
        )
      }
      const meta = HYMN_METADATA[h.id]
      if (meta && meta.tags) {
        const tagScore = meta.tags.some(tag => fuzzyScore(q, tag) > 0.5) ? 0.5 : 0
        score = Math.max(score, tagScore)
      }
      return { hymn: h, score }
    })
    .filter(x => x.score > 0.15)
    .sort((a, b) => b.score - a.score)
    .map(x => x.hymn)
}

function getSuggestions(query, hymns, limit = 5) {
  if (!query || query.length < 2) return []
  return searchHymns(query, hymns)
    .slice(0, limit)
    .map(h => ({ id: h.id, title: h.title, author: h.author }))
}

export default function HymnView({
  hymnSearch, setHymnSearch, hymnSort, setHymnSort,
  hymnCategory, setHymnCategory, hymnFavorites, hymnRecentlyViewed,
  selectedHymn, hymnPlaying, openHymn, closeHymn,
  toggleHymnFavorite, toggleHymnPlay,
}) {
  const [hymns, setHymns] = useState([])
  const [hymnsLoading, setHymnsLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    import('../hymns').then(mod => {
      if (!cancelled) {
        setHymns(mod.HYMNS)
        setHymnsLoading(false)
      }
    })
    return () => { cancelled = true }
  }, [])
  const [suggestions, setSuggestions] = useState([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [selectedVerse, setSelectedVerse] = useState(null)
  const [shareStatus, setShareStatus] = useState(null)
  const [volume, setVolume] = useState(0.7)
  const [playbackSpeed, setPlaybackSpeed] = useState(1.0)
  const [isPaused, setIsPaused] = useState(false)
  const [onlineLyrics, setOnlineLyrics] = useState(null)
  const [onlineLyricsLoading, setOnlineLyricsLoading] = useState(false)
  const [onlineLyricsError, setOnlineLyricsError] = useState(null)
  const searchRef = useRef(null)
  const suggestionsRef = useRef(null)

  const fetchOnlineLyrics = useCallback(async (hymnTitle) => {
    const slug = hymnTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
    setOnlineLyricsLoading(true)
    setOnlineLyricsError(null)
    setOnlineLyrics(null)
    try {
      const res = await fetch(`/api/hymns/lyrics?slug=${encodeURIComponent(slug)}`)
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.detail || `Failed (${res.status})`)
      }
      const data = await res.json()
      if (!data.verses || data.verses.length === 0) {
        throw new Error('No lyrics found for this hymn on GCCSA')
      }
      setOnlineLyrics(data)
    } catch (e) {
      setOnlineLyricsError(e.message)
    } finally {
      setOnlineLyricsLoading(false)
    }
  }, [])

  const categories = useMemo(() => ['all', ...new Set(hymns.map(h => h.category).filter(Boolean))], [hymns])

  const filteredHymns = useMemo(() => {
    let list = hymnSearch.trim() ? searchHymns(hymnSearch, hymns) : hymns
    if (hymnCategory !== 'all') {
      list = list.filter(h => h.category === hymnCategory)
    }
    if (!hymnSearch.trim()) {
      if (hymnSort === 'alpha-asc') list = [...list].sort((a, b) => a.title.localeCompare(b.title))
      else if (hymnSort === 'alpha-desc') list = [...list].sort((a, b) => b.title.localeCompare(a.title))
    }
    return list
  }, [hymnSearch, hymnCategory, hymnSort])

  const getDailyHymn = () => hymns.length > 0 ? hymns[getDayOfYear() % hymns.length] : null

  useEffect(() => {
    if (hymnSearch.length >= 2) {
      const results = getSuggestions(hymnSearch, hymns)
      setSuggestions(results)
      setShowSuggestions(results.length > 0)
    } else {
      setSuggestions([])
      setShowSuggestions(false)
    }
  }, [hymnSearch])

  useEffect(() => {
    function handleClickOutside(e) {
      if (suggestionsRef.current && !suggestionsRef.current.contains(e.target) &&
          searchRef.current && !searchRef.current.contains(e.target)) {
        setShowSuggestions(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSearchChange = useCallback((e) => {
    setHymnSearch(e.target.value)
    setSelectedVerse(null)
  }, [setHymnSearch])

  const selectSuggestion = useCallback((id) => {
    const h = hymns.find(x => x.id === id)
    if (h) {
      openHymn(h)
      setShowSuggestions(false)
      setHymnSearch('')
    }
  }, [openHymn, setHymnSearch])

  const handleShare = useCallback(async (hymn) => {
    const text = `${hymn.id}. ${hymn.title}\nBy ${hymn.author || 'Unknown'}\n\n${hymn.lyrics || ''}`
    if (navigator.share) {
      try {
        await navigator.share({ title: hymn.title, text })
        setShareStatus('shared')
      } catch {
        setShareStatus('cancelled')
      }
    } else {
      try {
        await navigator.clipboard.writeText(text)
        setShareStatus('copied')
      } catch {
        setShareStatus('failed')
      }
    }
    setTimeout(() => setShareStatus(null), 2000)
  }, [])

  const verseLines = useMemo(() => {
    if (!selectedHymn) return []
    const lines = (selectedHymn.lyrics || selectedHymn.first_verse || '').split('\n')
    const groups = []
    let current = []
    lines.forEach((line, i) => {
      if (line.trim() === '' && current.length > 0) {
        groups.push(current)
        current = []
      } else {
        current.push({ text: line, index: i })
      }
    })
    if (current.length > 0) groups.push(current)
    return groups
  }, [selectedHymn])

  const meta = selectedHymn ? HYMN_METADATA[selectedHymn.id] : null
  const hasTune = selectedHymn && HYMN_WITH_TUNES.has(selectedHymn.id)

  return (
    <section className="view fade-in">
      {!selectedHymn ? (
        <>
          <div className="card">
            <div className="hymn-header">
              <h3>Hymn Book</h3>
              <span className="hymn-count">{hymns.length} hymns</span>
            </div>

            {getDailyHymn() && (
            <div className="hymn-daily-card" tabIndex={0} role="button" aria-label="Open today's hymn"
              onClick={() => { const h = getDailyHymn(); openHymn(h) }}
              onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); const h = getDailyHymn(); openHymn(h) } }}>
              <div className="hymn-daily-info">
                <span className="hymn-daily-label">Today's Hymn</span>
                <span className="hymn-daily-title">{getDailyHymn().id} {getDailyHymn().title}</span>
                <span className="hymn-daily-author">{getDailyHymn().author}</span>
              </div>
              <span className="hymn-daily-arrow">{'>'}</span>
            </div>
            )}

            <div className="hymn-search-box" ref={searchRef}>
              <input type="text" placeholder="Search by title, author, first line, or number..."
                value={hymnSearch} onChange={handleSearchChange}
                onFocus={() => suggestions.length > 0 && setShowSuggestions(true)} />
              {hymnSearch && <button className="hymn-search-clear" onClick={() => setHymnSearch('')}>{'x'}</button>}
              {showSuggestions && suggestions.length > 0 && (
                <div className="hymn-suggestions" ref={suggestionsRef}>
                  {suggestions.map(s => (
                    <div key={s.id} className="hymn-suggestion-item" onClick={() => selectSuggestion(s.id)}>
                      <span className="hymn-suggestion-num">{s.id}</span>
                      <div className="hymn-suggestion-info">
                        <span className="hymn-suggestion-title">{s.title}</span>
                        <span className="hymn-suggestion-author">{s.author}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="hymn-sort-row">
              <button className={`hymn-sort-btn${hymnSort === 'number' ? ' active' : ''}`}
                onClick={() => setHymnSort('number')}>#</button>
              <button className={`hymn-sort-btn${hymnSort === 'alpha-asc' ? ' active' : ''}`}
                onClick={() => setHymnSort('alpha-asc')}>A-Z</button>
              <button className={`hymn-sort-btn${hymnSort === 'alpha-desc' ? ' active' : ''}`}
                onClick={() => setHymnSort('alpha-desc')}>Z-A</button>
            </div>

            <div className="hymn-categories-scroll">
              {categories.map(cat => (
                <button key={cat} className={`hymn-cat-btn${hymnCategory === cat ? ' active' : ''}`}
                  onClick={() => setHymnCategory(cat)}>
                  {cat === 'all' ? 'All' : cat}
                </button>
              ))}
            </div>
          </div>

          {!hymnsLoading && hymnRecentlyViewed.length > 0 && !hymnSearch && hymnCategory === 'all' && (
            <div className="card">
              <h3>Recently Viewed</h3>
              <div className="hymn-fav-list">
                {hymnRecentlyViewed.slice(0, 5).map(r => {
                  const h = hymns.find(x => x.id === r.id)
                  if (!h) return null
                  return (
                    <div key={h.id} className="hymn-list-item" onClick={() => openHymn(h)}
                      tabIndex={0} role="button" aria-label={`Open ${h.title} by ${h.author || 'Unknown'}`}
                      onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openHymn(h) } }}>
                      <div className="hymn-item-info">
                        <span className="hymn-item-title">{h.id} {h.title}</span>
                        <span className="hymn-item-author">{h.author || 'Unknown'}</span>
                      </div>
                      {HYMN_WITH_TUNES.has(h.id) && <span className="hymn-has-tune" title="Has audio">{'>'}</span>}
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {hymnsLoading ? (
            <div className="hymn-loading">
              {[...Array(8)].map((_, i) => <div key={i} className="hymn-loading-item" />)}
            </div>
          ) : (
          <div className="hymn-list">
            {filteredHymns.map(h => (
              <div key={h.id} className="hymn-list-item" onClick={() => openHymn(h)}
              tabIndex={0} role="button" aria-label={`Open ${h.title} by ${h.author || 'Unknown'}`}
              onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openHymn(h) } }}>
                <div className="hymn-item-info">
                  <span className="hymn-item-title">{h.id} {h.title}</span>
                  <span className="hymn-item-author">{h.author || 'Unknown'}</span>
                  <span className="hymn-item-cat">{h.category}</span>
                </div>
                <div className="hymn-item-actions">
                  {HYMN_WITH_TUNES.has(h.id) && <span className="hymn-has-tune" title="Has audio">{'>'}</span>}
                  <button className={`hymn-fav-btn${hymnFavorites.includes(h.id) ? ' active' : ''}`}
                    onClick={e => { e.stopPropagation(); toggleHymnFavorite(h.id) }}
                    title={hymnFavorites.includes(h.id) ? 'Remove from favorites' : 'Add to favorites'}>
                    {hymnFavorites.includes(h.id) ? <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg> : <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>}
                  </button>
                </div>
              </div>
            ))}
            {filteredHymns.length === 0 && (
              <div className="empty-state">
                <h4 className="empty-title">No hymns found</h4>
                <p className="empty-hint">Try a different search term or category.</p>
              </div>
            )}
          </div>
          )}

          {!hymnsLoading && hymnFavorites.length > 0 && (
            <div className="card">
              <h3>Favorite Hymns</h3>
              <div className="hymn-fav-list">
                {hymnFavorites.map(id => {
                  const h = hymns.find(x => x.id === id)
                  if (!h) return null
                  return (
                    <div key={h.id} className="hymn-list-item" onClick={() => openHymn(h)}
                      tabIndex={0} role="button" aria-label={`Open ${h.title} by ${h.author || 'Unknown'}`}
                      onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openHymn(h) } }}>
                      <div className="hymn-item-info">
                        <span className="hymn-item-title">{h.id} {h.title}</span>
                        <span className="hymn-item-author">{h.author || 'Unknown'}</span>
                      </div>
                      {HYMN_WITH_TUNES.has(h.id) && <span className="hymn-has-tune">{'>'}</span>}
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="hymn-detail-view">
          <div className="hymn-detail-header">
            <button className="hymn-back-btn" onClick={closeHymn}>{'<'} Back</button>
            <div className="hymn-detail-header-right">
              {hasTune && (
                <button className={`hymn-play-btn${hymnPlaying ? ' playing' : ''}`}
                  onClick={() => toggleHymnPlay(selectedHymn.id)}
                  title={hymnPlaying ? 'Stop' : 'Play melody'}>
                  {hymnPlaying ? 'Stop' : 'Play'}
                </button>
              )}
              <button className={`hymn-fav-btn${hymnFavorites.includes(selectedHymn.id) ? ' active' : ''}`}
                onClick={() => toggleHymnFavorite(selectedHymn.id)}
                aria-label={hymnFavorites.includes(selectedHymn.id) ? 'Remove from favorites' : 'Add to favorites'}>
                {hymnFavorites.includes(selectedHymn.id) ? <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg> : <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>}
              </button>
              <button className="hymn-share-btn" onClick={() => handleShare(selectedHymn)}
                title="Share hymn">
                {shareStatus === 'copied' ? 'Copied' : shareStatus === 'shared' ? 'Shared' : 'Share'}
              </button>
            </div>
          </div>
          <div className="hymn-detail-card">
            <h2 className="hymn-detail-title">{selectedHymn.id} {selectedHymn.title}</h2>
            <p className="hymn-detail-author">{selectedHymn.author || 'Unknown'}</p>
            {selectedHymn.category && <span className="hymn-detail-cat">{selectedHymn.category}</span>}
            {meta && (
              <div className="hymn-meta-row">
                {meta.tune && <span className="hymn-meta-item">Tune: {meta.tune}</span>}
                {meta.meter && <span className="hymn-meta-item">Meter: {meta.meter}</span>}
                {meta.scripture && <span className="hymn-meta-item">Scripture: {meta.scripture}</span>}
                {meta.year && <span className="hymn-meta-item">Year: {meta.year}</span>}
              </div>
            )}
            {meta && meta.tags && meta.tags.length > 0 && (
              <div className="hymn-tags-row">
                {meta.tags.map(tag => (
                  <span key={tag} className="hymn-tag" onClick={() => { setHymnSearch(tag); closeHymn() }}>{tag}</span>
                ))}
              </div>
            )}
          </div>
          {hasTune && hymnPlaying && (
            <div className="hymn-player-controls">
              <div className="hymn-player-row">
                <label>Vol</label>
                <input type="range" min="0" max="1" step="0.1" value={volume}
                  onChange={e => setVolume(parseFloat(e.target.value))} />
                <span>{Math.round(volume * 100)}%</span>
              </div>
              <div className="hymn-player-row">
                <label>Speed</label>
                <button className="hymn-speed-btn" onClick={() => setPlaybackSpeed(s => Math.max(0.5, s - 0.25))}>-</button>
                <span>{playbackSpeed}x</span>
                <button className="hymn-speed-btn" onClick={() => setPlaybackSpeed(s => Math.min(2.0, s + 0.25))}>+</button>
              </div>
            </div>
          )}
          <div className="hymn-detail-lyrics">
            {verseLines.map((verse, vi) => (
              <div key={vi} className={`hymn-verse-group${selectedVerse === vi ? ' selected' : ''}`}
                onClick={() => setSelectedVerse(selectedVerse === vi ? null : vi)}>
                {verse.map((line, li) => (
                  <p key={li} className="hymn-lyric-line">{line.text || '\u00A0'}</p>
                ))}
              </div>
            ))}
          </div>

          <div className="hymn-online-section">
            {!onlineLyrics && !onlineLyricsLoading && !onlineLyricsError && (
              <button className="hymn-online-btn" onClick={() => fetchOnlineLyrics(selectedHymn.title)}
                title="Fetch lyrics from gccsatx.com">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{verticalAlign: 'middle', marginRight: '6px'}}><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"/></svg> Fetch lyrics online
              </button>
            )}
            {onlineLyricsLoading && (
              <div className="hymn-online-loading">Fetching lyrics from GCCSA...</div>
            )}
            {onlineLyricsError && (
              <div className="hymn-online-error">
                <p>{onlineLyricsError}</p>
                <button className="hymn-online-btn" onClick={() => fetchOnlineLyrics(selectedHymn.title)}>Retry</button>
              </div>
            )}
            {onlineLyrics && (
              <div className="hymn-online-result">
                <div className="hymn-online-header">
                  <span className="hymn-online-label">Online Lyrics (gccsatx.com)</span>
                  {onlineLyrics.key && <span className="hymn-meta-item">Key: {onlineLyrics.key}</span>}
                  {onlineLyrics.meter && <span className="hymn-meta-item">Meter: {onlineLyrics.meter}</span>}
                </div>
                {onlineLyrics.verses.map((verse, vi) => (
                  <div key={vi} className="hymn-verse-group">
                    {verse.map((line, li) => (
                      <p key={li} className="hymn-lyric-line">{line || '\u00A0'}</p>
                    ))}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  )
}
