import { useState } from 'react'
import HymnView from './HymnView.jsx'

const CATEGORIES = [
  { id: 'hymns', label: 'Hymns' },
  { id: 'praise', label: 'Praise & Worship' },
  { id: 'spotify', label: 'Spotify Christian' },
  { id: 'boom', label: 'Boom Christian' },
  { id: 'youtube', label: 'YouTube Contemporary' },
]

const PRAISE_LINKS = [
  {
    title: 'Hillsong Worship',
    subtitle: 'Official worship music from Hillsong Church',
    url: 'https://hillsong.com/worship/',
    color: '#e74c3c',
    icon: null,
    description: 'Contemporary worship songs and albums'
  },
  {
    title: 'SoundCloud Worship',
    subtitle: 'Discover independent Christian artists',
    url: 'https://soundcloud.com/search/sounds?q=christian%20worship',
    color: '#ff7700',
    icon: null,
    description: 'Thousands of worship mixes and covers'
  },
  {
    title: 'AllWorship.com',
    subtitle: '24/7 Christian music streams',
    url: 'https://www.allworship.com/',
    color: '#3498db',
    icon: null,
    description: 'Continuous worship radio streams'
  },
]

const SPOTIFY_LINKS = [
  {
    title: 'Top Christian Hits',
    subtitle: 'Curated playlist of top Christian songs',
    url: 'https://open.spotify.com/playlist/37i9dQZF1DX6aTaZa0K6VA',
    icon: null,
    description: 'Top Christian contemporary hits on Spotify'
  },
  {
    title: 'Worship Today',
    subtitle: 'Best of modern worship music',
    url: 'https://open.spotify.com/playlist/37i9dQZF1DX2sUQwD1tE1Q',
    icon: null,
    description: 'Latest worship songs updated weekly'
  },
  {
    title: 'Christian Focus',
    subtitle: 'Faith-filled music for every day',
    url: 'https://open.spotify.com/playlist/37i9dQZF1DX1MUpbNU7sBJ',
    icon: null,
    description: 'Uplifting Christian music playlist'
  },
]

const BOOM_LINKS = [
  {
    title: 'Boom Christian Music',
    subtitle: 'Stream Christian & Gospel music free',
    url: 'https://boomcharlotte.com/genre/christian/',
    icon: null,
    description: 'Free Christian music streaming platform'
  },
  {
    title: 'Boom Gospel',
    subtitle: 'Gospel music collection',
    url: 'https://boomcharlotte.com/genre/gospel/',
    icon: null,
    description: 'Traditional and contemporary gospel'
  },
  {
    title: 'Boom Praise',
    subtitle: 'Praise & Worship channel',
    url: 'https://boomcharlotte.com/genre/praise-and-worship/',
    icon: null,
    description: 'Non-stop praise and worship music'
  },
]

const YOUTUBE_LINKS = [
  {
    title: 'Elevation Worship',
    subtitle: 'Contemporary worship from Elevation Church',
    url: 'https://www.youtube.com/@ElevationWorship',
    icon: null,
    description: 'Modern worship songs and live performances'
  },
  {
    title: 'Bethel Music',
    subtitle: 'Worship music from Bethel Church',
    url: 'https://www.youtube.com/@bethelmusic',
    icon: null,
    description: 'Original worship songs and albums'
  },
  {
    title: 'Maverick City Music',
    subtitle: 'Contemporary gospel collective',
    url: 'https://www.youtube.com/@MaverickCityMusic',
    icon: null,
    description: 'Diverse worship and gospel music'
  },
  {
    title: 'Hillsong Worship',
    subtitle: 'Official Hillsong worship channel',
    url: 'https://www.youtube.com/@hillsongworship',
    icon: null,
    description: 'Worship songs and live recordings from Hillsong'
  },
  {
    title: 'Kim Walker-Smith',
    subtitle: 'Worship leader and singer',
    url: 'https://www.youtube.com/@kimwalkersmith',
    icon: null,
    description: 'Original worship music and covers'
  },
]

function LinkCard({ item }) {
  return (
    <a
      href={item.url}
      target="_blank"
      rel="noopener noreferrer"
      className="music-link-card"
      style={item.color ? { borderLeftColor: item.color } : undefined}
    >
      <div className="music-link-icon">{item.icon}</div>
      <div className="music-link-info">
        <div className="music-link-title">{item.title}</div>
        <div className="music-link-subtitle">{item.subtitle}</div>
        <div className="music-link-desc">{item.description}</div>
      </div>
      <div className="music-link-arrow">↗</div>
    </a>
  )
}

function PraiseWorshipTab() {
  return (
    <div className="music-tab-content">
      <p className="music-tab-intro">
        Discover praise and worship music from leading Christian artists and platforms.
      </p>
      <div className="music-links-grid">
        {PRAISE_LINKS.map((item, i) => (
          <LinkCard key={i} item={item} />
        ))}
      </div>
    </div>
  )
}

function SpotifyTab() {
  return (
    <div className="music-tab-content">
      <p className="music-tab-intro">
        Listen to curated Christian playlists on Spotify. Click to open in the Spotify app or web player.
      </p>
      <div className="music-links-grid">
        {SPOTIFY_LINKS.map((item, i) => (
          <LinkCard key={i} item={item} />
        ))}
      </div>
      <p className="music-tab-note">
        <span style={{width:16,height:16,verticalAlign:'middle',marginRight:4}}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"/>
            <line x1="12" y1="16" x2="12" y2="12"/>
            <line x1="12" y1="8" x2="12.01" y2="8"/>
          </svg>
        </span>
        Open these links on your phone to play directly in the Spotify app.
      </p>
    </div>
  )
}

function BoomTab() {
  return (
    <div className="music-tab-content">
      <p className="music-tab-intro">
        Stream Christian and Gospel music for free on Boom Charlotte.
      </p>
      <div className="music-links-grid">
        {BOOM_LINKS.map((item, i) => (
          <LinkCard key={i} item={item} />
        ))}
      </div>
    </div>
  )
}

function YouTubeTab() {
  return (
    <div className="music-tab-content">
      <p className="music-tab-intro">
        Subscribe to these YouTube channels for contemporary Christian music and worship.
      </p>
      <div className="music-links-grid">
        {YOUTUBE_LINKS.map((item, i) => (
          <LinkCard key={i} item={item} />
        ))}
      </div>
    </div>
  )
}

export default function MusicView(props) {
  const [musicTab, setMusicTab] = useState('hymns')

  return (
    <div className="music-view">
      <nav className="music-sub-nav">
        {CATEGORIES.map(cat => (
          <button
            key={cat.id}
            className={`music-sub-tab${musicTab === cat.id ? ' active' : ''}`}
            onClick={() => setMusicTab(cat.id)}
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
            hymnPlaying={props.hymnPlaying}
            openHymn={props.openHymn}
            closeHymn={props.closeHymn}
            toggleHymnFavorite={props.toggleHymnFavorite}
            toggleHymnPlay={props.toggleHymnPlay}
          />
        )}
        {musicTab === 'praise' && <PraiseWorshipTab />}
        {musicTab === 'spotify' && <SpotifyTab />}
        {musicTab === 'boom' && <BoomTab />}
        {musicTab === 'youtube' && <YouTubeTab />}
      </div>
    </div>
  )
}
