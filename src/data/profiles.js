export const PROFILES = {
  activation: {
    isNew: true, newLabel: "NEW CUSTOMER · LIMIT NOT SET",
    headline: "New customer, one month in, with no credit limit assigned yet. Thin bureau file, but AA-verified income stability and a low obligation burden support a gated starter limit.",
    rec: {
      tag: "CREDIT LIMIT", thinkLine: "Deriving a credit limit recommendation",
      secTitle: "Credit limit recommendation", secSub: "Output of this analysis. No limit has been assigned to this customer yet.",
      kicker: "RECOMMENDED STARTER LIMIT", amount: "₹40,000",
      band: "₹30,000 – ₹50,000 policy band", bandNote: "Gated — uplift reviewed automatically.",
      cta: "Assign ₹40,000 limit", alt: "Adjust amount", doneNote: "Limit assigned · customer notified in app",
      toastTag: "LIMIT ASSIGNED", toastTitle: "Your credit limit is now live",
      toastBody: "Start using your card right away. We review your limit for an increase after three on-time cycles.",
      noteTitle: "Your credit limit is set at ₹40,000",
      noteBody: "Reviewed for an increase after three on-time cycles."
    },
    limitRec: "₹40,000", limitBand: "₹30,000 – ₹50,000 policy band",
    limitBasis: [
      { k: "AA-verified income", v: "₹9.2L/yr · stable inflows over 6 months" },
      { k: "Obligation burden", v: "₹1.1L/yr · 12% of income" },
      { k: "Bureau depth", v: "Thin file — caps the opening limit" },
      { k: "Gating rule", v: "Review for uplift after 3 clean cycles" }
    ],
    income: "₹9.2L/yr · AA-verified", oblig: "₹1.1L/yr · low burden",
    spend: "₹2.4L/yr on card", pv: "₹8,400/yr · rising",
    cell: [1, 0], from: null,
    note: "Placed on income stability, not history — no bureau depth to price against yet.",
    limit: "Not set", tenure: "1 month", bureau: "742 · thin file"
  },
  autopay: {
    newLabel: "AUTOPAY PENDING · 6 MANUAL CYCLES",
    headline: "Mature, fully-paying customer with a clean twelve-month ledger. Profitability is capped by manual repayment behaviour, not by risk.",
    income: "₹18.6L/yr · salary-verified", oblig: "₹3.4L/yr · one auto loan",
    spend: "₹5.8L/yr on card", pv: "₹31,200/yr · flat",
    cell: [2, 1], from: [1, 1],
    note: "Moved out of medium risk in Feb 2026 after twelve on-time cycles.",
    limit: "₹6,00,000", tenure: "3 yr 6 mo", bureau: "788 · established"
  },
  upgrade: {
    newLabel: "UPGRADE ELIGIBLE · 82% UTILISATION",
    headline: "High-utilisation HNI whose spend has outgrown her product. Profitability is capped by the card, not by the customer.",
    income: "₹42L/yr · ITR-verified", oblig: "₹6.2L/yr · mortgage",
    spend: "₹14.2L/yr on card", pv: "₹1,04,000/yr · rising",
    cell: [2, 2], from: [2, 1],
    note: "Crossed into high profit in Q1 2026 on travel and dining volume.",
    limit: "₹6,00,000 · 82% used", tenure: "5 yr 3 mo", bureau: "816 · prime"
  },
  travel: {
    newLabel: "TRAVEL UPCOMING · DEPARTS 19 SEP",
    headline: "Affluent traveller with overseas spend leaking to other instruments. Value is available with no change in credit exposure.",
    income: "₹24L/yr · salary-verified", oblig: "₹2.8L/yr · low burden",
    spend: "₹7.4L/yr on card", pv: "₹42,600/yr · rising",
    cell: [2, 1], from: [1, 1],
    note: "₹2.1L of overseas spend last year settled off-us.",
    rec: {
      tag: "TRAVEL PACK", thinkLine: "Selecting travel benefits to activate before departure",
      secTitle: "Pre-trip benefit activation",
      secSub: "Output of this analysis. Trip departs 19 September; benefits must be live before then.",
      kicker: "FOREX SPEND RETAINABLE", amount: "₹27,500",
      band: "Zero-markup forex card + 4 unused lounge visits",
      bandNote: "Activates instantly, no credit decision needed.",
      cta: "Activate travel pack", alt: "Edit benefits",
      doneNote: "Travel pack activated · customer notified in app",
      toastTag: "TRAVEL PACK ACTIVE", toastTitle: "You are set for 19 September",
      toastBody: "Zero forex markup is live and your four lounge visits are linked to the Singapore booking.",
      noteTitle: "Travel pack active for 19–26 Sep",
      noteBody: "Zero forex markup and 4 lounge visits linked to your booking.",
      basis: [
        { k: "Trip detected", v: "3 bookings · BLR–SIN, SIN–BLR, BLR–DEL · departs 19 Sep" },
        { k: "Forex exposure", v: "₹2.1L abroad last year at 3.5% markup" },
        { k: "Unused benefits", v: "4 of 4 complimentary lounge visits" },
        { k: "Credit impact", v: "None — benefit activation only" }
      ]
    },
    limit: "₹4,50,000", tenure: "1 yr 10 mo", bureau: "779 · established"
  },
  firstspend: {
    lines: [
      { tag: "1 · DATA GATHERED", label: "Pulling live data across the Visa ecosystem" },
      { tag: "2 · MODELS & GATES", label: "Scoring propensity and clearing risk gates" },
      { tag: "3 · RISK × PROFITABILITY", label: "Tagging position in the grid" }
    ],
    systems: [
      "Prime · Card Management", "CBS · Core Banking", "Card & Transaction System",
      "DWH · Data Warehouse (T+1)", "Bureau · AA · AIS", "Customer 360 · TRV / IRV",
      "iCRM", "LOP · Next Best Action"
    ],
    traits: [
      { kicker: "PERIODIC TRAIT · THE TREND OVER TIME", body: "Usage frequency, system-active vs transaction-active gap", note: "" },
      { kicker: "BEHAVIOURAL TRAIT · ACTIVATION & CHANNEL USE", body: "Activates and first-swipes (0–37d), adds the card to wallet, transacts on mobile banking app", note: "Seen in-app now: opens the app but never swipes the card" },
      { kicker: "STRATEGY · MEDIUM RISK × LOW, RISING PROFIT", body: "ACTIVATE", note: "Right intervention now: launch the welcome activation journey (30/60/90-day habit engine)" }
    ],
    points: [
      { k: "Active gap", v: "System-active, not transaction-active", src: "← CBS · CARD SWITCH" },
      { k: "Spend ramp", v: "7/15/30-day, flat", src: "← CARD & TRANSACTION SYSTEM" },
      { k: "Penny-drop", v: "First-use verification pending", src: "← CBS" },
      { k: "Autopay / Standing Instruction", v: "Not set up", src: "← REPAYMENT" }
    ],
    models: [
      { k: "ACTIVATION-PROPENSITY", v: "Medium", pct: "52%" },
      { k: "INACTIVITY-RISK", v: "Elevated", pct: "74%" },
      { k: "NEXT BEST ACTION · FIRST SWIPE", v: "Push + WhatsApp", pct: "66%" }
    ],
    gates: [
      { k: "DELINQUENCY", v: "N/A", note: "No bill generated", pass: false, watch: false },
      { k: "UTILISATION", v: "PASS", note: "0% drawn", pass: true, watch: false },
      { k: "PROBABILITY OF DEFAULT", v: "WATCH", note: "Thin file, monitor", pass: false, watch: true }
    ],
    newLabel: "ACTIVATED · NO FIRST SPEND",
    headline: "Recently activated emerging-affluent customer. Potential value is modelled from debit behaviour until card spend establishes.",
    income: "₹7.8L/yr · AA-verified", oblig: "₹0.4L/yr · minimal",
    spend: "₹1.6L/yr modelled", pv: "₹6,200/yr · unproven",
    cell: [1, 0], from: null,
    note: "Grid position is provisional for the first ninety days.",
    rec: {
      tag: "WELCOME OFFER", thinkLine: "Matching the best welcome offer to her spend",
      secTitle: "First-spend offer recommendation",
      secSub: "Output of this analysis. The welcome benefit lapses on 22 September if unused.",
      kicker: "MODELLED FIRST-YEAR SPEND", amount: "₹21,800",
      band: "10% grocery cashback, capped at ₹1,500",
      bandNote: "Expires 22 September — 18 days left.",
      cta: "Release welcome offer", alt: "Pick another offer",
      doneNote: "Offer released · customer notified in app",
      toastTag: "OFFER UNLOCKED", toastTitle: "10% back on your first shop",
      toastBody: "Use your card at any major grocery merchant before 22 September to claim up to ₹1,500 back.",
      noteTitle: "Welcome offer unlocked",
      noteBody: "10% back on your first grocery spend, up to ₹1,500. Valid to 22 Sep.",
      basis: [
        { k: "Activation", v: "23 Aug · card added to wallet, never used" },
        { k: "Spend behaviour", v: "Weekly grocery run on debit card" },
        { k: "Offer matched", v: "Grocery 10% — highest relevance of 2 eligible" },
        { k: "Expiry pressure", v: "Benefit lapses 22 Sep" }
      ]
    },
    limit: "₹75,000 · starter", tenure: "1 month", bureau: "731 · thin file"
  },
  churn: {
    newLabel: "SPEND DECLINING · RENEWAL 12 JAN",
    headline: "Long-tenured HNI whose spend has moved to a competitor product. Risk is unchanged; profitability is falling quarter on quarter.",
    income: "₹58L/yr · ITR-verified", oblig: "₹9.1L/yr · mortgage",
    spend: "₹8.9L/yr on card", pv: "₹38,400/yr · falling",
    cell: [2, 1], from: [2, 2],
    note: "Dropped out of high profit in July 2026 after a competitor card was opened.",
    rec: {
      tag: "RETENTION", thinkLine: "Selecting a retention package within RM discretion",
      secTitle: "Retention package recommendation",
      secSub: "Output of this analysis. Renewal falls on 12 January; act before it becomes the reason to leave.",
      kicker: "ANNUAL SPEND AT RISK", amount: "₹2,40,000",
      band: "Fee waiver + fuel and dining benefits",
      bandNote: "Pre-approved within RM discretion.",
      cta: "Apply retention package", alt: "Adjust package",
      doneNote: "Package applied · customer notified in app",
      toastTag: "ACCOUNT UPDATED", toastTitle: "Three changes to your card",
      toastBody: "Your 2027 renewal fee is waived, fuel cashback is on, and dining enrolment is free.",
      noteTitle: "Renewal fee waived and benefits added",
      noteBody: "5% fuel cashback and free dining enrolment, effective today.",
      basis: [
        { k: "Spend trend", v: "₹1.9L → ₹74k monthly · −61% over 3 months" },
        { k: "Cause identified", v: "Competitor co-brand card opened in July" },
        { k: "Service history", v: "Clean — no complaints on record" },
        { k: "Renewal exposure", v: "12 Jan 2027 · fee waiver pre-approved" }
      ]
    },
    limit: "₹10,00,000 · 31% used", tenure: "7 yr 7 mo", bureau: "834 · prime"
  },
  rewards: {
    newLabel: "POINTS EXPIRING · 31 OCT",
    headline: "Steady mass-affluent spender carrying a large unredeemed rewards liability. Engagement, not credit, is the constraint.",
    income: "₹16.4L/yr · salary-verified", oblig: "₹2.2L/yr · low burden",
    spend: "₹4.8L/yr on card", pv: "₹22,800/yr · flat",
    cell: [2, 1], from: null,
    note: "Stable in this cell for six consecutive quarters.",
    limit: "₹3,50,000", tenure: "4 yr", bureau: "771 · established"
  },
  dining: {
    newLabel: "BENEFIT UNUSED · 38% DINING",
    headline: "Emerging-affluent customer with concentrated category spend and no programme enrolment. Value sits in benefit attachment.",
    income: "₹11.2L/yr · salary-verified", oblig: "₹1.6L/yr · low burden",
    spend: "₹3.7L/yr on card", pv: "₹14,900/yr · rising",
    cell: [1, 1], from: [1, 0],
    note: "Moved up from low profit in April 2026 as dining spend doubled.",
    limit: "₹2,00,000", tenure: "1 yr 8 mo", bureau: "755 · establishing"
  }
}

export function findProfile(id) {
  return PROFILES[id] || null
}
