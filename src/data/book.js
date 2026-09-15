/**
 * The card book, cut four ways.
 *
 * A portfolio manager owns card products, not "the portfolio", so every number
 * on the overview has to be sliceable: by card, by who holds it, by where they
 * are, and by what they spend on. Each dimension's members sum to the same
 * book totals, so the aggregate can never disagree with the breakdown.
 *
 * Money is in ₹ crore, cards in thousands, rates in percent.
 */

/* ── The book ───────────────────────────────────────────────────────── */

export const BOOK = {
  pvCr: 41500,
  cardsK: 2930,
  activeK: 2400,
  activeRate: 81.9,
  revolve: 31,
  attrition: 9.4,
  dormant: 14.6,
  peerAttrition: 8.5,
  // The retention budget the agent plans inside. What is committed against it
  // comes from the live campaigns themselves, never from a second figure here.
  budgetCr: 8.3,
  pvYoY: 4.2,
}

/* ── Metrics ────────────────────────────────────────────────────────── */

const inr = (n) => n.toLocaleString('en-IN')

export const METRICS = {
  pv: {
    id: 'pv', label: 'Payment volume', axis: '₹ Cr', tone: 'value', better: 'up',
    fmt: (v) => `₹${inr(Math.round(v))} Cr`,
    short: (v) => (v >= 1000 ? `₹${(v / 1000).toFixed(1)}k Cr` : `₹${Math.round(v)} Cr`),
  },
  cards: {
    id: 'cards', label: 'Cardholders', axis: 'cards', tone: 'value', better: 'up',
    fmt: (v) => (v >= 1000 ? `${(v / 1000).toFixed(2)}M` : `${inr(Math.round(v))}k`),
    short: (v) => (v >= 1000 ? `${(v / 1000).toFixed(2)}M` : `${Math.round(v)}k`),
  },
  attrition: {
    id: 'attrition', label: '90-day attrition', axis: '%', tone: 'risk', better: 'down',
    fmt: (v) => `${v.toFixed(1)}%`,
    short: (v) => `${v.toFixed(1)}%`,
    weighted: true,
  },
  spend: {
    id: 'spend', label: 'Annual spend per card', axis: '₹', tone: 'value', better: 'up',
    fmt: (v) => `₹${inr(Math.round(v))}`,
    short: (v) => (v >= 100000 ? `₹${(v / 100000).toFixed(2)}L` : `₹${inr(Math.round(v))}`),
    derived: (m) => (m.pv * 1e7) / (m.cards * 1000),
  },
  dormant: {
    id: 'dormant', label: 'Dormant cards', axis: '%', tone: 'risk', better: 'down',
    fmt: (v) => `${v.toFixed(1)}%`,
    short: (v) => `${v.toFixed(1)}%`,
    weighted: true,
  },
  intl: {
    id: 'intl', label: 'International share', axis: '%', tone: 'value', better: 'up',
    fmt: (v) => `${v.toFixed(1)}%`,
    short: (v) => `${v.toFixed(1)}%`,
    weighted: true,
  },
  txns: {
    id: 'txns', label: 'Transactions', axis: 'per year', tone: 'value', better: 'up',
    fmt: (v) => `${v.toFixed(1)}M`,
    // International counts run under a million; rounding them to whole
    // millions would print three zeroes in a row.
    short: (v) => `${v >= 10 ? v.toFixed(0) : v.toFixed(1)}M`,
  },
  ticket: {
    id: 'ticket', label: 'Average ticket', axis: '₹', tone: 'value', better: 'up',
    fmt: (v) => `₹${inr(Math.round(v))}`,
    short: (v) => `₹${inr(Math.round(v))}`,
  },
  yoy: {
    id: 'yoy', label: 'Year on year', axis: '%', tone: 'value', better: 'up',
    fmt: (v) => `${v > 0 ? '+' : ''}${v.toFixed(1)}%`,
    short: (v) => `${v > 0 ? '+' : ''}${v.toFixed(1)}%`,
    weighted: true,
    // The same trend the twelve-month series is drawn from, read as a number.
    derived: (m) => m.trend * 100,
  },
}

/** The value a member carries for a metric — stored, or derived from stored. */
export function value(member, metricId) {
  const m = METRICS[metricId]
  if (m.derived) return m.derived(member)
  return member[metricId]
}

