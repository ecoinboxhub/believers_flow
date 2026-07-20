import { useState, useEffect } from 'react'

const STEPS = [
  {
    id: 'welcome',
    title: 'Welcome to BelieversFlow',
    subtitle: 'Your faith journey starts here',
    description: 'A Christian app designed to help you grow closer to God through daily devotionals, prayer tracking, Bible study, and community connection.',
    icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="48" height="48"><path d="M12 2v20M5 7h14"/></svg>',
    type: 'welcome',
  },
  {
    id: 'features',
    title: 'What You Can Do',
    subtitle: 'Powerful features for your spiritual growth',
    description: '',
    icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="48" height="48"><path d="M12 2l2 7h7l-5.5 4 2 7L12 16l-5.5 4 2-7L3 9h7z"/></svg>',
    type: 'features',
    features: [
      { icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="20" height="20"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>', title: 'Bible Reader', desc: '12 translations, AI commentary, interlinear Greek/Hebrew' },
      { icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="20" height="20"><rect x="4" y="4" width="16" height="16" rx="2"/><path d="M9 9h6M9 13h4"/></svg>', title: 'AI Assistant', desc: 'Faith-based guidance and scripture-based advice' },
      { icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="20" height="20"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z"/><path d="M12 6v12M8 10l4-4 4 4"/></svg>', title: 'Prayer Tracker', desc: 'Track requests, answers, streaks, and analytics' },
      { icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="20" height="20"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>', title: 'Hymns Library', desc: '1,001 hymns with audio, search, and sharing' },
      { icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="20" height="20"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>', title: 'Small Groups', desc: 'Connect with your community and share prayer requests' },
      { icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="20" height="20"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>', title: 'Events Calendar', desc: 'Church events with RSVP and reminders' },
    ],
  },
  {
    id: 'preferences',
    title: 'Personalize Your Experience',
    subtitle: 'Help us tailor content for you',
    description: 'Select your interests and we will customize your daily content, devotional recommendations, and study suggestions.',
    icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="48" height="48"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="3"/></svg>',
    type: 'preferences',
    preferences: [
      { id: 'daily_devotional', label: 'Daily Devotionals', icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="20" height="20"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>', description: 'Receive personalized daily devotionals' },
      { id: 'prayer_reminders', label: 'Prayer Reminders', icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="20" height="20"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z"/><path d="M12 6v12M8 10l4-4 4 4"/></svg>', description: 'Get reminded to pray at your preferred times' },
      { id: 'bible_study', label: 'Bible Study', icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="20" height="20"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>', description: 'Study plans and commentary' },
      { id: 'hymns_music', label: 'Hymns & Music', icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="20" height="20"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>', description: 'Hymn recommendations and playlists' },
      { id: 'community_updates', label: 'Community Updates', icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="20" height="20"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>', description: 'Group activity and forum notifications' },
      { id: 'events_calendar', label: 'Events & Calendar', icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="20" height="20"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>', description: 'Church events and reminders' },
    ],
  },
  {
    id: 'setup',
    title: 'Quick Setup',
    subtitle: 'Optional configurations for a better experience',
    description: 'Configure these settings now or skip and set them up later in Settings.',
    icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="48" height="48"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>',
    type: 'setup',
    setups: [
      { id: 'google_signin', label: 'Sign in with Google', description: 'Sync your data across devices', icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="20" height="20"><path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"/></svg>', action: 'signin' },
      { id: 'notifications', label: 'Enable Notifications', description: 'Get notified about prayers, events, and updates', icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="20" height="20"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>', action: 'notifications' },
      { id: 'theme', label: 'Choose Theme', description: 'Light, dark, or system default', icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="20" height="20"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>', action: 'theme' },
    ],
  },
  {
    id: 'ready',
    title: "You're All Set!",
    subtitle: 'Start your spiritual journey today',
    description: 'Explore the app at your own pace. Tap the menu to access all features. Your data is stored locally and synced when you create an account.',
    icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="48" height="48"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>',
    type: 'ready',
    tips: [
      'Tap the heart on any devotional to save it',
      'Use the search bar to find hymns, Bible verses, or topics',
      'Join a small group to connect with your community',
      'Visit Settings to customize your experience further',
    ],
  },
]

export default function Onboarding({ onComplete }) {
  const [currentStep, setCurrentStep] = useState(0)
  const [preferences, setPreferences] = useState({
    daily_devotional: true,
    prayer_reminders: true,
    bible_study: true,
    hymns_music: false,
    community_updates: false,
    events_calendar: false,
  })
  const [animating, setAnimating] = useState(false)

  const step = STEPS[currentStep]
  const progress = ((currentStep + 1) / STEPS.length) * 100

  const handleNext = () => {
    if (currentStep < STEPS.length - 1) {
      setAnimating(true)
      setTimeout(() => {
        setCurrentStep(s => s + 1)
        setAnimating(false)
      }, 300)
    } else {
      onComplete(preferences)
    }
  }

  const handleBack = () => {
    if (currentStep > 0) {
      setAnimating(true)
      setTimeout(() => {
        setCurrentStep(s => s - 1)
        setAnimating(false)
      }, 300)
    }
  }

  const handleSkip = () => {
    onComplete(preferences)
  }

  const togglePreference = (id) => {
    setPreferences(prev => ({
      ...prev,
      [id]: !prev[id],
    }))
  }

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        handleSkip()
      } else if (e.key === 'ArrowRight' || e.key === 'Enter') {
        handleNext()
      } else if (e.key === 'ArrowLeft' && currentStep > 0) {
        handleBack()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [currentStep])

  return (
    <div className="onboarding-overlay" style={styles.overlay}>
      <div className="onboarding-panel" style={styles.panel}>
        {/* Progress Bar */}
        <div style={styles.progressContainer}>
          <div style={styles.progressBar}>
            <div
              style={{
                ...styles.progressFill,
                width: `${progress}%`,
              }}
            />
          </div>
          <span style={styles.progressText}>
            Step {currentStep + 1} of {STEPS.length}
          </span>
        </div>

        {/* Step Content */}
        <div
          style={{
            ...styles.content,
            opacity: animating ? 0 : 1,
            transform: animating ? 'translateX(-20px)' : 'translateX(0)',
          }}
        >
          {/* Icon */}
          <div style={styles.iconContainer}>
            <span style={styles.icon} dangerouslySetInnerHTML={{ __html: step.icon }} />
          </div>

          {/* Title & Description */}
          <h2 style={styles.title}>{step.title}</h2>
          <p style={styles.subtitle}>{step.subtitle}</p>
          {step.description && (
            <p style={styles.description}>{step.description}</p>
          )}

          {/* Features Grid */}
          {step.type === 'features' && (
            <div style={styles.featuresGrid}>
              {step.features.map((feature, i) => (
                <div key={i} style={styles.featureCard}>
                  <span style={styles.featureIcon} dangerouslySetInnerHTML={{ __html: feature.icon }} />
                  <div>
                    <div style={styles.featureTitle}>{feature.title}</div>
                    <div style={styles.featureDesc}>{feature.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Preferences Toggle */}
          {step.type === 'preferences' && (
            <div style={styles.preferencesList}>
              {step.preferences.map((pref) => (
                <div
                  key={pref.id}
                  style={{
                    ...styles.preferenceItem,
                    backgroundColor: preferences[pref.id] ? 'var(--accent-light, #e8f5e9)' : 'var(--bg-secondary, #f5f5f5)',
                    borderColor: preferences[pref.id] ? 'var(--accent, #4caf50)' : 'transparent',
                  }}
                  onClick={() => togglePreference(pref.id)}
                >
                  <span style={styles.preferenceIcon} dangerouslySetInnerHTML={{ __html: pref.icon }} />
                  <div style={styles.preferenceText}>
                    <div style={styles.preferenceLabel}>{pref.label}</div>
                    <div style={styles.preferenceDesc}>{pref.description}</div>
                  </div>
                  <div style={{
                    ...styles.toggle,
                    backgroundColor: preferences[pref.id] ? 'var(--accent, #4caf50)' : 'var(--text-muted, #999)',
                  }}>
                    <div style={{
                      ...styles.toggleDot,
                      transform: preferences[pref.id] ? 'translateX(20px)' : 'translateX(0)',
                    }} />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Setup Options */}
          {step.type === 'setup' && (
            <div style={styles.setupList}>
              {step.setups.map((setup) => (
                <div key={setup.id} style={styles.setupItem}>
                  <span style={styles.setupIcon} dangerouslySetInnerHTML={{ __html: setup.icon }} />
                  <div style={styles.setupText}>
                    <div style={styles.setupLabel}>{setup.label}</div>
                    <div style={styles.setupDesc}>{setup.description}</div>
                  </div>
                  <button style={styles.setupAction}>
                    {setup.action === 'signin' ? 'Sign In' : setup.action === 'notifications' ? 'Enable' : 'Choose'}
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Tips */}
          {step.type === 'ready' && (
            <div style={styles.tipsList}>
              <p style={styles.tipsTitle}>Quick Tips:</p>
              {step.tips.map((tip, i) => (
                <div key={i} style={styles.tipItem}>
                  <span style={styles.tipBullet}>•</span>
                  <span>{tip}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Navigation */}
        <div style={styles.navigation}>
          {currentStep > 0 ? (
            <button style={styles.backButton} onClick={handleBack}>
              Back
            </button>
          ) : (
            <div />
          )}

          <div style={styles.dots}>
            {STEPS.map((_, i) => (
              <span
                key={i}
                style={{
                  ...styles.dot,
                  backgroundColor: i === currentStep ? 'var(--accent, #4caf50)' : 'var(--text-muted, #ccc)',
                  width: i === currentStep ? '24px' : '8px',
                }}
              />
            ))}
          </div>

          {currentStep < STEPS.length - 1 ? (
            <div style={styles.rightButtons}>
              <button style={styles.skipButton} onClick={handleSkip}>
                Skip
              </button>
              <button style={styles.nextButton} onClick={handleNext}>
                Next
              </button>
            </div>
          ) : (
            <button style={styles.startButton} onClick={() => onComplete(preferences)}>
              Get Started
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

const styles = {
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    padding: '20px',
  },
  panel: {
    backgroundColor: 'var(--bg-primary, #fff)',
    borderRadius: '16px',
    maxWidth: '520px',
    width: '100%',
    maxHeight: '90vh',
    overflow: 'auto',
    boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
    display: 'flex',
    flexDirection: 'column',
  },
  progressContainer: {
    padding: '16px 24px 0',
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  progressBar: {
    flex: 1,
    height: '4px',
    backgroundColor: 'var(--bg-secondary, #e0e0e0)',
    borderRadius: '2px',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: 'var(--accent, #4caf50)',
    transition: 'width 0.3s ease',
  },
  progressText: {
    fontSize: '12px',
    color: 'var(--text-muted, #999)',
    whiteSpace: 'nowrap',
  },
  content: {
    flex: 1,
    padding: '24px',
    transition: 'opacity 0.3s ease, transform 0.3s ease',
  },
  iconContainer: {
    display: 'flex',
    justifyContent: 'center',
    marginBottom: '16px',
  },
  icon: {
    fontSize: '48px',
  },
  title: {
    fontSize: '24px',
    fontWeight: '700',
    textAlign: 'center',
    margin: '0 0 8px',
    color: 'var(--text-primary, #1a1a1a)',
  },
  subtitle: {
    fontSize: '16px',
    textAlign: 'center',
    margin: '0 0 12px',
    color: 'var(--text-secondary, #666)',
  },
  description: {
    fontSize: '14px',
    textAlign: 'center',
    margin: '0 0 20px',
    color: 'var(--text-muted, #888)',
    lineHeight: 1.5,
  },
  featuresGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '12px',
    marginTop: '16px',
  },
  featureCard: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '10px',
    padding: '12px',
    backgroundColor: 'var(--bg-secondary, #f5f5f5)',
    borderRadius: '8px',
  },
  featureIcon: {
    fontSize: '20px',
    flexShrink: 0,
  },
  featureTitle: {
    fontSize: '13px',
    fontWeight: '600',
    color: 'var(--text-primary, #1a1a1a)',
  },
  featureDesc: {
    fontSize: '11px',
    color: 'var(--text-muted, #888)',
    marginTop: '2px',
  },
  preferencesList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    marginTop: '16px',
  },
  preferenceItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '12px',
    borderRadius: '8px',
    border: '2px solid transparent',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  },
  preferenceIcon: {
    fontSize: '20px',
    flexShrink: 0,
  },
  preferenceText: {
    flex: 1,
  },
  preferenceLabel: {
    fontSize: '14px',
    fontWeight: '600',
    color: 'var(--text-primary, #1a1a1a)',
  },
  preferenceDesc: {
    fontSize: '12px',
    color: 'var(--text-muted, #888)',
    marginTop: '2px',
  },
  toggle: {
    width: '44px',
    height: '24px',
    borderRadius: '12px',
    padding: '2px',
    transition: 'background-color 0.2s ease',
    flexShrink: 0,
  },
  toggleDot: {
    width: '20px',
    height: '20px',
    borderRadius: '50%',
    backgroundColor: 'white',
    transition: 'transform 0.2s ease',
  },
  setupList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    marginTop: '16px',
  },
  setupItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '12px',
    backgroundColor: 'var(--bg-secondary, #f5f5f5)',
    borderRadius: '8px',
  },
  setupIcon: {
    fontSize: '20px',
    flexShrink: 0,
  },
  setupText: {
    flex: 1,
  },
  setupLabel: {
    fontSize: '14px',
    fontWeight: '600',
    color: 'var(--text-primary, #1a1a1a)',
  },
  setupDesc: {
    fontSize: '12px',
    color: 'var(--text-muted, #888)',
    marginTop: '2px',
  },
  setupAction: {
    padding: '6px 12px',
    fontSize: '12px',
    fontWeight: '600',
    color: 'var(--accent, #4caf50)',
    backgroundColor: 'transparent',
    border: '1px solid var(--accent, #4caf50)',
    borderRadius: '6px',
    cursor: 'pointer',
  },
  tipsList: {
    marginTop: '16px',
    padding: '16px',
    backgroundColor: 'var(--bg-secondary, #f5f5f5)',
    borderRadius: '8px',
  },
  tipsTitle: {
    fontSize: '14px',
    fontWeight: '600',
    margin: '0 0 12px',
    color: 'var(--text-primary, #1a1a1a)',
  },
  tipItem: {
    display: 'flex',
    gap: '8px',
    fontSize: '13px',
    color: 'var(--text-secondary, #666)',
    marginBottom: '8px',
    lineHeight: 1.4,
  },
  tipBullet: {
    color: 'var(--accent, #4caf50)',
    fontWeight: 'bold',
  },
  navigation: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '16px 24px',
    borderTop: '1px solid var(--border, #e0e0e0)',
  },
  dots: {
    display: 'flex',
    gap: '6px',
    alignItems: 'center',
  },
  dot: {
    height: '8px',
    borderRadius: '4px',
    transition: 'all 0.3s ease',
  },
  backButton: {
    padding: '8px 16px',
    fontSize: '14px',
    color: 'var(--text-secondary, #666)',
    backgroundColor: 'transparent',
    border: 'none',
    cursor: 'pointer',
  },
  rightButtons: {
    display: 'flex',
    gap: '8px',
  },
  skipButton: {
    padding: '8px 16px',
    fontSize: '14px',
    color: 'var(--text-secondary, #666)',
    backgroundColor: 'transparent',
    border: 'none',
    cursor: 'pointer',
  },
  nextButton: {
    padding: '8px 20px',
    fontSize: '14px',
    fontWeight: '600',
    color: 'white',
    backgroundColor: 'var(--accent, #4caf50)',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
  },
  startButton: {
    padding: '10px 24px',
    fontSize: '14px',
    fontWeight: '600',
    color: 'white',
    backgroundColor: 'var(--accent, #4caf50)',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
  },
}
