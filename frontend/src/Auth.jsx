import { useState, useEffect, useRef } from 'react'

const API_URL = import.meta.env.VITE_API_URL || ''
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || ''

const iconStyle = { width: 20, height: 20, flexShrink: 0 }

const FREE_FEATURES = [
  { icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={iconStyle}><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/></svg>, name: 'Task Management', desc: 'Organize your day with faith-centered productivity' },
  { icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={iconStyle}><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/></svg>, name: 'Prayer Tracker', desc: 'Log prayers and build a daily streak' },
  { icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={iconStyle}><path d="M2 3h6a4 4 0 014 4v14a3 3 0 00-3-3H2z"/><path d="M22 3h-6a4 4 0 00-4 4v14a3 3 0 013-3h7z"/></svg>, name: 'Spiritual Diary', desc: 'Record your thoughts and reflections' },
  { icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={iconStyle}><path d="M4 19.5A2.5 2.5 0 016.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z"/><line x1="12" y1="6" x2="12" y2="14"/><line x1="8" y1="10" x2="16" y2="10"/></svg>, name: 'Bible Reader', desc: 'Read all 66 books across 12 translations' },
  { icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={iconStyle}><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>, name: 'Hymn Book', desc: 'Access 1,000+ classic hymns with lyrics' },
  { icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={iconStyle}><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>, name: 'Daily Devotionals', desc: '365 days of scripture and reflection' },
]

const PREMIUM_FEATURES = [
  { icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={iconStyle}><path d="M12 2a4 4 0 014 4v2a4 4 0 01-8 0V6a4 4 0 014-4z"/><path d="M18 14h.01"/><path d="M6 14h.01"/><path d="M12 14v4"/><path d="M8 18h8"/></svg>, name: 'AI Faith Assistant', desc: 'Scripture-based guidance and prayer support' },
  { icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={iconStyle}><path d="M9 18h6"/><path d="M10 22h4"/><path d="M12 2a7 7 0 00-4 12.7V17h8v-2.3A7 7 0 0012 2z"/></svg>, name: 'AI Verse Explanation', desc: 'Deep explanations of any Bible verse' },
  { icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={iconStyle}><path d="M4 19.5A2.5 2.5 0 016.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z"/></svg>, name: 'AI Commentary', desc: 'Theological insights and commentary' },
  { icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={iconStyle}><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>, name: 'Bible Concordance', desc: 'Search any word across Scripture' },
  { icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={iconStyle}><path d="M18 10h-1.26A8 8 0 109 20h9a5 5 0 000-10z"/></svg>, name: 'Cloud Sync', desc: 'Sync data across all your devices' },
]

