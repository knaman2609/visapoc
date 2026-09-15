import { createContext, useCallback, useMemo, useState } from 'react'

export const AppContext = createContext(null)

// Defaults mirror the mockup's data-props section:
// traceSpeed 480ms, autoApprove false, showScores true.
const DEFAULT_PROPS = {
  traceSpeed: 480,
  autoApprove: false,
  showScores: true,
}

export function AppProvider({ children, props = DEFAULT_PROPS }) {
  const [sent, setSent] = useState({})
  const [limitSet, setLimitSet] = useState({})
  const [limitToast, setLimitToast] = useState(null)

  const markSent = useCallback((id, when = 'just now') => {
    setSent((prev) => ({ ...prev, [id]: when }))
  }, [])

  const assignLimit = useCallback((id) => {
    setLimitSet((prev) => ({ ...prev, [id]: true }))
    setLimitToast(id)
  }, [])

  const dismissToast = useCallback(() => setLimitToast(null), [])

  const value = useMemo(
    () => ({
      props: { ...DEFAULT_PROPS, ...props },
      sent,
      limitSet,
      limitToast,
      markSent,
      assignLimit,
      dismissToast,
    }),
    [props, sent, limitSet, limitToast, markSent, assignLimit, dismissToast],
  )

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}
