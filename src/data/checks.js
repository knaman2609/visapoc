import { blockText, blocksText } from './blocks.js'
import { lintCopy, smsParts } from './copyLint.js'
import { SAMPLE } from './blocks.js'
import { findPalette } from './brandKit.js'
import { render } from './templates.js'

/**
 * Preflight.
 *
 * Everything here is a mistake somebody has actually shipped: a subject that
 * reads fine in the composer and gets cut at "…{{points}} bonus po" on a
 * phone, a WhatsApp template that fails Meta review because it opens on a
 * variable, an SMS that quietly bills three segments because of one curly
 * quote. The panel is not a score — it is a list of things that will go wrong,
 * each with the surface it goes wrong on.
 */

/* ── colour maths, for the one check that needs it ─────────────────── */
const srgb = (hex) => {
  const h = hex.replace('#', '')
  const n = h.length === 3 ? h.split('').map((c) => c + c).join('') : h
  return [0, 2, 4].map((i) => parseInt(n.slice(i, i + 2), 16) / 255)
}
const lum = (hex) => {
  const [r, g, b] = srgb(hex).map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4))
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}
export function contrast(a, b) {
  const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p)
  return (x + 0.05) / (y + 0.05)
}

const LEVELS = { fail: 3, warn: 2, info: 1, pass: 0 }
export const worst = (list) => list.reduce(
  (n, c) => (LEVELS[c.level] > LEVELS[n] ? c.level : n), 'pass',
)

const ok = (id, label, detail) => ({ id, level: 'pass', label, detail })
const warn = (id, label, detail, where) => ({ id, level: 'warn', label, detail, where })
const fail = (id, label, detail, where) => ({ id, level: 'fail', label, detail, where })

/** Malformed merge tokens — a `{{first_name}` ships as literal text. */
function tokenChecks(text) {
  const out = []
  const known = Object.keys(SAMPLE)
  const used = [...String(text).matchAll(/\{\{(\w+)\}\}/g)].map((m) => m[1])
  const unknown = [...new Set(used.filter((t) => !known.includes(t)))]
  // Take the well-formed tokens out first. Anything with a brace still in it
  // is genuinely malformed — matching braces directly finds the second `{` of
  // every correct `{{token}}` and reports it as broken.
  const rest = String(text).replace(/\{\{\w+\}\}/g, '')
  const stray = rest.match(/\S*[{}]\S*/)

  if (stray) {
    out.push(fail('token-broken', 'A merge token is malformed',
      `${stray[0].slice(0, 28)} will ship as literal text.`))
  }
  if (unknown.length) {
    out.push(fail('token-unknown', 'Unknown merge token',
      `${unknown.map((t) => `{{${t}}}`).join(', ')} resolves to nothing for every cardholder.`))
  }
  if (!used.length) {
    out.push(warn('token-none', 'Nothing is personalised',
      'No merge tokens in the copy. Personalised sends on this portfolio open about 9 points higher.'))
  }
  return out
}

