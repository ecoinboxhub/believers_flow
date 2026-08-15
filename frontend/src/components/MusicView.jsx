import { useState, useEffect, useRef } from 'react'
import HymnView from './HymnView.jsx'
import { searchChristianMusicViaProxy } from '../music/christianMusic.js'

let activeAudio = null

function stopActiveAudio() {
  if (activeAudio) {
    try { activeAudio.pause() } catch { /* already detached */ }
    activeAudio = null
  }
}

const CATEGORIES = [
  { id: 'hymns', label: 'Hymns' },
  { id: 'praise', label: 'Praise & Worship' },
  { id: 'spotify', label: 'Spotify Christian' },
  { id: 'boom', label: 'Boom Christian' },
  { id: 'youtube', label: 'YouTube Contemporary' },
]

const PRAISE_STREAMS = [
  {
    title: 'Praise & Worship',
    subtitle: 'Contemporary praise and worship radio',
    url: 'https://ice66.securenetsystems.net/AGCPW',
    badge: 'AllWorship'
  },
  {
    title: 'Contemporary Christian',
    subtitle: 'Modern Christian hits, around the clock',
    url: 'https://ice66.securenetsystems.net/AGCCW',
    badge: 'AllWorship'
  },
  {
    title: 'Hymns & Favorites',
    subtitle: 'Timeless hymns and worship classics',
    url: 'https://ice25.securenetsystems.net/AGCHF',
    badge: 'AllWorship'
  },
  {
    title: 'Gospel',
    subtitle: 'Traditional and contemporary gospel music',
    url: 'https://ice25.securenetsystems.net/AGCGW',
    badge: 'AllWorship'
  },
  {
    title: 'Instrumental',
    subtitle: 'Soothing instrumental worship music',
    url: 'https://ice66.securenetsystems.net/AGCIW',
    badge: 'AllWorship'
  },
]

const SPOTIFY_PLAYLISTS = [
  {
    title: 'Top Christian Hits',
    subtitle: 'Curated collection of today\'s Christian hits',
    id: '1KRZH6WH8qYgaVnagjjOFV',
    tags: ['worship', 'hits', 'contemporary', 'praise']
  },
  {
    title: 'Top Christian Worship',
    subtitle: 'Modern worship music for every day',
    id: '61xuizm8At6DCwGHJZTmB7',
    tags: ['worship', 'contemporary', 'praise']
  },
  {
    title: 'Best Worship Songs',
    subtitle: 'Faith-filled worship that inspires and uplifts',
    id: '7jBgMpEnOTsz0bTwgiSmT',
    tags: ['worship', 'praise', 'inspirational']
  },
  {
    title: 'Top 50 Christian Songs',
    subtitle: 'Popular Christian praise and worship music',
    id: '174NV7zjemTk8C4ebhbQY6',
    tags: ['hits', 'worship', 'praise', 'contemporary']
  },
  {
    title: 'Deep Worship',
    subtitle: 'Worship music for times of prayer and reflection',
    id: '1vOh0r3BRIVbkJCn4Yc5od',
    tags: ['worship', 'reflective', 'prayer']
  },
  {
    title: 'New Christian Music',
    subtitle: 'Latest Christian releases, edited every week',
    id: '0eW19kpar82Ibg5nrz0ffc',
    tags: ['new', 'releases', 'contemporary', 'worship']
  },
  {
    title: 'Christian Hits',
    subtitle: 'Broad Christian and contemporary gospel mix',
    id: '5Ux99VLE8cG7W656CjR2si',
    tags: ['hits', 'gospel', 'contemporary', 'worship']
  },
  {
    title: 'Alabanzas Cristianas',
    subtitle: 'Essential tracks of contemporary Spanish worship',
    id: '37i9dQZF1DZ06evO2EuREL',
    tags: ['worship', 'spanish', 'praise']
  },
]

