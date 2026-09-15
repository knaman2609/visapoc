/**
 * Support tickets about the bank's Visa cards, in Xyne Desk's shape.
 *
 * Every ticket is about a card: applying for one, getting it delivered and
 * activated, using it, paying its bill, disputing a charge on it, or its
 * rewards and limit. Nothing here is about the bank's other products.
 *
 * The support screens are a Xyne Desk embedded in this console, so the data
 * speaks Desk's vocabulary: tickets arrive on desks (one per inbound channel),
 * sit in a per-agent mailbox (inbox, archived, spam), move through board stages,
 * carry a priority whose response target comes from Desk's default SLA, and can
 * hold an AI draft the desk accepts, refines or discards.
 *
 * This console is the receiving end. Nobody raises a ticket from here: people
 * write in from the app, by email, on WhatsApp or by asking for a callback, and
 * the desk triages, assigns and answers what arrives.
 *
 * Shape follows users.js and onboardingPopulation.js: a handful of hand-written
 * tickets carrying the editorial detail, then a seeded expansion. The authored
 * tickets are raised by people the console already knows — the applicants in
 * onboarding.js and the cardholders in customers.js — and most of the seeded
 * ones are drawn from the open onboarding book itself, so the support queue and
 * the onboarding funnel describe one set of people rather than two.
 *
 * Every time here is minutes before the console's fixed today (TODAY in
 * users.js, Monday 07 September 09:41), never measured from the real clock.
 *
 * Nothing written through the UI lands here. Replies, notes, stage changes,
 * stars and labels are held in React state for the session — see
 * SupportContext.jsx.
 */

import { getOnboardingPopulation } from './onboardingPopulation.js'
import { FIRST, LAST, METROS, TIER2, between, hash, mulberry32, pick } from './population.js'
import { USERS } from './users.js'

/* ── Vocabulary ─────────────────────────────────────────────────────── */

/** What a ticket is about. `tag` is the auto-tag Desk's tagger would attach. */
export const CATEGORIES = [
  { id: 'application', label: 'Card application', tag: 'card-application' },
  { id: 'limit', label: 'Card limit', tag: 'card-limit' },
  { id: 'delivery', label: 'Card delivery', tag: 'card-delivery' },
  { id: 'activation', label: 'Activation and PIN', tag: 'card-activation' },
  { id: 'usage', label: 'Card controls', tag: 'card-controls' },
  { id: 'payments', label: 'Card bill', tag: 'card-bill' },
  { id: 'disputes', label: 'Card disputes', tag: 'card-dispute' },
  { id: 'rewards', label: 'Card rewards', tag: 'card-rewards' },
]

export const CATEGORY_BY_ID = Object.fromEntries(CATEGORIES.map((c) => [c.id, c]))

/**
 * Desk's four priorities and its default SLA for each (SlaSettings DEFAULT_SLA
 * in xyne-spaces): minutes to first response and to resolution, and whether the
 * clock runs round the clock or in business hours. The demo counts every wait
 * in plain minutes — business hours are shown, not simulated.
 */
export const PRIORITIES = [
  { id: 'critical', label: 'Critical', responseMins: 60, resolutionMins: 240, hours: '24×7' },
  { id: 'high', label: 'High', responseMins: 120, resolutionMins: 1440, hours: '24×7' },
  { id: 'medium', label: 'Medium', responseMins: 480, resolutionMins: 1920, hours: 'Business hrs' },
  { id: 'low', label: 'Low', responseMins: 960, resolutionMins: 2880, hours: 'Business hrs' },
]

export const PRIORITY_BY_ID = Object.fromEntries(PRIORITIES.map((p) => [p.id, p]))

/**
 * The board's stages, in order. `kind` is Desk's stage status — it picks the
 * stage icon and colour — and the ids stay the plain "whose move is it" words
 * the rest of this module reasons with.
 */
export const STAGES = [
  { id: 'new', label: 'To Do', kind: 'todo' },
  { id: 'open', label: 'In Progress', kind: 'started' },
  { id: 'pending', label: 'Waiting on Customer', kind: 'paused' },
  { id: 'resolved', label: 'Resolved', kind: 'completed' },
]

export const STAGE_BY_ID = Object.fromEntries(STAGES.map((s) => [s.id, s]))

/**
 * One desk per inbound channel, named the way Desk names channels. `source` is
 * the badge Desk puts beside a desk: Mailbox for email, App for a connected app
 * webhook (the in-app chat and the WhatsApp line both arrive that way), Call for
 * telephony.
 */
export const DESKS = [
  { id: 'card-support', name: 'visa-cards-mail', source: 'Mailbox', channel: 'Email', address: 'visacards@apexbank.example' },
  { id: 'in-app-help', name: 'visa-cards-app', source: 'App', channel: 'In-app chat', address: 'visacards-app@apexbank.example' },
  { id: 'whatsapp-care', name: 'visa-cards-whatsapp', source: 'App', channel: 'WhatsApp', address: 'visacards-whatsapp@apexbank.example' },
  { id: 'callback-requests', name: 'visa-cards-callbacks', source: 'Call', channel: 'Phone callback', address: 'visacards-callbacks@apexbank.example' },
]

export const DESK_BY_ID = Object.fromEntries(DESKS.map((d) => [d.id, d]))
const DESK_BY_CHANNEL = Object.fromEntries(DESKS.map((d) => [d.channel, d]))

export const CHANNELS = DESKS.map((d) => d.channel)
const CHANNEL_WEIGHTS = [0.27, 0.41, 0.22, 0.1]

/**
 * Conversation labels — the desk's own filing, distinct from auto-tags. The
 * colours are Desk's label palette; like Desk, they are data carried on the
 * label rather than theme tokens, because a label's colour is chosen per label.
 */
