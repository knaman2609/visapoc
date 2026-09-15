/**
 * Agent panel content — the four reasoning layers the agent runs at every step
 * of the PM flow, plus the grounded answers the assistant can give.
 *
 * Every figure here is the same figure the step itself renders. The panel is a
 * window onto the work, not a second source of truth.
 */

/* Four layers, one per step. tag = the engine layer, result = what it returned. */
export const STEP_REASONING = [
  [ /* 0 · Scan */
    { tag: 'PORTFOLIO SWEEP', label: 'Scored every card in the book across nine behaviour models', result: '2.4M cards' },
    { tag: 'BENCHMARK COMPARE', label: 'Benchmarked each segment against the anonymised peer cohort', result: '6 segments' },
    { tag: 'SIGNAL DETECTION', label: 'Detected engagement, share-of-wallet and attrition shifts', result: '14 shifts' },
    { tag: 'ANOMALY ISOLATE', label: 'Isolated the one segment both high-value and abnormal', result: '+5.7 pts' },
  ],
  [ /* 1 · Cohort */
    { tag: 'RULE APPLICATION', label: 'Applied five qualifying rules to the affluent lifecycle', result: '45,230' },
    { tag: 'CAUSE ATTRIBUTION', label: 'Attributed the attrition signal to three competing causes', result: '3 causes' },
    { tag: 'CAUSE WEIGHTING', label: 'Weighted each cause by its share of the cohort', result: '44% lead' },
    { tag: 'ELIGIBILITY', label: 'Checked the cohort against the 12-month delinquency filter', result: 'clean' },
  ],
  [ /* 2 · Suggested interventions */
    { tag: 'COVERAGE CHECK', label: 'Checked every card for a benefit already live and unused', result: '17,865 hold' },
    { tag: 'SEGMENTATION', label: 'Cut the book by spend and by what is already in hand', result: '8 segments' },
    { tag: 'CAMPAIGN MODEL', label: 'Modelled an activation push and three offers per cohort', result: '16 campaigns' },
    { tag: 'PLAN COMPARE', label: 'Compared paying everyone against activating the holders', result: 'both wins' },
  ],
  [ /* 3 · Design */
    { tag: 'OBJECTIVE PARSE', label: 'Read the retention objective against the attributed cause', result: 'attrition' },
    { tag: 'OFFER SELECTION', label: 'Matched the offer to unredeemed benefit value', result: '₹600 / card' },
    { tag: 'CHANNEL MODEL', label: 'Ranked channels by response rate net of send cost', result: '3 selected' },
    { tag: 'OUTCOME MODEL', label: 'Modelled profit, programme cost and control size', result: '₹5.5 Cr' },
  ],
  [ /* 4 · Preview */
    { tag: 'PERSONALISATION', label: 'Pulled per-customer facts into every message', result: '4 fields' },
    { tag: 'COPY GENERATION', label: 'Generated email, WhatsApp and SMS variants', result: '3 channels' },
    { tag: 'COMPLIANCE CHECK', label: 'Checked every claim against product terms and consent', result: 'passed' },
    { tag: 'SAMPLE ASSEMBLY', label: 'Assembled samples for human review before bulk', result: '3 drafts' },
  ],
  [ /* 5 · Approve */
    { tag: 'POLICY CHECK', label: 'Validated the campaign against marketing policy', result: 'passed' },
    { tag: 'BUDGET CHECK', label: 'Confirmed the cost sits inside the ₹8.3 Cr retention budget', result: '₹2.4 Cr' },
    { tag: 'APPROVAL ROUTING', label: 'Routed to the required approvers in sequence', result: '3 approvers' },
    { tag: 'AUDIT TRAIL', label: 'Wrote the decision trail to the audit log', result: 'recorded' },
  ],
  [ /* 6 · Launch */
    { tag: 'BULK RENDER', label: 'Rendered personalised messages for the full audience', result: '40,119' },
    { tag: 'CONTROL HOLDOUT', label: 'Held back a randomised measurement control', result: '3,571' },
    { tag: 'PRE-FLIGHT', label: 'Re-checked every exclusion rule at send time', result: '4 rules' },
    { tag: 'DISPATCH', label: 'Staged the batches out to the channel providers', result: '3 providers' },
  ],
  [ /* 7 · Live */
    { tag: 'DELIVERY', label: 'Tracking delivery and open rates by channel', result: 'live' },
    { tag: 'RESPONSE', label: 'Measuring activation against the held-back control', result: 'tracking' },
    { tag: 'ATTRIBUTION', label: 'Attributing recovered spend to the treatment', result: 'in progress' },
    { tag: 'FEEDBACK', label: 'Feeding the outcome back into the attribution models', result: 'queued' },
  ],
]

