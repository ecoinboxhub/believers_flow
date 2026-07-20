import { useState } from 'react'

const iconStyle = { width: 24, height: 24, verticalAlign: 'middle' }

const svgIcons = {
  robot: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={iconStyle}><path d="M12 2a4 4 0 014 4v2a4 4 0 01-8 0V6a4 4 0 014-4z"/><path d="M18 14h.01"/><path d="M6 14h.01"/><path d="M12 14v4"/><path d="M8 18h8"/></svg>,
  lightbulb: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={iconStyle}><path d="M9 18h6"/><path d="M10 22h4"/><path d="M12 2a7 7 0 00-4 12.7V17h8v-2.3A7 7 0 0012 2z"/></svg>,
  book: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={iconStyle}><path d="M4 19.5A2.5 2.5 0 016.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z"/></svg>,
  search: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={iconStyle}><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>,
  scale: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={iconStyle}><line x1="12" y1="3" x2="12" y2="21"/><polyline points="1 8 5 8 9 4"/><polyline points="23 8 19 8 15 12"/><polyline points="1 16 5 16 9 20"/><polyline points="23 16 19 16 15 12"/></svg>,
  cloud: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={iconStyle}><path d="M18 10h-1.26A8 8 0 109 20h9a5 5 0 000-10z"/></svg>,
  music: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={iconStyle}><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>,
}

const PREMIUM_FEATURES = {
  ai_chat: { name: 'AI Faith Assistant', icon: svgIcons.robot, desc: 'Get personalized scripture-based guidance and prayer support from AI.' },
  ai_explain: { name: 'AI Verse Explanation', icon: svgIcons.lightbulb, desc: 'Deep, AI-powered explanations of any Bible verse.' },
  ai_commentary: { name: 'AI Commentary', icon: svgIcons.book, desc: 'Verse-by-verse theological commentary and insights.' },
  ai_concordance: { name: 'Bible Concordance', icon: svgIcons.search, desc: 'Search any word or topic across all of Scripture.' },
  ai_compare: { name: 'Version Comparison', icon: svgIcons.scale, desc: 'Compare how different translations render the same passage.' },
  cloud_sync: { name: 'Cloud Sync', icon: svgIcons.cloud, desc: 'Sync your data across all your devices seamlessly.' },
  hymn_audio: { name: 'Hymn Audio', icon: svgIcons.music, desc: 'Listen to beautiful church organ melodies for hymns.' },
}

export default function PremiumGate({ feature, onSignUp, children }) {
  const [showModal, setShowModal] = useState(false)
  const info = PREMIUM_FEATURES[feature]

  if (!info) return children

  return (
    <>
      <div className="premium-gated" onClick={() => setShowModal(true)}>
        <div className="premium-gated-content">
          {children}
        </div>
        <div className="premium-gated-overlay">
          <span className="premium-lock-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{width:20,height:20}}><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg></span>
          <span className="premium-gated-label">Premium</span>
        </div>
      </div>

      {showModal && (
        <div className="premium-modal-overlay" onClick={() => setShowModal(false)}>
          <div className="premium-modal" onClick={e => e.stopPropagation()}>
            <button className="premium-modal-close" onClick={() => setShowModal(false)}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{width:18,height:18}}><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>
            <div className="premium-modal-icon">{info.icon}</div>
            <h2 className="premium-modal-title">{info.name}</h2>
            <p className="premium-modal-desc">{info.desc}</p>
            <div className="premium-modal-features">
              <div className="premium-feature-row"><span>✓</span> All AI-powered features</div>
              <div className="premium-feature-row"><span>✓</span> Cloud sync across devices</div>
              <div className="premium-feature-row"><span>✓</span> Hymn audio playback</div>
              <div className="premium-feature-row"><span>✓</span> Advanced Bible study tools</div>
              <div className="premium-feature-row"><span>✓</span> Priority support</div>
            </div>
            <div className="premium-modal-pricing">
              <span className="premium-price">$4.99</span>
              <span className="premium-period">/month</span>
            </div>
            <button className="premium-modal-cta" onClick={() => { setShowModal(false); onSignUp() }}>
              Sign Up Free to Start
            </button>
            <p className="premium-modal-note">7-day free trial. Cancel anytime.</p>
          </div>
        </div>
      )}
    </>
  )
}

export { PREMIUM_FEATURES }
