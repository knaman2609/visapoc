import { useState } from 'react'
import { INDIA } from '../../data/geo/india.js'
import { WORLD } from '../../data/geo/world.js'
import styles from './GeoMap.module.css'

/**
 * The book on the map it is actually spent on.
 *
 * A real choropleth rather than a grid of tiles: India dissolved into its six
 * zones from district boundaries, and the world cut into the corridors the
 * international book travels. Fill is a single hue, light to dark, which is the
 * only correct encoding for magnitude — and it is stepped across the range the
 * members actually occupy, not from zero, so a rate that runs 8.5 to 10.3 does
 * not land every one of them in the same step.
 *
 * Area lies about importance on any map — Rajasthan is large and quiet, Delhi
 * is small and enormous — so the ranked list beside it carries the order, and
 * the map carries the geography.
 */

const STEPS = 5

const SHAPES = {
  india: { geo: INDIA, paths: INDIA.zones },
  world: { geo: WORLD, paths: WORLD.corridors },
}

export default function GeoMap({ shape = 'india', rows, metric, selectedId, onSelect }) {
  const [over, setOver] = useState(null)
  const { geo, paths } = SHAPES[shape] || SHAPES.india

  const vals = rows.map((r) => r.value)
  const top = Math.max(...vals)
  const bottom = Math.min(...vals)
  const tone = metric.tone === 'risk' ? 'risk' : 'value'

  const span = top - bottom
  const stepOf = (v) => (span
    ? Math.max(1, Math.min(STEPS, Math.floor(((v - bottom) / span) * STEPS) + 1))
    : STEPS)

  // Only members the map actually has a shape for can be drawn on it.
  const drawn = rows.filter((r) => paths[r.id])
  const shown = over || selectedId
  const hot = rows.find((r) => r.id === shown) || null

  return (
    <div className={styles.wrap}>
      {/* India is portrait and the world is a wide band, so the frame each one
          gets is different; the map is fitted inside it rather than driving the
          height of the page. */}
      <div className={`${styles.stage} ${shape === 'india' ? styles.tall : styles.wide}`}>
        <svg
          className={`${styles.map} ${styles[`t_${tone}`]}`}
          viewBox={geo.viewBox}
          role="img"
          aria-label={`${metric.label} by ${shape === 'world' ? 'corridor' : 'zone'}`}
        >
          {/* Everywhere the book does not reach, and then home, so the
              corridors are read against something rather than against white. */}
          {shape === 'world' && <path className={styles.rest} d={WORLD.rest} />}
          {shape === 'world' && <path className={styles.home} d={WORLD.home} />}

          {drawn.map((r) => {
            const on = r.id === selectedId
            return (
              <path
                key={r.id}
                d={paths[r.id]}
                className={`${styles.area} ${styles[`s${stepOf(r.value)}`]} ${on ? styles.on : ''}`}
                onClick={() => onSelect(on ? null : r.id)}
                onMouseEnter={() => setOver(r.id)}
                onMouseLeave={() => setOver((x) => (x === r.id ? null : x))}
                onFocus={() => setOver(r.id)}
                onBlur={() => setOver((x) => (x === r.id ? null : x))}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onSelect(on ? null : r.id) }
                }}
                tabIndex={0}
                role="button"
                aria-pressed={on}
                aria-label={`${r.label}, ${metric.fmt(r.value)}`}
              />
            )
          })}
        </svg>

        {/* One readout, in a fixed corner. A tooltip that chases the pointer
            across a map covers the thing being pointed at. */}
        <div className={`${styles.read} ${hot ? styles.readOn : ''}`} aria-live="polite">
          <div className={styles.readK}>{hot ? hot.label : metric.label}</div>
          <div className={styles.readV}>{metric.fmt(hot ? hot.value : top)}</div>
          <div className={styles.readSub}>
            {hot ? hot.note : `highest of ${rows.length}`}
          </div>
        </div>

        {shape === 'world' && (
          <div className={styles.homeKey}>
            <span className={styles.homeSwatch} aria-hidden="true" />
            India · where the card is issued
          </div>
        )}
      </div>

      <div className={styles.side}>
        <div className={styles.rampRow}>
          <span className={styles.rampK}>{metric.label}</span>
          <span className={`${styles.ramp} ${styles[`t_${tone}`]}`} aria-hidden="true">
            {[1, 2, 3, 4, 5].map((s) => <i key={s} className={styles[`f${s}`]} />)}
          </span>
          <span className={styles.rampEnds}>
            <span>{metric.short(bottom)}</span>
            <span>{metric.short(top)}</span>
          </span>
        </div>

        <ol className={styles.rank}>
          {[...rows].sort((a, b) => b.value - a.value).map((r, i) => (
            <li key={r.id} className={r.id === shown ? styles.rankOn : ''}>
              <button
                type="button"
                className={styles.rankBtn}
                onClick={() => onSelect(r.id === selectedId ? null : r.id)}
                onMouseEnter={() => setOver(r.id)}
                onMouseLeave={() => setOver((x) => (x === r.id ? null : x))}
              >
                <span className={styles.rankNo}>{i + 1}</span>
                <span className={styles.rankName}>{r.label}</span>
                <span className={styles.rankV}>{metric.short(r.value)}</span>
              </button>
            </li>
          ))}
        </ol>
      </div>
    </div>
  )
}
