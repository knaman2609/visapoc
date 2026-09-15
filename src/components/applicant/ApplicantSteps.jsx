import { Check } from 'lucide-react'
import styles from './ApplicantSteps.module.css'

/**
 * One application's position on the eight onboarding stages.
 *
 * Shared by the journey page and the queue's drawer so the spine exists once —
 * the two differ in width, not in what they say, and a second copy would drift
 * the moment either one changed.
 *
 * `compact` is for the 400px dock: it drops the per-stage description line,
 * which is context the full page has room for and the panel does not. The
 * current step's callout survives in both, because it is the reason to open
 * either one.
 */
export default function ApplicantSteps({ steps, row, compact = false }) {
  return (
    <ol className={`${styles.steps} ${compact ? styles.compact : ''}`}>
      {steps.map((s) => (
        <li key={s.id} className={`${styles.step} ${styles[s.state]}`}>
          <div className={styles.marker} aria-hidden="true">
            {s.state === 'cleared' ? <Check size={12} /> : <span className={styles.dot} />}
          </div>

          <div className={styles.stepBody}>
            <div className={styles.stepHead}>
              <span className={styles.tag}>{s.tag}</span>
              <span className={styles.stepName}>{s.label}</span>
              <span className={styles.stepState}>
                {s.state === 'cleared' ? 'Cleared' : s.state === 'here' ? 'Stopped here' : 'Not reached'}
              </span>
            </div>

            {!compact && <div className={styles.stepLine}>{s.line}</div>}

            {s.state === 'here' && (
              <div className={styles.stuck}>
                <div className={styles.stuckK}>What is holding it</div>
                <div className={styles.stuckV}>{row.blocker}</div>
                {s.action && (
                  <>
                    <div className={styles.stuckK}>What clears it</div>
                    <div className={styles.stuckV}>{s.action}</div>
                  </>
                )}
                <div className={styles.stuckFoot}>
                  {s.blockerOwner} owns the next move · target {s.slaDays}{' '}
                  {s.slaDays === 1 ? 'day' : 'days'} · {row.days} days waited
                </div>
              </div>
            )}
          </div>
        </li>
      ))}
    </ol>
  )
}
