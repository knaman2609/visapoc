import { LIVE_CAMPAIGNS } from './campaigns.js'
import { PM_COHORTS } from './cohorts.js'
import {
  METROS, PROFIT_TIERS, RISK_TIERS, getPopulation, profitTier, riskTier,
} from './population.js'

/**
 * One campaign, cut every way its audience can be cut.
 *
 * The channel split is measured — it comes straight off the live snapshot. The
 * rest are counted over the cohort's own cardholders: where they are, what they
 * hold, how much they are worth, how likely they are to leave. Nothing here is
 * invented; the campaign's totals are simply attributed to the people in it.
 *
 * Delivery is attributed by audience share, and response is weighted by the
 * same risk × value lift the rest of the app models with — a segment of
 * higher-risk, higher-value cardholders responds better to a retention offer.
 * Every attribution is then normalised, so a segment breakdown always adds back
 * up to the campaign's own delivered, responders and profit.
 */

// Which zone each city in the book sits in. Written out rather than guessed at
// from a prefix, because "Nagpur is Central, Nashik is West" is not derivable.
const CITY_ZONE = {
  Delhi: 'North', Gurugram: 'North', Jaipur: 'North', Lucknow: 'North',
  Chandigarh: 'North', Ludhiana: 'North', Amritsar: 'North',
  Mumbai: 'West', Pune: 'West', Thane: 'West', Surat: 'West', Vadodara: 'West', Nashik: 'West',
  Bengaluru: 'South', Hyderabad: 'South', Chennai: 'South', Kochi: 'South',
  Coimbatore: 'South', Mangaluru: 'South', Visakhapatnam: 'South',
  Kolkata: 'East',
  Indore: 'Central', Nagpur: 'Central', Bhopal: 'Central',
}

const METRO = new Set(METROS)

const ZONE_ORDER = ['North', 'West', 'South', 'East', 'Central']
const TIER_ORDER = ['Visa Infinite', 'Visa Signature', 'Visa Platinum']

export const SEGMENTS = [
  {
    id: 'channel', label: 'Channel', noun: 'channel',
    // A cardholder can be sent to on more than one channel, so this cut counts
    // messages rather than people — there is no cardholder column here.
    lede: '',
    bookLede: 'Every send across every campaign, by the rail it went out on.',
    metrics: ['delivered', 'responded', 'rate', 'profit', 'sendCost'],
  },
  {
    id: 'zone', label: 'Geography', noun: 'zone',
    lede: 'Where the cardholders in this campaign actually are.',
    bookLede: 'Where everyone the book is currently talking to actually is.',
    metrics: ['cardholders', 'delivered', 'responded', 'rate', 'profit', 'sendCost'],
  },
  {
    id: 'tier', label: 'Card tier', noun: 'tier',
    lede: 'The product each cardholder in the audience holds.',
    bookLede: 'The product held by everyone in flight, across every campaign.',
    metrics: ['cardholders', 'delivered', 'responded', 'rate', 'profit', 'sendCost'],
  },
  {
    id: 'risk', label: 'Attrition risk', noun: 'band',
    lede: 'How close the audience is to leaving.',
    bookLede: 'How close everyone in flight is to leaving, across every campaign.',
    metrics: ['cardholders', 'delivered', 'responded', 'rate', 'profit', 'sendCost'],
  },
  {
    id: 'value', label: 'Customer value', noun: 'band',
    lede: 'What the audience is worth a year.',
    bookLede: 'What everyone in flight is worth a year, across every campaign.',
    metrics: ['cardholders', 'delivered', 'responded', 'rate', 'profit', 'sendCost'],
  },
]

export const segment = (id) => SEGMENTS.find((s) => s.id === id) || SEGMENTS[0]

const inr = (n) => Math.round(n).toLocaleString('en-IN')

