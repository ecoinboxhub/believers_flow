const CHURCH_MODULES = {
  dunamis: () => import('./dunamis'),
  rccg: () => import('./rccg'),
  mfm: () => import('./mfm'),
  deeperlife: () => import('./deeperlife'),
  believersloveworld: () => import('./believersloveworld'),
  fcs: () => import('./fcs'),
  foodfortheday: () => import('./foodfortheday'),
  dailymanna: () => import('./dailymanna'),
  winners: () => import('./winners'),
  cac: () => import('./cac'),
  ourdailybread: () => import('./ourdailybread'),
  davidjeremiah: () => import('./davidjeremiah'),
  intouch: () => import('./intouch'),
  joelosteen: () => import('./joelosteen'),
  trem: () => import('./trem'),
  joycemeyer: () => import('./joycemeyer'),
  odbtd: () => import('./odbtd'),
  billygraham: () => import('./billygraham'),
  josephprince: () => import('./josephprince'),
  cdr: () => import('./cdr'),
  kennethcopeland: () => import('./kennethcopeland'),
}

export const CHURCH_METADATA = {
  dunamis: { name: 'Dunamis Gospel', pastor: 'Dr. Paul Enenche', color: '#e74c3c' },
  rccg: { name: 'RCCG Open Heaven', pastor: 'Pastor E.A. Adeboye', color: '#3498db' },
  mfm: { name: 'MFM Mountain Top', pastor: 'Dr. D.K. Olukoya', color: '#9b59b6' },
  deeperlife: { name: 'Deeper Life Daily Manna', pastor: 'Pastor W.F. Kumuyi', color: '#2ecc71' },
  believersloveworld: { name: 'Rhapsody of Realities', pastor: 'Pastor Chris Oyakhilome', color: '#f39c12' },
  fcs: { name: 'FCS Ministries', pastor: 'Rev. Felix Adeyemi', color: '#1abc9c' },
  foodfortheday: { name: 'Food for the Day', pastor: 'Rev. Dr. Olusola Areogun', color: '#e67e22' },
  dailymanna: { name: 'Daily Manna', pastor: 'DCLM', color: '#8e44ad' },
  winners: { name: 'Winners Chapel', pastor: 'Bishop David Oyedepo', color: '#27ae60' },
  cac: { name: 'CAC Salvation Centre', pastor: 'Prophet Hezekiah Oladimeji', color: '#c0392b' },
  ourdailybread: { name: 'Our Daily Bread', pastor: 'Various', color: '#d35400' },
  davidjeremiah: { name: 'David Jeremiah', pastor: 'Dr. David Jeremiah', color: '#7f8c8d' },
  intouch: { name: 'In Touch Ministries', pastor: 'Dr. Charles Stanley', color: '#34495e' },
  joelosteen: { name: 'Joel Osteen', pastor: 'Joel Osteen', color: '#c2185b' },
  trem: { name: 'TREM Devotional', pastor: 'Dr. Mike Irukwu', color: '#8B4513' },
  joycemeyer: { name: 'Joyce Meyer', pastor: 'Joyce Meyer', color: '#FF69B4' },
  odbtd: { name: 'Our Daily Bread', pastor: 'Our Daily Bread Ministries', color: '#2E86AB' },
  billygraham: { name: 'Billy Graham', pastor: 'Billy Graham Evangelistic Association', color: '#556B2F' },
  josephprince: { name: 'Joseph Prince', pastor: 'Joseph Prince', color: '#4169E1' },
  cdr: { name: 'CDR Devotional', pastor: 'Christ Dedicated Rock', color: '#DC143C' },
  kennethcopeland: { name: 'Kenneth Copeland', pastor: 'Kenneth Copeland Ministries', color: '#FF8C00' },
}

export const CHURCH_NAMES = Object.keys(CHURCH_MODULES)

let dataCache = {}

export async function getChurchData(key) {
  if (dataCache[key]) return dataCache[key]
  if (!CHURCH_MODULES[key]) return null
  const mod = await CHURCH_MODULES[key]()
  const dataKey = Object.keys(mod).find(k => k.endsWith('_DEVOTIONALS'))
  if (dataKey) {
    dataCache[key] = mod[dataKey]
    return mod[dataKey]
  }
  return null
}

export async function getChurchDevotional(key, dayIndex) {
  const data = await getChurchData(key)
  if (!data?.devotionals?.length) return null
  return data.devotionals[dayIndex % data.devotionals.length]
}
