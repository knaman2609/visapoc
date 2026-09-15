/**
 * Onboarding selectors.
 *
 * Everything the onboarding screen renders comes through here, computed over
 * the same population, so a stat tile and the rows beneath it cannot disagree.
 */

import { ONBOARDING_STAGES, STAGE_BY_ID } from '../data/onboarding.js'
import { getOnboardingPopulation, getOnboardingStats } from '../data/onboardingPopulation.js'

export const inr = (v) => {
  if (v === null || v === undefined) return '—'
  if (v >= 10000000) return `₹${(v / 10000000).toFixed(2)} Cr`
  if (v >= 100000) return `₹${(v / 100000).toFixed(2)}L`
  return `₹${Math.round(v / 1000)}K`
}

/** Headline counts for the book. No rates invented that the data cannot carry. */
export function bookSummary() {
  const st = getOnboardingStats()
  return {
    total: st.count,
    completedPct: st.completed / st.count,
    open: st.open,
    pastSla: st.breached,
    awaitingLimit: st.awaitingLimit,
    valueAtStake: st.valueAtStake,
  }
}

/** Open work grouped by cause, so one fix clears many files. */
export function blockerGroups() {
  return getOnboardingStats().blockers
}

/** Who has to move, across everything currently open. */
export function ownerSplit() {
  const st = getOnboardingStats()
  return Object.entries(st.byOwner)
    .map(([owner, count]) => ({ owner, count, share: st.open ? count / st.open : 0 }))
    .sort((a, b) => b.count - a.count)
}

/** How long open work has been waiting. */
export function ageingBands() {
  const rows = getOnboardingPopulation().filter((r) => r.open)
  const bands = [
    { label: 'Under a week', lo: 1, hi: 7 },
    { label: '1 – 2 weeks', lo: 8, hi: 14 },
    { label: '2 – 4 weeks', lo: 15, hi: 30 },
  ]
  return bands.map((b) => {
    const n = rows.filter((r) => r.days >= b.lo && r.days <= b.hi).length
    return { ...b, count: n, share: rows.length ? n / rows.length : 0 }
  })
}

/**
 * Every open application, longest-waiting first, with its stage attached.
 *
 * The whole open book rather than a sample: the queue is the list of people
 * somebody has to call, so leaving rows out of it would make it the wrong list.
 * The ten authored applicants carry `featured` through untouched, which is what
 * lets the screen offer their written detail without a second lookup.
 */
export function openQueue() {
  return getOnboardingPopulation()
    .filter((r) => r.open)
    .map((r) => ({ ...r, stage: STAGE_BY_ID[r.stuckAt] }))
    .sort((a, b) => b.days - a.days)
}

/**
 * The shortlist: who to work before anyone else.
 *
 * Ranked by how far past its own step's target a file has sat, weighted by
 * what it is worth — `(days / slaDays) × value`. A step's target is the
 * denominator rather than a flat number of days, because a day past a one-day
 * decision is a worse failure than a day past a five-day delivery.
 */
export function priorityQueue(n = 12) {
  return openQueue()
    .map((r) => ({ ...r, score: (r.days / r.stage.slaDays) * r.value }))
    .sort((a, b) => b.score - a.score)
    .slice(0, n)
}

/**
 * One application by id, for the journey page.
 *
 * Reads the whole population rather than `openQueue()`: a link kept from last
 * week points at a file that may since have closed, and the honest answer there
 * is the journey it actually ran, not a not-found. Returns null only for an id
 * that was never in the book.
 *
 * `stage` is null for an application that carried all the way through — the
 * journey then has no current step, which is what completion looks like.
 */
export function applicantById(id) {
  const row = getOnboardingPopulation().find((r) => r.id === id)
  if (!row) return null
  return { ...row, stage: row.stuckAt ? STAGE_BY_ID[row.stuckAt] : null }
}

/**
 * The journey one application ran, stage by stage.
 *
 * `reachedIdx` is the whole story: everything before it cleared, that stage is
 * where the file sits, everything after it was never reached. No dates are
 * invented — the population carries days-since-last-move and an intake week,
 * and nothing per stage, so a stage says where it stands and not when.
 */
export function journeySteps(row) {
  return ONBOARDING_STAGES.map((s, i) => {
    const state = i < row.reachedIdx ? 'cleared' : i === row.reachedIdx && !row.completed ? 'here' : row.completed ? 'cleared' : 'ahead'
    // The authored blocker carries its own fix and owner; fall back to the
    // stage's owner the same way the book-level roll-up does.
    const authored = state === 'here' ? s.blockers.find((b) => b.reason === row.blocker) : null
    return { ...s, state, action: authored?.action ?? null, blockerOwner: authored?.owner ?? s.owner }
  })
}