/* One line the agent leaves behind once a step's reasoning completes. */
export const STEP_CONCLUSION = [
  'Affluent – Top-of-Wallet is the one segment both high-value and abnormal — 45,230 cardholders churning 5.7 points above peers, inside a ₹7,400 Cr micro-group.',
  'The drift is a wallet shift, not distress. Payment volume is still growing at +8.4%, but a competitor mailer has pulled travel spend away.',
  'Two in five already hold a benefit they have never used. Splitting the book that way means the incentive is only bought for the people with nothing in hand.',
  'A benefit reminder beats a discount here — the value is already on the card and unclaimed. Modelled profit is ₹5.5 Cr against ₹2.4 Cr of cost, a 2.3× return.',
  'Each message leads with a number the customer already owns. Nothing claims a benefit the product does not carry.',
  'The campaign is inside policy and inside budget. It needs three approvals before generation can start.',
  'Every message is rendered, 3,571 cardholders are held back as a real control, and the batches go out staged rather than all at once — so a deliverability problem surfaces on a small batch first.',
  'Early response is tracking ahead of the modelled curve. Attribution stays provisional until the control matures.',
]

const inr = (n) => Math.round(n).toLocaleString('en-IN')
const cr = (n) => `₹${n.toFixed(2)} Cr`

/**
 * The rail is a window onto the work, not a second source of truth — so from
 * the point a campaign exists, its figures are the campaign's own. The prose
 * stays authored; only the numbers are substituted, and only where leaving
 * them fixed would contradict the screen beside them.
 */
const REASONING_OVERRIDES = {
  2: (c) => [
    { result: `${inr(c.coverage.held)} hold` },
    { result: `${c.segmentCount} segments` },
    { result: `${c.campaignCount} campaigns` },
    { result: c.plan === 'paired' ? 'both wins' : c.plan === 'all' ? 'pay everyone' : 'offer only' },
  ],
  3: (c) => [
    {},
    { label: 'Matched the offer to unredeemed benefit value',
      result: `₹${inr((c.econ.investCr * 1e7) / Math.max(1, c.econ.targeted))} / card` },
    { label: 'Split the audience by the channels each cardholder answers',
      result: `${c.groupCount} groups` },
    { result: cr(c.out.profitCr) },
  ],
  5: (c) => [{}, { result: cr(c.out.investCr) }, {}, {}],
  6: (c) => [
    { result: inr(c.reachable) },
    { result: inr(c.control) },
    { result: `${c.exclusionCount} rules` },
    { result: `${c.channels.length} providers` },
  ],
}

const CONCLUSION_OVERRIDES = {
  2: (c) => `${inr(c.coverage.held)} of ${inr(c.coverage.total)} already hold a benefit they have `
    + `never used. Splitting there means the incentive is only bought for the `
    + `${inr(c.coverage.open)} with nothing in hand.`,
  3: (c) => `${c.title}. ${inr(c.reachable)} contacted across ${c.groupCount} routed groups, `
    + `modelled at ${cr(c.out.profitCr)} against ${cr(c.out.investCr)} of cost — `
    + `a ${c.out.roiX.toFixed(1)}× return.`,
  5: (c) => `The campaign is inside policy and inside budget at ${cr(c.out.investCr)}. `
    + 'It needs three approvals before generation can start.',
  6: (c) => `Every message is rendered, ${inr(c.control)} cardholders are held back as a real `
    + 'control, and the batches go out staged rather than all at once — so a deliverability '
    + 'problem surfaces on a small batch first.',
}

/** The four layers for a step, with the live campaign's figures folded in. */
export function stepReasoning(step, c) {
  const base = STEP_REASONING[step] || STEP_REASONING[0]
  const over = c && REASONING_OVERRIDES[step]
  if (!over) return base
  const patch = over(c)
  return base.map((l, i) => ({ ...l, ...patch[i] }))
}

/** The line the agent leaves behind once a step's reasoning completes. */
export function stepConclusion(step, c) {
  const over = c && CONCLUSION_OVERRIDES[step]
  return over ? over(c) : STEP_CONCLUSION[step]
}

