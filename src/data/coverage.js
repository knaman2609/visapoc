import { HURDLE, PM_COHORTS } from './cohorts.js'

/**
 * Offer coverage, and the segments it produces.
 *
 * The ranked interventions assume every at-risk cardholder needs a new offer
 * bought for them. A large share of them do not: the benefit is already on the
 * card and has never been used. Paying that group a fresh incentive buys
 * something they were given at issue.
 *
 * So the book is cut twice — by where the money goes (the cohort) and by
 * whether anything is already in hand — and the pair is the unit everything
 * downstream works on:
 *
 *   held  → they hold an unused benefit. Push the knowledge, not an offer.
 *   open  → nothing in hand. This is who a paid campaign is actually for.
 *
 * A segment therefore answers both halves of "who am I looking at" at once —
 * travel-heavy *and* holding an unused lounge benefit — which is what decides
 * which campaigns are even applicable to it.
 */

/* Telling somebody about a benefit already on their card converts less well
   than putting a new one in front of them — there is nothing new on the table.
   It also costs a fraction as much: no reward payout, only the fulfilment of a
   benefit the card already carries. That trade is the whole argument for
   splitting the audience rather than paying everyone. */
const AWARENESS_RESPONSE = 0.62
const AWARENESS_FULFIL = 0.17

/** The share of a cohort holding an unused benefit. */
export const heldShare = (cohort) => cohort.existing.heldPct

export const heldCount = (cohort) => Math.round(cohort.count * heldShare(cohort))
export const openCount = (cohort) => cohort.count - heldCount(cohort)

/**
 * Which sampled members are the holders.
 *
 * Unused benefits accumulate on the cardholders who were given the most of
 * them — the long-tenured, high-contribution end of the book, which is exactly
 * where the cohort data already says lounges go unvisited and concierge
 * unused. Ranking by contribution and taking the cohort's own held share keeps
 * the sample consistent with the count, and stable across renders.
 */
export function holders(cohort) {
  const n = Math.round(cohort.members.length * heldShare(cohort))
  const rank = cohort.members.slice().sort((a, b) => b.profit - a.profit)
  const keep = new Set(rank.slice(0, n))
  return cohort.members.filter((m) => keep.has(m))
}

export const nonHolders = (cohort) => {
  const held = new Set(holders(cohort))
  return cohort.members.filter((m) => !held.has(m))
}

/** A cohort narrowed to one half of itself, for routing that half's channels. */
export const asCohort = (cohort, members) => ({ ...cohort, members })

/* ── The whole book ─────────────────────────────────────────────────── */

export const COVERAGE = (() => {
  const held = PM_COHORTS.reduce((n, c) => n + heldCount(c), 0)
  const total = PM_COHORTS.reduce((n, c) => n + c.count, 0)
  return { held, open: total - held, total, heldPct: held / total }
})()

/* ── The awareness push, per cohort ─────────────────────────────────── */

/**
 * The cohort's lead paid intervention is the reference: it is the one the
 * agent would otherwise run on this cohort, so its per-head economics are what
 * the awareness push has to be judged against.
 */
export function awarenessFor(cohort) {
  const ref = cohort.interventions[0]
  const targeted = heldCount(cohort)
  const profitCr = (ref.profitCr / ref.targeted) * AWARENESS_RESPONSE * targeted
  const investCr = (ref.investCr / ref.targeted) * AWARENESS_FULFIL * targeted
  const roiX = investCr > 0 ? profitCr / investCr : 0

  return {
    id: `aw-${cohort.id}`,
    kind: 'awareness',
    name: cohort.existing.push,
    confidence: cohort.existing.confidence,
    desc:
      `These ${targeted.toLocaleString('en-IN')} already hold ${cohort.existing.name.toLowerCase()}. ` +
      'Nothing new is bought — the push tells them what is on the card and how to use it, ' +
      'so the only cost is reaching them and honouring a benefit they were already given.',
    existing: cohort.existing,
    targeted,
    profitCr,
    investCr,
    roiX,
    cohortId: cohort.id,
    cohortLabel: cohort.label,
    cohortTag: cohort.tag,
    cohortBand: cohort.band,
    belowHurdle: roiX < HURDLE,
  }
}

export const AWARENESS_OFFERS = PM_COHORTS.map(awarenessFor)

/* ── Segments: cohort × coverage ────────────────────────────────────── */

/**
 * A paid intervention quoted against the whole cohort, re-cut to the segment
 * that will actually receive it. Profit and incentive both scale with the head
 * count, so the return is unchanged — what changes is how much is committed.
 */
function scaleTo(iv, cohort, count) {
  const k = cohort.count > 0 ? count / cohort.count : 0
  const targeted = Math.round(iv.targeted * k)
  return {
    ...iv,
    kind: 'incentive',
    targeted,
    profitCr: iv.profitCr * k,
    investCr: iv.investCr * k,
    roiX: iv.roiX,
    fullTargeted: iv.targeted,
    cohortId: cohort.id,
    cohortLabel: cohort.label,
    cohortTag: cohort.tag,
    cohortBand: cohort.band,
    belowHurdle: iv.roiX < HURDLE,
  }
}

