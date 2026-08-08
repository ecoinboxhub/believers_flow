import { Capacitor } from '@capacitor/core'
import { LocalNotifications } from '@capacitor/local-notifications'
import { getTaskReminderTs } from './taskReminders.js'

export const REMINDER_CHANNEL_ID = 'bf-task-reminders'

export const NATIVE_ANDROID =
  typeof window !== 'undefined' &&
  Boolean(Capacitor.isNativePlatform && Capacitor.isNativePlatform()) &&
  Capacitor.getPlatform && Capacitor.getPlatform() === 'android'

function taskReminderNativeId(taskId) {
  const s = String(taskId)
  let h = 7
  for (let i = 0; i < s.length; i++) {
    h = ((h * 31 + s.charCodeAt(i)) | 0)
  }
  return h
}

export function isNativeReminderSupported() {
  return NATIVE_ANDROID
}

async function ensureChannel() {
  try {
    const channels = await LocalNotifications.listChannels()
    if (!channels.channels.some(c => c.id === REMINDER_CHANNEL_ID)) {
      await LocalNotifications.createChannel({
        id: REMINDER_CHANNEL_ID,
        name: 'Task Reminders',
        description: 'Alerts for task due times',
        sound: 'alarm.ogg',
        importance: 4,
        vibration: true,
        visibility: 1,
      })
    }
  } catch (err) {
    console.warn('Create reminder channel failed:', err)
  }
}

export async function requestNativeReminderPermission() {
  if (!NATIVE_ANDROID) return false
  try {
    const perm = await LocalNotifications.requestPermissions()
    return perm.display === 'granted'
  } catch (err) {
    console.warn('Notification permission request failed:', err)
    return false
  }
}

export async function checkNativeReminderPermission() {
  if (!NATIVE_ANDROID) return false
  try {
    const perm = await LocalNotifications.checkPermissions()
    return perm.display === 'granted'
  } catch {
    return false
  }
}

function buildNotification(task) {
  const title = task.text || 'Task Reminder'
  return {
    id: taskReminderNativeId(task.id),
    title: `\u23F0 ${title}`,
    body: task.description || `Your task is due at ${task.time}.`,
    schedule: { at: new Date(getTaskReminderTs(task)), allowWhileIdle: true },
    channelId: REMINDER_CHANNEL_ID,
    sound: 'alarm.ogg',
    autoCancel: true,
    smallIcon: 'ic_stat_believersflow',
    extra: { taskId: task.id, reminder: true },
  }
}

export async function scheduleNativeReminder(task) {
  if (!NATIVE_ANDROID || !task) return
  const ts = getTaskReminderTs(task)
  if (!ts || ts <= Date.now()) return
  try {
    await ensureChannel()
    await LocalNotifications.schedule({ notifications: [buildNotification(task)] })
  } catch (err) {
    console.warn('Schedule native reminder failed:', err)
  }
}

export async function cancelNativeReminder(taskId) {
  if (!NATIVE_ANDROID || taskId == null) return
  try {
    await LocalNotifications.cancel({ notifications: [{ id: taskReminderNativeId(taskId) }] })
  } catch (err) {
    console.warn('Cancel native reminder failed:', err)
  }
}

export async function reconcileNativeReminders(tasks, enabled) {
  if (!NATIVE_ANDROID || !enabled) return
  try {
    const now = Date.now()
    const eligible = (tasks || []).filter(t => {
      if (t.completed || t.reminderFiredAt || t.reminder === false) return false
      const ts = getTaskReminderTs(t)
      return ts && ts > now
    })

    const pending = await LocalNotifications.getPending()
    const desired = new Set(eligible.map(t => taskReminderNativeId(t.id)))
    for (const n of pending.notifications) {
      if (!desired.has(n.id)) {
        await LocalNotifications.cancel({ notifications: [{ id: n.id }] })
      }
    }

    for (const t of eligible) {
      const id = taskReminderNativeId(t.id)
      const exists = pending.notifications.some(n => n.id === id)
      if (!exists) {
        await ensureChannel()
        await LocalNotifications.schedule({ notifications: [buildNotification(t)] })
      }
    }
  } catch (err) {
    console.warn('Reconcile native reminders failed:', err)
  }
}

export async function listenNativeAlarms(handler) {
  if (!NATIVE_ANDROID) return () => {}
  try {
    const handle = await LocalNotifications.addListener('localNotificationReceived', notification => {
      const taskId = notification.extra && notification.extra.taskId
      const title = notification.title ? notification.title.replace(/^\u23F0\s*/, '') : 'Task Reminder'
      if (handler && typeof handler === 'function') handler({ taskId, title })
    })
    const actionHandle = await LocalNotifications.addListener('localNotificationActionPerformed', ({ notification }) => {
      const taskId = notification.extra && notification.extra.taskId
      if (handler && typeof handler === 'function') handler({ taskId, title: notification.title })
    })
    return () => { handle.remove(); actionHandle.remove() }
  } catch (err) {
    console.warn('Listen native alarms failed:', err)
    return () => {}
  }
}