/* Suggested prompts, per step. */
export const CHAT_SUGGESTIONS = [
  ['Why is this the top opportunity?', 'How far above the peer benchmark?'],
  ['Why did spend actually drop?', 'How was the cohort built?'],
  ['Why exclude Anita Desai?', 'How big is the audience now?'],
  ['How was ₹5.5 Cr modelled?', 'Why these three channels?', 'What does it cost?'],
  ['What is personalised per customer?', 'Is the copy compliant?'],
  ['Who has to approve this?', 'Is it inside budget?'],
  ['Why hold back a control?', 'Why stage the sends?', 'What happens if a channel fails?'],
  ['How is uplift measured?', 'When are results final?'],
]

/* Keyword-routed answers. Every number matches what the step renders. */
export const CHAT_REPLIES = [
  { re: /5\.5\s*cr|modell?ed|outcome|recovery|roi|return|profit/i, text:
    'The ₹5.5 Cr is incremental profit over the retention horizon, not revenue. It comes from easing 90-day attrition 14.2% → 11.4% across the treated group — 40,240 cardholders less the 4,024 held back as control, roughly 1,150 cards not lost. Programme cost at full audience is ₹2.4 Cr at ₹600 per cardholder, inside the ₹8.3 Cr retention budget. That is a 2.3× return, measured against the holdout rather than projected.' },
  { re: /channel|email|whatsapp|sms|send|why three/i, text:
    'Three channels, ranked by response rate net of send cost. Email carries the full benefit explanation and costs least. WhatsApp lands the reminder where this cohort already reads. SMS is the fallback for non-openers. Every customer only receives the channels they hold consent for — the marketing-consent exclusion is checked again at send time, not just now.' },
  { re: /cost|budget|8\.3|600|spend limit|afford/i, text:
    'Cost per cardholder is ₹600, so ₹2.4 Cr at the full 40,240 audience — a capped rewards boost of ₹1.65 Cr plus ₹75 L of execution. That sits inside the ₹8.3 Cr retention budget, which is why the approval route is three approvers rather than an exception path. Against ₹5.5 Cr of incremental profit the return is 2.3×.' },
  { re: /anita|desai|exclude|seasonal|false positive/i, text:
    'Anita Desai\'s decline mirrors the same months last year and her engagement score has not moved — 62, above the cohort median. That reads as seasonality, not attrition. Her bucket is 4,990 cardholders, which is why the audience drops from 45,230 to 40,240. Treating them would spend budget on people who were never leaving.' },
  { re: /why.*(drop|decline|fall)|cause|attribut|reason/i, text:
    'Three causes, weighted by share of cohort: travel spend down 22% after a competitor mailer (44%), dining spend growing while rewards engagement stays flat (38%), and large-ticket tech purchases routed to a rival card (31%). They overlap, which is the point — the same cardholder often carries several. It is a wallet shift, not financial distress.' },
  { re: /top opportunity|why.*first|7,?400|rank|at stake|abnormal/i, text:
    'Affluent – Top-of-Wallet is the only segment that is both high-value and abnormal. Its 90-day attrition runs at 14.2% against an 8.5% peer benchmark — 5.7 points above — inside a ₹7,400 Cr micro-group, 17.8% of portfolio payment volume. Every other segment sits within a point of its benchmark. It is also addressable now, because the benefit value already sits unclaimed on the card.' },
  { re: /cohort|how.*built|rule|qualify|45,?230/i, text:
    'Five rules, applied in order: segment is Affluent – Top-of-Wallet; 90-day attrition risk scored above the 8.5% peer benchmark; share of wallet ≥ 35%, so the card is top-of-wallet today; no delinquency in 12 months; marketing consent on file. That lands 45,230 cardholders from a 2.4M-card book.' },
  { re: /control|holdout|3,?400|measure|uplift|prove/i, text:
    '4,024 cardholders — a 10% holdout — are randomised out and receive nothing. Attrition and profit in the treated group are measured against them, so the 14.2% → 11.4% move is a difference rather than a before-and-after. Attribution stays provisional until that control matures — a number that moves early usually moves back.' },
  { re: /personalis|copy|message|compliance|claim/i, text:
    'Four fields per customer are pulled into the message — tenure, unclaimed benefit value, unused lounge visits and top spend category. Every claim is checked against the product terms and the consent on file before it renders. Nothing offers a benefit the customer\'s card does not carry.' },
  { re: /approv|policy|who.*sign|audit/i, text:
    'Three approvers in sequence, and the campaign cannot generate until all three clear it. Policy validation and the budget check run before routing, so approvers see a campaign that already passed both. The full decision trail is written to the audit log as it goes.' },
  { re: /stage|throttl|deliverab|fail|risk/i, text:
    'Sends are staged rather than fired at once, so a deliverability problem shows up on a small batch before it reaches 40,240 cardholders. Exclusions are re-checked at send time — a cardholder who goes delinquent or withdraws consent between now and dispatch drops out automatically.' },
]

