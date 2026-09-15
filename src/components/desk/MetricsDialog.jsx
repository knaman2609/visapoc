import { useMemo, useState } from 'react'
import { ChartColumn, X } from 'lucide-react'
import { deskMetrics, duration } from '../../state/useSupport.js'
import { PoweredBy, PriorityIcon, StageIcon } from './DeskBits.jsx'
import { useDismiss } from './useDismiss.js'
import styles from './MetricsDialog.module.css'

/**
 * Desk Metrics, as the Desk dialog lays it out: KPI cards, tickets by stage,
 * a chart with a selector, and an Agents tab with the per-agent table.
 *
 * Every figure is computed from the tickets in view when the dialog opens, with
 * this session's work folded in — so resolving a ticket and reopening the
 * dialog moves the numbers.
 */

const CHARTS = [
  { id: 'trend', label: 'Trend', title: 'Tickets created vs resolved (daily)' },
  { id: 'priority', label: 'Priority', title: 'Tickets by priority' },
  { id: 'assignee', label: 'Assignee', title: 'Tickets by assignee' },
]

const fmt = (mins) => (mins === null ? '—' : duration(mins))

export default function MetricsDialog({ tickets, scope, onClose }) {
  const [tab, setTab] = useState('overview')
  const [chart, setChart] = useState('trend')
  const m = useMemo(() => deskMetrics(tickets), [tickets])
  const ref = useDismiss(true, onClose)

  return (
    <div className={styles.scrim}>
      <div className={styles.dialog} ref={ref} role="dialog" aria-modal="true" aria-labelledby="desk-metrics-title">
        <div className={styles.head}>
          <ChartColumn size={16} strokeWidth={2} className={styles.headIcon} aria-hidden="true" />
          <h2 id="desk-metrics-title" className={styles.title}>Desk Metrics</h2>
          <span className={styles.scope}>{scope}</span>

          <div className={styles.tabs} role="tablist" aria-label="Metrics view">
            {[['overview', 'Overview'], ['agents', 'Agents']].map(([id, label]) => (
              <button
                key={id}
                type="button"
                role="tab"
                aria-selected={tab === id}
                className={`${styles.tab} ${tab === id ? styles.tabOn : ''}`}
                onClick={() => setTab(id)}
              >
                {label}
              </button>
            ))}
          </div>

          <button type="button" className={styles.iconBtn} onClick={onClose} aria-label="Close metrics">
            <X size={16} strokeWidth={2} aria-hidden="true" />
          </button>
        </div>

        <div className={styles.body}>
          {tab === 'overview' ? (
            <>
              <div className={styles.kpis}>
                <Kpi k="Tickets" v={m.created} n="in this view" />
                <Kpi k="Avg first response" v={fmt(m.avgFirstResponse)} n={`${m.responded} responded`} />
                <Kpi k="Avg resolution" v={fmt(m.avgResolution)} n={`${m.resolved} resolved`} />
                <Kpi
                  k="CSAT"
                  v={m.csat === null ? '—' : `${m.csat.toFixed(1)}/5`}
                  n={m.csat === null ? 'No responses' : `${m.good} good · ${m.bad} bad`}
                />
                <Kpi k="Email replies" v={m.replies} />
              </div>

              <div className={styles.section}>
                <div className={styles.sectHead}>Tickets by stage</div>
                <div className={styles.stageChips}>
                  {m.byStage.map((s) => (
                    <span key={s.id} className={styles.stageChip}>
                      <StageIcon status={s.id} />
                      {s.label}
                      <span className={styles.stageCount}>{s.count}</span>
                    </span>
                  ))}
                </div>
              </div>

              <div className={styles.chartPanel}>
                <div className={styles.chartHead}>
                  <span className={styles.chartTitle}>{CHARTS.find((c) => c.id === chart).title}</span>
                  <div className={styles.seg} role="group" aria-label="Chart">
                    {CHARTS.map((c) => (
                      <button
                        key={c.id}
                        type="button"
                        aria-pressed={chart === c.id}
                        className={`${styles.segBtn} ${chart === c.id ? styles.segOn : ''}`}
                        onClick={() => setChart(c.id)}
                      >
                        {c.label}
                      </button>
                    ))}
                  </div>
                </div>

                {chart === 'trend' && <Trend rows={m.trend} />}
                {chart === 'priority' && (
                  <Bars rows={m.byPriority.map((p) => ({ id: p.id, label: <PriorityIcon priority={p.id} withLabel />, count: p.count }))} />
                )}
                {chart === 'assignee' && <Bars rows={m.byAssignee} />}
              </div>
            </>
          ) : (
            <Agents m={m} />
          )}
        </div>

        <div className={styles.foot}>
          <span>Demo tickets in this view. Stage and owner changes from this session count; replies sent in the demo are not timed or counted. Spam is excluded.</span>
          <PoweredBy compact />
        </div>
      </div>
    </div>
  )
}

