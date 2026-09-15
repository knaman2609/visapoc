import styles from './Bars.module.css'

/**
 * Horizontal distribution bars.
 *
 * Used wherever a breakdown is a share of a whole rather than a movement over
 * time — the label and the number carry the reading, the bar only ranks them.
 *
 * `meta` adds one extra column for a second, differently-scaled figure. Without
 * it, two unrelated percentages would sit side by side and read as a comparison.
 */
export default function Bars({ rows, fmt = (r) => r.count.toLocaleString('en-IN'), meta, tone }) {
  const max = Math.max(...rows.map((r) => r.count), 1)

  return (
    <div className={`${styles.list} ${meta ? styles.withMeta : ''}`}>
      {rows.map((r) => (
        <div key={r.label} className={styles.row}>
          <div className={styles.label} title={r.label}>{r.label}</div>
          <div className={styles.track}>
            <div
              className={styles.fill}
              style={{
                width: `${(r.count / max) * 100}%`,
                background: tone ? tone(r) : '#c8ccd4',
              }}
            />
          </div>
          <div className={styles.value}>{fmt(r)}</div>
          <div className={styles.share}>{(r.share * 100).toFixed(1)}%</div>
          {meta ? <div className={styles.meta}>{meta(r)}</div> : null}
        </div>
      ))}
    </div>
  )
}