/* Channel options for the design step — reach, cost and consent are real constraints. */
// Contact channels for the cascade. `reachPct` is the share of an audience
// that is contactable here at all; `respondPct` is the base response rate
// before the audience's own channel propensity is taken into account.
export const CHANNELS = [
  { id: 'email', name: 'Email',    hint: 'Cheap to send, carries the full benefit explanation', reachPct: 0.92, openPct: 0.38, respondPct: 0.06, cost: 0.40 },
  { id: 'wa',    name: 'WhatsApp', hint: 'Best digital response, but the premium-priced channel',  reachPct: 0.78, openPct: 0.64, respondPct: 0.08, cost: 1.10 },
  { id: 'sms',   name: 'SMS',      hint: 'Universal reach, cheapest send, lowest engagement',      reachPct: 0.99, openPct: 0.21, respondPct: 0.02, cost: 0.18 },
  { id: 'voice', name: 'Automated call',
    hint: 'Reaches anyone with a phone, but an affluent cohort hangs up on a recording',
    reachPct: 0.96, openPct: 0.29, respondPct: 0.035, cost: 0.65 },
  { id: 'inapp', name: 'In-app push',
    hint: 'Owned channel — costs almost nothing, but only reaches cardholders with the app and notifications on',
    reachPct: 0.61, openPct: 0.42, respondPct: 0.055, cost: 0.02 },
  { id: 'banner', name: 'In-app banner',
    hint: 'Shown when they next open the app. Free to place, but it waits for them to come to you',
    reachPct: 0.68, openPct: 0.55, respondPct: 0.031, cost: 0.01 },
  { id: 'rm',    name: 'RM call',
    hint: 'A relationship manager on the phone. Converts far better than anything else and cannot be scaled',
    reachPct: 0.94, openPct: 0.86, respondPct: 0.34, cost: 95,
    // 40 managers, twelve calls a day, across a seven-day send window.
    capacity: 3360,
    capacityNote: '40 managers · 12 calls a day · 7 days' },
]

/* The channel mix the offer was quoted against. It anchors the modelled
   outcome, so it stays the three digital channels even as more are added. */
export const QUOTE_CHANNELS = { email: true, wa: true, sms: true }

/** Annual contribution above which a cardholder is actually covered by an RM. */
export const RM_COVER = 60000

/**
 * Everyone can be phoned, so the automated call is open to the whole book, and
 * the owned in-app surfaces are open to anyone with the app — their reach rate
 * is what accounts for the ones who do not have it. A manager's call is not:
 * it only reaches the cardholders one already covers.
 */
export const reachableChannels = (m) => [
  ...m.respondsTo,
  'voice',
  'inapp',
  'banner',
  ...(m.profit >= RM_COVER ? ['rm'] : []),
]

/** Channels the bank owns outright — no per-message fee to a provider. */
export const OWNED = ['inapp', 'banner']

const MAX_RATE = 0.6

const chan = (id) => CHANNELS.find((c) => c.id === id)

/* ── Journey model ──────────────────────────────────────────────────────
   A journey is an ordered list of touches. Each touch names a channel, how
   many days to wait after the previous one, and whether it goes only to the
   people still open or to the whole segment again. The agent's own routing
   and anything the operator builds by hand run through the same model, so
   the two are directly comparable.
------------------------------------------------------------------------ */

export const WAIT_OPTIONS = [
  { id: 0, label: 'Same day' },
  { id: 1, label: '1 day later' },
  { id: 2, label: '2 days later' },
  { id: 3, label: '3 days later' },
  { id: 5, label: '5 days later' },
  { id: 7, label: 'A week later' },
]

export const SEND_TO = [
  { id: 'open', label: 'Only who has not responded', hint: 'Pays for the people still worth reaching' },
  { id: 'all', label: 'The whole segment again', hint: 'Bills for responders a second time and buys nothing' },
]

// Landing on a channel someone actually answers beats a cold touch, but only
// modestly. Each further touch is answered less — they have already passed once.
const POSITION_LIFT = [1.35, 1.0, 0.8, 0.62, 0.5]
const positionLift = (i) => POSITION_LIFT[i] ?? 0.42

// A touch that lands the same day reads as pressure; one that lands a week on
// has lost the thread. Two to three days is where response holds up.
function waitFactor(days) {
  if (days <= 0) return 0.82
  if (days <= 1) return 0.95
  if (days <= 3) return 1
  if (days <= 5) return 0.94
  return 0.85
}

