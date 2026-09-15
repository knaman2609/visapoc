import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ROLES, STATUSES } from '../../data/users.js'
import {
  SORTS, effectivePermissions, exceptionsFor, filterUsers, lastActive, resolveUsers,
  roleLabel, seatSummary, shortDate, useAccessContext,
} from '../../state/useAccess.js'
import styles from './Users.module.css'

/**
 * Who has a seat in this console.
 *
 * The list is the access review: one row per person, the role they hold, and
 * how much that role actually gives them. Everything else on the screen exists
 * to narrow it down to the rows somebody is about to change.
 */

// Rows per page. Fifty-six seats is small enough to scroll and large enough
// that an unpaged list buries the filters at the top of it.
const PAGE = 18

export default function Users() {
  const { roleGrants, userEdits, dirty, resetAll } = useAccessContext()

  const [query, setQuery] = useState('')
  const [role, setRole] = useState('all')
  const [status, setStatus] = useState('all')
  const [sort, setSort] = useState('recent')
  const [page, setPage] = useState(0)

  const users = useMemo(() => resolveUsers(userEdits), [userEdits])
  const summary = useMemo(() => seatSummary(users, roleGrants), [users, roleGrants])
  const filtered = useMemo(
    () => filterUsers(users, { query, role, status, sort }),
    [users, query, role, status, sort],
  )

  const filtersOn = query.trim() !== '' || role !== 'all' || status !== 'all'

  // Clamped rather than trusted: every filter setter resets the page, but a
  // clamp here means a stale page can never render an empty table.
  const pages = Math.max(1, Math.ceil(filtered.length / PAGE))
  const safePage = Math.min(page, pages - 1)
  const from = safePage * PAGE
  const rows = filtered.slice(from, from + PAGE)

  const stats = [
    { k: 'Seats taken', v: String(summary.total), n: `of 60 licensed · ${summary.invited} invitation${summary.invited === 1 ? '' : 's'} outstanding` },
    { k: 'Active accounts', v: String(summary.active), n: `${summary.suspended} suspended, kept for attribution` },
    { k: 'Privileged access', v: String(summary.privileged), n: 'can assign limits, launch, or grant access' },
    { k: 'Administrators', v: String(summary.admins), n: 'the only role that can change this screen' },
  ]

  const clear = () => { setQuery(''); setRole('all'); setStatus('all'); setPage(0) }

  return (
    <div className={styles.wrap}>
      <div className={styles.head}>
        <h1 className={styles.h1}>Users and access</h1>
        <div className={styles.sub}>
          Every account that can open this console, the role it holds, and what that role
          lets it do. Roles are the rule; the exceptions layered on top of them are marked
          on the row and explained on the person&rsquo;s own page.
        </div>
      </div>

      <div className={styles.stats}>
        {stats.map((s) => (
          <div key={s.k} className={styles.stat}>
            <div className={styles.statK}>{s.k}</div>
            <div className={styles.statV}>{s.v}</div>
            <div className={styles.statN}>{s.n}</div>
          </div>
        ))}
      </div>

      <div className={styles.notice}>
        <strong>Demo console.</strong> Changes made here — a role, a status, a permission —
        are held in the browser for this session only. There is no server behind this screen,
        so a reload puts every account back to how it started.
        {dirty && (
          <button type="button" className={styles.reset} onClick={() => { resetAll(); setPage(0) }}>
            Discard session changes
          </button>
        )}
      </div>

      <div className={styles.panel}>
        <div className={styles.panelHead}>
          <div>
            <div className={styles.panelTitle}>Seat list</div>
            <div className={styles.panelSub}>
              {summary.exceptions} account{summary.exceptions === 1 ? ' carries' : 's carry'} a
              permission their role does not explain. Those are the rows worth reading first.
            </div>
          </div>
          <Link to="/pm/roles" className={styles.link}>Role matrix →</Link>
        </div>

        <div className={styles.filters}>
          <input
            type="search"
            className={styles.search}
            placeholder="Search a name, email or team"
            aria-label="Search users by name, email or team"
            value={query}
            onChange={(e) => { setQuery(e.target.value); setPage(0) }}
          />

          <label className={styles.field}>
            <span className={styles.fieldLabel}>Role</span>
            <select
              className={styles.select}
              value={role}
              onChange={(e) => { setRole(e.target.value); setPage(0) }}
            >
              <option value="all">Any role</option>
              {ROLES.map((r) => <option key={r.id} value={r.id}>{r.label}</option>)}
            </select>
          </label>

          <div className={styles.seg} role="group" aria-label="Filter by account status">
            <button
              type="button"
              aria-pressed={status === 'all'}
              className={`${styles.segBtn} ${status === 'all' ? styles.segOn : ''}`}
              onClick={() => { setStatus('all'); setPage(0) }}
            >
              All
            </button>
            {STATUSES.map((s) => (
              <button
                key={s.id}
                type="button"
                aria-pressed={status === s.id}
                className={`${styles.segBtn} ${status === s.id ? styles.segOn : ''}`}
                onClick={() => { setStatus(s.id); setPage(0) }}
              >
                {s.label}
              </button>
            ))}
          </div>

          <label className={styles.field}>
            <span className={styles.fieldLabel}>Sort</span>
            <select className={styles.select} value={sort} onChange={(e) => setSort(e.target.value)}>
              {SORTS.map((s) => <option key={s.key} value={s.key}>{s.label}</option>)}
            </select>
          </label>

          {filtersOn && (
            <button type="button" className={styles.clear} onClick={clear}>Clear filters</button>
          )}
        </div>

        <div className={styles.countLine} aria-live="polite">
          {filtered.length === 0
            ? 'No matches'
            : `Showing ${from + 1}–${from + rows.length} of ${filtered.length}`}
          {filtersOn && filtered.length > 0 && ` matching · ${users.length} seats in all`}
        </div>

        <div className={styles.tableWrap}>
          <div className={`${styles.rowHead} ${styles.grid}`}>
            <div>Person</div>
            <div>Role</div>
            <div>Team</div>
            <div>Status</div>
            <div className={styles.num}>Permissions</div>
            <div className={styles.num}>Last active</div>
          </div>

          {rows.length === 0 && (
            <div className={styles.empty}>
              Nobody matches those filters. Clear them to see every seat.
            </div>
          )}

          {rows.map((u) => {
            const held = effectivePermissions(u, roleGrants)
            const exceptions = exceptionsFor(u, roleGrants).length
            const edited = !!userEdits[u.id]
            return (
              <Link key={u.id} to={`/pm/users/${u.id}`} className={`${styles.row} ${styles.grid}`}>
                <div>
                  <div className={styles.name}>
                    {u.name}
                    {edited && <span className={styles.tag}>Edited</span>}
                  </div>
                  <div className={styles.dim}>{u.email}</div>
                </div>
                <div>
                  <div className={styles.roleName}>{roleLabel(u.role)}</div>
                  {exceptions > 0 && (
                    <div className={styles.dim}>
                      {exceptions} exception{exceptions === 1 ? '' : 's'}
                    </div>
                  )}
                </div>
                <div className={styles.dimInline}>{u.team}</div>
                <div>
                  <span className={`${styles.pill} ${styles[u.status]}`}>{u.status}</span>
                </div>
                <div className={styles.num}>
                  {u.status === 'active' ? held.length : '—'}
                </div>
                <div className={styles.num}>
                  <div>{lastActive(u.lastActiveMins)}</div>
                  <div className={styles.dim}>added {shortDate(u.addedOn)}</div>
                </div>
              </Link>
            )
          })}
        </div>

        {pages > 1 && (
          <div className={styles.pager}>
            <button
              type="button"
              className={styles.pageBtn}
              disabled={safePage === 0}
              onClick={() => setPage(safePage - 1)}
            >
              ← Previous
            </button>
            <div className={styles.pageNum}>Page {safePage + 1} of {pages}</div>
            <button
              type="button"
              className={styles.pageBtn}
              disabled={safePage >= pages - 1}
              onClick={() => setPage(safePage + 1)}
            >
              Next →
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
