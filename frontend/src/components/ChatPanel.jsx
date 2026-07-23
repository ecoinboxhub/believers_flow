import { useState, useRef, useEffect } from 'react'

const API_URL = import.meta.env.VITE_API_URL || ''

const BotAvatar = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{width:18,height:18}}>
    <rect x="3" y="11" width="18" height="10" rx="2"/><circle cx="9" cy="16" r="1"/><circle cx="15" cy="16" r="1"/>
    <path d="M12 11V7a4 4 0 0 0-4-4H8"/><path d="M12 11V7a4 4 0 0 1 4-4h0"/>
  </svg>
)

const UserAvatar = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{width:18,height:18}}>
    <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/>
  </svg>
)

const SendIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{width:18,height:18}}>
    <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
  </svg>
)

const HeartIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{width:36,height:36}}>
    <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/>
  </svg>
)

export default function ChatPanel({ isOpen, onClose, chatHistory, setChatHistory, isPremium, setShowAuth }) {
  const [chatMsg, setChatMsg] = useState('')
  const [chatLoading, setChatLoading] = useState(false)
  const chatEnd = useRef(null)
  const chatInput = useRef(null)

  useEffect(() => {
    if (isOpen && chatInput.current) {
      setTimeout(() => chatInput.current?.focus(), 350)
    }
  }, [isOpen])

  useEffect(() => {
    chatEnd.current?.scrollIntoView({ behavior: 'smooth' })
  }, [chatHistory])

  const sendChat = async () => {
    if (!chatMsg.trim() || chatLoading) return
    if (!isPremium) { setShowAuth(true); return }

    const userMsg = { role: 'user', content: chatMsg.trim() }
    const newHistory = [...chatHistory, userMsg]
    setChatHistory(newHistory)
    setChatMsg('')
    setChatLoading(true)

    try {
      const token = localStorage.getItem('bf_token')
      const headers = { 'Content-Type': 'application/json' }
      if (token) headers['Authorization'] = `Bearer ${token}`

      const resp = await fetch(`${API_URL}/api/chat`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ messages: newHistory.map(m => ({ role: m.role, content: m.content })), provider: 'groq' })
      })
      const data = await resp.json()
      const reply = data.message || data.detail || 'Sorry, I could not respond.'
      setChatHistory([...newHistory, { role: 'assistant', content: reply }])
    } catch {
      setChatHistory([...newHistory, { role: 'assistant', content: 'Network error. Please try again.' }])
    }
    setChatLoading(false)
  }

  if (!isOpen) return null

  return (
    <div className="chat-overlay">
      <div className="chat-panel">
        <div className="chat-header">
          <div className="chat-header-left">
            <div className="chat-header-icon"><BotAvatar /></div>
            <div className="chat-header-info">
              <span className="chat-title">Faith Assistant</span>
              <span className="chat-status">{isPremium ? 'Online' : 'Sign in to chat'}</span>
            </div>
          </div>
          <button className="chat-close" onClick={onClose} aria-label="Close chat">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{width:20,height:20}}>
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        <div className="chat-body">
          {!chatHistory.length && (
            <div className="chat-welcome">
              <div className="chat-welcome-icon-wrap">
                <HeartIcon />
              </div>
              <h3 className="chat-welcome-title">How can I help you today?</h3>
              <p className="chat-welcome-desc">
                I'm here to help with scripture, prayer, life advice, and more.
              </p>
              {!isPremium && (
                <button className="chat-auth-prompt" onClick={() => setShowAuth(true)}>
                  Sign in to start chatting
                </button>
              )}
              <div className="chat-suggestions">
                {[
                  "Give me a Bible verse for today",
                  "How can I improve my prayer life?",
                  "What does the Bible say about patience?",
                  "Encourage me based on my tasks"
                ].map((s, i) => (
                  <button key={i} className="chat-suggestion-chip" onClick={() => { setChatMsg(s); setTimeout(() => chatInput.current?.focus(), 50) }}>
                    <span className="chat-suggestion-text">{s}</span>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{width:14,height:14,flexShrink:0,opacity:0.4}}>
                      <polyline points="9 18 15 12 9 6"/>
                    </svg>
                  </button>
                ))}
              </div>
            </div>
          )}

          {chatHistory.map((m, i) => (
            <div key={i} className={`chat-msg ${m.role} fade-in`}>
              <div className={`chat-avatar ${m.role}`}>
                {m.role === 'user' ? <UserAvatar /> : <BotAvatar />}
              </div>
              <div className="chat-msg-content">
                <div className="chat-bubble">{m.content}</div>
              </div>
            </div>
          ))}

          {chatLoading && (
            <div className="chat-msg assistant fade-in">
              <div className="chat-avatar assistant"><BotAvatar /></div>
              <div className="chat-msg-content">
                <div className="chat-bubble typing">
                  <span className="dot-pulse" />
                  <span className="dot-pulse" style={{animationDelay:'0.15s'}} />
                  <span className="dot-pulse" style={{animationDelay:'0.3s'}} />
                </div>
              </div>
            </div>
          )}
          <div ref={chatEnd} />
        </div>

        <div className="chat-input-area">
          <div className="chat-input-wrap">
            <input
              ref={chatInput}
              type="text"
              placeholder={isPremium ? "Type your message..." : "Sign in to send messages..."}
              value={chatMsg}
              onChange={e => setChatMsg(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendChat()}
              disabled={!isPremium}
              aria-label="Type your message"
            />
            <button
              className="chat-send-btn"
              onClick={sendChat}
              disabled={chatLoading || !chatMsg.trim() || !isPremium}
              aria-label="Send message"
            >
              <SendIcon />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
