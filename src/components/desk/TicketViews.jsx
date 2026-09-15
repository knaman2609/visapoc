import { ChevronLeft, ChevronRight, Pencil, UserPlus, WandSparkles } from 'lucide-react'
import { CATEGORY_BY_ID, LABEL_BY_ID, STAGES } from '../../data/support.js'
import { ageLabel, clock, dayLabel, lastMins, stampLabel } from '../../state/useSupport.js'
import { Avatar, LabelChip, PriorityIcon, SlaBadge, StageBadge } from './DeskBits.jsx'
import styles from './TicketViews.module.css'

/**
 * The three ways a desk lays its tickets out — List, Table and Kanban — each
 * drawn after the Desk view of the same name. All three open a ticket through
 * `onOpen`, which marks it read on the way, the way clicking a mail does.
 */

/**
 * A modified click means "open this somewhere else". The link gets it natively
 * from its href; the row must then stay out of the way, or the current tab would
 * navigate too.
 */
const newTab = (e) => e.metaKey || e.ctrlKey || e.shiftKey || e.altKey

/* ── List ───────────────────────────────────────────────────────────── */

function DraftChip({ ticket, drafts }) {
  if (drafts[ticket.id]?.trim()) {
    return <span className={`${styles.chip} ${styles.chipDraft}`}><Pencil size={10} strokeWidth={2.25} aria-hidden="true" />Draft</span>
  }
  if (ticket.aiDraft) {
    return <span className={`${styles.chip} ${styles.chipAi}`}><WandSparkles size={10} strokeWidth={2.25} aria-hidden="true" />AI draft</span>
  }
  return null
}