// The same channel twice: they already ignored it once there.
const REPEAT_FATIGUE = 0.55
// A channel this segment does not answer still delivers. It just does not convert.
const OFF_CHANNEL = 0.22

/** The agent's journey for a sequence — its default pacing is a two-day gap. */
export const agentJourney = (seq) =>
  seq.map((id, i) => ({ ch: id, wait: i === 0 ? 0 : 2, to: 'open' }))

export const journeyLabel = (steps) =>
  steps.map((s) => chan(s.ch)?.name).filter(Boolean).join(' → ')

/**
 * Run a journey over a group of people and return the cascade touch by touch.
 * `answers` is the set of channels this segment actually responds to; a touch
 * outside it is still delivered and still billed, it just barely converts.
 */
export function runJourney(people, steps, answers = null, caps = null) {
  const set = answers ? new Set(answers) : null
  const seen = new Map()
  let open = people
  let cost = 0
  let day = 0
  let capped = 0

  const rows = steps.map((s, i) => {
    const ch = chan(s.ch)
    if (!ch) return null
    const wait = i === 0 ? 0 : (s.wait ?? 2)
    day += wait
    const repeats = seen.get(s.ch) || 0
    seen.set(s.ch, repeats + 1)

    // Re-contacting everyone bills for responders too; only the open ones convert.
    const toAll = s.to === 'all' && i > 0
    const wanted = Math.round((toAll ? people : open) * ch.reachPct)
    // A capped channel — a manager's own call list — runs out. Whoever is left
    // over is not contacted on this touch at all.
    const left = ch.capacity == null ? Infinity
      : Math.max(0, caps ? (caps[ch.id] ?? ch.capacity) : ch.capacity)
    const contacted = Math.min(wanted, left)
    const short = wanted - contacted
    if (caps && ch.capacity != null) caps[ch.id] = Math.max(0, left - contacted)
    capped += short
    // Only the share of the open pool that actually got contacted can convert.
    const live = wanted > 0
      ? Math.round(Math.round(open * ch.reachPct) * (contacted / wanted))
      : 0
    const offChannel = !!set && !set.has(s.ch)

    let rate = ch.respondPct * positionLift(i) * waitFactor(wait)
    if (repeats) rate *= REPEAT_FATIGUE ** repeats
    if (offChannel) rate *= OFF_CHANNEL
    rate = Math.min(MAX_RATE, rate)

    const responded = Math.round(live * rate)
    const spend = contacted * ch.cost
    cost += spend
    open -= responded

    return {
      ...ch,
      key: `${i}-${s.ch}`,
      index: i,
      wait,
      day,
      toAll,
      contacted,
      wanted,
      short,
      capped: short > 0,
      wasted: Math.max(0, contacted - live),
      rate,
      responded,
      open,
      cost: spend,
      offChannel,
      repeat: repeats > 0,
    }
  }).filter(Boolean)

  const responders = people - open
  return {
    rows,
    people,
    responders,
    cost,
    capped,
    days: day,
    rate: people ? responders / people : 0,
    cpr: responders ? cost / responders : 0,
  }
}

/** Named journeys worth starting from, rather than an empty canvas. */
export const JOURNEY_TEMPLATES = [
  { id: 'cheap', name: 'Cheap reach first',
    note: 'Convert the bulk on the low-cost channel, then pay premium on the rest',
    build: (ids) => agentJourney(defaultSequence(ids)) },
  { id: 'premium', name: 'Premium first',
    note: 'Lead with the channel that answers best, whatever it costs',
    build: (ids) => agentJourney([...ids].sort((a, b) => chan(b).respondPct - chan(a).respondPct)) },
  { id: 'drip', name: 'Three-touch drip',
    note: 'A wider gap between touches, one more chance to answer',
    build: (ids) => {
      const order = defaultSequence(ids)
      const three = [order[0], order[1] ?? order[0], order[2] ?? order[0]]
      return three.map((ch, i) => ({ ch, wait: i === 0 ? 0 : 3, to: 'open' }))
    } },
  { id: 'nudge', name: 'Nudge, then detail',
    note: 'The cheapest channel opens it, the fuller message follows the next day',
    build: (ids) => {
      const byCost = [...ids].sort((a, b) => chan(a).cost - chan(b).cost)
      const short = byCost[0]
      const long = byCost[byCost.length - 1]
      return short === long
        ? [{ ch: short, wait: 0, to: 'open' }]
        : [{ ch: short, wait: 0, to: 'open' }, { ch: long, wait: 1, to: 'open' }]
    } },
]

