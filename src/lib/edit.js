// 앱 안에서 레시피·재료를 고치는 함수들 (원본 데이터는 건드리지 않고 새 객체를 돌려줌)
import { validateData } from './data.js'

export const SIZE_OPTIONS = ['R', 'L', 'M', 'single', 'double']
export const UNIT_OPTIONS = ['g', 'pump', 'shot', 'ea', 'T/t', '줄기', '-']
const CIRCLED = '①②③④⑤⑥⑦⑧⑨'

export const newMenuId = () => `U${Date.now().toString(36)}`

// "2T 1t" ↔ { T: 2, t: 1 }
export function parseSpoon(text) {
  const s = String(text || '')
  const T = Number(s.match(/(\d+)\s*T/)?.[1] || 0)
  const t = Number(s.match(/(\d+)\s*t/)?.[1] || 0)
  return T || t ? { T, t } : null
}
export const spoonText = (v) => (v ? [v.T ? `${v.T}T` : '', v.t ? `${v.t}t` : ''].filter(Boolean).join(' ') : '')

// 저장된 메뉴 → 편집용 초안
export function menuToDraft(m) {
  return {
    id: m.id,
    name: m.name,
    code: m.code || '',
    category: m.category || '',
    temp: m.temp,
    isCoffee: !!m.isCoffee,
    isBlended: !!m.isBlended,
    sizes: [...m.sizes],
    group: m.group || '기타 음료',
    note: m.note || '',
    rows: m.items.map((it, i) => ({
      key: `r${i}`,
      ingredient: it.ingredient,
      unit: it.unit,
      amounts: Object.fromEntries(
        Object.entries(it.amounts || {}).map(([s, v]) => [s, it.unit === 'T/t' ? spoonText(v) : String(v)])
      ),
      presenceOnly: !!it.presenceOnly,
      // 채점: all = 모든 사이즈, none = 안 함, keep = 원래 일부 사이즈만(그대로 유지)
      grade: !it.gradeSizes.length ? 'none' : it.gradeSizes.length === m.sizes.length ? 'all' : 'keep',
      keepSizes: it.gradeSizes,
      ref: it.ref || '',
    })),
  }
}

export function emptyDraft(group) {
  return {
    id: newMenuId(),
    name: '',
    code: '',
    category: '',
    temp: 'ICE',
    isCoffee: false,
    isBlended: false,
    sizes: ['R', 'L', 'M'],
    group: group || '기타 음료',
    note: '',
    rows: [],
  }
}

// 편집용 초안 → 저장 형식. 문제가 있으면 { errors }
export function draftToMenu(d) {
  const errors = []
  if (!d.name.trim()) errors.push('메뉴 이름을 적어주세요.')
  if (!d.sizes.length) errors.push('사이즈를 하나 이상 골라주세요.')
  const rows = d.rows.filter((r) => r.ingredient)
  if (!rows.length) errors.push('재료를 하나 이상 넣어주세요.')

  const total = {}
  rows.forEach((r) => (total[r.ingredient] = (total[r.ingredient] || 0) + 1))
  const seen = {}
  const items = rows.map((r) => {
    seen[r.ingredient] = (seen[r.ingredient] || 0) + 1
    const label = total[r.ingredient] > 1 ? `${r.ingredient}${CIRCLED[seen[r.ingredient] - 1] || seen[r.ingredient]}` : r.ingredient
    const amounts = {}
    for (const s of d.sizes) {
      const raw = (r.amounts[s] ?? '').toString().trim()
      if (!raw || r.unit === '-') continue
      if (r.unit === 'T/t') {
        const v = parseSpoon(raw)
        if (v) amounts[s] = v
        else errors.push(`${label} ${s}: "2T 1t"처럼 적어주세요.`)
      } else {
        const n = Number(raw.replace('1/2', '0.5'))
        if (Number.isFinite(n)) amounts[s] = n
        else errors.push(`${label} ${s}: 숫자만 적어주세요.`)
      }
    }
    const presenceOnly = r.unit === '-' || r.presenceOnly || !Object.keys(amounts).length
    if (!presenceOnly && Object.keys(amounts).length < d.sizes.length && r.grade === 'all') {
      errors.push(`${label}: 양이 빠진 사이즈가 있어요.`)
    }
    const gradeSizes =
      r.grade === 'none' ? [] : r.grade === 'keep' ? r.keepSizes.filter((s) => d.sizes.includes(s)) : [...d.sizes]
    return { label, ingredient: r.ingredient, unit: r.unit, amounts, gradeSizes, presenceOnly, ref: r.ref.trim() }
  })
  if (errors.length) return { errors }
  return {
    menu: {
      id: d.id,
      name: d.name.trim(),
      code: d.code.trim(),
      category: d.category || (d.temp === 'HOT' ? 'HOT' : 'ICE'),
      temp: d.temp,
      isCoffee: d.isCoffee,
      isBlended: d.isBlended,
      sizes: SIZE_OPTIONS.filter((s) => d.sizes.includes(s)),
      note: d.note.trim(),
      group: d.group.trim() || '기타 음료',
      items,
    },
  }
}

