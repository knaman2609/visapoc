export const fmtIN = (n) => n.toLocaleString("en-IN")

export const PM_SCAN = [
  { label: "Scored every card in the book across nine behaviour models", result: "2.4M cards" },
  { label: "Compared each segment against 90-day and year-ago baselines", result: "6 segments" },
  { label: "Detected engagement, share-of-wallet and attrition shifts", result: "14 shifts" },
  { label: "Benchmarked each shift against the anonymised peer cohort", result: "complete" },
  { label: "Isolated the segment both high-value and abnormal", result: "+5.7 pts" }
]

// ── Always-on watch ────────────────────────────────────────────────────
// The book is scanned continuously, not on a monthly cycle. These drive the
// live rail on the Overview screen.

export const PM_WATCH = {
  sweepsToday: 12,
  sweepEvery: 120,          // minutes between sweeps
  nextSweepIn: 47 * 60 + 12, // seconds until the next sweep, counts down live
  lastSweep: "06:12",
  scansRunning: 9,
  uptimeDays: 214,
}

// Tallies for the last 24 hours. `to` is the number the counter climbs to.
export const PM_WATCH_TALLIES = [
  { k: "Cards scored", to: 2412880, note: "every card, every sweep" },
  { k: "Shifts detected", to: 14, note: "above baseline drift" },
  { k: "Opportunities raised", to: 3, note: "cleared the threshold", tone: "opp" },
  { k: "Risks flagged", to: 2, note: "routed to Controls", tone: "risk" },
]

// Detections per hour across the last 24 hours, ending at the most recent sweep.
// `night` marks the hours with no desk staffed — the point of the chart.
export const PM_24H = [
  { h: "07", opp: 0, risk: 1 }, { h: "08", opp: 1, risk: 0 }, { h: "09", opp: 0, risk: 0 },
  { h: "10", opp: 0, risk: 1 }, { h: "11", opp: 1, risk: 0 }, { h: "12", opp: 0, risk: 0 },
  { h: "13", opp: 0, risk: 0 }, { h: "14", opp: 1, risk: 1 }, { h: "15", opp: 0, risk: 0 },
  { h: "16", opp: 0, risk: 1 }, { h: "17", opp: 1, risk: 0 }, { h: "18", opp: 0, risk: 0 },
  { h: "19", opp: 0, risk: 1 }, { h: "20", opp: 1, risk: 0 }, { h: "21", opp: 0, risk: 0 },
  { h: "22", opp: 0, risk: 1, night: true }, { h: "23", opp: 1, risk: 1, night: true },
  { h: "00", opp: 0, risk: 0, night: true }, { h: "01", opp: 1, risk: 0, night: true },
  { h: "02", opp: 0, risk: 1, night: true }, { h: "03", opp: 1, risk: 1, night: true },
  { h: "04", opp: 2, risk: 0, night: true }, { h: "05", opp: 0, risk: 1, night: true },
  { h: "06", opp: 1, risk: 0, night: true },
]

// The overnight run, newest first. Timestamps are the argument: nobody was at a desk.
export const PM_FEED = [
  { t: "06:12", kind: "sweep", title: "Sweep complete · 2.4M cards rescored", meta: "9 scans · 38s" },
  { t: "04:12", kind: "opp",   title: "Affluent – Top-of-Wallet at risk of attrition", meta: "45,230 customers · ₹7,400 Cr PV" },
  { t: "03:47", kind: "risk",  title: "Utilisation breach · premium segment", meta: "1,204 cards above 90% · routed to Controls" },
  { t: "03:05", kind: "opp",   title: "Travel spend migrating to off-us cards", meta: "12,340 customers · ₹88 Cr leakage" },
  { t: "02:20", kind: "sweep", title: "Dormancy sweep · nothing above threshold", meta: "21,760 cards checked" },
  { t: "01:38", kind: "opp",   title: "Upgrade-ready mass affluent on entry cards", meta: "57,200 customers · ₹126 Cr" },
  { t: "23:52", kind: "risk",  title: "Delinquency drift · new-to-credit cohort", meta: "318 cards · 2 cycles late" },
  { t: "22:15", kind: "sweep", title: "Peer benchmark refreshed", meta: "6 segments rebaselined" },
]

