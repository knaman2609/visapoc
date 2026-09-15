import { useEffect, useMemo, useRef, useState } from 'react'
import { PenLine, Undo2 } from 'lucide-react'
import { PM_MAILS, fmtIN, PM_OPPS } from '../../../data/portfolio.js'
import { buildCampaign } from '../../../data/campaign.js'
import { CHANNELS } from '../../../data/agent.js'
import {
  CHANNEL_LIMIT, TEMPLATES, TONES, findTone, mergeFields, render, suggestTone,
} from '../../../data/templates.js'
import { lintCopy, mergeAudit, smsParts } from '../../../data/copyLint.js'
import { applyDesign, listChannels } from '../../../data/studioBridge.js'
import { useCopyAgent } from '../../../state/useCopyAgent.js'
import DesignPicker from '../../../components/drawers/DesignPicker.jsx'
import EmailCanvas from '../../../components/studio/EmailCanvas.jsx'
import Button from '../../../components/ui/Button.jsx'
import Spinner from '../../../components/ui/Spinner.jsx'
import PhoneShell from '../../../components/ui/PhoneShell.jsx'
import stepStyles from './step.module.css'
import styles from './Step4Preview.module.css'
import StepActions from '../StepActions.jsx'

/* The presets already cover "restyle the one in front of me", so the worked
   examples show the thing only the agent can do — reach a named channel.
   Drawn from the live channels so none of them can miss. */
const ASK_FOR = {
  email: 'More formal for the email',
  wa: 'Warmer tone on WhatsApp',
  sms: 'Shorter on the SMS',
  inapp: 'Shorter on the push',
  banner: 'Warmer tone on the banner',
}

/* Every channel that carries written copy starts on the house style. Built
   from the templates themselves so a new channel cannot be forgotten here. */
const blank = () =>
  Object.fromEntries(Object.keys(TEMPLATES).map((id) => [id, { ...TEMPLATES[id].base }]))

/* A paired campaign writes twice: the paid leg offers something new, the
   awareness leg points at what the cardholder already holds. Sharing one draft
   between them would put the wrong message in front of half the audience. */
const blankLegs = (ids) => Object.fromEntries(ids.map((id) => [id, blank()]))

const same = (a, b) => JSON.stringify(a) === JSON.stringify(b)

function SparkIcon({ className = '' }) {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M12 2l1.9 6.1L20 10l-6.1 1.9L12 18l-1.9-6.1L4 10l6.1-1.9z" />
      <path d="M19 15l.85 2.65L22.5 18.5l-2.65.85L19 22l-.85-2.65L15.5 18.5l2.65-.85z" />
    </svg>
  )
}

