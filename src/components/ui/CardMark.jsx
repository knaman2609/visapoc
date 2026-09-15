import styles from './CardMark.module.css'

/**
 * A card product as a miniature of the plastic, rather than as a glyph.
 *
 * The other cuts of the book take lucide marks, but a card product has a face,
 * and the face is how a portfolio manager already recognises it. Tier drives
 * the palette the way it does on the real product: Infinite sits at the dark,
 * metal end; Signature in the middle; Platinum is the silver tier it is named
 * after; a co-brand carries its partner's livery rather than the issuer's.
 *
 * These are filled where the rest of the icon set is stroked — deliberately.
 * It reads as a swatch of the product, not as another control glyph.
 */
const TIERS = {
  // Magnus Reserve · super-premium · Visa Infinite — the metal flagship
  k1: { body: '#14161a', sheen: '#ffffff', chip: '#c9a227', label: 'Visa Infinite, super-premium' },
  // Magnus · premium · Visa Infinite — dark, a step below the flagship
  k2: { body: '#17255c', sheen: '#ffffff', chip: '#c8ccd6', label: 'Visa Infinite, premium' },
  // Horizon Travel · airline co-brand · Visa Signature — partner livery
  k3: { body: '#0e7490', sheen: '#ffffff', chip: '#e8eef2', label: 'Visa Signature, airline co-brand' },
  // Select · mass affluent · Visa Signature
  k4: { body: '#4a6fa5', sheen: '#ffffff', chip: '#d6dde8', label: 'Visa Signature, mass affluent' },
  // Everyday · mass · Visa Platinum — the tier is the finish
  k5: { body: '#b6bcc4', sheen: '#ffffff', chip: '#7e858e', label: 'Visa Platinum, mass' },
  // Business One · SME · Visa Signature Business
  k6: { body: '#4b5563', sheen: '#ffffff', chip: '#cbd2da', label: 'Visa Signature Business, SME' },
}

export const isCardProduct = (id) => id in TIERS

export default function CardMark({ id, w = 18 }) {
  const t = TIERS[id]
  if (!t) return null
  const h = Math.round(w * 0.66)

  return (
    <svg
      className={styles.card}
      width={w}
      height={h}
      viewBox="0 0 24 16"
      role="img"
      aria-label={t.label}
    >
      <rect x="0.5" y="0.5" width="23" height="15" rx="2.6" fill={t.body} />
      {/* A diagonal band standing in for the sheen on a real face. Two flat
          shapes rather than a gradient, so no <defs> id to collide across
          the six instances a list renders. */}
      <path d="M0.5 0.5 H23.5 V4.5 L0.5 10.5 Z" fill={t.sheen} opacity="0.13" />
      <rect x="3.2" y="6" width="4.6" height="3.4" rx="0.8" fill={t.chip} />
      {/* Keeps the light tiers off a white background. */}
      <rect
        x="0.5" y="0.5" width="23" height="15" rx="2.6"
        fill="none" stroke="rgba(0,0,0,.22)" strokeWidth="1"
      />
    </svg>
  )
}