// Book-level KPIs shown above the surfaced opportunities.
// Each opportunity is tagged to the slice it sits in, so the overview can
// filter the list to whatever the manager has selected, and carries the
// economics of the campaign it would become — cost and expected return, not
// only the value at stake.
export const PM_OPPS = [
  { id: "o1", rank: "01", lens: { dim: 'card', metric: 'attrition' }, line: 'Affluent top-of-wallet attrition is running 5.7 pts above peers — 45,230 cardholders and ₹7,400 Cr of volume at risk.', title: "Affluent – Top-of-Wallet at risk of attrition", cust: "45,230",
    chips: ["Attrition 14.2% · +5.7 pts vs peers", "Micro-group PV ₹7,400 Cr", "Share of wallet 38%"],
    impact: "₹7,400 Cr", note: "micro-group PV at risk", conf: "High confidence", primary: true,
    card: "k2", persona: "p2", zone: "z3", category: "c1", costCr: 0.86, roiX: 2.3 },
  { id: "o2", rank: "02", lens: { dim: 'persona', metric: 'cards' }, line: '57,200 mass-affluent holders qualify for an upgrade nobody has offered them yet.', title: "Upgrade-ready mass affluent on entry cards", cust: "57,200",
    chips: ["Income and bureau qualify", "Utilisation 62%"],
    impact: "₹126 Cr", note: "incremental spend", conf: "High confidence", primary: false,
    card: "k4", persona: "p4", zone: "z6", category: "c2", costCr: 1.20, roiX: 1.9 },
  { id: "o3", rank: "03", lens: { dim: 'category', metric: 'intl' }, line: 'Travel spend is moving off-us 3.1× faster than last quarter while lounge access sits unused.', title: "Travel spend migrating to off-us cards", cust: "12,340",
    chips: ["Off-us travel up 3.1×", "Lounge access unused"],
    impact: "₹88 Cr", note: "spend leakage", conf: "Medium confidence", primary: false,
    card: "k3", persona: "p1", zone: "z1", category: "c1", costCr: 0.64, roiX: 2.1 },
  { id: "o4", rank: "04", lens: { dim: 'card', metric: 'spend' }, line: '21,760 premium cards have gone quiet with a renewal fee falling due in 60 days.', title: "Premium cards dormant after first year", cust: "21,760",
    chips: ["Zero txn in 90 days", "Fee due in 60 days"],
    impact: "₹64 Cr", note: "attrition at renewal", conf: "High confidence", primary: false,
    card: "k1", persona: "p3", zone: "z1", category: "c5", costCr: 0.42, roiX: 2.6 },
  { id: "o5", rank: "05", lens: { dim: 'category', metric: 'ticket' }, line: '46,900 holders are revolving past 78% utilisation without ever converting to EMI.', title: "High utilisation without EMI conversion", cust: "46,900",
    chips: ["Avg utilisation 78%", "Revolving 3 cycles+"],
    impact: "₹41 Cr", note: "net interest income", conf: "Medium confidence", primary: false,
    card: "k5", persona: "p5", zone: "z5", category: "c4", costCr: 0.31, roiX: 1.4 }
]

export const PM_RULES = [
  "Segment is Affluent – Top-of-Wallet · 17.8% of portfolio payment volume",
  "90-day attrition risk scored above the 8.5% peer benchmark",
  "Card is top-of-wallet today · share of wallet ≥ 35%",
  "No delinquency in the last 12 months",
  "Marketing consent on file and contactable"
]

export const PM_FUNNEL = [
  { k: "Portfolio scanned", v: "2.4M cards" },
  { k: "Affluent – Top-of-Wallet", v: "₹7,400 Cr PV" },
  { k: "Attrition above benchmark", v: "14.2%" },
  { k: "At-risk cohort", v: "45,230" }
]

