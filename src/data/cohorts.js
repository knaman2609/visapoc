// The bank's RAROC hurdle. Anything under it gets ranked but not recommended.
export const HURDLE = 1.0

// The at-risk group cut by spend behaviour, not by decline shape. Category mix
// is what an intervention can actually act on: a travel-heavy cardholder is
// saved by travel rewards, a diner is not.
export const PM_COHORTS = [
  {
    id: 'c1',
    tag: 'TRV',
    label: 'Travel-heavy',
    line: '42% of spend in airlines, hotels and forex',
    count: 15290,
    risk: 82,
    band: 'high',
    why: 'Their travel spend has moved to a competitor co-brand card while the rest of the wallet stayed put. The earn rate on travel is the only thing that changed.',
    signals: ['Off-us travel spend 3.4×', 'Lounge access unused 12m', 'Zero point redemptions'],
    existing: {
      name: 'Lounge access and 2× travel points',
      push: 'Activate the lounge access they already hold',
      line: 'On the card since issue. Twelve months without a single visit or redemption.',
      heldPct: 0.41,
      confidence: 'high',
    },
    members: [
      { name: 'Rohit Khanna', meta: '41 · Mumbai · Visa Infinite · 4y 2m', risk: 82, profit: 92400, respondsTo: ['wa', 'email'],
        signals: ['Spend −38% vs H1', 'Off-us travel 3.4×', 'No redemption in 14 months'],
        fix: 'The boost is worth ₹18,400 a year at his travel volume — more than the fee he is questioning.' },
      { name: 'Vikram Malhotra', meta: '44 · Mumbai · Visa Infinite · 8y 1m', risk: 79, profit: 88600, respondsTo: ['email', 'wa'],
        signals: ['Travel 46% of spend', '6 flights booked off-us', '38,400 points unredeemed'],
        fix: '3× travel rewards beats the competitor’s 2× earn rate, and the bonus posts on his next flight booking.' },
      { name: 'Aditya Sen', meta: '39 · Gurugram · Visa Infinite · 5y 6m', risk: 77, profit: 74200, respondsTo: ['email', 'wa'],
        signals: ['Travel 39% of spend', 'Rival co-brand in wallet', 'Lounge visits 0 in 12m'],
        fix: 'Rewards land on the hotel and forex spend he still puts on us, pulling the flight bookings back with them.' },
      { name: 'Meera Raghavan', meta: '46 · Chennai · Visa Infinite · 7y 3m', risk: 74, profit: 69800, respondsTo: ['wa', 'email'],
        signals: ['Travel booked off-us ×6', 'Forex spend −44%', 'Points balance growing, unused'],
        fix: 'A capped 3× quarter gives her a reason to redeem the balance she has been sitting on since March.' },
      { name: 'Farhan Qureshi', meta: '48 · Hyderabad · Visa Infinite · 9y 4m', risk: 71, profit: 81300, respondsTo: ['email', 'sms'],
        signals: ['Hotel spend −51%', 'Two rival lounge visits', 'Concierge never used'],
        fix: 'Concierge onboarding surfaces the service he has paid for nine years and never once called.' },
      { name: 'Ananya Pillai', meta: '35 · Bengaluru · Visa Signature · 3y 8m', risk: 68, profit: 41500, respondsTo: ['wa', 'sms'],
        signals: ['Forex 28% of spend', 'Markup complaint in Jul', 'Flights off-us ×3'],
        fix: 'The forex leg of the boost answers the markup complaint she raised in July.' },
      { name: 'Devendra Nair', meta: '52 · Kochi · Visa Infinite · 11y 0m', risk: 64, profit: 63700, respondsTo: ['sms', 'wa'],
        signals: ['Travel −29%, gradual', 'Longest tenure in cohort', 'Lounge used twice in 24m'],
        fix: 'Two guest lounge passes reach the family travel that makes up most of his remaining bookings.' },
      { name: 'Shalini Gupta', meta: '37 · Pune · Visa Signature · 2y 11m', risk: 61, profit: 34800, respondsTo: ['wa', 'email'],
        signals: ['Airline spend −22%', 'Rival card offer opened', 'Points redeemed once'],
        fix: 'She is early in the drift — the boost lands before the rival card becomes her default.' },
      { name: 'Ishaan Kapoor', meta: '42 · Delhi · Visa Infinite · 5y 5m', risk: 58, profit: 58900, respondsTo: ['email', 'wa'],
        signals: ['Travel 31% of spend', 'Two hotel bookings off-us', 'Points unredeemed 14 months'],
        fix: 'The boost reaches the hotel spend he still puts on us before the airline bookings follow it out.' },
      { name: 'Naina Sethi', meta: '37 · Mumbai · Visa Infinite · 4y 3m', risk: 55, profit: 66200, respondsTo: ['wa', 'email'],
        signals: ['Forex spend −31%', 'Lounge unused 9 months', 'Redeemed points in Jul'],
        fix: 'She redeems — a 3× quarter gives an already-engaged cardholder a reason to route travel back.' },
    ],
    interventions: [
      { id: 'i11', name: 'Premium Travel Rewards Boost', confidence: 'high',
        desc: '3× travel rewards for one quarter, capped — retention-led, aimed squarely at the top-of-wallet spenders who moved travel off-us.',
        targeted: 15290, profitCr: 2.00, investCr: 0.86, roiX: 2.3 },
      { id: 'i12', name: 'Concierge & Lounge Reactivation', confidence: 'high',
        desc: 'Re-onboard the unused premium services with a personal concierge introduction and two guest lounge passes.',
        targeted: 10000, profitCr: 1.15, investCr: 0.57, roiX: 2.0 },
      { id: 'i13', name: 'Milestone Spend Bonus', confidence: 'medium',
        desc: 'Flat bonus at a ₹2L quarterly milestone. Broad reach, but the payout lands on spend that would largely have happened anyway.',
        targeted: 15290, profitCr: 1.03, investCr: 0.78, roiX: 1.3 },
    ],
  },
  {
    id: 'c2',
    tag: 'DIN',
    label: 'Dining-heavy',
    line: '38% of spend in restaurants and food delivery',
    count: 11950,
    risk: 74,
    band: 'high',
    why: 'High-frequency diners whose restaurant spend is drifting to cards carrying a standing dining multiplier. The volume is intact — our share of it is not.',
    signals: ['Dining share −44%', 'Delivery apps on a rival card', '8+ restaurant txns a month'],
    existing: {
      name: 'The partner dining programme',
      push: 'Introduce the dining programme already on the card',
      line: '15% back at 400 partner restaurants. Enrolled at issue, never once opened.',
      heldPct: 0.34,
      confidence: 'high',
    },
    members: [
      { name: 'Sneha Kapoor', meta: '36 · Bengaluru · Visa Signature · 5y 0m', risk: 74, profit: 52400, respondsTo: ['wa', 'email'],
        signals: ['Dining 41% of spend', '11 restaurant txns in Aug', 'Delivery moved off-us'],
        fix: '2× dining points restores the earn rate she left for, on the category she uses eleven times a month.' },
      { name: 'Kavya Nair', meta: '38 · Bengaluru · Visa Signature · 3y 9m', risk: 72, profit: 47900, respondsTo: ['wa', 'sms'],
        signals: ['Dining share −38%', 'Weekend spend off-us', 'Never used partner offers'],
        fix: 'Weekend partner offers reach her on the two nights her dining spend actually happens.' },
      { name: 'Arjun Bhatia', meta: '34 · Hyderabad · Visa Signature · 2y 4m', risk: 70, profit: 38600, respondsTo: ['wa', 'sms'],
        signals: ['Delivery 62% of dining', 'Rival card default in app', 'Spend −24% since Jun'],
        fix: 'Delivery cashback puts us back as the saved card in the two apps he orders from weekly.' },
      { name: 'Divya Menon', meta: '41 · Kochi · Visa Signature · 4y 1m', risk: 67, profit: 44100, respondsTo: ['email', 'wa'],
        signals: ['Dining share −29%', 'Fine-dining spend intact', 'Points never redeemed'],
        fix: 'The multiplier is worth more than the rival’s flat rate at her average ₹4,200 cover.' },
      { name: 'Rehan Sheikh', meta: '31 · Mumbai · Visa Signature · 2y 0m', risk: 65, profit: 29800, respondsTo: ['wa', 'sms'],
        signals: ['14 delivery orders in Aug', 'Ticket size ₹680', 'Rival cashback active'],
        fix: 'At fourteen orders a month the capped cashback beats the rival on his actual basket size.' },
      { name: 'Lakshmi Iyer', meta: '44 · Chennai · Visa Signature · 6y 2m', risk: 62, profit: 55300, respondsTo: ['email', 'wa'],
        signals: ['Restaurant spend −26%', 'Partner offers unopened', 'Weekend diner'],
        fix: 'Curated Friday releases put the offer in front of her before she books, not after.' },
      { name: 'Vivek Chandra', meta: '29 · Pune · Visa Signature · 1y 7m', risk: 59, profit: 24600, respondsTo: ['wa', 'email'],
        signals: ['Dining 44% of spend', 'Newest in cohort', 'No rival card yet'],
        fix: 'He has not switched yet — the multiplier is a retention move, not a win-back.' },
      { name: 'Pooja Deshmukh', meta: '40 · Nagpur · Visa Signature · 4y 8m', risk: 56, profit: 33200, respondsTo: ['email', 'wa'],
        signals: ['Dining −19%, slow', 'Delivery steady', 'Engaged with app'],
        fix: 'Low-cost reach: she is already opening the app, so the offer costs almost nothing to deliver.' },
      { name: 'Karan Bajaj', meta: '39 · Chandigarh · Visa Signature · 3y 1m', risk: 54, profit: 31700, respondsTo: ['wa', 'email'],
        signals: ['Dining −23%', 'Weekend spend off-us', 'No partner offer opened'],
        fix: 'Weekend releases land on the Friday and Saturday covers that make up most of his dining.' },
      { name: 'Simran Kaur', meta: '31 · Amritsar · Visa Signature · 2y 0m', risk: 47, profit: 21900, respondsTo: ['wa', 'sms'],
        signals: ['Dining 34% of spend', 'Delivery on a rival card', 'Engagement rising'],
        fix: 'Engagement is up while share is down — the multiplier converts attention we already have.' },
    ],
    interventions: [
      { id: 'i21', name: 'Dining Category Multiplier', confidence: 'high',
        desc: '2× points on dining, capped — a modest incentive with a strong engagement lift among frequent diners.',
        targeted: 11950, profitCr: 1.53, investCr: 0.77, roiX: 2.0 },
      { id: 'i22', name: 'Weekend Restaurant Partner Offers', confidence: 'high',
        desc: 'Curated partner offers released Friday to Sunday, when three-quarters of this cohort’s dining spend lands.',
        targeted: 9030, profitCr: 0.90, investCr: 0.41, roiX: 2.2 },
      { id: 'i23', name: 'Delivery App Cashback', confidence: 'medium',
        desc: 'Flat cashback on the two largest delivery platforms. Reaches everyone, but competes directly on price with platform-funded offers.',
        targeted: 11950, profitCr: 0.67, investCr: 0.53, roiX: 1.3 },
    ],
  },
  {
    id: 'c3',
    tag: 'TEC',
    label: 'Large-ticket tech',
    line: 'Big-basket electronics and EMI conversions',
    count: 10400,
    risk: 71,
    band: 'high',
    why: 'Large, infrequent purchases that increasingly land on no-cost-EMI offers from rival issuers. Each basket lost here is worth ten ordinary transactions.',
    signals: ['Avg basket ₹68,400', '3 EMI offers declined', 'Electronics share −52%'],
    existing: {
      name: 'No-cost EMI above ₹30,000',
      push: 'Tell them the no-cost EMI is already approved',
      line: 'Pre-approved on every card here. Three baskets went to a rival EMI because nobody knew.',
      heldPct: 0.52,
      confidence: 'high',
    },
    members: [
      { name: 'Rohan Gupta', meta: '37 · Bengaluru · Visa Signature · 3y 0m', risk: 71, profit: 61200, respondsTo: ['wa', 'email'],
        signals: ['Basket ₹82,000 in Jul, off-us', 'Declined our EMI twice', 'Tech 44% of spend'],
        fix: 'Matching the no-cost EMI removes the only reason he moved the purchase — the rate, not the card.' },
      { name: 'Nikhil Shah', meta: '50 · Ahmedabad · Visa Infinite · 7y 11m', risk: 69, profit: 78500, respondsTo: ['email', 'wa'],
        signals: ['Two declines in Aug, limit-related', 'Electronics −48%', 'Limit unchanged since 2021'],
        fix: 'Pre-approved limit headroom clears the decline that pushed the basket elsewhere.' },
      { name: 'Priya Kulkarni', meta: '45 · Pune · Visa Infinite · 6y 8m', risk: 66, profit: 71400, respondsTo: ['wa', 'sms'],
        signals: ['Utilisation 91% at purchase', 'EMI taken with rival', 'Basket ₹1.1L off-us'],
        fix: '5% capped cashback plus EMI at parity makes the next large basket cheaper on us than off.' },
      { name: 'Sanjay Menon', meta: '52 · Delhi · Visa Infinite · 9y 0m', risk: 63, profit: 83900, respondsTo: ['email', 'sms'],
        signals: ['Electronics −38%', 'Warranty claims on rival card', 'One decline in Jun'],
        fix: 'The extended warranty bundle is the benefit he is currently buying separately at retail.' },
      { name: 'Harsh Vardhan', meta: '33 · Noida · Visa Signature · 2y 6m', risk: 60, profit: 36400, respondsTo: ['email', 'wa'],
        signals: ['Two EMI offers declined', 'Basket ₹54,000 off-us', 'Tech-only spender'],
        fix: 'He converts every large basket to EMI somewhere — matching the rate is the whole decision for him.' },
      { name: 'Ritu Saxena', meta: '42 · Jaipur · Visa Signature · 5y 3m', risk: 58, profit: 42800, respondsTo: ['sms', 'email'],
        signals: ['Appliance basket ₹96,000', 'Warranty bought at store', 'EMI on rival'],
        fix: 'Bundled warranty removes the ₹4,800 she paid the retailer for cover we already offer.' },
      { name: 'Mohit Agrawal', meta: '39 · Indore · Visa Signature · 4y 0m', risk: 55, profit: 31500, respondsTo: ['wa', 'email'],
        signals: ['Electronics −31%', 'No decline history', 'Rival EMI opened, not taken'],
        fix: 'He is comparing, not switched — the EMI match closes the gap before he commits.' },
      { name: 'Sneha Reddy', meta: '35 · Hyderabad · Visa Signature · 3y 5m', risk: 52, profit: 39700, respondsTo: ['wa', 'email'],
        signals: ['Basket ₹61,000 split off-us', 'Utilisation 74%', 'Cashback-motivated'],
        fix: 'Cashback on the large basket is the incentive she responds to in every past campaign.' },
      { name: 'Aman Chopra', meta: '45 · Ludhiana · Visa Infinite · 6y 9m', risk: 50, profit: 67300, respondsTo: ['email', 'wa'],
        signals: ['Appliance basket ₹74,000 off-us', 'EMI taken with rival', 'No decline history'],
        fix: 'Matching the EMI rate is the only variable that moved his last large basket off us.' },
    ],
    interventions: [
      { id: 'i31', name: 'No-Cost EMI Match', confidence: 'high',
        desc: 'Match the rival no-cost EMI at the point of purchase. Interest foregone only — no reward payout — which is why it clears the hurdle by the widest margin.',
        targeted: 7810, profitCr: 1.29, investCr: 0.46, roiX: 2.8 },
      { id: 'i32', name: 'Large-Tech Cashback', confidence: 'medium',
        desc: '5% cashback on large tech purchases — big volume, but the reward payout thins the margin.',
        targeted: 10400, profitCr: 1.14, investCr: 0.81, roiX: 1.4 },
      { id: 'i33', name: 'Extended Warranty Bundle', confidence: 'medium',
        desc: 'Bundle extended warranty and purchase protection on baskets above ₹50,000. Cheap to provide, but only lands at the moment of a large purchase.',
        targeted: 10400, profitCr: 0.48, investCr: 0.40, roiX: 1.2 },
    ],
  },
  {
    id: 'c4',
    tag: 'EVD',
    label: 'Everyday retail & grocery',
    line: 'Supermarket, fuel and utility bills — high frequency, low ticket',
    count: 7590,
    risk: 64,
    band: 'medium',
    why: 'The workhorse spend that keeps a card top-of-wallet. It is slipping to UPI and rival everyday cards, and it takes the habit with it.',
    signals: ['Grocery share −31%', 'UPI displacing card at till', 'Bill autopay moved off-us'],
    existing: {
      name: 'Fuel surcharge waiver and bill cashback',
      push: 'Surface the fuel waiver they are already entitled to',
      line: 'Waiver live on every fuel transaction. They are still paying the surcharge elsewhere.',
      heldPct: 0.28,
      confidence: 'medium',
    },
    members: [
      { name: 'Anita Desai', meta: '33 · Pune · Visa Signature · 2y 7m', risk: 64, profit: 28400, respondsTo: ['sms', 'wa'],
        signals: ['Grocery −34%', 'UPI at supermarket till', 'Two bills moved off autopay'],
        fix: 'Reinstating autopay on two bills puts a guaranteed monthly transaction back on the card.' },
      { name: 'Rahul Verma', meta: '31 · Jaipur · Visa Signature · 2y 2m', risk: 61, profit: 22100, respondsTo: ['sms', 'wa'],
        signals: ['Card txns −41%, UPI up', 'Fuel spend moved', 'Ticket size ₹640 avg'],
        fix: 'The everyday multiplier beats UPI’s zero reward at exactly the ticket sizes he transacts at.' },
      { name: 'Tara Joshi', meta: '29 · Indore · Visa Signature · 1y 10m', risk: 58, profit: 19600, respondsTo: ['wa', 'sms'],
        signals: ['Grocery −28%', 'Rival everyday card active', 'Bills on rival autopay'],
        fix: 'Autopay reinstatement plus the multiplier makes us the default for both recurring rails.' },
      { name: 'Deepak Rao', meta: '35 · Nagpur · Visa Signature · 3y 4m', risk: 55, profit: 26800, respondsTo: ['sms', 'email'],
        signals: ['Fuel share −36%', 'Surcharge complaint in Jun', 'Grocery intact'],
        fix: 'The surcharge waiver answers the exact complaint he raised in June, before he moves grocery too.' },
      { name: 'Nisha Bhatt', meta: '38 · Surat · Visa Signature · 4y 6m', risk: 53, profit: 31200, respondsTo: ['wa', 'sms'],
        signals: ['Utilities moved to UPI', 'Grocery steady', '22 txns a month'],
        fix: 'At twenty-two transactions a month, a small multiplier compounds faster than any one-off bonus.' },
      { name: 'Ritika Malhotra', meta: '34 · Gurugram · Visa Signature · 2y 8m', risk: 51, profit: 24900, respondsTo: ['wa', 'email'],
        signals: ['Department store −27%', 'Grocery on a rival card', 'Bills off autopay'],
        fix: 'Autopay plus the multiplier makes us the default for her recurring retail spend again.' },
      { name: 'Girish Kamath', meta: '46 · Mangaluru · Visa Signature · 6y 1m', risk: 50, profit: 34600, respondsTo: ['sms', 'wa'],
        signals: ['Telecom autopay off-us', 'Fuel steady', 'No complaints on file'],
        fix: 'One mandate win returns a fixed monthly amount for the life of the relationship.' },
      { name: 'Sunita Rane', meta: '41 · Thane · Visa Signature · 5y 0m', risk: 48, profit: 29300, respondsTo: ['email', 'wa'],
        signals: ['Grocery −19%', 'Insurance premium off-us', 'App-engaged'],
        fix: 'The annual insurance premium is the single largest recurring debit we are not capturing.' },
      { name: 'Alok Mishra', meta: '37 · Lucknow · Visa Signature · 3y 9m', risk: 45, profit: 18700, respondsTo: ['sms', 'wa'],
        signals: ['Fuel −24%', 'UPI growing', 'Low reward awareness'],
        fix: 'He has never redeemed a point — the multiplier only works paired with a redemption prompt.' },
    ],
    interventions: [
      { id: 'i41', name: 'Everyday Spend Multiplier', confidence: 'high',
        desc: '2× points on grocery, fuel and bills, capped monthly. Small per transaction, but it lands on the highest-frequency spend in the book.',
        targeted: 7590, profitCr: 0.86, investCr: 0.47, roiX: 1.8 },
      { id: 'i42', name: 'Bill Autopay Reinstatement', confidence: 'high',
        desc: 'Win back the recurring rails — utilities, telecom, insurance. Once a mandate is set it renews itself, so the acquisition cost is paid once.',
        targeted: 5920, profitCr: 0.68, investCr: 0.24, roiX: 2.8 },
      { id: 'i43', name: 'Fuel Surcharge Waiver', confidence: 'low',
        desc: 'Blanket surcharge waiver across fuel. Popular, but the waiver is given to everyone to change the behaviour of a few.',
        targeted: 7590, profitCr: 0.21, investCr: 0.31, roiX: 0.7 },
    ],
  },
]

