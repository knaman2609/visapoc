/**
 * Selectors for the RM's own book — the customer queue on My performance.
 *
 * Reads CUSTOMERS and the `sent` state from AppContext, so the figures move as
 * the RM actually works the queue rather than sitting static.
 */

const parseValue = (v) => Number(String(v).replace(/[^\d.]/g, '')) || 0

/** The RM's book, summarised by what is open against what has been actioned. */
export function queueSummary(customers, sent = {}) {
  const open = customers.filter((c) => !sent[c.id])
  const actioned = customers.filter((c) => !!sent[c.id])
  const valueOf = (list) => list.reduce((n, c) => n + parseValue(c.value), 0)

  const byCategory = [...new Set(customers.map((c) => c.cat))].map((cat) => {
    const rows = customers.filter((c) => c.cat === cat)
    return {
      cat,
      count: rows.length,
      open: rows.filter((c) => !sent[c.id]).length,
      value: valueOf(rows),
      avgScore: Math.round(rows.reduce((n, c) => n + c.score, 0) / rows.length),
      avgLikelihood: Math.round(rows.reduce((n, c) => n + parseValue(c.likelihood), 0) / rows.length),
    }
  }).sort((a, b) => b.value - a.value)

  return {
    total: customers.length,
    open: open.length,
    actioned: actioned.length,
    valueTotal: valueOf(customers),
    valueOpen: valueOf(open),
    valueActioned: valueOf(actioned),
    avgScore: Math.round(customers.reduce((n, c) => n + c.score, 0) / customers.length),
    byCategory,
  }
}

/**
 * Which channels each recommendation leans on, and how it is expected to land.
 *
 * The authored strings combine touchpoints several ways — "App push + SMS",
 * "RM call, then app offer", "Email + app card" — so splitting on "+" alone
 * leaves "RM call, then app offer" as one channel and lets "email" and "Email"
 * count as two. Split on every separator, then canonicalise.
 */
const CHANNEL_ALIASES = {
  'app push': 'App push',
  'app offer': 'In-app offer',
  'in-app offer': 'In-app offer',
  'app card': 'In-app offer',
  email: 'Email',
  sms: 'SMS',
  'rm call': 'RM call',
}

function splitChannels(text) {
  return text
    .split(/\+|,|\bthen\b/i)
    .map((part) => part.trim().toLowerCase())
    .filter(Boolean)
    .map((part) => CHANNEL_ALIASES[part] ?? part.charAt(0).toUpperCase() + part.slice(1))
}

export function channelMix(customers) {
  const m = new Map()
  customers.forEach((c) => {
    // One recommendation can touch the same canonical channel twice; count once.
    new Set(splitChannels(c.channel)).forEach((name) => {
      const row = m.get(name) ?? { name, count: 0, likelihood: 0 }
      row.count += 1
      row.likelihood += parseValue(c.likelihood)
      m.set(name, row)
    })
  })
  return [...m.values()]
    .map((r) => ({ name: r.name, count: r.count, avgLikelihood: Math.round(r.likelihood / r.count) }))
    .sort((a, b) => b.count - a.count)
}
