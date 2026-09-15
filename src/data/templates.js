import { fmtIN } from './portfolio.js'

/**
 * What the agent can rewrite a template into. Each variant is authored copy,
 * selected by intent — swap this for a completion when the endpoint exists.
 *
 * Every tone carries what it has actually done before, because "make it
 * warmer" is not a matter of taste when there is a response rate attached to
 * it. `respondPct` is how often it was acted on; `favourPct` is how often the
 * cardholder rated the message helpful afterwards. They do not move together —
 * urgency wins the click and loses the goodwill — and that tension is the
 * whole reason to show both rather than a single score.
 */
export const TONES = [
  { id: 'base',   label: 'As drafted', note: 'The house style for retention copy',
    campaigns: 18, respondPct: 0.061, favourPct: 0.62 },
  { id: 'short',  label: 'Shorter', note: 'Cuts to the number and the deadline',
    campaigns: 24, respondPct: 0.068, favourPct: 0.58 },
  { id: 'warm',   label: 'Warmer', note: 'Leads with the relationship, not the offer',
    campaigns: 15, respondPct: 0.074, favourPct: 0.79 },
  { id: 'urgent', label: 'More urgent', note: 'Leads with the expiry date',
    campaigns: 21, respondPct: 0.082, favourPct: 0.41 },
  { id: 'formal', label: 'More formal', note: 'Reads like a statement, not a promotion',
    campaigns: 9,  respondPct: 0.049, favourPct: 0.71 },
]

export const findTone = (id) => TONES.find((t) => t.id === id) || TONES[0]

/**
 * The tone the agent puts forward for a campaign, and why.
 *
 * Telling somebody about a benefit they already hold is a relationship
 * message — there is no deadline to lean on and nothing being sold, so warmth
 * outperforms. Buying somebody a new offer has an expiry attached, and urgency
 * is what converts it, at a cost in goodwill the operator should see stated.
 */
export function suggestTone(kind) {
  if (kind === 'awareness') {
    return {
      id: 'warm',
      why: 'Nothing is being sold here — the value is already theirs. Warmth is the '
        + 'variant that has done best on reminders, and it is the one cardholders rate '
        + 'helpful most often.',
    }
  }
  return {
    id: 'urgent',
    why: 'The offer expires, and leading with the date is what has converted best on '
      + 'paid campaigns. It is also the variant cardholders rate helpful least often — '
      + 'worth the trade on a win-back, less so on a loyal cohort.',
  }
}

