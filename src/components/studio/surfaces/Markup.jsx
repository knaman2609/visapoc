import styles from './Markup.module.css'

const URL_SPLIT = /((?:https?:\/\/|www\.)\S+|[a-z0-9-]+\.[a-z]{2,}\/\S*)/gi
const URL_ONE = /^(?:(?:https?:\/\/|www\.)\S+|[a-z0-9-]+\.[a-z]{2,}\/\S*)$/i

/** A handset makes a URL tappable, so the mock does too. */
function linkify(text, tone) {
  return String(text ?? '').split(URL_SPLIT).map((part, i) => (
    URL_ONE.test(part)
      ? <span key={i} className={`${styles.link} ${tone ? styles[tone] : ''}`}>{part}</span>
      : <span key={i}>{part}</span>
  ))
}

/**
 * Copy as the surface draws it.
 *
 * In template mode the merge tokens stay visible and chipped, so nothing on
 * an artboard is ever mistaken for the words that will ship. In merged mode
 * they resolve and the surface's own link styling takes over.
 *
 * `cut` is where the client stops drawing. Rather than silently clipping with
 * CSS, the overflow is rendered dimmed — the operator can see the words that
 * were lost, which is the whole reason to look at the surface.
 */
export default function Markup({ text, merged, cut, tone, showCut = true }) {
  const s = String(text ?? '')
  if (!merged) {
    return (
      <>
        {s.split(/(\{\{\w+\}\})/g).map((part, i) => (
          /^\{\{\w+\}\}$/.test(part)
            ? <span key={i} className={styles.token}>{part.slice(2, -2)}</span>
            : <span key={i}>{part}</span>
        ))}
      </>
    )
  }

  if (cut && s.length > cut) {
    const head = s.slice(0, cut).trimEnd()
    const tail = s.slice(cut)
    return (
      <>
        {linkify(head, tone)}
        {showCut ? <span className={styles.lost} title={`Cut here by this client: ${tail}`}>{tail}</span> : '…'}
      </>
    )
  }

  return <>{linkify(s, tone)}</>
}
