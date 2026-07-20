import { memo } from 'react'

const TasksView = memo(function TasksView({
  tasks, filteredTasks, currentFilter, setCurrentFilter,
  taskText, setTaskText, taskTime, setTaskTime, taskCategory, setTaskCategory,
  addTask, toggleTask, deleteTask, completionPercent, totalTasks, completedTasks, prayedToday,
}) {
  return (
    <section className="view fade-in">
      <div className="grid-2col">
        <div className="progress-card hover-lift slide-up">
          <div className="progress-header"><span>Progress</span><span className="progress-pct">{completionPercent}%</span></div>
          <div className="progress-track"><div className="progress-fill" style={{ width: `${completionPercent}%` }} /></div>
          <p className="progress-sub">{completedTasks} of {totalTasks} done</p>
        </div>
        <div className="prayer-mini-card hover-lift slide-up">
          <div className="prayer-mini-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{width:24,height:24}}><path d="M12 2c1.5 2 2.5 3 2.5 5a3.5 3.5 0 01-5 0c0-2 1-3 2.5-5z"/><rect x="10" y="9" width="4" height="13" rx="1"/></svg></div>
          <div className="prayer-mini-info">
            <span className="prayer-mini-label">Today's Prayer</span>
            <span className="prayer-mini-status">{prayedToday ? <><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{width:14,height:14,verticalAlign:'middle',marginRight:4}}><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/></svg> Prayed</> : 'Not yet'}</span>
          </div>
        </div>
      </div>

      <div className="filter-bar">
        {['all', 'active', 'completed'].map(f => (
          <button key={f} className={`filter-btn${currentFilter === f ? ' active' : ''}`} onClick={() => setCurrentFilter(f)}>
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      <div className="input-group">
        <input type="text" placeholder="What's next for the Kingdom?" value={taskText}
          onChange={e => setTaskText(e.target.value)} onKeyDown={e => e.key === 'Enter' && addTask()} />
        <input type="time" className="time-input" value={taskTime} onChange={e => setTaskTime(e.target.value)} />
        <select value={taskCategory} onChange={e => setTaskCategory(e.target.value)}>
          <option value="spiritual">Spiritual</option>
          <option value="personal">Personal</option>
          <option value="service">Service</option>
        </select>
        <button onClick={addTask}>+ Add</button>
      </div>

      <ul id="task-list">
        {filteredTasks.map(t => (
          <li key={t.id} className={`task-item${t.completed ? ' completed' : ''}`}>
            <label className="checkbox-wrap">
              <input type="checkbox" checked={t.completed} onChange={() => toggleTask(t.id)} />
              <span className="checkmark" />
            </label>
            <div className="task-text">
              <span className="task-title">{t.text}</span>
              <div className="task-meta">
                {t.time && <span className="task-time"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{width:14,height:14,verticalAlign:'middle',marginRight:2}}><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg> {t.time}</span>}
                <span className={`task-cat ${t.category}`}>{t.category}</span>
              </div>
            </div>
            <button className="task-delete-btn" onClick={() => deleteTask(t.id)} title="Delete task"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{width:16,height:16}}><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg></button>
          </li>
        ))}
        {filteredTasks.length === 0 && (
          <div className="empty-state meaningful">
            <div className="empty-icon-wrap"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{width:48,height:48}}><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/></svg></div>
            <h4 className="empty-title">You are all caught up today</h4>
            <p className="empty-verse">"Commit to the Lord whatever you do, and He will establish your plans."</p>
            <p className="empty-ref">— Proverbs 16:3</p>
            <p className="empty-hint">Add your first task above to begin your day with purpose.</p>
          </div>
        )}
      </ul>
    </section>
  )
})

export default TasksView
