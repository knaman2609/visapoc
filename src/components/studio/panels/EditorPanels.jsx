import { useState } from 'react'
import {
  AlignLeft, BadgeCheck, Blocks, CalendarClock, CircleCheckBig, CircleX,
  Columns2, Copy, FileText, Gift, Hash, Heading, Image, Info, Link,
  List, MousePointerClick, MoveVertical, Minus, Plus, SquareMousePointer,
  Trash2, TriangleAlert, Type,
} from 'lucide-react'
import { BLOCK_GROUPS, BLOCK_KINDS, blockText, kindOf } from '../../../data/blocks.js'
import { render } from '../../../data/templates.js'
import {
  BUTTON_SHAPES, DENSITIES, PALETTES, TYPE_PAIRS, WIDTHS,
} from '../../../data/brandKit.js'
import { runChecks } from '../../../data/checks.js'
import s from './panels.module.css'

const cx = (...c) => c.filter(Boolean).join(' ')

const BLOCK_ICON = {
  logo: BadgeCheck, image: Image, heading: Heading, text: AlignLeft,
  bullets: List, stat: Hash, offer: Gift, countdown: CalendarClock,
  columns: Columns2, button: MousePointerClick, link: Link,
  divider: Minus, spacer: MoveVertical, legal: FileText,
}

/**
 * A layer names itself off its own content, the way a design tool does.
 *
 * Merged rather than raw: "first_name, points bonus po" is not a name anybody
 * can find a block by, and the sample values are already on screen.
 */
const layerName = (b, fields) => {
  const first = blockText(b).split('\n')[0]
  if (!first) return kindOf(b.type)?.label || b.type
  const said = fields ? render(first, fields) : first.replace(/\{\{(\w+)\}\}/g, '$1')
  return said.trim().slice(0, 26) || kindOf(b.type)?.label
}

/**
 * The space between two layers.
 *
 * It is the drop target when something is being dragged and the insert point
 * when nothing is — one affordance, two jobs, and it means a block can be
 * built into the middle of a stack rather than only onto the end of it.
 */