export default function Step4Preview({ flow }) {
  const enabled = flow.channels
  const live = CHANNELS.filter((c) => enabled[c.id])
  // Spoken channels reach the cohort but carry no written asset, so they are
  // named here rather than given a tab that has nothing behind it.
  const available = live.filter((c) => TEMPLATES[c.id])
  const unwritten = live.filter((c) => !TEMPLATES[c.id])
  const campaign = useMemo(() => buildCampaign(flow), [flow])

  const legIds = campaign.legs.map((l) => l.id)
  const [legTab, setLegTab] = useState(legIds[0])
  const leg = campaign.legs.find((l) => l.id === legTab) || campaign.legs[0]

  /* The sample has to come from the half of the cohort this leg is written
     for. Previewing the awareness copy against somebody who holds nothing
     would show a message about a benefit they do not have. */
  const cohort = leg.cohort  // The copy is being written against something. Carry it down from the
  // opportunity that raised the campaign so the studio is not a blank canvas.
  const opp = PM_OPPS.find((o) => o.id === flow.pmOpp) || PM_OPPS[0]
  const offer = flow.selection

  const [channel, setChannel] = useState(available[0]?.id || 'email')
  const [mode, setMode] = useState('template')
  const [personId, setPersonId] = useState(cohort.members[0].name)
  const [copyByLeg, setCopyByLeg] = useState(() => blankLegs(['paid', 'aware']))
  /* Where this leg's creative came from. A campaign that reuses a design the
     studio already proved is a different claim from one written just now, and
     the step has to be able to say which it is. */
  const [designByLeg, setDesignByLeg] = useState({})
  const [picking, setPicking] = useState(false)
  const usedDesign = designByLeg[leg.id] || null
  const copy = copyByLeg[leg.id] || copyByLeg.paid
  const [toneByLeg, setToneByLeg] = useState({ paid: {}, aware: {} })
  const [editing, setEditing] = useState(false)
  const [rewriting, setRewriting] = useState(false)
  const [draft, setDraft] = useState('')
  const [undo, setUndo] = useState(null)
  const [flash, setFlash] = useState(false)
  const logRef = useRef(null)
  const askRef = useRef(null)
  const flashT = useRef(0)
  const caret = useRef(null)

  // If the operator turns a channel off upstream, do not strand the tab here.
  useEffect(() => {
    const stranded = !available.some((c) => c.id === channel)
    if (stranded && available[0]) setChannel(available[0].id)
  }, [channel, available])

  useEffect(() => {
    if (!cohort.members.some((m) => m.name === personId)) setPersonId(cohort.members[0].name)
  }, [cohort, personId])

  useEffect(() => () => clearTimeout(flashT.current), [])

  // A rewrite lands somewhere below the fold otherwise — the card says so itself.
  const pulse = () => {
    setFlash(true)
    clearTimeout(flashT.current)
    flashT.current = setTimeout(() => setFlash(false), 700)
  }

  /* Editing, rewriting or restyling a design-sourced draft makes it a draft of
     its own. The step keeps the words and drops the claim, because a click
     rate belongs to the creative that earned it, not to an edit of it. */
  const markEdited = () => setDesignByLeg((prev) => (
    prev[leg.id] && !prev[leg.id].edited
      ? { ...prev, [leg.id]: { ...prev[leg.id], edited: true } }
      : prev
  ))

  const setCopy = (fn) => {
    markEdited()
    setCopyByLeg((prev) => ({
      ...prev,
      [leg.id]: typeof fn === 'function' ? fn(prev[leg.id]) : fn,
    }))
  }

  const applyTone = (ch, tone) => {
    setCopy((prev) => ({ ...prev, [ch]: { ...TEMPLATES[ch][tone] } }))
    setToneByLeg((prev) => ({ ...prev, [leg.id]: { ...prev[leg.id], [ch]: tone } }))
    if (ch === channel) pulse()
  }

  const agent = useCopyAgent({ channel, enabled, applyTone })

  useEffect(() => {
    logRef.current?.scrollTo({ top: logRef.current.scrollHeight, behavior: 'smooth' })
  }, [agent.messages, agent.pending])

  useEffect(() => { if (rewriting) askRef.current?.focus() }, [rewriting])

  useEffect(() => {
    if (!rewriting) return undefined
    const h = (e) => { if (e.key === 'Escape') setRewriting(false) }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [rewriting])

  const suggested = suggestTone(leg.kind)
  const currentTone = toneByLeg[leg.id]?.[channel] || 'base'

  const person = cohort.members.find((m) => m.name === personId) || cohort.members[0]
  const fields = mergeFields(person, cohort)
  const tpl = copy[channel]
  const meta = person.meta.split(' · ')

  // Which tokens this template actually spends — the rest are dimmed in the rail.
  const used = useMemo(() => {
    const all = [tpl.subject, tpl.body, tpl.cta].filter(Boolean).join(' ')
    return new Set([...all.matchAll(/\{\{(\w+)\}\}/g)].map((m) => m[1]))
  }, [tpl])

  const running = flow.mailN < PM_MAILS.length
  if (running) return <Writing />

  const channelName = CHANNELS.find((c) => c.id === channel).name
  const show = (text) => (mode === 'preview' ? render(text, fields) : text)
  const cap = CHANNEL_LIMIT[channel]
  const merged = render(tpl.body, fields)
  const len = merged.length
  const over = cap && len > cap

  // What the message actually costs to send, and what it would cost cleaned up.
  const parts = channel === 'sms' ? smsParts(merged) : null
  const asGsm = parts?.ucs2 ? smsParts(merged.replace(/₹/g, 'Rs ')) : null
  // Compliance runs over everything the channel carries, not just the body.
  const lint = lintCopy([tpl.subject, tpl.body, tpl.cta].filter(Boolean).join(' \n'), channel)
  // One cardholder hides the one whose name pushes it over a boundary.
  const audit = mergeAudit(tpl.body, channel, cohort)

  const changed = (ch) => !same(copy[ch], TEMPLATES[ch].base)
  const anyChanged = available.some((c) => changed(c.id))
  const canUndo = undo && !same(undo.copy, copy)

  const setField = (k, v) => setCopy((prev) => ({ ...prev, [channel]: { ...prev[channel], [k]: v } }))

  const pickMode = (m) => {
    setMode(m)
    if (m === 'preview') setEditing(false)
  }
  const toggleEdit = () => {
    const next = !editing
    setEditing(next)
    if (next) setMode('template')
  }
  // Where the caret last was, so a token lands there instead of at the end.
  const noteCaret = (field, start, end) => { caret.current = { field, start, end } }

  const insertToken = (name) => {
    const tok = `{{${name}}}`
    const at = caret.current
    // Fall back to the body: it is the one field every channel has.
    const field = at && at.field && at.field in tpl ? at.field : 'body'
    const cur = tpl[field] ?? ''
    const here = at && at.field === field
    const start = here ? at.start : cur.length
    const end = here ? at.end : cur.length

    if (!editing) { setEditing(true); setMode('template') }
    setUndo({ copy })
    setField(field, cur.slice(0, start) + tok + cur.slice(end))
    // Leave the caret after what was just inserted so tokens chain.
    const pos = start + tok.length
    caret.current = { field, start: pos, end: pos }
  }

  const pickTone = (tone) => { setUndo({ copy }); applyTone(channel, tone) }
  const send = (text) => {
    if (!text.trim() || agent.pending) return
    setUndo({ copy })
    agent.ask(text)
    setDraft('')
  }
  const revert = () => { setCopy(undo.copy); setUndo(null); pulse() }

  /* ── The studio, joined up ──────────────────────────────────────────
     A creative made once and judged on nine surfaces is worth more than one
     written here from scratch — and it is the only version of it that carries
     a click rate. Pulling it in fills the channels it was written for and
     leaves the rest exactly as drafted. */
  const chanIds = available.map((c) => c.id)

  const useSavedDesign = (d) => {
    const { copy: next, filled, skipped } = applyDesign(copy, d.doc, chanIds)
    setCopyByLeg((prev) => ({ ...prev, [leg.id]: next }))
    setDesignByLeg((prev) => ({
      ...prev,
      [leg.id]: {
        id: d.id,
        name: d.name.trim() || 'Untitled design',
        doc: d.doc,
        brand: d.brand,
        stats: d.stats,
        filled,
        skipped,
      },
    }))
    setToneByLeg((prev) => ({ ...prev, [leg.id]: {} }))
    setUndo(null)
    if (filled.length && !filled.includes(channel)) setChannel(filled[0])
    setPicking(false)
    setEditing(false)
    pulse()
  }

  /* Editing here is editing a copy of the design, not the design. Saying so
     the moment it happens is better than letting the step keep claiming a
     provenance it no longer has. */
  const detachDesign = (keepCopy) => {
    if (!keepCopy) setCopy(blank())
    setDesignByLeg((prev) => {
      const next = { ...prev }
      delete next[leg.id]
      return next
    })
  }
  const resetAll = () => {
    detachDesign(false)
    setToneByLeg((prev) => ({ ...prev, [leg.id]: {} }))
    agent.reset()
    setUndo(null)
    pulse()
  }

  // The channel artefact, rendered or opened for editing in place. Built by a
  // call and not a lookup map: only email carries a subject and a button, so
  // evaluating all three branches eagerly reads tokens the others do not have.
  function renderArtefact() {
    /* A design in use is drawn as the design — its blocks, its brand kit —
       rather than as this step's plain card with the words lifted out of it.
       Anything less is a claim that the studio was used, not a preview. */
    const asDesigned = usedDesign?.doc?.email?.blocks?.length && !usedDesign.edited && !editing
    if (channel === 'email' && asDesigned) return (
      <div className={styles.email}>
        <div className={styles.emailChrome}>
          <div className={styles.emailFrom}>
            {usedDesign.brand?.sender || 'Visa Cards'}
            {' '}&lt;{usedDesign.brand?.senderAddress || 'cards@visa.co.in'}&gt;
          </div>
          <div className={styles.emailTo}>
            to {mode === 'preview' ? person.name : '{{first_name}}'}
          </div>
        </div>
        <div className={styles.emailSlot}>
          <div className={styles.emailSubject}>{markup(show(tpl.subject), mode, styles)}</div>
        </div>
        <EmailCanvas
          blocks={usedDesign.doc.email.blocks}
          fields={fields}
          merged={mode === 'preview'}
          brand={usedDesign.brand}
          flat
        />
      </div>
    )

    if (channel === 'email') return (
      <div className={styles.email}>
        <div className={styles.emailChrome}>
          <div className={styles.emailFrom}>Visa Cards &lt;cards@visa.co.in&gt;</div>
          <div className={styles.emailTo}>
            to {mode === 'preview' ? person.name : '{{first_name}}'}
          </div>
        </div>

        <div className={styles.emailSlot}>
          {editing ? (
            <Grow
              className={`${styles.editable} ${styles.editSubject}`}
              value={tpl.subject}
              onChange={(v) => setField('subject', v)}
              field="subject"
              onCaret={noteCaret}
              aria-label="Subject line"
            />
          ) : (
            <div className={styles.emailSubject}>{markup(show(tpl.subject), mode, styles)}</div>
          )}
        </div>

        <div className={styles.emailSlot}>
          {editing ? (
            <Grow
              className={`${styles.editable} ${styles.editBody}`}
              value={tpl.body}
              onChange={(v) => setField('body', v)}
              field="body"
              onCaret={noteCaret}
              aria-label="Email body"
            />
          ) : (
            <div className={styles.emailBody}>{markup(show(tpl.body), mode, styles)}</div>
          )}
        </div>

        <div className={styles.emailSlot}>
          {editing ? (
            <input
              className={`${styles.emailCta} ${styles.ctaEdit}`}
              value={tpl.cta}
              onChange={(e) => setField('cta', e.target.value)}
              style={{ width: `calc(${Math.max(12, tpl.cta.length)}ch + 48px)` }}
              aria-label="Button label"
            />
          ) : (
            <div className={styles.emailCta}>{markup(show(tpl.cta), mode, styles)}</div>
          )}
        </div>

        <div className={styles.emailFoot}>
          Visa · You are receiving this because you hold an eligible card. Unsubscribe.
        </div>
      </div>
    )

    if (channel === 'wa') return (
      <PhoneShell size="md" chrome="ios" screenBg="#ece5dd" time="9:41">
        <div className={styles.waBar}>
          <span className={styles.waAvatar}>V</span>
          <span>
            <span className={styles.waName}>Visa Cards</span>
            <span className={styles.waBiz}>Business account</span>
          </span>
        </div>
        <div className={styles.waCanvas}>
          <div className={styles.waBubble}>
            {editing ? (
              <Grow
                className={`${styles.editable} ${styles.editBubble}`}
                value={tpl.body}
                onChange={(v) => setField('body', v)}
              field="body"
              onCaret={noteCaret}
                aria-label="WhatsApp message"
              />
            ) : (
              markup(show(tpl.body), mode, styles)
            )}
            <span className={styles.waTime}>09:00 ✓✓</span>
          </div>
          <div className={styles.waReply}>Not interested</div>
        </div>
        <div className={styles.waInput}>
          <span className={styles.waField}>Message</span>
        </div>
      </PhoneShell>
    )

    if (channel === 'inapp') return (
      <div className={styles.deviceWrap}>
        <PhoneShell size="md" chrome="ios" screenBg="#0d1220" time="9:41">
          <div className={styles.lock}>
            <div className={styles.lockClock}>9:41</div>
            <div className={styles.lockDate}>Tuesday, 8 September</div>
            <div className={styles.pushCard}>
              <div className={styles.pushHead}>
                <span className={styles.pushIco} aria-hidden="true" />
                <span className={styles.pushApp}>Bank App</span>
                <span className={styles.pushNow}>now</span>
              </div>
              {editing ? (
                <>
                  <Grow
                    className={`${styles.editable} ${styles.editPushTitle}`}
                    value={tpl.subject}
                    onChange={(v) => setField('subject', v)}
                    aria-label="Push title"
                  />
                  <Grow
                    className={`${styles.editable} ${styles.editPushBody}`}
                    value={tpl.body}
                    onChange={(v) => setField('body', v)}
                    aria-label="Push body"
                  />
                </>
              ) : (
                <>
                  <div className={styles.pushTitle}>{markup(show(tpl.subject), mode, styles)}</div>
                  <div className={styles.pushBody}>{markup(show(tpl.body), mode, styles)}</div>
                </>
              )}
            </div>
          </div>
        </PhoneShell>
        <div className={styles.smsMeta}>
          Lock screen · delivered only to cardholders with notifications on
        </div>
      </div>
    )

    if (channel === 'banner') return (
      <div className={styles.deviceWrap}>
        <PhoneShell size="md" chrome="ios" screenBg="#f4f5f7" time="9:41">
          <div className={styles.appNav}>
            <span className={styles.appNavTitle}>Accounts</span>
          </div>
          <div className={styles.appBody}>
            <div className={styles.bannerCard}>
              <div className={styles.bannerKick}>For you</div>
              {editing ? (
                <>
                  <Grow
                    className={`${styles.editable} ${styles.editBannerTitle}`}
                    value={tpl.subject}
                    onChange={(v) => setField('subject', v)}
                    aria-label="Banner headline"
                  />
                  <Grow
                    className={`${styles.editable} ${styles.editBannerBody}`}
                    value={tpl.body}
                    onChange={(v) => setField('body', v)}
                    aria-label="Banner body"
                  />
                  <Grow
                    className={`${styles.editable} ${styles.editBannerCta}`}
                    value={tpl.cta}
                    onChange={(v) => setField('cta', v)}
                    aria-label="Banner button"
                  />
                </>
              ) : (
                <>
                  <div className={styles.bannerTitle}>{markup(show(tpl.subject), mode, styles)}</div>
                  <div className={styles.bannerBody}>{markup(show(tpl.body), mode, styles)}</div>
                  <div className={styles.bannerCta}>{markup(show(tpl.cta), mode, styles)}</div>
                </>
              )}
            </div>
            <div className={styles.appRow} aria-hidden="true" />
            <div className={styles.appRow} aria-hidden="true" />
          </div>
        </PhoneShell>
        <div className={styles.smsMeta}>
          Placed in the app · seen when they next open it, not pushed
        </div>
      </div>
    )

    return (
      <div className={styles.deviceWrap}>
        <PhoneShell size="md" chrome="ios" screenBg="#fff" time="9:41">
          <div className={styles.iosNav}>
            <span className={styles.iosBack} aria-hidden="true">‹</span>
            <span className={styles.iosTitle}>VISAIN</span>
          </div>

          <div className={styles.iosThread}>
            <div className={styles.smsStamp}>
              <b>Text Message</b> · SMS
              <span>Today at 09:00</span>
            </div>
            <div className={styles.smsRow}>
              <div className={styles.smsBubble}>
                {editing ? (
                  <Grow
                    className={`${styles.editable} ${styles.editSms}`}
                    value={tpl.body}
                    onChange={(v) => setField('body', v)}
              field="body"
              onCaret={noteCaret}
                    aria-label="SMS message"
                  />
                ) : mode === 'preview' ? (
                  linkify(show(tpl.body), styles)
                ) : (
                  markup(show(tpl.body), mode, styles)
                )}
              </div>
            </div>
          </div>

          <div className={styles.iosInput}>
            <span className={styles.iosField}>Text Message</span>
          </div>
        </PhoneShell>
        <div className={styles.smsMeta}>Sent from a registered sender header</div>
      </div>
    )
  }

  return (
    <div className={stepStyles.wrap}>
      <div className={stepStyles.head}>
        <div>
          <div className={stepStyles.kicker}>Communication preview</div>
          <h1 className={stepStyles.h1}>What lands on the phone</h1>
          <div className={stepStyles.sub}>
            Write it, merge it, and check it before it goes anywhere.
          </div>
        </div>
        <div className={stepStyles.status}>{live.length} CHANNELS IN PLAY</div>
      </div>

      {/* ── The brief, carried down from the opportunity that raised this.
             Copy written without the argument in front of you drifts off it. ── */}
      <div className={styles.brief}>
        <div className={styles.briefCell}>
          <div className={styles.briefKick}>Raised as</div>
          <div className={styles.briefVal}>{opp.title}</div>
          <div className={styles.briefNote}>{opp.impact} {opp.note}</div>
        </div>
        <div className={styles.briefCell}>
          <div className={styles.briefKick}>Offer to land</div>
          <div className={styles.briefVal}>
            {offer ? offer.name : 'Premium travel benefit reminder'}
          </div>
          <div className={styles.briefNote}>
            {offer ? offer.desc : 'Bonus points against unclaimed benefit value'}
          </div>
        </div>
        <div className={styles.briefCell}>
          <div className={styles.briefKick}>Writing for</div>
          <div className={styles.briefVal}>{cohort.label}</div>
          <div className={styles.briefNote}>
            {fmtIN(cohort.count)} cardholders · {cohort.line}
          </div>
        </div>
      </div>

      <div className={`${styles.studio} ${available.length ? '' : styles.studioSolo}`}>
        {/* ── The artefact, and every control that acts on it ── */}
        <div className={styles.stage}>
          {campaign.legs.length > 1 && (
            <div className={styles.legs} role="tablist" aria-label="Campaign leg">
              {campaign.legs.map((l) => {
                const on = l.id === leg.id
                return (
                  <button
                    key={l.id}
                    type="button"
                    role="tab"
                    aria-selected={on}
                    className={`${styles.legTab} ${on ? styles.legTabOn : ''} ${styles[`leg_${l.kind}`]}`}
                    onClick={() => setLegTab(l.id)}
                  >
                    <span className={styles.legName}>{l.label}</span>
                    <span className={styles.legCount}>{fmtIN(l.audience)}</span>
                    <span className={styles.legWhat}>{l.campaign.name}</span>
                  </button>
                )
              })}
            </div>
          )}

          {/* ── Where this creative came from ── */}
          <div className={styles.source}>
            {usedDesign ? (
              <>
                <span className={styles.sourceOn}>
                  <PenLine size={12} strokeWidth={2} aria-hidden="true" />
                  <b>{usedDesign.name}</b>
                </span>
                <span className={styles.sourceWhat}>
                  {usedDesign.filled.length === chanIds.length
                    ? `All ${chanIds.length} channels`
                    : `${listChannels(usedDesign.filled)} only`}
                  {usedDesign.skipped.length
                    ? ` · ${listChannels(usedDesign.skipped)} as drafted`
                    : ''}
                  {usedDesign.edited ? ' · edited here' : ''}
                </span>
                {usedDesign.stats && !usedDesign.edited && (
                  <span className={styles.sourcePerf}>
                    <b>{(usedDesign.stats.clickPct * 100).toFixed(1)}%</b>
                    click on {fmtIN(usedDesign.stats.sends)}
                  </span>
                )}
                <span className={styles.sourceActs}>
                  <button type="button" className={styles.sourceBtn} onClick={() => setPicking(true)}>
                    Change
                  </button>
                  <button type="button" className={styles.sourceBtn} onClick={() => detachDesign(false)}>
                    <Undo2 size={11} strokeWidth={2} aria-hidden="true" />
                    Back to drafted
                  </button>
                </span>
              </>
            ) : (
              <>
                <span className={styles.sourceIdle}>Writing from the house templates.</span>
                <button type="button" className={styles.sourceCta} onClick={() => setPicking(true)}>
                  <PenLine size={12} strokeWidth={2} aria-hidden="true" />
                  Use a design from the studio
                </button>
              </>
            )}
          </div>

          <div className={styles.tabs} role="group" aria-label="Channel">
            {available.map((c) => (
              <button
                key={c.id}
                type="button"
                aria-pressed={channel === c.id}
                className={`${styles.tab} ${channel === c.id ? styles.tabOn : ''}`}
                onClick={() => setChannel(c.id)}
              >
                <ChannelIcon id={c.id} />
                {c.name}
                {changed(c.id) && <span className={styles.tabDot} title="Copy has been changed" />}
              </button>
            ))}
            {unwritten.length > 0 && (
              <span className={styles.spoken}>
                {unwritten.map((c) => c.name).join(' · ')} — spoken, not written
              </span>
            )}
          </div>

          {available.length === 0 ? (
            <div className={styles.nothing}>
              <div className={styles.nothingH}>Nothing to write for this campaign</div>
              <div className={styles.nothingS}>
                {unwritten.length
                  ? `${unwritten.map((c) => c.name).join(' and ')} carry no written template — they are briefed at launch, not drafted here.`
                  : 'Switch on a written channel in Campaign design to draft copy for it.'}
              </div>
            </div>
          ) : (
          <div className={`${styles.card} ${flash ? styles.cardFlash : ''}`}>
            <div className={styles.cardBar}>
              <div className={styles.cardId}>
                <span className={styles.cardIcon}><ChannelIcon id={channel} /></span>
                <span className={styles.cardName}>{channelName}</span>
                {changed(channel) && <span className={styles.editedTag}>Edited</span>}
              </div>

              <div className={styles.cardTools}>
                <div className={styles.seg} role="group" aria-label="How to render the template">
                  <button
                    type="button"
                    className={`${styles.segBtn} ${mode === 'template' ? styles.segOn : ''}`}
                    onClick={() => pickMode('template')}
                    aria-pressed={mode === 'template'}
                    title="Show the merge tokens"
                  >
                    <BracesIcon /> Template
                  </button>
                  <button
                    type="button"
                    className={`${styles.segBtn} ${mode === 'preview' ? styles.segOn : ''}`}
                    onClick={() => pickMode('preview')}
                    aria-pressed={mode === 'preview'}
                    title={`Merge it for ${person.name}`}
                  >
                    <EyeIcon /> Preview
                  </button>
                </div>

                <span className={styles.toolDiv} aria-hidden="true" />

                {/* Opening the editor is a quiet icon; closing it is a commit,
                    so it says so rather than leaving a bare tick to be read. */}
                {editing ? (
                  <button
                    type="button"
                    className={styles.saveBtn}
                    onClick={toggleEdit}
                    title="Save this copy and close the editor"
                  >
                    <CheckIcon /> Save
                  </button>
                ) : (
                  <button
                    type="button"
                    className={styles.iconBtn}
                    onClick={toggleEdit}
                    aria-label="Edit the copy by hand"
                    title="Edit by hand"
                  >
                    <PencilIcon />
                  </button>
                )}

                <button
                  type="button"
                  className={`${styles.rewriteBtn} ${rewriting ? styles.rewriteOn : ''}`}
                  onClick={() => setRewriting((v) => !v)}
                  aria-pressed={rewriting}
                  aria-expanded={rewriting}
                  title="Rewrite with the agent"
                >
                  <SparkIcon /> Rewrite
                </button>
              </div>
            </div>

            {editing && (
              <div className={styles.editNote}>
                Editing by hand — tokens like <code>{'{{first_name}}'}</code> stay put and resolve
                per cardholder when the campaign sends.
              </div>
            )}

            <div className={styles.cardBody}>{renderArtefact()}</div>

            {asGsm && asGsm.parts < parts.parts && (
              <div className={styles.encNote}>
                <b>{parts.offenders.join(' ')}</b> is outside GSM-7, so the whole message
                encodes as UCS-2 — {parts.perPart} units a segment instead of 160. It bills
                as <b>{parts.parts}</b> segments. Written with plain characters the same copy
                fits in <b>{asGsm.parts}</b>.
              </div>
            )}

            <div className={styles.cardFoot}>
              <div className={styles.meter}>
                {parts ? (
                  <>
                    <span className={styles.bar}>
                      <span
                        className={`${styles.barFill} ${parts.parts > 1 ? styles.barOver : ''}`}
                        style={{ width: `${Math.min(100, (parts.units / parts.capacity) * 100)}%` }}
                      />
                    </span>
                    <span className={styles.meterText}>
                      <b>{parts.units}</b> of {parts.capacity} units ·{' '}
                      <span className={parts.ucs2 ? styles.meterFlag : undefined}>
                        {parts.encoding}
                      </span>{' '}
                      · <b>{parts.parts}</b> {parts.parts === 1 ? 'segment' : 'segments'} billed
                    </span>
                  </>
                ) : cap ? (
                  <>
                    <span className={styles.bar}>
                      <span
                        className={`${styles.barFill} ${over ? styles.barOver : ''}`}
                        style={{ width: `${Math.min(100, (len / cap) * 100)}%` }}
                      />
                    </span>
                    <span className={`${styles.meterText} ${over ? styles.meterOver : ''}`}>
                      {len} / {cap} characters once merged
                      {over && ` · ${len - cap} over`}
                    </span>
                  </>
                ) : (
                  <span className={styles.meterText}>
                    {len} characters · {merged.trim().split(/\s+/).length} words once merged
                  </span>
                )}
              </div>

              <div className={styles.footActions}>
                {canUndo && (
                  <button type="button" className={styles.footBtn} onClick={revert}>
                    <UndoIcon /> Undo
                  </button>
                )}
                {anyChanged && (
                  <button type="button" className={styles.footBtn} onClick={resetAll}>
                    Reset all copy
                  </button>
                )}
              </div>
            </div>
          </div>
          )}

          {/* ── Rewrite: a dock under the artefact, never a modal over it.
                 The point is watching the copy above change. ── */}
          {rewriting && available.length > 0 && (
            <div className={styles.dock} role="region" aria-label="Rewrite with the agent">
              <div className={styles.dockBar}>
                <SparkIcon className={styles.dockSpark} />
                <span className={styles.dockKick}>Rewrite with the agent</span>
                <span className={styles.dockScope}>{channelName}</span>
                <button
                  type="button"
                  className={styles.dockClose}
                  onClick={() => setRewriting(false)}
                  aria-label="Close the rewrite bar"
                >
                  <CloseIcon />
                </button>
              </div>

              <div className={styles.tones}>
                <div className={styles.toneRec}>
                  <div className={styles.toneRecHead}>
                    <SparkIcon className={styles.toneRecIcon} />
                    <span className={styles.toneRecKick}>Agent suggests</span>
                    <span className={styles.toneRecPick}>{findTone(suggested.id).label}</span>
                  </div>
                  <div className={styles.toneRecWhy}>{suggested.why}</div>
                </div>

                <div className={styles.toneList}>
                  {TONES.map((t) => {
                    const on = currentTone === t.id
                    const rec = suggested.id === t.id
                    return (
                      <button
                        key={t.id}
                        type="button"
                        className={`${styles.tone} ${on ? styles.toneOn : ''} ${rec ? styles.toneRec2 : ''}`}
                        onClick={() => pickTone(t.id)}
                        aria-pressed={on}
                        title={t.note}
                      >
                        <span className={styles.toneLabel}>
                          {t.label}
                          {rec && <span className={styles.toneStar} aria-hidden="true">✦</span>}
                        </span>
                        <span className={styles.toneStats}>
                          <span className={styles.toneStat}>
                            <b>{(t.respondPct * 100).toFixed(1)}%</b> responded
                          </span>
                          <span className={styles.toneStat}>
                            <b className={t.favourPct >= 0.7 ? styles.toneGood : t.favourPct < 0.5 ? styles.toneBad : ''}>
                              {Math.round(t.favourPct * 100)}%
                            </b>{' '}
                            called it helpful
                          </span>
                          <span className={styles.toneN}>{t.campaigns} campaigns</span>
                        </span>
                      </button>
                    )
                  })}
                </div>
                <div className={styles.toneFoot}>
                  Measured across past retention campaigns on this book. The variant that gets the
                  most responses is not the one cardholders rate best — urgency wins the click and
                  costs goodwill.
                </div>
              </div>

              {(agent.messages.length > 0 || agent.pending) && (
                <div className={styles.log} ref={logRef}>
                  {agent.messages.map((m, i) => (
                    <div
                      key={i}
                      className={`${styles.msg} ${m.role === 'user' ? styles.msgUser : styles.msgAgent} ${m.miss ? styles.msgMiss : ''}`}
                    >
                      <span className={styles.msgWho}>{m.role === 'user' ? 'You' : 'Agent'}</span>
                      {m.text}
                    </div>
                  ))}
                  {agent.pending && (
                    <div className={`${styles.msg} ${styles.msgAgent}`}>
                      <span className={styles.msgWho}>Agent</span>
                      <span className={styles.typing} aria-label="Thinking"><i /><i /><i /></span>
                    </div>
                  )}
                </div>
              )}

              <form className={styles.composer} onSubmit={(e) => { e.preventDefault(); send(draft) }}>
                <input
                  ref={askRef}
                  className={styles.chatInput}
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  placeholder="Or say it — name a channel to change only that one…"
                  aria-label="Ask the agent to rewrite the copy"
                  disabled={agent.pending}
                />
                <button
                  type="submit"
                  className={styles.send}
                  disabled={!draft.trim() || agent.pending}
                  aria-label="Send"
                >
                  <ArrowIcon />
                </button>
              </form>

              {agent.messages.length === 0 && (
                <div className={styles.asks}>
                  {available.map((c) => ASK_FOR[c.id]).filter(Boolean).map((a) => (
                    <button
                      key={a}
                      type="button"
                      className={styles.ask}
                      onClick={() => send(a)}
                      disabled={agent.pending}
                    >
                      {a}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── What the tokens resolve to, and for whom ── */}
        {available.length > 0 && (
        <aside className={styles.rail} aria-label="Merge data">
          <div className={styles.railCard}>
            <div className={styles.railKick}>
              {mode === 'preview' ? 'Previewing as' : 'Merge data'}
            </div>

            <div className={styles.personRow}>
              <span className={styles.avatar} aria-hidden="true">
                {person.name.split(' ').map((w) => w[0]).join('')}
              </span>
              <div className={styles.personText}>
                <div className={styles.selectWrap}>
                  <select
                    className={styles.personSelect}
                    value={personId}
                    onChange={(e) => setPersonId(e.target.value)}
                    aria-label="Cardholder to merge against"
                  >
                    {cohort.members.map((m) => (
                      <option key={m.name} value={m.name}>{m.name}</option>
                    ))}
                  </select>
                  <ChevronIcon className={styles.selectChev} />
                </div>
                <div className={styles.personMeta}>{meta.slice(1).join(' · ')}</div>
              </div>
              <div className={styles.nav}>
                <button
                  type="button"
                  className={styles.navBtn}
                  onClick={() => setPersonId(stepPerson(cohort.members, personId, -1))}
                  aria-label="Previous cardholder"
                >
                  <ChevronIcon className={styles.navPrev} />
                </button>
                <button
                  type="button"
                  className={styles.navBtn}
                  onClick={() => setPersonId(stepPerson(cohort.members, personId, 1))}
                  aria-label="Next cardholder"
                >
                  <ChevronIcon className={styles.navNext} />
                </button>
              </div>
            </div>

            <div className={styles.tokens}>
              {Object.entries(fields).map(([k, v]) => (
                <button
                  key={k}
                  type="button"
                  className={`${styles.tokenRow} ${used.has(k) ? '' : styles.tokenIdle}`}
                  onClick={() => insertToken(k)}
                  title={`Insert {{${k}}} into the copy`}
                >
                  <span className={styles.tokenK}>{k}</span>
                  <span className={styles.tokenV}>{v}</span>
                  <span className={styles.tokenAdd} aria-hidden="true">+</span>
                </button>
              ))}
            </div>

            <div className={styles.railNote}>
              {mode === 'preview'
                ? 'Click a row to drop that token into the copy. Dimmed rows are ones this template does not use yet.'
                : (
                  <>
                    Click a row to drop that token into the copy. Switch the card to{' '}
                    <button type="button" className={styles.linkBtn} onClick={() => pickMode('preview')}>
                      Preview
                    </button>{' '}
                    to see these merged in.
                  </>
                )}
            </div>
          </div>

          {/* ── What the copy would fail on, checked while it is written
                 rather than after it is queued. ── */}
          <div className={styles.railCard}>
            <div className={styles.railKick}>
              Checks
              <span className={lint.clean ? styles.pillOk : lint.blocking ? styles.pillBad : styles.pillWarn}>
                {lint.clean ? 'Clear' : lint.blocking ? `${lint.blocking} blocking` : `${lint.warnings} to look at`}
              </span>
            </div>

            {lint.clean ? (
              <div className={styles.checkOk}>
                Nothing in this copy trips the claims list, the rate and eligibility
                rules, or the spam heuristics.
              </div>
            ) : (
              <ul className={styles.checks}>
                {lint.findings.map((f) => (
                  <li key={f.id} className={f.level === 'block' ? styles.checkBad : styles.checkWarn}>
                    <span className={styles.checkDot} aria-hidden="true" />
                    <span>
                      {f.say}
                      {f.hit && <em className={styles.checkHit}>&ldquo;{f.hit}&rdquo;</em>}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* ── The preview is one cardholder; the send is all of them. ── */}
          <div className={styles.railCard}>
            <div className={styles.railKick}>
              Across the cohort
              <span className={styles.railCount}>{audit.count} checked</span>
            </div>

            <dl className={styles.auditRows}>
              <div>
                <dt>Longest render</dt>
                <dd>
                  {audit.longest.length} chars
                  <span className={styles.auditWho}>{audit.longest.name}</span>
                </dd>
              </div>
              <div>
                <dt>Shortest</dt>
                <dd>
                  {audit.shortest.length} chars
                  <span className={styles.auditWho}>{audit.shortest.name}</span>
                </dd>
              </div>
              <div>
                <dt>Spread</dt>
                <dd>{audit.spread} chars</dd>
              </div>
              {channel === 'sms' && (
                <div>
                  <dt>Segments</dt>
                  <dd className={audit.partsVary ? styles.auditFlag : undefined}>
                    {audit.partsVary ? `${audit.minParts}–${audit.maxParts}` : audit.maxParts}
                  </dd>
                </div>
              )}
            </dl>

            {audit.over.length > 0 ? (
              <div className={styles.auditBad}>
                {audit.over.length} of {audit.count} go over the cap once merged —{' '}
                {audit.over.slice(0, 2).map((o) => o.name).join(', ')}
                {audit.over.length > 2 && ` and ${audit.over.length - 2} more`}.
              </div>
            ) : audit.partsVary ? (
              <div className={styles.auditNote}>
                Segment count changes with the cardholder, so the send cost does too.
              </div>
            ) : audit.emptyTokens.length > 0 ? (
              <div className={styles.auditBad}>
                {audit.emptyTokens.join(', ')} resolves to nothing for somebody in this cohort.
              </div>
            ) : (
              <div className={styles.auditNote}>
                Every cardholder renders inside the cap with no empty tokens.
              </div>
            )}
          </div>
        </aside>
        )}
      </div>

      <StepActions>
        <Button variant="secondary" onClick={flow.goBack}>← Campaign design</Button>
        <Button variant="primary" size="lg" className={stepStyles.actionsRight} onClick={() => flow.goStep(5)}>
          Send for approval →
        </Button>
      </StepActions>

      {picking && (
        <DesignPicker
          channels={chanIds}
          current={usedDesign?.id}
          onPick={useSavedDesign}
          onClose={() => setPicking(false)}
        />
      )}
    </div>
  )
}

function stepPerson(members, current, dir) {
  const i = members.findIndex((m) => m.name === current)
  return members[(i + dir + members.length) % members.length].name
}

/** A textarea that keeps the artefact's own typography and grows with the copy. */
function Grow({ className, value, onChange, field, onCaret, ...rest }) {
  const ref = useRef(null)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${el.scrollHeight}px`
  }, [value])

  // Clicking a token in the rail blurs this field first, so the caret has to
  // be recorded as it moves rather than read back when the token is clicked.
  const mark = () => {
    const el = ref.current
    if (el && onCaret) onCaret(field, el.selectionStart, el.selectionEnd)
  }

  return (
    <textarea
      ref={ref}
      rows={1}
      className={className}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      {...rest}
      onFocus={mark}
      onClick={mark}
      onKeyUp={mark}
      onSelect={mark}
    />
  )
}

/** In template mode the merge tokens are shown as chips so they are unmissable. */
/* A handset renders a URL as a tappable blue link, so the preview does too.
   Split and test use separate patterns — a /g regex carries lastIndex
   between .test() calls and would skip every other match. */
const URL_SPLIT = /((?:https?:\/\/|www\.)\S+|[a-z0-9-]+\.[a-z]{2,}\/\S*)/gi
const URL_ONE = /^(?:(?:https?:\/\/|www\.)\S+|[a-z0-9-]+\.[a-z]{2,}\/\S*)$/i

function linkify(text, s) {
  return String(text).split(URL_SPLIT).map((part, i) => (
    URL_ONE.test(part)
      ? <span key={i} className={s.smsLink}>{part}</span>
      : <span key={i}>{part}</span>
  ))
}

function markup(text, mode, s) {
  if (mode === 'preview') return text
  return text.split(/(\{\{\w+\}\})/g).map((part, i) =>
    /^\{\{\w+\}\}$/.test(part)
      ? <span key={i} className={s.token}>{part.slice(2, -2)}</span>
      : <span key={i}>{part}</span>,
  )
}

/* ── Icons ────────────────────────────────────────────────────────────── */
const stroke = {
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.7,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
}

function ChannelIcon({ id }) {
  if (id === 'email') {
    return (
      <svg width="14" height="14" viewBox="0 0 24 24" {...stroke} aria-hidden="true">
        <rect x="2.5" y="5" width="19" height="14" rx="2.5" />
        <path d="M3 7l9 6 9-6" />
      </svg>
    )
  }
  if (id === 'wa') {
    return (
      <svg width="14" height="14" viewBox="0 0 24 24" {...stroke} aria-hidden="true">
        <path d="M21 11.5a8.5 8.5 0 0 1-12.6 7.4L3 20.5l1.7-5.2A8.5 8.5 0 1 1 21 11.5z" />
      </svg>
    )
  }
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" {...stroke} aria-hidden="true">
      <path d="M20.5 12.5c0 3.9-3.8 7-8.5 7a9.8 9.8 0 0 1-2.6-.35L4 21l1.3-3.4A6.6 6.6 0 0 1 3.5 12.5c0-3.9 3.8-7 8.5-7s8.5 3.1 8.5 7z" />
    </svg>
  )
}

function BracesIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" {...stroke} aria-hidden="true">
      <path d="M9 4c-2 0-2.5 1-2.5 2.6v2.2C6.5 10.4 5.6 11 4 12c1.6 1 2.5 1.6 2.5 3.2v2.2C6.5 19 7 20 9 20" />
      <path d="M15 4c2 0 2.5 1 2.5 2.6v2.2c0 1.6.9 2.2 2.5 3.2-1.6 1-2.5 1.6-2.5 3.2v2.2C17.5 19 17 20 15 20" />
    </svg>
  )
}

function EyeIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" {...stroke} aria-hidden="true">
      <path d="M2 12s3.6-6 10-6 10 6 10 6-3.6 6-10 6-10-6-10-6z" />
      <circle cx="12" cy="12" r="2.6" />
    </svg>
  )
}

function PencilIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" {...stroke} aria-hidden="true">
      <path d="M16.5 3.9a2.1 2.1 0 0 1 3 3L8.4 18h-3v-3z" />
      <path d="M14.5 6l3 3" />
    </svg>
  )
}

function CheckIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" {...stroke} strokeWidth="2.2" aria-hidden="true">
      <path d="M5 12.5l4.5 4.5L19 7" />
    </svg>
  )
}

function CloseIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" {...stroke} strokeWidth="2" aria-hidden="true">
      <path d="M6 6l12 12M18 6L6 18" />
    </svg>
  )
}

function UndoIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" {...stroke} aria-hidden="true">
      <path d="M4 9h10a5.5 5.5 0 1 1 0 11H9" />
      <path d="M7.5 5.5L4 9l3.5 3.5" />
    </svg>
  )
}

function ArrowIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" {...stroke} strokeWidth="2" aria-hidden="true">
      <path d="M4 12h15" />
      <path d="M13.5 6.5L19.5 12l-6 5.5" />
    </svg>
  )
}

function ChevronIcon({ className = '' }) {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" {...stroke} strokeWidth="2.2" className={className} aria-hidden="true">
      <path d="M6 9l6 6 6-6" />
    </svg>
  )
}

/* Same two-star mark the agent rail uses, so "agent" reads the same everywhere. */

function Writing() {
  return (
    <div className={stepStyles.wrap}>
      <div className={styles.writing}>
        <Spinner />
        <div>
          <div className={styles.writingH}>Writing from the approved templates</div>
          <div className={styles.writingS}>
            Drafting one template per channel against the offer and this cohort&apos;s history…
          </div>
        </div>
      </div>
    </div>
  )
}
