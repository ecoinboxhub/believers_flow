import { describe, it, expect, beforeAll } from 'vitest'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { renderToString } from 'react-dom/server'
import React from 'react'
import { HYMNS } from '../hymns.js'
import HymnView from '../components/HymnView.jsx'
import { isChristianResult } from '../music/christianMusic.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const MUSIC_VIEW_PATH = join(__dirname, '..', 'components', 'MusicView.jsx')
const HYMN_VIEW_PATH = join(__dirname, '..', 'components', 'HymnView.jsx')
const MUSIC_CATALOG_PATH = join(__dirname, '..', 'music', 'christianMusic.js')

let musicSource, hymnSource, musicCatalogSource
beforeAll(() => {
  musicSource = readFileSync(MUSIC_VIEW_PATH, 'utf8')
  hymnSource = readFileSync(HYMN_VIEW_PATH, 'utf8')
  musicCatalogSource = readFileSync(MUSIC_CATALOG_PATH, 'utf8')
})

const baseProps = {
  hymnSearch: '', setHymnSearch: () => {},
  hymnSort: 'number', setHymnSort: () => {},
  hymnCategory: 'all', setHymnCategory: () => {},
  hymnFavorites: [], hymnRecentlyViewed: [],
  selectedHymn: null, openHymn: () => {}, closeHymn: () => {},
  toggleHymnFavorite: () => {},
}

describe('MusicView — in-app playback, no external redirects', () => {
  it('contains no external link cards or browser redirects', () => {
    expect(musicSource).not.toMatch(/href=|<a\s|window\.open|target="_blank"/)
    expect(musicSource).not.toContain('music-link-card')
    expect(musicSource).not.toContain('↗')
  })

  it('embeds audio via in-app <audio> elements for praise streams', () => {
    expect(musicSource).toContain('<audio')
    expect(musicSource).toContain('ice66.securenetsystems.net')
    expect(musicSource).toContain('ice25.securenetsystems.net')
  })

  it('embeds official Spotify and YouTube players inside the app', () => {
    expect(musicSource).toContain('open.spotify.com/embed/playlist')
    expect(musicSource).toContain('youtube-nocookie.com/embed')
  })

  it('keeps the Boom stations embedded in-app with a graceful fallback', () => {
    expect(musicSource).toContain('boomcharlotte.com/genre')
    expect(musicSource).toContain('music-frame-fallback')
    expect(musicSource).toContain('music-frame-retry')
  })

  it('searches a live Christian music catalogue in-app instead of returning nothing', () => {
    expect(musicSource).toContain('searchChristianMusic')
    expect(musicSource).toContain('Searching for Christian music...')
    expect(musicCatalogSource).toContain('https://itunes.apple.com/search')
    expect(musicCatalogSource).toContain('CHRISTIAN_GENRES')
    expect(musicCatalogSource).toContain('KNOWN_CHRISTIAN_ARTISTS')
  })

  it('renders loading, empty, and error states so Boom never fails silently', () => {
    expect(musicSource).toContain('No Christian music found for this search.')
    expect(musicSource).toContain('We could not load Christian music.')
    expect(musicSource).toContain('Unable to connect to the music service')
    expect(musicSource).toContain('This track cannot be played right now.')
    expect(musicSource).toContain('music-status-loading')
    expect(musicSource).toContain('music-empty-state')
    expect(musicSource).toContain('music-error-state')
    expect(musicSource).toContain('Retry')
  })

  it('keeps Christian song search separate from live station streams', () => {
    expect(musicSource).toContain("id: 'boom'")
    expect(musicSource).toContain('music-results-heading')
    expect(musicSource).toContain('Christian Music')
    expect(musicSource).toContain('Live Christian Stations')
    expect(musicSource).toContain('Search Christian songs')
  })

  it('filters Christian content on reliable provider metadata, not just the word Christian', () => {
    expect(musicCatalogSource).toContain('primaryGenreName')
    expect(musicCatalogSource).toContain('Lauren Daigle')
    expect(musicCatalogSource).toContain('Hillsong Worship')
  })

  it('plays previews inside the app via an audio element', () => {
    expect(musicSource).toContain('previewUrl')
    expect(musicSource).toContain('<audio')
    expect(musicSource).toContain('music-result-play')
  })

  it('keeps the five music categories with a styled sub-tab nav', () => {
    expect(musicSource).toContain("id: 'hymns'")
    expect(musicSource).toContain("id: 'praise'")
    expect(musicSource).toContain("id: 'spotify'")
    expect(musicSource).toContain("id: 'boom'")
    expect(musicSource).toContain("id: 'youtube'")
    expect(musicSource).toContain('music-sub-tab')
  })

  it('provides consistent Play, Pause, Stop, and Volume controls in-app', () => {
    expect(musicSource).toContain('PlayerControls')
    expect(musicSource).toContain('music-player-controls')
    expect(musicSource).toContain('music-player-ctrl-btn')
    expect(musicSource).toContain('music-player-stop')
    expect(musicSource).toContain('music-player-mute')
    expect(musicSource).toContain('music-player-range')
    expect(musicSource).toContain('type="range"')
    expect(musicSource).toContain('Pause')
    expect(musicSource).toContain('Stop')
    expect(musicSource).toContain('Volume')
  })

  it('offers a time display toggle (elapsed vs remaining) that never restarts playback', () => {
    expect(musicSource).toContain('music-progress-toggle')
    expect(musicSource).toContain('Show remaining time')
    expect(musicSource).toContain('Show elapsed time')
    expect(musicSource).toContain('formatRemaining')
    expect(musicSource).toMatch(/formatRemaining\(max - current\)/)
  })

  it('shows a live elapsed indicator for radio streams instead of a fake duration', () => {
    expect(musicSource).toContain('LiveStreamProgress')
    expect(musicSource).toContain('music-live-badge')
    expect(musicSource).toContain('music-live-progress')
    expect(musicSource).toMatch(/LIVE/)
  })

  it('labels preview samples and full track length honestly', () => {
    expect(musicSource).toContain('music-result-preview')
    expect(musicSource).toContain('Full ')
    expect(musicSource).toContain('official preview sample')
    expect(musicSource).not.toMatch(/fake/)
  })

  it('prevents overlapping players when switching music tabs', () => {
    expect(musicSource).toContain('stopActiveAudio')
    expect(musicSource).toContain('handleTabChange')
  })
})

