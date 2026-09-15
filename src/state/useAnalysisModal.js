import { useEffect, useRef, useState } from 'react'
import { useAppProps } from './useApp.js'

/**
 * Drives the AnalysisModal reveal.
 *
 * The reveal used to recurse from inside the state updater — one setTimeout
 * scheduling the next. StrictMode runs updaters twice, so every tick scheduled
 * two more and the timers multiplied away. A plain interval with a pure
 * updater does the same job, and completion is derived rather than stored.
 */
export function useAnalysisModal(customer) {
  const { traceSpeed } = useAppProps()
  const [aStep, setAStep] = useState(0)
  const id = useRef(null)

  const total = customer ? customer.steps.length : 0

  useEffect(() => {
    setAStep(0)
    if (!customer || total <= 0) return undefined
    id.current = setInterval(() => setAStep((n) => Math.min(n + 1, total)), traceSpeed)
    return () => {
      clearInterval(id.current)
      id.current = null
    }
  }, [customer, traceSpeed, total])

  useEffect(() => {
    if (id.current && total > 0 && aStep >= total) {
      clearInterval(id.current)
      id.current = null
    }
  }, [aStep, total])

  const aDone = total > 0 && aStep >= total

  const aTrace = customer
    ? customer.steps.slice(0, Math.min(aStep + 1, total)).map((s, i) => {
        const busy = i === aStep && !aDone
        return { label: s.label, result: busy ? '' : s.result, busy, ok: !busy }
      })
    : []

  const aStatus = aDone ? 'ANALYSIS COMPLETE' : 'ANALYSING…'
  return { aStep, aDone, aTrace, aStatus }
}
