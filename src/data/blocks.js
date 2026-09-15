import { TEMPLATES } from './templates.js'

/**
 * An email is a stack of blocks, not one body field.
 *
 * A marketing email is assembled — a lock-up, a banner, a headline, a proof
 * point, a button — and the order and presence of those pieces is most of the
 * design decision. Modelling it as a list makes that decision editable
 * instead of implied.
 *
 * Every kind below is something a retention email actually contains. There is
 * no generic "container" or "html" block: a block the operator cannot reason
 * about is a block that ships wrong.
 */
export const BLOCK_KINDS = [
  { type: 'logo', label: 'Logo lock-up', group: 'Structure', icon: 'logo',
    hint: 'Issuer mark and the card programme' },
  { type: 'image', label: 'Banner', group: 'Media', icon: 'image',
    hint: 'Artwork across the top' },
  { type: 'heading', label: 'Heading', group: 'Text', icon: 'heading',
    hint: 'The one line that has to land' },
  { type: 'text', label: 'Paragraph', group: 'Text', icon: 'text',
    hint: 'The body copy' },
  { type: 'bullets', label: 'Bullets', group: 'Text', icon: 'bullets',
    hint: 'Three things, scannable' },
  { type: 'stat', label: 'Stat band', group: 'Data', icon: 'stat',
    hint: 'One number, said loudly' },
  { type: 'offer', label: 'Offer card', group: 'Data', icon: 'offer',
    hint: 'Benefit, value and expiry in one panel' },
  { type: 'countdown', label: 'Countdown', group: 'Data', icon: 'countdown',
    hint: 'Days left, as tiles' },
  { type: 'columns', label: 'Two columns', group: 'Structure', icon: 'columns',
    hint: 'A pair of benefits side by side' },
  { type: 'button', label: 'Button', group: 'Action', icon: 'button',
    hint: 'The action' },
  { type: 'link', label: 'Text link', group: 'Action', icon: 'link',
    hint: 'A secondary way through' },
  { type: 'divider', label: 'Divider', group: 'Structure', icon: 'divider',
    hint: 'A rule between sections' },
  { type: 'spacer', label: 'Space', group: 'Structure', icon: 'spacer',
    hint: 'Breathing room' },
  { type: 'legal', label: 'Legal line', group: 'Structure', icon: 'legal',
    hint: 'The small print that has to ship' },
]

export const BLOCK_GROUPS = ['Text', 'Media', 'Data', 'Action', 'Structure']

export const kindOf = (type) => BLOCK_KINDS.find((k) => k.type === type)

/* Banner art drawn rather than uploaded — no asset pipeline, and each one is
   tied to something the campaign already knows about itself. */
export const IMAGE_PRESETS = [
  { id: 'card', label: 'Card art', note: 'The product, on its own ground' },
  { id: 'benefit', label: 'Benefit figure', note: 'The unclaimed value, set large' },
  { id: 'brand', label: 'Brand band', note: 'Issuer blue, wordmark only' },
  { id: 'photo', label: 'Lifestyle', note: 'A horizon — category, not product' },
  { id: 'points', label: 'Points burst', note: 'The bonus, as a coin stack' },
  { id: 'city', label: 'Skyline', note: 'The cardholder’s city at dusk' },
]

/* Sizes a spacer can take, so the stack has a rhythm rather than arbitrary
   pixel values typed into a box. */
export const SPACE_SIZES = [
  { id: 'sm', label: 'S', px: 12 },
  { id: 'md', label: 'M', px: 24 },
  { id: 'lg', label: 'L', px: 40 },
]

export const ALIGNMENTS = [
  { id: 'left', label: 'Left' },
  { id: 'center', label: 'Centre' },
]

const uid = () => `b${Math.random().toString(36).slice(2, 8)}`

/** A fresh id for a block being pasted or duplicated. */
export const reid = (b) => ({ ...b, id: uid() })

