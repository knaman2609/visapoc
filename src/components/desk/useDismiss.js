import { useEffect, useRef } from 'react'

/**
 * Close a popover on a click outside it or on Escape.
 *
 * The same listener pair the header's profile menu uses, pulled out because the
 * desk has a dozen small menus. Returns the ref to put on the popover's wrapper.
 */
export function useDismiss(open, close) {
  const ref = useRef(null)

  useEffect(() => {
    if (!open) return undefined
    const onDown = (e) => { if (!ref.current?.contains(e.target)) close() }
    const onKey = (e) => { if (e.key === 'Escape') close() }
    document.addEventListener('mousedown', onDown)
    window.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      window.removeEventListener('keydown', onKey)
    }
  }, [open, close])

  return ref
}
