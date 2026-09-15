import { render } from '../../data/templates.js'
import { brandVars, findWidth } from '../../data/brandKit.js'
import styles from './EmailCanvas.module.css'

/** Merge tokens stay visible until the copy is explicitly previewed merged. */
function markup(text, merged) {
  if (merged) return text
  return String(text ?? '').split(/(\{\{\w+\}\})/g).map((part, i) => (
    /^\{\{\w+\}\}$/.test(part)
      ? <span key={i} className={styles.token}>{part.slice(2, -2)}</span>
      : <span key={i}>{part}</span>
  ))
}

/* Banner art is drawn, not uploaded — each preset is tied to something the
   campaign already knows, so a placeholder is never just grey. */
function Banner({ preset, fields, height }) {
  const cls = `${styles.banner} ${styles[`h_${height || 'md'}`]}`

  if (preset === 'benefit') {
    return (
      <div className={`${cls} ${styles.bannerBenefit}`}>
        <span className={styles.benefitV}>{fields.benefit_value}</span>
        <span className={styles.benefitK}>unclaimed {fields.category} value</span>
      </div>
    )
  }
  if (preset === 'brand') {
    return <div className={`${cls} ${styles.bannerBrand}`}><span>VISA</span></div>
  }
  if (preset === 'photo') {
    return (
      <div className={`${cls} ${styles.bannerPhoto}`} aria-hidden="true">
        <span className={styles.sun} />
        <span className={styles.hill} />
        <span className={styles.hill2} />
      </div>
    )
  }
  if (preset === 'points') {
    return (
      <div className={`${cls} ${styles.bannerPoints}`}>
        <span className={styles.coins} aria-hidden="true">
          <i /><i /><i />
        </span>
        <span className={styles.pointsV}>{fields.points}</span>
        <span className={styles.pointsK}>bonus points</span>
      </div>
    )
  }
  if (preset === 'city') {
    return (
      <div className={`${cls} ${styles.bannerCity}`} aria-hidden="true">
        <span className={styles.skyline}>
          {[38, 62, 30, 78, 46, 88, 34, 58, 26, 70, 42].map((h, i) => (
            <i key={i} style={{ height: `${h}%` }} />
          ))}
        </span>
      </div>
    )
  }
  return (
    <div className={`${cls} ${styles.bannerCard}`}>
      <span className={styles.cardArt}>
        <span className={styles.chip} />
        <span className={styles.cardName}>{fields.card}</span>
        <span className={styles.cardMark}>VISA</span>
      </span>
    </div>
  )
}

/**
 * The assembled email.
 *
 * The same renderer drives every surface, so a block never looks one way in
 * the builder and another in the artefact. Everything it draws is themed off
 * the brand kit rather than off this app's tokens — an email is not a page of
 * the console and must never inherit its chrome.
 */
