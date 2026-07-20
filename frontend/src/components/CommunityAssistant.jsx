import { useState, useRef, useEffect, useCallback } from 'react'

const token = () => localStorage.getItem('bf_token')
const API = import.meta.env.VITE_API_URL || ''

const QUICK_ACTIONS = [
  { id: 'find-group', label: 'Find a group', icon: '👥', message: 'Help me find a community group that matches my interests.' },
  { id: 'find-church', label: 'Find a church', icon: '⛪', message: 'Can you help me find a church near me?' },
  { id: 'daily-reading', label: 'Daily reading', icon: '📖', message: 'Suggest a daily Bible reading plan for me.' },
  { id: 'write-prayer', label: 'Write a prayer', icon: '🙏', message: 'Help me write a personal prayer for today.' },
  { id: 'summarize', label: 'Summarize discussion', icon: '💬', message: 'Summarize the latest community discussion for me.' },
  { id: 'suggest-events', label: 'Suggest events', icon: '📅', message: 'What upcoming events would you suggest for me?' },
]

function highlightScripture(text) {
  const regex = /(\d?\s?[A-Z][a-z]+(?:\s[A-Z][a-z]+)*\s\d+:\d+(?:-\d+)?)/g
  const parts = text.split(regex)
  return parts.map((part, i) => {
    if (regex.test(part)) {
      regex.lastIndex = 0
      return (
        <span key={i} className="community-badge" style={{ display: 'inline', padding: '2px 6px', margin: '0 2px', fontSize: '0.85em', cursor: 'pointer' }}>
          {part}
        </span>
      )
    }
    return part
  })
}

function ActionCard({ card, onDismiss }) {
  return (
    <div className="community-card" style={{ margin: '8px 0', padding: '12px', borderRadius: '8px', border: '1px solid var(--border, #e2e8f0)', display: 'flex', alignItems: 'center', gap: '10px' }}>
      <div style={{ flex: 1 }}>
        <div style={{ fontWeight: 600, fontSize: '0.9em' }}>{card.title}</div>
        {card.description && <div style={{ fontSize: '0.8em', color: 'var(--text-secondary, #64748b)', marginTop: '4px' }}>{card.description}</div>}
      </div>
      <div style={{ display: 'flex', gap: '6px' }}>
        {card.action_label && (
          <button className="btn-sm btn-primary" onClick={() => card.action_url && window.open(card.action_url, '_blank')} style={{ fontSize: '0.8em', whiteSpace: 'nowrap' }}>
            {card.action_label}
          </button>
        )}
        <button className="btn-sm" onClick={onDismiss} style={{ fontSize: '0.8em', opacity: 0.6 }} aria-label="Dismiss suggestion">
          ✕
        </button>
      </div>
    </div>
  )
}

