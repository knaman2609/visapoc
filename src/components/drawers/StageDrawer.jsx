import { X } from 'lucide-react'
import { fmtIN } from '../../data/portfolio.js'
import styles from './StageDrawer.module.css'

/**
 * Stage detail, opened from the onboarding funnel.
 *
 * This used to sit below the funnel, which pushed the rest of the page down
 * every time a stage was selected and left the reader scrolling to compare two
 * stages. As a drawer the funnel stays put and the detail slides in beside it.
 *
 * It docks rather than overlays: the panel is a sibling of the page column in
 * the same flex row, so opening a stage narrows the page instead of covering
 * it. There is no backdrop — nothing behind it is dimmed or blocked, and the
 * funnel stays readable next to the detail it opened.
 *
 * Sticky positioning matches the sidebar's: pinned below the header, its own
 * scroll, so it stays in view while the page scrolls past it.
 */
export default function StageDrawer({ stage, onClose }) {
  if (!stage) return null

  return (
    <aside className={styles.panel} aria-label={`${stage.label} detail`}>
        <div className={styles.head}>
          <div>
            <div className={styles.kick}>
              <span className={styles.tag}>{stage.tag}</span>
              Stage detail
            </div>
            <div className={styles.title}>{stage.label}</div>
          </div>
          <button type="button" className={styles.close} onClick={onClose} aria-label="Close">
            <X size={16} />
          </button>
        </div>

        <div className={styles.body}>
          <div className={styles.figures}>
            <div className={styles.fig}>
              <div className={styles.figK}>Reached</div>
              <div className={styles.figV}>{fmtIN(stage.reached)}</div>
            </div>
            <div className={styles.fig}>
              <div className={styles.figK}>Stopped here</div>
              <div className={styles.figV}>{fmtIN(stage.stopped)}</div>
              <div className={styles.figN}>{(stage.dropRate * 100).toFixed(0)}% of those who reached</div>
            </div>
            <div className={styles.fig}>
              <div className={styles.figK}>Open now</div>
              <div className={styles.figV}>{fmtIN(stage.openHere)}</div>
            </div>
          </div>

          <p className={styles.why}>{stage.why}</p>

          <div className={styles.sectionTitle}>Why they stop here</div>
          <div className={styles.blockers}>
            {stage.blockers.map((b) => (
              <div key={b.reason} className={styles.blocker}>
                <div className={styles.bTop}>
                  <div className={styles.bReason}>{b.reason}</div>
                  <div className={styles.bShare}>{(b.share * 100).toFixed(0)}%</div>
                </div>
                <div className={styles.bAction}>{b.action}</div>
                <div className={styles.bOwner}><span className={styles.pill}>{b.owner}</span></div>
              </div>
            ))}
          </div>

          <div className={styles.foot}>
            Owned by {stage.owner} · target {stage.slaDays}{' '}
            {stage.slaDays === 1 ? 'day' : 'days'}
          </div>
        </div>
    </aside>
  )
}
