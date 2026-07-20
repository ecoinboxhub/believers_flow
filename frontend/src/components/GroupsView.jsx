import { useState, useEffect, useCallback } from 'react'

const API_URL = import.meta.env.VITE_API_URL || ''

export default function GroupsView({ showToast, isPremium, setShowAuth }) {
  const [groups, setGroups] = useState([])
  const [loading, setLoading] = useState(false)
  const [section, setSection] = useState('list')
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [inviteCode, setInviteCode] = useState('')
  const [selectedGroup, setSelectedGroup] = useState(null)
  const [prayerContent, setPrayerContent] = useState('')
  const [expandedGroup, setExpandedGroup] = useState(null)

  const token = () => localStorage.getItem('bf_token')

  const fetchGroups = useCallback(async () => {
    if (!isPremium) { setShowAuth(true); return }
    setLoading(true)
    try {
      const res = await fetch(`${API_URL}/api/groups`, {
        headers: { 'Authorization': `Bearer ${token()}` }
      })
      if (!res.ok) throw new Error()
      const data = await res.json()
      setGroups(data.groups || [])
    } catch {
      showToast('Failed to load groups', 'warning')
    } finally { setLoading(false) }
  }, [showToast])

  useEffect(() => { if (isPremium) fetchGroups() }, [isPremium, fetchGroups])

  const createGroup = useCallback(async () => {
    if (!name.trim()) return
    setLoading(true)
    try {
      const res = await fetch(`${API_URL}/api/groups/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token()}` },
        body: JSON.stringify({ name: name.trim(), description: description.trim() })
      })
      if (!res.ok) throw new Error()
      showToast('Group created!')
      setName(''); setDescription(''); setSection('list')
      fetchGroups()
    } catch { showToast('Failed to create group', 'warning') }
    finally { setLoading(false) }
  }, [name, description, showToast, fetchGroups])

  const joinGroup = useCallback(async () => {
    if (!inviteCode.trim()) return
    setLoading(true)
    try {
      const res = await fetch(`${API_URL}/api/groups/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token()}` },
        body: JSON.stringify({ invite_code: inviteCode.trim().toUpperCase() })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.detail || 'Failed to join')
      showToast(`Joined ${data.group_name}!`)
      setInviteCode(''); setSection('list')
      fetchGroups()
    } catch (e) { showToast(e.message || 'Invalid invite code', 'warning') }
    finally { setLoading(false) }
  }, [inviteCode, showToast, fetchGroups])

  const openGroup = useCallback(async (id) => {
    setExpandedGroup(id)
    setLoading(true)
    try {
      const res = await fetch(`${API_URL}/api/groups/${id}`, {
        headers: { 'Authorization': `Bearer ${token()}` }
      })
      if (!res.ok) throw new Error()
      const data = await res.json()
      setSelectedGroup(data)
    } catch { showToast('Failed to load group details', 'warning') }
    finally { setLoading(false) }
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
      showToast('Prayer request posted!')
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
      showToast('Left group')
      setSelectedGroup(null)
      setExpandedGroup(null)
      fetchGroups()
    } catch { showToast('Failed to leave group', 'warning') }
  }, [showToast, fetchGroups])

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
    <section className="view fade-in">
      <div className="groups-nav">
        <button className={`groups-nav-btn${section === 'list' ? ' active' : ''}`} onClick={() => setSection('list')}>My Groups</button>
        <button className={`groups-nav-btn${section === 'create' ? ' active' : ''}`} onClick={() => setSection('create')}>Create</button>
        <button className={`groups-nav-btn${section === 'join' ? ' active' : ''}`} onClick={() => setSection('join')}>Join</button>
      </div>

      {section === 'list' && (
        <div className="card">
          <h3>My Small Groups</h3>
          {loading && <div className="loading-spinner" />}
          {!loading && groups.length === 0 && (
            <p className="empty-state">No groups yet. Create or join a group to get started.</p>
          )}
          <div className="groups-list">
            {groups.map(g => (
              <div key={g.id} className="group-item">
                <div className="group-item-info" onClick={() => openGroup(g.id)}>
                  <strong className="group-name">{g.name}</strong>
                  <span className="group-meta">{g.member_count} members · {g.role}</span>
                  {g.description && <p className="group-desc">{g.description}</p>}
                </div>
                <div className="group-actions">
                  <button className="btn-sm" onClick={() => openGroup(g.id)}>Open</button>
                </div>
              </div>
            ))}
          </div>

          {selectedGroup && (
            <div className="group-detail-overlay" onClick={() => setSelectedGroup(null)}>
              <div className="group-detail" onClick={e => e.stopPropagation()}>
                <div className="group-detail-header">
                  <h3>{selectedGroup.name}</h3>
                  <button className="group-close" onClick={() => setSelectedGroup(null)} aria-label="Close group details">✕</button>
                </div>
                <p className="group-detail-desc">{selectedGroup.description}</p>
                <div className="group-detail-meta">
                  <span>Invite code: <strong>{selectedGroup.invite_code}</strong></span>
                  <span>Members: {selectedGroup.member_count}/{selectedGroup.max_members}</span>
                </div>

                <h4>Members</h4>
                <div className="group-members-list">
                  {(selectedGroup.members || []).map(m => (
                    <div key={m.user_id} className="group-member-item">
                      <span>{m.name}</span>
                      <span className="group-member-role">{m.role}</span>
                    </div>
                  ))}
                </div>

                <h4>Prayer Requests</h4>
                <div className="group-prayer-input">
    <input type="text" placeholder="Share a prayer request..." aria-label="Prayer request" value={prayerContent}
      onChange={e => setPrayerContent(e.target.value)}
      onKeyDown={e => e.key === 'Enter' && postPrayer()} />
                  <button className="btn-sm" onClick={postPrayer} disabled={!prayerContent.trim()}>Pray</button>
                </div>
                <div className="group-prayer-list">
                  {(selectedGroup.prayer_requests || []).map(p => (
                    <div key={p.id} className={`group-prayer-item${p.is_answered ? ' answered' : ''}`}>
                      <p>{p.content}</p>
                      <div className="group-prayer-meta">
                        <span>{p.author_name}</span>
                        <span>{p.is_answered ? <><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" style={{width:14,height:14,verticalAlign:'middle',marginRight:4}}><path d="M7 11l5 5 10-11"/><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z"/></svg> Answered</> : <><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" style={{width:14,height:14,verticalAlign:'middle',marginRight:4}}><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg> Praying</>}</span>
                      </div>
                    </div>
                  ))}
                </div>

                <button className="btn-danger" onClick={() => leaveGroup(selectedGroup.id)} style={{ marginTop: 12 }}>
                  Leave Group
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {section === 'create' && (
        <div className="card">
          <h3>Create a Small Group</h3>
          <p>Start a faith community to pray, study, and grow together.</p>
          <div className="settings-form">
            <label className="settings-label">Group Name</label>
            <input type="text" placeholder="e.g. Morning Prayer Warriors" aria-label="Group name" value={name}
              onChange={e => setName(e.target.value)} />
            <label className="settings-label">Description (optional)</label>
            <textarea placeholder="What is this group about?" aria-label="Group description" value={description}
              onChange={e => setDescription(e.target.value)} rows={3} />
            <button className="btn-primary" onClick={createGroup} disabled={loading || !name.trim()}>
              {loading ? 'Creating...' : 'Create Group'}
            </button>
          </div>
        </div>
      )}

      {section === 'join' && (
        <div className="card">
          <h3>Join a Group</h3>
          <p>Enter the invite code shared by your group leader.</p>
          <div className="settings-form">
            <label className="settings-label">Invite Code</label>
            <input type="text" placeholder="Enter invite code" aria-label="Invite code" value={inviteCode}
              onChange={e => setInviteCode(e.target.value.toUpperCase())}
              onKeyDown={e => e.key === 'Enter' && joinGroup()} />
            <button className="btn-primary" onClick={joinGroup} disabled={loading || !inviteCode.trim()}>
              {loading ? 'Joining...' : 'Join Group'}
            </button>
          </div>
        </div>
      )}
    </section>
  )
}
