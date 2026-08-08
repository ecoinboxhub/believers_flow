import { describe, it, expect, vi, afterEach } from 'vitest'
import { buildLocalReflection, requestDiaryReflection } from '../diaryReflection.js'

if (typeof localStorage === 'undefined') {
  const store = {}
  globalThis.localStorage = {
    getItem: (k) => (k in store ? store[k] : null),
    setItem: (k, v) => { store[k] = String(v) },
    removeItem: (k) => { delete store[k] },
    clear: () => { for (const k in store) delete store[k] },
  }
}

afterEach(() => {
  vi.restoreAllMocks()
  try { localStorage.clear() } catch { /* node has no localStorage */ }
})

describe('buildLocalReflection', () => {
  it('returns a structured reflection with verses and encouragement', () => {
    const r = buildLocalReflection({ title: 'Grateful day', content: 'I am so thankful and blessed today.', mood: '' })
    expect(typeof r.reflection).toBe('string')
    expect(Array.isArray(r.verses)).toBe(true)
    expect(r.verses.length).toBeGreaterThan(0)
    expect(typeof r.encouragement).toBe('string')
    expect(r.verses[0]).toHaveProperty('reference')
    expect(r.verses[0]).toHaveProperty('text')
  })

  it('detects anxiety theme from content keywords', () => {
    const r = buildLocalReflection({ title: 'Stressful day', content: 'I am anxious and worried about work.', mood: '' })
    expect(r.reflection.toLowerCase()).toContain('worry')
  })

  it('falls back to mood when content gives no strong signal', () => {
    const r = buildLocalReflection({ title: 'Nothing much', content: 'Just writing a quick note about the weather.', mood: '\uD83D\uDE2D' })
    expect(r.reflection).toBeTruthy()
    expect(r.verses.length).toBeGreaterThan(0)
  })

  it('never returns an empty response for any input', () => {
    const r = buildLocalReflection({ title: '', content: 'hello world', mood: '' })
    expect(r.reflection).toBeTruthy()
    expect(r.verses.length).toBeGreaterThan(0)
    expect(r.encouragement).toBeTruthy()
  })
})

describe('requestDiaryReflection', () => {
  it('returns needsMore for very short content without calling the API', async () => {
    const spy = vi.spyOn(globalThis, 'fetch')
    const r = await requestDiaryReflection({ title: 'Hi', content: 'ok' })
    expect(r.needsMore).toBe(true)
    expect(spy).not.toHaveBeenCalled()
  })

  it('falls back to a local reflection when the API fails', async () => {
    globalThis.fetch = vi.fn(() => Promise.resolve({ ok: false, status: 500 }))
    const r = await requestDiaryReflection({ title: 'Prayer', content: 'I have been praying and trusting God for my future.', mood: '' })
    expect(r.source).toBe('local')
    expect(r.reflection).toBeTruthy()
    expect(Array.isArray(r.verses)).toBe(true)
  })

  it('falls back to a local reflection when fetch throws', async () => {
    globalThis.fetch = vi.fn(() => Promise.reject(new Error('network down')))
    const r = await requestDiaryReflection({ title: 'Hope', content: 'Holding on to hope for a new season.', mood: '' })
    expect(r.source).toBe('local')
    expect(r.reflection).toBeTruthy()
  })

  it('returns the AI response when the API succeeds', async () => {
    const aiResponse = {
      reflection: 'You are being brave today.',
      verses: [{ reference: 'Psalm 34:18', text: 'The LORD is nigh.', explanation: 'God is near.' }],
      encouragement: 'Keep going.',
    }
    globalThis.fetch = vi.fn(() => Promise.resolve({
      ok: true,
      json: () => Promise.resolve(aiResponse),
    }))
    const r = await requestDiaryReflection({ title: 'Morning', content: 'I am struggling with worry about the future of my family.', mood: '' })
    expect(r.source).toBe('ai')
    expect(r.reflection).toBe('You are being brave today.')
    expect(r.verses[0].reference).toBe('Psalm 34:18')
  })

  it('sends an Authorization header when a token is present', async () => {
    localStorage.setItem('bf_token', 'abc123')
    globalThis.fetch = vi.fn(() => Promise.resolve({ ok: true, json: () => Promise.resolve({ reflection: 'x', encouragement: 'y', verses: [] }) }))
    await requestDiaryReflection({ title: 'T', content: 'Help me God with this heavy burden I am carrying today.', mood: '' })
    const [url, opts] = globalThis.fetch.mock.calls[0]
    expect(String(url)).toContain('/api/diary/reflection')
    expect(opts.headers.Authorization).toBe('Bearer abc123')
  })
})