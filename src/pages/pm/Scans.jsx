import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { PM_SCANS, SCAN_OPP_MAP } from '../../data/portfolio.js'
import Button from '../../components/ui/Button.jsx'
import StatusPill from '../../components/ui/StatusPill.jsx'
import styles from './Scans.module.css'

export default function Scans() {
  const [openId, setOpenId] = useState(null)
  const navigate = useNavigate()

  const activeCount = PM_SCANS.filter((x) => x.live).length
  const pausedCount = PM_SCANS.filter((x) => !x.live && !x.pending).length
  const summary = `${activeCount} active · 1 in review · ${pausedCount} paused`

  const openScan = (sc) => {
    // Navigate to /pm/flow/0 with pmOpp set to matching opportunity.
    const oppId = SCAN_OPP_MAP[sc.id]
    // The mockup preselects the opportunity on the flow page; we mimic by adding it as a query param.
    navigate(`/pm/flow/0${oppId ? `?opp=${oppId}` : ''}`)
  }

  return (
    <div className={styles.wrap}>
      <div className={styles.head}>
        <div>
          <div className={styles.headKick}>Growth</div>
          <h1 className={styles.h1}>Scans</h1>
          <div className={styles.sub}>
            Each scan is a rule set the agent runs on a schedule. When a rule set clears its threshold, it raises an opportunity.
          </div>
        </div>
        <div className={styles.headRight}>
          <div className={styles.count}>{summary}</div>
          <Button variant="primary" size="lg">New scan</Button>
        </div>
      </div>

      <div className={styles.tableWrap}>
        <div className={styles.rowHead}>
          <div>Scan</div>
          <div>Schedule</div>
          <div>Last result</div>
          <div>State</div>
          <div />
        </div>

        {PM_SCANS.map((sc) => {
          const isOpen = openId === sc.id
          const status = sc.live ? 'active' : sc.pending ? 'review' : 'paused'
          return (
            <div key={sc.id} className={styles.scan}>
              <div className={styles.summary}>
                <button
                  type="button"
                  className={styles.open}
                  onClick={() => openScan(sc)}
                >
                  <div>
                    <div className={styles.name}>{sc.name}</div>
                    <div className={styles.owner}>Owner {sc.owner}</div>
                  </div>
                  <div className={styles.cad}>{sc.cadence}</div>
                  <div>
                    <div className={styles.found}>{sc.found}</div>
                    <div className={styles.ran}>RAN {sc.run}</div>
                  </div>
                  <div className={styles.state}>
                    <StatusPill status={status} />
                  </div>
                </button>
                <div className={styles.toggleWrap}>
                  <button
                    type="button"
                    className={`${styles.toggle} ${isOpen ? styles.toggleOpen : ''}`}
                    onClick={() => setOpenId(isOpen ? null : sc.id)}
                  >
                    {isOpen ? 'Rules ↑' : 'Rules ↓'}
                  </button>
                </div>
              </div>

              {isOpen && (
                <div className={styles.expand}>
                  <div>
                    <div className={styles.rulesHead}>Rules · all must hold</div>
                    <div className={styles.rules}>
                      {sc.rules.map((r) => (
                        <div key={r} className={styles.rule}>
                          <div className={styles.ruleTick}>✓</div>
                          <div className={styles.ruleText}>{r}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className={styles.rightPane}>
                    <div className={styles.threshBox}>
                      <div className={styles.threshK}>Raise threshold</div>
                      <div className={styles.threshV}>{sc.threshold}</div>
                    </div>
                    <div style={{ display: 'flex', gap: 10 }}>
                      <Button
                        variant="secondary"
                        onClick={(e) => { e.stopPropagation(); openScan(sc) }}
                      >
                        See last result
                      </Button>
                      <Button variant="secondary">Edit rules</Button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
