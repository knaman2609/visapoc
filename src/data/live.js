import { CHANNELS, buildRoutes } from './agent.js'

/** How far through the send window the campaign is. */
export const PROGRESS = 0.68

/** A channel converting under this is flagged for course-correction. */
export const FLOOR = 0.04

/**
 * Roll a planned cascade forward to "now": what has actually been delivered,
 * opened and responded to per channel, given how far the send window has run.
 *
 * It takes the plan rather than building one, because the plan that goes live
 * is the one the operator designed — its routing mode, its per-group sequences
 * and any journey built by hand. Rebuilding it here would quietly report on a
 * campaign nobody approved.
 *
 * `swap` moves the unsent remainder of one channel onto another — the shape of
 * the agent's course-correction when a channel is under-converting.
 *
 * `progress` is how far into its send window this campaign is — campaigns in
 * the portfolio are at different points, so it is per call rather than global.
 */
export function liveSnapshot({ plan, targetProfitCr, swap = null, progress = PROGRESS }) {

  const byChannel = new Map()
  for (const r of plan.routes) {
    for (const st of r.steps) {
      const acc = byChannel.get(st.id) || { ...CHANNELS.find((c) => c.id === st.id), sent: 0, planResponders: 0 }
      acc.sent += st.contacted
      acc.planResponders += st.responded
      byChannel.set(st.id, acc)
    }
  }

  const channels = [...byChannel.values()].map((c) => {
    const rate = c.sent ? c.planResponders / c.sent : 0
    let delivered = Math.round(c.sent * progress)
    let pending = c.sent - delivered

    // The correction stops sending on this channel and moves the rest across.
    if (swap && swap.from === c.id) pending = 0

    return {
      ...c,
      rate,
      delivered,
      pending,
      opened: Math.round(delivered * c.openPct),
      responded: Math.round(delivered * rate),
      under: rate < FLOOR,
    }
  })

  if (swap) {
    const from = [...byChannel.values()].find((c) => c.id === swap.from)
    const to = channels.find((c) => c.id === swap.to)
    if (from && to) {
      const moved = from.sent - Math.round(from.sent * progress)
      to.pending += moved
      to.movedIn = moved
    }
  }

  const sent = channels.reduce((n, c) => n + c.sent, 0)
  const delivered = channels.reduce((n, c) => n + c.delivered, 0)
  const opened = channels.reduce((n, c) => n + c.opened, 0)
  const responded = channels.reduce((n, c) => n + c.responded, 0)

  // Profit is earned per responder, so it tracks responses rather than sends.
  const perResponder = plan.responders ? targetProfitCr / plan.responders : 0
  const profitCr = responded * perResponder

  return {
    channels: channels.sort((a, b) => b.sent - a.sent),
    plan,
    sent,
    delivered,
    opened,
    responded,
    openRate: delivered ? opened / delivered : 0,
    responseRate: delivered ? responded / delivered : 0,
    profitCr,
    targetProfitCr,
    perResponder,
    progress,
    onTrack: profitCr >= targetProfitCr * progress * 0.92,
  }
}

/**
 * The correction the agent proposes: stop feeding an under-converting channel
 * and put its unsent volume on the best-converting one in the same campaign.
 */
export function proposeCorrection(snap) {
  const weak = snap.channels.filter((c) => c.under && c.pending > 0)
                            .sort((a, b) => a.rate - b.rate)[0]
  if (!weak) return null

  const best = snap.channels.filter((c) => c.id !== weak.id)
                            .sort((a, b) => b.rate - a.rate)[0]
  if (!best || best.rate <= weak.rate) return null

  const moved = weak.pending
  const gainedResponders = Math.round(moved * (best.rate - weak.rate))
  const costDelta = moved * (best.cost - weak.cost)

  return {
    from: weak.id,
    to: best.id,
    fromName: weak.name,
    toName: best.name,
    fromRate: weak.rate,
    toRate: best.rate,
    moved,
    gainedResponders,
    costDelta,
    recoveryCr: gainedResponders * snap.perResponder,
  }
}