export const SEGMENT_METRICS = {
  cardholders: {
    id: 'cardholders', label: 'Cardholders', tone: 'value',
    fmt: (v) => inr(v), short: (v) => (v >= 1000 ? `${(v / 1000).toFixed(1)}k` : inr(v)),
  },
  delivered: {
    id: 'delivered', label: 'Delivered', tone: 'value',
    fmt: (v) => inr(v), short: (v) => (v >= 1000 ? `${(v / 1000).toFixed(1)}k` : inr(v)),
  },
  responded: {
    id: 'responded', label: 'Responders', tone: 'value',
    fmt: (v) => inr(v), short: (v) => (v >= 1000 ? `${(v / 1000).toFixed(1)}k` : inr(v)),
  },
  rate: {
    id: 'rate', label: 'Response rate', tone: 'value', weighted: true,
    fmt: (v) => `${(v * 100).toFixed(1)}%`, short: (v) => `${(v * 100).toFixed(1)}%`,
  },
  profit: {
    id: 'profit', label: 'Incremental profit', tone: 'value',
    fmt: (v) => `₹${v.toFixed(2)} Cr`, short: (v) => `₹${v.toFixed(2)} Cr`,
  },
  sendCost: {
    id: 'sendCost', label: 'Send cost', tone: 'risk',
    fmt: (v) => `₹${inr(v)}`,
    short: (v) => (v >= 1000 ? `₹${(v / 1000).toFixed(1)}k` : `₹${inr(v)}`),
  },
}

export const segmentValue = (m, id) => (id === 'rate'
  ? (m.delivered ? m.responded / m.delivered : 0)
  : m[id])

/** How the audience divides, and how strongly each part responds. */
function buckets(campaign, segId) {
  const cohort = PM_COHORTS.find((c) => c.id === campaign.cohortId)
  const people = getPopulation(cohort)

  const key = {
    zone: (p) => CITY_ZONE[p.city] || 'Central',
    tier: (p) => p.tier,
    risk: (p) => riskTier(p.risk).label,
    value: (p) => profitTier(p.profit).flat || profitTier(p.profit).label,
  }[segId]

  const by = new Map()
  for (const p of people) {
    const k = key(p)
    const b = by.get(k) || { label: k, n: 0, risk: 0, profit: 0, metro: 0 }
    b.n += 1
    b.risk += p.risk
    b.profit += p.profit
    b.metro += METRO.has(p.city) ? 1 : 0
    by.set(k, b)
  }

  const avgRisk = people.reduce((n, p) => n + p.risk, 0) / people.length
  const avgProfit = people.reduce((n, p) => n + p.profit, 0) / people.length

  const order = { zone: ZONE_ORDER, tier: TIER_ORDER, risk: RISK_TIERS.map((t) => t.label),
    value: PROFIT_TIERS.map((t) => t.flat || t.label) }[segId]

  return [...by.values()]
    .map((b) => ({
      ...b,
      share: b.n / people.length,
      metroShare: b.metro / b.n,
      // The same lift the interventions model uses — a riskier, richer slice of
      // the audience is worth more to save, and responds accordingly — carried
      // by how well the send actually lands. Digital reach is not flat across
      // the country: WhatsApp and email work harder in the metros, so a slice
      // is modelled at ±12% of the book's reach either side of it. Small next
      // to the risk × value term, and normalised away at the total.
      lift: ((b.risk / b.n) / avgRisk)
        * Math.sqrt((b.profit / b.n) / avgProfit)
        * (0.88 + 0.24 * (b.metro / b.n)),
    }))
    .sort((a, b) => order.indexOf(a.label) - order.indexOf(b.label))
}

/** Push a rounding remainder onto the largest member. */
function settle(rows, key, target) {
  const sum = rows.reduce((n, r) => n + r[key], 0)
  if (sum === target || !rows.length) return
  const big = rows.reduce((a, r) => (r[key] > a[key] ? r : a), rows[0])
  big[key] += target - sum
}

const CACHE = new Map()

