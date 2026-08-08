import { useState, useEffect, useCallback, useMemo } from 'react'

const API_URL = import.meta.env.VITE_API_URL || ''
const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']

function getDaysInMonth(year, month) {
  return new Date(year, month + 1, 0).getDate()
}
function getFirstDayOfMonth(year, month) {
  return new Date(year, month, 1).getDay()
}

export default function EventsView({ showToast, isPremium, setShowAuth }) {
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [section, setSection] = useState('upcoming')
  const [calendarView, setCalendarView] = useState('month')
  const [showCreate, setShowCreate] = useState(false)
  const [selectedEvent, setSelectedEvent] = useState(null)
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth())
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear())
  const [selectedDate, setSelectedDate] = useState(null)
  const [currentDate, setCurrentDate] = useState(new Date())

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [location, setLocation] = useState('')
  const [startTime, setStartTime] = useState('')
  const [endTime, setEndTime] = useState('')
  const [eventType, setEventType] = useState('personal')

  const token = () => localStorage.getItem('bf_token')

  const fetchEvents = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams()
      if (calendarView === 'month') {
        const start = new Date(currentYear, currentMonth, 1).toISOString()
        const end = new Date(currentYear, currentMonth + 1, 0).toISOString()
        params.set('start', start)
        params.set('end', end)
      }
      const res = await fetch(`${API_URL}/api/events?${params}`, {
        headers: { 'Authorization': `Bearer ${token()}` }
      })
      if (!res.ok) throw new Error()
      const data = await res.json()
      setEvents(data.events || [])
    } catch {
      setError('Failed to load events')
      showToast('Failed to load events', 'warning')
    } finally { setLoading(false) }
  }, [calendarView, currentMonth, currentYear, showToast])

  useEffect(() => { (async () => { try { if (isPremium) await fetchEvents() } catch { /* ignore */ } })() }, [isPremium, fetchEvents, currentMonth, currentYear, calendarView])

  const resetForm = () => { setTitle(''); setDescription(''); setLocation(''); setStartTime(''); setEndTime('') }

  const createEvent = useCallback(async () => {
    if (!title.trim() || !startTime) return
    setLoading(true)
    try {
      const body = {
        title: title.trim(), description: description.trim(),
        location: location.trim(), start_time: new Date(startTime).toISOString(),
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
      setShowCreate(false); resetForm(); fetchEvents()
    } catch { showToast('Failed to create event', 'warning') }
    finally { setLoading(false) }
  }, [title, description, location, startTime, endTime, eventType, showToast, fetchEvents])

  const rsvpEvent = useCallback(async (id, status) => {
    try {
      const res = await fetch(`${API_URL}/api/events/${id}/rsvp?status=${status}`, {
        method: 'POST', headers: { 'Authorization': `Bearer ${token()}` }
      })
      if (!res.ok) throw new Error()
      showToast(status === 'going' ? 'You are going!' : status === 'maybe' ? 'Marked as maybe' : 'Not going')
      fetchEvents()
    } catch { showToast('RSVP failed', 'warning') }
  }, [showToast, fetchEvents])

  const cancelEvent = useCallback(async (id) => {
    try {
      const res = await fetch(`${API_URL}/api/events/${id}/cancel`, {
        method: 'POST', headers: { 'Authorization': `Bearer ${token()}` }
      })
      if (!res.ok) throw new Error()
      showToast('Event cancelled')
      setSelectedEvent(null); fetchEvents()
    } catch { showToast('Failed to cancel', 'warning') }
  }, [showToast, fetchEvents])

  const viewEvent = useCallback(async (id) => {
    setLoading(true)
    try {
      const res = await fetch(`${API_URL}/api/events/${id}`)
      if (!res.ok) throw new Error()
      setSelectedEvent(await res.json())
    } catch { showToast('Failed to load event', 'warning') }
    finally { setLoading(false) }
  }, [showToast])

  const formatDate = (d) => {
    if (!d) return ''
    return new Date(d).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
  }

  const now = new Date()
  const upcoming = useMemo(() =>
    events.filter(e => new Date(e.start_time) >= now).sort((a, b) => new Date(a.start_time) - new Date(b.start_time)),
    [events, now]
  )
  const past = useMemo(() =>
    events.filter(e => new Date(e.start_time) < now).sort((a, b) => new Date(b.start_time) - new Date(a.start_time)),
    [events, now]
  )

  const daysInMonth = getDaysInMonth(currentYear, currentMonth)
  const firstDay = getFirstDayOfMonth(currentYear, currentMonth)
  const monthEvents = useMemo(() => {
    const map = {}
    events.forEach(e => {
      const d = new Date(e.start_time)
      const key = d.getDate()
      if (!map[key]) map[key] = []
      map[key].push(e)
    })
    return map
  }, [events])

  const prevMonth = () => {
    if (currentMonth === 0) { setCurrentMonth(11); setCurrentYear(y => y - 1) }
    else setCurrentMonth(m => m - 1)
  }
  const nextMonth = () => {
    if (currentMonth === 11) { setCurrentMonth(0); setCurrentYear(y => y + 1) }
    else setCurrentMonth(m => m + 1)
  }
  const today = new Date()
  const isToday = (d) => today.getDate() === d && today.getMonth() === currentMonth && today.getFullYear() === currentYear

  if (!isPremium) {
    return (
      <section className="view fade-in">
        <div className="card">
          <div className="card-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg></div>
          <h3>Events Calendar</h3>
          <p>Sign in to access church and community events.</p>
          <button className="btn-primary" onClick={() => setShowAuth(true)}>Sign In</button>
        </div>
      </section>
    )
  }

  return (
    <section className="view fade-in" role="region" aria-label="Events Calendar">
      {error && <div className="error-banner" role="alert">{error}</div>}

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
              onChange={e => setTitle(e.target.value)} autoFocus />
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
            <select value={eventType} onChange={e => setEventType(e.target.value)} aria-label="Event type">
              <option value="personal">Personal</option>
              <option value="church">Church</option>
              <option value="group">Group</option>
            </select>
            <button className="btn-primary" onClick={createEvent} disabled={loading || !title.trim() || !startTime}>
              {loading ? 'Creating...' : 'Create Event'}
            </button>
          </div>
        )}

        <div className="calendar-view-toggle" role="tablist" aria-label="Calendar view">
          <button className={`groups-nav-btn${calendarView === 'month' ? ' active' : ''}`}
            onClick={() => setCalendarView('month')} role="tab" aria-selected={calendarView === 'month'}>Month</button>
          <button className={`groups-nav-btn${calendarView === 'week' ? ' active' : ''}`}
            onClick={() => setCalendarView('week')} role="tab" aria-selected={calendarView === 'week'}>Week</button>
          <button className={`groups-nav-btn${calendarView === 'agenda' ? ' active' : ''}`}
            onClick={() => setCalendarView('agenda')} role="tab" aria-selected={calendarView === 'agenda'}>Agenda</button>
        </div>

        {calendarView === 'month' && (
          <div className="month-calendar">
            <div className="calendar-header">
              <button className="btn-sm" onClick={prevMonth} aria-label="Previous month">&lt;</button>
              <h4 className="calendar-month-title">{MONTHS[currentMonth]} {currentYear}</h4>
              <button className="btn-sm" onClick={nextMonth} aria-label="Next month">&gt;</button>
            </div>
            <div className="calendar-weekdays" role="row">
              {DAYS.map(d => <div key={d} className="calendar-weekday" role="columnheader">{d}</div>)}
            </div>
            <div className="calendar-grid" role="grid" aria-label="Calendar">
              {Array.from({ length: firstDay }).map((_, i) => (
                <div key={`empty-${i}`} className="calendar-day empty" />
              ))}
              {Array.from({ length: daysInMonth }).map((_, i) => {
                const day = i + 1
                const dayEvents = monthEvents[day] || []
                const selected = selectedDate === day
                return (
                  <div key={day}
                    className={`calendar-day${isToday(day) ? ' today' : ''}${selected ? ' selected' : ''}${dayEvents.length > 0 ? ' has-events' : ''}`}
                    onClick={() => setSelectedDate(selected ? null : day)}
                    role="gridcell" aria-label={`${MONTHS[currentMonth]} ${day}, ${dayEvents.length} events`}
                    tabIndex={0}>
                    <span className="calendar-day-num">{day}</span>
                    {dayEvents.length > 0 && (
                      <div className="calendar-day-events">
                        {dayEvents.slice(0, 2).map(e => (
                          <span key={e.id} className="calendar-event-dot" title={e.title}
                            onClick={(ev) => { ev.stopPropagation(); viewEvent(e.id) }} />
                        ))}
                        {dayEvents.length > 2 && <span className="calendar-more">+{dayEvents.length - 2}</span>}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {calendarView === 'week' && (
          <div className="week-view">
            <div className="calendar-header">
              <button className="btn-sm" onClick={() => { setCurrentDate(d => new Date(d.getTime() - 7 * 86400000)) }} aria-label="Previous week">&lt;</button>
              <h4>Week of {currentDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</h4>
              <button className="btn-sm" onClick={() => { setCurrentDate(d => new Date(d.getTime() + 7 * 86400000)) }} aria-label="Next week">&gt;</button>
            </div>
            <div className="week-events-list">
              {upcoming.slice(0, 20).map(e => (
                <div key={e.id} className="week-event-item" onClick={() => viewEvent(e.id)} role="button" tabIndex={0}>
                  <span className="week-event-day">{new Date(e.start_time).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}</span>
                  <strong className="week-event-title">{e.title}</strong>
                  <span className="week-event-time">{new Date(e.start_time).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
              ))}
              {upcoming.length === 0 && <p className="empty-state">No events this week.</p>}
            </div>
          </div>
        )}

        {calendarView === 'agenda' && (
          <div className="agenda-view">
            <div className="events-nav" role="tablist" aria-label="Event filter">
              <button className={`groups-nav-btn${section === 'upcoming' ? ' active' : ''}`}
                onClick={() => setSection('upcoming')} role="tab" aria-selected={section === 'upcoming'}>
                Upcoming ({upcoming.length})
              </button>
              <button className={`groups-nav-btn${section === 'past' ? ' active' : ''}`}
                onClick={() => setSection('past')} role="tab" aria-selected={section === 'past'}>
                Past ({past.length})
              </button>
            </div>

            {section === 'upcoming' && (
              <div className="events-list" role="list">
                {upcoming.length === 0 && <p className="empty-state">No upcoming events.</p>}
                {upcoming.map(e => (
                  <div key={e.id} className="event-item" onClick={() => viewEvent(e.id)} role="listitem" tabIndex={0}>
                    <div className="event-item-date">
                      <span className="event-month">{new Date(e.start_time).toLocaleDateString(undefined, { month: 'short' })}</span>
                      <span className="event-day">{new Date(e.start_time).getDate()}</span>
                    </div>
                    <div className="event-item-info">
                      <strong>{e.title}</strong>
                      <span className="event-item-time">{formatDate(e.start_time)}</span>
                      {e.location && <span className="event-item-location"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" style={{width:12,height:12,verticalAlign:'middle',marginRight:4}}><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>{e.location}</span>}
                    </div>
                    <div className="event-item-status">
                      {e.user_going ? <span className="going-badge">Going</span> : <span className="event-attendees">{e.attendee_count} going</span>}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {section === 'past' && (
              <div className="events-list" role="list">
                {past.length === 0 && <p className="empty-state">No past events.</p>}
                {past.map(e => (
                  <div key={e.id} className="event-item past-event" onClick={() => viewEvent(e.id)} tabIndex={0}>
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
        )}
      </div>

      {selectedEvent && (
        <div className="group-detail-overlay" onClick={() => setSelectedEvent(null)}
          role="dialog" aria-modal="true" aria-label={`Event: ${selectedEvent.title}`}>
          <div className="group-detail" onClick={e => e.stopPropagation()}>
            <div className="group-detail-header">
              <h3>{selectedEvent.title}</h3>
              <button className="group-close" onClick={() => setSelectedEvent(null)} aria-label="Close event details">✕</button>
            </div>
            <div className="event-detail-info">
              <div className="detail-row"><span className="detail-label">Date</span><span>{formatDate(selectedEvent.start_time)}</span></div>
              {selectedEvent.end_time && <div className="detail-row"><span className="detail-label">End</span><span>{formatDate(selectedEvent.end_time)}</span></div>}
              {selectedEvent.location && <div className="detail-row"><span className="detail-label">Location</span><span>{selectedEvent.location}</span></div>}
              {selectedEvent.description && <div className="detail-row detail-row-full"><span className="detail-label">Description</span><p>{selectedEvent.description}</p></div>}
              <div className="detail-row"><span className="detail-label">Type</span><span className={`event-type-badge ${selectedEvent.event_type}`}>{selectedEvent.event_type}</span></div>
              <div className="detail-row"><span className="detail-label">Created by</span><span>{selectedEvent.creator_name}</span></div>
            </div>
            <div className="event-rsvp-buttons" role="group" aria-label="RSVP">
              <button className="btn-sm btn-primary" onClick={() => rsvpEvent(selectedEvent.id, 'going')}>Going</button>
              <button className="btn-sm" onClick={() => rsvpEvent(selectedEvent.id, 'maybe')}>Maybe</button>
              <button className="btn-sm btn-outline" onClick={() => rsvpEvent(selectedEvent.id, 'not_going')}>Not Going</button>
            </div>
            <div className="event-attendees-section">
              <h4>Attendees ({selectedEvent.attendees?.length || 0})</h4>
              <div className="event-attendees-list" role="list">
                {(selectedEvent.attendees || []).map(a => (
                  <div key={a.user_id} className="event-attendee-item" role="listitem">
                    <span className="attendee-name">{a.name}</span>
                    <span className={`attendee-status status-${a.status}`}>{a.status}</span>
                  </div>
                ))}
              </div>
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