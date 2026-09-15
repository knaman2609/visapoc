import {
  Check, CircleCheck, CircleDashed, CircleDot, CirclePause, Sparkles, Timer, TriangleAlert, X,
} from 'lucide-react'
import { PRIORITY_BY_ID, STAGE_BY_ID } from '../../data/support.js'
import { avatarColor, initials, slaFor } from '../../state/useSupport.js'
import { useDismiss } from './useDismiss.js'
import styles from './DeskBits.module.css'

/**
 * The small pieces every desk surface is built from, drawn the way Xyne Desk
 * draws them: the three-bar priority mark, the stage icon, the initial avatar,
 * the source badge, the SLA timer badge and the popover menu.
 */

const STAGE_ICON = { todo: CircleDashed, started: CircleDot, paused: CirclePause, completed: CircleCheck }
const BARS = { low: 1, medium: 2, high: 3 }

/** Desk's priority mark: one to three bars, or a warning triangle for Critical. */
export function PriorityIcon({ priority, withLabel = false }) {
  const label = PRIORITY_BY_ID[priority]?.label ?? 'Low'
  const lit = BARS[priority] ?? 1
  return (
    <span className={styles.priority} title={`${label} priority`}>
      {priority === 'critical' ? (
        <TriangleAlert size={14} strokeWidth={2.25} className={styles.pCritical} aria-hidden="true" />
      ) : (
        <svg width="18" height="16" viewBox="0 0 18 16" className={styles[`p_${priority}`]} aria-hidden="true">
          {[6, 10, 14].map((h, i) => (
            <rect key={h} x={1 + i * 6} y={15 - h} width="4" height={h} rx="1" className={i < lit ? styles.barOn : styles.barOff} />
          ))}
        </svg>
      )}
      {withLabel ? <span>{label}</span> : <span className={styles.srOnly}>{label} priority</span>}
    </span>
  )
}

export function StageIcon({ status, size = 12 }) {
  const kind = STAGE_BY_ID[status]?.kind ?? 'todo'
  const Icon = STAGE_ICON[kind]
  return <Icon size={size} strokeWidth={2.25} className={styles[`k_${kind}`]} aria-hidden="true" />
}

export function StageBadge({ status }) {
  return (
    <span className={styles.stage}>
      <StageIcon status={status} />
      <span className={styles.stageText}>{STAGE_BY_ID[status]?.label ?? 'To Do'}</span>
    </span>
  )
}

export function Avatar({ name, size = 'sm' }) {
  return (
    <span className={`${styles.avatar} ${styles[size]}`} style={{ background: avatarColor(name) }} title={name} aria-hidden="true">
      {initials(name)}
    </span>
  )
}

export function SourceBadge({ source }) {
  return <span className={`${styles.source} ${styles[`s_${source}`] ?? ''}`}>{source}</span>
}

/** Timer badge: red overdue, orange under an hour, amber under four, grey otherwise. */
export function SlaBadge({ ticket }) {
  const sla = slaFor(ticket)
  if (sla.state === 'none') return null
  return (
    <span className={`${styles.sla} ${styles[`sla_${sla.state}`] ?? ''}`}>
      <Timer size={11} strokeWidth={2.25} aria-hidden="true" />
      {sla.label}
    </span>
  )
}

export function LabelChip({ label, onRemove }) {
  return (
    <span className={styles.labelChip}>
      <span className={styles.labelDot} style={{ background: label.color }} aria-hidden="true" />
      {label.name}
      {onRemove && (
        <button type="button" className={styles.chipX} onClick={onRemove} aria-label={`Remove label ${label.name}`}>
          <X size={10} strokeWidth={2.5} aria-hidden="true" />
        </button>
      )}
    </span>
  )
}

/** The red square with a sparkle Desk puts on everything the AI wrote. */
export function AiMark() {
  return (
    <span className={styles.aiMark} aria-hidden="true">
      <Sparkles size={11} strokeWidth={2.25} />
    </span>
  )
}

/** The attribution, kept small. The mark is Xyne's own logo file, copied from the product. */
export function PoweredBy({ compact = false }) {
  return (
    <div className={`${styles.powered} ${compact ? styles.poweredCompact : ''}`}>
      <span className={styles.poweredBy}>Powered by</span>
      <img src="/xyne/xyne.svg" alt="Xyne" className={styles.xyneLogo} />
    </div>
  )
}

/**
 * A trigger plus the menu it opens, dismissed on an outside click or Escape.
 *
 * `placement="up"` opens it above the trigger — for a trigger at the foot of a
 * scrolling box, where a menu opening downward would be clipped by the box.
 */
export function Popover({ open, onClose, trigger, children, align = 'left', placement = 'down', width }) {
  const ref = useDismiss(open, onClose)
  return (
    <div className={styles.popWrap} ref={ref}>
      {trigger}
      {open && (
        <div
          className={`${styles.pop} ${align === 'right' ? styles.popRight : ''} ${placement === 'up' ? styles.popUp : ''}`}
          style={width ? { width } : undefined}
          role="menu"
        >
          {children}
        </div>
      )}
    </div>
  )
}

export function MenuItem({ onClick, children, danger = false, checked, icon: Icon }) {
  const checkable = checked !== undefined
  return (
    <button
      type="button"
      role={checkable ? 'menuitemcheckbox' : 'menuitem'}
      aria-checked={checkable ? checked : undefined}
      className={`${styles.menuItem} ${danger ? styles.menuDanger : ''}`}
      onClick={onClick}
    >
      {checkable && (
        <span className={`${styles.check} ${checked ? styles.checkOn : ''}`} aria-hidden="true">
          {checked && <Check size={10} strokeWidth={3} />}
        </span>
      )}
      {Icon && <Icon size={14} strokeWidth={2} className={styles.menuIcon} aria-hidden="true" />}
      <span className={styles.menuText}>{children}</span>
    </button>
  )
}

export function MenuLabel({ children }) {
  return <div className={styles.menuLabel}>{children}</div>
}