export const LABELS = [
  { id: 'vip', name: 'VIP', color: '#8b5cf6' },
  { id: 'escalated', name: 'Escalated', color: '#ef4444' },
  { id: 'deadline', name: 'Deadline', color: '#f97316' },
  { id: 'follow-up', name: 'Follow-up', color: '#3b82f6' },
  { id: 'refund', name: 'Refund', color: '#22c55e' },
]

export const LABEL_BY_ID = Object.fromEntries(LABELS.map((l) => [l.id, l]))

/** Avatar fills, hashed by name — Desk's label palette again. */
export const SWATCHES = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#14b8a6', '#3b82f6', '#8b5cf6', '#ec4899']

/**
 * Who answers. The onboarding ops seats already exist in users.js, and they are
 * the people who clear the files these tickets are about, so the desk is drawn
 * from them rather than invented alongside.
 */
export const AGENTS = USERS
  .filter((u) => u.role === 'ops' && u.status === 'active')
  .slice(0, 6)
  .map((u) => ({ id: u.id, name: u.name, team: u.team, email: u.email }))

export const AGENT_BY_ID = Object.fromEntries(AGENTS.map((a) => [a.id, a]))

/** The user group classification routes each topic to. */
const GROUP_BY_CATEGORY = {
  application: 'Onboarding Ops',
  limit: 'Onboarding Ops',
  delivery: 'Onboarding Ops',
  activation: 'Onboarding Ops',
  payments: 'Card Servicing',
  disputes: 'Card Servicing',
  usage: 'Card Servicing',
  rewards: 'Card Rewards',
}

/* ── The authored tickets ───────────────────────────────────────────── */

/**
 * The tickets the demo story leans on. Each is raised by somebody who already
 * exists elsewhere in the console, and each exercises one thing the screen has
 * to handle: a breach, a ticket nobody owns, an internal note, an AI draft
 * waiting to be accepted, a resolved thread with a rating, spam.
 *
 * `mins` on a message is minutes before today; a thread reads oldest first.
 * `aiDraft` is the body only — the greeting and sign-off are added in build().
 */