/* ── Card products ──────────────────────────────────────────────────── */

const CARDS = [
  { id: 'k1', label: 'Magnus Reserve', sub: 'Super-premium · Visa Infinite',
    pv: 6200, cards: 118, attrition: 13.3, dormant: 6.0, intl: 23.2, trend: 0.11 },
  { id: 'k2', label: 'Magnus', sub: 'Premium · Visa Infinite',
    pv: 11400, cards: 486, attrition: 14.8, dormant: 9.1, intl: 17.8, trend: 0.06 },
  { id: 'k3', label: 'Horizon Travel', sub: 'Airline co-brand · Visa Signature',
    pv: 5900, cards: 342, attrition: 12.1, dormant: 11.5, intl: 28.0, trend: -0.04 },
  { id: 'k4', label: 'Select', sub: 'Mass affluent · Visa Signature',
    pv: 8700, cards: 690, attrition: 8.4, dormant: 13.8, intl: 8.2, trend: 0.08 },
  { id: 'k5', label: 'Everyday', sub: 'Mass · Visa Platinum',
    pv: 6100, cards: 964, attrition: 6.6, dormant: 21.0, intl: 2.7, trend: 0.05 },
  { id: 'k6', label: 'Business One', sub: 'SME · Visa Signature Business',
    pv: 3200, cards: 330, attrition: 7.5, dormant: 12.0, intl: 12.3, trend: 0.14 },
]

/* ── Who holds them ─────────────────────────────────────────────────── */

const PERSONAS = [
  { id: 'p1', label: 'HNI self-employed', sub: 'Business income · ₹75L+ turnover',
    pv: 7300, cards: 176, attrition: 13.3, dormant: 5.8, intl: 28.7, trend: 0.09 },
  { id: 'p2', label: 'Affluent salaried', sub: 'Income ₹35L+ · metro',
    pv: 12900, cards: 604, attrition: 12.0, dormant: 8.1, intl: 18.1, trend: 0.05 },
  { id: 'p3', label: 'Senior professional', sub: 'Age 45+ · long tenure',
    pv: 6400, cards: 402, attrition: 8.7, dormant: 10.4, intl: 12.9, trend: 0.02 },
  { id: 'p4', label: 'Young professional', sub: 'Age under 32 · first premium card',
    pv: 5900, cards: 712, attrition: 10.1, dormant: 16.8, intl: 8.3, trend: 0.18 },
  { id: 'p5', label: 'Mass salaried', sub: 'Income under ₹18L',
    pv: 5800, cards: 806, attrition: 6.9, dormant: 22.5, intl: 2.3, trend: 0.04 },
  { id: 'p6', label: 'Business owner', sub: 'Registered entity spend',
    pv: 3200, cards: 230, attrition: 7.5, dormant: 11.2, intl: 15.9, trend: 0.12 },
]

/* ── Where they are ─────────────────────────────────────────────────── */

