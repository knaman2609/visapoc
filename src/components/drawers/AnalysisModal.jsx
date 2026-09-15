import { useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { findCustomer } from '../../data/customers.js'
import AgentTrace from '../trace/AgentTrace.jsx'
import { useAnalysisModal } from '../../state/useAnalysisModal.js'
import styles from './AnalysisModal.module.css'

export default function AnalysisModal() {
  const [searchParams, setSearchParams] = useSearchParams()
  const navigate = useNavigate()
  const analyzeId = searchParams.get('analyze')
  const customer = analyzeId ? findCustomer(analyzeId) : null
  const { aTrace, aDone, aStatus } = useAnalysisModal(customer)

  const close = () => {
    const next = new URLSearchParams(searchParams)
    next.delete('analyze')
    setSearchParams(next, { replace: true })
  }

  useEffect(() => {
    if (!customer) return undefined
    const h = (e) => { if (e.key === 'Escape') close() }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [customer])

  if (!customer) return null

  const chooseAction = () => {
    close()
    navigate(`/customers/${analyzeId}`)
  }

  const options = [
    {
      rank: '1',
      label: customer.action,
      why: `Highest modelled value · ${customer.likelihood} likelihood · ${customer.channel}`,
      value: customer.value,
      best: true,
    },
    {
      rank: '2',
      label: 'Schedule an RM call this week',
      why: 'Slower, higher touch · better for objection handling',
      value: '—',
      best: false,
    },
    {
      rank: '3',
      label: 'Hold and monitor for 30 days',
      why: 'No contact · signal may resolve on its own',
      value: '—',
      best: false,
    },
  ]

  return (
    <div className={styles.overlay}>
      <div className={styles.backdrop} onClick={close} />
      <div className={styles.panel}>
        <div className={styles.head}>
          <div className={styles.live} />
          <div className={styles.tag}>AGENT ANALYSIS · {customer.name}</div>
          <div className={styles.status}>{aStatus}</div>
          <button type="button" className={styles.close} onClick={close}>✕</button>
        </div>

        <div className={styles.body}>
          <div className={styles.sectHead}>Reasoning</div>
          <AgentTrace steps={aTrace} />
        </div>

        {aDone && (
          <div className={styles.options}>
            <div className={styles.sectHead}>Actions available · pick one to continue</div>
            <div className={styles.optList}>
              {options.map((o) => (
                <button
                  key={o.rank}
                  type="button"
                  className={`${styles.opt} ${o.best ? styles.optBest : ''}`}
                  onClick={chooseAction}
                >
                  <div className={`${styles.rank} ${o.best ? styles.rankBest : ''}`}>{o.rank}</div>
                  <div>
                    <div className={o.best ? styles.labelBest : styles.label}>{o.label}</div>
                    <div className={`${styles.why} ${o.best ? styles.whyBest : ''}`}>{o.why}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div className={o.best ? styles.valBest : styles.valMuted}>{o.value}</div>
                    {o.best && <div className={styles.recPill}>RECOMMENDED →</div>}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
