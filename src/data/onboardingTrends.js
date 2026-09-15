/**
 * Onboarding trends — a metric, split by a segment, across the quarter.
 *
 * Every row carries the week it arrived, assigned in onboardingPopulation.js
 * from a hash of its id rather than a draw. The generator conditions on that
 * week, so the improvement these lines show is real in the data underneath and
 * not applied on top of it.
 *
 * Rates are computed over the whole book rather than the open slice: a
 * completion rate needs every application that ever entered as its denominator,
 * not just the ones still being worked.
 */

import { ONBOARDING_STAGES } from './onboarding.js'
import { getOnboardingPopulation, WEEKS } from './onboardingPopulation.js'

export { WEEKS }

/** Below this many applications a weekly rate is noise, so the line breaks. */
const MIN_BUCKET = 30

/**
 * A bucket has to carry enough of the thing being measured, not just enough
 * rows.
 *
 * Thirty was a sound floor while every metric was a 30–100% reach share. The
 * loss and book metrics run at 3–20%, so a passing thirty-row bucket can rest
 * on a single file — and because the chart fits its y-axis to the data, one
 * file becomes a full-height swing. Requiring a floor of expected events makes
 * the guard scale with the metric rather than with the sample, which is what
 * it was always for.
 */
const MIN_EVENTS = 5

const idxOf = (id) => ONBOARDING_STAGES.findIndex((s) => s.id === id)

/**
 * Every metric is a share of the week's intake, so they all read in percent on
 * one y-axis and the picker can swap between them without a second scale.
 *
 * Three groups, and the difference between them matters when reading a number:
 *
 *   `reach`  — cumulative. Share that got *at least* this far. An application
 *              counts towards every reach metric up to where it stopped.
 *   `loss`   — exclusive. Share that stopped *exactly* here. An application
 *              counts towards one loss metric and no other, so the eight of
 *              them plus the completion rate account for the whole book.
 *   `book`   — cross-cutting totals that are neither.
 *
 * A loss metric is not the stage's authored drop rate: `drop` is a share of
 * that stage's own arrivals, these are shares of everyone who applied.
 */
export const TREND_METRICS = [
  {
    id: 'approved',
    kind: 'reach',
    label: 'Reached approval',
    note: 'Share of the week’s applications that cleared the credit decision.',
    test: (r) => r.reachedIdx >= idxOf('s4'),
  },
  {
    id: 'delivered',
    kind: 'reach',
    label: 'Card delivered',
    note: 'Share that got a card into the applicant’s hands.',
    test: (r) => r.reachedIdx >= idxOf('s6'),
  },
  {
    id: 'activated',
    kind: 'reach',
    label: 'Activated',
    note: 'Share that activated — the RBI 30-day consent clock starts here.',
    test: (r) => r.reachedIdx >= idxOf('s7'),
  },
  {
    id: 'spent',
    kind: 'reach',
    label: 'Reached first spend',
    note: 'Share that completed onboarding end to end.',
    test: (r) => r.completed,
  },

  // One per stage, in journey order, so every way the book loses an
  // application can be plotted rather than only the four worst.
  {
    id: 'lost-application',
    kind: 'loss',
    label: 'Application never submitted',
    note: 'Share that opened the form and left it — abandoned mid-form, OTP unverified, or bureau consent declined.',
    test: (r) => r.stuckAt === 's1',
  },
  {
    id: 'lost-kyc',
    kind: 'loss',
    label: 'KYC never verified',
    note: 'Share that stopped without a proven identity — the largest single leak, and the most recoverable.',
    test: (r) => r.stuckAt === 's2',
  },
  {
    id: 'lost-income',
    kind: 'loss',
    label: 'Income never verified',
    note: 'Share that stopped because income could not be proven from statements, payslips or ITR.',
    test: (r) => r.stuckAt === 's3',
  },
  {
    id: 'lost-decision',
    kind: 'loss',
    label: 'Declined at the credit decision',
    note: 'Share that stopped at approval — a credit call rather than a service failure.',
    test: (r) => r.stuckAt === 's4',
  },
  {
    id: 'lost-limit',
    kind: 'loss',
    label: 'Approved, no limit assigned',
    note: 'Share approved and then left without a limit. Nobody is chasing these, because the file already reads as approved.',
    test: (r) => r.stuckAt === 's5',
  },
  {
    id: 'lost-delivery',
    kind: 'loss',
    label: 'Card never delivered',
    note: 'Share with a limit set and a card that never arrived — undeliverable address, returned to origin, or a courier that stalled.',
    test: (r) => r.stuckAt === 's6',
  },
  {
    id: 'lost-activation',
    kind: 'loss',
    label: 'Delivered, never activated',
    note: 'Share that took delivery and stopped there. The bank has paid to issue the card and gets nothing back.',
    test: (r) => r.stuckAt === 's7',
  },
  {
    id: 'lost-firstspend',
    kind: 'loss',
    label: 'Activated, never spent',
    note: 'Share that switched the card on and never used it — as expensive to run as one that spends.',
    test: (r) => r.stuckAt === 's8',
  },

  {
    id: 'lost-any',
    kind: 'book',
    label: 'Failed anywhere',
    note: 'Share that stopped at some point instead of reaching first spend — every loss metric above, added together.',
    test: (r) => !r.completed,
  },
  {
    id: 'written-off',
    kind: 'book',
    label: 'Written off',
    note: 'Share that failed and has since sat more than 30 days, past the point anybody works it. What is left of the failures is still open.',
    test: (r) => !r.completed && !r.open,
  },
  {
    id: 'past-sla',
    kind: 'book',
    label: 'Open and past SLA',
    note: 'Share still workable but sitting more than three times its step’s target — the queue that is going wrong right now.',
    test: (r) => r.open && r.breached,
  },
]

