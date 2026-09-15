/**
 * The full onboarding population.
 *
 * onboarding.js carries ten hand-written applicants — the ones with real
 * editorial detail. The book claims 8,420 applications this quarter, so the
 * screens have to be able to count 8,420. The rest are synthesised here from a
 * seeded generator, exactly as population.js does for the spend cohorts: the
 * same book always produces the same people, in the same order, with
 * distributions shaped to match the authored ten.
 *
 * Stage membership is drawn from the stage shares in onboarding.js rather than
 * assigned at random, so the funnel that comes out is the funnel that was
 * authored. The seeded RNG, the name pools and the truncated-normal draw are
 * imported from population.js rather than copied.
 *
 * Built on first read and cached, so the cost is paid once.
 */

import {
  ONBOARDING_APPLICANTS, ONBOARDING_BASE, ONBOARDING_STAGES, QUALITY_BY_CHANNEL,
  STAGE_BY_ID, WEEK_LIFT,
} from './onboarding.js'
import {
  between, boundedGauss, FIRST, hash, LAST, METROS, mulberry32, pick, TIER2,
} from './population.js'

/* ── Shape ──────────────────────────────────────────────────────────── */

// Drawn to match the authored ten: income log-normal around their median,
// obligations a fraction of income, bureau centred just under prime with a
// deliberate thin-file tail, and a metro bias matching the sample.
const SHAPE = {
  incomeMedian: 1150000,
  incomeSigma: 0.62,
  obligRatioLo: 0.04,
  obligRatioHi: 0.28,
  bureauMean: 754,
  bureauSd: 38,
  bureauLo: 640,
  bureauHi: 860,
  thinFileRate: 0.17,
  metroBias: 0.71,
  ageLo: 24,
  ageHi: 52,
  channels: ['Digital / App', 'Branch', 'DSA', 'Partner Co-brand', 'Referral', 'Pre-approved'],
  channelWeights: [0.34, 0.19, 0.17, 0.12, 0.11, 0.07],
  kycModes: ['Aadhaar eKYC', 'Video KYC', 'Physical / Branch'],
  kycWeights: [0.62, 0.27, 0.11],
  variants: ['Visa Platinum', 'Visa Signature', 'Visa Infinite'],
}

/** Weighted pick over a parallel weights array. */
function pickW(rnd, xs, weights) {
  let r = rnd() * weights.reduce((a, b) => a + b, 0)
  for (let i = 0; i < xs.length; i += 1) {
    r -= weights[i]
    if (r <= 0) return xs[i]
  }
  return xs[xs.length - 1]
}

/** Log-normal draw, for income — a few large earners, most near the median. */
function logNormal(rnd, median, sigma) {
  const g = (rnd() + rnd() + rnd() + rnd() + rnd() + rnd() - 3) / 0.70710678
  return median * Math.exp(g * sigma)
}

/** The variant a given income actually qualifies for. */
function variantFor(income) {
  if (income >= 3000000) return 'Visa Infinite'
  if (income >= 1400000) return 'Visa Signature'
  return 'Visa Platinum'
}

/**
 * How the book resolves.
 *
 * A stage's `share` is cumulative — the portion of all applications that ever
 * reached it — and `drop` is the portion of those that stopped there. So an
 * application either stopped at exactly one stage (share x drop) or carried all
 * the way through. Those two add to ~100%, which is what makes the funnel that
 * comes out the funnel that was authored.
 */
function outcomeWeights() {
  const last = ONBOARDING_STAGES[ONBOARDING_STAGES.length - 1]
  const raw = [
    ...ONBOARDING_STAGES.map((s) => ({ id: s.id, weight: s.share * s.drop })),
    { id: 'done', weight: last.share * (1 - last.drop) },
  ]
  // The authored shares round to a shade under 100%; normalise so the tilt
  // below is applied to a genuine probability distribution.
  const sum = raw.reduce((n, w) => n + w.weight, 0)
  return raw.map((w) => ({ ...w, weight: w.weight / sum }))
}

/* ── Who onboards well ──────────────────────────────────────────────── */

export const WEEKS = 13

/**
 * Intake week, derived from the row id rather than a draw.
 *
 * mulberry32 is one sequential stream, so adding a draw here would restate
 * every figure downstream. A hash of the id is deterministic, costs the stream
 * nothing, and spreads across the thirteen weeks to within 10%.
 *
 * Applied once, here: every row carries the resulting `week`, and the trends
 * module reads that field rather than recomputing it. One definition, so the
 * chart's x-axis cannot drift from the data behind it.
 */
