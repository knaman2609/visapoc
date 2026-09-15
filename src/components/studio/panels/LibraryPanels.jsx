import { useMemo, useState } from 'react'
import DesignThumb from './DesignThumb.jsx'
import { LAYOUTS } from '../../../data/layouts.js'
import { IMAGE_PRESETS, SAMPLE, SAMPLE_LONG } from '../../../data/blocks.js'
import s from './panels.module.css'

const cx = (...c) => c.filter(Boolean).join(' ')
const pct = (n) => (n == null ? '—' : `${(n * 100).toFixed(1)}%`)

/**
 * The starter layouts.
 *
 * Each one is an argument rather than a skin, drafted across all three
 * channels, and each carries what the shape has done before — so choosing one
 * is a decision with evidence attached instead of a matter of taste.
 */
export function TemplatesPanel({ onApply, channel, brand }) {
  const [open, setOpen] = useState(null)
  // `doc()` mints fresh block ids, so calling it inline would rebuild — and
  // remount — nine previews on every keystroke elsewhere in the studio.
  const previews = useMemo(() => LAYOUTS.map((l) => ({ layout: l, doc: l.doc() })), [])
  return (
    <>
      <div className={s.head}>
        <span className={s.headK}>Start from</span>
        <span className={s.headN}>{LAYOUTS.length}</span>
      </div>
      <p className={s.note}>
        Every layout is drafted for all three channels at once, so the argument
        stays the same wherever it lands.
      </p>

      <div className={s.tplGrid}>
        {previews.map(({ layout: l, doc }) => (
          <div key={l.id} className={cx(s.tpl, open === l.id && s.tplOn)}>
            <button
              type="button"
              className={s.tplHit}
              onClick={() => setOpen(open === l.id ? null : l.id)}
              aria-expanded={open === l.id}
            >
              <DesignThumb doc={doc} channel={channel} brand={brand} width={196} height={112} />
              <span className={s.tplName}>
                {l.name}
                <i>{l.kicker}</i>
              </span>
            </button>
            {open === l.id && (
              <div className={s.tplOpen}>
                <p>{l.use}</p>
                <div className={s.tplStats}>
                  <span><b>{l.lift.sends}</b> campaigns</span>
                  <span><b>{pct(l.lift.openPct)}</b> open</span>
                  <span><b>{pct(l.lift.clickPct)}</b> click</span>
                </div>
                <button type="button" className={s.primary} onClick={() => onApply(l)}>
                  Use this layout
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </>
  )
}

/**
 * Assets.
 *
 * There is no upload pipeline and there should not be one: every piece of art
 * is drawn from something the campaign already knows about itself, which is
 * why none of it can go stale. The merge-field table is here too — it is the
 * other half of "what can this design contain".
 */
export function AssetsPanel({ onInsertImage, onSetPreset, selectedImage }) {
  return (
    <>
      <div className={s.head}><span className={s.headK}>Banner art</span></div>
      <p className={s.note}>
        {selectedImage
          ? 'Applies to the banner you have selected.'
          : 'Click to add a banner to the stack.'}
      </p>

      <div className={s.assetGrid}>
        {IMAGE_PRESETS.map((p) => (
          <button
            key={p.id}
            type="button"
            className={cx(s.asset, selectedImage?.preset === p.id && s.assetOn)}
            onClick={() => (selectedImage ? onSetPreset(p.id) : onInsertImage(p.id))}
            aria-pressed={selectedImage ? selectedImage.preset === p.id : undefined}
          >
            <span className={cx(s.assetArt, s[`art_${p.id}`])} aria-hidden="true" />
            <span className={s.assetName}>{p.label}</span>
            <span className={s.assetNote}>{p.note}</span>
          </button>
        ))}
      </div>

      <div className={s.head}><span className={s.headK}>Merge fields</span></div>
      <p className={s.note}>
        What a token resolves to. The second column is the awkward cardholder —
        the one whose merge is what actually truncates.
      </p>
      <table className={s.fields}>
        <thead>
          <tr><th>Token</th><th>Typical</th><th>Longest</th></tr>
        </thead>
        <tbody>
          {Object.keys(SAMPLE).map((k) => (
            <tr key={k}>
              <td className={s.fieldK}>{k}</td>
              <td>{SAMPLE[k]}</td>
              <td className={s.fieldLong}>{SAMPLE_LONG[k]}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  )
}
