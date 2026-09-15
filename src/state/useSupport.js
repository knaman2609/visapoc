/**
 * Desk selectors.
 *
 * Both support screens read tickets through here, with the session's edits
 * folded in first, so a row in the list, a card on the board, a figure in the
 * metrics and the ticket it opens can never disagree about a stage.
 */

import { useContext } from 'react'
import { SupportContext } from './SupportContext.jsx'
import {
  AGENTS, AGENT_BY_ID, CATEGORY_BY_ID, PRIORITIES, PRIORITY_BY_ID, STAGES, STAGE_BY_ID, SWATCHES,
  getTickets,
} from '../data/support.js'
import { TODAY } from '../data/users.js'
import { hash } from '../data/population.js'
import { lastActive } from './useAccess.js'

export function useSupportContext() {
  const ctx = useContext(SupportContext)
  if (!ctx) throw new Error('useSupportContext must be used inside <SupportProvider>')
  return ctx
}

/* ── Folding in the session ─────────────────────────────────────────── */

/** A ticket with this session's work applied. */
export function resolveTicket(ticket, edits) {
  const e = edits[ticket.id]
  if (!e) return ticket
  return {
    ...ticket,
    status: e.status ?? ticket.status,
    priority: e.priority ?? ticket.priority,
    // `null` is a real value here — unassigning somebody — so only a missing
    // key falls back to what arrived.
    assignee: 'assignee' in e ? e.assignee : ticket.assignee,
    mailbox: e.mailbox ?? ticket.mailbox,
    starred: e.starred ?? ticket.starred,
    labels: e.labels ?? ticket.labels,
    unread: 'read' in e ? !e.read : ticket.unread,
    aiDraft: e.draftDismissed ? null : ticket.aiDraft,
    messages: e.added ? [...ticket.messages, ...e.added] : ticket.messages,
    // Reading a ticket is not editing it, so read state alone never marks it.
    edited: Boolean(e.added || e.status || e.priority || 'assignee' in e || e.mailbox || e.labels
      || 'starred' in e || e.draftDismissed),
    sentThisSession: Boolean(e.added?.some((m) => m.from === 'agent')),
  }
}

export const resolveTickets = (edits) => getTickets().map((t) => resolveTicket(t, edits))

/* ── Time ───────────────────────────────────────────────────────────── */

/** A span of minutes, at the coarsest unit that still reads precisely. */
export function duration(mins) {
  const m = Math.max(0, Math.round(mins))
  if (m < 60) return `${m}m`
  if (m < 1440) {
    const h = Math.floor(m / 60)
    const rest = m % 60
    return rest ? `${h}h ${rest}m` : `${h}h`
  }
  const d = Math.floor(m / 1440)
  const h = Math.round((m % 1440) / 60)
  return h ? `${d}d ${h}h` : `${d}d`
}

/** How long ago, with this session's own work reading as now. */
export const ago = (message) => (message.session ? 'Just now' : lastActive(message.mins))

const at = (mins) => new Date(TODAY.getTime() - mins * 60000)
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const pad = (n) => String(n).padStart(2, '0')

/** "Sep 6" — the day part of Desk's timestamps. */
export const dayLabel = (mins) => { const d = at(mins); return `${MONTHS[d.getMonth()]} ${d.getDate()}` }

/** "3:04 PM" — the time part. */
export function clock(mins) {
  const d = at(mins)
  const h = d.getHours() % 12 || 12
  return `${h}:${pad(d.getMinutes())} ${d.getHours() < 12 ? 'AM' : 'PM'}`
}

/** "Sep 6 · 3:04 PM", as Desk's Created at column reads. */
export const stampLabel = (mins) => `${dayLabel(mins)} · ${clock(mins)}`

/** "Mon, Sep 6, 3:04 PM" — the full form a message header shows on hover. */
export const fullStamp = (mins) => { const d = at(mins); return `${DAYS[d.getDay()]}, ${dayLabel(mins)}, ${clock(mins)}` }

/** Whole days since arrival, as Desk's Age column reads. */
export const ageLabel = (mins) => `${Math.floor(Math.max(0, mins) / 1440)}d`

export const lastMins = (t) => t.messages[t.messages.length - 1].mins

/* ── The response clock ─────────────────────────────────────────────── */

export const waitingOnUs = (t) => t.mailbox !== 'spam' && (t.status === 'new' || t.status === 'open')

/**
 * Where a ticket stands against its priority's response SLA.
 *
 * The clock runs from the most recent moment the move became the desk's: the
 * customer's last message, or somebody moving the ticket back to To Do or In
 * Progress by hand. Without that second case, reopening a ticket answered four
 * days ago would show it four days overdue to a customer owed nothing yet.
 * Internal notes do not touch the clock — writing to a colleague is not an
 * answer.
 *
 * States follow Desk's SLA badge: overdue, under an hour left, under four hours
 * left, and comfortable.
 */
