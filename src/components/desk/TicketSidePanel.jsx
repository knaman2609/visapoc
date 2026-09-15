import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowUp, FileText, GitBranch, MessageSquare, PanelRightClose } from 'lucide-react'
import { CATEGORY_BY_ID, STAGE_BY_ID } from '../../data/support.js'
import { inr } from '../../state/useOnboarding.js'
import {
  ago, authorOf, firstName, ownerName, slaFor, stampLabel,
} from '../../state/useSupport.js'
import { Avatar, PriorityIcon, StageBadge } from './DeskBits.jsx'
import styles from './TicketSidePanel.module.css'

/**
 * The ticket's side panel, with Desk's tabs: Messages (the team's own thread on
 * the ticket), Details (the ticket's fields), Files and Sub-tickets.
 *
 * Details is also where this console adds what Desk alone could not know: the
 * applicant's stuck onboarding file, or the cardholder's page in the RM queue,
 * with the fix the funnel already has on file for their blocker. That is the
 * reason the desk lives inside this console rather than beside it.
 *
 * Mount it keyed by ticket id, so a half-written team message never follows the
 * agent to the next ticket.
 */
export default function TicketSidePanel({
  ticket, desk, applicant, known, customer, related, onNote, onOpen, onClose,
}) {
  const [tab, setTab] = useState('details')
  const [text, setText] = useState('')

  const notes = ticket.messages.filter((m) => m.from === 'note')
  const activity = ticket.messages.filter((m) => m.from === 'system')
  const opening = ticket.messages.find((m) => m.from === 'customer')
  const firstReply = ticket.messages.find((m) => m.from === 'agent')
  const sla = slaFor(ticket)

  const send = () => {
    const body = text.trim()
    if (!body) return
    onNote(body)
    setText('')
  }

  const tabs = [
    { id: 'messages', label: 'Messages', icon: MessageSquare, count: notes.length },
    { id: 'details', label: 'Details' },
    { id: 'files', label: 'Files', icon: FileText, count: 0 },
    { id: 'subtickets', label: 'Sub-tickets', icon: GitBranch },
  ]

  return (
    <aside className={styles.panel} aria-label="Ticket thread">
      <div className={styles.tabs} role="tablist" aria-label="Thread panel">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={tab === t.id}
            className={`${styles.tab} ${tab === t.id ? styles.tabOn : ''}`}
            onClick={() => setTab(t.id)}
          >
            {t.icon && <t.icon size={13} strokeWidth={2} aria-hidden="true" />}
            {t.label}
            {t.count > 0 && <span className={styles.tabCount}>{t.count}</span>}
          </button>
        ))}
        <button type="button" className={`${styles.iconBtn} ${styles.close}`} onClick={onClose} aria-label="Close panel">
          <PanelRightClose size={15} strokeWidth={2} aria-hidden="true" />
        </button>
      </div>

      {tab === 'messages' && (
        <>
          <div className={styles.body}>
            <div className={styles.hint}>
              The team&rsquo;s thread on this ticket. {firstName(ticket)} never sees anything written here.
            </div>
            {notes.length === 0 ? (
              <div className={styles.empty}>
                <MessageSquare size={22} strokeWidth={1.75} aria-hidden="true" />
                No messages in this thread yet.
              </div>
            ) : (
              <div className={styles.notes}>
                {notes.map((n) => (
                  <div key={n.id} className={styles.note}>
                    <Avatar name={authorOf(n, ticket)} />
                    <div className={styles.noteBody}>
                      <div className={styles.noteHead}>
                        <span className={styles.noteName}>{authorOf(n, ticket)}</span>
                        <span className={styles.noteWhen}>{ago(n)}</span>
                      </div>
                      <div className={styles.noteText}>{n.body}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className={styles.noteBox}>
            <textarea
              className={styles.noteInput}
              rows={1}
              value={text}
              placeholder="Reply to this thread..."
              aria-label="Message the team on this ticket"
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() } }}
            />
            <button type="button" className={styles.noteSend} disabled={!text.trim()} onClick={send} aria-label="Send to thread">
              <ArrowUp size={14} strokeWidth={2.25} aria-hidden="true" />
            </button>
          </div>
        </>
      )}

      {tab === 'details' && (
        <div className={styles.body}>
          <div className={styles.section}>
            <div className={styles.sectHead}>Description</div>
            <p className={styles.description}>{opening?.body ?? ticket.subject}</p>
          </div>

          <div className={`${styles.section} ${styles.grid}`}>
            <Field k="Assignee">
              {ticket.assignee
                ? <><Avatar name={ownerName(ticket)} size="xs" />{ownerName(ticket)}</>
                : <span className={styles.muted}>Unassigned</span>}
            </Field>
            <Field k="Stage"><StageBadge status={ticket.status} /></Field>
            <Field k="Created at">{stampLabel(ticket.createdMins)}</Field>
            <Field k="Created by">{ticket.reporter.name}</Field>
            <Field k="Board">Customer Support</Field>
            <Field k="Priority"><PriorityIcon priority={ticket.priority} withLabel /></Field>
            <Field k="Ticket type">{CATEGORY_BY_ID[ticket.category].label}</Field>
            <Field k="Channel">#{desk.name}</Field>
            <Field k="Response SLA">
              {sla.state !== 'none'
                ? <span className={styles[`sla_${sla.state}`]}>{sla.label}</span>
                : firstReply ? `First responded ${stampLabel(firstReply.mins)}` : '—'}
            </Field>
            <Field k="User group">{ticket.userGroup}</Field>
            {ticket.csat && <Field k="CSAT">{ticket.csat}/5</Field>}
            <Field k="Generated tags" wide>
              {ticket.tags.map((tag) => <span key={tag} className={styles.tag}>{tag}</span>)}
            </Field>
          </div>

          {applicant && (
            <div className={styles.section}>
              <div className={styles.sectHead}>Onboarding file</div>
              <div className={styles.card}>
                <Row k="Stuck at" v={applicant.stage?.label ?? 'Completed'} />
                {applicant.blocker && <Row k="Blocker" v={applicant.blocker} />}
                <Row k="On this step" v={`${applicant.days} day${applicant.days === 1 ? '' : 's'}`} />
                <Row k="Value" v={`${inr(applicant.value)} first year`} />
                {known && (
                  <div className={styles.fix}>
                    <div className={styles.fixK}>Known fix · owner {known.owner}</div>
                    {known.action}
                    {known.owner === 'PM' && (
                      <div className={styles.fixPm}>
                        This one waits on a portfolio decision, not on the desk. A reply buys time;
                        the decision clears the ticket.
                      </div>
                    )}
                  </div>
                )}
                <Link to={`/pm/analytics/applicant/${applicant.id}`} className={styles.link}>
                  Open the application journey →
                </Link>
              </div>
            </div>
          )}

          {customer && (
            <div className={styles.section}>
              <div className={styles.sectHead}>Cardholder</div>
              <div className={styles.card}>
                <Row k="Card" v={customer.card} />
                <Row k="Segment" v={customer.segment} />
                <Row k="With us since" v={customer.since} />
                <div className={styles.fix}>
                  <div className={styles.fixK}>Open in the RM queue</div>
                  {customer.signalTitle}
                </div>
                <Link to={`/customers/${customer.id}`} className={styles.link}>Open the customer →</Link>
              </div>
            </div>
          )}

          <div className={styles.section}>
            <div className={styles.sectHead}>Related tickets</div>
            {related.length === 0 ? (
              <div className={styles.muted}>No other tickets from {firstName(ticket)}.</div>
            ) : (
              related.map((t) => (
                <Link
                  key={t.id}
                  to={`/pm/support/${t.id}`}
                  className={styles.related}
                  // Opened through the page, like every other way into a ticket, so it
                  // is marked read; a modified click still opens a new tab.
                  onClick={(e) => {
                    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return
                    e.preventDefault()
                    onOpen(t.id)
                  }}
                >
                  <span className={styles.relatedTitle}>{t.subject}</span>
                  <span className={styles.relatedMeta}>{t.id} · {STAGE_BY_ID[t.status].label}</span>
                </Link>
              ))
            )}
          </div>

          <div className={styles.section}>
            <div className={styles.sectHead}>Activity</div>
            {activity.length === 0 ? (
              <div className={styles.muted}>No changes yet.</div>
            ) : (
              <ul className={styles.activity}>
                {activity.map((a) => (
                  <li key={a.id}>
                    <span>{a.body}</span>
                    <span className={styles.actWhen}>{ago(a)}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}

      {tab === 'files' && (
        <div className={styles.body}>
          <div className={styles.empty}>
            <FileText size={22} strokeWidth={1.75} aria-hidden="true" />
            No files on this ticket.
          </div>
        </div>
      )}

      {tab === 'subtickets' && (
        <div className={styles.body}>
          <div className={styles.empty}>
            <GitBranch size={22} strokeWidth={1.75} aria-hidden="true" />
            No sub-tickets.
          </div>
        </div>
      )}
    </aside>
  )
}

function Field({ k, children, wide = false }) {
  return (
    <div className={`${styles.field} ${wide ? styles.wide : ''}`}>
      <span className={styles.fieldK}>{k}</span>
      <span className={styles.fieldV}>{children}</span>
    </div>
  )
}

function Row({ k, v }) {
  return (
    <div className={styles.cardRow}>
      <span className={styles.cardK}>{k}</span>
      <span className={styles.cardV}>{v}</span>
    </div>
  )
}
