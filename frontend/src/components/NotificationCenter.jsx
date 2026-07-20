import { useState, useEffect, useRef, useCallback } from 'react'

const token = () => localStorage.getItem('bf_token')
const hasValidToken = () => {
  const t = token()
  if (!t || t === 'null' || t === 'undefined' || t.split('.').length < 3) return false
  try { const p = JSON.parse(atob(t.split('.')[1])); return !(p.exp && p.exp * 1000 < Date.now()) } catch { return false }
}
const API = import.meta.env.VITE_API_URL || ''

const TIME_AGO_THRESHOLDS = [
  { label: 'just now', max: 60000 },
  { label: 'm ago', divisor: 60000 },
  { label: 'h ago', divisor: 3600000 },
  { label: 'd ago', divisor: 86400000 },
]

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime()
  if (diff < TIME_AGO_THRESHOLDS[0].max) return TIME_AGO_THRESHOLDS[0].label
  for (let i = 1; i < TIME_AGO_THRESHOLDS.length; i++) {
    const t = TIME_AGO_THRESHOLDS[i]
    if (diff < t.divisor * 2) return `1${t.label}`
    const val = Math.floor(diff / t.divisor)
    if (val < 60 || i === TIME_AGO_THRESHOLDS.length - 1) return `${val}${t.label}`
  }
  return 'just now'
}

const ICONS = {
  'prayer.prayed': (props) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M7 11c-.5-1.5.2-3.2 1.7-3.8C10 6.6 11 5 12 4c1 1 2 2.6 2.3 3.2 1.5.6 2.2 2.3 1.7 3.8" />
      <path d="M12 11v4" />
      <path d="M9 21v-3c0-1.1.9-2 2-2h2c1.1 0 2 .9 2 2v3" />
      <path d="M8 14c-2 0-4 1-5 3" />
      <path d="M16 14c2 0 4 1 5 3" />
    </svg>
  ),
  'prayer.answered': (props) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <circle cx="12" cy="12" r="10" />
      <path d="M8 12l3 3 5-5" />
    </svg>
  ),
  'group.post': (props) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 00-3-3.87" />
      <path d="M16 3.13a4 4 0 010 7.75" />
    </svg>
  ),
  'group.welcome': (props) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M7 11c-2 0-4-1.5-4-4s2-4 4-4" />
      <path d="M17 11c2 0 4-1.5 4-4s-2-4-4-4" />
      <path d="M7 3v4" />
      <path d="M17 3v4" />
      <path d="M3 15c1.5 2 4 3 6 3" />
      <path d="M21 15c-1.5 2-4 3-6 3" />
      <path d="M9 18h6" />
      <path d="M12 21v-3" />
    </svg>
  ),
  'event.reminder': (props) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 01-3.46 0" />
    </svg>
  ),
  'forum.reply': (props) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
    </svg>
  ),
  'community.badge': (props) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  ),
  'community.level': (props) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M6 9H4.5a2.5 2.5 0 010-5H6" />
      <path d="M18 9h1.5a2.5 2.5 0 000-5H18" />
      <path d="M4 22h16" />
      <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20 7 22" />
      <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20 17 22" />
      <path d="M18 2H6v7a6 6 0 0012 0V2Z" />
    </svg>
  ),
}

const ICON_COLORS = {
  'prayer.prayed': '#7c3aed',
  'prayer.answered': '#16a34a',
  'group.post': '#2563eb',
  'group.welcome': '#f59e0b',
  'event.reminder': '#ef4444',
  'forum.reply': '#0891b2',
  'community.badge': '#f59e0b',
  'community.level': '#d97706',
}

const FILTER_TABS = [
  { key: 'all', label: 'All' },
  { key: 'unread', label: 'Unread' },
  { key: 'prayer', label: 'Prayer' },
  { key: 'group', label: 'Group' },
  { key: 'church', label: 'Church' },
]

function NotificationIcon({ type, className }) {
  const Icon = ICONS[type]
  if (!Icon) return null
  return <Icon className={className} style={{ width: '1em', height: '1em', flexShrink: 0 }} />
}