export const PM_YEAR = [
  { m: "Sep", c: 9.6, p: 8.2 }, { m: "Oct", c: 9.9, p: 8.2 }, { m: "Nov", c: 10.3, p: 8.3 },
  { m: "Dec", c: 10.8, p: 8.3 }, { m: "Jan", c: 11.4, p: 8.4 }, { m: "Feb", c: 11.9, p: 8.4 },
  { m: "Mar", c: 12.3, p: 8.4 }, { m: "Apr", c: 12.8, p: 8.5 }, { m: "May", c: 13.2, p: 8.5 },
  { m: "Jun", c: 13.6, p: 8.5 }, { m: "Jul", c: 13.9, p: 8.5 }, { m: "Aug", c: 14.2, p: 8.5 }
]

export const PM_TXN = [
  { m: "Sep", v: 14.8 }, { m: "Oct", v: 15.2 }, { m: "Nov", v: 15.6 }, { m: "Dec", v: 16.1 },
  { m: "Jan", v: 14.2 }, { m: "Feb", v: 13.8 }, { m: "Mar", v: 13.4 }, { m: "Apr", v: 12.9 },
  { m: "May", v: 11.6 }, { m: "Jun", v: 10.6 }, { m: "Jul", v: 9.8 }, { m: "Aug", v: 9.2 }
]

export const PM_WALLET = [
  { m: "Sep", on: 68, off: 32 }, { m: "Oct", on: 67, off: 33 }, { m: "Nov", on: 66, off: 34 },
  { m: "Dec", on: 64, off: 36 }, { m: "Jan", on: 61, off: 39 }, { m: "Feb", on: 58, off: 42 },
  { m: "Mar", on: 55, off: 45 }, { m: "Apr", on: 51, off: 49 }, { m: "May", on: 47, off: 53 },
  { m: "Jun", on: 44, off: 56 }, { m: "Jul", on: 41, off: 59 }, { m: "Aug", on: 39, off: 61 }
]

export const PM_CATS = [
  { k: "Travel and airlines", now: 31, then: 100 },
  { k: "Dining and delivery", now: 56, then: 100 },
  { k: "Retail and apparel", now: 78, then: 100 },
  { k: "Fuel and commute", now: 88, then: 100 },
  { k: "Utilities and bills", now: 97, then: 100 }
]

export const PM_SPEND = [
  { m: "Mar", c: 92, p: 96 }, { m: "Apr", c: 88, p: 97 }, { m: "May", c: 74, p: 99 },
  { m: "Jun", c: 61, p: 98 }, { m: "Jul", c: 54, p: 100 }, { m: "Aug", c: 49, p: 101 }
]

