import { useState, useRef, useEffect } from 'react'
import { BIBLE_VERSIONS, BIBLE_SERVABLE } from '../constants'

const CATS = ['All', 'English', 'Hebrew', 'Greek', 'Jewish', 'Latin', 'European Languages', 'African Languages', 'Asian Languages']

const SERVABLE = new Set(BIBLE_SERVABLE)

export default function VersionSelector({ currentVersion, onSelect }) {
  const [isOpen, setIsOpen] = useState(false)
  const [cat, setCat] = useState('All')
  const wrapRef = useRef(null)

  const current = BIBLE_VERSIONS.find(function (v) { return SERVABLE.has(v.id) && v.id === currentVersion }) || { id: currentVersion, name: currentVersion }

  const SERVABLE_VERSIONS = BIBLE_VERSIONS.filter(function (v) { return SERVABLE.has(v.id) })

  var versions
  if (cat === 'All') {
    versions = SERVABLE_VERSIONS
  } else {
    versions = SERVABLE_VERSIONS.filter(function (v) { return v.category === cat })
  }

  useEffect(function () {
    if (!isOpen) return
    function handleDown(e) {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) {
        setIsOpen(false)
      }
    }
    function handleKey(e) {
      if (e.key === 'Escape') setIsOpen(false)
    }
    document.addEventListener('mousedown', handleDown)
    document.addEventListener('keydown', handleKey)
    return function () {
      document.removeEventListener('mousedown', handleDown)
      document.removeEventListener('keydown', handleKey)
    }
  }, [isOpen])

  function toggleOpen() {
    setIsOpen(function (prev) { return !prev })
  }

  function pickVersion(id) {
    onSelect(id)
    setIsOpen(false)
    setCat('All')
  }

  function handleCatClick(c) {
    setCat(c)
  }

  var arrowClass = isOpen ? 'ts-btn-arrow open' : 'ts-btn-arrow'

  return (
    <div className="ts-wrap" ref={wrapRef}>
      <button className="ts-btn" onClick={toggleOpen} type="button">
        <span className="ts-btn-label">Translation</span>
        <span className="ts-btn-id">{current.id}</span>
        <span className="ts-btn-name">{current.name}</span>
        <span className={arrowClass}>
          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
        </span>
      </button>

      {isOpen && (
        <div className="ts-dropdown">
          <div className="ts-cats">
            {CATS.map(function (c) {
              var count = c === 'All' ? SERVABLE_VERSIONS.length : SERVABLE_VERSIONS.filter(function (v) { return v.category === c }).length
              if (c !== 'All' && count === 0) return null
              var cls = cat === c ? 'ts-cat active' : 'ts-cat'
              return (
                <button
                  key={c}
                  className={cls}
                  onClick={function () { handleCatClick(c) }}
                  type="button"
                >
                  {c}
                </button>
              )
            })}
          </div>

          <div className="ts-list">
            {versions.map(function (v) {
              var cls = v.id === currentVersion ? 'ts-item current' : 'ts-item'
              return (
                <button
                  key={v.id}
                  className={cls}
                  onClick={function () { pickVersion(v.id) }}
                  type="button"
                >
                  <span className="ts-item-id">{v.id}</span>
                  <span className="ts-item-name">{v.name}</span>
                </button>
              )
            })}
          </div>

          <div className="ts-footer">
            {versions.length} translations
          </div>
        </div>
      )}
    </div>
  )
}