export const TEMPLATES = {
  email: {
    base: {
      subject: '{{first_name}}, {{points}} bonus points are on your {{card}}',
      body: 'You have held your {{card}} for {{tenure}}, and there is {{benefit_value}} of {{category}} value sitting unclaimed on it this year.\n\nWe have credited {{points}} bonus points to your account today. Spend on {{category}} before {{deadline}} and the points post within 48 hours.',
      cta: 'See your {{category}} benefits',
    },
    short: {
      subject: '{{first_name}}, {{points}} points are waiting',
      body: '{{benefit_value}} of {{category}} value is unclaimed on your {{card}}.\n\nWe have added {{points}} bonus points. Use them before {{deadline}}.',
      cta: 'Claim your points',
    },
    warm: {
      subject: '{{first_name}}, a thank-you for {{tenure}} with us',
      body: 'Thank you for {{tenure}} with us — it matters more than you might think.\n\nWe have put {{points}} bonus points on your {{card}}, and there is still {{benefit_value}} of {{category}} value to enjoy this year. Use it before {{deadline}}, whenever suits you.',
      cta: 'See what is waiting',
    },
    urgent: {
      subject: '{{first_name}}, {{benefit_value}} expires on {{deadline}}',
      body: '{{benefit_value}} of {{category}} value on your {{card}} expires on {{deadline}} and cannot be carried forward.\n\n{{points}} bonus points have been credited today. Spend on {{category}} before the date and both are yours.',
      cta: 'Use it before {{deadline}}',
    },
    formal: {
      subject: 'Your {{card}} benefits statement, {{first_name}}',
      body: 'Dear {{first_name}},\n\nOur records indicate that {{benefit_value}} of {{category}} benefit remains unutilised on your {{card}} for the current year. A credit of {{points}} bonus points has been applied to your account.\n\nQualifying {{category}} spend before {{deadline}} will release the balance.',
      cta: 'View benefits statement',
    },
  },

  wa: {
    base:   { body: 'Hi {{first_name}} — {{points}} bonus points are now on your {{card}}, and {{benefit_value}} of {{category}} value is still unused this year. Spend on {{category}} before {{deadline}} and the points post within 48 hours.' },
    short:  { body: 'Hi {{first_name}} — {{points}} bonus points added to your {{card}}. {{benefit_value}} of {{category}} value still unused. Ends {{deadline}}.' },
    warm:   { body: 'Hi {{first_name}} — thank you for {{tenure}} with us. We have added {{points}} bonus points to your {{card}}, and there is {{benefit_value}} of {{category}} value still waiting. No rush, but it does end {{deadline}}.' },
    urgent: { body: '{{first_name}}, {{benefit_value}} of {{category}} value on your {{card}} expires {{deadline}}. {{points}} bonus points are credited and ready to use.' },
    formal: { body: 'Dear {{first_name}}, a credit of {{points}} bonus points has been applied to your {{card}}. {{benefit_value}} of {{category}} benefit remains unutilised and lapses on {{deadline}}.' },
  },

  sms: {
    base:   { body: '{{first_name}}, {{points}} bonus points are on your {{card}}. {{benefit_value}} of {{category}} value unused this year. vsa.in/tr' },
    short:  { body: '{{first_name}}, {{points}} points added. {{benefit_value}} {{category}} value unused. vsa.in/tr' },
    warm:   { body: '{{first_name}}, thank you for {{tenure}}. {{points}} bonus points added to your {{card}}. vsa.in/tr' },
    urgent: { body: '{{first_name}}, {{benefit_value}} of {{category}} value expires {{deadline}}. {{points}} points ready now. vsa.in/tr' },
    formal: { body: 'Dear {{first_name}}, {{points}} points credited to your {{card}}. {{benefit_value}} benefit lapses {{deadline}}. vsa.in/tr' },
  },

  // Owned surfaces. A push has to survive a lock screen and a banner has to
  // survive a glance, so both are written short and lead with the number.
  inapp: {
    base:   { subject: '{{points}} bonus points added', body: '{{benefit_value}} of {{category}} value is still unused on your {{card}}. Tap to see what is waiting.' },
    short:  { subject: '{{points}} points added', body: '{{benefit_value}} {{category}} value unused. Tap to view.' },
    warm:   { subject: 'Thank you for {{tenure}}', body: 'We have added {{points}} bonus points to your {{card}}. {{benefit_value}} of {{category}} value is still there when you want it.' },
    urgent: { subject: '{{benefit_value}} expires {{deadline}}', body: 'Your {{category}} value on the {{card}} lapses on {{deadline}}. {{points}} points are ready now.' },
    formal: { subject: '{{card}} benefits update', body: '{{benefit_value}} of {{category}} benefit remains unutilised. {{points}} points have been credited.' },
  },

  banner: {
    base:   { subject: '{{benefit_value}} of {{category}} value unclaimed', body: 'Plus {{points}} bonus points, added today.', cta: 'See your benefits' },
    short:  { subject: '{{benefit_value}} unclaimed', body: '{{points}} points added.', cta: 'View' },
    warm:   { subject: '{{tenure}} with us — thank you', body: '{{points}} bonus points are on your {{card}}, and {{benefit_value}} of {{category}} value is still waiting.', cta: 'See what is waiting' },
    urgent: { subject: 'Expires {{deadline}}', body: '{{benefit_value}} of {{category}} value lapses on {{deadline}}. {{points}} points ready now.', cta: 'Use it before {{deadline}}' },
    formal: { subject: 'Benefits statement', body: '{{benefit_value}} of {{category}} benefit remains unutilised on your {{card}}.', cta: 'View statement' },
  },
}

export const CHANNEL_LIMIT = { sms: 160, wa: 1024, email: null, inapp: 178, banner: 120 }

const CATEGORY = { TRV: 'travel', DIN: 'dining', TEC: 'electronics', EVD: 'everyday' }

/** Every token a template can carry, resolved for one cardholder. */
export function mergeFields(member, cohort) {
  const [, city = '', card = '', tenure = ''] = member.meta.split(' · ')
  const years = Number(tenure.match(/^(\d+)y/)?.[1] || 0)
  return {
    first_name: member.name.split(' ')[0],
    city,
    card,
    tenure: years ? `${years} year${years === 1 ? '' : 's'}` : tenure,
    category: CATEGORY[cohort.tag] || 'card',
    // Unclaimed benefit scales with what the cardholder is worth to the bank.
    benefit_value: `₹${fmtIN(Math.round((member.profit * 0.14) / 100) * 100)}`,
    points: '5,000',
    deadline: '31 October',
  }
}

export const TOKENS = Object.keys(mergeFields(
  { name: 'A B', meta: '0 · X · Y · 1y 0m', profit: 0 },
  { tag: 'TRV' },
))

/** Replace {{tokens}}; unknown ones are left visible rather than blanked. */
export function render(text, fields) {
  return text.replace(/\{\{(\w+)\}\}/g, (m, k) => (k in fields ? fields[k] : m))
}