function NotificationItem({ notification, onNavigate, onRead }) {
  const { id, type, title, description, avatar, read, created_at } = notification

  const handleClick = () => {
    if (!read) onRead(id)
    const match = type.match(/^(\w+)\./)
    const section = match ? match[1] : 'community'
    onNavigate?.({ type: section, id })
  }

  return (
    <button
      type="button"
      className={`card ${read ? '' : 'community-card'}`}
      onClick={handleClick}
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: 10,
        width: '100%',
        padding: '10px 12px',
        border: 'none',
        borderBottom: '1px solid var(--border, #e5e7eb)',
        borderRadius: 0,
        background: read ? 'transparent' : 'rgba(124, 58, 237, 0.03)',
        cursor: 'pointer',
        textAlign: 'left',
      }}
    >
      <span
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: 32,
          height: 32,
          borderRadius: '50%',
          background: `${ICON_COLORS[type] || '#6b7280'}18`,
          color: ICON_COLORS[type] || '#6b7280',
          flexShrink: 0,
        }}
      >
        {avatar ? (
          <img
            src={avatar}
            alt=""
            style={{ width: 32, height: 32, borderRadius: '50%', objectFit: 'cover' }}
          />
        ) : (
          <NotificationIcon type={type} />
        )}
      </span>

      <span style={{ flex: 1, minWidth: 0 }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontWeight: read ? 400 : 600, fontSize: '0.875rem', color: 'var(--text, #111827)' }}>
            {title}
          </span>
          {!read && (
            <span
              className="community-badge"
              aria-label="Unread"
              style={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                background: '#7c3aed',
                flexShrink: 0,
              }}
            />
          )}
        </span>
        <span
          style={{
            display: 'block',
            fontSize: '0.8rem',
            color: 'var(--text-muted, #6b7280)',
            marginTop: 2,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {description}
        </span>
      </span>

      <span
        style={{
          fontSize: '0.75rem',
          color: 'var(--text-muted, #9ca3af)',
          whiteSpace: 'nowrap',
          flexShrink: 0,
          paddingTop: 2,
        }}
        aria-label={created_at}
      >
        {timeAgo(created_at)}
      </span>
    </button>
  )
}

function NotificationBell({ unreadCount, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="btn-sm community-avatar"
      aria-label={`Notifications${unreadCount > 0 ? `, ${unreadCount} unread` : ''}`}
      style={{
        position: 'relative',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: 36,
        height: 36,
        padding: 0,
        border: '1px solid var(--border, #e5e7eb)',
        borderRadius: '50%',
        background: 'var(--bg, #fff)',
        cursor: 'pointer',
      }}
    >
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: 18, height: 18 }}>
        <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" />
        <path d="M13.73 21a2 2 0 01-3.46 0" />
      </svg>
      {unreadCount > 0 && (
        <span
          style={{
            position: 'absolute',
            top: 2,
            right: 2,
            minWidth: 16,
            height: 16,
            padding: '0 4px',
            borderRadius: 8,
            background: '#ef4444',
            color: '#fff',
            fontSize: '0.65rem',
            fontWeight: 700,
            lineHeight: '16px',
            textAlign: 'center',
          }}
        >
          {unreadCount > 99 ? '99+' : unreadCount}
        </span>
      )}
      <span
        style={{
          position: 'absolute',
          top: 6,
          right: 6,
          width: 6,
          height: 6,
          borderRadius: '50%',
          background: '#ef4444',
          animation: 'bf-pulse 2s ease-in-out infinite',
          pointerEvents: 'none',
        }}
      />
      <style>{`@keyframes bf-pulse { 0%,100%{opacity:1} 50%{opacity:.3} }`}</style>
    </button>
  )
}

function EmptyState({ filter }) {
  return (
    <div style={{ padding: '40px 16px', textAlign: 'center', color: 'var(--text-muted, #9ca3af)' }}>
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ width: 40, height: 40, margin: '0 auto 12px', opacity: 0.4 }}>
        <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M13.73 21a2 2 0 01-3.46 0" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <p style={{ fontSize: '0.9rem', fontWeight: 500, margin: 0 }}>
        {filter === 'unread' ? "You're all caught up!" : 'No notifications yet'}
      </p>
      <p style={{ fontSize: '0.8rem', margin: '4px 0 0' }}>
        {filter === 'unread' ? 'Check back later for updates.' : 'We\'ll let you know when something happens.'}
      </p>
    </div>
  )
}

