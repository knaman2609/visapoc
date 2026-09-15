import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { PERMISSIONS, PERMISSION_GROUPS } from '../../data/users.js'
import { resolveUsers, roleMatrix, useAccessContext } from '../../state/useAccess.js'
import styles from './Roles.module.css'

/**
 * Roles against permissions, in one grid.
 *
 * The seat list answers "what can this person do"; this answers the question
 * underneath it — what does holding a role mean at all. It is deliberately one
 * table rather than six role cards: the value of a matrix is that the gaps are
 * visible, and a gap only reads as a gap next to the row that fills it.
 *
 * Ticks here are policy, not exceptions. Moving one changes what every seat
 * holding that role can do, which is why the column headers carry their
 * headcount — a tick with forty people behind it is a different decision from
 * one with two.
 */
export default function Roles() {
  const { roleGrants, userEdits, dirty, toggleRolePermission, resetAll } = useAccessContext()

  const users = useMemo(() => resolveUsers(userEdits), [userEdits])
  const roles = useMemo(() => roleMatrix(users, roleGrants), [users, roleGrants])

  const unheld = PERMISSIONS.filter((p) => !roles.some((r) => r.grants.includes(p.id)))

  return (
    <div className={styles.wrap}>
      <div className={styles.head}>
        <h1 className={styles.h1}>Roles and permissions</h1>
        <div className={styles.sub}>
          Every permission this console can grant, against every role that grants it. The
          three marked privileged move money or hand out access — assigning a credit limit,
          releasing a campaign to a live audience, and administering these accounts.
        </div>
      </div>

      <div className={styles.notice}>
        <strong>Demo console.</strong> Moving a tick changes the role for this browser
        session only and is gone on reload. Nothing is written anywhere.
        {dirty && (
          <button type="button" className={styles.reset} onClick={resetAll}>
            Discard session changes
          </button>
        )}
      </div>

      <div className={styles.panel}>
        <div className={styles.panelHead}>
          <div>
            <div className={styles.panelTitle}>Access matrix</div>
            <div className={styles.panelSub}>
              Read down a column for what a role is; read across a row for who can do one
              thing. Approval and launch sit in different columns on purpose — the flow
              separates them into two steps, so the roles do too.
            </div>
          </div>
          <Link to="/pm/users" className={styles.link}>← Seat list</Link>
        </div>

        <div className={styles.tableWrap}>
          {/* The role count drives the column track list, so adding a role to
              the data module widens the grid without a stylesheet edit. */}
          <div className={styles.matrix} style={{ '--roles': roles.length }}>
            {/* Column heads: the role, what it is for, and how many seats it covers. */}
            <div className={`${styles.corner} ${styles.cell}`}>Permission</div>
            {roles.map((r) => (
              <div key={r.id} className={`${styles.colHead} ${styles.cell}`}>
                <div className={styles.roleName}>
                  {r.label}
                  {r.changed && <span className={styles.tag}>Edited</span>}
                </div>
                <div className={styles.roleLine}>{r.line}</div>
                <div className={styles.roleSeats}>
                  {r.seats} seat{r.seats === 1 ? '' : 's'} · {r.activeSeats} active
                </div>
              </div>
            ))}
            <div className={`${styles.colHead} ${styles.cell} ${styles.tallyHead}`}>Roles</div>

            {PERMISSION_GROUPS.map((g) => (
              <div key={g.id} className={styles.groupRow}>
                <div className={styles.groupLabel}>{g.label}</div>

                {PERMISSIONS.filter((p) => p.group === g.id).map((p) => {
                  const count = roles.filter((r) => r.grants.includes(p.id)).length
                  return (
                    <div key={p.id} className={styles.permRow}>
                      <div className={`${styles.rowHead} ${styles.cell}`}>
                        <div className={styles.permLabel}>
                          {p.label}
                          {p.sensitive && <span className={styles.sensitive}>Privileged</span>}
                        </div>
                        <div className={styles.permLine}>{p.line}</div>
                        <div className={styles.permSurface}>{p.surface}</div>
                      </div>

                      {roles.map((r) => {
                        const on = r.grants.includes(p.id)
                        return (
                          <div key={r.id} className={`${styles.cell} ${styles.cellBox}`}>
                            <button
                              type="button"
                              aria-pressed={on}
                              aria-label={`${r.label}: ${p.label}`}
                              className={`${styles.tick} ${on ? styles.tickOn : ''} ${
                                on && p.sensitive ? styles.tickHot : ''}`}
                              onClick={() => toggleRolePermission(r.id, p.id)}
                            >
                              <span aria-hidden="true">{on ? '✓' : '·'}</span>
                            </button>
                          </div>
                        )
                      })}

                      <div className={`${styles.cell} ${styles.tally}`}>
                        {count} of {roles.length}
                      </div>
                    </div>
                  )
                })}
              </div>
            ))}
          </div>
        </div>

        <div className={styles.foot}>
          {unheld.length === 0
            ? 'Every permission is held by at least one role, so nothing in the console is currently unreachable.'
            : `${unheld.length} permission${unheld.length === 1 ? ' is' : 's are'} granted by no role at all — ${
              unheld.map((p) => p.label).join(', ')}. Nobody can reach those screens.`}
        </div>
      </div>
    </div>
  )
}
