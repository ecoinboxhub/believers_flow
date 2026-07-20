const API_URL = import.meta.env.VITE_API_URL || ''

let _refreshPromise = null

function getStoredToken() {
  return localStorage.getItem('bf_token')
}

function getStoredRefreshToken() {
  return localStorage.getItem('bf_refresh_token')
}

function getStoredUser() {
  try {
    return JSON.parse(localStorage.getItem('bf_user') || 'null')
  } catch {
    return null
  }
}

function storeAuth(token, refreshToken, user) {
  localStorage.setItem('bf_token', token)
  if (refreshToken) localStorage.setItem('bf_refresh_token', refreshToken)
  if (user) localStorage.setItem('bf_user', JSON.stringify(user))
}

function clearAuth() {
  localStorage.removeItem('bf_token')
  localStorage.removeItem('bf_refresh_token')
  localStorage.removeItem('bf_user')
}

function emitAuthEvent(detail) {
  window.dispatchEvent(new CustomEvent('auth-change', { detail }))
}

async function attemptTokenRefresh() {
  const refreshToken = getStoredRefreshToken()
  if (!refreshToken) {
    clearAuth()
    emitAuthEvent({ type: 'logout', reason: 'no_refresh_token' })
    return null
  }

  try {
    const res = await fetch(`/api/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token: refreshToken }),
    })

    if (!res.ok) {
      clearAuth()
      emitAuthEvent({ type: 'logout', reason: 'refresh_failed' })
      return null
    }

    const data = await res.json()
    storeAuth(data.access_token, refreshToken, data.user)
    return data.access_token
  } catch {
    clearAuth()
    emitAuthEvent({ type: 'logout', reason: 'refresh_network_error' })
    return null
  }
}

async function refreshToken() {
  if (_refreshPromise) return _refreshPromise
  _refreshPromise = attemptTokenRefresh()
  try {
    return await _refreshPromise
  } finally {
    _refreshPromise = null
  }
}

function buildHeaders(options = {}) {
  const headers = { 'Content-Type': 'application/json', ...options.headers }
  const token = getStoredToken()
  if (token) headers['Authorization'] = `Bearer ${token}`
  return headers
}

class APIError extends Error {
  constructor(status, message, data = null) {
    super(message)
    this.name = 'APIError'
    this.status = status
    this.data = data
  }

  get isAuthError() { return this.status === 401 }
  get isNotFound() { return this.status === 404 }
  get isRateLimited() { return this.status === 429 }
  get isServerError() { return this.status >= 500 }
  get isNetworkError() { return this.status === 0 }
}

async function request(endpoint, options = {}) {
  const { timeout = 30000, retries = 1, retryDelay = 1000, signal, ...fetchOptions } = options
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeout)
  const combinedSignal = signal
    ? AbortSignal.any([signal, controller.signal])
    : controller.signal

  let lastError = null
  const maxAttempts = retries + 1

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const headers = buildHeaders(fetchOptions)
      const res = await fetch(endpoint, {
        ...fetchOptions,
        headers,
        signal: combinedSignal,
      })

      clearTimeout(timeoutId)

      if (res.status === 401 && attempt < maxAttempts) {
        const newToken = await refreshToken()
        if (newToken) {
          fetchOptions.headers = { ...fetchOptions.headers, Authorization: `Bearer ${newToken}` }
          continue
        }
      }

      if (!res.ok) {
        let data = null
        try { data = await res.json() } catch (e) { void e; /* non-JSON response */ }
        throw new APIError(res.status, data?.detail || `Request failed (${res.status})`, data)
      }

      if (res.status === 204) return null
      return await res.json()
    } catch (err) {
      clearTimeout(timeoutId)
      if (err.name === 'AbortError') {
        throw new APIError(0, 'Request timed out')
      }
      if (err instanceof APIError) {
        if (err.status === 401 || err.status === 404 || err.status === 403 || err.status === 429) {
          throw err
        }
        lastError = err
      } else if (err.name === 'TypeError' && err.message.includes('fetch')) {
        lastError = new APIError(0, 'Network error — please check your connection')
      } else {
        lastError = err
      }

      if (attempt < maxAttempts) {
        await new Promise(r => setTimeout(r, retryDelay * attempt))
      }
    }
  }

  throw lastError || new APIError(0, 'Request failed after retries')
}

export const api = {
  get: (endpoint, opts) => request(endpoint, { method: 'GET', ...opts }),
  post: (endpoint, body, opts) => request(endpoint, { method: 'POST', body: JSON.stringify(body), ...opts }),
  put: (endpoint, body, opts) => request(endpoint, { method: 'PUT', body: JSON.stringify(body), ...opts }),
  del: (endpoint, opts) => request(endpoint, { method: 'DELETE', ...opts }),
}

export function headers() {
  const token = getStoredToken()
  return {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
  }
}

export function isLoggedIn() {
  return Boolean(getStoredToken())
}

export function getUser() {
  return getStoredUser()
}

export function storeLogin(token, refreshToken, user) {
  storeAuth(token, refreshToken, user)
  emitAuthEvent({ type: 'login', user })
}

export function logout() {
  clearAuth()
  emitAuthEvent({ type: 'logout', reason: 'manual' })
}

export { API_URL, APIError }
