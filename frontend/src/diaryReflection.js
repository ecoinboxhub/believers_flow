// diaryReflection.js
// AI Reflection & Scripture Support for diary entries.
//
// requestDiaryReflection tries the backend AI endpoint and transparently falls
// back to a local, mood/keyword-driven reflection when the AI is unreachable,
// unconfigured, or fails — so users always get a meaningful, structured,
// non-conversational response. User diary content is never modified.

const API_URL = import.meta.env.VITE_API_URL || ''
const MIN_CONTENT_LENGTH = 12

function getAuthToken() {
  try {
    return typeof localStorage !== 'undefined' ? localStorage.getItem('bf_token') : ''
  } catch {
    return ''
  }
}

const THEMES = {
  joy: {
    reflection: 'What a beautiful note of joy in your heart today. Your gladness is a gift from God, and it reflects the hope you carry because of Him.',
    verses: [
      { reference: 'Psalm 118:24', text: 'This is the day which the LORD hath made; we will rejoice and be glad in it.', explanation: 'Your joy today is a response to God\u2019s goodness, and He delights to see you glad.' },
      { reference: 'Philippians 4:4', text: 'Rejoice in the Lord alway: and again I say, Rejoice.', explanation: 'Even your joy is anchored in the Lord, making it a steady and lasting joy.' },
    ],
    encouragement: 'Carry this gladness with you and let it bless everyone you meet today.',
  },
  gratitude: {
    reflection: 'A grateful heart is a heart that is close to God. Noticing His blessings is an act of worship, and it makes room for more of His faithfulness in your life.',
    verses: [
      { reference: '1 Thessalonians 5:18', text: 'In every thing give thanks: for this is the will of God in Christ Jesus concerning you.', explanation: 'Giving thanks, even in ordinary moments, is the posture God invites you to live in.' },
      { reference: 'Psalm 34:8', text: 'O taste and see that the LORD is good: blessed is the man that trusteth in him.', explanation: 'Your gratitude is a sign that you are tasting the goodness of the Lord.' },
    ],
    encouragement: 'Keep counting your blessings — they are more numerous than you think.',
  },
  peace: {
    reflection: 'There is a quiet stillness in your words, and that is a gift. Peace is not the absence of trouble, but the presence of God\u2019s rest within you.',
    verses: [
      { reference: 'John 14:27', text: 'Peace I leave with you, my peace I give unto you: not as the world giveth, give I unto you.', explanation: 'The peace you are experiencing is a gift straight from Jesus, beyond what circumstances can give.' },
      { reference: 'Psalm 46:1', text: 'God is our refuge and strength, a very present help in trouble.', explanation: 'This rest you feel is the security of being sheltered in God.' },
    ],
    encouragement: 'Rest in this peace, for it is the Lord\u2019s own gift to your soul.',
  },
  anxiety: {
    reflection: 'Your heart is carrying a heavy weight, and it is okay to acknowledge it. You do not have to face this alone — God invites you to bring every worry to Him.',
    verses: [
      { reference: 'Philippians 4:6', text: 'Be careful for nothing; but in every thing by prayer and supplication with thanksgiving let your requests be made known unto God.', explanation: 'The invitation is simple: hand every worry to God in prayer, and He will meet you there.' },
      { reference: '1 Peter 5:7', text: 'Casting all your care upon him; for he careth for you.', explanation: 'You are not alone in this; God genuinely cares about what concerns you.' },
    ],
    encouragement: 'Take a slow breath — God is with you, and He is greater than the storm.',
  },
  sadness: {
    reflection: 'Your words carry real sorrow, and your honesty before God matters to Him. He is close to the brokenhearted, and He does not rush your grief.',
    verses: [
      { reference: 'Psalm 34:18', text: 'The LORD is nigh unto them that are of a broken heart; and saveth such as be of a contrite spirit.', explanation: 'In your sadness, you are not far from God — you are exactly where He draws near.' },
      { reference: 'Psalm 23:4', text: 'Yea, though I walk through the valley of the shadow of death, I will fear no evil: for thou art with me.', explanation: 'Even in the darkest valley, His presence walks with you step by step.' },
    ],
    encouragement: 'Let yourself grieve, and trust that joy comes again in the morning.',
  },
  struggle: {
    reflection: 'You are being honest about a hard season, and that takes real courage. God does not despise your weakness; He meets it with grace.',
    verses: [
      { reference: '2 Corinthians 12:9', text: 'My grace is sufficient for thee: for my strength is made perfect in weakness.', explanation: 'Where you feel weak, God\u2019s grace is strongest in your life.' },
      { reference: 'Lamentations 3:22-23', text: 'It is of the LORD\u2019s mercies that we are not consumed, because his compassions fail not. They are new every morning.', explanation: 'Each new day carries fresh mercies for the struggles you face.' },
    ],
    encouragement: 'Be patient with yourself — God is still working, even when you cannot see it.',
  },
  hope: {
    reflection: 'There is a hopeful longing in your heart, and it is a beautiful expression of faith. God is a God who makes all things new.',
    verses: [
      { reference: 'Jeremiah 29:11', text: 'For I know the thoughts that I think toward you, saith the LORD, thoughts of peace, and not of evil, to give you an expected end.', explanation: 'The hope you feel is rooted in a God who has good plans for you.' },
      { reference: 'Romans 15:13', text: 'Now the God of hope fill you with all joy and peace in believing, that ye may abound in hope.', explanation: 'Your hope can overflow as you trust in the God of hope.' },
    ],
    encouragement: 'Hold on to hope — God is already at work behind the scenes.',
  },
  faith: {
    reflection: 'Your words show a heart that is reaching toward God. Keep pressing in — He honors every step you take in faith, even the small ones.',
    verses: [
      { reference: 'Proverbs 3:5', text: 'Trust in the LORD with all thine heart; and lean not unto thine own understanding.', explanation: 'Trusting God in the middle of the unknown is exactly where faith grows.' },
      { reference: 'Psalm 55:22', text: 'Cast thy burden upon the LORD, and he shall sustain thee.', explanation: 'God is ready to carry what you are holding.' },
    ],
    encouragement: 'Keep believing — you are closer to your breakthrough than you think.',
  },
  burden: {
    reflection: 'You are carrying a lot, and it is wise to set some of it down. You were never meant to carry everything alone — God has invited you to lean on Him.',
    verses: [
      { reference: 'Matthew 11:28', text: 'Come unto me, all ye that labour and are heavy laden, and I will give you rest.', explanation: 'Jesus directly invites you to bring your weariness to Him for rest.' },
      { reference: 'Psalm 55:22', text: 'Cast thy burden upon the LORD, and he shall sustain thee.', explanation: 'He will not only help — He will sustain you.' },
    ],
    encouragement: 'Lay your load at His feet; rest is a gift He longs to give you.',
  },
}

