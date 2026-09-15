import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import {
  BadgeCheck, CheckCircle2, CreditCard, FileText, Package,
  ShieldCheck, Sliders, Wallet, Zap,
} from 'lucide-react'
import TrendChart from '../../components/charts/TrendChart.jsx'
import ApplicantDrawer from '../../components/drawers/ApplicantDrawer.jsx'
import StageDrawer from '../../components/drawers/StageDrawer.jsx'
import { fmtIN } from '../../data/portfolio.js'
import { ONBOARDING_STAGES } from '../../data/onboarding.js'
import { ONBOARD } from '../../data/onboard.js'
import {
  METRIC_KINDS, TREND_METRICS, TREND_SEGMENTS, WEEK_LABELS, trendSeries,
} from '../../data/onboardingTrends.js'
import {
  ageingBands, blockerGroups, bookSummary, inr, lossReasons, openQueue, outcomeBy, ownerSplit,
  priorityQueue, stageTable,
} from '../../state/useOnboarding.js'
import styles from './OnboardingAnalytics.module.css'

/* A quick visual for the stage that owns each failure — the same picture the
   pipeline uses, so scanning the causes reads like reading the funnel. */
const STAGE_ICON = {
  'Application submitted': FileText,
  'KYC verified': ShieldCheck,
  'Income verified': Wallet,
  'Approved': BadgeCheck,
  'Limit assigned': Sliders,
  'Card delivered': Package,
  'Activated': Zap,
  'First spend': CreditCard,
}
const StageIcon = ({ stage }) => {
  const Icon = STAGE_ICON[stage] || CheckCircle2
  return <Icon size={16} strokeWidth={1.75} aria-hidden="true" />
}

/* Applicant avatars. Initials from the first two words, hue derived from the
   name so the same person always gets the same swatch. */
const initials = (name = '') => name.trim().split(/\s+/).slice(0, 2).map((p) => p[0] || '').join('').toUpperCase()
const AVATAR_HUES = [214, 260, 340, 12, 42, 160, 190, 288]
const avatarHue = (name = '') => {
  let h = 0
  for (let i = 0; i < name.length; i += 1) h = (h * 31 + name.charCodeAt(i)) >>> 0
  return AVATAR_HUES[h % AVATAR_HUES.length]
}
const Avatar = ({ name }) => (
  <span
    className={styles.avatar}
    style={{ background: `hsl(${avatarHue(name)} 70% 92%)`, color: `hsl(${avatarHue(name)} 55% 32%)` }}
    aria-hidden="true"
  >
    {initials(name)}
  </span>
)

const BREAKDOWNS = [
  { key: 'channel', label: 'Source channel' },
  { key: 'kyc', label: 'KYC mode' },
  { key: 'variant', label: 'Card variant', order: ['Visa Platinum', 'Visa Signature', 'Visa Infinite'] },
  { key: 'city', label: 'City' },
]

// Which slice of the open book the full list shows. The written ten are worth
// singling out: they are the only rows carrying signals and a recommended fix.
const SCOPES = [
  { key: 'all', label: 'All open' },
  { key: 'sla', label: 'Past SLA' },
  { key: 'written', label: 'Written files' },
]

// Rows per page. The open book runs to ~1,850 files, so the list pages rather
// than mounting all of them at once.
const PAGE = 50

const TABS = [
  { key: 'overview', label: 'Overview' },
  { key: 'queue', label: 'Priority queue' },
  { key: 'breakdown', label: 'Application breakdown' },
]

