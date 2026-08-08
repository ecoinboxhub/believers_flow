const APPLE_MUSIC_SEARCH = 'https://itunes.apple.com/search'

const CHRISTIAN_GENRES = new Set(
  [
    'Christian', 'Christian & Gospel', 'Christian Pop', 'Christian Rock',
    'Christian Rap', 'Christian Hip-Hop', 'Christian R&B', 'Christian Country',
    'Christian Metal', 'CCM', 'Contemporary Christian', 'Praise & Worship',
    'Worship', 'Gospel', 'Gospel Rap', 'Contemporary Gospel', 'Traditional Gospel',
    'Southern Gospel', 'Gospel Music', 'Spanish Christian', 'African Gospel',
    'Hymn', 'Hymns', 'Devotional',
  ].map(g => g.toLowerCase())
)

const KNOWN_CHRISTIAN_ARTISTS = [
  'Lauren Daigle', 'Chris Tomlin', 'Hillsong Worship', 'Hillsong UNITED',
  'Elevation Worship', 'Maverick City Music', 'Bethel Music', 'Kari Jobe',
  'Phil Wickham', 'Casting Crowns', 'MercyMe', 'TobyMac', 'Jeremy Camp',
  'Michael W. Smith', 'Amy Grant', 'CeCe Winans', 'Kirk Franklin', 'Tasha Cobbs',
  'Travis Greene', 'Donnie McClurkin', 'Israel Houghton', 'Jonathan McReynolds',
  'Crowder', 'Passion', 'Zach Williams', 'Matthew West', 'Big Daddy Weave',
  'Newsboys', 'Third Day', 'Skillet', 'For KING & COUNTRY', 'Tauren Wells',
  'We The Kingdom', 'Cory Asbury', 'Brandon Lake', 'Kutless', 'Jesus Culture',
  'Don Moen', 'Ron Kenoly', 'Fred Hammond', 'William McDowell', 'Tye Tribbett',
]

class BoomSearchError extends Error {
  constructor(kind, message) {
    super(message)
    this.kind = kind
  }
}

export function isChristianResult(track) {
  const genre = (track.primaryGenreName || '').toLowerCase()
  if (CHRISTIAN_GENRES.has(genre)) return true
  const artist = (track.artistName || '').toLowerCase()
  return KNOWN_CHRISTIAN_ARTISTS.some(name => {
    const n = name.toLowerCase()
    return artist === n || artist.includes(n)
  })
}

export function toMusicResult(track) {
  return {
    id: track.trackId,
    title: track.trackName || 'Untitled',
    artist: track.artistName || 'Unknown artist',
    album: track.collectionName || '',
    artwork: track.artworkUrl100 || track.artworkUrl60 || '',
    previewUrl: track.previewUrl || '',
    genre: track.primaryGenreName || '',
    durationMs: track.trackTimeMillis || 0,
  }
}

export async function searchChristianMusic(query, limit = 24) {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 20000)
  const params = new URLSearchParams({
    term: query,
    entity: 'song',
    media: 'music',
    limit: String(limit),
    country: 'US',
  })
  const url = `${APPLE_MUSIC_SEARCH}?${params.toString()}`
  console.info('[boom] search request', { term: query, limit })
  let res
  try {
    res = await fetch(url, { signal: controller.signal })
  } catch (err) {
    console.warn('[boom] network failure', err.name === 'AbortError' ? 'timeout' : err.message)
    throw new BoomSearchError('network', 'Unable to connect to the music service.')
  } finally {
    clearTimeout(timeout)
  }
  if (!res.ok) {
    console.warn('[boom] search response error', { status: res.status, statusText: res.statusText })
    throw new BoomSearchError('http', `The music service returned an error (${res.status}).`)
  }
  let data
  try {
    data = await res.json()
  } catch (err) {
    console.error('[boom] parse failure', err.message)
    throw new BoomSearchError('parse', 'The music service sent an unexpected response.')
  }
  const all = Array.isArray(data.results) ? data.results : []
  console.info('[boom] search response', { status: res.status, rawResults: all.length })
  const christian = all.filter(isChristianResult)
  console.info('[boom] christian results after filtering', { count: christian.length })
  return christian.map(toMusicResult)
}