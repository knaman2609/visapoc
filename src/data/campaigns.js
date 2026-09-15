import { CHANNELS, buildRoutes } from './agent.js'
import { ALL_OFFERS, PM_COHORTS } from './cohorts.js'
import { FLOOR, PROGRESS, liveSnapshot, proposeCorrection } from './live.js'

/**
 * The live register — every campaign the agent has in flight.
 *
 * A campaign is an approved intervention handed to the CRM, so each row points
 * at one of the ranked interventions and adds what only exists once it is
 * running: a code, an owner, a send window, how far into that window it is,
 * and how the observed response compares with the modelled curve. Everything
 * numeric is re-derived from the models the flow itself uses, so the register
 * and the Live step never disagree.
 *
 * `paceIndex` is observed response against modelled response. The snapshot is
 * the model's own curve, which by construction lands exactly on plan; a real
 * campaign runs above or below it, and that gap is the whole reason a
 * portfolio manager opens this page.
 *
 * The first entry is the campaign the flow launches. It sits at the flow's own
 * progress and an index of 1.00, so both screens quote the same numbers.
 */
const REGISTER = [
  { offerId: 'i11', code: 'CMP-2026-0912', launched: '28 Aug', windowDays: 14, progress: PROGRESS,
    paceIndex: 1.00, owner: 'Rohan Mehta', channels: { email: true, wa: true, sms: true } },
  { offerId: 'i21', code: 'CMP-2026-0904', launched: '22 Aug', windowDays: 21, progress: 0.82,
    paceIndex: 1.09, owner: 'Rohan Mehta', channels: { email: true, wa: true } },
  { offerId: 'i31', code: 'CMP-2026-0898', launched: '31 Aug', windowDays: 14, progress: 0.55,
    paceIndex: 0.84, owner: 'Aarti Desai', channels: { email: true, sms: true } },
  { offerId: 'i12', code: 'CMP-2026-0921', launched: '03 Sep', windowDays: 10, progress: 0.41,
    paceIndex: 1.03, owner: 'Rohan Mehta', channels: { email: true, wa: true, voice: true } },
  { offerId: 'i41', code: 'CMP-2026-0925', launched: '05 Sep', windowDays: 21, progress: 0.24,
    paceIndex: 0.91, owner: 'Nikhil Rao', channels: { sms: true, email: true } },
]

// Pace bands. A campaign is judged on where its profit sits against where the
// plan says it should be by now — not on whether one channel is misbehaving,
// which is a separate signal with its own fix.
const AHEAD = 1.05
const BEHIND = 0.95

const STATE = {
  ahead: { label: 'Ahead of plan', tone: 'ok' },
  plan: { label: 'On plan', tone: 'ok' },
  behind: { label: 'Behind pace', tone: 'bad' },
}

function build(entry, swap = null) {
  const offer = ALL_OFFERS.find((o) => o.id === entry.offerId)
  const cohort = PM_COHORTS.find((c) => c.id === offer.cohortId)

  const snap = liveSnapshot({
    plan: buildRoutes(cohort, offer.targeted, entry.channels),
    targetProfitCr: offer.profitCr,
    swap,
    progress: entry.progress,
  })
  // A channel converting under the floor with volume still to send — the same
  // course-correction the Live step offers, surfaced across the portfolio.
  const fix = proposeCorrection(snap)

  const idx = entry.paceIndex
  const channels = snap.channels.map((ch) => {
    const acted = Math.round(ch.responded * idx)
    return {
      ...ch,
      acted,
      // What is actually being seen, rather than what the plan assumed.
      rate: ch.delivered ? acted / ch.delivered : 0,
      planRate: ch.rate,
      sendCost: ch.delivered * ch.cost,
    }
  })

  const responded = channels.reduce((n, c) => n + c.acted, 0)
  const profitCr = responded * snap.perResponder
  const pace = offer.profitCr * entry.progress
  const ratio = pace ? profitCr / pace : 0
  const state = ratio >= AHEAD ? 'ahead' : ratio >= BEHIND ? 'plan' : 'behind'
  const day = Math.max(1, Math.round(entry.progress * entry.windowDays))

  return {
    id: offer.id,
    code: entry.code,
    name: offer.name,
    desc: offer.desc,
    confidence: offer.confidence,
    cohortId: cohort.id,
    cohortTag: offer.cohortTag,
    cohortLabel: offer.cohortLabel,
    cohortBand: offer.cohortBand,

    audience: offer.targeted,
    target: offer.profitCr,
    investCr: offer.investCr,
    roiX: offer.roiX,

    owner: entry.owner,
    launched: entry.launched,
    windowDays: entry.windowDays,
    progress: entry.progress,
    day,
    daysLeft: Math.max(0, entry.windowDays - day),
    channelNames: CHANNELS.filter((c) => entry.channels[c.id]).map((c) => c.name),

    live: {
      sent: snap.sent,
      delivered: snap.delivered,
      opened: snap.opened,
      openRate: snap.openRate,
      responded,
      responseRate: snap.delivered ? responded / snap.delivered : 0,
      profitCr,
      perResponder: snap.perResponder,
      unsent: snap.sent - snap.delivered,
      channels,
    },

    fix,
    pace,
    ratio,
    // Spend follows the sends, so only the delivered share is committed so far.
    spentCr: offer.investCr * entry.progress,
    sendCostRs: channels.reduce((n, c) => n + c.sendCost, 0),
    state,
    stateLabel: STATE[state].label,
    stateTone: STATE[state].tone,
  }
}

