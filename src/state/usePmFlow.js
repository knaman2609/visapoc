import { useCallback, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { PM_APPROVERS, PM_MAILS } from '../data/portfolio.js'
import { PM_COHORT_SCAN, isTuned } from '../data/cohorts.js'
import { SEGMENTS } from '../data/coverage.js'
import { useStreamCounter } from './useStreamCounter.js'
import { SCAN_MS } from './pace.js'

const DEFAULT_EXC = {}
const DEFAULT_CHANNELS = { email: true, wa: true, sms: true }
const DEFAULT_EXCLUSIONS = { e1: true, e2: true, e3: true, e4: true }

/**
 * Global PM flow state. Reads the current step from the URL (:step param on /pm/flow/:step).
 * Streaming counters per step run automatically; toggles and picks are stable callbacks.
 */
export function usePmFlow() {
  const { step: stepParam } = useParams()
  const navigate = useNavigate()
  const step = clampStep(Number(stepParam))

  const [pmOpp, setPmOpp] = useState('o1')
  // No objective preselected — the operator picks one before the agent plans.
  const [objective, setObjective] = useState(null)
  const [openScan, setOpenScan] = useState(null)
  const [openCohort, setOpenCohort] = useState(null)
  const [bucketEx, setBucketEx] = useState(DEFAULT_EXC)
  const [channels, setChannels] = useState(DEFAULT_CHANNELS)
  // What the operator approved on the interventions step, carried into design.
  const [selection, setSelection] = useState(null)
  // Whether the operator accepted the agent's mid-flight channel reallocation.
  const [correctionApplied, setCorrectionApplied] = useState(false)
  const [exclusions, setExclusions] = useState(DEFAULT_EXCLUSIONS)
  // Per-segment channel order, keyed by segment. Empty means the agent's pick.
  const [routeOrders, setRouteOrders] = useState({})
  // Journeys the operator built by hand, keyed by segment. A key here replaces
  // the agent's sequence for that segment outright.
  const [journeys, setJourneys] = useState({})
  const [submitted, setSubmitted] = useState(false)
  const [sendWindow, setSendWindow] = useState('staged')
  // How much of the cohort the campaign is bought for: 'paired' runs the offer
  // on those with nothing in hand and activation on the holders, 'open' runs
  // the offer alone, 'all' pays the incentive to everyone.
  const [plan, setPlan] = useState('paired')
  // How a channel gets chosen: 'agent' routes each cardholder by what they
  // have answered before, 'fixed' sends one sequence to everybody.
  const [routeMode, setRouteMode] = useState('agent')
  // The operator's sequence, used only in 'fixed' mode. Empty means the
  // default — every live channel, cheapest response first.
  const [fixedSeq, setFixedSeq] = useState([])
  // Levers the operator moved in the iterate panel, kept per intervention so a
  // tuned offer still reads as tuned after the panel closes.
  const [tunings, setTunings] = useState({})

  // Streaming counters — each restarts when its step becomes active.
  // Drives the "identifying cohorts and agent interventions" loader on step 2.
  const cohortN = useStreamCounter(step === 2 ? PM_COHORT_SCAN.length : 0, SCAN_MS, [step === 2])
  const mailN = useStreamCounter(step === 4 ? PM_MAILS.length : 0, SCAN_MS, [step === 4])
  const apprN = useStreamCounter(submitted ? PM_APPROVERS.length : 0, 800, [submitted])
  const genPct = useStreamCounter(step === 6 ? 100 : 0, 42, [step === 6])

  const goStep = useCallback(
    (n) => {
      // Leaving step 2 drops the cohort drill-in, so coming back lands on the grid.
      setOpenCohort(null)
      navigate(`/pm/flow/${clampStep(n)}`)
    },
    [navigate],
  )

  const goBack = useCallback(() => {
    goStep(Math.max(0, step - 1))
  }, [goStep, step])

  const submit = useCallback(() => setSubmitted(true), [])

  const toggleBucket = useCallback((id) => {
    setBucketEx((prev) => ({ ...prev, [id]: !prev[id] }))
  }, [])

  const toggleChannel = useCallback((id) => {
    setChannels((prev) => ({ ...prev, [id]: !prev[id] }))
  }, [])

  const toggleExclusion = useCallback((id) => {
    setExclusions((prev) => ({ ...prev, [id]: !prev[id] }))
  }, [])

  const toggleScan = useCallback((id) => {
    setOpenScan((prev) => (prev === id ? null : id))
  }, [])

  /** Carry an approved campaign — and any iterated audience — into design. */
  const selectCampaign = useCallback((segment, campaign, tuned) => {
    setSelection({
      segmentId: segment.id,
      campaignId: campaign.id,
      kind: campaign.kind,
      name: campaign.name,
      targeted: tuned ? tuned.targeted : campaign.targeted,
      profitCr: tuned ? tuned.profitCr : campaign.profitCr,
      investCr: tuned ? tuned.investCr : campaign.investCr,
      roiX: tuned ? tuned.roiX : campaign.roiX,
      tuned: !!tuned,
    })
  }, [])

  const setRouteOrder = useCallback((key, seq) => {
    setRouteOrders((prev) => ({ ...prev, [key]: seq }))
  }, [])

  const resetRouteOrders = useCallback(() => {
    setRouteOrders({})
    setJourneys({})
  }, [])

  /** Put one segment on a hand-built journey. Empty steps hands it back to the agent. */
  const setJourney = useCallback((key, steps) => {
    setJourneys((prev) => (steps && steps.length ? { ...prev, [key]: steps } : dropKey(prev, key)))
  }, [])

  const clearJourney = useCallback((key) => {
    setJourneys((prev) => dropKey(prev, key))
  }, [])

  /** Adopt a whole plan — channels, sequences and journeys — in one move. */
  const applyPlan = useCallback((next) => {
    setChannels(next.channels)
    setRouteOrders(next.routeOrders || {})
    setJourneys(next.journeys || {})
  }, [])

  /** Put every segment on the same hand-built journey. */
  const applyJourneyToAll = useCallback((keys, steps) => {
    setJourneys((prev) => {
      const next = { ...prev }
      for (const k of keys) next[k] = steps
      return next
    })
  }, [])

  const applyCorrection = useCallback(() => setCorrectionApplied(true), [])

  const pickCohort = useCallback((id) => setOpenCohort(id), [])
  const closeCohort = useCallback(() => setOpenCohort(null), [])

  const pickOpp = useCallback((id) => setPmOpp(id), [])

  const pickObjective = useCallback((id) => setObjective(id), [])

  const setTuning = useCallback((offerId, opts) => {
    setTunings((prev) => (isTuned(opts)
      ? { ...prev, [offerId]: opts }
      : dropKey(prev, offerId)))
  }, [])

  const clearTuning = useCallback((offerId) => {
    setTunings((prev) => dropKey(prev, offerId))
  }, [])

  const pickSendWindow = useCallback((id) => setSendWindow(id), [])

  const pickPlan = useCallback((id) => setPlan(id), [])

  const pickRouteMode = useCallback((id) => setRouteMode(id), [])

  /** Toggle a channel in the fixed sequence, appending in the order clicked. */
  const toggleFixedStep = useCallback((id) => {
    setFixedSeq((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))
  }, [])

  const resetFixedSeq = useCallback(() => setFixedSeq([]), [])

  const pmRestart = useCallback(() => {
    setObjective(null)
    setSelection(null)
    setPlan('paired')
    setRouteMode('agent')
    setFixedSeq([])
    setTunings({})
    setRouteOrders({})
    setJourneys({})
    setCorrectionApplied(false)
    setSubmitted(false)
    goStep(0)
  }, [goStep])

  const approved = submitted && apprN >= PM_APPROVERS.length
  // Nothing selected yet means the first segment's lead campaign, so the design
  // step always has a coherent campaign to render.
  const selected = selection || {
    segmentId: SEGMENTS[0].id,
    campaignId: SEGMENTS[0].campaigns[0].id,
  }

  return {
    step,
    pmOpp,
    objective,
    openScan,
    openCohort,
    bucketEx,
    channels,
    selection: selected,
    hasSelection: !!selection,
    exclusions,
    routeOrders,
    journeys,
    correctionApplied,
    sendWindow,
    plan,
    routeMode,
    fixedSeq,
    submitted,
    approved,
    tunings,
    cohortN,
    mailN,
    apprN,
    genPct,
    goStep,
    goBack,
    submit,
    toggleBucket,
    toggleChannel,
    selectCampaign,
    toggleExclusion,
    setRouteOrder,
    resetRouteOrders,
    setJourney,
    clearJourney,
    applyJourneyToAll,
    applyPlan,
    applyCorrection,
    toggleScan,
    pickCohort,
    closeCohort,
    pickOpp,
    pickObjective,
    setTuning,
    clearTuning,
    pickSendWindow,
    pickPlan,
    pickRouteMode,
    toggleFixedStep,
    resetFixedSeq,
    pmRestart,
  }
}

function dropKey(obj, key) {
  if (!(key in obj)) return obj
  const next = { ...obj }
  delete next[key]
  return next
}

function clampStep(n) {
  if (!Number.isFinite(n)) return 0
  return Math.max(0, Math.min(7, Math.floor(n)))
}
