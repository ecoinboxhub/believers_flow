import { describe, it, expect, beforeAll } from 'vitest'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import {
  getTaskReminderTs, taskReminderTag, canScheduleBackgroundReminders,
  REMINDER_GRACE_MS, REMINDER_TICK_MS,
} from '../taskReminders.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const NATIVE_PATH = join(__dirname, '..', 'nativeReminders.js')
const REMINDERS_PATH = join(__dirname, '..', 'taskReminders.js')

let nativeSource, remindersSource
beforeAll(() => {
  nativeSource = readFileSync(NATIVE_PATH, 'utf8')
  remindersSource = readFileSync(REMINDERS_PATH, 'utf8')
})

describe('getTaskReminderTs — reminder timestamp parsing', () => {
  it('returns null for tasks without a time', () => {
    expect(getTaskReminderTs({ text: 'Pray' })).toBeNull()
    expect(getTaskReminderTs({ text: 'Pray', time: '' })).toBeNull()
    expect(getTaskReminderTs(null)).toBeNull()
  })

  it('returns null when reminders are disabled on the task', () => {
    expect(getTaskReminderTs({ text: 'Pray', time: '12:00', reminder: false })).toBeNull()
  })

  it('parses a dated task into a timestamp', () => {
    const ts = getTaskReminderTs({ date: '2026-12-01', time: '08:30', reminder: true })
    const d = new Date(ts)
    expect(d.getFullYear()).toBe(2026)
    expect(d.getMonth()).toBe(11)
    expect(d.getDate()).toBe(1)
    expect(d.getHours()).toBe(8)
    expect(d.getMinutes()).toBe(30)
  })

  it('rolls a time-only task to tomorrow when the time already passed', () => {
    const ts = getTaskReminderTs({ time: '00:01', reminder: true })
    const d = new Date(ts)
    const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000)
    expect(d.getDate()).toBe(tomorrow.getDate())
    expect(d.getHours()).toBe(0)
    expect(d.getMinutes()).toBe(1)
  })

  it('uses today for a future time-only task', () => {
    const future = new Date(Date.now() + 6 * 60 * 60 * 1000)
    const hh = String(future.getHours()).padStart(2, '0')
    const mm = String(future.getMinutes()).padStart(2, '0')
    const ts = getTaskReminderTs({ time: `${hh}:${mm}`, reminder: true })
    const d = new Date(ts)
    expect(d.getFullYear()).toBe(future.getFullYear())
    expect(d.getMonth()).toBe(future.getMonth())
    expect(d.getDate()).toBe(future.getDate())
    expect(d.getHours()).toBe(future.getHours())
    expect(d.getMinutes()).toBe(future.getMinutes())
  })

  it('rejects malformed times and dates', () => {
    expect(getTaskReminderTs({ time: 'oops' })).toBeNull()
    expect(getTaskReminderTs({ time: '12:99' })).toBeNull()
    expect(getTaskReminderTs({ date: '2026-13-40', time: '08:00' })).toBeNull()
  })
})

describe('taskReminderTag', () => {
  it('prefixes the task id', () => {
    expect(taskReminderTag('abc-123')).toBe('bf-task-abc-123')
  })
})

describe('constants', () => {
  it('keeps the polling tick and grace period sensible', () => {
    expect(REMINDER_TICK_MS).toBe(15000)
    expect(REMINDER_GRACE_MS).toBe(5 * 60 * 1000)
  })
})

describe('native reminder integration — Android scheduling', () => {
  it('uses the Capacitor Local Notifications plugin', () => {
    expect(nativeSource).toContain('@capacitor/local-notifications')
    expect(nativeSource).toContain("LocalNotifications.schedule")
    expect(nativeSource).toContain("LocalNotifications.cancel")
    expect(nativeSource).toContain("LocalNotifications.getPending")
    expect(nativeSource).toContain("LocalNotifications.createChannel")
  })

  it('creates a high-importance channel with an alarm sound for Android 8+', () => {
    expect(nativeSource).toContain("REMINDER_CHANNEL_ID = 'bf-task-reminders'")
    expect(nativeSource).toContain("sound: 'alarm.ogg'")
    expect(nativeSource).toContain('importance: 4')
    expect(nativeSource).toContain('vibration: true')
  })

  it('schedules with allowWhileIdle so alarms fire during Doze', () => {
    expect(nativeSource).toContain('allowWhileIdle: true')
  })

  it('hashes string task ids into stable 32-bit notification ids', () => {
    expect(nativeSource).toContain('taskReminderNativeId')
    expect(nativeSource).toContain('(h * 31')
  })

  it('routes permission requests and reconciliation through the native path when on Android', () => {
    expect(remindersSource).toContain("if (NATIVE_ANDROID) { await cancelNativeReminder(taskId); return }")
    expect(remindersSource).toContain("if (NATIVE_ANDROID) { await reconcileNativeReminders(tasks, enabled); return }")
    expect(remindersSource).toContain('requestReminderPermission')
  })
})

describe('canScheduleBackgroundReminders — platform detection', () => {
  it('is false in a plain web test environment without the native bridge', () => {
    expect(canScheduleBackgroundReminders()).toBe(false)
  })
})