const MOOD_THEMES = {
  '\uD83D\uDE0A': 'joy',
  '\uD83D\uDE42': 'gratitude',
  '\uD83D\uDE10': 'peace',
  '\uD83D\uDE22': 'anxiety',
  '\uD83D\uDE2D': 'struggle',
}

const KEYWORD_THEMES = [
  { theme: 'joy', words: ['joy', 'happy', 'glad', 'delight', 'celebrate', 'wonderful', 'praise', 'grateful'] },
  { theme: 'gratitude', words: ['thank', 'grateful', 'blessed', 'blessing', 'gratitude', 'appreciate'] },
  { theme: 'peace', words: ['peace', 'calm', 'rest', 'settled', 'quiet', 'still'] },
  { theme: 'anxiety', words: ['anxious', 'anxiety', 'worried', 'worry', 'stress', 'afraid', 'fear', 'overwhelm', 'panic', 'nervous', 'scared'] },
  { theme: 'sadness', words: ['sad', 'crying', 'cry', 'grief', 'grieving', 'lonely', 'hurt', 'pain', 'depress', 'heartbroken', 'tears', 'lost'] },
  { theme: 'struggle', words: ['struggle', 'struggling', 'doubt', 'failing', 'failed', 'guilt', 'guilty', 'shame', 'weak', 'sin'] },
  { theme: 'burden', words: ['tired', 'exhausted', 'weary', 'burden', 'heavy', 'drained', 'burnout', 'stressed', 'overload'] },
  { theme: 'hope', words: ['hope', 'hopeful', 'dream', 'believe', 'trust', 'future'] },
  { theme: 'faith', words: ['faith', 'god', 'jesus', 'lord', 'prayer', 'scripture', 'spirit', 'church'] },
]

function detectTheme(text, mood) {
  let best = null
  let bestScore = 0
  for (const group of KEYWORD_THEMES) {
    const score = group.words.reduce((acc, w) => acc + (text.includes(w) ? 1 : 0), 0)
    if (score > bestScore) {
      bestScore = score
      best = group.theme
    }
  }
  if (best && bestScore >= 2) return best
  if (mood && MOOD_THEMES[mood]) return MOOD_THEMES[mood]
  return best || 'faith'
}

export function buildLocalReflection({ title = '', content = '', mood = '' } = {}) {
  const text = ` ${String(title || '').toLowerCase()} ${String(content || '').toLowerCase()} `
  const theme = detectTheme(text, mood)
  const t = THEMES[theme] || THEMES.faith
  return {
    source: 'local',
    reflection: t.reflection,
    verses: t.verses,
    encouragement: t.encouragement,
  }
}

export async function requestDiaryReflection({ title = '', content = '', mood = '' } = {}) {
  const text = String(content || '').trim()
  if (text.length < MIN_CONTENT_LENGTH) {
    return {
      needsMore: true,
      message: 'Write a few sentences about your day so we can offer a meaningful reflection and scriptures.',
    }
  }
  try {
    const token = getAuthToken()
    const res = await fetch(`${API_URL}/api/diary/reflection`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ title: String(title || ''), content: text.slice(0, 4000), mood: String(mood || '') }),
    })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const data = await res.json()
    if (data && data.needsMore) return data
    if (!data || typeof data.reflection !== 'string' || data.reflection.length === 0) throw new Error('Invalid response')
    return { ...data, source: 'ai' }
  } catch {
    return buildLocalReflection({ title, content: text, mood })
  }
}