export const COHORT_TOTAL = PM_COHORTS.reduce((n, c) => n + c.count, 0)
export const TOTAL_INTERVENTIONS = PM_COHORTS.reduce((n, c) => n + c.interventions.length, 0)

/** Every intervention across every cohort, ranked by modelled profit. */
export const ALL_OFFERS = PM_COHORTS
  .flatMap((c) => c.interventions.map((iv) => ({
    ...iv,
    cohortId: c.id,
    cohortLabel: c.label,
    cohortTag: c.tag,
    cohortBand: c.band,
    belowHurdle: iv.roiX < HURDLE,
  })))
  .sort((a, b) => b.profitCr - a.profitCr)

export const crore = (n) => `₹${n.toFixed(2)} Cr`
export const roi = (n) => `${n.toFixed(1)}×`

// Counts quoted by the loader are derived, so they cannot drift from the data.
export const PM_COHORT_SCAN = [
  { label: 'Scored every cardholder in the at-risk group across nine behaviour models',
    result: `${COHORT_TOTAL.toLocaleString('en-IN')} scored` },
  { label: 'Clustered on spend category mix — where the money actually goes',
    result: `${PM_COHORTS.length} cohorts` },
  { label: 'Attributed the cause of decline per cohort against the peer baseline',
    result: 'cause assigned' },
  { label: 'Ranked interventions by modelled profit and ROI inside the ₹8.3 Cr budget',
    result: `${TOTAL_INTERVENTIONS} interventions` },
]

