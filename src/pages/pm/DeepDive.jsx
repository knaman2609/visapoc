import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { MapPin, RotateCcw, Target, TrendingDown, TrendingUp, X } from 'lucide-react'
import {
  BOOK, DIMENSIONS, METRICS, bookValue, dimension, series, standing, value,
} from '../../data/book.js'
import { PM_OPPS } from '../../data/portfolio.js'
import RankedBars from '../../components/charts/RankedBars.jsx'
import SeriesChart from '../../components/charts/SeriesChart.jsx'
import SummaryTable from '../../components/charts/SummaryTable.jsx'
import GeoMap from '../../components/charts/GeoMap.jsx'
import TrendLine from '../../components/charts/TrendLine.jsx'
import Dropdown from '../../components/ui/Dropdown.jsx'
import AskAgent from '../../components/agent/AskAgent.jsx'
import { DimensionIcon, MemberIcon, MetricIcon } from '../../components/ui/BookIcons.jsx'
import styles from './DeepDive.module.css'

// Metrics that add up across members — only these can carry a share of book.
const ADDITIVE = new Set(['pv', 'cards', 'txns'])

/**
 * Slice and dice, on its own page.
 *
 * The overview is the front door and stays a front door; this is the room you
 * walk into when a number needs taking apart. An opportunity can send you
 * straight here with its own slice already selected, which is the whole point
 * of the two doors on the assistant's list.
 */
