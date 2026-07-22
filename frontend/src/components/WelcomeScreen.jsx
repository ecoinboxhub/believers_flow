import { useState } from 'react'

const CROSS_SVGS = {
  ornate: `<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="28" y="6" width="8" height="52" rx="2" fill="currentColor"/>
    <rect x="6" y="26" width="52" height="8" rx="2" fill="currentColor"/>
    <circle cx="32" cy="32" r="28" stroke="currentColor" strokeWidth="1.5" opacity="0.3" fill="none"/>
    <circle cx="32" cy="32" r="22" stroke="currentColor" strokeWidth="0.5" opacity="0.2" fill="none"/>
  </svg>`,
}

export default function WelcomeScreen({ onAction }) {
  const [selected, setSelected] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  const handleAction = (action) => {
    setSelected(action)
    setSubmitting(true)
    setTimeout(() => onAction(action), 400)
  }

  return (
    <div className="welcome-overlay">
      <div className="welcome-bg-orb welcome-bg-orb-1" />
      <div className="welcome-bg-orb welcome-bg-orb-2" />
      <div className="welcome-bg-orb welcome-bg-orb-3" />

      <div className={`welcome-panel ${selected ? 'welcome-exit' : ''}`}>
        <div className="welcome-header">
          <div className="welcome-cross-icon" dangerouslySetInnerHTML={{ __html: CROSS_SVGS.ornate }} />
          <h1 className="welcome-title">BelieversFlow</h1>
          <p className="welcome-tagline">Your Christian lifestyle companion</p>
          <div className="welcome-divider" />
        </div>

        <div className="welcome-body">
          <p className="welcome-subtitle">How would you like to get started?</p>

          <div className="welcome-cards">
            <button
              className={`welcome-card welcome-card-register ${selected === 'register' ? 'selected' : ''}`}
              onClick={() => handleAction('register')}
              disabled={submitting}
            >
              <span className="welcome-card-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="8.5" cy="7" r="4" />
                  <line x1="20" y1="8" x2="20" y2="14" /><line x1="23" y1="11" x2="17" y2="11" />
                </svg>
              </span>
              <div className="welcome-card-text">
                <span className="welcome-card-label">Create Account</span>
                <span className="welcome-card-desc">Sync data across devices and unlock AI features</span>
              </div>
              <svg className="welcome-card-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
            </button>

            <button
              className={`welcome-card ${selected === 'login' ? 'selected' : ''}`}
              onClick={() => handleAction('login')}
              disabled={submitting}
            >
              <span className="welcome-card-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
                  <polyline points="10 17 15 12 10 7" /><line x1="15" y1="12" x2="3" y2="12" />
                </svg>
              </span>
              <div className="welcome-card-text">
                <span className="welcome-card-label">Sign In</span>
                <span className="welcome-card-desc">Continue with your existing account</span>
              </div>
              <svg className="welcome-card-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
            </button>

            <button
              className={`welcome-card welcome-card-guest ${selected === 'guest' ? 'selected' : ''}`}
              onClick={() => handleAction('guest')}
              disabled={submitting}
            >
              <span className="welcome-card-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
              </span>
              <div className="welcome-card-text">
                <span className="welcome-card-label">Continue as Guest</span>
                <span className="welcome-card-desc">Use the app locally. Sign up anytime from Settings</span>
              </div>
              <svg className="welcome-card-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
            </button>
          </div>
        </div>

        <div className="welcome-footer">
          <div className="welcome-streak-preview">
            <span className="welcome-streak-dot" />
            <span className="welcome-streak-dot" />
            <span className="welcome-streak-dot welcome-streak-dot-active" />
            <span className="welcome-streak-dot" />
            <span className="welcome-streak-dot" />
          </div>
          <p className="welcome-footer-text">Free forever &middot; No credit card &middot; Faith driven</p>
        </div>
      </div>
    </div>
  )
}
