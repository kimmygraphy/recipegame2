import { useEffect, useMemo, useState } from 'react'
import IngredientPicker from './IngredientPicker'
import { sizeLabel } from '../lib/order'
import { SIZE_OPTIONS, UNIT_OPTIONS, draftToMenu, menuToDraft, emptyDraft, addIngredient } from '../lib/edit'

let rowSeq = 0
const blankRow = () => ({ key: `n${rowSeq++}`, ingredient: '', unit: 'g', amounts: {}, presenceOnly: false, grade: 'all', keepSizes: [], ref: '' })

// 메뉴 추가·수정 화면
export default function MenuEditor({ data, menu, defaultGroup, onSave, onDelete, onDataChange, onCancel }) {
  const [d, setD] = useState(() => (menu ? menuToDraft(menu) : { ...emptyDraft(defaultGroup), rows: [blankRow()] }))
  const [errors, setErrors] = useState([])
  const [newIng, setNewIng] = useState('')
  const [ingMsg, setIngMsg] = useState('')

  const names = useMemo(() => data.ingredients.map((i) => i.name).sort((a, b) => a.localeCompare(b, 'ko')), [data])
  const unitGuess = useMemo(() => {
    const u = {}
    data.menus.forEach((m) => m.items.forEach((it) => (u[it.ingredient] ||= it.unit)))
    return u
  }, [data])
  const groups = useMemo(() => [...new Set([...(data.groups || []), ...data.menus.map((m) => m.group), '기타 음료'])], [data])

  useEffect(() => window.scrollTo(0, 0), [])

  const set = (patch) => setD((p) => ({ ...p, ...patch }))
  const setRow = (key, patch) => setD((p) => ({ ...p, rows: p.rows.map((r) => (r.key === key ? { ...r, ...patch } : r)) }))
  const move = (i, dir) =>
    setD((p) => {
      const rows = [...p.rows]
      const j = i + dir
      if (j < 0 || j >= rows.length) return p
      ;[rows[i], rows[j]] = [rows[j], rows[i]]
      return { ...p, rows }
    })
  const toggleSize = (s) => set({ sizes: d.sizes.includes(s) ? d.sizes.filter((x) => x !== s) : SIZE_OPTIONS.filter((x) => x === s || d.sizes.includes(x)) })

  function save() {
    const res = draftToMenu(d)
    if (res.errors) {
      setErrors(res.errors)
      window.scrollTo({ top: 0, behavior: 'smooth' })
      return
    }
    onSave(res.menu)
  }

  function quickAddIngredient() {
    const res = addIngredient(data, newIng)
    if (res.error) return setIngMsg(res.error)
    onDataChange(res.data)
    setIngMsg(`"${newIng.trim()}" 추가했어요. 재료 칸에서 고를 수 있어요.`)
    setNewIng('')
  }

  return (
    <div className="app editor">
      <header className="topbar">
        <h1>{menu ? '메뉴 수정' : '새 메뉴'}</h1>
        <button className="link" onClick={onCancel}>
          취소
        </button>
      </header>

      {errors.length > 0 && (
        <div className="errors" role="alert">
          <strong>저장하기 전에 고쳐주세요</strong>
          <ul>
            {errors.slice(0, 8).map((e) => (
              <li key={e}>{e}</li>
            ))}
          </ul>
        </div>
      )}

      <section className="ed-card">
        <label className="ed-field">
          <span>메뉴 이름</span>
          <input value={d.name} onChange={(e) => set({ name: e.target.value })} placeholder="예: 아이스 윈터 뱅쇼" />
        </label>

        <div className="ed-field">
          <span>온도</span>
          <div className="chips">
            {['HOT', 'ICE'].map((t) => (
              <label key={t} className={`chip ${d.temp === t ? 'is-on' : ''}`}>
                <input type="radio" name="temp" checked={d.temp === t} onChange={() => set({ temp: t })} />
                {t}
              </label>
            ))}
          </div>
        </div>

        <div className="ed-field">
          <span>사이즈</span>
          <div className="chips">
            {SIZE_OPTIONS.map((s) => (
              <label key={s} className={`chip ${d.sizes.includes(s) ? 'is-on' : ''}`}>
                <input type="checkbox" checked={d.sizes.includes(s)} onChange={() => toggleSize(s)} />
                {sizeLabel(s)}
              </label>
            ))}
          </div>
        </div>

        <label className="ed-field">
          <span>출제 그룹</span>
          <input list="ed-groups" value={d.group} onChange={(e) => set({ group: e.target.value })} />
          <datalist id="ed-groups">
            {groups.map((g) => (
              <option key={g} value={g} />
            ))}
          </datalist>
        </label>

        <div className="ed-checks">
          <label>
            <input type="checkbox" checked={d.isBlended} onChange={(e) => set({ isBlended: e.target.checked })} />
            블렌딩 음료 (쉐이크·프라페·주스)
          </label>
          <label>
            <input type="checkbox" checked={d.isCoffee} onChange={(e) => set({ isCoffee: e.target.checked })} />
            커피 음료
          </label>
        </div>

        <label className="ed-field">
          <span>메뉴 메모 (선택)</span>
          <input value={d.note} onChange={(e) => set({ note: e.target.value })} placeholder="예: 2026 홀리데이 카드 기준" />
        </label>
      </section>

      <h2 className="ed-h2">재료</h2>
      {d.rows.map((r, i) => (
        <section key={r.key} className="ed-card ed-row">
          <div className="ed-row-head">
            <span className="cup-index">{i + 1}</span>
            <IngredientPicker
              label={`${i + 1}번째 재료`}
              value={r.ingredient}
              options={names}
              onChange={(v) => setRow(r.key, { ingredient: v, unit: r.ingredient ? r.unit : unitGuess[v] || r.unit })}
            />
            <div className="ed-row-tools">
              <button aria-label="위로" onClick={() => move(i, -1)} disabled={i === 0}>
                ↑
              </button>
              <button aria-label="아래로" onClick={() => move(i, 1)} disabled={i === d.rows.length - 1}>
                ↓
              </button>
              <button aria-label="재료 줄 삭제" className="danger" onClick={() => set({ rows: d.rows.filter((x) => x.key !== r.key) })}>
                ×
              </button>
            </div>
          </div>

          <div className="ed-amounts">
            <label className="ed-unit">
              <span>단위</span>
              <select value={r.unit} onChange={(e) => setRow(r.key, { unit: e.target.value })}>
                {UNIT_OPTIONS.map((u) => (
                  <option key={u} value={u}>
                    {u === '-' ? '양 없음' : u}
                  </option>
                ))}
              </select>
            </label>
            {r.unit !== '-' &&
              d.sizes.map((s) => (
                <label key={s} className="ed-amt">
                  <span>{sizeLabel(s)}</span>
                  <input
                    inputMode={r.unit === 'T/t' ? 'text' : 'decimal'}
                    placeholder={r.unit === 'T/t' ? '2T 1t' : ''}
                    value={r.amounts[s] ?? ''}
                    onChange={(e) => setRow(r.key, { amounts: { ...r.amounts, [s]: e.target.value } })}
                  />
                </label>
              ))}
          </div>

          <div className="ed-checks">
            <label>
              <input type="checkbox" checked={r.presenceOnly} onChange={(e) => setRow(r.key, { presenceOnly: e.target.checked })} />
              이 메뉴에서는 넣었는지만 채점
            </label>
            <label>
              <input
                type="checkbox"
                checked={r.grade === 'none'}
                onChange={(e) => setRow(r.key, { grade: e.target.checked ? 'none' : 'all' })}
              />
              채점 안 함 (정답 보기에만 표시)
            </label>
            {r.grade === 'keep' && <span className="hint">{r.keepSizes.map(sizeLabel).join('·')} 사이즈만 채점 중</span>}
          </div>

          <label className="ed-field">
            <span>참고 (선택)</span>
            <input value={r.ref} onChange={(e) => setRow(r.key, { ref: e.target.value })} placeholder="예: 토핑, 1/2EA" />
          </label>
        </section>
      ))}
      <button className="add-row" onClick={() => set({ rows: [...d.rows, blankRow()] })}>
        재료 줄 추가
      </button>

      <section className="ed-card ed-newing">
        <span className="hint">목록에 없는 재료는 여기서 먼저 만들어요</span>
        <div className="ed-inline">
          <input value={newIng} onChange={(e) => setNewIng(e.target.value)} placeholder="새 재료 이름" aria-label="새 재료 이름" />
          <button className="secondary" disabled={!newIng.trim()} onClick={quickAddIngredient}>
            재료 만들기
          </button>
        </div>
        {ingMsg && <p className="hint">{ingMsg}</p>}
      </section>

      <div className="actions">
        <button className="primary" onClick={save}>
          저장
        </button>
        {menu && (
          <button className="secondary danger-text" onClick={() => window.confirm(`"${menu.name}"을 지울까요?`) && onDelete(menu.id)}>
            이 메뉴 삭제
          </button>
        )}
      </div>
    </div>
  )
}
