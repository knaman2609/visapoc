/**
 * The onboarding book — cardholders between an approved application and a
 * settled spending habit.
 *
 * The lifecycle screens in this console start at a card that already works.
 * This file covers the stretch before that, which is where an issued card is
 * most often lost: delivered and never activated, activated and never used, or
 * approved and left without a limit.
 *
 * Shape follows the cohort data: named stages with editorial detail, ten
 * hand-written applicants per stage carrying the real copy, and a claimed count
 * the seeded population in onboardingPopulation.js expands to.
 *
 * Two of the authored applicants — Aarav Mehta and Diya Sharma — are the same
 * people the RM queue already works in customers.js, so a cardholder opened
 * from here is the cardholder opened from there.
 */

/** Applications opened in the current quarter, across all stages. */
export const ONBOARDING_BASE = 8420

/**
 * The journey, in order. `drop` is the share of the stage's own intake that
 * does not carry to the next one — the leak this stage owns.
 */
export const ONBOARDING_STAGES = [
  {
    id: 's1',
    tag: 'APP',
    label: 'Application submitted',
    line: 'PAN, income and address captured; bureau consent given',
    owner: 'Customer',
    slaDays: 1,
    share: 1.0,
    drop: 0.09,
    why: 'Drop-off here is almost entirely mid-form: the applicant opens the journey, reaches the income section, and leaves. Nothing has been promised yet, so nothing has been lost but the acquisition cost.',
    blockers: [
      { reason: 'Form abandoned at income step', share: 0.44, action: 'Send a resume-application link, then an RM call the same evening', owner: 'RM' },
      { reason: 'OTP not verified', share: 0.33, action: 'Re-trigger the OTP; after two failures move to assisted onboarding', owner: 'System' },
      { reason: 'Bureau consent declined', share: 0.23, action: 'RM to explain what the bureau pull does and re-send the request', owner: 'RM' },
    ],
  },
  {
    id: 's2',
    tag: 'KYC',
    label: 'KYC verified',
    line: 'Identity proven by Aadhaar eKYC, video KYC or a branch visit',
    owner: 'Ops',
    slaDays: 2,
    share: 0.91,
    drop: 0.17,
    why: 'The largest single leak in onboarding, and the most recoverable one — most of it is a document that can be re-submitted rather than an applicant who has changed their mind.',
    blockers: [
      { reason: 'Name mismatch against PAN', share: 0.31, action: 'Collect a name-change affidavit, or correct the spelling to match PAN exactly', owner: 'Ops' },
      { reason: 'Video-KYC appointment missed', share: 0.27, action: 'RM to re-book the slot and confirm the appointment by call', owner: 'RM' },
      { reason: 'Document illegible', share: 0.24, action: 'Request a fresh colour scan and guide the upload in the app', owner: 'RM' },
      { reason: 'Address proof out of date', share: 0.18, action: 'Request a bill or statement dated in the last three months', owner: 'Customer' },
    ],
  },
  {
    id: 's3',
    tag: 'INC',
    label: 'Income verified',
    line: 'Income proven from salary credits, statements or ITR through AA',
    owner: 'Ops',
    slaDays: 2,
    share: 0.755,
    drop: 0.14,
    why: 'Salaried applicants clear this on salary credits alone. Self-employed and business owners need documents, and account for most of what stalls here.',
    blockers: [
      { reason: 'Statement could not be parsed', share: 0.38, action: 'Request a bank-generated PDF, or pull the statement through Account Aggregator', owner: 'Ops' },
      { reason: 'Income below the variant floor', share: 0.29, action: 'Offer the variant the income supports rather than declining outright', owner: 'PM' },
      { reason: 'Payslips older than three months', share: 0.19, action: 'RM to collect the last three months of payslips', owner: 'RM' },
      { reason: 'Employer not on the approved list', share: 0.14, action: 'PM to decide on an employer-category exception', owner: 'PM' },
    ],
  },
  {
    id: 's4',
    tag: 'DEC',
    label: 'Approved',
    line: 'Bureau pulled and the lending policy applied',
    owner: 'Ops',
    slaDays: 1,
    share: 0.649,
    drop: 0.21,
    why: 'A credit decision rather than a service failure. Thin-file applicants are the exception worth watching: they fail the standard rule but are not bad risk, and route to a gated starter limit instead.',
    blockers: [
      { reason: 'Thin file, no bureau history', share: 0.34, action: 'Route to new-to-credit — assess on AA income and open at a gated starter limit', owner: 'PM' },
      { reason: 'Delinquency in the last 12 months', share: 0.27, action: 'Decline per policy, or PM to review where it is settled and isolated', owner: 'PM' },
      { reason: 'Existing exposure too high', share: 0.22, action: 'PM to review — a lower limit is usually better than a decline', owner: 'PM' },
      { reason: 'Duplicate of an existing card', share: 0.17, action: 'Convert to a limit enhancement or an upgrade instead', owner: 'Ops' },
    ],
  },
  {
    id: 's5',
    tag: 'LMT',
    label: 'Limit assigned',
    line: 'A limit sized to income less obligations, gated on bureau depth',
    owner: 'PM',
    slaDays: 1,
    share: 0.513,
    drop: 0.06,
    why: 'Rarely a leak, but it is where an approved applicant can sit unnoticed. A card cannot ship until this is set, and nobody is chasing it because the application already reads as approved.',
    blockers: [
      { reason: 'Awaiting a limit decision', share: 0.58, action: 'PM to assign against the recommended band — the file is complete and waiting', owner: 'PM' },
      { reason: 'Starter limit below the amount sought', share: 0.42, action: 'RM to explain the gate and the review date after three clean cycles', owner: 'RM' },
    ],
  },
  {
    id: 's6',
    tag: 'DLV',
    label: 'Card delivered',
    line: 'Embossed, dispatched with the welcome kit, and signed for',
    owner: 'Ops',
    slaDays: 5,
    share: 0.482,
    drop: 0.08,
    why: 'From here the bank has spent real money on this customer. Everything that fails at this stage is logistics rather than credit — a wrong address, a courier, a customer who was out.',
    blockers: [
      { reason: 'Address undeliverable', share: 0.41, action: 'RM to confirm a delivery address and re-dispatch', owner: 'RM' },
      { reason: 'Returned to origin', share: 0.33, action: 'Re-dispatch to an alternate address, or arrange branch collection', owner: 'Ops' },
      { reason: 'Courier delay', share: 0.26, action: 'Track with the courier; re-dispatch if it has not moved in five days', owner: 'Ops' },
    ],
  },
  {
    id: 's7',
    tag: 'ACT',
    label: 'Activated',
    line: 'PIN set and the card switched on',
    owner: 'Customer',
    slaDays: 5,
    share: 0.443,
    drop: 0.11,
    why: 'The most time-critical chase on the book. A card not activated within 30 days of issue needs fresh OTP consent, and without it must be closed at no cost to the customer — so the issuance cost is written off entirely.',
    blockers: [
      { reason: 'Activation nudge unopened', share: 0.46, action: 'RM to call and walk the customer through activation in the app', owner: 'RM' },
      { reason: 'Approaching the 30-day consent deadline', share: 0.32, action: 'Chase now — without consent the card must be closed at no cost', owner: 'RM' },
      { reason: 'PIN never set', share: 0.22, action: 'Send the PIN-set link and confirm by call', owner: 'RM' },
    ],
  },
  {
    id: 's8',
    tag: 'SPD',
    label: 'First spend',
    line: 'The card has been used — onboarding is complete',
    owner: 'Customer',
    slaDays: 7,
    share: 0.394,
    drop: 0.14,
    why: 'Onboarding finishes here, not at issuance. An activated card that never gets used costs the same to run as one that does, and the first-spend window is short: welcome benefits expire and the card settles to the back of the wallet.',
    blockers: [
      { reason: 'Activated but never used', share: 0.57, action: 'Trigger the first-spend offer; RM to follow up before the welcome benefit expires', owner: 'RM' },
      { reason: 'Added to a wallet, still unused', share: 0.43, action: 'Nudge with a category offer matched to their pre-card spend', owner: 'System' },
    ],
  },
]

