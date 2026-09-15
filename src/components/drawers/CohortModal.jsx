import { useCallback, useDeferredValue, useEffect, useMemo, useState } from 'react'
import { COHORT_TOTAL, crore, roi } from '../../data/cohorts.js'
import {
  PROFIT_TIERS, RISK_TIERS, getCohortStats, getPopulation, gridCell, profitTier, riskTier,
} from '../../data/population.js'
import { fmtIN } from '../../data/portfolio.js'
import { useVirtualRows } from '../../state/useVirtualRows.js'
import ProfileGrid from './ProfileGrid.jsx'
import styles from './CohortModal.module.css'

const RISK_ROWS = RISK_TIERS.map((t) => t.label)

const ROW_H = 64

const SORTS = [
  { id: 'risk', label: 'Risk', cmp: (a, b) => b.risk - a.risk || b.profit - a.profit },
  { id: 'profit', label: 'Profit', cmp: (a, b) => b.profit - a.profit || b.risk - a.risk },
  { id: 'tenure', label: 'Tenure', cmp: (a, b) => b.months - a.months },
  { id: 'name', label: 'Name', cmp: (a, b) => a.name.localeCompare(b.name) },
]

const CHANNEL = { wa: 'WhatsApp', email: 'Email', sms: 'SMS' }

