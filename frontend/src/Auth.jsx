import { useState, useEffect, useRef } from 'react'

const API_URL = import.meta.env.VITE_API_URL || ''
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || ''

const CrossIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{width:28,height:28}}>
    <line x1="12" y1="2" x2="12" y2="22"/><line x1="6" y1="8" x2="18" y2="8"/>
  </svg>
)

const EyeIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{width:18,height:18}}>
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
  </svg>
)

const EyeOffIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{width:18,height:18}}>
    <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24"/>
    <line x1="1" y1="1" x2="23" y2="23"/>
  </svg>
)

const MailIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{width:16,height:16}}>
    <rect x="2" y="4" width="20" height="16" rx="2"/><path d="M22 7l-10 6L2 7"/>
  </svg>
)

const LockIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{width:16,height:16}}>
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0110 0v4"/>
  </svg>
)

const UserIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{width:16,height:16}}>
    <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/>
  </svg>
)

const ShieldIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{width:14,height:14}}>
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
  </svg>
)

const CheckIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{width:14,height:14}}>
    <polyline points="20 6 9 17 4 12"/>
  </svg>
)

const ArrowLeftIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{width:18,height:18}}>
    <line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>
  </svg>
)

export default function Auth({ apiUrl, onLogin, onSkip }) {
  const [mode, setMode] = useState('landing')
  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [nameError, setNameError] = useState('')
  const [emailError, setEmailError] = useState('')
  const [passwordError, setPasswordError] = useState('')
  const [confirmError, setConfirmError] = useState('')
  const [touched, setTouched] = useState({})
  const googleBtnRef = useRef(null)
  const gsiInitted = useRef(false)
  const nameRef = useRef(null)
  const emailRef = useRef(null)

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
      } catch { /* GSI error */ }
    }
    document.head.appendChild(script)
  }, [mode, apiUrl, onLogin])

  useEffect(() => {
    if (mode === 'login' && emailRef.current) {
      setTimeout(() => emailRef.current?.focus(), 300)
    }
    if (mode === 'register' && nameRef.current) {
      setTimeout(() => nameRef.current?.focus(), 300)
    }
  }, [mode])

  const validateEmail = (val) => {
    if (!val) return 'Email is required'
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val)) return 'Please enter a valid email'
    return ''
  }

  const validatePassword = (val) => {
    if (!val) return 'Password is required'
    if (val.length < 6) return 'Password must be at least 6 characters'
    return ''
  }

  const validateName = (val) => {
    if (!val || !val.trim()) return 'Full name is required'
    if (val.trim().length < 2) return 'Name must be at least 2 characters'
    return ''
  }

  const validateConfirm = (val) => {
    if (!val) return 'Please confirm your password'
    if (val !== password) return 'Passwords do not match'
    return ''
  }

  const handleBlur = (field) => {
    setTouched(prev => ({ ...prev, [field]: true }))
    if (field === 'name') setNameError(validateName(name))
    if (field === 'email') setEmailError(validateEmail(email))
    if (field === 'password') {
      setPasswordError(validatePassword(password))
      if (confirmPassword) setConfirmError(validateConfirm(confirmPassword))
    }
    if (field === 'confirmPassword') setConfirmError(validateConfirm(confirmPassword))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (mode === 'register') {
      const ne = validateName(name)
      const ee = validateEmail(email)
      const pe = validatePassword(password)
      const ce = validateConfirm(confirmPassword)
      setNameError(ne); setEmailError(ee); setPasswordError(pe); setConfirmError(ce)
      if (ne || ee || pe || ce) return
    } else {
      const ee = validateEmail(email)
      const pe = validatePassword(password)
      setEmailError(ee); setPasswordError(pe)
      if (ee || pe) return
    }

    setLoading(true)
    try {
      const endpoint = mode === 'register' ? '/api/auth/register' : '/api/auth/login'
      const body = mode === 'register'
        ? { email, name: name.trim(), password }
        : { email, password }

      const res = await fetch(`${apiUrl}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })
      const data = await res.json()
      if (!res.ok) { setError(data.detail || 'Authentication failed'); return }
      localStorage.setItem('bf_token', data.token)
      localStorage.setItem('bf_refresh_token', data.refresh_token)
      localStorage.setItem('bf_user', JSON.stringify(data.user))
      onLogin(data.token, data.user)
    } catch {
      setError('Connection failed. Check your network.')
    } finally {
      setLoading(false)
    }
  }

  const clearAll = () => {
    setEmail(''); setName(''); setPassword(''); setConfirmPassword('')
    setError(''); setNameError(''); setEmailError(''); setPasswordError(''); setConfirmError('')
    setTouched({}); setShowPassword(false); setShowConfirmPassword(false)
  }

  const switchMode = (newMode) => {
    clearAll()
    setMode(newMode)
  }

  if (mode === 'landing') {
    return (
      <div className="auth-overlay">
        <div className="auth-panel auth-landing">
          <div className="auth-landing-brand">
            <div className="auth-logo-icon">
              <CrossIcon />
            </div>
            <h1 className="auth-brand-title">BelieversFlow</h1>
            <p className="auth-brand-tagline">Your Christian lifestyle companion</p>
          </div>

          <div className="auth-landing-features">
            {[
              { icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{width:18,height:18}}><path d="M2 3h6a4 4 0 014 4v14a3 3 0 00-3-3H2z"/><path d="M22 3h-6a4 4 0 00-4 4v14a3 3 0 013-3h7z"/></svg>, text: 'Bible across 104 translations' },
              { icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{width:18,height:18}}><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>, text: '1,000+ hymns with lyrics' },
              { icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{width:18,height:18}}><path d="M12 2a4 4 0 014 4v2a4 4 0 01-8 0V6a4 4 0 014-4z"/><path d="M18 14h.01"/><path d="M6 14h.01"/><path d="M12 14v4"/><path d="M8 18h8"/></svg>, text: 'AI Faith Assistant' },
              { icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{width:18,height:18}}><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/></svg>, text: 'Task management & prayer tracker' },
            ].map((f, i) => (
              <div key={i} className="auth-landing-feature">
                <span className="auth-landing-feature-icon">{f.icon}</span>
                <span className="auth-landing-feature-text">{f.text}</span>
              </div>
            ))}
          </div>

          <div className="auth-landing-actions">
            <button className="auth-btn-primary" onClick={() => switchMode('register')}>
              Get Started Free
            </button>
            <button className="auth-btn-outline" onClick={() => switchMode('login')}>
              I already have an account
            </button>
          </div>

          <div className="auth-guest-section">
            <div className="auth-guest-divider">
              <span className="auth-guest-divider-line" />
              <span className="auth-guest-divider-text">or</span>
              <span className="auth-guest-divider-line" />
            </div>
            <button className="auth-guest-btn" onClick={onSkip}>
              Continue as Guest
            </button>
            <p className="auth-guest-hint">Use core features without an account</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="auth-overlay">
      <div className="auth-panel auth-form-panel">
        <button className="auth-back-btn" onClick={() => switchMode('landing')} aria-label="Go back">
          <ArrowLeftIcon />
        </button>

        <div className="auth-form-header">
          <div className="auth-logo-icon auth-logo-icon-sm">
            <CrossIcon />
          </div>
          <h1 className="auth-form-title">{mode === 'register' ? 'Create Account' : 'Welcome Back'}</h1>
          <p className="auth-form-subtitle">
            {mode === 'register'
              ? 'Join BelieversFlow and unlock all features'
              : 'Sign in to access your premium features'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form" noValidate>
          {mode === 'register' && (
            <div className={`auth-field${touched.name && nameError ? ' has-error' : ''}`}>
              <label htmlFor="auth-name">Full Name</label>
              <div className="auth-input-wrap">
                <span className="auth-input-icon"><UserIcon /></span>
                <input
                  ref={nameRef}
                  id="auth-name"
                  type="text"
                  placeholder="Your full name"
                  value={name}
                  onChange={e => { setName(e.target.value); if (touched.name) setNameError(validateName(e.target.value)) }}
                  onBlur={() => handleBlur('name')}
                  autoComplete="name"
                  required
                />
              </div>
              {touched.name && nameError && <span className="auth-field-error">{nameError}</span>}
            </div>
          )}

          <div className={`auth-field${touched.email && emailError ? ' has-error' : ''}`}>
            <label htmlFor="auth-email">Email Address</label>
            <div className="auth-input-wrap">
              <span className="auth-input-icon"><MailIcon /></span>
              <input
                ref={emailRef}
                id="auth-email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={e => { setEmail(e.target.value); if (touched.email) setEmailError(validateEmail(e.target.value)) }}
                onBlur={() => handleBlur('email')}
                autoComplete="email"
                required
              />
            </div>
            {touched.email && emailError && <span className="auth-field-error">{emailError}</span>}
          </div>

          <div className={`auth-field${touched.password && passwordError ? ' has-error' : ''}`}>
            <label htmlFor="auth-password">Password</label>
            <div className="auth-input-wrap">
              <span className="auth-input-icon"><LockIcon /></span>
              <input
                id="auth-password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Min 6 characters"
                value={password}
                onChange={e => { setPassword(e.target.value); if (touched.password) setPasswordError(validatePassword(e.target.value)); if (confirmPassword && touched.confirmPassword) setConfirmError(e.target.value !== confirmPassword ? 'Passwords do not match' : '') }}
                onBlur={() => handleBlur('password')}
                minLength={6}
                autoComplete={mode === 'register' ? 'new-password' : 'current-password'}
                required
              />
              <button type="button" className="auth-password-toggle" onClick={() => setShowPassword(!showPassword)} tabIndex={-1} aria-label={showPassword ? 'Hide password' : 'Show password'}>
                {showPassword ? <EyeOffIcon /> : <EyeIcon />}
              </button>
            </div>
            {touched.password && passwordError && <span className="auth-field-error">{passwordError}</span>}
          </div>

          {mode === 'register' && (
            <div className={`auth-field${touched.confirmPassword && confirmError ? ' has-error' : ''}`}>
              <label htmlFor="auth-confirm">Confirm Password</label>
              <div className="auth-input-wrap">
                <span className="auth-input-icon"><LockIcon /></span>
                <input
                  id="auth-confirm"
                  type={showConfirmPassword ? 'text' : 'password'}
                  placeholder="Re-enter password"
                  value={confirmPassword}
                  onChange={e => { setConfirmPassword(e.target.value); if (touched.confirmPassword) setConfirmError(e.target.value !== password ? 'Passwords do not match' : '') }}
                  onBlur={() => handleBlur('confirmPassword')}
                  autoComplete="new-password"
                  required
                />
                <button type="button" className="auth-password-toggle" onClick={() => setShowConfirmPassword(!showConfirmPassword)} tabIndex={-1} aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}>
                  {showConfirmPassword ? <EyeOffIcon /> : <EyeIcon />}
                </button>
              </div>
              {touched.confirmPassword && confirmError && <span className="auth-field-error">{confirmError}</span>}
            </div>
          )}

          {error && <div className="auth-error">{error}</div>}

          <button type="submit" className="auth-submit-btn" disabled={loading}>
            {loading ? (
              <span className="auth-loading"><span className="auth-spinner" /> Please wait...</span>
            ) : mode === 'register' ? 'Create Free Account' : 'Sign In'}
          </button>
        </form>

        {GOOGLE_CLIENT_ID && (
          <>
            <div className="auth-divider">
              <span className="auth-divider-line" />
              <span className="auth-divider-text">or continue with</span>
              <span className="auth-divider-line" />
            </div>
            <div ref={googleBtnRef} className="auth-google-container" />
          </>
        )}

        {mode === 'register' && (
          <div className="auth-trust">
            <span className="auth-trust-item"><ShieldIcon /> Secure & private</span>
            <span className="auth-trust-item"><CheckIcon /> No credit card required</span>
          </div>
        )}

        <div className="auth-switch">
          {mode === 'login' ? (
            <span>New here? <button onClick={() => switchMode('register')}>Create account</button></span>
          ) : (
            <span>Have an account? <button onClick={() => switchMode('login')}>Sign in</button></span>
          )}
        </div>
      </div>
    </div>
  )
}
