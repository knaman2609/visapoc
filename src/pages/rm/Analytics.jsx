import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import Bars from '../../components/charts/Bars.jsx'
import { CUSTOMERS } from '../../data/customers.js'
import { fmtIN } from '../../data/portfolio.js'
import { useAppContext } from '../../state/useApp.js'
import { channelMix, queueSummary } from '../../state/useAnalytics.js'
import styles from './Analytics.module.css'

const rupees = (n) => `₹${fmtIN(n)}`

export default function Analytics() {
  const navigate = useNavigate()
  const { sent } = useAppContext()

  const s = useMemo(() => queueSummary(CUSTOMERS, sent), [sent])
  const channels = useMemo(() => channelMix(CUSTOMERS), [])

  const catRows = s.byCategory.map((c) => ({
    label: c.cat,
    count: c.value,
    share: s.valueTotal ? c.value / s.valueTotal : 0,
    cat: c,
  }))

  const channelRows = channels.map((c) => ({
    label: c.name,
    count: c.count,
    share: c.count / CUSTOMERS.length,
    avgLikelihood: c.avgLikelihood,
  }))

  const scoreBands = useMemo(() => {
    const bands = [
      { label: '90+', test: (n) => n >= 90 },
      { label: '80–89', test: (n) => n >= 80 && n < 90 },
      { label: '70–79', test: (n) => n >= 70 && n < 80 },
      { label: 'Under 70', test: (n) => n < 70 },
    ]
    return bands
      .map((b) => {
        const rows = CUSTOMERS.filter((c) => b.test(c.score))
        return { label: b.label, count: rows.length, share: rows.length / CUSTOMERS.length }
      })
      .filter((b) => b.count > 0)
  }, [])

  const stats = [
    { k: 'Open opportunities', v: String(s.open), n: `${s.actioned} actioned of ${s.total} in the book` },
    { k: 'Value still open', v: rupees(s.valueOpen), n: `${rupees(s.valueTotal)} across the whole queue` },
    { k: 'Value actioned', v: rupees(s.valueActioned), n: s.actioned ? 'sent and awaiting response' : 'nothing sent yet' },
    { k: 'Avg opportunity score', v: String(s.avgScore), n: 'impact × urgency × likelihood' },
  ]

  return (
    <div className={styles.wrap}>
      <div className={styles.stats}>
        {stats.map((st) => (
          <div key={st.k} className={styles.stat}>
            <div className={styles.statK}>{st.k}</div>
            <div className={styles.statV}>{st.v}</div>
            <div className={styles.statN}>{st.n}</div>
          </div>
        ))}
      </div>

      <div className={styles.head}>
        <div>
          <h1 className={styles.h1}>My performance</h1>
          <div className={styles.sub}>
            The shape of your book — where the value sits, what you have actioned, and which
            channels the recommendations lean on. Figures move as you work the queue.
          </div>
        </div>
        <button type="button" className={styles.link} onClick={() => navigate('/customers')}>
          Back to queue →
        </button>
      </div>

      <div className={styles.cols}>
        <section className={styles.panel}>
          <div className={styles.panelTitle}>Value by opportunity type</div>
          <div className={styles.panelSub}>
            Modelled first-year value, split by what the agent detected.
          </div>
          <div className={styles.spacer} />
          <Bars rows={catRows} fmt={(r) => rupees(r.count)} />

          <div className={styles.tableWrap}>
            <div className={`${styles.rowHead} ${styles.catGrid}`}>
              <div>Type</div>
              <div className={styles.num}>In book</div>
              <div className={styles.num}>Open</div>
              <div className={styles.num}>Avg score</div>
              <div className={styles.num}>Avg likelihood</div>
            </div>
            {s.byCategory.map((c) => (
              <div key={c.cat} className={`${styles.rowStatic} ${styles.catGrid}`}>
                <div className={styles.strong}>{c.cat}</div>
                <div className={styles.num}>{c.count}</div>
                <div className={styles.num}>
                  {/* Open work is not an error state — danger red is reserved for
                      genuine problems, so only a cleared row earns a colour. */}
                  <span className={c.open === 0 ? styles.good : styles.strong}>{c.open}</span>
                </div>
                <div className={styles.num}>{c.avgScore}</div>
                <div className={styles.num}>{c.avgLikelihood}%</div>
              </div>
            ))}
          </div>
        </section>

        <section className={styles.panel}>
          <div className={styles.panelTitle}>Score distribution</div>
          <div className={styles.panelSub}>
            How the queue is ranked. High scores are worked first.
          </div>
          <div className={styles.spacer} />
          <Bars rows={scoreBands} />

          <div className={styles.divider} />

          <div className={styles.panelTitle}>Channel mix</div>
          <div className={styles.panelSub}>
            Channels the recommendations use, and the response likelihood modelled for each.
          </div>
          <div className={styles.spacer} />
          <Bars
            rows={channelRows}
            meta={(r) => `${r.avgLikelihood}% likely`}
          />
        </section>
      </div>

      <section className={styles.panelWide}>
        <div className={styles.panelTitle}>Every opportunity in the book</div>
        <div className={styles.panelSub}>
          Sorted by score. Click through to work the customer.
        </div>

        <div className={styles.tableWrap}>
          <div className={`${styles.rowHead} ${styles.custGrid}`}>
            <div className={styles.num}>Score</div>
            <div>Customer</div>
            <div>Type</div>
            <div>Signal</div>
            <div>Channel</div>
            <div className={styles.num}>Likelihood</div>
            <div className={styles.num}>Value</div>
            <div>Status</div>
          </div>

          {[...CUSTOMERS].sort((a, b) => b.score - a.score).map((c) => (
            <button
              key={c.id}
              type="button"
              className={`${styles.row} ${styles.custGrid}`}
              onClick={() => navigate(`/customers/${c.id}`)}
            >
              <div className={styles.num}>
                <span className={styles.score}>{c.score}</span>
              </div>
              <div>
                <div className={styles.strong}>{c.name}</div>
                <div className={styles.meta}>{c.card} · {c.segment}</div>
              </div>
              <div>{c.cat}</div>
              <div className={styles.signal}>{c.signalTitle}</div>
              <div className={styles.meta}>{c.channel}</div>
              <div className={styles.num}>{c.likelihood}</div>
              <div className={styles.num}>{c.value}</div>
              <div>
                {sent[c.id]
                  ? <span className={`${styles.pill} ${styles.ok}`}>Sent {sent[c.id]}</span>
                  : <span className={styles.pill}>Open</span>}
              </div>
            </button>
          ))}
        </div>
      </section>
    </div>
  )
}
