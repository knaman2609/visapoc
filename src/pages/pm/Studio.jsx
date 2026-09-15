import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  Blocks, Image as ImageIcon, Layers, LayoutTemplate,
  Maximize2, Palette, PanelLeftClose, Redo2, ShieldCheck,
  Trash2, TriangleAlert, Undo2, ZoomIn, ZoomOut,
} from 'lucide-react'
import { CHANNELS } from '../../data/agent.js'
import { TEMPLATES, render } from '../../data/templates.js'
import { smsParts } from '../../data/copyLint.js'
import {
  ALIGNMENTS, SAMPLE_SETS, SPACE_SIZES, blocksText, kindOf, newBlock, reid,
} from '../../data/blocks.js'
import { DEFAULT_SURFACE, findSurface, groupedFor, surfacesFor } from '../../data/surfaces.js'
import { docEmpty } from '../../components/studio/surfaces/model.js'
import { DEFAULT_BRAND } from '../../data/brandKit.js'
import { blankDoc } from '../../data/layouts.js'
import { loadLibrary, newDesignRecord, saveLibrary } from '../../data/designs.js'
import { runChecks } from '../../data/checks.js'
import { useHistory } from '../../state/useHistory.js'
import ChannelPreview from '../../components/studio/ChannelPreview.jsx'
import { AssetsPanel, TemplatesPanel } from '../../components/studio/panels/LibraryPanels.jsx'
import {
  BlocksPanel, BrandPanel, ChecksPanel, LayersPanel,
} from '../../components/studio/panels/EditorPanels.jsx'
import styles from './Studio.module.css'

const cx = (...c) => c.filter(Boolean).join(' ')
const WRITTEN = ['email', 'wa', 'sms']

/* No "Designs" tab: the library is a screen of its own, reached from the
   sidebar. A rail beside an artboard is for acting on the open document. */
const TABS = [
  { id: 'templates', label: 'Templates', icon: LayoutTemplate },
  { id: 'layers', label: 'Layers', icon: Layers },
  { id: 'blocks', label: 'Insert', icon: Blocks },
  { id: 'brand', label: 'Brand kit', icon: Palette },
  { id: 'assets', label: 'Assets', icon: ImageIcon },
  { id: 'checks', label: 'Preflight', icon: ShieldCheck },
]

/* What each client cuts a subject at, so the composer can say where rather
   than only how many. */
const SUBJECT_CUTS = [
  ['Gmail, phone', 33], ['Apple Mail', 64], ['Gmail, desktop', 74],
]

const WA_LIMIT = { header: 60, body: 1024, footer: 60 }

/* The plain string fields a token can land in. Matched by name rather than by
   prefix: block ids, "btn:0" and "body" all start with a b. */
const TEXT_FIELDS = ['subject', 'preheader', 'body', 'header', 'footer']

/* The stops the buttons walk between. Fit can land anywhere between the
   first and the last, so stepping is "the next stop past here" rather than an
   index — otherwise zooming out of a fitted view jumps back to 50%. */
const ZOOMS = [0.35, 0.5, 0.65, 0.8, 0.9, 1, 1.15]
const ZOOM_MIN = ZOOMS[0]
const ZOOM_MAX = ZOOMS[ZOOMS.length - 1]
const zoomUp = (z) => ZOOMS.find((v) => v > z + 0.001) ?? ZOOM_MAX
const zoomDown = (z) => [...ZOOMS].reverse().find((v) => v < z - 0.001) ?? ZOOM_MIN

/* What an empty document should say, per channel. Every one of these is a
   real state — a new design starts in it — and the artboard has to offer the
   way out rather than drawing an empty artefact. */
const EMPTY_STATE = {
  email: {
    title: 'Nothing on the artboard yet',
    note: 'A subject line on its own has nothing to open into.',
    action: 'Add a heading',
  },
  wa: {
    title: 'No message yet',
    note: 'A WhatsApp template needs a body before Meta will review it.',
    action: 'Write the body',
  },
  sms: {
    title: 'No message yet',
    note: 'One field, and every character in it is a line item.',
    action: 'Write the message',
  },
}

/**
 * Campaign studio.
 *
 * A design tool, and only a design tool: a library on the left, the artboard
 * in the middle, the properties of whatever is selected on the right. It
 * knows about documents, blocks, brand kits and the clients a message is
 * opened in — not about audiences, offers or budgets. What the message is
 * worth is somebody else's screen.
 */