/**
 * The stage table: how far applications got, and where the book lost them.
 *
 * Reach and loss are one table rather than two, because they are the same eight
 * numbers read from either end — a second panel repeating `stopped` and the
 * drop rate under different headings was duplication, not analysis.
 *
 * Three denominators, none interchangeable, all labelled on screen:
 *   `ofStart`     — of everyone who applied, the share that got this far.
 *   `ofArrivals`  — of everyone who reached this step, the share that stopped
 *                   on it. This is the stage's own leak, the authored `drop`.
 *   `ofFailures`  — of every application the book lost, the share lost here.
 *                   This is what says where the losses actually concentrate.
 *
 * Losses split again by whether they are still recoverable: `stillOpen` is
 * inside the 30-day window and workable, `writtenOff` is past it.
 *
 * Journey order, not loss order: the sequence is the story, and a caller that
 * wants the worst first can sort a copy.
 */
export function stageTable() {
  const st = getOnboardingStats()
  const failed = st.count - st.completed
  return ONBOARDING_STAGES.map((s) => {
    const reached = st.reached[s.id]
    const stopped = st.stoppedAt[s.id]
    const stillOpen = st.openAt[s.id]
    return {
      ...s,
      reached,
      stopped,
      stillOpen,
      openHere: stillOpen,
      writtenOff: stopped - stillOpen,
      ofStart: reached / st.count,
      ofArrivals: reached ? stopped / reached : 0,
      dropRate: reached ? stopped / reached : 0,
      ofFailures: failed ? stopped / failed : 0,
    }
  })
}

let LOSS = null

/**
 * Every reason the book was lost, across all failed applications.
 *
 * The blocker roll-up in `getOnboardingStats` covers only the open queue,
 * because that is a worklist. This one covers everything that failed, open or
 * written off, because the question here is what goes wrong rather than what
 * can still be saved. Keyed on the reason alone: the authored blocker strings
 * are distinct across all eight stages, so no two causes can merge.
 *
 * Cached at module level, like the stats it sits beside — one pass over 8,420
 * rows, paid once.
 */
export function lossReasons() {
  if (LOSS) return LOSS

  const by = {}
  for (const r of getOnboardingPopulation()) {
    if (r.completed) continue
    const stage = STAGE_BY_ID[r.stuckAt]
    const authored = stage.blockers.find((b) => b.reason === r.blocker)
    if (!by[r.blocker]) {
      by[r.blocker] = {
        reason: r.blocker,
        stage: stage.label,
        tag: stage.tag,
        owner: authored?.owner ?? stage.owner,
        action: authored?.action ?? '',
        count: 0,
        stillOpen: 0,
        value: 0,
      }
    }
    by[r.blocker].count += 1
    by[r.blocker].value += r.value
    if (r.open) by[r.blocker].stillOpen += 1
  }

  const rows = Object.values(by).sort((a, b) => b.count - a.count)
  const failed = rows.reduce((n, r) => n + r.count, 0)
  LOSS = rows.map((r) => ({ ...r, share: failed ? r.count / failed : 0 }))
  return LOSS
}

const OUTCOMES = new Map()

/**
 * How a segment of the book actually resolved — both sides of it.
 *
 * The old breakdown counted open files only, which showed where the current
 * work sits and said nothing about who fails. This counts every application in
 * the segment, splits it into completed and failed, and names the stage that
 * accounts for most of that segment's losses.
 *
 * Ordered worst-first by default, because the reason to open this panel is to
 * find the segment that is not working. Cached per field.
 */
export function outcomeBy(field, order = null) {
  let rows = OUTCOMES.get(field)

  if (!rows) {
    const by = new Map()
    for (const r of getOnboardingPopulation()) {
      const key = r[field]
      if (!by.has(key)) by.set(key, { label: key, total: 0, completed: 0, failed: 0, stages: {} })
      const e = by.get(key)
      e.total += 1
      if (r.completed) e.completed += 1
      else {
        e.failed += 1
        e.stages[r.stuckAt] = (e.stages[r.stuckAt] ?? 0) + 1
      }
    }

    rows = [...by.values()].map((e) => {
      const worstId = Object.keys(e.stages).sort((a, b) => e.stages[b] - e.stages[a])[0]
      return {
        label: e.label,
        total: e.total,
        completed: e.completed,
        failed: e.failed,
        failRate: e.total ? e.failed / e.total : 0,
        worst: worstId ? STAGE_BY_ID[worstId] : null,
        worstCount: worstId ? e.stages[worstId] : 0,
      }
    })
    OUTCOMES.set(field, rows)
  }

  return order
    ? order.map((k) => rows.find((r) => r.label === k)).filter(Boolean)
    : [...rows].sort((a, b) => b.failRate - a.failRate)
}
