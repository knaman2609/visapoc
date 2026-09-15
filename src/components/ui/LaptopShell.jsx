import styles from './LaptopShell.module.css'

/**
 * A laptop chassis for the desktop previews.
 *
 * Email is still mostly opened on a big screen, and a subject line that works
 * in a 320px handset can read as truncated nonsense in a webmail list. The
 * frame is deliberately plain — an aluminium lid and a base, no branding —
 * so nothing competes with the artefact inside it.
 *
 * `size="lg"` is the studio's size: a real webmail client is three columns
 * wide, and at 620px the reading pane collapses to one word a line, which
 * tells the operator nothing true about their design.
 */
export default function LaptopShell({ chrome = true, title = '', size = 'md', children }) {
  return (
    <div className={`${styles.wrap} ${styles[size]}`}>
      <div className={styles.lid}>
        <div className={styles.screen}>
          {chrome && (
            <div className={styles.chrome}>
              <span className={styles.dots} aria-hidden="true">
                <i /><i /><i />
              </span>
              {title && <span className={styles.tab}>{title}</span>}
            </div>
          )}
          <div className={styles.view}>{children}</div>
        </div>
      </div>
      <div className={styles.base} aria-hidden="true">
        <span className={styles.notch} />
      </div>
    </div>
  )
}
