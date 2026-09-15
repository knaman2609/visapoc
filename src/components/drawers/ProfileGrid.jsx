import styles from './ProfileGrid.module.css'

const RISK_LABELS = ['High risk', 'Medium risk', 'Low risk']
const PROFIT_COLS = ['Low profit', 'Med profit', 'High profit']

const fmt = (n) => n.toLocaleString('en-IN')

/**
 * The risk × profitability grid a cardholder is tagged into.
 *
 * `counts` fills each cell with how many of a population sit in it, which
 * turns the same grid into the shape of a whole cohort with one person
 * marked on it. `compact` is the version that fits a side panel.
 */
export default function ProfileGrid({
  cell, from, initials, note, counts, rowLabels = RISK_LABELS, compact,
}) {
  const most = counts ? Math.max(...counts.flat()) : 0

  return (
    <div className={`${styles.wrap} ${compact ? styles.compact : ''}`}>
      <div className={styles.header}>
        <div />
        {PROFIT_COLS.map((c) => (
          <div key={c} className={styles.colLabel}>{c}</div>
        ))}
      </div>

      {rowLabels.map((label, r) => (
        <div key={label} className={styles.row}>
          <div className={styles.rowLabel}>{label}</div>
          {[0, 1, 2].map((c) => {
            const here = cell && cell[0] === r && cell[1] === c
            const was = !!from && from[0] === r && from[1] === c
            const n = counts ? counts[r][c] : null
            // Density is carried by a wash behind the cell, never by the text.
            const shade = most ? { opacity: 0.06 + (n / most) * 0.34 } : undefined

            const tone = here ? styles.cellHere : was ? styles.cellWas : styles.cellPlain
            return (
              <div key={c} className={`${styles.cell} ${tone}`}>
                {counts && !here && <span className={styles.wash} style={shade} />}
                {here && <div className={styles.dot}>{initials}</div>}
                {was && !here && <span className={styles.wasText}>WAS HERE</span>}
                {n != null && <span className={styles.count}>{fmt(n)}</span>}
              </div>
            )
          })}
        </div>
      ))}

      {note && <div className={styles.note}>{note}</div>}
    </div>
  )
}
