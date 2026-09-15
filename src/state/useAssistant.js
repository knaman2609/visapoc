import { useCallback, useState } from 'react'
import { PM_OPPS } from '../data/portfolio.js'

/**
 * The composer's stand-in for the model call.
 *
 * It reads the operator's line for the subject they are asking about and
 * answers with the opportunity that already covers it, rather than inventing
 * an answer. Every reply points at something real on the book, so the two
 * doors — take it apart, or start working on it — are always available.
 *
 * Swap `read` for a completion when the endpoint exists; the rest of the loop
 * (pending state, the reply, the two actions) is unchanged.
 */
const RULES = [
  { re: /\b(attrition|churn|leaving|lapse|at.risk|retention)\b/, opp: 'o1',
    say: 'Attrition is the loudest thing on the book right now.' },
  { re: /\b(upgrade|entry|mass affluent|qualify|limit)\b/, opp: 'o2',
    say: 'The upgrade-ready population is the biggest untouched pool.' },
  { re: /\b(travel|airline|flight|forex|hotel|off.us)\b/, opp: 'o3',
    say: 'Travel spend is the corridor leaking hardest.' },
  { re: /\b(dormant|inactive|dead|unused|renewal|fee)\b/, opp: 'o4',
    say: 'Dormancy on the premium cards is the one with a deadline attached.' },
  { re: /\b(emi|utilisation|utilization|revolv|interest|nii)\b/, opp: 'o5',
    say: 'High utilisation without conversion is where the interest income sits.' },
]

export function read(text) {
  const t = text.trim().toLowerCase()
  if (!t) return null

  const hit = RULES.find((r) => r.re.test(t))
  const opp = PM_OPPS.find((o) => o.id === hit?.opp) || PM_OPPS[0]

  return {
    say: hit
      ? `${hit.say} ${opp.cust} cardholders sit inside it, worth ${opp.impact} — modelled at ₹${opp.costCr.toFixed(2)} Cr for a ${opp.roiX.toFixed(1)}× return.`
      : `Nothing on the book matches that directly. The nearest open item is below — ${opp.cust} cardholders, ${opp.impact}.`,
    opp,
    matched: !!hit,
  }
}

export function useAssistant() {
  const [turns, setTurns] = useState([])
  const [pending, setPending] = useState(false)

  const ask = useCallback((text) => {
    const q = text.trim()
    if (!q || pending) return
    setTurns((t) => [...t, { role: 'you', text: q }])
    setPending(true)
    // A beat of latency, so the answer reads as work rather than a lookup.
    setTimeout(() => {
      const r = read(q)
      setTurns((t) => [...t, { role: 'agent', text: r.say, opp: r.opp, matched: r.matched }])
      setPending(false)
    }, 620)
  }, [pending])

  const clear = useCallback(() => setTurns([]), [])

  return { turns, pending, ask, clear }
}
