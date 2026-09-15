import { useNavigate, useParams } from 'react-router-dom'
import { findCustomer } from '../../data/customers.js'
import AgentTrace from '../../components/trace/AgentTrace.jsx'
import Button from '../../components/ui/Button.jsx'
import PhoneShell from '../../components/ui/PhoneShell.jsx'
import { useAgentTrace } from '../../state/useAgentTrace.js'
import styles from './CustomerDetail.module.css'

export default function CustomerDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const customer = findCustomer(id)

  const {
    trace, status, phoneCaption,
    approve, customerAct,
    phoneIdle, phoneNotif, phoneApp, phoneDone,
    showRecommendation, awaitingApproval, showOutcome,
  } = useAgentTrace(customer)

  if (!customer) {
    return <div style={{ padding: 56 }}>Customer not found.</div>
  }

  const back = () => navigate('/customers')

  return (
    <div className={styles.wrap}>
      <div className={styles.top}>
        <div className={styles.left}>
          <Button variant="secondary" size="sm" onClick={back}>← Queue</Button>
          <div>
            <div className={styles.name}>{customer.name}</div>
            <div className={styles.meta}>
              {customer.card} · {customer.segment} · Customer since {customer.since}
            </div>
          </div>
        </div>
        <div className={styles.scoreWrap}>
          <div className={styles.scoreLbl}>OPPORTUNITY SCORE</div>
          <div className={styles.scoreBox}>{customer.score}</div>
        </div>
      </div>

      <div className={styles.body}>
        {/* Left column: Signal + Context + Value */}
        <div className={styles.col}>
          <div className={styles.section}>
            <div className={styles.sectHead}>Signal</div>
            <div className={styles.sigTitle}>{customer.signalTitle}</div>
            <div className={styles.sigDetail}>{customer.signalDetail}</div>
          </div>

          <div className={styles.section}>
            <div className={styles.sectHead}>Customer context</div>
            <div>
              {customer.context.map((c) => (
                <div key={c.k} className={styles.ctxRow}>
                  <div>{c.k}</div>
                  <div>{c.v}</div>
                </div>
              ))}
            </div>
          </div>

          <div className={styles.valBox}>
            <div className={styles.valK}>EST. VALUE IF ACTIONED</div>
            <div className={styles.valV}>{customer.value}</div>
            <div className={styles.valN}>{customer.valueNote}</div>
          </div>
        </div>

        {/* Middle column: phone preview */}
        <div className={styles.phoneCol}>
          <div className={styles.phoneKick}>Customer experience</div>

          <PhoneShell size="md" screenBg="#eef0f3">
            {phoneIdle && (
              <div className={styles.pIdle}>
                <div className={styles.pClock}>9:41</div>
                <div className={styles.pDate}>Tuesday, 4 September</div>
                <div className={styles.pIdleNote}>
                  AWAITING RM APPROVAL<br />NO MESSAGE SENT YET
                </div>
              </div>
            )}

            {phoneNotif && (
              <div className={styles.pNotif}>
                <div className={styles.pClock}>9:41</div>
                <div className={styles.pDate}>Tuesday, 4 September</div>
                <div className={styles.notifCard}>
                  <div className={styles.notifHead}>
                    <div className={styles.notifIco} />
                    <div className={styles.notifApp}>Bank App</div>
                    <div className={styles.notifNow}>now</div>
                  </div>
                  <div className={styles.notifTitle}>{customer.notifTitle}</div>
                  <div className={styles.notifBody}>{customer.notifBody}</div>
                </div>
              </div>
            )}

            {phoneApp && (
              <div className={styles.pApp}>
                <div className={styles.appBar}>
                  <div className={styles.appKick}>{customer.appKicker}</div>
                  <div className={styles.appTitle}>{customer.appTitle}</div>
                </div>
                <div className={styles.appBody}>
                  <div className={styles.appLead}>{customer.appBody}</div>
                  <div className={styles.appPoints}>
                    {customer.appPoints.map((p) => (
                      <div key={p} className={styles.appPoint}>
                        <div className={styles.appDot} />
                        <div className={styles.appPointText}>{p}</div>
                      </div>
                    ))}
                  </div>
                  <div className={styles.appFoot}>
                    <Button
                      variant="primary"
                      size="lg"
                      block
                      onClick={customerAct}
                    >
                      {customer.appCta} →
                    </Button>
                    <div className={styles.appHint}>Sent by your Relationship Manager</div>
                  </div>
                </div>
              </div>
            )}

            {phoneDone && (
              <div className={styles.pDone}>
                <div className={styles.pDoneCheck}>✓</div>
                <div className={styles.pDoneTitle}>{customer.outcomeTitle}</div>
                <div className={styles.pDoneBody}>{customer.outcomeBody}</div>
              </div>
            )}
          </PhoneShell>

          <div className={styles.phoneCap}>{phoneCaption}</div>
        </div>

        {/* Right column: Agent trace + recommendation */}
        <div className={styles.trace}>
          <div className={styles.traceHead}>
            <div className={styles.traceLive} />
            <div className={styles.traceHeadLbl}>Agent intelligence</div>
            <div className={styles.traceStatus}>{status}</div>
          </div>

          <div className={styles.tracePad}>
            <div>
              <div className={styles.sourcesHead}>1 · Customer data read</div>
              <div className={styles.sources}>
                {customer.sources.map((s) => (
                  <div key={s} className={styles.source}>{s}</div>
                ))}
              </div>
            </div>

            <div>
              <div className={styles.sourcesHead}>2 · Reasoning</div>
              <AgentTrace steps={trace} />
            </div>

            {showRecommendation && (
              <div className={styles.recBox}>
                <div className={styles.recHead}>3 · NEXT BEST ACTION</div>
                <div className={styles.recBody}>
                  <div className={styles.recGrid}>
                    <div>
                      <div className={styles.recK}>CHANNEL</div>
                      <div className={styles.recV}>{customer.channel}</div>
                    </div>
                    <div>
                      <div className={styles.recK}>TIMING</div>
                      <div className={styles.recV}>{customer.timing}</div>
                    </div>
                    <div>
                      <div className={styles.recK}>LIKELIHOOD</div>
                      <div className={styles.recV}>{customer.likelihood}</div>
                    </div>
                  </div>
                  <div className={styles.msgBox}>
                    <div className={styles.msgKick}>GENERATED MESSAGE</div>
                    <div className={styles.msgTitle}>{customer.notifTitle}</div>
                    <div className={styles.msgBody}>{customer.notifBody}</div>
                  </div>
                  <div className={styles.rationale}>{customer.rationale}</div>
                  {awaitingApproval && (
                    <div className={styles.actions}>
                      <Button variant="primary" size="lg" onClick={approve}>Approve &amp; send</Button>
                      <Button variant="secondary" size="lg">Edit message</Button>
                      <Button variant="ghost" size="lg" onClick={back}>Snooze</Button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {showOutcome && (
              <div className={styles.outcomeBox}>
                <div className={styles.outcomeHead}>4 · CUSTOMER RESPONSE</div>
                <div className={styles.outcomePad}>
                  {customer.outcomeLog.map((o) => (
                    <div key={o.t + o.label} className={styles.outcomeRow}>
                      <div className={styles.outcomeT}>{o.t}</div>
                      <div className={styles.outcomeLabel}>{o.label}</div>
                    </div>
                  ))}
                  <Button variant="primary" size="lg" onClick={back}>Back to queue →</Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
