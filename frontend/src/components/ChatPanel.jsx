import { useState, useRef, useEffect } from 'react'

const API_URL = import.meta.env.VITE_API_URL || ''

export default function ChatPanel({ isOpen, onClose, chatHistory, setChatHistory, isPremium, setShowAuth }) {
  const [chatMsg, setChatMsg] = useState('')
  const [chatLoading, setChatLoading] = useState(false)
  const chatEnd = useRef(null)
  const chatInput = useRef(null)

  useEffect(() => {
    if (isOpen && chatInput.current) chatInput.current.focus()
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
          <span className="chat-title"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{verticalAlign: 'middle', marginRight: '6px'}}><rect x="3" y="11" width="18" height="10" rx="2"/><circle cx="9" cy="16" r="1"/><circle cx="15" cy="16" r="1"/><path d="M12 11V7a4 4 0 0 0-4-4H8"/><path d="M12 11V7a4 4 0 0 1 4-4h0"/></svg>Faith Assistant</span>
          <button className="chat-close" onClick={onClose}>✕</button>
        </div>
        <div className="chat-body">
          {!chatHistory.length && (
            <div className="chat-welcome">
              <span className="chat-welcome-icon"><svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/></svg></span>
              <p>Hi! I'm your faith assistant. Ask me anything about scripture, prayer, life advice, or your tasks.</p>
              <div className="chat-suggestions">
                {["Give me a Bible verse for today", "How can I improve my prayer life?", "What does the Bible say about patience?", "Encourage me based on my tasks"].map((s, i) => (
                  <button key={i} className="chat-suggestion-chip" onClick={() => { setChatMsg(s); setTimeout(() => chatInput.current?.focus(), 50) }}>
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}
          {chatHistory.map((m, i) => (
            <div key={i} className={`chat-msg ${m.role} fade-in`}>
              <span className="chat-avatar">{m.role === 'user' ? <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg> : <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="10" rx="2"/><circle cx="9" cy="16" r="1"/><circle cx="15" cy="16" r="1"/><path d="M12 11V7a4 4 0 0 0-4-4H8"/><path d="M12 11V7a4 4 0 0 1 4-4h0"/></svg>}</span>
              <div className="chat-bubble">{m.content}</div>
            </div>
          ))}
          {chatLoading && (
            <div className="chat-msg assistant">
              <span className="chat-avatar"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="10" rx="2"/><circle cx="9" cy="16" r="1"/><circle cx="15" cy="16" r="1"/><path d="M12 11V7a4 4 0 0 0-4-4H8"/><path d="M12 11V7a4 4 0 0 1 4-4h0"/></svg></span>
              <div className="chat-bubble typing">
                <span className="dot-pulse" />
              </div>
            </div>
          )}
          <div ref={chatEnd} />
        </div>
        <div className="chat-input-area">
          <input ref={chatInput} type="text" placeholder="Ask anything..." value={chatMsg}
            onChange={e => setChatMsg(e.target.value)} onKeyDown={e => e.key === 'Enter' && sendChat()} />
          <button onClick={sendChat} disabled={chatLoading || !chatMsg.trim()}>Send</button>
        </div>
      </div>
    </div>
  )
}
