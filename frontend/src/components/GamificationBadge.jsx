import { useState, useEffect, useCallback } from 'react'

const token = () => localStorage.getItem('bf_token')
const hasValidToken = () => {
  const t = token()
  if (!t || t === 'null' || t === 'undefined' || t.split('.').length < 3) return false
  try { const p = JSON.parse(atob(t.split('.')[1])); return !(p.exp && p.exp * 1000 < Date.now()) } catch { return false }
}
const API = import.meta.env.VITE_API_URL || ''

const LEVELS = [
  { level: 1, title: 'Seeker', color: '#94a3b8', points: 0 },
  { level: 2, title: 'Believer', color: '#cd7f32', points: 100 },
  { level: 3, title: 'Disciple', color: '#cd7f32', points: 500 },
  { level: 4, title: 'Faithful', color: '#c0c0c0', points: 1500 },
  { level: 5, title: 'Servant', color: '#c0c0c0', points: 3000 },
  { level: 6, title: 'Minister', color: '#ffd700', points: 6000 },
  { level: 7, title: 'Elder', color: '#ffd700', points: 12000 },
  { level: 8, title: 'Leader', color: '#e5e4e2', points: 25000 },
  { level: 9, title: 'Shepherd', color: '#e5e4e2', points: 50000 },
  { level: 10, title: 'Steward', color: '#b9f2ff', points: 100000 },
]

function getLevelForPoints(points) {
  let current = LEVELS[0]
  for (const lvl of LEVELS) {
    if (points >= lvl.points) current = lvl
    else break
  }
  return current
}

function getNextLevel(currentLevel) {
  return LEVELS.find((l) => l.level === currentLevel + 1) || null
}

function ShieldIcon({ color, size = 28 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M12 2L4 6v5c0 5.25 3.4 10.15 8 11.35C16.6 21.15 20 16.25 20 11V6l-8-4z"
        fill={color}
        opacity={0.85}
      />
      <path
        d="M12 2L4 6v5c0 5.25 3.4 10.15 8 11.35C16.6 21.15 20 16.25 20 11V6l-8-4z"
        stroke={color}
        strokeWidth={1.5}
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  )
}

function FlameIcon({ size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M12 23c-4.97 0-8-3.58-8-8 0-3.19 2.13-6.08 3.5-7.5.36-.37.96-.13.96.35 0 1.64.98 3.15 2.54 3.15.43 0 .79-.33.79-.75 0-1.22.76-2.53 2.21-2.53 1.02 0 1.86.58 1.86 1.87 0 .38.32.68.69.58C18.64 7.89 20 5.64 20 3c0-1-.84-1.74-1.67-1.36C14.45 3.12 12 7.28 12 12c0 0 0 0 0 0 .01-1.62.67-3.88 2-5.16.27-.26.7-.04.7.33 0 1.07.6 1.83 1.5 1.83.42 0 .75-.34.75-.75 0-.99-.6-2.33-2.25-3.25-.35-.2-.76.17-.55.54.69 1.21 1.05 2.5 1.05 3.76 0 4.2-2.15 8.14-5.2 10.64-.23.19-.56.27-.88.22-.5-.08-.86-.55-.86-1.06 0-1.02-.61-2.22-2-2.22-1.1 0-2 .9-2 2 0 3.56 2.32 6 6 6z"
        fill="#ff6b35"
      />
    </svg>
  )
}

function BookIcon({ size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M4 4.5A2.5 2.5 0 016.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15zM12 7a3 3 0 00-3 3v1a3 3 0 006 0v-1a3 3 0 00-3-3z"
        stroke="#c084fc"
        strokeWidth={1.5}
        strokeLinejoin="round"
      />
      <path d="M2 4h3v16H2V4z" fill="#c084fc" opacity={0.3} />
      <path
        d="M20 4.5V20l-8-2.5L4 20V4.5A2.5 2.5 0 016.5 2H20v.5z"
        stroke="#c084fc"
        strokeWidth={1.5}
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  )
}

function StarIcon({ size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M12 2l2.9 5.87L21 9.27l-4.5 4.38 1.06 6.18L12 17.27l-5.56 2.56 1.06-6.18L3 9.27l6.1-1.4L12 2z"
        fill="#fbbf24"
        stroke="#f59e0b"
        strokeWidth={1}
        strokeLinejoin="round"
      />
    </svg>
  )
}