export const STAGE_BY_ID = Object.fromEntries(ONBOARDING_STAGES.map((s) => [s.id, s]))

/**
 * The hand-written applicants. These lead the population and keep their own
 * copy; the rest are synthesised around them.
 *
 * `meta` reads age · city · variant · time on book, the same order the cohort
 * members use. `stuckAt` names the stage they are sitting on right now.
 */
export const ONBOARDING_APPLICANTS = [
  {
    id: 'ob-aarav', customerId: 'activation', name: 'Aarav Mehta',
    meta: '31 · Mumbai · Visa Platinum · 1m', stuckAt: 's7', days: 7,
    income: 920000, oblig: 110000, bureau: 742, thinFile: true, limit: null, limitRec: 40000,
    channel: 'Digital / App', kyc: 'Aadhaar eKYC', value: 32400,
    blocker: 'Activation nudge unopened',
    signals: ['Delivered and signed for on 28 Aug', 'No activation, no transaction', 'One SMS on day 2, unopened'],
    fix: 'Evening push outperforms morning SMS for this segment by 2.4×, and day 7 is the last window before activation rates fall away.',
  },
  {
    id: 'ob-diya', customerId: 'firstspend', name: 'Diya Sharma',
    meta: '29 · Pune · Visa Platinum · 1m', stuckAt: 's8', days: 12,
    income: 780000, oblig: 40000, bureau: 731, thinFile: true, limit: 75000, limitRec: null,
    channel: 'Branch', kyc: 'Video KYC', value: 21800,
    blocker: 'Activated but never used',
    signals: ['Activated 12 days ago', 'Added to wallet, never used', 'Welcome benefit expires in 18 days'],
    fix: 'The welcome benefit is the reason to spend and it expires in 18 days — after that the card has no opening hook left.',
  },
  {
    id: 'ob-imran', name: 'Imran Sheikh',
    meta: '34 · Hyderabad · Visa Signature · 3w', stuckAt: 's2', days: 9,
    income: 1650000, oblig: 260000, bureau: 768, thinFile: false, limit: null, limitRec: null,
    channel: 'DSA', kyc: 'Video KYC', value: 41200,
    blocker: 'Video-KYC appointment missed',
    signals: ['Two V-KYC slots booked, both missed', 'Application otherwise complete', 'Sourced through a DSA'],
    fix: 'Everything but the identity check is done. A booked slot he confirms by call clears the whole file in one step.',
  },
  {
    id: 'ob-nandini', name: 'Nandini Rao',
    meta: '38 · Bengaluru · Visa Signature · 2w', stuckAt: 's3', days: 6,
    income: 2450000, oblig: 380000, bureau: 781, thinFile: false, limit: null, limitRec: null,
    channel: 'Digital / App', kyc: 'Aadhaar eKYC', value: 58600,
    blocker: 'Statement could not be parsed',
    signals: ['Self-employed professional', 'Uploaded a scanned statement', 'Income declared ₹24.5L'],
    fix: 'An Account Aggregator pull replaces the scan entirely and settles the income question without asking her for anything.',
  },
  {
    id: 'ob-kabir', name: 'Kabir Malhotra',
    meta: '27 · Delhi · Visa Platinum · 1m', stuckAt: 's5', days: 4,
    income: 840000, oblig: 60000, bureau: null, thinFile: true, limit: null, limitRec: 35000,
    channel: 'Pre-approved', kyc: 'Aadhaar eKYC', value: 26900,
    blocker: 'Awaiting a limit decision',
    signals: ['No bureau history at all', 'Salary credits stable for 9 months', 'Approved on AA income'],
    fix: 'First-time borrower with clean salary inflows. The gated starter limit exists for exactly this file and it is sitting unassigned.',
  },
  {
    id: 'ob-shreya', name: 'Shreya Banerjee',
    meta: '41 · Kolkata · Visa Infinite · 5w', stuckAt: 's6', days: 11,
    income: 4200000, oblig: 520000, bureau: 803, thinFile: false, limit: 500000, limitRec: null,
    channel: 'Branch', kyc: 'Physical / Branch', value: 96400,
    blocker: 'Returned to origin',
    signals: ['Card dispatched 11 days ago', 'Returned undelivered', 'Highest limit in the onboarding book'],
    fix: 'The highest-value card in the book is sitting in a warehouse. A confirmed address and a re-dispatch is the whole fix.',
  },
  {
    id: 'ob-varun', name: 'Varun Kamath',
    meta: '33 · Chennai · Visa Platinum · 2w', stuckAt: 's1', days: 5,
    income: 1120000, oblig: 190000, bureau: 726, thinFile: false, limit: null, limitRec: null,
    channel: 'Digital / App', kyc: 'Aadhaar eKYC', value: 18300,
    blocker: 'Form abandoned at income step',
    signals: ['Reached the income section', 'Left without submitting', 'No contact since'],
    fix: 'He got as far as the income screen, which is the point most applicants leave. A resume link recovers the work already done.',
  },
  {
    id: 'ob-pallavi', name: 'Pallavi Desai',
    meta: '36 · Ahmedabad · Visa Signature · 4w', stuckAt: 's7', days: 24,
    income: 1980000, oblig: 210000, bureau: 774, thinFile: false, limit: 220000, limitRec: null,
    channel: 'Partner Co-brand', kyc: 'Aadhaar eKYC', value: 63700,
    blocker: 'Approaching the 30-day consent deadline',
    signals: ['Issued 24 days ago', 'Never activated', 'Six days to the consent deadline'],
    fix: 'Six days before this card has to be closed at no cost and the issuance written off. It is the most urgent file on the book.',
  },
  {
    id: 'ob-rehan', name: 'Rehan Qureshi',
    meta: '30 · Jaipur · Visa Platinum · 3w', stuckAt: 's2', days: 8,
    income: 960000, oblig: 140000, bureau: 715, thinFile: false, limit: null, limitRec: null,
    channel: 'DSA', kyc: 'Aadhaar eKYC', value: 22100,
    blocker: 'Name mismatch against PAN',
    signals: ['Aadhaar and PAN spellings differ', 'eKYC failed twice', 'Documents otherwise clean'],
    fix: 'A spelling difference between two documents, not a doubt about who he is. An affidavit or a corrected entry clears it.',
  },
  {
    id: 'ob-tanvi', name: 'Tanvi Kulkarni',
    meta: '26 · Indore · Visa Platinum · 1m', stuckAt: 's8', days: 16,
    income: 620000, oblig: 30000, bureau: null, thinFile: true, limit: 45000, limitRec: null,
    channel: 'Referral', kyc: 'Video KYC', value: 15400,
    blocker: 'Added to a wallet, still unused',
    signals: ['Activated and added to a phone wallet', 'No transaction in 16 days', 'New to credit'],
    fix: 'She has done everything but spend. A first purchase on a category she already buys turns a new-to-credit file into a working card.',
  },
]

