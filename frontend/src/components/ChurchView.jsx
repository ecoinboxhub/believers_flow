import { useState, useEffect, useCallback } from 'react'

const API_URL = import.meta.env.VITE_API_URL || ''

export default function ChurchView({ showToast, isPremium, setShowAuth }) {
  const [section, setSection] = useState('search')
  const [searchQuery, setSearchQuery] = useState('')
  const [city, setCity] = useState('')
  const [denomination, setDenomination] = useState('')
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [myChurches, setMyChurches] = useState([])
  const [selectedChurch, setSelectedChurch] = useState(null)

  const token = () => localStorage.getItem('bf_token')

  const fetchMyChurches = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/api/churches/user/my`, {
        headers: { 'Authorization': `Bearer ${token()}` }
      })
      if (!res.ok) return
      const data = await res.json()
      setMyChurches(data.churches || [])
    } catch {}
  }, [])

  useEffect(() => { if (isPremium) fetchMyChurches() }, [isPremium, fetchMyChurches])

  const searchChurches = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (searchQuery.trim()) params.set('q', searchQuery.trim())
      if (city.trim()) params.set('city', city.trim())
      if (denomination.trim()) params.set('denomination', denomination.trim())
      params.set('limit', '20')
      const res = await fetch(`${API_URL}/api/churches/search?${params}`, {
        headers: { 'Authorization': `Bearer ${token()}` }
      })
      if (!res.ok) throw new Error()
      const data = await res.json()
      setResults(data)
    } catch { showToast('Search failed', 'warning') }
    finally { setLoading(false) }
  }, [searchQuery, city, denomination, showToast])

  const viewChurch = useCallback(async (id) => {
    setLoading(true)
    try {
      const res = await fetch(`${API_URL}/api/churches/${id}`)
      if (!res.ok) throw new Error()
      const data = await res.json()
      setSelectedChurch(data)
    } catch { showToast('Failed to load church', 'warning') }
    finally { setLoading(false) }
  }, [showToast])

  const joinChurch = useCallback(async (id) => {
    try {
      const res = await fetch(`${API_URL}/api/churches/${id}/join`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token()}` }
      })
      if (!res.ok) throw new Error()
      showToast('Joined church!')
      fetchMyChurches()
    } catch { showToast('Failed to join', 'warning') }
  }, [showToast, fetchMyChurches])

  const leaveChurch = useCallback(async (id) => {
    try {
      const res = await fetch(`${API_URL}/api/churches/${id}/leave`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token()}` }
      })
      if (!res.ok) throw new Error()
      showToast('Left church')
      fetchMyChurches()
    } catch { showToast('Failed to leave', 'warning') }
  }, [showToast, fetchMyChurches])

  if (!isPremium) {
    return (
      <section className="view fade-in">
        <div className="card">
          <div className="card-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M18 2H6v7H3v13h18V9h-3V2z"/><line x1="12" y1="2" x2="12" y2="22"/><line x1="8" y1="6" x2="16" y2="6"/><circle cx="12" cy="14" r="2"/></svg></div>
          <h3>Church Directory</h3>
          <p>Sign in to discover and connect with churches near you.</p>
          <button className="btn-primary" onClick={() => setShowAuth(true)}>Sign In</button>
        </div>
      </section>
    )
  }

  return (
    <section className="view fade-in">
      <div className="groups-nav">
        <button className={`groups-nav-btn${section === 'search' ? ' active' : ''}`} onClick={() => setSection('search')}>Search</button>
        <button className={`groups-nav-btn${section === 'my' ? ' active' : ''}`} onClick={() => setSection('my')}>My Churches</button>
      </div>

      {section === 'search' && (
        <div className="card">
          <h3>Find Churches</h3>
          <p>Search by name, city, or denomination.</p>
          <div className="church-search-form">
            <input type="text" placeholder="Church name" aria-label="Church name" value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)} />
            <input type="text" placeholder="City" aria-label="City" value={city}
              onChange={e => setCity(e.target.value)} />
            <input type="text" placeholder="Denomination" aria-label="Denomination" value={denomination}
              onChange={e => setDenomination(e.target.value)} />
            <button className="btn-primary" onClick={searchChurches} disabled={loading}>
              {loading ? 'Searching...' : 'Search'}
            </button>
          </div>

          <div className="church-results">
            {results.map(c => (
              <div key={c.id} className="church-result-item">
                <div className="church-result-info" onClick={() => viewChurch(c.id)} role="button" tabIndex={0}
                  onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); viewChurch(c.id) } }}>
                  <strong>{c.name}</strong>
                  {c.denomination && <span className="church-denom">{c.denomination}</span>}
                  {c.city && <span className="church-location">{c.city}{c.country ? `, ${c.country}` : ''}</span>}
                  {c.distance_km && <span className="church-distance">{c.distance_km} km</span>}
                </div>
                <button className="btn-sm" onClick={() => joinChurch(c.id)}>Join</button>
              </div>
            ))}
            {!loading && results.length === 0 && (
              <p className="empty-state">Search for churches to get started.</p>
            )}
          </div>
        </div>
      )}

      {section === 'my' && (
        <div className="card">
          <h3>My Churches</h3>
          {myChurches.length === 0 && <p className="empty-state">You haven't joined any churches yet.</p>}
          <div className="church-my-list">
            {myChurches.map(c => (
              <div key={c.id} className="church-my-item">
                <div className="church-my-info" onClick={() => viewChurch(c.id)}>
                  <strong>{c.name}</strong>
                  <span>{c.denomination}{c.city ? ` · ${c.city}` : ''}</span>
                  <span className="church-role-badge">{c.role}</span>
                </div>
                <button className="btn-sm btn-danger" onClick={() => leaveChurch(c.id)}>Leave</button>
              </div>
            ))}
          </div>
        </div>
      )}

      {selectedChurch && (
        <div className="group-detail-overlay" onClick={() => setSelectedChurch(null)}>
          <div className="group-detail" onClick={e => e.stopPropagation()}>
            <div className="group-detail-header">
              <h3>{selectedChurch.name}</h3>
              <button className="group-close" onClick={() => setSelectedChurch(null)} aria-label="Close church details">✕</button>
            </div>
            <div className="church-detail-info">
              {selectedChurch.denomination && <p><strong>Denomination:</strong> {selectedChurch.denomination}</p>}
              {selectedChurch.address && <p><strong>Address:</strong> {selectedChurch.address}</p>}
              {selectedChurch.city && <p><strong>City:</strong> {selectedChurch.city}</p>}
              {selectedChurch.country && <p><strong>Country:</strong> {selectedChurch.country}</p>}
              {selectedChurch.phone && <p><strong>Phone:</strong> {selectedChurch.phone}</p>}
              {selectedChurch.email && <p><strong>Email:</strong> {selectedChurch.email}</p>}
              {selectedChurch.website && <p><strong>Website:</strong> {selectedChurch.website}</p>}
              {selectedChurch.description && <p><strong>About:</strong> {selectedChurch.description}</p>}
            </div>
            <h4>Members ({selectedChurch.member_count})</h4>
            <div className="group-members-list">
              {(selectedChurch.members || []).map(m => (
                <div key={m.user_id} className="group-member-item">
                  <span>{m.name}</span>
                  <span className="group-member-role">{m.role}</span>
                </div>
              ))}
            </div>
            <button className="btn-primary" onClick={() => joinChurch(selectedChurch.id)} style={{ marginTop: 12 }}>
              Join This Church
            </button>
          </div>
        </div>
      )}
    </section>
  )
}
