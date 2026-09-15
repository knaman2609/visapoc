import { useContext } from 'react'
import { AccessContext } from './AccessContext.jsx'
import {
  PERMISSIONS, PERMISSION_BY_ID, ROLES, ROLE_BY_ID, STATUSES, TODAY, USERS,
} from '../data/users.js'

/**
 * Access selectors.
 *
 * Everything the three admin screens render comes through here, computed over
 * the same population and the same session overrides, so the list, the detail
 * page and the matrix cannot disagree about who can do what.
 *
 * The functions are pure and take the override state as an argument rather
 * than reading the context themselves: a selector that reached into context
 * would go stale behind a useMemo, and the whole point of this module is that
 * the count in the header and the rows underneath it are the same computation.
 */

export function useAccessContext() {
  const ctx = useContext(AccessContext)
  if (!ctx) throw new Error('useAccessContext must be used inside <AccessProvider>')
  return ctx
}

/** A user with the session's edits folded in. */
export function resolveUser(user, userEdits) {
  const patch = userEdits[user.id]
  if (!patch) return user
  return { ...user, ...patch }
}

export function resolveUsers(userEdits) {
  return USERS.map((u) => resolveUser(u, userEdits))
}

/**
 * What a person can actually do: the role's grants, plus their exceptions,
 * minus their revocations — and nothing at all while they are suspended.
 *
 * Suspension is modelled as a gate rather than as a wipe. The exceptions stay
 * on the record so lifting the suspension restores exactly what was there,
 * which is what a bank's own control document would expect it to do.
 */
export function effectivePermissions(user, roleGrants) {
  if (user.status !== 'active') return []
  const fromRole = roleGrants[user.role] ?? []
  const held = new Set(fromRole.filter((p) => !user.revoked.includes(p)))
  user.extra.forEach((p) => { if (PERMISSION_BY_ID[p]) held.add(p) })
  // Ordered by PERMISSIONS so two people's lists are always comparable.
  return PERMISSIONS.filter((p) => held.has(p.id)).map((p) => p.id)
}

/**
 * The same list, annotated with where each permission came from — role, or an
 * exception granted on top of it. The detail screen needs the difference; a
 * count of eleven ticks does not tell anyone which two were hand-granted.
 *
 * `granted` here is what the policy says, before suspension is applied. A
 * suspended account holds nothing, but the screen still has to show what it
 * would come back to — a grid of empty boxes would read as an account that had
 * been stripped rather than one that had been paused.
 */
export function permissionSources(user, roleGrants) {
  const fromRole = new Set(roleGrants[user.role] ?? [])
  return PERMISSIONS.map((p) => {
    const inRole = fromRole.has(p.id)
    const revoked = inRole && user.revoked.includes(p.id)
    const granted = !inRole && user.extra.includes(p.id)
    return {
      ...p,
      granted: (inRole && !revoked) || granted,
      inRole,
      source: revoked ? 'revoked' : granted ? 'granted' : inRole ? 'role' : 'none',
    }
  })
}

/**
 * Anything holding true for a user that their role alone does not explain.
 *
 * Measured against the role as it stands, not as it stood when the exception
 * was written: moving a tick in the matrix can make a revocation redundant or
 * a grant superfluous, and an exception the role now covers is not an
 * exception any more. Reading it any other way lets this list disagree with
 * the source tags in the grid directly beneath it.
 */
export function exceptionsFor(user, roleGrants) {
  const fromRole = new Set(roleGrants[user.role] ?? [])
  return [
    ...user.extra
      .filter((p) => !fromRole.has(p))
      .map((p) => ({ id: p, kind: 'granted', label: PERMISSION_BY_ID[p]?.label ?? p })),
    ...user.revoked
      .filter((p) => fromRole.has(p))
      .map((p) => ({ id: p, kind: 'revoked', label: PERMISSION_BY_ID[p]?.label ?? p })),
  ]
}

/* ── List ───────────────────────────────────────────────────────────── */