export default function DeepDive() {
  const [params, setParams] = useSearchParams()
  const fromOpp = PM_OPPS.find((o) => o.id === params.get('opp')) || null

  // Arriving from an opportunity opens the cut and the measure it was raised
  // through, on the member it was raised about — the page starts mid-argument
  // rather than making the operator rebuild it.
  const [dimId, setDimId] = useState(fromOpp?.lens.dim || 'card')
  const [metricId, setMetricId] = useState(fromOpp?.lens.metric || 'pv')
  const [selId, setSelId] = useState(fromOpp ? fromOpp[fromOpp.lens.dim] : null)

  const dim = dimension(dimId)
  const metric = METRICS[dim.metrics.includes(metricId) ? metricId : dim.metrics[0]]
  const total = bookValue(dim, metric.id)
  // Most cuts are cuts of the whole book; the corridors are a cut of the part
  // of it that leaves the country, and every line has to say so.
  const scope = dim.scope || 'the book'

  const rows = useMemo(() => dim.members
    .map((m) => {
      const v = value(m, metric.id)
      return {
        id: m.id,
        label: m.label,
        sub: m.sub,
        cell: m.cell,
        icon: <MemberIcon id={m.id} />,
        value: v,
        note: ADDITIVE.has(metric.id)
          ? `${((v / total) * 100).toFixed(1)}% of ${scope}`
          : `${v > total ? '+' : ''}${(v - total).toFixed(1)} pts vs ${scope}`,
        // A share of book has no direction to judge; a gap against it does.
        delta: ADDITIVE.has(metric.id) ? null : v - total,
        intlValue: dim.split && metric.id === 'pv' ? (m.pv * m.intl) / 100 : null,
      }
    })
    .sort((a, b) => b.value - a.value), [dim, metric, scope, total])

  const lines = useMemo(() => dim.members.map((m, i) => ({
    id: m.id,
    label: m.label,
    slot: i,
    value: value(m, metric.id),
    points: series(m.id, metric.id, value(m, metric.id), m.trend),
  })).sort((a, b) => b.value - a.value), [dim, metric])

  const picked = selId ? dim.members.find((m) => m.id === selId) : null
  const pickedRow = rows.find((r) => r.id === selId) || null

  const pts = useMemo(() => (picked
    ? series(picked.id, metric.id, value(picked, metric.id), picked.trend)
    : series(`book:${dim.id}`, metric.id, total, BOOK.pvYoY / 100)), [picked, metric, dim, total])

  // The book only belongs on the same axes when the metric is a rate. A slice's
  // payment volume against the book's total would flatten the slice to nothing,
  // so a volume trend is plotted on its own.
  const compare = !!metric.weighted && !!picked
  const bookPts = useMemo(
    () => (compare ? series(`book:${dim.id}`, metric.id, total, BOOK.pvYoY / 100) : null),
    [compare, dim, metric, total],
  )

  // The case for the opportunity, read off the book at render time.
  const why = fromOpp && picked ? standing(dim, picked, metric.id) : null

  // What the agent is allowed to answer from: this cut, this measure, these
  // members. Rebuilt every render so it can never describe a stale view.
  const ctx = {
    dimLabel: dim.label,
    noun: dim.noun,
    metricLabel: metric.label,
    fmt: metric.fmt,
    total,
    additive: ADDITIVE.has(metric.id),
    totalLabel: ADDITIVE.has(metric.id) ? 'book' : 'book average',
    members: rows,
    extras: [
      {
        re: /\b(cut|slice|dimension|group)\b/,
        say: () => `You can cut the book by ${DIMENSIONS.map((d) => d.label.toLowerCase()).join(', ')}. Right now it is ${dim.label.toLowerCase()}.`,
      },
      {
        re: /\b(measure|metric|what can|options)\b/,
        say: () => `On this cut I can measure ${dim.metrics.map((id) => METRICS[id].label.toLowerCase()).join(', ')}.`,
      },
      {
        re: /\b(attrition|churn|leaving)\b/,
        say: () => `Book attrition is ${METRICS.attrition.fmt(BOOK.attrition)} against a peer benchmark of ${METRICS.attrition.fmt(BOOK.peerAttrition)}.`,
      },
    ],
  }

  const asks = [
    `Which ${dim.noun} is highest?`,
    'What is the spread?',
    `What is the ${ADDITIVE.has(metric.id) ? 'book total' : 'book average'}?`,
    picked ? `Tell me about ${picked.label}` : `Which ${dim.noun} is lowest?`,
  ]

  const pickDim = (id) => {
    setDimId(id)
    // An arriving opportunity names a member in every dimension, so switching
    // the cut keeps the same subject rather than dropping the selection.
    setSelId(fromOpp ? fromOpp[id] : null)
    const d = dimension(id)
    if (!d.metrics.includes(metric.id)) setMetricId(d.metrics[0])
  }

  const clearOpp = () => {
    const next = new URLSearchParams(params)
    next.delete('opp')
    setParams(next, { replace: true })
    setSelId(null)
  }

  return (
    <div className={styles.wrap}>
      {selId && (
        <div className={styles.head}>
          <button type="button" className={styles.reset} onClick={() => setSelId(null)}>
            <RotateCcw size={13} strokeWidth={1.75} aria-hidden="true" />
            Reset view
          </button>
        </div>
      )}

      <div className={styles.controls}>
        <Dropdown
          options={DIMENSIONS.map((d) => ({
            id: d.id, label: d.label, sub: d.lede, icon: <DimensionIcon id={d.id} />,
          }))}
          value={dim.id}
          onChange={pickDim}
        />
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
              <MetricIcon id={id} />
              {METRICS[id].label}
            </button>
          ))}
        </div>
      </div>

      {fromOpp && (
        <div className={styles.from}>
          <div className={styles.fromTop}>
            <span className={styles.fromKick}>
              <Target size={12} strokeWidth={2} aria-hidden="true" />
              Why this was raised
            </span>
            <span className={styles.fromTitle}>{fromOpp.title}</span>
            <button type="button" className={styles.fromClear} onClick={clearOpp}>
            <X size={12} strokeWidth={2} aria-hidden="true" />
            Clear
          </button>
          </div>
          {why && (
            <p className={styles.fromWhy}>
              <b>{picked.label}</b>{' '}
              {why.rank === 1
                ? `has the highest ${metric.label.toLowerCase()} of any ${dim.noun} on the book`
                : why.rank === why.of
                  ? `has the lowest ${metric.label.toLowerCase()} of any ${dim.noun} on the book`
                  : `sits ${why.rank} of ${why.of} ${dim.noun}s on ${metric.label.toLowerCase()}`}
              {' '}at <b>{metric.fmt(why.value)}</b>, against {metric.fmt(why.book)} across {scope}
              {metric.id !== 'pv' && why.pvShare != null && (
                <> — and it carries <b>{why.pvShare.toFixed(1)}%</b> of payment volume</>
              )}.
            </p>
          )}
        </div>
      )}

      <div className={styles.trend}>
        <SeriesChart rows={lines} metric={metric} selectedId={selId} onSelect={setSelId} />
      </div>

      <div className={styles.body}>
        <div className={styles.chartCol}>
          {dim.map ? (
            <GeoMap
              shape={dim.map}
              rows={rows}
              metric={metric}
              selectedId={selId}
              onSelect={setSelId}
            />
          ) : (
            <RankedBars
              rows={rows} metric={metric} selectedId={selId}
              onSelect={setSelId} split={!!dim.split && metric.id === 'pv'}
            />
          )}

          <div className={styles.chartFoot}>
            {ADDITIVE.has(metric.id)
              ? `${metric.fmt(total)} across ${rows.length} ${dim.noun}s`
              : `Average across ${scope}, ${metric.fmt(total)}, weighted by payment volume`}
          </div>
        </div>

        <aside className={styles.detail}>
          <div className={styles.detailHead}>
            <div className={styles.detailKick}>
              {picked ? dim.label : `Whole ${scope.replace(/^the /, '')}`}
            </div>
            <div className={styles.detailName}>{picked ? picked.label : `All ${dim.noun}s`}</div>
            <div className={styles.detailSub}>{picked ? picked.sub : dim.lede}</div>
          </div>

          <div className={styles.detailV}>
            {metric.fmt(picked ? value(picked, metric.id) : total)}
          </div>
          <div className={styles.detailNote}>
            {picked && pickedRow.delta != null && pickedRow.delta !== 0 && (
              <span
                className={`${styles.deltaMark} ${
                  (metric.better === 'up') === (pickedRow.delta > 0) ? styles.deltaGood : styles.deltaBad
                }`}
              >
                {pickedRow.delta > 0
                  ? <TrendingUp size={14} strokeWidth={2} aria-hidden="true" />
                  : <TrendingDown size={14} strokeWidth={2} aria-hidden="true" />}
              </span>
            )}
            {picked ? pickedRow.note : `${metric.label} across ${scope}`}
          </div>

          <TrendLine
            points={pts}
            bookPoints={bookPts}
            metric={metric}
            label={picked ? picked.label : 'Book'}
            bookLabel="Book average"
          />

          {picked?.states && (
            <div className={styles.states}>
              <div className={styles.statesK}>
                <MapPin size={11} strokeWidth={2} aria-hidden="true" />
                {dim.partsLabel || 'What carries this'}
              </div>
              {picked.states.map(([name, pv]) => (
                <div key={name} className={styles.state}>
                  <span className={styles.stateName}>{name}</span>
                  <span className={styles.stateTrack} aria-hidden="true">
                    <span
                      className={styles.stateFill}
                      style={{ width: `${(pv / picked.states[0][1]) * 100}%` }}
                    />
                  </span>
                  <span className={styles.stateV}>₹{pv.toLocaleString('en-IN')} Cr</span>
                </div>
              ))}
            </div>
          )}

          <div className={styles.detailFoot}>
            {picked
              ? `${picked.label} · ${pickedRow.note}`
              : `Select a ${dim.noun} to compare it against the book`}
          </div>
        </aside>
      </div>

      <div className={styles.summary}>
        <div className={styles.summaryHead}>
          <span className={styles.summaryK}>Summary</span>
          <span className={styles.summaryNote}>
            Every figure the charts above encode · book totals under each column
          </span>
        </div>
        <SummaryTable
          head={dim.label}
          columns={dim.metrics.map((id) => ({
            id, label: METRICS[id].label, fmt: METRICS[id].fmt, tone: METRICS[id].tone,
            icon: <MetricIcon id={id} size={12} />,
          }))}
          rows={dim.members.map((m) => ({
            id: m.id,
            label: m.label,
            sub: m.sub,
            icon: <MemberIcon id={m.id} size={13} />,
            cells: Object.fromEntries(dim.metrics.map((id) => [id, value(m, id)])),
          }))}
          totals={Object.fromEntries(dim.metrics.map((id) => [id, bookValue(dim, id)]))}
          selectedId={selId}
          onSelect={setSelId}
          flag={(r) => r.cells.attrition != null && r.cells.attrition > bookValue(dim, 'attrition')}
        />
      </div>

      <AskAgent ctx={ctx} suggestions={asks} />
    </div>
  )
}