export const LIVE_CAMPAIGNS = REGISTER.map((e) => build(e))

export const campaignById = (id) => LIVE_CAMPAIGNS.find((c) => c.id === id) || null

/**
 * The campaign as it would run with the agent's course-correction taken: the
 * under-converting channel stops, and its unsent volume moves to the best
 * converter in the same campaign. Delivered work is already done, so what
 * changes is where the remainder goes — and the flag clears.
 */
export function applyFix(id) {
  const entry = REGISTER.find((e) => e.offerId === id)
  const current = campaignById(id)
  if (!entry || !current?.fix) return current
  const next = build(entry, current.fix)
  return { ...next, appliedFix: current.fix }
}

/** Portfolio roll-up across everything in flight. */
export const LIVE_TOTALS = (() => {
  const t = LIVE_CAMPAIGNS.reduce((a, c) => ({
    count: a.count + 1,
    audience: a.audience + c.audience,
    sent: a.sent + c.live.sent,
    delivered: a.delivered + c.live.delivered,
    opened: a.opened + c.live.opened,
    responded: a.responded + c.live.responded,
    profitCr: a.profitCr + c.live.profitCr,
    targetCr: a.targetCr + c.target,
    paceCr: a.paceCr + c.pace,
    spentCr: a.spentCr + c.spentCr,
    budgetCr: a.budgetCr + c.investCr,
    flagged: a.flagged + (c.fix ? 1 : 0),
    behind: a.behind + (c.state === 'behind' ? 1 : 0),
  }), {
    count: 0, audience: 0, sent: 0, delivered: 0, opened: 0, responded: 0,
    profitCr: 0, targetCr: 0, paceCr: 0, spentCr: 0, budgetCr: 0, flagged: 0, behind: 0,
  })

  return {
    ...t,
    responseRate: t.delivered ? t.responded / t.delivered : 0,
    openRate: t.delivered ? t.opened / t.delivered : 0,
    ratio: t.paceCr ? t.profitCr / t.paceCr : 0,
    recoverableCr: LIVE_CAMPAIGNS.reduce((n, c) => n + (c.fix?.recoveryCr || 0), 0),
  }
})()

/**
 * The same channels added up across every live campaign — which one is earning
 * its cost portfolio-wide, rather than inside any single campaign.
 */
export const LIVE_CHANNELS = (() => {
  const by = new Map()
  for (const c of LIVE_CAMPAIGNS) {
    for (const ch of c.live.channels) {
      const acc = by.get(ch.id) || {
        id: ch.id, name: ch.name, cost: ch.cost,
        delivered: 0, opened: 0, acted: 0, pending: 0, sendCost: 0, campaigns: 0,
      }
      acc.delivered += ch.delivered
      acc.opened += ch.opened
      acc.acted += ch.acted
      acc.pending += ch.pending
      acc.sendCost += ch.sendCost
      acc.campaigns += 1
      by.set(ch.id, acc)
    }
  }
  return [...by.values()]
    .map((c) => ({ ...c, rate: c.delivered ? c.acted / c.delivered : 0 }))
    .map((c) => ({ ...c, under: c.rate < FLOOR }))
    .sort((a, b) => b.delivered - a.delivered)
})()

