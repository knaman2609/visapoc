import { useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import {
  CAMPAIGN_METRICS, LIVE_CAMPAIGNS, LIVE_TOTALS, applyFix,
  campaignDimension, campaignSeries, campaignTotal, campaignValue,
} from '../../data/campaigns.js'
import RankedBars from '../../components/charts/RankedBars.jsx'
import SeriesChart from '../../components/charts/SeriesChart.jsx'
import SummaryTable from '../../components/charts/SummaryTable.jsx'
import { FLOOR } from '../../data/live.js'
import { crore } from '../../data/cohorts.js'
import { fmtIN } from '../../data/portfolio.js'
import Button from '../../components/ui/Button.jsx'
import Dropdown from '../../components/ui/Dropdown.jsx'
import AskAgent from '../../components/agent/AskAgent.jsx'
import TrendLine from '../../components/charts/TrendLine.jsx'
import {
  SEGMENTS, SEGMENT_METRICS, portfolioSegment, segment, segmentBreakdown, segmentTotal,
  segmentValue,
} from '../../data/campaignSegments.js'
import styles from './Campaigns.module.css'

const pct = (n, d = 1) => `${(n * 100).toFixed(d)}%`
const lakh = (cr) => `₹${Math.round(cr * 100)}L`
const rupees = (n) => `₹${fmtIN(Math.round(n))}`

// Campaigns is the way in and stays the default; the rest cut the same book by
// who is inside it.
const CUTS = [
  {
    id: 'campaign',
    label: 'Campaigns',
    sub: 'Each campaign in flight, against the plan it was approved on.',
  },
  ...SEGMENTS.map((s) => ({ id: s.id, label: s.label, sub: s.bookLede })),
]

const SORTS = [
  { id: 'profit', label: 'Profit', cmp: (a, b) => b.live.profitCr - a.live.profitCr },
  { id: 'pace', label: 'Pace', cmp: (a, b) => a.ratio - b.ratio },
  { id: 'window', label: 'Window', cmp: (a, b) => b.progress - a.progress },
  { id: 'audience', label: 'Audience', cmp: (a, b) => b.audience - a.audience },
]

export default function Campaigns() {
  const navigate = useNavigate()
  const [params, setParams] = useSearchParams()
  const [openId, setOpenId] = useState(null)
  const [sort, setSort] = useState('profit')
  const [metricId, setMetricId] = useState('profit')
  const [cutId, setCutId] = useState('campaign')
  const [selId, setSelId] = useState(null)
  // Inside a campaign, picking a member just holds it up against the rest.
  const [segSelId, setSegSelId] = useState(null)
  // Analytics is where you find the thing; the register is where you work on
  // it. Picking a member in analytics carries you across to it.
  // The view lives in the address so the sidebar owns the navigation.
  const view = params.get('view') === 'register' ? 'register' : 'analytics'
  const setView = (v) => {
    const next = new URLSearchParams(params)
    if (v === 'register') next.set('view', 'register')
    else next.delete('view')
    setParams(next, { replace: true })
  }
  // Corrections the operator has taken, held as the re-modelled campaign.
  const [fixed, setFixed] = useState({})

  // The analytics tab opens on campaigns; picking one opens it. The other cuts
  // hold the whole book still and slice it by who is inside it instead.
  const byCampaign = cutId === 'campaign'
  const dim = byCampaign ? campaignDimension('campaign') : portfolioSegment(cutId)
  const focus = LIVE_CAMPAIGNS.find((c) => c.id === params.get('campaign')) || null
  // Inside a campaign the campaigns cut has no meaning, so it opens on channel.
  const seg = segment(byCampaign ? 'channel' : cutId)

  // One metric selection serves both levels; each level falls back to its own
  // first measure when the other level's pick has no meaning here.
  const metric = CAMPAIGN_METRICS[dim.metrics.includes(metricId) ? metricId : dim.metrics[0]]
  const total = campaignTotal(dim, metric.id)

  // Inside a campaign the measures belong to the segment, not the portfolio.
  const segMetricId = seg.metrics.includes(metricId) ? metricId : seg.metrics[0]
  const segMetric = SEGMENT_METRICS[segMetricId]
  const segRows = useMemo(() => (focus
    ? segmentBreakdown(focus, seg.id).map((m) => ({
      id: m.id,
      label: m.label,
      sub: m.sub,
      value: segmentValue(m, segMetric.id),
      cells: m,
    })).sort((a, b) => b.value - a.value)
    : []), [focus, seg, segMetric])
  const segTot = focus ? segmentTotal(segmentBreakdown(focus, seg.id), segMetric.id) : 0

  const bars = useMemo(() => dim.members.map((m) => {
    const v = campaignValue(m, metric.id)
    return {
      id: m.id,
      label: m.label,
      sub: m.sub,
      value: v,
      note: metric.weighted
        ? `${((v - total) * 100).toFixed(1)} pts vs portfolio`
        : `${total ? ((v / total) * 100).toFixed(1) : 0}% of the portfolio`,
    }
  }).sort((a, b) => b.value - a.value), [dim, metric, total])

  const lines = useMemo(() => dim.members.map((m, i) => ({
    id: m.id,
    label: m.label,
    slot: i,
    value: campaignValue(m, metric.id),
    points: campaignSeries(m, metric.id),
  })).sort((a, b) => b.value - a.value), [dim, metric])

  // Selecting a campaign scopes the register underneath it. Every other cut
  // runs across the whole book, so there is nothing there to narrow to.
  const inSlice = useMemo(() => {
    if (!selId || !byCampaign) return null
    const m = dim.members.find((x) => x.id === selId)
    return m ? new Set(m.campaigns.map((c) => c.id)) : null
  }, [byCampaign, dim, selId])

  const rows = useMemo(
    () => LIVE_CAMPAIGNS
      .map((c) => fixed[c.id] || c)
      .filter((c) => !inSlice || inSlice.has(c.id))
      .sort(SORTS.find((s) => s.id === sort).cmp),
    [fixed, sort, inSlice],
  )

  const t = LIVE_TOTALS

  const take = (c) => setFixed((prev) => ({ ...prev, [c.id]: applyFix(c.id) }))

  const picked = selId && byCampaign ? dim.members.find((m) => m.id === selId) : null

  const setFocus = (id) => {
    const next = new URLSearchParams(params)
    if (id) next.set('campaign', id)
    else next.delete('campaign')
    next.delete('view')
    setParams(next, { replace: true })
  }

  /** Changing the base cut starts the reading again. */
  const pickCut = (id) => { setCutId(id); setSelId(null); setSegSelId(null) }

  /** Clicking a campaign opens its own analytics, in this same tab. */
  const drill = (id) => {
    // The charts hand back null when the row clicked is already the selected
    // one. Here a click always means "open this campaign", so recover the id.
    const target = id || selId
    if (!target) return
    setSelId(target)
    setSegSelId(null)
    setFocus(target)
  }

  // The agent answers about whatever level you are on: the portfolio of
  // campaigns, or the segment you have one campaign cut by.
  const portfolioCtx = {
    dimLabel: dim.label,
    noun: dim.noun,
    metricLabel: metric.label,
    fmt: metric.fmt,
    total,
    additive: !metric.weighted,
    totalLabel: metric.weighted ? 'portfolio average' : 'portfolio',
    members: bars,
    extras: [
      {
        re: /\b(behind|risk|late|trouble|attention)\b/,
        say: () => {
          const late = LIVE_CAMPAIGNS.filter((c) => c.state === 'behind')
          return late.length
            ? `${late.length} behind pace: ${late.map((c) => `${c.name} at ${crore(c.live.profitCr)} against a ${crore(c.pace)} mark`).join('; ')}.`
            : 'Nothing is behind its pace mark right now.'
        },
      },
      {
        re: /\b(channel|email|whatsapp|sms|call)\b/,
        say: () => {
          const chans = campaignDimension('channel').members
          const best = [...chans].sort((a, b) => (b.responded / b.delivered) - (a.responded / a.delivered))[0]
          const worst = [...chans].sort((a, b) => (a.responded / a.delivered) - (b.responded / b.delivered))[0]
          return `${best.label} converts best at ${pct(best.responded / best.delivered)}; ${worst.label} is lowest at ${pct(worst.responded / worst.delivered)} across ${fmtIN(worst.delivered)} delivered.`
        },
      },
      {
        re: /\b(budget|spend|cost|committed|approved)\b/,
        say: () => `${crore(t.spentCr)} committed of ${crore(t.budgetCr)} approved across ${t.count} campaigns.`,
      },
      {
        re: /\b(fix|fixed|fixes|recover|correction|swap|reroute)\b/,
        say: () => {
          const flagged = LIVE_CAMPAIGNS.filter((c) => c.fix)
          return flagged.length
            ? `${flagged.length} campaigns carry an under-converting channel — moving the unsent volume is worth ${lakh(flagged.reduce((n, c) => n + c.fix.recoveryCr, 0))} in all.`
            : 'No campaign is carrying an under-converting channel.'
        },
      },
    ],
  }

  const focusCtx = focus && {
    scopeLabel: focus.name,
    dimLabel: seg.label,
    noun: seg.noun,
    metricLabel: segMetric.label,
    fmt: segMetric.fmt,
    total: segTot,
    additive: !segMetric.weighted,
    totalLabel: segMetric.weighted ? `${focus.name} average` : focus.name,
    members: segRows,
    extras: [
      {
        re: /\b(pace|plan|target|behind|ahead|track)\b/,
        say: () => `${focus.name} is at ${crore(focus.live.profitCr)} against a ${crore(focus.pace)} pace mark on day ${focus.day} of ${focus.windowDays} — ${(focus.ratio * 100).toFixed(0)}% of where it should be, on a ${crore(focus.target)} plan.`,
      },
      {
        re: /\b(audience|cardholder|who|reach|delivered|cohort)\b/,
        say: () => `${fmtIN(focus.audience)} cardholders in the ${focus.cohortLabel} cohort, ${fmtIN(focus.live.delivered)} messages delivered so far and ${fmtIN(focus.live.responded)} acting — ${pct(focus.live.responseRate)}.`,
      },
      {
        re: /\b(spend|cost|budget|invest|roi)\b/,
        say: () => `${crore(focus.spentCr)} committed of ${crore(focus.investCr)} approved, plus ${rupees(focus.sendCostRs)} in sends, against a ${focus.roiX.toFixed(1)}× plan.`,
      },
      {
        re: /\b(fix|fixed|fixes|recover|correction|swap|reroute|under)\b/,
        say: () => (focus.fix
          ? `${focus.fix.fromName} is converting at ${pct(focus.fix.fromRate)}, under the ${pct(FLOOR, 0)} floor. Moving its ${fmtIN(focus.fix.moved)} unsent messages to ${focus.fix.toName} at ${pct(focus.fix.toRate)} is worth ${lakh(focus.fix.recoveryCr)}.`
          : `Every channel on ${focus.name} is clearing the ${pct(FLOOR, 0)} floor — nothing to reroute.`),
      },
      {
        re: /\b(cut|segment|slice|other|else)\b/,
        say: () => `I can cut ${focus.name} by ${SEGMENTS.map((x) => x.label.toLowerCase()).join(', ')}. You are on ${seg.label.toLowerCase()} right now.`,
      },
    ],
  }

  const ctx = focusCtx || portfolioCtx

  const asks = focus
    ? [
      `Which ${seg.noun} is highest?`,
      'Is it on pace?',
      'What can be fixed?',
      'What else can I cut it by?',
    ]
    : [
      `Which ${dim.noun} is highest?`,
      'What is behind pace?',
      'Which channel converts best?',
      'How much budget is committed?',
    ]

  return (
    <div className={styles.wrap}>
      {view === 'analytics' && !focus && (
        <>
          <div className={styles.controls}>
            <Dropdown label="Cut by" options={CUTS} value={cutId} onChange={pickCut} />
            <span className={styles.rule} aria-hidden="true" />
            <div className={styles.metrics}>
              {dim.metrics.map((id) => (
                <button
                  key={id}
                  type="button"
                  className={`${styles.mChip} ${metric.id === id ? styles.mChipOn : ''}`}
                  onClick={() => setMetricId(id)}
                  aria-pressed={metric.id === id}
                >
                  {CAMPAIGN_METRICS[id].label}
                </button>
              ))}
            </div>
          </div>

          {!byCampaign && (
            <div className={styles.lede}>
              {dim.lede} Every campaign is broken down and the parts with the same name added together, so this is the sum of the five campaigns rather than a second reading of them.
            </div>
          )}

          <div className={styles.trend}>
            <SeriesChart rows={lines} metric={metric} selectedId={selId} onSelect={setSelId} />
          </div>

          <div className={styles.body}>
            <RankedBars
              rows={bars}
              metric={metric}
              selectedId={selId}
              onSelect={byCampaign ? drill : setSelId}
            />
            <div className={styles.bodyFoot}>
              {metric.weighted
                ? `Portfolio ${metric.fmt(total)}, weighted by delivered volume`
                : `${metric.fmt(total)} across ${bars.length} ${dim.noun}s`}
            </div>
          </div>

          <div className={styles.summary}>
            <div className={styles.summaryHead}>
              <span className={styles.summaryK}>Summary</span>
              <span className={styles.summaryNote}>
                Every figure the charts above encode · portfolio totals under each column
              </span>
            </div>
            <SummaryTable
              head={byCampaign ? 'Campaign' : dim.label}
              columns={dim.metrics.map((id) => ({
                id, label: CAMPAIGN_METRICS[id].label, fmt: CAMPAIGN_METRICS[id].fmt,
                tone: CAMPAIGN_METRICS[id].tone,
              }))}
              rows={dim.members.map((m) => ({
                id: m.id,
                label: m.label,
                sub: m.sub,
                cells: Object.fromEntries(dim.metrics.map((id) => [id, campaignValue(m, id)])),
              }))}
              totals={Object.fromEntries(dim.metrics.map((id) => [id, campaignTotal(dim, id)]))}
              selectedId={selId}
              onSelect={byCampaign ? drill : setSelId}
              flag={(r) => r.cells.rate < FLOOR}
            />
          </div>
        </>
      )}

      {/* ── One campaign, cut by who is inside it ── */}
      {view === 'analytics' && focus && (
        <>
          <div className={styles.focusHead}>
            <button type="button" className={styles.back} onClick={() => setFocus(null)}>
              ← All campaigns
            </button>
            <h2 className={styles.focusName}>{focus.name}</h2>
          </div>

          <div className={styles.controls}>
            <Dropdown
              label="Cut by"
              options={SEGMENTS.map((x) => ({ id: x.id, label: x.label, sub: x.lede }))}
              value={seg.id}
              onChange={(id) => { setCutId(id); setSegSelId(null) }}
            />
            <span className={styles.rule} aria-hidden="true" />
            <div className={styles.metrics}>
              {seg.metrics.map((id) => (
                <button
                  key={id}
                  type="button"
                  className={`${styles.mChip} ${segMetric.id === id ? styles.mChipOn : ''}`}
                  onClick={() => setMetricId(id)}
                  aria-pressed={segMetric.id === id}
                >
                  {SEGMENT_METRICS[id].label}
                </button>
              ))}
            </div>
          </div>

          {seg.lede && (
            <div className={styles.lede}>
              {seg.lede}{seg.id === 'channel' ? '' : ' Delivery is attributed by audience share and response weighted by risk and value, so the parts add back to the campaign.'}
            </div>
          )}

          <div className={styles.focusBody}>
            <div className={styles.focusChart}>
              <RankedBars
                rows={segRows}
                metric={segMetric}
                selectedId={segSelId}
                onSelect={setSegSelId}
              />
              <div className={styles.bodyFoot}>
                {segMetric.weighted
                  ? `${segMetric.fmt(segTot)} across the campaign`
                  : `${segMetric.fmt(segTot)} across ${segRows.length} ${seg.noun}s`}
              </div>
            </div>

            <aside className={styles.focusSide}>
              <div className={styles.sideK}>Profit against plan</div>
              <TrendLine
                points={campaignSeries(
                  dim.members.find((m) => m.id === focus.id), 'profit',
                )}
                metric={CAMPAIGN_METRICS.profit}
                label={focus.name}
              />
              {focus.fix && (
                <div className={styles.sideFix}>
                  <b>{focus.fix.fromName}</b> is converting at {pct(focus.fix.fromRate)} — moving its
                  unsent volume to {focus.fix.toName} is worth {lakh(focus.fix.recoveryCr)}.
                </div>
              )}
            </aside>
          </div>

          <div className={styles.summary}>
            <div className={styles.summaryHead}>
              <span className={styles.summaryK}>Summary</span>
              <span className={styles.summaryNote}>
                {focus.name} by {seg.label.toLowerCase()} · campaign totals under each column
              </span>
            </div>
            <SummaryTable
              head={seg.label}
              columns={seg.metrics.map((id) => ({
                id, label: SEGMENT_METRICS[id].label, fmt: SEGMENT_METRICS[id].fmt,
                tone: SEGMENT_METRICS[id].tone,
              }))}
              rows={segRows.map((r) => ({
                id: r.id,
                label: r.label,
                sub: r.sub,
                cells: Object.fromEntries(seg.metrics.map((id) => [id, segmentValue(r.cells, id)])),
              }))}
              totals={Object.fromEntries(seg.metrics.map((id) => [
                id, segmentTotal(segmentBreakdown(focus, seg.id), id),
              ]))}
              selectedId={segSelId}
              onSelect={setSegSelId}
              flag={(r) => r.cells.rate < FLOOR}
            />
          </div>
        </>
      )}

      {view === 'register' && (
      <>
      {picked && (
        <div className={styles.from}>
          <span className={styles.fromKick}>Filtered from analytics</span>
          <span className={styles.fromTitle}>
            {picked.label} · {metric.fmt(campaignValue(picked, metric.id))} {metric.label.toLowerCase()}
          </span>
          <button type="button" className={styles.fromClear} onClick={() => setSelId(null)}>
            Show all
          </button>
        </div>
      )}

      <div className={styles.tableHead}>
        <span className={styles.tableKick}>
          {rows.length} campaign{rows.length === 1 ? '' : 's'}
        </span>
        <span className={styles.sortGroup}>
          <span className={styles.sortK}>Sort</span>
          {SORTS.map((s) => (
            <button
              key={s.id}
              type="button"
              className={`${styles.sortBtn} ${sort === s.id ? styles.sortOn : ''}`}
              onClick={() => setSort(s.id)}
              aria-pressed={sort === s.id}
            >
              {s.label}
            </button>
          ))}
        </span>
      </div>

      <div className={styles.table}>
        <div className={styles.rowHead}>
          <div>Campaign</div>
          <div className={styles.num}>Audience</div>
          <div>Send window</div>
          <div className={styles.num}>Response</div>
          <div>Profit against plan</div>
          <div />
        </div>

        {rows.map((c) => (
          <Row
            key={c.id}
            c={c}
            open={openId === c.id}
            onToggle={() => setOpenId(openId === c.id ? null : c.id)}
            onTake={() => take(c)}
          />
        ))}
      </div>
      </>
      )}

      <AskAgent ctx={ctx} suggestions={asks} />
    </div>
  )
}

/* ── Pieces ───────────────────────────────────────────────────────── */

function Row({ c, open, onToggle, onTake }) {
  const l = c.live
  return (
    <div className={`${styles.campaign} ${open ? styles.campaignOpen : ''}`}>
      <button type="button" className={styles.row} onClick={onToggle} aria-expanded={open}>
        <span className={styles.cellName}>
          <span className={`${styles.tag} ${styles[`tag_${c.cohortBand}`]}`}>{c.cohortTag}</span>
          <span className={styles.nameText}>
            <span className={styles.name}>{c.name}</span>
            <span className={styles.code}>{c.code} · {c.cohortLabel}</span>
          </span>
        </span>

        <span className={styles.num}>{fmtIN(c.audience)}</span>

        <span className={styles.window}>
          <span className={styles.windowTop}>
            Day {c.day} of {c.windowDays}
            <span className={styles.windowLeft}>
              {c.daysLeft ? `${c.daysLeft}d left` : 'closing'}
            </span>
          </span>
          <span className={styles.windowTrack}>
            <span className={styles.windowFill} style={{ width: `${c.progress * 100}%` }} />
          </span>
        </span>

        <span className={styles.num}>
          <span className={styles.respV}>{pct(l.responseRate)}</span>
          <span className={styles.respSub}>{fmtIN(l.responded)} acted</span>
        </span>

        <span className={styles.profit}>
          <span className={styles.profitTop}>
            <b>{crore(l.profitCr)}</b>
            <span className={styles.profitOf}>of {crore(c.target)}</span>
          </span>
          <span className={styles.track}>
            <span
              className={`${styles.fill} ${c.state === 'behind' ? styles.fillBad : ''}`}
              style={{ width: `${Math.min(100, (l.profitCr / c.target) * 100)}%` }}
            />
            <span className={styles.pace} style={{ left: `${(c.pace / c.target) * 100}%` }} title="Pace mark" />
          </span>
        </span>

        <span className={styles.right}>
          <span className={`${styles.state} ${styles[`state_${c.stateTone}`]}`}>{c.stateLabel}</span>
          {c.fix && <span className={styles.flag} title="A channel is under the floor">!</span>}
          {c.appliedFix && <span className={styles.fixedFlag} title="Correction applied">✓</span>}
          <span className={`${styles.caret} ${open ? styles.caretOpen : ''}`} aria-hidden="true">▾</span>
        </span>
      </button>

      {open && <Expanded c={c} onTake={onTake} />}
    </div>
  )
}

function Expanded({ c, onTake }) {
  const l = c.live
  return (
    <div className={styles.expand}>
      <div className={styles.expandMain}>
        <p className={styles.desc}>{c.desc}</p>

        <div className={styles.chTable}>
          <div className={styles.chHead}>
            <div>Channel</div><div>Delivered</div><div>Opened</div><div>Acted</div>
            <div>Rate</div><div>Unsent</div>
          </div>
          {l.channels.map((ch) => (
            <div key={ch.id} className={`${styles.chRow} ${ch.under ? styles.chUnder : ''}`}>
              <div className={styles.chName}>
                {ch.name}
                {ch.under && <span className={styles.underTag}>under</span>}
                {ch.movedIn > 0 && <span className={styles.movedTag}>+{fmtIN(ch.movedIn)}</span>}
              </div>
              <div>{fmtIN(ch.delivered)}</div>
              <div>{fmtIN(ch.opened)}</div>
              <div>{fmtIN(ch.acted)}</div>
              <div className={ch.under ? styles.rateBad : styles.rateOk}>{pct(ch.rate)}</div>
              <div>{ch.pending ? fmtIN(ch.pending) : '—'}</div>
            </div>
          ))}
        </div>

        {c.fix && (
          <div className={styles.fixBox}>
            <div className={styles.fixKick}>⚡ The agent&apos;s course-correction</div>
            <div className={styles.fixTitle}>
              Move the {fmtIN(c.fix.moved)} unsent {c.fix.fromName} messages onto {c.fix.toName}
            </div>
            <div className={styles.fixText}>
              {c.fix.fromName} is converting at <b>{pct(c.fix.fromRate)}</b>, below the{' '}
              {pct(FLOOR, 0)} floor, while {c.fix.toName} runs at <b>{pct(c.fix.toRate)}</b> on the
              same cohort. Projected recovery <b>+{lakh(c.fix.recoveryCr)}</b> from{' '}
              <b>+{fmtIN(c.fix.gainedResponders)}</b> responders, for{' '}
              {c.fix.costDelta >= 0
                ? `${rupees(c.fix.costDelta)} more`
                : `${rupees(-c.fix.costDelta)} less`}{' '}
              in send cost.
            </div>
            <div className={styles.fixActions}>
              <Button variant="primary" onClick={onTake}>Apply the correction</Button>
            </div>
          </div>
        )}

        {c.appliedFix && (
          <div className={styles.doneBox}>
            <b>Correction applied.</b> The remaining {c.appliedFix.fromName} volume now goes out on{' '}
            {c.appliedFix.toName}, worth a projected +{lakh(c.appliedFix.recoveryCr)} on this campaign.
          </div>
        )}
      </div>

      <aside className={styles.expandSide}>
        <Fact k="Campaign" v={c.code} />
        <Fact k="Owner" v={c.owner} />
        <Fact k="Launched" v={`${c.launched} · ${c.windowDays}-day window`} />
        <Fact k="Channels" v={c.channelNames.join(', ')} />
        <Fact k="Approved plan" v={`${crore(c.target)} on ${crore(c.investCr)} · ${c.roiX.toFixed(1)}×`} />
        <Fact k="Committed so far" v={`${crore(c.spentCr)} incentive · ${rupees(c.sendCostRs)} send`} />
        <Fact
          k="Running rate"
          v={`${pct(l.openRate, 0)} open · ${pct(l.responseRate)} response`}
        />
      </aside>
    </div>
  )
}

function Fact({ k, v }) {
  return (
    <div className={styles.fact}>
      <div className={styles.factK}>{k}</div>
      <div className={styles.factV}>{v}</div>
    </div>
  )
}
