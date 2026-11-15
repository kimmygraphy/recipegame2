// '체크로 채점'할 재료 목록 — 양 대신 넣었는지만 봄. 이 기기 브라우저에만 저장
const KEY = 'recipe-trainer:check-ingredients:v1'

export function loadChecks(data) {
  try {
    const saved = JSON.parse(localStorage.getItem(KEY))
    if (Array.isArray(saved)) return new Set(saved)
  } catch {
    /* 저장된 값이 없거나 깨졌으면 기본값 */
  }
  return new Set(data?.checkDefaults || [])
}

export function saveChecks(set) {
  try {
    localStorage.setItem(KEY, JSON.stringify([...set]))
  } catch {
    /* 저장 실패해도 이번 세션에서는 적용 */
  }
}

export function resetChecks() {
  try {
    localStorage.removeItem(KEY)
  } catch {}
}

// 이 레시피 줄을 체크로 채점하는지: 양 표기가 없는 줄이거나, 체크 재료로 지정된 경우
export const isCheckItem = (item, checks) => item.presenceOnly || checks.has(item.ingredient)
