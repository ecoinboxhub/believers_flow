import { memo } from 'react'
import { BIBLE_VERSIONS } from '../constants'
import { getDayOfYear } from '../dateUtils'
import VersionSelector from './VersionSelector.jsx'

const STUDY_SUGGESTIONS = [
  { book: 'Psalm', chapter: 23, title: 'The Lord is My Shepherd' },
  { book: 'Proverbs', chapter: 3, title: 'Trust in the Lord' },
  { book: 'Matthew', chapter: 5, title: 'The Beatitudes' },
  { book: 'John', chapter: 14, title: 'I Am the Way' },
  { book: 'Romans', chapter: 8, title: 'Life in the Spirit' },
  { book: 'Philippians', chapter: 4, title: 'Rejoice in the Lord' },
  { book: 'Ephesians', chapter: 6, title: 'Armor of God' },
]

const DAILY_PRAYERS = [
  'Lord, thank You for this new day. Guide my thoughts, words, and actions. Let me be a light to someone today. Amen.',
  'Heavenly Father, I surrender this day to You. Give me wisdom in my decisions and peace in my heart. In Jesus\' name, Amen.',
  'Dear God, help me to see Your hand in every situation today. Grant me patience, kindness, and strength. Amen.',
  'Lord Jesus, I lift up my family, friends, and even my enemies before You. Bless them and draw them close to Your heart. Amen.',
  'Father, I thank You for Your unfailing love. Help me to love others the way You love me — unconditionally and without reservation. Amen.',
]

