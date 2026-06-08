import { useState, useEffect, useCallback, useRef } from 'react'
import './App.css'

const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY

const VERSES = [
  { text: "I can do all things through Christ who strengthens me.", ref: "Philippians 4:13" },
  { text: "For I know the plans I have for you, declares the Lord.", ref: "Jeremiah 29:11" },
  { text: "Be strong and courageous. Do not be afraid; do not be discouraged.", ref: "Joshua 1:9" },
  { text: "Trust in the Lord with all your heart.", ref: "Proverbs 3:5" },
  { text: "The Lord is my shepherd; I shall not want.", ref: "Psalm 23:1" },
  { text: "God is our refuge and strength, a very present help in trouble.", ref: "Psalm 46:1" },
  { text: "Delight yourself in the Lord, and he will give you the desires of your heart.", ref: "Psalm 37:4" },
  { text: "The joy of the Lord is your strength.", ref: "Nehemiah 8:10" },
]

const GREETINGS = [
  { hour: 5, msg: "Good morning! Rise and shine for the Lord!", icon: "🌅" },
  { hour: 12, msg: "Good afternoon! Keep walking in faith.", icon: "☀️" },
  { hour: 17, msg: "Good evening! Rest in His presence.", icon: "🌆" },
  { hour: 21, msg: "Good night! May the Lord watch over you.", icon: "🌙" },
]

function loadState(key, fallback) {
  try {
    const val = localStorage.getItem(key)
    return val ? JSON.parse(val) : fallback
  } catch { return fallback }
}

function saveState(key, val) {
  localStorage.setItem(key, JSON.stringify(val))
}

function getGreeting() {
  const h = new Date().getHours()
  for (let i = GREETINGS.length - 1; i >= 0; i--) {
    if (h >= GREETINGS[i].hour) return GREETINGS[i]
  }
  return GREETINGS[0]
}

function getStreak(logs) {
  if (!logs.length) return 0
  let streak = 0
  const today = new Date()
  for (let i = 0; i < 365; i++) {
    const d = new Date(today)
    d.setDate(d.getDate() - i)
    const dateStr = d.toLocaleDateString()
    if (logs.some(l => l.date === dateStr)) {
      streak++
    } else if (i > 0) {
      break
    }
  }
  return streak
}

