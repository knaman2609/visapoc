import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Copy, Plus, Search, Star, Trash2, Check } from 'lucide-react'
import DesignThumb from '../../components/studio/panels/DesignThumb.jsx'
import {
  SORTS, ago, findState, loadLibrary, newId, saveLibrary, sortDesigns,
} from '../../data/designs.js'
import { designCovers, CHANNEL_NAME } from '../../data/studioBridge.js'
import { fmtIN } from '../../data/portfolio.js'
import styles from './SavedDesigns.module.css'

const cx = (...c) => c.filter(Boolean).join(' ')
const pct = (n) => (n == null ? '—' : `${(n * 100).toFixed(1)}%`)

const FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'wa', label: 'WhatsApp' },
  { id: 'email', label: 'Email' },
  { id: 'sms', label: 'SMS' },
]

/**
 * Saved designs.
 *
 * The library used to live in a 236px rail beside the artboard, which is a
 * fine place to switch documents and a poor one to judge them. On its own
 * screen a design can be shown at a size worth looking at, next to the two
 * facts that decide whether it is worth reusing: where it ran and what it did.
 */
export default function SavedDesigns() {
  const navigate = useNavigate()
  const [library, setLibrary] = useState(loadLibrary)
  const [q, setQ] = useState('')
  const [filter, setFilter] = useState('all')
  const [sort, setSort] = useState('recent')
  const [confirm, setConfirm] = useState(null)

  const write = (next) => { saveLibrary(next); setLibrary(next) }

  const rows = useMemo(() => {
    const needle = q.trim().toLowerCase()
    let list = library.filter((d) => (
      !needle
      || d.name.toLowerCase().includes(needle)
      || (d.campaign || '').toLowerCase().includes(needle)
      || d.tags.some((t) => t.includes(needle))
    ))
    if (filter !== 'all') list = list.filter((d) => designCovers(d.doc).includes(filter))
    return sortDesigns(list, sort)
  }, [library, q, filter, sort])

  const open = (d) => navigate(`/pm/studio?design=${d.id}`)

  const duplicate = (d) => {
    const record = {
      ...d, id: newId(), name: `${d.name} copy`, state: 'draft',
      stats: null, campaign: null, starred: false, updated: Date.now(),
    }
    write([record, ...library])
  }

  const shipped = library.filter((d) => d.stats)
  const reach = shipped.reduce((n, d) => n + d.stats.sends, 0)

  return (
    <div className={styles.wrap}>
      <header className={styles.head}>
        <div>
          <div className={styles.kicker}>Campaign studio</div>
          <h1 className={styles.title}>Saved designs</h1>
          <p className={styles.note}>
            Every creative the team has made, and what it did once it went out.
            Open one to keep working on it, or reuse it on a campaign from the
            communication step.
          </p>
        </div>
        <button
          type="button"
          className={styles.new}
          onClick={() => navigate('/pm/studio/new')}
          aria-label="Start a new design"
        >
          <Plus size={14} strokeWidth={2.6} aria-hidden="true" /> New design
        </button>
      </header>

      <div className={styles.stats}>
        <div><dt>Designs</dt><dd>{library.length}</dd></div>
        <div><dt>Shipped</dt><dd>{shipped.length}</dd></div>
        <div><dt>Reach</dt><dd>{fmtIN(reach)}</dd></div>
        <div>
          <dt>Best click rate</dt>
          <dd>{pct(shipped.reduce((n, d) => Math.max(n, d.stats.clickPct || 0), 0))}</dd>
        </div>
      </div>

      <div className={styles.tools}>
        <span className={styles.search}>
          <Search size={14} strokeWidth={2} aria-hidden="true" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search designs, campaigns and tags"
            aria-label="Search designs"
          />
        </span>
        <div className={styles.chips}>
          {FILTERS.map((f) => (
            <button
              key={f.id}
              type="button"
              className={cx(styles.chip, filter === f.id && styles.chipOn)}
              onClick={() => setFilter(f.id)}
              aria-pressed={filter === f.id}
            >
              {f.label}
            </button>
          ))}
        </div>
        <label className={styles.sort}>
          Sort
          <select value={sort} onChange={(e) => setSort(e.target.value)} aria-label="Sort designs">
            {SORTS.map((o) => <option key={o.id} value={o.id}>{o.label}</option>)}
          </select>
        </label>
      </div>

      {rows.length === 0 ? (
        <div className={styles.empty}>
          <p>{q ? `Nothing matches “${q}”.` : 'Nothing saved under this filter yet.'}</p>
          <button type="button" className={styles.new} onClick={() => navigate('/pm/studio/new')}>
            <Plus size={14} strokeWidth={2.6} aria-hidden="true" /> Start a design
          </button>
        </div>
      ) : (
        <ul className={styles.list} role="list">
          {rows.map((d) => {
            const state = findState(d.state)
            const covers = designCovers(d.doc)
            return (
              <li key={d.id} className={styles.row}>
                <button
                  type="button"
                  className={styles.hit}
                  onClick={() => open(d)}
                  aria-label={`Open ${d.name.trim() || 'Untitled design'}`}
                >
                  <span className={styles.thumb}>
                    <DesignThumb doc={d.doc} channel={d.channel} brand={d.brand} width={112} height={72} />
                  </span>
                  <span className={styles.main}>
                    <span className={styles.name}>
                      {d.name.trim() || <i className={styles.untitled}>Untitled design</i>}
                    </span>
                    <span className={styles.meta}>
                      <i className={cx(styles.state, styles[`st_${state.tone}`])}>{state.label}</i>
                      <span className={styles.where}>{d.campaign || 'Not on a campaign'}</span>
                    </span>
                  </span>
                  <span className={styles.covers}>
                    {covers.map((c) => <i key={c}>{CHANNEL_NAME[c]}</i>)}
                  </span>
                  <span className={styles.stat}>
                    {d.stats ? (
                      <>
                        <b>{pct(d.stats.clickPct)}</b>
                        <span>click on {fmtIN(d.stats.sends)}</span>
                      </>
                    ) : <em>Never sent</em>}
                  </span>
                  <span className={styles.when}>{ago(d.updated)}</span>
                </button>

                <span className={styles.tools2}>
                  <button
                    type="button"
                    className={cx(styles.mini, d.starred && styles.miniOn)}
                    onClick={() => write(library.map((x) => (
                      x.id === d.id ? { ...x, starred: !x.starred } : x
                    )))}
                    aria-label={d.starred ? 'Unstar' : 'Star'}
                  >
                    <Star size={12} strokeWidth={2} fill={d.starred ? 'currentColor' : 'none'} aria-hidden="true" />
                  </button>
                  <button
                    type="button" className={styles.mini}
                    onClick={() => duplicate(d)} aria-label="Duplicate"
                  >
                    <Copy size={12} strokeWidth={2} aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    className={cx(styles.mini, confirm === d.id && styles.miniDanger)}
                    onClick={() => (confirm === d.id
                      ? (write(library.filter((x) => x.id !== d.id)), setConfirm(null))
                      : setConfirm(d.id))}
                    onBlur={() => setConfirm((c) => (c === d.id ? null : c))}
                    aria-label={confirm === d.id ? 'Confirm delete' : 'Delete'}
                    title={confirm === d.id ? 'Click again to delete' : 'Delete'}
                  >
                    {confirm === d.id
                      ? <Check size={12} strokeWidth={2.6} aria-hidden="true" />
                      : <Trash2 size={12} strokeWidth={2} aria-hidden="true" />}
                  </button>
                </span>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