const SpiritualView = memo(function SpiritualView({
  prayerLogs, streak, prayedToday, prayerMinutes, setPrayerMinutes, logPrayer,
  bibleVersion, setBibleVersion, studyBook, setStudyBook, studyChapter, setStudyChapter,
  saveStudyPlan, goToBibleChapter, studyPlan, spiritualPercent, secularPercent, totalTasks,
}) {
  const today = new Date()
  const todayPrayer = DAILY_PRAYERS[today.getDate() % DAILY_PRAYERS.length]
  const todaySuggestion = STUDY_SUGGESTIONS[today.getDate() % STUDY_SUGGESTIONS.length]

  const useSuggestion = (s) => {
    setStudyBook(s.book)
    setStudyChapter(String(s.chapter))
    goToBibleChapter(s.book, s.chapter)
  }

  return (
    <section className="view fade-in">
      <div className="daily-prayer-card slide-up">
        <div className="dp-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{width:24,height:24}}><path d="M12 2c1.5 2 2.5 3 2.5 5a3.5 3.5 0 01-5 0c0-2 1-3 2.5-5z"/><rect x="10" y="9" width="4" height="13" rx="1"/></svg></div>
        <div className="dp-content">
          <h4>Today's Prayer</h4>
          <p>&ldquo;{todayPrayer}&rdquo;</p>
        </div>
      </div>

      <div className="card hover-lift slide-up">
        <div className="card-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{width:24,height:24}}><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/></svg></div>
        <h3>Prayer Tracker</h3>
        <p>Log your daily quiet time and build a streak.</p>
        {prayedToday ? (
          <div className="prayed-today-badge"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{width:14,height:14,verticalAlign:'middle',marginRight:4}}><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/></svg> Prayed today! Come back tomorrow.</div>
        ) : (
          <div className="prayer-input">
            <input type="number" placeholder="Minutes in prayer" value={prayerMinutes}
              onChange={e => setPrayerMinutes(e.target.value)} onKeyDown={e => e.key === 'Enter' && logPrayer()} min="1" />
            <button onClick={logPrayer}>Log Prayer</button>
          </div>
        )}
        {streak > 0 && (
          <div className="streak-badge"><span className="flame"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{width:16,height:16,verticalAlign:'middle'}}><path d="M12 2c1 3 2.5 3.5 3.5 4.5A5 5 0 0117 10a5 5 0 01-10 0c0-3 2-6 2-6s1 1.5 2 2.5"/><path d="M12 22c-4 0-7-3-7-7 0-4 5-13 5-13s5 9 5 13c0 4-3 7-3 7z"/></svg></span><span>{streak} day streak!</span></div>
        )}
        <div className="prayer-history">
          <h4>Recent</h4>
          {prayerLogs.slice(0, 5).map((log, i) => (
            <div key={i} className="prayer-log-item"><span className="log-date">{log.date}</span><span className="log-mins">{log.minutes} min</span></div>
          ))}
          {!prayerLogs.length && (
            <div className="empty-small meaningful">
              <p className="empty-mini-title">Your prayer journey starts here</p>
              <p className="empty-mini-text">Record prayers, reflections, and God's faithfulness in your life.</p>
            </div>
          )}
        </div>
      </div>

      <div className="bible-version-bar">
        <VersionSelector currentVersion={bibleVersion} onSelect={setBibleVersion} />
      </div>

      <div className="card hover-lift slide-up">
        <div className="card-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{width:24,height:24}}><path d="M4 19.5A2.5 2.5 0 016.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z"/></svg></div>
        <h3>Bible Study Planner</h3>
        <p>Plan your scripture reading.</p>

        <div className="today-suggestion">
          Today's suggestion: <strong>{todaySuggestion.book} {todaySuggestion.chapter}</strong> &mdash; <em>{todaySuggestion.title}</em>
          <span className="bv-badge">{bibleVersion}</span>
        </div>

        <div className="study-inputs">
          <input type="text" placeholder="Book (e.g. Genesis)" value={studyBook} onChange={e => setStudyBook(e.target.value)} />
          <input type="number" placeholder="Ch" value={studyChapter} onChange={e => setStudyChapter(e.target.value)} min="1" />
        </div>
        <div className="study-actions">
          <button onClick={saveStudyPlan}>Save Plan</button>
          <button className="btn-outline" onClick={() => useSuggestion(todaySuggestion)}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{width:14,height:14,verticalAlign:'middle',marginRight:4}}><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/><circle cx="12" cy="9" r="2.5"/></svg> Use Suggestion</button>
        </div>
        {studyPlan.book && (
          <div className="study-current"><span className="study-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{width:16,height:16,verticalAlign:'middle'}}><path d="M4 19.5A2.5 2.5 0 016.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z"/></svg></span><span>Studying: {studyPlan.book} {studyPlan.chapter} <span className="bv-badge">{bibleVersion}</span></span></div>
        )}
      </div>

      <div className="card hover-lift slide-up">
        <div className="card-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{width:24,height:24}}><line x1="12" y1="3" x2="12" y2="21"/><path d="M4 8h16"/><path d="M4 8l4 6"/><path d="M20 8l-4 6"/><path d="M4 14h8"/><path d="M12 14h8"/></svg></div>
        <h3>Spiritual Balance</h3>
        <p>How your tasks balance between spiritual and everyday life.</p>
        <div className="balance-viz">
          <div className="balance-bar" style={{ width: `${spiritualPercent}%` }} />
          <div className="balance-glow" />
        </div>
        <div className="balance-labels">
          <span className="balance-spiritual"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{width:14,height:14,verticalAlign:'middle',marginRight:2}}><line x1="12" y1="3" x2="12" y2="21"/><line x1="5" y1="9" x2="19" y2="9"/></svg> Spiritual {spiritualPercent}%</span>
          <span className="balance-secular">Secular {secularPercent}%</span>
        </div>
        {spiritualPercent < 25 && totalTasks > 0 && (
          <div className="balance-tip"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{width:14,height:14,verticalAlign:'middle',marginRight:4}}><path d="M12 2a7 7 0 00-3 13.32V17h6v-1.68A7 7 0 0012 2z"/><line x1="9" y1="21" x2="15" y2="21"/><line x1="10" y1="18" x2="14" y2="18"/></svg> Try adding a spiritual task to balance your day!</div>
        )}
      </div>

      <div className="card hover-lift slide-up">
        <div className="card-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{width:24,height:24}}><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg></div>
        <h3>Today's Suggested Reading</h3>
        <div className="suggestion-card">
          <span className="suggestion-book">{todaySuggestion.book}</span>
          <span className="suggestion-ch">Chapter {todaySuggestion.chapter}</span>
          <span className="suggestion-title">&ldquo;{todaySuggestion.title}&rdquo;</span>
          <div className="suggestion-footer">
            <span className="bv-badge">{bibleVersion}</span>
            <button className="btn-sm" onClick={() => useSuggestion(todaySuggestion)}>Study This</button>
          </div>
        </div>
      </div>
    </section>
  )
})

export default SpiritualView