describe('HymnView — clean structured layout, no mismatched audio', () => {
  it('uses SVG icons instead of ASCII chevron glyphs', () => {
    expect(hymnSource).not.toContain("{'>'}")
    expect(hymnSource).not.toContain("{'<'}")
    expect(hymnSource).not.toContain("{'x'}")
    expect(hymnSource).toContain('polyline points="15 18 9 12 15 6"')
    expect(hymnSource).toContain('line x1="18" y1="6"')
  })

  it('removes audio playback that does not match hymn lyrics', () => {
    expect(hymnSource).not.toContain('toggleHymnPlay')
    expect(hymnSource).not.toContain('hymn-player-controls')
    expect(hymnSource).not.toContain('hymn-play-btn')
    expect(hymnSource).not.toContain('hymn-has-tune')
    expect(hymnSource).not.toContain('HYMN_WITH_TUNES')
  })

  it('displays hymn titles in well-formatted natural language', () => {
    expect(hymnSource).toContain('hymn-detail-number')
    expect(hymnSource).toContain('hymn-detail-title')
    expect(hymnSource).toContain('hymn-detail-author')
    expect(hymnSource).toContain('hymn-daily-title')
  })

  it('renders lyrics as separated verse groups preserving formatting', () => {
    expect(hymnSource).toContain('hymn-detail-lyrics')
    expect(hymnSource).toContain('hymn-verse-group')
    expect(hymnSource).toContain('hymn-lyric-line')
    expect(hymnSource).toMatch(/selectedHymn\.lyrics/)
    expect(hymnSource).toMatch(/Verse \$\{vi \+ 1\}/)
  })

  it('splits stanzas cleanly, trimming stray whitespace', () => {
    expect(hymnSource).toContain('splitStanzas')
    expect(hymnSource).toMatch(/line\.trim\(\) !== ''/)
    expect(hymnSource).toMatch(/current\.push\(line\.trim\(\)\)/)
  })

  it('keeps favorites, search, categories, sort and sharing intact', () => {
    expect(hymnSource).toContain('toggleHymnFavorite')
    expect(hymnSource).toContain('hymn-search-box')
    expect(hymnSource).toContain('hymn-cat-btn')
    expect(hymnSource).toContain('hymn-sort-btn')
    expect(hymnSource).toContain('handleShare')
  })
})