function Gap({ at, drag, onDrop, adding, onAdd, add, last }) {
  const [over, setOver] = useState(false)
  const open = adding === at

  return (
    <div className={cx(s.gap, last && s.gapLast)}>
      <div
        className={cx(s.gapHit, over && drag && s.gapOver)}
        onDragOver={(e) => { if (drag) { e.preventDefault(); setOver(true) } }}
        onDragLeave={() => setOver(false)}
        onDrop={(e) => { e.preventDefault(); setOver(false); if (drag) onDrop(drag, at) }}
      >
        {!drag && (
          <button
            type="button"
            className={s.gapAdd}
            onClick={(e) => { e.stopPropagation(); onAdd(open ? null : at) }}
            aria-expanded={open}
            aria-label={`Insert a block at position ${at + 1}`}
          >
            <Plus size={11} strokeWidth={2.5} aria-hidden="true" />
          </button>
        )}
      </div>

      {open && (
        <div className={s.pop} onClick={(e) => e.stopPropagation()}>
          {BLOCK_KINDS.map((k) => {
            const Icon = BLOCK_ICON[k.type]
            return (
              <button key={k.type} type="button" className={s.popRow} onClick={() => add(k.type, at)}>
                <Icon size={13} strokeWidth={1.75} aria-hidden="true" />
                {k.label}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

/**
 * Layers.
 *
 * For email this is the block stack, draggable and insertable anywhere. For
 * the messaging channels it is the parts of a template — header, body, footer
 * and the buttons — because those are genuinely separate fields with separate
 * limits, and treating them as one blob of text is how a template gets
 * rejected at review.
 */
export function LayersPanel({
  channel, tpl, blocks, sel, fields, onSelect, onDuplicate, onDelete, onMoveTo,
  onAdd, drag, setDrag, adding, setAdding, onAddButton, onDropButton,
}) {
  if (channel === 'email') {
    return (
      <>
        <div className={s.head}>
          <span className={s.headK}>Layers</span>
          <span className={s.headN}>{blocks.length}</span>
        </div>

        <button
          type="button"
          className={cx(s.layer, sel === 'subject' && s.layerOn)}
          onClick={() => onSelect('subject')}
        >
          <Type size={13} strokeWidth={1.75} aria-hidden="true" />
          <span className={s.layerName}>Subject</span>
        </button>
        <button
          type="button"
          className={cx(s.layer, sel === 'preheader' && s.layerOn)}
          onClick={() => onSelect('preheader')}
        >
          <AlignLeft size={13} strokeWidth={1.75} aria-hidden="true" />
          <span className={s.layerName}>Preheader</span>
          {!tpl.preheader && <i className={s.layerWarn} title="Not set — Gmail will improvise one">!</i>}
        </button>

        <div className={s.rule} />

        {blocks.map((b, i) => {
          const Icon = BLOCK_ICON[b.type] || SquareMousePointer
          return (
            <div key={b.id}>
              <Gap at={i} drag={drag} onDrop={onMoveTo} onAdd={setAdding} adding={adding} add={onAdd} />
              <div
                className={cx(s.layerRow, drag === b.id && s.dragging)}
                draggable
                onDragStart={() => setDrag(b.id)}
                onDragEnd={() => setDrag(null)}
              >
                <button
                  type="button"
                  className={cx(s.layer, sel === b.id && s.layerOn)}
                  onClick={() => onSelect(b.id)}
                >
                  <Icon size={13} strokeWidth={1.75} aria-hidden="true" />
                  <span className={s.layerName}>{layerName(b, fields)}</span>
                </button>
                <span className={s.layerTools}>
                  <button
                    type="button" className={s.mini} onClick={() => onDuplicate(b.id)}
                    title="Duplicate (⌘D)" aria-label="Duplicate"
                  >
                    <Copy size={11} strokeWidth={1.75} aria-hidden="true" />
                  </button>
                  <button
                    type="button" className={s.mini} onClick={() => onDelete(b.id)}
                    title="Delete (⌫)" aria-label="Delete"
                  >
                    <Trash2 size={11} strokeWidth={1.75} aria-hidden="true" />
                  </button>
                </span>
              </div>
            </div>
          )
        })}
        <Gap at={blocks.length} drag={drag} onDrop={onMoveTo} onAdd={setAdding} adding={adding} add={onAdd} last />
      </>
    )
  }

  if (channel === 'wa') {
    const buttons = tpl.buttons || []
    return (
      <>
        <div className={s.head}><span className={s.headK}>Template</span></div>
        <p className={s.note}>
          Meta reviews these parts separately, and each has its own ceiling:
          60 characters of header, 1,024 of body, 60 of footer, 20 per button.
        </p>
        {[['header', 'Header'], ['body', 'Body'], ['footer', 'Footer']].map(([k, label]) => (
          <button
            key={k} type="button"
            className={cx(s.layer, sel === k && s.layerOn)}
            onClick={() => onSelect(k)}
          >
            {k === 'body'
              ? <AlignLeft size={13} strokeWidth={1.75} aria-hidden="true" />
              : <Type size={13} strokeWidth={1.75} aria-hidden="true" />}
            <span className={s.layerName}>{label}</span>
            {!tpl[k] && <i className={s.layerIdle}>empty</i>}
          </button>
        ))}

        <div className={s.rule} />
        <div className={s.head}>
          <span className={s.headK}>Buttons</span>
          <span className={s.headN}>{buttons.length}</span>
        </div>
        {buttons.map((b, i) => (
          <div key={i} className={s.layerRow}>
            <button
              type="button"
              className={cx(s.layer, sel === `btn:${i}` && s.layerOn)}
              onClick={() => onSelect(`btn:${i}`)}
            >
              <MousePointerClick size={13} strokeWidth={1.75} aria-hidden="true" />
              <span className={s.layerName}>{b.label || 'Button'}</span>
            </button>
            <span className={s.layerTools}>
              <button
                type="button" className={s.mini} onClick={() => onDropButton(i)}
                title="Remove" aria-label="Remove button"
              >
                <Trash2 size={11} strokeWidth={1.75} aria-hidden="true" />
              </button>
            </span>
          </div>
        ))}
        {buttons.length < 3 && (
          <button type="button" className={s.ghost} onClick={onAddButton}>
            <Plus size={12} strokeWidth={2.5} aria-hidden="true" /> Add a button
          </button>
        )}
      </>
    )
  }

  return (
    <>
      <div className={s.head}><span className={s.headK}>Message</span></div>
      <button
        type="button"
        className={cx(s.layer, sel === 'body' && s.layerOn)}
        onClick={() => onSelect('body')}
      >
        <AlignLeft size={13} strokeWidth={1.75} aria-hidden="true" />
        <span className={s.layerName}>Body</span>
      </button>
      <p className={s.note}>
        One field, and every character in it is a line item. The thread preview
        marks where the first segment runs out.
      </p>
    </>
  )
}

/** The insert palette, grouped the way the blocks are actually thought about. */
export function BlocksPanel({ onAdd, channel }) {
  if (channel !== 'email') {
    return (
      <>
        <div className={s.head}><span className={s.headK}>Blocks</span></div>
        <p className={s.empty}>
          Blocks are an email idea. {channel === 'wa' ? 'A WhatsApp template' : 'An SMS'} has
          fixed parts — edit them in Layers.
        </p>
      </>
    )
  }

  return (
    <>
      <div className={s.head}>
        <span className={s.headK}>Insert</span>
        <span className={s.headN}>{BLOCK_KINDS.length}</span>
      </div>
      <p className={s.note}>Added below whatever is selected, or at the end.</p>

      {BLOCK_GROUPS.map((g) => (
        <div key={g}>
          <div className={s.groupK}>{g}</div>
          <div className={s.blockGrid}>
            {BLOCK_KINDS.filter((k) => k.group === g).map((k) => {
              const Icon = BLOCK_ICON[k.type] || Blocks
              return (
                <button key={k.type} type="button" className={s.blockBtn} onClick={() => onAdd(k.type)}>
                  <Icon size={15} strokeWidth={1.6} aria-hidden="true" />
                  <b>{k.label}</b>
                  <i>{k.hint}</i>
                </button>
              )
            })}
          </div>
        </div>
      ))}
    </>
  )
}

/**
 * The brand kit.
 *
 * One palette, one type pair, one button shape — chosen once and applied to
 * everything, rather than restyled per block. The whole artboard repaints on
 * change, which is the only way to tell whether a palette actually survives
 * contact with the design.
 */
export function BrandPanel({ brand, onSet }) {
  return (
    <>
      <div className={s.head}><span className={s.headK}>Palette</span></div>
      <div className={s.palettes}>
        {PALETTES.map((p) => (
          <button
            key={p.id}
            type="button"
            className={cx(s.palette, brand.palette === p.id && s.paletteOn)}
            onClick={() => onSet({ palette: p.id })}
            aria-pressed={brand.palette === p.id}
          >
            <span className={s.swatches} aria-hidden="true">
              <i style={{ background: p.brand }} />
              <i style={{ background: p.accent }} />
              <i style={{ background: p.ink }} />
              <i style={{ background: p.band }} />
            </span>
            <span className={s.paletteText}>
              <b>{p.label}</b>
              <i>{p.note}</i>
            </span>
          </button>
        ))}
      </div>

      <div className={s.head}><span className={s.headK}>Type</span></div>
      <div className={s.typeList}>
        {TYPE_PAIRS.map((t) => (
          <button
            key={t.id}
            type="button"
            className={cx(s.typeBtn, brand.type === t.id && s.typeOn)}
            onClick={() => onSet({ type: t.id })}
            aria-pressed={brand.type === t.id}
          >
            <b style={{ fontFamily: t.heading }}>Aa</b>
            <span>
              <em>{t.label}</em>
              <i>{t.note}</i>
            </span>
          </button>
        ))}
      </div>

      <div className={s.head}><span className={s.headK}>Button</span></div>
      <div className={s.segs}>
        {BUTTON_SHAPES.map((b) => (
          <button
            key={b.id} type="button"
            className={cx(s.seg, brand.button === b.id && s.segOn)}
            onClick={() => onSet({ button: b.id })}
            aria-pressed={brand.button === b.id}
          >
            <i style={{ borderRadius: Math.min(b.radius, 5) }} aria-hidden="true" />
            {b.label}
          </button>
        ))}
      </div>

      <div className={s.head}><span className={s.headK}>Rhythm</span></div>
      <div className={s.segs}>
        {DENSITIES.map((d) => (
          <button
            key={d.id} type="button"
            className={cx(s.seg, brand.density === d.id && s.segOn)}
            onClick={() => onSet({ density: d.id })}
            title={d.note}
            aria-pressed={brand.density === d.id}
          >
            {d.label}
          </button>
        ))}
      </div>

      <div className={s.head}><span className={s.headK}>Width</span></div>
      <div className={s.segs}>
        {WIDTHS.map((w) => (
          <button
            key={w.id} type="button"
            className={cx(s.seg, brand.width === w.id && s.segOn)}
            onClick={() => onSet({ width: w.id })}
            title={w.note}
            aria-pressed={brand.width === w.id}
          >
            {w.label}
          </button>
        ))}
      </div>

      <div className={s.head}><span className={s.headK}>Sender</span></div>
      <label className={s.field}>
        <span>From name</span>
        <input value={brand.sender} onChange={(e) => onSet({ sender: e.target.value })} />
      </label>
      <label className={s.field}>
        <span>From address</span>
        <input value={brand.senderAddress} onChange={(e) => onSet({ senderAddress: e.target.value })} />
      </label>
      <label className={s.field}>
        <span>Footer</span>
        <textarea rows={2} value={brand.footer} onChange={(e) => onSet({ footer: e.target.value })} />
      </label>
      <label className={s.field}>
        <span>Logo wordmark</span>
        <input value={brand.logo} onChange={(e) => onSet({ logo: e.target.value })} maxLength={12} />
      </label>
    </>
  )
}

const CHECK_ICON = {
  fail: CircleX, warn: TriangleAlert, info: Info, pass: CircleCheckBig,
}

/**
 * Preflight.
 *
 * Not a score. A list of things that will go wrong, each naming the surface
 * it goes wrong on — clicking one takes the artboard there, because a finding
 * you cannot see is a finding nobody fixes.
 */
export function ChecksPanel({ doc, channel, brand, onGo }) {
  const result = runChecks(doc, channel, brand)
  return (
    <>
      <div className={s.head}><span className={s.headK}>Preflight</span></div>
      <div className={s.checkTally}>
        <span className={cx(s.tally, result.fails && s.tallyFail)}>
          <b>{result.fails}</b> blocking
        </span>
        <span className={cx(s.tally, result.warns && s.tallyWarn)}>
          <b>{result.warns}</b> to look at
        </span>
        <span className={s.tally}><b>{result.passes}</b> clear</span>
      </div>

      <div className={s.checks}>
        {result.items.map((c) => {
          const Icon = CHECK_ICON[c.level] || Info
          return (
            <div key={c.id} className={cx(s.check, s[`ck_${c.level}`])}>
              <Icon size={13} strokeWidth={2} className={s.checkIcon} aria-hidden="true" />
              <span className={s.checkText}>
                <b>{c.label}</b>
                {c.detail ? <i>{c.detail}</i> : null}
                {c.where ? (
                  <button type="button" className={s.checkGo} onClick={() => onGo(c.where)}>
                    Show me →
                  </button>
                ) : null}
              </span>
            </div>
          )
        })}
      </div>
    </>
  )
}