const weekOf = (id) => hash(`wk-${id}`) % WEEKS

// Renormalised so the channel-weighted average multiplier is exactly 1.0.
const Q_MEAN = SHAPE.channels.reduce(
  (n, c, i) => n + SHAPE.channelWeights[i] * QUALITY_BY_CHANNEL[c], 0,
)
const liftOf = (week) => WEEK_LIFT.start + (WEEK_LIFT.end - WEEK_LIFT.start) * (week / (WEEKS - 1))

/**
 * Tilt one application's odds by who sourced it and when it arrived.
 *
 * The completion weight is scaled by `q` and everything else absorbs the
 * difference proportionally. Because the average `q` is 1, the book-level
 * funnel is unchanged in expectation — a better channel takes completions from
 * a worse one rather than manufacturing them.
 */
function tilt(weights, q) {
  const done = weights[weights.length - 1].weight
  const scaled = Math.min(done * q, 0.95)
  const rest = (1 - scaled) / (1 - done)
  return weights.map((w, i) => (
    i === weights.length - 1 ? { ...w, weight: scaled } : { ...w, weight: w.weight * rest }
  ))
}

/** Pick a blocker for a stage, honouring the authored blocker shares. */
function blockerFor(rnd, stage) {
  let r = rnd()
  for (const b of stage.blockers) {
    r -= b.share
    if (r <= 0) return b.reason
  }
  return stage.blockers[stage.blockers.length - 1].reason
}

/* ── Build ──────────────────────────────────────────────────────────── */

// Hoisted out of buildOne: both are constant across the whole book, and it runs
// 8,410 times.
const INITIALS = 'ABCDGHIJKLMNPRSTVY'.split('')
const LIMIT_IDX = ONBOARDING_STAGES.findIndex((s) => s.id === 's5')

function buildOne(rnd, seen, i, weights) {
  let name = `${pick(rnd, FIRST)} ${pick(rnd, LAST)}`
  if (seen.has(name)) {
    // The pools cross to a few thousand names and the book runs to 8,420, so
    // repeats are certain — a middle initial keeps every row distinct.
    const [f, l] = name.split(' ')
    let k = 0
    let attempt = name
    while (seen.has(attempt) && k < INITIALS.length) {
      attempt = `${f} ${INITIALS[(Math.floor(rnd() * INITIALS.length) + k) % INITIALS.length]}. ${l}`
      k += 1
    }
    name = attempt
  }
  seen.add(name)

  const income = Math.round(logNormal(rnd, SHAPE.incomeMedian, SHAPE.incomeSigma) / 10000) * 10000
  const oblig = Math.round((income * (SHAPE.obligRatioLo + rnd() * (SHAPE.obligRatioHi - SHAPE.obligRatioLo))) / 10000) * 10000
  const thinFile = rnd() < SHAPE.thinFileRate
  const bureau = thinFile ? null : Math.round(boundedGauss(rnd, SHAPE.bureauMean, SHAPE.bureauSd, SHAPE.bureauLo, SHAPE.bureauHi))
  const city = rnd() < SHAPE.metroBias ? pick(rnd, METROS) : pick(rnd, TIER2)
  const age = between(rnd, SHAPE.ageLo, SHAPE.ageHi)
  const variant = variantFor(income)

  // Drawn before the outcome, because the outcome depends on it.
  const channel = pickW(rnd, SHAPE.channels, SHAPE.channelWeights)
  const week = weekOf(`ob-g${i}`)

  // Where this application ended up: stopped at one stage, or carried through.
  const tilted = tilt(weights, (QUALITY_BY_CHANNEL[channel] / Q_MEAN) * liftOf(week))
  let r = rnd()
  let outcome = tilted[0].id
  for (const w of tilted) {
    r -= w.weight
    if (r <= 0) { outcome = w.id; break }
  }

  const completed = outcome === 'done'
  const stage = completed ? null : STAGE_BY_ID[outcome]
  const reachedIdx = completed
    ? ONBOARDING_STAGES.length - 1
    : ONBOARDING_STAGES.findIndex((s) => s.id === outcome)

  // Days since it last moved — calendar time across the quarter, not scaled to
  // the step. Most of the book stopped weeks ago; only the recent tail is still
  // worth working, which is what keeps the live queue smaller than the history.
  const target = stage ? stage.slaDays : 7
  // Uniform across the quarter's intake: an application is equally likely to
  // have stalled last week as two months ago.
  const days = between(rnd, 1, 90)

  // Still workable only if it stopped recently — past a month the file has been
  // written off rather than left open, so it is history, not queue.
  const open = !completed && days <= 30
  const limitRec = Math.round((income * (thinFile ? 0.05 : 0.28)) / 5000) * 5000
  const hasLimit = reachedIdx > LIMIT_IDX

  return {
    id: `ob-g${i}`,
    name,
    age,
    city,
    variant,
    days,
    completed,
    reachedIdx,
    stuckAt: completed ? null : outcome,
    blocker: completed ? null : blockerFor(rnd, stage),
    open,
    breached: open && days > target * 3,
    income,
    oblig,
    bureau,
    thinFile,
    limit: hasLimit ? limitRec : null,
    limitRec: hasLimit ? null : limitRec,
    channel,
    week,
    kyc: pickW(rnd, SHAPE.kycModes, SHAPE.kycWeights),
    // Modelled first-year interchange and fees, scaled off income — the same
    // basis the authored applicants carry.
    value: Math.round((income * 0.025) / 100) * 100,
    featured: false,
  }
}

