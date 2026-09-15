import { useCallback, useEffect, useRef, useState } from 'react'
import { useAppContext, useAppProps } from './useApp.js'

/**
 * Drives the RM Customer Detail state machine.
 * Phases: idle → thinking → ready → sent → opened → acted.
 *
 * Replaces the mockup's this.open(id) + this.tick(id) + this.approve() + this.customerAct().
 */
export function useAgentTrace(customer) {
  const props = useAppProps()
  const { sent, markSent } = useAppContext()
  const alreadySent = customer ? !!sent[customer.id] : false

  const [phase, setPhase] = useState(alreadySent ? 'acted' : 'thinking')
  const [stepIdx, setStepIdx] = useState(alreadySent ? 99 : 0)

  const timerRef = useRef(null)
  const clear = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current)
      timerRef.current = null
    }
  }, [])

  // Reset on customer swap.
  useEffect(() => {
    clear()
    if (!customer) return
    if (alreadySent) {
      setPhase('acted')
      setStepIdx(99)
    } else {
      setPhase('thinking')
      setStepIdx(0)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [customer?.id])

  // Advance the trace during "thinking". The updater only moves the index —
  // StrictMode runs updaters twice, so changing phase from inside one would
  // fire the transition twice and schedule work off a render.
  useEffect(() => {
    if (!customer || phase !== 'thinking') return undefined
    if (stepIdx >= customer.steps.length) return undefined
    timerRef.current = setTimeout(() => {
      setStepIdx((n) => n + 1)
    }, props.traceSpeed)
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [phase, stepIdx, customer, props.traceSpeed])

  // Running out of steps is what makes the recommendation ready.
  useEffect(() => {
    if (customer && phase === 'thinking' && stepIdx >= customer.steps.length) {
      setPhase('ready')
    }
  }, [customer, phase, stepIdx])

  // After 'ready', if autoApprove, approve after 700ms.
  useEffect(() => {
    if (phase !== 'ready' || !props.autoApprove || !customer) return undefined
    const t = setTimeout(() => approve(), 700)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, props.autoApprove, customer])

  const approve = useCallback(() => {
    if (!customer) return
    clear()
    markSent(customer.id)
    setPhase('sent')
    timerRef.current = setTimeout(() => setPhase('opened'), 1600)
  }, [customer, markSent, clear])

  const customerAct = useCallback(() => {
    clear()
    setPhase('acted')
  }, [clear])

  const reset = useCallback(() => {
    clear()
    setPhase('idle')
    setStepIdx(0)
  }, [clear])

  useEffect(() => () => clear(), [clear])

  // Derived: how many trace rows to render, and each row's busy/ok state.
  const trace = customer
    ? customer.steps.slice(0, Math.min(stepIdx + 1, customer.steps.length)).map((s, i) => {
        const busy = i === stepIdx && phase === 'thinking'
        return { label: s.label, result: busy ? '' : s.result, busy, ok: !busy }
      })
    : []

  const status =
    phase === 'thinking' ? 'REASONING…'
    : phase === 'ready' ? 'AWAITING RM APPROVAL'
    : phase === 'sent' ? 'DELIVERED'
    : 'COMPLETE'

  const phoneCaption =
    phase === 'thinking' || phase === 'ready' ? 'NOTHING SENT UNTIL THE RM APPROVES'
    : phase === 'sent' ? 'PUSH NOTIFICATION DELIVERED'
    : phase === 'opened' ? 'CUSTOMER OPENED THE MESSAGE'
    : 'CUSTOMER COMPLETED THE ACTION'

  return {
    phase,
    stepIdx,
    trace,
    status,
    phoneCaption,
    approve,
    customerAct,
    reset,
    showRecommendation: phase !== 'thinking' || stepIdx >= (customer ? customer.steps.length : 99),
    awaitingApproval: phase === 'ready',
    showOutcome: phase === 'acted',
    phoneIdle: phase === 'thinking' || phase === 'ready',
    phoneNotif: phase === 'sent',
    phoneApp: phase === 'opened',
    phoneDone: phase === 'acted',
  }
}
