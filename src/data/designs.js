import { LAYOUTS, blankDoc, findLayout } from './layouts.js'
import { DEFAULT_BRAND } from './brandKit.js'

/**
 * The saved-design library.
 *
 * A studio you cannot come back to is a scratchpad. Everything an operator
 * makes here is a document with a name, an owner, a state and — once it has
 * shipped — a number attached to it, because the useful question in a design
 * library is never "what did we make" but "what worked".
 *
 * The seed is what a team six months into using this would have: a few live
 * designs carrying real numbers, a couple in review, one archived because it
 * lost, and someone's untitled experiment from this morning.
 */

export const STATES = [
  { id: 'draft', label: 'Draft', tone: 'idle' },
  { id: 'review', label: 'In review', tone: 'warn' },
  { id: 'approved', label: 'Approved', tone: 'ok' },
  { id: 'live', label: 'Live', tone: 'brand' },
  { id: 'archived', label: 'Archived', tone: 'idle' },
]

export const findState = (id) => STATES.find((s) => s.id === id) || STATES[0]

const HOUR = 3600e3
const DAY = 24 * HOUR

/* Seeded relative to whenever the console is opened, so the library never
   reads as a fixture with a stale date on it. */
const SEED = [
  {
    id: 'd-oct-benefit', name: 'October benefit sweep', layout: 'benefit-reminder',
    channel: 'email', state: 'live', ago: 2 * HOUR, owner: 'Ananya Rao',
    campaign: 'Travel benefit reactivation — Oct',
    stats: { sends: 128_400, openPct: 0.361, clickPct: 0.068 },
    starred: true, tags: ['travel', 'infinite'],
    brand: { palette: 'visa', type: 'nova', button: 'soft' },
  },
  {
    id: 'd-expiry-push', name: 'Expiry — 14 day push', layout: 'expiry',
    channel: 'wa', state: 'live', ago: 6 * HOUR, owner: 'Ananya Rao',
    campaign: 'Travel benefit reactivation — Oct',
    stats: { sends: 61_200, openPct: 0.742, clickPct: 0.113 },
    starred: true, tags: ['urgency', 'whatsapp'],
    brand: { palette: 'visa', type: 'nova', button: 'pill' },
  },
  {
    id: 'd-tenure-hni', name: 'Tenure thank-you — HNI', layout: 'thank-you',
    channel: 'email', state: 'approved', ago: 1 * DAY, owner: 'Vikram Shetty',
    campaign: 'Signature loyalty — Q3',
    stats: { sends: 8_940, openPct: 0.512, clickPct: 0.047 },
    starred: false, tags: ['loyalty', 'signature'],
    brand: { palette: 'midnight', type: 'serif', button: 'sharp' },
  },
  {
    id: 'd-three-reasons', name: 'Card education — three reasons', layout: 'three-reasons',
    channel: 'email', state: 'review', ago: 1 * DAY + 4 * HOUR, owner: 'Meera Iyer',
    campaign: null,
    stats: null,
    starred: false, tags: ['education'],
    brand: { palette: 'signature', type: 'nova', button: 'soft' },
  },
  {
    id: 'd-points-offer', name: '5,000 point offer panel', layout: 'offer-card',
    channel: 'email', state: 'approved', ago: 2 * DAY, owner: 'Ananya Rao',
    campaign: 'Dining spend lift — Sep',
    stats: { sends: 44_700, openPct: 0.298, clickPct: 0.091 },
    starred: false, tags: ['offer', 'dining'],
    brand: { palette: 'visa', type: 'nova', button: 'soft' },
  },
  {
    id: 'd-sms-short', name: 'SMS — one segment', layout: 'one-line',
    channel: 'sms', state: 'live', ago: 3 * DAY, owner: 'Rahul Nanda',
    campaign: 'Travel benefit reactivation — Oct',
    stats: { sends: 214_800, openPct: null, clickPct: 0.021 },
    starred: false, tags: ['sms', 'cost'],
    brand: { palette: 'visa', type: 'nova', button: 'soft' },
  },
  {
    id: 'd-statement', name: 'Benefits statement', layout: 'statement',
    channel: 'email', state: 'approved', ago: 5 * DAY, owner: 'Vikram Shetty',
    campaign: null,
    stats: { sends: 12_100, openPct: 0.468, clickPct: 0.036 },
    starred: false, tags: ['formal'],
    brand: { palette: 'midnight', type: 'serif', button: 'sharp' },
  },
  {
    id: 'd-winback', name: 'Dormant win-back', layout: 'win-back',
    channel: 'email', state: 'draft', ago: 8 * DAY, owner: 'Meera Iyer',
    campaign: null,
    stats: null,
    starred: false, tags: ['reactivation'],
    brand: { palette: 'plum', type: 'humanist', button: 'round' },
  },
  {
    id: 'd-value-fwd', name: 'Value forward — A/B arm B', layout: 'value-forward',
    channel: 'email', state: 'archived', ago: 21 * DAY, owner: 'Rahul Nanda',
    campaign: 'Everyday spend — Aug',
    stats: { sends: 31_600, openPct: 0.244, clickPct: 0.039 },
    starred: false, tags: ['test', 'lost'],
    brand: { palette: 'evergreen', type: 'grotesk', button: 'pill' },
  },
]