// ── Audience bands, shared by the cohort modal and the iterate panel ──
export const RISK_BANDS = [
  { id: 'all',   label: 'All',       hint: '' },
  { id: 'high',  label: 'High risk', hint: '70+',      test: (r) => r >= 70 },
  { id: 'watch', label: 'Watch',     hint: '55–69',    test: (r) => r >= 55 && r < 70 },
  { id: 'low',   label: 'Low risk',  hint: 'under 55', test: (r) => r < 55 },
]

export const PROFIT_BANDS = [
  { id: 'all',  label: 'All',         hint: '' },
  { id: 'high', label: 'High profit', flat: 'High profit', hint: '₹50k+',      test: (p) => p >= 50000 },
  { id: 'mid',  label: 'Mid',         flat: 'Mid profit',  hint: '₹25–50k',    test: (p) => p >= 25000 && p < 50000 },
  { id: 'low',  label: 'Low',         flat: 'Low profit',  hint: 'under ₹25k', test: (p) => p < 25000 },
]

export const bandTest = (bands, id) => bands.find((b) => b.id === id)?.test

const CR = 1e7
const avg = (xs, f) => xs.reduce((n, x) => n + f(x), 0) / xs.length

/** Baseline levers — an offer sitting at these is untouched. */
export const BASE_OPTS = { riskBand: 'all', profitBand: 'all', incentive: 1, depth: 1 }