function Kpi({ k, v, n }) {
  return (
    <div className={styles.kpi}>
      <div className={styles.kpiK}>{k}</div>
      <div className={styles.kpiV}>{v}</div>
      {n && <div className={styles.kpiN}>{n}</div>}
    </div>
  )
}

function Trend({ rows }) {
  const max = Math.max(1, ...rows.flatMap((r) => [r.created, r.resolved]))
  return (
    <div>
      <div className={styles.legend}>
        <span><i className={styles.swCreated} />Created</span>
        <span><i className={styles.swResolved} />Resolved</span>
      </div>
      <div className={styles.trend} role="img" aria-label="Tickets created and resolved per day over the last 14 days">
        {rows.map((r, i) => (
          <div key={r.key} className={styles.trendCol} title={`${r.label}: ${r.created} created, ${r.resolved} resolved`}>
            <div className={styles.trendBars}>
              <span className={styles.barCreated} style={{ height: `${(r.created / max) * 100}%` }} />
              <span className={styles.barResolved} style={{ height: `${(r.resolved / max) * 100}%` }} />
            </div>
            <span className={styles.trendLabel}>{i % 2 === 1 ? r.label : ''}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function Bars({ rows }) {
  const max = Math.max(1, ...rows.map((r) => r.count))
  return (
    <div className={styles.bars}>
      {rows.map((r) => (
        <div key={r.id} className={styles.barRow}>
          <span className={styles.barLabel}>{r.label}</span>
          <span className={styles.barTrack}>
            <span className={styles.barFill} style={{ width: `${(r.count / max) * 100}%` }} />
          </span>
          <span className={styles.barNum}>{r.count}</span>
        </div>
      ))}
    </div>
  )
}

function Agents({ m }) {
  const total = (key) => m.agents.reduce((n, a) => n + a[key], 0)
  return (
    <>
      <div className={styles.kpis}>
        <Kpi k="Agents" v={m.agents.filter((a) => a.assigned > 0).length} n="with activity" />
        <Kpi k="Total tickets" v={total('assigned')} n="assigned to an agent" />
        <Kpi k="Tickets resolved" v={total('resolved')} />
        <Kpi k="Replies sent" v={total('replies')} />
      </div>

      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Agent</th>
              <th>Assigned</th>
              <th>Responded</th>
              <th>Resolved</th>
              <th>Resolved %</th>
              <th>Avg FRT</th>
              <th>CSAT</th>
              <th>Replies sent</th>
            </tr>
          </thead>
          <tbody>
            {m.agents.map((a) => (
              <tr key={a.id}>
                <td className={styles.agentName}>{a.name}</td>
                <td>{a.assigned}</td>
                <td>{a.responded}</td>
                <td>{a.resolved}</td>
                <td>{a.resolvedPct === null ? '—' : `${Math.round(a.resolvedPct * 100)}%`}</td>
                <td>{fmt(a.avgFrt)}</td>
                <td>{a.csat === null ? '—' : a.csat.toFixed(1)}</td>
                <td>{a.replies}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  )
}
