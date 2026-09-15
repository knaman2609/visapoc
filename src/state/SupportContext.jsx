import { createContext, useCallback, useMemo, useState } from 'react'
import { AGENT_BY_ID, PRIORITY_BY_ID, STAGE_BY_ID } from '../data/support.js'

export const SupportContext = createContext(null)

/**
 * Session-scoped work on the desk.
 *
 * There is no backend behind this console, so everything an agent does on the
 * support screens lives here and only here: a reply, an internal note, a stage
 * or priority change, an assignment, a star, a label, moving a ticket to spam,
 * marking it read, a half-written reply. It survives moving between the desk
 * and a ticket — which is what makes them one product — and nothing more. A
 * reload restores the data module.
 *
 * Ticket edits are overrides keyed by ticket id, the same way AccessContext
 * keeps access edits, so a screen can always tell what arrived from what was
 * done to it. Reply drafts are kept apart from them: a draft is the agent's own
 * unsent text, not a change to the ticket, and Desk lists them in their own
 * folder.
 *
 * Every change to a field the whole desk sees also writes an activity line. A
 * ticket is read by the next person on shift, and "who moved this to resolved"
 * is the first thing they ask. Stars, labels and read state do not — in Desk
 * those are an agent's own filing.
 */

const MAILBOX_LINE = {
  inbox: (by) => `${by} moved this back to the inbox`,
  archived: (by) => `${by} archived this ticket`,
  spam: (by) => `${by} reported this as spam`,
}

export function SupportProvider({ children }) {
  // ticketId -> { status?, priority?, assignee?, mailbox?, starred?, labels?,
  //               read?, draftDismissed?, added?: message[] }
  const [edits, setEdits] = useState({})
  // ticketId -> unsent reply text
  const [drafts, setDrafts] = useState({})

  const patch = useCallback((id, fields) => {
    setEdits((prev) => ({ ...prev, [id]: { ...prev[id], ...fields } }))
  }, [])

  /** Append one message, optionally changing fields in the same step. */
  const append = useCallback((id, message, fields = {}) => {
    setEdits((prev) => {
      const cur = prev[id] ?? {}
      const added = cur.added ?? []
      // Ids come from the count already appended rather than from the clock, so
      // they stay stable under StrictMode's double-invoked updaters. `mins` is
      // zero because the console's today is frozen: anything done this session
      // happened at the header's timestamp.
      const next = { ...message, id: `${id}-s${added.length}`, mins: 0, session: true }
      return { ...prev, [id]: { ...cur, ...fields, added: [...added, next] } }
    })
  }, [])

  const clearDraft = useCallback((id) => {
    setDrafts((prev) => {
      if (!(id in prev)) return prev
      const next = { ...prev }
      delete next[id]
      return next
    })
  }, [])

  /**
   * Send a reply to the customer. It hands the move back to them, so the ticket
   * moves to Waiting on Customer — logged like any other stage change — and the
   * draft it was typed into, and any AI draft, are spent. Answering something in
   * Spam is a judgement that it was not spam, so it comes back to the inbox.
   *
   * `previous` and `mailbox` are where the ticket stood when the reply was sent;
   * the caller has the resolved ticket, the provider only has overrides.
   */
  const reply = useCallback((id, { body, author, previous, mailbox }) => {
    const fields = { status: 'pending', read: true, draftDismissed: true }
    if (mailbox === 'spam') fields.mailbox = 'inbox'
    append(id, { from: 'agent', authorName: author, body }, fields)
    if (previous !== 'pending') append(id, { from: 'system', body: `${author} moved this to ${STAGE_BY_ID.pending.label}` })
    if (mailbox === 'spam') append(id, { from: 'system', body: MAILBOX_LINE.inbox(author) })
    clearDraft(id)
  }, [append, clearDraft])

  /** A note on the ticket's team thread. The customer never sees it. */
  const note = useCallback((id, { body, author }) => {
    append(id, { from: 'note', authorName: author, body })
  }, [append])

  const setStatus = useCallback((id, status, by, previous) => {
    // Putting a ticket back on the desk — from Waiting on Customer or Resolved —
    // restarts its response clock from this line (see slaFor). Moving it between
    // To Do and In Progress does not: picking a ticket up is not answering it,
    // and must not wipe a breach.
    const reopened = (status === 'new' || status === 'open') && (previous === 'pending' || previous === 'resolved')
    append(id, { from: 'system', reopened, body: `${by} moved this to ${STAGE_BY_ID[status].label}` }, { status })
  }, [append])

  const setPriority = useCallback((id, priority, by) => {
    append(id, { from: 'system', body: `${by} set the priority to ${PRIORITY_BY_ID[priority].label}` }, { priority })
  }, [append])

  const assign = useCallback((id, assignee, by) => {
    const who = assignee ? AGENT_BY_ID[assignee]?.name : null
    append(
      id,
      { from: 'system', body: who ? `${by} assigned this to ${who}` : `${by} unassigned this ticket` },
      { assignee },
    )
  }, [append])

  const setMailbox = useCallback((id, mailbox, by) => {
    append(id, { from: 'system', body: MAILBOX_LINE[mailbox](by) }, { mailbox })
  }, [append])

  const setStarred = useCallback((id, starred) => patch(id, { starred }), [patch])
  const setLabels = useCallback((id, labels) => patch(id, { labels }), [patch])
  const dismissAiDraft = useCallback((id) => patch(id, { draftDismissed: true }), [patch])

  /** Mark one or many tickets read or unread in one step — the bulk bar uses it. */
  const setRead = useCallback((ids, read) => {
    setEdits((prev) => {
      const next = { ...prev }
      for (const id of ids) next[id] = { ...next[id], read }
      return next
    })
  }, [])

  const setDraft = useCallback((id, text) => {
    setDrafts((prev) => ({ ...prev, [id]: text }))
  }, [])

  const resetTicket = useCallback((id) => {
    setEdits((prev) => {
      const next = { ...prev }
      delete next[id]
      return next
    })
    clearDraft(id)
  }, [clearDraft])

  const resetAll = useCallback(() => {
    setEdits({})
    setDrafts({})
  }, [])

  const dirty = Object.keys(edits).length > 0 || Object.keys(drafts).length > 0

  const value = useMemo(
    () => ({
      edits, drafts, dirty,
      reply, note, setStatus, setPriority, assign, setMailbox, setStarred, setLabels,
      dismissAiDraft, setRead, setDraft, clearDraft, resetTicket, resetAll,
    }),
    [edits, drafts, dirty, reply, note, setStatus, setPriority, assign, setMailbox, setStarred,
      setLabels, dismissAiDraft, setRead, setDraft, clearDraft, resetTicket, resetAll],
  )

  return <SupportContext.Provider value={value}>{children}</SupportContext.Provider>
}