const AUTHORED = [
  {
    subject: 'Message says my card will be closed if I do not activate',
    category: 'activation',
    tag: 'consent-deadline',
    priority: 'critical',
    status: 'open',
    channel: 'WhatsApp',
    assignee: 'arjun-nair',
    starred: true,
    labels: ['deadline', 'escalated'],
    reporter: { name: 'Pallavi Desai', kind: 'applicant', applicantId: 'ob-pallavi', city: 'Ahmedabad', card: 'Visa Signature' },
    aiDraft: 'Thank you for the new number. I have booked a verification call to the number ending 0932 for 11:30 today. Once it is verified the OTP will reach you, and activation takes under a minute. Your card will not be closed while this is in progress.',
    messages: [
      { from: 'customer', mins: 1510, body: 'I got an SMS saying my card will be closed if I do not activate it within 30 days. I never received the PIN and the OTP in the app never comes. I applied through the partner offer at the store and I do not want this cancelled.' },
      { from: 'agent', author: 'arjun-nair', mins: 1380, body: 'Sorry about this, Pallavi — it will not be closed while we sort it out. The OTP goes to the number on your application, ending 4471. Is that still your number?' },
      { from: 'note', author: 'arjun-nair', mins: 1376, body: 'Six days to the consent deadline. If the number has changed this needs a verification call today, not a form.' },
      { from: 'customer', mins: 95, body: 'That is my old number. My current one ends 0932. Please call me today, I am free after 11.' },
    ],
  },
  {
    subject: 'Card returned to sender — I was at home all day',
    category: 'delivery',
    tag: 'returned-to-origin',
    priority: 'high',
    status: 'new',
    channel: 'Email',
    assignee: null,
    starred: true,
    labels: ['vip'],
    reporter: { name: 'Shreya Banerjee', kind: 'applicant', applicantId: 'ob-shreya', city: 'Kolkata', card: 'Visa Infinite' },
    aiDraft: 'I am sorry the delivery failed. Your card is back with us and safe. I can re-dispatch it to your office in Salt Lake Sector V today by priority courier, which reaches Kolkata in two working days — ahead of your trip on the 20th. Please confirm the full office address, including the floor and company name.',
    messages: [
      { from: 'customer', mins: 212, body: 'Tracking says my card was "returned to origin — customer not available" on 3 September. I was at home all day and nobody came. I have waited five weeks for this card and I travel abroad on the 20th. Can it be sent to my office in Salt Lake Sector V instead?' },
    ],
  },
  {
    subject: 'KYC failed — name mismatch',
    category: 'application',
    tag: 'name-mismatch',
    priority: 'medium',
    status: 'pending',
    channel: 'In-app chat',
    assignee: 'ishaan-rao',
    reporter: { name: 'Rehan Qureshi', kind: 'applicant', applicantId: 'ob-rehan', city: 'Jaipur', card: 'Visa Platinum' },
    messages: [
      { from: 'customer', mins: 2910, body: 'My KYC keeps failing and says name mismatch. PAN says QURESHI and Aadhaar says KURESHI. It is the same person!' },
      { from: 'agent', author: 'ishaan-rao', mins: 2655, body: 'It is a spelling difference, not a doubt about who you are, so it is fixable either way. Upload a name-change affidavit — a notarised one-page declaration — or correct the spelling on Aadhaar so it matches PAN. The affidavit is usually faster, and once it is uploaded we re-run KYC the same day.' },
      { from: 'note', author: 'ishaan-rao', mins: 2650, body: 'DSA-sourced, documents otherwise clean. Re-run eKYC the moment the affidavit lands rather than sending it back through the queue.' },
    ],
  },
  {
    subject: 'Missed my video KYC call twice',
    category: 'application',
    tag: 'video-kyc',
    priority: 'high',
    status: 'open',
    channel: 'Phone callback',
    assignee: 'arjun-nair',
    labels: ['follow-up'],
    reporter: { name: 'Imran Sheikh', kind: 'applicant', applicantId: 'ob-imran', city: 'Hyderabad', card: 'Visa Signature' },
    messages: [
      { from: 'customer', mins: 3120, body: 'The video KYC link came at 9 in the morning both times while I was driving. Can I pick an evening slot?' },
      { from: 'agent', author: 'arjun-nair', mins: 2985, body: 'Evening slots run until 8pm on weekdays. I have held 6:30pm on Tuesday for you — reply to confirm and the link comes ten minutes before.' },
      { from: 'customer', mins: 305, body: 'Tuesday does not work, I am travelling. Is there anything on Monday evening or Saturday?' },
    ],
  },
  {
    subject: 'Bank statement could not be read',
    category: 'application',
    tag: 'statement-parse',
    priority: 'medium',
    status: 'new',
    channel: 'Email',
    assignee: null,
    reporter: { name: 'Nandini Rao', kind: 'applicant', applicantId: 'ob-nandini', city: 'Bengaluru', card: 'Visa Signature' },
    aiDraft: 'A scanned statement cannot be read automatically, but you do not need to send anything else. You can share your bank statement directly through Account Aggregator in about a minute. I have sent the link to your registered number — once it is shared, the income step completes on its own.',
    messages: [
      { from: 'customer', mins: 402, body: 'The app rejected my bank statement and says it could not be read. It is a scanned PDF from my CA. I am self-employed, so I do not have payslips. What else can I send?' },
    ],
  },
  {
    subject: 'Approved four days ago but still no card',
    category: 'limit',
    tag: 'limit-pending',
    priority: 'medium',
    status: 'open',
    channel: 'In-app chat',
    assignee: 'ishaan-rao',
    labels: ['follow-up'],
    reporter: { name: 'Kabir Malhotra', kind: 'applicant', applicantId: 'ob-kabir', city: 'Delhi', card: 'Visa Platinum' },
    aiDraft: 'Sorry for the wait. Your application is complete and the limit decision is with our portfolio team today. I have escalated it, and you will see the limit in the app as soon as it is assigned — the card is dispatched the same day.',
    messages: [
      { from: 'customer', mins: 5710, body: 'I got an approval email but the app still says "limit being assigned". How long does this take?' },
      { from: 'agent', author: 'ishaan-rao', mins: 5520, body: 'Your application is approved and complete — the last step is the limit decision, which sits with our portfolio team. It normally lands within two working days, and I have flagged yours.' },
      { from: 'customer', mins: 625, body: 'It has been four days now. A friend applied the same week and already has his card.' },
    ],
  },
  {
    subject: 'What is the ₹1,500 welcome bonus?',
    category: 'activation',
    tag: 'welcome-bonus',
    priority: 'low',
    status: 'pending',
    channel: 'In-app chat',
    assignee: 'arjun-nair',
    reporter: { name: 'Aarav Mehta', kind: 'applicant', applicantId: 'ob-aarav', customerId: 'activation', city: 'Mumbai', card: 'Visa Platinum' },
    messages: [
      { from: 'customer', mins: 7240, body: 'The notification mentions a ₹1,500 welcome bonus. Is it automatic?' },
      { from: 'agent', author: 'arjun-nair', mins: 7010, body: 'It is credited after your first transaction within 30 days of activating. Activating takes about 30 seconds in the app under Cards → Activate — once that is done, any purchase unlocks it.' },
    ],
  },
  {
    subject: 'Late fee charged though I paid on the due date',
    category: 'payments',
    tag: 'late-fee',
    priority: 'high',
    status: 'open',
    channel: 'Email',
    assignee: 'ishaan-rao',
    labels: ['refund'],
    reporter: { name: 'Rohan Iyer', kind: 'cardholder', customerId: 'autopay', city: 'Bengaluru', card: 'Visa Signature' },
    messages: [
      { from: 'customer', mins: 1905, body: 'A ₹1,180 late fee was added to my Visa card statement. I paid the full ₹48,600 card bill on the due date at 11:40pm. Please reverse it.' },
      { from: 'agent', author: 'ishaan-rao', mins: 1710, body: 'The payment reached us at 23:41 on the 2nd and posted on the 3rd, which is why the fee applied. As it was paid on the day, I have raised a reversal — it will show within two working days. AutoPay would stop this happening again; shall I send you the setup link?' },
      { from: 'customer', mins: 184, body: 'Thanks. Yes, send the link. Can you also confirm the GST on the fee is reversed too?' },
    ],
  },
  {
    subject: 'Renewal fee — thinking of closing the card',
    category: 'payments',
    tag: 'renewal-fee',
    priority: 'medium',
    status: 'resolved',
    channel: 'Email',
    assignee: 'arjun-nair',
    csat: 5,
    labels: ['vip'],
    reporter: { name: 'Meera Rao', kind: 'cardholder', customerId: 'churn', city: 'Mumbai', card: 'Visa Signature' },
    messages: [
      { from: 'customer', mins: 9820, body: 'I have held this card since 2019. Another bank has offered me a lifetime-free card. Unless the renewal fee is waived I will close this one in January.' },
      { from: 'agent', author: 'arjun-nair', mins: 9510, body: 'Thank you for telling us rather than just leaving, Meera. Your relationship manager has approved a waiver of the 2027 renewal fee and added 5% back on fuel. Both are live on your account now.' },
      { from: 'customer', mins: 9105, body: 'Appreciated. Thank you.' },
      { from: 'system', mins: 9100, body: 'Resolved by Arjun Nair' },
    ],
  },
  {
    subject: 'Charged twice by the airline for one booking',
    category: 'disputes',
    tag: 'duplicate-charge',
    priority: 'high',
    status: 'new',
    channel: 'In-app chat',
    assignee: null,
    labels: ['refund'],
    reporter: { name: 'Ishaan Gupta', kind: 'cardholder', customerId: 'travel', city: 'Bengaluru', card: 'Visa Platinum' },
    aiDraft: 'The second ₹38,420 entry is an authorisation hold from the airline and normally drops off within seven days. Because your trip is on the 19th, I have asked the airline’s bank to release it sooner, and I will update you as soon as it clears.',
    messages: [
      { from: 'customer', mins: 824, body: 'I see two charges of ₹38,420 from the airline for the same BLR–SIN booking on 29 August. Only one ticket was issued. My trip is on the 19th and this is eating into my limit.' },
    ],
  },
  {
    subject: 'Voucher option shows unavailable before my points expire',
    category: 'rewards',
    tag: 'points-expiry',
    priority: 'low',
    status: 'open',
    channel: 'Email',
    assignee: 'arjun-nair',
    reporter: { name: 'Vikram Shetty', kind: 'cardholder', customerId: 'rewards', city: 'Pune', card: 'Visa Platinum' },
    messages: [
      { from: 'customer', mins: 2630, body: 'I have points expiring on 31 October. Can the expiry be extended?' },
      { from: 'agent', author: 'arjun-nair', mins: 2410, body: 'Expiry dates cannot be moved, but redeeming before then keeps the value. The best rate on your balance is e-commerce vouchers at ₹0.25 a point — your 48,200 points are worth ₹12,050 that way.' },
      { from: 'customer', mins: 1310, body: 'The voucher option shows "unavailable" in the app for me.' },
    ],
  },
  {
    subject: 'Card declined when I tap my phone',
    category: 'usage',
    tag: 'contactless',
    priority: 'medium',
    status: 'resolved',
    channel: 'WhatsApp',
    assignee: 'ishaan-rao',
    csat: 4,
    reporter: { name: 'Tanvi Kulkarni', kind: 'applicant', applicantId: 'ob-tanvi', city: 'Indore', card: 'Visa Platinum' },
    messages: [
      { from: 'customer', mins: 1190, body: 'I added the card to my phone wallet two weeks ago but it was declined when I tapped at a shop. Is it blocked?' },
      { from: 'agent', author: 'ishaan-rao', mins: 1020, body: 'It is not blocked. Contactless payments are off on new cards until you turn them on — Cards, Controls, Contactless. I have switched it on for you from here.' },
      { from: 'customer', mins: 760, body: 'Worked at the shop today. Thanks!' },
      { from: 'system', mins: 755, body: 'Resolved by Ishaan Rao' },
    ],
  },
  {
    subject: 'Application lost my progress',
    category: 'application',
    tag: 'resume-application',
    priority: 'medium',
    status: 'new',
    channel: 'In-app chat',
    assignee: null,
    reporter: { name: 'Varun Kamath', kind: 'applicant', applicantId: 'ob-varun', city: 'Chennai', card: 'Visa Platinum' },
    aiDraft: 'Nothing you uploaded is lost — the application saves after every section. I have sent a resume link to your registered number that opens straight at the income step.',
    messages: [
      { from: 'customer', mins: 88, body: 'The app logged me out while I was entering my income and now it wants me to start the application again. Do I really have to re-upload everything?' },
    ],
  },
  // Two that Desk's spam guard let through. They sit in the Spam folder, out of
  // every queue and every metric, which is what Spam is for.
  {
    subject: 'Congratulations! Claim your ₹25,000 cashback today',
    category: 'rewards',
    tag: 'phishing',
    priority: 'low',
    status: 'new',
    channel: 'Email',
    assignee: null,
    spam: true,
    reporter: { name: 'Rewards Desk', kind: 'unknown', email: 'claims@cashback-rewards.example', city: '—', card: '—' },
    messages: [
      { from: 'customer', mins: 540, body: 'Dear valued customer, you have been selected for ₹25,000 cashback. Click the link and enter your card number and OTP within 24 hours to claim.' },
    ],
  },
  {
    subject: 'URGENT: verify your card to avoid suspension',
    category: 'usage',
    tag: 'phishing',
    priority: 'low',
    status: 'new',
    channel: 'Email',
    assignee: null,
    spam: true,
    reporter: { name: 'Card Security', kind: 'unknown', email: 'security-alert@verify-card.example', city: '—', card: '—' },
    messages: [
      { from: 'customer', mins: 1980, body: 'Your card will be suspended in 2 hours. Reply with your full card number, expiry and CVV to keep it active.' },
    ],
  },
]

