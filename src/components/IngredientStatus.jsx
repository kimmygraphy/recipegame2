import { useMemo, useState } from 'react'
import { addIngredient, deleteIngredient } from '../lib/edit'

const norm = (s) => (s || '').replace(/\s+/g, '').toLowerCase()

// 재료 현황: 재료별로 쓰는 메뉴를 보고, '체크로 채점'을 켜고 끔
export default function IngredientStatus({ data, checks, onChange, onReset, onDataChange, onRename }) {
  const [query, setQuery] = useState('')
  const [newName, setNewName] = useState('')
  const [rename, setRename] = useState('')
  const [msg, setMsg] = useState({})
  const [onlyChecked, setOnlyChecked] = useState(false)
  const [open, setOpen] = useState(null)

  const rows = useMemo(() => {
    const used = {}
    const units = {}
    const inBlend = new Set()
    data.menus.forEach((m) =>
      m.items.forEach((it) => {
        ;(used[it.ingredient] ||= new Set()).add(m.name)
        if (it.unit !== '-') (units[it.ingredient] ||= new Set()).add(it.unit)
        if (m.isBlended) inBlend.add(it.ingredient)
      })
    )
    return data.ingredients
      .map((i) => ({
        name: i.name,
        menus: [...(used[i.name] || [])],
        units: [...(units[i.name] || [])],
        inBlend: inBlend.has(i.name),
      }))
      .sort((a, b) => a.name.localeCompare(b.name, 'ko'))
  }, [data])

  const q = norm(query)
  const list = rows.filter((r) => (!q || norm(r.name).includes(q)) && (!onlyChecked || checks.check.has(r.name)))

  const toggle = (key, name) => {
    const next = { check: new Set(checks.check), blend: new Set(checks.blend) }
    next[key].has(name) ? next[key].delete(name) : next[key].add(name)
    onChange(next)
  }

  return (
    <section className="ing-status">
      <p className="hint ing-intro">
        체크한 재료는 퀴즈에서 양 대신 <strong>넣었는지만</strong> 채점해요. 이 기기에만 저장돼요.
      </p>
      <div className="book-controls">
        <input type="search" placeholder="재료 이름으로 검색" value={query} onChange={(e) => setQuery(e.target.value)} aria-label="재료 검색" />
        <div className="chips">
          <label className={`chip ${!onlyChecked ? 'is-on' : ''}`}>
            <input type="radio" name="ing-filter" checked={!onlyChecked} onChange={() => setOnlyChecked(false)} />
            전체 {rows.length}
          </label>
          <label className={`chip ${onlyChecked ? 'is-on' : ''}`}>
            <input type="radio" name="ing-filter" checked={onlyChecked} onChange={() => setOnlyChecked(true)} />
            체크 재료 {checks.check.size}
          </label>
        </div>
      </div>

      <div className="ed-inline ing-add">
        <input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="새 재료 이름" aria-label="새 재료 이름" />
        <button
          className="secondary"
          disabled={!newName.trim()}
          onClick={() => {
            const res = addIngredient(data, newName)
            if (res.error) return setMsg({ add: res.error })
            onDataChange(res.data)
            setMsg({ add: `"${newName.trim()}" 추가했어요.` })
            setNewName('')
          }}
        >
          재료 추가
        </button>
      </div>
      {msg.add && <p className="hint ing-msg">{msg.add}</p>}

      {!list.length && <p className="book-empty">찾는 재료가 없어요.</p>}
      <ul className="ing-list">
        {list.map((r) => {
          const on = checks.check.has(r.name)
          return (
            <li key={r.name} className="ing-row">
              <label className="ing-check">
                <input type="checkbox" checked={on} onChange={() => toggle('check', r.name)} aria-label={`${r.name} 체크로 채점`} />
              </label>
              <div className="ing-main">
                <button className="ing-name" aria-expanded={open === r.name} onClick={() => {
                    setOpen(open === r.name ? null : r.name)
                    setRename(r.name)
                    setMsg({})
                  }}>
                  <span className="book-name">{r.name}</span>
                  <span className="book-sizes">
                    {r.units.join(', ') || '양 없음'} · 메뉴 {r.menus.length}개
                  </span>
                  {open === r.name && <span className="ing-menus">{r.menus.join(', ') || '쓰는 메뉴 없음'}</span>}
                </button>
                {open === r.name && (
                  <div className="ing-edit">
                    <div className="ed-inline">
                      <input value={rename} onChange={(e) => setRename(e.target.value)} aria-label="재료 이름 바꾸기" />
                      <button
                        className="secondary"
                        disabled={!rename.trim() || rename.trim() === r.name}
                        onClick={() => {
                          const err = onRename(r.name, rename)
                          if (err) return setMsg({ [r.name]: err })
                          setOpen(rename.trim())
                          setMsg({ [rename.trim()]: '이름을 바꿨어요. 이 재료를 쓰는 레시피에도 모두 반영됐어요.' })
                        }}
                      >
                        이름 바꾸기
                      </button>
                    </div>
                    <button
                      className="link danger-text"
                      onClick={() => {
                        const res = deleteIngredient(data, r.name)
                        if (res.error) return setMsg({ [r.name]: res.error })
                        if (window.confirm(`"${r.name}"을 재료 목록에서 지울까요?`)) onDataChange(res.data)
                      }}
                    >
                      재료 삭제
                    </button>
                    {msg[r.name] && <p className="hint">{msg[r.name]}</p>}
                  </div>
                )}
                {on && r.inBlend && (
                  <label className="ing-blend">
                    <input type="checkbox" checked={checks.blend.has(r.name)} onChange={() => toggle('blend', r.name)} />
                    쉐이크·프라페는 양까지 채점
                  </label>
                )}
              </div>
            </li>
          )
        })}
      </ul>

      <div className="actions">
        <button className="secondary" onClick={() => window.confirm('체크 재료를 기본값으로 되돌릴까요?') && onReset()}>
          기본값으로 되돌리기
        </button>
      </div>
    </section>
  )
}
