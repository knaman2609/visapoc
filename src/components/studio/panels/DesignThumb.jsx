import EmailCanvas from '../EmailCanvas.jsx'
import { render } from '../../../data/templates.js'
import { SAMPLE } from '../../../data/blocks.js'
import { brandVars } from '../../../data/brandKit.js'
import styles from './DesignThumb.module.css'

/**
 * A design, small.
 *
 * The thumbnail is the real renderer at a scale, not a drawn approximation —
 * so a card in the library cannot drift from what opening it shows, and a
 * brand-kit change repaints every card the moment it is made. Email thumbs
 * are the block stack; the messaging channels get the shape of their own
 * artefact rather than a shrunken email, because that shape is most of what
 * the operator is scanning for.
 */
export default function DesignThumb({ doc, channel = 'email', brand, height = 96, width = 168 }) {
  const fields = SAMPLE
  const show = (t) => render(t ?? '', fields)

  if (channel === 'email') {
    const blocks = doc?.email?.blocks || []
    const scale = width / 560
    return (
      <div className={styles.thumb} style={{ height, width }}>
        {blocks.length ? (
          <div className={styles.scale} style={{ transform: `scale(${scale})`, width: 560 }}>
            <EmailCanvas blocks={blocks} fields={fields} merged brand={brand} />
          </div>
        ) : <span className={styles.blank}>Blank</span>}
      </div>
    )
  }

  if (channel === 'wa') {
    const t = doc?.wa || {}
    return (
      <div className={`${styles.thumb} ${styles.chat}`} style={{ height, width, ...brandVars(brand) }}>
        <span className={styles.bubble}>
          {t.header ? <b>{show(t.header)}</b> : null}
          <i>{show(t.body)}</i>
          {(t.buttons || []).slice(0, 2).map((b, i) => <em key={i}>{show(b.label)}</em>)}
        </span>
      </div>
    )
  }

  return (
    <div className={`${styles.thumb} ${styles.sms}`} style={{ height, width }}>
      <span className={styles.smsBubble}>{show(doc?.sms?.body)}</span>
    </div>
  )
}