export function ListView({
  rows, total, from, pageSize, onPage, selected, onToggle, onToggleMany, onPreset, onOpen, drafts, empty,
}) {
  const pageIds = rows.map((t) => t.id)
  const picked = pageIds.filter((id) => selected.has(id)).length
  const allOn = rows.length > 0 && picked === rows.length

  return (
    <div className={styles.list}>
      <div className={styles.listBar}>
        <div className={styles.selectGroup}>
          <input
            type="checkbox"
            className={styles.box}
            checked={allOn}
            ref={(el) => { if (el) el.indeterminate = picked > 0 && !allOn }}
            onChange={() => onToggleMany(pageIds, !allOn)}
            aria-label="Select all on this page"
          />
          <select
            className={styles.preset}
            value=""
            onChange={(e) => onPreset(e.target.value)}
            aria-label="Select tickets"
          >
            <option value="" disabled>{selected.size ? `${selected.size} selected` : 'Select'}</option>
            <option value="all">All</option>
            <option value="none">None</option>
            <option value="read">Read</option>
            <option value="unread">Unread</option>
          </select>
        </div>

        <div className={styles.range}>
          <span>{total === 0 ? '0' : `${from + 1}–${from + rows.length}`} of {total}</span>
          <button type="button" className={styles.roundBtn} disabled={from === 0} onClick={() => onPage(-1)} aria-label="Previous page">
            <ChevronLeft size={14} strokeWidth={2} aria-hidden="true" />
          </button>
          <button type="button" className={styles.roundBtn} disabled={from + pageSize >= total} onClick={() => onPage(1)} aria-label="Next page">
            <ChevronRight size={14} strokeWidth={2} aria-hidden="true" />
          </button>
        </div>
      </div>

      <div className={styles.listScroll}>
        <div className={`${styles.listHead} ${styles.listGrid}`} aria-hidden="true">
          <div />
          <div>Priority</div>
          <div>Subject</div>
          <div>Emails</div>
          <div>Draft</div>
          <div>Sender</div>
          <div>Status</div>
          <div>Assignee</div>
          <div>Age</div>
          <div>Latest email</div>
        </div>

        {rows.length === 0 && <div className={styles.empty}>{empty}</div>}

        {rows.map((t) => {
          const count = t.messages.filter((m) => m.from === 'customer' || m.from === 'agent').length
          const last = lastMins(t)
          return (
            <div
              key={t.id}
              className={`${styles.row} ${styles.listGrid} ${t.unread ? styles.unread : ''} ${selected.has(t.id) ? styles.picked : ''}`}
              onClick={(e) => { if (!newTab(e)) onOpen(t.id) }}
            >
              <div onClick={(e) => e.stopPropagation()}>
                <input
                  type="checkbox"
                  className={styles.box}
                  checked={selected.has(t.id)}
                  onChange={() => onToggle(t.id)}
                  aria-label={`Select ${t.id}`}
                />
              </div>
              <div><PriorityIcon priority={t.priority} /></div>
              <div className={styles.subject}>
                <span className={styles.xid}>{t.id}</span>
                <a
                  href={`/pm/support/${t.id}`}
                  className={styles.title}
                  onClick={(e) => { e.stopPropagation(); if (newTab(e)) return; e.preventDefault(); onOpen(t.id) }}
                >
                  {t.subject}
                </a>
                <span className={styles.cat}>{CATEGORY_BY_ID[t.category].label}</span>
              </div>
              <div><span className={styles.count}>{count}</span></div>
              <div><DraftChip ticket={t} drafts={drafts} /></div>
              <div className={styles.sender}>
                <span className={styles.senderDot} aria-hidden="true" />
                <span className={styles.senderName}>{t.reporter.name}</span>
                <span className={styles.senderMail}>&lt;{t.reporter.email}&gt;</span>
              </div>
              <div className={styles.cellClip}><StageBadge status={t.status} /></div>
              <div>
                {t.assignee
                  ? <Avatar name={t.assigneeName} />
                  : <span className={styles.nobody} title="Unassigned"><UserPlus size={11} strokeWidth={2} aria-hidden="true" /></span>}
              </div>
              <div className={styles.mono}>{ageLabel(t.createdMins)}</div>
              <div className={styles.latest}>
                <span>{dayLabel(last)}</span>
                <span className={styles.latestTime}>{clock(last)}</span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

/* ── Table ──────────────────────────────────────────────────────────── */

export function TableView({ rows, onOpen, empty }) {
  return (
    <div className={styles.tableScroll}>
      <table className={styles.table}>
        <thead>
          <tr>
            <th>Ticket</th>
            <th>Created at</th>
            <th>Age</th>
            <th>Assignee</th>
            <th>Priority</th>
            <th>Stage</th>
            <th>Labels</th>
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 && (
            <tr><td colSpan={7} className={styles.empty}>{empty}</td></tr>
          )}
          {rows.map((t) => (
            <tr key={t.id} className={t.unread ? styles.unread : ''} onClick={(e) => { if (!newTab(e)) onOpen(t.id) }}>
              <td className={styles.tdSubject}>
                <span className={styles.xid}>{t.id}</span>
                <a
                  href={`/pm/support/${t.id}`}
                  className={styles.title}
                  onClick={(e) => { e.stopPropagation(); if (newTab(e)) return; e.preventDefault(); onOpen(t.id) }}
                >
                  {t.subject}
                </a>
              </td>
              <td className={styles.nowrap}>{stampLabel(t.createdMins)}</td>
              <td className={styles.mono}>{ageLabel(t.createdMins)}</td>
              <td className={styles.nowrap}>
                {t.assignee
                  ? <span className={styles.person}><Avatar name={t.assigneeName} size="xs" />{t.assigneeName}</span>
                  : <span className={styles.muted}>Unassigned</span>}
              </td>
              <td><PriorityIcon priority={t.priority} withLabel /></td>
              <td><StageBadge status={t.status} /></td>
              <td>
                <span className={styles.labels}>
                  {t.labels.length === 0 && <span className={styles.muted}>—</span>}
                  {t.labels.map((id) => <LabelChip key={id} label={LABEL_BY_ID[id]} />)}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

/* ── Kanban ─────────────────────────────────────────────────────────── */

// Cards per column before the rest are summarised. A column of a hundred cards
// is a list, and the list view already exists.
const COLUMN_CAP = 30

export function KanbanView({ rows, onOpen }) {
  return (
    <div className={styles.board}>
      {STAGES.map((s) => {
        const cards = rows.filter((t) => t.status === s.id)
        return (
          <section key={s.id} className={styles.column} aria-label={`${s.label}, ${cards.length} tickets`}>
            <div className={styles.columnHead}>
              <span className={styles.columnName}>{s.label}</span>
              <span className={styles.columnCount}>{cards.length}</span>
            </div>
            <div className={styles.columnBody}>
              {cards.slice(0, COLUMN_CAP).map((t) => (
                <button
                  key={t.id}
                  type="button"
                  className={`${styles.card} ${styles[`bar_${s.kind}`]}`}
                  onClick={(e) => { if (!newTab(e)) onOpen(t.id) }}
                >
                  <span className={styles.cardTop}>
                    <span className={styles.xid}>{t.id}</span>
                    <PriorityIcon priority={t.priority} />
                  </span>
                  <span className={`${styles.cardTitle} ${t.unread ? styles.cardUnread : ''}`}>{t.subject}</span>
                  <span className={styles.cardMeta}>
                    <SlaBadge ticket={t} />
                    {t.tags[0] && <span className={styles.tag}>{t.tags[0]}</span>}
                    {t.tags.length > 1 && <span className={styles.more}>+{t.tags.length - 1}</span>}
                  </span>
                  <span className={styles.cardFoot}>
                    <span className={styles.cardWho}>{t.reporter.name}</span>
                    {t.assignee
                      ? <Avatar name={t.assigneeName} size="xs" />
                      : <span className={styles.nobodySm} title="Unassigned"><UserPlus size={10} strokeWidth={2} aria-hidden="true" /></span>}
                  </span>
                </button>
              ))}
              {cards.length > COLUMN_CAP && (
                <div className={styles.overflow}>+{cards.length - COLUMN_CAP} more in this stage</div>
              )}
              {cards.length === 0 && <div className={styles.columnEmpty}>No tickets</div>}
            </div>
          </section>
        )
      })}
    </div>
  )
}
