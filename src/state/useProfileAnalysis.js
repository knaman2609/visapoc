import { useEffect, useRef, useState } from 'react'
import { useAppProps } from './useApp.js'
import { REVEAL_MS } from './pace.js'

/**
 * Drives the Profile Drawer's 3- or 4-step thinking reveal.
 * Total = 4 if the profile has `rec`, else 3.
 *
 * This used to run at max(2800, traceSpeed * 6) — nearly three seconds a step,
 * so the drawer sat on a spinner for eleven seconds with every panel below it
 * blank, because they are all gated on the reveal finishing. It now keeps the
 * same cadence as every other reasoning reveal in the app.
 */
export function useProfileAnalysis(profile) {
  const { traceSpeed } = useAppProps()
  const [pStep, setPStep] = useState(0)
  const id = useRef(null)

  const total = profile ? (profile.rec ? 4 : 3) : 0
  const interval = Math.max(REVEAL_MS, traceSpeed)

  useEffect(() => {
    setPStep(0)
    if (!profile || total <= 0) return undefined
    // Pure updater — StrictMode runs it twice, so it must not stop the timer.
    id.current = setInterval(() => setPStep((n) => Math.min(n + 1, total)), interval)
    return () => {
      clearInterval(id.current)
      id.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile, total, interval])

  useEffect(() => {
    if (id.current && total > 0 && pStep >= total) {
      clearInterval(id.current)
      id.current = null
    }
  }, [pStep, total])

  const pDone = pStep >= total
  return { pStep, pDone, total }
}
