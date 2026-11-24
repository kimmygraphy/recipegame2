// '체크로 채점'할 재료 설정 — 이 기기 브라우저에만 저장
//  check: 양 대신 넣었는지만 보는 재료
//  blend: 체크 재료라도 쉐이크·프라페 같은 블렌딩 음료에서는 양까지 채점할 재료
const KEY = 'recipe-trainer:check-ingredients:v1'
const BLEND_KEY = 'recipe-trainer:blend-exact:v1'
const BLEND_DEFAULT = ['얼음']

function read(key) {
  try {
    const v = JSON.parse(localStorage.getItem(key))
    return Array.isArray(v) ? v : null
  } catch {
    return null
  }
}

export function loadChecks(data) {
  return {
    check: new Set(read(KEY) || data?.checkDefaults || []),
    blend: new Set(read(BLEND_KEY) || data?.blendExactDefaults || BLEND_DEFAULT),
  }
}

export function saveChecks(c) {
  try {
    localStorage.setItem(KEY, JSON.stringify([...c.check]))
    localStorage.setItem(BLEND_KEY, JSON.stringify([...c.blend]))
  } catch {
    /* 저장 실패해도 이번 세션에서는 적용 */
  }
}

export function resetChecks() {
  try {
    localStorage.removeItem(KEY)
    localStorage.removeItem(BLEND_KEY)
  } catch {}
}

// 이 메뉴에서 이 재료를 체크로 채점하는지
export const isCheckIng = (name, menu, c) => c.check.has(name) && !(menu?.isBlended && c.blend.has(name))
// 레시피 줄 단위: 양 표기가 없는 줄은 항상 체크
export const isCheckItem = (item, menu, c) => item.presenceOnly || isCheckIng(item.ingredient, menu, c)
// 입력 줄 단위: 재료 설정상 체크이거나, 이 메뉴 레시피에서 '넣었는지만' 보는 재료
//  같은 재료가 '양 채점 줄'과 '넣음만 줄'로 섞여 있으면(예: 얼음①140g + 얼음② 넣음) 양 칸을 보여주고,
//  양을 비운 줄을 '넣음'으로 채점함
export const isCheckRow = (name, menu, c) => {
  if (isCheckIng(name, menu, c)) return true
  const same = menu?.items.filter((i) => i.ingredient === name) || []
  return same.length > 0 && same.every((i) => i.presenceOnly)
}