export const PM_BENCH = [
  { id: "attrition", metric: "90-day attrition risk", cohort: "14.2%", port: "8.5%", delta: "+5.7 pts", bad: true,
    max: 18, ticks: [6, 12, 18], format: "pct",
    read: "The micro-group churns 5.7 points above the peer benchmark, and the gap has widened every month since December.",
    series: [
      { m: "Sep", c: 9.6, p: 8.2 }, { m: "Oct", c: 9.9, p: 8.2 }, { m: "Nov", c: 10.3, p: 8.3 },
      { m: "Dec", c: 10.8, p: 8.3 }, { m: "Jan", c: 11.4, p: 8.4 }, { m: "Feb", c: 11.9, p: 8.4 },
      { m: "Mar", c: 12.3, p: 8.4 }, { m: "Apr", c: 12.8, p: 8.5 }, { m: "May", c: 13.2, p: 8.5 },
      { m: "Jun", c: 13.6, p: 8.5 }, { m: "Jul", c: 13.9, p: 8.5 }, { m: "Aug", c: 14.2, p: 8.5 }
    ] },
  { id: "sow", metric: "Share of wallet", cohort: "38%", port: "35%", delta: "+3 pts", bad: false,
    max: 60, ticks: [20, 40, 60], format: "pct",
    read: "Still the top-of-wallet card for this group, but the lead over the 35% market average has thinned for eight straight months.",
    series: [
      { m: "Sep", c: 41, p: 35 }, { m: "Oct", c: 41, p: 35 }, { m: "Nov", c: 40, p: 35 },
      { m: "Dec", c: 40, p: 35 }, { m: "Jan", c: 39, p: 35 }, { m: "Feb", c: 39, p: 35 },
      { m: "Mar", c: 39, p: 35 }, { m: "Apr", c: 38, p: 35 }, { m: "May", c: 38, p: 35 },
      { m: "Jun", c: 38, p: 35 }, { m: "Jul", c: 38, p: 35 }, { m: "Aug", c: 38, p: 35 }
    ] },
  { id: "growth", metric: "YoY payment volume growth", cohort: "+8.4%", port: "+4.2%", delta: "+4.2 pts", bad: false,
    max: 15, ticks: [5, 10, 15], format: "pct",
    read: "Volume is still growing at twice the peer rate. This is a high-value group starting to leave, not a weak one.",
    series: [
      { m: "Sep", c: 11.8, p: 4.6 }, { m: "Oct", c: 11.4, p: 4.5 }, { m: "Nov", c: 11.0, p: 4.5 },
      { m: "Dec", c: 10.6, p: 4.4 }, { m: "Jan", c: 10.2, p: 4.4 }, { m: "Feb", c: 9.8, p: 4.3 },
      { m: "Mar", c: 9.5, p: 4.3 }, { m: "Apr", c: 9.2, p: 4.3 }, { m: "May", c: 8.9, p: 4.2 },
      { m: "Jun", c: 8.7, p: 4.2 }, { m: "Jul", c: 8.5, p: 4.2 }, { m: "Aug", c: 8.4, p: 4.2 }
    ] },
  { id: "margin", metric: "Avg margin per transaction", cohort: "₹154", port: "₹143", delta: "+8%", bad: false,
    max: 200, ticks: [50, 100, 150, 200], format: "rupee",
    read: "Each transaction earns ₹11 more than the peer average, so every card lost here costs more than a typical churn.",
    series: [
      { m: "Sep", c: 149, p: 141 }, { m: "Oct", c: 150, p: 141 }, { m: "Nov", c: 151, p: 142 },
      { m: "Dec", c: 152, p: 142 }, { m: "Jan", c: 153, p: 142 }, { m: "Feb", c: 153, p: 143 },
      { m: "Mar", c: 154, p: 143 }, { m: "Apr", c: 154, p: 143 }, { m: "May", c: 155, p: 143 },
      { m: "Jun", c: 154, p: 143 }, { m: "Jul", c: 154, p: 143 }, { m: "Aug", c: 154, p: 143 }
    ] }
]

export const PM_REASONS = [
  { label: "Travel spend down 22% after a competitor mailer", w: "44% of cohort" },
  { label: "Dining spend growing while rewards engagement stays flat", w: "38% of cohort" },
  { label: "Large-ticket tech purchases routed to a rival card", w: "31% of cohort" }
]

// Objectives the PM can hand the agent once the cohort holds up.
export const PM_OBJECTIVES = [
  { id: "churn", label: "Reduce churn in the Affluent segment",
    goal: "Reduce 90-day attrition toward the 8.5% peer benchmark",
    constraint: "Incentive cost ≤ ₹8.3 Cr" },
  { id: "sow", label: "Grow share of wallet in Affluent",
    goal: "Move share of wallet above the 35% market average",
    constraint: "Margin-neutral" },
  { id: "engage", label: "Lift dining and travel engagement",
    goal: "Lift category engagement across the cohort",
    constraint: "Cost ≤ ₹12.5 Cr" }
]


/**
 * Send-time suppressions. `rate` is the share of any audience the rule takes
 * out, measured on the last twelve months of the book — the step turns it into
 * a headcount so the operator sees what each rule actually costs in reach.
 * A `required` rule can still be switched off, but doing so is a policy breach
 * and the step says so rather than quietly obeying.
 */
export const PM_EXC = [
  { id: "e1", label: "Delinquent 30+ days at send time", rate: 0.031,
    note: "Re-checked at dispatch, not just now" },
  { id: "e2", label: "Marketing consent withdrawn", rate: 0.024, required: true,
    note: "Consent is not a lever — switching this off breaches policy" },
  { id: "e3", label: "Contacted by another campaign in the last 30 days", rate: 0.052,
    note: "Stops two teams landing on the same cardholder" },
  { id: "e4", label: "Staff and related-party accounts", rate: 0.006,
    note: "Audit requirement" }
]