export function newBlock(type) {
  const base = { id: uid(), type }
  switch (type) {
    case 'logo':
      return { ...base, text: 'Visa Cards', sub: 'Benefits update', align: 'left' }
    case 'image':
      return { ...base, preset: 'card', alt: 'Your card benefits', height: 'md' }
    case 'heading':
      return { ...base, text: 'A short, specific headline', align: 'left', size: 'lg' }
    case 'text':
      return { ...base, text: 'Say the one thing that matters, then stop.', align: 'left' }
    case 'bullets':
      return {
        ...base,
        items: [
          '{{points}} bonus points, credited today',
          '{{benefit_value}} of {{category}} value still unused',
          'Both available until {{deadline}}',
        ],
      }
    case 'stat':
      return { ...base, text: '{{benefit_value}}', sub: 'unclaimed {{category}} value', align: 'center' }
    case 'offer':
      return {
        ...base,
        text: '{{points}} bonus points',
        sub: 'Credited to your {{card}} today',
        meta: 'Use by {{deadline}}',
      }
    case 'countdown':
      return { ...base, text: 'Offer closes {{deadline}}', days: 14 }
    case 'columns':
      return {
        ...base,
        left: 'Lounge access\nTwo visits a quarter, on {{card}}.',
        right: 'Travel cover\nUp to ₹50 lakh, automatically.',
      }
    case 'button':
      return { ...base, text: 'See your benefits', align: 'left', style: 'solid' }
    case 'link':
      return { ...base, text: 'Read the full terms', align: 'left' }
    case 'spacer':
      return { ...base, size: 'md' }
    case 'legal':
      return {
        ...base,
        text: 'Points post within 48 hours of a qualifying transaction. Terms apply.',
      }
    default:
      return base
  }
}

/** The shipped template, expressed as blocks. */
export const defaultBlocks = () => [
  { id: uid(), type: 'logo', text: 'Visa Cards', sub: 'Benefits update', align: 'left' },
  { id: uid(), type: 'image', preset: 'card', alt: 'Your card benefits', height: 'md' },
  { id: uid(), type: 'heading', text: TEMPLATES.email.base.subject, align: 'left', size: 'lg' },
  { id: uid(), type: 'text', text: TEMPLATES.email.base.body, align: 'left' },
  { id: uid(), type: 'button', text: TEMPLATES.email.base.cta, align: 'left', style: 'solid' },
  { id: uid(), type: 'legal',
    text: 'Points post within 48 hours of a qualifying transaction. Terms apply.' },
]

/** Every string a block carries, so a lint pass sees the whole message. */
export function blockText(b) {
  const parts = [b.text, b.sub, b.meta, b.left, b.right, ...(b.items || [])]
  return parts.filter(Boolean).join('\n')
}

/** Everything a block stack says, for the character and compliance checks. */
export const blocksText = (blocks) => blocks
  .map(blockText)
  .filter(Boolean)
  .join('\n\n')

/* Stand-in values so the merged preview has something to show. The builder
   knows nothing about a cohort — these are just what a token looks like once
   it resolves. */
export const SAMPLE = {
  first_name: 'Rohit',
  card: 'Visa Infinite',
  city: 'Mumbai',
  tenure: '4 years',
  category: 'travel',
  benefit_value: '₹12,900',
  points: '5,000',
  deadline: '31 October',
}

/* A second cardholder, kept deliberately awkward: a long name, a long city,
   a bigger number. Previewing one person hides the one whose merge pushes the
   subject past the truncation point. */
export const SAMPLE_LONG = {
  first_name: 'Priyadarshini',
  card: 'Visa Infinite Metal',
  city: 'Thiruvananthapuram',
  tenure: '11 years',
  category: 'international dining',
  benefit_value: '₹1,48,250',
  points: '42,500',
  deadline: '31 October',
}

export const SAMPLE_SETS = [
  { id: 'typical', label: 'Typical', note: 'Median name and benefit', fields: SAMPLE },
  { id: 'longest', label: 'Longest', note: 'The merge that truncates first', fields: SAMPLE_LONG },
]