/* ── Email ───────────────────────────────────────────────────────────── */
function emailChecks(tpl, brand) {
  const out = []
  const blocks = tpl.blocks || []
  const subject = tpl.subject || ''
  const merged = render(subject, SAMPLE)
  const body = blocksText(blocks)

  // Subject truncation, said per client rather than as one number.
  if (!subject.trim()) {
    out.push(fail('subject-empty', 'No subject line', 'The message cannot be sent without one.'))
  } else if (merged.length > 60) {
    out.push(warn('subject-long', `Subject runs ${merged.length} characters`,
      `Gmail for iOS stops at 33 — it would show “${merged.slice(0, 33).trimEnd()}…”.`,
      'gmail-app'))
  } else if (merged.length > 33) {
    out.push(warn('subject-cut', 'Subject is cut on a phone',
      `${merged.length} characters. Gmail for iOS shows the first 33: “${merged.slice(0, 33).trimEnd()}…”.`,
      'gmail-app'))
  } else {
    out.push(ok('subject-fit', 'Subject fits every inbox', `${merged.length} characters, uncut on all four clients.`))
  }

  // The preheader is copy nobody writes and every inbox shows.
  const pre = (tpl.preheader || '').trim()
  if (!pre) {
    out.push(warn('preheader', 'No preheader',
      'Gmail falls back to the first line of the body — usually the logo alt text or a legal line.',
      'gmail-app'))
  } else if (render(pre, SAMPLE).length > 90) {
    out.push(warn('preheader-long', 'Preheader runs long',
      `${render(pre, SAMPLE).length} characters; about 40 survive on a phone.`, 'gmail-app'))
  } else {
    out.push(ok('preheader-ok', 'Preheader set', `${render(pre, SAMPLE).length} characters.`))
  }

  // Structure.
  if (!blocks.some((b) => b.type === 'heading')) {
    out.push(warn('no-heading', 'No heading block',
      'The subject is doing all the work — nothing restates it once the message is open.'))
  }
  const cta = blocks.filter((b) => b.type === 'button')
  if (!cta.length) {
    out.push(fail('no-cta', 'No button', 'There is nothing to click. Click-through cannot be measured.'))
  } else if (cta.length > 2) {
    out.push(warn('many-cta', `${cta.length} buttons`,
      'More than two actions splits the click. One primary, at most one secondary.'))
  } else {
    out.push(ok('cta-ok', 'One clear action', cta.map((b) => `“${render(b.text, SAMPLE)}”`).join(' · ')))
  }

  const images = blocks.filter((b) => b.type === 'image')
  const noAlt = images.filter((b) => !String(b.alt || '').trim())
  if (noAlt.length) {
    out.push(fail('alt', `${noAlt.length} image${noAlt.length > 1 ? 's' : ''} without alt text`,
      'Gmail blocks images by default on first send — with no alt text that area is blank.', 'gmail-web'))
  } else if (images.length) {
    out.push(ok('alt-ok', 'Every image has alt text', 'Survives image blocking on first open.'))
  }

  if (!blocks.some((b) => b.type === 'legal')) {
    out.push(fail('legal', 'No legal line',
      'A funded offer has to carry its terms in the creative, not only on the landing page.'))
  }

  // Weight — a long email is not a failure, but it is a decision.
  const words = render(body, SAMPLE).split(/\s+/).filter(Boolean).length
  if (words > 180) {
    out.push(warn('length', `${words} words`,
      'Past about 150, read-through on retention sends falls off sharply.'))
  } else {
    out.push(ok('length-ok', `${words} words`, 'Inside the range that gets read through.'))
  }

  // Contrast on the one thing that has to be clicked.
  const p = findPalette(brand?.palette)
  const c = contrast(p.brand, '#ffffff')
  if (c < 4.5) {
    out.push(fail('contrast', 'Button text fails contrast',
      `White on ${p.label} is ${c.toFixed(1)}:1. AA needs 4.5:1.`))
  } else {
    out.push(ok('contrast-ok', 'Button clears AA', `White on ${p.label} is ${c.toFixed(1)}:1.`))
  }

  // Gmail's dark theme darkens the ground and leaves the sender's brand
  // colour where it was, so a near-black button lands on a near-black page.
  const onDark = contrast(p.brand, '#1f1f1f')
  if (onDark < 1.6) {
    out.push(fail('contrast-dark', 'The button disappears in dark mode',
      `${p.label} against Gmail's dark ground is ${onDark.toFixed(1)}:1 — the button `
      + 'and the page are the same colour. A third of opens are in dark mode on '
      + 'this portfolio.', 'gmail-open'))
  } else if (onDark < 3) {
    // A control that is visible but under the 3:1 floor is a defect worth
    // fixing, not a reason to hold the send — "blocking" has to stay reserved
    // for the things an operator can and must act on before it goes out.
    out.push(warn('contrast-dark', 'The button barely separates in dark mode',
      `${p.label} against Gmail's dark ground is ${onDark.toFixed(1)}:1. A control `
      + 'needs 3:1 to read as one, and a third of opens here are in dark mode.',
    'gmail-open'))
  } else if (onDark < 4.5) {
    out.push(warn('contrast-dark', 'The button is weak in dark mode',
      `${p.label} against Gmail's dark ground is ${onDark.toFixed(1)}:1.`, 'gmail-open'))
  }

  out.push(...tokenChecks(`${subject} ${pre} ${body}`))
  return out
}

