import { useMemo, useState } from 'react'
import { Check, Search, Star, X } from 'lucide-react'
import DesignThumb from '../studio/panels/DesignThumb.jsx'
import { ago, findState, loadLibrary, sortDesigns } from '../../data/designs.js'
import {
  CHANNEL_NAME, designCovers, fitsCampaign, listChannels,
} from '../../data/studioBridge.js'
import { fmtIN } from '../../data/portfolio.js'
import styles from './DesignPicker.module.css'

const cx = (...c) => c.filter(Boolean).join(' ')
const pct = (n) => (n == null ? '—' : `${(n * 100).toFixed(1)}%`)

/**
 * Pick a creative made in the studio.
 *
 * The list is ordered by what worked, not by what was touched last, because
 * the reason to reuse a design rather than write a fresh one is that this one
 * already has a number against it. A design that covers none of the channels
 * in play is shown greyed rather than hidden — knowing the WhatsApp creative
 * exists but has no SMS in it is the useful fact.
 */
export default function DesignPicker({ channels, current, onPick, onClose }) {
  const [library] = useState(loadLibrary)
  const [q, setQ] = useState('')
  const [onlyFits, setOnlyFits] = useState(true)

  const rows = useMemo(() => {
    const needle = q.trim().toLowerCase()
    const list = library.filter((d) => (
      !needle
      || d.name.toLowerCase().includes(needle)
      || (d.campaign || '').toLowerCase().includes(needle)
      || d.tags.some((t) => t.includes(needle))
    ))
    const usable = onlyFits ? list.filter((d) => fitsCampaign(d.doc, channels)) : list
    // Anything that has shipped, best first; then everything that has not.
    const shipped = usable.filter((d) => d.stats)
    const rest = usable.filter((d) => !d.stats)
    return [
      ...shipped.sort((a, b) => (b.stats.clickPct || 0) - (a.stats.clickPct || 0)),
      ...sortDesigns(rest, 'recent'),
    ]
  }, [library, q, onlyFits, channels])

  return (
    <div className={styles.scrim} role="dialog" aria-modal="true" aria-label="Use a saved design">
      <div className={styles.panel}>
        <header className={styles.head}>
          <div>
            <div className={styles.kicker}>From the campaign studio</div>
            <h2 className={styles.title}>Use a design you have already made</h2>
            <p className={styles.note}>
              This campaign is going out on {listChannels(channels)}. A design fills the
              channels it was written for and leaves the rest as drafted.
            </p>
          </div>
          <button type="button" className={styles.close} onClick={onClose} aria-label="Close">
            <X size={16} strokeWidth={2} aria-hidden="true" />
          </button>
        </header>

        <div className={styles.tools}>
          <span className={styles.search}>
            <Search size={13} strokeWidth={2} aria-hidden="true" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search designs and campaigns"
              aria-label="Search designs"
            />
          </span>
          <button
            type="button"
            className={cx(styles.chip, onlyFits && styles.chipOn)}
            onClick={() => setOnlyFits((v) => !v)}
            aria-pressed={onlyFits}
          >
            {onlyFits ? 'Only what fits' : 'Everything'}
          </button>
        </div>

        <div className={styles.list}>
          {rows.length === 0 && (
            <p className={styles.empty}>
              Nothing in the library covers {listChannels(channels)} yet.
            </p>
          )}

          {rows.map((d) => {
            const covers = designCovers(d.doc)
            const hits = channels.filter((c) => covers.includes(c))
            const misses = channels.filter((c) => !covers.includes(c))
            const state = findState(d.state)
            return (
              <button
                key={d.id}
                type="button"
                className={cx(styles.row, current === d.id && styles.rowOn, !hits.length && styles.rowDim)}
                onClick={() => onPick(d)}
                aria-label={`Use ${d.name}`}
              >
                <DesignThumb doc={d.doc} channel={d.channel} brand={d.brand} width={92} height={68} />

                <span className={styles.body}>
                  <span className={styles.name}>
                    {d.name.trim() || 'Untitled design'}
                    {d.starred && <Star size={11} strokeWidth={2} fill="currentColor" className={styles.star} aria-hidden="true" />}
                  </span>
                  <span className={styles.meta}>
                    <i className={cx(styles.state, styles[`st_${state.tone}`])}>{state.label}</i>
                    {d.campaign ? <span className={styles.where}>{d.campaign}</span> : <span className={styles.where}>Not on a campaign</span>}
                    <span className={styles.when}>{ago(d.updated)}</span>
                  </span>
                  <span className={styles.covers}>
                    {hits.map((c) => (
                      <i key={c} className={styles.hit}>
                        <Check size={9} strokeWidth={3} aria-hidden="true" />{CHANNEL_NAME[c]}
                      </i>
                    ))}
                    {misses.map((c) => (
                      <i key={c} className={styles.miss}>no {CHANNEL_NAME[c]}</i>
                    ))}
                  </span>
                </span>

                <span className={styles.perf}>
                  {d.stats ? (
                    <>
                      <b>{pct(d.stats.clickPct)}</b>
                      <i>click rate</i>
                      <em>{fmtIN(d.stats.sends)} sent</em>
                    </>
                  ) : (
                    <i className={styles.never}>Never sent</i>
                  )}
                </span>
              </button>
            )
          })}
        </div>

        <footer className={styles.foot}>
          <span>
            Designs are made and judged in <b>Campaign studio</b>, on the surfaces they
            actually land on. Anything saved there shows up here.
          </span>
        </footer>
      </div>
    </div>
  )
}