const BOOM_STREAMS = [
  {
    title: '1.FM Gospel',
    subtitle: 'Gospel music from 1.FM Radio, free to stream',
    url: 'https://strmreg.1.fm/gospel_mobile_mp3',
    badge: '1.FM',
    tags: ['gospel', 'contemporary', 'traditional']
  },
  {
    title: '1.FM Praise & Worship',
    subtitle: 'Praise and worship music from 1.FM Radio',
    url: 'https://strmreg.1.fm/praise_mobile_mp3',
    badge: '1.FM',
    tags: ['praise', 'worship', 'contemporary']
  },
]

const BOOM_SUGGESTIONS = [
  'Christian music',
  'Gospel music',
  'Christian worship',
  'Praise and worship',
  'Contemporary Christian',
  'Christian artists',
]

const YOUTUBE_SONGS = [
  {
    title: 'Graves Into Gardens',
    subtitle: 'Elevation Worship feat. Brandon Lake',
    videoId: 'KwX1f2gYKZ4'
  },
  {
    title: 'No Longer Slaves',
    subtitle: 'Bethel Music',
    videoId: 'otmBLQJ7IUQ'
  },
  {
    title: 'O Come to the Altar',
    subtitle: 'Elevation Worship | Live',
    videoId: 'rYQ5yXCc_CA'
  },
  {
    title: 'Jireh',
    subtitle: 'Elevation Worship & Maverick City Music',
    videoId: 'ZErLEnRNfbE'
  },
  {
    title: 'What A Beautiful Name',
    subtitle: 'Hillsong Worship',
    videoId: 'nQWFzMvCfLE'
  },
  {
    title: 'How He Loves',
    subtitle: 'Jesus Culture feat. Kim Walker-Smith',
    videoId: 'JoC1ec-lYps'
  },
]

function normalizeText(text) {
  return (text || '').toLowerCase().replace(/[^\w\s]/g, '').replace(/\s+/g, ' ')
}

function matchesQuery(item, query) {
  const q = normalizeText(query)
  if (!q) return true
  const haystack = normalizeText(`${item.title} ${item.subtitle || ''} ${(item.tags || []).join(' ')}`)
  return haystack.includes(q)
}

function MusicSearchInput({ value, onChange, placeholder, onSubmit }) {
  return (
    <div className="music-search-box">
      <span className="music-search-icon" aria-hidden="true">
        <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
      </span>
      <input
        type="text"
        value={value}
        onChange={e => onChange(e.target.value)}
        onKeyDown={onSubmit ? e => { if (e.key === 'Enter') onSubmit() } : undefined}
        placeholder={placeholder}
        aria-label={placeholder}
      />
      {value && (
        <button className="music-search-clear" onClick={() => onChange('')} aria-label="Clear search">
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
      )}
    </div>
  )
}

function BoomSuggestionChip({ label, onClick }) {
  return (
    <button className="music-suggestion-chip" onClick={onClick}>{label}</button>
  )
}

function MusicEmptyState({ query }) {
  return (
    <div className="music-empty-state">
      <h4 className="music-empty-title">No Christian music found</h4>
      <p className="music-empty-hint">Try a different mood or keyword such as worship, praise, or gospel.</p>
      {query && <p className="music-empty-query">Search: "{query}"</p>}
    </div>
  )
}

function useVolumeControl(audioRef) {
  const [volume, setVolume] = useState(1)
  const [muted, setMuted] = useState(false)

  const applyVolume = (audio, nextVolume, nextMuted) => {
    if (!audio) return
    audio.volume = nextVolume
    audio.muted = nextMuted
  }

  const changeVolume = (nextVolume) => {
    setVolume(nextVolume)
    setMuted(nextVolume === 0)
    applyVolume(audioRef.current, nextVolume, nextVolume === 0)
  }

  const toggleMute = () => {
    setMuted(m => {
      const nextMuted = !m
      applyVolume(audioRef.current, volume, nextMuted)
      return nextMuted
    })
  }

  return { volume, muted, changeVolume, toggleMute }
}