function ChevronDown({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export default function GamificationBadge({ isPremium = false, compact = false }) {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState(false)

  const fetchStats = useCallback(async () => {
    if (!hasValidToken()) {
      setLoading(false)
      return
    }
    try {
      const res = await fetch(`${API}/api/community/gamification/me`, {
        headers: { Authorization: `Bearer ${token()}` },
      })
      if (!res.ok) throw new Error('Failed to fetch')
      const data = await res.json()
      setStats(data)
    } catch {
      setStats(null)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchStats()
  }, [fetchStats])

  if (loading) {
    return (
      <div className="view fade-in" style={{ padding: compact ? 4 : 12, opacity: 0.5 }}>
        <span style={{ fontSize: 12, color: '#94a3b8' }}>Loading...</span>
      </div>
    )
  }

  if (!stats) return null

  const currentLevel = getLevelForPoints(stats.totalPoints || 0)
  const nextLevel = getNextLevel(currentLevel.level)
  const progress = nextLevel
    ? ((stats.totalPoints - currentLevel.points) / (nextLevel.points - currentLevel.points)) * 100
    : 100

  if (compact) {
    return (
      <div
        className="view fade-in"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 8,
          padding: '4px 10px',
          borderRadius: 20,
          background: 'rgba(255,255,255,0.05)',
          cursor: 'default',
          userSelect: 'none',
        }}
        title={`Level ${currentLevel.level} ${currentLevel.title} · ${stats.totalPoints} pts`}
      >
        <span style={{ position: 'relative', display: 'inline-flex' }}>
          <ShieldIcon color={currentLevel.color} size={24} />
          <span
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 10,
              fontWeight: 700,
              color: '#fff',
              textShadow: '0 1px 2px rgba(0,0,0,0.5)',
            }}
          >
            {currentLevel.level}
          </span>
        </span>
        {stats.streaks?.prayer > 0 && (
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 3,
              fontSize: 12,
              fontWeight: 600,
              color: '#ff6b35',
            }}
          >
            <FlameIcon size={14} />
            {stats.streaks.prayer}
          </span>
        )}
      </div>
    )
  }

  const streakCards = [
    { key: 'prayer', label: 'Prayer', icon: <FlameIcon size={20} />, value: stats.streaks?.prayer || 0, color: '#ff6b35' },
    { key: 'bible', label: 'Bible', icon: <BookIcon size={20} />, value: stats.streaks?.bible || 0, color: '#c084fc' },
    { key: 'devotion', label: 'Devotion', icon: <StarIcon size={20} />, value: stats.streaks?.devotion || 0, color: '#fbbf24' },
  ]

  const recentBadges = (stats.badges || []).slice(-6).reverse()
  const recentActivity = (stats.recentActivity || []).slice(0, 5)

  return (
    <div className="view fade-in" style={{ maxWidth: 420 }}>
      <button
        type="button"
        onClick={() => setExpanded((e) => !e)}
        className="card"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 14,
          width: '100%',
          padding: '14px 16px',
          border: 'none',
          borderRadius: 12,
          background: isPremium
            ? 'linear-gradient(135deg, rgba(251,191,36,0.12), rgba(185,242,255,0.08))'
            : 'rgba(255,255,255,0.06)',
          color: '#e2e8f0',
          cursor: 'pointer',
          textAlign: 'left',
        }}
        aria-expanded={expanded}
        aria-label="Toggle gamification details"
      >
        <span style={{ position: 'relative', display: 'inline-flex', flexShrink: 0 }}>
          <ShieldIcon color={currentLevel.color} size={36} />
          <span
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 14,
              fontWeight: 700,
              color: '#fff',
              textShadow: '0 1px 2px rgba(0,0,0,0.5)',
            }}
          >
            {currentLevel.level}
          </span>
        </span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: currentLevel.color }}>
            {currentLevel.title}
          </div>
          <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>
            {stats.totalPoints?.toLocaleString()} pts
            {nextLevel && (
              <span> · {(nextLevel.points - (stats.totalPoints || 0)).toLocaleString()} to next</span>
            )}
          </div>
        </div>
        <span
          style={{
            color: '#94a3b8',
            transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 0.25s ease',
          }}
        >
          <ChevronDown size={18} />
        </span>
      </button>

      <div
        style={{
          maxHeight: expanded ? 600 : 0,
          opacity: expanded ? 1 : 0,
          overflow: 'hidden',
          transition: 'max-height 0.35s ease, opacity 0.25s ease',
        }}
        aria-hidden={!expanded}
      >
        <div className="community-card" style={{ padding: '16px 0' }}>
          <div style={{ padding: '0 16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#94a3b8', marginBottom: 4 }}>
              <span>Level {currentLevel.level}</span>
              {nextLevel && <span>Level {nextLevel.level}</span>}
            </div>
            <div
              style={{
                height: 6,
                borderRadius: 3,
                background: 'rgba(255,255,255,0.08)',
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  width: `${Math.min(progress, 100)}%`,
                  height: '100%',
                  borderRadius: 3,
                  background: `linear-gradient(90deg, ${currentLevel.color}, ${nextLevel?.color || currentLevel.color})`,
                  transition: 'width 0.6s ease',
                }}
              />
            </div>
            {nextLevel && (
              <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 4 }}>
                {(stats.totalPoints || 0).toLocaleString()} / {nextLevel.points.toLocaleString()} pts
              </div>
            )}
          </div>

          <div
            className="community-badge"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              marginTop: 16,
              padding: '0 16px',
            }}
          >
            <ShieldIcon color={currentLevel.color} size={20} />
            <span style={{ fontSize: 13, fontWeight: 600, color: currentLevel.color }}>
              {currentLevel.title}
            </span>
            {isPremium && (
              <span
                style={{
                  marginLeft: 'auto',
                  fontSize: 10,
                  fontWeight: 600,
                  padding: '2px 8px',
                  borderRadius: 10,
                  background: 'rgba(251,191,36,0.15)',
                  color: '#fbbf24',
                }}
              >
                PREMIUM
              </span>
            )}
          </div>

          <div style={{ display: 'flex', gap: 10, marginTop: 16, padding: '0 16px' }}>
            {streakCards.map((card) => (
              <div
                key={card.key}
                className="card"
                style={{
                  flex: 1,
                  padding: '10px 8px',
                  borderRadius: 10,
                  background: 'rgba(255,255,255,0.04)',
                  textAlign: 'center',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 4 }}>{card.icon}</div>
                <div style={{ fontSize: 18, fontWeight: 700, color: card.color }}>
                  {card.value}
                </div>
                <div style={{ fontSize: 10, color: '#94a3b8', marginTop: 2 }}>{card.label}</div>
              </div>
            ))}
          </div>

          {recentBadges.length > 0 && (
            <div style={{ marginTop: 16, padding: '0 16px' }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: '#94a3b8', marginBottom: 8 }}>Recent Badges</div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {recentBadges.map((badge, i) => (
                  <div
                    key={badge.id || i}
                    className="community-badge"
                    style={{
                      padding: '6px 10px',
                      borderRadius: 8,
                      background: 'rgba(255,255,255,0.06)',
                      fontSize: 11,
                      color: '#e2e8f0',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4,
                    }}
                    title={badge.description || badge.name}
                  >
                    <span>{badge.icon || '🏅'}</span>
                    <span>{badge.name || 'Badge'}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {recentActivity.length > 0 && (
            <div style={{ marginTop: 16, padding: '0 16px' }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: '#94a3b8', marginBottom: 8 }}>Recent Activity</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {recentActivity.map((action, i) => (
                  <div
                    key={action.id || i}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '6px 10px',
                      borderRadius: 6,
                      background: 'rgba(255,255,255,0.03)',
                      fontSize: 12,
                    }}
                  >
                    <span style={{ color: '#cbd5e1' }}>{action.description || action.type}</span>
                    <span
                      style={{
                        fontWeight: 600,
                        color: action.points > 0 ? '#4ade80' : '#f87171',
                        flexShrink: 0,
                        marginLeft: 8,
                      }}
                    >
                      {action.points > 0 ? '+' : ''}{action.points}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
