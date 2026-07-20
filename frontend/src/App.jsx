import { useState, useEffect, useCallback, useRef } from 'react'
import './App.css'
import ViewSwitcher from './components/ViewSwitcher.jsx'
import { getNow, getDayOfYear, formatDateShort, formatTimeShort, getGreeting as getTzGreeting, getUserTimezoneAbbr } from './dateUtils.js'
import { playHymn, stopHymn } from './hymnMusic.js'
import Auth from './Auth.jsx'
import WelcomeScreen from './components/WelcomeScreen.jsx'
import LegalScreen, { hasAcceptedLegal, LEGAL_VERSION } from './LegalScreen.jsx'
import { getUser, logout, pullFromServer, mergeServerData, scheduleSync } from './syncService.js'
import { requestNotificationPermission, subscribeToPush, unsubscribeFromPush } from './pushNotifications.js'
import BibleView from './components/BibleView.jsx'
import { BIBLE_API_DIRECT, BIBLE_BOOK_IDS } from './constants.js'
import DiaryView from './components/DiaryView.jsx'
import MusicView from './components/MusicView.jsx'
import DevotionalView from './components/DevotionalView.jsx'
import TasksView from './components/TasksView.jsx'
import SpiritualView from './components/SpiritualView.jsx'
import SettingsView from './components/SettingsView.jsx'
import GroupsView from './components/GroupsView.jsx'
import ChurchView from './components/ChurchView.jsx'
import EventsView from './components/EventsView.jsx'
import SermonView from './components/SermonView.jsx'
import ForumView from './components/ForumView.jsx'
import PrayerAnalyticsView from './components/PrayerAnalyticsView.jsx'
import CommunityFeedView from './components/CommunityFeedView.jsx'
import PrayerFeedView from './components/PrayerFeedView.jsx'
import TestimonyView from './components/TestimonyView.jsx'
import CommunityAssistant from './components/CommunityAssistant.jsx'
import { NotificationBell } from './components/NotificationCenter.jsx'
import GamificationBadge from './components/GamificationBadge.jsx'
import { ErrorBoundary } from './components/ErrorBoundary.jsx'

