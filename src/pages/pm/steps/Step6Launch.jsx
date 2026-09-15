import { useMemo, useState } from 'react'
import { fmtIN } from '../../../data/portfolio.js'
import { buildCampaign, launchRows } from '../../../data/campaign.js'
import Button from '../../../components/ui/Button.jsx'
import stepStyles from './step.module.css'
import styles from './Step6Launch.module.css'
import StepActions from '../StepActions.jsx'

const GUARDRAILS = [
  'No benefit claim outside the approved list',
  'No limit, rate or eligibility promise in copy',
  'Consent and DND re-checked at send time',
  'Records flagged by content policy held for manual review',
]

/**
 * Generation and dispatch are one step: rendering the messages is not a
 * decision, it is the evidence that the send is safe. It runs on arrival, the
 * checks clear as it goes, and only then does the campaign become sendable.
 */
export default function Step6Launch({ flow }) {
  const [arming, setArming] = useState(false)

  const campaign = useMemo(() => buildCampaign(flow), [flow])
  const pct = Math.min(flow.genPct, 100)
  const done = pct >= 100

  const { reachable, control, sending, channels: picked, exclusionCount: exclCount } = campaign
  const rows = launchRows(campaign)
  // Held for manual review scales with the audience rather than sitting at a
  // fixed 312 whatever the campaign turns out to be.
  const HELD = Math.max(1, Math.round(reachable * 0.023))

  // Each check clears as the render passes its mark, so the box reads as a
  // pre-flight sequence rather than one bar that sits at zero and then jumps.
  const checks = [
    { id: 'gen', label: 'Content generated', at: 100, live: true,
      detail: `${fmtIN(Math.round(reachable * pct / 100))} of ${fmtIN(reachable)}` },
    { id: 'guard', label: 'Guardrails enforced', at: 45, detail: '4 rules · no breach' },
    { id: 'excl', label: 'Exclusions re-checked', at: 70, detail: `${exclCount} rules at send time` },
    { id: 'hold', label: 'Held for manual review', at: 100, warn: true, detail: `${fmtIN(HELD)} records` },
  ]
  const cleared = checks.filter((c) => pct >= c.at).length

  const generated = picked.map((c) => ({
    ...c,
    n: Math.min(
      Math.round(reachable * c.reachPct * pct / 100),
      c.capacity ?? Infinity,
    ),
  }))

  return (
    <div className={stepStyles.wrap}>
      <div>
        <div className={stepStyles.kicker}>Launch</div>
        <h1 className={stepStyles.h1}>Final checks before send</h1>
      </div>

      <div className={styles.body}>
      <div className={styles.preflight}>
        <div className={styles.preHead}>
          <span className={styles.preKick}>Pre-flight</span>
          <span className={styles.preCount}>
            {done
              ? `${cleared} of ${checks.length} clear`
              : `${cleared} of ${checks.length} clear · ${pct}%`}
          </span>
        </div>

        {checks.map((c) => {
          const ok = pct >= c.at
          return (
            <div key={c.id} className={`${styles.check} ${ok ? styles.checkOn : ''}`}>
              <span
                className={[
                  styles.mark,
                  ok ? (c.warn ? styles.markWarn : styles.markOk) : styles.markWait,
                ].join(' ')}
                aria-hidden="true"
              >
                {ok ? (c.warn ? '!' : '✓') : ''}
              </span>
              <span className={styles.checkLabel}>{c.label}</span>
              {c.live && (
                <span className={styles.track} aria-hidden="true">
                  <span className={styles.fill} style={{ width: `${pct}%` }} />
                </span>
              )}
              <span className={styles.checkFig}>{c.detail}</span>
            </div>
          )
        })}
      </div>

      <div className={styles.grid}>
        <div>
          <div className={styles.colKick}>What goes out</div>
          <dl className={styles.rows}>
            {rows.map((r) => (
              <div key={r.k}><dt>{r.k}</dt><dd>{r.v}</dd></div>
            ))}
          </dl>
        </div>

        <div className={styles.side}>
          <div>
            <div className={styles.colKick}>Generated</div>
            <dl className={styles.rows}>
              {generated.map((c) => (
                <div key={c.id}>
                  <dt>
                    <span className={`${styles.dot} ${styles[`ch_${c.id}`]}`} aria-hidden="true" />
                    {c.name}
                  </dt>
                  <dd>{fmtIN(c.n)}</dd>
                </div>
              ))}
              <div><dt>Copy variants</dt><dd>6</dd></div>
            </dl>
          </div>

          <div>
            <div className={styles.colKick}>Checked before send</div>
            <ul className={styles.guards}>
              {GUARDRAILS.map((g) => <li key={g}>{g}</li>)}
            </ul>
          </div>
        </div>
      </div>
      </div>

      <StepActions>
        {arming ? (
          <>
            <Button variant="secondary" onClick={() => setArming(false)}>Cancel</Button>
            <div className={styles.confirm}>
              <b>{fmtIN(sending)}</b> messages to real cardholders, {fmtIN(control)} held back
              as control. Sends cannot be recalled once they leave.
            </div>
            <Button
              variant="primary"
              size="lg"
              onClick={() => { setArming(false); flow.goStep(7) }}
            >
              Send now
            </Button>
          </>
        ) : (
          <>
            <Button variant="secondary" onClick={flow.goBack}>← Approval</Button>
            <Button
              variant="primary"
              size="lg"
              className={stepStyles.actionsRight}
              onClick={() => setArming(true)}
              disabled={!done || picked.length === 0}
              title={done ? undefined : 'Generation is still running'}
            >
              {done ? 'Launch campaign →' : `Generating… ${pct}%`}
            </Button>
          </>
        )}
      </StepActions>
    </div>
  )
}
