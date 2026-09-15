import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import {
  Archive, ArrowLeft, Ban, Check, ChevronDown, ChevronLeft, ChevronRight, Copy, Ellipsis, Inbox,
  ListCollapse, Mail, PanelRightOpen, Sparkles, Star, Tag, X,
} from 'lucide-react'
import ReplyComposer from '../../components/desk/ReplyComposer.jsx'
import TicketSidePanel from '../../components/desk/TicketSidePanel.jsx'
import {
  AiMark, Avatar, LabelChip, MenuItem, MenuLabel, Popover, PriorityIcon, StageIcon,
} from '../../components/desk/DeskBits.jsx'
import bits from '../../components/desk/DeskBits.module.css'
import { useIdentity } from '../../components/layout/useLayoutInfo.js'
import { findCustomer } from '../../data/customers.js'
import {
  AGENTS, CATEGORY_BY_ID, DESK_BY_ID, LABELS, LABEL_BY_ID, PRIORITIES, STAGES, STAGE_BY_ID, ticketById,
} from '../../data/support.js'
import { applicantById } from '../../state/useOnboarding.js'
import {
  authorOf, clock, dayLabel, duration, emailOf, fullStamp, neighbours, ownerName, relatedTickets,
  resolveTicket, resolveTickets, threadSummary, useSupportContext,
} from '../../state/useSupport.js'
import styles from './SupportTicket.module.css'

/**
 * One ticket, in Xyne Desk's thread view: the header with stage and actions,
 * the meta row, the conversation, the reply pill, and the side panel.
 */

const MAILBOX_CHIP = { inbox: 'Inbox', spam: 'Spam', archived: 'Archived' }
const clip = (text, n) => (text.length > n ? `${text.slice(0, n - 1).trimEnd()}…` : text)

