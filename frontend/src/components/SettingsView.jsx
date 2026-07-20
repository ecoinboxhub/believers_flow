import { memo, useState, useEffect, useRef } from 'react'
import { getAllTimezones, formatDateTime, getUserTimezone, getUserTimezoneAbbr, getUserTimezoneOffset } from '../dateUtils'

const API_URL = import.meta.env.VITE_API_URL || ''
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || ''
let gsiLoaded = false

function initGoogleButton(containerId, onSuccess) {
  if (!GOOGLE_CLIENT_ID || gsiLoaded) return
  gsiLoaded = true

  const script = document.createElement('script')
  script.src = 'https://accounts.google.com/gsi/client'
  script.async = true
  script.defer = true
  script.onload = () => {
    if (!window.google) return
    try {
      window.google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: async (response) => {
          try {
            const res = await fetch(`${API_URL}/api/auth/google`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ credential: response.credential })
            })
            const data = await res.json()
            if (!res.ok) return
            localStorage.setItem('bf_token', data.token)
            if (data.refresh_token) localStorage.setItem('bf_refresh_token', data.refresh_token)
            localStorage.setItem('bf_user', JSON.stringify(data.user))
            onSuccess(data.token, data.user)
          } catch {}
        },
      })
      const el = document.getElementById(containerId)
      if (el) {
        window.google.accounts.id.renderButton(el, {
          theme: 'outline', size: 'large', width: el.offsetWidth || 280, text: 'continue_with',
        })
      }
    } catch {
      // Origin not allowed or other GSI error — silently degrade
    }
  }
  document.head.appendChild(script)
}

const COLOR_THEMES = {
  believersflow: { name: 'BelieversFlow', bg: ['#1a2618','#1e2e1e','#283828','#1e301e'], header: ['rgba(26,38,24,0.95)','rgba(40,56,40,0.35)','rgba(60,80,55,0.15)'], gold: '#c89830', blue: '#8ab87a', purple: '#d4b040' },
  harvest: { name: 'Harvest', bg: ['#1a2618','#1e2e1e','#283828','#1e301e'], header: ['rgba(26,38,24,0.95)','rgba(40,56,40,0.35)','rgba(60,80,55,0.15)'], gold: '#c89830', blue: '#8ab87a', purple: '#d4b040' },
  royal: { name: 'Royal', bg: ['#1a1210','#2e1a10','#3e2518','#2e1f15'], header: ['rgba(46,26,16,0.95)','rgba(142,69,45,0.35)','rgba(213,139,58,0.15)'], gold: '#e8c040', blue: '#d58b3a', purple: '#c08040' },
  emerald: { name: 'Emerald', bg: ['#0a1a10','#0a2e18','#153e22','#0f2e1a'], header: ['rgba(10,46,24,0.95)','rgba(45,142,69,0.35)','rgba(58,213,99,0.15)'], gold: '#e0c850', blue: '#3ad57b', purple: '#2d8e4a' },
  ocean: { name: 'Ocean', bg: ['#0a1218','#0a1828','#152238','#0f1a28'], header: ['rgba(10,24,40,0.95)','rgba(45,69,142,0.35)','rgba(58,99,213,0.15)'], gold: '#90d0c0', blue: '#3a7bd5', purple: '#2d4a8e' },
  sunset: { name: 'Sunset', bg: ['#1a1010','#2e1810','#3e2218','#2e1a15'], header: ['rgba(46,24,16,0.95)','rgba(142,69,45,0.35)','rgba(213,139,58,0.15)'], gold: '#e8a84c', blue: '#d58b3a', purple: '#8e5a2d' },
}

const THEME_OPTIONS = [
  { id: 'believersflow', name: 'BelieversFlow', colors: ['#c09030', '#c89830', '#3a4838'] },
  { id: 'harvest', name: 'Harvest', colors: ['#c09030', '#c89830', '#3a4838'] },
  { id: 'royal', name: 'Royal', colors: ['#c08040', '#e8c040', '#3e2518'] },
  { id: 'emerald', name: 'Emerald', colors: ['#2d8e4a', '#e0c850', '#0a2e18'] },
  { id: 'ocean', name: 'Ocean', colors: ['#2d4a8e', '#90d0c0', '#0a1828'] },
  { id: 'sunset', name: 'Sunset', colors: ['#8e5a2d', '#e8a84c', '#2e1810'] },
]