export default function CommunityAssistant({ showToast, isPremium }) {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState([
    { role: 'assistant', content: "Hello! I'm your community assistant. How can I help you grow in faith today?" },
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [actionCards, setActionCards] = useState([])
  const chatEndRef = useRef(null)
  const inputRef = useRef(null)
  const panelRef = useRef(null)

  const scrollToBottom = useCallback(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [messages, scrollToBottom])

  useEffect(() => {
    if (isOpen) inputRef.current?.focus()
  }, [isOpen])

  const sendMessage = useCallback(async (text) => {
    const trimmed = text.trim()
    if (!trimmed || loading) return

    if (!token()) {
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: "Please sign in to use the AI assistant." },
      ])
      return
    }

    const userMsg = { role: 'user', content: trimmed }
    setMessages((prev) => [...prev, userMsg])
    setInput('')
    setLoading(true)
    setActionCards([])

    try {
      const res = await fetch(`${API}/api/community/ai/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token() ? { Authorization: `Bearer ${token()}` } : {}),
        },
        body: JSON.stringify({
          message: trimmed,
          context: { current_view: 'community', interests: [] },
        }),
      })

      if (!res.ok) throw new Error('Request failed')
      const data = await res.json()

      const assistantMsg = { role: 'assistant', content: data.reply || data.message || "I'm sorry, I didn't understand that." }
      setMessages((prev) => [...prev, assistantMsg])

      if (data.action_cards && data.action_cards.length > 0) {
        setActionCards(data.action_cards)
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: "I'm having trouble connecting right now. Please try again in a moment." },
      ])
    } finally {
      setLoading(false)
    }
  }, [loading])

  const handleSubmit = (e) => {
    e.preventDefault()
    sendMessage(input)
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage(input)
    }
    if (e.key === 'Escape') setIsOpen(false)
  }

  const handleQuickAction = (action) => {
    sendMessage(action.message)
  }

  const dismissCard = (idx) => {
    setActionCards((prev) => prev.filter((_, i) => i !== idx))
  }

  if (!isPremium) return null

  return (
    <>
      {/* FAB */}
      <button
        onClick={() => setIsOpen((v) => !v)}
        aria-label={isOpen ? 'Close AI assistant' : 'Open AI assistant'}
        style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          width: '56px',
          height: '56px',
          borderRadius: '50%',
          border: 'none',
          background: 'linear-gradient(135deg, var(--primary, #6366f1), var(--primary-dark, #4f46e5))',
          color: '#fff',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 4px 14px rgba(99,102,241,0.4)',
          zIndex: 1000,
          transition: 'transform 0.2s ease',
          animation: !isOpen ? 'community-fab-pulse 2.5s ease-in-out infinite' : 'none',
        }}
      >
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 2a4 4 0 0 1 4 4v1a2 2 0 0 1 2 2v1a2 2 0 0 1-2 2h-.5" />
          <path d="M12 2a4 4 0 0 0-4 4v1a2 2 0 0 0-2 2v1a2 2 0 0 0 2 2h.5" />
          <circle cx="12" cy="14" r="4" />
          <path d="M10 18l-1 4" />
          <path d="M14 18l1 4" />
          <circle cx="10.5" cy="13" r="0.5" fill="currentColor" />
          <circle cx="13.5" cy="13" r="0.5" fill="currentColor" />
          <path d="M9.5 15.5c.5.5 1.5 1 2.5 1s2-.5 2.5-1" />
        </svg>
      </button>

      {/* Backdrop */}
      {isOpen && (
        <div
          onClick={() => setIsOpen(false)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.3)',
            zIndex: 1001,
            animation: 'fadeIn 0.2s ease',
          }}
          aria-hidden="true"
        />
      )}

      {/* Chat Panel */}
      <div
        ref={panelRef}
        role="dialog"
        aria-label="AI Community Assistant"
        className={isOpen ? 'fade-in' : ''}
        style={{
          position: 'fixed',
          bottom: isOpen ? '0' : '-100%',
          right: '0',
          width: '100%',
          maxWidth: '420px',
          height: 'min(80vh, 600px)',
          background: 'var(--bg, #ffffff)',
          borderTopLeftRadius: '16px',
          borderTopRightRadius: '16px',
          boxShadow: '0 -4px 24px rgba(0,0,0,0.15)',
          zIndex: 1002,
          display: 'flex',
          flexDirection: 'column',
          transition: 'bottom 0.35s cubic-bezier(0.4,0,0.2,1)',
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border, #e2e8f0)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--primary, #6366f1)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2a4 4 0 0 1 4 4v1a2 2 0 0 1 2 2v1a2 2 0 0 1-2 2h-.5" />
              <path d="M12 2a4 4 0 0 0-4 4v1a2 2 0 0 0-2 2v1a2 2 0 0 0 2 2h.5" />
              <circle cx="12" cy="14" r="4" />
            </svg>
            <span style={{ fontWeight: 700, fontSize: '1em' }}>AI Assistant</span>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            aria-label="Close chat"
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', display: 'flex', color: 'var(--text-secondary, #64748b)' }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 6L6 18" />
              <path d="M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Quick Actions */}
        {messages.length <= 1 && (
          <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border, #e2e8f0)', flexShrink: 0 }}>
            <div style={{ fontSize: '0.8em', fontWeight: 600, color: 'var(--text-secondary, #64748b)', marginBottom: '8px' }}>Quick Actions</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              {QUICK_ACTIONS.map((action) => (
                <button
                  key={action.id}
                  onClick={() => handleQuickAction(action)}
                  className="card"
                  style={{ padding: '10px', fontSize: '0.82em', textAlign: 'left', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', border: '1px solid var(--border, #e2e8f0)', borderRadius: '8px', background: 'var(--bg, #fff)', transition: 'background 0.15s', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}
                >
                  <span style={{ fontSize: '1.1em', flexShrink: 0 }}>{action.icon}</span>
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{action.label}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Messages */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {messages.map((msg, i) => (
            <div
              key={i}
              className="view"
              style={{
                display: 'flex',
                justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
                animation: 'fadeIn 0.25s ease',
              }}
            >
              <div
                style={{
                  maxWidth: '80%',
                  padding: '10px 14px',
                  borderRadius: msg.role === 'user' ? '12px 12px 2px 12px' : '12px 12px 12px 2px',
                  background: msg.role === 'user'
                    ? 'var(--primary, #6366f1)'
                    : 'var(--card-bg, #f1f5f9)',
                  color: msg.role === 'user' ? '#fff' : 'var(--text, #1e293b)',
                  fontSize: '0.9em',
                  lineHeight: '1.5',
                  wordBreak: 'break-word',
                }}
              >
                {msg.role === 'assistant' ? highlightScripture(msg.content) : msg.content}
              </div>
            </div>
          ))}

          {/* Action Cards */}
          {actionCards.map((card, i) => (
            <ActionCard key={i} card={card} onDismiss={() => dismissCard(i)} />
          ))}

          {/* Loading indicator */}
          {loading && (
            <div className="view" style={{ display: 'flex', justifyContent: 'flex-start' }}>
              <div className="card" style={{ padding: '10px 14px', borderRadius: '12px', display: 'flex', gap: '4px', alignItems: 'center' }}>
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--text-secondary, #94a3b8)', animation: 'community-dot-bounce 1.2s infinite', animationDelay: '0s' }} />
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--text-secondary, #94a3b8)', animation: 'community-dot-bounce 1.2s infinite', animationDelay: '0.2s' }} />
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--text-secondary, #94a3b8)', animation: 'community-dot-bounce 1.2s infinite', animationDelay: '0.4s' }} />
              </div>
            </div>
          )}

          <div ref={chatEndRef} />
        </div>

        {/* Input Bar */}
        <form onSubmit={handleSubmit} style={{ padding: '12px 16px', borderTop: '1px solid var(--border, #e2e8f0)', display: 'flex', gap: '8px', flexShrink: 0, background: 'var(--bg, #fff)' }}>
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            aria-label="Message input"
            style={{
              flex: 1,
              padding: '10px 14px',
              borderRadius: '10px',
              border: '1px solid var(--border, #e2e8f0)',
              background: 'var(--input-bg, #f8fafc)',
              fontSize: '0.9em',
              outline: 'none',
              transition: 'border-color 0.15s',
            }}
          />
          <button
            type="submit"
            disabled={!input.trim() || loading}
            aria-label="Send message"
            className="btn-primary"
            style={{
              width: '42px',
              height: '42px',
              borderRadius: '10px',
              border: 'none',
              cursor: input.trim() && !loading ? 'pointer' : 'not-allowed',
              opacity: input.trim() && !loading ? 1 : 0.5,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              background: 'var(--primary, #6366f1)',
              color: '#fff',
              transition: 'opacity 0.15s',
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 2L11 13" />
              <path d="M22 2l-7 20-4-9-9-4z" />
            </svg>
          </button>
        </form>
      </div>

      {/* Keyframe styles injected once */}
      <style>{`
        @keyframes community-fab-pulse {
          0%, 100% { box-shadow: 0 4px 14px rgba(99,102,241,0.4); }
          50% { box-shadow: 0 4px 24px rgba(99,102,241,0.65); }
        }
        @keyframes community-dot-bounce {
          0%, 60%, 100% { transform: translateY(0); }
          30% { transform: translateY(-4px); }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      `}</style>
    </>
  )
}
