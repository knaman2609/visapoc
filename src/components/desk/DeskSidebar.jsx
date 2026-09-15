import { useState } from 'react'
import {
  Ban, ChevronLeft, ChevronRight, Hash, Inbox, Mails, Pencil, Send, Star, Tag, Ticket,
} from 'lucide-react'
import { DESK_ICON } from './deskIcons.js'
import { DESKS, LABELS, LABEL_BY_ID } from '../../data/support.js'
import { FOLDERS, FOLDER_BY_ID } from '../../state/useSupport.js'
import { PoweredBy, SourceBadge } from './DeskBits.jsx'
import styles from './DeskSidebar.module.css'

/**
 * The desk rail: every desk, its mailbox folders, and the labels.
 *
 * Collapsed by default, the way the console's own sidebar keeps its children
 * shut: a desk is one row until its chevron is opened, and clicking the name
 * only selects it. A collapsed desk that is selected still says which folder
 * you are in, so closing the tree never hides where you are. Labels are one
 * shared section at the foot, shut until asked for.
 *
 * A desk with something unread in its inbox is set bold, the way Desk marks
 * activity; there are no count badges, because Desk has none.
 */

const FOLDER_ICON = { inbox: Inbox, all: Mails, starred: Star, spam: Ban, drafts: Pencil, sent: Send }

const ROWS = [{ id: 'all', name: 'All tickets', source: null }, ...DESKS]

