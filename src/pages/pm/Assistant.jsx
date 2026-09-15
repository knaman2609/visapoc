import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowUp, Clock4, Play, Sparkles, Target, TrendingDown, TrendingUp } from 'lucide-react'
import { PM_OPPS } from '../../data/portfolio.js'
import { LIVE_CAMPAIGNS } from '../../data/campaigns.js'
import { useAssistant } from '../../state/useAssistant.js'
import { useIdentity } from '../../components/layout/useLayoutInfo.js'
import AlwaysOn from '../../components/live/AlwaysOn.jsx'
import styles from './Assistant.module.css'

const SUGGESTIONS = [
  'Where is attrition worst?',
  'What is leaking travel spend?',
  'Which cards are going dormant?',
]

// How long ago the sweep raised each one — the list reads as a feed, newest first.
const RAISED = ['Just now', '12m ago', '1h ago', '3h ago', 'Yesterday']

const MARK = { o1: TrendingDown, o2: Sparkles, o3: Target, o4: Clock4, o5: TrendingUp }

/**
 * The way in.
 *
 * One question at the top and one list underneath — the page is deliberately
 * narrow and mostly air, because its whole job is to hand the operator a
 * starting point. Every row offers the same two doors: take the numbers apart,
 * or start building the campaign.
 */