function PlayerControls({ playing, buffering, onPlay, onPause, onStop, volume, muted, onVolumeChange, onToggleMute, disabled, className }) {
  return (
    <div className="music-player-controls">
      <button
        className={`${className || 'music-player-ctrl-btn'}${playing ? ' playing' : ''}`}
        onClick={playing ? onPause : onPlay}
        disabled={disabled || buffering}
        aria-label={playing ? 'Pause' : 'Play'}
        aria-pressed={playing}
      >
        {buffering ? (
          <span className="music-spinner music-ctrl-spinner" aria-hidden="true" />
        ) : playing ? (
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16" rx="1"/><rect x="14" y="4" width="4" height="16" rx="1"/></svg>
        ) : (
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><polygon points="6 4 20 12 6 20 6 4"/></svg>
        )}
        <span>{playing ? 'Pause' : 'Play'}</span>
      </button>
      <button
        className="music-player-ctrl-btn music-player-stop"
        onClick={onStop}
        disabled={disabled}
        aria-label="Stop"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="6" width="12" height="12" rx="1"/></svg>
        <span>Stop</span>
      </button>
      <div className="music-player-volume" role="group" aria-label="Volume">
        <button
          className="music-player-mute"
          onClick={onToggleMute}
          disabled={disabled}
          aria-label={muted ? 'Unmute' : 'Mute'}
          aria-pressed={muted}
        >
          {muted || volume === 0 ? (
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><line x1="23" y1="9" x2="17" y2="15"/><line x1="17" y1="9" x2="23" y2="15"/></svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/></svg>
          )}
        </button>
        <input
          type="range"
          className="music-player-range"
          min="0"
          max="100"
          value={muted ? 0 : Math.round(volume * 100)}
          onChange={e => onVolumeChange(Number(e.target.value) / 100)}
          aria-label="Volume"
          disabled={disabled}
        />
      </div>
    </div>
  )
}