const API_URL = import.meta.env.VITE_API_URL || ''
const AI_READY = Boolean(API_URL)

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
  theme: 'believersflow', mode: 'dark', fontSize: 'medium', readingLayout: 'standard',
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
  const [authUser, setAuthUser] = useState(() => getUser())
  const [showAuth, setShowAuth] = useState(false)
  const [settingsAuthMode, setSettingsAuthMode] = useState(null)
  const [showWelcome, setShowWelcome] = useState(() => {
    if (!loadState('btf_onboardingDone', false)) return false
    if (!hasAcceptedLegal()) return false
    if (authUser) return false
    return !loadState('btf_welcomeDone', false)
  })
  const isPremium = Boolean(authUser)
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
  const [diaryMood, setDiaryMood] = useState('😊')
  const [editingDiary, setEditingDiary] = useState(null)
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
  const [hymnPlaying, setHymnPlaying] = useState(false)
  const [hymnRecentlyViewed, setHymnRecentlyViewed] = useState(() => loadState('btf_recentHymns', []))
  const [navOrder, setNavOrder] = useState(() => loadState('btf_navOrder', ['tasks', 'spiritual', 'diary', 'bible', 'music', 'devotional', 'settings', 'groups', 'church', 'events', 'sermons', 'forum', 'analytics']))
  const [draggedItem, setDraggedItem] = useState(null)
  const [dragTarget, setDragTarget] = useState(null)
  const navRef = useRef(null)
  const touchDragItem = useRef(null)
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => loadState('btf_sidebarCollapsed', false))
  const [previewMode, setPreviewMode] = useState('desktop')

  // Devotional state
  const [devotionalDay, setDevotionalDay] = useState(() => {
    const migrated = loadState('btf_devotional_v2', false)
    if (!migrated) {
      saveState('btf_devotional_v2', true)
      const correct = (getDayOfYear() - 1 + 365) % 365
      saveState('btf_devotionalDay', correct)
      return correct
    }
    return loadState('btf_devotionalDay', (getDayOfYear() - 1 + 365) % 365)
  })
  const [devotionalFontSize, setDevotionalFontSize] = useState(() => loadState('btf_devFontSize', 'medium'))
  const [selectedChurch, setSelectedChurch] = useState(() => loadState('btf_selectedChurch', ''))
  const [churchDevotionalDay, setChurchDevotionalDay] = useState(() => loadState('btf_churchDevotionalDay', 0))

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
    if (!authUser) {
      const welcomeDone = loadState('btf_welcomeDone', false)
      if (!welcomeDone) setShowWelcome(true)
    }
  }, [authUser])

  const streak = getStreak(prayerLogs)
  const verse = VERSES[verseIndex]

  useEffect(() => { saveState('btf_tasks', tasks) }, [tasks])
  useEffect(() => { saveState('btf_prayerLogs', prayerLogs) }, [prayerLogs])
  useEffect(() => { saveState('btf_studyPlan', studyPlan) }, [studyPlan])
  useEffect(() => { saveState('btf_chat', chatHistory) }, [chatHistory])
  useEffect(() => { saveState('btf_diary', diaryEntries) }, [diaryEntries])
  useEffect(() => { saveState('btf_bibleVersion', bibleVersion) }, [bibleVersion])
  useEffect(() => { saveState('btf_recentReads', recentReads) }, [recentReads])
  useEffect(() => { saveState('btf_hymnFavorites', hymnFavorites) }, [hymnFavorites])
  useEffect(() => { saveState('btf_recentHymns', hymnRecentlyViewed) }, [hymnRecentlyViewed])
  useEffect(() => { saveState('btf_devotionalDay', devotionalDay) }, [devotionalDay])
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
    if (authUser) {
      scheduleSync()
      pullFromServer().then(serverData => {
        if (serverData) {
          mergeServerData(serverData)
          if (serverData.btf_tasks) setTasks(loadState('btf_tasks', []))
          if (serverData.btf_prayerLogs) setPrayerLogs(loadState('btf_prayerLogs', []))
          if (serverData.btf_diary) setDiaryEntries(loadState('btf_diary', []))
          if (serverData.btf_settings) setSettings(loadState('btf_settings', DEFAULT_SETTINGS))
          if (serverData.btf_customColors) setCustomColors(loadState('btf_customColors', DEFAULT_CUSTOM_COLORS))
          if (serverData.btf_hymnFavorites) setHymnFavorites(loadState('btf_hymnFavorites', []))
          if (serverData.btf_recentHymns) setHymnRecentlyViewed(loadState('btf_recentHymns', []))
          if (serverData.btf_recentReads) setRecentReads(loadState('btf_recentReads', []))
          if (serverData.btf_chat) setChatHistory(loadState('btf_chat', []))
          if (serverData.btf_navOrder) setNavOrder(loadState('btf_navOrder', []))
        }
      })
    }
  }, [authUser])

  useEffect(() => {
    const id = setInterval(() => { setGreeting(getTzGreeting()) }, 30000)
    return () => clearInterval(id)
  }, [])

  useEffect(() => {
    const el = document.querySelector('.fab-group')
    if (!el) return
    let x = 0, y = 0, startX = 0, startY = 0, dragging = false

    function onStart(e) {
      const t = e.touches ? e.touches[0] : e
      startX = t.clientX - el.offsetLeft
      startY = t.clientY - el.offsetTop
      dragging = true
      el.style.transition = 'none'
    }
    function onMove(e) {
      if (!dragging) return
      e.preventDefault()
      const t = e.touches ? e.touches[0] : e
      x = t.clientX - startX
      y = t.clientY - startY
      x = Math.max(0, Math.min(window.innerWidth - el.offsetWidth, x))
      y = Math.max(0, Math.min(window.innerHeight - el.offsetHeight, y))
      el.style.left = x + 'px'
      el.style.right = 'auto'
      el.style.top = y + 'px'
      el.style.bottom = 'auto'
    }
    function onEnd() {
      dragging = false
      el.style.transition = 'all 0.2s'
    }

    el.addEventListener('touchstart', onStart, { passive: true })
    el.addEventListener('touchmove', onMove, { passive: false })
    el.addEventListener('touchend', onEnd)
    el.addEventListener('mousedown', onStart)
    document.addEventListener('mousemove', onMove)
    document.addEventListener('mouseup', onEnd)

    return () => {
      el.removeEventListener('touchstart', onStart)
      el.removeEventListener('touchmove', onMove)
      el.removeEventListener('touchend', onEnd)
      el.removeEventListener('mousedown', onStart)
      document.removeEventListener('mousemove', onMove)
      document.removeEventListener('mouseup', onEnd)
    }
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
      if (API_URL) {
        const res = await fetch(`${API_URL}/api/bible?book=${encodeURIComponent(book)}&chapter=${chapter}&version=${ver}`)
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        data = await res.json()
      } else if (BIBLE_API_DIRECT[ver]) {
        const translation = BIBLE_API_DIRECT[ver]
        const bookId = BIBLE_BOOK_IDS[book]
        if (translation === 'cuv' && bookId) {
          const url = `https://bible-api.com/data/${translation}/${bookId}/${chapter}`
          const res = await fetch(url)
          if (!res.ok) throw new Error(`HTTP ${res.status}`)
          const raw = await res.json()
          data = { reference: `${book} ${chapter}`, verses: raw.verses || [], version: ver }
        } else {
          const url = `https://bible-api.com/${encodeURIComponent(book)}+${chapter}?translation=${translation}`
          const res = await fetch(url)
          if (!res.ok) throw new Error(`HTTP ${res.status}`)
          data = await res.json()
        }
      } else {
        throw new Error(`"${ver}" requires a backend server with an API key. Start the backend or select a free translation (KJV, WEB, ASV, BBE, Darby, YLT).`)
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



  const handleLogin = useCallback((token, user) => {
    setAuthUser(user)
    setShowAuth(false)
    requestNotificationPermission().then(granted => {
      if (granted) {
        subscribeToPush(API_URL, token)
      }
    })
  }, [])
  const handleWelcomeAction = useCallback((action) => {
    saveState('btf_welcomeDone', true)
    setShowWelcome(false)
    if (action === 'register' || action === 'login') {
      setSettingsAuthMode(action)
      setCurrentView('settings')
    }
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

  const handleLogout = useCallback(() => {
    const token = localStorage.getItem('bf_token')
    unsubscribeFromPush(API_URL, token)
    logout()
    setAuthUser(null)
    showToast('Signed out')
  }, [showToast])

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
    setTasks(prev => [{ id: Date.now(), text, time: taskTime, category: taskCategory, completed: false, createdAt: new Date().toISOString() }, ...prev])
    setTaskText(''); setTaskTime(''); showToast('Task added!')
    if (navigator.vibrate) navigator.vibrate(10)
  }, [taskText, taskTime, taskCategory, showToast])

  const toggleTask = useCallback((id) => {
    setTasks(prev => {
      const t = prev.find(x => x.id === id)
      if (t && !t.completed) { showToast('Well done!'); if (navigator.vibrate) navigator.vibrate(20) }
      return prev.map(x => x.id === id ? { ...x, completed: !x.completed } : x)
    })
  }, [showToast])

  const deleteTask = useCallback((id) => {
    setTasks(prev => {
      const item = prev.find(t => t.id === id)
      if (item) {
        showToast('Task deleted')
      }
      return prev.filter(t => t.id !== id)
    })
  }, [showToast])

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

  const addDiaryEntry = useCallback(() => {
    if (!diaryContent.trim()) return
    if (editingDiary) {
      setDiaryEntries(prev => prev.map(e => e.id === editingDiary.id ? { ...e, title: diaryTitle.trim(), content: diaryContent.trim(), mood: diaryMood } : e))
      showToast('Diary updated! 📓')
    } else {
      setDiaryEntries(prev => [{ id: Date.now(), title: diaryTitle.trim(), content: diaryContent.trim(), mood: diaryMood, date: new Date().toISOString() }, ...prev])
      showToast('Diary entry saved! 📓')
    }
    setDiaryTitle(''); setDiaryContent(''); setDiaryMood('😊'); setEditingDiary(null)
  }, [diaryTitle, diaryContent, diaryMood, editingDiary, showToast])

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

  const sendChat = useCallback(async () => {
    const msg = chatMsg.trim()
    if (!msg || chatLoading) return
    if (!isPremium) { setShowAuth(true); return }
    if (!API_URL) { showToast('Backend not configured. Please deploy backend.', 'warning'); return }

    const userEntry = { role: 'user', content: msg }
    setChatHistory(prev => [...prev, userEntry])
    setChatMsg(''); setChatLoading(true)

    const taskContext = tasks.length ? `The user's current tasks are: ${tasks.map(t => t.text).join(', ')}` : ''

    try {
      const token = localStorage.getItem('bf_token')
      const res = await fetch(`${API_URL}/api/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          messages: [...chatHistory.slice(-6), userEntry],
          taskContext,
        })
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json()
      setChatHistory(prev => [...prev, { role: 'assistant', content: data.message }])
    } catch {
      setChatHistory(prev => [...prev, { role: 'assistant', content: "I'm having trouble connecting. Please check your connection and try again." }])
    } finally { setChatLoading(false) }
  }, [chatMsg, chatLoading, chatHistory, tasks, isPremium, showToast])

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
    if (!API_URL) { showToast('Backend API not configured', 'warning'); return null }
    try {
      const res = await fetch(`${API_URL}${path}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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
    if (!isPremium) { setShowAuth(true); return }
    setExplanationLoading(true); setExplanation(null); setBibleStudyTab('explain')
    const data = await apiPost('/api/bible/explain', { reference, text, version: bibleVersion })
    if (data) setExplanation(data)
    setExplanationLoading(false)
  }, [apiPost, bibleVersion, isPremium])

  const getCommentary = useCallback(async () => {
    if (!isPremium) { setShowAuth(true); return }
    if (!bibleText) return
    setCommentaryLoading(true); setCommentary(null); setBibleStudyTab('commentary')
    const verses = (bibleText.verses || []).map(v => ({ verse: v.verse, text: v.text }))
    const data = await apiPost('/api/bible/commentary', { book: bibleBook, chapter: bibleChapter, verses })
    if (data) setCommentary(data)
    setCommentaryLoading(false)
  }, [apiPost, bibleText, bibleBook, bibleChapter, isPremium])

  const searchConcordance = useCallback(async () => {
    const q = concordanceQuery.trim()
    if (!q) return
    if (!isPremium) { setShowAuth(true); return }
    setConcordanceLoading(true); setConcordanceResults(null); setBibleStudyTab('concordance')
    const data = await apiPost('/api/bible/concordance', { query: q, version: bibleVersion })
    if (data) setConcordanceResults(data)
    setConcordanceLoading(false)
  }, [apiPost, concordanceQuery, bibleVersion, isPremium])

  const compareVersions = useCallback(async () => {
    if (!isPremium) { setShowAuth(true); return }
    setComparisonLoading(true); setComparison(null); setBibleStudyTab('compare')
    const data = await apiPost('/api/bible/compare', { book: bibleBook, chapter: bibleChapter })
    if (data) setComparison(data)
    setComparisonLoading(false)
  }, [apiPost, bibleBook, bibleChapter, isPremium])

  const getInterlinear = useCallback(async () => {
    if (!isPremium) { setShowAuth(true); return }
    if (!API_URL) { showToast('Backend API not configured', 'warning'); return }
    setInterlinearLoading(true); setInterlinear(null); setBibleStudyTab('interlinear')
    try {
      const token = localStorage.getItem('bf_token')
      const res = await fetch(
        `${API_URL}/api/interlinear/${encodeURIComponent(bibleBook)}/${bibleChapter}?version=${bibleVersion}`,
        { headers: token ? { 'Authorization': `Bearer ${token}` } : {} }
      )
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json()
      setInterlinear(data)
    } catch (e) {
      showToast(`Interlinear failed: ${e.message}`, 'warning')
    } finally {
      setInterlinearLoading(false)
    }
  }, [isPremium, setShowAuth, bibleBook, bibleChapter, bibleVersion, showToast])

  // Hymns
  const openHymn = useCallback((hymn) => {
    setSelectedHymn(hymn)
    setHymnRecentlyViewed(prev => {
      const filtered = prev.filter(h => h.id !== hymn.id)
      return [{ id: hymn.id, title: hymn.title, author: hymn.author }, ...filtered].slice(0, 15)
    })
  }, [])

  const closeHymn = useCallback(() => {
    if (hymnPlaying) { stopHymn(); setHymnPlaying(false) }
    setSelectedHymn(null)
  }, [hymnPlaying])

  const toggleHymnFavorite = useCallback((id) => {
    setHymnFavorites(prev => {
      const isFav = prev.includes(id)
      showToast(isFav ? 'Removed from favorites' : 'Added to favorites!')
      return isFav ? prev.filter(f => f !== id) : [...prev, id]
    })
  }, [showToast])

  const toggleHymnPlay = useCallback(async (hymnId) => {
    if (hymnPlaying) {
      stopHymn()
      setHymnPlaying(false)
    } else {
      setHymnPlaying(true)
      await playHymn(hymnId, () => setHymnPlaying(false))
    }
  }, [hymnPlaying])

  const nextDevotional = useCallback(() => {
    setDevotionalDay(prev => (prev + 1) % 365)
  }, [])

  const prevDevotional = useCallback(() => {
    setDevotionalDay(prev => (prev - 1 + 365) % 365)
  }, [])

  const goToTodaysDevotional = useCallback(() => {
    const today = getDayOfYear() - 1
    setDevotionalDay(Math.max(0, today % 365))
    showToast("Today's devotional")
  }, [showToast])

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
    groups: 'Groups', church: 'Church', events: 'Events',
    sermons: 'Sermons', forum: 'Forum', analytics: 'Analytics',
    feed: 'Feed', prayer: 'Prayer', testimonies: 'Testimonies'
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
    groups: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg>,
    church: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M18 2H6a2 2 0 00-2 2v16l8-4 8 4V4a2 2 0 00-2-2z"/><line x1="12" y1="6" x2="12" y2="10"/></svg>,
    events: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>,
    sermons: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>,
    forum: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>,
    analytics: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>,
    feed: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M4 11a9 9 0 019 9"/><path d="M4 4a16 16 0 0116 16"/><circle cx="5" cy="19" r="1"/></svg>,
    prayer: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/></svg>,
    testimonies: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>,
  }

  const primaryNav = ['bible', 'devotional', 'tasks', 'spiritual', 'diary', 'music']
  const secondaryNav = ['feed', 'prayer', 'testimonies', 'groups', 'church', 'events', 'sermons', 'forum', 'analytics']

  const renderNavButton = (view) => (
    <button
      key={view}
      className={`sidebar-nav-item${currentView === view ? ' active' : ''}`}
      onClick={() => setCurrentView(view)}
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
      onClick={() => setCurrentView(view)}
      aria-label={navLabels[view] || view}
      aria-current={currentView === view ? 'page' : undefined}
    >
      <span className="bottom-nav-icon">{navIcons[view]}</span>
      <span className="bottom-nav-label">{navLabels[view] || view}</span>
    </button>
  )

  return (
    <div id="app" className={previewMode !== 'desktop' ? `view-switcher-active view-switcher-mode-${previewMode}` : undefined}>
      <ViewSwitcher mode={previewMode} onChange={setPreviewMode} />
      {showWelcome && (
        <WelcomeScreen onAction={handleWelcomeAction} />
      )}

      {showAuth && (
        <Auth apiUrl={API_URL} onLogin={handleLogin} onSkip={() => setShowAuth(false)} />
      )}

      {toast && (
        <div className={`toast toast-${toast.type}`}>
          <span>{toast.message}</span>
          {toast.action && <button className="toast-action" onClick={toast.action.cb}>{toast.action.label}</button>}
        </div>
      )}

      <div className={`app-layout view-switcher-app-layout${sidebarCollapsed ? ' sidebar-collapsed' : ''}`}>
        <aside className="app-sidebar" aria-label="Sidebar navigation">
          <div className="sidebar-logo">
            <span className="logo-cross"><img src="/logo-cross.svg" alt="" width="32" height="32" className="logo-svg" /></span>
            {!sidebarCollapsed && <span className="sidebar-logo-text">Believers Flow</span>}
          </div>
          <nav className="sidebar-nav">
            <div className="sidebar-section-label">{sidebarCollapsed ? '' : 'Primary'}</div>
            {primaryNav.filter(v => ['tasks', 'spiritual', 'diary', 'bible', 'music', 'devotional', 'settings'].includes(v) || isPremium).map(renderNavButton)}
            {isPremium && <div className="sidebar-section-label">{sidebarCollapsed ? '' : 'Community'}</div>}
            {secondaryNav.filter(v => ['groups', 'church', 'events', 'sermons', 'forum', 'analytics'].includes(v) && isPremium).map(renderNavButton)}
            <div className="sidebar-section-label">{sidebarCollapsed ? '' : 'Account'}</div>
            {renderNavButton('settings')}
          </nav>
          <div className="sidebar-footer">
            <ErrorBoundary>
              <GamificationBadge isPremium={isPremium} compact />
            </ErrorBoundary>
            <ErrorBoundary>
              <NotificationBell isPremium={isPremium} onNavigate={(target) => { if (target?.type && target?.id) setCurrentView(target.type) }} />
            </ErrorBoundary>
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
            <div className="header-mobile-row">
              <button className="hamburger-btn" onClick={() => setMobileDrawerOpen(true)} aria-label="Open navigation menu">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
              </button>
              <div className="header-brand">
                <span className="logo-cross"><img src="/logo-cross.svg" alt="" width="28" height="28" className="logo-svg" /></span>
                <span className="header-brand-text">Believers Flow</span>
              </div>
              <div className="header-mobile-actions">
                <NotificationBell isPremium={isPremium} onNavigate={(target) => { if (target?.type && target?.id) setCurrentView(target.type) }} />
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
            <div className="header-top-row">
              <div className="logo">
                <span className="logo-cross"><img src="/logo-cross.svg" alt="" width="36" height="36" className="logo-svg" /></span>
                <span>Believers Flow</span>
              </div>
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
                {authUser && (
                  <button className="header-profile-btn" onClick={() => setCurrentView('settings')} aria-label="Profile settings">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                  </button>
                )}
              </div>
            </div>
            <div className="greeting">{greeting.icon} {greeting.msg} <span className="live-clock-badge"><span className="clock-date">{formatDateShort()}</span><span className="clock-sep">·</span><span className="clock-time">{formatTimeShort()}</span><span className="clock-sep">·</span><span className="clock-tz">{getUserTimezoneAbbr()}</span></span></div>
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
            {navOrder.filter(v => {
              if (['tasks', 'spiritual', 'diary', 'bible', 'music', 'devotional', 'settings'].includes(v)) return true
              return isPremium
            }).map(view => (
              <div key={view} data-view={view}
                className={`nav-item-wrap${draggedItem === view ? ' dragging' : ''}${dragTarget === view ? ' drag-target' : ''}${!draggedItem ? ' drag-hint' : ''}`}
                draggable
                onDragStart={e => handleDragStart(e, view)}
                onDragOver={e => handleDragOver(e, view)}
                onDrop={e => handleDrop(e, view)}
                onDragEnd={handleDragEnd}
                onTouchStart={e => handleTouchStart(e, view)}>
                <button className={`nav-item${currentView === view ? ' active' : ''}`} onClick={() => setCurrentView(view)}
                   aria-label={navLabels[view] || view}
                  aria-current={currentView === view ? 'page' : undefined}>
                  {navLabels[view] || view}
                </button>
              </div>
            ))}
          </nav>

          <main id="view-container">
        {currentView === 'tasks' && (
          <TasksView
            tasks={tasks} filteredTasks={filteredTasks} currentFilter={currentFilter} setCurrentFilter={setCurrentFilter}
            taskText={taskText} setTaskText={setTaskText} taskTime={taskTime} setTaskTime={setTaskTime}
            taskCategory={taskCategory} setTaskCategory={setTaskCategory}
            addTask={addTask} toggleTask={toggleTask} deleteTask={deleteTask}
            completionPercent={completionPercent} totalTasks={totalTasks} completedTasks={completedTasks}
            prayedToday={prayedToday}
          />
        )}

        {currentView === 'spiritual' && (
          <SpiritualView
            prayerLogs={prayerLogs} streak={streak} prayedToday={prayedToday}
            prayerMinutes={prayerMinutes} setPrayerMinutes={setPrayerMinutes} logPrayer={logPrayer}
            bibleVersion={bibleVersion} setBibleVersion={setBibleVersion}
            studyBook={studyBook} setStudyBook={setStudyBook} studyChapter={studyChapter} setStudyChapter={setStudyChapter}
            saveStudyPlan={saveStudyPlan} goToBibleChapter={goToBibleChapter} studyPlan={studyPlan}
            spiritualPercent={spiritualPercent} secularPercent={secularPercent} totalTasks={totalTasks}
          />
        )}

        {currentView === 'diary' && (
          <DiaryView
            diaryEntries={diaryEntries} diaryTitle={diaryTitle} setDiaryTitle={setDiaryTitle}
            diaryContent={diaryContent} setDiaryContent={setDiaryContent}
            diaryMood={diaryMood} setDiaryMood={setDiaryMood}
            editingDiary={editingDiary} setEditingDiary={setEditingDiary}
            addDiaryEntry={addDiaryEntry} editDiaryEntry={editDiaryEntry} deleteDiaryEntry={deleteDiaryEntry}
          />
        )}

        {currentView === 'bible' && (
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
            concordanceQuery={concordanceQuery} setConcordanceQuery={setConcordanceQuery}
            concordanceResults={concordanceResults} concordanceLoading={concordanceLoading}
            comparison={comparison} comparisonLoading={comparisonLoading}
            explainVerse={explainVerse} getCommentary={getCommentary}
            searchConcordance={searchConcordance} compareVersions={compareVersions}
            interlinear={interlinear} interlinearLoading={interlinearLoading} getInterlinear={getInterlinear}
            isPremium={isPremium} setShowAuth={setShowAuth}
            showToast={showToast}
          />
        )}

        {currentView === 'music' && (
          <MusicView
            hymnSearch={hymnSearch} setHymnSearch={setHymnSearch}
            hymnSort={hymnSort} setHymnSort={setHymnSort}
            hymnCategory={hymnCategory} setHymnCategory={setHymnCategory}
            hymnFavorites={hymnFavorites} hymnRecentlyViewed={hymnRecentlyViewed}
            selectedHymn={selectedHymn} hymnPlaying={hymnPlaying}
            openHymn={openHymn} closeHymn={closeHymn}
            toggleHymnFavorite={toggleHymnFavorite} toggleHymnPlay={toggleHymnPlay}
            showToast={showToast}
            isPremium={isPremium}
            setShowAuth={setShowAuth}
          />
        )}

        {currentView === 'devotional' && (
          <DevotionalView
            devotionalDay={devotionalDay} setDevotionalDay={setDevotionalDay}
            devotionalFontSize={devotionalFontSize} setDevotionalFontSize={setDevotionalFontSize}
            selectedChurch={selectedChurch} setSelectedChurch={setSelectedChurch}
            churchDevotionalDay={churchDevotionalDay} setChurchDevotionalDay={setChurchDevotionalDay}
            nextDevotional={nextDevotional} prevDevotional={prevDevotional}
            goToTodaysDevotional={goToTodaysDevotional}
          />
        )}

        {currentView === 'settings' && (
          <SettingsView
            settings={settings} updateSetting={updateSetting} updateNotification={updateNotification}
            customColors={customColors} updateCustomColor={updateCustomColor}
            isPremium={isPremium} authUser={authUser} setShowAuth={setShowAuth} handleLogout={handleLogout}
            exportData={exportData} importData={importData} resetAllData={resetAllData}
            openLegalSettings={openLegalSettings} showToast={showToast}
            settingsAuthMode={settingsAuthMode} setSettingsAuthMode={setSettingsAuthMode}
          />
        )}

        {currentView === 'feed' && (
          <ErrorBoundary>
            <CommunityFeedView
              showToast={showToast}
              isPremium={isPremium}
              setShowAuth={setShowAuth}
            />
          </ErrorBoundary>
        )}

        {currentView === 'prayer' && (
          <ErrorBoundary>
            <PrayerFeedView
              showToast={showToast}
              isPremium={isPremium}
              setShowAuth={setShowAuth}
            />
          </ErrorBoundary>
        )}

        {currentView === 'testimonies' && (
          <ErrorBoundary>
            <TestimonyView
              showToast={showToast}
              isPremium={isPremium}
              setShowAuth={setShowAuth}
            />
          </ErrorBoundary>
        )}

        {currentView === 'groups' && (
          <GroupsView
            showToast={showToast}
            isPremium={isPremium}
            setShowAuth={setShowAuth}
          />
        )}

        {currentView === 'church' && (
          <ChurchView
            showToast={showToast}
            isPremium={isPremium}
            setShowAuth={setShowAuth}
          />
        )}

        {currentView === 'events' && (
          <EventsView
            showToast={showToast}
            isPremium={isPremium}
            setShowAuth={setShowAuth}
          />
        )}

        {currentView === 'sermons' && (
          <SermonView
            showToast={showToast}
            isPremium={isPremium}
            setShowAuth={setShowAuth}
          />
        )}

        {currentView === 'forum' && (
          <ForumView
            showToast={showToast}
            isPremium={isPremium}
            setShowAuth={setShowAuth}
          />
        )}

        {currentView === 'analytics' && (
          <PrayerAnalyticsView
            showToast={showToast}
            isPremium={isPremium}
            setShowAuth={setShowAuth}
          />
        )}
          </main>

          <footer>
            <p>Saved locally. Offline ready. Faith driven.</p>
          </footer>
        </div>
      </div>

      <nav className="bottom-nav" aria-label="Mobile navigation">
        {primaryNav.filter(v => ['tasks', 'spiritual', 'diary', 'bible', 'music', 'devotional', 'settings'].includes(v) || isPremium).map(renderBottomNavButton)}
        <button className={`bottom-nav-item${!primaryNav.includes(currentView) ? ' active' : ''}`}
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
                <span className="logo-cross"><img src="/logo-cross.svg" alt="" width="28" height="28" className="logo-svg" /></span>
                <span className="mobile-drawer-title">Believers Flow</span>
              </div>
              <button className="mobile-drawer-close" onClick={() => setMobileDrawerOpen(false)} aria-label="Close menu">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
            <nav className="mobile-drawer-nav">
              <div className="mobile-drawer-section-label">Primary</div>
              {primaryNav.filter(v => ['tasks', 'spiritual', 'diary', 'bible', 'music', 'devotional', 'settings'].includes(v) || isPremium).map(view => (
                <button key={view} className={`mobile-drawer-item${currentView === view ? ' active' : ''}`}
                  onClick={() => { setCurrentView(view); setMobileDrawerOpen(false) }}>
                  <span className="mobile-drawer-item-icon">{navIcons[view]}</span>
                  <span className="mobile-drawer-item-label">{navLabels[view]}</span>
                  {currentView === view && <span className="mobile-drawer-active-dot" />}
                </button>
              ))}
              {isPremium && <div className="mobile-drawer-section-label">Community</div>}
              {secondaryNav.filter(v => ['groups', 'church', 'events', 'sermons', 'forum', 'analytics'].includes(v) && isPremium).map(view => (
                <button key={view} className={`mobile-drawer-item${currentView === view ? ' active' : ''}`}
                  onClick={() => { setCurrentView(view); setMobileDrawerOpen(false) }}>
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

      {!mobileDrawerOpen && (
      <div className="fab-group">
        {AI_READY && (
          <button className="fab-guide" onClick={() => setShowGuide(true)} title="AI Guide" aria-label="AI Guide">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
          </button>
        )}
        {AI_READY && (
          <button className={`chat-fab ${chatOpen ? ' open' : ''}`} onClick={() => setChatOpen(o => !o)} aria-label={chatOpen ? 'Close chat assistant' : 'Open chat assistant'}>
            {chatOpen ? <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg> : <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>}
          </button>
        )}
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
              {!isPremium && (
                <div className="guide-section guide-signup">
                  <p>Sign up to unlock AI-powered features and cloud sync.</p>
                  <button className="guide-signup-btn" onClick={() => setShowAuth(true)}>Get Started Free</button>
                </div>
              )}
          </div>
        </div>
      </div>
      )}

      {AI_READY && chatOpen && (
        <div className="chat-overlay">
          <div className="chat-panel">
            <div className="chat-header">
              <span className="chat-title"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{width:18,height:18,verticalAlign:'middle',marginRight:6}}><path d="M12 2a4 4 0 014 4v2a4 4 0 01-8 0V6a4 4 0 014-4z"/><path d="M18 14h.01"/><path d="M6 14h.01"/><path d="M12 14v4"/><path d="M8 18h8"/></svg> Faith Assistant</span>
              <button className="chat-close" onClick={() => setChatOpen(false)} aria-label="Close chat">✕</button>
            </div>
            <div className="chat-body">
              {!chatHistory.length && (
                <div className="chat-welcome">
                  <span className="chat-welcome-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{width:40,height:40}}><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/></svg></span>
                  <p>Hi! I'm your faith assistant. Ask me anything about scripture, prayer, life advice, or your tasks.</p>
                  {!isPremium && <p className="chat-auth-hint"><button className="chat-auth-link" onClick={() => setShowAuth(true)}>Sign in</button> to send messages.</p>}
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
                  <span className="chat-avatar">{m.role === 'user' ? <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{width:18,height:18}}><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg> : <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{width:18,height:18}}><path d="M12 2a4 4 0 014 4v2a4 4 0 01-8 0V6a4 4 0 014-4z"/><path d="M18 14h.01"/><path d="M6 14h.01"/><path d="M12 14v4"/><path d="M8 18h8"/></svg>}</span>
                  <div className="chat-bubble">{m.content}</div>
                </div>
              ))}
              {chatLoading && (
                <div className="chat-msg assistant">
                  <span className="chat-avatar"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{width:18,height:18}}><path d="M12 2a4 4 0 014 4v2a4 4 0 01-8 0V6a4 4 0 014-4z"/><path d="M18 14h.01"/><path d="M6 14h.01"/><path d="M12 14v4"/><path d="M8 18h8"/></svg></span>
                  <div className="chat-bubble typing">
                    <span className="dot-pulse" />
                  </div>
                </div>
              )}
              <div ref={chatEnd} />
            </div>
            <div className="chat-input-area">
              <input ref={chatInput} type="text" placeholder={isPremium ? "Ask anything..." : "Sign in to send messages..."} aria-label="Ask faith assistant" value={chatMsg}
                onChange={e => setChatMsg(e.target.value)} onKeyDown={e => e.key === 'Enter' && sendChat()} />
              <button onClick={sendChat} disabled={chatLoading || !chatMsg.trim() || !isPremium}>Send</button>
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
                  <button className="onboarding-signup" onClick={() => { completeOnboarding(); setShowAuth(true) }}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{width:16,height:16,verticalAlign:'middle',marginRight:6}}><line x1="12" y1="2" x2="12" y2="22"/><line x1="6" y1="8" x2="18" y2="8"/></svg> Sign Up for Premium Features
                  </button>
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
          authUser={authUser}
        />
      )}

      {legalSettingsOpen && (
        <LegalScreen
          mode="settings"
          onAccept={() => setLegalSettingsOpen(false)}
          onDecline={() => setLegalSettingsOpen(false)}
          apiUrl={API_URL}
          authUser={authUser}
        />
      )}

      <ErrorBoundary>
        <CommunityAssistant isPremium={isPremium} />
      </ErrorBoundary>
    </div>
  )
}