/* ── How a source channel and the calendar move the odds ─────────────── */

/**
 * Not every channel onboards equally well, and the quarter got better as fixes
 * landed. Both are authored here rather than buried in the generator's SHAPE:
 * SHAPE describes distribution, these are editorial claims about the book, and
 * they belong next to the stage shares they modify.
 *
 * Each figure is a multiplier on an application's odds of completing. They are
 * renormalised at use so the channel-weighted average is exactly 1.0 — the
 * authored funnel stays the funnel that comes out; only who sits where inside
 * it changes.
 */
export const CHANNEL_QUALITY = [
  { channel: 'Pre-approved', q: 1.42, why: 'Already underwritten — KYC and limit are largely settled before the applicant applies.' },
  { channel: 'Referral', q: 1.18, why: 'An existing cardholder vouches, and the referred file arrives more complete.' },
  { channel: 'Partner Co-brand', q: 1.11, why: 'Partner holds verified identity, so KYC mismatches are rarer.' },
  { channel: 'Digital / App', q: 0.98, why: 'Highest volume and broadly average — the book’s baseline.' },
  { channel: 'Branch', q: 0.94, why: 'Documents captured on paper, re-keyed later; income proof stalls most often here.' },
  { channel: 'DSA', q: 0.79, why: 'Agent-sourced and volume-incentivised — thinnest files and the most abandonment.' },
]

/**
 * A gentle improvement across the thirteen weeks: the video-KYC retry fix and
 * the Account Aggregator fallback both landed mid-quarter, so later cohorts
 * clear more of the same funnel.
 */
export const WEEK_LIFT = { start: 0.88, end: 1.12 }

export const QUALITY_BY_CHANNEL = Object.fromEntries(CHANNEL_QUALITY.map((c) => [c.channel, c.q]))