function NotificationCenter({ isPremium, onNavigate }) {
  const [isOpen, setIsOpen] = useState(false)
  const [notifications, setNotifications] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [filter, setFilter] = useState('all')
  const [loading, setLoading] = useState(false)
  const [cursor, setCursor] = useState(null)
  const panelRef = useRef(null)
  const bellRef = useRef(null)

  const fetchNotifications = useCallback(async (nextCursor = null, append = false) => {
    if (!hasValidToken()) { setLoading(false); return }
    setLoading(true)
    try {
      const params = new URLSearchParams({ filter, limit: '20' })
      if (nextCursor) params.set('cursor', nextCursor)
      const res = await fetch(`${API}/api/community/notifications?${params}`, {
        headers: { Authorization: `Bearer ${token()}` },
      })
      if (!res.ok) return
      const data = await res.json()
      setNotifications(prev => append ? [...prev, ...data.notifications] : data.notifications)
      setUnreadCount(data.unread_count ?? data.notifications.filter(n => !n.read).length)
      setCursor(data.cursor ?? null)
    } catch {
      /* silent */
    } finally {
      setLoading(false)
    }
  }, [filter])

  useEffect(() => {
    if (isOpen) fetchNotifications()
  }, [isOpen, fetchNotifications])

  useEffect(() => {
    if (!isOpen) return
    const handler = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target) && bellRef.current && !bellRef.current.contains(e.target)) {
        setIsOpen(false)
      }
    }
    const esc = (e) => { if (e.key === 'Escape') setIsOpen(false) }
    document.addEventListener('mousedown', handler)
    document.addEventListener('keydown', esc)
    return () => {
      document.removeEventListener('mousedown', handler)
      document.removeEventListener('keydown', esc)
    }
  }, [isOpen])

  const markRead = async (id) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n))
    setUnreadCount(prev => Math.max(0, prev - 1))
    try {
      await fetch(`${API}/api/community/notifications/${id}/read`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token()}` },
      })
    } catch { /* revert on failure */ setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: false } : n)); setUnreadCount(prev => prev + 1) }
  }

  const markAllRead = async () => {
    const prev = [...notifications]
    const prevCount = unreadCount
    setNotifications(prevN => prevN.map(n => ({ ...n, read: true })))
    setUnreadCount(0)
    try {
      await fetch(`${API}/api/community/notifications/read-all`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token()}` },
      })
    } catch { setNotifications(prev); setUnreadCount(prevCount) }
  }

  const filtered = notifications.filter(n => {
    if (filter === 'all') return true
    if (filter === 'unread') return !n.read
    if (filter === 'church') return n.type?.startsWith('event.') || n.type?.startsWith('forum.')
    return n.type?.startsWith(filter + '.')
  })

  return (
    <>
      <NotificationBell
        ref={bellRef}
        unreadCount={unreadCount}
        onClick={() => setIsOpen(prev => !prev)}
      />
      {isOpen && (
        <div
          ref={panelRef}
          role="dialog"
          aria-label="Notifications"
          className="fade-in"
          style={{
            position: 'absolute',
            top: '100%',
            right: 0,
            marginTop: 8,
            width: 360,
            maxWidth: 'calc(100vw - 32px)',
            maxHeight: 480,
            display: 'flex',
            flexDirection: 'column',
            background: 'var(--bg, #fff)',
            border: '1px solid var(--border, #e5e7eb)',
            borderRadius: 12,
            boxShadow: '0 8px 30px rgba(0,0,0,0.12)',
            overflow: 'hidden',
            zIndex: 9999,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px 8px', borderBottom: '1px solid var(--border, #e5e7eb)' }}>
            <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>Notifications</span>
            {unreadCount > 0 && (
              <button type="button" className="btn-sm" onClick={markAllRead} style={{ background: 'none', border: 'none', color: '#7c3aed', fontWeight: 600, fontSize: '0.8rem', cursor: 'pointer', padding: 0 }}>
                Mark all read
              </button>
            )}
          </div>

          <div style={{ display: 'flex', gap: 2, padding: '6px 10px', overflowX: 'auto' }} role="tablist">
            {FILTER_TABS.map(tab => (
              <button
                key={tab.key}
                role="tab"
                aria-selected={filter === tab.key}
                className="btn-sm"
                onClick={() => { setFilter(tab.key); setNotifications([]); setCursor(null) }}
                style={{
                  flexShrink: 0,
                  padding: '4px 10px',
                  borderRadius: 16,
                  fontSize: '0.75rem',
                  fontWeight: filter === tab.key ? 600 : 400,
                  background: filter === tab.key ? '#7c3aed' : 'transparent',
                  color: filter === tab.key ? '#fff' : 'var(--text-muted, #6b7280)',
                  border: 'none',
                  cursor: 'pointer',
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div style={{ flex: 1, overflowY: 'auto' }} role="list">
            {loading && notifications.length === 0 ? (
              <div style={{ padding: 32, textAlign: 'center', color: 'var(--text-muted, #9ca3af)', fontSize: '0.85rem' }}>
                Loading...
              </div>
            ) : filtered.length === 0 ? (
              <EmptyState filter={filter} />
            ) : (
              filtered.map(n => (
                <NotificationItem key={n.id} notification={n} onNavigate={onNavigate} onRead={markRead} />
              ))
            )}

            {cursor && (
              <button
                type="button"
                className="btn-sm"
                onClick={() => fetchNotifications(cursor, true)}
                disabled={loading}
                style={{
                  width: '100%',
                  padding: '10px',
                  background: 'none',
                  border: 'none',
                  borderTop: '1px solid var(--border, #e5e7eb)',
                  color: '#7c3aed',
                  fontWeight: 600,
                  fontSize: '0.8rem',
                  cursor: loading ? 'wait' : 'pointer',
                }}
              >
                {loading ? 'Loading...' : 'Load more'}
              </button>
            )}
          </div>
        </div>
      )}
    </>
  )
}

export { NotificationBell, NotificationCenter }
export default NotificationCenter
