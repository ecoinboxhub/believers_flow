import { useState, useEffect, useCallback } from 'react'

const API_URL = import.meta.env.VITE_API_URL || ''

export default function ChurchView({ showToast, isPremium, setShowAuth }) {
  const [section, setSection] = useState('search')
  const [searchQuery, setSearchQuery] = useState('')
  const [city, setCity] = useState('')
  const [denomination, setDenomination] = useState('')
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [myChurches, setMyChurches] = useState([])
  const [selectedChurch, setSelectedChurch] = useState(null)
  const [page, setPage] = useState(1)
  const [totalResults, setTotalResults] = useState(0)

  const token = () => localStorage.getItem('bf_token')

  const fetchMyChurches = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/api/churches/user/my`, {
        headers: { 'Authorization': `Bearer ${token()}` }
      })
      if (!res.ok) return
      const data = await res.json()
      setMyChurches(data.churches || [])
    } catch { /* ignore */ }
  }, [])

  useEffect(() => { (async () => { try { if (isPremium) await fetchMyChurches() } catch { /* ignore */ } })() }, [isPremium, fetchMyChurches])

  const searchChurches = useCallback(async (pageNum = 1) => {
    setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams()
      if (searchQuery.trim()) params.set('q', searchQuery.trim())
      if (city.trim()) params.set('city', city.trim())
      if (denomination.trim()) params.set('denomination', denomination.trim())
      params.set('limit', '20')
      params.set('page', String(pageNum))
      const res = await fetch(`${API_URL}/api/churches/search?${params}`, {
        headers: { 'Authorization': `Bearer ${token()}` }
      })
      if (!res.ok) throw new Error('Search failed')
      const data = await res.json()
      setResults(Array.isArray(data) ? data : data.churches || data.results || [])
      setTotalResults(data.total || (Array.isArray(data) ? data.length : 0))
      setPage(pageNum)
    } catch (err) {
      setError(err.message || 'Search failed')
      showToast('Search failed', 'warning')
    } finally { setLoading(false) }
  }, [searchQuery, city, denomination, showToast])

  const handleSearch = () => searchChurches(1)

  const viewChurch = useCallback(async (id) => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`${API_URL}/api/churches/${id}`)
      if (!res.ok) throw new Error()
      const data = await res.json()
      setSelectedChurch(data)
    } catch { showToast('Failed to load church details', 'warning') }
    finally { setLoading(false) }
  }, [showToast])

  const joinChurch = useCallback(async (id) => {
    try {
      const res = await fetch(`${API_URL}/api/churches/${id}/join`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token()}` }
      })
      if (!res.ok) throw new Error()
      showToast('Connected to church!')
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
    <section className="view fade-in" role="region" aria-label="Church Directory">
      <div className="groups-nav" role="tablist" aria-label="Church sections">
        <button className={`groups-nav-btn${section === 'search' ? ' active' : ''}`}
          onClick={() => setSection('search')} role="tab" aria-selected={section === 'search'}>Search</button>
        <button className={`groups-nav-btn${section === 'my' ? ' active' : ''}`}
          onClick={() => setSection('my')} role="tab" aria-selected={section === 'my'}>
          My Churches {myChurches.length > 0 && <span className="count-badge-sm">{myChurches.length}</span>}
        </button>
      </div>

      {error && <div className="error-banner" role="alert">{error}</div>}

      {section === 'search' && (
        <div className="card">
          <h3>Find Churches</h3>
          <p className="section-desc">Search by name, city, or denomination.</p>
          <div className="church-search-form">
            <input type="text" placeholder="Church name" aria-label="Church name" value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSearch()} />
            <input type="text" placeholder="City" aria-label="City" value={city}
              onChange={e => setCity(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSearch()} />
            <input type="text" placeholder="Denomination (e.g. Baptist, Catholic)" aria-label="Denomination" value={denomination}
              onChange={e => setDenomination(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSearch()} />
            <button className="btn-primary" onClick={handleSearch} disabled={loading}>
              {loading ? <span className="btn-loading"><span className="spinner-sm" /> Searching...</span> : 'Search'}
            </button>
          </div>

          {loading && <div className="loading-spinner" aria-label="Searching churches" />}

          {!loading && !error && results.length > 0 && (
            <>
              <div className="church-results" role="list">
                {results.map(c => (
                  <div key={c.id} className="church-card" role="listitem">
                    <div className="church-card-info" onClick={() => viewChurch(c.id)}
                      role="button" tabIndex={0} aria-label={`View ${c.name}`}>
                      <div className="church-card-header">
                        <strong className="church-card-name">{c.name}</strong>
                        {c.denomination && <span className="church-denom-badge">{c.denomination}</span>}
                      </div>
                      <div className="church-card-details">
                        {c.city && <span className="church-location"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" style={{width:12,height:12,verticalAlign:'middle',marginRight:4}}><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>{c.city}{c.country ? `, ${c.country}` : ''}</span>}
                        {c.distance_km && <span className="church-distance">{c.distance_km} km away</span>}
                      </div>
                    </div>
                    <button className="btn-sm" onClick={() => joinChurch(c.id)}>Connect</button>
                  </div>
                ))}
              </div>
              {totalResults > 20 && (
                <div className="pagination" role="navigation" aria-label="Church pagination">
                  <button className="btn-sm" disabled={page <= 1} onClick={() => searchChurches(page - 1)}>Previous</button>
                  <span className="page-indicator">Page {page}</span>
                  <button className="btn-sm" disabled={results.length < 20} onClick={() => searchChurches(page + 1)}>Next</button>
                </div>
              )}
            </>
          )}

          {!loading && !error && results.length === 0 && (
            <div className="empty-state" role="status">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{width:48,height:48,opacity:0.3,marginBottom:12}}><path d="M18 2H6v7H3v13h18V9h-3V2z"/><line x1="12" y1="2" x2="12" y2="22"/><line x1="8" y1="6" x2="16" y2="6"/><circle cx="12" cy="14" r="2"/></svg>
              <p>Search for churches to get started.</p>
            </div>
          )}
        </div>
      )}

      {section === 'my' && (
        <div className="card">
          <h3>My Churches</h3>
          {myChurches.length === 0 && (
            <div className="empty-state" role="status">
              <p>You haven't connected with any churches yet.</p>
              <button className="btn-primary" onClick={() => setSection('search')}>Find Churches</button>
            </div>
          )}
          <div className="church-my-list" role="list">
            {myChurches.map(c => (
              <div key={c.id} className="church-my-card" role="listitem">
                <div className="church-my-info" onClick={() => viewChurch(c.id)}
                  role="button" tabIndex={0} aria-label={`View ${c.name}`}>
                  <strong>{c.name}</strong>
                  <span className="church-my-meta">{c.denomination}{c.city ? ` · ${c.city}` : ''}</span>
                  <span className={`church-role-badge role-${c.role}`}>{c.role}</span>
                </div>
                <button className="btn-sm btn-danger" onClick={() => leaveChurch(c.id)}>Disconnect</button>
              </div>
            ))}
          </div>
        </div>
      )}

      {selectedChurch && (
        <div className="group-detail-overlay" onClick={() => setSelectedChurch(null)}
          role="dialog" aria-modal="true" aria-label={`Church: ${selectedChurch.name}`}>
          <div className="group-detail" onClick={e => e.stopPropagation()}>
            <div className="group-detail-header">
              <h3>{selectedChurch.name}</h3>
              <button className="group-close" onClick={() => setSelectedChurch(null)} aria-label="Close church details">✕</button>
            </div>
            <div className="church-detail-info">
              {selectedChurch.denomination && <div className="detail-row"><span className="detail-label">Denomination</span><span>{selectedChurch.denomination}</span></div>}
              {selectedChurch.address && <div className="detail-row"><span className="detail-label">Address</span><span>{selectedChurch.address}</span></div>}
              {selectedChurch.city && <div className="detail-row"><span className="detail-label">City</span><span>{selectedChurch.city}{selectedChurch.country ? `, ${selectedChurch.country}` : ''}</span></div>}
              {selectedChurch.phone && <div className="detail-row"><span className="detail-label">Phone</span><span>{selectedChurch.phone}</span></div>}
              {selectedChurch.email && <div className="detail-row"><span className="detail-label">Email</span><span>{selectedChurch.email}</span></div>}
              {selectedChurch.website && <div className="detail-row"><span className="detail-label">Website</span><span>{selectedChurch.website}</span></div>}
              {selectedChurch.description && <div className="detail-row detail-row-full"><span className="detail-label">About</span><p>{selectedChurch.description}</p></div>}
            </div>

            {selectedChurch.members?.length > 0 && (
              <>
                <h4>Members ({selectedChurch.member_count || selectedChurch.members.length})</h4>
                <div className="group-members-list" role="list">
                  {selectedChurch.members.map(m => (
                    <div key={m.user_id} className="group-member-item" role="listitem">
                      <span>{m.name}</span>
                      <span className={`group-member-role role-${m.role}`}>{m.role}</span>
                    </div>
                  ))}
                </div>
              </>
            )}

            <button className="btn-primary" onClick={() => joinChurch(selectedChurch.id)} style={{ marginTop: 12 }}>
              Connect to This Church
            </button>
          </div>
        </div>
      )}
    </section>
  )
}