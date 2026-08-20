const TRANSIENT_AI_ERROR_PATTERNS = [
  /API error:\s*\d{3}/i,
  /Request failed/i,
  /HTTP\s+\d{3}/i,
  /temporarily unavailable/i,
  /returned an empty response/i,
  /failed to reach/i,
  /something went wrong/i,
  /network error/i,
]

export function isTransientAiError(content) {
  if (typeof content !== 'string') return false
  return TRANSIENT_AI_ERROR_PATTERNS.some(re => re.test(content))
}

export function sanitizeChatHistory(history) {
  if (!Array.isArray(history)) return []
  return history.filter(msg => !(msg && msg.role === 'assistant' && isTransientAiError(msg.content)))
}