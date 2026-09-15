import {
  CHANNELS, CONTROL_PCT, QUOTE_CHANNELS, SEND_WINDOWS, buildRoutes, defaultFixedSeq,
  fixedRoutes, modelOutcome,
} from './agent.js'
import {
  COVERAGE, SEGMENTS, asCohort, awarenessFor, findPlan, findSegment, holders,
  nonHolders, planEconomics, siblingOf,
} from './coverage.js'
import { PM_EXC, PM_OBJECTIVES, applyExclusions, fmtIN } from './portfolio.js'

/**
 * The campaign, derived once from the flow's state.
 *
 * Every step from design onward used to re-derive its own version of what was
 * being run, and the approval, launch and live screens fell back on a hardcoded
 * description — so the decisions taken upstream stopped travelling at step 03.
 * This is the single object all of them read: who is in it, what each half of
 * it gets, how it reaches them, what it costs and what it is expected to
 * return. Change a decision anywhere and every screen after it moves.
 */

/* Route edits are keyed by segment, and a paired campaign runs two legs that
   can throw up the same channel segment. Namespacing by leg keeps a journey
   built for the awareness half from silently rewriting the paid half. */
export const legKey = (leg, key) => `${leg}::${key}`
export const legMap = (map, leg) =>
  Object.fromEntries(
    Object.entries(map || {})
      .filter(([k]) => k.startsWith(`${leg}::`))
      .map(([k, v]) => [k.slice(leg.length + 2), v]),
  )
export const legPrefix = (map, leg) =>
  Object.fromEntries(Object.entries(map || {}).map(([k, v]) => [legKey(leg, k), v]))
export const dropLeg = (map, leg) =>
  Object.fromEntries(Object.entries(map || {}).filter(([k]) => !k.startsWith(`${leg}::`)))

/** The campaign the operator approved, carrying any iterated figures. */
function resolveCampaign(segment, sel) {
  const found = segment.campaigns.find((c) => c.id === sel?.campaignId)
  const base = found || segment.campaigns[0]
  if (!sel || !sel.tuned || sel.campaignId !== base.id) return base
  return {
    ...base,
    targeted: sel.targeted,
    profitCr: sel.profitCr,
    investCr: sel.investCr,
    roiX: sel.roiX,
    tuned: true,
  }
}

const WINDOW = '08 Sep – 31 Oct 2026 · send 09:00 IST'

export function buildCampaign(flow) {
  const segment = findSegment(flow.selection?.segmentId) || SEGMENTS[0]
  const cohort = segment.cohort
  const campaign = resolveCampaign(segment, flow.selection)
  const objective = PM_OBJECTIVES.find((o) => o.id === flow.objective) || PM_OBJECTIVES[0]
  const sendWindow = SEND_WINDOWS.find((w) => w.id === flow.sendWindow) || SEND_WINDOWS[1]

  // An awareness campaign has no second audience to decide about — the holders
  // are the whole point of it — so it has no plan to choose.
  const isAware = segment.coverage === 'held'
  const plan = isAware ? 'awareness' : (flow.plan || 'paired')
  const planDef = isAware ? null : findPlan(plan)

  const econ = planEconomics({
    metrics: campaign,
    cohort,
    plan,
    coverage: segment.coverage,
  })

  /* ── The legs ──────────────────────────────────────────────────────
     A leg is one audience on one campaign. 'all' puts the whole cohort on
     the paid offer, so it routes against the whole member sample; every
     other plan routes each half against its own half of it. */
  const awCampaign = awarenessFor(cohort)
  const legDefs = []

  if (isAware) {
    legDefs.push({
      id: 'aware', kind: 'awareness', label: 'Awareness push',
      note: 'They already hold the benefit',
      campaign, cohort: asCohort(cohort, holders(cohort)),
      audience: econ.awareness.targeted, econ: econ.awareness,
    })
  } else {
    legDefs.push({
      id: 'paid', kind: 'incentive', label: 'Paid offer',
      note: plan === 'all' ? 'Everyone in the cohort' : 'Nothing in hand',
      campaign,
      cohort: plan === 'all' ? cohort : asCohort(cohort, nonHolders(cohort)),
      audience: econ.paid.targeted, econ: econ.paid,
    })
    if (econ.awareness) {
      legDefs.push({
        id: 'aware', kind: 'awareness', label: 'Awareness push',
        note: 'Already hold an unused benefit',
        campaign: awCampaign, cohort: asCohort(cohort, holders(cohort)),
        audience: econ.awareness.targeted, econ: econ.awareness,
      })
    }
  }

  /* ── Suppression, then routing, per leg ─────────────────────────── */
  const seq = (flow.fixedSeq?.length ? flow.fixedSeq : defaultFixedSeq(flow.channels))
    .filter((id) => flow.channels[id])
  const mode = flow.routeMode || 'agent'

  const legs = legDefs.map((l) => {
    const excl = applyExclusions(l.audience, flow.exclusions)
    const routes = mode === 'fixed'
      ? fixedRoutes(l.cohort, excl.reachable, flow.channels, seq)
      : buildRoutes(
          l.cohort, excl.reachable, flow.channels,
          legMap(flow.routeOrders, l.id), legMap(flow.journeys, l.id),
        )
    return {
      ...l,
      excl,
      reachable: excl.reachable,
      plan: routes,
      agentPlan: buildRoutes(l.cohort, excl.reachable, flow.channels, {}, {}),
    }
  })

  const audience = legs.reduce((n, l) => n + l.audience, 0)
  const reachable = legs.reduce((n, l) => n + l.reachable, 0)
  const removed = audience - reachable

  const totals = legs.reduce(
    (a, l) => ({
      people: a.people + l.plan.people,
      responders: a.responders + l.plan.responders,
      cost: a.cost + l.plan.cost,
      capped: a.capped + l.plan.capped,
      days: Math.max(a.days, l.plan.days),
      agentResponders: a.agentResponders + l.agentPlan.responders,
      agentCost: a.agentCost + l.agentPlan.cost,
    }),
    { people: 0, responders: 0, cost: 0, capped: 0, days: 0, agentResponders: 0, agentCost: 0 },
  )

  /* ── What it runs to ────────────────────────────────────────────────
     The campaign was quoted against the agent's own routing at the full
     audience with every suppression applied. Everything the operator has
     changed since moves the responder count, and profit moves with it. */
  const basePlan = buildRoutes(
    cohort,
    applyExclusions(audience, ALL_EXC_ON).reachable,
    QUOTE_CHANNELS, {}, {},
  )
  const out = modelOutcome({
    plan: { responders: totals.responders, cost: totals.cost },
    baseResponders: basePlan.responders,
    profitCr: econ.profitCr,
    investCr: econ.investCr,
    reachable,
  })

  const control = Math.round(reachable * CONTROL_PCT)
  const sending = Math.max(0, reachable - control)
  const channels = CHANNELS.filter((c) => flow.channels[c.id])

  const title = isAware
    ? campaign.name
    : econ.awareness
      ? `${campaign.name} + activation`
      : campaign.name

  return {
    segment,
    sibling: siblingOf(segment),
    cohort,
    campaign,
    isAware,
    plan,
    planDef,
    objective,
    sendWindow,
    econ,
    legs,
    totals,
    out,
    audience,
    reachable,
    removed,
    control,
    sending,
    channels,
    mode,
    seq,
    title,
    // What the agent rail needs to describe this campaign without inventing
    // figures of its own.
    coverage: COVERAGE,
    segmentCount: SEGMENTS.length,
    campaignCount: SEGMENTS.reduce((n, sg) => n + sg.campaigns.length, 0),
    groupCount: legs.reduce((n, l) => n + l.plan.routes.length, 0),
    window: WINDOW,
    exclusionCount: PM_EXC.filter((e) => flow.exclusions[e.id]).length,
    breaches: applyExclusions(audience, flow.exclusions).breaches,
  }
}