/* ── WhatsApp: Meta reviews these before they can be sent ───────────── */
function waChecks(tpl) {
  const out = []
  const body = tpl.body || ''
  const merged = render(body, SAMPLE)
  const buttons = tpl.buttons || []

  if (merged.length > 1024) {
    out.push(fail('wa-length', 'Body over the ceiling',
      `${merged.length} of 1,024 characters.`))
  } else {
    out.push(ok('wa-length-ok', `${merged.length} of 1,024 characters`, 'Inside the template limit.'))
  }

  // Meta rejects a template whose body opens or closes on a variable.
  const trimmed = body.trim()
  if (/^\{\{\w+\}\}/.test(trimmed) || /\{\{\w+\}\}$/.test(trimmed)) {
    out.push(fail('wa-var-edge', 'Template opens or closes on a variable',
      'Meta rejects this at review. Put a word either side of the token.'))
  }
  if (/\{\{\w+\}\}\s*\{\{\w+\}\}/.test(body)) {
    out.push(fail('wa-var-adjacent', 'Two variables with nothing between them',
      'Also rejected at template review.'))
  }

  const ctas = buttons.filter((b) => b.kind !== 'quick')
  const quicks = buttons.filter((b) => b.kind === 'quick')
  if (ctas.length > 2) {
    out.push(fail('wa-cta-count', 'More than two call-to-action buttons',
      'A template carries at most one URL button and one call button.'))
  }
  if (quicks.length > 3) {
    out.push(fail('wa-quick-count', 'More than three quick replies', 'Three is the ceiling.'))
  }
  const longLabel = buttons.find((b) => render(b.label, SAMPLE).length > 20)
  if (longLabel) {
    out.push(fail('wa-label', 'Button label over 20 characters',
      `“${longLabel.label}” is ${render(longLabel.label, SAMPLE).length}.`))
  } else if (buttons.length) {
    out.push(ok('wa-buttons-ok', `${buttons.length} button${buttons.length > 1 ? 's' : ''}`,
      buttons.map((b) => `“${b.label}”`).join(' · ')))
  } else {
    out.push(warn('wa-no-button', 'No buttons',
      'A template without a button relies on the cardholder typing back.'))
  }

  if (render(tpl.footer || '', SAMPLE).length > 60) {
    out.push(fail('wa-footer', 'Footer over 60 characters', 'The footer is capped at 60.'))
  }
  if (render(tpl.header || '', SAMPLE).length > 60) {
    out.push(fail('wa-header', 'Header over 60 characters', 'The text header is capped at 60.'))
  }
  if (!/stop|opt[- ]?out/i.test(`${body} ${tpl.footer || ''}`)) {
    out.push(warn('wa-optout', 'No way out in the message',
      'Marketing templates need an opt-out path; the footer is where it usually sits.'))
  }

  out.push(...tokenChecks(`${tpl.header || ''} ${body} ${tpl.footer || ''}`))
  return out
}

/* ── SMS: the one channel where a character costs money ─────────────── */
function smsChecks(tpl) {
  const out = []
  const merged = render(tpl.body || '', SAMPLE)
  const p = smsParts(merged)

  if (p.parts === 1) {
    out.push(ok('sms-parts', 'One segment', `${p.units} of ${p.capacity} units, ${p.encoding}.`))
  } else {
    out.push(warn('sms-parts', `${p.parts} segments`,
      `${p.units} of ${p.capacity} units on ${p.encoding} — every send bills ${p.parts}×.`))
  }
  if (p.ucs2) {
    out.push(fail('sms-encoding', 'Message dropped to UCS-2',
      `${p.offenders.slice(0, 4).join(' ')} forced it off GSM-7. Segment size falls from 160 to 70.`))
  }
  if (!/(https?:\/\/|www\.|[a-z0-9-]+\.[a-z]{2,}\/)/i.test(merged)) {
    out.push(warn('sms-link', 'No link', 'Nothing to click means nothing to attribute.'))
  }
  out.push(...tokenChecks(tpl.body || ''))
  return out
}

/**
 * Everything wrong with the current channel of a document, worst first.
 * Compliance findings come from the same rules the launch step enforces, so
 * a design that passes here cannot fail at approval on wording.
 */
export function runChecks(doc, channel, brand) {
  const tpl = doc[channel] || {}
  const base = channel === 'email' ? emailChecks(tpl, brand)
    : channel === 'wa' ? waChecks(tpl)
      : smsChecks(tpl)

  const text = channel === 'email'
    ? `${tpl.subject || ''}\n${blocksText(tpl.blocks || [])}`
    : `${tpl.header || ''}\n${tpl.body || ''}`
  const lint = lintCopy(render(text, SAMPLE), channel)
  const compliance = lint.findings.map((f) => ({
    id: `lint-${f.id}`,
    level: f.level === 'block' ? 'fail' : 'warn',
    label: f.say,
    detail: f.hit ? `Found “${f.hit}”.` : 'Flagged by the pre-launch copy rules.',
  }))

  const all = [...base, ...compliance]
  return {
    items: all.sort((a, b) => LEVELS[b.level] - LEVELS[a.level]),
    fails: all.filter((c) => c.level === 'fail').length,
    warns: all.filter((c) => c.level === 'warn').length,
    passes: all.filter((c) => c.level === 'pass').length,
    level: worst(all),
  }
}

/** One-line block summary for the layers rail. */
export const summarise = (b) => blockText(b).split('\n')[0] || ''
