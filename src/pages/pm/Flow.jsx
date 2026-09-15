import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { FLOW_STEPS } from '../../data/portfolio.js'
import { usePmFlow } from '../../state/usePmFlow.js'
import { buildCampaign } from '../../data/campaign.js'
import Step0Scan from './steps/Step0Scan.jsx'
import Step1Cohort from './steps/Step1Cohort.jsx'
import Step2Interventions from './steps/Step2Interventions.jsx'
import Step3Design from './steps/Step3Design.jsx'
import Step4Preview from './steps/Step4Preview.jsx'
import Step5Approve from './steps/Step5Approve.jsx'
import Step6Launch from './steps/Step6Launch.jsx'
import Step7Live from './steps/Step7Live.jsx'
import AgentPanel from '../../components/agent/AgentPanel.jsx'
import { StepActionsSlot } from './StepActions.jsx'
import styles from './Flow.module.css'

const STEP_COMPONENTS = [
  Step0Scan, Step1Cohort, Step2Interventions, Step3Design,
  Step4Preview, Step5Approve, Step6Launch, Step7Live,
]

export default function Flow() {
  const [searchParams, setSearchParams] = useSearchParams()
  const flow = usePmFlow()
  // The rail reports on the same campaign the step renders, so its figures
  // cannot drift from the ones beside it.
  const campaign = useMemo(() => buildCampaign(flow), [flow])
  // The bar hosts whatever the active step declares, so it has to exist in the
  // DOM before the step renders into it — hence a ref that triggers a render.
  const [actionSlot, setActionSlot] = useState(null)

  // If ?opp=<id> is set (Scans → Flow entry), sync it once.
  useEffect(() => {
    const opp = searchParams.get('opp')
    if (opp && opp !== flow.pmOpp) {
      flow.pickOpp(opp)
      // Clean the URL after applying.
      const next = new URLSearchParams(searchParams)
      next.delete('opp')
      setSearchParams(next, { replace: true })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams])

  const StepComp = STEP_COMPONENTS[flow.step] || Step0Scan

  return (
    <div className={styles.wrap}>
      <div
        className={styles.rail}
        style={{ '--rail-progress': `${((flow.step + 1) / FLOW_STEPS.length) * 100}%` }}
      >
        {FLOW_STEPS.map((label, i) => {
          const isOn = i === flow.step
          const isDone = i < flow.step
          const isTodo = i > flow.step
          const cls = [
            styles.stepBtn,
            isOn ? styles.on : '',
            isDone ? styles.done : '',
            isTodo ? styles.todo : '',
          ].filter(Boolean).join(' ')
          return (
            <button
              key={label}
              type="button"
              className={cls}
              onClick={() => { if (i <= flow.step) flow.goStep(i) }}
              disabled={i > flow.step}
            >
              <div className={`${styles.num} ${isOn ? styles.numOn : isDone ? styles.numDone : styles.numTodo}`}>
                {isDone ? '✓' : String(i + 1).padStart(2, '0')}
              </div>
              <div className={`${styles.label} ${isOn ? styles.labelOn : isDone ? styles.labelDone : styles.labelTodo}`}>
                {label}
              </div>
            </button>
          )
        })}
      </div>

      <div className={styles.row}>
        <div className={styles.col}>
          <div
            ref={setActionSlot}
            className={styles.actionBar}
            role="group"
            aria-label="Step navigation"
          />
          <div className={styles.content}>
            <StepActionsSlot.Provider value={actionSlot}>
              <StepComp flow={flow} />
            </StepActionsSlot.Provider>
          </div>
        </div>
        <AgentPanel step={flow.step} stepLabel={FLOW_STEPS[flow.step]} campaign={campaign} />
      </div>
    </div>
  )
}