/** A campaign's own numbers, attributed across one segment. */
export function segmentBreakdown(campaign, segId) {
  const cacheKey = `${campaign.id}:${segId}:${campaign.live.responded}`
  const hit = CACHE.get(cacheKey)
  if (hit) return hit

  const l = campaign.live
  let out

  if (segId === 'channel') {
    out = l.channels.map((ch) => ({
      id: ch.id,
      label: ch.name,
      sub: `₹${ch.cost.toFixed(2)} per send`,
      cardholders: ch.delivered,
      delivered: ch.delivered,
      responded: ch.acted,
      profit: ch.acted * l.perResponder,
      // Measured, not apportioned — each rail is priced per send.
      sendCost: ch.sendCost,
    }))
  } else {
    const parts = buckets(campaign, segId)
    // Attribute by audience share, then weight response by the lift and
    // normalise so the parts add back to the campaign's own responders.
    const weighted = parts.reduce((n, b) => n + b.share * b.lift, 0)
    out = parts.map((b) => ({
      id: b.label,
      label: b.label,
      sub: segId === 'zone'
        ? `${(b.share * 100).toFixed(1)}% of the audience · ${(b.metroShare * 100).toFixed(0)}% metro`
        : `${(b.share * 100).toFixed(1)}% of the audience`,
      cardholders: Math.round(campaign.audience * b.share),
      delivered: Math.round(l.delivered * b.share),
      responded: Math.round(l.responded * ((b.share * b.lift) / weighted)),
    }))
    // Rounding leaves a remainder; the biggest part absorbs it so a column of
    // segments always sums to the campaign it came from.
    settle(out, 'cardholders', campaign.audience)
    settle(out, 'delivered', l.delivered)
    settle(out, 'responded', l.responded)
    out.forEach((r) => {
      r.profit = r.responded * l.perResponder
      // The rails a campaign runs on are the same for everyone inside it, so a
      // slice carries its share of the send bill by the messages it received.
      r.sendCost = campaign.sendCostRs * (r.delivered / l.delivered)
    })
  }

  CACHE.set(cacheKey, out)
  return out
}

/** Campaign totals for a segment metric, so the parts and the whole agree. */
export function segmentTotal(rows, metricId) {
  if (metricId === 'rate') {
    const d = rows.reduce((n, r) => n + r.delivered, 0)
    return d ? rows.reduce((n, r) => n + r.responded, 0) / d : 0
  }
  return rows.reduce((n, r) => n + r[metricId], 0)
}

/* ── The whole book, cut the same five ways ─────────────────────────── */

const BOOK_CACHE = new Map()

/**
 * Every live campaign broken down, and the parts with the same name added
 * together — so a portfolio cut is the sum of the campaign cuts rather than a
 * second, differently-derived number. Drilling into a campaign then shows the
 * same slice of it.
 *
 * The shape matches a campaign dimension, so the charts, the series and the
 * summary table read it without knowing which of the two it is holding.
 */
export function portfolioSegment(segId) {
  const hit = BOOK_CACHE.get(segId)
  if (hit) return hit

  const seg = segment(segId)
  const by = new Map()

  for (const c of LIVE_CAMPAIGNS) {
    for (const r of segmentBreakdown(c, segId)) {
      const e = by.get(r.id) || {
        id: r.id, label: r.label,
        cardholders: 0, delivered: 0, responded: 0, profit: 0, sendCost: 0,
        campaigns: [], parts: [],
      }
      e.cardholders += r.cardholders
      e.delivered += r.delivered
      e.responded += r.responded
      e.profit += r.profit
      e.sendCost += r.sendCost
      e.campaigns.push(c)
      // The series needs to know when each contribution started running.
      e.parts.push({ launched: c.launched, weight: r.delivered })
      by.set(r.id, e)
    }
  }

  const total = [...by.values()].reduce((n, m) => n + m.delivered, 0)
  // Insertion order is the order the segment itself is authored in — zones run
  // north to central, tiers run top down — so it is left alone.
  const members = [...by.values()].map((m) => ({
    ...m,
    sub: `${m.campaigns.length} campaign${m.campaigns.length === 1 ? '' : 's'} · ${
      total ? ((m.delivered / total) * 100).toFixed(1) : 0}% of delivered`,
  }))

  const out = {
    id: seg.id,
    label: seg.label,
    noun: seg.noun,
    lede: seg.bookLede,
    // Two campaigns can be aimed at the same cohort, so people do not add up
    // across the book the way messages do — the head-count column is dropped.
    metrics: seg.metrics.filter((id) => id !== 'cardholders'),
    members,
  }
  BOOK_CACHE.set(segId, out)
  return out
}