export default function DeskSidebar({
  desk, folder, label, unreadDesks, allUnread, collapsed, onCollapse, onDesk, onFolder, onLabel,
}) {
  // deskId -> open. Nothing is open until somebody opens it.
  const [opened, setOpened] = useState({})
  const [labelsOpen, setLabelsOpen] = useState(false)

  // Folded, the rail is a strip of icons rather than a blank edge: every desk is
  // still one click away, unread still shows, and the folder you are in is
  // still lit. Picking a desk from here opens the rail on it.
  if (collapsed) {
    const where = label ? null : folder
    return (
      <nav className={styles.rail} aria-label="Desks">
        <button type="button" className={styles.stripBtn} onClick={() => onCollapse(false)} aria-label="Open desks" title="Open desks">
          <ChevronRight size={15} strokeWidth={2} aria-hidden="true" />
        </button>

        <div className={styles.stripGroup}>
          {ROWS.map((d) => {
            const Icon = DESK_ICON[d.id]
            const on = desk === d.id
            const unread = d.id === 'all' ? allUnread : unreadDesks.has(d.id)
            return (
              <button
                key={d.id}
                type="button"
                className={`${styles.stripBtn} ${on ? styles.stripOn : ''}`}
                aria-current={on ? 'page' : undefined}
                aria-label={`${d.name}${d.source ? ` · ${d.source}` : ''}${unread ? ', unread' : ''}`}
                title={d.source ? `${d.name} · ${d.source}` : d.name}
                onClick={() => onDesk(d.id)}
              >
                <Icon size={15} strokeWidth={1.9} aria-hidden="true" />
                {unread && <span className={styles.stripDot} aria-hidden="true" />}
              </button>
            )
          })}
        </div>

        <div className={styles.stripGroup}>
          {FOLDERS.map((f) => {
            const FIcon = FOLDER_ICON[f.id]
            const on = where === f.id
            return (
              <button
                key={f.id}
                type="button"
                className={`${styles.stripBtn} ${on ? styles.stripOn : ''}`}
                aria-current={on ? 'page' : undefined}
                aria-label={f.label}
                title={f.label}
                onClick={() => onFolder(f.id)}
              >
                <FIcon size={14} strokeWidth={1.9} aria-hidden="true" />
              </button>
            )
          })}
        </div>

        <span className={styles.stripMark} title="Powered by Xyne" role="img" aria-label="Powered by Xyne">
          <svg width="18" height="15" viewBox="0 0 30 24" aria-hidden="true">
            <path className={styles.markPath} d="M18.4043 11.6846L29.3629 23.3859H21.8835L14.6562 15.7012L7.46258 23.3859H0L10.9418 11.6846L0.537845 0.580913H8.01723L14.6562 7.71784L21.3289 0.580913H28.8082L18.4043 11.6846Z" />
          </svg>
        </span>
      </nav>
    )
  }

  const toggle = (id) => setOpened((prev) => ({ ...prev, [id]: !prev[id] }))
  const where = label ? LABEL_BY_ID[label].name : FOLDER_BY_ID[folder].label

  return (
    <nav className={styles.side} aria-label="Desks">
      <div className={styles.head}>
        <span className={styles.title}>Desks</span>
        <button type="button" className={styles.iconBtn} onClick={() => onCollapse(true)} aria-label="Collapse desks" title="Collapse desks">
          <ChevronLeft size={15} strokeWidth={2} aria-hidden="true" />
        </button>
      </div>

      <div className={styles.scroll}>
        {ROWS.map((d, i) => {
          const selected = desk === d.id
          const open = Boolean(opened[d.id])
          const unread = d.id === 'all' ? allUnread : unreadDesks.has(d.id)
          const Icon = d.id === 'all' ? Ticket : Hash
          return (
            <div key={d.id}>
              {i === 1 && <div className={styles.section}>Joined</div>}
              <div className={`${styles.row} ${selected ? styles.rowOn : ''}`}>
                <button
                  type="button"
                  className={styles.chevBtn}
                  aria-expanded={open}
                  aria-label={`${open ? 'Hide' : 'Show'} folders in ${d.name}`}
                  onClick={() => toggle(d.id)}
                >
                  <ChevronRight size={12} strokeWidth={2.25} className={`${styles.chev} ${open ? styles.chevOpen : ''}`} aria-hidden="true" />
                </button>
                <button
                  type="button"
                  className={styles.rowMain}
                  aria-current={selected ? 'page' : undefined}
                  onClick={() => onDesk(d.id)}
                >
                  <Icon size={14} strokeWidth={1.9} className={styles.rowIcon} aria-hidden="true" />
                  <span className={`${styles.name} ${unread ? styles.unread : ''}`}>{d.name}</span>
                  {selected && !open && <span className={styles.where}>{where}</span>}
                  {d.source && <SourceBadge source={d.source} />}
                </button>
              </div>

              {open && (
                <div className={styles.subtree}>
                  {FOLDERS.map((f) => {
                    const FIcon = FOLDER_ICON[f.id]
                    const on = selected && !label && folder === f.id
                    return (
                      <button
                        key={f.id}
                        type="button"
                        className={`${styles.folder} ${on ? styles.on : ''}`}
                        aria-current={on ? 'page' : undefined}
                        onClick={() => (selected ? onFolder(f.id) : onDesk(d.id, f.id))}
                      >
                        <FIcon size={13} strokeWidth={1.9} aria-hidden="true" />
                        <span>{f.label}</span>
                      </button>
                    )
                  })}
                </div>
              )}
            </div>
          )
        })}

        <div className={styles.labelsBlock}>
          <button
            type="button"
            className={styles.sectionBtn}
            aria-expanded={labelsOpen}
            onClick={() => setLabelsOpen((v) => !v)}
          >
            <ChevronRight size={12} strokeWidth={2.25} className={`${styles.chev} ${labelsOpen ? styles.chevOpen : ''}`} aria-hidden="true" />
            Labels
            {label && !labelsOpen && <span className={styles.where}>{LABEL_BY_ID[label].name}</span>}
          </button>
          {labelsOpen && (
            <div className={styles.subtree}>
              {LABELS.map((l) => {
                const on = label === l.id
                return (
                  <button
                    key={l.id}
                    type="button"
                    className={`${styles.folder} ${on ? styles.on : ''}`}
                    aria-current={on ? 'page' : undefined}
                    onClick={() => onLabel(on ? null : l.id)}
                  >
                    <Tag size={13} strokeWidth={1.9} fill={l.color} style={{ color: l.color }} aria-hidden="true" />
                    <span>{l.name}</span>
                  </button>
                )
              })}
            </div>
          )}
        </div>
      </div>

      <div className={styles.foot}>
        <PoweredBy />
      </div>
    </nav>
  )
}
