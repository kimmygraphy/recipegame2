import { formatAmount } from './data.js'
import { isCheckIng, isCheckItem } from './checks.js'

export function amountMatches(unit, expected, row) {
  if (unit === 'T/t') {
    return Number(row.T || 0) === (expected?.T || 0) && Number(row.t || 0) === (expected?.t || 0)
  }
  if (row.amount === '' || row.amount == null) return false
  return Math.abs(Number(row.amount) - Number(expected)) < 1e-9
}

export function rowAmountText(unit, row) {
  if (unit === 'T/t') return formatAmount(unit, { T: Number(row.T || 0), t: Number(row.t || 0) })
  return row.amount === '' ? '' : formatAmount(unit, row.amount)
}

// 입력한 줄 중 채점에 들어가는 것: 재료를 골랐고, 체크 재료라면 체크를 풀지 않은 줄
const counts = (r, menu, checks) => r.ingredient && (!isCheckIng(r.ingredient, menu, checks) || r.checked !== false)

// 재료 채점: 순서 무관, 같은 재료가 여러 번 나오면(①②) 양이 맞는 것부터 짝지음
export function gradeCup(menu, size, rows, checks) {
  const expected = menu.items.filter((i) => i.gradeSizes.includes(size))
  const notGraded = menu.items.filter((i) => !i.gradeSizes.includes(size))
  const ignored = new Set(notGraded.map((i) => i.ingredient))
  const filled = rows.filter((r) => counts(r, menu, checks))

  const userBy = {}
  filled.forEach((r) => (userBy[r.ingredient] ||= []).push(r))
  const expBy = {}
  expected.forEach((e) => (expBy[e.ingredient] ||= []).push(e))

  const results = []
  const extras = []
  for (const [ing, exps] of Object.entries(expBy)) {
    const pool = [...(userBy[ing] || [])]
    const pairs = exps.map((e) => ({ e, row: null, check: isCheckItem(e, menu, checks) }))
    pairs.forEach((p) => {
      if (p.check) return
      const i = pool.findIndex((r) => amountMatches(p.e.unit, p.e.amounts[size], r))
      if (i >= 0) p.row = pool.splice(i, 1)[0]
    })
    pairs.forEach((p) => {
      if (!p.row && pool.length) p.row = pool.shift()
    })
    pool.forEach((r) => extras.push(r))

    pairs.forEach(({ e, row, check }) => {
      if (!row) return results.push({ item: e, row: null, check, issues: ['missing'] })
      const issues = []
      if (!check && !amountMatches(e.unit, e.amounts[size], row)) issues.push('amount')
      results.push({ item: e, row, check, issues })
    })
  }
  filled.forEach((r) => {
    if (!expBy[r.ingredient] && !ignored.has(r.ingredient)) extras.push(r)
  })
  const ok = results.every((r) => r.issues.length === 0) && extras.length === 0
  return { results, extras, notGraded, ok }
}

export function gradeOrder(order, inputs, menusById, checks) {
  const cups = order.cups.map((c, i) => {
    const menu = menusById[c.menuId]
    const recipe = gradeCup(menu, c.size, inputs[i].rows, checks)
    return { menu, size: c.size, recipe, ok: recipe.ok }
  })
  return { cups, okCount: cups.filter((c) => c.ok).length }
}
