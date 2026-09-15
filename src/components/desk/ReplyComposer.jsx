import { useCallback, useState } from 'react'
import {
  ChevronDown, ChevronUp, CornerUpLeft, Eraser, Minimize2, ReplyAll, Send, WandSparkles, X,
} from 'lucide-react'
import { REFINE_MODES, firstName, refineDraft } from '../../state/useSupport.js'
import { AiMark, MenuItem, MenuLabel, Popover } from './DeskBits.jsx'
import styles from './ReplyComposer.module.css'

/**
 * The reply, as Desk draws it: a floating pill at the foot of the thread that
 * opens into the composer, with the AI draft card on top when Desk has drafted
 * one.
 *
 * The typed text lives in the session (SupportContext drafts), so minimising
 * the composer or leaving the ticket keeps it, and the Drafts folder can list
 * it. The AI draft has to be inserted or discarded before Send is enabled —
 * Desk's rule, so nothing the AI wrote goes out unread.
 *
 * There is no formatting toolbar: this demo sends plain text, and buttons that
 * format nothing would be worse than none. Mount it keyed by ticket id.
 */
export default function ReplyComposer({ ticket, desk, draft = '', onDraft, onDiscard, onSend, onDismissAi }) {
  const [open, setOpen] = useState(draft.trim() !== '')
  const [mode, setMode] = useState('all')
  const [aiOpen, setAiOpen] = useState(Boolean(ticket.aiDraft) && draft.trim() === '')
  const [aiCollapsed, setAiCollapsed] = useState(false)
  const [aiText, setAiText] = useState(ticket.aiDraft ?? '')
  const [menu, setMenu] = useState(null)
  const closeMenu = useCallback(() => setMenu(null), [])

  const empty = draft.trim() === ''
  const first = firstName(ticket)
  const showAi = Boolean(ticket.aiDraft) && aiOpen
  // Nothing the AI wrote goes out unread: while its card is open, Send waits for
  // it to be inserted or discarded — even if the agent has typed alongside it.
  const blocked = showAi
  const ModeIcon = mode === 'all' ? ReplyAll : CornerUpLeft
  const modeLabel = mode === 'all' ? 'Reply all' : 'Reply'

  const send = () => {
    if (empty || blocked) return
    onSend(draft.trim())
    setOpen(false)
  }

  if (!open) {
    return (
      <button type="button" className={styles.pill} onClick={() => setOpen(true)}>
        <ModeIcon size={15} strokeWidth={2} aria-hidden="true" />
        <span className={styles.pillMode}>{modeLabel}</span>
        <span className={styles.pillTo}>&lt;{ticket.reporter.email}&gt;{mode === 'all' ? `, <${desk.address}>` : ''}</span>
        {!empty && <span className={styles.pillDraft}>Draft saved</span>}
        {empty && ticket.aiDraft && (
          <span className={styles.pillAi}>
            <WandSparkles size={11} strokeWidth={2.25} aria-hidden="true" />
            AI draft ready
          </span>
        )}
      </button>
    )
  }

  return (
    <div className={styles.composer} role="group" aria-label={`Reply to ${ticket.reporter.name}`}>
      <div className={styles.head}>
        <Popover
          open={menu === 'mode'}
          onClose={closeMenu}
          trigger={(
            <button
              type="button"
              className={styles.modeBtn}
              aria-expanded={menu === 'mode'}
              onClick={() => setMenu(menu === 'mode' ? null : 'mode')}
            >
              <ModeIcon size={14} strokeWidth={2} aria-hidden="true" />
              {modeLabel}
              <ChevronDown size={13} strokeWidth={2} aria-hidden="true" />
            </button>
          )}
        >
          <MenuItem icon={CornerUpLeft} onClick={() => { setMode('reply'); closeMenu() }}>Reply</MenuItem>
          <MenuItem icon={ReplyAll} onClick={() => { setMode('all'); closeMenu() }}>Reply all</MenuItem>
        </Popover>

        <div className={styles.recips}>
          <span className={styles.recipK}>To</span>
          <span className={styles.recipChip}>{ticket.reporter.name} &lt;{ticket.reporter.email}&gt;</span>
          {mode === 'all' && (
            <>
              <span className={styles.recipK}>Cc</span>
              <span className={styles.recipChip}>{desk.address}</span>
            </>
          )}
        </div>

        <div className={styles.headActions}>
          <button type="button" className={styles.iconBtn} onClick={() => setOpen(false)} aria-label="Minimize, keeping the draft" title="Minimize (keeps draft)">
            <Minimize2 size={14} strokeWidth={2} aria-hidden="true" />
          </button>
          <button type="button" className={styles.iconBtn} onClick={() => { onDiscard(); setOpen(false) }} aria-label="Discard draft" title="Discard draft">
            <X size={15} strokeWidth={2} aria-hidden="true" />
          </button>
        </div>
      </div>

      <div className={styles.inner}>
        {showAi && (
          <div className={styles.draftCard}>
            <div className={styles.draftHead}>
              <AiMark />
              <span>AI Draft</span>
              <span className={styles.spacer} />
              <button
                type="button"
                className={styles.iconBtn}
                onClick={() => setAiCollapsed((v) => !v)}
                aria-label={aiCollapsed ? 'Expand AI draft' : 'Collapse AI draft'}
              >
                {aiCollapsed
                  ? <ChevronDown size={14} strokeWidth={2} aria-hidden="true" />
                  : <ChevronUp size={14} strokeWidth={2} aria-hidden="true" />}
              </button>
              <button
                type="button"
                className={styles.iconBtn}
                onClick={() => { setAiOpen(false); onDismissAi() }}
                aria-label="Discard AI draft"
              >
                <X size={14} strokeWidth={2} aria-hidden="true" />
              </button>
            </div>

            {!aiCollapsed && (
              <>
                <div className={styles.draftBody}>{aiText}</div>
                <div className={styles.draftFoot}>
                  <Popover
                    open={menu === 'refine'}
                    onClose={closeMenu}
                    placement="up"
                    trigger={(
                      <button
                        type="button"
                        className={styles.ghostPill}
                        aria-expanded={menu === 'refine'}
                        onClick={() => setMenu(menu === 'refine' ? null : 'refine')}
                      >
                        Refine
                        <ChevronDown size={12} strokeWidth={2} aria-hidden="true" />
                      </button>
                    )}
                  >
                    <MenuLabel>Quick rewrite</MenuLabel>
                    {REFINE_MODES.map((r) => (
                      <MenuItem key={r.id} onClick={() => { setAiText((t) => refineDraft(t, r.id)); closeMenu() }}>
                        {r.label}
                      </MenuItem>
                    ))}
                  </Popover>
                  <span className={styles.draftNote}>AI-generated · review before sending</span>
                  <button
                    type="button"
                    className={styles.insertBtn}
                    // Added below anything already typed rather than over it, and the
                    // AI draft is spent once it is in the reply.
                    onClick={() => {
                      onDraft(draft.trim() ? `${draft.trimEnd()}\n\n${aiText}` : aiText)
                      setAiOpen(false)
                      onDismissAi()
                    }}
                  >
                    Insert
                  </button>
                </div>
              </>
            )}
          </div>
        )}

        {!showAi && ticket.aiDraft && empty && (
          <button type="button" className={styles.aiPill} onClick={() => setAiOpen(true)}>
            <WandSparkles size={12} strokeWidth={2.25} aria-hidden="true" />
            AI Draft
          </button>
        )}

        <textarea
          className={styles.editor}
          rows={5}
          value={draft}
          placeholder={`Write to ${first}…`}
          aria-label={`Reply to ${ticket.reporter.name}`}
          onChange={(e) => onDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) { e.preventDefault(); send() }
          }}
        />
      </div>

      <div className={styles.foot}>
        <button
          type="button"
          className={styles.iconBtn}
          disabled={empty}
          onClick={() => onDraft('')}
          aria-label="Clear body"
          title="Clear body"
        >
          <Eraser size={14} strokeWidth={2} aria-hidden="true" />
        </button>
        <span className={styles.hint}>
          {blocked
            ? 'Insert or discard the AI draft to enable Send.'
            : `Sends to ${first} by ${ticket.channel.toLowerCase()} and moves the ticket to Waiting on Customer. ⌘↵ to send.`}
        </span>
        <button
          type="button"
          className={styles.send}
          disabled={empty || blocked}
          onClick={send}
          aria-label="Send reply"
          title={blocked ? 'Accept the AI draft to enable Send' : 'Send'}
        >
          <Send size={14} strokeWidth={2} aria-hidden="true" />
        </button>
      </div>
    </div>
  )
}
