import { useState, useEffect, useCallback, useRef } from 'react'
import './App.css'
import ViewSwitcher from './components/ViewSwitcher.jsx'
import { getNow, getDayOfYear, formatDateShort, formatTimeShort, getGreeting as getTzGreeting, getUserTimezoneAbbr } from './dateUtils.js'
import WelcomeScreen from './components/WelcomeScreen.jsx'
import LegalScreen, { hasAcceptedLegal, LEGAL_VERSION } from './LegalScreen.jsx'
import { refreshAccessToken, isTokenExpired } from './syncService.js'
import { getTaskReminderTs, cancelBackgroundReminder, reconcileBackgroundReminders, canScheduleBackgroundReminders, notificationSupported, playTaskAlarmSound, stopTaskAlarmSound, initTaskAlarmAudio, requestReminderPermission, REMINDER_GRACE_MS, REMINDER_TICK_MS } from './taskReminders.js'
import { NATIVE_ANDROID, listenNativeAlarms } from './nativeReminders.js'
import { requestDiaryReflection } from './diaryReflection.js'
import BibleView from './components/BibleView.jsx'
import { BIBLE_API_DIRECT, BIBLE_API_DIRECT_DATA, BIBLE_BOOK_IDS } from './constants.js'
import DiaryView from './components/DiaryView.jsx'
import MusicView from './components/MusicView.jsx'
import DevotionalView from './components/DevotionalView.jsx'
import TasksView from './components/TasksView.jsx'
import SpiritualView from './components/SpiritualView.jsx'
import SettingsView from './components/SettingsView.jsx'
import { ErrorBoundary } from './components/ErrorBoundary.jsx'

const API_URL = import.meta.env.VITE_API_URL || ''
const AI_READY = true

const VERSES = [
  { text: "I can do all things through Christ who strengthens me.", ref: "Philippians 4:13" },
  { text: "For I know the plans I have for you, declares the Lord.", ref: "Jeremiah 29:11" },
  { text: "Be strong and courageous. Do not be afraid; do not be discouraged.", ref: "Joshua 1:9" },
  { text: "Trust in the Lord with all your heart.", ref: "Proverbs 3:5" },
  { text: "The Lord is my shepherd; I shall not want.", ref: "Psalm 23:1" },
  { text: "God is our refuge and strength, a very present help in trouble.", ref: "Psalm 46:1" },
  { text: "Delight yourself in the Lord, and he will give you the desires of your heart.", ref: "Psalm 37:4" },
  { text: "The joy of the Lord is your strength.", ref: "Nehemiah 8:10" },
  { text: "Cast all your anxiety on him because he cares for you.", ref: "1 Peter 5:7" },
  { text: "The Lord is my light and my salvation; whom shall I fear?", ref: "Psalm 27:1" },
  { text: "Be still, and know that I am God.", ref: "Psalm 46:10" },
  { text: "Your word is a lamp to my feet and a light to my path.", ref: "Psalm 119:105" },
]

const FONT_SIZES = { small: '13px', medium: '15px', large: '17px' }

const DEFAULT_SETTINGS = {
  theme: 'believersflow', mode: 'light', fontSize: 'medium', readingLayout: 'standard',
  notifications: { prayerReminder: true, dailyVerse: true, taskReminders: true },
  language: 'en', profileName: '', profileEmail: '', backupEnabled: false,
}

const DEFAULT_CUSTOM_COLORS = { primary: '#3a7bd5', accent: '#f2c94c', background: '#0a0a1a' }

function loadState(key, fallback) {
  try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : fallback } catch { return fallback }
}
function saveState(key, val) { localStorage.setItem(key, JSON.stringify(val)) }

function getStreak(logs) {
  if (!logs.length) return 0
  let streak = 0
  const today = getNow()
  for (let i = 0; i < 365; i++) {
    const d = new Date(today); d.setDate(d.getDate() - i)
    if (logs.some(l => l.date === d.toLocaleDateString())) streak++
    else if (i > 0) break
  }
  return streak
}