/* ── What an applicant says about their blocker ─────────────────────── */

/**
 * The customer's side of each onboarding blocker in onboarding.js.
 *
 * The funnel describes a blocker the way ops sees it — "Returned to origin".
 * Nobody writes in with that sentence, so each one is re-voiced here as the
 * message that arrives, the desk's answer (which doubles as the AI draft on a
 * ticket nobody has answered yet), and what the customer says back. Two blockers
 * are missing on purpose: an applicant who activated and simply has not spent
 * does not write to support about it.
 */
const BLOCKER_VOICE = {
  'Form abandoned at income step': {
    category: 'application', tag: 'resume-application',
    subject: 'Application lost my progress',
    ask: 'The app logged me out halfway through the income section and now wants me to start again. Do I have to re-upload my documents?',
    reply: 'Nothing you uploaded is lost — the application saves after every section. I have sent a resume link to your registered number; it opens at the income step.',
    follow: 'The link says it has expired.',
  },
  'OTP not verified': {
    category: 'application', tag: 'otp', priority: 'high',
    subject: 'OTP never arrives',
    ask: 'I have tried four times and the OTP to submit my application never comes. My number is correct.',
    reply: 'Some networks hold messages from short codes. I have re-triggered it as a voice call instead — an automated call will read the code out.',
    follow: 'I got the call but the code was rejected as expired.',
  },
  'Bureau consent declined': {
    category: 'application', tag: 'bureau-consent', priority: 'low',
    subject: 'Why do you need my credit report?',
    ask: 'The form asks me to allow a credit bureau check. I do not want my score to drop just for applying.',
    reply: 'The check at this step is a soft enquiry and does not lower your score. Without it the application cannot be assessed, so I have re-sent the consent request if you are comfortable going ahead.',
    follow: 'Will it show up to other banks?',
  },
  'Name mismatch against PAN': {
    category: 'application', tag: 'name-mismatch',
    subject: 'KYC failed — name mismatch',
    ask: 'My KYC keeps failing with "name mismatch". PAN and Aadhaar spell my surname slightly differently. It is the same person.',
    reply: 'It is a spelling difference, not a doubt about who you are. Upload a name-change affidavit, or correct the spelling on Aadhaar to match PAN, and we re-run KYC the same day.',
    follow: 'Where do I get the affidavit format?',
  },
  'Video-KYC appointment missed': {
    category: 'application', tag: 'video-kyc',
    subject: 'Missed my video KYC call',
    ask: 'The video KYC call came while I was at work and I missed it. Can I choose a time?',
    reply: 'Slots run 9am to 8pm on weekdays and 10am to 4pm on Saturdays. I have held an evening slot for you — reply to confirm and the link comes ten minutes before.',
    follow: 'Evenings do not work this week. Is Saturday morning possible?',
  },
  'Document illegible': {
    category: 'application', tag: 'document-quality',
    subject: 'Document upload rejected as unclear',
    ask: 'My Aadhaar upload was rejected as unclear. I took the photo on my phone.',
    reply: 'Glare usually causes it. A flat surface, no flash, and all four corners in frame fixes nearly every rejection — the upload screen now shows a guide.',
    follow: 'I uploaded it again and it still says unclear.',
  },
  'Address proof out of date': {
    category: 'application', tag: 'address-proof', priority: 'low',
    subject: 'Address proof not accepted',
    ask: 'You rejected my electricity bill as address proof. It is my current address.',
    reply: 'The bill needs to be dated within the last three months, and the one uploaded is from May. Any utility bill, bank statement or rent agreement from June onwards will work.',
    follow: 'My bills come in my father’s name. What do I send then?',
  },
  'Statement could not be parsed': {
    category: 'application', tag: 'statement-parse',
    subject: 'Bank statement could not be read',
    ask: 'The app says my bank statement could not be read. It is a scanned PDF, and I am self-employed so I do not have payslips.',
    reply: 'A scan cannot be read automatically. You can share the statement directly from your bank through Account Aggregator in about a minute, with no upload at all. I have sent you the link.',
    follow: 'My bank is not in the list on that link.',
  },
  'Income below the variant floor': {
    category: 'application', tag: 'income-floor',
    subject: 'Told my income is too low for this card',
    ask: 'I applied for the Signature card and was told my income does not qualify. Is my application rejected?',
    reply: 'It is not rejected. Your income qualifies for Platinum, and the application can move to that card without starting again. Reply yes and I will switch it.',
    follow: 'What is the difference in benefits?',
  },
  'Payslips older than three months': {
    category: 'application', tag: 'payslips', priority: 'low',
    subject: 'Payslips rejected',
    ask: 'Why were my payslips rejected? They are from my current employer.',
    reply: 'We need the latest three months, and the ones uploaded run to May. June, July and August will clear this step.',
    follow: 'My August payslip is not out until the 10th.',
  },
  'Employer not on the approved list': {
    category: 'application', tag: 'employer-check',
    subject: 'My employer is not recognised',
    ask: 'The application says my employer is not on your list. It is a registered company with 200 staff.',
    reply: 'That list is a quick check, not a final answer. I have asked for an employer-category review, which usually takes two working days.',
    follow: 'Is there any update on the review?',
  },
  'Thin file, no bureau history': {
    category: 'application', tag: 'thin-file',
    subject: 'No credit history — can I still get a card?',
    ask: 'This is my first credit card and the application has been "under review" for a week. Is it because I have no credit score?',
    reply: 'That is why it takes longer, and it is not a no. First-time applicants are assessed on salary credits instead, and usually start on a smaller limit that is reviewed after a few months.',
    follow: 'How small is the starting limit?',
  },
  'Delinquency in the last 12 months': {
    category: 'application', tag: 'credit-review',
    subject: 'Application on hold',
    ask: 'My application says "on hold". I had one late EMI last year that I have since settled. Is that why?',
    reply: 'A single late payment that has been settled is reviewed by a person rather than declined automatically. I have added your note to the file for the reviewer.',
    follow: 'Can I send the settlement letter?',
  },
  'Existing exposure too high': {
    category: 'application', tag: 'credit-review',
    subject: 'Application stuck at approval',
    ask: 'My application has been at "approval" for over a week and nobody has told me anything.',
    reply: 'Sorry for the silence. The application is with a credit reviewer because of existing loans on your report. The usual outcome is an approval at a lower limit rather than a decline.',
    follow: 'I would rather have the full limit. Can I send proof my car loan is closed?',
  },
  'Duplicate of an existing card': {
    category: 'application', tag: 'duplicate-card',
    subject: 'Application says I already have a card',
    ask: 'It says I already hold a card with you. I closed that card in 2023.',
    reply: 'Our records still show the older card open with a nil balance. I can close it formally and continue this application, or convert this application into an upgrade of that card.',
    follow: 'Please close it. How long does that take?',
  },
  'Awaiting a limit decision': {
    category: 'limit', tag: 'limit-pending', priority: 'high',
    subject: 'Approved but no card yet',
    ask: 'I got an approval email days ago but the app still says "limit being assigned". How long does this take?',
    reply: 'Your application is complete — the last step is the limit decision, which sits with our portfolio team. It normally lands within two working days, and I have flagged yours.',
    follow: 'It has been longer than two days now.',
  },
  'Starter limit below the amount sought': {
    category: 'limit', tag: 'limit-increase',
    subject: 'Limit much lower than I asked for',
    ask: 'I asked for ₹1,50,000 and was given ₹40,000. Can this be increased?',
    reply: 'Starter limits are reviewed after three on-time statements, and increases are offered automatically when usage is healthy. I have noted your request on the file.',
    follow: 'Three months is too long, I have a purchase planned.',
  },
  'Address undeliverable': {
    category: 'delivery', tag: 'address-incomplete', priority: 'high',
    subject: 'Courier says my address is incomplete',
    ask: 'The courier says my address is incomplete. I have lived at the same address for six years.',
    reply: 'The courier flagged a missing flat number. If you confirm the full address here I will re-dispatch today; delivery takes three to five working days.',
    follow: 'It is flat 402. Can it go to my office instead?',
  },
  'Returned to origin': {
    category: 'delivery', tag: 'returned-to-origin', priority: 'high',
    subject: 'Card returned to sender',
    ask: 'Tracking says my card was returned because the customer was not available. I was at home all day.',
    reply: 'I am sorry. The card is back with us and safe. I can re-dispatch it to the same or a different address, or hold it for collection at your nearest branch.',
    follow: 'Please send it to my office. When will it arrive?',
  },
  'Courier delay': {
    category: 'delivery', tag: 'courier-delay',
    subject: 'Card stuck in transit',
    ask: 'Tracking has said "in transit" for six days without moving.',
    reply: 'I have raised it with the courier. If it has not moved by tomorrow I will cancel that dispatch and send a replacement, and the first card will be blocked so it cannot be used.',
    follow: 'Still no movement.',
  },
  'Activation nudge unopened': {
    category: 'activation', tag: 'activation', priority: 'low',
    subject: 'How do I activate my card?',
    ask: 'My card arrived. How do I activate it? I do not see an option in the app.',
    reply: 'In the app, go to Cards, tap the new card and choose Activate. It takes about 30 seconds and sets your PIN at the same time.',
    follow: 'I only see my old debit card in the Cards section.',
  },
  'Approaching the 30-day consent deadline': {
    category: 'activation', tag: 'consent-deadline', priority: 'critical',
    subject: 'Message says my card will be closed',
    ask: 'I got a message that my card will be closed if I do not activate it, and I have not been able to set the PIN. Please do not close it.',
    reply: 'It will not be closed while we sort this out. Activation needs an OTP to your registered number — can you confirm that number is still yours?',
    follow: 'That is my old number. How do I change it?',
  },
  'PIN never set': {
    category: 'activation', tag: 'pin-setup',
    subject: 'Cannot set my PIN',
    ask: 'The set PIN screen keeps timing out before the OTP arrives.',
    reply: 'I have sent a PIN-set link that stays valid for 24 hours, so the timeout will not apply. Open it on the same phone the app is installed on.',
    follow: 'The link opened but says "session invalid".',
  },
  'Added to a wallet, still unused': {
    category: 'usage', tag: 'contactless',
    subject: 'Card declined on my phone',
    ask: 'I added the card to my phone wallet but it was declined when I tapped at a shop. Is it blocked?',
    reply: 'It is not blocked. Contactless payments are off on new cards until you turn them on — Cards, Controls, Contactless. I can switch it on from here if you prefer.',
    follow: 'Please switch it on for me.',
  },
}