function formatTime(sec) {
  if (!Number.isFinite(sec) || sec < 0) return '0:00'
  const s = Math.floor(sec)
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`
}

function formatRemaining(sec) {
  if (!Number.isFinite(sec) || sec <= 0) return '-0:00'
  const s = Math.floor(sec)
  return `-${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`
}

function AudioProgress({ audioRef, disabled }) {
  const [current, setCurrent] = useState(0)
  const [duration, setDuration] = useState(0)
  const [showRemaining, setShowRemaining] = useState(false)

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return
    const onTime = () => setCurrent(audio.currentTime || 0)
    const onDur = () => setDuration(Number.isFinite(audio.duration) && audio.duration > 0 ? audio.duration : 0)
    const onReset = () => { setCurrent(0); setDuration(0) }
    audio.addEventListener('timeupdate', onTime)
    audio.addEventListener('loadedmetadata', onDur)
    audio.addEventListener('durationchange', onDur)
    audio.addEventListener('ended', onReset)
    audio.addEventListener('emptied', onReset)
    return () => {
      audio.removeEventListener('timeupdate', onTime)
      audio.removeEventListener('loadedmetadata', onDur)
      audio.removeEventListener('durationchange', onDur)
      audio.removeEventListener('ended', onReset)
      audio.removeEventListener('emptied', onReset)
    }
  }, [audioRef])

  const seek = (e) => {
    const audio = audioRef.current
    if (!audio || !Number.isFinite(audio.duration) || audio.duration <= 0) return
    const val = Number(e.target.value)
    audio.currentTime = val
    setCurrent(val)
  }

  const max = duration > 0 ? Math.floor(duration) : 0
  const rightLabel = max
    ? (showRemaining ? formatRemaining(max - current) : formatTime(max))
    : ''

  return (
    <div className="music-progress">
      <span className="music-progress-time">{formatTime(current)}</span>
      <input
        type="range"
        className="music-progress-range"
        min="0"
        max={max || 1}
        step="1"
        value={Math.min(current, max || 0)}
        onChange={seek}
        disabled={disabled || !max}
        aria-label="Playback position"
      />
      <button
        type="button"
        className="music-progress-toggle"
        onClick={() => setShowRemaining(r => !r)}
        disabled={disabled || !max}
        aria-label={showRemaining ? 'Show elapsed time' : 'Show remaining time'}
        title={showRemaining ? 'Elapsed time' : 'Remaining time'}
      >
        {rightLabel}
      </button>
    </div>
  )
}

function LiveStreamProgress({ playing }) {
  const [elapsed, setElapsed] = useState(0)

  useEffect(() => {
    if (!playing) return
    const start = Date.now()
    const id = setInterval(() => {
      setElapsed(Math.floor((Date.now() - start) / 1000))
    }, 250)
    return () => clearInterval(id)
  }, [playing])

  if (!playing) return null
  return (
    <div className="music-progress music-live-progress">
      <span className="music-live-badge">LIVE</span>
      <span className="music-progress-time">{formatTime(elapsed)}</span>
    </div>
  )
}

function AudioStreamCard({ stream }) {
  const [playing, setPlaying] = useState(false)
  const [buffering, setBuffering] = useState(false)
  const [failed, setFailed] = useState(false)
  const audioRef = useRef(null)
  const { volume, muted, changeVolume, toggleMute } = useVolumeControl(audioRef)

  const startPlayback = (audio) => {
    if (activeAudio && activeAudio !== audio) activeAudio.pause()
    activeAudio = audio
    setFailed(false)
    audio.play()
      .then(() => setPlaying(true))
      .catch(() => setFailed(true))
  }

  const play = () => {
    const audio = audioRef.current
    if (!audio) return
    setBuffering(true)
    startPlayback(audio)
  }

  const pause = () => {
    const audio = audioRef.current
    if (!audio) return
    audio.pause()
    setPlaying(false)
  }

  const stop = () => {
    const audio = audioRef.current
    if (!audio) return
    audio.pause()
    audio.currentTime = 0
    setPlaying(false)
    if (activeAudio === audio) activeAudio = null
  }

  return (
    <div className="music-player-card">
      <div className="music-player-card-head">
        <div className="music-player-card-info">
          <div className="music-player-card-title">{stream.title}</div>
          <div className="music-player-card-subtitle">{stream.subtitle}</div>
        </div>
        {stream.badge && <span className="music-player-badge">{stream.badge}</span>}
      </div>
      <audio
        ref={audioRef}
        src={stream.url}
        preload="none"
        onPlaying={() => setBuffering(false)}
        onPause={() => setPlaying(false)}
        onEnded={() => setPlaying(false)}
        onError={() => { setPlaying(false); setBuffering(false); setFailed(true) }}
      />
      <PlayerControls
        playing={playing}
        buffering={buffering}
        onPlay={play}
        onPause={pause}
        onStop={stop}
        volume={volume}
        muted={muted}
        onVolumeChange={changeVolume}
        onToggleMute={toggleMute}
        disabled={failed}
      />
      <LiveStreamProgress playing={playing} />
      {failed && (
        <div className="music-player-fallback">
          <p>The stream could not be reached from this device. Check your connection and try again.</p>
        </div>
      )}
    </div>
  )
}

function SpotifyCard({ playlist }) {
  return (
    <div className="music-player-card">
      <div className="music-player-card-head">
        <div className="music-player-card-info">
          <div className="music-player-card-title">{playlist.title}</div>
          <div className="music-player-card-subtitle">{playlist.subtitle}</div>
        </div>
        <span className="music-player-badge">Spotify</span>
      </div>
      <div className="music-frame-wrap">
        <iframe
          className="music-embed-frame music-embed-spotify"
          src={`https://open.spotify.com/embed/playlist/${playlist.id}?utm_source=generator&theme=0`}
          title={playlist.title}
          loading="lazy"
          allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
        />
      </div>
    </div>
  )
}