/** A design record, built from its layout so the thumbnail is the real thing. */
function hydrate(seed, now) {
  const layout = findLayout(seed.layout) || LAYOUTS[0]
  return {
    id: seed.id,
    name: seed.name,
    layout: seed.layout,
    channel: seed.channel,
    state: seed.state,
    owner: seed.owner,
    campaign: seed.campaign,
    stats: seed.stats,
    starred: seed.starred,
    tags: seed.tags,
    brand: { ...DEFAULT_BRAND, ...seed.brand },
    doc: layout.doc(),
    updated: now - seed.ago,
    created: now - seed.ago - 3 * DAY,
  }
}

export const seedLibrary = () => {
  const now = Date.now()
  return SEED.map((s) => hydrate(s, now))
}

/* ── Persistence ─────────────────────────────────────────────────────
   The library is the operator's work. Losing it to a refresh would be the
   single most annoying thing this screen could do, so it is written back on
   every change and read on mount, with a version key so a shape change
   discards cleanly rather than crashing on old data. */

export const LIB_KEY = 'visa.studio.library.v3'

export function loadLibrary() {
  try {
    const raw = localStorage.getItem(LIB_KEY)
    if (!raw) return seedLibrary()
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed) || !parsed.length) return seedLibrary()
    // A record without a document is a record that cannot be opened.
    if (!parsed.every((d) => d && d.id && d.doc)) return seedLibrary()
    // Normalise the kit on the way in. Every record then holds a complete
    // brand, which is what lets the studio compare by reference rather than
    // rebuilding one on open and saving a no-op change straight back.
    return parsed.map((d) => ({ ...d, brand: { ...DEFAULT_BRAND, ...d.brand } }))
  } catch {
    return seedLibrary()
  }
}

export function saveLibrary(list) {
  try { localStorage.setItem(LIB_KEY, JSON.stringify(list)) } catch { /* private mode */ }
}

export const newId = () => `d${Date.now().toString(36)}${Math.random().toString(36).slice(2, 5)}`

/**
 * A fresh record. Both the studio and the "New design" screen make these, and
 * a record that is missing a field one of them expects is a document that
 * cannot be opened — so there is one way to build one.
 */
export function newDesignRecord({ layout = null, channel = 'email', doc, brand } = {}) {
  const now = Date.now()
  return {
    id: newId(),
    name: layout ? layout.name : 'Untitled design',
    layout: layout?.id || null,
    channel,
    state: 'draft',
    owner: 'You',
    campaign: null,
    stats: null,
    starred: false,
    tags: [],
    brand: { ...DEFAULT_BRAND, ...brand },
    doc: doc || (layout ? layout.doc() : blankDoc()),
    updated: now,
    created: now,
  }
}

/** How long ago, said the way a person would say it. */
export function ago(ts) {
  const s = Math.max(0, Date.now() - ts) / 1000
  if (s < 90) return 'just now'
  if (s < 3600) return `${Math.round(s / 60)}m ago`
  if (s < 86400) return `${Math.round(s / 3600)}h ago`
  const d = Math.round(s / 86400)
  if (d < 7) return `${d}d ago`
  if (d < 60) return `${Math.round(d / 7)}w ago`
  return `${Math.round(d / 30)}mo ago`
}

export const SORTS = [
  { id: 'recent', label: 'Last edited' },
  { id: 'name', label: 'Name' },
  { id: 'reach', label: 'Reach' },
  { id: 'click', label: 'Click rate' },
]

export function sortDesigns(list, sort) {
  const l = [...list]
  if (sort === 'name') return l.sort((a, b) => a.name.localeCompare(b.name))
  if (sort === 'reach') return l.sort((a, b) => (b.stats?.sends || 0) - (a.stats?.sends || 0))
  if (sort === 'click') return l.sort((a, b) => (b.stats?.clickPct || 0) - (a.stats?.clickPct || 0))
  return l.sort((a, b) => b.updated - a.updated)
}
