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