/** A journey's shape as one comparable string — used to name it after a template. */
export const journeyShape = (steps) =>
  steps.map((s, i) => `${s.ch}:${i === 0 ? 0 : (s.wait ?? 2)}:${s.to ?? 'open'}`).join('|')

/** Segments are defined by which channels a cardholder answers, not by order. */
export const segmentKey = (ids) => [...ids].sort().join('|')

/** Responses bought per rupee — how the agent ranks a channel for a segment. */
export const efficiency = (id) => chan(id).respondPct / chan(id).cost

/**
 * The agent's default sequence: the channel that returns the most responses
 * per rupee goes first, so the bulk of the segment converts cheaply, and the
 * premium channel is only paid for on whoever is still left.
 */
export const defaultSequence = (ids) => [...ids].sort((x, y) => efficiency(y) - efficiency(x))

/** Every order the operator can put this segment on. */
export function sequenceOptions(ids) {
  const out = []
  const walk = (rest, acc) => {
    if (!rest.length) return out.push(acc)
    rest.forEach((id, i) => walk([...rest.slice(0, i), ...rest.slice(i + 1)], [...acc, id]))
  }
  walk([...ids], [])
  return out
}

/**
 * Split an audience into segments by which channels they answer, put each on
 * its own journey, and run it.
 *
 * Nobody gets one blanket journey: a cardholder who answers SMS and WhatsApp
 * is sent SMS → WhatsApp, while one who answers email and WhatsApp is sent
 * Email → WhatsApp. `orders` reorders the agent's sequence for a segment;
 * `journeys` replaces it outright with one the operator built.
 */
export function buildRoutes(cohort, audience, enabled, orders = {}, journeys = {}) {
  const groups = new Map()

  for (const m of cohort.members) {
    const ids = reachableChannels(m).filter((id) => enabled[id])
    if (!ids.length) continue
    const key = segmentKey(ids)
    if (!groups.has(key)) groups.set(key, { key, ids, n: 0 })
    groups.get(key).n += 1
  }

  // A manager's call list is one budget for the whole campaign. Handing it to
  // the biggest segment first would leave smaller ones with a touch that
  // reaches nobody, so it is split in proportion to segment size instead —
  // which is also how the calls would actually be shared out.
  const capped = CHANNELS.filter((c) => c.capacity != null)
  // Only the segments a capped channel can actually reach share its budget —
  // a slice given to a segment with no manager cover would just go unspent.
  const eligible = Object.fromEntries(capped.map((c) => [
    c.id,
    [...groups.values()].filter((g) => g.ids.includes(c.id)).reduce((n, g) => n + g.n, 0) || 1,
  ]))

  const routes = [...groups.values()]
    .sort((a, b) => b.n - a.n)
    .map((g) => {
      const agentSeq = defaultSequence(g.ids)
      const chosen = orders[g.key]?.filter((id) => enabled[id])
      const seq = chosen && chosen.length === g.ids.length ? chosen : agentSeq
      const share = g.n / cohort.members.length
      const people = Math.round(audience * share)

      // A hand-built journey wins over the sequence chips, but only the
      // touches on channels that are still switched on survive.
      const built = journeys[g.key]?.filter((s) => enabled[s.ch])
      const custom = built && built.length ? built : null
      const journey = custom || agentJourney(seq)
      // This segment's slice of every capped channel, and what it left unused.
      const capsAllowed = Object.fromEntries(capped.map((c) => [
        c.id,
        g.ids.includes(c.id) ? Math.round(c.capacity * (g.n / eligible[c.id])) : 0,
      ]))
      const capsAfter = { ...capsAllowed }
      const run = runJourney(people, journey, g.ids, capsAfter)

      return {
        ...g,
        share,
        people,
        seq,
        agentSeq,
        journey,
        custom: !!custom,
        isAgentPick: !custom && seq.join() === agentSeq.join(),
        // Beyond a pair the permutations stop being a usable set of chips;
        // the journey builder is the right tool for those segments.
        options: g.ids.length <= 2 ? sequenceOptions(g.ids) : [],
        steps: run.rows,
        cost: run.cost,
        responders: run.responders,
        rate: run.rate,
        days: run.days,
        capped: run.capped,
        capsAllowed,
        capsUnused: capsAfter,
        names: journey.map((s) => chan(s.ch).name),
      }
    })
    .sort((a, b) => b.people - a.people)

  const people = routes.reduce((n, r) => n + r.people, 0)
  const responders = routes.reduce((n, r) => n + r.responders, 0)
  const cost = routes.reduce((n, r) => n + r.cost, 0)
  return {
    routes,
    people,
    responders,
    cost,
    // What each capped channel has left once every segment has drawn its slice.
    capsLeft: Object.fromEntries(
      capped.map((c) => [c.id, routes.reduce((n, r) => n + (r.capsUnused[c.id] || 0), 0)]),
    ),
    capped: routes.reduce((n, r) => n + r.capped, 0),
    unrouted: audience - people,
    rate: people ? responders / people : 0,
    cpr: responders ? cost / responders : 0,
    days: routes.reduce((n, r) => Math.max(n, r.days), 0),
  }
}

