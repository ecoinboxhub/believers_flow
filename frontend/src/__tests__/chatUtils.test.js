import { describe, it, expect } from 'vitest'
import { isTransientAiError, sanitizeChatHistory } from '../chatUtils.js'

describe('isTransientAiError', () => {
  it('flags raw provider API errors', () => {
    expect(isTransientAiError('GROQ API error: 404')).toBe(true)
    expect(isTransientAiError('OpenAI API error: 500')).toBe(true)
  })

  it('flags request failed and HTTP errors', () => {
    expect(isTransientAiError('Request failed (404). Please try again.')).toBe(true)
    expect(isTransientAiError('Request failed. Please try again.')).toBe(true)
    expect(isTransientAiError('HTTP 500')).toBe(true)
  })

  it('flags transient backend availability messages', () => {
    expect(isTransientAiError('The AI service model is temporarily unavailable. Please try again.')).toBe(true)
    expect(isTransientAiError('The AI service returned an empty response. Please try again.')).toBe(true)
    expect(isTransientAiError('Failed to reach groq API')).toBe(true)
  })

  it('flags client-side network/catch errors', () => {
    expect(isTransientAiError('Network error — please check your connection and try again.')).toBe(true)
    expect(isTransientAiError('Something went wrong (fetch failed). Please try again.')).toBe(true)
  })

  it('does not flag normal or friendly non-transient messages', () => {
    expect(isTransientAiError('The assistant is busy right now. Please wait a moment and try again.')).toBe(false)
    expect(isTransientAiError('Your session could not reach the assistant. Please try again.')).toBe(false)
    expect(isTransientAiError('Rejoice in the Lord always. Philippians 4:4')).toBe(false)
    expect(isTransientAiError('')).toBe(false)
    expect(isTransientAiError(null)).toBe(false)
  })
})

describe('sanitizeChatHistory', () => {
  it('removes assistant messages containing transient errors', () => {
    const history = [
      { role: 'user', content: 'Give me a daily focus' },
      { role: 'assistant', content: 'GROQ API error: 404' },
      { role: 'assistant', content: 'Here is your verse for today.' },
    ]
    const clean = sanitizeChatHistory(history)
    expect(clean).toHaveLength(2)
    expect(clean.map(m => m.content)).toEqual(['Give me a daily focus', 'Here is your verse for today.'])
  })

  it('keeps non-error assistant messages intact', () => {
    const history = [
      { role: 'assistant', content: 'The assistant is busy right now. Please wait a moment and try again.' },
      { role: 'user', content: 'hello' },
    ]
    expect(sanitizeChatHistory(history)).toHaveLength(2)
  })

  it('handles non-array input', () => {
    expect(sanitizeChatHistory(null)).toEqual([])
    expect(sanitizeChatHistory(undefined)).toEqual([])
    expect(sanitizeChatHistory('not-an-array')).toEqual([])
  })
})