/* ── What a working cardholder writes in about ──────────────────────── */

const inrPlain = (n) => `₹${n.toLocaleString('en-IN')}`

/**
 * The rest of the queue: cardholders past onboarding. `ask` takes the ticket's
 * own generator so an amount is drawn once and reads the same everywhere it is
 * quoted.
 */
const CARDHOLDER_TOPICS = [
  {
    category: 'payments', tag: 'bill-payment', priority: 'high',
    subject: 'Card bill payment not reflecting',
    ask: (r) => `I paid ${inrPlain(between(r, 8, 90) * 1000)} towards my Visa card bill yesterday and the app still shows the full amount due.`,
    reply: 'Card bill payments made after 8pm post to your card account on the next working day, so it will show by tomorrow morning. No late fee applies to a payment made on or before the due date.',
    follow: 'It still shows unpaid and the due date is today.',
  },
  {
    category: 'payments', tag: 'autopay',
    subject: 'Card bill AutoPay failed',
    ask: () => 'I got an SMS saying the AutoPay for my Visa card bill failed. There is enough money in my account.',
    reply: 'Your bank declined the mandate because it had expired. A new one takes two minutes in the app — I have sent the link — and this month can be paid manually without a fee until the due date.',
    follow: 'Done. Will it take this month’s payment automatically now?',
  },
  {
    category: 'payments', tag: 'late-fee',
    subject: 'Late fee charged',
    ask: (r) => `A late fee of ${inrPlain(pick(r, [500, 750, 950, 1180]))} was added even though I paid on the due date.`,
    reply: 'The payment reached us after the cut-off on the due date, which is why the fee applied. As it was paid on the day, I have raised a reversal — it will show within two working days.',
    follow: 'Is the GST on the fee reversed too?',
  },
  {
    category: 'disputes', tag: 'unrecognised-txn', priority: 'critical',
    subject: 'A transaction I do not recognise',
    ask: (r) => `There is a charge of ${inrPlain(between(r, 12, 480) * 100)} from a merchant I have never heard of. I still have my card with me.`,
    reply: 'I have blocked the card as a precaution and raised a dispute. A replacement is on its way, and the amount will be credited back temporarily while we investigate.',
    follow: 'How long does the investigation take?',
  },
  {
    category: 'disputes', tag: 'duplicate-charge', priority: 'high',
    subject: 'Charged twice for one purchase',
    ask: (r) => `I was charged ${inrPlain(between(r, 9, 260) * 100)} twice for the same order.`,
    reply: 'The second entry is an authorisation hold that normally drops off within seven days. If it is still there after that I will raise a dispute straight away.',
    follow: 'It has been eight days and both are still there.',
  },
  {
    category: 'disputes', tag: 'refund',
    subject: 'Refund not credited',
    ask: (r) => `The merchant says they refunded ${inrPlain(between(r, 6, 150) * 100)} last week but I cannot see it on my card.`,
    reply: 'Refunds take five to seven working days to reach a card after the merchant issues them. If you share the refund reference I can trace it with the network.',
    follow: 'The reference they gave me is ARN 7421 9930 1182.',
  },
  {
    category: 'rewards', tag: 'points', priority: 'low',
    subject: 'Points not credited',
    ask: () => 'The points for my last statement have not been credited.',
    reply: 'Points post three days after the statement is generated. I can see yours pending, and they will appear by the end of the week.',
    follow: 'It is the end of the week and nothing has appeared.',
  },
  {
    category: 'rewards', tag: 'lounge-access',
    subject: 'Lounge access refused with my Visa card',
    ask: (r) => `The airport lounge refused entry with my Visa card and charged me ${inrPlain(between(r, 12, 30) * 100)}. My card includes free lounge visits.`,
    reply: 'The lounge checks entry with a ₹2 authorisation on the card, which was declined because contactless payments were switched off. I have switched them on and raised a refund for what you paid — it reaches your card within seven working days.',
    follow: 'Will this visit still count against my free ones?',
  },
  {
    category: 'usage', tag: 'international-usage', priority: 'high',
    subject: 'Visa card declined abroad',
    ask: (r) => `My Visa card was declined at a shop in ${pick(r, ['Dubai', 'Singapore', 'Bangkok', 'London'])}. I have enough limit left.`,
    reply: 'International transactions are switched off on new cards until you turn them on. I have enabled them for the next 30 days — you can change this any time under Cards, Controls, International.',
    follow: 'It still gets declined at the ATM here.',
  },
  {
    category: 'usage', tag: 'visa-secure-otp',
    subject: 'Online card payment fails at the OTP step',
    ask: () => 'Every online payment with my Visa card fails at the OTP screen. The OTP never arrives.',
    reply: 'Online card payments are verified through Visa Secure, which sends the OTP to the number registered on the card. Your new number had not reached the card record yet — it has now, so the next payment will get its OTP.',
    follow: 'I tried again and it still says authentication failed.',
  },
  {
    category: 'limit', tag: 'limit-increase', priority: 'low',
    subject: 'Request to increase my limit',
    ask: (r) => `Can my limit be raised to ${inrPlain(between(r, 2, 12) * 50000)}? I have used the card for over a year without missing a payment.`,
    reply: 'Your account is eligible for a review. I have raised the request, and a decision will appear in the app within three working days.',
    follow: 'Is there any update?',
  },
]

