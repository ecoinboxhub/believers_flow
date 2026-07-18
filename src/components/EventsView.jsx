import { useState, useEffect, useCallback } from 'react'

const API_URL = import.meta.env.VITE_API_URL || ''

export default function EventsView({ showToast, isPremium, setShowAuth }) {
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(false)
  const [section, setSection] = useState('upcoming')
  const [showCreate, setShowCreate] = useState(false)
  const [selectedEvent, setSelectedEvent] = useState(null)

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [location, setLocation] = useState('')
  const [startTime, setStartTime] = useState('')
  const [endTime, setEndTime] = useState('')
  const [eventType, setEventType] = useState('personal')

  const token = () => localStorage.getItem('bf_token')

  const fetchEvents = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`${API_URL}/api/events`, {
        headers: { 'Authorization': `Bearer ${token()}` }
      })
      if (!res.ok) throw new Error()
      const data = await res.json()
      setEvents(data.events || [])
    } catch { showToast('Failed to load events', 'warning') }
    finally { setLoading(false) }
  }, [showToast])

  useEffect(() => { if (isPremium) fetchEvents() }, [isPremium, fetchEvents])

  const createEvent = useCallback(async () => {
    if (!title.trim() || !startTime) return
    setLoading(true)
    try {
      const body = {
        title: title.trim(),
        description: description.trim(),
        location: location.trim(),
        start_time: new Date(startTime).toISOString(),
        event_type: eventType,
      }
      if (endTime) body.end_time = new Date(endTime).toISOString()
      const res = await fetch(`${API_URL}/api/events/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token()}` },
        body: JSON.stringify(body)
      })
      if (!res.ok) throw new Error()
      showToast('Event created!')
      setShowCreate(false)
      setTitle(''); setDescription(''); setLocation(''); setStartTime(''); setEndTime('')
      fetchEvents()
    } catch { showToast('Failed to create event', 'warning') }
    finally { setLoading(false) }
  }, [title, description, location, startTime, endTime, eventType, showToast, fetchEvents])

  const rsvpEvent = useCallback(async (id, status) => {
    try {
      const res = await fetch(`${API_URL}/api/events/${id}/rsvp?status=${status}`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token()}` }
      })
      if (!res.ok) throw new Error()
      showToast(status === 'going' ? 'Going!' : status === 'maybe' ? 'Maybe' : 'Not going')
      fetchEvents()
    } catch { showToast('RSVP failed', 'warning') }
  }, [showToast, fetchEvents])

  const cancelEvent = useCallback(async (id) => {
    try {
      const res = await fetch(`${API_URL}/api/events/${id}/cancel`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token()}` }
      })
      if (!res.ok) throw new Error()
      showToast('Event cancelled')
      setSelectedEvent(null)
      fetchEvents()
    } catch { showToast('Failed to cancel', 'warning') }
  }, [showToast, fetchEvents])

  const viewEvent = useCallback(async (id) => {
    setLoading(true)
    try {
      const res = await fetch(`${API_URL}/api/events/${id}`)
      if (!res.ok) throw new Error()
      const data = await res.json()
      setSelectedEvent(data)
    } catch { showToast('Failed to load event', 'warning') }
    finally { setLoading(false) }
  }, [showToast])

  const formatDate = (d) => {
    if (!d) return ''
    return new Date(d).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
  }

  const now = new Date()
  const upcoming = events.filter(e => new Date(e.start_time) >= now).sort((a, b) => new Date(a.start_time) - new Date(b.start_time))
  const past = events.filter(e => new Date(e.start_time) < now).sort((a, b) => new Date(b.start_time) - new Date(a.start_time))

  if (!isPremium) {
    return (
      <section className="view fade-in">
        <div className="card">
          <div className="card-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/><rect x="7" y="13" width="3" height="3" fill="currentColor" opacity="0.3"/></svg></div>
          <h3>Events Calendar</h3>
          <p>Sign in to access church and community events.</p>
          <button className="btn-primary" onClick={() => setShowAuth(true)}>Sign In</button>
        </div>
      </section>
    )
  }

  return (
    <section className="view fade-in">
      <div className="card">
        <div className="card-header-row">
          <h3>Events</h3>
          <button className="btn-sm" onClick={() => setShowCreate(!showCreate)}>
            {showCreate ? 'Cancel' : '+ New Event'}
          </button>
        </div>

        {showCreate && (
          <div className="event-create-form">
            <input type="text" placeholder="Event title" aria-label="Event title" value={title}
              onChange={e => setTitle(e.target.value)} />
            <textarea placeholder="Description" aria-label="Event description" value={description}
              onChange={e => setDescription(e.target.value)} rows={2} />
            <input type="text" placeholder="Location" aria-label="Event location" value={location}
              onChange={e => setLocation(e.target.value)} />
            <label className="settings-label">Start</label>
            <input type="datetime-local" aria-label="Start time" value={startTime}
              onChange={e => setStartTime(e.target.value)} />
            <label className="settings-label">End (optional)</label>
            <input type="datetime-local" aria-label="End time" value={endTime}
              onChange={e => setEndTime(e.target.value)} />
            <select value={eventType} onChange={e => setEventType(e.target.value)}>
              <option value="personal">Personal</option>
              <option value="church">Church</option>
              <option value="group">Group</option>
            </select>
            <button className="btn-primary" onClick={createEvent} disabled={loading || !title.trim() || !startTime}>
              Create Event
            </button>
          </div>
        )}

        <div className="events-nav">
          <button className={`groups-nav-btn${section === 'upcoming' ? ' active' : ''}`}
            onClick={() => setSection('upcoming')}>Upcoming ({upcoming.length})</button>
          <button className={`groups-nav-btn${section === 'past' ? ' active' : ''}`}
            onClick={() => setSection('past')}>Past ({past.length})</button>
        </div>

        {section === 'upcoming' && (
          <div className="events-list">
            {upcoming.length === 0 && <p className="empty-state">No upcoming events.</p>}
            {upcoming.map(e => (
              <div key={e.id} className="event-item" onClick={() => viewEvent(e.id)} role="button" tabIndex={0}
                onKeyDown={ev => { if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); viewEvent(e.id) } }}>
                <div className="event-item-date">
                  <span className="event-month">{new Date(e.start_time).toLocaleDateString(undefined, { month: 'short' })}</span>
                  <span className="event-day">{new Date(e.start_time).getDate()}</span>
                </div>
                <div className="event-item-info">
                  <strong>{e.title}</strong>
                  <span className="event-item-time">{formatDate(e.start_time)}</span>
                  {e.location && <span className="event-item-location">{e.location}</span>}
                </div>
                <div className="event-item-status">
                  {e.user_going ? <span className="going-badge">Going</span> : <span className="event-attendees">{e.attendee_count} going</span>}
                </div>
              </div>
            ))}
          </div>
        )}

        {section === 'past' && (
          <div className="events-list">
            {past.length === 0 && <p className="empty-state">No past events.</p>}
            {past.map(e => (
              <div key={e.id} className="event-item past-event" onClick={() => viewEvent(e.id)}>
                <div className="event-item-date">
                  <span className="event-month">{new Date(e.start_time).toLocaleDateString(undefined, { month: 'short' })}</span>
                  <span className="event-day">{new Date(e.start_time).getDate()}</span>
                </div>
                <div className="event-item-info">
                  <strong>{e.title}</strong>
                  <span className="event-item-time">{formatDate(e.start_time)}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {selectedEvent && (
        <div className="group-detail-overlay" onClick={() => setSelectedEvent(null)}>
          <div className="group-detail" onClick={e => e.stopPropagation()}>
            <div className="group-detail-header">
              <h3>{selectedEvent.title}</h3>
              <button className="group-close" onClick={() => setSelectedEvent(null)} aria-label="Close event details">✕</button>
            </div>
            <div className="event-detail-info">
              <p><strong>Date:</strong> {formatDate(selectedEvent.start_time)}</p>
              {selectedEvent.end_time && <p><strong>End:</strong> {formatDate(selectedEvent.end_time)}</p>}
              {selectedEvent.location && <p><strong>Location:</strong> {selectedEvent.location}</p>}
              {selectedEvent.description && <p><strong>Description:</strong> {selectedEvent.description}</p>}
              <p><strong>Type:</strong> {selectedEvent.event_type}</p>
              <p><strong>Created by:</strong> {selectedEvent.creator_name}</p>
            </div>
            <div className="event-rsvp-buttons">
              <button className="btn-sm" onClick={() => rsvpEvent(selectedEvent.id, 'going')}>Going</button>
              <button className="btn-sm" onClick={() => rsvpEvent(selectedEvent.id, 'maybe')}>Maybe</button>
              <button className="btn-sm" onClick={() => rsvpEvent(selectedEvent.id, 'not_going')}>Not Going</button>
            </div>
            <div className="event-attendees-list">
              <h4>Attendees ({selectedEvent.attendees?.length || 0})</h4>
              {(selectedEvent.attendees || []).map(a => (
                <div key={a.user_id} className="event-attendee-item">
                  <span>{a.name}</span>
                  <span className="event-attendee-status">{a.status}</span>
                </div>
              ))}
            </div>
            <button className="btn-danger" onClick={() => cancelEvent(selectedEvent.id)} style={{ marginTop: 12 }}>
              Cancel Event
            </button>
          </div>
        </div>
      )}
    </section>
  )
}