/* ── The two ways to choose a channel ───────────────────────────────────
   Either the channel is chosen per cardholder from what they have answered
   before, or the operator picks one sequence and everybody gets it. These
   are the only two strategies on offer, and the step names them outright.
------------------------------------------------------------------------ */

export const ROUTE_MODES = [
  {
    id: 'agent',
    label: "Each cardholder's own best channel",
    by: 'Agent',
    note: 'Routed by the channels each person has actually responded to before, cheapest response first',
  },
  {
    id: 'fixed',
    label: 'One sequence for everyone',
    by: 'Your selection',
    note: 'The same touches in the same order, whatever the cardholder answers',
  },
]

/**
 * One sequence, sent to the whole audience.
 *
 * The audience is still split by what people answer — that is what decides
 * whether a touch converts — but every group is put on the operator's
 * sequence rather than its own. A touch on a channel someone never answers
 * is still delivered and still billed; it just barely converts, which is
 * precisely the cost of not routing.
 */
export function fixedRoutes(cohort, audience, enabled, seq) {
  const steps = (seq || []).filter((id) => enabled[id])
  const base = buildRoutes(cohort, audience, enabled, {}, {})
  if (!steps.length) return base
  const journey = agentJourney(steps)
  const journeys = Object.fromEntries(base.routes.map((r) => [r.key, journey]))
  return buildRoutes(cohort, audience, enabled, {}, journeys)
}

/**
 * What the agent has to say about the routing as it currently stands.
 *
 * The step is the agent's recommendation with the operator's overrides on top,
 * so the panel has to be able to say which it is looking at — and, when the
 * plan is leaving something obvious on the table, what it would do instead.
 * Each insight carries the figure that justifies it, so it reads as a finding
 * rather than an opinion.
 */
export function routingInsight({ campaign, enabled, mode, tuned }) {
  const offOwned = CHANNELS.filter((c) => OWNED.includes(c.id) && !enabled[c.id])
  const onOwned = CHANNELS.filter((c) => OWNED.includes(c.id) && enabled[c.id])

  if (mode === 'fixed') {
    return {
      tone: 'warn',
      kicker: 'Agent would route this differently',
      title: 'One sequence is reaching people on channels they never answer',
      body: 'Every group is on the order you chose, so the touches that land outside what a '
        + 'cardholder responds to are still delivered and still billed. Routing each group by '
        + 'its own response history is what the figures above are comparing against.',
      action: null,
    }
  }

  if (offOwned.length) {
    const c = offOwned[0]
    return {
      tone: 'idea',
      kicker: 'Agent suggests',
      title: `Turn on ${c.name} — it costs ₹${c.cost.toFixed(2)} a send`,
      body: `The bank owns this surface, so it is close to free. It reaches the `
        + `${Math.round(c.reachPct * 100)}% of the cohort with the app, and whoever it misses `
        + `still falls through to the paid channels behind it. Leading with it is how the agent `
        + 'gets the bulk of the response before spending anything.',
      action: { channel: c.id, label: `Add ${c.name}` },
    }
  }

  if (tuned) {
    return {
      tone: 'warn',
      kicker: 'You have overridden the agent',
      title: 'Some groups are on an order you set',
      body: 'The agent ranks each group by responses per rupee. Where you have reordered it, the '
        + 'figures below show what that costs against its own plan.',
      action: null,
    }
  }

  const lead = onOwned.length ? onOwned[0].name : null
  return {
    tone: 'ok',
    kicker: 'Agent routed this',
    title: lead
      ? `Leading on ${lead}, then paying only for whoever is still open`
      : 'Every group is on the agent’s own sequence',
    body: `The audience is split into ${campaign.groupCount} groups by the channels its `
      + 'cardholders have actually responded to before, and each group leads with the one that '
      + 'buys the most responses per rupee. Nothing here is a blanket send.',
    action: null,
  }
}

