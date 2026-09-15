import { useMemo, useState } from 'react'
import { AUDIT_TRAIL, fmtIN } from '../../../data/portfolio.js'
import { buildCampaign, launchRows } from '../../../data/campaign.js'
import { crore } from '../../../data/cohorts.js'
import { FLOOR, PROGRESS, liveSnapshot, proposeCorrection } from '../../../data/live.js'
import { portfolioLive } from '../../../data/campaigns.js'
import Button from '../../../components/ui/Button.jsx'
import stepStyles from './step.module.css'
import styles from './Step7Live.module.css'
import StepActions from '../StepActions.jsx'

const pct = (n, d = 1) => `${(n * 100).toFixed(d)}%`
const lakh = (cr) => `₹${Math.round(cr * 100)}L`

export default function Step7Live({ flow }) {
  const campaign = useMemo(() => buildCampaign(flow), [flow])
  const { legs } = campaign
  const [legTab, setLegTab] = useState(legs[0].id)
  const leg = legs.find((l) => l.id === legTab) || legs[0]

  const audience = campaign.reachable
  const name = campaign.title
  const rows = launchRows(campaign)

  /* Each leg is reported against the plan it was actually given and its own
     modelled profit — a paired campaign has two curves, not one. */
  const shots = useMemo(
    () => Object.fromEntries(legs.map((l) => [
      l.id,
      liveSnapshot({ plan: l.plan, targetProfitCr: l.econ.profitCr }),
    ])),
    [legs],
  )

  const base = shots[leg.id]
  const target = leg.econ.profitCr
  const fix = proposeCorrection(base)
  const snap = flow.correctionApplied && fix
    ? liveSnapshot({ plan: leg.plan, targetProfitCr: target, swap: fix })
    : base

  // The banner speaks for the whole launch, not the leg in focus.
  const allSent = legs.reduce((n, l) => n + shots[l.id].sent, 0)
  const allProfit = legs.reduce((n, l) => n + shots[l.id].profitCr, 0)

  const others = portfolioLive(campaign.campaign.id)
  const liveCount = others.length + 1
  const paceTarget = target * PROGRESS

  return (
    <div className={stepStyles.wrap}>
      <div className={styles.banner}>
        <div className={styles.check}>✓</div>
        <div className={styles.bText}>
          <div className={styles.bTitle}>Campaign live · CMP-2026-0912</div>
          <div className={styles.bSub}>
            {fmtIN(audience)} cardholders queued across {legs.length}{' '}
            {legs.length === 1 ? 'push' : 'pushes'} · {fmtIN(allSent)} touches ·{' '}
            {crore(allProfit)} booked so far · {Math.round(PROGRESS * 100)}% through the send window
          </div>
        </div>
        <div className={styles.handOff}>HANDED TO CAMPAIGN SYSTEM</div>
      </div>

      <div className={styles.portfolioBar}>
        <div className={styles.pIcon} aria-hidden="true">▦</div>
        <div>
          <div className={styles.pTitle}>{liveCount} campaigns live across the portfolio</div>
          <div className={styles.pSub}>firing in parallel via the connected CRM</div>
        </div>
      </div>

      {/* ── Parallel campaigns ── */}
      <div className={styles.sectHead}>
        Live campaigns
        <span className={styles.sectTag}>Running in parallel</span>
      </div>

      <div className={styles.campaigns}>
        {legs.map((l) => {
          const sn = shots[l.id]
          const on = l.id === leg.id
          return (
            <button
              key={l.id}
              type="button"
              className={`${styles.campaign} ${styles.campaignBtn} ${on ? styles.campaignOn : ''}`}
              onClick={() => setLegTab(l.id)}
              aria-pressed={on}
            >
              <div>
                <div className={styles.cName}>{l.campaign.name}</div>
                <div className={styles.cMeta}>
                  {l.label} · {fmtIN(sn.delivered)} delivered · {pct(sn.responseRate)} responding
                </div>
              </div>
              <div className={styles.cProfit}>
                <div className={styles.cProfitV}>{crore(sn.profitCr)}</div>
                <div className={styles.cProfitK}>Incr. profit</div>
              </div>
              <div className={`${styles.state} ${on ? styles.stateViewing : styles.statePlan}`}>
                {on ? 'Viewing' : 'View'}
              </div>
            </button>
          )
        })}

        {others.map((o) => (
          <div key={o.id} className={styles.campaign}>
            <div>
              <div className={styles.cName}>{o.name}</div>
              <div className={styles.cMeta}>
                {fmtIN(o.sent)} sent · {pct(o.responseRate)} responding
              </div>
            </div>
            <div className={styles.cProfit}>
              <div className={styles.cProfitV}>{crore(o.profitCr)}</div>
              <div className={styles.cProfitK}>Incr. profit</div>
            </div>
            <div className={`${styles.state} ${o.state === 'on plan' ? styles.stateOk : styles.stateRisk}`}>
              {o.state}
            </div>
          </div>
        ))}
      </div>

      {/* ── The one you are viewing ── */}
      <div className={styles.sectHead}>
        {name}
        <span className={styles.sectTag}>The one you&apos;re viewing</span>
      </div>

      <div className={styles.detail}>
        <div className={styles.card}>
          <div className={styles.cardKick}>Performance</div>

          <div className={styles.stats}>
            <Stat k="Delivered" v={fmtIN(snap.delivered)} of={`of ${fmtIN(snap.sent)}`} fill={snap.delivered / snap.sent} />
            <Stat k="Open rate" v={pct(snap.openRate, 0)} of="of delivered" fill={snap.openRate} tone="ok" />
            <Stat k="Response" v={pct(snap.responseRate)} of={`${fmtIN(snap.responded)} acted`} fill={snap.responseRate * 6} tone="ok" />
          </div>

          <div className={styles.profitBox}>
            <div className={styles.profitTop}>
              <span className={styles.profitK}>Incremental profit</span>
              <span className={styles.profitV}>
                {crore(snap.profitCr)} <span className={styles.profitTarget}>/ {crore(target)}</span>
              </span>
            </div>
            <div className={styles.profitTrack}>
              <div className={styles.profitFill} style={{ width: `${Math.min(100, (snap.profitCr / target) * 100)}%` }} />
              <div className={styles.pace} style={{ left: `${(PROGRESS * 100).toFixed(1)}%` }} title="Where it should be at this point" />
            </div>
            <div className={styles.profitNote}>
              {/* Landing within a couple of percent of the mark is on the mark,
                  not a miss — the two numbers are the same model. */}
              {Math.abs(snap.profitCr / paceTarget - 1) < 0.02
                ? `On the ${crore(paceTarget)} pace mark · margin positive`
                : snap.profitCr > paceTarget
                  ? `Ahead of the ${crore(paceTarget)} pace mark · margin positive`
                  : `Behind the ${crore(paceTarget)} pace mark for this point in the window`}
            </div>
          </div>
        </div>

        <div className={styles.card}>
          <div className={styles.cardKick}>Channel performance</div>
          <div className={styles.chTable}>
            <div className={styles.chHead}>
              <div>Channel</div><div>Delivered</div><div>Opened</div><div>Acted</div><div>Rate</div><div>Unsent</div>
            </div>
            {snap.channels.map((c) => (
              <div key={c.id} className={`${styles.chRow} ${c.under ? styles.chUnder : ''}`}>
                <div className={styles.chName}>
                  {c.name}
                  {c.under && <span className={styles.underTag}>under</span>}
                  {c.movedIn > 0 && <span className={styles.movedTag}>+{fmtIN(c.movedIn)}</span>}
                </div>
                <div>{fmtIN(c.delivered)}</div>
                <div>{fmtIN(c.opened)}</div>
                <div>{fmtIN(c.responded)}</div>
                <div className={c.under ? styles.rateBad : styles.rateOk}>{pct(c.rate)}</div>
                <div>{c.pending > 0 ? fmtIN(c.pending) : '—'}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Course correction ── */}
      {fix && !flow.correctionApplied && (
        <div className={styles.alert}>
          <div className={styles.alertIcon} aria-hidden="true">!</div>
          <div className={styles.alertBody}>
            <div className={styles.alertTitle}>{fix.fromName} channel underperforming</div>
            <div className={styles.alertText}>
              {fix.fromName} is converting at <b>{pct(fix.fromRate)}</b> — below the {pct(FLOOR, 0)} threshold.
              {' '}{fix.toName} is running at <b>{pct(fix.toRate)}</b> on the same cohort.
            </div>

            <div className={styles.fixBox}>
              <div className={styles.fixKick}>⚡ The agent&apos;s course-correction</div>
              <div className={styles.fixTitle}>
                Move the {fmtIN(fix.moved)} unsent {fix.fromName} messages onto {fix.toName}
              </div>
              <div className={styles.fixText}>
                {fix.toName} converts <b>+{pct(fix.toRate - fix.fromRate)}</b> higher for this cohort.
                Projected recovery: <b>+{lakh(fix.recoveryCr)}</b> incremental profit from{' '}
                <b>+{fmtIN(fix.gainedResponders)}</b> responders, for{' '}
                {fix.costDelta >= 0 ? `₹${fmtIN(Math.round(fix.costDelta))} more` : `₹${fmtIN(Math.round(-fix.costDelta))} less`} in send cost.
              </div>
            </div>

            <Button variant="primary" onClick={flow.applyCorrection}>
              ✓ Apply this course-correction
            </Button>
          </div>
        </div>
      )}

      {fix && flow.correctionApplied && (
        <div className={styles.applied}>
          <div className={styles.appliedIcon} aria-hidden="true">✓</div>
          <div>
            <div className={styles.appliedTitle}>Course-correction applied</div>
            <div className={styles.appliedText}>
              {fmtIN(fix.moved)} unsent {fix.fromName} messages moved onto {fix.toName}.
              Forecast lifted to <b>{crore(target + fix.recoveryCr)}</b>. Logged to the audit trail
              and pushed to the campaign system.
            </div>
          </div>
        </div>
      )}

      {/* ── Record ── */}
      <div className={styles.grid}>
        <div className={styles.left}>
          <div className={styles.kick}>Recorded configuration</div>
          <div className={styles.rows}>
            {rows.map((r) => (
              <div key={r.k} className={styles.row}>
                <div className={styles.k}>{r.k}</div>
                <div className={styles.v}>{r.v}</div>
              </div>
            ))}
          </div>
        </div>

        <div className={styles.right}>
          <div className={styles.kick}>Audit trail</div>
          <div className={styles.trail}>
            {AUDIT_TRAIL.map((h) => (
              <div key={h.k} className={styles.trailRow}>
                <div className={styles.trailAxis}>
                  <div className={styles.trailDot} />
                  <div className={styles.trailLine} />
                </div>
                <div>
                  <div className={styles.trailK}>{h.k}</div>
                  <div className={styles.trailV}>{h.v}</div>
                </div>
              </div>
            ))}
            {flow.correctionApplied && (
              <div className={styles.trailRow}>
                <div className={styles.trailAxis}>
                  <div className={`${styles.trailDot} ${styles.trailDotNew}`} />
                </div>
                <div>
                  <div className={styles.trailK}>Course-correction applied</div>
                  <div className={styles.trailV}>08 Sep · 14:22 · {fix.fromName} → {fix.toName}</div>
                </div>
              </div>
            )}
          </div>
          <div className={styles.measure}>
            <div className={styles.kick}>Measurement</div>
            <div className={styles.measureText}>
              Incremental profit reported weekly against the{' '}
              {fmtIN(Math.round(audience * 0.1))}-cardholder holdout. First read 22 Sep.
            </div>
          </div>
        </div>
      </div>

      <StepActions>
        <Button variant="secondary" onClick={flow.pmRestart}>← Back to portfolio</Button>
      </StepActions>
    </div>
  )
}

function Stat({ k, v, of, fill, tone }) {
  return (
    <div className={styles.stat}>
      <div className={styles.statK}>{k}</div>
      <div className={`${styles.statV} ${tone ? styles[`tone_${tone}`] : ''}`}>{v}</div>
      <div className={styles.statTrack}>
        <div className={styles.statFill} style={{ width: `${Math.min(100, fill * 100)}%` }} />
      </div>
      <div className={styles.statOf}>{of}</div>
    </div>
  )
}
