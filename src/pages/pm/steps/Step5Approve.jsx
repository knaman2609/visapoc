import { useMemo } from 'react'
import { PM_APPROVERS } from '../../../data/portfolio.js'
import { buildCampaign, launchRows } from '../../../data/campaign.js'
import Button from '../../../components/ui/Button.jsx'
import Checkmark from '../../../components/ui/Checkmark.jsx'
import Spinner from '../../../components/ui/Spinner.jsx'
import stepStyles from './step.module.css'
import styles from './Step5Approve.module.css'
import StepActions from '../StepActions.jsx'

export default function Step5Approve({ flow }) {
  const campaign = useMemo(() => buildCampaign(flow), [flow])
  const rows = launchRows(campaign)

  const stateNow = flow.approved ? 'Approved' : flow.submitted ? 'Review' : 'Draft'

  return (
    <div className={stepStyles.wrap}>
      <div className={stepStyles.head}>
        <div>
          <div className={stepStyles.kicker}>Approval</div>
          <h1 className={stepStyles.h1}>{campaign.title}</h1>
          <div className={stepStyles.sub}>{campaign.segment.title}</div>
        </div>
        <div className={styles.stateWrap}>
          <div className={styles.stateK}>STATE</div>
          <div className={styles.stateV}>{stateNow}</div>
        </div>
      </div>

      <div className={styles.grid}>
        <div className={styles.left}>
          <div className={styles.kick}>What approvers see</div>
          <div className={styles.launchList}>
            {rows.map((lr) => (
              <div key={lr.k} className={styles.launchRow}>
                <div className={styles.launchK}>{lr.k}</div>
                <div>
                  <div className={styles.launchV}>{lr.v}</div>
                  {lr.note && <div className={styles.launchNote}>{lr.note}</div>}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className={styles.right}>
          <div className={styles.kick}>Approvers</div>
          <div className={styles.approvers}>
            {PM_APPROVERS.map((ap, i) => {
              const done = flow.submitted && i < flow.apprN
              const waiting = flow.submitted && i === flow.apprN
              return (
                <div key={ap.role} className={styles.approver}>
                  {done && <Checkmark size="md" variant="ok" />}
                  {waiting && <Spinner size="sm" />}
                  {!done && !waiting && <div className={styles.emptyBox} />}
                  <div>
                    <div className={styles.role}>{ap.role}</div>
                    <div className={styles.name}>{ap.name} · {ap.note}</div>
                  </div>
                  <div className={styles.stamp}>
                    {done ? `APPROVED · 09:5${2 + i}` : ''}
                  </div>
                </div>
              )
            })}
          </div>

          {!flow.submitted && (
            <Button
              variant="primary"
              size="lg"
              block
              onClick={flow.submit}
              style={{ marginTop: 18 }}
            >
              Submit for approval →
            </Button>
          )}

          {flow.approved && (
            <div className={styles.approvedBox}>
              <div className={styles.approvedHead}>APPROVED · 07 SEP 09:54</div>
              <div className={styles.approvedText}>
                Cohort, targeting logic, offer and generated copy signed off.
                Personalised generation can run for the full audience.
              </div>
            </div>
          )}
        </div>
      </div>

      <StepActions>
        <Button variant="secondary" onClick={flow.goBack}>← Communication preview</Button>
        {flow.approved && (
          <Button
            variant="primary"
            size="lg"
            className={stepStyles.actionsRight}
            onClick={() => flow.goStep(6)}
          >
            Generate and launch →
          </Button>
        )}
      </StepActions>
    </div>
  )
}
