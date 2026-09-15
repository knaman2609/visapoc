import { useCallback, useState } from 'react'

/**
 * The agent you can ask about whatever is on screen.
 *
 * It answers from the same numbers the page is drawing, and only about those:
 * the cut you are in, the measure you picked, the members in front of you. A
 * question it cannot answer says so and names what it does know, rather than
 * producing a confident sentence with nothing behind it.
 *
 * `ctx` is rebuilt by the page on every render, so the answers always describe
 * the current view. Swap `readAsk` for a completion when the endpoint exists —
 * the loop around it does not change.
 */

const list = (xs) => (xs.length > 1
  ? `${xs.slice(0, -1).join(', ')} and ${xs[xs.length - 1]}`
  : xs[0] || '')

/** The member a question names, if any. */
function named(q, ctx) {
  const t = q.toLowerCase()
  return ctx.members.find((m) => t.includes(m.label.toLowerCase()))
    || ctx.members.find((m) => m.label.toLowerCase().split(/[ ·&]/)
      .some((w) => w.length > 4 && t.includes(w)))
    || null
}

function standingLine(m, ctx) {
  const sorted = [...ctx.members].sort((a, b) => b.value - a.value)
  const rank = sorted.findIndex((x) => x.id === m.id) + 1
  const place = rank === 1 ? 'the highest'
    : rank === sorted.length ? 'the lowest'
      : `${rank} of ${sorted.length}`
  // A share only means something when the parts add up; a rate is compared to
  // the average instead.
  const against = ctx.additive
    ? `${((m.value / ctx.total) * 100).toFixed(1)}% of the ${ctx.totalLabel}'s ${ctx.fmt(ctx.total)}`
    : `${m.value > ctx.total ? 'above' : m.value < ctx.total ? 'below' : 'level with'} the ${ctx.totalLabel} of ${ctx.fmt(ctx.total)}`
  return `${m.label} is at ${ctx.fmt(m.value)} on ${ctx.metricLabel.toLowerCase()} — ${place} in this cut, and ${against}.`
}

export function readAsk(q, ctx) {
  const t = q.trim().toLowerCase()
  if (!t) return null

  const sorted = [...ctx.members].sort((a, b) => b.value - a.value)
  const top = sorted[0]
  const bottom = sorted[sorted.length - 1]

  // A named member always wins — the reader asked about a specific thing.
  const hit = named(q, ctx)
  if (hit && !/\b(highest|lowest|worst|best|top|bottom)\b/.test(t)) {
    return standingLine(hit, ctx)
  }

  if (/\b(highest|most|top|biggest|largest|worst)\b/.test(t)) {
    return `${top.label} leads on ${ctx.metricLabel.toLowerCase()} at ${ctx.fmt(top.value)}, against ${
      ctx.fmt(ctx.total)} for the ${ctx.totalLabel}. ${bottom.label} is the other end at ${ctx.fmt(bottom.value)}.`
  }
  if (/\b(lowest|least|smallest|bottom|weakest)\b/.test(t)) {
    return `${bottom.label} is lowest on ${ctx.metricLabel.toLowerCase()} at ${ctx.fmt(bottom.value)}, with ${
      top.label} at the top on ${ctx.fmt(top.value)}.`
  }
  if (/\b(average|book|overall|total|altogether|whole)\b/.test(t)) {
    return `Across the ${ctx.totalLabel} that is ${ctx.fmt(ctx.total)} on ${
      ctx.metricLabel.toLowerCase()}, spread over ${ctx.members.length} ${ctx.noun}s.`
  }
  if (/\b(spread|range|compare|difference|gap|between)\b/.test(t)) {
    return `The spread runs from ${ctx.fmt(bottom.value)} at ${bottom.label} to ${
      ctx.fmt(top.value)} at ${top.label} — a gap of ${ctx.fmt(top.value - bottom.value)}.`
  }

  // Facts the page carries beyond the current cut.
  for (const extra of ctx.extras || []) {
    if (extra.re.test(t)) return extra.say()
  }

  const names = ctx.members.slice(0, 3).map((m) => m.label)
  if (ctx.members.length > 3) names.push(`${ctx.members.length - 3} more`)
  return `I answer from what is on this page: ${ctx.metricLabel.toLowerCase()} by ${
    ctx.dimLabel.toLowerCase()}, across ${list(names)}. Try “what is highest”, a ${
    ctx.noun} by name, or “what is the spread”.`
}

export function useAskAgent(ctx) {
  const [turns, setTurns] = useState([])
  const [pending, setPending] = useState(false)

  const ask = useCallback((text) => {
    const q = text.trim()
    if (!q || pending) return
    setTurns((prev) => [...prev, { role: 'you', text: q }])
    setPending(true)
    setTimeout(() => {
      setTurns((prev) => [...prev, { role: 'agent', text: readAsk(q, ctx) }])
      setPending(false)
    }, 520)
  }, [ctx, pending])

  const clear = useCallback(() => setTurns([]), [])

  return { turns, pending, ask, clear }
}