export default function EmailCanvas({
  blocks = [], fields, merged, compact, dark, brand, selected, onSelect, flat,
}) {
  const show = (t) => (merged ? render(t ?? '', fields) : (t ?? ''))
  const width = findWidth(brand?.width).px
  // The kit resolves to inline custom properties, so a dark-mode override has
  // to be merged in here rather than declared in a class — an inline value
  // wins over any stylesheet rule, and the class would silently do nothing.
  //
  // What Gmail actually does: it darkens the ground and lifts the text, and
  // leaves the sender's own brand colour alone. That is why a near-black
  // brand button vanishes here and nowhere else.
  const vars = dark
    ? {
      ...brandVars(brand),
      '--bk-paper': '#1f1f1f',
      '--bk-band': '#2a2a2a',
      '--bk-ink': '#e8eaed',
      '--bk-body': '#bdc1c6',
    }
    : brandVars(brand)

  const inner = (b) => {
    switch (b.type) {
      case 'logo':
        return (
          <div className={`${styles.logo} ${styles[`al_${b.align || 'left'}`]}`}>
            <span className={styles.logoMark}>{brand?.logo || 'VISA'}</span>
            <span className={styles.logoText}>
              <b>{markup(show(b.text), merged)}</b>
              {b.sub ? <i>{markup(show(b.sub), merged)}</i> : null}
            </span>
          </div>
        )
      case 'image':
        return <Banner preset={b.preset} fields={fields} height={b.height} />
      case 'heading':
        return (
          <h2 className={`${styles.h} ${styles[`hs_${b.size || 'lg'}`]} ${styles[`al_${b.align || 'left'}`]}`}>
            {markup(show(b.text), merged)}
          </h2>
        )
      case 'text':
        return (
          <p className={`${styles.p} ${styles[`al_${b.align || 'left'}`]}`}>
            {markup(show(b.text), merged)}
          </p>
        )
      case 'bullets':
        return (
          <ul className={styles.ul}>
            {(b.items || []).map((it, i) => (
              <li key={i}><span className={styles.tick} aria-hidden="true" />{markup(show(it), merged)}</li>
            ))}
          </ul>
        )
      case 'stat':
        return (
          <div className={`${styles.stat} ${styles[`al_${b.align || 'center'}`]}`}>
            <span className={styles.statV}>{markup(show(b.text), merged)}</span>
            <span className={styles.statK}>{markup(show(b.sub), merged)}</span>
          </div>
        )
      case 'offer':
        return (
          <div className={styles.offer}>
            <span className={styles.offerRule} aria-hidden="true" />
            <span className={styles.offerBody}>
              <b>{markup(show(b.text), merged)}</b>
              <i>{markup(show(b.sub), merged)}</i>
              {b.meta ? <em>{markup(show(b.meta), merged)}</em> : null}
            </span>
          </div>
        )
      case 'countdown':
        return (
          <div className={styles.count}>
            <span className={styles.countRow}>
              {[
                [String(b.days ?? 14).padStart(2, '0'), 'days'],
                ['06', 'hours'],
                ['41', 'mins'],
              ].map(([v, k]) => (
                <span key={k} className={styles.countTile}>
                  <b>{v}</b><i>{k}</i>
                </span>
              ))}
            </span>
            <span className={styles.countK}>{markup(show(b.text), merged)}</span>
          </div>
        )
      case 'columns':
        return (
          <div className={styles.cols}>
            {[b.left, b.right].map((col, i) => {
              const [head, ...rest] = String(col || '').split('\n')
              return (
                <span key={i} className={styles.col}>
                  <b>{markup(show(head), merged)}</b>
                  <i>{markup(show(rest.join('\n')), merged)}</i>
                </span>
              )
            })}
          </div>
        )
      case 'button':
        return (
          <div className={`${styles.btnRow} ${styles[`al_${b.align || 'left'}`]}`}>
            <span className={`${styles.btn} ${b.style === 'outline' ? styles.btnOutline : ''}`}>
              {markup(show(b.text), merged)}
            </span>
          </div>
        )
      case 'link':
        return (
          <div className={`${styles.linkRow} ${styles[`al_${b.align || 'left'}`]}`}>
            <span className={styles.link}>{markup(show(b.text), merged)}</span>
          </div>
        )
      case 'divider':
        return <hr className={styles.hr} />
      case 'legal':
        return <p className={styles.legal}>{markup(show(b.text), merged)}</p>
      default:
        return <div className={`${styles.spacer} ${styles[`sp_${b.size || 'md'}`]}`} />
    }
  }

  return (
    <div
      className={[
        styles.mail,
        compact ? styles.compact : '',
        dark ? styles.dark : '',
        flat ? styles.flat : '',
      ].filter(Boolean).join(' ')}
      style={{ ...vars, '--bk-width': `${width}px` }}
    >
      {blocks.map((b) => (
        onSelect ? (
          // Selecting on the artboard rather than only in a list is the whole
          // difference between a form and a design tool.
          <div
            key={b.id}
            role="button"
            tabIndex={0}
            aria-pressed={selected === b.id}
            className={`${styles.pick} ${selected === b.id ? styles.picked : ''}`}
            onClick={(e) => { e.stopPropagation(); onSelect(b.id) }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onSelect(b.id) }
            }}
          >
            {inner(b)}
          </div>
        ) : <div key={b.id}>{inner(b)}</div>
      ))}
      {blocks.length > 0 && (
        <div className={styles.foot}>
          {brand?.footer || 'Sent to the address on file · unsubscribe in one tap'}
        </div>
      )}
    </div>
  )
}