/** The sequence a fixed push starts from: every live channel, cheapest response first. */
export const defaultFixedSeq = (enabled) =>
  defaultSequence(CHANNELS.filter((c) => enabled[c.id] && c.capacity == null).map((c) => c.id))

/* ── Comparing plans ────────────────────────────────────────────────────
   Every alternative worth putting beside the one you have, run on the same
   audience and the same suppressions so the columns are actually comparable.
------------------------------------------------------------------------ */

/** Two plans are the same plan when every segment is on the same journey. */
export const planSignature = (plan) =>
  plan.routes.map((r) => `${r.key}>${journeyShape(r.journey)}`).sort().join(';')

const onlyChannel = (id) => ({ [id]: true })

export function comparePlans({ cohort, reachable, channels, routeOrders, journeys }) {
  // Segment keys depend on which channels are on, so a template applied
  // "everywhere" has to be resolved against that channel mix.
  const everywhere = (tpl, chs) =>
    Object.fromEntries(
      buildRoutes(cohort, reachable, chs, {}, {}).routes
        .map((r) => [r.key, tpl.build(r.ids).filter((st) => chs[st.ch])]),
    )

  const candidates = [
    { id: 'current', name: 'Your plan', note: 'Everything as you have it now',
      channels, orders: routeOrders, journeys },
    { id: 'agent', name: "The agent's plan", note: 'Same channels, its own sequences',
      channels, orders: {}, journeys: {} },
    { id: 'all', name: 'Every channel on', note: 'All three channels, agent routing',
      channels: ALL_CHANNELS_ON, orders: {}, journeys: {} },
    ...JOURNEY_TEMPLATES.map((t) => ({
      id: `tpl-${t.id}`, name: `${t.name}, everywhere`, note: t.note,
      channels, orders: {}, journeys: everywhere(t, channels),
    })),
    ...CHANNELS.map((c) => ({
      id: `only-${c.id}`, name: `${c.name} only`,
      note: `One touch, ₹${c.cost.toFixed(2)} a send`,
      channels: onlyChannel(c.id), orders: {}, journeys: {},
    })),
  ]

  // Alternatives that turn out to be the same plan collapse into the first
  // column that reached them, and lend it their name — so a plan that already
  // matches the agent's says so instead of quietly hiding the comparison.
  const byShape = new Map()
  const out = []
  for (const c of candidates) {
    const plan = buildRoutes(cohort, reachable, c.channels, c.orders, c.journeys)
    if (!plan.routes.length) continue
    const sig = planSignature(plan)
    const held = byShape.get(sig)
    if (held) {
      held.sameAs.push(c.name)
      continue
    }
    const entry = { ...c, plan, signature: sig, isCurrent: c.id === 'current', sameAs: [] }
    byShape.set(sig, entry)
    out.push(entry)
  }
  return out
}

/* ── What the plan runs to ──────────────────────────────────────────────
   The offer was quoted against the agent's own plan at the full reachable
   audience. Everything the operator changes moves the number of expected
   responders, and profit, cost and attrition move with it — so the panel
   beside the controls is never promising a result the plan cannot reach.
------------------------------------------------------------------------ */

export const ALL_CHANNELS_ON = Object.fromEntries(CHANNELS.map((c) => [c.id, true]))
export const ATTRITION_FROM = 14.2
export const ATTRITION_TO = 11.4
export const CONTROL_PCT = 0.089

export function modelOutcome({ plan, baseResponders, profitCr, investCr, reachable }) {
  const ratio = baseResponders ? plan.responders / baseResponders : 0
  const attritionTo = ATTRITION_FROM - (ATTRITION_FROM - ATTRITION_TO) * ratio
  // The incentive is only paid on people who answer; the send cost is paid
  // on everyone contacted, answer or not.
  const profit = profitCr * ratio
  const invest = investCr * ratio + plan.cost / 1e7
  return {
    ratio,
    attritionFrom: ATTRITION_FROM,
    attritionTo,
    profitCr: profit,
    investCr: invest,
    roiX: invest > 0 ? profit / invest : 0,
    control: Math.round(reachable * CONTROL_PCT),
  }
}

export const SEND_WINDOWS = [
  { id: 'immediate', label: 'On approval', note: 'Sends as soon as the last approver clears' },
  { id: 'staged', label: 'Staged over 7 days', note: 'Deliverability protected, response measured per batch' },
  { id: 'scheduled', label: 'Scheduled', note: 'Held until a date you set' },
]