function GoogleSignInButton({ onSuccess }) {
  const id = 'google-btn-' + Math.random().toString(36).slice(2, 8)
  const mounted = useRef(false)

  useEffect(() => {
    if (mounted.current || !GOOGLE_CLIENT_ID) return
    mounted.current = true
    initGoogleButton(id, onSuccess)
  }, [])

  if (!GOOGLE_CLIENT_ID) return null

  return (
    <div className="settings-google-section">
      <div className="settings-auth-divider"><span>or continue with</span></div>
      <div id={id} className="settings-google-btn" />
    </div>
  )
}

function SettingsAuthForm({ mode, onSuccess, onSwitch }) {
  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const endpoint = mode === 'register' ? '/api/auth/register' : '/api/auth/login'
      const body = mode === 'register' ? { email, name, password } : { email, password }
      const res = await fetch(`${API_URL}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })
      const data = await res.json()
      if (!res.ok) { setError(data.detail || 'Authentication failed'); return }
      localStorage.setItem('bf_token', data.token)
      localStorage.setItem('bf_refresh_token', data.refresh_token)
      localStorage.setItem('bf_user', JSON.stringify(data.user))
      onSuccess(data.token, data.user)
    } catch {
      setError('Connection failed. Check your network.')
    } finally { setLoading(false) }
  }

  return (
    <div className="settings-auth-form">
      {mode === 'register' && (
        <div className="auth-field">
          <label>Full Name</label>
          <input type="text" placeholder="Your full name" value={name}
            onChange={e => setName(e.target.value)} required />
        </div>
      )}
      <div className="auth-field">
        <label>Email Address</label>
        <input type="email" placeholder="you@example.com" value={email}
          onChange={e => setEmail(e.target.value)} required />
      </div>
      <div className="auth-field">
        <label>Password</label>
        <input type="password" placeholder="Min 6 characters" value={password}
          onChange={e => setPassword(e.target.value)} minLength={6} required />
      </div>
      {error && <div className="auth-error">{error}</div>}
      <button type="submit" className="settings-auth-submit" onClick={handleSubmit} disabled={loading}>
        {loading ? 'Please wait...' : mode === 'register' ? 'Create Free Account' : 'Sign In'}
      </button>
      <GoogleSignInButton onSuccess={onSuccess} />
      {mode === 'register' && (
        <div className="settings-auth-badges">
          <span><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" style={{width:14,height:14,verticalAlign:'middle',marginRight:4}}><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg> Secure</span>
          <span>✓ No CC required</span>
        </div>
      )}
      <div className="settings-auth-toggle">
        {mode === 'login' ? (
          <span>New here? <button onClick={() => onSwitch('register')}>Create account</button></span>
        ) : (
          <span>Have an account? <button onClick={() => onSwitch('login')}>Sign in</button></span>
        )}
      </div>
      <button className="settings-auth-back" onClick={() => onSwitch(null)}>← Back to profile</button>
    </div>
  )
}

const SettingsView = memo(function SettingsView({
  settings, updateSetting, updateNotification, customColors, updateCustomColor,
  isPremium, authUser, setShowAuth, handleLogout,
  exportData, importData, resetAllData, openLegalSettings, showToast,
  settingsAuthMode, setSettingsAuthMode,
}) {
  const [settingsSection, setSettingsSection] = useState(settingsAuthMode ? 'profile' : 'appearance')
  const [showChangePassword, setShowChangePassword] = useState(false)
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [newPasswordConfirm, setNewPasswordConfirm] = useState('')
  const [passwordLoading, setPasswordLoading] = useState(false)
  const [showDeleteAccount, setShowDeleteAccount] = useState(false)
  const [deletePassword, setDeletePassword] = useState('')
  const [deleteConfirm, setDeleteConfirm] = useState('')
  const [deleteLoading, setDeleteLoading] = useState(false)

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword) return
    if (newPassword !== newPasswordConfirm) { showToast('New passwords do not match'); return }
    if (newPassword.length < 6) { showToast('Password must be at least 6 characters'); return }
    setPasswordLoading(true)
    try {
      const token = localStorage.getItem('bf_token')
      const resp = await fetch(`${API_URL}/api/auth/change-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ current_password: currentPassword, new_password: newPassword })
      })
      if (resp.ok) {
        showToast('Password changed successfully')
        setShowChangePassword(false)
        setCurrentPassword('')
        setNewPassword('')
        setNewPasswordConfirm('')
      } else {
        const data = await resp.json()
        showToast(data.detail || 'Failed to change password')
      }
    } catch { showToast('Network error') }
    setPasswordLoading(false)
  }

  const handleDeleteAccount = async () => {
    if (deleteConfirm !== 'DELETE MY ACCOUNT') return
    if (!deletePassword) return
    setDeleteLoading(true)
    try {
      const token = localStorage.getItem('bf_token')
      const resp = await fetch(`${API_URL}/api/auth/delete-account`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ password: deletePassword, confirm: deleteConfirm })
      })
      if (resp.ok) {
        showToast('Account deleted successfully')
        handleLogout()
      } else {
        const data = await resp.json()
        showToast(data.detail || 'Failed to delete account')
      }
    } catch { showToast('Network error') }
    setDeleteLoading(false)
  }

  return (
    <section className="view settings-view fade-in">
      <div className="settings-nav">
          {[{ id: 'appearance', label: 'Appearance' }, { id: 'profile', label: 'Profile' }, { id: 'notifications', label: 'Notifications' }, { id: 'backup', label: 'Backup' }, { id: 'security', label: 'Security' }, { id: 'legal', label: 'Legal' }, { id: 'about', label: 'About' }].map(s => (
          <button key={s.id} className={`settings-nav-btn${settingsSection === s.id ? ' active' : ''}`} onClick={() => setSettingsSection(s.id)}>{s.label}</button>
        ))}
      </div>

      {settingsSection === 'appearance' && (
        <div className="settings-content">
          <div className="card">
            <h3>Color Theme</h3>
            <p>Choose your preferred color scheme.</p>
            <div className="theme-grid">
              {THEME_OPTIONS.map(t => (
                <button key={t.id} className={`theme-btn${settings.theme === t.id ? ' active' : ''}`} onClick={() => updateSetting('theme', t.id)}>
                  <div className="theme-swatches">
                    {t.colors.map((c, i) => <span key={i} className="theme-swatch" style={{ background: c }} />)}
                  </div>
                  <span className="theme-name">{t.name}</span>
                </button>
              ))}
              <button className={`theme-btn${settings.theme === 'custom' ? ' active' : ''}`} onClick={() => updateSetting('theme', 'custom')}>
                <div className="theme-swatches">
                  <span className="theme-swatch" style={{ background: customColors.primary }} />
                  <span className="theme-swatch" style={{ background: customColors.accent }} />
                  <span className="theme-swatch" style={{ background: customColors.background }} />
                </div>
                <span className="theme-name">Custom</span>
              </button>
            </div>
            {settings.theme === 'custom' && (
              <div className="custom-color-picker">
                {[{ key: 'primary', label: 'Primary' }, { key: 'accent', label: 'Accent' }, { key: 'background', label: 'Background' }].map(c => (
                  <div key={c.key} className="color-picker-row">
                    <label>{c.label}</label>
                    <div className="color-input-wrap">
                      <input type="color" value={customColors[c.key]} onChange={e => updateCustomColor(c.key, e.target.value)} className="color-input-native" />
                      <span className="color-hex">{customColors[c.key]}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="card">
            <h3>Display Mode</h3>
            <p>Choose your preferred screen shade for comfortable reading.</p>
            <div className="mode-toggle">
              <button className={`mode-btn${settings.mode === 'dark' ? ' active' : ''}`} onClick={() => updateSetting('mode', 'dark')} aria-label="Dark mode">
                <svg className="mode-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                </svg>
                <span className="mode-label">Dark</span>
              </button>
              <button className={`mode-btn${settings.mode === 'light' ? ' active' : ''}`} onClick={() => updateSetting('mode', 'light')} aria-label="Light mode">
                <svg className="mode-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="5" />
                  <line x1="12" y1="1" x2="12" y2="3" />
                  <line x1="12" y1="21" x2="12" y2="23" />
                  <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
                  <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                  <line x1="1" y1="12" x2="3" y2="12" />
                  <line x1="21" y1="12" x2="23" y2="12" />
                  <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
                  <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
                </svg>
                <span className="mode-label">Light</span>
              </button>
              <button className={`mode-btn${settings.mode === 'grey' ? ' active' : ''}`} onClick={() => updateSetting('mode', 'grey')} aria-label="Grey mode">
                <svg className="mode-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <circle cx="12" cy="12" r="5" fill="currentColor" opacity="0.3" />
                </svg>
                <span className="mode-label">Grey</span>
              </button>
            </div>
          </div>

          <div className="card">
            <h3>Font Size</h3>
            <p>Adjust text size across the app.</p>
            <div className="font-size-options">
              {[{ id: 'small', label: 'S' }, { id: 'medium', label: 'M' }, { id: 'large', label: 'L' }].map(f => (
                <button key={f.id} className={`font-size-btn${settings.fontSize === f.id ? ' active' : ''}`} onClick={() => updateSetting('fontSize', f.id)}>{f.label}</button>
              ))}
            </div>
          </div>

          <div className="card">
            <h3>Reading Layout</h3>
            <p>Choose your Bible reading layout preference.</p>
            <div className="layout-options">
              {[{ id: 'standard', label: 'Standard', desc: 'Default spacing' }, { id: 'wide', label: 'Wide', desc: 'More padding and larger text' }, { id: 'compact', label: 'Compact', desc: 'Tighter spacing' }].map(l => (
                <button key={l.id} className={`layout-btn${settings.readingLayout === l.id ? ' active' : ''}`} onClick={() => updateSetting('readingLayout', l.id)}>
                  <span className="layout-name">{l.label}</span>
                  <span className="layout-desc">{l.desc}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="card">
            <h3>World Clock</h3>
            <p>Current time across timezones (your timezone: {getUserTimezoneAbbr()}).</p>
            <div className="world-clock-list">
              {(() => {
                const times = getAllTimezones()
                return times.map(tz => (
                  <div key={tz.id} className={`world-clock-row${tz.tz === getUserTimezone() ? ' primary' : ''}`}>
                    <span className="world-clock-tz">{tz.label}</span>
                    <span className="world-clock-time">{tz.hours}:{tz.minutes}</span>
                  </div>
                ))
              })()}
            </div>
          </div>
        </div>
      )}

      {settingsSection === 'profile' && (
        <div className="settings-content">
          {!isPremium && (
            <div className="upgrade-banner" onClick={() => setShowAuth(true)}>
              <span className="upgrade-banner-icon">Upgrade</span>
              <div className="upgrade-banner-info">
                <span className="upgrade-banner-title">Upgrade to Premium</span>
                <span className="upgrade-banner-desc">Unlock AI features, cloud sync, and more</span>
              </div>
              <button className="upgrade-banner-btn">Upgrade</button>
            </div>
          )}
          <div className="card">
            <h3>Profile</h3>
            <p>Manage your personal information.</p>
            {authUser && (
              <div className="sync-status">
                <span className="sync-badge">Synced</span>
                <span className="sync-email">{authUser.email}</span>
              </div>
            )}
            <div className="profile-fields">
              <label className="settings-label">Your Name</label>
              <input type="text" placeholder="Enter your name" value={settings.profileName} onChange={e => updateSetting('profileName', e.target.value)} />
              <label className="settings-label">Email</label>
              <input type="email" placeholder="Enter your email" value={settings.profileEmail} onChange={e => updateSetting('profileEmail', e.target.value)} />
            </div>
            {authUser ? (
              <div>
                <div className="settings-signed-in">
                  <div className="settings-signed-in-avatar">
                    {authUser.name ? authUser.name.charAt(0).toUpperCase() : <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" style={{width:20,height:20}}><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>}
                  </div>
                  <div className="settings-signed-in-info">
                    <div className="settings-signed-in-name">{authUser.name || 'User'}</div>
                    <div className="settings-signed-in-email">{authUser.email}</div>
                  </div>
                  <span className={`settings-signed-in-plan ${authUser.plan === 'premium' ? 'premium' : 'free'}`}>
                    {authUser.plan === 'premium' ? 'Premium' : 'Free'}
                  </span>
                </div>
                <button className="btn-danger" onClick={handleLogout} style={{ marginTop: '12px' }}>Sign Out</button>
              </div>
            ) : settingsAuthMode ? (
              <SettingsAuthForm
                mode={settingsAuthMode}
                onSuccess={(token, user) => {
                  setSettingsAuthMode(null)
                  showToast('Signed in successfully!')
                  setTimeout(() => window.location.reload(), 500)
                }}
                onSwitch={(m) => setSettingsAuthMode(m)}
              />
            ) : (
              <div className="profile-auth-buttons">
                <button className="btn-primary" onClick={() => setSettingsAuthMode('login')} style={{ marginTop: '12px' }}>Sign In</button>
                <div className="profile-auth-divider">
                  <span>or</span>
                </div>
                <button className="btn-outline" onClick={() => setSettingsAuthMode('register')} style={{ width: '100%' }}>Create Free Account</button>
              </div>
            )}
          </div>
          <div className="card">
            <h3>Language</h3>
            <p>Select your preferred language.</p>
            <select value={settings.language} onChange={e => updateSetting('language', e.target.value)}>
              <option value="en">English</option>
              <option value="es">Español</option>
              <option value="fr">Français</option>
              <option value="de">Deutsch</option>
              <option value="pt">Português</option>
            </select>
            <p className="settings-hint">More translations coming soon.</p>
          </div>
        </div>
      )}

      {settingsSection === 'notifications' && (
        <div className="settings-content">
          <div className="card">
            <h3>Notification Preferences</h3>
            <p>Choose which reminders you would like to receive.</p>
            <div className="toggle-list">
              {[
                { key: 'prayerReminder', label: 'Prayer Reminder', desc: 'Get reminded to log your daily prayer' },
                { key: 'dailyVerse', label: 'Daily Verse', desc: 'Receive a daily Bible verse notification' },
                { key: 'taskReminders', label: 'Task Reminders', desc: 'Get notified about pending tasks' },
              ].map(n => (
                <div key={n.key} className="toggle-row">
                  <div className="toggle-info">
                    <span className="toggle-label">{n.label}</span>
                    <span className="toggle-desc">{n.desc}</span>
                  </div>
                  <label className="toggle-switch">
                    <input type="checkbox" checked={settings.notifications[n.key]} onChange={e => updateNotification(n.key, e.target.checked)} />
                    <span className="toggle-slider" />
                  </label>
                </div>
              ))}
            </div>
            <p className="settings-hint">Notifications require browser permission.</p>
          </div>
        </div>
      )}

      {settingsSection === 'backup' && (
        <div className="settings-content">
          <div className="card">
            <h3>Backup and Restore</h3>
            <p>Export your data to a file or restore from a previous backup.</p>
            <div className="backup-actions">
              <button className="btn-primary" onClick={exportData}>Export Backup</button>
              <button className="btn-outline" onClick={importData}>Import Backup</button>
            </div>
          </div>
          <div className="card">
            <h3>Danger Zone</h3>
            <p>Permanently delete all data stored on this device.</p>
            <button className="btn-danger" onClick={resetAllData}>Reset All Data</button>
          </div>
        </div>
      )}

      {settingsSection === 'legal' && (
        <div className="settings-content">
          <div className="card">
            <h3>Legal Documents</h3>
            <p>Review our legal documents and policies.</p>

            <div className="legal-settings-list">
              <div className="legal-settings-item" onClick={() => openLegalSettings('privacy')}>
                <div className="legal-settings-info">
                  <h4>Privacy Policy</h4>
                  <p>How we collect, use, and protect your data</p>
                </div>
                <span className="legal-settings-arrow">{'>'}</span>
              </div>
              <div className="legal-settings-item" onClick={() => openLegalSettings('tos')}>
                <div className="legal-settings-info">
                  <h4>Terms of Service</h4>
                  <p>Legal agreement between you and BelieversFlow</p>
                </div>
                <span className="legal-settings-arrow">{'>'}</span>
              </div>
              <div className="legal-settings-item" onClick={() => openLegalSettings('tou')}>
                <div className="legal-settings-info">
                  <h4>Terms of Use</h4>
                  <p>Rules for using the app and community features</p>
                </div>
                <span className="legal-settings-arrow">{'>'}</span>
              </div>
              <div className="legal-settings-item" onClick={() => openLegalSettings('community')}>
                <div className="legal-settings-info">
                  <h4>Community Guidelines</h4>
                  <p>How to behave in the BelieversFlow community</p>
                </div>
                <span className="legal-settings-arrow">{'>'}</span>
              </div>
              <div className="legal-settings-item" onClick={() => openLegalSettings('data-collection')}>
                <div className="legal-settings-info">
                  <h4>Data Collection Disclosure</h4>
                  <p>Complete disclosure of all data we collect</p>
                </div>
                <span className="legal-settings-arrow">{'>'}</span>
              </div>
            </div>
          </div>

          <div className="card">
            <h3>Legal Acceptance Status</h3>
            <p>Your current legal acceptance status.</p>
            <div className="legal-status-info">
              <div className="legal-status-row">
                <span>Legal Version</span>
                <span>{localStorage.getItem('bf_legal_accepted') ? `v${JSON.parse(localStorage.getItem('bf_legal_accepted')).version}` : 'Not accepted'}</span>
              </div>
              <div className="legal-status-row">
                <span>Accepted At</span>
                <span>{localStorage.getItem('bf_legal_accepted') ? new Date(JSON.parse(localStorage.getItem('bf_legal_accepted')).accepted_at).toLocaleDateString() : 'Not accepted'}</span>
              </div>
            </div>
            <button className="btn-outline" onClick={() => openLegalSettings()}>
              Review All Legal Documents
            </button>
          </div>
        </div>
      )}

      {settingsSection === 'security' && authUser && (
        <div className="settings-content">
          <div className="card">
            <h3>How We Protect Your Account</h3>
            <p style={{ lineHeight: 1.7, marginTop: 12 }}>
              Your account is protected by several layers of security. Your password is encrypted using industry-standard hashing, which means even we cannot see your actual password. All communication between your device and our servers is encrypted using TLS, the same technology used by banks and financial institutions. Your session expires automatically after a period of inactivity, and you can change your password at any time. If you ever suspect unauthorized access to your account, we recommend changing your password immediately.
            </p>
          </div>

          <div className="card">
            <h3>Change Password</h3>
            <p>Update your account password.</p>
            {showChangePassword ? (
              <div className="settings-form">
                <label className="settings-label">Current Password</label>
                <input type="password" placeholder="Enter current password" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} />
                <label className="settings-label">New Password</label>
                <input type="password" placeholder="Enter new password" value={newPassword} onChange={e => setNewPassword(e.target.value)} />
                <label className="settings-label">Confirm New Password</label>
                <input type="password" placeholder="Confirm new password" value={newPasswordConfirm} onChange={e => setNewPasswordConfirm(e.target.value)} />
                <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                  <button className="btn-primary" onClick={handleChangePassword} disabled={passwordLoading}>{passwordLoading ? 'Changing...' : 'Change Password'}</button>
                  <button className="btn-outline" onClick={() => { setShowChangePassword(false); setCurrentPassword(''); setNewPassword(''); setNewPasswordConfirm('') }}>Cancel</button>
                </div>
              </div>
            ) : (
              <button className="btn-outline" onClick={() => setShowChangePassword(true)}>Change Password</button>
            )}
          </div>

          <div className="card" style={{ borderColor: '#e74c3c' }}>
            <h3 style={{ color: '#e74c3c' }}>Danger Zone</h3>
            <p>Once you delete your account, there is no going back. All your data will be permanently removed.</p>
            {showDeleteAccount ? (
              <div className="settings-form">
                <label className="settings-label">Enter your password</label>
                <input type="password" placeholder="Password" value={deletePassword} onChange={e => setDeletePassword(e.target.value)} />
                <label className="settings-label">Type "DELETE MY ACCOUNT" to confirm</label>
                <input type="text" placeholder='DELETE MY ACCOUNT' value={deleteConfirm} onChange={e => setDeleteConfirm(e.target.value)} style={{ borderColor: deleteConfirm === 'DELETE MY ACCOUNT' ? '#27ae60' : '#e74c3c' }} />
                <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                  <button className="btn-danger" onClick={handleDeleteAccount} disabled={deleteLoading || deleteConfirm !== 'DELETE MY ACCOUNT'}>{deleteLoading ? 'Deleting...' : 'Delete Account'}</button>
                  <button className="btn-outline" onClick={() => { setShowDeleteAccount(false); setDeletePassword(''); setDeleteConfirm('') }}>Cancel</button>
                </div>
              </div>
            ) : (
              <button className="btn-danger" onClick={() => setShowDeleteAccount(true)}>Delete Account</button>
            )}
          </div>
        </div>
      )}

      {settingsSection === 'about' && (
        <div className="settings-content">
          <div className="card about-card">
            <div className="about-logo">
              <span className="about-cross">+</span>
            </div>
            <h3>BelieversFlow</h3>
            <div className="about-info">
              <div className="about-row"><span>Version</span><span>4.2.0</span></div>
              <div className="about-row"><span>Current Time</span><span>{formatDateTime()}</span></div>
              <div className="about-row"><span>Timezone</span><span>{getUserTimezoneAbbr()} — {getUserTimezone()} (UTC{getUserTimezoneOffset() >= 0 ? '+' : ''}{getUserTimezoneOffset()})</span></div>
            </div>
            <p className="about-desc">A Christian task manager and spiritual growth tracker. Built with faith, for believers.</p>
            <div className="about-links">
              <a href="https://github.com/ecoinboxhub/believers_flow" target="_blank" rel="noopener">GitHub</a>
              <a href="https://believers-flow-frontend.vercel.app" target="_blank" rel="noopener">Web App</a>
            </div>
          </div>
        </div>
      )}
    </section>
  )
})

export default SettingsView
