import { memo, useState } from 'react'
import { getAllTimezones, formatDateTime, getUserTimezone, getUserTimezoneAbbr, getUserTimezoneOffset } from '../dateUtils'

const THEME_OPTIONS = [
  { id: 'believersflow', name: 'BelieversFlow', colors: ['#c09030', '#c89830', '#3a4838'] },
  { id: 'harvest', name: 'Harvest', colors: ['#c09030', '#c89830', '#3a4838'] },
  { id: 'royal', name: 'Royal', colors: ['#c08040', '#e8c040', '#3e2518'] },
  { id: 'emerald', name: 'Emerald', colors: ['#2d8e4a', '#e0c850', '#0a2e18'] },
  { id: 'ocean', name: 'Ocean', colors: ['#2d4a8e', '#90d0c0', '#0a1828'] },
  { id: 'sunset', name: 'Sunset', colors: ['#8e5a2d', '#e8a84c', '#2e1810'] },
]

const SettingsView = memo(function SettingsView({
  settings, updateSetting, updateNotification, customColors, updateCustomColor,
  exportData, importData, resetAllData, openLegalSettings,
}) {
  const [settingsSection, setSettingsSection] = useState('appearance')

  return (
    <section className="view settings-view fade-in">
      <div className="settings-nav">
          {[{ id: 'appearance', label: 'Appearance' }, { id: 'profile', label: 'Profile' }, { id: 'notifications', label: 'Notifications' }, { id: 'backup', label: 'Backup' }, { id: 'legal', label: 'Legal' }, { id: 'about', label: 'About' }].map(s => (
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
          <div className="card">
            <h3>Profile</h3>
            <p>Manage your personal information.</p>
            <div className="profile-fields">
              <label className="settings-label">Your Name</label>
              <input type="text" placeholder="Enter your name" value={settings.profileName} onChange={e => updateSetting('profileName', e.target.value)} />
              <label className="settings-label">Email</label>
              <input type="email" placeholder="Enter your email" value={settings.profileEmail} onChange={e => updateSetting('profileEmail', e.target.value)} />
            </div>
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
                <span className="legal-status-label">Legal Version</span>
                <span className={`legal-status-badge${localStorage.getItem('bf_legal_accepted') ? ' is-accepted' : ''}`}>
                  {localStorage.getItem('bf_legal_accepted') ? `v${JSON.parse(localStorage.getItem('bf_legal_accepted')).version}` : 'Not accepted'}
                </span>
              </div>
              <div className="legal-status-row">
                <span className="legal-status-label">Accepted At</span>
                <span className={`legal-status-badge${localStorage.getItem('bf_legal_accepted') ? ' is-accepted' : ''}`}>
                  {localStorage.getItem('bf_legal_accepted') ? new Date(JSON.parse(localStorage.getItem('bf_legal_accepted')).accepted_at).toLocaleDateString() : 'Not accepted'}
                </span>
              </div>
            </div>
            <button className="btn-primary legal-review-btn" onClick={() => openLegalSettings()}>
              Review All Legal Documents
            </button>
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
