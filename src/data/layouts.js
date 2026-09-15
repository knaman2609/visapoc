import { TEMPLATES } from './templates.js'

/**
 * The starter layouts.
 *
 * A blank artboard is the wrong place to start a retention send: the shape of
 * these messages is already known, and what changes between them is the
 * argument, not the furniture. Each layout is one argument, fully drafted
 * across all three channels — because a campaign that says one thing in email
 * and another in WhatsApp is the failure this studio exists to prevent.
 *
 * `use` is what the layout is for, in the operator's language. `lift` is what
 * the shape has done before, so picking one is a decision with evidence
 * behind it rather than a taste.
 */

const uid = () => `b${Math.random().toString(36).slice(2, 8)}`
const B = (type, props = {}) => ({ id: uid(), type, ...props })

const LEGAL = 'Points post within 48 hours of a qualifying transaction. Terms apply.'

export const LAYOUTS = [
  {
    id: 'benefit-reminder',
    name: 'Benefit reminder',
    kicker: 'Awareness',
    use: 'They already hold the value and have not used it',
    lift: { sends: 41, openPct: 0.34, clickPct: 0.061 },
    accent: 'brand',
    doc: () => ({
      email: {
        subject: TEMPLATES.email.base.subject,
        preheader: '{{benefit_value}} of {{category}} value is still unclaimed this year.',
        blocks: [
          B('logo', { text: 'Visa Cards', sub: 'Benefits update', align: 'left' }),
          B('image', { preset: 'card', alt: 'Your card benefits', height: 'md' }),
          B('heading', { text: TEMPLATES.email.base.subject, align: 'left', size: 'lg' }),
          B('text', { text: TEMPLATES.email.base.body, align: 'left' }),
          B('button', { text: TEMPLATES.email.base.cta, align: 'left', style: 'solid' }),
          B('legal', { text: LEGAL }),
        ],
      },
      wa: {
        header: 'Your {{card}} benefits',
        body: TEMPLATES.wa.base.body,
        footer: 'Reply STOP to opt out',
        buttons: [{ kind: 'url', label: 'See benefits' }],
      },
      sms: { body: TEMPLATES.sms.base.body },
    }),
  },
  {
    id: 'value-forward',
    name: 'Value forward',
    kicker: 'Awareness',
    use: 'The number is the argument — lead with it, explain after',
    lift: { sends: 28, openPct: 0.31, clickPct: 0.079 },
    accent: 'brand',
    doc: () => ({
      email: {
        subject: '{{first_name}}, {{benefit_value}} is sitting unused',
        preheader: 'Plus {{points}} bonus points, credited to your {{card}} today.',
        blocks: [
          B('logo', { text: 'Visa Cards', sub: 'Benefits update', align: 'left' }),
          B('stat', { text: '{{benefit_value}}', sub: 'unclaimed {{category}} value', align: 'center' }),
          B('heading', { text: 'It is already yours, {{first_name}}', align: 'center', size: 'lg' }),
          B('text', {
            text: 'That is what is left on your {{card}} this year. We have added {{points}} bonus points on top of it today.',
            align: 'center',
          }),
          B('button', { text: 'See what is waiting', align: 'center', style: 'solid' }),
          B('divider'),
          B('legal', { text: LEGAL }),
        ],
      },
      wa: {
        header: '{{benefit_value}} unclaimed',
        body: 'Hi {{first_name}} — {{benefit_value}} of {{category}} value is still unused on your {{card}} this year, and {{points}} bonus points were credited today.',
        footer: 'Reply STOP to opt out',
        buttons: [{ kind: 'url', label: 'See what is left' }],
      },
      sms: { body: '{{first_name}}, {{benefit_value}} of {{category}} value unused on your {{card}}. {{points}} points added. vsa.in/tr' },
    }),
  },
  {
    id: 'expiry',
    name: 'Expiry notice',
    kicker: 'Urgency',
    use: 'There is a date, and the date is what converts',
    lift: { sends: 33, openPct: 0.38, clickPct: 0.094 },
    accent: 'accent',
    doc: () => ({
      email: {
        subject: TEMPLATES.email.urgent.subject,
        preheader: 'It cannot be carried into next year.',
        blocks: [
          B('logo', { text: 'Visa Cards', sub: 'Ending soon', align: 'left' }),
          B('countdown', { text: 'Your {{category}} value closes {{deadline}}', days: 14 }),
          B('heading', { text: TEMPLATES.email.urgent.subject, align: 'left', size: 'lg' }),
          B('text', { text: TEMPLATES.email.urgent.body, align: 'left' }),
          B('button', { text: TEMPLATES.email.urgent.cta, align: 'left', style: 'solid' }),
          B('link', { text: 'What counts as {{category}} spend?', align: 'left' }),
          B('legal', { text: LEGAL }),
        ],
      },
      wa: {
        header: 'Closes {{deadline}}',
        body: TEMPLATES.wa.urgent.body,
        footer: 'Reply STOP to opt out',
        buttons: [{ kind: 'url', label: 'Use it now' }, { kind: 'call', label: 'Call us' }],
      },
      sms: { body: TEMPLATES.sms.urgent.body },
    }),
  },
  {
    id: 'thank-you',
    name: 'Tenure thank-you',
    kicker: 'Relationship',
    use: 'A loyal cohort, where a hard sell costs more than it makes',
    lift: { sends: 19, openPct: 0.44, clickPct: 0.052 },
    accent: 'brand',
    doc: () => ({
      email: {
        subject: TEMPLATES.email.warm.subject,
        preheader: '{{points}} bonus points, and no deadline pressure.',
        blocks: [
          B('logo', { text: 'Visa Cards', sub: 'A note for you', align: 'center' }),
          B('image', { preset: 'photo', alt: 'A quiet horizon', height: 'lg' }),
          B('heading', { text: TEMPLATES.email.warm.subject, align: 'center', size: 'lg' }),
          B('text', { text: TEMPLATES.email.warm.body, align: 'center' }),
          B('button', { text: TEMPLATES.email.warm.cta, align: 'center', style: 'outline' }),
          B('spacer', { size: 'md' }),
          B('legal', { text: LEGAL }),
        ],
      },
      wa: {
        header: 'Thank you for {{tenure}}',
        body: TEMPLATES.wa.warm.body,
        footer: 'Reply STOP to opt out',
        buttons: [{ kind: 'url', label: 'See what is waiting' }],
      },
      sms: { body: TEMPLATES.sms.warm.body },
    }),
  },
  {
    id: 'three-reasons',
    name: 'Three reasons',
    kicker: 'Education',
    use: 'The benefit is not one thing and the cardholder does not know any of it',
    lift: { sends: 22, openPct: 0.29, clickPct: 0.067 },
    accent: 'brand',
    doc: () => ({
      email: {
        subject: 'Three things your {{card}} does that you have not used',
        preheader: 'Lounge access, travel cover and {{benefit_value}} of {{category}} value.',
        blocks: [
          B('logo', { text: 'Visa Cards', sub: 'Your card, explained', align: 'left' }),
          B('heading', { text: 'Three things your {{card}} already does', align: 'left', size: 'md' }),
          B('text', {
            text: 'You have held it for {{tenure}}. Most of what it carries never gets used, so here is the short version.',
            align: 'left',
          }),
          B('bullets', {
            items: [
              'Lounge access — two visits a quarter, at every major Indian airport',
              'Travel cover — up to ₹50 lakh, applied automatically when you book with the card',
              '{{benefit_value}} of {{category}} value, unclaimed and open until {{deadline}}',
            ],
          }),
          B('columns', {
            left: 'Lounge access\nTwo visits a quarter, on {{card}}.',
            right: 'Travel cover\nUp to ₹50 lakh, automatically.',
          }),
          B('button', { text: 'See the full list', align: 'left', style: 'solid' }),
          B('legal', { text: LEGAL }),
        ],
      },
      wa: {
        header: 'Your {{card}}, explained',
        body: 'Hi {{first_name}} — three things your {{card}} already does: lounge access twice a quarter, travel cover up to ₹50 lakh, and {{benefit_value}} of {{category}} value that is still unclaimed until {{deadline}}.',
        footer: 'Reply STOP to opt out',
        buttons: [{ kind: 'url', label: 'See the full list' }],
      },
      sms: { body: '{{first_name}}: lounge access, travel cover and {{benefit_value}} {{category}} value on your {{card}}. vsa.in/tr' },
    }),
  },
  {
    id: 'offer-card',
    name: 'Offer panel',
    kicker: 'Offer',
    use: 'A funded offer with terms — the panel keeps the terms attached to it',
    lift: { sends: 26, openPct: 0.32, clickPct: 0.088 },
    accent: 'accent',
    doc: () => ({
      email: {
        subject: '{{points}} bonus points on your {{card}}, {{first_name}}',
        preheader: 'Credited today. Spend on {{category}} before {{deadline}}.',
        blocks: [
          B('logo', { text: 'Visa Cards', sub: 'Offer', align: 'left' }),
          B('heading', { text: '{{points}} bonus points, credited today', align: 'left', size: 'md' }),
          B('offer', {
            text: '{{points}} bonus points',
            sub: 'Credited to your {{card}} today',
            meta: 'Use by {{deadline}}',
          }),
          B('text', {
            text: 'Spend on {{category}} before {{deadline}} and the points post within 48 hours. There is also {{benefit_value}} of {{category}} value still unclaimed this year.',
            align: 'left',
          }),
          B('button', { text: 'Activate the offer', align: 'left', style: 'solid' }),
          B('divider'),
          B('legal', { text: LEGAL }),
        ],
      },
      wa: {
        header: '{{points}} bonus points',
        body: 'Hi {{first_name}} — {{points}} bonus points have been credited to your {{card}}. Spend on {{category}} before {{deadline}} and they post within 48 hours.',
        footer: 'Reply STOP to opt out',
        buttons: [{ kind: 'quick', label: 'Activate' }, { kind: 'quick', label: 'Not now' }],
      },
      sms: { body: '{{first_name}}, {{points}} bonus points on your {{card}}. Spend on {{category}} by {{deadline}}. vsa.in/tr' },
    }),
  },
  {
    id: 'statement',
    name: 'Statement style',
    kicker: 'Formal',
    use: 'A cohort that reads a promotion as noise and a statement as information',
    lift: { sends: 11, openPct: 0.47, clickPct: 0.038 },
    accent: 'ink',
    doc: () => ({
      email: {
        subject: TEMPLATES.email.formal.subject,
        preheader: 'A summary of unutilised benefit on your account.',
        blocks: [
          B('logo', { text: 'Visa Cards', sub: 'Benefits statement', align: 'left' }),
          B('heading', { text: TEMPLATES.email.formal.subject, align: 'left', size: 'sm' }),
          B('divider'),
          B('text', { text: TEMPLATES.email.formal.body, align: 'left' }),
          B('bullets', {
            items: [
              'Unutilised {{category}} benefit: {{benefit_value}}',
              'Bonus points credited: {{points}}',
              'Balance lapses: {{deadline}}',
            ],
          }),
          B('link', { text: TEMPLATES.email.formal.cta, align: 'left' }),
          B('legal', { text: LEGAL }),
        ],
      },
      wa: {
        header: 'Benefits statement',
        body: TEMPLATES.wa.formal.body,
        footer: 'Reply STOP to opt out',
        buttons: [{ kind: 'url', label: 'View statement' }],
      },
      sms: { body: TEMPLATES.sms.formal.body },
    }),
  },
  {
    id: 'one-line',
    name: 'One line',
    kicker: 'Minimal',
    use: 'When the whole message is the number and the date',
    lift: { sends: 37, openPct: 0.27, clickPct: 0.072 },
    accent: 'ink',
    doc: () => ({
      email: {
        subject: TEMPLATES.email.short.subject,
        preheader: '{{benefit_value}} unclaimed. Ends {{deadline}}.',
        blocks: [
          B('heading', { text: TEMPLATES.email.short.subject, align: 'left', size: 'md' }),
          B('text', { text: TEMPLATES.email.short.body, align: 'left' }),
          B('button', { text: TEMPLATES.email.short.cta, align: 'left', style: 'solid' }),
        ],
      },
      wa: {
        header: '',
        body: TEMPLATES.wa.short.body,
        footer: '',
        buttons: [{ kind: 'url', label: 'Claim' }],
      },
      sms: { body: TEMPLATES.sms.short.body },
    }),
  },
  {
    id: 'win-back',
    name: 'Win-back',
    kicker: 'Reactivation',
    use: 'Spend has stopped and the card is still open',
    lift: { sends: 16, openPct: 0.21, clickPct: 0.043 },
    accent: 'accent',
    doc: () => ({
      email: {
        subject: '{{first_name}}, your {{card}} has been quiet',
        preheader: 'And {{benefit_value}} of {{category}} value is going unused.',
        blocks: [
          B('logo', { text: 'Visa Cards', sub: 'We noticed', align: 'left' }),
          B('image', { preset: 'city', alt: '{{city}} at dusk', height: 'md' }),
          B('heading', { text: 'Still here when you need it, {{first_name}}', align: 'left', size: 'lg' }),
          B('text', {
            text: 'Your {{card}} has not been used much lately. That is fine — but {{benefit_value}} of {{category}} value is attached to it this year, and it does not carry forward.',
            align: 'left',
          }),
          B('offer', {
            text: '{{points}} bonus points',
            sub: 'On your next {{category}} spend',
            meta: 'Before {{deadline}}',
          }),
          B('button', { text: 'See what is on the card', align: 'left', style: 'solid' }),
          B('legal', { text: LEGAL }),
        ],
      },
      wa: {
        header: 'Your {{card}}',
        body: 'Hi {{first_name}} — {{benefit_value}} of {{category}} value is attached to your {{card}} this year and does not carry forward. {{points}} bonus points are ready on your next {{category}} spend.',
        footer: 'Reply STOP to opt out',
        buttons: [{ kind: 'url', label: 'See the card' }],
      },
      sms: { body: '{{first_name}}, {{benefit_value}} of {{category}} value on your {{card}} ends {{deadline}}. {{points}} points ready. vsa.in/tr' },
    }),
  },
]

export const findLayout = (id) => LAYOUTS.find((l) => l.id === id)

/** A blank document, for when none of the shapes above is the argument. */
export const blankDoc = () => ({
  email: { subject: '', preheader: '', blocks: [] },
  wa: { header: '', body: '', footer: '', buttons: [] },
  sms: { body: '' },
})
