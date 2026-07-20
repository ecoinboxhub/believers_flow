const PRIMARY_TZ = 'Africa/Lagos'
const TIMEZONES = [
  { id: 'WAT', label: 'WAT (UTC+1)', tz: 'Africa/Lagos' },
  { id: 'UTC', label: 'UTC', tz: 'UTC' },
  { id: 'EST', label: 'EST (UTC-5)', tz: 'America/New_York' },
  { id: 'CST', label: 'CST (UTC-6)', tz: 'America/Chicago' },
  { id: 'MST', label: 'MST (UTC-7)', tz: 'America/Denver' },
  { id: 'PST', label: 'PST (UTC-8)', tz: 'America/Los_Angeles' },
  { id: 'GMT', label: 'GMT (UTC+0)', tz: 'Europe/London' },
  { id: 'CET', label: 'CET (UTC+1)', tz: 'Europe/Paris' },
  { id: 'EET', label: 'EET (UTC+2)', tz: 'Europe/Helsinki' },
  { id: 'IST', label: 'IST (UTC+2)', tz: 'Asia/Jerusalem' },
  { id: 'MSK', label: 'MSK (UTC+3)', tz: 'Europe/Moscow' },
  { id: 'GST', label: 'GST (UTC+4)', tz: 'Asia/Dubai' },
  { id: 'PKT', label: 'PKT (UTC+5)', tz: 'Asia/Karachi' },
  { id: 'IST5', label: 'IST (UTC+5:30)', tz: 'Asia/Kolkata' },
  { id: 'BJT', label: 'CST (UTC+8)', tz: 'Asia/Shanghai' },
  { id: 'JST', label: 'JST (UTC+9)', tz: 'Asia/Tokyo' },
  { id: 'AEST', label: 'AEST (UTC+10)', tz: 'Australia/Sydney' },
  { id: 'NZST', label: 'NZST (UTC+12)', tz: 'Pacific/Auckland' },
]

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
const SHORT_DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const SHORT_MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

function formatPartsInTz(date, tz) {
  const now = date || new Date()
  const resolvedTz = TIMEZONES.find(t => t.id === tz || t.tz === tz)?.tz || tz
  try {
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone: resolvedTz,
      year: 'numeric', month: 'numeric', day: 'numeric',
      hour: 'numeric', minute: 'numeric', second: 'numeric',
      hour12: false, dayPeriod: 'short',
    }).formatToParts(now)
    const getVal = (type) => parseInt(parts.find(p => p.type === type)?.value || '0')
    return {
      year: getVal('year'),
      month: getVal('month') - 1,
      day: getVal('day'),
      hour: getVal('hour'),
      minute: getVal('minute'),
      second: getVal('second'),
      dayPeriod: parts.find(p => p.type === 'dayPeriod')?.value || '',
    }
  } catch {
    return {
      year: now.getFullYear(), month: now.getMonth(), day: now.getDate(),
      hour: now.getHours(), minute: now.getMinutes(), second: now.getSeconds(),
      dayPeriod: '',
    }
  }
}

function getDateInTz(tz) {
  const p = formatPartsInTz(new Date(), tz)
  return new Date(p.year, p.month, p.day, p.hour, p.minute, p.second)
}

function getNow() {
  return getDateInTz(PRIMARY_TZ)
}

function getUserTimezone() {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone
  } catch {
    return PRIMARY_TZ
  }
}

function getUserTimezoneAbbr() {
  const tz = getUserTimezone()
  const now = new Date()
  try {
    const parts = new Intl.DateTimeFormat('en-US', { timeZone: tz, timeZoneName: 'short' }).formatToParts(now)
    return parts.find(p => p.type === 'timeZoneName')?.value || 'UTC'
  } catch {
    return 'UTC'
  }
}

function getUserTimezoneOffset() {
  const tz = getUserTimezone()
  const now = new Date()
  try {
    const parts = new Intl.DateTimeFormat('en-US', { timeZone: tz, timeZoneName: 'longOffset' }).formatToParts(now)
    const offsetStr = parts.find(p => p.type === 'timeZoneName')?.value || ''
    const match = offsetStr.match(/GMT([+-])(\d{1,2}):?(\d{2})?/)
    if (match) {
      const sign = match[1] === '+' ? 1 : -1
      const hours = parseInt(match[2])
      const mins = parseInt(match[3] || '0')
      return sign * (hours + mins / 60)
    }
    return 0
  } catch {
    return 0
  }
}

function getUserNow() {
  return getDateInTz(getUserTimezone())
}

function getDayOfYear(date) {
  const d = date || getNow()
  const startOfYear = new Date(d.getFullYear(), 0, 1)
  const diff = d.getTime() - startOfYear.getTime()
  return Math.floor(diff / 86400000) + 1
}

function formatDateShort(date) {
  const d = date || getNow()
  return `${SHORT_DAYS[d.getDay()]}, ${SHORT_MONTHS[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`
}

function formatDateFull(date) {
  const d = date || getNow()
  return `${DAYS[d.getDay()]}, ${MONTHS[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`
}

function formatDateTime(date) {
  const d = date || getNow()
  const h = d.getHours()
  const m = d.getMinutes().toString().padStart(2, '0')
  const ampm = h >= 12 ? 'PM' : 'AM'
  const h12 = h % 12 || 12
  return `${DAYS[d.getDay()]}, ${MONTHS[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()} ${h12}:${m} ${ampm}`
}

function formatTimeShort(date) {
  const d = date || getNow()
  const h = d.getHours()
  const m = d.getMinutes().toString().padStart(2, '0')
  const ampm = h >= 12 ? 'PM' : 'AM'
  const h12 = h % 12 || 12
  return `${h12}:${m} ${ampm}`
}

function getAllTimezones() {
  const now = new Date()
  return TIMEZONES.map(tz => {
    const p = formatPartsInTz(now, tz.tz)
    return {
      ...tz,
      hours: p.hour.toString().padStart(2, '0'),
      minutes: p.minute.toString().padStart(2, '0'),
    }
  })
}

function getGreeting() {
  const h = getNow().getHours()
  if (h >= 5 && h < 12) return { msg: 'Good morning! Rise and shine for the Lord!', icon: '\u{1F305}' }
  if (h >= 12 && h < 17) return { msg: 'Good afternoon! Keep walking in faith.', icon: '\u2600\uFE0F' }
  if (h >= 17 && h < 21) return { msg: 'Good evening! Rest in His presence.', icon: '\u{1F306}' }
  return { msg: 'Good night! May the Lord watch over you.', icon: '\u{1F319}' }
}

function getTodayISO() {
  const d = getNow()
  return `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, '0')}-${d.getDate().toString().padStart(2, '0')}`
}

function getTodayDateString() {
  const p = formatPartsInTz(new Date(), PRIMARY_TZ)
  return `${p.month + 1}/${p.day}/${p.year}`
}

function getTodaySeed() {
  const d = getNow()
  return d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate()
}

export {
  TIMEZONES,
  PRIMARY_TZ,
  MONTHS,
  DAYS,
  SHORT_DAYS,
  SHORT_MONTHS,
  getDateInTz,
  getNow,
  getUserTimezone,
  getUserTimezoneAbbr,
  getUserTimezoneOffset,
  getUserNow,
  getDayOfYear,
  formatDateShort,
  formatDateFull,
  formatDateTime,
  formatTimeShort,
  getAllTimezones,
  getGreeting,
  getTodayISO,
  getTodayDateString,
  getTodaySeed,
}
