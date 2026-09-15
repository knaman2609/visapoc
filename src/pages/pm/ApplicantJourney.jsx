import { useMemo } from 'react'
import { ArrowLeft } from 'lucide-react'
import { Link, useParams } from 'react-router-dom'
import ApplicantSteps from '../../components/applicant/ApplicantSteps.jsx'
import { applicantById, inr, journeySteps } from '../../state/useOnboarding.js'
import styles from './ApplicantJourney.module.css'

/**
 * One application's journey, opened from the priority queue.
 *
 * The queue answers "who is stuck"; this answers "where, and what moves them".
 * It is a page rather than a drawer because it is a destination — somebody
 * works a file from here, and a docked panel could not carry the whole journey
 * without squeezing the list it came from.
 *
 * The spine is the eight onboarding stages with this application's position
 * marked on them: cleared behind it, the one it sits on, and the ones it never
 * reached. No per-stage dates are shown, because the book does not carry any —
 * it knows the intake week and how long the file has sat where it is, and
 * nothing more granular than that would be true.
 *
 * Only the ten authored applicants carry `meta`, `signals`, `fix` and a linked
 * RM customer. Every one of those is guarded, so a generated file renders the
 * same journey with the figures it does have.
 */
export default function ApplicantJourney() {
  const { id } = useParams()
  const row = useMemo(() => applicantById(id), [id])
  const steps = useMemo(() => (row ? journeySteps(row) : []), [row])

  if (!row) {
    return (
      <div className={styles.wrap}>
        <div className={styles.missing}>
          <div className={styles.missingTitle}>No such application</div>
          <p className={styles.missingBody}>
            Nothing on the book carries the id <code>{id}</code>. It may have been a link from
            another quarter.
          </p>
          <Link className={styles.back} to="/pm/analytics?tab=queue">
            <ArrowLeft size={14} /> Back to the priority queue
          </Link>
        </div>
      </div>
    )
  }

  const here = steps.find((s) => s.state === 'here')

  return (
    <div className={styles.wrap}>
      <div className={styles.head}>
        <Link className={styles.back} to="/pm/analytics?tab=queue">
          <ArrowLeft size={14} /> Priority queue
        </Link>

        <div className={styles.title}>
          <h1 className={styles.h1}>{row.name}</h1>
          <div className={styles.tags}>
            {row.featured && <span className={`${styles.pill} ${styles.brand}`}>Written file</span>}
            {row.thinFile && <span className={`${styles.pill} ${styles.warn}`}>Thin file</span>}
            {row.breached && <span className={`${styles.pill} ${styles.danger}`}>Past SLA</span>}
            {row.completed && <span className={`${styles.pill} ${styles.ok}`}>Onboarded</span>}
            {!row.completed && !row.open && <span className={styles.pill}>Closed, not worked</span>}
          </div>
        </div>
        <div className={styles.sub}>
          {row.meta ?? `${row.age} · ${row.city} · ${row.variant}`} · applied in week{' '}
          {row.week + 1} of the quarter · {row.channel} · {row.kyc}
        </div>
      </div>

      {/* The headline figures for whoever picks this file up: where it is, how
          long it has sat there, and what it is worth if it clears. */}
      <div className={styles.stats}>
        <div className={styles.stat}>
          <div className={styles.statK}>Sitting at</div>
          <div className={styles.statV}>{here ? here.label : 'Complete'}</div>
          <div className={styles.statN}>
            {here ? `owned by ${here.blockerOwner}` : 'carried through to first spend'}
          </div>
        </div>
        <div className={styles.stat}>
          <div className={styles.statK}>Waiting</div>
          <div className={`${styles.statV} ${row.breached ? styles.bad : ''}`}>{row.days}d</div>
          <div className={styles.statN}>
            {here ? `target ${here.slaDays} ${here.slaDays === 1 ? 'day' : 'days'}` : 'no step outstanding'}
          </div>
        </div>
        <div className={styles.stat}>
          <div className={styles.statK}>Value at stake</div>
          <div className={styles.statV}>{inr(row.value)}</div>
          <div className={styles.statN}>modelled first-year value</div>
        </div>
        <div className={styles.stat}>
          <div className={styles.statK}>Limit</div>
          <div className={styles.statV}>
            {row.limit ? inr(row.limit) : row.limitRec ? inr(row.limitRec) : '—'}
          </div>
          <div className={styles.statN}>
            {row.limit ? 'assigned' : row.limitRec ? 'recommended, not assigned' : 'not sized yet'}
          </div>
        </div>
      </div>

      <div className={styles.cols}>
        <section className={styles.panel}>
          <div className={styles.panelTitle}>The journey</div>
          <div className={styles.panelSub}>
            The eight steps every application runs, with this one&apos;s position on them. Steps
            behind it are cleared; the marked step is where it stopped.
          </div>

          <ApplicantSteps steps={steps} row={row} />
        </section>

        <div className={styles.side}>
          {/* Authored applicants only: what the file actually shows, and the
              reasoning behind the recommended move. */}
          {row.signals && (
            <section className={styles.panel}>
              <div className={styles.panelTitle}>What the file shows</div>
              <div className={styles.signals}>
                {row.signals.map((sg) => <div key={sg} className={styles.signal}>{sg}</div>)}
              </div>
              {row.fix && <div className={styles.fix}>{row.fix}</div>}
            </section>
          )}

          <section className={styles.panel}>
            <div className={styles.panelTitle}>The file</div>
            <div className={styles.facts}>
              <div><div className={styles.factK}>Income</div><div className={styles.factV}>{inr(row.income)}/yr</div></div>
              <div><div className={styles.factK}>Obligations</div><div className={styles.factV}>{inr(row.oblig)}/yr</div></div>
              <div><div className={styles.factK}>Bureau</div><div className={styles.factV}>{row.bureau ?? 'No file'}</div></div>
              <div><div className={styles.factK}>Age</div><div className={styles.factV}>{row.age}</div></div>
              <div><div className={styles.factK}>City</div><div className={styles.factV}>{row.city}</div></div>
              <div><div className={styles.factK}>Variant</div><div className={styles.factV}>{row.variant}</div></div>
              <div><div className={styles.factK}>Channel</div><div className={styles.factV}>{row.channel}</div></div>
              <div><div className={styles.factK}>KYC mode</div><div className={styles.factV}>{row.kyc}</div></div>
            </div>

            {row.customerId && (
              <Link className={styles.btn} to={`/customers/${row.customerId}`}>
                Open in the customer queue →
              </Link>
            )}
          </section>
        </div>
      </div>
    </div>
  )
}