export default function App() {
  const [showWelcome, setShowWelcome] = useState(() => {
    if (!loadState('btf_onboardingDone', false)) return false
    if (!hasAcceptedLegal()) return false
    return !loadState('btf_welcomeDone', false)
  })
  const [tasks, setTasks] = useState(() => loadState('btf_tasks', []))
  const [prayerLogs, setPrayerLogs] = useState(() => loadState('btf_prayerLogs', []))
  const [studyPlan, setStudyPlan] = useState(() => loadState('btf_studyPlan', { book: '', chapter: '' }))
  const [diaryEntries, setDiaryEntries] = useState(() => loadState('btf_diary', []))
  const [bibleVersion, setBibleVersion] = useState(() => loadState('btf_bibleVersion', 'KJV'))
  const [currentView, setCurrentView] = useState('tasks')
  const [currentFilter, setCurrentFilter] = useState('all')
  const [verseIndex, setVerseIndex] = useState(() => {
    const today = getNow().toDateString()
    const saved = loadState('btf_verseDate', '')
    if (saved === today) return loadState('btf_verseIndex', 0)
    const idx = Math.floor(Math.random() * VERSES.length)
    saveState('btf_verseDate', today); saveState('btf_verseIndex', idx)
    return idx
  })
  const [greeting, setGreeting] = useState(() => getTzGreeting())
  const [toast, setToast] = useState(null)
  const toastTimer = useRef(null)
  const [taskText, setTaskText] = useState('')
  const [taskTime, setTaskTime] = useState('')
  const [taskCategory, setTaskCategory] = useState('spiritual')
  const [taskDate, setTaskDate] = useState('')
  const [taskDescription, setTaskDescription] = useState('')
  const [taskReminder, setTaskReminder] = useState(true)
  const [editingTask, setEditingTask] = useState(null)
  const [alarmBanner, setAlarmBanner] = useState(null)
  const [prayerMinutes, setPrayerMinutes] = useState('')
  const [studyBook, setStudyBook] = useState('')
  const [studyChapter, setStudyChapter] = useState('')
  const [chatOpen, setChatOpen] = useState(false)
  const [chatMsg, setChatMsg] = useState('')
  const [chatHistory, setChatHistory] = useState(() => loadState('btf_chat', []))
  const [chatLoading, setChatLoading] = useState(false)
  const [showGuide, setShowGuide] = useState(false)
const [diaryTitle, setDiaryTitle] = useState('')
  const [diaryContent, setDiaryContent] = useState('')
  const [diaryMood, setDiaryMood] = useState('\uD83D\uDE0A')
  const [editingDiary, setEditingDiary] = useState(null)
  const [reflectionLoadingId, setReflectionLoadingId] = useState(null)
  const [bibleBook, setBibleBook] = useState('Genesis')
  const [bibleChapter, setBibleChapter] = useState(1)
  const [bibleText, setBibleText] = useState(null)
  const [bibleLoading, setBibleLoading] = useState(false)
  const [bibleError, setBibleError] = useState(null)
  const [bibleTestament, setBibleTestament] = useState('OT')
  const [recentReads, setRecentReads] = useState(() => loadState('btf_recentReads', []))
  const [bibleStudyTab, setBibleStudyTab] = useState('read')
  const [explanation, setExplanation] = useState(null)
  const [explanationLoading, setExplanationLoading] = useState(false)
  const [commentary, setCommentary] = useState(null)
  const [commentaryLoading, setCommentaryLoading] = useState(false)
  const [concordanceQuery, setConcordanceQuery] = useState('')
  const [concordanceResults, setConcordanceResults] = useState(null)
  const [concordanceLoading, setConcordanceLoading] = useState(false)
  const [comparison, setComparison] = useState(null)
  const [comparisonLoading, setComparisonLoading] = useState(false)
  const [interlinear, setInterlinear] = useState(null)
  const [interlinearLoading, setInterlinearLoading] = useState(false)
  const [commentarySources, setCommentarySources] = useState([])
  const [commentarySourceId, setCommentarySourceId] = useState('matthew-henry')
  const [concordanceError, setConcordanceError] = useState(null)
  const [dictionaryTerm, setDictionaryTerm] = useState('')
  const [dictionaryMatches, setDictionaryMatches] = useState(null)
  const [dictionaryLoading, setDictionaryLoading] = useState(false)
  const chatEnd = useRef(null)
  const chatInput = useRef(null)
  const [settings, setSettings] = useState(() => loadState('btf_settings', DEFAULT_SETTINGS))
  const [customColors, setCustomColors] = useState(() => loadState('btf_customColors', DEFAULT_CUSTOM_COLORS))
  const [showOnboarding, setShowOnboarding] = useState(() => {
    const done = loadState('btf_onboardingDone', false)
    return !done
  })
  const [onboardingStep, setOnboardingStep] = useState(0)
  const [showLegal, setShowLegal] = useState(() => {
    if (showOnboarding) return false
    return !hasAcceptedLegal()
  })
  const [legalMode, setLegalMode] = useState('onboarding')
  const [legalSettingsOpen, setLegalSettingsOpen] = useState(false)

  // Hymns state
  const [hymnSearch, setHymnSearch] = useState('')
  const [selectedHymn, setSelectedHymn] = useState(null)
  const [hymnCategory, setHymnCategory] = useState('all')
  const [hymnSort, setHymnSort] = useState('number')
  const [hymnFavorites, setHymnFavorites] = useState(() => loadState('btf_hymnFavorites', []))
  const [hymnRecentlyViewed, setHymnRecentlyViewed] = useState(() => loadState('btf_recentHymns', []))
  const [navOrder, setNavOrder] = useState(() => loadState('btf_navOrder', ['tasks', 'spiritual', 'diary', 'bible', 'devotional', 'music', 'assistant', 'guide', 'settings']))
  const [draggedItem, setDraggedItem] = useState(null)
  const [dragTarget, setDragTarget] = useState(null)
  const navRef = useRef(null)
  const touchDragItem = useRef(null)
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => loadState('btf_sidebarCollapsed', false))
  const [previewMode, setPreviewMode] = useState('desktop')

  // Devotional state — `devotionalDay` is an OFFSET from today's calendar day,
  // so the daily devotional auto-advances with the date (no manual intervention).
  const [devotionalDay, setDevotionalDay] = useState(() => {
    const migrated = loadState('btf_devotional_v3', false)
    if (!migrated) {
      saveState('btf_devotional_v3', true)
      const today = Math.min(getDayOfYear() - 1, 364)
      const legacy = loadState('btf_devotionalDay', null)
      if (legacy !== null && typeof legacy === 'number') {
        const offset = ((legacy - today) % 365 + 365) % 365
        saveState('btf_devotionalOffset', offset)
        return offset
      }
      const off = loadState('btf_devotionalOffset', 0)
      return typeof off === 'number' ? off : 0
    }
    const off = loadState('btf_devotionalOffset', 0)
    return typeof off === 'number' ? off : 0
  })
  const [devotionalFontSize, setDevotionalFontSize] = useState(() => loadState('btf_devFontSize', 'medium'))
  const [selectedChurch, setSelectedChurch] = useState(() => loadState('btf_selectedChurch', ''))
  const [churchDevotionalDay, setChurchDevotionalDay] = useState(() => loadState('btf_churchDevotionalDay', Math.min(getDayOfYear() - 1, 364)))

  const completeOnboarding = useCallback(() => {
    setShowOnboarding(false)
    saveState('btf_onboardingDone', true)
    if (!hasAcceptedLegal()) {
      setLegalMode('onboarding')
      setShowLegal(true)
    }
  }, [])

  const handleGetStarted = useCallback(() => {
    setShowOnboarding(false)
    saveState('btf_onboardingDone', true)
    if (!hasAcceptedLegal()) {
      localStorage.setItem('bf_legal_accepted', JSON.stringify({
        version: LEGAL_VERSION,
        accepted_at: new Date().toISOString(),
        documents: {
          privacy: true, tos: true, tou: true, community: true,
          'data-collection': true, security: true, cookies: true,
          'content-moderation': true, 'acceptable-use': true,
          'third-party': true, 'data-retention': true,
          'incident-response': true, 'data-compliance': true,
          'compliance-checklist': true
        }
      }))
    }
    const welcomeDone = loadState('btf_welcomeDone', false)
    if (!welcomeDone) setShowWelcome(true)
  }, [])

  const streak = getStreak(prayerLogs)
  const verse = VERSES[verseIndex]

  useEffect(() => { saveState('btf_tasks', tasks) }, [tasks])
  const tasksRef = useRef(tasks)
  useEffect(() => { tasksRef.current = tasks }, [tasks])
  useEffect(() => { saveState('btf_prayerLogs', prayerLogs) }, [prayerLogs])
  useEffect(() => { saveState('btf_studyPlan', studyPlan) }, [studyPlan])
  useEffect(() => { saveState('btf_chat', chatHistory) }, [chatHistory])
  useEffect(() => { saveState('btf_diary', diaryEntries) }, [diaryEntries])
  useEffect(() => { saveState('btf_bibleVersion', bibleVersion) }, [bibleVersion])
  useEffect(() => { saveState('btf_recentReads', recentReads) }, [recentReads])
  useEffect(() => { saveState('btf_hymnFavorites', hymnFavorites) }, [hymnFavorites])
  useEffect(() => { saveState('btf_recentHymns', hymnRecentlyViewed) }, [hymnRecentlyViewed])
  useEffect(() => { saveState('btf_devotionalOffset', devotionalDay) }, [devotionalDay])
  useEffect(() => { saveState('btf_devFontSize', devotionalFontSize) }, [devotionalFontSize])
  useEffect(() => { saveState('btf_selectedChurch', selectedChurch) }, [selectedChurch])
  useEffect(() => { saveState('btf_churchDevotionalDay', churchDevotionalDay) }, [churchDevotionalDay])
  useEffect(() => { saveState('btf_navOrder', navOrder) }, [navOrder])
  useEffect(() => { saveState('btf_sidebarCollapsed', sidebarCollapsed) }, [sidebarCollapsed])
  useEffect(() => { if (chatOpen && chatInput.current) chatInput.current.focus() }, [chatOpen])
  useEffect(() => { chatEnd.current?.scrollIntoView({ behavior: 'smooth' }) }, [chatHistory])

  useEffect(() => {
    if (mobileDrawerOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [mobileDrawerOpen])

  useEffect(() => {
    const id = setInterval(() => { setGreeting(getTzGreeting()) }, 30000)
    return () => clearInterval(id)
  }, [])

  useEffect(() => {
    const app = document.getElementById('app')
    if (!app) return
    const isLight = settings.mode === 'light'
    app.setAttribute('data-theme', isLight ? 'light' : settings.theme)
    app.setAttribute('data-mode', settings.mode)
    app.style.fontSize = FONT_SIZES[settings.fontSize] || '15px'
    app.setAttribute('data-reading-layout', settings.readingLayout)
    if (settings.theme === 'custom') {
      Object.entries(customColors).forEach(([k, v]) => app.style.setProperty(`--custom-${k}`, v))
    }
    saveState('btf_settings', settings)
    saveState('btf_customColors', customColors)
  }, [settings, customColors])

  const fetchChapter = useCallback(async (book, chapter, version) => {
    const ver = version || bibleVersion
    const cacheKey = `btf_bible_${ver}_${book}_${chapter}`
    const cached = loadState(cacheKey, null)
    if (cached) { setBibleText(cached); setBibleError(null); setBibleLoading(false); return }

    setBibleLoading(true); setBibleError(null)
    try {
      let data
      let fallbackDetail = ''
      try {
        const res = await fetch(
          `${API_URL}/api/bible?book=${encodeURIComponent(book)}&chapter=${chapter}&version=${ver}`,
          { signal: AbortSignal.timeout(10000) }
        )
        if (!res.ok) {
          const body = await res.json().catch(() => null)
          fallbackDetail = (body && body.detail) || `HTTP ${res.status}`
          throw new Error(fallbackDetail)
        }
        data = await res.json()
      } catch (err) {
        if (BIBLE_API_DIRECT[ver]) {
          const translation = BIBLE_API_DIRECT[ver]
          const bookId = BIBLE_BOOK_IDS[book]
          if (BIBLE_API_DIRECT_DATA[ver] && bookId) {
            const url = `https://bible-api.com/data/${translation}/${bookId}/${chapter}`
            const res = await fetch(url, { signal: AbortSignal.timeout(10000) })
            if (!res.ok) throw new Error(`HTTP ${res.status}`, { cause: err })
            const raw = await res.json()
            data = { reference: `${book} ${chapter}`, verses: raw.verses || [], version: ver }
          } else {
            const url = `https://bible-api.com/${encodeURIComponent(book)}+${chapter}?translation=${translation}`
            const res = await fetch(url, { signal: AbortSignal.timeout(10000) })
            if (!res.ok) throw new Error(`HTTP ${res.status}`, { cause: err })
            data = await res.json()
          }
        } else {
          throw new Error(
            typeof fallbackDetail === 'string' && fallbackDetail
              ? fallbackDetail
              : `"${ver}" is not available. Choose KJV, WEB, ASV, BBE, DBY, YLT, or another supported translation.`,
            { cause: err }
          )
        }
      }
      if (!data.verses) data = { reference: `${book} ${chapter}`, verses: [], version: ver }
      setBibleText(data)
      saveState(cacheKey, data)
      setRecentReads(prev => {
        const filtered = prev.filter(r => !(r.book === book && r.chapter === chapter))
        return [{ book, chapter, ref: `${book} ${chapter}`, time: Date.now() }, ...filtered].slice(0, 15)
      })
    } catch (e) {
      setBibleError(e.message === 'Failed to fetch' ? 'Connect to the internet to read this chapter.' : `Could not load chapter. ${e.message}`)
      setBibleText(null)
    } finally { setBibleLoading(false) }
  }, [bibleVersion])

  useEffect(() => {
    if (currentView !== 'bible') return
    fetchChapter(bibleBook, bibleChapter, bibleVersion) // eslint-disable-line react-hooks/set-state-in-effect
  }, [bibleBook, bibleChapter, bibleVersion, currentView, fetchChapter])

  const showToast = useCallback((msg, type = 'success', action = null) => {
    if (toastTimer.current) clearTimeout(toastTimer.current)
    setToast({ message: msg, type, action })
  }, [])

  useEffect(() => {
    if (!toast) return
    toastTimer.current = setTimeout(() => setToast(null), 4500)
    return () => { if (toastTimer.current) clearTimeout(toastTimer.current) }
  }, [toast])



  const handleWelcomeAction = useCallback(() => {
    saveState('btf_welcomeDone', true)
    setShowWelcome(false)
  }, [])

  const handleLegalAccept = useCallback(() => {
    setShowLegal(false)
  }, [])

  const handleLegalDecline = useCallback(() => {
    setShowLegal(false)
    setShowOnboarding(true)
    saveState('btf_onboardingDone', false)
  }, [])

  const openLegalSettings = useCallback(() => {
    setLegalMode('settings')
    setLegalSettingsOpen(true)
  }, [])

  const nextVerse = useCallback(() => {
    setVerseIndex(i => {
      const n = (i + 1) % VERSES.length
      saveState('btf_verseIndex', n)
      return n
    })
  }, [])

  const addTask = useCallback(() => {
    const text = taskText.trim()
    if (!text) return
    const ts = getTaskReminderTs({ date: taskDate, time: taskTime })
    const scheduleFuture = ts && ts > Date.now()
    if (taskTime && taskReminder && settings.notifications.taskReminders && !scheduleFuture) {
      showToast('Reminder time is in the past \u2014 set a future time to be reminded', 'warning')
    }
    if (taskTime && taskReminder && settings.notifications.taskReminders && scheduleFuture) {
      requestReminderPermission().then(ok => {
        if (!ok) showToast('Notifications blocked \u2014 reminders will alert in-app only', 'warning')
      })
    }
    setTasks(prev => [{
      id: Date.now(), text, description: taskDescription.trim(), date: taskDate, time: taskTime,
      category: taskCategory, reminder: taskReminder, completed: false, reminderFiredAt: null,
      createdAt: new Date().toISOString(),
    }, ...prev])
    setTaskText(''); setTaskDescription(''); setTaskDate(''); setTaskTime(''); setTaskCategory('spiritual'); setTaskReminder(true)
    showToast(taskTime ? 'Task added with reminder!' : 'Task added!')
    if (navigator.vibrate) navigator.vibrate(10)
  }, [taskText, taskDescription, taskDate, taskTime, taskCategory, taskReminder, settings.notifications.taskReminders, showToast])

  const editTask = useCallback(() => {
    if (!editingTask) return
    const text = taskText.trim()
    if (!text) return
    const ts = getTaskReminderTs({ date: taskDate, time: taskTime })
    const scheduleFuture = ts && ts > Date.now()
    if (taskTime && taskReminder && settings.notifications.taskReminders && !scheduleFuture) {
      showToast('Reminder time is in the past \u2014 set a future time to be reminded', 'warning')
    }
    if (taskTime && taskReminder && settings.notifications.taskReminders && scheduleFuture) {
      requestReminderPermission().then(ok => {
        if (!ok) showToast('Notifications blocked \u2014 reminders will alert in-app only', 'warning')
      })
    }
    setTasks(prev => prev.map(t => t.id === editingTask.id ? {
      ...t, text, description: taskDescription.trim(), date: taskDate, time: taskTime,
      category: taskCategory, reminder: taskReminder, reminderFiredAt: null,
    } : t))
    setEditingTask(null); setTaskText(''); setTaskDescription(''); setTaskDate(''); setTaskTime(''); setTaskCategory('spiritual'); setTaskReminder(true)
    showToast('Task updated!')
    if (navigator.vibrate) navigator.vibrate(10)
  }, [editingTask, taskText, taskDescription, taskDate, taskTime, taskCategory, taskReminder, settings.notifications.taskReminders, showToast])

  const editTaskInit = useCallback((task) => {
    setEditingTask(task)
    setTaskText(task.text || '')
    setTaskDescription(task.description || '')
    setTaskDate(task.date || '')
    setTaskTime(task.time || '')
    setTaskCategory(task.category || 'spiritual')
    setTaskReminder(task.reminder !== false)
    setCurrentView('tasks')
  }, [])

  const cancelEditTask = useCallback(() => {
    setEditingTask(null); setTaskText(''); setTaskDescription(''); setTaskDate(''); setTaskTime(''); setTaskCategory('spiritual'); setTaskReminder(true)
  }, [])

  const toggleTask = useCallback((id) => {
    const target = tasks.find(x => x.id === id)
    if (target && !target.completed) {
      showToast('Well done!')
      if (navigator.vibrate) navigator.vibrate(20)
      cancelBackgroundReminder(id)
    }
    setTasks(prev => prev.map(x => x.id === id ? {
      ...x, completed: !x.completed,
      reminderFiredAt: !x.completed ? new Date().toISOString() : null,
    } : x))
  }, [tasks, showToast])

  const deleteTask = useCallback((id) => {
    if (tasks.find(t => t.id === id)) showToast('Task deleted')
    if (editingTask && editingTask.id === id) {
      setEditingTask(null); setTaskText(''); setTaskDescription(''); setTaskDate(''); setTaskTime(''); setTaskCategory('spiritual'); setTaskReminder(true)
    }
    cancelBackgroundReminder(id)
    setTasks(prev => prev.filter(t => t.id !== id))
  }, [tasks, editingTask, showToast])

  useEffect(() => {
    if (!settings.notifications.taskReminders) return
    const fireDue = () => {
      const now = Date.now()
      const due = []
      const missed = []
      for (const t of tasksRef.current) {
        if (t.completed || t.reminderFiredAt) continue
        const ts = getTaskReminderTs(t)
        if (!ts) continue
        const delta = now - ts
        if (delta >= -1000 && delta <= REMINDER_GRACE_MS) due.push(t)
        else if (delta > REMINDER_GRACE_MS) missed.push(t)
      }
      if (due.length === 0 && missed.length === 0) return
      const firedAt = new Date().toISOString()
      due.forEach(t => {
        const title = t.text || 'Task'
        showToast(`\u23F0 ${title}`, 'info')
        setAlarmBanner({ taskId: t.id, title })
        if (navigator.vibrate) navigator.vibrate([200, 100, 200])
        if (!NATIVE_ANDROID) {
          playTaskAlarmSound()
          cancelBackgroundReminder(t.id)
        }
        if (!NATIVE_ANDROID && notificationSupported() && Notification.permission === 'granted' && !canScheduleBackgroundReminders()) {
          try { new Notification('\u23F0 Task Reminder', { body: `${title} is due now.`, icon: './icon-192.png', badge: './icon-192.png' }) } catch { /* noop */ }
        }
      })
      setTasks(prev => prev.map(x => (due.some(d => d.id === x.id) || missed.some(d => d.id === x.id)) ? { ...x, reminderFiredAt: firedAt } : x))
    }
    const id = setInterval(fireDue, REMINDER_TICK_MS)
    return () => clearInterval(id)
  }, [settings.notifications.taskReminders, showToast])

  useEffect(() => {
    reconcileBackgroundReminders(tasks, settings.notifications.taskReminders)
  }, [tasks, settings.notifications.taskReminders])

  useEffect(() => {
    if (!('serviceWorker' in navigator)) return
    const onMessage = e => {
      if (e.data && e.data.type === 'TASK_COMPLETE') toggleTask(e.data.taskId)
    }
    navigator.serviceWorker.addEventListener('message', onMessage)
    return () => navigator.serviceWorker.removeEventListener('message', onMessage)
  }, [toggleTask])

  useEffect(() => {
    if (!alarmBanner) return
    const id = setTimeout(() => setAlarmBanner(null), 12000)
    return () => clearTimeout(id)
  }, [alarmBanner])

  useEffect(() => {
    if (!alarmBanner) stopTaskAlarmSound()
  }, [alarmBanner])

  useEffect(() => {
    initTaskAlarmAudio()
  }, [])

  useEffect(() => {
    if (!NATIVE_ANDROID) return
    return listenNativeAlarms(({ taskId, title }) => {
      if (navigator.vibrate) navigator.vibrate([200, 100, 200])
      setAlarmBanner({ taskId, title })
    })
  }, [])

  const logPrayer = useCallback(() => {
    const m = parseInt(prayerMinutes)
    if (!m || m <= 0) return
    const today = new Date().toLocaleDateString()
    if (prayerLogs.some(l => l.date === today)) { showToast('Already logged today!', 'warning'); return }
    setPrayerLogs(prev => [{ date: today, minutes: m }, ...prev]); setPrayerMinutes('')
    showToast(`${m} min of prayer!`); if (navigator.vibrate) navigator.vibrate(15)
  }, [prayerMinutes, prayerLogs, showToast])

  const saveStudyPlan = useCallback(() => {
    if (!studyBook.trim()) return
    setStudyPlan({ book: studyBook.trim(), chapter: studyChapter })
    showToast(`Studying ${studyBook.trim()} ${studyChapter || ''}`)
  }, [studyBook, studyChapter, showToast])

  const goToBibleChapter = useCallback((book, chapter) => {
    setBibleBook(book); setBibleChapter(chapter); setCurrentView('bible')
  }, [])

const generateDiaryReflection = useCallback(async (entry) => {
    if (!entry || !entry.id) return
    setReflectionLoadingId(entry.id)
    try {
      const result = await requestDiaryReflection({ title: entry.title, content: entry.content, mood: entry.mood })
      setDiaryEntries(prev => prev.map(e => e.id === entry.id ? { ...e, reflection: result } : e))
    } finally {
      setReflectionLoadingId(prev => (prev === entry.id ? null : prev))
    }
  }, [])

  const addDiaryEntry = useCallback(() => {
    if (!diaryContent.trim()) return
    if (editingDiary) {
      setDiaryEntries(prev => prev.map(e => e.id === editingDiary.id ? { ...e, title: diaryTitle.trim(), content: diaryContent.trim(), mood: diaryMood } : e))
      showToast('Diary updated! 📓')
    } else {
      const entry = { id: Date.now(), title: diaryTitle.trim(), content: diaryContent.trim(), mood: diaryMood, date: new Date().toISOString() }
      setDiaryEntries(prev => [entry, ...prev])
      showToast('Diary entry saved! 📓')
      generateDiaryReflection(entry)
    }
    setDiaryTitle(''); setDiaryContent(''); setDiaryMood('\uD83D\uDE0A'); setEditingDiary(null)
  }, [diaryTitle, diaryContent, diaryMood, editingDiary, showToast, generateDiaryReflection])

  const editDiaryEntry = useCallback((entry) => {
    setEditingDiary(entry); setDiaryTitle(entry.title); setDiaryContent(entry.content); setDiaryMood(entry.mood)
    setCurrentView('diary')
  }, [])

  const deleteDiaryEntry = useCallback((id) => {
    setDiaryEntries(prev => {
      const item = prev.find(e => e.id === id)
      if (item) {
        showToast('Entry removed')
      }
      return prev.filter(e => e.id !== id)
    })
  }, [showToast])

  const chatHistoryRef = useRef(chatHistory)
  useEffect(() => { chatHistoryRef.current = chatHistory }, [chatHistory])

  const sendChat = useCallback(async () => {
    const msg = chatMsg.trim()
    if (!msg || chatLoading) return

    const userEntry = { role: 'user', content: msg }
    setChatHistory(prev => [...prev, userEntry])
    setChatMsg(''); setChatLoading(true)

    const taskContext = tasks.length ? `The user's current tasks are: ${tasks.map(t => t.text).join(', ')}` : ''

    const pushError = (content) => setChatHistory(prev => [...prev, { role: 'assistant', content }])

    try {
      const currentHistory = [...chatHistoryRef.current, userEntry]
      const token = localStorage.getItem('bf_token')
      const res = await fetch(`${API_URL}/api/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          messages: currentHistory.slice(-6),
          taskContext,
          provider: 'groq'
        })
      })
      const data = await res.json().catch(() => null)
      if (!res.ok) {
        const detail = data && data.detail ? String(data.detail) : ''
        if (res.status === 401 || res.status === 403) {
          pushError("Your session could not reach the assistant. Please try again.")
        } else if (res.status === 429) {
          pushError("The assistant is busy right now. Please wait a moment and try again.")
        } else if (res.status >= 500) {
          pushError(detail || "The assistant service is temporarily unavailable. Please try again.")
        } else {
          pushError(detail || `Request failed (${res.status}). Please try again.`)
        }
        return
      }
      if (!data || typeof data.message !== 'string' || !data.message.trim()) {
        pushError("The assistant is having trouble responding right now. Please try again in a moment.")
        return
      }
      setChatHistory(prev => [...prev, { role: 'assistant', content: data.message }])
    } catch (err) {
      const isNetwork = !err || err.name === 'TypeError' || err.message === 'Failed to fetch'
      pushError(isNetwork
        ? "Network error — please check your connection and try again."
        : `Something went wrong (${err.message}). Please try again.`)
    } finally { setChatLoading(false) }
  }, [chatMsg, chatLoading, tasks])

  const swapNavItems = useCallback((from, to) => {
    setNavOrder(prev => {
      const arr = [...prev]
      const fromIdx = arr.indexOf(from)
      const toIdx = arr.indexOf(to)
      if (fromIdx === -1 || toIdx === -1 || fromIdx === toIdx) return prev
      arr.splice(fromIdx, 1)
      arr.splice(toIdx, 0, from)
      return arr
    })
  }, [])

  const handleDragStart = useCallback((e, view) => {
    setDraggedItem(view)
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', view)
  }, [])

  const handleDragOver = useCallback((e, view) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    if (view !== draggedItem) setDragTarget(view)
  }, [draggedItem])

  const handleDrop = useCallback((e, view) => {
    e.preventDefault()
    if (draggedItem && view !== draggedItem) swapNavItems(draggedItem, view)
    setDraggedItem(null)
    setDragTarget(null)
  }, [draggedItem, swapNavItems])

  const handleDragEnd = useCallback(() => {
    setDraggedItem(null)
    setDragTarget(null)
  }, [])

  const handleTouchStart = useCallback((e, view) => {
    touchDragItem.current = view
    setDraggedItem(view)
  }, [])

  const handleTouchMove = useCallback((e) => {
    if (!touchDragItem.current || !navRef.current) return
    const touch = e.touches[0]
    const children = [...navRef.current.children]
    for (const child of children) {
      const rect = child.getBoundingClientRect()
      if (touch.clientX >= rect.left && touch.clientX <= rect.right) {
        const childView = child.getAttribute('data-view')
        if (childView && childView !== touchDragItem.current) {
          setDragTarget(childView)
        }
        break
      }
    }
  }, [])

  const handleTouchEnd = useCallback(() => {
    if (touchDragItem.current && dragTarget && dragTarget !== touchDragItem.current) {
      swapNavItems(touchDragItem.current, dragTarget)
    }
    touchDragItem.current = null
    setDraggedItem(null)
    setDragTarget(null)
  }, [dragTarget, swapNavItems])

  const apiPost = useCallback(async (path, body) => {
    try {
      let token = localStorage.getItem('bf_token')
      if (token && isTokenExpired(token)) {
        const newToken = await refreshAccessToken()
        if (newToken) token = newToken
        else {
          showToast('Session expired. Please log in again.', 'warning')
          return null
        }
      }
      const res = await fetch(`${API_URL}${path}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(body),
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      return await res.json()
    } catch (e) {
      showToast(`Request failed: ${e.message}`, 'warning')
      return null
    }
  }, [showToast])

  const explainVerse = useCallback(async (reference, text) => {
    setExplanationLoading(true); setExplanation(null); setBibleStudyTab('explain')
    const data = await apiPost('/api/bible/explain', { reference, text, version: bibleVersion })
    if (data) setExplanation(data)
    setExplanationLoading(false)
  }, [apiPost, bibleVersion])

  const getCommentary = useCallback(async (sourceId) => {
    if (!bibleText) return
    const src = sourceId || commentarySourceId
    setCommentaryLoading(true); setCommentary(null); setBibleStudyTab('commentary')

    if (commentarySources.length === 0) {
      try {
        let token = localStorage.getItem('bf_token')
        if (token && isTokenExpired(token)) token = (await refreshAccessToken()) || token
        const res = await fetch(`${API_URL}/api/bible/commentary/sources`, {
          headers: token ? { 'Authorization': `Bearer ${token}` } : {},
        })
        if (res.ok) {
          const d = await res.json()
          if (d && d.sources) {
            setCommentarySources(d.sources)
            const current = d.sources.find(s => s.id === src)
            if (current) setCommentarySourceId(current.id)
          }
        }
      } catch { /* sources optional */ }
    }

    const data = await apiPost('/api/bible/commentary', { book: bibleBook, chapter: bibleChapter, source: src })
    if (data && data.available !== false) setCommentary(data)
    else if (data) setCommentary(data) // includes available:false + note
    else setCommentary({ book: bibleBook, chapter: bibleChapter, source: null, available: false, entries: [], note: 'Commentary could not be loaded. Please try again.' })
    setCommentaryLoading(false)
  }, [apiPost, bibleText, bibleBook, bibleChapter, commentarySourceId, commentarySources.length])

  const searchConcordance = useCallback(async () => {
    const q = concordanceQuery.trim()
    if (!q) return
    setConcordanceLoading(true); setConcordanceResults(null); setConcordanceError(null); setBibleStudyTab('concordance')
    const data = await apiPost('/api/bible/concordance', { query: q, version: bibleVersion })
    if (data) setConcordanceResults(data)
    else setConcordanceError('Concordance search failed. Please try again.')
    setConcordanceLoading(false)
  }, [apiPost, concordanceQuery, bibleVersion])

  const searchDictionary = useCallback(async () => {
    const term = dictionaryTerm.trim()
    if (!term) return
    setDictionaryLoading(true); setDictionaryMatches(null)
    const data = await apiPost('/api/bible/dictionary', { term, expand: false })
    if (data) setDictionaryMatches(data)
    setDictionaryLoading(false)
  }, [apiPost, dictionaryTerm])

  const assistNote = useCallback(async (noteText, reference) => {
    return await apiPost('/api/bible/notes-assist', { note_text: noteText, reference: reference || '' })
  }, [apiPost])

  const compareVersions = useCallback(async () => {
    setComparisonLoading(true); setComparison(null); setBibleStudyTab('compare')
    const data = await apiPost('/api/bible/compare', { book: bibleBook, chapter: bibleChapter, version: bibleVersion })
    if (data) setComparison(data)
    setComparisonLoading(false)
  }, [apiPost, bibleBook, bibleChapter, bibleVersion])

  const getInterlinear = useCallback(async () => {
    setInterlinearLoading(true); setInterlinear(null); setBibleStudyTab('interlinear')
    try {
      const token = localStorage.getItem('bf_token')
      const res = await fetch(
        `${API_URL}/api/interlinear/${encodeURIComponent(bibleBook)}/${bibleChapter}?version=${bibleVersion}`,
        {
          headers: token ? { 'Authorization': `Bearer ${token}` } : {},
          signal: AbortSignal.timeout(12000),
        }
      )
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json()
      setInterlinear(data)
    } catch (e) {
      showToast(`Interlinear failed: ${e.message}`, 'warning')
    } finally {
      setInterlinearLoading(false)
    }
  }, [bibleBook, bibleChapter, bibleVersion, showToast])

  // Hymns
  const openHymn = useCallback((hymn) => {
    setSelectedHymn(hymn)
    setHymnRecentlyViewed(prev => {
      const filtered = prev.filter(h => h.id !== hymn.id)
      return [{ id: hymn.id, title: hymn.title, author: hymn.author }, ...filtered].slice(0, 15)
    })
  }, [])

  const closeHymn = useCallback(() => {
    setSelectedHymn(null)
  }, [])

  const toggleHymnFavorite = useCallback((id) => {
    setHymnFavorites(prev => {
      const isFav = prev.includes(id)
      showToast(isFav ? 'Removed from favorites' : 'Added to favorites!')
      return isFav ? prev.filter(f => f !== id) : [...prev, id]
    })
  }, [showToast])

  const nextDevotional = useCallback(() => {
    setDevotionalDay(prev => prev + 1)
  }, [])

  const prevDevotional = useCallback(() => {
    setDevotionalDay(prev => prev - 1)
  }, [])

  const goToTodaysDevotional = useCallback(() => {
    setDevotionalDay(0)
    showToast("Today's devotional")
  }, [showToast])

  const todayDevotionalIndex = Math.min(getDayOfYear() - 1, 364)
  const currentDevotionalIndex = ((todayDevotionalIndex + devotionalDay) % 365 + 365) % 365

  const updateSetting = useCallback((key, value) => {
    setSettings(prev => ({ ...prev, [key]: value }))
  }, [])

  const updateNotification = useCallback((key, value) => {
    setSettings(prev => ({ ...prev, notifications: { ...prev.notifications, [key]: value } }))
  }, [])

  const updateCustomColor = useCallback((key, value) => {
    setCustomColors(prev => ({ ...prev, [key]: value }))
  }, [])

  const exportData = useCallback(() => {
    const data = { tasks, prayerLogs, studyPlan, diaryEntries, bibleVersion, chatHistory, settings, customColors, recentReads }
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = `believersflow-backup-${getNow().toISOString().slice(0, 10)}.json`
    a.click(); URL.revokeObjectURL(url)
    showToast('Backup exported!')
  }, [tasks, prayerLogs, studyPlan, diaryEntries, bibleVersion, chatHistory, settings, customColors, recentReads, showToast])

  const importData = useCallback(() => {
    const input = document.createElement('input')
    input.type = 'file'; input.accept = '.json'
    input.onchange = e => {
      const file = e.target.files[0]
      if (!file) return
      const reader = new FileReader()
      reader.onload = ev => {
        try {
          const data = JSON.parse(ev.target.result)
          if (data.tasks) setTasks(data.tasks)
          if (data.prayerLogs) setPrayerLogs(data.prayerLogs)
          if (data.studyPlan) setStudyPlan(data.studyPlan)
          if (data.diaryEntries) setDiaryEntries(data.diaryEntries)
          if (data.bibleVersion) setBibleVersion(data.bibleVersion)
          if (data.chatHistory) setChatHistory(data.chatHistory)
          if (data.settings) setSettings(data.settings)
          if (data.customColors) setCustomColors(data.customColors)
          showToast('Backup restored!')
        } catch { showToast('Invalid backup file', 'warning') }
      }
      reader.readAsText(file)
    }
    input.click()
  }, [showToast])

  const resetAllData = useCallback(() => {
    if (confirm('Delete all data? This cannot be undone.')) {
      localStorage.clear()
      setTasks([]); setPrayerLogs([]); setStudyPlan({ book: '', chapter: '' })
      setDiaryEntries([]); setChatHistory([]); setRecentReads([])
      setSettings(DEFAULT_SETTINGS); setCustomColors(DEFAULT_CUSTOM_COLORS)
      showToast('All data reset')
    }
  }, [showToast])

  const totalTasks = tasks.length
  const completedTasks = tasks.filter(t => t.completed).length
  const completionPercent = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0
  const spiritualCount = tasks.filter(t => t.category === 'spiritual').length
  const spiritualPercent = totalTasks > 0 ? Math.round((spiritualCount / totalTasks) * 100) : 0
  const secularPercent = 100 - spiritualPercent
  const todayStr = getNow().toLocaleDateString()
  const prayedToday = prayerLogs.some(l => l.date === todayStr)
  const filteredTasks = tasks.filter(t => {
    if (currentFilter === 'active') return !t.completed
    if (currentFilter === 'completed') return t.completed
    return true
  })

  const navLabels = {
    tasks: 'Tasks', spiritual: 'Faith', diary: 'Diary', bible: 'Bible',
    music: 'Music', devotional: 'Daily', settings: 'Settings',
    assistant: 'AI Assistant', guide: 'AI Guide',
  }

  const navIcons = {
    tasks: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/></svg>,
    spiritual: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/></svg>,
    diary: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M2 3h6a4 4 0 014 4v14a3 3 0 00-3-3H2z"/><path d="M22 3h-6a4 4 0 00-4 4v14a3 3 0 013-3h7z"/></svg>,
    bible: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5A2.5 2.5 0 016.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z"/><line x1="12" y1="6" x2="12" y2="14"/><line x1="8" y1="10" x2="16" y2="10"/></svg>,
    hymns: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>,
    music: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>,
    devotional: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M17 18a5 5 0 00-10 0"/><line x1="12" y1="9" x2="12" y2="2"/><line x1="4.22" y1="10.22" x2="5.64" y2="11.64"/><line x1="1" y1="18" x2="3" y2="18"/><line x1="21" y1="18" x2="23" y2="18"/><line x1="18.36" y1="11.64" x2="19.78" y2="10.22"/><line x1="23" y1="22" x2="1" y2="22"/></svg>,
    settings: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z"/></svg>,
    assistant: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="10" rx="2"/><circle cx="9" cy="16" r="1"/><circle cx="15" cy="16" r="1"/><path d="M12 11V7a4 4 0 00-4-4H8"/><path d="M12 11V7a4 4 0 014-4h0"/></svg>,
    guide: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>,
  }

  const primaryNav = ['tasks', 'spiritual', 'diary', 'bible', 'devotional', 'music', 'assistant', 'guide']
  const MAIN_NAV_KEYS = ['tasks', 'spiritual', 'diary', 'bible', 'devotional', 'music', 'assistant', 'guide', 'settings']
  const BOTTOM_NAV_KEYS = ['tasks', 'spiritual', 'diary', 'bible', 'music']

  const shortNavLabels = {
    ...navLabels,
    assistant: 'Assistant',
    guide: 'Guide',
  }

  const openView = useCallback((view) => {
    if (view === 'assistant') { setChatOpen(true); return }
    if (view === 'guide') { setShowGuide(true); return }
    setCurrentView(view)
  }, [])

  const renderNavButton = (view) => (
    <button
      key={view}
      className={`sidebar-nav-item${currentView === view ? ' active' : ''}`}
      onClick={() => openView(view)}
      aria-label={navLabels[view] || view}
      aria-current={currentView === view ? 'page' : undefined}
    >
      <span className="sidebar-nav-icon">{navIcons[view]}</span>
      <span className="sidebar-nav-label">{navLabels[view] || view}</span>
    </button>
  )

  const renderBottomNavButton = (view) => (
    <button
      key={view}
      className={`bottom-nav-item${currentView === view ? ' active' : ''}`}
      onClick={() => openView(view)}
      aria-label={navLabels[view] || view}
      aria-current={currentView === view ? 'page' : undefined}
    >
      <span className="bottom-nav-icon">{navIcons[view]}</span>
      <span className="bottom-nav-label">{shortNavLabels[view] || navLabels[view] || view}</span>
    </button>
  )

  return (
    <div id="app" className={previewMode !== 'desktop' ? `view-switcher-active view-switcher-mode-${previewMode}` : undefined}>
      <ViewSwitcher mode={previewMode} onChange={setPreviewMode} />
      {showWelcome && (
        <WelcomeScreen onAction={handleWelcomeAction} />
      )}

      {toast && (
        <div className={`toast toast-${toast.type}`}>
          <span>{toast.message}</span>
          {toast.action && <button className="toast-action" onClick={toast.action.cb}>{toast.action.label}</button>}
        </div>
      )}

      {alarmBanner && (
        <div className="alarm-banner" role="alert" aria-live="assertive">
          <div className="alarm-banner-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{width:24,height:24}}><circle cx="12" cy="13" r="8"/><path d="M12 9v4l2.5 2.5"/><path d="M9 2h6"/></svg></div>
          <div className="alarm-banner-body">
            <span className="alarm-banner-title">Task Reminder</span>
            <span className="alarm-banner-text">&ldquo;{alarmBanner.title}&rdquo; is due now.</span>
          </div>
          <button className="alarm-banner-btn" onClick={() => { toggleTask(alarmBanner.taskId); setAlarmBanner(null) }}>Mark done</button>
          <button className="alarm-banner-btn dismiss" onClick={() => setAlarmBanner(null)}>Dismiss</button>
        </div>
      )}

      <div className={`app-layout view-switcher-app-layout${sidebarCollapsed ? ' sidebar-collapsed' : ''}`}>
        <aside className="app-sidebar" aria-label="Sidebar navigation">
          <div className="sidebar-logo">
            <span className="logo-cross"><img src="/logo.png" alt="BelieversFlow" width="32" height="32" className="logo-svg" /></span>
            {!sidebarCollapsed && <span className="sidebar-logo-text">Believers Flow</span>}
          </div>
          <nav className="sidebar-nav">
            <div className="sidebar-section-label">{sidebarCollapsed ? '' : 'Primary'}</div>
            {primaryNav.map(renderNavButton)}
            <div className="sidebar-section-label">{sidebarCollapsed ? '' : 'Account'}</div>
            {renderNavButton('settings')}
          </nav>
          <div className="sidebar-footer">
            <button className="sidebar-collapse-toggle" onClick={() => setSidebarCollapsed(c => !c)}
              aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'} title={sidebarCollapsed ? 'Expand' : 'Collapse'}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{width:18,height:18}}>
                {sidebarCollapsed
                  ? <><line x1="13" y1="17" x2="21" y2="17"/><polyline points="15 13 21 17 15 21"/><line x1="3" y1="17" x2="21" y2="17"/><line x1="3" y1="7" x2="21" y2="7"/></>
                  : <><line x1="11" y1="17" x2="3" y2="17"/><polyline points="7 13 3 17 7 21"/><line x1="21" y1="17" x2="3" y2="17"/><line x1="21" y1="7" x2="3" y2="7"/></>
                }
              </svg>
            </button>
            <div className="sidebar-mode-toggle">
              <button className={`header-mode-btn${settings.mode === 'dark' ? ' active' : ''}`}
                onClick={() => updateSetting('mode', 'dark')} aria-label="Dark mode" title="Dark">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
              </button>
              <button className={`header-mode-btn${settings.mode === 'grey' ? ' active' : ''}`}
                onClick={() => updateSetting('mode', 'grey')} aria-label="Grey mode" title="Grey">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="4.5" fill="currentColor" opacity="0.35"/></svg>
              </button>
              <button className={`header-mode-btn${settings.mode === 'light' ? ' active' : ''}`}
                onClick={() => updateSetting('mode', 'light')} aria-label="Light mode" title="Light">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="4.5"/><line x1="12" y1="2" x2="12" y2="4"/><line x1="12" y1="20" x2="12" y2="22"/><line x1="4.93" y1="4.93" x2="6.34" y2="6.34"/><line x1="17.66" y1="17.66" x2="19.07" y2="19.07"/><line x1="2" y1="12" x2="4" y2="12"/><line x1="20" y1="12" x2="22" y2="12"/><line x1="4.93" y1="19.07" x2="6.34" y2="17.66"/><line x1="17.66" y1="6.34" x2="19.07" y2="4.93"/></svg>
              </button>
            </div>
          </div>
        </aside>

        <div className="app-main">
          <header>
            <div className="header-top-row">
              <div className="header-actions">
                <div className="header-mode-toggle">
                  <button className={`header-mode-btn${settings.mode === 'dark' ? ' active' : ''}`}
                    onClick={() => updateSetting('mode', 'dark')} aria-label="Dark mode" title="Dark">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
                  </button>
                  <button className={`header-mode-btn${settings.mode === 'grey' ? ' active' : ''}`}
                    onClick={() => updateSetting('mode', 'grey')} aria-label="Grey mode" title="Grey">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="4.5" fill="currentColor" opacity="0.35"/></svg>
                  </button>
                  <button className={`header-mode-btn${settings.mode === 'light' ? ' active' : ''}`}
                    onClick={() => updateSetting('mode', 'light')} aria-label="Light mode" title="Light">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="4.5"/><line x1="12" y1="2" x2="12" y2="4"/><line x1="12" y1="20" x2="12" y2="22"/><line x1="4.93" y1="4.93" x2="6.34" y2="6.34"/><line x1="17.66" y1="17.66" x2="19.07" y2="19.07"/><line x1="2" y1="12" x2="4" y2="12"/><line x1="20" y1="12" x2="22" y2="12"/><line x1="4.93" y1="19.07" x2="6.34" y2="17.66"/><line x1="17.66" y1="6.34" x2="19.07" y2="4.93"/></svg>
                  </button>
                </div>
              </div>
            </div>
            <div className="header-mobile-row">
              <button className="hamburger-btn" onClick={() => setMobileDrawerOpen(true)} aria-label="Open navigation menu">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
              </button>
              <div className="greeting">{greeting.msg} <span className="live-clock-badge"><span className="clock-date">{formatDateShort()}</span><span className="clock-sep">·</span><span className="clock-time">{formatTimeShort()}</span><span className="clock-sep">·</span><span className="clock-tz">{getUserTimezoneAbbr()}</span></span></div>
              <div className="header-mobile-actions">
                <div className="header-mode-toggle-mobile">
                  <button className={`header-mode-btn${settings.mode === 'dark' ? ' active' : ''}`}
                    onClick={() => updateSetting('mode', 'dark')} aria-label="Dark mode">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
                  </button>
                  <button className={`header-mode-btn${settings.mode === 'light' ? ' active' : ''}`}
                    onClick={() => updateSetting('mode', 'light')} aria-label="Light mode">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="4.5"/><line x1="12" y1="2" x2="12" y2="4"/><line x1="12" y1="20" x2="12" y2="22"/><line x1="4.93" y1="4.93" x2="6.34" y2="6.34"/><line x1="17.66" y1="17.66" x2="19.07" y2="19.07"/><line x1="2" y1="12" x2="4" y2="12"/><line x1="20" y1="12" x2="22" y2="12"/><line x1="4.93" y1="19.07" x2="6.34" y2="17.66"/><line x1="17.66" y1="6.34" x2="19.07" y2="4.93"/></svg>
                  </button>
                </div>
              </div>
            </div>
            <div className="verse-container" onClick={nextVerse} role="button" tabIndex={0}
              onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); nextVerse() } }}
              aria-label="Tap to see next verse">
              <p className="verse-text">&ldquo;{verse.text}&rdquo;</p>
              <div className="verse-meta">
                <small className="verse-ref">{verse.ref}</small>
                <span className="verse-tap">Tap for more</span>
              </div>
            </div>
          </header>

          <div className="stats-bar">
            <div className="stat"><span className="stat-value">{tasks.length}</span><span className="stat-label">Tasks</span></div>
            <div className="stat"><span className="stat-value">{streak}</span><span className="stat-label">Streak</span></div>
            <div className="stat"><span className="stat-value">{prayerLogs.reduce((a, b) => a + b.minutes, 0)}</span><span className="stat-label">Prayer Min</span></div>
            <div className="stat"><span className="stat-value">{completedTasks}/{totalTasks}</span><span className="stat-label">Done</span></div>
          </div>

          <nav id="main-nav" ref={navRef} aria-label="Main navigation"
            onTouchMove={handleTouchMove} onTouchEnd={handleTouchEnd}>
            {[...navOrder.filter(v => MAIN_NAV_KEYS.includes(v)), ...MAIN_NAV_KEYS.filter(v => !navOrder.includes(v))].map(view => (
              <div key={view} data-view={view}
                className={`nav-item-wrap${draggedItem === view ? ' dragging' : ''}${dragTarget === view ? ' drag-target' : ''}${!draggedItem ? ' drag-hint' : ''}`}
                draggable
                onDragStart={e => handleDragStart(e, view)}
                onDragOver={e => handleDragOver(e, view)}
                onDrop={e => handleDrop(e, view)}
                onDragEnd={handleDragEnd}
                onTouchStart={e => handleTouchStart(e, view)}>
                <button className={`nav-item${currentView === view ? ' active' : ''}`} onClick={() => openView(view)}
                   aria-label={navLabels[view] || view}
                  aria-current={currentView === view ? 'page' : undefined}>
                  {navLabels[view] || view}
                </button>
              </div>
            ))}
          </nav>

          <main id="view-container">
        {currentView === 'tasks' && (
          <ErrorBoundary>
            <TasksView
              tasks={tasks} filteredTasks={filteredTasks} currentFilter={currentFilter} setCurrentFilter={setCurrentFilter}
              taskText={taskText} setTaskText={setTaskText}
              taskTime={taskTime} setTaskTime={setTaskTime}
              taskDate={taskDate} setTaskDate={setTaskDate} taskDescription={taskDescription} setTaskDescription={setTaskDescription}
              taskCategory={taskCategory} setTaskCategory={setTaskCategory} taskReminder={taskReminder} setTaskReminder={setTaskReminder}
              editingTask={editingTask} editTask={editTask} editTaskInit={editTaskInit} cancelEditTask={cancelEditTask}
              addTask={addTask} toggleTask={toggleTask} deleteTask={deleteTask}
              completionPercent={completionPercent} totalTasks={totalTasks} completedTasks={completedTasks}
              prayedToday={prayedToday}
            />
          </ErrorBoundary>
        )}

        {currentView === 'spiritual' && (
          <ErrorBoundary>
            <SpiritualView
              prayerLogs={prayerLogs} streak={streak} prayedToday={prayedToday}
              prayerMinutes={prayerMinutes} setPrayerMinutes={setPrayerMinutes} logPrayer={logPrayer}
              bibleVersion={bibleVersion} setBibleVersion={setBibleVersion}
              studyBook={studyBook} setStudyBook={setStudyBook} studyChapter={studyChapter} setStudyChapter={setStudyChapter}
              saveStudyPlan={saveStudyPlan} goToBibleChapter={goToBibleChapter} studyPlan={studyPlan}
              spiritualPercent={spiritualPercent} secularPercent={secularPercent} totalTasks={totalTasks}
              diaryEntries={diaryEntries} tasks={tasks} recentReads={recentReads}
            />
          </ErrorBoundary>
        )}

        {currentView === 'diary' && (
          <ErrorBoundary>
            <DiaryView
              diaryEntries={diaryEntries} diaryTitle={diaryTitle} setDiaryTitle={setDiaryTitle}
              diaryContent={diaryContent} setDiaryContent={setDiaryContent}
              diaryMood={diaryMood} setDiaryMood={setDiaryMood}
              editingDiary={editingDiary} setEditingDiary={setEditingDiary}
              addDiaryEntry={addDiaryEntry} editDiaryEntry={editDiaryEntry} deleteDiaryEntry={deleteDiaryEntry}
              generateDiaryReflection={generateDiaryReflection} reflectionLoadingId={reflectionLoadingId}
            />
          </ErrorBoundary>
        )}

        {currentView === 'bible' && (
          <ErrorBoundary>
            <BibleView
              bibleBook={bibleBook} setBibleBook={setBibleBook}
              bibleChapter={bibleChapter} setBibleChapter={setBibleChapter}
              bibleVersion={bibleVersion} setBibleVersion={setBibleVersion}
              bibleText={bibleText} bibleLoading={bibleLoading} bibleError={bibleError}
              bibleTestament={bibleTestament} setBibleTestament={setBibleTestament}
              bibleStudyTab={bibleStudyTab} setBibleStudyTab={setBibleStudyTab}
              recentReads={recentReads} fetchChapter={fetchChapter} goToBibleChapter={goToBibleChapter}
              explanation={explanation} explanationLoading={explanationLoading}
              commentary={commentary} commentaryLoading={commentaryLoading}
              commentarySources={commentarySources} commentarySourceId={commentarySourceId} setCommentarySourceId={setCommentarySourceId}
              concordanceQuery={concordanceQuery} setConcordanceQuery={setConcordanceQuery}
              concordanceResults={concordanceResults} concordanceLoading={concordanceLoading} concordanceError={concordanceError}
              dictionaryTerm={dictionaryTerm} setDictionaryTerm={setDictionaryTerm}
              dictionaryMatches={dictionaryMatches} dictionaryLoading={dictionaryLoading}
              comparison={comparison} comparisonLoading={comparisonLoading}
              explainVerse={explainVerse} getCommentary={getCommentary}
              searchConcordance={searchConcordance} searchDictionary={searchDictionary} compareVersions={compareVersions}
              interlinear={interlinear} interlinearLoading={interlinearLoading} getInterlinear={getInterlinear}
              showToast={showToast} notesAssist={assistNote}
            />
          </ErrorBoundary>
        )}

        {currentView === 'music' && (
          <ErrorBoundary>
            <MusicView
              hymnSearch={hymnSearch} setHymnSearch={setHymnSearch}
              hymnSort={hymnSort} setHymnSort={setHymnSort}
              hymnCategory={hymnCategory} setHymnCategory={setHymnCategory}
              hymnFavorites={hymnFavorites} hymnRecentlyViewed={hymnRecentlyViewed}
              selectedHymn={selectedHymn}
              openHymn={openHymn} closeHymn={closeHymn}
              toggleHymnFavorite={toggleHymnFavorite}
              showToast={showToast}
            />
          </ErrorBoundary>
        )}

        {currentView === 'devotional' && (
          <ErrorBoundary>
            <DevotionalView
              devotionalDay={currentDevotionalIndex} setDevotionalDay={setDevotionalDay}
              devotionalFontSize={devotionalFontSize} setDevotionalFontSize={setDevotionalFontSize}
              selectedChurch={selectedChurch} setSelectedChurch={setSelectedChurch}
              churchDevotionalDay={churchDevotionalDay} setChurchDevotionalDay={setChurchDevotionalDay}
              nextDevotional={nextDevotional} prevDevotional={prevDevotional}
              goToTodaysDevotional={goToTodaysDevotional}
            />
          </ErrorBoundary>
        )}

        {currentView === 'settings' && (
          <ErrorBoundary>
            <SettingsView
              settings={settings} updateSetting={updateSetting} updateNotification={updateNotification}
              customColors={customColors} updateCustomColor={updateCustomColor}
              exportData={exportData} importData={importData} resetAllData={resetAllData}
              openLegalSettings={openLegalSettings}
            />
          </ErrorBoundary>
        )}
          </main>

          <footer>
            <p>Saved locally. Offline ready. Faith driven.</p>
          </footer>
        </div>
      </div>

      <nav className="bottom-nav" aria-label="Mobile navigation">
        {BOTTOM_NAV_KEYS.map(renderBottomNavButton)}
        <button className={`bottom-nav-item${!BOTTOM_NAV_KEYS.includes(currentView) ? ' active' : ''}`}
          onClick={() => setMobileDrawerOpen(true)}
          aria-label="More navigation options">
          <span className="bottom-nav-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/></svg></span>
          <span className="bottom-nav-label">More</span>
        </button>
      </nav>

      {mobileDrawerOpen && (
        <div className="mobile-drawer-overlay" onClick={() => setMobileDrawerOpen(false)}>
          <div className="mobile-drawer" onClick={e => e.stopPropagation()}>
            <div className="mobile-drawer-header">
              <div className="mobile-drawer-brand">
                <span className="logo-cross"><img src="/logo.png" alt="BelieversFlow" width="28" height="28" className="logo-svg" /></span>
                <span className="mobile-drawer-title">Believers Flow</span>
              </div>
              <button className="mobile-drawer-close" onClick={() => setMobileDrawerOpen(false)} aria-label="Close menu">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
            <nav className="mobile-drawer-nav">
              <div className="mobile-drawer-section-label">Primary</div>
              {primaryNav.map(view => (
                <button key={view} className={`mobile-drawer-item${currentView === view ? ' active' : ''}`}
                  onClick={() => { openView(view); setMobileDrawerOpen(false) }}>
                  <span className="mobile-drawer-item-icon">{navIcons[view]}</span>
                  <span className="mobile-drawer-item-label">{navLabels[view]}</span>
                  {currentView === view && <span className="mobile-drawer-active-dot" />}
                </button>
              ))}
              <div className="mobile-drawer-section-label">Account</div>
              <button className={`mobile-drawer-item${currentView === 'settings' ? ' active' : ''}`}
                onClick={() => { setCurrentView('settings'); setMobileDrawerOpen(false) }}>
                <span className="mobile-drawer-item-icon">{navIcons.settings}</span>
                <span className="mobile-drawer-item-label">Settings</span>
                {currentView === 'settings' && <span className="mobile-drawer-active-dot" />}
              </button>
            </nav>
            <div className="mobile-drawer-footer">
              <div className="mobile-drawer-mode-toggle">
                <button className={`header-mode-btn${settings.mode === 'dark' ? ' active' : ''}`}
                  onClick={() => updateSetting('mode', 'dark')} aria-label="Dark mode">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
                </button>
                <button className={`header-mode-btn${settings.mode === 'grey' ? ' active' : ''}`}
                  onClick={() => updateSetting('mode', 'grey')} aria-label="Grey mode">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="4.5" fill="currentColor" opacity="0.35"/></svg>
                </button>
                <button className={`header-mode-btn${settings.mode === 'light' ? ' active' : ''}`}
                  onClick={() => updateSetting('mode', 'light')} aria-label="Light mode">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="4.5"/><line x1="12" y1="2" x2="12" y2="4"/><line x1="12" y1="20" x2="12" y2="22"/><line x1="4.93" y1="4.93" x2="6.34" y2="6.34"/><line x1="17.66" y1="17.66" x2="19.07" y2="19.07"/><line x1="2" y1="12" x2="4" y2="12"/><line x1="20" y1="12" x2="22" y2="12"/><line x1="4.93" y1="19.07" x2="6.34" y2="17.66"/><line x1="17.66" y1="6.34" x2="19.07" y2="4.93"/></svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showGuide && (
        <div className="guide-overlay" onClick={() => setShowGuide(false)}>
          <div className="guide-panel" onClick={e => e.stopPropagation()}>
            <div className="guide-header">
              <span className="guide-title">Faith Assistant User Guide</span>
              <button className="guide-close" onClick={() => setShowGuide(false)} aria-label="Close guide">✕</button>
            </div>
            <div className="guide-body">
              <div className="guide-section">
                <h4>What is the AI Assistant?</h4>
                <p>The Faith Assistant is a conversational AI designed to provide scripture-based guidance, prayer support, and life advice from a Christian perspective. It can help you reflect on your faith, explore scripture, and receive encouragement in daily life.</p>
              </div>
              <div className="guide-section">
                <h4>What It Can Do</h4>
                <ul>
                  <li>Share inspirational Bible verses and words of encouragement.</li>
                  <li>Answer questions about faith, scripture, and spiritual practices.</li>
                  <li>Offer prayer guidance and support.</li>
                  <li>Provide life advice and practical guidance from a Christian perspective.</li>
                  <li>Assist with personal tasks and spiritual goals.</li>
                </ul>
              </div>
              <div className="guide-section">
                <h4>Privacy and Data Handling</h4>
                <p>Your conversations are stored locally within the app. No personal chats are shared externally, except for generating AI responses. The AI operates securely and privately, respecting your data at all times.</p>
              </div>
          </div>
        </div>
      </div>
      )}

      {AI_READY && chatOpen && (
        <div className="chat-overlay">
          <div className="chat-panel">
            <div className="chat-header">
              <div className="chat-header-left">
                <div className="chat-header-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{width:18,height:18}}>
                    <rect x="3" y="11" width="18" height="10" rx="2"/><circle cx="9" cy="16" r="1"/><circle cx="15" cy="16" r="1"/>
                    <path d="M12 11V7a4 4 0 0 0-4-4H8"/><path d="M12 11V7a4 4 0 0 1 4-4h0"/>
                  </svg>
                </div>
                <div className="chat-header-info">
                  <span className="chat-title">Faith Assistant</span>
                  <span className="chat-status">Online</span>
                </div>
              </div>
              <button className="chat-close" onClick={() => setChatOpen(false)} aria-label="Close chat">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{width:20,height:20}}>
                  <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>
            <div className="chat-body">
              {!chatHistory.length && (
                <div className="chat-welcome">
                  <div className="chat-welcome-icon-wrap">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{width:36,height:36}}>
                      <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/>
                    </svg>
                  </div>
                  <h3 className="chat-welcome-title">How can I help you today?</h3>
                  <p className="chat-welcome-desc">I'm here to help with scripture, prayer, life advice, and more.</p>
                  <div className="chat-suggestions">
                    {["Give me a Bible verse for today", "How can I improve my prayer life?", "What does the Bible say about patience?", "Encourage me based on my tasks"].map((s, i) => (
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
                    {m.role === 'user' ? <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{width:18,height:18}}><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg> : <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{width:18,height:18}}><rect x="3" y="11" width="18" height="10" rx="2"/><circle cx="9" cy="16" r="1"/><circle cx="15" cy="16" r="1"/><path d="M12 11V7a4 4 0 0 0-4-4H8"/><path d="M12 11V7a4 4 0 0 1 4-4h0"/></svg>}
                  </div>
                  <div className="chat-msg-content">
                    <div className="chat-bubble">{m.content}</div>
                  </div>
                </div>
              ))}
              {chatLoading && (
                <div className="chat-msg assistant fade-in">
                  <div className="chat-avatar assistant">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{width:18,height:18}}><rect x="3" y="11" width="18" height="10" rx="2"/><circle cx="9" cy="16" r="1"/><circle cx="15" cy="16" r="1"/><path d="M12 11V7a4 4 0 0 0-4-4H8"/><path d="M12 11V7a4 4 0 0 1 4-4h0"/></svg>
                  </div>
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
                <input ref={chatInput} type="text" placeholder="Type your message..." aria-label="Type your message" value={chatMsg}
                  onChange={e => setChatMsg(e.target.value)} onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendChat()} />
                <button className="chat-send-btn" onClick={sendChat} disabled={chatLoading || !chatMsg.trim()} aria-label="Send message">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{width:18,height:18}}>
                    <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showOnboarding && (
        <div className="onboarding-overlay">
          <div className="onboarding-panel">
            <div className="onboarding-slide">
              {onboardingStep === 0 && (
                <>
                  <div className="onboarding-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{width:48,height:48}}><path d="M4 19.5A2.5 2.5 0 016.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z"/><line x1="12" y1="6" x2="12" y2="14"/><line x1="8" y1="10" x2="16" y2="10"/></svg></div>
                  <h2 className="onboarding-title">Bible Reader</h2>
                  <p className="onboarding-desc">Read and study scripture across 12 translations. Get AI-powered explanations, commentary, and concordance at your fingertips.</p>
                </>
              )}
              {onboardingStep === 1 && (
                <>
                  <div className="onboarding-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{width:48,height:48}}><path d="M12 2a4 4 0 014 4v2a4 4 0 01-8 0V6a4 4 0 014-4z"/><path d="M18 14h.01"/><path d="M6 14h.01"/><path d="M12 14v4"/><path d="M8 18h8"/></svg></div>
                  <h2 className="onboarding-title">Faith Assistant</h2>
                  <p className="onboarding-desc">Ask questions and receive guidance from an AI rooted in Christian wisdom. Get scripture-based advice, prayer support, and encouragement.</p>
                </>
              )}
              {onboardingStep === 2 && (
                <>
                  <div className="onboarding-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{width:48,height:48}}><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/></svg></div>
                  <h2 className="onboarding-title">Prayer Tracker</h2>
                  <p className="onboarding-desc">Track prayer requests and answers. Build a daily prayer habit with streak tracking and reflection logs.</p>
                </>
              )}
              {onboardingStep === 3 && (
                <>
                  <div className="onboarding-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{width:48,height:48}}><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/></svg></div>
                  <h2 className="onboarding-title">Tasks & Goals</h2>
                  <p className="onboarding-desc">Organize your day with faith-centered productivity. Categorize tasks as spiritual, personal, or service, and track your progress.</p>
                </>
              )}
            </div>
            <div className="onboarding-dots">
              {[0, 1, 2, 3].map(i => (
                <span key={i} className={`onboarding-dot${onboardingStep === i ? ' active' : ''}`} />
              ))}
            </div>
            <div className="onboarding-actions">
              {onboardingStep < 3 ? (
                <>
                  <button className="onboarding-skip" onClick={completeOnboarding}>Skip</button>
                  <button className="onboarding-next" onClick={() => setOnboardingStep(s => s + 1)}>Next</button>
                </>
              ) : (
                <div className="onboarding-final-actions">
                  <button className="onboarding-start" onClick={handleGetStarted}>Get Started</button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {showLegal && (
        <LegalScreen
          mode={legalMode}
          onAccept={handleLegalAccept}
          onDecline={handleLegalDecline}
          apiUrl={API_URL}
        />
      )}

      {legalSettingsOpen && (
        <LegalScreen
          mode="settings"
          onAccept={() => setLegalSettingsOpen(false)}
          onDecline={() => setLegalSettingsOpen(false)}
          apiUrl={API_URL}
        />
      )}

    </div>
  )
}