export default function CohortModal({ cohort, excluded, onToggle, onClose }) {
  const [query, setQuery] = useState('')
  const [riskOn, setRiskOn] = useState(() => new Set())
  const [profitOn, setProfitOn] = useState(() => new Set())
  const [sort, setSort] = useState('risk')
  const [pickedId, setPickedId] = useState(null)

  const search = useDeferredValue(query)

  const all = useMemo(() => getPopulation(cohort), [cohort])
  const stats = useMemo(() => getCohortStats(cohort), [cohort])

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase()
    const out = []
    for (const m of all) {
      if (riskOn.size && !riskOn.has(riskTier(m.risk).id)) continue
      if (profitOn.size && !profitOn.has(profitTier(m.profit).id)) continue
      if (q && !(
        m.name.toLowerCase().includes(q)
        || m.city.toLowerCase().includes(q)
        || m.tier.toLowerCase().includes(q)
        || m.signals.some((s) => s.toLowerCase().includes(q))
      )) continue
      out.push(m)
    }
    return out.sort(SORTS.find((s) => s.id === sort).cmp)
  }, [all, search, riskOn, profitOn, sort])

  const index = useMemo(() => {
    const i = rows.findIndex((m) => m.id === pickedId)
    return i === -1 ? 0 : i
  }, [rows, pickedId])
  const picked = rows[index] || null

  const {
    ref: scrollRef, onScroll, start, end, padTop, totalHeight, scrollToTop, scrollToIndex,
  } = useVirtualRows({ count: rows.length, rowHeight: ROW_H })

  // A new filter is a new list — start it at the top rather than mid-scroll.
  useEffect(() => { scrollToTop() }, [search, riskOn, profitOn, sort, scrollToTop])

  const move = useCallback((delta) => {
    const next = rows[Math.max(0, Math.min(rows.length - 1, index + delta))]
    if (!next) return
    setPickedId(next.id)
    scrollToIndex(rows.indexOf(next))
  }, [rows, index, scrollToIndex])

  useEffect(() => {
    const h = (e) => {
      if (e.key === 'Escape') { onClose(); return }
      // Arrows walk the list, but not while the caret is in the search box.
      if (e.target instanceof HTMLInputElement) return
      if (e.key === 'ArrowDown') { e.preventDefault(); move(1) }
      else if (e.key === 'ArrowUp') { e.preventDefault(); move(-1) }
    }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [onClose, move])

  const toggle = (put) => (id) => put((prev) => {
    const next = new Set(prev)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    return next
  })

  const filtered = rows.length !== all.length
  const share = Math.round((cohort.count / COHORT_TOTAL) * 100)
  const lead = cohort.interventions[0]

  return (
    <div className={styles.overlay} role="dialog" aria-modal="true" aria-label={`${cohort.label} cohort`}>
      <div className={styles.backdrop} onClick={onClose} />

      <div className={styles.panel}>
        {/* ── Identity ─────────────────────────────────────────────── */}
        <header className={styles.head}>
          <div className={`${styles.tag} ${styles[`tag_${cohort.band}`]}`}>{cohort.tag}</div>
          <div className={styles.headText}>
            <h2 className={styles.headTitle}>{cohort.label}</h2>
            <div className={styles.headSub}>{cohort.line}</div>
          </div>
          {excluded && <span className={styles.exclFlag}>Excluded from the campaign</span>}
          <button type="button" className={styles.close} onClick={onClose} aria-label="Close">✕</button>
        </header>

        {/* ── What this cohort is worth ────────────────────────────── */}
        <div className={styles.stats}>
          <Stat k="Cardholders" v={fmtIN(cohort.count)} sub={`${share}% of the at-risk group`} />
          <Stat
            k="Average attrition risk"
            v={Math.round(stats.avgRisk)}
            sub={riskTier(stats.avgRisk).label.toLowerCase()}
            tone={toneOf(stats.avgRisk)}
          />
          <Stat k="Annual profit at stake" v={crore(stats.profitCr)} sub={`₹${fmtIN(stats.avgProfit)} average`} />
          <Stat k="Leading intervention" v={roi(lead.roiX)} sub={`${lead.name} · ${crore(lead.investCr)}`} wide />
        </div>

        <div className={styles.why}>
          <span className={styles.whyKick}>Why this cohort exists</span>
          {cohort.why}
        </div>

        {/* ── Risk mix, doubling as a filter ───────────────────────── */}
        <div className={styles.mix}>
          <div className={styles.mixBar}>
            {RISK_TIERS.map((t) => {
              const n = stats.riskBands[t.id]
              const pct = (n / stats.count) * 100
              if (!n) return null
              return (
                <button
                  key={t.id}
                  type="button"
                  style={{ width: `${pct}%` }}
                  className={`${styles.mixSeg} ${styles[`seg_${t.id}`]} ${riskOn.size && !riskOn.has(t.id) ? styles.segDim : ''}`}
                  onClick={() => toggle(setRiskOn)(t.id)}
                  aria-pressed={riskOn.has(t.id)}
                  title={`${t.label} · ${fmtIN(n)} cardholders`}
                >
                  {pct > 9 && <span className={styles.mixLabel}>{t.label} · {Math.round(pct)}%</span>}
                </button>
              )
            })}
          </div>
        </div>

        {/* ── Controls ─────────────────────────────────────────────── */}
        <div className={styles.controls}>
          <div className={styles.searchWrap}>
            <span className={styles.searchIcon} aria-hidden="true">⌕</span>
            <input
              type="search"
              className={styles.search}
              placeholder={`Search ${fmtIN(cohort.count)} cardholders by name, city, card or signal…`}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>

          <div className={styles.chipRow}>
            {RISK_TIERS.map((t) => (
              <Chip
                key={t.id}
                on={riskOn.has(t.id)}
                tone={t.id}
                onClick={() => toggle(setRiskOn)(t.id)}
                label={t.label}
                n={stats.riskBands[t.id]}
              />
            ))}
            <span className={styles.divider} aria-hidden="true" />
            {PROFIT_TIERS.map((t) => (
              <Chip
                key={t.id}
                on={profitOn.has(t.id)}
                onClick={() => toggle(setProfitOn)(t.id)}
                label={t.flat || t.label}
                n={stats.profitBands[t.id]}
              />
            ))}
            {(riskOn.size > 0 || profitOn.size > 0 || query) && (
              <button
                type="button"
                className={styles.clear}
                onClick={() => { setRiskOn(new Set()); setProfitOn(new Set()); setQuery('') }}
              >
                Clear filters
              </button>
            )}
          </div>
        </div>

        {/* ── Population ───────────────────────────────────────────── */}
        <div className={styles.body}>
          <div className={styles.listCol}>
            <div className={styles.listBar}>
              <span className={styles.listCount}>
                {filtered
                  ? <><b>{fmtIN(rows.length)}</b> of {fmtIN(all.length)} cardholders</>
                  : <>All <b>{fmtIN(all.length)}</b> cardholders</>}
              </span>
              <span className={styles.sortGroup}>
                <span className={styles.sortK}>Sort</span>
                {SORTS.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    className={`${styles.sortBtn} ${sort === s.id ? styles.sortOn : ''}`}
                    onClick={() => setSort(s.id)}
                    aria-pressed={sort === s.id}
                  >
                    {s.label}
                  </button>
                ))}
              </span>
            </div>

            <div className={styles.colHead}>
              <span>Cardholder</span>
              <span className={styles.colSig}>Signals</span>
              <span className={styles.colNum}>Annual profit</span>
              <span className={styles.colNum}>Risk</span>
            </div>

            <div className={styles.scroller} ref={scrollRef} onScroll={onScroll}>
              <div className={styles.spacer} style={{ height: totalHeight }}>
                <div style={{ transform: `translateY(${padTop}px)` }}>
                  {rows.slice(start, end).map((m) => (
                    <Row
                      key={m.id}
                      m={m}
                      on={picked?.id === m.id}
                      onPick={() => setPickedId(m.id)}
                    />
                  ))}
                </div>
              </div>

              {rows.length === 0 && (
                <div className={styles.empty}>
                  No cardholder in this cohort matches those filters.
                </div>
              )}
            </div>
          </div>

          <aside className={styles.detail}>
            {picked
              ? (
                <Detail
                  m={picked}
                  cohort={cohort}
                  all={all}
                  stats={stats}
                  rank={index + 1}
                  total={rows.length}
                />
              )
              : <div className={styles.detailEmpty}>Nothing selected.</div>}
          </aside>
        </div>

        {/* ── Decision ─────────────────────────────────────────────── */}
        <footer className={styles.foot}>
          <div className={styles.footNote}>
            {cohort.interventions.length} interventions ranked for this cohort · leading one is{' '}
            <b>{lead.name}</b> at {roi(lead.roiX)} on {crore(lead.investCr)}
          </div>
          <button
            type="button"
            className={excluded ? styles.excl : styles.incl}
            onClick={onToggle}
            aria-pressed={!excluded}
          >
            {excluded ? '✕ Excluded from the campaign' : '✓ Included in the campaign'}
          </button>
        </footer>
      </div>
    </div>
  )
}