describe('HymnView — renders without runtime errors', () => {
  it('renders the book list without crashing', () => {
    const html = renderToString(React.createElement(HymnView, baseProps))
    expect(html).toContain('hymn-search-box')
    expect(html).toContain('Hymn Book')
  })

  it('renders a multi-stanza hymn detail with numbered verses', () => {
    const multiStanza = HYMNS.find(h => h.lyrics.includes('\n\n'))
    const html = renderToString(React.createElement(HymnView, { ...baseProps, selectedHymn: multiStanza }))
    expect(html).toContain('hymn-detail-title')
    expect(html).toContain('Verse 1')
    expect(html).toContain('Verse 2')
    expect(html).toContain(multiStanza.title)
  })

  it('renders a single-stanza hymn detail without verse numbering', () => {
    const single = HYMNS.find(h => !h.lyrics.includes('\n\n'))
    const html = renderToString(React.createElement(HymnView, { ...baseProps, selectedHymn: single }))
    expect(html).toContain('hymn-detail-title')
    expect(html).not.toMatch(/Verse \d/)
  })

  it('renders every hymn in the book without crashing', () => {
    for (const h of HYMNS) {
      const html = renderToString(React.createElement(HymnView, { ...baseProps, selectedHymn: h }))
      expect(html).toContain('hymn-detail-lyrics')
    }
  })
})

describe('isChristianResult — Christian metadata validation', () => {
  it('accepts tracks whose provider genre is a Christian genre', () => {
    expect(isChristianResult({ primaryGenreName: 'Christian', artistName: 'Elevation Worship' })).toBe(true)
    expect(isChristianResult({ primaryGenreName: 'Gospel', artistName: 'Marvin Sapp' })).toBe(true)
    expect(isChristianResult({ primaryGenreName: 'CCM', artistName: 'Various' })).toBe(true)
  })

  it('accepts tracks by known Christian artists even under a generic genre', () => {
    expect(isChristianResult({ primaryGenreName: 'Pop', artistName: 'Lauren Daigle' })).toBe(true)
    expect(isChristianResult({ primaryGenreName: 'Country', artistName: 'Chris Tomlin' })).toBe(true)
  })

  it('rejects secular tracks that merely include the word Christian in metadata but are not Christian', () => {
    const secularJazz = { primaryGenreName: 'Jazz', artistName: 'Morning Jazz Background Club', title: 'Christian Worship' }
    const secularHoliday = { primaryGenreName: 'Holiday', artistName: 'Carolers United', title: 'Christian Worship' }
    expect(isChristianResult(secularJazz)).toBe(false)
    expect(isChristianResult(secularHoliday)).toBe(false)
  })

  it('accepts legitimate worship songs whose titles do not mention the word Christian', () => {
    expect(isChristianResult({ primaryGenreName: 'Christian', artistName: 'Leeland', title: 'Way Maker' })).toBe(true)
    expect(isChristianResult({ primaryGenreName: 'Gospel', artistName: 'Sinach', title: 'Way Maker' })).toBe(true)
    expect(isChristianResult({ primaryGenreName: 'Christian', artistName: 'Elevation Worship', title: 'Trust In God' })).toBe(true)
  })
})
