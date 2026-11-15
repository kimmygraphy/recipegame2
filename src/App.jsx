import { useEffect, useMemo, useState } from 'react'
import { loadData, saveData, clearData } from './lib/data'
import { makeOrder, newCupInput } from './lib/order'
import { loadSettings, saveSettings } from './lib/settings'
import { gradeOrder } from './lib/grade'
import { loadChecks, saveChecks, resetChecks } from './lib/checks'
import DataScreen from './components/DataScreen'
import Ticket from './components/Ticket'
import CupForm from './components/CupForm'
import ResultView from './components/ResultView'
import RangeScreen from './components/RangeScreen'
import RecipeBook from './components/RecipeBook'

export default function App() {
  const [data, setData] = useState(() => loadData())
  const [showData, setShowData] = useState(false)
  const [settings, setSettings] = useState(() => loadSettings())
  const [showRange, setShowRange] = useState(false)
  const [showBook, setShowBook] = useState(false)
  const [order, setOrder] = useState(null)
  const [inputs, setInputs] = useState([])
  const [checks, setChecks] = useState(() => loadChecks(loadData()))
  const [active, setActive] = useState(0)
  const [result, setResult] = useState(null)

  const menusById = useMemo(() => Object.fromEntries((data?.menus || []).map((m) => [m.id, m])), [data])

  function startOrder(d = data, s = settings) {
    const o = makeOrder(d, s)
    setOrder(o)
    setInputs(o.cups.map(() => newCupInput()))
    setActive(0)
    setResult(null)
  }

  useEffect(() => {
    if (data && !order) startOrder(data)
  }, [data]) // eslint-disable-line react-hooks/exhaustive-deps

  function handleLoad(d, source) {
    saveData(d, source)
    const next = { ...d, _source: source }
    setData(next)
    setChecks(loadChecks(next))
    setShowData(false)
    startOrder(next)
  }

  function handleClear() {
    clearData()
    setData(null)
    setOrder(null)
    setShowData(false)
  }

  if (!data || showData) {
    return (
      <DataScreen
        current={data}
        onLoad={handleLoad}
        onClear={handleClear}
        onBack={data ? () => setShowData(false) : null}
      />
    )
  }
  if (showBook) {
    return (
      <RecipeBook
        data={data}
        checks={checks}
        onChecksChange={(next) => {
          saveChecks(next)
          setChecks(next)
        }}
        onChecksReset={() => {
          resetChecks()
          setChecks(loadChecks(data))
        }}
        onBack={() => setShowBook(false)}
      />
    )
  }
  if (showRange) {
    return (
      <RangeScreen
        data={data}
        settings={settings}
        onBack={() => setShowRange(false)}
        onSave={(s) => {
          saveSettings(s)
          setSettings(s)
          setShowRange(false)
          startOrder(data, s)
        }}
      />
    )
  }
  if (!order) return null

  const updateCup = (i, patch) => setInputs((prev) => prev.map((c, j) => (j === i ? { ...c, ...patch } : c)))

  return (
    <div className="app">
      <header className="topbar">
        <h1>레시피 연습</h1>
        <div className="topbar-links">
          <button className="link" onClick={() => setShowBook(true)}>
            레시피북
          </button>
          <button className="link" onClick={() => setShowRange(true)}>
            출제 범위
          </button>
          <button className="link" onClick={() => setShowData(true)}>
            데이터
          </button>
        </div>
      </header>

      <Ticket
        order={order}
        menusById={menusById}
        active={active}
        onSelect={(i) => {
          setActive(i)
          if (result) document.getElementById(`cup-result-${i}`)?.scrollIntoView({ behavior: 'smooth' })
        }}
        inputs={inputs}
        result={result}
      />

      {result ? (
        <ResultView
          result={result}
          onRetry={() => setResult(null)}
          onNext={() => startOrder()}
        />
      ) : (
        <>
          <CupForm
            data={data}
            checks={checks}
            index={active}
            menu={menusById[order.cups[active].menuId]}
            cup={order.cups[active]}
            input={inputs[active]}
            onChange={(patch) => updateCup(active, patch)}
          />
          <div className="actions">
            <button
              className="primary"
              onClick={() => {
                setResult(gradeOrder(order, inputs, menusById, checks))
                window.scrollTo({ top: 0, behavior: 'smooth' })
              }}
            >
              채점하기
            </button>
            <button className="secondary" onClick={() => startOrder()}>
              다른 주문 받기
            </button>
          </div>
        </>
      )}
    </div>
  )
}