/* ── Pieces ───────────────────────────────────────────────────────── */

function Stat({ k, v, sub, tone, wide }) {
  return (
    <div className={`${styles.stat} ${wide ? styles.statWide : ''}`}>
      <div className={styles.statK}>{k}</div>
      <div className={`${styles.statV} ${tone ? styles[`tone_${tone}`] : ''}`}>{v}</div>
      <div className={styles.statSub}>{sub}</div>
    </div>
  )
}

function Chip({ on, tone, label, n, onClick }) {
  return (
    <button
      type="button"
      className={`${styles.chip} ${on ? styles.chipOn : ''} ${tone ? styles[`chip_${tone}`] : ''}`}
      onClick={onClick}
      aria-pressed={on}
    >
      {tone && <span className={styles.chipDot} aria-hidden="true" />}
      {label}
      <span className={styles.chipN}>{fmtIN(n)}</span>
    </button>
  )
}

function Row({ m, on, onPick }) {
  const t = riskTier(m.risk)
  return (
    <button
      type="button"
      className={`${styles.row} ${on ? styles.rowOn : ''}`}
      style={{ height: ROW_H }}
      onClick={onPick}
      aria-current={on}
    >
      <span className={`${styles.rail} ${styles[`rail_${t.id}`]}`} aria-hidden="true" />

      <span className={styles.who}>
        <span className={`${styles.avatar} ${styles[`av_${t.id}`]}`} aria-hidden="true">{initials(m.name)}</span>
        <span className={styles.whoText}>
          <span className={styles.name}>
            {m.name}
            {m.featured && <span className={styles.flag} title="Hand-reviewed by the agent">◆</span>}
          </span>
          <span className={styles.meta}>{m.age} · {m.city} · {m.tier} · {m.tenure}</span>
        </span>
      </span>

      <span className={styles.sig}>
        {m.signals.slice(0, 2).map((s) => (
          <span key={s} className={styles.sigChip}>{s}</span>
        ))}
      </span>

      <span className={`${styles.profit} ${styles[`p_${profitTier(m.profit).id}`]}`}>
        ₹{fmtIN(m.profit)}
      </span>

      <span className={styles.riskCell}>
        <span className={styles.riskTrack}>
          <span className={`${styles.riskFill} ${styles[`fill_${t.id}`]}`} style={{ width: `${m.risk}%` }} />
        </span>
        <span className={`${styles.riskNum} ${styles[`num_${t.id}`]}`}>{m.risk}</span>
      </span>
    </button>
  )
}