export function segmentsOf(cohort) {
  const held = heldCount(cohort)
  const open = openCount(cohort)
  return [
    {
      id: `${cohort.id}-held`,
      cohortId: cohort.id,
      cohort,
      coverage: 'held',
      tag: cohort.tag,
      cohortLabel: cohort.label,
      title: `${cohort.label} · holds an offer`,
      trait: cohort.line,
      inHand: cohort.existing.name,
      inHandLine: cohort.existing.line,
      count: held,
      share: cohort.count > 0 ? held / cohort.count : 0,
      members: holders(cohort),
      // Nothing to buy: the campaign for this segment is the benefit itself.
      campaigns: [awarenessFor(cohort)],
    },
    {
      id: `${cohort.id}-open`,
      cohortId: cohort.id,
      cohort,
      coverage: 'open',
      tag: cohort.tag,
      cohortLabel: cohort.label,
      title: `${cohort.label} · nothing in hand`,
      trait: cohort.line,
      inHand: null,
      inHandLine: 'No benefit on the card that answers why they are leaving',
      count: open,
      share: cohort.count > 0 ? open / cohort.count : 0,
      members: nonHolders(cohort),
      campaigns: cohort.interventions
        .map((iv) => scaleTo(iv, cohort, open))
        .sort((a, b) => b.profitCr - a.profitCr),
    },
  ]
}

export const SEGMENTS = PM_COHORTS.flatMap(segmentsOf)

export const findSegment = (id) => SEGMENTS.find((s) => s.id === id) || null

/** The other half of the same cohort. */
export const siblingOf = (segment) =>
  SEGMENTS.find((s) => s.cohortId === segment.cohortId && s.id !== segment.id) || null

/* ── How much of the cohort a campaign is bought for ────────────────── */

export const PLANS = [
  {
    id: 'paired',
    label: 'Run both',
    short: 'Both pushes',
    note: 'The offer for those with nothing in hand, activation for the holders',
    recommended: true,
  },
  {
    id: 'open',
    label: 'Offer only',
    short: 'Offer only',
    note: 'Only the cardholders with nothing in hand. The holders are left alone.',
  },
  {
    id: 'all',
    label: 'Offer to everyone',
    short: 'Everyone',
    note: 'Pays the incentive to the holders too, buying something they already have',
  },
]

export const findPlan = (id) => PLANS.find((p) => p.id === id) || PLANS[0]

/**
 * What a plan costs and returns, end to end.
 *
 * Widening the paid campaign to the holders does not make it a better
 * campaign — profit and incentive both scale with the head count, so its
 * return is unchanged. What changes is what the holders get: an incentive they
 * did not need, or an activation push costing a fraction as much. So the
 * comparison is always between whole plans, never between the paid legs.
 *
 * `metrics` is the campaign's live figures at its own segment's size — the
 * agent's, or the operator's if they have iterated it.
 */
export function planEconomics({ metrics, cohort, plan, coverage = 'open' }) {
  const aw = awarenessFor(cohort)
  const perHead = (v, n) => (n > 0 ? v / n : 0)

  // An awareness campaign has no second audience: the holders are the point.
  if (coverage === 'held') {
    return {
      plan: 'awareness',
      paid: null,
      awareness: { ...metrics, roiX: metrics.investCr > 0 ? metrics.profitCr / metrics.investCr : 0 },
      targeted: metrics.targeted,
      profitCr: metrics.profitCr,
      investCr: metrics.investCr,
      roiX: metrics.investCr > 0 ? metrics.profitCr / metrics.investCr : 0,
    }
  }

  // `metrics` is quoted at the open segment's size. The holders alongside it
  // are the same cohort's held count, scaled the same way the offer was.
  const openHere = metrics.targeted
  const scale = openCount(cohort) > 0 ? openHere / openCount(cohort) : 0
  const heldHere = Math.min(Math.round(heldCount(cohort) * scale), aw.targeted)

  const paidPerProfit = perHead(metrics.profitCr, openHere)
  const paidPerInvest = perHead(metrics.investCr, openHere)
  const awPerProfit = perHead(aw.profitCr, aw.targeted)
  const awPerInvest = perHead(aw.investCr, aw.targeted)

  const legs = {
    paired: {
      paid: { targeted: openHere, profitCr: metrics.profitCr, investCr: metrics.investCr },
      awareness: {
        targeted: heldHere,
        profitCr: awPerProfit * heldHere,
        investCr: awPerInvest * heldHere,
      },
    },
    open: {
      paid: { targeted: openHere, profitCr: metrics.profitCr, investCr: metrics.investCr },
      awareness: null,
    },
    all: {
      paid: {
        targeted: openHere + heldHere,
        profitCr: paidPerProfit * (openHere + heldHere),
        investCr: paidPerInvest * (openHere + heldHere),
      },
      awareness: null,
    },
  }

  const pick = legs[plan] || legs.paired
  const withRoi = (l) => (l ? { ...l, roiX: l.investCr > 0 ? l.profitCr / l.investCr : 0 } : null)
  const paid = withRoi(pick.paid)
  const awareness = withRoi(pick.awareness)

  const profitCr = paid.profitCr + (awareness ? awareness.profitCr : 0)
  const investCr = paid.investCr + (awareness ? awareness.investCr : 0)

  return {
    plan,
    paid,
    awareness,
    heldHere,
    openHere,
    targeted: paid.targeted + (awareness ? awareness.targeted : 0),
    profitCr,
    investCr,
    roiX: investCr > 0 ? profitCr / investCr : 0,
  }
}

/** Every plan for a campaign, priced, so the choice can be made on figures. */
export function allPlans({ metrics, cohort }) {
  return Object.fromEntries(
    PLANS.map((p) => [p.id, planEconomics({ metrics, cohort, plan: p.id })]),
  )
}
