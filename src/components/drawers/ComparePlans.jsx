import { useEffect, useMemo } from 'react'
import { CHANNELS, comparePlans, modelOutcome } from '../../data/agent.js'
import { crore, roi } from '../../data/cohorts.js'
import { fmtIN } from '../../data/portfolio.js'
import Button from '../ui/Button.jsx'
import styles from './ComparePlans.module.css'

const SHORT = { email: 'Email', wa: 'WA', sms: 'SMS', voice: 'Auto', rm: 'RM' }
const rupee = (n) => `₹${fmtIN(Math.round(n))}`

/* dir: 1 = more is better, -1 = less is better, 0 = nothing to win. */
const METRICS = [
  { group: 'Reach and response' },
  { id: 'people', label: 'Contacted', dir: 0, val: (s) => s.plan.people, fmt: (s) => fmtIN(s.plan.people) },
  { id: 'resp', label: 'Expected to respond', dir: 1, val: (s) => s.plan.responders, fmt: (s) => fmtIN(s.plan.responders) },
  { id: 'rate', label: 'Response rate', dir: 1, val: (s) => s.plan.rate, fmt: (s) => `${(s.plan.rate * 100).toFixed(1)}%` },
  { id: 'days', label: 'Finishes on', dir: -1, val: (s) => s.plan.days, fmt: (s) => `day ${s.plan.days}` },
  { id: 'capped', label: 'Dropped to capacity', dir: -1, val: (s) => s.plan.capped,
    fmt: (s) => (s.plan.capped ? fmtIN(s.plan.capped) : '—') },

  { group: 'What it costs' },
  { id: 'cost', label: 'Contact cost', dir: -1, val: (s) => s.plan.cost, fmt: (s) => rupee(s.plan.cost) },
  { id: 'cpr', label: 'Cost per responder', dir: -1, val: (s) => s.plan.cpr, fmt: (s) => (s.plan.responders ? `₹${s.plan.cpr.toFixed(2)}` : '—') },
  { id: 'invest', label: 'Programme cost', dir: -1, val: (s) => s.out.investCr, fmt: (s) => crore(s.out.investCr) },

  { group: 'What it runs to' },
  { id: 'attr', label: '90-day attrition', dir: -1, val: (s) => s.out.attritionTo, fmt: (s) => `${s.out.attritionTo.toFixed(1)}%` },
  { id: 'profit', label: 'Incremental profit', dir: 1, val: (s) => s.out.profitCr, fmt: (s) => crore(s.out.profitCr) },
  { id: 'roiX', label: 'Return', dir: 1, val: (s) => s.out.roiX, fmt: (s) => roi(s.out.roiX) },
]

/**
 * Every alternative plan beside the one you have, on the same audience and the
 * same suppressions. Comparing is only useful if it leads somewhere, so each
 * column can be adopted outright.
 */