function build() {
  const rnd = mulberry32(hash('onboarding-book-2026Q3'))
  const seen = new Set()
  const weights = outcomeWeights()

  // The authored ten lead the book and keep their written detail.
  const authored = ONBOARDING_APPLICANTS.map((a) => {
    const [age, city, variant] = a.meta.split(' · ')
    seen.add(a.name)
    return {
      ...a,
      age: Number(age),
      city,
      variant,
      completed: false,
      reachedIdx: ONBOARDING_STAGES.findIndex((s) => s.id === a.stuckAt),
      open: true,
      week: weekOf(a.id),
      breached: a.days > STAGE_BY_ID[a.stuckAt].slaDays * 3,
      featured: true,
    }
  })

  const rest = ONBOARDING_BASE - authored.length
  const rows = new Array(ONBOARDING_BASE)
  for (let i = 0; i < authored.length; i += 1) rows[i] = authored[i]
  for (let i = 0; i < rest; i += 1) rows[authored.length + i] = buildOne(rnd, seen, i, weights)
  return rows
}

let CACHE = null

/** Every application in the onboarding book — authored ten first. */
export function getOnboardingPopulation() {
  if (!CACHE) CACHE = build()
  return CACHE
}

let STATS = null

/** Book-level roll-ups, computed once over the whole population. */
export function getOnboardingStats() {
  if (STATS) return STATS

  const rows = getOnboardingPopulation()
  const stoppedAt = Object.fromEntries(ONBOARDING_STAGES.map((s) => [s.id, 0]))
  const openAt = Object.fromEntries(ONBOARDING_STAGES.map((s) => [s.id, 0]))
  const reached = Object.fromEntries(ONBOARDING_STAGES.map((s) => [s.id, 0]))
  const byOwner = {}
  const byBlocker = {}

  let completed = 0
  let open = 0
  let breached = 0
  let awaitingLimit = 0
  let valueAtStake = 0

  for (const r of rows) {
    // Reached every stage up to and including where it got to.
    for (let i = 0; i <= r.reachedIdx; i += 1) reached[ONBOARDING_STAGES[i].id] += 1

    if (r.completed) { completed += 1; continue }

    stoppedAt[r.stuckAt] += 1

    if (!r.open) continue
    open += 1
    openAt[r.stuckAt] += 1
    valueAtStake += r.value
    if (r.breached) breached += 1
    // Approved and genuinely waiting on a limit — not merely pre-limit.
    if (r.stuckAt === 's5') awaitingLimit += 1

    const stage = STAGE_BY_ID[r.stuckAt]
    const authored = stage.blockers.find((b) => b.reason === r.blocker)
    const owner = authored?.owner ?? stage.owner
    byOwner[owner] = (byOwner[owner] ?? 0) + 1
    const key = r.blocker
    if (!byBlocker[key]) {
      // Carry the authored fix with the count, so the screen never has to look
      // the blocker back up through its stage.
      byBlocker[key] = {
        reason: key, stage: stage.label, owner, action: authored?.action ?? '',
        count: 0, value: 0, oldest: 0,
      }
    }
    byBlocker[key].count += 1
    byBlocker[key].value += r.value
    byBlocker[key].oldest = Math.max(byBlocker[key].oldest, r.days)
  }

  STATS = {
    count: rows.length,
    completed,
    open,
    reached,
    stoppedAt,
    openAt,
    byOwner,
    blockers: Object.values(byBlocker).sort((a, b) => b.count - a.count),
    breached,
    awaitingLimit,
    valueAtStake,
  }
  return STATS
}
