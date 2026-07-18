import { useState } from 'react'

const MODES = [
  {
    id: 'desktop',
    label: 'Desktop',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
        <line x1="8" y1="21" x2="16" y2="21" />
        <line x1="12" y1="17" x2="12" y2="21" />
      </svg>
    ),
  },
  {
    id: 'tablet',
    label: 'Tablet',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="4" y="2" width="16" height="20" rx="2" ry="2" />
        <line x1="12" y1="18" x2="12.01" y2="18" />
      </svg>
    ),
  },
  {
    id: 'mobile',
    label: 'Mobile',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="5" y="2" width="14" height="20" rx="2" ry="2" />
        <line x1="12" y1="18" x2="12.01" y2="18" />
      </svg>
    ),
  },
]

export default function ViewSwitcher({ mode, onChange }) {
  const [collapsed, setCollapsed] = useState(false)

  return (
    <div className={`vs-bar ${collapsed ? 'vs-collapsed' : ''}`}>
      {collapsed ? (
        <button
          className="vs-expand-btn"
          onClick={() => setCollapsed(false)}
          aria-label="Show view switcher"
          title="View Switcher"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ width: 16, height: 16 }}>
            <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
            <line x1="8" y1="21" x2="16" y2="21" />
            <line x1="12" y1="17" x2="12" y2="21" />
          </svg>
        </button>
      ) : (
        <>
          <div className="vs-label">Preview</div>
          <div className="vs-divider" />
          {MODES.map(m => (
            <button
              key={m.id}
              className={`vs-btn ${mode === m.id ? 'vs-active' : ''}`}
              onClick={() => onChange(m.id)}
              aria-label={`Switch to ${m.label} view`}
              title={m.label}
            >
              <span className="vs-icon">{m.icon}</span>
              <span className="vs-text">{m.label}</span>
            </button>
          ))}
          <div className="vs-divider" />
          <button
            className="vs-collapse-btn"
            onClick={() => setCollapsed(true)}
            aria-label="Hide view switcher"
            title="Collapse"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: 12, height: 12 }}>
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </>
      )}
    </div>
  )
}