export default function Auth({ apiUrl, onLogin, onSkip }) {
  const [mode, setMode] = useState('landing')
  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [focusedField, setFocusedField] = useState(null)
  const googleBtnRef = useRef(null)
  const gsiInitted = useRef(false)

  useEffect(() => {
    if ((mode !== 'register' && mode !== 'login') || !GOOGLE_CLIENT_ID || gsiInitted.current) return
    gsiInitted.current = true
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
              const res = await fetch(`${apiUrl}/api/auth/google`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ credential: response.credential })
              })
              const data = await res.json()
              if (!res.ok) { setError('Google sign-in failed'); return }
              localStorage.setItem('bf_token', data.token)
              if (data.refresh_token) localStorage.setItem('bf_refresh_token', data.refresh_token)
              localStorage.setItem('bf_user', JSON.stringify(data.user))
              onLogin(data.token, data.user)
            } catch { setError('Google sign-in connection failed') }
          },
        })
        if (googleBtnRef.current) {
          window.google.accounts.id.renderButton(googleBtnRef.current, {
            theme: 'outline', size: 'large', width: googleBtnRef.current.offsetWidth || 280, text: 'continue_with',
          })
        }
      } catch { /* GSI error — silently degrade */ }
    }
    document.head.appendChild(script)
  }, [mode, apiUrl, onLogin])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const endpoint = mode === 'register' ? '/api/auth/register' : '/api/auth/login'
      const body = mode === 'register'
        ? { email, name, password }
        : { email, password }

      const res = await fetch(`${apiUrl}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.detail || 'Authentication failed')
        return
      }

      localStorage.setItem('bf_token', data.token)
      localStorage.setItem('bf_refresh_token', data.refresh_token)
      localStorage.setItem('bf_user', JSON.stringify(data.user))
      onLogin(data.token, data.user)
    } catch (err) {
      setError('Connection failed. Check your network.')
    } finally {
      setLoading(false)
    }
  }

  if (mode === 'landing') {
    return (
      <div className="auth-overlay">
        <div className="auth-panel auth-landing">
          <div className="auth-logo">
            <span className="auth-cross"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{width:32,height:32}}><line x1="12" y1="2" x2="12" y2="22"/><line x1="6" y1="8" x2="18" y2="8"/></svg></span>
            <h1>Believers Flow</h1>
            <p className="auth-tagline">Your Christian lifestyle companion</p>
          </div>

          <div className="auth-features-grid">
            <div className="auth-features-section">
              <h3 className="auth-section-title auth-section-free">Free for Everyone</h3>
              {FREE_FEATURES.map((f, i) => (
                <div key={i} className="auth-feature-row">
                  <span className="auth-feature-icon">{f.icon}</span>
                  <div className="auth-feature-info">
                    <span className="auth-feature-name">{f.name}</span>
                    <span className="auth-feature-desc">{f.desc}</span>
                  </div>
                </div>
              ))}
            </div>
            <div className="auth-features-section">
              <h3 className="auth-section-title auth-section-premium">Premium Features</h3>
              {PREMIUM_FEATURES.map((f, i) => (
                <div key={i} className="auth-feature-row premium">
                  <span className="auth-feature-icon">{f.icon}</span>
                  <div className="auth-feature-info">
                    <span className="auth-feature-name">{f.name}</span>
                    <span className="auth-feature-desc">{f.desc}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="auth-landing-actions">
            <button className="auth-btn auth-btn-primary" onClick={() => setMode('register')}>
              Get Started Free
            </button>
            <button className="auth-btn auth-btn-secondary" onClick={() => setMode('login')}>
              I already have an account
            </button>
          </div>

          <div className="auth-skip">
            <button onClick={onSkip} className="auth-skip-btn">Continue without account</button>
            <p className="auth-skip-hint">Use basic features locally. Sign up to unlock everything.</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="auth-overlay">
      <div className="auth-panel">
        <div className="auth-logo">
          <span className="auth-cross"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{width:32,height:32}}><line x1="12" y1="2" x2="12" y2="22"/><line x1="6" y1="8" x2="18" y2="8"/></svg></span>
          <h1>{mode === 'register' ? 'Create Account' : 'Welcome Back'}</h1>
          <p>{mode === 'register' ? 'Join Believers Flow and unlock all features' : 'Sign in to access your premium features'}</p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          {mode === 'register' && (
            <div className={`auth-field${focusedField === 'name' ? ' focused' : ''}`}>
              <label>Full Name</label>
              <input
                type="text"
                placeholder="Your full name"
                value={name}
                onChange={e => setName(e.target.value)}
                onFocus={() => setFocusedField('name')}
                onBlur={() => setFocusedField(null)}
                required
              />
            </div>
          )}
          <div className={`auth-field${focusedField === 'email' ? ' focused' : ''}`}>
            <label>Email Address</label>
            <input
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              onFocus={() => setFocusedField('email')}
              onBlur={() => setFocusedField(null)}
              required
            />
          </div>
          <div className={`auth-field${focusedField === 'password' ? ' focused' : ''}`}>
            <label>Password</label>
            <input
              type="password"
              placeholder="Min 6 characters"
              value={password}
              onChange={e => setPassword(e.target.value)}
              onFocus={() => setFocusedField('password')}
              onBlur={() => setFocusedField(null)}
              minLength={6}
              required
            />
          </div>

          {error && <div className="auth-error">{error}</div>}

          <button type="submit" className="auth-submit" disabled={loading}>
            {loading ? 'Please wait...' : mode === 'register' ? 'Create Free Account' : 'Sign In'}
          </button>
        </form>

        {GOOGLE_CLIENT_ID && (
          <div className="auth-divider">
            <span className="auth-divider-line" />
            <span className="auth-divider-text">or continue with</span>
            <span className="auth-divider-line" />
          </div>
        )}
        {GOOGLE_CLIENT_ID && (
          <div ref={googleBtnRef} className="auth-google-btn" />
        )}

        {mode === 'register' && (
          <div className="auth-trust-badges">
            <span><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{width:14,height:14,verticalAlign:'middle',marginRight:4}}><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg> Secure &amp; private</span>
            <span><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{width:14,height:14,verticalAlign:'middle',marginRight:4}}><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/></svg> No credit card required</span>
            <span><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{width:14,height:14,verticalAlign:'middle',marginRight:4}}><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/></svg> Cancel anytime</span>
          </div>
        )}

        <div className="auth-toggle">
          {mode === 'login' ? (
            <span>New here? <button onClick={() => { setMode('register'); setError('') }}>Create account</button></span>
          ) : (
            <span>Have an account? <button onClick={() => { setMode('login'); setError('') }}>Sign in</button></span>
          )}
        </div>

        <div className="auth-skip">
          <button onClick={() => setMode('landing')} className="auth-skip-btn">← Back</button>
        </div>
      </div>
    </div>
  )
}
