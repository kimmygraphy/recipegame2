import { useEffect, useId, useRef, useState } from 'react'

const norm = (s) => (s || '').replace(/\s+/g, '').toLowerCase()

// 검색창이 달린 재료 선택 드롭다운
export default function IngredientPicker({ value, options, onChange, label }) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [hi, setHi] = useState(0)
  const wrap = useRef(null)
  const listRef = useRef(null)
  const listId = useId()

  const q = norm(query)
  const list = q ? options.filter((o) => norm(o).includes(q)) : options

  useEffect(() => {
    if (!open) return
    const close = (e) => wrap.current && !wrap.current.contains(e.target) && setOpen(false)
    document.addEventListener('pointerdown', close)
    return () => document.removeEventListener('pointerdown', close)
  }, [open])

  useEffect(() => setHi(0), [query])
  useEffect(() => {
    listRef.current?.children[hi]?.scrollIntoView({ block: 'nearest' })
  }, [hi])

  const choose = (v) => {
    onChange(v)
    setOpen(false)
    setQuery('')
  }

  const onKey = (e) => {
    if (e.key === 'ArrowDown') (e.preventDefault(), setHi((h) => Math.min(h + 1, list.length - 1)))
    else if (e.key === 'ArrowUp') (e.preventDefault(), setHi((h) => Math.max(h - 1, 0)))
    else if (e.key === 'Enter' && list[hi]) (e.preventDefault(), choose(list[hi]))
    else if (e.key === 'Escape') setOpen(false)
  }

  return (
    <div className="picker" ref={wrap}>
      <button
        type="button"
        className={`picker-btn ${value ? '' : 'is-empty'}`}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={label}
        onClick={() => setOpen((o) => !o)}
      >
        <span>{value || '재료'}</span>
      </button>

      {open && (
        <div className="picker-pop">
          <input
            type="search"
            autoFocus
            placeholder="재료 검색"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={onKey}
            role="combobox"
            aria-controls={listId}
            aria-expanded="true"
            aria-activedescendant={list[hi] ? `${listId}-${hi}` : undefined}
          />
          <ul className="picker-list" role="listbox" id={listId} ref={listRef}>
            {list.map((o, i) => (
              <li
                key={o}
                id={`${listId}-${i}`}
                role="option"
                aria-selected={o === value}
                className={`${i === hi ? 'is-hi' : ''} ${o === value ? 'is-sel' : ''}`}
                onPointerEnter={() => setHi(i)}
                onClick={() => choose(o)}
              >
                {o}
              </li>
            ))}
            {!list.length && <li className="picker-empty">없는 재료예요</li>}
          </ul>
        </div>
      )}
    </div>
  )
}
