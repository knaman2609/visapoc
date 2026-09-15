import { useNavigate, useParams } from 'react-router-dom'
import {
  ArrowDown, ArrowRight, Bell, Clock, Mail, MessageCircle, MessageSquare, PhoneCall, Play,
} from 'lucide-react'
import { STEP_KINDS, WORKFLOWS, WORKFLOW_BY_ID } from '../../data/workflows.js'
import styles from './Workflows.module.css'

const STEP_ICON = {
  play: Play,
  bell: Bell,
  mail: Mail,
  message: MessageSquare,
  chat: MessageCircle,
  phone: PhoneCall,
  clock: Clock,
}

/**
 * Workflow details.
 *
 * The sidebar names each playbook; this page opens the one you picked and
 * shows it as a journey — the trigger that lets a cohort in, the steps the
 * agent runs, and the counters each step is expected to move.
 */
export default function Workflows() {
  const { id } = useParams()
  const navigate = useNavigate()
  const workflow = id ? WORKFLOW_BY_ID[id] : null

  if (!workflow) {
    return (
      <div className={styles.wrap}>
        <div className={styles.head}>
          <div className={styles.kick}>Growth</div>
          <h1 className={styles.h1}>Workflows</h1>
          <div className={styles.sub}>
            Reusable playbooks the agent runs against the book. Pick one to see the
            trigger, the steps and the counters each step is expected to move.
          </div>
        </div>

        <div className={styles.grid}>
          {WORKFLOWS.map((w) => (
            <button
              key={w.id}
              type="button"
              className={styles.card}
              onClick={() => navigate(`/pm/workflows/${w.id}`)}
            >
              <div className={styles.cardHead}>
                <span className={styles.cardLabel}>{w.label}</span>
                <ArrowRight size={14} strokeWidth={2} aria-hidden="true" />
              </div>
              <div className={styles.cardSub}>{w.tagline}</div>
              <div className={styles.cardAudience}>{w.audience}</div>
            </button>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className={styles.wrap}>
      <div className={styles.head}>
        <div className={styles.kick}>Growth · Workflow</div>
        <h1 className={styles.h1}>{workflow.label}</h1>
        <div className={styles.sub}>{workflow.tagline}</div>
      </div>

      <div className={styles.meta}>
        <div className={styles.metaItem}>
          <div className={styles.metaKick}>Trigger</div>
          <div className={styles.metaBody}>{workflow.trigger}</div>
        </div>
        <div className={styles.metaItem}>
          <div className={styles.metaKick}>Success metric</div>
          <div className={styles.metaBody}>{workflow.kpi}</div>
        </div>
        <div className={styles.metaItem}>
          <div className={styles.metaKick}>Live opportunity</div>
          <div className={styles.metaBody}>{workflow.example}</div>
        </div>
      </div>

      <div className={styles.journey}>
        {workflow.steps.map((s, i) => {
          const kind = STEP_KINDS[s.kind]
          const Icon = STEP_ICON[kind?.icon] || Play
          const isTrigger = s.kind === 'trigger'
          return (
            <div key={i}>
              <div className={`${styles.step} ${isTrigger ? styles.stepTrigger : ''}`}>
                <span className={styles.stepIcon} aria-hidden="true">
                  <Icon size={18} strokeWidth={1.75} />
                </span>
                <div className={styles.stepBody}>
                  <div className={styles.stepTag}>{kind?.tag || s.kind.toUpperCase()}</div>
                  <div className={styles.stepLabel}>{s.label}</div>
                  <div className={styles.stepText}>{s.body}</div>
                  {s.metrics?.length > 0 && (
                    <div className={styles.metrics}>
                      {s.metrics.map((m, mi) => (
                        <span key={mi} className={styles.metric}>
                          <b>{m.v}</b> {m.k}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              {i < workflow.steps.length - 1 && (
                <div className={styles.connector} aria-hidden="true">
                  <ArrowDown size={14} strokeWidth={1.75} />
                </div>
              )}
            </div>
          )
        })}
      </div>

      <div className={styles.foot}>
        <button
          type="button"
          className={styles.solid}
          onClick={() => navigate('/pm/flow/0')}
        >
          Launch as campaign
        </button>
        <button
          type="button"
          className={styles.ghost}
          onClick={() => navigate('/pm/workflows')}
        >
          All workflows
        </button>
      </div>
    </div>
  )
}