const CARDHOLDER_CARDS = ['Visa Platinum', 'Visa Signature', 'Visa Infinite']

/* ── The seeded rest ────────────────────────────────────────────────── */

// A fortnight of inbound for this book. The authored tickets lead the list; the
// remainder are drawn here.
const TOTAL = 166

// How the drawn tickets split between people still onboarding and cardholders
// already using the card. Onboarding writes in more than its share of the book
// — it is the stretch where the most can go wrong in the fewest days.
const APPLICANT_SHARE = 0.58

function pickW(rnd, xs, weights) {
  let r = rnd() * weights.reduce((a, b) => a + b, 0)
  for (let i = 0; i < xs.length; i += 1) {
    r -= weights[i]
    if (r <= 0) return xs[i]
  }
  return xs[xs.length - 1]
}

/** Nudge a topic's usual priority a step either way, so the queue is not uniform. */
function priorityFor(rnd, base = 'medium') {
  const order = PRIORITIES.map((p) => p.id)
  const at = order.indexOf(base)
  const roll = rnd()
  if (roll < 0.12 && at > 0) return order[at - 1]
  if (roll > 0.84 && at < order.length - 1) return order[at + 1]
  return base
}

/**
 * One thread, shaped by where the ticket has got to.
 *
 * Only the parts a stage implies are written: a To Do ticket is one message,
 * one In Progress ends with the customer, one Waiting on Customer ends with the
 * desk. So a thread can never contradict the stage badge above it.
 */