export function slaFor(t) {
  if (!waitingOnUs(t)) return { state: 'none', waitMins: null, targetMins: null, ratio: -1, label: null }
  const target = PRIORITY_BY_ID[t.priority].responseMins
  let waitMins = 0
  for (let i = t.messages.length - 1; i >= 0; i -= 1) {
    const m = t.messages[i]
    if (m.from === 'customer' || m.from === 'agent' || m.reopened) { waitMins = m.mins; break }
  }
  const left = target - waitMins
  return {
    state: left < 0 ? 'breached' : left < 60 ? 'soon' : left < 240 ? 'warn' : 'ok',
    waitMins,
    targetMins: target,
    ratio: waitMins / target,
    label: left < 0 ? `${duration(-left)} overdue` : `Due in ${duration(left)}`,
  }
}

/* ── Folders, filters and order ─────────────────────────────────────── */

/**
 * Desk's mailbox folders, in its order. Inbox, All Mail, Starred and Spam come
 * from the per-agent mailbox; Drafts and Sent from what this agent has written.
 * There is no Archive folder in Desk — archived mail leaves Inbox and stays in
 * All Mail.
 */
export const FOLDERS = [
  { id: 'inbox', label: 'Inbox' },
  { id: 'all', label: 'All Mail' },
  { id: 'starred', label: 'Starred' },
  { id: 'spam', label: 'Spam' },
  { id: 'drafts', label: 'Drafts' },
  { id: 'sent', label: 'Sent' },
]

export const FOLDER_BY_ID = Object.fromEntries(FOLDERS.map((f) => [f.id, f]))

export function inFolder(t, folder, drafts = {}) {
  switch (folder) {
    case 'all': return t.mailbox !== 'spam'
    case 'starred': return t.starred && t.mailbox !== 'spam'
    case 'spam': return t.mailbox === 'spam'
    case 'drafts': return Boolean(drafts[t.id]?.trim())
    case 'sent': return t.sentThisSession
    default: return t.mailbox === 'inbox'
  }
}

export const VIEWS = ['list', 'table', 'kanban']

export function filterTickets(tickets, {
  desk = 'all', folder = 'inbox', label = null, query = '', assignees = [], priorities = [],
  stages = [], unreadOnly = false, aiDraftOnly = false, overdueOnly = false, drafts = {},
} = {}) {
  const q = query.trim().toLowerCase()
  return tickets
    .filter((t) => {
      if (desk !== 'all' && t.desk !== desk) return false
      // A label is a view across folders, the way Desk treats it.
      if (label ? !(t.labels.includes(label) && t.mailbox !== 'spam') : !inFolder(t, folder, drafts)) return false
      if (assignees.length && !assignees.includes(t.assignee ?? 'none')) return false
      if (priorities.length && !priorities.includes(t.priority)) return false
      if (stages.length && !stages.includes(t.status)) return false
      if (unreadOnly && !t.unread) return false
      if (aiDraftOnly && !t.aiDraft) return false
      if (overdueOnly && slaFor(t).state !== 'breached') return false
      if (q && !`${t.id} ${t.subject} ${t.reporter.name} ${t.reporter.email}`.toLowerCase().includes(q)) return false
      return true
    })
    // Latest email first, which is how Desk orders a mailbox.
    .sort((a, b) => (lastMins(a) - lastMins(b)) || (a.createdMins - b.createdMins))
}

/** The tickets either side of this one in All Mail, for J and K. */
export function neighbours(ticket, tickets) {
  const list = filterTickets(tickets, { folder: 'all' })
  const i = list.findIndex((t) => t.id === ticket.id)
  if (i === -1) return { prev: null, next: null }
  return { prev: list[i - 1] ?? null, next: list[i + 1] ?? null }
}

/* ── People ─────────────────────────────────────────────────────────── */

export const firstName = (ticket) => ticket.reporter.name.split(' ')[0]

export const initials = (name) => name.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]).join('').toUpperCase()

export const avatarColor = (name) => SWATCHES[hash(name) % SWATCHES.length]

const workEmail = (name) => `${name.toLowerCase().replace(/[^a-z]+/g, '.')}@apexbank.example`

export const kindLabel = (reporter) => (
  reporter.kind === 'applicant' ? 'Applicant' : reporter.kind === 'cardholder' ? 'Cardholder' : 'Unknown sender'
)

/** Who wrote a message, whether it arrived with the data or was sent this session. */
export function authorOf(message, ticket) {
  if (message.from === 'customer') return ticket.reporter.name
  return message.authorName ?? AGENT_BY_ID[message.author]?.name ?? 'Support desk'
}

