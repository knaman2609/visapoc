import { useEffect, useMemo, useState } from 'react'
import {
  CHANNELS, JOURNEY_TEMPLATES, SEND_TO, WAIT_OPTIONS,
  agentJourney, journeyShape, runJourney,
} from '../../data/agent.js'
import { fmtIN } from '../../data/portfolio.js'
import Button from '../ui/Button.jsx'
import styles from './JourneyBuilder.module.css'

const rupee = (n) => `₹${fmtIN(Math.round(n))}`
const pct = (n) => `${(n * 100).toFixed(1)}%`

/**
 * Compose a journey by hand: any channel, in any order, repeated if you want,
 * with a gap and an audience rule between touches. The cascade on the right
 * re-runs on every edit against the same model the agent's own routing uses,
 * so a hand-built journey and the agent's are read off the same numbers.
 */
export default function JourneyBuilder({ route, enabled, capsLeft, segmentCount, onApply, onApplyAll, onReset, onClose }) {
  const [steps, setSteps] = useState(() => route.journey.map((s) => ({ ...s })))

  useEffect(() => {
    const h = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [onClose])

  const options = CHANNELS.filter((c) => enabled[c.id])
  const answers = route.ids

  // Built for this segment and this channel mix, so the name only sticks while
  // the journey still matches the template it came from.
  // Two templates can land on the same journey for a segment — "cheapest first"
  // and "best response first" coincide when one channel wins both. Only offer
  // the first of them, so picking a name never renames itself.
  const templates = useMemo(() => {
    const seen = new Set()
    return JOURNEY_TEMPLATES
      .map((t) => ({ ...t, steps: t.build(route.ids).filter((s) => enabled[s.ch]) }))
      .filter((t) => {
        if (!t.steps.length) return false
        const shape = journeyShape(t.steps)
        if (seen.has(shape)) return false
        seen.add(shape)
        return true
      })
  }, [route.ids, enabled])
  const active = useMemo(
    () => templates.find((t) => journeyShape(t.steps) === journeyShape(steps)) || null,
    [templates, steps],
  )

  const run = useMemo(
    () => runJourney(route.people, steps, answers, { ...capsLeft }),
    [route.people, steps, answers, capsLeft],
  )
  const agent = useMemo(
    () => runJourney(route.people, agentJourney(route.agentSeq), answers, { ...capsLeft }),
    [route.people, route.agentSeq, answers, capsLeft],
  )

  const edit = (i, patch) => setSteps((prev) => prev.map((s, n) => (n === i ? { ...s, ...patch } : s)))
  const drop = (i) => setSteps((prev) => prev.filter((_, n) => n !== i))
  const move = (i, by) => setSteps((prev) => {
    const next = [...prev]
    const to = i + by
    if (to < 0 || to >= next.length) return prev
    ;[next[i], next[to]] = [next[to], next[i]]
    return next
  })
  const add = () => setSteps((prev) => {
    const last = prev[prev.length - 1]
    const fresh = options.find((c) => c.id !== last?.ch) || options[0]
    return [...prev, { ch: fresh.id, wait: 2, to: 'open' }]
  })

  const offChannel = run.rows.filter((r) => r.offChannel)
  const capped = run.rows.filter((r) => r.capped)
  const rebilled = run.rows.filter((r) => r.toAll && r.wasted > 0)
  const dResponders = run.responders - agent.responders
  const dCost = run.cost - agent.cost
  const empty = steps.length === 0

  return (
    <div className={styles.overlay} role="dialog" aria-modal="true" aria-label="Build a journey">
      <div className={styles.backdrop} onClick={onClose} />

      <div className={styles.panel}>
        <div className={styles.head}>
          <div className={styles.headText}>
            <div className={styles.headKick}>Journey builder</div>
            <div className={styles.headTitle}>
              {route.ids.map((id) => CHANNELS.find((c) => c.id === id).name).join(' + ')} segment
            </div>
            <div className={styles.headSub}>
              {fmtIN(route.people)} cardholders · they answer{' '}
              {route.ids.map((id) => CHANNELS.find((c) => c.id === id).name).join(' and ')}
            </div>
          </div>
          <button type="button" className={styles.close} onClick={onClose} aria-label="Close">✕</button>
        </div>

        <div className={styles.body}>
          {/* ── Compose ─────────────────────────────────── */}
          <div className={styles.compose}>
            <div className={styles.tplRow}>
              <label className={styles.blockKick} htmlFor="journey-template">Template</label>
              <select
                id="journey-template"
                className={styles.tplSelect}
                value={active ? active.id : 'custom'}
                onChange={(e) => {
                  const t = templates.find((x) => x.id === e.target.value)
                  if (t) setSteps(t.steps.map((x) => ({ ...x })))
                }}
              >
                {!active && <option value="custom">Custom — built by hand</option>}
                {templates.map((t) => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </div>
            <p className={styles.tplNote}>
              {active
                ? active.note
                : 'Edited by hand. Pick a template to start again from a known shape.'}
            </p>

            <div className={`${styles.blockHead} ${styles.blockHeadGap}`}>
              <span className={styles.blockKick}>The journey</span>
              <span className={styles.blockMeta}>
                {steps.length} {steps.length === 1 ? 'touch' : 'touches'}
                {run.days > 0 && ` · day 0 to ${run.days}`}
              </span>
            </div>

            {empty ? (
              <div className={styles.empty}>
                Nothing is sent to this segment yet. Pick a starting point above, or add a touch.
              </div>
            ) : (
              <ol className={styles.steps}>
                {steps.map((s, i) => {
                  const row = run.rows[i]
                  return (
                    <li key={i} className={styles.stepLi}>
                      {i > 0 && (
                        <div className={styles.link}>
                          <span className={styles.linkRail} aria-hidden="true" />
                          <select
                            className={styles.select}
                            value={s.wait ?? 2}
                            onChange={(e) => edit(i, { wait: Number(e.target.value) })}
                            aria-label={`Wait before touch ${i + 1}`}
                          >
                            {WAIT_OPTIONS.map((w) => (
                              <option key={w.id} value={w.id}>{w.label}</option>
                            ))}
                          </select>
                          <div className={styles.toGroup} role="group" aria-label={`Who touch ${i + 1} goes to`}>
                            {SEND_TO.map((t) => (
                              <button
                                key={t.id}
                                type="button"
                                className={`${styles.toBtn} ${(s.to ?? 'open') === t.id ? styles.toBtnOn : ''}`}
                                onClick={() => edit(i, { to: t.id })}
                                aria-pressed={(s.to ?? 'open') === t.id}
                                title={t.hint}
                              >
                                {t.id === 'open' ? 'Non-responders' : 'Everyone again'}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className={`${styles.card} ${row?.offChannel ? styles.cardWarn : ''}`}>
                        <div className={styles.cardTop}>
                          <span className={styles.no}>{i + 1}</span>
                          <div className={styles.chns} role="group" aria-label={`Channel for touch ${i + 1}`}>
                            {options.map((c) => (
                              <button
                                key={c.id}
                                type="button"
                                className={`${styles.chn} ${s.ch === c.id ? `${styles.chnOn} ${styles[`on_${c.id}`]}` : ''}`}
                                onClick={() => edit(i, { ch: c.id })}
                                aria-pressed={s.ch === c.id}
                                title={`₹${c.cost.toFixed(2)} per send · ${Math.round(c.reachPct * 100)}% contactable · ${Math.round(c.respondPct * 100)}% base response`}
                              >
                                {c.name}
                              </button>
                            ))}
                          </div>
                          <div className={styles.cardActs}>
                            <button
                              type="button" className={styles.act} onClick={() => move(i, -1)}
                              disabled={i === 0} aria-label={`Move touch ${i + 1} earlier`}
                            >↑</button>
                            <button
                              type="button" className={styles.act} onClick={() => move(i, 1)}
                              disabled={i === steps.length - 1} aria-label={`Move touch ${i + 1} later`}
                            >↓</button>
                            <button
                              type="button" className={`${styles.act} ${styles.actDrop}`} onClick={() => drop(i)}
                              aria-label={`Remove touch ${i + 1}`}
                            >✕</button>
                          </div>
                        </div>

                        {row && (
                          <div className={styles.figs}>
                            <span><i>Contacted</i>{fmtIN(row.contacted)}</span>
                            <span><i>Respond</i><b className={styles.ok}>{fmtIN(row.responded)}</b></span>
                            <span><i>Rate</i>{pct(row.rate)}</span>
                            <span><i>Still open</i>{fmtIN(row.open)}</span>
                            <span><i>Cost</i>{rupee(row.cost)}</span>
                          </div>
                        )}

                        {row?.capped && (
                          <div className={styles.flag}>
                            Only {fmtIN(row.contacted)} of {fmtIN(row.wanted)} can be reached
                            here. This segment&apos;s share of {row.name} is{' '}
                            {fmtIN(capsLeft?.[row.id] ?? 0)} contacts, so {fmtIN(row.short)}{' '}
                            skip this touch.
                          </div>
                        )}
                        {row?.offChannel && (
                          <div className={styles.flag}>
                            This segment does not answer {row.name}. It still delivers and still
                            bills — it just converts at a fraction of the rate.
                          </div>
                        )}
                        {row?.repeat && !row.offChannel && (
                          <div className={styles.flagSoft}>
                            Second time on {row.name}. They passed on it once, so response is
                            modelled well below the first touch.
                          </div>
                        )}
                        {row?.toAll && row.wasted > 0 && (
                          <div className={styles.flagSoft}>
                            {fmtIN(row.wasted)} of these already responded. They are billed again
                            and cannot respond twice.
                          </div>
                        )}
                      </div>
                    </li>
                  )
                })}
              </ol>
            )}

            <button
              type="button"
              className={styles.add}
              onClick={add}
              disabled={steps.length >= 6 || options.length === 0}
            >
              + Add a touch
            </button>
            {steps.length >= 5 && (
              <div className={styles.tooMany}>
                Past four touches the response barely moves and the cost keeps climbing.
              </div>
            )}
          </div>

          {/* ── Live result ─────────────────────────────── */}
          <div className={styles.result}>
            <div className={styles.resultInner}>
              <div className={styles.blockKick}>What this journey runs to</div>

              <div className={styles.big}>{fmtIN(run.responders)}</div>
              <div className={styles.bigNote}>
                expected responders · {pct(run.rate)} of the segment
              </div>

              <div className={styles.bars} aria-hidden="true">
                {run.rows.map((r) => (
                  <div key={r.key} className={styles.bar}>
                    <div className={styles.barHead}>
                      <span className={styles.barName}>{r.name}</span>
                      <span className={styles.barDay}>day {r.day}</span>
                    </div>
                    <div className={styles.barTrack}>
                      <div
                        className={`${styles.barFill} ${styles[`fill_${r.id}`]}`}
                        style={{ width: `${Math.min(100, (r.contacted / Math.max(1, route.people)) * 100)}%` }}
                      />
                      <div
                        className={styles.barOk}
                        style={{ width: `${Math.min(100, (r.responded / Math.max(1, route.people)) * 100)}%` }}
                      />
                    </div>
                    <div className={styles.barFigs}>
                      {fmtIN(r.contacted)} sent · {fmtIN(r.responded)} respond
                    </div>
                  </div>
                ))}
              </div>

              <dl className={styles.ledger}>
                <div><dt>Contact cost</dt><dd>{rupee(run.cost)}</dd></div>
                <div><dt>Cost per responder</dt><dd>{run.responders ? `₹${run.cpr.toFixed(2)}` : '—'}</dd></div>
                <div><dt>Runs over</dt><dd>{run.days === 0 ? 'One day' : `${run.days} days`}</dd></div>
              </dl>

              <div className={styles.vs}>
                <div className={styles.vsKick}>Against the agent&apos;s routing</div>
                <div className={styles.vsRow}>
                  <span className={dResponders >= 0 ? styles.ok : styles.bad}>
                    {dResponders >= 0 ? '+' : '−'}{fmtIN(Math.abs(dResponders))}
                  </span>
                  <span className={styles.vsLabel}>responders</span>
                </div>
                <div className={styles.vsRow}>
                  <span className={dCost <= 0 ? styles.ok : styles.bad}>
                    {dCost >= 0 ? '+' : '−'}{rupee(Math.abs(dCost))}
                  </span>
                  <span className={styles.vsLabel}>send cost</span>
                </div>
                {(offChannel.length > 0 || rebilled.length > 0 || capped.length > 0) && (
                  <div className={styles.vsWarn}>
                    {capped.length > 0 && `${fmtIN(capped.reduce((n, r) => n + r.short, 0))} contacts drop out where a capped channel runs short. `}
                    {offChannel.length > 0 && `${offChannel.length} touch${offChannel.length > 1 ? 'es' : ''} on a channel this segment does not answer. `}
                    {rebilled.length > 0 && 'One touch re-bills people who already responded.'}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className={styles.foot}>
          {route.custom && (
            <Button variant="ghost" onClick={onReset}>Hand back to the agent</Button>
          )}
          <div className={styles.footRight}>
            {segmentCount > 1 && (
              <Button variant="secondary" onClick={() => onApplyAll(steps)} disabled={empty}>
                Use for all {segmentCount} segments
              </Button>
            )}
            <Button variant="primary" onClick={() => onApply(steps)} disabled={empty}>
              Use this journey
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