/** Has the operator moved anything away from the baseline? */
export const isTuned = (o) =>
  !!o && (o.riskBand !== 'all' || o.profitBand !== 'all' || o.incentive !== 1 || o.depth !== 1)

// Trimming to the strongest of a band lifts profit per head: the cardholders
// dropped are the weakest of the ones that qualified. Half a band of lift at
// full trim is enough to make the trade-off visible without inventing profit.
const FOCUS_K = 0.5

// A composite of the two things that make a save valuable — how much is at
// risk, and how much they are worth. Used to decide who survives a trim.
const score = (m) => (m.risk / 100) * Math.sqrt(m.profit)

/**
 * Re-model an intervention against a narrowed audience and a changed incentive.
 *
 * The sampled members stand in for the whole cohort, so the share of them that
 * clears the filters is the share of the cohort we can reach. Narrowing raises
 * profit per head — a higher-risk, higher-value cardholder has more to save —
 * while cost per head is unchanged, so ROI improves as the audience shrinks.
 * Incentive moves cost linearly but response only as its square root, so
 * overspending shows up as falling ROI rather than free profit.
 *
 * `depth` is the continuous version of the same idea: keep the top slice of
 * whoever cleared the bands, ranked by risk × value.
 */
export function iterate(offer, cohort, opts = {}) {
  const { riskBand = 'all', profitBand = 'all', incentive = 1, depth = 1 } = opts
  const all = cohort.members
  const rt = bandTest(RISK_BANDS, riskBand)
  const pt = bandTest(PROFIT_BANDS, profitBand)
  const banded = all.filter((m) => (!rt || rt(m.risk)) && (!pt || pt(m.profit)))

  const d = Math.max(0.05, Math.min(1, depth))
  // The sample is ten people, so the trim is applied to the cohort continuously
  // and to the sample by rank — the names shown are the ones that survive it.
  const keep = Math.max(banded.length ? 1 : 0, Math.round(banded.length * d))
  const sample = banded.slice().sort((a, b) => score(b) - score(a)).slice(0, keep)

  const reach = (banded.length / all.length) * d
  const targeted = Math.round(offer.targeted * reach)

  if (!sample.length || !targeted) {
    return { empty: true, sample, reach: 0, qualityLift: 0, targeted: 0, profitCr: 0, investCr: 0, roiX: 0 }
  }

  const bandLift =
    (avg(banded, (m) => m.risk) / avg(all, (m) => m.risk)) *
    (avg(banded, (m) => m.profit) / avg(all, (m) => m.profit))
  const qualityLift = bandLift * (1 + FOCUS_K * (1 - d))

  const investPerHead = (offer.investCr * CR / offer.targeted) * incentive
  const profitPerHead = (offer.profitCr * CR / offer.targeted) * qualityLift * Math.sqrt(incentive)

  const investCr = investPerHead * targeted / CR
  const profitCr = profitPerHead * targeted / CR

  return { empty: false, sample, reach, qualityLift, targeted, profitCr, investCr, roiX: profitCr / investCr }
}

/** An offer's headline numbers, re-modelled if the operator has tuned it. */
export function offerMetrics(offer, cohort, tuning) {
  if (!isTuned(tuning) || !cohort) {
    return {
      targeted: offer.targeted,
      profitCr: offer.profitCr,
      investCr: offer.investCr,
      roiX: offer.roiX,
      tuned: false,
      empty: false,
    }
  }
  const r = iterate(offer, cohort, tuning)
  return { ...r, tuned: true }
}

/** Cardholders sitting in cohorts the operator has switched off. */
export function excludedCount(bucketEx) {
  return PM_COHORTS.filter((c) => bucketEx[c.id]).reduce((n, c) => n + c.count, 0)
}

/** The audience the campaign will actually reach. */
export function qualifiedAudience(bucketEx) {
  return COHORT_TOTAL - excludedCount(bucketEx)
}