/** Headcount each rule removes from an audience, and the net that is left. */
export function applyExclusions(audience, on) {
  const rules = PM_EXC.map((e) => ({
    ...e,
    on: !!on[e.id],
    removes: Math.round(audience * e.rate),
  }))
  const removed = rules.reduce((n, r) => n + (r.on ? r.removes : 0), 0)
  return {
    rules,
    removed,
    reachable: Math.max(0, audience - removed),
    breaches: rules.filter((r) => r.required && !r.on),
  }
}

export const PM_MAILS = [
  { id: "s1", more: ["Spend by half: H1 ₹7.4L → H2 ₹4.6L", "Last servicing contact 14 Jun · competitor offer mentioned", "Bureau score 792 · no delinquency in 24 months", "Reward balance 41,200 points · last redemption Jul 2025"], name: "Rohit Khanna", subject: "Rohit, your lounge access and 5,000 bonus points are waiting",
    body: "You have used your Infinite card for 4 years, and there is ₹9,400 of travel value sitting unclaimed on it this year — 8 complimentary lounge visits and 5,000 bonus points we have added to your account today.\n\nSpend ₹25,000 on travel before 31 October and the points post within 48 hours.",
    wa: "Hi Rohit — 5,000 bonus points are now on your Visa Infinite, and 8 lounge visits are still unused this year. Spend ₹25,000 on travel before 31 Oct and the points post within 48 hours.",
    sms: "Rohit, 5,000 bonus points are now on your Visa Infinite. 8 lounge visits still unused this year. Details: vsa.in/tr",
    pers: ["Tenure 4y 2m", "Unclaimed travel value ₹9,400", "Lounge visits 8", "Top category: travel"] },
  { id: "s2", more: ["Annual fee ₹9,900 posted 14 Jul, unoffset", "Benefit value available this cycle ₹12,600 · used ₹0", "Bureau score 768 · utilisation 34%", "Consent on file for email and messaging, not calls"], name: "Sneha Iyer", subject: "Sneha, here is how to get your annual fee back in value",
    body: "Your Signature card carries benefits worth ₹12,600 a year, and our records show none of them were used this cycle.\n\nWe have credited 5,000 bonus points to your account. Using your card for one travel booking before 31 October unlocks the milestone benefit that offsets this year's fee.",
    wa: "Hi Sneha — we have added 5,000 bonus points to your Signature card. One travel booking before 31 Oct unlocks the milestone benefit that offsets this year's fee.",
    sms: "Sneha, 5,000 bonus points added. One travel booking this month offsets your annual fee. vsa.in/tr",
    pers: ["Fee posted 14 Jul", "Benefit value ₹12,600", "Benefits used: 0", "Consent: email + SMS"] },
  { id: "s3", more: ["Decline spread across dining, travel and retail", "Two declines on 09 Jul and 21 Jul, both limit-related", "Limit unchanged since 2022 · eligible for review", "Prefers phone contact · RM relationship active"], name: "Vikram Rao", subject: "Vikram, six years in — a review of your card and 5,000 points",
    body: "Thank you for six years with us. We have credited 5,000 bonus points to your Infinite card today.\n\nWe also noticed two transactions were declined in July. Your limit is eligible for review, and your relationship manager can complete it in a single call.",
    wa: "Hi Vikram — thank you for six years with us. 5,000 bonus points are credited, and your limit is eligible for review. Reply CALL and your relationship manager will reach out.",
    sms: "Vikram, 5,000 bonus points credited. Your limit is eligible for review — reply CALL and your RM will reach out.",
    pers: ["Tenure 6y 5m", "Declines in Jul: 2", "Limit review eligible", "Preferred channel: call"] }
]

