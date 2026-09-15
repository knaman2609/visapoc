import styles from './RankedBars.module.css'

/**
 * Ranked horizontal bars — the form for "compare magnitude across named
 * categories". Length carries the value; a single hue carries the metric's
 * character (blue for money, red for risk), and the selected row is the only
 * one at full strength, so the chart reads as emphasis rather than as six
 * competing colours.
 *
 * `split` turns each bar into two segments — domestic and international — the
 * one categorical pair on the screen, separated by a 2px surface gap and named
 * in a legend rather than left to colour alone.
 */
export default function RankedBars({
  rows, metric, selectedId, onSelect, split = false, max,
}) {
  const top = max ?? Math.max(...rows.map((r) => r.value))
  // Campaigns uses these bars without marks, so the icon column only exists
  // when a set actually carries icons — and once it does, every row reserves
  // it, or a member without a mark would pull its whole row left a column.
  const marked = rows.some((r) => r.icon)
  const tone = metric.tone === 'risk' ? 'risk' : 'value'

  return (
    <div className={styles.wrap}>
      {split && (
        <div className={styles.legend}>
          <span className={styles.legItem}>
            <span className={`${styles.swatch} ${styles.swDom}`} aria-hidden="true" />
            Domestic
          </span>
          <span className={styles.legItem}>
            <span className={`${styles.swatch} ${styles.swIntl}`} aria-hidden="true" />
            International
          </span>
        </div>
      )}

      <ul className={styles.rows}>
        {rows.map((r) => {
          const on = r.id === selectedId
          const pct = top ? (r.value / top) * 100 : 0
          const intlPart = split && r.intlValue != null ? (r.intlValue / r.value) * 100 : 0

          return (
            <li key={r.id}>
              <button
                type="button"
                className={[
                  styles.row,
                  marked ? styles.rowMarked : '',
                  on ? styles.on : '',
                  styles[`t_${tone}`],
                ].filter(Boolean).join(' ')}
                onClick={() => onSelect(on ? null : r.id)}
                aria-pressed={on}
              >
                {marked && <span className={styles.mark}>{r.icon}</span>}

                <span className={styles.name}>
                  <span className={styles.label}>{r.label}</span>
                  <span className={styles.sub}>{r.sub}</span>
                </span>

                <span className={styles.track}>
                  <span className={styles.bar} style={{ width: `${Math.max(1.5, pct)}%` }}>
                    {split ? (
                      <>
                        <span className={styles.segDom} style={{ width: `${100 - intlPart}%` }} />
                        <span className={styles.segIntl} style={{ width: `${intlPart}%` }} />
                      </>
                    ) : (
                      <span className={styles.fill} />
                    )}
                  </span>

                  <span className={styles.tip} role="tooltip">
                    <span className={styles.tipV}>{metric.fmt(r.value)}</span>
                    <span className={styles.tipK}>{r.label} · {r.note}</span>
                    {split && r.intlValue != null && (
                      <span className={styles.tipSplit}>
                        <span className={styles.tipRow}>
                          <span className={`${styles.key} ${styles.swDom}`} aria-hidden="true" />
                          Domestic <b>{metric.fmt(r.value - r.intlValue)}</b>
                        </span>
                        <span className={styles.tipRow}>
                          <span className={`${styles.key} ${styles.swIntl}`} aria-hidden="true" />
                          International <b>{metric.fmt(r.intlValue)}</b>
                        </span>
                      </span>
                    )}
                  </span>
                </span>

                <span className={styles.value}>{metric.short(r.value)}</span>
              </button>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