/** The picker groups by these, in this order. */
export const METRIC_KINDS = [
  { kind: 'reach', label: 'How far they got' },
  { kind: 'loss', label: 'Where they were lost' },
  { kind: 'book', label: 'Across the book' },
]

export const TREND_SEGMENTS = [
  { id: 'channel', label: 'Source channel' },
  { id: 'variant', label: 'Card variant' },
  { id: 'kyc', label: 'KYC mode' },
]

/**
 * One line per segment value, capped at the five largest so the chart stays
 * readable. A point whose bucket is too thin is null — the line breaks there
 * rather than drawing a swing off twenty files.
 */
export function trendSeries(metricId, segmentId) {
  const metric = TREND_METRICS.find((m) => m.id === metricId) ?? TREND_METRICS[0]
  const rows = getOnboardingPopulation()

  // The metric's own rate across the whole book sets how big a bucket has to
  // be before a point on it means anything.
  const bookRate = rows.filter(metric.test).length / rows.length
  const minBucket = Math.max(MIN_BUCKET, Math.ceil(MIN_EVENTS / Math.max(bookRate, 0.005)))

  const totals = new Map()
  rows.forEach((r) => totals.set(r[segmentId], (totals.get(r[segmentId]) ?? 0) + 1))
  const names = [...totals.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5).map(([k]) => k)

  const series = names.map((name) => {
    const mine = rows.filter((r) => r[segmentId] === name)
    const points = []
    for (let w = 0; w < WEEKS; w += 1) {
      const bucket = mine.filter((r) => r.week === w)
      points.push({
        w,
        n: bucket.length,
        v: bucket.length >= minBucket
          ? (bucket.filter(metric.test).length / bucket.length) * 100
          : null,
      })
    }
    const shown = points.filter((p) => p.v !== null)
    return {
      name,
      total: mine.length,
      points,
      // The quarter's own rate, so the legend carries a number and not just a colour.
      rate: (mine.filter(metric.test).length / mine.length) * 100,
      thin: points.length - shown.length,
    }
  })

  return { metric, series }
}

/** Week labels: W1 … W13, oldest first. */
export const WEEK_LABELS = Array.from({ length: WEEKS }, (_, i) => `W${i + 1}`)
