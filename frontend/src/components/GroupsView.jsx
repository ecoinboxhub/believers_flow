import { useState, useEffect, useCallback } from 'react'

const API_URL = import.meta.env.VITE_API_URL || ''

export default function GroupsView({ showToast, isPremium, setShowAuth }) {
  const [groups, setGroups] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [section, setSection] = useState('list')
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [inviteCode, setInviteCode] = useState('')
  const [selectedGroup, setSelectedGroup] = useState(null)
  const [prayerContent, setPrayerContent] = useState('')
  const [page, setPage] = useState(1)
  const [totalGroups, setTotalGroups] = useState(0)
  const [leaveConfirm, setLeaveConfirm] = useState(null)

  const token = () => localStorage.getItem('bf_token')

  const fetchGroups = useCallback(async () => {
    if (!isPremium) { setShowAuth(true); return }
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`${API_URL}/api/groups?page=${page}&limit=20`, {
        headers: { 'Authorization': `Bearer ${token()}` }
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json()
      setGroups(data.groups || [])
      setTotalGroups(data.total || data.groups?.length || 0)
    } catch {
      setError('Failed to load groups. Check your connection.')
      showToast('Failed to load groups', 'warning')
    } finally { setLoading(false) }
  }, [page, showToast])

  useEffect(() => { (async () => { try { if (isPremium) await fetchGroups() } catch { /* ignore */ } })() }, [isPremium, fetchGroups])

  const createGroup = useCallback(async () => {
    if (!name.trim()) return
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`${API_URL}/api/groups/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token()}` },
        body: JSON.stringify({ name: name.trim(), description: description.trim() })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.detail || 'Failed to create')
      showToast(`Group "${name.trim()}" created! Share the invite code with others.`)
      setName(''); setDescription(''); setSection('list'); setPage(1)
      fetchGroups()
    } catch (err) {
      showToast(err.message || 'Failed to create group', 'warning')
    } finally { setLoading(false) }
  }, [name, description, showToast, fetchGroups])

  const joinGroup = useCallback(async () => {
    if (!inviteCode.trim()) return
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`${API_URL}/api/groups/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token()}` },
        body: JSON.stringify({ invite_code: inviteCode.trim().toUpperCase() })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.detail || 'Invalid invite code')
      showToast(`Joined ${data.group_name || 'group'}!`)
      setInviteCode(''); setSection('list'); setPage(1)
      fetchGroups()
    } catch (err) {
      showToast(err.message || 'Invalid invite code', 'warning')
    } finally { setLoading(false) }
  }, [inviteCode, showToast, fetchGroups])

  const openGroup = useCallback(async (id) => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`${API_URL}/api/groups/${id}`, {
        headers: { 'Authorization': `Bearer ${token()}` }
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json()
      setSelectedGroup(data)
    } catch {
      showToast('Failed to load group details', 'warning')
    } finally { setLoading(false) }
  }, [showToast])

  const postPrayer = useCallback(async () => {
    if (!prayerContent.trim() || !selectedGroup) return
    try {
      const res = await fetch(`${API_URL}/api/groups/${selectedGroup.id}/prayer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token()}` },
        body: JSON.stringify({ content: prayerContent.trim() })
      })
      if (!res.ok) throw new Error()
      showToast('Prayer request shared with the group!')
      setPrayerContent('')
      openGroup(selectedGroup.id)
    } catch { showToast('Failed to post prayer request', 'warning') }
  }, [prayerContent, selectedGroup, showToast, openGroup])

  const leaveGroup = useCallback(async (id) => {
    try {
      const res = await fetch(`${API_URL}/api/groups/${id}/leave`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token()}` }
      })
      if (!res.ok) throw new Error()
      showToast('You have left the group')
      setSelectedGroup(null); setLeaveConfirm(null)
      fetchGroups()
    } catch { showToast('Failed to leave group', 'warning') }
  }, [showToast, fetchGroups])

  const handleLeaveClick = (id) => setLeaveConfirm(id)
  const cancelLeave = () => setLeaveConfirm(null)

  if (!isPremium) {
    return (
      <section className="view fade-in">
        <div className="card">
          <div className="card-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg></div>
          <h3>Small Groups</h3>
          <p>Sign in to access small groups, share prayer requests, and grow together in faith.</p>
          <button className="btn-primary" onClick={() => setShowAuth(true)}>Sign In</button>
        </div>
      </section>
    )
  }

  return (
    <section className="view fade-in" role="region" aria-label="Small Groups">
      <div className="groups-nav" role="tablist" aria-label="Groups sections">
        <button className={`groups-nav-btn${section === 'list' ? ' active' : ''}`}
          onClick={() => setSection('list')} role="tab" aria-selected={section === 'list'}>My Groups</button>
        <button className={`groups-nav-btn${section === 'create' ? ' active' : ''}`}
          onClick={() => setSection('create')} role="tab" aria-selected={section === 'create'}>Create</button>
        <button className={`groups-nav-btn${section === 'join' ? ' active' : ''}`}
          onClick={() => setSection('join')} role="tab" aria-selected={section === 'join'}>Join</button>
      </div>

      {error && <div className="error-banner" role="alert"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" style={{width:16,height:16,verticalAlign:'middle',marginRight:8}}><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>{error}</div>}

      {section === 'list' && (
        <div className="card">
          <div className="card-header-row">
            <h3>My Small Groups</h3>
            {totalGroups > 0 && <span className="count-badge">{totalGroups} group{totalGroups !== 1 ? 's' : ''}</span>}
          </div>
          {loading && <div className="loading-spinner" aria-label="Loading groups" />}
          {!loading && !error && groups.length === 0 && (
            <div className="empty-state" role="status">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{width:48,height:48,opacity:0.3,marginBottom:12}}><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
              <p>No groups yet. Create or join a group to get started.</p>
            </div>
          )}
          {!loading && groups.length > 0 && (
            <>
              <div className="groups-list" role="list">
                {groups.map(g => (
                  <div key={g.id} className="group-item" role="listitem">
                    <div className="group-item-info" onClick={() => openGroup(g.id)}
                      onKeyDown={e => { if (e.key === 'Enter') openGroup(g.id) }}
                      role="button" tabIndex={0} aria-label={`Open ${g.name}`}>
                      <strong className="group-name">{g.name}</strong>
                      <span className="group-meta">{g.member_count} member{g.member_count !== 1 ? 's' : ''} · {g.role}</span>
                      {g.description && <p className="group-desc">{g.description}</p>}
                    </div>
                    <div className="group-actions">
                      <button className="btn-sm" onClick={() => openGroup(g.id)} aria-label={`View ${g.name}`}>Open</button>
                    </div>
                  </div>
                ))}
              </div>
              {totalGroups > 20 && (
                <div className="pagination" role="navigation" aria-label="Group pagination">
                  <button className="btn-sm" disabled={page <= 1} onClick={() => setPage(p => Math.max(1, p - 1))}>Previous</button>
                  <span className="page-indicator">Page {page}</span>
                  <button className="btn-sm" disabled={groups.length < 20} onClick={() => setPage(p => p + 1)}>Next</button>
                </div>
              )}
            </>
          )}

          {selectedGroup && (
            <div className="group-detail-overlay" onClick={() => { setSelectedGroup(null); setLeaveConfirm(null) }}
              role="dialog" aria-modal="true" aria-label={`Group: ${selectedGroup.name}`}>
              <div className="group-detail" onClick={e => e.stopPropagation()}>
                <div className="group-detail-header">
                  <div>
                    <h3>{selectedGroup.name}</h3>
                    {selectedGroup.description && <p className="group-detail-desc">{selectedGroup.description}</p>}
                  </div>
                  <button className="group-close" onClick={() => { setSelectedGroup(null); setLeaveConfirm(null) }} aria-label="Close group details">✕</button>
                </div>
                <div className="group-detail-meta">
                  <div className="meta-item"><span className="meta-label">Invite Code</span><strong className="meta-value invite-code">{selectedGroup.invite_code}</strong></div>
                  <div className="meta-item"><span className="meta-label">Members</span><span className="meta-value">{selectedGroup.member_count}/{selectedGroup.max_members}</span></div>
                </div>

                <h4>Members ({selectedGroup.members?.length || 0})</h4>
                <div className="group-members-list" role="list">
                  {(selectedGroup.members || []).map(m => (
                    <div key={m.user_id} className="group-member-item" role="listitem">
                      <span className="member-name">{m.name}</span>
                      <span className={`group-member-role role-${m.role}`}>{m.role}</span>
                    </div>
                  ))}
                </div>

                <h4>Prayer Requests</h4>
                <div className="group-prayer-input">
                  <input type="text" placeholder="Share a prayer request..." aria-label="Prayer request" value={prayerContent}
                    onChange={e => setPrayerContent(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && postPrayer()} />
                  <button className="btn-sm" onClick={postPrayer} disabled={!prayerContent.trim()} aria-label="Post prayer request">Pray</button>
                </div>
                <div className="group-prayer-list">
                  {(selectedGroup.prayer_requests || []).map(p => (
                    <div key={p.id} className={`group-prayer-item${p.is_answered ? ' answered' : ''}`}>
                      <p>{p.content}</p>
                      <div className="group-prayer-meta">
                        <span className="prayer-author">{p.author_name}</span>
                        <span className={`prayer-status ${p.is_answered ? 'answered' : 'praying'}`}>
                          {p.is_answered ? (
                            <><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" style={{width:14,height:14,verticalAlign:'middle',marginRight:4}}><path d="M7 11l5 5 10-11"/><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z"/></svg> Answered</>
                          ) : (
                            <><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" style={{width:14,height:14,verticalAlign:'middle',marginRight:4}}><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg> Praying</>
                          )}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="group-leave-section">
                  {leaveConfirm === selectedGroup.id ? (
                    <div className="confirm-leave">
                      <p>Are you sure you want to leave this group?</p>
                      <div className="confirm-actions">
                        <button className="btn-danger" onClick={() => leaveGroup(selectedGroup.id)}>Yes, Leave</button>
                        <button className="btn-outline" onClick={cancelLeave}>Cancel</button>
                      </div>
                    </div>
                  ) : (
                    <button className="btn-danger" onClick={() => handleLeaveClick(selectedGroup.id)}>
                      Leave Group
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {section === 'create' && (
        <div className="card">
          <h3>Create a Small Group</h3>
          <p className="section-desc">Start a faith community to pray, study, and grow together.</p>
          <div className="settings-form">
            <label className="settings-label" htmlFor="group-name">Group Name</label>
            <input id="group-name" type="text" placeholder="e.g. Morning Prayer Warriors" aria-label="Group name" value={name}
              onChange={e => setName(e.target.value)} autoFocus />
            <label className="settings-label" htmlFor="group-desc">Description (optional)</label>
            <textarea id="group-desc" placeholder="What is this group about?" aria-label="Group description" value={description}
              onChange={e => setDescription(e.target.value)} rows={3} />
            <button className="btn-primary" onClick={createGroup} disabled={loading || !name.trim()}>
              {loading ? <span className="btn-loading"><span className="spinner-sm" /> Creating...</span> : 'Create Group'}
            </button>
          </div>
          <div className="info-box">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" style={{width:18,height:18,flexShrink:0}}><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
            <span>After creating, you'll get an invite code to share with others.</span>
          </div>
        </div>
      )}

      {section === 'join' && (
        <div className="card">
          <h3>Join a Group</h3>
          <p className="section-desc">Enter the invite code shared by your group leader.</p>
          <div className="settings-form">
            <label className="settings-label" htmlFor="invite-code">Invite Code</label>
            <input id="invite-code" type="text" placeholder="Enter invite code" aria-label="Invite code" value={inviteCode}
              onChange={e => setInviteCode(e.target.value.toUpperCase())}
              onKeyDown={e => e.key === 'Enter' && joinGroup()} autoFocus />
            <button className="btn-primary" onClick={joinGroup} disabled={loading || !inviteCode.trim()}>
              {loading ? <span className="btn-loading"><span className="spinner-sm" /> Joining...</span> : 'Join Group'}
            </button>
          </div>
          <div className="info-box">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" style={{width:18,height:18,flexShrink:0}}><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
            <span>Ask your group leader or a member for the invite code.</span>
          </div>
        </div>
      )}
    </section>
  )
}