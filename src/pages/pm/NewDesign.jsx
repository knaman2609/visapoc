import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, X } from 'lucide-react'
import DesignThumb from '../../components/studio/panels/DesignThumb.jsx'
import { LAYOUTS, blankDoc } from '../../data/layouts.js'
import { loadLibrary, newId, saveLibrary } from '../../data/designs.js'
import { DEFAULT_BRAND } from '../../data/brandKit.js'
import { CHANNEL_NAME } from '../../data/studioBridge.js'
import styles from './NewDesign.module.css'

const cx = (...c) => c.filter(Boolean).join(' ')
const pct = (n) => `${(n * 100).toFixed(1)}%`

const CHANNELS = [
  { id: 'email', label: 'Email' },
  { id: 'wa', label: 'WhatsApp' },
  { id: 'sms', label: 'SMS' },
]

/**
 * Start a design.
 *
 * A blank artboard is the wrong place to begin a retention send — the shape of
 * these messages is already known, and what changes between them is the
 * argument. So this screen is the arguments, each one drafted across all three
 * channels, with what the shape has done before attached to it. Blank is still
 * there, first, for when none of them is the argument.
 */
export default function NewDesign() {
  const navigate = useNavigate()
  const [channel, setChannel] = useState('email')
  /* The screen opens on the one thing you came here to do. Nine layouts laid
     out before you have said you want one is a catalogue, not a start. */
  const [choosing, setChoosing] = useState(false)

  // `doc()` mints fresh block ids, so the previews are built once rather than
  // rebuilt — and remounted — on every hover.
  const previews = useMemo(() => LAYOUTS.map((l) => ({ layout: l, doc: l.doc() })), [])

  useEffect(() => {
    if (!choosing) return undefined
    const onKey = (e) => { if (e.key === 'Escape') setChoosing(false) }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [choosing])

  const create = (layout) => {
    const record = {
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
      brand: { ...DEFAULT_BRAND },
      doc: layout ? layout.doc() : blankDoc(),
      updated: Date.now(),
      created: Date.now(),
    }
    saveLibrary([record, ...loadLibrary()])
    navigate(`/pm/studio?design=${record.id}`)
  }

  return (
    <div className={styles.wrap}>
      <header className={styles.head}>
        <div>
          <div className={styles.kicker}>Campaign studio</div>
          <h1 className={styles.title}>New design</h1>
          <p className={styles.note}>
            Start something for this portfolio. You can begin from a blank
            artboard or from a shape that has run before.
          </p>
        </div>
      </header>

      <div className={styles.start}>
        {/* The sidebar already has a "New design" item; this one starts one,
            so it says which is which to anything reading the page aloud. */}
        <button
          type="button"
          className={styles.startBtn}
          onClick={() => setChoosing(true)}
          aria-label="Start a new design"
        >
          <Plus size={16} strokeWidth={2.6} aria-hidden="true" />
          New design
        </button>
        <p className={styles.startNote}>
          {LAYOUTS.length} layouts to start from, or a blank artboard.
        </p>
      </div>

      {choosing && (
        <div
          className={styles.scrim}
          role="dialog"
          aria-modal="true"
          aria-label="Pick a layout"
          onClick={(e) => { if (e.target === e.currentTarget) setChoosing(false) }}
        >
          <div className={styles.panel}>
            <header className={styles.panelHead}>
              <div>
                <div className={styles.kicker}>Pick a layout</div>
                <h2 className={styles.panelTitle}>Select a template</h2>
                <p className={styles.panelNote}>
                  Every layout is drafted for all three channels at once, so the
                  argument stays the same wherever it lands. Pick the one that
                  matches what you are trying to say — you can change everything after.
                </p>
              </div>

              <div className={styles.chan} role="group" aria-label="Preview channel">
                {CHANNELS.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    className={cx(styles.chanBtn, channel === c.id && styles.chanOn)}
                    onClick={() => setChannel(c.id)}
                    aria-pressed={channel === c.id}
                  >
                    {c.label}
                  </button>
                ))}
              </div>

              <button
                type="button"
                className={styles.close}
                onClick={() => setChoosing(false)}
                aria-label="Close"
              >
                <X size={16} strokeWidth={2} aria-hidden="true" />
              </button>
            </header>

            <div className={styles.grid}>
              <button
                type="button"
                className={cx(styles.card, styles.blank)}
                onClick={() => create(null)}
                aria-label="Start from a blank artboard"
              >
                <span className={styles.blankArt} aria-hidden="true">
                  <Plus size={22} strokeWidth={2} />
                </span>
                <span className={styles.body}>
                  <span className={styles.name}>Blank design<i>Start from nothing</i></span>
                  <span className={styles.use}>
                    An empty artboard on all three channels. Everything is yours to add.
                  </span>
                </span>
              </button>

              {previews.map(({ layout: l, doc }) => (
                <button
                  key={l.id}
                  type="button"
                  className={styles.card}
                  onClick={() => create(l)}
                  aria-label={`Start from ${l.name}`}
                >
                  <span className={styles.thumb}>
                    <DesignThumb doc={doc} channel={channel} brand={DEFAULT_BRAND} width={278} height={164} />
                  </span>
                  <span className={styles.body}>
                    <span className={styles.name}>
                      {l.name}
                      <i>{l.kicker}</i>
                    </span>
                    <span className={styles.use}>{l.use}</span>
                    <span className={styles.lift}>
                      <span><b>{l.lift.sends}</b> campaigns</span>
                      <span><b>{pct(l.lift.openPct)}</b> open</span>
                      <span><b>{pct(l.lift.clickPct)}</b> click</span>
                    </span>
                    <span className={styles.covers}>
                      {['email', 'wa', 'sms'].map((c) => <i key={c}>{CHANNEL_NAME[c]}</i>)}
                    </span>
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