export default function Assistant() {
  const navigate = useNavigate()
  const { userName } = useIdentity()
  const agent = useAssistant()
  const [draft, setDraft] = useState('')
  const [tab, setTab] = useState('live')
  const [state, setState] = useState('open')
  const logRef = useRef(null)

  useEffect(() => {
    logRef.current?.scrollTo({ top: logRef.current.scrollHeight, behavior: 'smooth' })
  }, [agent.turns, agent.pending])

  const send = (text) => {
    agent.ask(text)
    setDraft('')
  }

  const dig = (opp) => navigate(`/pm/deep-dive?opp=${opp.id}`)
  const start = (opp) => navigate(`/pm/flow/0?opp=${opp.id}`)

  const open = state === 'open'
  const live = tab === 'live'
  const rows = tab === 'ideas' ? (open ? PM_OPPS : []) : tab === 'history' ? (open ? LIVE_CAMPAIGNS : []) : []
  const first = userName === 'Signed in' ? null : userName.split(' ')[0]

  return (
    <div className={styles.wrap}>
      <div className={styles.col}>
        <h1 className={styles.h1}>
          {first ? `What should we work on, ${first}?` : 'What should we work on?'}
        </h1>

        <form className={styles.composer} onSubmit={(e) => { e.preventDefault(); send(draft) }}>
          <textarea
            className={styles.input}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(draft) }
            }}
            placeholder="Ask a question or give a command"
            rows={2}
            aria-label="Ask the agent"
            disabled={agent.pending}
          />
          <div className={styles.composerFoot}>
            <span className={styles.hint}>Enter to send</span>
            <button
              type="submit"
              className={styles.send}
              disabled={!draft.trim() || agent.pending}
              aria-label="Send"
            >
              <ArrowUp size={15} strokeWidth={2} />
            </button>
          </div>
        </form>

        {agent.turns.length === 0 && !agent.pending && (
          <div className={styles.suggestions}>
            {SUGGESTIONS.map((s) => (
              <button key={s} type="button" className={styles.suggestion} onClick={() => send(s)}>
                {s}
              </button>
            ))}
          </div>
        )}

        {(agent.turns.length > 0 || agent.pending) && (
          <div className={styles.log} ref={logRef}>
            {agent.turns.map((t, i) => (
              <div key={i} className={`${styles.turn} ${t.role === 'you' ? styles.you : styles.agent}`}>
                <span className={styles.said}>{t.text}</span>
                {t.opp && (
                  <span className={styles.turnActions}>
                    <button type="button" className={styles.ghost} onClick={() => dig(t.opp)}>
                      Analyse
                    </button>
                    <button type="button" className={styles.solid} onClick={() => start(t.opp)}>
                      Act
                    </button>
                  </span>
                )}
              </div>
            ))}
            {agent.pending && (
              <div className={`${styles.turn} ${styles.agent}`}>
                <span className={styles.typing} aria-label="Thinking"><i /><i /><i /></span>
              </div>
            )}
            <button type="button" className={styles.clear} onClick={agent.clear}>Clear</button>
          </div>
        )}

        <div className={styles.listHead}>
          <div className={styles.tabs} role="tablist" aria-label="Assistant list">
            <button
              type="button" role="tab" aria-selected={live}
              className={`${styles.tab} ${live ? styles.tabOn : ''}`}
              onClick={() => setTab('live')}
            >
              <span className={styles.liveDot} aria-hidden="true" />
              Live
            </button>
            <button
              type="button" role="tab" aria-selected={tab === 'ideas'}
              className={`${styles.tab} ${tab === 'ideas' ? styles.tabOn : ''}`}
              onClick={() => setTab('ideas')}
            >
              Opportunities
            </button>
            <button
              type="button" role="tab" aria-selected={tab === 'history'}
              className={`${styles.tab} ${tab === 'history' ? styles.tabOn : ''}`}
              onClick={() => setTab('history')}
            >
              History
            </button>
          </div>

          {/* Open / actioned scopes a list; the feed is neither. */}
          {!live && (
          <div className={styles.seg}>
            <button
              type="button"
              className={`${styles.segBtn} ${open ? styles.segOn : ''}`}
              onClick={() => setState('open')}
              aria-pressed={open}
            >
              {tab === 'ideas' ? 'Open' : 'Running'}
            </button>
            <button
              type="button"
              className={`${styles.segBtn} ${!open ? styles.segOn : ''}`}
              onClick={() => setState('done')}
              aria-pressed={!open}
            >
              {tab === 'ideas' ? 'Actioned' : 'Finished'}
            </button>
          </div>
          )}
        </div>

        <div className={styles.list}>
          {live && (
            <div className={styles.feed}>
              <AlwaysOn />
            </div>
          )}

          {!live && rows.length === 0 && (
            <div className={styles.empty}>
              {tab === 'ideas'
                ? 'Nothing actioned yet — every opportunity the sweep raised is still open.'
                : 'No campaign has reached the end of its send window yet.'}
            </div>
          )}

          {tab === 'ideas' && rows.map((o, i) => {
            const Icon = MARK[o.id] || Sparkles
            return (
              <div key={o.id} className={styles.row}>
                <button type="button" className={styles.rowMain} onClick={() => start(o)}>
                  <Icon className={styles.mark} size={16} strokeWidth={1.75} aria-hidden="true" />
                  <span className={styles.line}>{o.line}</span>
                </button>
                <span className={styles.when}>{RAISED[i] || 'Earlier'}</span>
                <span className={styles.actions}>
                  <button type="button" className={styles.ghost} onClick={() => dig(o)}>
                    Analyse
                  </button>
                  <button type="button" className={styles.solid} onClick={() => start(o)}>
                    Act
                  </button>
                </span>
              </div>
            )
          })}

          {tab === 'history' && rows.map((c) => (
            <div key={c.id} className={styles.row}>
              <button type="button" className={styles.rowMain} onClick={() => navigate('/pm/campaigns?view=register')}>
                <Play className={styles.mark} size={15} strokeWidth={1.75} aria-hidden="true" />
                <span className={styles.line}>
                  {c.name} is on day {c.day} of {c.windowDays}, {c.stateLabel.toLowerCase()} at{' '}
                  ₹{c.live.profitCr.toFixed(2)} Cr of ₹{c.target.toFixed(2)} Cr.
                </span>
              </button>
              <span className={`${styles.when} ${c.state === 'behind' ? styles.behind : ''}`}>
                {c.code}
              </span>
              <span className={styles.actions}>
                <button type="button" className={styles.ghost} onClick={() => navigate('/pm/campaigns?view=register')}>
                  Open register
                </button>
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