export default function ComparePlans({
  cohort, reachable, channels, routeOrders, journeys,
  baseResponders, profitCr, investCr, onAdopt, onClose,
}) {
  useEffect(() => {
    const h = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [onClose])

  const scenarios = useMemo(() => {
    const list = comparePlans({
      cohort,
      reachable,
      channels,
      routeOrders,
      journeys,
    })
    return list.map((s) => ({
      ...s,
      out: modelOutcome({ plan: s.plan, baseResponders, profitCr, investCr, reachable }),
    }))
  }, [cohort, reachable, channels, routeOrders, journeys, baseResponders, profitCr, investCr])

  // Winner per row, so a column can be scanned rather than read. The winner is
  // decided on the printed figure, not the raw one — two plans that both show
  // 2.3× are not one better than the other, and a row where everything ties
  // has no winner to mark at all.
  const best = useMemo(() => {
    const map = {}
    for (const m of METRICS) {
      if (!m.id || !m.dir || !scenarios.length) continue
      const shown = scenarios.map((s) => m.fmt(s))
      if (new Set(shown).size < 2) continue
      const vals = scenarios.map(m.val)
      const top = m.dir > 0 ? Math.max(...vals) : Math.min(...vals)
      map[m.id] = shown[vals.indexOf(top)]
    }
    return map
  }, [scenarios])

  // The caller owns how an adopted plan is written back — a split campaign
  // keys its route edits per leg, so it cannot be a plain assignment here.
  const adopt = (s) => {
    onAdopt({ channels: s.channels, routeOrders: s.orders, journeys: s.journeys })
    onClose()
  }

  return (
    <div className={styles.overlay} role="dialog" aria-modal="true" aria-label="Compare plans">
      <div className={styles.backdrop} onClick={onClose} />

      <div className={styles.panel}>
        <div className={styles.head}>
          <div>
            <div className={styles.headKick}>Compare plans</div>
            <div className={styles.headTitle}>{scenarios.length} ways to reach this audience</div>
            <div className={styles.headSub}>
              All of them run on the same {fmtIN(reachable)} cardholders and the same
              suppressions. Best in each row is highlighted.
            </div>
          </div>
          <button type="button" className={styles.close} onClick={onClose} aria-label="Close">✕</button>
        </div>

        <div className={styles.scroll}>
          <table className={styles.table}>
            <thead>
              <tr>
                <td className={`${styles.corner} ${styles.stick}`} />
                {scenarios.map((s) => (
                  <th key={s.id} scope="col" className={`${styles.col} ${s.isCurrent ? styles.colNow : ''}`}>
                    <div className={styles.colName}>{s.name}</div>
                    <div className={styles.colNote}>
                      {s.isCurrent && s.sameAs.length
                        ? `Also ${s.sameAs[0].replace(/^The /, 'the ')}`
                        : s.note}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {METRICS.map((m) => (
                m.group ? (
                  <tr key={m.group} className={styles.groupRow}>
                    <th scope="row" className={`${styles.groupCell} ${styles.stick}`}>{m.group}</th>
                    {scenarios.map((s) => <td key={s.id} className={styles.groupPad} />)}
                  </tr>
                ) : (
                  <tr key={m.id}>
                    <th scope="row" className={`${styles.rowLabel} ${styles.stick}`}>{m.label}</th>
                    {scenarios.map((s) => {
                      const win = m.dir && best[m.id] !== undefined && m.fmt(s) === best[m.id]
                      return (
                        <td
                          key={s.id}
                          className={[
                            styles.cell,
                            win ? styles.win : '',
                            s.isCurrent ? styles.cellNow : '',
                          ].filter(Boolean).join(' ')}
                        >
                          {m.fmt(s)}
                        </td>
                      )
                    })}
                  </tr>
                )
              ))}

              <tr className={styles.groupRow}>
                <th scope="row" className={`${styles.groupCell} ${styles.stick}`}>How it routes</th>
                {scenarios.map((s) => <td key={s.id} className={styles.groupPad} />)}
              </tr>
              <tr>
                <th scope="row" className={`${styles.rowLabel} ${styles.stick}`}>Segments</th>
                {scenarios.map((s) => (
                  <td key={s.id} className={`${styles.routesCell} ${s.isCurrent ? styles.cellNow : ''}`}>
                    {s.plan.routes.map((r) => (
                      <div key={r.key} className={styles.routeLine}>
                        <span className={styles.routeSeq}>
                          {r.journey.map((st) => SHORT[st.ch]).join(' → ')}
                        </span>
                        <span className={styles.routeN}>{fmtIN(r.people)}</span>
                      </div>
                    ))}
                  </td>
                ))}
              </tr>
            </tbody>

            <tfoot>
              <tr>
                <th scope="row" className={`${styles.rowLabel} ${styles.stick}`} />
                {scenarios.map((s) => (
                  <td key={s.id} className={`${styles.actCell} ${s.isCurrent ? styles.cellNow : ''}`}>
                    {s.isCurrent ? (
                      <span className={styles.running}>Running now</span>
                    ) : (
                      <button type="button" className={styles.use} onClick={() => adopt(s)}>
                        Use this plan
                      </button>
                    )}
                  </td>
                ))}
              </tr>
            </tfoot>
          </table>
        </div>

        <div className={styles.foot}>
          <span className={styles.footNote}>
            Channels a plan needs are switched on when you adopt it.{' '}
            {CHANNELS.map((c) => `${SHORT[c.id]} ${c.name} ₹${c.cost.toFixed(2)}`).join(' · ')}
          </span>
          <Button variant="secondary" onClick={onClose}>Close</Button>
        </div>
      </div>
    </div>
  )
}
