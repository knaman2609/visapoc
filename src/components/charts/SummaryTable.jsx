import { TriangleAlert } from 'lucide-react'
import styles from './SummaryTable.module.css'

/**
 * The table twin of whatever chart sits above it.
 *
 * Every value a mark encodes is here in text, which is what makes the charts
 * above safe to read at a glance: colour and length are the quick channel, this
 * is the exact one. Each column header carries the book's own figure, so a row
 * can be judged against the whole without arithmetic.
 */
export default function SummaryTable({
  head, columns, rows, totals, selectedId, onSelect, flag,
}) {
  return (
    <div className={styles.wrap}>
      <table className={styles.table}>
        <thead>
          <tr>
            <th scope="col" className={styles.first}>{head}</th>
            {columns.map((c) => (
              <th key={c.id} scope="col">
                <span className={styles.colLabel}>
                  {c.icon && <span className={styles.colIcon}>{c.icon}</span>}
                  {c.label}
                </span>
                {totals?.[c.id] != null && (
                  <span className={styles.colTotal}>{c.fmt(totals[c.id])}</span>
                )}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => {
            const on = r.id === selectedId
            const bad = flag ? flag(r) : false
            return (
              <tr
                key={r.id}
                className={`${on ? styles.on : ''} ${bad ? styles.bad : ''}`}
                onClick={onSelect ? () => onSelect(on ? null : r.id) : undefined}
                tabIndex={onSelect ? 0 : undefined}
                role={onSelect ? 'button' : undefined}
                onKeyDown={onSelect ? (e) => {
                  if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onSelect(on ? null : r.id) }
                } : undefined}
              >
                <th scope="row" className={styles.first}>
                  <span className={styles.rowName}>
                    {r.icon && <span className={styles.rowMark}>{r.icon}</span>}
                    {bad && (
                      <TriangleAlert
                        className={styles.flagMark}
                        size={13}
                        strokeWidth={2}
                        aria-label="Above the book average"
                      />
                    )}
                    {r.label}
                  </span>
                  {r.sub && <span className={styles.rowSub}>{r.sub}</span>}
                </th>
                {columns.map((c) => (
                  <td key={c.id} className={c.tone === 'risk' && bad ? styles.cellBad : ''}>
                    {c.fmt(r.cells[c.id])}
                  </td>
                ))}
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
