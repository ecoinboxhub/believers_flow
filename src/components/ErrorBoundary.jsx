import { Component } from 'react'
import { getErrorConfig } from '../errorUtils.js'

function ErrorIcon() {
  return (
    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="10" />
      <path d="M12 8v4" />
      <circle cx="12" cy="16" r="0.5" fill="currentColor" />
    </svg>
  )
}

function OfflineIcon() {
  return (
    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M1 1l22 22" />
      <path d="M16.72 11.06A10.94 10.94 0 019 8.26" />
      <path d="M5.63 13.68A10.94 10.94 0 0012 19.94" />
      <path d="M8.53 16.11A10.94 10.94 0 0012 19.94" />
      <path d="M12 19.94a10.94 10.94 0 005.63-3.68" />
      <path d="M12 5.08a10.94 10.94 0 013.68 5.63" />
      <circle cx="12" cy="19.94" r="0.5" fill="currentColor" />
    </svg>
  )
}

function InlineError({ status, onRetry, onSignIn }) {
  const config = getErrorConfig(status)
  const isOffline = status === 0

  return (
    <div className="error-inline" role="alert" style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      padding: '24px', textAlign: 'center', color: 'var(--text-primary, #1e293b)',
    }}>
      <div style={{ opacity: 0.5, marginBottom: '12px' }}>
        {isOffline ? <OfflineIcon /> : <ErrorIcon />}
      </div>
      <h3 style={{ fontSize: '1em', fontWeight: 600, margin: '0 0 4px' }}>{config.title}</h3>
      <p style={{ fontSize: '0.85em', color: 'var(--text-secondary, #64748b)', margin: '0 0 12px', maxWidth: '320px' }}>
        {config.message}
      </p>
      {config.action && (
        <button
          className="btn-primary"
          onClick={config.actionType === 'auth' ? onSignIn : onRetry}
          style={{ fontSize: '0.85em', padding: '6px 16px' }}
        >
          {config.action}
        </button>
      )}
    </div>
  )
}

function ErrorToast({ status, message, onDismiss }) {
  const config = getErrorConfig(status)
  return (
    <div className="error-toast" role="alert" style={{
      position: 'fixed', bottom: '20px', right: '20px', zIndex: 9999,
      background: 'var(--bg-primary, #fff)', border: '1px solid var(--border, #e2e8f0)',
      borderRadius: '8px', padding: '12px 16px', maxWidth: '360px',
      boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px' }}>
        <div>
          <strong style={{ fontSize: '0.85em' }}>{config.title}</strong>
          <p style={{ fontSize: '0.8em', color: 'var(--text-secondary, #64748b)', margin: '4px 0 0' }}>
            {message || config.message}
          </p>
        </div>
        <button onClick={onDismiss} aria-label="Dismiss" style={{
          background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2em', padding: '2px',
          color: 'var(--text-secondary, #64748b)',
        }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  )
}

class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, info) {
    console.error('[ErrorBoundary]', error, info?.componentStack)
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null })
  }

  handleSignIn = () => {
    this.setState({ hasError: false, error: null })
    window.dispatchEvent(new CustomEvent('auth-change', { detail: { type: 'logout', reason: 'error_boundary' } }))
  }

  render() {
    if (this.state.hasError) {
      const status = this.state.error?.status || 0
      return (
        <div className="error-boundary-fallback" style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          justifyContent: 'center', minHeight: '200px', padding: '24px',
        }}>
          <InlineError
            status={status}
            onRetry={this.handleRetry}
            onSignIn={this.handleSignIn}
          />
        </div>
      )
    }
    return this.props.children
  }
}

export { ErrorBoundary, InlineError, ErrorToast }
