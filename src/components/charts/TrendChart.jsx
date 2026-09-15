import { useEffect, useRef, useState } from 'react'
import styles from './TrendChart.module.css'

/**
 * A metric plotted over time, one line per segment value.
 *
 * LineChart next door is two-series by contract — cohort against a peer
 * benchmark, with a filled area under the cohort — so this is a separate
 * component rather than a widened version of it.
 *
 * One y-axis, always. Switching metric swaps what the single axis measures; two
 * metrics never share the frame on two scales. Hues are assigned by the
 * segment's position in the series list, which is stable for a given
 * segmentation, so changing the metric never repaints a line.
 *
 * The SVG is drawn at its true pixel size rather than scaled from a fixed
 * viewBox: stretching a viewBox to fit distorts everything that is meant to be
 * round or upright — dots become ellipses and the axis labels get squashed
 * horizontally.
 */

// Fixed order, taken from the app's own accents. Capped at five, which is where
// a line chart stops being readable.
const HUES = [
  'var(--c-brand)',
  '#c0271a',
  '#0a7a52',
  '#8a5cf6',
  '#c77700',
]

const H = 260
const PAD_L = 46
const PAD_R = 14
const PAD_B = 26
const PAD_T = 14

/**
 * Monotone cubic (Fritsch–Carlson).
 *
 * A plain Catmull-Rom or cardinal spline overshoots between points, which on a
 * percentage axis would draw a curve rising above a 100% ceiling or below zero
 * between two honest readings. Monotone interpolation cannot overshoot: the
 * curve stays within the values it connects.
 */
function smoothPath(pts) {
  const n = pts.length
  if (n === 0) return ''
  if (n === 1) return `M${pts[0].x},${pts[0].y}`
  if (n === 2) return `M${pts[0].x},${pts[0].y} L${pts[1].x},${pts[1].y}`

  const dx = []
  const slope = []
  for (let i = 0; i < n - 1; i += 1) {
    dx[i] = pts[i + 1].x - pts[i].x
    slope[i] = (pts[i + 1].y - pts[i].y) / dx[i]
  }

  const t = new Array(n)
  t[0] = slope[0]
  t[n - 1] = slope[n - 2]
  for (let i = 1; i < n - 1; i += 1) {
    if (slope[i - 1] * slope[i] <= 0) {
      // A local peak or trough — flatten the tangent so the curve turns here
      // rather than sailing past the point.
      t[i] = 0
    } else {
      const w1 = 2 * dx[i] + dx[i - 1]
      const w2 = dx[i] + 2 * dx[i - 1]
      t[i] = (w1 + w2) / (w1 / slope[i - 1] + w2 / slope[i])
    }
  }

  let d = `M${pts[0].x.toFixed(1)},${pts[0].y.toFixed(1)}`
  for (let i = 0; i < n - 1; i += 1) {
    const h = dx[i] / 3
    d += ` C${(pts[i].x + h).toFixed(1)},${(pts[i].y + t[i] * h).toFixed(1)}`
      + ` ${(pts[i + 1].x - h).toFixed(1)},${(pts[i + 1].y - t[i + 1] * h).toFixed(1)}`
      + ` ${pts[i + 1].x.toFixed(1)},${pts[i + 1].y.toFixed(1)}`
  }
  return d
}

