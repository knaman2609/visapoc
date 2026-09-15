import { useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { CATEGORIES, CUSTOMERS } from '../../data/customers.js'
import Button from '../../components/ui/Button.jsx'
import Chip from '../../components/ui/Chip.jsx'
import { useAppContext, useAppProps } from '../../state/useApp.js'
import styles from './Dashboard.module.css'

export default function Dashboard() {
  const navigate = useNavigate()
  const [, setSearchParams] = useSearchParams()
  const { sent } = useAppContext()
  const { showScores } = useAppProps()
  const [filter, setFilter] = useState('All')

  const rows = useMemo(
    () =>
      CUSTOMERS.filter((c) => filter === 'All' || c.cat === filter)
        .sort((a, b) => b.score - a.score),
    [filter],
  )

  const openCount = CUSTOMERS.filter((c) => !sent[c.id]).length

  const stats = [
    { k: 'Portfolio', v: '248', n: 'cards under management' },
    { k: 'Open opportunities', v: String(openCount), n: 'ranked and ready to action' },
    { k: 'Value at stake', v: '₹18.4L', n: 'modelled over 12 months' },
    { k: 'Actions this week', v: '42', n: '61% customer response rate' },
  ]

  const openProfile = (id) => {
    setSearchParams({ profile: id })
  }

  return (
    <div className={styles.wrap}>
      <div className={styles.stats}>
        {stats.map((s) => (
          <div key={s.k} className={styles.stat}>
            <div className={styles.statK}>{s.k}</div>
            <div className={styles.statV}>{s.v}</div>
            <div className={styles.statN}>{s.n}</div>
          </div>
        ))}
      </div>

      <div className={styles.head}>
        <div>
          <h1 className={styles.h1}>Opportunity queue</h1>
          <div className={styles.sub}>
            Ranked by impact × urgency × likelihood of customer response. Refreshed 06:00 today.
          </div>
        </div>
        <div className={styles.filters}>
          {CATEGORIES.map((c) => (
            <button
              key={c}
              type="button"
              className={`${styles.filter} ${filter === c ? styles.filterOn : ''}`}
              onClick={() => setFilter(c)}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      <div className={styles.tableWrap}>
        <div className={styles.rowHead}>
          <div>Score</div>
          <div>Customer</div>
          <div>Signal detected</div>
          <div>Agent recommendation</div>
          <div>Est. value</div>
          <div />
        </div>

        {rows.map((r) => {
          const isSent = !!sent[r.id]
          return (
            <div key={r.id} className={styles.row}>
              <div className={styles.score}>
                <div className={styles.scoreN}>{showScores ? r.score : ''}</div>
              </div>

              <div>
                <span className={styles.name}>{r.name}</span>
                <div className={styles.meta}>{r.card} · {r.segment}</div>
              </div>

              <div>
                <div className={styles.signalTitle}>{r.signalTitle}</div>
                <div className={styles.chips}>
                  {r.chips.map((c) => <Chip key={c}>{c}</Chip>)}
                </div>
              </div>

              <div>
                {isSent ? (
                  <div className={styles.actionKnown}>{r.action}</div>
                ) : (
                  <div className={styles.actionUnknown}>Pending analysis</div>
                )}
              </div>

              <div className={styles.value}>{r.value}</div>

              <div className={styles.cta}>
                {isSent ? (
                  <div className={styles.sent}>✓ Sent · {sent[r.id]}</div>
                ) : (
                  <Button variant="primary" block onClick={() => openProfile(r.id)}>
                    Run analysis →
                  </Button>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
