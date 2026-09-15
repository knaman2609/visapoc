import { blockText } from './blocks.js'

/**
 * The join between the studio and the campaign flow.
 *
 * The studio makes documents; the flow sends messages. They are different
 * shapes on purpose — a document is a stack of blocks with a brand kit behind
 * it, a send is three strings per channel — so something has to translate,
 * and it should be one function rather than a guess at each call site.
 *
 * The direction that matters is studio → flow: an operator designs a creative
 * once, sees how it lands on nine surfaces, and then reuses it on any campaign
 * that needs it. Reuse is also the only way the click rates a saved design
 * carries mean anything.
 */

/** The email body as the flow renders it: paragraphs, not the whole stack. */
function emailBody(blocks = []) {
  const paras = blocks.filter((b) => b.type === 'text' && String(b.text || '').trim())
  if (paras.length) return paras.map((b) => b.text).join('\n\n')
  // Nothing written as a paragraph — fall back to whatever else carries copy,
  // minus the heading, which the subject line is already saying.
  const rest = blocks
    .filter((b) => !['heading', 'logo', 'legal', 'button', 'link'].includes(b.type))
    .map(blockText)
    .filter(Boolean)
  return rest.join('\n\n')
}

const firstText = (blocks, type) => blocks.find((b) => b.type === type && String(b.text || '').trim())

/** What a design has to say on a channel, or null if it says nothing. */
export function channelCopy(doc, channel) {
  if (!doc) return null

  if (channel === 'email') {
    const t = doc.email || {}
    const blocks = t.blocks || []
    const subject = String(t.subject || '').trim()
    const body = emailBody(blocks)
    if (!subject && !body) return null
    return {
      subject: t.subject || '',
      body,
      cta: firstText(blocks, 'button')?.text || 'See your benefits',
    }
  }

  if (channel === 'wa') {
    const t = doc.wa || {}
    // A template's header and footer are separate fields in the studio and
    // part of one bubble here, which is what the cardholder actually reads.
    const parts = [t.header, t.body, t.footer].map((x) => String(x || '').trim()).filter(Boolean)
    return parts.length ? { body: parts.join('\n\n') } : null
  }

  if (channel === 'sms') {
    const body = String(doc.sms?.body || '').trim()
    return body ? { body: doc.sms.body } : null
  }

  // The owned surfaces have no counterpart in the studio yet, so a design
  // never silently overwrites copy it did not author.
  return null
}

/** The channels a design can actually fill. */
export const designCovers = (doc) => ['email', 'wa', 'sms']
  .filter((c) => channelCopy(doc, c) !== null)

/**
 * Apply a design over the copy for one leg.
 *
 * Channels the design has nothing to say on keep the copy they had. Returns
 * both the new copy and what changed, because "it replaced your SMS" is
 * something the operator has to be told rather than discover.
 */
export function applyDesign(copy, doc, channels) {
  const next = { ...copy }
  const filled = []
  const skipped = []
  for (const id of channels) {
    const said = channelCopy(doc, id)
    if (said) {
      next[id] = { ...next[id], ...said }
      filled.push(id)
    } else {
      skipped.push(id)
    }
  }
  return { copy: next, filled, skipped }
}

/** Whether a design is worth offering for the channels this campaign uses. */
export const fitsCampaign = (doc, channels) => {
  const covers = designCovers(doc)
  return channels.some((c) => covers.includes(c))
}

export const CHANNEL_NAME = { email: 'Email', wa: 'WhatsApp', sms: 'SMS' }

/** "Email and SMS", the way a person lists two things. */
export const listChannels = (ids) => {
  const names = ids.map((id) => CHANNEL_NAME[id] || id)
  if (names.length <= 1) return names[0] || ''
  return `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}`
}
