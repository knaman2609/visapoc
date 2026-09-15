/**
 * Full cardholder populations for the spend cohorts.
 *
 * The cohort data carries ten hand-written members each — the ones with real
 * editorial detail. A cohort claims 15,290 cardholders, so the modal has to be
 * able to show 15,290 cardholders. The rest are synthesised here from a seeded
 * generator: the same cohort always produces the same people, in the same
 * order, with distributions shaped to match the authored ten (risk centred on
 * the cohort's own score, profit log-normal around its median).
 *
 * Populations are built on first open and cached, so the cost is paid once per
 * cohort and only when someone actually drills in.
 */

import { PROFIT_BANDS, RISK_BANDS } from './cohorts.js'

/* ── Seeded RNG ─────────────────────────────────────────────────────── */

export function mulberry32(seed) {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export function hash(str) {
  let h = 2166136261
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

/** Standard normal, Irwin–Hall(6) — fast enough to run 45,000 times. */
function gauss(rnd) {
  return (rnd() + rnd() + rnd() + rnd() + rnd() + rnd() - 3) / 0.70710678
}

/**
 * Normal draw truncated to [lo, hi] by rejection rather than by clamping —
 * clamping stacks every outlier on the boundary, which shows up as a wall of
 * identical scores at the top of a sorted list.
 */
export function boundedGauss(rnd, mean, sd, lo, hi) {
  for (let i = 0; i < 24; i++) {
    const v = mean + gauss(rnd) * sd
    if (v >= lo && v <= hi) return v
  }
  return mean
}

export const pick = (rnd, xs) => xs[Math.floor(rnd() * xs.length) % xs.length]
export const between = (rnd, lo, hi) => lo + Math.floor(rnd() * (hi - lo + 1))

/* ── Name and place pools ───────────────────────────────────────────── */

export const FIRST = [
  'Aarav', 'Aditi', 'Aditya', 'Akash', 'Alok', 'Aman', 'Ananya', 'Anil', 'Anita', 'Anjali',
  'Ankit', 'Arjun', 'Arun', 'Asha', 'Ashwin', 'Bhavna', 'Chetan', 'Darshan', 'Deepa', 'Deepak',
  'Devika', 'Dhruv', 'Divya', 'Farhan', 'Gaurav', 'Girish', 'Harsh', 'Hema', 'Ishaan', 'Ishita',
  'Jaya', 'Kabir', 'Kalpana', 'Karan', 'Kavya', 'Kiran', 'Lakshmi', 'Madhav', 'Manish', 'Meera',
  'Mohit', 'Naina', 'Neha', 'Nikhil', 'Nisha', 'Nitin', 'Pallavi', 'Parth', 'Pooja', 'Prakash',
  'Pranav', 'Priya', 'Rahul', 'Rajat', 'Rakesh', 'Rehan', 'Renuka', 'Rhea', 'Riddhi', 'Rishi',
  'Ritika', 'Rohan', 'Rohit', 'Sameer', 'Sanjay', 'Sanya', 'Shalini', 'Shreya', 'Simran', 'Siddharth',
  'Sneha', 'Sunita', 'Suresh', 'Swati', 'Tanvi', 'Tara', 'Uday', 'Vaibhav', 'Varun', 'Vikram',
  'Vinay', 'Vivek', 'Yash', 'Zoya',
]

export const LAST = [
  'Agarwal', 'Ahuja', 'Bajaj', 'Banerjee', 'Bhat', 'Bhatia', 'Chandra', 'Chopra', 'Das', 'Desai',
  'Deshmukh', 'Dutta', 'Gandhi', 'Ghosh', 'Gill', 'Gupta', 'Iyer', 'Jain', 'Joshi', 'Kamath',
  'Kapoor', 'Kaur', 'Khanna', 'Khurana', 'Kulkarni', 'Kumar', 'Malhotra', 'Mehra', 'Mehta', 'Menon',
  'Mishra', 'Nair', 'Nayak', 'Pandey', 'Patel', 'Pillai', 'Prasad', 'Raghavan', 'Rane', 'Rao',
  'Reddy', 'Saxena', 'Sen', 'Sethi', 'Shah', 'Sharma', 'Sheikh', 'Shetty', 'Singh', 'Sinha',
  'Subramanian', 'Thakur', 'Trivedi', 'Varma', 'Verma', 'Yadav',
]

const INITIALS = 'ABCDGHIJKLMNPRSTVY'.split('')

export const METROS = ['Mumbai', 'Delhi', 'Bengaluru', 'Gurugram', 'Hyderabad', 'Chennai', 'Pune', 'Kolkata']
export const TIER2 = ['Jaipur', 'Indore', 'Lucknow', 'Nagpur', 'Surat', 'Kochi', 'Chandigarh', 'Coimbatore',
  'Bhopal', 'Vadodara', 'Ludhiana', 'Thane', 'Mangaluru', 'Amritsar', 'Visakhapatnam', 'Nashik']

/* ── Per-cohort shape ───────────────────────────────────────────────── */

// Each cohort's synthetic population is drawn to match its authored ten:
// risk centred just under the headline score, profit log-normal around the
// median of the sample, cities weighted the way the sample is weighted.
const SHAPE = {
  c1: {
    riskMean: 67, riskSd: 12, profitMedian: 62000, profitSigma: 0.44,
    metroBias: 0.78, ageLo: 31, ageHi: 56, tenureLo: 14, tenureHi: 148,
    channels: [['wa', 'email'], ['email', 'wa'], ['email', 'sms'], ['wa', 'sms']],
    shareLabel: 'travel',
    signals: [
      (r) => `Travel ${between(r, 28, 49)}% of spend`,
      (r) => `Off-us travel ${(1.6 + r() * 2.4).toFixed(1)}×`,
      (r) => `Airline spend −${between(r, 18, 54)}%`,
      (r) => `Forex spend −${between(r, 20, 48)}%`,
      (r) => `Hotel bookings off-us ×${between(r, 2, 9)}`,
      (r) => `Flights booked off-us ×${between(r, 2, 8)}`,
      (r) => `Lounge unused ${between(r, 6, 18)}m`,
      (r) => `${between(r, 12, 62)}k points unredeemed`,
      () => 'Rival co-brand in wallet',
      () => 'Concierge never used',
      (r) => `No redemption in ${between(r, 8, 20)} months`,
    ],
    fixes: [
      (_r, m) => `The 3× quarter is worth about ₹${(Math.round(m.profit * 0.2 / 100) * 100).toLocaleString('en-IN')} a year at their travel volume — more than the fee they are questioning.`,
      () => 'Rewards land on the hotel and forex spend they still put on us, pulling the flight bookings back with them.',
      () => 'A capped 3× quarter gives them a reason to redeem the balance they have been sitting on since March.',
      () => 'Concierge onboarding surfaces the premium service they have paid for and never once called.',
      () => 'The boost reaches the travel they still route to us before the rest of the bookings follow it out.',
      () => 'They are early in the drift — the boost lands before the rival card becomes the default.',
    ],
  },
  c2: {
    riskMean: 60, riskSd: 11, profitMedian: 36000, profitSigma: 0.42,
    metroBias: 0.66, ageLo: 27, ageHi: 48, tenureLo: 10, tenureHi: 96,
    channels: [['wa', 'email'], ['wa', 'sms'], ['email', 'wa']],
    shareLabel: 'dining',
    signals: [
      (r) => `Dining ${between(r, 26, 46)}% of spend`,
      (r) => `${between(r, 6, 18)} restaurant txns in Aug`,
      (r) => `Dining share −${between(r, 16, 44)}%`,
      (r) => `Delivery ${between(r, 40, 72)}% of dining`,
      (r) => `Avg cover ₹${between(r, 8, 46) * 100}`,
      () => 'Delivery moved off-us',
      () => 'Rival card default in app',
      () => 'Weekend spend off-us',
      () => 'Partner offers never opened',
      (r) => `Ticket size ₹${between(r, 4, 12) * 100}`,
    ],
    fixes: [
      (r) => `2× dining restores the earn rate they left for, on a category they use ${between(r, 8, 16)} times a month.`,
      () => 'Weekend partner offers reach them on the two nights their dining spend actually happens.',
      () => 'Delivery cashback puts us back as the saved card in the apps they order from weekly.',
      () => 'The multiplier is worth more than the rival flat rate at their average cover.',
      () => 'Curated Friday releases put the offer in front of them before they book, not after.',
      () => 'They have not switched yet — the multiplier is a retention move, not a win-back.',
    ],
  },
  c3: {
    riskMean: 58, riskSd: 11, profitMedian: 56000, profitSigma: 0.43,
    metroBias: 0.6, ageLo: 30, ageHi: 58, tenureLo: 16, tenureHi: 140,
    channels: [['wa', 'email'], ['email', 'wa'], ['email', 'sms'], ['sms', 'email']],
    shareLabel: 'electronics',
    signals: [
      (r) => `Basket ₹${between(r, 42, 128)},000 off-us`,
      (r) => `Electronics −${between(r, 24, 56)}%`,
      (r) => { const n = between(r, 1, 3); return `${n} EMI offer${n > 1 ? 's' : ''} declined` },
      (r) => `Utilisation ${between(r, 62, 94)}% at purchase`,
      () => 'EMI taken with a rival',
      () => 'Warranty bought at the store',
      () => 'No decline history',
      (r) => `Tech ${between(r, 30, 50)}% of spend`,
      () => 'Rival EMI opened, not taken',
      (r) => { const n = between(r, 1, 2); return `${n} decline${n > 1 ? 's' : ''} in the last quarter` },
    ],
    fixes: [
      () => 'Matching the no-cost EMI removes the only reason the purchase moved — the rate, not the card.',
      () => 'Pre-approved limit headroom clears the decline that pushed the basket elsewhere.',
      () => '5% capped cashback plus EMI at parity makes the next large basket cheaper on us than off.',
      () => 'The extended warranty bundle is the cover they are currently buying separately at retail.',
      () => 'They convert every large basket to EMI somewhere — matching the rate is the whole decision.',
      () => 'They are comparing, not switched — the EMI match closes the gap before they commit.',
    ],
  },
  c4: {
    riskMean: 52, riskSd: 10, profitMedian: 26000, profitSigma: 0.38,
    metroBias: 0.34, ageLo: 26, ageHi: 52, tenureLo: 8, tenureHi: 92,
    channels: [['sms', 'wa'], ['wa', 'sms'], ['sms', 'email'], ['email', 'wa']],
    shareLabel: 'everyday',
    signals: [
      (r) => `Grocery −${between(r, 14, 38)}%`,
      (r) => `Card txns −${between(r, 20, 46)}%, UPI up`,
      (r) => `${between(r, 12, 28)} txns a month`,
      (r) => `Avg ticket ₹${between(r, 3, 9) * 100}`,
      () => 'UPI at the supermarket till',
      () => 'Bills moved off autopay',
      () => 'Rival everyday card active',
      (r) => `Fuel share −${between(r, 18, 44)}%`,
      () => 'Telecom autopay off-us',
      () => 'Low reward awareness',
    ],
    fixes: [
      () => 'Reinstating autopay on two bills puts a guaranteed monthly transaction back on the card.',
      () => 'The everyday multiplier beats UPI’s zero reward at exactly the ticket sizes they transact at.',
      () => 'Autopay plus the multiplier makes us the default for both recurring rails.',
      () => 'The surcharge waiver answers the complaint on file before grocery moves too.',
      () => 'At this transaction frequency a small multiplier compounds faster than any one-off bonus.',
      () => 'One mandate win returns a fixed monthly amount for the life of the relationship.',
    ],
  },
}

const TIERS = [
  { min: 68000, label: 'Visa Infinite' },
  { min: 30000, label: 'Visa Signature' },
  { min: 0, label: 'Visa Platinum' },
]

const tierFor = (profit) => TIERS.find((t) => profit >= t.min).label

/* ── Banding — the same scale the iterate panel filters on, so a colour
   in the list means exactly what the lever above it means. ─────────── */

export const RISK_TIERS = RISK_BANDS.filter((b) => b.test)
export const PROFIT_TIERS = PROFIT_BANDS.filter((b) => b.test)

export const riskTier = (risk) => RISK_TIERS.find((t) => t.test(risk)) || RISK_TIERS[2]
export const profitTier = (p) => PROFIT_TIERS.find((t) => t.test(p)) || PROFIT_TIERS[2]

/**
 * Where a cardholder sits in the risk × profitability grid: rows run high to
 * low risk, columns low to high profit — the reading order the grid is drawn in.
 */
export function gridCell(m) {
  const r = RISK_TIERS.findIndex((t) => t.test(m.risk))
  const c = PROFIT_TIERS.findIndex((t) => t.test(m.profit))
  return [r === -1 ? 2 : r, c === -1 ? 0 : 2 - c]
}

/* ── Build ──────────────────────────────────────────────────────────── */

const tenureStr = (months) => `${Math.floor(months / 12)}y ${months % 12}m`

function buildOne(cohort, shape, rnd, seen, i) {
  let name = `${pick(rnd, FIRST)} ${pick(rnd, LAST)}`
  if (seen.has(name)) {
    // The pools cross to ~4,700 names and a cohort can hold 15,000 people, so
    // repeats are certain — a middle initial keeps every row distinct.
    let attempt = name
    let k = 0
    while (seen.has(attempt) && k < INITIALS.length) {
      const [f, l] = name.split(' ')
      attempt = `${f} ${INITIALS[(Math.floor(rnd() * INITIALS.length) + k) % INITIALS.length]}. ${l}`
      k++
    }
    name = attempt
  }
  seen.add(name)

  const risk = Math.round(boundedGauss(rnd, shape.riskMean, shape.riskSd, 28, 95))
  const profit = Math.max(
    6000,
    Math.round((shape.profitMedian * Math.exp(gauss(rnd) * shape.profitSigma)) / 100) * 100,
  )
  const city = rnd() < shape.metroBias ? pick(rnd, METROS) : pick(rnd, TIER2)
  const months = between(rnd, shape.tenureLo, shape.tenureHi)
  const age = between(rnd, shape.ageLo, shape.ageHi)
  const tier = tierFor(profit)

  // Three distinct signals, drawn without replacement from the cohort's voice.
  const pool = shape.signals.slice()
  const signals = []
  for (let s = 0; s < 3; s++) {
    const idx = Math.floor(rnd() * pool.length)
    signals.push(pool.splice(idx, 1)[0](rnd))
  }

  const row = {
    id: `${cohort.id}-g${i}`,
    name,
    age,
    city,
    tier,
    months,
    tenure: tenureStr(months),
    meta: `${age} · ${city} · ${tier} · ${tenureStr(months)}`,
    risk,
    profit,
    share: between(rnd, 22, 52),
    lastSeen: between(rnd, 1, 46),
    respondsTo: pick(rnd, shape.channels),
    signals,
    featured: false,
  }
  row.fix = pick(rnd, shape.fixes)(rnd, row)
  return row
}

function build(cohort) {
  const shape = SHAPE[cohort.id]
  const rnd = mulberry32(hash(cohort.id + cohort.label))
  const seen = new Set()

  // The authored ten lead the population and keep their written detail.
  const authored = cohort.members.map((m, i) => {
    const [age, city, tier, tenure] = m.meta.split(' · ')
    const months = (Number(tenure.split('y')[0]) || 0) * 12 + (Number(tenure.match(/(\d+)m/)?.[1]) || 0)
    seen.add(m.name)
    return {
      ...m,
      id: `${cohort.id}-a${i}`,
      age: Number(age),
      city,
      tier,
      months,
      tenure,
      share: 30 + (i % 7) * 3,
      lastSeen: 2 + i * 3,
      featured: true,
    }
  })

  const rest = cohort.count - authored.length
  const rows = Array.from({ length: cohort.count })
  for (let i = 0; i < authored.length; i++) rows[i] = authored[i]
  for (let i = 0; i < rest; i++) rows[authored.length + i] = buildOne(cohort, shape, rnd, seen, i)
  return rows
}

const POP_CACHE = new Map()
const STAT_CACHE = new Map()

/** Every cardholder in a cohort — authored ten first, then the generated rest. */
export function getPopulation(cohort) {
  let rows = POP_CACHE.get(cohort.id)
  if (!rows) {
    rows = build(cohort)
    POP_CACHE.set(cohort.id, rows)
  }
  return rows
}

/** Cohort-level roll-ups, computed once over the whole population. */
export function getCohortStats(cohort) {
  let s = STAT_CACHE.get(cohort.id)
  if (s) return s

  const rows = getPopulation(cohort)
  const riskBands = { high: 0, watch: 0, low: 0 }
  const profitBands = { high: 0, mid: 0, low: 0 }
  const grid = [[0, 0, 0], [0, 0, 0], [0, 0, 0]]
  let riskSum = 0
  let profitSum = 0

  for (const m of rows) {
    riskSum += m.risk
    profitSum += m.profit
    riskBands[riskTier(m.risk).id]++
    profitBands[profitTier(m.profit).id]++
    const [r, c] = gridCell(m)
    grid[r][c]++
  }

  s = {
    count: rows.length,
    avgRisk: riskSum / rows.length,
    avgProfit: Math.round(profitSum / rows.length),
    profitCr: profitSum / 1e7,
    riskBands,
    profitBands,
    grid,
  }
  STAT_CACHE.set(cohort.id, s)
  return s
}
