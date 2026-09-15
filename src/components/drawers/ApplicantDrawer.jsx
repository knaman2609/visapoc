import { ArrowRight, Maximize2, X } from 'lucide-react'
import { Link } from 'react-router-dom'
import ApplicantSteps from '../applicant/ApplicantSteps.jsx'
import { inr, journeySteps } from '../../state/useOnboarding.js'
import styles from './ApplicantDrawer.module.css'

// Template maps the applicant's current stage to the profile whose analysis
// structure fits it. The identity block is overridden with the applicant's own
// name/city/variant in the drawer.
function profileTemplateFor(row) {
  if (row.customerId) return row.customerId
  if (row.stuckAt === 's8') return 'firstspend'
  return 'activation'
}

/**
 * A file opened from the priority queue, docked beside the list.
 *
 * The queue's job is comparing people, and navigating away to a full page for
 * every one of them loses the list you were working. So the panel is the
 * default: it narrows the page rather than covering it, the row stays visible
 * and marked, and the next row is one click away. The full page is still there
 * for when the file is the thing you are working rather than the queue —
 * "Open full screen" goes to it, and so does a cmd-click on the row.
 *
 * The journey spine is the same component the full page renders, in its
 * compact form. Only the figures below it are abridged: the whole point of the
 * escape hatch is that the panel does not have to carry everything.
 */
export default function ApplicantDrawer({ row, onClose }) {
  if (!row) return null

  const steps = journeySteps(row)
  const here = steps.find((s) => s.state === 'here')

  return (
    <aside className={styles.panel} aria-label={`${row.name} file`}>
      <div className={styles.head}>
        <div>
          <div className={styles.kick}>
            <span className={styles.tag}>{row.stage.tag}</span>
            {row.featured ? 'Written file' : 'Open application'}
          </div>
          <div className={styles.title}>{row.name}</div>
          <div className={styles.meta}>{row.meta ?? `${row.age} · ${row.city} · ${row.variant}`}</div>
        </div>
        <button type="button" className={styles.close} onClick={onClose} aria-label="Close">
          <X size={16} />
        </button>
      </div>

      <div className={styles.body}>
        <div className={styles.tags}>
          {row.thinFile && <span className={`${styles.pill} ${styles.warn}`}>Thin file</span>}
          <span className={`${styles.pill} ${row.breached ? styles.danger : ''}`}>
            {row.days}d waiting
          </span>
          {here && <span className={styles.pill}>target {here.slaDays}d</span>}
          <span className={styles.pill}>{inr(row.value)}</span>
        </div>

        <ApplicantSteps steps={steps} row={row} compact />

        <Link
          className={styles.btn}
          to={`/customers?profile=${profileTemplateFor(row)}&applicant=${row.id}`}
        >
          Act <ArrowRight size={13} />
        </Link>
        <Link className={styles.btnGhost} to={`/pm/analytics/applicant/${row.id}`}>
          <Maximize2 size={13} /> Open full screen
        </Link>
        <div className={styles.foot}>
          Act opens the customer in the lifecycle view — where the next move gets made.
        </div>
      </div>
    </aside>
  )
}
