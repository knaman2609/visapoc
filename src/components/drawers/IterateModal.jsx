import { useEffect, useMemo, useRef, useState } from 'react'
import {
  BASE_OPTS, HURDLE, PROFIT_BANDS, RISK_BANDS, crore, isTuned, iterate, roi,
} from '../../data/cohorts.js'
import { fmtIN } from '../../data/portfolio.js'
import { useIterateAgent } from '../../state/useIterateAgent.js'
import Button from '../ui/Button.jsx'
import styles from './IterateModal.module.css'

const SUGGESTIONS = [
  'Only the high-value cardholders',
  'The ones most likely to leave',
  'Just the top 40%',
  'Spend less per head',
  'Maximise ROI',
]

export default function IterateModal({ offer, cohort, initial, onSave, onApprove, onClose }) {
  // Levers reopen exactly where they were left, so a tuned offer stays tuned.
  const [opts, setOpts] = useState(() => ({ ...BASE_OPTS, ...initial }))
  const [draft, setDraft] = useState('')
  const agent = useIterateAgent(offer, cohort, opts, setOpts)
  const logRef = useRef(null)

  // Keep the newest turn in view as the transcript grows.
  useEffect(() => {
    logRef.current?.scrollTo({ top: logRef.current.scrollHeight, behavior: 'smooth' })
  }, [agent.messages, agent.pending])

  const send = (text) => {
    agent.ask(text)
    setDraft('')
  }

  useEffect(() => {
    const h = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [onClose])

  const base = useMemo(() => iterate(offer, cohort, BASE_OPTS), [offer, cohort])
  const next = useMemo(() => iterate(offer, cohort, opts), [offer, cohort, opts])
  // What the bands alone leave on the table, before the audience is trimmed.
  const reachable = useMemo(
    () => iterate(offer, cohort, { ...opts, depth: 1 }).targeted,
    [offer, cohort, opts],
  )

  const dirty = isTuned(opts)
  const set = (patch) => setOpts((o) => ({ ...o, ...patch }))
  const reset = () => { setOpts(BASE_OPTS); agent.reset() }

  // Bar scales: the ceiling each metric can reach with the levers wide open,
  // so a full bar means "as far as this lever goes", not an arbitrary max.
  const scale = {
    targeted: offer.targeted,
    invest: base.investCr * 2,
    profit: base.profitCr * 1.5,
    roi: Math.max(base.roiX * 2.2, HURDLE * 2),
  }

  return (
    <div className={styles.overlay} role="dialog" aria-modal="true" aria-label={`Iterate ${offer.name}`}>
      <div className={styles.backdrop} onClick={onClose} />

      <div className={styles.panel}>
        <div className={styles.head}>
          <div className={styles.headText}>
            <div className={styles.headKick}>Iterate with agent</div>
            <div className={styles.headTitle}>{offer.name}</div>
            <div className={styles.headSub}>
              <span className={`${styles.tag} ${styles[`tag_${cohort.band}`]}`}>{cohort.tag}</span>
              {cohort.label} · {fmtIN(cohort.count)} cardholders in the cohort
            </div>
          </div>
          {dirty && <span className={styles.tunedFlag}>Tuned</span>}
          <button type="button" className={styles.close} onClick={onClose} aria-label="Close">✕</button>
        </div>

        <div className={styles.body}>
          {/* ── Levers ── */}
          <div className={styles.levers}>
            <Lever
              label="Attrition risk"
              hint="Narrowing to higher risk raises profit per cardholder — there is more to save."
              bands={RISK_BANDS}
              value={opts.riskBand}
              onPick={(id) => set({ riskBand: id })}
            />

            <Lever
              label="Customer profitability"
              hint="Annual contribution per cardholder. Higher-value saves are worth more."
              bands={PROFIT_BANDS}
              value={opts.profitBand}
              onPick={(id) => set({ profitBand: id })}
            />

            <div className={styles.sampleBox}>
              <div className={styles.sampleK}>Sample matching these filters</div>
              <div className={styles.sampleV}>
                {next.sample.length} of {cohort.members.length}
                <span className={styles.sampleNote}>
                  {' '}· scaled to {fmtIN(next.targeted)} of {fmtIN(offer.targeted)} reachable
                </span>
              </div>
              <div className={styles.sampleNames}>
                {next.sample.length
                  ? next.sample.map((m) => m.name.split(' ')[0]).join(', ')
                  : 'No cardholders in the sample clear these filters.'}
              </div>
            </div>

            <div className={styles.chat}>
              <div className={styles.leverHead}>
                <span className={styles.leverLabel}>Ask the agent</span>
              </div>

              {(agent.messages.length > 0 || agent.pending) && (
                <div className={styles.log} ref={logRef}>
                  {agent.messages.map((m, i) => (
                    <div
                      key={i}
                      className={`${styles.msg} ${m.role === 'user' ? styles.msgUser : styles.msgAgent} ${m.miss ? styles.msgMiss : ''}`}
                    >
                      <span className={styles.msgWho}>{m.role === 'user' ? 'You' : 'Agent'}</span>
                      {m.text}
                    </div>
                  ))}
                  {agent.pending && (
                    <div className={`${styles.msg} ${styles.msgAgent}`}>
                      <span className={styles.msgWho}>Agent</span>
                      <span className={styles.typing} aria-label="Thinking">
                        <i /><i /><i />
                      </span>
                    </div>
                  )}
                </div>
              )}

              <form
                className={styles.composer}
                onSubmit={(e) => { e.preventDefault(); send(draft) }}
              >
                <input
                  className={styles.input}
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  placeholder="Describe who to target, or how hard to spend…"
                  aria-label="Ask the agent to set the levers"
                  disabled={agent.pending}
                />
                <button
                  type="submit"
                  className={styles.send}
                  disabled={!draft.trim() || agent.pending}
                  aria-label="Send"
                >
                  →
                </button>
              </form>

              <div className={styles.suggestions}>
                {SUGGESTIONS.map((sg) => (
                  <button
                    key={sg}
                    type="button"
                    className={styles.suggestion}
                    onClick={() => send(sg)}
                    disabled={agent.pending}
                  >
                    {sg}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* ── Live metrics, two of them draggable ── */}
          <div className={styles.metrics}>
            <div className={styles.metricsHead}>
              <span>Re-modelled outcome</span>
              {dirty && (
                <button type="button" className={styles.reset} onClick={reset}>
                  Reset to baseline
                </button>
              )}
            </div>

            {next.empty ? (
              <div className={styles.empty}>
                Nothing to model — no cardholder in this cohort clears both filters.
                Widen one to bring the audience back.
              </div>
            ) : (
              <div className={styles.bars}>
                <Bar
                  k="Targeted"
                  v={fmtIN(next.targeted)}
                  pct={(next.targeted / scale.targeted) * 100}
                  basePct={(base.targeted / scale.targeted) * 100}
                  delta={pct(next.targeted, base.targeted)}
                  note={`Top ${Math.round(opts.depth * 100)}% of the ${fmtIN(reachable)} who clear the filters`}
                  control={{
                    min: 0.05, max: 1, step: 0.05, value: opts.depth,
                    onChange: (n) => set({ depth: n }),
                    label: 'Share of the qualifying audience to target',
                  }}
                />

                <Bar
                  k="Investment"
                  v={crore(next.investCr)}
                  tone="cost"
                  pct={(next.investCr / scale.invest) * 100}
                  basePct={(base.investCr / scale.invest) * 100}
                  delta={pct(next.investCr, base.investCr)}
                  invert
                  note={`${opts.incentive.toFixed(1)}× base incentive · ₹${fmtIN(Math.round(next.investCr * 1e7 / Math.max(1, next.targeted)))} per cardholder`}
                  control={{
                    min: 0.5, max: 2, step: 0.1, value: opts.incentive,
                    onChange: (n) => set({ incentive: n }),
                    label: 'Incentive per cardholder',
                  }}
                />

                <Bar
                  k="Incremental profit"
                  v={crore(next.profitCr)}
                  tone="ok"
                  pct={(next.profitCr / scale.profit) * 100}
                  basePct={(base.profitCr / scale.profit) * 100}
                  delta={pct(next.profitCr, base.profitCr)}
                  note="Modelled — moves with the two levers above"
                />

                <Bar
                  k="Return on investment"
                  v={roi(next.roiX)}
                  tone={next.roiX < HURDLE ? 'bad' : 'warn'}
                  pct={(next.roiX / scale.roi) * 100}
                  basePct={(base.roiX / scale.roi) * 100}
                  delta={pct(next.roiX, base.roiX)}
                  markPct={(HURDLE / scale.roi) * 100}
                  note={`RAROC hurdle ${HURDLE.toFixed(1)}× · modelled`}
                />
              </div>
            )}

            {!next.empty && next.roiX < HURDLE && (
              <div className={styles.warn}>
                This configuration falls below the bank&apos;s RAROC hurdle of {HURDLE.toFixed(1)}×.
              </div>
            )}

            {!next.empty && dirty && (
              <div className={styles.read}>{readOut(next, base)}</div>
            )}

            <div className={styles.dragHint}>
              Drag <b>Targeted</b> and <b>Investment</b> — profit and ROI are re-modelled from them.
            </div>
          </div>
        </div>

        <div className={styles.foot}>
          <div className={styles.footNote}>
            Modelled on the sampled cardholders, then scaled to the cohort.
          </div>
          <Button variant="secondary" onClick={onClose}>Discard</Button>
          <Button
            variant="outline"
            onClick={() => onSave(opts)}
            disabled={next.empty}
            title={next.empty ? 'No audience to save' : 'Keep these levers on this intervention'}
          >
            Save changes
          </Button>
          <Button
            variant="primary"
            onClick={() => onApprove(opts, next)}
            disabled={next.empty}
            title={next.empty ? 'No audience to build a campaign for' : undefined}
          >
            ✓ Approve &amp; build campaign
          </Button>
        </div>
      </div>
    </div>
  )
}

function Lever({ label, hint, bands, value, onPick }) {
  return (
    <div className={styles.lever}>
      <div className={styles.leverHead}>
        <span className={styles.leverLabel}>{label}</span>
      </div>
      <div className={styles.chips}>
        {bands.map((b) => (
          <button
            key={b.id}
            type="button"
            className={`${styles.chip} ${value === b.id ? styles.chipOn : ''}`}
            onClick={() => onPick(b.id)}
            aria-pressed={value === b.id}
          >
            {b.label}
            {b.hint && <span className={styles.chipHint}>{b.hint}</span>}
          </button>
        ))}
      </div>
      <div className={styles.leverHint}>{hint}</div>
    </div>
  )
}

/**
 * One metric as a bar. Two of the four carry a range input laid over the track,
 * so the operator drags the number itself rather than a separate slider; the
 * other two are the model's answer and move on their own.
 */
function Bar({ k, v, note, pct: width, basePct, delta, tone, invert, markPct, control }) {
  const flat = Math.abs(delta) < 0.5
  const good = invert ? delta < 0 : delta > 0
  const w = Math.max(1.5, Math.min(100, width))

  return (
    <div className={`${styles.bar} ${control ? styles.barLive : ''}`}>
      <div className={styles.barTop}>
        <span className={styles.barK}>
          {k}
          {control && <span className={styles.barDrag}>drag</span>}
        </span>
        <span className={`${styles.barV} ${tone ? styles[`tone_${tone}`] : ''}`}>{v}</span>
      </div>

      <div className={styles.track}>
        <span className={`${styles.fill} ${tone ? styles[`fill_${tone}`] : ''}`} style={{ width: `${w}%` }} />
        {basePct != null && (
          <span
            className={styles.baseMark}
            style={{ left: `${Math.min(100, Math.max(0, basePct))}%` }}
            title="Baseline"
          />
        )}
        {markPct != null && (
          <span className={styles.hurdleMark} style={{ left: `${Math.min(100, markPct)}%` }} title="RAROC hurdle" />
        )}
        {control && (
          <input
            type="range"
            className={styles.range}
            min={control.min}
            max={control.max}
            step={control.step}
            value={control.value}
            onChange={(e) => control.onChange(Number(e.target.value))}
            aria-label={control.label}
          />
        )}
      </div>

      <div className={styles.barFoot}>
        <span className={styles.barNote}>{note}</span>
        <span className={`${styles.barDelta} ${flat ? '' : good ? styles.up : styles.down}`}>
          {flat ? 'at baseline' : `${delta > 0 ? '+' : ''}${delta.toFixed(0)}% vs baseline`}
        </span>
      </div>
    </div>
  )
}

function pct(next, base) {
  if (!base) return 0
  return ((next - base) / base) * 100
}

function readOut(next, base) {
  const roiDelta = pct(next.roiX, base.roiX)
  const reach = pct(next.targeted, base.targeted)
  if (roiDelta > 2 && reach < -2) {
    return `Tighter and better: ${Math.abs(reach).toFixed(0)}% fewer cardholders, but ${roiDelta.toFixed(0)}% more return on every rupee spent.`
  }
  if (roiDelta < -2) {
    return `Richer offer, thinner margin: return per rupee is down ${Math.abs(roiDelta).toFixed(0)}% against the baseline.`
  }
  if (reach > 2) {
    return 'Wider reach at broadly the same efficiency as the baseline.'
  }
  return 'Broadly level with the baseline.'
}