export function emailOf(message, ticket) {
  if (message.from === 'customer') return ticket.reporter.email
  return AGENT_BY_ID[message.author]?.email ?? workEmail(authorOf(message, ticket))
}

export const ownerName = (ticket) => (ticket.assignee ? AGENT_BY_ID[ticket.assignee]?.name ?? '—' : 'Unassigned')

/** Everything else the same person has raised, newest first. */
export function relatedTickets(ticket, tickets) {
  return tickets
    .filter((t) => t.id !== ticket.id && t.reporter.email === ticket.reporter.email)
    .sort((a, b) => a.createdMins - b.createdMins)
}

/* ── AI: summary and refine ─────────────────────────────────────────── */

const clip = (text, n) => (text.length > n ? `${text.slice(0, n - 1).trimEnd()}…` : text)

/**
 * The thread summary, composed from the ticket rather than generated.
 *
 * It reads like Desk's AI Summary card, and it keeps that card's disclaimer,
 * but every sentence in it is a field on the ticket — so the demo summary can
 * never say something the ticket does not.
 */
export function threadSummary(ticket, { applicant = null, known = null } = {}) {
  const pub = ticket.messages.filter((m) => m.from === 'customer' || m.from === 'agent')
  const fromCustomer = pub.filter((m) => m.from === 'customer')
  const replies = pub.filter((m) => m.from === 'agent')
  const sla = slaFor(ticket)
  const stage = STAGE_BY_ID[ticket.status].label

  const text = `${ticket.reporter.name} (${kindLabel(ticket.reporter).toLowerCase()}) wrote in by `
    + `${ticket.channel.toLowerCase()} about ${CATEGORY_BY_ID[ticket.category].label.toLowerCase()}. `
    + (sla.state === 'none'
      ? `The ticket is ${stage.toLowerCase()}.`
      : `It is ${stage.toLowerCase()} and ${sla.label.toLowerCase()} against its ${PRIORITY_BY_ID[ticket.priority].label.toLowerCase()} response SLA.`)

  const bullets = [`Asked: “${clip(fromCustomer[0]?.body ?? ticket.subject, 150)}”`]
  if (replies.length) {
    bullets.push(`The desk has replied ${replies.length === 1 ? 'once' : `${replies.length} times`}, most recently ${ago(replies[replies.length - 1]).toLowerCase()}.`)
  }
  if (fromCustomer.length > 1 && pub[pub.length - 1].from === 'customer') {
    bullets.push(`Latest from ${firstName(ticket)}: “${clip(fromCustomer[fromCustomer.length - 1].body, 150)}”`)
  }
  if (applicant?.stage) {
    bullets.push(`Their application is stuck at ${applicant.stage.label} — ${applicant.blocker.toLowerCase()}, ${applicant.days} day${applicant.days === 1 ? '' : 's'} on the step.`)
  }
  if (known) bullets.push(`Known fix (owner ${known.owner}): ${known.action}.`)
  return { text, bullets }
}

export const REFINE_MODES = [
  { id: 'polish', label: 'Polish' },
  { id: 'formalize', label: 'Formalize' },
  { id: 'elaborate', label: 'Elaborate' },
  { id: 'shorten', label: 'Shorten' },
]

const ELABORATION = 'If anything here does not match what you are seeing, reply to this message and the same person will pick it up.'

/**
 * Desk's four quick rewrites, as fixed transformations of the draft.
 *
 * There is no model behind this console, so these are rules rather than
 * rewrites — each one does exactly what its name says to the letter's parts
 * and nothing more, and running one twice changes nothing the second time.
 */
export function refineDraft(text, mode) {
  const blocks = text.trim().split(/\n{2,}/)
  let greeting = /^(Hi|Dear) [^\n]+,$/.test(blocks[0]) ? blocks.shift() : null
  let signoff = blocks.length > 1 && /^(Regards|Yours sincerely),/.test(blocks[blocks.length - 1]) ? blocks.pop() : null
  let body = blocks

  if (mode === 'polish') {
    body = body.map((b) => {
      const s = b.replace(/[ \t]{2,}/g, ' ').replace(/\s+([,.!?])/g, '$1').trim()
      return /[.!?”"]$/.test(s) ? s : `${s}.`
    })
  } else if (mode === 'formalize') {
    greeting = greeting?.replace(/^Hi /, 'Dear ') ?? null
    signoff = signoff?.replace(/^Regards,/, 'Yours sincerely,') ?? null
  } else if (mode === 'elaborate') {
    if (!body.some((b) => b.includes(ELABORATION))) body = [...body, ELABORATION]
  } else if (mode === 'shorten') {
    // Split only where a sentence really ends — punctuation then a space — so a
    // decimal like ₹0.25 stays whole and a trailing clause is not dropped.
    const sentences = body.filter((b) => b !== ELABORATION).join(' ')
      .split(/(?<=[.!?])\s+/).map((s) => s.trim()).filter(Boolean)
    body = [sentences.slice(0, 2).join(' ')]
  }

  return [greeting, ...body, signoff].filter(Boolean).join('\n\n')
}

/* ── Metrics ────────────────────────────────────────────────────────── */

const avg = (xs) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : null)

