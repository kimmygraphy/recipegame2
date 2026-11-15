import { useState } from 'react'
import { WEIGHTS, SIZE_MODES, groupOf, groupsOf, weightOf, sizeModeOf } from '../lib/settings'

const LABEL = { 0: '끄기', 1: '×1', 2: '×2', 3: '×3' }

export default function RangeScreen({ data, settings, onSave, onBack }) {
  const groups = groupsOf(data)
  const [weights, setWeights] = useState(() => Object.fromEntries(groups.map((g) => [g, weightOf(settings, g)])))
  const counts = {}
  data.menus.forEach((m) => (counts[groupOf(m)] = (counts[groupOf(m)] || 0) + 1))
  const [sizeMode, setSizeMode] = useState(() => sizeModeOf(settings).id)
  const total = groups.reduce((s, g) => s + weights[g], 0)
  const set = (g, w) => setWeights((prev) => ({ ...prev, [g]: w }))

  return (
    <div className="app range-screen">
      <header className="topbar">
        <h1>출제 범위</h1>
        <button className="link" onClick={onBack}>
          돌아가기
        </button>
      </header>

      <section className="intro">
        <p>그룹마다 얼마나 자주 나올지 골라요. ×2는 ×1보다 두 배 자주 나오고, 끈 그룹은 출제되지 않아요.</p>
      </section>

      <fieldset className="packaging range-group">
        <legend>
          사이즈
          <span className="range-meta">
            기본 사이즈는 메뉴의 가장 작은 사이즈예요 (보통 R, R이 없으면 L이나 M).
            {sizeMode === 'mostly' && ' 10%만 사이즈업으로 나와요.'}
          </span>
        </legend>
        <div className="chips">
          {SIZE_MODES.map((m) => (
            <label key={m.id} className={`chip ${sizeMode === m.id ? 'is-on' : ''}`}>
              <input type="radio" name="size-mode" checked={sizeMode === m.id} onChange={() => setSizeMode(m.id)} />
              {m.label}
            </label>
          ))}
        </div>
      </fieldset>

      {groups.map((g) => (
        <fieldset key={g} className="packaging range-group">
          <legend>
            {g}
            <span className="range-meta">
              메뉴 {counts[g] || 0}개{weights[g] > 0 && total > 0 && ` · 약 ${Math.round((weights[g] / total) * 100)}%`}
            </span>
          </legend>
          <div className="chips">
            {WEIGHTS.map((w) => (
              <label key={w} className={`chip ${weights[g] === w ? 'is-on' : ''}`}>
                <input type="radio" name={`w-${g}`} checked={weights[g] === w} onChange={() => set(g, w)} />
                {LABEL[w]}
              </label>
            ))}
          </div>
        </fieldset>
      ))}

      <div className="actions">
        {total === 0 && <p className="hint range-warn">그룹을 하나 이상 켜주세요.</p>}
        <button className="primary" disabled={total === 0} onClick={() => onSave({ weights, sizeMode })}>
          저장하고 새 주문 받기
        </button>
        <button className="secondary" onClick={() => setWeights(Object.fromEntries(groups.map((g) => [g, 1])))}>
          전부 ×1로 되돌리기
        </button>
      </div>
    </div>
  )
}