/** The other campaigns firing in parallel, excluding the one just launched. */
export function portfolioLive(selectedOfferId) {
  return LIVE_CAMPAIGNS
    .filter((c) => c.id !== selectedOfferId)
    .map((c) => ({
      id: c.id,
      name: c.name,
      cohortTag: c.cohortTag,
      sent: c.live.sent,
      responseRate: c.live.responseRate,
      profitCr: c.live.profitCr,
      state: c.state === 'behind' ? 'at risk' : 'on plan',
    }))
}


/* ── Slicing the live book of campaigns ─────────────────────────────── */

const inr = (n) => Math.round(n).toLocaleString('en-IN')

export const CAMPAIGN_METRICS = {
  profit: {
    id: 'profit', label: 'Incremental profit', tone: 'value', cumulative: true,
    fmt: (v) => `₹${v.toFixed(2)} Cr`,
    short: (v) => `₹${v.toFixed(2)} Cr`,
  },
  delivered: {
    id: 'delivered', label: 'Delivered', tone: 'value', cumulative: true,
    fmt: (v) => inr(v), short: (v) => (v >= 1000 ? `${(v / 1000).toFixed(1)}k` : inr(v)),
  },
  responded: {
    id: 'responded', label: 'Responders', tone: 'value', cumulative: true,
    fmt: (v) => inr(v), short: (v) => (v >= 1000 ? `${(v / 1000).toFixed(1)}k` : inr(v)),
  },
  rate: {
    id: 'rate', label: 'Response rate', tone: 'value', weighted: true,
    fmt: (v) => `${(v * 100).toFixed(1)}%`, short: (v) => `${(v * 100).toFixed(1)}%`,
  },
  sendCost: {
    id: 'sendCost', label: 'Send cost', tone: 'risk', cumulative: true,
    fmt: (v) => `₹${inr(v)}`, short: (v) => (v >= 1000 ? `₹${(v / 1000).toFixed(1)}k` : `₹${inr(v)}`),
  },
}

const CM = ['profit', 'delivered', 'responded', 'rate', 'sendCost']

/** A member's value for a campaign metric, from whatever it aggregates. */
export function campaignValue(m, metricId) {
  if (metricId === 'rate') return m.delivered ? m.responded / m.delivered : 0
  return m[metricId]
}

const part = (c, weight) => ({ launched: c.launched, weight })

const agg = (id, label, sub, cs) => ({
  id, label, sub,
  delivered: cs.reduce((n, c) => n + c.live.delivered, 0),
  responded: cs.reduce((n, c) => n + c.live.responded, 0),
  profit: cs.reduce((n, c) => n + c.live.profitCr, 0),
  sendCost: cs.reduce((n, c) => n + c.sendCostRs, 0),
  campaigns: cs,
  parts: cs.map((c) => part(c, c.live.delivered)),
})

const byCohort = () => {
  const m = new Map()
  for (const c of LIVE_CAMPAIGNS) {
    if (!m.has(c.cohortId)) m.set(c.cohortId, [])
    m.get(c.cohortId).push(c)
  }
  return [...m.entries()].map(([id, cs]) => agg(
    id, cs[0].cohortLabel, `${cs.length} campaign${cs.length === 1 ? '' : 's'} · ${cs[0].cohortTag}`, cs,
  ))
}

const byChannel = () => LIVE_CHANNELS.map((ch) => {
  const cs = LIVE_CAMPAIGNS.filter((c) => c.live.channels.some((x) => x.id === ch.id))
  // Profit follows responders, so a channel earns what its responders are worth
  // in the campaign they responded to.
  const profit = LIVE_CAMPAIGNS.reduce((n, c) => {
    const line = c.live.channels.find((x) => x.id === ch.id)
    return n + (line ? line.acted * c.live.perResponder : 0)
  }, 0)
  return {
    id: ch.id, label: ch.name, sub: `in ${ch.campaigns} campaign${ch.campaigns === 1 ? '' : 's'}`,
    delivered: ch.delivered, responded: ch.acted, sendCost: ch.sendCost, profit, campaigns: cs,
    // A channel's weight inside a campaign is its own delivered volume there.
    parts: cs.map((c) => part(c, c.live.channels.find((x) => x.id === ch.id)?.delivered || 0)),
  }
})

