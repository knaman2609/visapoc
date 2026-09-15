import { useMemo } from 'react'
import { Link, useParams } from 'react-router-dom'
import {
  PERMISSION_GROUPS, ROLES, ROLE_BY_ID, STATUSES, USER_BY_ID, activityFor,
} from '../../data/users.js'
import {
  effectivePermissions, exceptionsFor, lastActive, permissionSources, resolveUser,
  roleLabel, seatAge, shortDate, useAccessContext,
} from '../../state/useAccess.js'
import styles from './UserDetail.module.css'

/**
 * One person's access, and where each piece of it came from.
 *
 * The list screen can only show a count of permissions. This is the screen
 * that has to answer the question behind the count — why does this person hold
 * this, and was it their role or somebody's decision? So every permission is
 * rendered whether or not it is held, tagged with its source, and the ones
 * that differ from the role are called out above the fold.
 */
export default function UserDetail() {
  const { id } = useParams()
  const {
    roleGrants, userEdits, setRole, setStatus, toggleUserPermission, resetUser,
  } = useAccessContext()

  // Own-property check rather than a plain lookup: "__proto__" and
  // "constructor" are truthy on any object literal, and a URL can carry either.
  const base = Object.hasOwn(USER_BY_ID, id) ? USER_BY_ID[id] : null
  const user = base ? resolveUser(base, userEdits) : null

  const held = useMemo(
    () => (user ? effectivePermissions(user, roleGrants) : []),
    [user, roleGrants],
  )
  const sources = useMemo(
    () => (user ? permissionSources(user, roleGrants) : []),
    [user, roleGrants],
  )
  // Keyed on the account's own permissions, never on the edited ones.
  //
  // This is a record of what somebody did, so it has to hold still while the
  // page is used. Feeding it the live `sources` reshaped the pool the seeded
  // draw indexes into, and unticking any permission silently rewrote the
  // labels on entries already on screen — same rows, same timestamps,
  // different history. A record that edits itself is worse than no record.
  const activity = useMemo(() => {
    if (!base) return []
    const policy = Object.fromEntries(ROLES.map((r) => [r.id, r.grants]))
    const perms = permissionSources(base, policy).filter((p) => p.granted).map((p) => p.id)
    return activityFor(base, perms)
  }, [base])

  if (!user) {
    return (
      <div className={styles.wrap}>
        <div className={styles.missing}>
          <div className={styles.missKick}>No such account</div>
          <h1 className={styles.missTitle}>Nothing is filed under &ldquo;{id}&rdquo;</h1>
          <p className={styles.missBody}>
            The account may have been removed, or the link may be older than the seat it
            pointed at. Accounts are never deleted while they still have actions attributed
            to them, so a missing one has usually never existed.
          </p>
          <Link to="/pm/users" className={styles.missLink}>← Back to the seat list</Link>
        </div>
      </div>
    )
  }

  const edited = !!userEdits[user.id]
  const exceptions = exceptionsFor(user, roleGrants)
  const role = ROLE_BY_ID[user.role]

  const facts = [
    { k: 'Team', v: user.team },
    { k: 'Email', v: user.email },
    { k: 'Seat opened', v: `${shortDate(user.addedOn)} · ${seatAge(user.addedOn)} ago` },
    { k: 'Last active', v: lastActive(user.lastActiveMins) },
    { k: 'Permissions held', v: user.status === 'active' ? `${held.length} of ${sources.length}` : 'None while not active' },
    { k: 'Exceptions', v: exceptions.length ? `${exceptions.length} on top of the role` : 'None — role only' },
  ]

  return (
    <div className={styles.wrap}>
      <div className={styles.top}>
        <div className={styles.left}>
          <Link to="/pm/users" className={styles.back}>← Seats</Link>
          <div>
            <div className={styles.name}>
              {user.name}
              <span className={`${styles.pill} ${styles[user.status]}`}>{user.status}</span>
              {edited && <span className={styles.tag}>Edited this session</span>}
            </div>
            <div className={styles.meta}>
              {roleLabel(user.role)} · {user.team} · {user.email}
            </div>
          </div>
        </div>

        {edited && (
          <button type="button" className={styles.revert} onClick={() => resetUser(user.id)}>
            Revert this account
          </button>
        )}
      </div>

      <div className={styles.body}>
        {/* Left column: who they are, and the two controls that change it. */}
        <div className={styles.col}>
          <div className={styles.section}>
            <div className={styles.sectHead}>Account</div>
            {facts.map((f) => (
              <div key={f.k} className={styles.factRow}>
                <div className={styles.factK}>{f.k}</div>
                <div className={styles.factV}>{f.v}</div>
              </div>
            ))}
          </div>

          <div className={styles.section}>
            <div className={styles.sectHead}>Role</div>
            <label className={styles.field}>
              <span className={styles.fieldLabel}>Assigned role</span>
              <select
                className={styles.select}
                value={user.role}
                onChange={(e) => setRole(user.id, e.target.value)}
              >
                {ROLES.map((r) => <option key={r.id} value={r.id}>{r.label}</option>)}
              </select>
            </label>
            <div className={styles.roleLine}>{role?.line}</div>
            <Link to="/pm/roles" className={styles.link}>See what every role grants →</Link>
          </div>

          <div className={styles.section}>
            <div className={styles.sectHead}>Status</div>
            <div className={styles.seg} role="group" aria-label="Account status">
              {STATUSES.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  aria-pressed={user.status === s.id}
                  className={`${styles.segBtn} ${user.status === s.id ? styles.segOn : ''}`}
                  onClick={() => setStatus(user.id, s.id)}
                >
                  {s.label}
                </button>
              ))}
            </div>
            <div className={styles.roleLine}>
              {STATUSES.find((s) => s.id === user.status)?.line} Suspending withdraws every
              permission at once but keeps the exceptions on file, so lifting it restores
              exactly what was there.
            </div>
          </div>

          {user.note && (
            <div className={styles.noteBox}>
              <div className={styles.noteK}>ON FILE</div>
              <div className={styles.noteV}>{user.note}</div>
            </div>
          )}
        </div>

        {/* Middle column: the permission grid, source-tagged. */}
        <div className={styles.col}>
          <div className={styles.sectHead}>Effective permissions</div>
          <div className={styles.permIntro}>
            What the role and its exceptions grant this account. A tick is either inherited from the role or
            granted on top of it; clicking one changes it for this person only, and never for
            the role. Nothing here is saved.
          </div>

          {exceptions.length > 0 && (
            <div className={styles.exceptions}>
              {exceptions.map((e) => (
                <div key={`${e.kind}-${e.id}`} className={styles.exception}>
                  <span className={`${styles.exKind} ${styles[e.kind]}`}>
                    {e.kind === 'granted' ? 'Granted' : 'Revoked'}
                  </span>
                  {e.label}
                </div>
              ))}
            </div>
          )}

          {user.status !== 'active' && (
            <div className={styles.gate}>
              This account is {user.status}, so it holds nothing at the moment. The ticks below
              are what it would hold once it is active again.
            </div>
          )}

          {PERMISSION_GROUPS.map((g) => (
            <div key={g.id} className={styles.permGroup}>
              <div className={styles.permGroupLabel}>{g.label}</div>
              {sources.filter((p) => p.group === g.id).map((p) => (
                <button
                  key={p.id}
                  type="button"
                  aria-pressed={p.granted}
                  aria-label={`${roleLabel(user.role)} seat: ${p.label}`}
                  className={`${styles.perm} ${p.granted ? styles.permOn : ''}`}
                  onClick={() => toggleUserPermission(user.id, p.id)}
                >
                  <span className={`${styles.box} ${p.granted ? styles.boxOn : ''}`} aria-hidden="true">
                    {p.granted ? '✓' : ''}
                  </span>
                  <span className={styles.permText}>
                    <span className={styles.permLabel}>
                      {p.label}
                      {p.sensitive && <span className={styles.sensitive}>Privileged</span>}
                    </span>
                    <span className={styles.permLine}>{p.line}</span>
                    <span className={styles.permSurface}>{p.surface}</span>
                  </span>
                  <span className={`${styles.src} ${styles[p.source]}`}>
                    {p.source === 'role' ? 'From role'
                      : p.source === 'granted' ? 'Granted'
                        : p.source === 'revoked' ? 'Revoked' : '—'}
                  </span>
                </button>
              ))}
            </div>
          ))}
        </div>

        {/* Right column: what they have actually been doing with it. */}
        <div className={`${styles.col} ${styles.last}`}>
          <div className={styles.sectHead}>Recent activity</div>
          <div className={styles.permIntro}>
            The last few sessions on this account, drawn from what it is allowed to do — a
            read-only seat can never appear here as having launched anything.
          </div>

          {activity.length === 0 ? (
            <div className={styles.emptyAct}>
              {user.status === 'invited'
                ? 'Invitation sent, never signed in. Nothing has happened on this account yet.'
                : 'Nothing recorded — this account is granted no permission that produces activity.'}
            </div>
          ) : (
            activity.map((a) => (
              <div key={a.id} className={styles.act}>
                <div className={styles.actWhen}>{lastActive(a.mins)}</div>
                <div>
                  <div className={styles.actLabel}>{a.label}</div>
                  <div className={styles.actWhere}>{a.where}</div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