export default function App() {
  const [tasks, setTasks] = useState(() => loadState('btf_tasks', []))
  const [prayerLogs, setPrayerLogs] = useState(() => loadState('btf_prayerLogs', []))
  const [studyPlan, setStudyPlan] = useState(() => loadState('btf_studyPlan', { book: '', chapter: '' }))
  const [currentView, setCurrentView] = useState('tasks')
  const [currentFilter, setCurrentFilter] = useState('all')
  const [verse] = useState(() => VERSES[Math.floor(Math.random() * VERSES.length)])
  const [greeting] = useState(getGreeting)
  const [toast, setToast] = useState(null)
  const toastTimer = useRef(null)

  const [taskText, setTaskText] = useState('')
  const [taskCategory, setTaskCategory] = useState('spiritual')
  const [prayerMinutes, setPrayerMinutes] = useState('')
  const [studyBook, setStudyBook] = useState('')
  const [studyChapter, setStudyChapter] = useState('')
  const [aiResponse, setAiResponse] = useState('')
  const [aiLoading, setAiLoading] = useState(false)

  const streak = getStreak(prayerLogs)

  useEffect(() => { saveState('btf_tasks', tasks) }, [tasks])
  useEffect(() => { saveState('btf_prayerLogs', prayerLogs) }, [prayerLogs])
  useEffect(() => { saveState('btf_studyPlan', studyPlan) }, [studyPlan])

  const showToast = useCallback((message, type = 'success') => {
    if (toastTimer.current) clearTimeout(toastTimer.current)
    setToast({ message, type })
    toastTimer.current = setTimeout(() => setToast(null), 2500)
  }, [])

  const addTask = useCallback(() => {
    const text = taskText.trim()
    if (!text) return
    setTasks(prev => [{ id: Date.now(), text, category: taskCategory, completed: false, createdAt: new Date().toISOString() }, ...prev])
    setTaskText('')
    showToast('Task added! Keep up the good work!')
    if (navigator.vibrate) navigator.vibrate(10)
  }, [taskText, taskCategory, showToast])

  const toggleTask = useCallback((id) => {
    setTasks(prev => {
      const task = prev.find(t => t.id === id)
      if (task && !task.completed) {
        showToast('Well done! One step closer!')
        if (navigator.vibrate) navigator.vibrate(20)
      }
      return prev.map(t => t.id === id ? { ...t, completed: !t.completed } : t)
    })
  }, [showToast])

  const deleteTask = useCallback((id) => {
    setTasks(prev => prev.filter(t => t.id !== id))
    showToast('Task removed', 'info')
  }, [showToast])

  const logPrayer = useCallback(() => {
    const minutes = parseInt(prayerMinutes)
    if (!minutes || minutes <= 0) return
    const today = new Date().toLocaleDateString()
    if (prayerLogs.some(l => l.date === today)) {
      showToast('Already logged today! Add more minutes tomorrow.', 'warning')
      return
    }
    setPrayerLogs(prev => [{ date: today, minutes }, ...prev])
    setPrayerMinutes('')
    showToast(`🙏 ${minutes} min of prayer logged!`)
    if (navigator.vibrate) navigator.vibrate(15)
  }, [prayerMinutes, prayerLogs, showToast])

  const saveStudyPlan = useCallback(() => {
    if (!studyBook.trim()) return
    setStudyPlan({ book: studyBook.trim(), chapter: studyChapter })
    showToast(`📖 Studying ${studyBook.trim()} ${studyChapter || ''}`)
  }, [studyBook, studyChapter, showToast])

  const generateAiSuggestions = useCallback(async () => {
    if (!GROQ_API_KEY || GROQ_API_KEY === 'YOUR_GROQ_API_KEY_HERE') {
      setAiResponse('Set your GROQ API key in the `.env` file at the project root.\n\nCreate a free key at: https://console.groq.com/keys')
      return
    }
    if (!tasks.length) {
      setAiResponse('Add some tasks first so the AI can give you personalized suggestions!')
      return
    }
    setAiLoading(true)
    setAiResponse('Thinking and praying for suggestions...')
    const taskNames = tasks.map(t => t.text).join(', ')
    const prompt = `As a Christian mentor, look at these tasks: [${taskNames}]. Suggest 3 specific Christian activities or Bible study topics that would complement this day. Keep it short, encouraging, and include 1 emoji per suggestion.`

    try {
      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${GROQ_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'mixtral-8x7b-32768',
          messages: [{ role: 'user', content: prompt }]
        })
      })
      if (!response.ok) throw new Error(`HTTP ${response.status}`)
      const data = await response.json()
      setAiResponse(data.choices[0].message.content)
    } catch {
      setAiResponse("Couldn't reach the AI. Check your connection or your `.env` API key.")
    } finally {
      setAiLoading(false)
    }
  }, [tasks])

  const totalTasks = tasks.length
  const completedTasks = tasks.filter(t => t.completed).length
  const completionPercent = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0
  const spiritualCount = tasks.filter(t => t.category === 'spiritual').length
  const spiritualPercent = totalTasks > 0 ? Math.round((spiritualCount / totalTasks) * 100) : 0
  const secularPercent = 100 - spiritualPercent
  const todayStr = new Date().toLocaleDateString()
  const prayedToday = prayerLogs.some(l => l.date === todayStr)

  const filteredTasks = tasks.filter(t => {
    if (currentFilter === 'active') return !t.completed
    if (currentFilter === 'completed') return t.completed
    return true
  })

  return (
    <div id="app">
      {toast && (
        <div className={`toast toast-${toast.type}`}>
          <span>{toast.message}</span>
        </div>
      )}

      <header>
        <div className="greeting">{greeting.icon} {greeting.msg}</div>
        <div className="logo">
          <span className="logo-cross">✝</span>
          <span>Believers Flow</span>
        </div>
        <div className="verse-container">
          <p className="verse-text">&ldquo;{verse.text}&rdquo;</p>
          <small className="verse-ref">{verse.ref}</small>
        </div>
      </header>

      <div className="stats-bar">
        <div className="stat">
          <span className="stat-value">{tasks.length}</span>
          <span className="stat-label">Tasks</span>
        </div>
        <div className="stat">
          <span className="stat-value">{streak}</span>
          <span className="stat-label">Day Streak</span>
        </div>
        <div className="stat">
          <span className="stat-value">{prayerLogs.reduce((a, b) => a + b.minutes, 0)}</span>
          <span className="stat-label">Prayer Min</span>
        </div>
      </div>

      <nav id="main-nav">
        {['tasks', 'spiritual', 'ai'].map(view => (
          <button
            key={view}
            className={`nav-item${currentView === view ? ' active' : ''}`}
            onClick={() => setCurrentView(view)}
          >
            {view === 'tasks' ? '📋 Tasks' : view === 'spiritual' ? '✨ Spiritual' : '🤖 AI Tips'}
          </button>
        ))}
      </nav>

      <main id="view-container">
        {currentView === 'tasks' && (
          <section className="view">
            <div className="progress-card">
              <div className="progress-header">
                <span>Daily Progress</span>
                <span className="progress-pct">{completionPercent}%</span>
              </div>
              <div className="progress-track">
                <div className="progress-fill" style={{ width: `${completionPercent}%` }} />
              </div>
              <p className="progress-sub">{completedTasks} of {totalTasks} tasks completed</p>
            </div>

            <div className="filter-bar">
              {['all', 'active', 'completed'].map(f => (
                <button
                  key={f}
                  className={`filter-btn${currentFilter === f ? ' active' : ''}`}
                  onClick={() => setCurrentFilter(f)}
                >
                  {f.charAt(0).toUpperCase() + f.slice(1)}
                </button>
              ))}
            </div>

            <div className="input-group">
              <input
                type="text"
                placeholder="What's next for the Kingdom?"
                value={taskText}
                onChange={e => setTaskText(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && addTask()}
              />
              <select value={taskCategory} onChange={e => setTaskCategory(e.target.value)}>
                <option value="spiritual">Spiritual ✨</option>
                <option value="personal">Personal 🏠</option>
                <option value="service">Service 🤝</option>
              </select>
              <button onClick={addTask}>+ Add</button>
            </div>

            <ul id="task-list">
              {filteredTasks.map(t => (
                <li key={t.id} className={`task-item${t.completed ? ' completed' : ''}`}>
                  <label className="checkbox-wrap">
                    <input type="checkbox" checked={t.completed} onChange={() => toggleTask(t.id)} />
                    <span className="checkmark" />
                  </label>
                  <div className="task-text">
                    <span>{t.text}</span>
                    <div className={`task-cat ${t.category}`}>{t.category}</div>
                  </div>
                  <button className="delete-btn" onClick={() => deleteTask(t.id)}>✕</button>
                </li>
              ))}
              {filteredTasks.length === 0 && (
                <div className="empty-state">
                  <span className="empty-icon">📝</span>
                  <p>No tasks yet. Add one above!</p>
                </div>
              )}
            </ul>
          </section>
        )}

        {currentView === 'spiritual' && (
          <section className="view">
            <div className="card">
              <div className="card-icon">🕯</div>
              <h3>Prayer Tracker</h3>
              <p>Log your daily prayer time and build a streak.</p>
              {prayedToday ? (
                <div className="prayed-today-badge">
                  <span>✅ Prayed today!</span>
                </div>
              ) : (
                <div className="prayer-input">
                  <input
                    type="number"
                    placeholder="Minutes in prayer"
                    value={prayerMinutes}
                    onChange={e => setPrayerMinutes(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && logPrayer()}
                    min="1"
                  />
                  <button onClick={logPrayer}>Log</button>
                </div>
              )}
              {streak > 0 && (
                <div className="streak-badge">
                  <span className="flame">🔥</span>
                  <span>{streak} day{streak > 1 ? 's' : ''} streak!</span>
                </div>
              )}
              <div className="prayer-history">
                <h4>Recent Logs</h4>
                {prayerLogs.slice(0, 5).map((log, i) => (
                  <div key={i} className="prayer-log-item">
                    <span className="log-date">{log.date}</span>
                    <span className="log-mins">{log.minutes} min</span>
                  </div>
                ))}
                {prayerLogs.length === 0 && <p className="empty-small">No prayer logs yet.</p>}
              </div>
            </div>

            <div className="card">
              <div className="card-icon">📖</div>
              <h3>Bible Study Planner</h3>
              <p>Plan your scripture reading journey.</p>
              <div className="study-inputs">
                <input type="text" placeholder="Book (e.g. John)" value={studyBook} onChange={e => setStudyBook(e.target.value)} />
                <input type="number" placeholder="Chapter" value={studyChapter} onChange={e => setStudyChapter(e.target.value)} min="1" />
              </div>
              <button onClick={saveStudyPlan}>Save Plan</button>
              {studyPlan.book && (
                <div className="study-current">
                  <span className="study-icon">📖</span>
                  <span>Studying: {studyPlan.book} {studyPlan.chapter}</span>
                </div>
              )}
            </div>

            <div className="card">
              <div className="card-icon">⚖</div>
              <h3>Task Balancer</h3>
              <p>See how your tasks balance between spiritual and everyday life.</p>
              <div className="balance-viz">
                <div className="balance-bar" style={{ width: `${spiritualPercent}%` }} />
              </div>
              <div className="balance-labels">
                <span className="balance-spiritual">Spiritual {spiritualPercent}%</span>
                <span className="balance-secular">Secular {secularPercent}%</span>
              </div>
            </div>
          </section>
        )}

        {currentView === 'ai' && (
          <section className="view">
            <div className="card">
              <div className="card-icon">🤖</div>
              <h3>AI Believer Tips</h3>
              <p>Get personalized activity recommendations based on your tasks.</p>
              {(!GROQ_API_KEY || GROQ_API_KEY === 'YOUR_GROQ_API_KEY_HERE') && (
                <div className="env-notice">
                  <span className="env-icon">⚙️</span>
                  <div className="env-text">
                    <strong>API Key Required</strong>
                    <code>VITE_GROQ_API_KEY=your_key_here</code>
                    <small>in the <code>.env</code> file at project root</small>
                  </div>
                </div>
              )}
              <button className="primary-btn" onClick={generateAiSuggestions} disabled={aiLoading}>
                {aiLoading ? (
                  <span className="btn-loading">
                    <span className="spinner" />
                    Thinking...
                  </span>
                ) : 'Get AI Suggestions'}
              </button>
              {aiResponse && (
                <div className="ai-box">{aiResponse}</div>
              )}
            </div>
          </section>
        )}
      </main>

      <footer>
        <p>Saved locally ✦ Offline ready</p>
      </footer>
    </div>
  )
}