function Detail({ m, cohort, all, stats, rank, total }) {
  const t = riskTier(m.risk)

  // Where this cardholder sits in the cohort by annual contribution.
  const pct = useMemo(() => {
    let below = 0
    for (const x of all) if (x.profit < m.profit) below++
    return Math.round((below / all.length) * 100)
  }, [all, m.profit])

  return (
    <div className={styles.card} key={m.id}>
      <div className={styles.cardHead}>
        <span className={`${styles.avatarLg} ${styles[`av_${t.id}`]}`} aria-hidden="true">{initials(m.name)}</span>
        <div>
          <div className={styles.cardName}>{m.name}</div>
          <div className={styles.cardMeta}>{m.age} · {m.city}</div>
        </div>
      </div>

      <section className={styles.blockTight}>
        <div className={styles.blockK}>Why they are at risk</div>
        <div className={styles.sigChips}>
          {m.signals.map((s) => <span key={s} className={styles.sigChipLg}>{s}</span>)}
        </div>
      </section>

      <div className={styles.cardFacts}>
        <Fact k="Card" v={m.tier} />
        <Fact k="Tenure" v={m.tenure} />
        <Fact k="Last seen" v={`${m.lastSeen}d ago`} />
      </div>

      <section className={`${styles.block} ${styles.blockOk}`}>
        <div className={`${styles.blockK} ${styles.blockKOk}`}>What the campaign does for them</div>
        <p className={styles.fix}>{m.fix}</p>
      </section>

      <section className={styles.block}>
        <div className={styles.blockK}>Tagged in the risk × profitability grid</div>
        <ProfileGrid
          compact
          cell={gridCell(m)}
          initials={initials(m.name)}
          rowLabels={RISK_ROWS}
          counts={stats.grid}
        />
        <div className={styles.gridNote}>
          Where this cardholder sits, against the {fmtIN(stats.count)} in the cohort.
        </div>
      </section>

      <div className={styles.gauge}>
        <div className={styles.gaugeTop}>
          <span className={styles.gaugeK}>Attrition risk</span>
          <span className={`${styles.gaugeV} ${styles[`num_${t.id}`]}`}>{m.risk}</span>
        </div>
        <div className={styles.gaugeTrack}>
          <span className={`${styles.gaugeFill} ${styles[`fill_${t.id}`]}`} style={{ width: `${m.risk}%` }} />
        </div>
        <div className={styles.gaugeSub}>{t.label} · {t.hint}</div>
      </div>

      <div className={styles.gauge}>
        <div className={styles.gaugeTop}>
          <span className={styles.gaugeK}>Annual profit</span>
          <span className={styles.gaugeV}>₹{fmtIN(m.profit)}</span>
        </div>
        <div className={styles.gaugeTrack}>
          <span className={`${styles.gaugeFill} ${styles.fillProfit}`} style={{ width: `${Math.max(3, pct)}%` }} />
        </div>
        <div className={styles.gaugeSub}>Higher than {pct}% of the cohort</div>
      </div>

      <section className={styles.block}>
        <div className={styles.blockK}>Reachable on</div>
        <div className={styles.chans}>
          {m.respondsTo.map((c, i) => (
            <span key={c} className={`${styles.chan} ${i === 0 ? styles.chanFirst : ''}`}>
              {CHANNEL[c]}{i === 0 ? ' · preferred' : ''}
            </span>
          ))}
        </div>
      </section>

      <div className={styles.cardFoot}>
        {rank} of {fmtIN(total)} in view · {cohort.label}
      </div>
    </div>
  )
}

function Fact({ k, v }) {
  return (
    <div className={styles.fact}>
      <div className={styles.factK}>{k}</div>
      <div className={styles.factV}>{v}</div>
    </div>
  )
}

function toneOf(risk) {
  return riskTier(risk).id
}

function initials(name) {
  const parts = name.split(' ').filter((w) => !w.endsWith('.'))
  return (parts[0][0] + (parts[parts.length - 1][0] || '')).toUpperCase()
}