function threadFor(rnd, voice, status, priority, ask) {
  const target = PRIORITY_BY_ID[priority].responseMins
  // Waits are drawn up to about twice the target, so a fair share of what is
  // waiting on the desk is already past it.
  const wait = () => between(rnd, 6, Math.round(target * 2))

  if (status === 'new') {
    return { messages: [{ from: 'customer', mins: wait(), body: ask }], agent: false }
  }

  const agent = pick(rnd, AGENTS).id
  const created = status === 'resolved' ? between(rnd, 1400, 19000) : between(rnd, 700, 9000)
  const firstReply = Math.max(created - between(rnd, 12, Math.round(target * 1.3)), 30)
  const messages = [
    { from: 'customer', mins: created, body: ask },
    { from: 'agent', author: agent, mins: firstReply, body: voice.reply },
  ]

  if (status === 'open') {
    messages.push({ from: 'customer', mins: Math.min(wait(), firstReply - 5), body: voice.follow })
  } else if (status === 'resolved') {
    const thanks = Math.max(firstReply - between(rnd, 20, 600), 10)
    messages.push({ from: 'customer', mins: thanks, body: pick(rnd, ['Thank you, that sorted it.', 'Done, thanks.', 'That worked. Thanks for the quick help.']) })
    messages.push({ from: 'system', mins: Math.max(thanks - 4, 1), body: `Resolved by ${AGENT_BY_ID[agent].name}` })
  }

  return { messages, agent }
}

/** Open, recently-stalled applicants with a blocker somebody would write in about. */
function applicantPool() {
  return getOnboardingPopulation().filter((r) => !r.featured && r.open && BLOCKER_VOICE[r.blocker])
}

