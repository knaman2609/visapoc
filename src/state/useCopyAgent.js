import { useCallback, useState } from 'react'
import { CHANNEL_LIMIT, TEMPLATES, TONES } from '../data/templates.js'

const CHANNEL_NAME = { email: 'the email', wa: 'the WhatsApp message', sms: 'the SMS' }

/**
 * Stand-in for the model call that rewrites campaign copy. The instruction is
 * matched to an authored variant rather than generated — swap `readCopyIntent`
 * for a completion when the endpoint exists; the surrounding loop is unchanged.
 */
const RULES = [
  { re: /\b(shorten|shorter|short|trim|condense|concise|cut it down|cut it|tighten|brief|briefer|less text|reduce)\b/, tone: 'short',
    say: 'Trimmed it back to the essentials' },
  { re: /\b(warmer|warm|friendly|friendlier|personal|personable|human|kinder|softer|nicer)\b/, tone: 'warm',
    say: 'Warmed the tone and led with the tenure' },
  { re: /\b(urgent|urgency|deadline|expiry|expires|expiring|scarcity|push harder|stronger|punchier)\b/, tone: 'urgent',
    say: 'Led with the expiry date to add urgency' },
  { re: /\b(formal|professional|corporate|serious|compliance|conservative)\b/, tone: 'formal',
    say: 'Made it formal enough for a compliance read' },
  { re: /\b(reset|original|revert|as drafted|undo|start again)\b/, tone: 'base',
    say: 'Put it back to the drafted copy' },
]

const CHANNEL_RE = {
  email: /\b(e-?mail)\b/,
  wa:    /\b(whats-?app|wa)\b/,
  sms:   /\b(sms|text message|text)\b/,
}

const MISS = 'I can restyle the copy — try “make it shorter”, “warmer”, “more urgent”, ' +
  '“more formal”, or “reset”. Name a channel to change just that one.'

export function readCopyIntent(text) {
  const t = text.toLowerCase()
  const rule = RULES.find((r) => r.re.test(t))
  if (!rule) return null

  const channels = Object.entries(CHANNEL_RE)
    .filter(([, re]) => re.test(t))
    .map(([id]) => id)

  return { tone: rule.tone, say: rule.say, channels }
}

export function useCopyAgent({ channel, enabled, applyTone }) {
  const [messages, setMessages] = useState([])
  const [pending, setPending] = useState(false)

  const ask = useCallback((text) => {
    const q = text.trim()
    if (!q || pending) return

    setMessages((m) => [...m, { role: 'user', text: q }])
    setPending(true)

    setTimeout(() => {
      const intent = readCopyIntent(q)

      if (!intent) {
        setMessages((m) => [...m, { role: 'agent', text: MISS, miss: true }])
        setPending(false)
        return
      }

      // No channel named means "the one I am looking at".
      const targets = (intent.channels.length ? intent.channels : [channel]).filter((c) => enabled[c])
      if (!targets.length) {
        setMessages((m) => [...m, {
          role: 'agent', miss: true,
          text: 'That channel is not in this campaign. Turn it on in Campaign design first.',
        }])
        setPending(false)
        return
      }

      targets.forEach((c) => applyTone(c, intent.tone))

      const where = targets.length === Object.keys(CHANNEL_NAME).length
        ? 'every channel'
        : targets.map((c) => CHANNEL_NAME[c]).join(' and ')

      const label = TONES.find((t) => t.id === intent.tone)?.label
      const overLimit = targets.filter((c) => {
        const cap = CHANNEL_LIMIT[c]
        return cap && TEMPLATES[c][intent.tone].body.length > cap
      })

      const warn = overLimit.length
        ? ` Heads up — the ${overLimit.join(' and ')} copy is over its character cap once the tokens resolve.`
        : ''

      setMessages((m) => [...m, {
        role: 'agent',
        text: `${intent.say} on ${where}. Applied the “${label}” variant.${warn}`,
      }])
      setPending(false)
    }, 560)
  }, [channel, enabled, applyTone, pending])

  return { messages, pending, ask, reset: useCallback(() => setMessages([]), []) }
}
