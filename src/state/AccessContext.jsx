import { createContext, useCallback, useMemo, useState } from 'react'
import { ROLES, USERS } from '../data/users.js'

export const AccessContext = createContext(null)

/**
 * Session-scoped access edits.
 *
 * There is no backend behind this console, so every change made on the admin
 * screens lives here and only here: re-roling somebody, suspending them,
 * granting an exception, or moving a tick in the role matrix. It survives
 * navigation between the three screens — which is what makes the screens feel
 * like one feature — and nothing more. A reload restores the data module.
 *
 * The edits are kept as overrides rather than as a mutated copy of USERS so a
 * screen can always say what the underlying policy was, and so "reset" is one
 * line rather than a re-import.
 */

const BASE_ROLE_GRANTS = Object.fromEntries(ROLES.map((r) => [r.id, r.grants]))

export function AccessProvider({ children }) {
  // roleId -> permission ids. Seeded from the data module so the matrix has
  // something to render before anyone touches it.
  const [roleGrants, setRoleGrants] = useState(BASE_ROLE_GRANTS)
  // userId -> a partial user: any of role, status, extra, revoked.
  const [userEdits, setUserEdits] = useState({})

  const editUser = useCallback((id, patch) => {
    setUserEdits((prev) => ({ ...prev, [id]: { ...prev[id], ...patch } }))
  }, [])

  const setRole = useCallback((id, role) => editUser(id, { role }), [editUser])
  const setStatus = useCallback((id, status) => editUser(id, { status }), [editUser])

  /**
   * Toggle one permission for one person.
   *
   * An exception is stored against what the role grants, not as a flat list:
   * granting something the role already gives would otherwise survive a later
   * role change and quietly widen it.
   */
  const toggleUserPermission = useCallback((id, permId) => {
    setUserEdits((prev) => {
      const user = USERS.find((u) => u.id === id)
      if (!user) return prev
      const cur = prev[id] ?? {}
      const roleId = cur.role ?? user.role
      const extra = cur.extra ?? user.extra
      const revoked = cur.revoked ?? user.revoked
      const fromRole = (roleGrants[roleId] ?? []).includes(permId)
      const held = fromRole ? !revoked.includes(permId) : extra.includes(permId)

      const next = held
        ? {
          extra: extra.filter((p) => p !== permId),
          revoked: fromRole ? [...revoked, permId] : revoked,
        }
        : {
          extra: fromRole ? extra : [...extra, permId],
          revoked: revoked.filter((p) => p !== permId),
        }

      return { ...prev, [id]: { ...cur, ...next } }
    })
  }, [roleGrants])

  const resetUser = useCallback((id) => {
    setUserEdits((prev) => {
      const next = { ...prev }
      delete next[id]
      return next
    })
  }, [])

  /** Move one tick in the role matrix. Applies to everyone holding that role. */
  const toggleRolePermission = useCallback((roleId, permId) => {
    setRoleGrants((prev) => {
      const cur = prev[roleId] ?? []
      return {
        ...prev,
        [roleId]: cur.includes(permId) ? cur.filter((p) => p !== permId) : [...cur, permId],
      }
    })
  }, [])

  const resetAll = useCallback(() => {
    setRoleGrants(BASE_ROLE_GRANTS)
    setUserEdits({})
  }, [])

  const dirty = Object.keys(userEdits).length > 0
    || ROLES.some((r) => (roleGrants[r.id] ?? []).length !== r.grants.length
      || r.grants.some((p) => !(roleGrants[r.id] ?? []).includes(p)))

  const value = useMemo(
    () => ({
      roleGrants,
      userEdits,
      dirty,
      setRole,
      setStatus,
      toggleUserPermission,
      toggleRolePermission,
      resetUser,
      resetAll,
    }),
    [roleGrants, userEdits, dirty, setRole, setStatus, toggleUserPermission,
      toggleRolePermission, resetUser, resetAll],
  )

  return <AccessContext.Provider value={value}>{children}</AccessContext.Provider>
}
