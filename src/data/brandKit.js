/**
 * The brand kit.
 *
 * A design studio that lets every email pick its own blue is a studio that
 * produces a portfolio nobody recognises. The kit is the small set of
 * decisions an issuer has already made — a palette, a type pair, a button
 * shape, a footer — and the artboard reads them as CSS variables, so changing
 * one repaints every block at once instead of asking the operator to restyle
 * fourteen of them.
 */

export const PALETTES = [
  {
    id: 'visa',
    label: 'Visa Nova',
    note: 'The house palette — issuer blue, gold accent',
    brand: '#1434cb',
    brandDark: '#0f2596',
    accent: '#f7b600',
    ink: '#1a1f36',
    body: '#4a5068',
    paper: '#ffffff',
    band: '#f4f6fb',
  },
  {
    id: 'midnight',
    label: 'Midnight',
    note: 'Premium tier — near-black ground, gold action',
    brand: '#111726',
    brandDark: '#05080f',
    accent: '#c9a227',
    ink: '#0b1020',
    body: '#474e61',
    paper: '#ffffff',
    band: '#f2f2f4',
  },
  {
    id: 'signature',
    label: 'Signature',
    note: 'Mid-tier cards — a warmer, quieter blue',
    brand: '#2a5fa8',
    brandDark: '#1d4479',
    accent: '#d98324',
    ink: '#1c2433',
    body: '#4c5568',
    paper: '#ffffff',
    band: '#f2f5fa',
  },
  {
    id: 'evergreen',
    label: 'Evergreen',
    note: 'Everyday and cashback lines',
    brand: '#0f6b52',
    brandDark: '#0a4c3a',
    accent: '#c2762c',
    ink: '#13241e',
    body: '#455349',
    paper: '#ffffff',
    band: '#f0f6f3',
  },
  {
    id: 'plum',
    label: 'Plum',
    note: 'The co-brand skin — used on partner sends only',
    brand: '#6d3f8f',
    brandDark: '#4f2a6a',
    accent: '#e0a3c8',
    ink: '#221a2b',
    body: '#4f4759',
    paper: '#ffffff',
    band: '#f7f2fa',
  },
]

export const TYPE_PAIRS = [
  {
    id: 'nova',
    label: 'Nova Sans',
    note: 'The system face — what every other Visa surface uses',
    heading: '"Visa Dialect", "Nova Sans", system-ui, -apple-system, sans-serif',
    body: '"Visa Dialect", "Nova Sans", system-ui, -apple-system, sans-serif',
    scale: 1,
  },
  {
    id: 'serif',
    label: 'Serif headline',
    note: 'A serif head over the system body — reads as a statement, not a promo',
    heading: 'Georgia, "Times New Roman", serif',
    body: '"Visa Dialect", "Nova Sans", system-ui, -apple-system, sans-serif',
    scale: 1.04,
  },
  {
    id: 'grotesk',
    label: 'Grotesk',
    note: 'Tighter, larger headline. Best on a one-line subject',
    heading: '"Helvetica Neue", Helvetica, Arial, sans-serif',
    body: '"Helvetica Neue", Helvetica, Arial, sans-serif',
    scale: 1.08,
  },
  {
    id: 'humanist',
    label: 'Humanist',
    note: 'Softer, wider — the warm-tone counterpart',
    heading: 'Optima, Candara, "Segoe UI", sans-serif',
    body: '"Segoe UI", Candara, system-ui, sans-serif',
    scale: 1.02,
  },
]

export const BUTTON_SHAPES = [
  { id: 'sharp', label: 'Sharp', radius: 2 },
  { id: 'soft', label: 'Soft', radius: 6 },
  { id: 'round', label: 'Round', radius: 10 },
  { id: 'pill', label: 'Pill', radius: 999 },
]

export const DENSITIES = [
  { id: 'tight', label: 'Tight', note: 'More above the fold', gap: 0.82 },
  { id: 'normal', label: 'Normal', note: 'The house rhythm', gap: 1 },
  { id: 'airy', label: 'Airy', note: 'Premium tiers read better with room', gap: 1.24 },
]

export const WIDTHS = [
  { id: 'narrow', label: '480', px: 480, note: 'One column, reads fast' },
  { id: 'standard', label: '560', px: 560, note: 'The email standard' },
  { id: 'wide', label: '640', px: 640, note: 'Room for a two-up' },
]

export const DEFAULT_BRAND = {
  palette: 'visa',
  type: 'nova',
  button: 'soft',
  density: 'normal',
  width: 'standard',
  sender: 'Visa Cards',
  senderAddress: 'cards@visa.example.co.in',
  footer: 'Sent to the address on file · Manage preferences · Unsubscribe',
  logo: 'VISA',
}

export const findPalette = (id) => PALETTES.find((p) => p.id === id) || PALETTES[0]
export const findType = (id) => TYPE_PAIRS.find((t) => t.id === id) || TYPE_PAIRS[0]
export const findShape = (id) => BUTTON_SHAPES.find((s) => s.id === id) || BUTTON_SHAPES[1]
export const findDensity = (id) => DENSITIES.find((d) => d.id === id) || DENSITIES[1]
export const findWidth = (id) => WIDTHS.find((w) => w.id === id) || WIDTHS[1]

/** The kit, resolved into the variables the artboard actually reads. */
export function brandVars(brand = DEFAULT_BRAND) {
  const p = findPalette(brand.palette)
  const t = findType(brand.type)
  const s = findShape(brand.button)
  const d = findDensity(brand.density)
  return {
    '--bk-brand': p.brand,
    '--bk-brand-dark': p.brandDark,
    '--bk-accent': p.accent,
    '--bk-ink': p.ink,
    '--bk-body': p.body,
    '--bk-paper': p.paper,
    '--bk-band': p.band,
    '--bk-head-font': t.heading,
    '--bk-body-font': t.body,
    '--bk-scale': t.scale,
    '--bk-radius': `${s.radius}px`,
    '--bk-gap': d.gap,
  }
}