// `cell` places the zone on a 3×3 cartogram that echoes the map: north on top,
// north-east to its right, the coasts either side of centre, south at the foot.
// `states` are the ones carrying the zone, in ₹ crore of payment volume.
const ZONES = [
  { id: 'z1', label: 'North', sub: 'Delhi NCR · Punjab · Haryana · UP · Rajasthan',
    cell: [1, 1], states: [['Delhi NCR', 4120], ['Uttar Pradesh', 2180], ['Punjab', 1460], ['Haryana', 1290], ['Rajasthan', 750]],
    pv: 9800, cards: 660, attrition: 10.3, dormant: 13.8, intl: 17.1, trend: 0.06 },
  { id: 'z2', label: 'North-East', sub: 'Assam · Meghalaya · seven sisters',
    cell: [2, 1], states: [['Assam', 620], ['Meghalaya', 190], ['Tripura', 160], ['Manipur', 130], ['Others', 100]],
    pv: 1200, cards: 92, attrition: 9.7, dormant: 21.0, intl: 3.8, trend: 0.21 },
  { id: 'z3', label: 'West', sub: 'Maharashtra · Gujarat · Goa',
    cell: [0, 2], states: [['Maharashtra', 7940], ['Gujarat', 3180], ['Goa', 880], ['Dadra & Nagar Haveli', 600]],
    pv: 12600, cards: 742, attrition: 9.9, dormant: 12.3, intl: 19.9, trend: 0.03 },
  { id: 'z4', label: 'Central', sub: 'Madhya Pradesh · Chhattisgarh',
    cell: [1, 2], states: [['Madhya Pradesh', 1640], ['Chhattisgarh', 690], ['Others', 270]],
    pv: 2600, cards: 244, attrition: 8.9, dormant: 19.6, intl: 5.7, trend: 0.09 },
  { id: 'z5', label: 'East', sub: 'West Bengal · Odisha · Bihar · Jharkhand',
    cell: [2, 2], states: [['West Bengal', 2240], ['Odisha', 780], ['Bihar', 620], ['Jharkhand', 460]],
    pv: 4100, cards: 386, attrition: 9.2, dormant: 17.8, intl: 7.6, trend: 0.07 },
  { id: 'z6', label: 'South', sub: 'Karnataka · Tamil Nadu · Telangana · Kerala · AP',
    cell: [1, 3], states: [['Karnataka', 3960], ['Tamil Nadu', 2910], ['Telangana', 2140], ['Kerala', 1180], ['Andhra Pradesh', 1010]],
    pv: 11200, cards: 806, attrition: 8.5, dormant: 13.6, intl: 15.2, trend: 0.08 },
]

/* ── What they spend on ─────────────────────────────────────────────── */

// The corridor split is the point of this cut: travel is half off-shore, fuel
// is not, and an intervention that ignores the difference misses the cause.
const CATEGORIES = [
  { id: 'c1', label: 'Travel', sub: 'Airlines · hotels · forex',
    pv: 6900, intl: 50.0, txns: 18.4, ticket: 37500, trend: 0.16 },
  { id: 'c2', label: 'Retail & grocery', sub: 'Supermarket · department · apparel',
    pv: 9800, intl: 3.0, txns: 142.6, ticket: 6870, trend: 0.04 },
  { id: 'c3', label: 'Online & subscriptions', sub: 'Marketplaces · streaming · SaaS',
    pv: 8100, intl: 22.0, txns: 96.2, ticket: 8420, trend: 0.19 },
  { id: 'c4', label: 'Electronics & large ticket', sub: 'Devices · appliances · EMI',
    pv: 6400, intl: 6.0, txns: 9.4, ticket: 68100, trend: 0.02 },
  { id: 'c5', label: 'Dining', sub: 'Restaurants · delivery',
    pv: 5200, intl: 8.0, txns: 78.4, ticket: 6630, trend: 0.07 },
  { id: 'c6', label: 'Fuel & utilities', sub: 'Fuel · bills · telecom',
    pv: 5100, intl: 1.0, txns: 118.2, ticket: 4310, trend: 0.03 },
]

/* ── Where the money leaves the country ─────────────────────────────── */

// The international book is not a separate number: it is what the zone cut
// already says is spent abroad, so the two can never drift apart.
const INTL_PV = ZONES.reduce((n, z) => n + (z.pv * z.intl) / 100, 0)

/** Cut a total into named parts by weight, with the remainder on the largest. */
function share(total, parts) {
  const sum = parts.reduce((n, p) => n + p[1], 0)
  const out = parts.map(([name, w]) => [name, Math.round((total * w) / sum)])
  const big = out.reduce((a, p) => (p[1] > a[1] ? p : a), out[0])
  big[1] += Math.round(total) - out.reduce((n, p) => n + p[1], 0)
  return out
}

