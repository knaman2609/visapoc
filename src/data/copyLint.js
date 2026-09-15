import { CHANNEL_LIMIT, mergeFields, render } from './templates.js'

/* ── SMS segmentation ───────────────────────────────────────────────────
   A character counter that stops at 160 is wrong often enough to cost real
   money. One curly quote or one emoji drops the whole message from GSM-7 to
   UCS-2 and the segment size falls from 160 to 70, so a message that looked
   like one part bills as three. This follows 3GPP TS 23.038.
------------------------------------------------------------------------ */

// The GSM 03.38 basic set. Everything here is one septet.
const GSM_BASIC =
  '@£$¥èéùìòÇ\nØø\rÅåΔ_ΦΓΛΩΠΨΣΘΞÆæßÉ !"#¤%&\'()*+,-./0123456789:;<=>?' +
  '¡ABCDEFGHIJKLMNOPQRSTUVWXYZÄÖÑÜ§¿abcdefghijklmnopqrstuvwxyzäöñüà'

// The extension table. Each of these is escaped, so it costs two septets.
const GSM_EXTENDED = '^{}\\[~]|€'

const BASIC = new Set(GSM_BASIC)
const EXTENDED = new Set(GSM_EXTENDED)

/** Characters that force the whole message onto UCS-2, in the order found. */
export function nonGsmChars(text) {
  const out = []
  for (const ch of String(text)) {
    if (!BASIC.has(ch) && !EXTENDED.has(ch) && !out.includes(ch)) out.push(ch)
  }
  return out
}

/**
 * How a message actually bills: encoding, units used, and segments.
 * Returns `perPart` so a meter can show the boundary the operator is near.
 */
export function smsParts(text) {
  const s = String(text)
  const offenders = nonGsmChars(s)
  const ucs2 = offenders.length > 0

  let units = 0
  if (ucs2) {
    // UTF-16 code units — an emoji is a surrogate pair and costs two.
    units = s.length
  } else {
    for (const ch of s) units += EXTENDED.has(ch) ? 2 : 1
  }

  const single = ucs2 ? 70 : 160
  const multi = ucs2 ? 67 : 153
  const parts = units === 0 ? 1 : units <= single ? 1 : Math.ceil(units / multi)
  const capacity = parts === 1 ? single : parts * multi

  return {
    encoding: ucs2 ? 'UCS-2' : 'GSM-7',
    ucs2,
    units,
    parts,
    capacity,
    perPart: parts === 1 ? single : multi,
    remaining: capacity - units,
    offenders,
  }
}

/* ── Compliance ─────────────────────────────────────────────────────────
   The launch step promises no claim outside the approved list and no limit,
   rate or eligibility promise in copy. These are those promises, checked
   while the copy is being written rather than after it is queued.
------------------------------------------------------------------------ */

const RULES = [
  { id: 'guarantee', level: 'block',
    re: /\b(guarantee[ds]?|risk[- ]free|assured|no risk|100% safe)\b/i,
    say: 'Promises an outcome the product cannot guarantee' },
  { id: 'eligibility', level: 'block',
    re: /\b(pre[- ]?approved|pre[- ]?qualified|instant approval|you qualify|you are eligible|guaranteed approval)\b/i,
    say: 'Implies an eligibility decision that has not been made' },
  { id: 'rate', level: 'block',
    re: /\b(\d+(\.\d+)?\s?% (interest|apr|p\.?a\.?)|no interest|zero interest|lifetime free|free for life)\b/i,
    say: 'States a rate, limit or fee term that belongs in the schedule of charges' },
  { id: 'unlimited', level: 'warn',
    re: /\b(unlimited|infinite rewards|never expires?)\b/i,
    say: 'Reads as an unlimited benefit — the offer is capped' },
  { id: 'urgency', level: 'warn',
    re: /\b(act now|hurry|last chance|don'?t miss out|limited time only)\b/i,
    say: 'Pressure language — reads as a hard sell to a premium cohort' },
  { id: 'shout', level: 'warn',
    re: /\b[A-Z]{5,}\b/,
    say: 'Shouted word — also a common spam-filter trigger' },
  { id: 'punct', level: 'warn',
    re: /[!?]{2,}/,
    say: 'Repeated punctuation — reads as spam to filters and to people' },
]

/** SMS in India must carry a way out and a registered header. */
const SMS_OPT_OUT = /\b(stop|opt[- ]?out|unsub)\b/i

export function lintCopy(text, channel) {
  const s = String(text || '')
  const found = RULES
    .filter((r) => r.re.test(s))
    .map((r) => ({ id: r.id, level: r.level, say: r.say, hit: s.match(r.re)?.[0] }))

  // A promotional SMS without an exit is a compliance failure, not a style note.
  if (channel === 'sms' && s && !SMS_OPT_OUT.test(s)) {
    found.push({
      id: 'optout', level: 'warn',
      say: 'No opt-out in the message — carried by the registered header, worth confirming',
    })
  }

  return {
    findings: found,
    blocking: found.filter((f) => f.level === 'block').length,
    warnings: found.filter((f) => f.level === 'warn').length,
    clean: found.length === 0,
  }
}

/* ── Merge audit ────────────────────────────────────────────────────────
   Previewing one cardholder hides the one whose name, city or benefit value
   pushes the message over a segment boundary. This renders the template for
   every member of the cohort and reports the extremes.
------------------------------------------------------------------------ */

export function mergeAudit(body, channel, cohort) {
  const cap = CHANNEL_LIMIT[channel]
  const rows = cohort.members.map((m) => {
    const text = render(body, mergeFields(m, cohort))
    const sms = channel === 'sms' ? smsParts(text) : null
    return {
      name: m.name,
      length: text.length,
      parts: sms ? sms.parts : null,
      over: cap ? text.length > cap : false,
    }
  })

  const byLength = [...rows].sort((a, b) => b.length - a.length)
  const over = rows.filter((r) => r.over)
  const maxParts = rows.reduce((n, r) => Math.max(n, r.parts || 1), 1)
  const minParts = rows.reduce((n, r) => Math.min(n, r.parts || 1), 99)

  // A token that resolves to nothing for somebody leaves a hole in the copy.
  const usedTokens = [...String(body).matchAll(/\{\{(\w+)\}\}/g)].map((m) => m[1])
  const empty = usedTokens.filter((t) => cohort.members.some((m) => {
    const v = mergeFields(m, cohort)[t]
    return v == null || String(v).trim() === ''
  }))

  return {
    count: rows.length,
    longest: byLength[0],
    shortest: byLength[byLength.length - 1],
    over,
    spread: byLength[0].length - byLength[byLength.length - 1].length,
    // Segments varying across the cohort means the bill varies with the name.
    partsVary: channel === 'sms' && maxParts !== minParts,
    maxParts,
    minParts,
    emptyTokens: [...new Set(empty)],
  }
}