function generated() {
  const pool = applicantPool()
  const usedApplicants = new Set()
  const out = []

  for (let i = 0; out.length < TOTAL - AUTHORED.length; i += 1) {
    const rnd = mulberry32(hash(`support:${i}`))
    const fromApplicant = rnd() < APPLICANT_SHARE

    let voice
    let reporter
    let ask
    if (fromApplicant) {
      const row = pool[Math.floor(rnd() * pool.length)]
      // One ticket per applicant: two tickets from the same stalled file read as
      // a duplicate, which is a different problem from the one being demoed.
      if (!row || usedApplicants.has(row.id)) continue
      usedApplicants.add(row.id)
      voice = BLOCKER_VOICE[row.blocker]
      ask = voice.ask
      reporter = { name: row.name, kind: 'applicant', applicantId: row.id, city: row.city, card: row.variant }
    } else {
      voice = pick(rnd, CARDHOLDER_TOPICS)
      ask = voice.ask(rnd)
      reporter = {
        name: `${pick(rnd, FIRST)} ${pick(rnd, LAST)}`,
        kind: 'cardholder',
        city: rnd() < 0.7 ? pick(rnd, METROS) : pick(rnd, TIER2),
        card: pick(rnd, CARDHOLDER_CARDS),
      }
    }

    const roll = rnd()
    const status = roll < 0.17 ? 'new' : roll < 0.4 ? 'open' : roll < 0.58 ? 'pending' : 'resolved'
    const priority = priorityFor(rnd, voice.priority)
    const { messages, agent } = threadFor(rnd, voice, status, priority, ask)

    out.push({
      subject: voice.subject,
      category: voice.category,
      tag: voice.tag,
      priority,
      status,
      channel: pickW(rnd, CHANNELS, CHANNEL_WEIGHTS),
      // New tickets are mostly nobody's yet; a few were routed on arrival.
      assignee: agent || (rnd() < 0.2 ? pick(rnd, AGENTS).id : null),
      csat: status === 'resolved' && rnd() < 0.62 ? pickW(rnd, [5, 4, 3, 2, 1], [0.52, 0.28, 0.1, 0.06, 0.04]) : null,
      // Desk drafts a reply to most tickets nobody has answered yet.
      aiDraft: status === 'new' && rnd() < 0.8 ? voice.reply : null,
      reporter,
      messages,
    })
  }

  return out
}

// Domain is fictional, and stays fictional — nothing here should resolve.
const slugName = (name) => name.toLowerCase().replace(/[^a-z]+/g, '.').replace(/^\.|\.$/g, '')

/**
 * Personal addresses, one per person.
 *
 * Built from the name alone, two different people called Meera Rao would share
 * an inbox — and the ticket page's "related tickets" would show each the
 * other's. So a person is keyed by the file they belong to (or, for a drawn
 * cardholder, name, city and card together), gets a number seeded from that
 * key, and bumps it on a clash. The same person always gets the same address.
 */
function emailBook() {
  const byKey = new Map()
  const taken = new Set()
  return (reporter) => {
    if (reporter.email) return reporter.email
    const key = reporter.applicantId ?? reporter.customerId ?? `${reporter.name}|${reporter.city}|${reporter.card}`
    if (!byKey.has(key)) {
      const slug = slugName(reporter.name)
      let n = (hash(key) % 900) + 100
      while (taken.has(`${slug}${n}`)) n = n === 999 ? 100 : n + 1
      taken.add(`${slug}${n}`)
      byKey.set(key, `${slug}${n}@mail.example`)
    }
    return byKey.get(key)
  }
}

/** An AI draft reads as a letter: greeting, body, the desk's sign-off. */
const letter = (first, body) => `Hi ${first},\n\n${body}\n\nRegards,\nApex Bank Support`

/**
 * Every ticket, numbered newest first, with Desk's per-ticket state laid over it.
 *
 * Numbers are handed out by arrival, so a higher number always means a later
 * ticket. The overlay — which desk, which mailbox, starred, read, labels — draws
 * from its own seed keyed on the ticket number, so it never shifts the stream
 * the tickets themselves were drawn from.
 */
function build() {
  const all = [...AUTHORED.map((t) => ({ ...t, featured: true })), ...generated().map((t) => ({ ...t, featured: false }))]
    .map((t) => ({ ...t, createdMins: t.messages[0].mins }))
    .sort((a, b) => a.createdMins - b.createdMins)

  const emailFor = emailBook()

  return all.map((t, i) => {
    const id = `SR-${48420 - i}`
    const rnd = mulberry32(hash(`desk-overlay:${id}`))
    const first = t.reporter.name.split(' ')[0]
    let lastPublic = null
    for (const m of t.messages) if (m.from === 'customer' || m.from === 'agent') lastPublic = m
    const customerLast = lastPublic?.from === 'customer'

    return {
      ...t,
      id,
      csat: t.csat ?? null,
      desk: DESK_BY_CHANNEL[t.channel].id,
      reporter: { ...t.reporter, email: emailFor(t.reporter) },
      tags: [CATEGORY_BY_ID[t.category].tag, t.tag].filter(Boolean),
      labels: t.labels ?? (rnd() < 0.16 ? [pick(rnd, LABELS).id] : []),
      starred: t.starred ?? rnd() < 0.06,
      // Resolved tickets are usually archived out of the inbox; they stay in
      // All Mail, which is how Desk treats archiving.
      mailbox: t.spam ? 'spam' : t.status === 'resolved' && rnd() < 0.55 ? 'archived' : 'inbox',
      unread: t.status === 'new' || (t.status === 'open' && customerLast && (t.featured || rnd() < 0.6)),
      userGroup: GROUP_BY_CATEGORY[t.category],
      aiDraft: t.aiDraft ? letter(first, t.aiDraft) : null,
      messages: t.messages.map((m, j) => ({ ...m, id: `${id}-m${j}` })),
    }
  })
}

let CACHE = null

/** Every ticket across every desk. Built on first read and cached. */
export function getTickets() {
  if (!CACHE) CACHE = build()
  return CACHE
}

let INDEX = null

export function ticketById(id) {
  if (!INDEX) INDEX = new Map(getTickets().map((t) => [t.id, t]))
  return INDEX.get(id) ?? null
}
