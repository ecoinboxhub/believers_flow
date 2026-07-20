const API_URL = import.meta.env.VITE_API_URL || ''

function getToken() {
  return localStorage.getItem('bf_token')
}

function headers() {
  const token = getToken()
  return {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
  }
}

export function isLoggedIn() {
  return Boolean(getToken())
}

export function getUser() {
  try {
    return JSON.parse(localStorage.getItem('bf_user') || 'null')
  } catch {
    return null
  }
}

export function logout() {
  localStorage.removeItem('bf_token')
  localStorage.removeItem('bf_refresh_token')
  localStorage.removeItem('bf_user')
}

const SYNC_KEYS = [
  'btf_tasks', 'btf_prayerLogs', 'btf_diary', 'btf_studyPlan',
  'btf_chat', 'btf_settings', 'btf_customColors', 'btf_bibleVersion',
  'btf_recentReads', 'btf_hymnFavorites', 'btf_recentHymns', 'btf_navOrder',
  'btf_bibleNotes', 'btf_verseMarks'
]

const DATA_TYPE_MAP = {
  'btf_tasks': 'tasks',
  'btf_prayerLogs': 'prayerLogs',
  'btf_diary': 'diary',
  'btf_studyPlan': 'studyPlan',
  'btf_chat': 'chat',
  'btf_settings': 'settings',
  'btf_customColors': 'customColors',
  'btf_bibleVersion': 'bibleVersion',
  'btf_recentReads': 'recentReads',
  'btf_hymnFavorites': 'hymnFavorites',
  'btf_recentHymns': 'recentHymns',
  'btf_navOrder': 'navOrder',
  'btf_bibleNotes': 'bibleNotes',
  'btf_verseMarks': 'verseMarks'
}

let syncTimer = null
let lastPush = 0

export async function pullFromServer() {
  if (!isLoggedIn() || !API_URL) return null
  try {
    const res = await callRefreshed('/api/sync/pull')
    if (!res || !res.ok) return null
    const data = await res.json()
    if (!data.items) return null

    const serverData = {}
    for (const item of data.items) {
      for (const [key, type] of Object.entries(DATA_TYPE_MAP)) {
        if (item.data_type === type) {
          serverData[key] = item.data
        }
      }
    }
    return serverData
  } catch {
    return null
  }
}

export function mergeServerData(serverData) {
  if (!serverData) return
  for (const [key, value] of Object.entries(serverData)) {
    if (value === null || value === undefined) continue
    const localRaw = localStorage.getItem(key)
    if (!localRaw) {
      localStorage.setItem(key, JSON.stringify(value))
    } else {
      try {
        const local = JSON.parse(localRaw)
        if (Array.isArray(local) && local.length === 0 && Array.isArray(value) && value.length > 0) {
          localStorage.setItem(key, JSON.stringify(value))
        } else if (typeof local === 'object' && !Array.isArray(local) && Object.keys(local).length === 0 && typeof value === 'object' && Object.keys(value).length > 0) {
          localStorage.setItem(key, JSON.stringify(value))
        }
      } catch {
        localStorage.setItem(key, JSON.stringify(value))
      }
    }
  }
}

export async function pushToServer() {
  if (!isLoggedIn() || !API_URL) return
  const now = Date.now()
  if (now - lastPush < 30000) return
  lastPush = now

  try {
    const items = []
    for (const key of SYNC_KEYS) {
      const raw = localStorage.getItem(key)
      if (!raw) continue
      try {
        const data = JSON.parse(raw)
        const dataType = DATA_TYPE_MAP[key]
        if (dataType) {
          items.push({ data_type: dataType, data })
        }
      } catch { /* skip */ }
    }

    if (items.length === 0) return

    await callRefreshed('/api/sync/push', {
      method: 'POST',
      body: JSON.stringify({ items })
    })
  } catch { /* silent fail */ }
}

export function scheduleSync() {
  if (syncTimer) return
  syncTimer = setInterval(() => {
    if (isLoggedIn()) pushToServer()
  }, 60000)
}

export function stopSync() {
  if (syncTimer) {
    clearInterval(syncTimer)
    syncTimer = null
  }
}

export async function ragSearch(query, topK = 5) {
  try {
    const res = await callRefreshed('/api/rag/search', {
      method: 'POST',
      body: JSON.stringify({ query, top_k: topK })
    })
    if (!res || !res.ok) return []
    const data = await res.json()
    return data.results || []
  } catch {
    return []
  }
}

export async function refreshAccessToken() {
  const refreshToken = localStorage.getItem('bf_refresh_token')
  if (!refreshToken) return null
  try {
    const res = await fetch(`${API_URL}/api/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token: refreshToken })
    })
    if (!res.ok) return null
    const data = await res.json()
    if (data.access_token) {
      localStorage.setItem('bf_token', data.access_token)
      return data.access_token
    }
    return null
  } catch {
    return null
  }
}

export async function callRefreshed(path, options = {}) {
  let token = getToken()
  const doFetch = (t) => fetch(`${API_URL}${path}`, {
    ...options,
    headers: { ...headers(), ...(t ? { 'Authorization': `Bearer ${t}` } : {}), ...options.headers }
  })
  let res = await doFetch(token)
  if (res.status === 401) {
    const newToken = await refreshAccessToken()
    if (newToken) {
      res = await doFetch(newToken)
    }
  }
  return res
}
