import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

export function useRole() {
  const { pathname } = useLocation()
  // Customer queue lives at a neutral URL (/customers) that both consoles
  // link to, so the sidebar/header stay in whichever view you arrived from
  // rather than flipping. sessionStorage carries the last non-neutral role
  // across the navigation.
  useEffect(() => {
    if (pathname.startsWith('/rm')) sessionStorage.setItem('lastRole', 'rm')
    else if (pathname.startsWith('/pm')) sessionStorage.setItem('lastRole', 'pm')
  }, [pathname])

  if (pathname.startsWith('/rm')) return 'rm'
  if (pathname.startsWith('/pm')) return 'pm'
  if (pathname.startsWith('/customers')) {
    return sessionStorage.getItem('lastRole') === 'rm' ? 'rm' : 'pm'
  }
  return 'pm'
}

export function usePmPage() {
  const { pathname } = useLocation()
  if (pathname.startsWith('/pm/scans')) return 'scans'
  if (pathname.startsWith('/pm/campaigns')) return 'campaigns'
  if (pathname.startsWith('/pm/assistant')) return 'assistant'
  if (pathname.startsWith('/pm/deep-dive')) return 'deepdive'
  // Team management sits in the PM console rather than a console of its own,
  // so its screens are PM pages like any other.
  if (pathname.startsWith('/pm/users')) return 'users'
  if (pathname.startsWith('/pm/roles')) return 'roles'
  if (pathname.startsWith('/pm/studio')) return 'studio'
  if (pathname.startsWith('/pm/workflows')) return 'workflows'
  // Same reason as analytics below: without its own case the fall-through
  // would light up Opportunities while a ticket is open.
  if (pathname.startsWith('/pm/support')) return 'support'
  // Analytics needs its own case: without it the fall-through below would light
  // up Opportunities in the sidebar while the analytics page is open.
  if (pathname.startsWith('/pm/analytics')) return 'analytics'
  // Shared with the RM console — highlights the Customer queue sidebar entry
  // when the neutral /customers route is open.
  if (pathname.startsWith('/customers')) return 'customers'
  return 'flow'
}

/** Which RM page is open, for the same reason. */
export function useRmPage() {
  const { pathname } = useLocation()
  if (pathname.startsWith('/rm/analytics')) return 'analytics'
  return 'queue'
}

// Contextual identity per role, mirrors mockup lines 2231-2234.
export function useIdentity() {
  return VIEWS[useRole()] ?? VIEWS.pm
}

/**
 * The two consoles, and who you are in each.
 *
 * Switching view and switching identity are the same act here — the header's
 * profile menu reads this, so the seat you are in and the console you are
 * looking at can never disagree.
 */
export const VIEWS = {
  pm: {
    id: 'pm',
    label: 'Portfolio View',
    to: '/pm/assistant',
    userInit: 'RM',
    userName: 'Rohan Mehta',
    userRole: 'Portfolio Manager · Cards, India',
  },
  rm: {
    id: 'rm',
    label: 'Lifecycle View',
    to: '/customers',
    userInit: 'PR',
    userName: 'Priya Ranganathan',
    userRole: 'Relationship Manager · South 2',
  },
}

export const VIEW_LIST = [VIEWS.pm, VIEWS.rm]