export default function SupportTicket() {
  const { id } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  // Where the list was when this ticket was opened (desk, folder, view). A deep
  // link has none, and goes back to the inbox.
  const back = location.state?.back ?? '/pm/support'
  const ctx = useSupportContext()
  const { setRead } = ctx
  const { userName } = useIdentity()

  const tickets = useMemo(() => resolveTickets(ctx.edits), [ctx.edits])
  const base = ticketById(id)
  const ticket = base ? resolveTicket(base, ctx.edits) : null

  const applicantId = ticket?.reporter.applicantId ?? null
  const applicant = applicantId ? applicantById(applicantId) : null

  const [panelOpen, setPanelOpen] = useState(true)
  const [menu, setMenu] = useState(null)
  const closeMenu = useCallback(() => setMenu(null), [])
  const [summaryFor, setSummaryFor] = useState(null)
  // Which messages are expanded, remembered per ticket so moving on resets it
  // without an effect.
  const [expanded, setExpanded] = useState({ ticketId: null, ids: [] })

  const { prev, next } = ticket ? neighbours(ticket, tickets) : { prev: null, next: null }
  const prevId = prev?.id ?? null
  const nextId = next?.id ?? null

  const go = useCallback((target) => {
    setRead([target], true)
    setMenu(null)
    // Carry the way back along, so J/K through ten tickets still returns to the list.
    navigate(`/pm/support/${target}`, { state: location.state })
  }, [navigate, setRead, location.state])

  // J and K move through the mailbox, as in Desk. Typing in a field is left alone.
  useEffect(() => {
    const onKey = (e) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return
      const tag = e.target?.tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || e.target?.isContentEditable) return
      if (e.key === 'j' && nextId) go(nextId)
      if (e.key === 'k' && prevId) go(prevId)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [prevId, nextId, go])

  if (!ticket) {
    return (
      <div className={`${bits.theme} ${styles.missing}`}>
        <div className={styles.missBox}>
          <Inbox size={28} strokeWidth={1.75} aria-hidden="true" />
          <h1 className={styles.missTitle}>Ticket not found</h1>
          <p>Nothing is filed under &ldquo;{id}&rdquo;.</p>
          <Link to="/pm/support" className={styles.missLink}>← Back to tickets</Link>
        </div>
      </div>
    )
  }

  const by = userName
  const desk = DESK_BY_ID[ticket.desk]
  const customer = ticket.reporter.customerId ? findCustomer(ticket.reporter.customerId) : null
  const known = applicant?.stage?.blockers.find((b) => b.reason === applicant.blocker) ?? null
  const related = relatedTickets(ticket, tickets)

  const thread = ticket.messages.filter((m) => m.from === 'customer' || m.from === 'agent')
  const lastId = thread[thread.length - 1]?.id
  const openIds = expanded.ticketId === ticket.id ? expanded.ids : [lastId]
  const setOpenIds = (ids) => setExpanded({ ticketId: ticket.id, ids })
  const toggleMsg = (mid) => setOpenIds(openIds.includes(mid) ? openIds.filter((x) => x !== mid) : [...openIds, mid])
  const allOpen = thread.every((m) => openIds.includes(m.id))

  const summary = summaryFor === ticket.id ? threadSummary(ticket, { applicant, known }) : null
  const toggleLabel = (lid) => ctx.setLabels(
    ticket.id,
    ticket.labels.includes(lid) ? ticket.labels.filter((x) => x !== lid) : [...ticket.labels, lid],
  )

  return (
    <div className={`${bits.theme} ${styles.page} ${panelOpen ? '' : styles.solo}`}>
      <section className={styles.main} aria-label={`Ticket ${ticket.id}`}>
        <header className={styles.head}>
          <div className={styles.row1}>
            <Link to={back} className={styles.iconBtn} aria-label="Back to tickets">
              <ArrowLeft size={16} strokeWidth={2} aria-hidden="true" />
            </Link>
            <span className={styles.xid}>{ticket.id}</span>
            <button
              type="button"
              className={`${styles.iconBtn} ${ticket.starred ? styles.starOn : ''}`}
              aria-pressed={ticket.starred}
              aria-label={ticket.starred ? 'Unstar' : 'Star'}
              onClick={() => ctx.setStarred(ticket.id, !ticket.starred)}
            >
              <Star size={15} strokeWidth={2} fill={ticket.starred ? 'currentColor' : 'none'} aria-hidden="true" />
            </button>
            <h1 className={styles.title}>{ticket.subject}</h1>
            {ticket.edited && <span className={styles.edited}>Edited</span>}

            <div className={styles.row1Right}>
              <button type="button" className={styles.iconBtn} disabled={!prevId} onClick={() => go(prevId)} aria-label="Previous ticket" title="Previous (K)">
                <ChevronLeft size={16} strokeWidth={2} aria-hidden="true" />
              </button>
              <button type="button" className={styles.iconBtn} disabled={!nextId} onClick={() => go(nextId)} aria-label="Next ticket" title="Next (J)">
                <ChevronRight size={16} strokeWidth={2} aria-hidden="true" />
              </button>

              <Popover
                open={menu === 'stage'}
                onClose={closeMenu}
                align="right"
                trigger={(
                  <button type="button" className={styles.stagePill} aria-expanded={menu === 'stage'} onClick={() => setMenu(menu === 'stage' ? null : 'stage')}>
                    <StageIcon status={ticket.status} />
                    {STAGE_BY_ID[ticket.status].label}
                    <ChevronDown size={13} strokeWidth={2} aria-hidden="true" />
                  </button>
                )}
              >
                <MenuLabel>Move to stage</MenuLabel>
                {STAGES.map((s) => (
                  <MenuItem key={s.id} onClick={() => { if (s.id !== ticket.status) ctx.setStatus(ticket.id, s.id, by, ticket.status); closeMenu() }}>
                    <StageIcon status={s.id} />{s.label}
                    {s.id === ticket.status && <Check size={13} strokeWidth={2.5} className={styles.tick} aria-hidden="true" />}
                  </MenuItem>
                ))}
              </Popover>

              <Popover
                open={menu === 'more' || menu === 'labels'}
                onClose={closeMenu}
                align="right"
                width={220}
                trigger={(
                  <button type="button" className={styles.iconBtn} aria-label="More actions" aria-expanded={menu === 'more' || menu === 'labels'} onClick={() => setMenu(menu ? null : 'more')}>
                    <Ellipsis size={16} strokeWidth={2} aria-hidden="true" />
                  </button>
                )}
              >
                {menu === 'labels' ? (
                  <>
                    <MenuLabel>Labels</MenuLabel>
                    {LABELS.map((l) => (
                      <MenuItem key={l.id} checked={ticket.labels.includes(l.id)} onClick={() => toggleLabel(l.id)}>
                        <span className={styles.dot} style={{ background: l.color }} />{l.name}
                      </MenuItem>
                    ))}
                  </>
                ) : (
                  <>
                    <MenuItem icon={Tag} onClick={() => setMenu('labels')}>Add label</MenuItem>
                    {!panelOpen && <MenuItem icon={PanelRightOpen} onClick={() => { setPanelOpen(true); closeMenu() }}>Open thread</MenuItem>}
                    <MenuItem icon={ListCollapse} onClick={() => { setOpenIds(allOpen ? [lastId] : thread.map((m) => m.id)); closeMenu() }}>
                      {allOpen ? 'Collapse all' : 'Expand all'}
                    </MenuItem>
                    <MenuItem icon={Sparkles} onClick={() => { setSummaryFor(ticket.id); closeMenu() }}>Summarize thread</MenuItem>
                    <MenuItem icon={Copy} onClick={() => { navigator.clipboard?.writeText(window.location.href); closeMenu() }}>Copy link</MenuItem>
                    <MenuItem icon={Mail} onClick={() => { setRead([ticket.id], false); navigate(back) }}>Mark as unread</MenuItem>
                    {ticket.mailbox !== 'inbox' && (
                      <MenuItem icon={Inbox} onClick={() => { ctx.setMailbox(ticket.id, 'inbox', by); closeMenu() }}>Move to Inbox</MenuItem>
                    )}
                    {ticket.mailbox !== 'spam' && (
                      <MenuItem icon={Ban} onClick={() => { ctx.setMailbox(ticket.id, 'spam', by); closeMenu() }}>Report spam</MenuItem>
                    )}
                    {ticket.edited && <MenuItem onClick={() => { ctx.resetTicket(ticket.id); closeMenu() }}>Revert session changes</MenuItem>}
                    {ticket.mailbox === 'inbox' && (
                      <MenuItem icon={Archive} danger onClick={() => { ctx.setMailbox(ticket.id, 'archived', by); closeMenu() }}>Archive ticket</MenuItem>
                    )}
                  </>
                )}
              </Popover>
            </div>
          </div>

          <div className={styles.meta}>
            <div className={styles.metaItem}>
              <span className={styles.metaK}>Priority</span>
              <Popover
                open={menu === 'priority'}
                onClose={closeMenu}
                trigger={(
                  <button type="button" className={styles.metaBtn} onClick={() => setMenu(menu === 'priority' ? null : 'priority')}>
                    <PriorityIcon priority={ticket.priority} withLabel />
                  </button>
                )}
              >
                {PRIORITIES.map((p) => (
                  <MenuItem key={p.id} onClick={() => { if (p.id !== ticket.priority) ctx.setPriority(ticket.id, p.id, by); closeMenu() }}>
                    <PriorityIcon priority={p.id} withLabel />
                    <span className={styles.menuHint}>{duration(p.responseMins)} response</span>
                  </MenuItem>
                ))}
              </Popover>
            </div>

            <div className={styles.metaItem}>
              <span className={styles.metaK}>Assignee</span>
              <Popover
                open={menu === 'assignee'}
                onClose={closeMenu}
                trigger={(
                  <button type="button" className={styles.metaBtn} onClick={() => setMenu(menu === 'assignee' ? null : 'assignee')}>
                    {ticket.assignee && <Avatar name={ownerName(ticket)} size="xs" />}
                    {ownerName(ticket)}
                  </button>
                )}
              >
                <MenuItem onClick={() => { if (ticket.assignee) ctx.assign(ticket.id, null, by); closeMenu() }}>Unassigned</MenuItem>
                {AGENTS.map((a) => (
                  <MenuItem key={a.id} onClick={() => { if (a.id !== ticket.assignee) ctx.assign(ticket.id, a.id, by); closeMenu() }}>
                    <Avatar name={a.name} size="xs" />{a.name}
                  </MenuItem>
                ))}
              </Popover>
            </div>

            <div className={styles.metaItem}>
              <span className={styles.metaK}>Type</span>
              <span className={`${styles.chip} ${styles.typeChip}`}>{CATEGORY_BY_ID[ticket.category].label}</span>
            </div>

            <div className={styles.metaItem}>
              <span className={styles.metaK}>Requester</span>
              <span className={styles.chip}><Mail size={11} strokeWidth={2} aria-hidden="true" />{ticket.reporter.name}</span>
            </div>

            <div className={styles.metaItem}>
              <span className={styles.metaK}>View</span>
              <span className={styles.chip}>
                <span className={`${styles.dot} ${styles[`dot_${ticket.mailbox}`]}`} />
                {MAILBOX_CHIP[ticket.mailbox]}
              </span>
              {ticket.labels.map((lid) => (
                <LabelChip key={lid} label={LABEL_BY_ID[lid]} onRemove={() => toggleLabel(lid)} />
              ))}
            </div>
          </div>

          <div className={styles.tags}>
            <span className={styles.metaK}>Auto-tagged</span>
            {ticket.tags.map((t) => <span key={t} className={styles.tagChip}>{t}</span>)}
          </div>
        </header>

        <div className={styles.scroll}>
          {summary && (
            <div className={styles.summary}>
              <div className={styles.summaryInner}>
                <div className={styles.summaryHead}>
                  <AiMark />
                  AI Summary
                  <button type="button" className={styles.iconBtn} onClick={() => setSummaryFor(null)} aria-label="Close summary">
                    <X size={14} strokeWidth={2} aria-hidden="true" />
                  </button>
                </div>
                <p className={styles.summaryText}>{summary.text}</p>
                <ul className={styles.summaryList}>
                  {summary.bullets.map((b) => <li key={b}>{b}</li>)}
                </ul>
                <div className={styles.summaryFoot}>AI-generated · may not be fully accurate</div>
              </div>
            </div>
          )}

          {ticket.mailbox === 'spam' && (
            <div className={styles.spamNote}>This ticket is in Spam. It is left out of every queue and metric.</div>
          )}

          <ol className={styles.thread}>
            {thread.map((m) => {
              const isOpen = m.id === lastId || openIds.includes(m.id)
              const who = authorOf(m, ticket)
              return (
                <li key={m.id} className={styles.msg}>
                  <button
                    type="button"
                    className={styles.msgHead}
                    aria-expanded={isOpen}
                    onClick={() => { if (m.id !== lastId) toggleMsg(m.id) }}
                  >
                    <Avatar name={who} size="md" />
                    <span className={styles.msgWho}>
                      <span className={styles.msgLine}>
                        <span className={styles.msgName}>{who}</span>
                        <span className={styles.msgMail}>&lt;{emailOf(m, ticket)}&gt;</span>
                      </span>
                      {isOpen
                        ? <span className={styles.msgTo}>to {m.from === 'customer' ? desk.address : ticket.reporter.email}</span>
                        : <span className={styles.msgPreview}>{clip(m.body, 140)}</span>}
                    </span>
                    <span className={styles.msgWhen} title={fullStamp(m.mins)}>
                      {m.session ? 'Just now' : `${dayLabel(m.mins)}, ${clock(m.mins)}`}
                    </span>
                  </button>
                  {isOpen && <div className={styles.msgBody}>{m.body}</div>}
                </li>
              )
            })}
          </ol>
        </div>

        <div className={styles.dock}>
          <ReplyComposer
            key={ticket.id}
            ticket={ticket}
            desk={desk}
            draft={ctx.drafts[ticket.id] ?? ''}
            onDraft={(text) => ctx.setDraft(ticket.id, text)}
            onDiscard={() => ctx.clearDraft(ticket.id)}
            onSend={(body) => ctx.reply(ticket.id, { body, author: by, previous: ticket.status, mailbox: ticket.mailbox })}
            onDismissAi={() => ctx.dismissAiDraft(ticket.id)}
          />
        </div>
      </section>

      {panelOpen && (
        <TicketSidePanel
          key={ticket.id}
          ticket={ticket}
          desk={desk}
          applicant={applicant}
          known={known}
          customer={customer}
          related={related}
          onOpen={go}
          onNote={(body) => ctx.note(ticket.id, { body, author: by })}
          onClose={() => setPanelOpen(false)}
        />
      )}
    </div>
  )
}