function YouTubeCard({ song }) {
  return (
    <div className="music-player-card">
      <div className="music-player-card-head">
        <div className="music-player-card-info">
          <div className="music-player-card-title">{song.title}</div>
          <div className="music-player-card-subtitle">{song.subtitle}</div>
        </div>
        <span className="music-player-badge">YouTube</span>
      </div>
      <div className="music-frame-wrap">
        <iframe
          className="music-embed-frame music-embed-video"
          src={`https://www.youtube-nocookie.com/embed/${song.videoId}`}
          title={song.title}
          loading="lazy"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
        />
      </div>
    </div>
  )
}

function PraiseWorshipTab() {
  return (
    <div className="music-tab-content">
      <p className="music-tab-intro">
        Listen to live Christian music streams from AllWorship. Playback stays inside this app.
      </p>
      <div className="music-player-grid">
        {PRAISE_STREAMS.map((stream, i) => (
          <AudioStreamCard key={i} stream={stream} />
        ))}
      </div>
    </div>
  )
}

function SpotifyTab() {
  const [query, setQuery] = useState('')
  const results = SPOTIFY_PLAYLISTS.filter(pl => matchesQuery(pl, query))

  return (
    <div className="music-tab-content">
      <p className="music-tab-intro">
        Browse curated Christian playlists on Spotify. Search below for worship, praise, gospel, and more.
        Playback stays inside this app using Spotify's official embedded player.
      </p>
      <MusicSearchInput
        value={query}
        onChange={setQuery}
        placeholder="Search Christian playlists, e.g. worship or gospel"
      />
      <div className="music-player-grid">
        {results.map(pl => (
          <SpotifyCard key={pl.id} playlist={pl} />
        ))}
        {results.length === 0 && <MusicEmptyState query={query} />}
      </div>
      <p className="music-tab-note">
        Full-track playback on Spotify requires a Spotify account and may require a Premium subscription.
        Browsing and listening previews work inside this app without opening the browser.
      </p>
    </div>
  )
}

