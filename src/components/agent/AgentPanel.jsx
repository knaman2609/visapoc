import { useEffect, useRef, useState } from 'react'
import { Sparkles } from 'lucide-react'
import Checkmark from '../ui/Checkmark.jsx'
import Spinner from '../ui/Spinner.jsx'
import { useAgentPanel } from '../../state/useAgentPanel.js'
import styles from './AgentPanel.module.css'

export default function AgentPanel({ step, stepLabel, campaign }) {
  const agent = useAgentPanel(step, campaign)
  const [open, setOpen] = useState(false)
  const [showReasoning, setShowReasoning] = useState(true)
  const [draft, setDraft] = useState('')
  const threadRef = useRef(null)

  // Follow the conversation as it grows.
  useEffect(() => {
    const el = threadRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [agent.chat.length, agent.pending])

  useEffect(() => {
    if (!open) return undefined
    const h = (e) => { if (e.key === 'Escape') setOpen(false) }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [open])

  function send(text) {
    const q = text ?? draft
    if (!q.trim()) return
    agent.ask(q)
    setDraft('')
  }

  if (!open) {
    return (
      <button
        type="button"
        className={styles.bubble}
        onClick={() => setOpen(true)}
        aria-label="Open the agent"
      >
        <Sparkles size={18} strokeWidth={2} aria-hidden="true" />
        <span className={styles.bubbleText}>Ask AI</span>
      </button>
    )
  }

  return (
    <aside className={styles.panel} aria-label="Agent reasoning and assistant">
      <div className={styles.head}>
        <Sparkles
          className={`${styles.headSpark} ${agent.done ? styles.sparkIdle : ''}`}
          size={18}
          strokeWidth={1.75}
          aria-hidden="true"
        />
        <div className={styles.headKick}>Agent</div>
        <div className={styles.headStatus}>{agent.status}</div>
        <button
          type="button"
          className={styles.collapse}
          onClick={() => setOpen(false)}
          aria-label="Hide the agent panel"
          title="Hide the agent panel"
        >
          ✕
        </button>
      </div>

      <div className={styles.body}>
        <div className={styles.sect}>
          <button
            type="button"
            className={styles.sectToggle}
            onClick={() => setShowReasoning((v) => !v)}
            aria-expanded={showReasoning}
          >
            <span className={styles.sectKick}>1 · Reasoning · {stepLabel}</span>
            <span className={styles.sectMeta}>
              {showReasoning ? 'Hide' : `${agent.trace.length} of 4`}
            </span>
            <span className={`${styles.chev} ${showReasoning ? styles.chevOpen : ''}`}>
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                <path d="M6 9l6 6 6-6" />
              </svg>
            </span>
          </button>

          {!showReasoning && agent.conclusion && (
            <div className={styles.collapsedNote}>{agent.conclusion}</div>
          )}

          {showReasoning && (
          <>
          <div className={styles.thinkBox}>
            <div className={styles.thinkHead}>
              <Sparkles
                className={agent.done ? styles.starDone : styles.starIcon}
                size={14}
                strokeWidth={1.9}
                aria-hidden="true"
              />
              <div className={styles.thinkKick}>VISA AGENTIC INTELLIGENCE</div>
              {agent.done && <div className={styles.thinkDone}>4 OF 4</div>}
            </div>

            <div className={styles.thinkList}>
              {agent.trace.map((l, i) => (
                <div key={`${step}-${i}-${l.tag}`} className={styles.thinkRow}>
                  <div className={styles.thinkIcon}>
                    {l.busy ? <Spinner size="sm" /> : <Checkmark size="xs" />}
                  </div>
                  <div className={styles.thinkMain}>
                    <div className={styles.thinkTop}>
                      <div className={styles.thinkTag}>{l.tag}</div>
                      {l.result && <div className={styles.thinkResult}>{l.result}</div>}
                    </div>
                    <div className={styles.thinkLabel}>{l.label}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {agent.conclusion && (
            <div className={styles.conclusion}>
              <div className={styles.conclusionKick}>What it concluded</div>
              <div className={styles.conclusionText}>{agent.conclusion}</div>
            </div>
          )}
          </>
          )}
        </div>

        <div className={styles.sect}>
          <div className={styles.sectKick}>2 · Ask the agent</div>

          <div className={styles.thread} ref={threadRef}>
            {agent.chat.length === 0 && (
              <div className={styles.empty}>
                Ask about anything on this step. The agent answers from the campaign&rsquo;s own
                numbers — the cohort, the cause attribution, the modelled outcome, the channels
                or the control group.
              </div>
            )}

            {agent.chat.map((m, i) => (
              <div key={i} className={m.who === 'you' ? styles.msgYou : styles.msgAgent}>
                {m.who === 'agent' && <div className={styles.msgKick}>AGENT</div>}
                <div className={m.who === 'you' ? styles.msgYouText : styles.msgAgentText}>{m.text}</div>
              </div>
            ))}

            {agent.pending && (
              <div className={styles.msgAgent}>
                <div className={styles.msgKick}>AGENT</div>
                <div className={styles.typing}><i /><i /><i /></div>
              </div>
            )}
          </div>

          {agent.suggestions.length > 0 && agent.chat.length === 0 && (
            <div className={styles.suggests}>
              {agent.suggestions.map((s) => (
                <button key={s} type="button" className={styles.suggest} onClick={() => send(s)}>
                  {s}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className={styles.composer}>
        <input
          className={styles.input}
          value={draft}
          placeholder="Ask about this step…"
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              send()
            }
          }}
        />
        <button
          type="button"
          className={styles.send}
          onClick={() => send()}
          disabled={!draft.trim() || agent.pending}
          aria-label="Send"
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 12h14" />
            <path d="M12 6l6 6-6 6" />
          </svg>
        </button>
      </div>
    </aside>
  )
}
