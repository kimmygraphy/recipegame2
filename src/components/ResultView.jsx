import { formatAmount } from '../lib/data'
import { rowAmountText } from '../lib/grade'
import { sizeLabel } from '../lib/order'

const ISSUE = { missing: '빠짐', amount: '양 틀림' }
const amountText = (item, size) => formatAmount(item.unit, item.amounts[size])

export default function ResultView({ result, onRetry, onNext }) {
  const total = result.cups.length
  const allOk = result.okCount === total

  return (
    <section className="results">
      <p className={`score ${allOk ? 'ok' : ''}`}>
        {total}잔 중 <strong>{result.okCount}잔</strong> 정답
      </p>

      {result.cups.map((c, i) => (
        <article key={i} id={`cup-result-${i}`} className={`cup-result ${c.ok ? 'ok' : 'bad'}`}>
          <h3>
            {i + 1}. {c.menu.name} <span className="size-pill">{sizeLabel(c.size)}</span>
          </h3>
          <table>
            <thead>
              <tr>
                <th>재료</th>
                <th>내 답</th>
                <th>정답</th>
              </tr>
            </thead>
            <tbody>
              {c.recipe.results.map(({ item, row, check, issues }, j) => (
                <tr key={j} className={issues.length ? 'bad' : 'ok'}>
                  <td>
                    {item.label}
                    {issues.length > 0 && <span className="issues">{issues.map((x) => ISSUE[x]).join(', ')}</span>}
                  </td>
                  <td>
                    {!row ? (
                      <span className="issue-text">입력 안 함</span>
                    ) : check ? (
                      <span>넣음</span>
                    ) : (
                      <span className={issues.includes('amount') ? 'wrong' : ''}>
                        {rowAmountText(item.unit, row) || '양 없음'}
                      </span>
                    )}
                  </td>
                  <td>
                    <span>{check ? '넣기' : amountText(item, c.size)}</span>
                    {check && amountText(item, c.size) && <span className="ref">{amountText(item, c.size)}</span>}
                    {item.ref && <span className="ref">{item.ref}</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {c.recipe.extras.length > 0 && (
            <p className="extras">불필요한 재료: {c.recipe.extras.map((r) => r.ingredient).join(', ')}</p>
          )}
          {c.recipe.notGraded.length > 0 && (
            <p className="not-graded">
              채점 안 함:{' '}
              {c.recipe.notGraded
                .map((it) => `${it.label} ${amountText(it, c.size)}${it.ref ? ` (${it.ref})` : ''}`)
                .join(', ')}
            </p>
          )}
          {c.menu.note && <p className="note">{c.menu.note}</p>}
        </article>
      ))}

      <div className="actions">
        <button className="primary" onClick={onNext}>
          다음 주문 받기
        </button>
        <button className="secondary" onClick={onRetry}>
          고쳐서 다시 채점
        </button>
      </div>
    </section>
  )
}
