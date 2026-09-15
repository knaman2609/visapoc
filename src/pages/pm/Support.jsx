import { useCallback, useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import {
  ChartColumn, CheckCheck, ChevronDown, CircleDashed, Hash, LayoutGrid, List, Mail, Pencil, Search,
  Sheet, SlidersHorizontal, Star, Tag, Ticket, Users, X,
} from 'lucide-react'
import DeskSidebar from '../../components/desk/DeskSidebar.jsx'
import MetricsDialog from '../../components/desk/MetricsDialog.jsx'
import { KanbanView, ListView, TableView } from '../../components/desk/TicketViews.jsx'
import {
  Avatar, MenuItem, MenuLabel, Popover, PriorityIcon, SourceBadge, StageIcon,
} from '../../components/desk/DeskBits.jsx'
import bits from '../../components/desk/DeskBits.module.css'
import { AGENTS, DESK_BY_ID, LABEL_BY_ID, PRIORITIES, STAGES } from '../../data/support.js'
import {
  FOLDER_BY_ID, VIEWS, filterTickets, ownerName, resolveTickets, useSupportContext,
} from '../../state/useSupport.js'
import styles from './Support.module.css'

/**
 * Support — a Xyne Desk inside the portfolio console.
 *
 * The screen is Desk's: a rail of desks with their mailbox folders and labels,
 * a toolbar of filters and views, and the tickets as a list, a table or a board.
 * The data is this console's: applicants and cardholders writing in about the
 * same files the onboarding and RM screens work.
 *
 * It is the receiving end. There is no Compose — the desk answers what arrives
 * and never starts a conversation of its own.
 *
 * Where you are — desk, folder, label, view, metrics — lives in the URL, so the
 * back button returns from a ticket to the exact place it was opened from.
 * Filters and selection are page state: they are a way of looking, not a place.
 */

// Desk pages its list at fifty.
const PAGE = 50

const DEFAULTS = { desk: 'all', folder: 'inbox', label: null, view: 'list', metrics: null }

const VIEW_BUTTONS = [
  { id: 'kanban', label: 'Kanban', icon: LayoutGrid },
  { id: 'list', label: 'List', icon: List },
  { id: 'table', label: 'Table', icon: Sheet },
]

const param = (params, key, valid) => {
  const v = params.get(key)
  return v && valid(v) ? v : DEFAULTS[key]
}

export default function Support() {
  const { edits, drafts, setRead, setStarred } = useSupportContext()
  const [params, setParams] = useSearchParams()
  const navigate = useNavigate()

  // Own-property checks, as elsewhere: a URL can carry "constructor".
  const desk = param(params, 'desk', (v) => Object.hasOwn(DESK_BY_ID, v))
  const folder = param(params, 'folder', (v) => Object.hasOwn(FOLDER_BY_ID, v))
  const label = param(params, 'label', (v) => Object.hasOwn(LABEL_BY_ID, v))
  const view = param(params, 'view', (v) => VIEWS.includes(v))
  const metricsOpen = params.get('metrics') === 'open'

  const [query, setQuery] = useState('')
  const [assignees, setAssignees] = useState([])
  const [priorities, setPriorities] = useState([])
  const [stages, setStages] = useState([])
  const [unreadOnly, setUnreadOnly] = useState(false)
  const [aiDraftOnly, setAiDraftOnly] = useState(false)
  const [overdueOnly, setOverdueOnly] = useState(false)
  const [page, setPage] = useState(0)
  const [selected, setSelected] = useState(() => new Set())
  // The rail folds when no desk is picked and opens when one is. A click on its
  // own collapse button overrides that until the next desk is picked.
  const [railPref, setRailPref] = useState(null)
  const [menu, setMenu] = useState(null)
  const closeMenu = useCallback(() => setMenu(null), [])

  const tickets = useMemo(
    () => resolveTickets(edits).map((t) => ({ ...t, assigneeName: ownerName(t) })),
    [edits],
  )
  const rows = useMemo(
    () => filterTickets(tickets, {
      desk, folder, label, query, assignees, priorities, stages, unreadOnly, aiDraftOnly, overdueOnly, drafts,
    }),
    [tickets, desk, folder, label, query, assignees, priorities, stages, unreadOnly, aiDraftOnly, overdueOnly, drafts],
  )
  const deskTickets = useMemo(
    () => (desk === 'all' ? tickets : tickets.filter((t) => t.desk === desk)),
    [tickets, desk],
  )
  const unreadDesks = useMemo(
    () => new Set(tickets.filter((t) => t.unread && t.mailbox === 'inbox').map((t) => t.desk)),
    [tickets],
  )

  const setParam = useCallback((patch) => {
    setParams((prev) => {
      const next = new URLSearchParams(prev)
      for (const [k, v] of Object.entries(patch)) {
        if (v === null || v === DEFAULTS[k]) next.delete(k)
        else next.set(k, v)
      }
      return next
    }, { replace: true })
  }, [setParams])

  const closeMetrics = useCallback(() => setParam({ metrics: null }), [setParam])

  const freshView = () => { setPage(0); setSelected(new Set()) }
  // Desk and folder in one URL write: two back-to-back writes would each start
  // from the same location, and the second would drop the first.
  const pickDesk = (id, inFolder = null) => {
    setParam({ desk: id, folder: inFolder, label: null })
    setRailPref(null)
    freshView()
  }
  const collapsed = railPref ?? desk === 'all'
  const pickFolder = (id) => { setParam({ folder: id, label: null }); freshView() }
  const pickLabel = (id) => { setParam({ label: id }); freshView() }

  // The ticket is told where it was opened from, so its own back arrow returns
  // to this desk, folder and view rather than to a bare inbox.
  const open = (id) => {
    setRead([id], true)
    const search = params.toString()
    navigate(`/pm/support/${id}`, { state: { back: search ? `/pm/support?${search}` : '/pm/support' } })
  }

  const filterCount = assignees.length + priorities.length + stages.length
    + [unreadOnly, aiDraftOnly, overdueOnly].filter(Boolean).length
  const filtersOn = filterCount > 0 || query.trim() !== ''
  const moreCount = [unreadOnly, aiDraftOnly, overdueOnly].filter(Boolean).length

  const clearFilters = () => {
    setQuery(''); setAssignees([]); setPriorities([]); setStages([])
    setUnreadOnly(false); setAiDraftOnly(false); setOverdueOnly(false)
    freshView()
  }

  // Clamped rather than trusted: resolving a ticket can shrink the folder you
  // come back to below the page you left.
  const pages = Math.max(1, Math.ceil(rows.length / PAGE))
  const safePage = Math.min(page, pages - 1)
  const from = safePage * PAGE
  const pageRows = rows.slice(from, from + PAGE)

  const toggle = (id) => setSelected((prev) => {
    const next = new Set(prev)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    return next
  })
  const toggleMany = (ids, on) => setSelected((prev) => {
    const next = new Set(prev)
    for (const id of ids) {
      if (on) next.add(id)
      else next.delete(id)
    }
    return next
  })
  const preset = (kind) => {
    if (kind === 'none') setSelected(new Set())
    else if (kind === 'all') setSelected(new Set(pageRows.map((t) => t.id)))
    else setSelected(new Set(pageRows.filter((t) => (kind === 'unread' ? t.unread : !t.unread)).map((t) => t.id)))
  }

  // Only what is still in view counts as selected: a ticket filtered away, or
  // marked read out of an Unread filter, must not linger in the bulk bar.
  const picked = rows.filter((t) => selected.has(t.id))
  const pickedIds = picked.map((t) => t.id)
  const allStarred = picked.length > 0 && picked.every((t) => t.starred)

  const scopeName = desk === 'all' ? 'All tickets' : DESK_BY_ID[desk].name
  const where = label ? LABEL_BY_ID[label].name : FOLDER_BY_ID[folder].label
  const draftIds = Object.keys(drafts).filter((id) => drafts[id]?.trim())

  const empty = filtersOn
    ? 'No tickets match these filters.'
    : label ? `No tickets labelled ${LABEL_BY_ID[label].name}.`
      : folder === 'drafts' ? 'No drafts. A reply you start and leave unsent is kept here.'
        : folder === 'sent' ? 'Nothing sent from this desk this session.'
          : folder === 'spam' ? 'No spam.'
            : 'No tickets found'

  const filterMenus = [
    {
      id: 'assignee',
      label: 'Assignee',
      icon: Users,
      value: assignees,
      set: setAssignees,
      options: [
        { id: 'none', label: 'Unassigned' },
        ...AGENTS.map((a) => ({ id: a.id, label: a.name, lead: <Avatar name={a.name} size="xs" /> })),
      ],
    },
    {
      id: 'priority',
      label: 'Priority',
      icon: ChartColumn,
      value: priorities,
      set: setPriorities,
      options: PRIORITIES.map((p) => ({ id: p.id, label: p.label, lead: <PriorityIcon priority={p.id} /> })),
    },
    {
      id: 'status',
      label: 'Status',
      icon: CircleDashed,
      value: stages,
      set: setStages,
      options: STAGES.map((s) => ({ id: s.id, label: s.label, lead: <StageIcon status={s.id} /> })),
    },
  ]

  return (
    <div className={`${bits.theme} ${styles.desk}`}>
      <DeskSidebar
        desk={desk}
        folder={folder}
        label={label}
        unreadDesks={unreadDesks}
        allUnread={unreadDesks.size > 0}
        collapsed={collapsed}
        onCollapse={setRailPref}
        onDesk={pickDesk}
        onFolder={pickFolder}
        onLabel={pickLabel}
      />

      <section className={styles.main} aria-label="Tickets">
        {/* Row one: which desk, where in it, and the desk-level tools. */}
        <div className={styles.bar}>
          <div className={styles.barLeft}>
            {desk === 'all'
              ? <Ticket size={16} strokeWidth={1.9} aria-hidden="true" />
              : <Hash size={16} strokeWidth={1.9} aria-hidden="true" />}
            <h1 className={styles.deskName}>{scopeName}</h1>
            {desk !== 'all' && <SourceBadge source={DESK_BY_ID[desk].source} />}
            <span className={styles.where}>
              {label && <Tag size={11} strokeWidth={2} aria-hidden="true" />}
              {where}
              {label && (
                <button type="button" className={styles.whereX} onClick={() => pickLabel(null)} aria-label="Clear label">
                  <X size={11} strokeWidth={2.25} aria-hidden="true" />
                </button>
              )}
            </span>
          </div>

          <div className={styles.barRight}>
            <span className={styles.members} title={AGENTS.map((a) => a.name).join(', ')}>
              <span className={styles.stack}>
                {AGENTS.slice(0, 3).map((a) => <Avatar key={a.id} name={a.name} size="xs" />)}
              </span>
              <Users size={13} strokeWidth={2} aria-hidden="true" />
              {AGENTS.length}
            </span>
            <button
              type="button"
              className={`${styles.tool} ${metricsOpen ? styles.toolOn : ''}`}
              aria-pressed={metricsOpen}
              onClick={() => setParam({ metrics: metricsOpen ? null : 'open' })}
              aria-label="Desk metrics"
              title="Desk metrics"
            >
              <ChartColumn size={16} strokeWidth={2} aria-hidden="true" />
            </button>
          </div>
        </div>

        {/* Row two: filters and views — or, with tickets selected, what to do to them. */}
        <div className={`${styles.bar} ${styles.barWrap}`}>
          {picked.length > 0 ? (
            <div className={styles.bulk}>
              <span className={styles.bulkCount}>{picked.length} selected</span>
              <button type="button" className={styles.primaryBtn} onClick={() => setRead(pickedIds, true)}>
                <CheckCheck size={14} strokeWidth={2} aria-hidden="true" />Mark as read
              </button>
              <button type="button" className={styles.outlineBtn} onClick={() => setRead(pickedIds, false)}>
                <Mail size={14} strokeWidth={2} aria-hidden="true" />Mark as unread
              </button>
              <button
                type="button"
                className={styles.outlineBtn}
                onClick={() => { for (const t of picked) setStarred(t.id, !allStarred) }}
              >
                <Star size={14} strokeWidth={2} aria-hidden="true" />{allStarred ? 'Unstar' : 'Star'}
              </button>
              <button type="button" className={styles.ghostBtn} onClick={() => setSelected(new Set())}>Clear</button>
            </div>
          ) : (
            <div className={styles.filters}>
              <label className={styles.search}>
                <Search size={14} strokeWidth={2} aria-hidden="true" />
                <input
                  type="search"
                  placeholder="Search tickets"
                  aria-label="Search tickets by reference, subject, name or email"
                  value={query}
                  onChange={(e) => { setQuery(e.target.value); freshView() }}
                />
              </label>

              {filterMenus.map((f) => {
                const isOpen = menu === f.id
                return (
                  <Popover
                    key={f.id}
                    open={isOpen}
                    onClose={closeMenu}
                    trigger={(
                      <button
                        type="button"
                        className={`${styles.filter} ${f.value.length ? styles.filterOn : ''}`}
                        aria-expanded={isOpen}
                        onClick={() => setMenu(isOpen ? null : f.id)}
                      >
                        <f.icon size={14} strokeWidth={2} aria-hidden="true" />
                        {f.label}
                        {f.value.length > 0 && <span className={styles.filterDot} aria-label={`${f.value.length} selected`} />}
                        <ChevronDown size={13} strokeWidth={2} className={`${styles.chev} ${isOpen ? styles.chevOpen : ''}`} aria-hidden="true" />
                      </button>
                    )}
                  >
                    {f.options.map((o) => {
                      const on = f.value.includes(o.id)
                      return (
                        <MenuItem
                          key={o.id}
                          checked={on}
                          onClick={() => { f.set(on ? f.value.filter((v) => v !== o.id) : [...f.value, o.id]); freshView() }}
                        >
                          {o.lead}{o.label}
                        </MenuItem>
                      )
                    })}
                  </Popover>
                )
              })}

              <Popover
                open={menu === 'more'}
                onClose={closeMenu}
                width={220}
                trigger={(
                  <button
                    type="button"
                    className={`${styles.filter} ${moreCount ? styles.filterOn : ''}`}
                    aria-expanded={menu === 'more'}
                    onClick={() => setMenu(menu === 'more' ? null : 'more')}
                  >
                    <SlidersHorizontal size={14} strokeWidth={2} aria-hidden="true" />
                    More filters
                    {moreCount > 0 && <span className={styles.filterCount}>{moreCount}</span>}
                  </button>
                )}
              >
                <MenuLabel>Show only</MenuLabel>
                <MenuItem checked={unreadOnly} onClick={() => { setUnreadOnly((v) => !v); freshView() }}>Unread</MenuItem>
                <MenuItem checked={aiDraftOnly} onClick={() => { setAiDraftOnly((v) => !v); freshView() }}>AI draft</MenuItem>
                <MenuItem checked={overdueOnly} onClick={() => { setOverdueOnly((v) => !v); freshView() }}>Past response SLA</MenuItem>
              </Popover>

              {filtersOn && (
                <button type="button" className={styles.ghostBtn} onClick={clearFilters}>
                  <X size={13} strokeWidth={2.25} aria-hidden="true" />Clear
                </button>
              )}
            </div>
          )}

          <div className={styles.views} role="group" aria-label="View">
            {VIEW_BUTTONS.map((v) => (
              <button
                key={v.id}
                type="button"
                aria-pressed={view === v.id}
                aria-label={v.label}
                title={v.label}
                className={`${styles.viewBtn} ${view === v.id ? styles.viewOn : ''}`}
                // Table and board have no checkboxes, so a selection cannot follow.
                onClick={() => { setParam({ view: v.id }); setSelected(new Set()) }}
              >
                <v.icon size={15} strokeWidth={2} aria-hidden="true" />
              </button>
            ))}
          </div>
        </div>

        {draftIds.length > 0 && folder !== 'drafts' && (
          <div className={styles.drafts}>
            <span className={styles.draftsK}>Drafts</span>
            {draftIds.map((id) => (
              <button key={id} type="button" className={styles.draftPill} onClick={() => open(id)}>
                <Pencil size={11} strokeWidth={2.25} aria-hidden="true" />
                {id} · {tickets.find((t) => t.id === id)?.subject}
              </button>
            ))}
          </div>
        )}

        <div className={styles.body}>
          {view === 'list' && (
            <ListView
              rows={pageRows}
              total={rows.length}
              from={from}
              pageSize={PAGE}
              onPage={(d) => setPage(safePage + d)}
              selected={selected}
              onToggle={toggle}
              onToggleMany={toggleMany}
              onPreset={preset}
              onOpen={open}
              drafts={drafts}
              empty={empty}
            />
          )}
          {view === 'table' && <TableView rows={rows} onOpen={open} empty={empty} />}
          {view === 'kanban' && <KanbanView rows={rows} onOpen={open} />}
        </div>
      </section>

      {metricsOpen && <MetricsDialog tickets={deskTickets} scope={scopeName} onClose={closeMetrics} />}
    </div>
  )
}