const stamp = (d) => ({ ...d, editedAt: new Date().toISOString() })
function withGroups(d) {
  const groups = [...(d.groups || [])]
  d.menus.forEach((m) => m.group && !groups.includes(m.group) && groups.push(m.group))
  return { ...d, groups: groups.filter((g) => d.menus.some((m) => m.group === g)) }
}

export function upsertMenu(data, menu) {
  const exists = data.menus.some((m) => m.id === menu.id)
  const menus = exists ? data.menus.map((m) => (m.id === menu.id ? menu : m)) : [...data.menus, menu]
  return stamp(withGroups({ ...data, menus }))
}

export function deleteMenu(data, id) {
  return stamp(withGroups({ ...data, menus: data.menus.filter((m) => m.id !== id) }))
}

export function usageOf(data, name) {
  return data.menus.filter((m) => m.items.some((i) => i.ingredient === name)).map((m) => m.name)
}

export function addIngredient(data, name) {
  const n = name.trim()
  if (!n) return { error: '재료 이름을 적어주세요.' }
  if (data.ingredients.some((i) => i.name === n)) return { error: '이미 있는 재료예요.' }
  return { data: stamp({ ...data, ingredients: [...data.ingredients, { name: n }] }) }
}

// 이름을 바꾸면 그 재료를 쓰는 모든 레시피 줄도 같이 바뀜
export function renameIngredient(data, from, to) {
  const n = to.trim()
  if (!n) return { error: '재료 이름을 적어주세요.' }
  if (n === from) return { data }
  if (data.ingredients.some((i) => i.name === n)) return { error: '이미 있는 재료 이름이에요.' }
  const menus = data.menus.map((m) => ({
    ...m,
    items: m.items.map((it) =>
      it.ingredient === from ? { ...it, ingredient: n, label: n + it.label.slice(from.length) } : it
    ),
  }))
  return {
    data: stamp({
      ...data,
      menus,
      ingredients: data.ingredients.map((i) => (i.name === from ? { ...i, name: n } : i)),
      checkDefaults: (data.checkDefaults || []).map((x) => (x === from ? n : x)),
    }),
  }
}

export function deleteIngredient(data, name) {
  const used = usageOf(data, name)
  if (used.length) return { error: `${used.length}개 메뉴에서 쓰고 있어서 지울 수 없어요: ${used.slice(0, 3).join(', ')}${used.length > 3 ? ' 외' : ''}` }
  return {
    data: stamp({
      ...data,
      ingredients: data.ingredients.filter((i) => i.name !== name),
      checkDefaults: (data.checkDefaults || []).filter((x) => x !== name),
    }),
  }
}

export function downloadJson(data) {
  const { _source, ...clean } = data // eslint-disable-line no-unused-vars
  const errs = validateData(clean)
  if (errs.length) return errs
  const blob = new Blob([JSON.stringify(clean, null, 1)], { type: 'application/json' })
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = 'recipes.json'
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(a.href), 1000)
  return []
}
