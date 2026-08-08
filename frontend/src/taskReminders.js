import { requestNotificationPermission } from './pushNotifications.js'

export const REMINDER_TAG_PREFIX = 'bf-task-'
export const REMINDER_GRACE_MS = 5 * 60 * 1000
export const REMINDER_TICK_MS = 15 * 1000

export function taskReminderTag(taskId) {
  return `${REMINDER_TAG_PREFIX}${taskId}`
}

export function getTaskReminderTs(task) {
  if (!task) return null
  if (task.reminder === false) return null
  const time = task.time || ''
  if (!time) return null
  const parts = time.split(':').map(Number)
  if (parts.length < 2 || parts.some(isNaN)) return null
  const [h = 0, m = 0, s = 0] = parts
  let d
  if (task.date) {
    const dp = task.date.split('-').map(Number)
    if (dp.length !== 3 || dp.some(isNaN)) return null
    d = new Date(dp[0], dp[1] - 1, dp[2], h, m, s)
  } else {
    d = new Date()
    d.setHours(h, m, s, 0)
    if (d.getTime() <= Date.now()) d.setDate(d.getDate() + 1)
  }
  const ts = d.getTime()
  return Number.isNaN(ts) ? null : ts
}

export function notificationSupported() {
  return typeof window !== 'undefined' && 'Notification' in window
}

export function canScheduleBackgroundReminders() {
  return notificationSupported() && 'showTrigger' in Notification.prototype && typeof TimestampTrigger !== 'undefined'
}

export function requestReminderPermission() {
  return requestNotificationPermission()
}

export async function cancelBackgroundReminder(taskId) {
  if (!canScheduleBackgroundReminders() || !('serviceWorker' in navigator)) return
  try {
    const reg = await navigator.serviceWorker.ready
    const notifications = await reg.getNotifications({ tag: taskReminderTag(taskId), includeTriggered: true })
    notifications.forEach(n => n.close())
  } catch (err) {
    console.warn('Cancel background reminder failed:', err)
  }
}

export async function reconcileBackgroundReminders(tasks, enabled) {
  if (!enabled || !canScheduleBackgroundReminders() || !('serviceWorker' in navigator)) return
  if (Notification.permission !== 'granted') return
  try {
    const reg = await navigator.serviceWorker.ready
    const now = Date.now()
    const eligible = (tasks || []).filter(t => {
      if (t.completed || t.reminderFiredAt || t.reminder === false) return false
      const ts = getTaskReminderTs(t)
      return ts && ts > now
    })

    const desiredTags = new Set(eligible.map(t => taskReminderTag(t.id)))
    const existing = await reg.getNotifications({ includeTriggered: true })
    for (const n of existing) {
      if (n.tag && n.tag.startsWith(REMINDER_TAG_PREFIX) && !desiredTags.has(n.tag)) {
        n.close()
      }
    }

    for (const t of eligible) {
      const ts = getTaskReminderTs(t)
      const title = t.text || 'Task Reminder'
      const body = t.description || `Your task is due at ${t.time}.`
      await reg.showNotification(`\u23F0 ${title}`, {
        tag: taskReminderTag(t.id),
        body,
        icon: './icon-192.png',
        badge: './icon-192.png',
        vibrate: [200, 100, 200],
        showTrigger: new (window.TimestampTrigger)(ts),
        actions: [{ action: 'complete', title: 'Mark done' }],
        data: { url: './', taskId: t.id, reminder: true },
        renotify: true,
      })
    }
  } catch (err) {
    console.warn('Background reminder sync failed:', err)
  }
}

let alarmAudio = null
let audioUnlocked = false
let alarmCtx = null
let beepTimer = null

function getAlarmAudio() {
  if (!alarmAudio && typeof Audio !== 'undefined') {
    alarmAudio = new Audio('./sounds/alarm.ogg')
    alarmAudio.loop = true
    alarmAudio.preload = 'auto'
  }
  return alarmAudio
}

function unlockAlarmAudio() {
  if (audioUnlocked) return
  audioUnlocked = true
  const a = getAlarmAudio()
  if (a) {
    a.play().then(() => { a.pause(); a.currentTime = 0 }).catch(() => {})
  }
}

function getAudioContext() {
  if (!alarmCtx && typeof AudioContext !== 'undefined') alarmCtx = new AudioContext()
  else if (!alarmCtx && typeof window !== 'undefined' && typeof window.webkitAudioContext !== 'undefined') alarmCtx = new window.webkitAudioContext()
  return alarmCtx
}

function startBeepFallback() {
  const ctx = getAudioContext()
  if (!ctx) return
  if (ctx.state === 'suspended') ctx.resume().catch(() => {})
  stopBeepFallback()
  const beep = () => {
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = 'square'
    osc.frequency.value = 880
    gain.gain.value = 0.08
    osc.connect(gain).connect(ctx.destination)
    osc.start()
    osc.stop(ctx.currentTime + 0.6)
    beepTimer = setTimeout(beep, 900)
  }
  beep()
}

function stopBeepFallback() {
  if (beepTimer) { clearTimeout(beepTimer); beepTimer = null }
}

export function initTaskAlarmAudio() {
  if (typeof window === 'undefined') return
  const unlockOnce = () => unlockAlarmAudio()
  window.addEventListener('pointerdown', unlockOnce, { once: true, passive: true })
  window.addEventListener('keydown', unlockOnce, { once: true, passive: true })
}

export function playTaskAlarmSound() {
  if (typeof window === 'undefined') return
  const a = getAlarmAudio()
  if (a) {
    const p = a.play()
    if (p && p.catch) p.catch(() => { startBeepFallback() })
  } else {
    startBeepFallback()
  }
}

export function stopTaskAlarmSound() {
  if (alarmAudio) {
    try { alarmAudio.pause(); alarmAudio.currentTime = 0 } catch { /* noop */ }
  }
  stopBeepFallback()
}
