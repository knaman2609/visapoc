import { useEffect, useState } from 'react'
import { PM_FEED, PM_WATCH } from '../../data/portfolio.js'
import { useCountdown } from '../../state/useCountUp.js'
import styles from './AlwaysOn.module.css'

const KIND_LABEL = { opp: 'Opportunity', risk: 'Risk', sweep: 'Sweep' }

// PM_FEED is authored newest-first. The ticker runs the other way: events
// arrive at the bottom and push the older ones up and out of frame.
const FEED = [...PM_FEED].reverse()

const VISIBLE = 4       // rows on screen when collapsed
const WINDOW = VISIBLE + 1 // one extra row sits below the fold, sliding in
const TICK_MS = 3200

export default function AlwaysOn() {
  const [expanded, setExpanded] = useState(false)
  const [cursor, setCursor] = useState(FEED.length - 1)
  const [mm, ss] = useCountdown(PM_WATCH.nextSweepIn)

  // The ticker only runs while collapsed — once the operator has opened the
  // full log, moving it under them would be hostile.
  useEffect(() => {
    if (expanded) return undefined
    const id = setInterval(() => setCursor((c) => c + 1), TICK_MS)
    return () => clearInterval(id)
  }, [expanded])

  // Five events ending at the cursor, wrapping so the feed never runs dry.
  const rows = Array.from({ length: WINDOW }, (_, i) => {
    const idx = cursor - (WINDOW - 1 - i)
    const e = FEED[((idx % FEED.length) + FEED.length) % FEED.length]
    return { ...e, key: idx }
  })

  return (
    <section className={styles.wrap} aria-label="Always-on portfolio watch">
      <div className={styles.bar}>
        <div className={styles.live}>
          <span className={styles.dot} aria-hidden="true" />
          LIVE
        </div>
        <div className={styles.barTitle}>
          Always-on portfolio watch
          <span className={styles.barSub}>
            {PM_WATCH.scansRunning} scans running · every {PM_WATCH.sweepEvery / 60}h · {PM_WATCH.uptimeDays} days without a gap
          </span>
        </div>
        <div className={styles.sweep}>
          <span className={styles.sweepK}>Sweep {PM_WATCH.sweepsToday} today at {PM_WATCH.lastSweep}</span>
          <span className={styles.sweepNext}>
            next in <b className={styles.clock}>{mm}:{ss}</b>
          </span>
        </div>
        <button
          type="button"
          className={styles.viewAll}
          onClick={() => setExpanded((v) => !v)}
          aria-expanded={expanded}
          aria-controls="agent-activity"
        >
          {expanded ? 'Show less' : `View all ${FEED.length}`}
        </button>
      </div>

      <div className={styles.paneHead}>
        Agent activity
        <span className={styles.paneHint}>
          {expanded ? 'Full log · oldest first' : 'Streaming · newest at the bottom'}
        </span>
      </div>

      {expanded ? (
        <ol id="agent-activity" className={styles.full}>
          {FEED.map((e) => <Event key={e.t + e.title} event={e} />)}
        </ol>
      ) : (
        <div id="agent-activity" className={styles.viewport}>
          {/* Keyed on the cursor so the rise animation restarts every tick. */}
          <ol className={styles.track} key={cursor}>
            {rows.map((e, i) => (
              <Event key={e.key} event={e} fresh={i === rows.length - 1} />
            ))}
          </ol>
        </div>
      )}
    </section>
  )
}

function Event({ event, fresh = false }) {
  return (
    <li className={`${styles.event} ${fresh ? styles.fresh : ''}`}>
      <div className={styles.eventT}>{event.t}</div>
      <div className={`${styles.eventKind} ${styles[event.kind]}`}>{KIND_LABEL[event.kind]}</div>
      <div className={styles.eventBody}>
        <div className={styles.eventTitle}>{event.title}</div>
        <div className={styles.eventMeta}>{event.meta}</div>
      </div>
    </li>
  )
}