export const PM_SCANS = [
  { id: "sc1", name: "Affluent top-of-wallet attrition watch", cadence: "Nightly · 03:00 IST", owner: "Rohan Mehta", run: "04 Sep · 04:12",
    found: "45,230 cardholders · 1 opportunity", state: "Review", live: false, pending: true,
    rules: ["Segment is Affluent – Top-of-Wallet", "90-day attrition risk above the 8.5% peer benchmark", "Share of wallet ≥ 35%", "No delinquency in the last 12 months", "Marketing consent on file"],
    threshold: "Raise an opportunity when attrition runs 3 pts above the peer benchmark" },
  { id: "sc2", name: "Upgrade eligibility sweep", cadence: "Weekly · Mon 02:00 IST", owner: "Rohan Mehta", run: "02 Sep · 02:14",
    found: "57,200 customers · 1 opportunity", state: "Active", live: true,
    rules: ["Current product is Classic or Platinum", "Declared income or bureau income qualifies for the next tier", "Utilisation ≥ 55% for 3 consecutive cycles", "Bureau score ≥ 750", "No upgrade offer in the last 180 days"],
    threshold: "Raise an opportunity above 20,000 qualified customers" },
  { id: "sc3", name: "Off-us spend leakage", cadence: "Nightly · 03:30 IST", owner: "Ananya Kulkarni", run: "04 Sep · 04:41",
    found: "12,340 customers · 1 opportunity", state: "Active", live: true,
    rules: ["Estimated off-us spend up ≥ 2× against the trailing quarter", "Category concentration in travel, dining or fuel", "Benefit entitlement unused in the current cycle", "On-us spend flat or declining"],
    threshold: "Raise an opportunity above ₹50 Cr of estimated leakage" },
  { id: "sc4", name: "First-year dormancy", cadence: "Weekly · Thu 02:00 IST", owner: "Ananya Kulkarni", run: "04 Sep · 02:09",
    found: "21,760 customers · 1 opportunity", state: "Active", live: true,
    rules: ["Card vintage between 10 and 14 months", "Zero transactions in the last 90 days", "Annual fee due within 60 days", "Activation offer never redeemed"],
    threshold: "Raise an opportunity above 10,000 customers" },
  { id: "sc5", name: "Revolver EMI conversion", cadence: "Monthly · 1st 02:00 IST", owner: "Vivek Menon", run: "01 Sep · 02:22",
    found: "46,900 customers · 1 opportunity", state: "Active", live: true,
    rules: ["Average utilisation ≥ 70%", "Revolving balance for 3 or more consecutive cycles", "No EMI conversion in the last 6 months", "Risk grade B or better"],
    threshold: "Raise an opportunity above ₹25 Cr of net interest income" },
  { id: "sc6", name: "Lounge benefit under-use", cadence: "Monthly · 1st 03:00 IST", owner: "Vivek Menon", run: "01 Sep · 03:18",
    found: "Below threshold · no opportunity raised", state: "Paused", live: false,
    rules: ["Product carries complimentary lounge access", "Zero lounge visits in the last 12 months", "At least one air travel transaction in the period"],
    threshold: "Raise an opportunity above 15,000 customers" }
]

export const PM_APPROVERS = [
  { role: "Portfolio Head · Cards", name: "Deepa Balan", note: "Cohort and revenue case" },
  { role: "Risk and Compliance", name: "Arun Sethi", note: "Exclusions, consent, guardrails" },
  { role: "Brand and Communications", name: "Nikhil Vora", note: "Copy, claims and offer language" }
]

// Maps a scan ID to the opportunity it raises (from mockup's inline lookup).
export const SCAN_OPP_MAP = { sc1: "o1", sc2: "o2", sc3: "o3", sc4: "o4", sc5: "o5" }

// Base cohort size used across PM Flow calculations.
export const COHORT_BASE = 45230

// Step labels for the 9-step PM flow rail.
export const FLOW_STEPS = ["Overview", "Cohort analysis", "Suggested interventions", "Campaign design", "Communication preview", "Approve", "Launch", "Live"]

// Launch-config table rows, shared by Step5Approve, Step6Launch and Step7Live.

// Audit trail entries for pm8 (Live).
export const AUDIT_TRAIL = [
  { k: "Opportunity detected", v: "04 Sep · 04:12 · overnight agent" },
  { k: "Cohort validated", v: "07 Sep · 09:44 · Rohan Mehta" },
  { k: "Sample reviewed", v: "07 Sep · 09:48 · 1 bucket excluded" },
  { k: "Approved", v: "07 Sep · 09:54 · 3 of 3 approvers" },
  { k: "Launched", v: "07 Sep · 09:57 · downstream campaign system" }
]