export const CAMPAIGN_DIMENSIONS = [
  {
    id: 'campaign', label: 'Campaign', noun: 'campaign', metrics: CM,
    lede: 'Each campaign in flight, against the plan it was approved on.',
    members: LIVE_CAMPAIGNS.map((c) => ({
      id: c.id, label: c.name, sub: `${c.code} · ${c.cohortLabel}`,
      delivered: c.live.delivered, responded: c.live.responded,
      profit: c.live.profitCr, sendCost: c.sendCostRs, campaigns: [c],
      parts: [part(c, c.live.delivered)],
    })),
  },
  {
    id: 'cohort', label: 'Cohort', noun: 'cohort', metrics: CM,
    lede: 'The same campaigns grouped by who they are aimed at.',
    members: byCohort(),
  },
  {
    id: 'channel', label: 'Channel', noun: 'channel', metrics: CM,
    lede: 'Every send across every campaign, by the rail it went out on.',
    members: byChannel(),
  },
]

export const campaignDimension = (id) =>
  CAMPAIGN_DIMENSIONS.find((d) => d.id === id) || CAMPAIGN_DIMENSIONS[0]

export function campaignTotal(dim, metricId) {
  const ms = dim.members
  if (metricId === 'rate') {
    const d = ms.reduce((n, m) => n + m.delivered, 0)
    return d ? ms.reduce((n, m) => n + m.responded, 0) / d : 0
  }
  return ms.reduce((n, m) => n + m[metricId], 0)
}

/* ── The last twelve days of the send windows ───────────────────────── */

// Today is 07 Sep in the console, so the window runs back to 27 Aug. A campaign
// that had not launched yet sits at zero rather than at a guess.
export const DAYS = ['27 Aug', '28', '29', '30', '31', '01 Sep', '02', '03', '04', '05', '06', '07']
const DAY_INDEX = { '22 Aug': -5, '28 Aug': 1, '31 Aug': 4, '03 Sep': 7, '05 Sep': 9 }

// How far into its own run a part is on a given day, as a fraction of where it
// is today. Today is always 1, so a series always lands on the live number
// rather than on a second, differently-derived estimate of it.
const daysIn = (p, i) => Math.max(0, i - (DAY_INDEX[p.launched] ?? 0))

function fraction(member, i) {
  const now = DAYS.length - 1
  const total = member.parts.reduce((n, p) => n + p.weight, 0)
  if (!total) return 0
  return member.parts.reduce((n, p) => {
    const run = daysIn(p, now)
    return n + p.weight * (run ? Math.min(1, daysIn(p, i) / run) : 0)
  }, 0) / total
}

// A tiny deterministic RNG seeded off the member id so each series has its
// own wobble instead of every rate line drawing the same straight ramp.
function seriesRng(seed) {
  let h = 2166136261
  for (let i = 0; i < seed.length; i++) { h ^= seed.charCodeAt(i); h = Math.imul(h, 16777619) }
  let a = h >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** A member's twelve-day path for a metric, ending on today's value. */
export function campaignSeries(member, metricId) {
  const metric = CAMPAIGN_METRICS[metricId]
  const today = campaignValue(member, metricId)

  const r = seriesRng(`${member.id}:${metricId}`)
  const phase = r() * Math.PI * 2
  const phase2 = r() * Math.PI * 2

  return DAYS.map((m, i) => {
    const t = i / (DAYS.length - 1)
    // A rate is not cumulative: it settles towards today's number as volume
    // builds, which is what a response rate actually does. Each rate line
    // carries a small member-specific wobble so no two campaigns trace the
    // same ramp, and the last point still lands on the live number.
    if (!metric.cumulative) {
      if (i === DAYS.length - 1) return { m, v: today }
      const settle = 0.72 + 0.28 * t
      const wave = Math.sin(phase + t * Math.PI * 2) * 0.05
        + Math.sin(phase2 + t * Math.PI * 4) * 0.025
      const noise = (r() - 0.5) * 0.02
      return { m, v: today * (settle + wave + noise) }
    }
    return { m, v: today * fraction(member, i) }
  })
}