export const SORTS = [
  { key: 'recent', label: 'Recently active' },
  { key: 'name', label: 'Name' },
  { key: 'added', label: 'Newest seat' },
]

/**
 * The list, filtered and ordered.
 *
 * Search covers name, email and team — the three things somebody chasing an
 * access request actually has in front of them. Never-active accounts sort to
 * the bottom of "recently active" rather than to the top, which is where a
 * plain numeric sort on a null would put them.
 */
export function filterUsers(users, { query = '', role = 'all', status = 'all', sort = 'recent' } = {}) {
  const q = query.trim().toLowerCase()
  const rows = users.filter((u) => {
    if (role !== 'all' && u.role !== role) return false
    if (status !== 'all' && u.status !== status) return false
    if (!q) return true
    return u.name.toLowerCase().includes(q)
      || u.email.toLowerCase().includes(q)
      || u.team.toLowerCase().includes(q)
  })

  const never = Number.MAX_SAFE_INTEGER
  if (sort === 'name') return rows.sort((a, b) => a.name.localeCompare(b.name))
  if (sort === 'added') return rows.sort((a, b) => b.addedOn.localeCompare(a.addedOn))
  return rows.sort((a, b) => (a.lastActiveMins ?? never) - (b.lastActiveMins ?? never))
}

/** Headline counts for the seat list. No rate invented the data cannot carry. */
export function seatSummary(users, roleGrants) {
  const active = users.filter((u) => u.status === 'active')
  return {
    total: users.length,
    active: active.length,
    invited: users.filter((u) => u.status === 'invited').length,
    suspended: users.filter((u) => u.status === 'suspended').length,
    admins: active.filter((u) => u.role === 'admin').length,
    // Whoever can assign a limit, launch to a live audience, or grant access.
    // The number an access review starts from.
    privileged: active.filter((u) => {
      const held = effectivePermissions(u, roleGrants)
      return held.some((p) => PERMISSION_BY_ID[p]?.sensitive)
    }).length,
    exceptions: users.filter((u) => exceptionsFor(u, roleGrants).length > 0).length,
  }
}

/* ── Matrix ─────────────────────────────────────────────────────────── */

/**
 * Roles against permissions, plus how many active people each role covers —
 * a tick that nobody holds is a different problem from a tick that fifty
 * people hold, and the matrix is unreadable without that number beside it.
 */
export function roleMatrix(users, roleGrants) {
  return ROLES.map((r) => {
    const grants = roleGrants[r.id] ?? []
    return {
      ...r,
      grants,
      changed: grants.length !== r.grants.length || r.grants.some((p) => !grants.includes(p)),
      seats: users.filter((u) => u.role === r.id).length,
      activeSeats: users.filter((u) => u.role === r.id && u.status === 'active').length,
      sensitive: grants.filter((p) => PERMISSION_BY_ID[p]?.sensitive).length,
    }
  })
}

/* ── Formatting ─────────────────────────────────────────────────────── */

export const roleLabel = (id) => ROLE_BY_ID[id]?.label ?? id
export const statusLabel = (id) => STATUSES.find((s) => s.id === id)?.label ?? id

/** Coarse on purpose: nobody reads an access list to the minute. */
export function lastActive(mins) {
  if (mins === null || mins === undefined) return 'Never'
  if (mins < 60) return `${mins}m ago`
  if (mins < 1440) return `${Math.round(mins / 60)}h ago`
  const days = Math.round(mins / 1440)
  if (days < 31) return `${days}d ago`
  return `${Math.round(days / 30)}mo ago`
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

export function shortDate(iso) {
  const d = new Date(`${iso}T00:00:00`)
  return `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`
}

/** How long the seat has existed, measured from the console's fixed today. */
export function seatAge(iso) {
  const days = Math.round((TODAY - new Date(`${iso}T00:00:00`)) / 86400000)
  if (days < 31) return `${days} days`
  if (days < 365) return `${Math.round(days / 30)} months`
  return `${(days / 365).toFixed(1)} years`
}