function BoomResultCard({ track }) {
  const [playing, setPlaying] = useState(false)
  const [buffering, setBuffering] = useState(false)
  const [failed, setFailed] = useState(false)
  const audioRef = useRef(null)
  const { volume, muted, changeVolume, toggleMute } = useVolumeControl(audioRef)

  const startPlayback = (audio) => {
    if (activeAudio && activeAudio !== audio) activeAudio.pause()
    activeAudio = audio
    setFailed(false)
    audio.play()
      .then(() => setPlaying(true))
      .catch(() => { setFailed(true); setPlaying(false) })
  }

  const play = () => {
    const audio = audioRef.current
    if (!audio || !track.previewUrl) return
    setBuffering(true)
    startPlayback(audio)
  }

  const pause = () => {
    const audio = audioRef.current
    if (!audio) return
    audio.pause()
    setPlaying(false)
  }

  const stop = () => {
    const audio = audioRef.current
    if (!audio) return
    audio.pause()
    audio.currentTime = 0
    setPlaying(false)
    if (activeAudio === audio) activeAudio = null
  }

  const fmtDuration = ms => {
    if (!ms) return ''
    const s = Math.round(ms / 1000)
    return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`
  }

  return (
    <div className="music-result-card">
      {track.artwork
        ? <img className="music-result-cover" src={track.artwork} alt={`${track.album} cover`} loading="lazy" />
        : <div className="music-result-cover music-result-cover-empty" aria-hidden="true" />}
      <div className="music-result-info">
        <div className="music-result-title">{track.title}</div>
        <div className="music-result-artist">{track.artist}</div>
        {track.album && <div className="music-result-album">{track.album}</div>}
        <div className="music-result-meta">
          {track.genre && <span className="music-result-genre">{track.genre}</span>}
          {track.previewUrl && <span className="music-result-preview">Preview</span>}
          {fmtDuration(track.durationMs) && <span className="music-result-duration">Full {fmtDuration(track.durationMs)}</span>}
        </div>
        {failed && (
          <div className="music-player-fallback">
            <p>This track cannot be played right now.</p>
          </div>
        )}
        <audio
          ref={audioRef}
          src={track.previewUrl}
          preload="none"
          onPlaying={() => setBuffering(false)}
          onPause={() => setPlaying(false)}
          onEnded={() => setPlaying(false)}
          onError={() => { setPlaying(false); setBuffering(false); setFailed(true) }}
        />
      </div>
      <PlayerControls
        playing={playing}
        buffering={buffering}
        onPlay={play}
        onPause={pause}
        onStop={stop}
        volume={volume}
        muted={muted}
        onVolumeChange={changeVolume}
        onToggleMute={toggleMute}
        disabled={!track.previewUrl}
        className="music-result-play"
      />
      <AudioProgress audioRef={audioRef} disabled={!track.previewUrl} />
    </div>
  )
}

function BoomTab() {
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState('idle')
  const [results, setResults] = useState([])
  const [searchedQuery, setSearchedQuery] = useState('')
  const [errorKind, setErrorKind] = useState('')
  const [errorMessage, setErrorMessage] = useState('')

  const runSearch = async (term) => {
    const trimmed = (term || '').trim()
    if (!trimmed) return
    setQuery(trimmed)
    setSearchedQuery(trimmed)
    setStatus('loading')
    setErrorKind('')
    setErrorMessage('')
    try {
      const found = await searchChristianMusicViaProxy(trimmed)
      if (found.length === 0) {
        setResults([])
        setStatus('empty')
      } else {
        setResults(found)
        setStatus('ready')
      }
    } catch (err) {
      const kind = err && err.kind ? err.kind : 'network'
      const message = err && err.message ? err.message : 'Unable to connect to the music service.'
      setErrorKind(kind)
      setErrorMessage(message)
      setResults([])
      setStatus('error')
    }
  }

  const errorMessageByKind = {
    network: 'Unable to connect to the music service. Please try again.',
    http: 'The music service could not complete the search. Please try again.',
    parse: 'The music service sent an unexpected response. Please try again.',
  }

  return (
    <div className="music-tab-content">
      <p className="music-tab-intro">
        Search and play specific Christian songs right inside this app. Enter a song, artist, or mood such as
        worship, praise, or gospel, or tap one of the suggestions below. Results come from the Apple Music
        catalogue and are filtered to Christian genres and known Christian artists.
      </p>
      <div className="music-search-row">
        <MusicSearchInput
          value={query}
          onChange={setQuery}
          onSubmit={() => runSearch(query)}
          placeholder="Search Christian songs, e.g. worship or gospel"
        />
        <button className="music-search-submit" onClick={() => runSearch(query)} disabled={status === 'loading'}>
          Search
        </button>
      </div>
      <div className="music-suggestion-row">
        {BOOM_SUGGESTIONS.map((label, i) => (
          <BoomSuggestionChip key={i} label={label} onClick={() => runSearch(label)} />
        ))}
      </div>

      {status === 'idle' && (
        <p className="music-status-hint">
          Try a search above, or pick a suggestion to find specific Christian songs and play them right here.
        </p>
      )}

      {status === 'loading' && (
        <div className="music-status-loading">
          <span className="music-spinner" aria-hidden="true" />
          <span>Searching for Christian music...</span>
        </div>
      )}

      {status === 'ready' && (
        <div className="music-results">
          <div className="music-results-heading">
            <h3 className="music-results-title">Christian Music</h3>
            <span className="music-results-meta">
              {results.length} {results.length === 1 ? 'track' : 'tracks'} for "{searchedQuery}"
            </span>
          </div>
          <div className="music-result-list">
            {results.map(track => (
              <BoomResultCard key={track.id} track={track} />
            ))}
          </div>
          <p className="music-tab-note">
            Results play an official preview sample from the Apple Music catalogue (about 30 seconds — the
            sample Apple Music provides for each song). The timeline below shows the actual sample length, and
            "Full" shows the complete track length. Full tracks play through Apple Music with a membership or
            purchase. Playback stays inside this app; nothing here artificially cuts a track short.
          </p>
        </div>
      )}

      {status === 'empty' && (
        <div className="music-empty-state">
          <h4 className="music-empty-title">No Christian music found for this search.</h4>
          <p className="music-empty-hint">Try a different keyword such as worship, praise, gospel, or an artist name.</p>
          <p className="music-empty-query">Search: "{searchedQuery}"</p>
        </div>
      )}

      {status === 'error' && (
        <div className="music-error-state" role="alert">
          <h4 className="music-error-title">We could not load Christian music.</h4>
          <p className="music-error-hint">
            {errorMessageByKind[errorKind] || errorMessage}
          </p>
          <button className="music-frame-retry" onClick={() => runSearch(searchedQuery)}>Retry</button>
        </div>
      )}

      <div className="music-boom-divider">
        <h3 className="music-boom-stations-title">Live Christian Stations</h3>
        <p className="music-boom-stations-note">
          Live Christian radio streams, played inside this app. These are different from the
          song search above: live station streams, not searchable songs. If a stream cannot load, it is
          temporarily unavailable from your location.
        </p>
      </div>
      <div className="music-player-grid">
        {BOOM_STREAMS.map((stream, i) => (
          <AudioStreamCard key={i} stream={stream} />
        ))}
      </div>
    </div>
  )
}

function YouTubeTab() {
  return (
    <div className="music-tab-content">
      <p className="music-tab-intro">
        Contemporary Christian worship videos from YouTube, played inside this app.
      </p>
      <div className="music-player-grid">
        {YOUTUBE_SONGS.map((song, i) => (
          <YouTubeCard key={i} song={song} />
        ))}
      </div>
    </div>
  )
}

export default function MusicView(props) {
  const [musicTab, setMusicTab] = useState('hymns')

  const handleTabChange = (id) => {
    if (id !== musicTab) stopActiveAudio()
    setMusicTab(id)
  }

  useEffect(() => stopActiveAudio, [])

  return (
    <div className="music-view">
      <nav className="music-sub-nav">
        {CATEGORIES.map(cat => (
          <button
            key={cat.id}
            className={`music-sub-tab${musicTab === cat.id ? ' active' : ''}`}
            onClick={() => handleTabChange(cat.id)}
          >
            {cat.label}
          </button>
        ))}
      </nav>

      <div className="music-sub-content">
        {musicTab === 'hymns' && (
          <HymnView
            hymnSearch={props.hymnSearch}
            setHymnSearch={props.setHymnSearch}
            hymnSort={props.hymnSort}
            setHymnSort={props.setHymnSort}
            hymnCategory={props.hymnCategory}
            setHymnCategory={props.setHymnCategory}
            hymnFavorites={props.hymnFavorites}
            hymnRecentlyViewed={props.hymnRecentlyViewed}
            selectedHymn={props.selectedHymn}
            openHymn={props.openHymn}
            closeHymn={props.closeHymn}
            toggleHymnFavorite={props.toggleHymnFavorite}
          />
        )}
        {musicTab === 'praise' && <PraiseWorshipTab />}
        {musicTab === 'spotify' && <SpotifyTab />}
        <div className="music-tab-pane" hidden={musicTab !== 'boom'}>
          <BoomTab />
        </div>
        {musicTab === 'youtube' && <YouTubeTab />}
      </div>
    </div>
  )
}