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
  const [selected, setSelected] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const handleAction = () => {
    setSelected(true)
    setSubmitting(true)
    setTimeout(() => onAction('guest'), 400)
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
          <p className="welcome-subtitle">Everything you need, free, on this device.</p>

          <button
            className={`welcome-card welcome-card-guest ${selected ? 'selected' : ''}`}
            onClick={handleAction}
            disabled={submitting}
          >
            <span className="welcome-card-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                <circle cx="12" cy="12" r="3" />
              </svg>
            </span>
            <div className="welcome-card-text">
              <span className="welcome-card-label">Get Started</span>
              <span className="welcome-card-desc">Launch BelieversFlow and begin your journey</span>
            </div>
            <svg className="welcome-card-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
          </button>
        </div>

        <div className="welcome-footer">
          <div className="welcome-streak-preview">
            <span className="welcome-streak-dot" />
            <span className="welcome-streak-dot" />
            <span className="welcome-streak-dot welcome-streak-dot-active" />
            <span className="welcome-streak-dot" />
            <span className="welcome-streak-dot" />
          </div>
          <p className="welcome-footer-text">Free forever &middot; Faith driven</p>
        </div>
      </div>
    </div>
  )
}
