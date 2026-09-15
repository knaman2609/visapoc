import { useCallback, useMemo, useRef, useState } from 'react'
import styles from './TrendLine.module.css'

const W = 720
const H = 180
const PAD = { l: 8, r: 8, t: 14, b: 8 }

/**
 * Twelve months of one series against the book as context.
 *
 * This is the emphasis form, not a two-colour chart: the slice in the metric's
 * hue, the book behind it as a grey dashed line. A crosshair finds the month —
 * the reader aims at a date, never at a 2px line — and one readout carries both
 * series, so the pointer never has to land on a stroke to get a value.
 */
export default function TrendLine({ points, bookPoints = null, metric, label, bookLabel = 'Book average' }) {
  const ref = useRef(null)
  const [hover, setHover] = useState(null)

  const { lo, hi } = useMemo(() => {
    const all = [...points.map((p) => p.v), ...(bookPoints ? bookPoints.map((p) => p.v) : [])]
    const min = Math.min(...all)
    const max = Math.max(...all)
    const pad = (max - min) * 0.35 || max * 0.1 || 1
    return { lo: Math.max(0, min - pad), hi: max + pad }
  }, [points, bookPoints])

  const n = points.length
  const px = (i) => PAD.l + (i * (W - PAD.l - PAD.r)) / (n - 1)
  const py = (v) => PAD.t + (1 - (v - lo) / (hi - lo)) * (H - PAD.t - PAD.b)
  const path = (pts) => pts.map((p, i) => `${i ? 'L' : 'M'}${px(i).toFixed(1)},${py(p.v).toFixed(1)}`).join(' ')

  const onMove = useCallback((e) => {
    const el = ref.current
    if (!el) return
    const r = el.getBoundingClientRect()
    const x = ((e.clientX - r.left) / r.width) * W
    const i = Math.max(0, Math.min(n - 1, Math.round(((x - PAD.l) / (W - PAD.l - PAD.r)) * (n - 1))))
    setHover(i)
  }, [n])

  const i = hover
  const last = n - 1
  // The extremes carry the shape of the series in words, so the values are
  // reachable without a pointer.
  const low = points.reduce((a, p) => (p.v < a.v ? p : a), points[0])
  const high = points.reduce((a, p) => (p.v > a.v ? p : a), points[0])

  return (
    <div className={styles.wrap}>
      <div className={styles.head}>
        {/* One series needs no legend box — the axis line already names it. */}
        <span className={styles.legend}>
          {bookPoints && (
            <>
              <span className={styles.legItem}>
                <span className={`${styles.key} ${metric.tone === 'risk' ? styles.keyRisk : styles.keyValue}`} aria-hidden="true" />
                {label}
              </span>
              <span className={styles.legItem}>
                <span className={`${styles.key} ${styles.keyBook}`} aria-hidden="true" />
                {bookLabel}
              </span>
            </>
          )}
        </span>
        <span className={styles.axis}>{metric.label} · last 12 months</span>
      </div>

      <div
        className={styles.plot}
        ref={ref}
        onPointerMove={onMove}
        onPointerLeave={() => setHover(null)}
      >
        <svg viewBox={`0 0 ${W} ${H}`} className={styles.svg} role="img"
          aria-label={bookPoints
            ? `${label} against ${bookLabel}, ${metric.label}, last 12 months`
            : `${label}, ${metric.label}, last 12 months`}
        >
          {[0, 0.5, 1].map((t) => (
            <line
              key={t}
              x1={PAD.l} x2={W - PAD.r}
              y1={PAD.t + t * (H - PAD.t - PAD.b)} y2={PAD.t + t * (H - PAD.t - PAD.b)}
              className={styles.grid} vectorEffect="non-scaling-stroke"
            />
          ))}

          {bookPoints && (
            <path d={path(bookPoints)} className={styles.book} vectorEffect="non-scaling-stroke" />
          )}
          <path d={path(points)} className={`${styles.line} ${metric.tone === 'risk' ? styles.lineRisk : ''}`} vectorEffect="non-scaling-stroke" />

          {/* The end of the series is the point worth a marker. */}
          <circle
            cx={px(last)} cy={py(points[last].v)} r="4.5"
            className={`${styles.end} ${metric.tone === 'risk' ? styles.endRisk : ''}`}
          />

          {i != null && (
            <>
              <line
                x1={px(i)} x2={px(i)} y1={PAD.t} y2={H - PAD.b}
                className={styles.cross} vectorEffect="non-scaling-stroke"
              />
              {bookPoints && (
                <circle cx={px(i)} cy={py(bookPoints[i].v)} r="4" className={styles.dotBook} />
              )}
              <circle
                cx={px(i)} cy={py(points[i].v)} r="4.5"
                className={`${styles.end} ${metric.tone === 'risk' ? styles.endRisk : ''}`}
              />
            </>
          )}
        </svg>

        {i != null && (
          <div
            className={styles.tip}
            style={{ left: `${(px(i) / W) * 100}%` }}
            role="tooltip"
          >
            <div className={styles.tipMonth}>{points[i].m}</div>
            <div className={styles.tipRow}>
              <span className={`${styles.key} ${metric.tone === 'risk' ? styles.keyRisk : styles.keyValue}`} aria-hidden="true" />
              {label}<b>{metric.fmt(points[i].v)}</b>
            </div>
            {bookPoints && (
              <div className={styles.tipRow}>
                <span className={`${styles.key} ${styles.keyBook}`} aria-hidden="true" />
                {bookLabel}<b>{metric.fmt(bookPoints[i].v)}</b>
              </div>
            )}
          </div>
        )}
      </div>

      <div className={styles.months}>
        {points.map((p) => <span key={p.m}>{p.m}</span>)}
      </div>

      <div className={styles.range}>
        Low {metric.fmt(low.v)} in {low.m} · high {metric.fmt(high.v)} in {high.m}
      </div>
    </div>
  )
}
