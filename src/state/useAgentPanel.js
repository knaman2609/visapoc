import { useCallback, useEffect, useRef, useState } from 'react'
import { CHAT_REPLIES, CHAT_SUGGESTIONS, stepConclusion, stepReasoning } from '../data/agent.js'
import { useAppProps } from './useApp.js'
import { REVEAL_MS } from './pace.js'

const FALLBACK =
  'I can only answer from this campaign\'s own numbers. The reasoning above shows what I ran for this step — ask about the cohort, the cause attribution, the modelled outcome, the channels or the control group.'

/**
 * Drives the agent rail beside the PM flow.
 *
 * Reasoning replays whenever the step changes: the four layers reveal one at a
 * time, the active one spinning, and the conclusion lands once all four are in.
 * Chat is kept across steps so the thread reads as one conversation.
 */
export function useAgentPanel(step, campaign) {
  const { traceSpeed } = useAppProps()
  const speed = Math.max(REVEAL_MS, traceSpeed || REVEAL_MS)

  const [revealed, setRevealed] = useState(0)
  const [chat, setChat] = useState([])
  const [pending, setPending] = useState(false)

  const layers = stepReasoning(step, campaign)
  const total = layers.length
  const timers = useRef([])

  const clearTimers = useCallback(() => {
    timers.current.forEach(clearTimeout)
    timers.current = []
  }, [])

  // Replay the four layers from scratch on every step change.
  useEffect(() => {
    clearTimers()
    setRevealed(0)
    for (let i = 1; i <= total; i += 1) {
      timers.current.push(setTimeout(() => setRevealed(i), speed * i))
    }
    return clearTimers
  }, [step, total, speed, clearTimers])

  useEffect(() => () => clearTimers(), [clearTimers])

  const done = revealed >= total

  // Only the layers reached so far render; the newest one is still working.
  const trace = layers.slice(0, Math.min(revealed + 1, total)).map((l, i) => {
    const busy = i === revealed && !done
    return { ...l, busy, result: busy ? '' : l.result }
  })

  const ask = useCallback((raw) => {
    const q = String(raw || '').trim()
    if (!q || pending) return
    setChat((prev) => [...prev, { who: 'you', text: q }])
    setPending(true)
    const hit = CHAT_REPLIES.find((r) => r.re.test(q))
    timers.current.push(
      setTimeout(() => {
        setChat((prev) => [...prev, { who: 'agent', text: hit ? hit.text : FALLBACK }])
        setPending(false)
      }, 620),
    )
  }, [pending])

  const clearChat = useCallback(() => setChat([]), [])

  return {
    trace,
    done,
    status: done ? 'REASONING COMPLETE' : 'REASONING…',
    conclusion: done ? stepConclusion(step, campaign) : '',
    suggestions: CHAT_SUGGESTIONS[step] || [],
    chat,
    pending,
    ask,
    clearChat,
  }
}
