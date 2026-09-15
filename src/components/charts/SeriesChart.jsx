import { useCallback, useMemo, useRef, useState } from 'react'
import styles from './SeriesChart.module.css'

const W = 720
const H = 200

/**
 * Every member of a slice over time, in the emphasis form.
 *
 * Every series carries its own hue, from the six-slot categorical set in
 * tokens.css — searched for rather than picked, because the obvious rainbow is
 * unreadable under deuteranopia. The slot follows the member, never its rank,
 * so changing the measure re-sorts the legend without repainting anyone.
 *
 * Hovering or selecting a series lifts it and drops the rest back, which is the
 * emphasis layer on top of colour rather than instead of it.
 */
export default function SeriesChart({ rows, metric, selectedId, onSelect, height = 200 }) {
  const ref = useRef(null)
  const [at, setAt] = useState(null)
  const [peek, setPeek] = useState(null)

  // No lead until the reader asks for one: every series is coloured by default.
  const lead = peek || selectedId || null
  const n = rows[0]?.points.length || 0

  const { lo, hi } = useMemo(() => {
    const all = rows.flatMap((r) => r.points.map((p) => p.v))
    const min = Math.min(...all)
    const max = Math.max(...all)
    const pad = (max - min) * 0.12 || max * 0.1 || 1
    return { lo: Math.max(0, min - pad), hi: max + pad }
  }, [rows])

  const px = (i) => (i * W) / (n - 1)
  const py = (v) => H - ((v - lo) / (hi - lo)) * H
  const path = (pts) => pts.map((p, i) => `${i ? 'L' : 'M'}${px(i).toFixed(1)},${py(p.v).toFixed(1)}`).join(' ')

  const onMove = useCallback((e) => {
    const el = ref.current
    if (!el) return
    const r = el.getBoundingClientRect()
    const i = Math.round(((e.clientX - r.left) / r.width) * (n - 1))
    setAt(Math.max(0, Math.min(n - 1, i)))
  }, [n])

  const ticks = [hi, lo + (hi - lo) / 2, lo]
  const ordered = [...rows].sort((a, b) => (a.id === lead ? 1 : b.id === lead ? -1 : 0))
  const readout = at == null ? null : [...rows].sort((a, b) => b.points[at].v - a.points[at].v)

  return (
    <div className={styles.wrap}>
      <div className={styles.legend}>
        {rows.map((r) => (
          <button
            key={r.id}
            type="button"
            className={`${styles.legItem} ${r.id === lead ? styles.legOn : ''}`}
            onMouseEnter={() => setPeek(r.id)}
            onMouseLeave={() => setPeek(null)}
            onFocus={() => setPeek(r.id)}
            onBlur={() => setPeek(null)}
            onClick={() => onSelect(r.id === selectedId ? null : r.id)}
            aria-pressed={r.id === selectedId}
          >
            <span className={`${styles.key} ${styles[`c${r.slot % 6}`]}`} aria-hidden="true" />
            <span className={styles.legLabel}>{r.label}</span>
            <span className={styles.legV}>{metric.short(r.value)}</span>
          </button>
        ))}
      </div>

      <div className={styles.plotWrap}>
        <div className={styles.yAxis} aria-hidden="true">
          {ticks.map((t, i) => (
            <span key={i} style={{ top: `${(i / (ticks.length - 1)) * 100}%` }}>{metric.short(t)}</span>
          ))}
        </div>

        <div
          className={styles.plot}
          ref={ref}
          onPointerMove={onMove}
          onPointerLeave={() => setAt(null)}
        >
          <svg
            viewBox={`0 0 ${W} ${H}`}
            preserveAspectRatio="none"
            className={styles.svg}
            style={{ height }}
            role="img"
            aria-label={`${metric.label} by ${rows.length} series over ${n} months`}
          >
            {ticks.map((_t, i) => (
              <line
                key={i}
                x1="0" x2={W}
                y1={(i / (ticks.length - 1)) * H} y2={(i / (ticks.length - 1)) * H}
                className={styles.grid} vectorEffect="non-scaling-stroke"
              />
            ))}

            {ordered.map((r) => (
              <path
                key={r.id}
                d={path(r.points)}
                className={[
                  styles.line,
                  styles[`c${r.slot % 6}`],
                  lead && r.id === lead ? styles.lead : '',
                  lead && r.id !== lead ? styles.faded : '',
                ].filter(Boolean).join(' ')}
                vectorEffect="non-scaling-stroke"
              />
            ))}

            {at != null && (
              <line
                x1={px(at)} x2={px(at)} y1="0" y2={H}
                className={styles.cross} vectorEffect="non-scaling-stroke"
              />
            )}
          </svg>

          {/* Markers sit outside the stretched SVG so they stay circular. */}
          {at != null && rows.map((r) => (
            <span
              key={r.id}
              className={[
                styles.dot, styles[`c${r.slot % 6}`],
                lead && r.id !== lead ? styles.dotFaded : '',
              ].filter(Boolean).join(' ')}
              style={{ left: `${(px(at) / W) * 100}%`, top: `${(py(r.points[at].v) / H) * 100}%` }}
            />
          ))}

          {readout && (
            <div
              className={`${styles.tip} ${px(at) / W > 0.6 ? styles.tipLeft : ''}`}
              style={{ left: `${(px(at) / W) * 100}%` }}
              role="tooltip"
            >
              <div className={styles.tipMonth}>{rows[0].points[at].m}</div>
              {readout.map((r) => (
                <div key={r.id} className={`${styles.tipRow} ${r.id === lead ? styles.tipOn : ''}`}>
                  <span className={`${styles.key} ${styles[`c${r.slot % 6}`]}`} aria-hidden="true" />
                  {r.label}<b>{metric.fmt(r.points[at].v)}</b>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className={styles.months}>
        {rows[0]?.points.map((p) => <span key={p.m}>{p.m}</span>)}
      </div>
    </div>
  )
}