// `cut` is the corridor's share of international volume; `ticket` is the
// average transaction on it, so the count of transactions follows rather than
// being a third number that could disagree with the first two.
const CORRIDOR_SPEC = [
  { id: 'w1', label: 'Gulf', sub: 'UAE · Saudi Arabia · Qatar · Oman · Kuwait',
    cut: 0.26, ticket: 18400, trend: 0.12,
    places: [['United Arab Emirates', 52], ['Saudi Arabia', 21], ['Qatar', 11], ['Oman', 9], ['Kuwait', 7]] },
  { id: 'w2', label: 'North America', sub: 'United States · Canada',
    cut: 0.21, ticket: 34200, trend: 0.07,
    places: [['United States', 84], ['Canada', 16]] },
  { id: 'w3', label: 'United Kingdom & Europe', sub: 'UK · France · Germany · Switzerland · Italy · Spain',
    cut: 0.19, ticket: 29800, trend: 0.05,
    places: [['United Kingdom', 31], ['France', 15], ['Germany', 13], ['Switzerland', 11], ['Italy', 10], ['Spain', 8], ['Netherlands', 6], ['Rest of Europe', 6]] },
  { id: 'w4', label: 'South-East Asia', sub: 'Singapore · Thailand · Malaysia · Indonesia · Vietnam',
    cut: 0.16, ticket: 9600, trend: 0.23,
    places: [['Singapore', 34], ['Thailand', 27], ['Malaysia', 15], ['Indonesia', 12], ['Vietnam', 8], ['Philippines', 4]] },
  { id: 'w5', label: 'East Asia & Pacific', sub: 'Australia · Japan · China · South Korea · New Zealand',
    cut: 0.12, ticket: 22500, trend: 0.09,
    places: [['Australia', 33], ['Japan', 24], ['China & Hong Kong', 22], ['South Korea', 12], ['New Zealand', 9]] },
  { id: 'w6', label: 'South Asia', sub: 'Nepal · Sri Lanka · Bangladesh · Bhutan',
    cut: 0.06, ticket: 5400, trend: 0.15,
    places: [['Nepal', 38], ['Sri Lanka', 31], ['Bangladesh', 24], ['Bhutan', 7]] },
]

const CORRIDORS = CORRIDOR_SPEC.map((c) => {
  const pv = INTL_PV * c.cut
  return {
    id: c.id, label: c.label, sub: c.sub, trend: c.trend,
    pv,
    ticket: c.ticket,
    // Volume divided by the average ticket, in millions of transactions.
    txns: (pv * 1e7) / c.ticket / 1e6,
    states: share(pv, c.places),
  }
})

/* ── Dimensions ─────────────────────────────────────────────────────── */

export const DIMENSIONS = [
  {
    id: 'card', label: 'Card product', noun: 'card',
    lede: 'Every product on the book, ranked. A manager owns cards, not an average.',
    members: CARDS, metrics: ['pv', 'cards', 'attrition', 'spend', 'dormant'],
  },
  {
    id: 'persona', label: 'Persona', noun: 'persona',
    lede: 'Who is holding the card, cut by how they earn rather than what they hold.',
    members: PERSONAS, metrics: ['pv', 'cards', 'attrition', 'spend', 'dormant'],
  },
  {
    id: 'zone', label: 'Geography', noun: 'zone',
    lede: 'The book by zone, with the states carrying each one.',
    members: ZONES, metrics: ['pv', 'cards', 'attrition', 'spend', 'dormant'],
    map: 'india', partsLabel: 'States carrying this zone',
  },
  {
    id: 'category', label: 'Spend category', noun: 'category',
    lede: 'Where the money goes, split domestic against international.',
    members: CATEGORIES, metrics: ['pv', 'intl', 'txns', 'ticket'], split: true,
  },
  {
    id: 'corridor', label: 'International', noun: 'corridor',
    lede: 'The corridors the international book travels, and what a card spends on each.',
    // This cut is of the money that leaves the country, not of the whole book.
    scope: 'the international book',
    members: CORRIDORS, metrics: ['pv', 'txns', 'ticket', 'yoy'],
    map: 'world', partsLabel: 'Where the corridor spends',
  },
]

export const dimension = (id) => DIMENSIONS.find((d) => d.id === id) || DIMENSIONS[0]
export const member = (dimId, memberId) => dimension(dimId).members.find((m) => m.id === memberId) || null