export default function Studio() {
  const [params] = useSearchParams()
  const wanted = params.get('design')

  // One read of storage, shared by both pieces of state — two calls to
  // loadLibrary would seed twice and hand the two of them different rows.
  const [boot] = useState(() => {
    let lib = loadLibrary()
    // Deleting everything from the library screen must not leave the editor
    // with no document to hold what you type next.
    if (!lib.length) {
      lib = [newDesignRecord()]
      saveLibrary(lib)
    }
    const asked = wanted ? lib.find((d) => d.id === wanted) : null
    return { lib, first: asked || [...lib].sort((a, b) => b.updated - a.updated)[0] }
  })
  const [library, setLibrary] = useState(boot.lib)
  const [docId, setDocId] = useState(boot.first?.id)

  const opened = library.find((d) => d.id === docId) || library[0]
  const {
    state: design, set: setDesign, reset: resetDesign, undo, redo, canUndo, canRedo,
  } = useHistory(
    () => ({ doc: opened?.doc || blankDoc(), brand: opened?.brand || DEFAULT_BRAND }),
  )
  const { doc, brand } = design

  const [name, setName] = useState(opened?.name || 'Untitled design')
  const [state, setState] = useState(opened?.state || 'draft')
  const [channel, setChannel] = useState(opened?.channel || 'email')
  const [view, setView] = useState(DEFAULT_SURFACE[opened?.channel || 'email'])
  const [tab, setTab] = useState('layers')
  const [panelOpen, setPanelOpen] = useState(true)
  const [merged, setMerged] = useState(true)
  const [sampleId, setSampleId] = useState('typical')
  const [dark, setDark] = useState(false)
  const [zoom, setZoom] = useState(0.9)
  const [sel, setSel] = useState(null)
  const [adding, setAdding] = useState(null)
  const [drag, setDrag] = useState(null)
  const [savedAt, setSavedAt] = useState(() => Date.now())
  const caret = useRef(null)
  const flushRef = useRef(null)
  const stageRef = useRef(null)
  const artRef = useRef(null)

  const fields = (SAMPLE_SETS.find((s) => s.id === sampleId) || SAMPLE_SETS[0]).fields
  const tpl = doc[channel] || {}
  const isEmail = channel === 'email'
  const blocks = tpl.blocks || []
  const surfaces = surfacesFor(channel)
  const safeView = surfaces.some((s) => s.id === view) ? view : surfaces[0].id
  const surface = findSurface(safeView)
  const empty = docEmpty(channel, tpl)

  /* Whether the open document differs from the row it came from. Derived
     during render rather than set from an effect: opening a design hands the
     same references straight back, so identity is the whole test — and it is
     also what stops an open from shuffling the library. */
  const saved = library.find((d) => d.id === docId)
  const dirty = !!saved && !(
    saved.doc === doc && saved.brand === brand
    && saved.name === name && saved.state === state
  )

  /* ── the document persists into the library it came from ──────────── */
  useEffect(() => {
    if (!dirty) {
      flushRef.current = null
      return undefined
    }

    const write = () => {
      // `channel` is deliberately not written back: a design carries all three
      // channels, and flipping the preview must not relabel the row.
      const next = library.map((d) => (
        d.id === docId ? { ...d, name, state, doc, brand, updated: Date.now() } : d
      ))
      saveLibrary(next)
      setLibrary(next)
      setSavedAt(Date.now())
      flushRef.current = null
    }

    flushRef.current = write
    const t = setTimeout(write, 500)
    return () => clearTimeout(t)
  }, [dirty, docId, name, state, doc, brand, library])

  /* A debounce is a window in which the work is only in memory. Closing the
     tab inside it used to lose the last half-second of typing, so the pending
     write is flushed on the way out. */
  useEffect(() => {
    const flush = () => flushRef.current?.()
    const onHide = () => { if (document.visibilityState === 'hidden') flush() }
    window.addEventListener('pagehide', flush)
    document.addEventListener('visibilitychange', onHide)
    return () => {
      window.removeEventListener('pagehide', flush)
      document.removeEventListener('visibilitychange', onHide)
      // Leaving for the library screen is a navigation, not an unload.
      flush()
    }
  }, [])

  /* ── edits ───────────────────────────────────────────────────────── */
  const setDoc = useCallback((fn, key) => setDesign(
    (p) => ({ ...p, doc: fn(p.doc) }), key,
  ), [setDesign])

  const setBrand = useCallback((patch) => setDesign(
    (p) => ({ ...p, brand: { ...p.brand, ...patch } }), 'brand',
  ), [setDesign])

  const setField = (k, v, key) => setDoc(
    (d) => ({ ...d, [channel]: { ...d[channel], [k]: v } }), key,
  )
  const setBlocks = (fn, key) => setDoc(
    (d) => ({ ...d, email: { ...d.email, blocks: fn(d.email.blocks || []) } }), key,
  )
  const editBlock = (id, patch, key) => setBlocks(
    (bs) => bs.map((b) => (b.id === id ? { ...b, ...patch } : b)), key,
  )
  const dropBlock = (id) => { setBlocks((bs) => bs.filter((b) => b.id !== id)); setSel(null) }
  const moveBlock = (id, by) => setBlocks((bs) => {
    const i = bs.findIndex((b) => b.id === id)
    const to = i + by
    if (i < 0 || to < 0 || to >= bs.length) return bs
    const n = [...bs]
    ;[n[i], n[to]] = [n[to], n[i]]
    return n
  })
  /** Drop a block at a position, so you can build into the middle of a stack. */
  const addBlock = (type, at) => {
    const b = newBlock(type)
    setBlocks((bs) => {
      const n = [...bs]
      const here = at == null
        ? (sel ? bs.findIndex((x) => x.id === sel) + 1 || n.length : n.length)
        : at
      n.splice(here, 0, b)
      return n
    })
    setSel(b.id)
    setAdding(null)
    if (tab === 'blocks' || tab === 'assets') return
    setTab('layers')
  }
  const duplicate = (id) => setBlocks((bs) => {
    const i = bs.findIndex((b) => b.id === id)
    if (i < 0) return bs
    const n = [...bs]
    n.splice(i + 1, 0, reid(bs[i]))
    return n
  })
  /** Reorder by dropping one layer onto another. */
  const moveTo = (id, to) => setBlocks((bs) => {
    const from = bs.findIndex((b) => b.id === id)
    if (from < 0 || to < 0 || from === to) return bs
    const n = [...bs]
    const [item] = n.splice(from, 1)
    n.splice(from < to ? to - 1 : to, 0, item)
    return n
  })

  /* ── WhatsApp template buttons ────────────────────────────────────── */
  const setButtons = (fn) => setDoc((d) => ({
    ...d, wa: { ...d.wa, buttons: fn(d.wa.buttons || []) },
  }))
  const addButton = () => setButtons((bs) => (
    bs.length >= 3 ? bs : [...bs, { kind: bs.some((b) => b.kind === 'url') ? 'quick' : 'url', label: 'Learn more' }]
  ))
  const dropButton = (i) => { setButtons((bs) => bs.filter((_, x) => x !== i)); setSel(null) }
  const editButton = (i, patch, key) => setButtons(
    (bs) => bs.map((b, x) => (x === i ? { ...b, ...patch } : b)), key,
  )

  /* ── the library ─────────────────────────────────────────────────── */
  const openDesign = (d) => {
    setDocId(d.id)
    // A different document gets a history of its own — undo must not walk
    // back across the design you were in ten minutes ago.
    resetDesign({ doc: d.doc, brand: d.brand })
    setName(d.name)
    setState(d.state)
    setChannel(d.channel)
    setView(DEFAULT_SURFACE[d.channel])
    setSel(null)
  }

  /* The library screen is how you move between documents, so the editor has
     to follow the URL it sends you back with. */
  useEffect(() => {
    if (!wanted || wanted === docId) return
    const d = library.find((x) => x.id === wanted)
    if (d) openDesign(d)
    // openDesign and library are stable enough here: this only has to react to
    // the id in the address bar changing.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wanted])

  /** Applying a layout replaces the document — undo covers it. */
  const applyLayout = (l) => {
    setDesign((p) => ({ ...p, doc: l.doc() }))
    setSel(null)
    setTab('layers')
  }

  /* ── tokens ──────────────────────────────────────────────────────── */
  const noteCaret = (k, start, end) => { caret.current = { k, start, end } }

  const insertToken = (t) => {
    const tok = `{{${t}}}`
    const at = caret.current
    const splice = (cur, start, end) => cur.slice(0, start) + tok + cur.slice(end)

    const b = isEmail && at && blocks.find((x) => x.id === at.k)
    if (b) {
      editBlock(b.id, { text: splice(b.text ?? '', at.start, at.end) })
      const pos = at.start + tok.length
      caret.current = { k: b.id, start: pos, end: pos }
      return
    }

    if (typeof at?.k === 'string' && at.k.startsWith('btn:')) {
      const i = Number(at.k.slice(4))
      const cur = (tpl.buttons || [])[i]?.label ?? ''
      editButton(i, { label: splice(cur, at.start, at.end) })
      const pos = at.start + tok.length
      caret.current = { k: at.k, start: pos, end: pos }
      return
    }

    const k = TEXT_FIELDS.includes(at?.k) ? at.k : (isEmail ? 'subject' : 'body')
    const cur = tpl[k] ?? ''
    const here = at && at.k === k
    const start = here ? at.start : cur.length
    const end = here ? at.end : cur.length
    setField(k, splice(cur, start, end))
    const pos = start + tok.length
    caret.current = { k, start: pos, end: pos }
  }

  const block = sel && blocks.find((b) => b.id === sel)
  const btnIndex = typeof sel === 'string' && sel.startsWith('btn:') ? Number(sel.slice(4)) : null
  const button = btnIndex != null ? (tpl.buttons || [])[btnIndex] : null
  const textFieldSel = ['subject', 'preheader', 'body', 'header', 'footer'].includes(sel) ? sel : null
  const hasSelection = Boolean(block || button || textFieldSel)

  /* ── shortcuts a design tool is expected to have ──────────────────── */
  useEffect(() => {
    const onKey = (e) => {
      const el = e.target
      const typing = el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.tagName === 'SELECT')
      const mod = e.metaKey || e.ctrlKey

      if (mod && e.key.toLowerCase() === 'z') {
        e.preventDefault()
        if (e.shiftKey) redo(); else undo()
        return
      }
      if (e.key === 'Escape') {
        if (adding != null) { setAdding(null); return }
        if (typing) { el.blur(); return }
        setSel(null)
        return
      }
      if (typing) return

      if ((e.key === 'Delete' || e.key === 'Backspace') && block) {
        e.preventDefault(); dropBlock(block.id); return
      }
      if (mod && e.key.toLowerCase() === 'd' && block) {
        e.preventDefault(); duplicate(block.id); return
      }
      if (mod && (e.key === 'ArrowUp' || e.key === 'ArrowDown') && block) {
        e.preventDefault(); moveBlock(block.id, e.key === 'ArrowUp' ? -1 : 1); return
      }
      if (mod && (e.key === '=' || e.key === '+')) {
        e.preventDefault(); setZoom(zoomUp); return
      }
      if (mod && e.key === '-') {
        e.preventDefault(); setZoom(zoomDown); return
      }
      // Walk the stack without leaving the keyboard.
      if (!mod && (e.key === 'ArrowUp' || e.key === 'ArrowDown') && isEmail && blocks.length) {
        e.preventDefault()
        const i = blocks.findIndex((b) => b.id === sel)
        const next = e.key === 'ArrowUp' ? Math.max(0, i - 1) : Math.min(blocks.length - 1, i + 1)
        setSel(blocks[i < 0 ? 0 : next].id)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  const checks = useMemo(() => runChecks(doc, channel, brand), [doc, channel, brand])

  /**
   * Fit the artboard to the canvas.
   *
   * The desktop surfaces are a fixed 1,004px because a webmail client that
   * shrinks with the panel stops being one. On a laptop that is wider than
   * the canvas, so the zoom has to come to it.
   */
  const fitToWidth = () => {
    const stage = stageRef.current
    const art = artRef.current
    if (!stage || !art) return
    const room = stage.clientWidth - 48
    const natural = art.getBoundingClientRect().width / zoom
    if (!natural) return
    const ratio = Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, room / natural))
    setZoom(Math.round(ratio * 100) / 100)
  }

  const goSurface = (id) => {
    const s = findSurface(id)
    if (!s) return
    if (!s.channels.includes(channel)) setChannel(s.channels[0])
    setView(id)
  }

  const switchChannel = (id) => {
    setChannel(id)
    setView(DEFAULT_SURFACE[id])
    setSel(null)
  }

  return (
    <div className={styles.wrap} onClick={() => adding != null && setAdding(null)}>
      {/* ── Top chrome ── */}
      <header className={styles.top}>
        <div className={styles.topLeft}>
          <input
            className={styles.name}
            value={name}
            onChange={(e) => setName(e.target.value)}
            aria-label="Design name"
          />
        </div>

        <div className={styles.filters} role="group" aria-label="Preview filters">
          <label className={styles.sGroup}>
            <span className={styles.sGroupK}>Channel</span>
            <span className={styles.chan}>
              <span className={cx(styles.chanDot, styles[`ch_${channel}`])} aria-hidden="true" />
              <select
                className={styles.chanSelect}
                value={channel}
                onChange={(e) => switchChannel(e.target.value)}
                aria-label="Channel"
              >
                {CHANNELS.filter((c) => WRITTEN.includes(c.id)).map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </span>
          </label>

          {groupedFor(channel).map((g) => {
            const active = g.items.find((s) => s.id === safeView)
            return (
              <label key={g.group} className={styles.sGroup}>
                <span className={styles.sGroupK}>{g.group}</span>
                <select
                  className={styles.sSelect}
                  value={active ? active.id : g.items[0].id}
                  onChange={(e) => setView(e.target.value)}
                  aria-label={g.group}
                >
                  {g.items.map((s) => (
                    <option key={s.id} value={s.id} title={s.note}>{s.label}</option>
                  ))}
                </select>
              </label>
            )
          })}

          <label className={styles.sGroup}>
            <span className={styles.sGroupK}>Mode</span>
            <select
              className={styles.modeSelect}
              value={dark ? 'dark' : 'light'}
              onChange={(e) => setDark(e.target.value === 'dark')}
              disabled={!surface?.dark}
              title={surface?.dark ? 'Preview this client in dark mode' : 'This client has no dark mode worth checking'}
              aria-label="Dark mode preview"
            >
              <option value="light">Light</option>
              <option value="dark">Dark</option>
            </select>
          </label>
        </div>

        <div className={styles.topRight}>
          <span className={cx(styles.flag, checks.fails ? styles.flagFail : checks.warns ? styles.flagWarn : styles.flagOk)}>
            {checks.fails ? `${checks.fails} blocking` : checks.warns ? `${checks.warns} to look at` : 'Clear'}
          </span>
          <span className={styles.sep} aria-hidden="true" />
          <button
            type="button" className={styles.icon} onClick={undo} disabled={!canUndo}
            title="Undo (⌘Z)" aria-label="Undo"
          >
            <Undo2 size={15} strokeWidth={1.75} aria-hidden="true" />
          </button>
          <button
            type="button" className={styles.icon} onClick={redo} disabled={!canRedo}
            title="Redo (⇧⌘Z)" aria-label="Redo"
          >
            <Redo2 size={15} strokeWidth={1.75} aria-hidden="true" />
          </button>
        </div>
      </header>

      <div className={cx(styles.body, (!panelOpen || tab === 'layers') && styles.bodyTight)}>
        {/* ── Tab rail ── */}
        <nav className={styles.rail} aria-label="Studio panels">
          {TABS.map((t) => {
            const Icon = t.icon
            const on = tab === t.id && panelOpen
            return (
              <button
                key={t.id}
                type="button"
                className={cx(styles.railBtn, on && styles.railOn)}
                onClick={() => {
                  if (tab === t.id) setPanelOpen((v) => !v)
                  else { setTab(t.id); setPanelOpen(true) }
                }}
                title={t.label}
                aria-label={t.label}
                aria-pressed={on}
              >
                <Icon size={17} strokeWidth={1.7} aria-hidden="true" />
                {t.id === 'checks' && checks.fails > 0 && <i className={styles.railDot} aria-hidden="true" />}
                <span className={styles.railLabel}>{t.label}</span>
              </button>
            )
          })}
          <button
            type="button"
            className={cx(styles.railBtn, styles.railCollapse)}
            onClick={() => setPanelOpen((v) => !v)}
            title={panelOpen ? 'Hide the panel' : 'Show the panel'}
            aria-label={panelOpen ? 'Hide the panel' : 'Show the panel'}
          >
            <PanelLeftClose
              size={16} strokeWidth={1.7} aria-hidden="true"
              style={{ transform: panelOpen ? 'none' : 'rotate(180deg)' }}
            />
          </button>
        </nav>

        {/* ── Panel ──
            Layers moves to the right where properties usually sit — it is a
            navigation of the artboard, not a library, so it belongs next to
            what is on the artboard rather than in the tools rail. */}
        {panelOpen && tab !== 'layers' && (
          <aside className={styles.panel} aria-label="Studio panel">
            {tab === 'templates' && (
              <TemplatesPanel onApply={applyLayout} channel={channel} brand={brand} />
            )}
            {tab === 'blocks' && <BlocksPanel channel={channel} onAdd={(t) => addBlock(t)} />}
            {tab === 'brand' && <BrandPanel brand={brand} onSet={setBrand} />}
            {tab === 'assets' && (
              <AssetsPanel
                selectedImage={block?.type === 'image' ? block : null}
                onSetPreset={(p) => editBlock(block.id, { preset: p })}
                onInsertImage={(p) => {
                  const b = { ...newBlock('image'), preset: p }
                  setBlocks((bs) => [...bs, b])
                  setSel(b.id)
                }}
              />
            )}
            {tab === 'checks' && (
              <ChecksPanel doc={doc} channel={channel} brand={brand} onGo={goSurface} />
            )}
          </aside>
        )}

        {/* ── Canvas ── */}
        <div className={styles.canvas}>
          <div className={styles.canvasBar}>
            <div className={styles.canvasTools}>
              <button
                type="button" className={styles.icon}
                onClick={() => setZoom(zoomDown)}
                disabled={zoom <= ZOOM_MIN} title="Zoom out (⌘−)" aria-label="Zoom out"
              >
                <ZoomOut size={15} strokeWidth={1.75} aria-hidden="true" />
              </button>
              <button type="button" className={styles.zoomV} onClick={() => setZoom(0.9)} title="Reset zoom">
                {Math.round(zoom * 100)}%
              </button>
              <button
                type="button" className={styles.icon}
                onClick={() => setZoom(zoomUp)}
                disabled={zoom >= ZOOM_MAX} title="Zoom in (⌘+)" aria-label="Zoom in"
              >
                <ZoomIn size={15} strokeWidth={1.75} aria-hidden="true" />
              </button>
              <button
                type="button" className={styles.icon} onClick={fitToWidth}
                title="Fit to width" aria-label="Fit to width"
              >
                <Maximize2 size={14} strokeWidth={1.75} aria-hidden="true" />
              </button>
            </div>
          </div>

          <div
            className={styles.stage}
            onClick={() => setSel(null)}
            aria-label="Artboard"
            ref={stageRef}
          >
            <div className={styles.art} style={{ '--zoom': zoom }} ref={artRef}>
              <ChannelPreview
                channel={channel}
                tpl={tpl}
                fields={fields}
                merged={merged}
                view={safeView}
                brand={brand}
                dark={dark && !!surface?.dark}
                selected={sel}
                onSelect={isEmail ? setSel : undefined}
              />
            </div>
            {surface && (
              <p className={styles.caption}>
                <b>{surface.device}</b>
                {surface.note}
              </p>
            )}

            {/* A blank artboard needs a way back in, not a blank page — and
                the messaging channels get one too, rather than an empty
                bubble with a timestamp floating in it. */}
            {empty && (
              <div className={styles.startCard} onClick={(e) => e.stopPropagation()}>
                <b>{EMPTY_STATE[channel].title}</b>
                <i>{EMPTY_STATE[channel].note}</i>
                <span className={styles.startRow}>
                  <button type="button" className={styles.startPrimary} onClick={() => setTab('templates')}>
                    Start from a layout
                  </button>
                  <button
                    type="button"
                    className={styles.startGhost}
                    onClick={() => {
                      if (isEmail) { addBlock('heading'); return }
                      setTab('layers')
                      setSel('body')
                    }}
                  >
                    {EMPTY_STATE[channel].action}
                  </button>
                </span>
              </div>
            )}
          </div>
        </div>

        {/* ── Right column ──
            Properties whenever something is selected, otherwise Layers when its
            tab is on — so the same slot always shows the most relevant view of
            what is on the artboard. */}
        {hasSelection ? (
          <aside className={styles.props} aria-label="Properties">
            <Properties
              channel={channel}
              tpl={tpl}
              block={block}
              button={button}
              btnIndex={btnIndex}
              sel={sel}
              fields={fields}
              blocks={blocks}
              onEditBlock={editBlock}
              onEditButton={editButton}
              onDropBlock={dropBlock}
              onField={setField}
              onToken={insertToken}
              onCaret={noteCaret}
            />
          </aside>
        ) : tab === 'layers' && panelOpen ? (
          <aside className={styles.props} aria-label="Layers">
            <LayersPanel
              channel={channel}
              tpl={tpl}
              blocks={blocks}
              sel={sel}
              fields={merged ? fields : null}
              onSelect={setSel}
              onDuplicate={duplicate}
              onDelete={dropBlock}
              onMoveTo={moveTo}
              onAdd={addBlock}
              drag={drag}
              setDrag={setDrag}
              adding={adding}
              setAdding={setAdding}
              onAddButton={addButton}
              onDropButton={dropButton}
            />
          </aside>
        ) : null}
      </div>
    </div>
  )
}

/**
 * One labelled field in the properties panel.
 *
 * Hoisted out of `Properties` deliberately: a component declared inside a
 * render is a new type on every keystroke, React remounts the textarea, and
 * the caret jumps to the end of the line. It is the kind of bug that makes a
 * builder feel broken without ever throwing.
 */
function PropField({ label, value, rows = 3, onChange, k, limit, fields, onCaret }) {
  const merged = render(value || '', fields)
  return (
    <>
      <div className={styles.propK}>
        {label}
        {limit ? (
          <i className={cx(styles.count, merged.length > limit && styles.countOver)}>
            {merged.length}/{limit}
          </i>
        ) : null}
      </div>
      <textarea
        className={styles.input}
        rows={rows}
        value={value ?? ''}
        aria-label={label}
        onChange={(e) => onChange(e.target.value)}
        onFocus={(e) => onCaret(k, e.target.selectionStart, e.target.selectionEnd)}
        onClick={(e) => onCaret(k, e.target.selectionStart, e.target.selectionEnd)}
        onKeyUp={(e) => onCaret(k, e.target.selectionStart, e.target.selectionEnd)}
      />
    </>
  )
}

/** A small segmented control, for the properties that are a short list. */
function PropSeg({ label, options, value, onPick }) {
  return (
    <>
      <div className={styles.propK}>{label}</div>
      <div className={styles.segs}>
        {options.map((o) => (
          <button
            key={o.id}
            type="button"
            className={cx(styles.seg, value === o.id && styles.segOn)}
            onClick={() => onPick(o.id)}
            aria-pressed={value === o.id}
          >
            {o.label}
          </button>
        ))}
      </div>
    </>
  )
}

/* ── Properties ─────────────────────────────────────────────────────────
   Whatever is selected, and only what applies to it. A text block has copy
   and an alignment; a countdown has a date; a WhatsApp button has a kind and
   a twenty-character label. Showing all of it at once would be a form, and a
   form is what this screen is trying not to be. */
function Properties({
  channel, tpl, block, button, btnIndex, sel, fields, blocks,
  onEditBlock, onEditButton, onDropBlock, onField, onToken, onCaret,
}) {
  const isEmail = channel === 'email'
  const textField = ['subject', 'preheader', 'body', 'header', 'footer'].includes(sel) ? sel : null
  const editing = block || button || textField

  if (!editing) return null

  return (
    <>
      <div className={styles.propK}>
        {block ? kindOf(block.type)?.label
          : button ? `Button ${btnIndex + 1}`
            : sel === 'subject' ? 'Subject line'
              : sel === 'preheader' ? 'Preheader'
                : sel === 'header' ? 'Template header'
                  : sel === 'footer' ? 'Template footer' : 'Message'}
        {block && (
          <button
            type="button" className={styles.mini}
            onClick={() => onDropBlock(block.id)} aria-label="Delete layer" title="Delete (⌫)"
          >
            <Trash2 size={12} strokeWidth={1.75} aria-hidden="true" />
          </button>
        )}
      </div>

      {/* ── The subject line, against every client that cuts it ──────── */}
      {sel === 'subject' && (
        <>
          <PropField fields={fields} onCaret={onCaret}
            label="Copy" value={tpl.subject} rows={3} k="subject"
            onChange={(v) => onField('subject', v, 'subject')}
          />
          <div className={styles.propK}>Where it gets cut</div>
          <div className={styles.cuts}>
            {SUBJECT_CUTS.map(([who, n]) => {
              const len = render(tpl.subject || '', fields).length
              const over = len > n
              return (
                <div key={who} className={styles.cut}>
                  <span className={styles.cutK}>{who}</span>
                  <span className={styles.cutBar}>
                    <i style={{ width: `${Math.min(100, (len / n) * 100)}%` }} className={over ? styles.cutOver : ''} />
                  </span>
                  <span className={cx(styles.cutV, over && styles.cutVOver)}>
                    {over ? `−${len - n}` : `${n - len} left`}
                  </span>
                </div>
              )
            })}
          </div>
        </>
      )}

      {sel === 'preheader' && (
        <>
          <PropField fields={fields} onCaret={onCaret}
            label="Copy" value={tpl.preheader} rows={3} k="preheader" limit={90}
            onChange={(v) => onField('preheader', v, 'preheader')}
          />
          <p className={styles.hint}>
            The line Gmail shows after the subject. Left empty, it improvises one
            from the first text in the email — usually the legal line.
          </p>
        </>
      )}

      {(sel === 'header' || sel === 'footer') && (
        <PropField fields={fields} onCaret={onCaret}
          label="Copy" value={tpl[sel]} rows={sel === 'header' ? 2 : 3} k={sel}
          limit={WA_LIMIT[sel]}
          onChange={(v) => onField(sel, v, sel)}
        />
      )}

      {sel === 'body' && (
        <PropField fields={fields} onCaret={onCaret}
          label="Copy" value={tpl.body} rows={9} k="body"
          limit={channel === 'wa' ? WA_LIMIT.body : null}
          onChange={(v) => onField('body', v, 'body')}
        />
      )}

      {/* ── WhatsApp buttons ─────────────────────────────────────────── */}
      {button && (
        <>
          <PropSeg
            label="Kind"
            options={[
              { id: 'url', label: 'Link' }, { id: 'call', label: 'Call' }, { id: 'quick', label: 'Reply' },
            ]}
            value={button.kind}
            onPick={(v) => onEditButton(btnIndex, { kind: v })}
          />
          <PropField fields={fields} onCaret={onCaret}
            label="Label" value={button.label} rows={2} k={`btn:${btnIndex}`} limit={20}
            onChange={(v) => onEditButton(btnIndex, { label: v }, `btn:${btnIndex}`)}
          />
          <p className={styles.hint}>
            A template carries at most one link button, one call button and three
            quick replies. Twenty characters each, counted after the merge.
          </p>
        </>
      )}

      {/* ── Blocks ───────────────────────────────────────────────────── */}
      {block?.type === 'image' && (
        <p className={styles.hint}>Pick the artwork in the Assets panel.</p>
      )}
      {block?.type === 'image' && (
        <>
          <PropSeg
            label="Height"
            options={[{ id: 'sm', label: 'S' }, { id: 'md', label: 'M' }, { id: 'lg', label: 'L' }]}
            value={block.height || 'md'}
            onPick={(v) => onEditBlock(block.id, { height: v })}
          />
          <PropField fields={fields} onCaret={onCaret}
            label="Alt text" value={block.alt} rows={2} k={block.id}
            onChange={(v) => onEditBlock(block.id, { alt: v }, `alt:${block.id}`)}
          />
        </>
      )}

      {block && ['heading', 'text', 'button', 'link', 'legal', 'countdown'].includes(block.type) && (
        <PropField fields={fields} onCaret={onCaret}
          label="Copy" value={block.text} rows={block.type === 'text' ? 7 : 3} k={block.id}
          onChange={(v) => onEditBlock(block.id, { text: v }, `b:${block.id}`)}
        />
      )}

      {block?.type === 'logo' && (
        <>
          <PropField fields={fields} onCaret={onCaret} label="Name" value={block.text} rows={2} k={block.id}
            onChange={(v) => onEditBlock(block.id, { text: v }, `b:${block.id}`)} />
          <PropField fields={fields} onCaret={onCaret} label="Line under it" value={block.sub} rows={2} k={block.id}
            onChange={(v) => onEditBlock(block.id, { sub: v }, `sub:${block.id}`)} />
        </>
      )}

      {block?.type === 'stat' && (
        <>
          <PropField fields={fields} onCaret={onCaret} label="The number" value={block.text} rows={2} k={block.id}
            onChange={(v) => onEditBlock(block.id, { text: v }, `b:${block.id}`)} />
          <PropField fields={fields} onCaret={onCaret} label="What it is" value={block.sub} rows={2} k={block.id}
            onChange={(v) => onEditBlock(block.id, { sub: v }, `sub:${block.id}`)} />
        </>
      )}

      {block?.type === 'offer' && (
        <>
          <PropField fields={fields} onCaret={onCaret} label="Offer" value={block.text} rows={2} k={block.id}
            onChange={(v) => onEditBlock(block.id, { text: v }, `b:${block.id}`)} />
          <PropField fields={fields} onCaret={onCaret} label="Detail" value={block.sub} rows={2} k={block.id}
            onChange={(v) => onEditBlock(block.id, { sub: v }, `sub:${block.id}`)} />
          <PropField fields={fields} onCaret={onCaret} label="Expiry tag" value={block.meta} rows={2} k={block.id}
            onChange={(v) => onEditBlock(block.id, { meta: v }, `meta:${block.id}`)} />
        </>
      )}

      {block?.type === 'countdown' && (
        <>
          <div className={styles.propK}>Days left <i className={styles.count}>{block.days ?? 14}</i></div>
          <input
            className={styles.range}
            type="range" min="1" max="60" value={block.days ?? 14}
            onChange={(e) => onEditBlock(block.id, { days: Number(e.target.value) }, `days:${block.id}`)}
            aria-label="Days remaining"
          />
        </>
      )}

      {block?.type === 'bullets' && (
        <>
          <div className={styles.propK}>Items</div>
          {(block.items || []).map((it, i) => (
            <div key={i} className={styles.itemRow}>
              <textarea
                className={styles.input}
                rows={2}
                aria-label={`Item ${i + 1}`}
                value={it}
                onChange={(e) => onEditBlock(block.id, {
                  items: block.items.map((x, ix) => (ix === i ? e.target.value : x)),
                }, `bul:${block.id}:${i}`)}
              />
              <button
                type="button" className={styles.mini}
                onClick={() => onEditBlock(block.id, { items: block.items.filter((_, ix) => ix !== i) })}
                aria-label={`Remove item ${i + 1}`}
              >
                <Trash2 size={11} strokeWidth={1.75} aria-hidden="true" />
              </button>
            </div>
          ))}
          <button
            type="button" className={styles.addItem}
            onClick={() => onEditBlock(block.id, { items: [...(block.items || []), 'One more thing'] })}
          >
            Add an item
          </button>
        </>
      )}

      {block?.type === 'columns' && (
        <>
          <PropField fields={fields} onCaret={onCaret} label="Left" value={block.left} rows={4} k={block.id}
            onChange={(v) => onEditBlock(block.id, { left: v }, `l:${block.id}`)} />
          <PropField fields={fields} onCaret={onCaret} label="Right" value={block.right} rows={4} k={block.id}
            onChange={(v) => onEditBlock(block.id, { right: v }, `r:${block.id}`)} />
          <p className={styles.hint}>First line is the heading; everything after it is the copy.</p>
        </>
      )}

      {block?.type === 'spacer' && (
        <PropSeg
          label="Size"
          options={SPACE_SIZES}
          value={block.size || 'md'}
          onPick={(v) => onEditBlock(block.id, { size: v })}
        />
      )}

      {block?.type === 'button' && (
        <PropSeg
          label="Style"
          options={[{ id: 'solid', label: 'Solid' }, { id: 'outline', label: 'Outline' }]}
          value={block.style || 'solid'}
          onPick={(v) => onEditBlock(block.id, { style: v })}
        />
      )}

      {block?.type === 'heading' && (
        <PropSeg
          label="Size"
          options={[{ id: 'sm', label: 'S' }, { id: 'md', label: 'M' }, { id: 'lg', label: 'L' }]}
          value={block.size || 'lg'}
          onPick={(v) => onEditBlock(block.id, { size: v })}
        />
      )}

      {block && ['logo', 'heading', 'text', 'stat', 'button', 'link'].includes(block.type) && (
        <PropSeg
          label="Align"
          options={ALIGNMENTS}
          value={block.align || (block.type === 'stat' ? 'center' : 'left')}
          onPick={(v) => onEditBlock(block.id, { align: v })}
        />
      )}

      {/* Tokens go wherever the caret last was. */}
      {(block?.text != null || textField) && (
        <>
          <div className={styles.propK}>Insert a field</div>
          <div className={styles.tokens}>
            {Object.keys(fields).map((k) => (
              <button
                key={k} type="button" className={styles.token}
                onClick={() => onToken(k)} title={fields[k]}
              >
                {k}
              </button>
            ))}
          </div>
        </>
      )}

      {/* Length is a property of the artefact, not of a campaign. */}
      {channel === 'sms' && <SmsMeter text={render(tpl.body || '', fields)} />}
    </>
  )
}

/** What an SMS actually bills, drawn as a meter against its own boundary. */
function SmsMeter({ text }) {
  const p = smsParts(text)
  const filled = p.units % p.perPart || (p.units ? p.perPart : 0)
  return (
    <div className={styles.meter}>
      <div className={styles.meterTop}>
        <span className={styles.meterV}>{p.parts}</span>
        <span className={styles.meterK}>
          {p.parts === 1 ? 'segment' : 'segments'}
          <br />{p.units} of {p.capacity} · {p.encoding}
        </span>
      </div>
      <div className={styles.meterBar}>
        <i style={{ width: `${Math.min(100, (filled / p.perPart) * 100)}%` }} />
      </div>
      {p.ucs2 && (
        <p className={styles.meterWarn}>
          <TriangleAlert size={11} strokeWidth={2.2} aria-hidden="true" />
          {p.offenders.slice(0, 3).join(' ')} dropped this to UCS-2 — 70 characters a segment, not 160.
        </p>
      )}
    </div>
  )
}