export default function OnboardingAnalytics() {
  // The tab lives in the URL — the sidebar's Analytics sub-items link to it —
  // so a file opened from the priority queue can send the reader back to the
  // queue rather than to the overview.
  const [params] = useSearchParams()
  const requested = params.get('tab')
  const tab = TABS.some((t) => t.key === requested) ? requested : 'overview'

  const [stageId, setStageId] = useState(null)
  const [caseId, setCaseId] = useState(null)
  const [scope, setScope] = useState('all')
  const [stageId2, setStageId2] = useState('all')
  const [query, setQuery] = useState('')
  const [page, setPage] = useState(0)
  const [dim, setDim] = useState('channel')
  const [metricId, setMetricId] = useState('spent')
  const [segId, setSegId] = useState('channel')

  const funnel = useMemo(() => stageTable(), [])
  const book = useMemo(() => bookSummary(), [])
  const blockers = useMemo(() => blockerGroups(), [])
  const owners = useMemo(() => ownerSplit(), [])
  const ageing = useMemo(() => ageingBands(), [])
  const allOpen = useMemo(() => openQueue(), [])
  const top = useMemo(() => priorityQueue(), [])

  const filtersOn = scope !== 'all' || stageId2 !== 'all' || query.trim() !== ''
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return allOpen.filter((r) => {
      if (scope === 'written' && !r.featured) return false
      if (scope === 'sla' && !r.breached) return false
      if (stageId2 !== 'all' && r.stuckAt !== stageId2) return false
      if (q && !r.name.toLowerCase().includes(q) && !r.city.toLowerCase().includes(q)) return false
      return true
    })
  }, [allOpen, scope, stageId2, query])

  // Clamped rather than trusted: every filter setter resets the page, but a
  // clamp here means a stale page can never render an empty table.
  const pages = Math.max(1, Math.ceil(filtered.length / PAGE))
  const safePage = Math.min(page, pages - 1)
  const from = safePage * PAGE
  const rows = filtered.slice(from, from + PAGE)
  const breakdown = useMemo(
    () => outcomeBy(dim, BREAKDOWNS.find((b) => b.key === dim)?.order ?? null),
    [dim],
  )
  const reasons = useMemo(() => lossReasons(), [])
  // The book-level failure figure the loss columns are shares of. Summed from
  // the rows below it rather than derived from the completion rate, so the
  // headline and the table it introduces cannot round apart.
  const lost = useMemo(() => {
    const failed = funnel.reduce((n, s) => n + s.stopped, 0)
    return { failed, failedRate: book.total ? failed / book.total : 0 }
  }, [funnel, book.total])
  const trend = useMemo(() => trendSeries(metricId, segId), [metricId, segId])

  // A selection belongs to the tab that made it, so the tab decides which one
  // is live rather than every route to a tab change having to clear it. The
  // tab lives in the URL: Back, Forward and a pasted link all change it
  // without passing through the click handler, and a stale caseId would
  // otherwise dock an applicant panel over the Overview tab and swallow every
  // stage-row click.
  const stage = tab === 'overview' && stageId ? funnel.find((s) => s.id === stageId) : null
  const openCase = tab === 'queue' && caseId ? allOpen.find((c) => c.id === caseId) : null

  // A row is a real link to the file's own page, so cmd-click, middle-click and
  // copy-link all behave. A plain click keeps the reader in the queue and docks
  // the file beside it instead — the modifier check runs before preventDefault
  // so the browser keeps the clicks it should own.
  const openRow = (e, id) => {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return
    e.preventDefault()
    // Always open, never toggle: the same applicant can appear in both the
    // shortlist and the paged list, and clicking them in the second table
    // closed the panel the first had opened. Closing is the × and Escape.
    setCaseId(id)
  }

  const worst = useMemo(() => [...funnel].sort((a, b) => b.stopped - a.stopped)[0], [funnel])

  // Escape closes whichever panel is docked. Only one can be: they live on
  // different tabs, and everything that changes what the queue lists clears the
  // file it had open.
  useEffect(() => {
    if (!stageId && !caseId) return undefined
    const onKey = (e) => { if (e.key === 'Escape') { setStageId(null); setCaseId(null) } }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [stageId, caseId])

  const stats = [
    { k: 'Applications this quarter', v: fmtIN(book.total), n: `${(book.completedPct * 100).toFixed(0)}% reached first spend` },
    { k: 'Open right now', v: fmtIN(book.open), n: `${fmtIN(book.pastSla)} past three times their step SLA` },
    { k: 'Value at stake', v: inr(book.valueAtStake), n: 'modelled first-year value, still open' },
    { k: 'Awaiting a limit', v: fmtIN(book.awaitingLimit), n: 'approved, no limit assigned yet' },
  ]

  return (
    <div className={styles.wrap}>
      <div className={styles.col}>
          <div className={styles.head}>
          <h1 className={styles.h1}>Onboarding analytics</h1>
          <div className={styles.sub}>
            The stretch before the lifecycle screens pick a cardholder up — from a submitted
            application to a card that has been used. {fmtIN(book.total)} applications this quarter,
            of which {fmtIN(book.open)} are still open and workable.
          </div>
        </div>

        <div className={styles.stats}>
          {stats.map((s) => (
            <div key={s.k} className={styles.stat}>
              <div className={styles.statK}>{s.k}</div>
              <div className={styles.statV}>{s.v}</div>
              <div className={styles.statN}>{s.n}</div>
            </div>
          ))}
        </div>

        {/* ── Overview ────────────────────────────────────────────────── */}
        {tab === 'overview' && (
          <div role="tabpanel" id="panel-overview" aria-labelledby="tab-overview">
            {/* Reach and loss in one grid. The bar is how far the stage got;
                the columns to its right are what it cost to get there. One
                table rather than two, so the same eight rows are not restated
                on the breakdown tab under different headings. */}
            <section className={styles.panel}>
              <div className={styles.panelTitle}>Every stage, reached and lost</div>
              <div className={styles.panelSub}>
                {fmtIN(lost.failed)} of the {fmtIN(book.total)} applications this quarter never
                reached first spend — {(lost.failedRate * 100).toFixed(0)}% of the book. The
                largest single loss is <strong>{worst.label}</strong>, where {fmtIN(worst.stopped)}
                {' '}end. <strong>Of arrivals</strong> is the stage&apos;s own leak, out of everyone
                who got that far; <strong>of losses</strong> is its share of all
                {' '}{fmtIN(lost.failed)}. Still workable counts the ones inside the 30-day window;
                the rest are written off. Select a stage to open its detail.
              </div>

              <div className={styles.wideWrap}>
                <div className={`${styles.rowHead} ${styles.stageGrid}`}>
                  <div>Stage</div>
                  <div />
                  <div className={styles.num}>Reached</div>
                  <div className={styles.num}>Lost here</div>
                  <div className={styles.num}>Of arrivals</div>
                  <div className={styles.num}>Of losses</div>
                  <div className={styles.num}>Workable</div>
                  <div className={styles.num}>Written off</div>
                </div>

                {funnel.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    className={`${styles.fRow} ${styles.stageGrid} ${s.id === stageId ? styles.fRowOn : ''}`}
                    onClick={() => setStageId(s.id === stageId ? null : s.id)}
                  >
                    <div>
                      <div className={styles.fName}>
                        <span className={styles.tag}>{s.tag}</span>
                        {s.label}
                      </div>
                      <div className={styles.dim}>{s.line}</div>
                    </div>
                    <div className={styles.track}>
                      <div className={styles.fill} style={{ width: `${s.ofStart * 100}%` }} />
                    </div>
                    <div className={`${styles.num} ${styles.strong}`}>
                      {fmtIN(s.reached)}
                      <div className={styles.dim}>{(s.ofStart * 100).toFixed(0)}% of start</div>
                    </div>
                    <div className={`${styles.num} ${styles.strong}`}>{fmtIN(s.stopped)}</div>
                    <div className={`${styles.num} ${s.ofArrivals > 0.15 ? styles.bad : ''}`}>
                      {(s.ofArrivals * 100).toFixed(0)}%
                    </div>
                    <div className={styles.num}>{(s.ofFailures * 100).toFixed(0)}%</div>
                    <div className={styles.num}>{fmtIN(s.stillOpen)}</div>
                    <div className={`${styles.num} ${styles.dimInline}`}>{fmtIN(s.writtenOff)}</div>
                  </button>
                ))}
              </div>
            </section>

            <div className={styles.cols}>
              <section className={styles.panel}>
                <div className={styles.panelTitle}>Who has to move</div>
                <div className={styles.panelSub}>
                  The {fmtIN(book.open)} open applications by whoever owns the next step.
                </div>
                <div className={styles.bars}>
                  {owners.map((o) => (
                    <div key={o.owner} className={styles.barRow}>
                      <div className={styles.barLabel}>{o.owner}</div>
                      <div className={styles.track}>
                        <div className={styles.fill} style={{ width: `${o.share * 100}%` }} />
                      </div>
                      <div className={styles.barNum}>{fmtIN(o.count)}</div>
                    </div>
                  ))}
                </div>
              </section>

              <section className={styles.panel}>
                <div className={styles.panelTitle}>How long they have waited</div>
                <div className={styles.panelSub}>
                  Anything past a month reads as written off rather than open.
                </div>
                <div className={styles.bars}>
                  {ageing.map((a) => (
                    <div key={a.label} className={styles.barRow}>
                      <div className={styles.barLabel}>{a.label}</div>
                      <div className={styles.track}>
                        <div
                          className={styles.fill}
                          style={{ width: `${a.share * 100}%`, background: a.hi > 14 ? 'var(--c-danger)' : 'var(--c-brand)' }}
                        />
                      </div>
                      <div className={styles.barNum}>{fmtIN(a.count)}</div>
                    </div>
                  ))}
                </div>
              </section>
            </div>
          </div>
        )}

        {/* ── Priority queue ──────────────────────────────────────────── */}
        {tab === 'queue' && (
          <div role="tabpanel" id="panel-queue" aria-labelledby="tab-queue">
            {/* 1 — the shortlist. Who gets worked before anyone else. */}
            <section className={styles.panel}>
              <div className={styles.panelTitle}>Work these first</div>

              <div className={styles.tableWrap}>
                <div className={`${styles.rowHead} ${styles.topGrid}`}>
                  <div />
                  <div>Applicant</div>
                  <div>Stopped at</div>
                  <div>What is holding it</div>
                  <div className={styles.num}>Waiting</div>
                  <div className={styles.num}>Value</div>
                </div>

                {top.map((c, i) => (
                  <Link
                    key={c.id}
                    to={`/pm/analytics/applicant/${c.id}`}
                    onClick={(e) => openRow(e, c.id)}
                    aria-current={c.id === caseId ? 'true' : undefined}
                    className={`${styles.fRow} ${styles.topGrid} ${c.id === caseId ? styles.fRowOn : ''}`}
                  >
                    <div className={styles.rank}>{i + 1}</div>
                    <div className={styles.who}>
                      <Avatar name={c.name} />
                      <div>
                        <div className={styles.fName}>
                          {c.name}
                          {c.featured && <span className={styles.tag}>File</span>}
                        </div>
                        <div className={styles.dim}>{c.city} · {c.variant}</div>
                      </div>
                    </div>
                    <div className={styles.dimInline}>{c.stage.label}</div>
                    <div className={styles.wrapText}>{c.blocker}</div>
                    <div className={`${styles.num} ${c.breached ? styles.bad : ''}`}>
                      {c.days}d
                      <div className={styles.dim}>target {c.stage.slaDays}d</div>
                    </div>
                    <div className={styles.num}>{inr(c.value)}</div>
                  </Link>
                ))}
              </div>
            </section>

            {/* 2 — the whole open book, filtered and paged. */}
            <section className={styles.panel}>
              <div className={styles.panelTitle}>Every open application</div>
              <div className={styles.panelSub}>
                All {fmtIN(book.open)} workable files, longest-waiting first. Ten of them are
                written up in full — what the file shows and what clears it.
              </div>

              <div className={styles.filters}>
                <input
                  type="search"
                  className={styles.search}
                  placeholder="Search a name or city"
                  aria-label="Search applicants by name or city"
                  value={query}
                  onChange={(e) => { setQuery(e.target.value); setPage(0); setCaseId(null) }}
                />

                <label className={styles.field}>
                  <span className={styles.fieldLabel}>Stage</span>
                  <select
                    className={styles.select}
                    value={stageId2}
                    onChange={(e) => { setStageId2(e.target.value); setPage(0); setCaseId(null) }}
                  >
                    <option value="all">Any stage</option>
                    {ONBOARDING_STAGES.map((s) => (
                      <option key={s.id} value={s.id}>{s.label}</option>
                    ))}
                  </select>
                </label>

                <div className={styles.seg} role="group" aria-label="Which applications to list">
                  {SCOPES.map((s) => (
                    <button
                      key={s.key}
                      type="button"
                      aria-pressed={scope === s.key}
                      className={`${styles.segBtn} ${scope === s.key ? styles.segOn : ''}`}
                      onClick={() => { setScope(s.key); setPage(0); setCaseId(null) }}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>

                {filtersOn && (
                  <button
                    type="button"
                    className={styles.clear}
                    onClick={() => { setQuery(''); setStageId2('all'); setScope('all'); setPage(0); setCaseId(null) }}
                  >
                    Clear filters
                  </button>
                )}
              </div>

              <div className={styles.countLine} aria-live="polite">
                {filtered.length === 0
                  ? 'No matches'
                  : `Showing ${fmtIN(from + 1)}–${fmtIN(from + rows.length)} of ${fmtIN(filtered.length)}`}
                {filtersOn && filtered.length > 0 && ` matching · ${fmtIN(book.open)} open in all`}
              </div>

              <div className={styles.tableWrap}>
                <div className={`${styles.rowHead} ${styles.stickyHead} ${styles.queueGrid}`}>
                  <div>Applicant</div>
                  <div>Stopped at</div>
                  <div>What is holding it</div>
                  <div className={styles.num}>Waiting</div>
                  <div className={styles.num}>Value</div>
                </div>

                {rows.length === 0 && (
                  <div className={styles.empty}>
                    Nobody matches those filters. Clear them to see the whole open book.
                  </div>
                )}

                {rows.map((c) => (
                  <Link
                    key={c.id}
                    to={`/pm/analytics/applicant/${c.id}`}
                    onClick={(e) => openRow(e, c.id)}
                    aria-current={c.id === caseId ? 'true' : undefined}
                    className={`${styles.fRow} ${styles.queueGrid} ${c.id === caseId ? styles.fRowOn : ''}`}
                  >
                    <div className={styles.who}>
                      <Avatar name={c.name} />
                      <div>
                        <div className={styles.fName}>
                          {c.name}
                          {c.featured && <span className={styles.tag}>File</span>}
                        </div>
                        <div className={styles.dim}>{c.city} · {c.variant} · {c.channel}</div>
                      </div>
                    </div>
                    <div className={styles.dimInline}>{c.stage.label}</div>
                    <div className={styles.wrapText}>{c.blocker}</div>
                    <div className={`${styles.num} ${c.breached ? styles.bad : ''}`}>{c.days}d</div>
                    <div className={styles.num}>{inr(c.value)}</div>
                  </Link>
                ))}
              </div>

              {pages > 1 && (
                <div className={styles.pager}>
                  <button
                    type="button"
                    className={styles.pageBtn}
                    disabled={safePage === 0}
                    onClick={() => setPage(safePage - 1)}
                  >
                    ← Previous
                  </button>
                  <div className={styles.pageNum}>Page {safePage + 1} of {fmtIN(pages)}</div>
                  <button
                    type="button"
                    className={styles.pageBtn}
                    disabled={safePage >= pages - 1}
                    onClick={() => setPage(safePage + 1)}
                  >
                    Next →
                  </button>
                </div>
              )}
            </section>

            <section className={styles.panel}>
              <div className={styles.panelTitle}>Unblock queue, by cause</div>
              <div className={styles.panelSub}>
                The same open applications grouped by what is holding them, so a cause is fixed
                once rather than chased file by file. Ordered by how many files it clears.
              </div>

              <div className={styles.tableWrap}>
                <div className={`${styles.rowHead} ${styles.groupGrid}`}>
                  <div>Blocker</div>
                  <div>Stage</div>
                  <div>What clears it</div>
                  <div>Owner</div>
                  <div className={styles.num}>Files</div>
                  <div className={styles.num}>Oldest</div>
                  <div className={styles.num}>Value</div>
                </div>
                {blockers.map((b) => (
                  <div key={b.reason} className={`${styles.rowStatic} ${styles.groupGrid}`}>
                    <div className={styles.strong}>{b.reason}</div>
                    <div className={styles.dimInline}>{b.stage}</div>
                    <div className={styles.wrapText}>{b.action}</div>
                    <div><span className={styles.pill}>{b.owner}</span></div>
                    <div className={`${styles.num} ${styles.strong}`}>{fmtIN(b.count)}</div>
                    <div className={styles.num}>{b.oldest}d</div>
                    <div className={styles.num}>{inr(b.value)}</div>
                  </div>
                ))}
              </div>
            </section>
          </div>
        )}

        {/* ── Application breakdown ───────────────────────────────────── */}
        {tab === 'breakdown' && (
          <div role="tabpanel" id="panel-breakdown" aria-labelledby="tab-breakdown">
            <section className={styles.panel}>
              <div className={styles.panelHead}>
                <div>
                  <div className={styles.panelTitle}>{trend.metric.label}, over the quarter</div>
                </div>
                <div className={styles.controls}>
                  <label className={styles.field}>
                    <span className={styles.fieldLabel}>Metric</span>
                    <select className={styles.select} value={metricId} onChange={(e) => setMetricId(e.target.value)}>
                      {METRIC_KINDS.map((k) => (
                        <optgroup key={k.kind} label={k.label}>
                          {TREND_METRICS.filter((m) => m.kind === k.kind).map((m) => (
                            <option key={m.id} value={m.id}>{m.label}</option>
                          ))}
                        </optgroup>
                      ))}
                    </select>
                  </label>
                  <label className={styles.field}>
                    <span className={styles.fieldLabel}>Segment</span>
                    <select className={styles.select} value={segId} onChange={(e) => setSegId(e.target.value)}>
                      {TREND_SEGMENTS.map((sg) => <option key={sg.id} value={sg.id}>{sg.label}</option>)}
                    </select>
                  </label>
                </div>
              </div>

              <div className={styles.chart}>
                <TrendChart series={trend.series} labels={WEEK_LABELS} />
              </div>
            </section>

            {/* The named causes behind the losses — the whole book, not just
                the workable queue. */}
            <section className={styles.panel}>
              <div className={styles.panelTitle}>What went wrong</div>
              <div className={styles.panelSub}>
                Every reason the book lost an application, across all
                {' '}{fmtIN(lost.failed)} failures rather than the open queue alone. The top ten of
                {' '}{reasons.length} causes.
              </div>

              <div className={styles.wideWrap}>
                <div className={`${styles.rowHead} ${styles.reasonGrid}`}>
                  <div>Cause</div>
                  <div>Stage</div>
                  <div>Owner</div>
                  <div className={styles.num}>Files</div>
                  <div className={styles.num}>Of losses</div>
                  <div className={styles.num}>Still workable</div>
                </div>
                {reasons.slice(0, 10).map((r) => (
                  <div key={r.reason} className={`${styles.rowStatic} ${styles.reasonGrid}`}>
                    <div className={styles.causeCell}>
                      <span className={styles.causeIcon} aria-hidden="true">
                        <StageIcon stage={r.stage} />
                      </span>
                      <div>
                        <div className={styles.strong}>{r.reason}</div>
                        {r.action && <div className={styles.dim}>{r.action}</div>}
                      </div>
                    </div>
                    <div className={styles.dimInline}>{r.stage}</div>
                    <div><span className={styles.pill}>{r.owner}</span></div>
                    <div className={`${styles.num} ${styles.strong}`}>{fmtIN(r.count)}</div>
                    <div className={styles.num}>{(r.share * 100).toFixed(1)}%</div>
                    <div className={styles.num}>{fmtIN(r.stillOpen)}</div>
                  </div>
                ))}
              </div>
            </section>

            {/* Both sides per segment: who completes, who fails, and what the
                segment's own worst stage is. */}
            <section className={styles.panel}>
              <div className={styles.panelHead}>
                <div>
                  <div className={styles.panelTitle}>Outcomes by segment</div>
                  <div className={styles.panelSub}>
                    Every application in the quarter, not just the open ones, split into what
                    completed and what failed. Worst first, so the segment that is not working
                    leads. The last column names where that segment loses most of its own files.
                  </div>
                </div>
                <label className={styles.field}>
                  <span className={styles.fieldLabel}>Break down by</span>
                  <select className={styles.select} value={dim} onChange={(e) => setDim(e.target.value)}>
                    {BREAKDOWNS.map((b) => <option key={b.key} value={b.key}>{b.label}</option>)}
                  </select>
                </label>
              </div>

              <div className={styles.wideWrap}>
                <div className={`${styles.rowHead} ${styles.outcomeGrid}`}>
                  <div>{BREAKDOWNS.find((b) => b.key === dim)?.label}</div>
                  <div className={styles.num}>Applications</div>
                  <div className={styles.num}>Completed</div>
                  <div className={styles.num}>Failed</div>
                  <div className={styles.num}>Fail rate</div>
                  <div>Mostly lost at</div>
                </div>
                {breakdown.map((b) => (
                  <div key={b.label} className={`${styles.rowStatic} ${styles.outcomeGrid}`}>
                    <div className={styles.strong}>{b.label}</div>
                    <div className={styles.num}>{fmtIN(b.total)}</div>
                    <div className={styles.num}>{fmtIN(b.completed)}</div>
                    <div className={styles.num}>{fmtIN(b.failed)}</div>
                    <div className={`${styles.num} ${b.failRate > lost.failedRate ? styles.bad : ''}`}>
                      {(b.failRate * 100).toFixed(1)}%
                      <div className={styles.track}>
                        <div className={styles.fill} style={{ width: `${b.failRate * 100}%` }} />
                      </div>
                    </div>
                    <div className={styles.dimInline}>
                      {b.worst ? `${b.worst.label} · ${fmtIN(b.worstCount)}` : '—'}
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section className={`${styles.panel} ${styles.lastPanel}`}>
              <div className={styles.panelTitle}>What the onboarding decision reads</div>
              <div className={styles.panelSub}>
                The sources behind every figure above — the same ones the agent uses to size a
                starter limit for a thin-file applicant.
              </div>
              <div className={styles.sources}>
                {ONBOARD.map((o) => (
                  <div key={o.k} className={styles.source}>
                    <div className={styles.sourceK}>{o.k}</div>
                    <div className={styles.sourceV}>{o.v}</div>
                  </div>
                ))}
              </div>
            </section>
          </div>
        )}
      </div>

      {/* One dock, one panel. The two live on different tabs, and rendering
          them as alternatives keeps that structural rather than leaving it to
          the handlers that clear each selection. */}
      {openCase
        ? <ApplicantDrawer row={openCase} onClose={() => setCaseId(null)} />
        : <StageDrawer stage={stage} onClose={() => setStageId(null)} />}
    </div>
  )
}