/** Book-level value for a metric, so the aggregate matches the members. */
export function bookValue(dim, metricId) {
  const ms = dim.members
  const m = METRICS[metricId]
  if (metricId === 'pv') return ms.reduce((n, x) => n + x.pv, 0)
  if (metricId === 'cards') return ms.reduce((n, x) => n + x.cards, 0)
  if (metricId === 'txns') return ms.reduce((n, x) => n + x.txns, 0)
  if (metricId === 'spend') return (BOOK.pvCr * 1e7) / (BOOK.cardsK * 1000)
  // A rate rolls up on the basis it measures: customer rates weight by
  // cardholders, money rates weight by payment volume. A mean of means would
  // let a small card outvote the book.
  if (m.weighted || metricId === 'ticket') {
    const by = metricId === 'attrition' || metricId === 'dormant' ? 'cards' : 'pv'
    if (!ms[0][by]) return ms.reduce((n, x) => n + value(x, metricId) * x.pv, 0) / ms.reduce((n, x) => n + x.pv, 0)
    const tot = ms.reduce((n, x) => n + x[by], 0)
    return ms.reduce((n, x) => n + value(x, metricId) * x[by], 0) / tot
  }
  return 0
}

/* ── Twelve-month series ────────────────────────────────────────────── */

export const MONTHS = ['Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug']

// Card spend in India is not flat: the festive quarter lifts it and the new
// financial year starts slow. One shared shape keeps every series believable.
const SEASON = [0.97, 1.14, 1.09, 1.02, 0.95, 0.93, 1.04, 0.96, 0.98, 1.0, 1.01, 1.03]

function hash(s) {
  let h = 2166136261
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619) }
  return h >>> 0
}

function rnd(seed) {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const CACHE = new Map()

/**
 * Twelve months ending at today's value. Each member is a blend of the shared
 * festive envelope (weighted by its own sensitivity — travel cards do not
 * spike for Diwali, mass cards do) and a member-specific two-frequency wave,
 * so lines cross and diverge instead of moving in lockstep. Rates drift more
 * gently, because an attrition rate does not swing 10% month on month.
 */
export function series(memberId, metricId, end, trend = 0.05) {
  const key = `${memberId}:${metricId}`
  const hit = CACHE.get(key)
  if (hit && hit.end === end) return hit.pts

  const r = rnd(hash(key))
  const seasonal = metricId === 'pv' || metricId === 'txns'
  const start = end / (1 + trend)

  // How strongly this member follows the shared festive shape. Some products
  // ride the Diwali quarter, others are counter-cyclical or flat.
  const festive = seasonal ? 0.15 + r() * 0.85 : 0
  // A slow wave and a shorter beat, each seeded with its own phase so no two
  // products crest in the same month.
  const phase1 = r() * Math.PI * 2
  const phase2 = r() * Math.PI * 2
  const cycles1 = 1 + Math.floor(r() * 2) // one or two full waves across the year
  const amp1 = seasonal ? 0.09 + r() * 0.08 : 0.025 + r() * 0.025
  const amp2 = amp1 * (0.4 + r() * 0.3)
  const jitter = seasonal ? 0.03 : 0.015
  // A gently non-linear growth path so the underlying trend does not read as
  // a ruler line under everything else.
  const bend = (r() - 0.5) * (seasonal ? 0.06 : 0.02)

  const pts = MONTHS.map((m, i) => {
    const t = i / (MONTHS.length - 1)
    const base = start + (end - start) * t + (end - start) * bend * Math.sin(t * Math.PI)
    const shape = seasonal ? 1 + (SEASON[i] - 1) * festive : 1
    const wave = Math.sin(phase1 + t * Math.PI * 2 * cycles1) * amp1
      + Math.sin(phase2 + t * Math.PI * 4) * amp2
    const noise = 1 + wave + (r() - 0.5) * jitter
    return { m, v: base * shape * noise }
  })
  // The last point is today's number, not a modelled one.
  pts[pts.length - 1] = { m: MONTHS[MONTHS.length - 1], v: end }
  CACHE.set(key, { end, pts })
  return pts
}


/**
 * Where a member sits inside its cut, for the line that explains why an
 * opportunity was raised. Everything is read off the book at render time, so
 * the argument cannot drift from the numbers it is arguing about.
 */
export function standing(dim, member, metricId) {
  const v = value(member, metricId)
  const ranked = dim.members.map((m) => value(m, metricId)).sort((a, b) => b - a)
  const pvTotal = dim.members.reduce((n, m) => n + m.pv, 0)
  return {
    value: v,
    rank: ranked.indexOf(v) + 1,
    of: dim.members.length,
    book: bookValue(dim, metricId),
    pvShare: pvTotal ? (member.pv / pvTotal) * 100 : null,
  }
}
