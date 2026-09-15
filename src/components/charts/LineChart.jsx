import styles from './LineChart.module.css'

/**
 * Cohort vs peer-benchmark line chart. Defaults render the monthly spend index
 * (mirrors the mockup's inline SVG builder); pass max/ticks/fmt to plot any
 * other benchmark metric on the same shape.
 */
export default function LineChart({
  data,
  label = 'Monthly spend index · last 12 months',
  portLabel = 'Peer benchmark',
  max = 120,
  ticks = [25, 50, 75, 100],
  showAxis = false,
  fmt = (v) => String(v),
  height,
  cohortColor = '#c0271a',
  portColor = 'var(--c-brand)',
}) {
  const W = 1000
  const H = 300
  const n = data.length

  const px = (i) => (i * (W - 40) / (n - 1) + 20).toFixed(1)
  const py = (v) => (H - (v / max) * (H - 24) - 8).toFixed(1)
  const pts = (key) => data.map((b, i) => `${px(i)},${py(b[key])}`).join(' ')

  const areaPath = `M${px(0)},${py(data[0].c)} ${data.slice(1).map((b, i) => `L${px(i + 1)},${py(b.c)}`).join(' ')} L${px(n - 1)},${H} L${px(0)},${H} Z`
  const grid = ticks.map((v) => ({ y: py(v), label: fmt(v) }))
  const dots = data.map((b, i) => ({ x: px(i), y: py(b.c), m: b.m }))

  return (
    <div className={styles.wrap}>
      <div className={styles.legendRow}>
        <div className="kicker">{label}</div>
        <div className={styles.legend}>
          <div className={styles.legItem}>
            <div className={styles.legDot} style={{ background: cohortColor }} />
            Cohort
          </div>
          <div className={styles.legItem}>
            <div className={styles.legDot} style={{ background: 'var(--c-brand)' }} />
            {portLabel}
          </div>
        </div>
      </div>

      <div className={`${styles.svgWrap} ${showAxis ? styles.withAxis : ''}`}>
        <div className={styles.plot}>
          {showAxis && (
            <div className={styles.yAxis}>
              {grid.map((g) => (
                <div key={g.y} className={styles.yLabel} style={{ top: `${(g.y / H) * 100}%` }}>
                  {g.label}
                </div>
              ))}
            </div>
          )}

          <svg
            viewBox={`0 0 ${W} ${H}`}
            preserveAspectRatio="none"
            className={styles.svg}
            style={height ? { height } : undefined}
          >
            {grid.map((g) => (
              <line
                key={g.y}
                x1="20" x2="980" y1={g.y} y2={g.y}
                stroke="#eef0f4" strokeWidth="1"
                vectorEffect="non-scaling-stroke"
              />
            ))}
            <path d={areaPath} fill={cohortColor} fillOpacity="0.08" />
            <polyline points={pts('p')} fill="none" stroke={portColor} strokeWidth="2.5" vectorEffect="non-scaling-stroke" strokeLinejoin="round" />
            <polyline points={pts('c')} fill="none" stroke={cohortColor} strokeWidth="2.5" vectorEffect="non-scaling-stroke" strokeLinejoin="round" strokeLinecap="round" />
            {dots.map((d, i) => (
              <circle
                key={`${d.x}-${i}`}
                cx={d.x} cy={d.y} r="3.5"
                fill="#fff" stroke={cohortColor} strokeWidth="2"
                vectorEffect="non-scaling-stroke"
              />
            ))}
          </svg>
        </div>

        <div className={styles.monthRow}>
          {data.map((b) => <div key={b.m} className={styles.month}>{b.m}</div>)}
        </div>
      </div>
    </div>
  )
}