export default function TrendChart({ series, labels, fmt = (v) => `${Math.round(v)}%` }) {
  const wrapRef = useRef(null)
  const [width, setWidth] = useState(760)
  const [hover, setHover] = useState(null)

  useEffect(() => {
    const el = wrapRef.current
    if (!el) return undefined
    setWidth(el.clientWidth)
    const ro = new ResizeObserver(() => setWidth(el.clientWidth))
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const W = Math.max(width, 320)
  const n = labels.length

  const values = series.flatMap((s) => s.points.map((p) => p.v)).filter((v) => v !== null)
  const rawMax = values.length ? Math.max(...values) : 100
  const rawMin = values.length ? Math.min(...values) : 0
  // Round out to a clean band so the gridlines land on whole numbers, and never
  // start the axis at the lowest point — a zoomed axis exaggerates every wobble.
  const max = Math.min(100, Math.ceil((rawMax + 5) / 10) * 10)
  const min = Math.max(0, Math.floor((rawMin - 5) / 10) * 10)
  const span = max - min || 1

  const px = (i) => PAD_L + (i * (W - PAD_L - PAD_R)) / (n - 1)
  const py = (v) => PAD_T + (1 - (v - min) / span) * (H - PAD_T - PAD_B)

  const ticks = [min, min + span / 2, max]

  /** Split on thin buckets so the curve breaks rather than bridging a gap. */
  const runsOf = (points) => {
    const runs = []
    let run = []
    points.forEach((p, i) => {
      if (p.v === null) { if (run.length) { runs.push(run); run = [] } return }
      run.push({ x: px(i), y: py(p.v) })
    })
    if (run.length) runs.push(run)
    return runs
  }

  const onMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const x = e.clientX - rect.left
    const step = (W - PAD_L - PAD_R) / (n - 1)
    const i = Math.max(0, Math.min(n - 1, Math.round((x - PAD_L) / step)))
    setHover(i)
  }

  // Flip the card to the left of the crosshair when it would run off the end.
  const tipLeft = hover === null ? 0 : px(hover)
  const flip = tipLeft > W - 200

  return (
    <div className={styles.wrap}>
      <div className={styles.plot} ref={wrapRef}>
        <svg
          className={styles.svg}
          width={W}
          height={H}
          viewBox={`0 0 ${W} ${H}`}
          role="img"
          aria-label="Trend by segment over thirteen weeks"
          onMouseMove={onMove}
          onMouseLeave={() => setHover(null)}
        >
          {ticks.map((t) => (
            <g key={t}>
              <line className={styles.grid} x1={PAD_L} x2={W - PAD_R} y1={py(t)} y2={py(t)} />
              <text className={styles.axis} x={PAD_L - 9} y={py(t) + 4} textAnchor="end">{fmt(t)}</text>
            </g>
          ))}

          {labels.map((l, i) => (
            (i % 2 === 0 || i === n - 1) && (
              <text key={l} className={styles.axis} x={px(i)} y={H - 8} textAnchor="middle">{l}</text>
            )
          ))}

          {hover !== null && (
            <line
              className={styles.crosshair}
              x1={px(hover)} x2={px(hover)} y1={PAD_T - 4} y2={H - PAD_B}
            />
          )}

          {series.map((s, si) => runsOf(s.points).map((run, ri) => (
            // A run of one — a single trusted week between two thin ones —
            // has no path length to draw, so it gets a dot instead of
            // disappearing.
            run.length === 1 ? (
              <circle
                key={`${s.name}-${ri}`}
                cx={run[0].x} cy={run[0].y} r="2.5"
                fill={HUES[si % HUES.length]}
              />
            ) : (
              <path
                key={`${s.name}-${ri}`}
                d={smoothPath(run)}
                fill="none"
                stroke={HUES[si % HUES.length]}
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            )
          )))}

          {/* Only the hovered week carries dots — a marker on every point turns
              five lines into a field of circles. */}
          {hover !== null && series.map((s, si) => {
            const p = s.points[hover]
            if (!p || p.v === null) return null
            return (
              <circle
                key={s.name}
                cx={px(hover)} cy={py(p.v)} r="4.5"
                fill={HUES[si % HUES.length]}
                stroke="var(--c-surface)" strokeWidth="2"
              />
            )
          })}
        </svg>

        {hover !== null && (
          <div
            className={styles.tip}
            style={flip ? { right: W - px(hover) + 14 } : { left: px(hover) + 14 }}
          >
            <div className={styles.tipHead}>{labels[hover]}</div>
            {series.map((s, si) => {
              const p = s.points[hover]
              return (
                <div key={s.name} className={styles.tipRow}>
                  <span className={styles.tipDot} style={{ background: HUES[si % HUES.length] }} />
                  <span className={styles.tipName}>{s.name}</span>
                  <span className={styles.tipVal}>
                    {p.v === null ? '—' : fmt(p.v)}
                  </span>
                  <span className={styles.tipN}>
                    {p.v === null ? `only ${p.n}` : `of ${p.n}`}
                  </span>
                </div>
              )
            })}
          </div>
        )}
      </div>

      <div className={styles.legend}>
        {series.map((s, si) => (
          <div key={s.name} className={styles.legItem}>
            <span className={styles.legDot} style={{ background: HUES[si % HUES.length] }} />
            <span className={styles.legName}>{s.name}</span>
            <span className={styles.legVal}>{fmt(s.rate)}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
