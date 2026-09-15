import { useEffect, useRef, useState } from 'react'
import { ArrowUp, Sparkles, X } from 'lucide-react'
import { useAskAgent } from '../../state/useAskAgent.js'
import styles from './AskAgent.module.css'

/**
 * Ask the agent about whatever is on screen.
 *
 * A bubble in the corner that opens a panel, rather than a rail that takes a
 * column of the page away from the charts it is talking about. The context is
 * rebuilt by the page on every render, so the panel's suggestions and answers
 * always describe the current cut rather than the one it opened on.
 */
export default function AskAgent({ ctx, suggestions = [] }) {
  const [open, setOpen] = useState(false)
  const [draft, setDraft] = useState('')
  const agent = useAskAgent(ctx)
  const logRef = useRef(null)
  const inputRef = useRef(null)

  useEffect(() => {
    logRef.current?.scrollTo({ top: logRef.current.scrollHeight, behavior: 'smooth' })
  }, [agent.turns, agent.pending])

  useEffect(() => {
    if (!open) return undefined
    inputRef.current?.focus()
    const h = (e) => { if (e.key === 'Escape') setOpen(false) }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [open])

  const send = (text) => {
    agent.ask(text)
    setDraft('')
  }

  if (!open) {
    return (
      <button
        type="button"
        className={styles.bubble}
        onClick={() => setOpen(true)}
        aria-label="Ask the agent about this view"
      >
        <Sparkles size={18} strokeWidth={2} />
        <span className={styles.bubbleText}>Ask AI</span>
      </button>
    )
  }

  return (
    <aside className={styles.panel} aria-label="Ask the agent">
      <header className={styles.head}>
        <Sparkles className={styles.headMark} size={15} strokeWidth={2} aria-hidden="true" />
        <div className={styles.headText}>
          <div className={styles.headTitle}>Ask the agent</div>
          <div className={styles.headSub}>
            {ctx.metricLabel} by {ctx.dimLabel.toLowerCase()}
            {ctx.scopeLabel ? ` · ${ctx.scopeLabel}` : ''}
          </div>
        </div>
        <button type="button" className={styles.close} onClick={() => setOpen(false)} aria-label="Close">
          <X size={14} strokeWidth={2} />
        </button>
      </header>

      <div className={styles.body} ref={logRef}>
        {agent.turns.length === 0 && !agent.pending && (
          <>
            <p className={styles.intro}>
              I answer from the numbers on this page — {ctx.members.length} {ctx.noun}s,
              measured on {ctx.metricLabel.toLowerCase()}.
            </p>
            <div className={styles.chips}>
              {suggestions.map((s) => (
                <button key={s} type="button" className={styles.chip} onClick={() => send(s)}>
                  {s}
                </button>
              ))}
            </div>
          </>
        )}

        {agent.turns.map((t, i) => (
          <div key={i} className={`${styles.turn} ${t.role === 'you' ? styles.you : styles.agent}`}>
            {t.text}
          </div>
        ))}

        {agent.pending && (
          <div className={`${styles.turn} ${styles.agent}`}>
            <span className={styles.typing} aria-label="Thinking"><i /><i /><i /></span>
          </div>
        )}
      </div>

      <form className={styles.composer} onSubmit={(e) => { e.preventDefault(); send(draft) }}>
        <input
          ref={inputRef}
          className={styles.input}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Ask about this view…"
          aria-label="Ask about this view"
          disabled={agent.pending}
        />
        <button
          type="submit"
          className={styles.send}
          disabled={!draft.trim() || agent.pending}
          aria-label="Send"
        >
          <ArrowUp size={14} strokeWidth={2.2} />
        </button>
      </form>
    </aside>
  )
}