// Minutes from midnight to the console's 09:41, so a ticket can be put on a
// calendar day rather than a rolling 24-hour window.
const SINCE_MIDNIGHT = TODAY.getHours() * 60 + TODAY.getMinutes()
// The `- 1` keeps a message at exactly midnight on the day it opened.
const dayIndex = (mins) => (mins <= SINCE_MIDNIGHT ? 0 : 1 + Math.floor((mins - SINCE_MIDNIGHT - 1) / 1440))

const firstReplyOf = (t) => t.messages.find((m) => m.from === 'agent' && !m.session)

/** The last message that arrived with the data — session activity ignored. */
function arrivedLastMins(t) {
  for (let i = t.messages.length - 1; i >= 0; i -= 1) {
    if (!t.messages[i].session) return t.messages[i].mins
  }
  return t.createdMins
}

/**
 * What Desk Metrics shows for a set of tickets: the KPI cards, tickets by stage,
 * the four charts and the agent table. Spam is outside every figure.
 *
 * Times and reply counts are measured on what arrived, never on this
 * session's activity: a reply, a note or an archive done in the demo lands at
 * "now", and letting it in would make a resolution read as days long or a
 * first response as instant. Stage, priority and owner changes do count — they
 * are what the stage chips and charts show.
 */
export function deskMetrics(all) {
  const tickets = all.filter((t) => t.mailbox !== 'spam')
  const frts = []
  const resolutions = []
  const scores = []
  let replies = 0

  for (const t of tickets) {
    const first = firstReplyOf(t)
    if (first) frts.push(t.createdMins - first.mins)
    if (t.status === 'resolved') resolutions.push(t.createdMins - arrivedLastMins(t))
    if (t.csat) scores.push(t.csat)
    replies += t.messages.filter((m) => m.from === 'agent' && !m.session).length
  }

  const trend = Array.from({ length: 14 }, (_, i) => {
    const back = 13 - i
    return { key: back, label: dayLabel(back * 1440), created: 0, resolved: 0 }
  })
  for (const t of tickets) {
    const c = dayIndex(t.createdMins)
    if (c < 14) trend[13 - c].created += 1
    if (t.status === 'resolved') {
      const r = dayIndex(arrivedLastMins(t))
      if (r < 14) trend[13 - r].resolved += 1
    }
  }

  const agents = AGENTS.map((a) => {
    const mine = tickets.filter((t) => t.assignee === a.id)
    const responded = mine.filter((t) => t.messages.some((m) => m.from === 'agent' && m.author === a.id))
    const resolved = mine.filter((t) => t.status === 'resolved')
    const rated = mine.filter((t) => t.csat)
    return {
      ...a,
      assigned: mine.length,
      responded: responded.length,
      resolved: resolved.length,
      resolvedPct: mine.length ? resolved.length / mine.length : null,
      // Measured per ticket, never by index: filtering the replies first would
      // shift every later ticket onto the wrong reply.
      avgFrt: avg(responded.filter(firstReplyOf).map((t) => t.createdMins - firstReplyOf(t).mins)),
      csat: avg(rated.map((t) => t.csat)),
      replies: tickets.reduce((n, t) => n + t.messages.filter((m) => m.from === 'agent' && m.author === a.id).length, 0),
    }
  })

  return {
    created: tickets.length,
    avgFirstResponse: avg(frts),
    responded: frts.length,
    avgResolution: avg(resolutions),
    resolved: resolutions.length,
    csat: avg(scores),
    good: scores.filter((s) => s >= 4).length,
    bad: scores.filter((s) => s < 4).length,
    replies,
    byStage: STAGES.map((s) => ({ ...s, count: tickets.filter((t) => t.status === s.id).length })),
    byPriority: PRIORITIES.map((p) => ({ ...p, count: tickets.filter((t) => t.priority === p.id).length })),
    byAssignee: [
      ...AGENTS.map((a) => ({ id: a.id, label: a.name, count: tickets.filter((t) => t.assignee === a.id).length })),
      { id: 'none', label: 'Unassigned', count: tickets.filter((t) => !t.assignee).length },
    ],
    trend,
    agents,
  }
}
