import { useMemo } from 'react'
import { unitFor } from '../lib/data'
import { newRow, sizeLabel } from '../lib/order'

export default function CupForm({ data, checks, index, menu, cup, input, onChange }) {
  const names = useMemo(() => data.ingredients.map((i) => i.name).sort((a, b) => a.localeCompare(b, 'ko')), [data])
  const rows = input.rows
  const setRow = (key, patch) => onChange({ rows: rows.map((r) => (r.key === key ? { ...r, ...patch } : r)) })
  const removeRow = (key) => {
    const next = rows.filter((r) => r.key !== key)
    onChange({ rows: next.length ? next : [newRow()] })
  }

  return (
    <section className="cup-form" aria-label={`${index + 1}번 잔 입력`}>
      <h2>
        <span className="cup-index">{index + 1}번 잔</span>
        {menu.name} <span className="size-pill">{sizeLabel(cup.size)}</span>
      </h2>

      <div className="rows">
        {rows.map((r, i) => {
          const unit = r.ingredient ? unitFor(data, r.ingredient, menu) : null
          const check = r.ingredient && (checks.has(r.ingredient) || unit === '-')
          return (
            <div className="row" key={r.key}>
              <select
                aria-label={`${i + 1}번째 재료`}
                value={r.ingredient}
                onChange={(e) => setRow(r.key, { ingredient: e.target.value, checked: true })}
              >
                <option value="">재료</option>
                {names.map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
              <div className="amount">
                {check ? (
                  <label className="check-in">
                    <input
                      type="checkbox"
                      checked={r.checked !== false}
                      onChange={(e) => setRow(r.key, { checked: e.target.checked })}
                    />
                    넣음
                  </label>
                ) : unit === 'T/t' ? (
                  <>
                    <input
                      inputMode="numeric"
                      aria-label="큰술"
                      value={r.T}
                      onChange={(e) => setRow(r.key, { T: e.target.value.replace(/[^0-9]/g, '') })}
                    />
                    <span className="unit">T</span>
                    <input
                      inputMode="numeric"
                      aria-label="작은술"
                      value={r.t}
                      onChange={(e) => setRow(r.key, { t: e.target.value.replace(/[^0-9]/g, '') })}
                    />
                    <span className="unit">t</span>
                  </>
                ) : (
                  <>
                    <input
                      inputMode="decimal"
                      aria-label="양"
                      placeholder="양"
                      value={r.amount}
                      disabled={!unit}
                      onChange={(e) => setRow(r.key, { amount: e.target.value.replace(/[^0-9.]/g, '') })}
                    />
                    <span className="unit">{unit || ''}</span>
                  </>
                )}
              </div>
              <button className="remove" aria-label={`${i + 1}번째 재료 삭제`} onClick={() => removeRow(r.key)}>
                ×
              </button>
            </div>
          )
        })}
      </div>
      <button className="add-row" onClick={() => onChange({ rows: [...rows, newRow()] })}>
        재료 추가
      </button>
    </section>
  )
}