const ALL_EXC_ON = Object.fromEntries(PM_EXC.map((e) => [e.id, true]))

/**
 * The campaign as an approver, a launch check or an audit reads it.
 *
 * Every line is derived from the decisions actually taken, so a reviewer sees
 * the campaign in front of them rather than a description written months ago.
 */
export function launchRows(c) {
  const rows = [
    { k: 'Campaign', v: c.title },
    {
      k: 'Segment',
      v: `${c.segment.title} · ${fmtIN(c.segment.count)} cardholders`,
      note: c.segment.inHand
        ? `Already holds ${c.segment.inHand.toLowerCase()}`
        : c.segment.inHandLine,
    },
    { k: 'Objective', v: c.objective.goal, note: c.objective.constraint },
  ]

  if (c.legs.length > 1) {
    rows.push({
      k: 'Treatment',
      v: `${c.planDef.label} — ${c.legs.map((l) => `${l.label.toLowerCase()} to ${fmtIN(l.audience)}`).join(', ')}`,
      note: c.campaign.desc,
    })
  } else {
    // Naming the campaign again would just repeat the row above it; what the
    // approver has not been told yet is how much of the cohort it is bought for.
    rows.push({
      k: 'Treatment',
      v: c.planDef
        ? `${c.planDef.label} — ${fmtIN(c.legs[0].audience)} of the ${fmtIN(c.cohort.count)} cohort`
        : `Activation only — ${fmtIN(c.legs[0].audience)} who already hold it`,
      note: c.campaign.desc,
    })
  }

  rows.push(
    {
      k: 'Audience',
      v: `${fmtIN(c.reachable)} contacted of ${fmtIN(c.audience)} qualified`,
      note: `${c.exclusionCount} suppression rules · ${fmtIN(c.removed)} held back`,
    },
    {
      k: 'Channel',
      v: c.mode === 'fixed'
        ? c.seq.map((id) => CHANNELS.find((ch) => ch.id === id)?.name).filter(Boolean).join(' → ') || 'None selected'
        : `${c.legs.reduce((n, l) => n + l.plan.routes.length, 0)} routed groups · ${c.channels.map((ch) => ch.name).join(', ') || 'None selected'}`,
      note: c.mode === 'fixed'
        ? 'One sequence for everyone, chosen by you'
        : "Each cardholder on the channel they answer, cheapest response first",
    },
    { k: 'Window', v: `${c.window} · ${c.sendWindow.label.toLowerCase()}` },
    {
      k: 'Cost',
      v: `${crore(c.out.investCr)} programme · ${rupee(c.totals.cost)} contact`,
      note: `${fmtIN(c.totals.responders)} expected to respond`,
    },
    {
      k: 'Measurement',
      v: `Incremental profit vs a holdout of ${fmtIN(c.control)}`,
      note: `Modelled ${crore(c.out.profitCr)} at ${c.out.roiX.toFixed(1)}× return`,
    },
  )

  return rows
}

const crore = (n) => `₹${n.toFixed(2)} Cr`
const rupee = (n) => `₹${fmtIN(Math.round(n))}`
