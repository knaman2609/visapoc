import { useCallback, useEffect, useRef, useState } from 'react'

/**
 * Windowed rendering for a fixed-row-height list.
 *
 * A cohort can hold 15,290 cardholders and the modal is asked to show all of
 * them, so only the slice inside the viewport (plus a small overscan) is ever
 * in the DOM. The scroller keeps its full scroll height from a spacer, and the
 * visible slice is offset with a transform so scrolling stays smooth.
 *
 * Scroll updates are coalesced into an animation frame — a fast flick fires
 * scroll events far more often than the screen can repaint.
 */
export function useVirtualRows({ count, rowHeight, overscan = 10 }) {
  const ref = useRef(null)
  const frame = useRef(0)
  const [scrollTop, setScrollTop] = useState(0)
  const [viewport, setViewport] = useState(0)

  useEffect(() => {
    const el = ref.current
    if (!el) return undefined
    setViewport(el.clientHeight)
    const ro = new ResizeObserver(() => setViewport(el.clientHeight))
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  useEffect(() => () => cancelAnimationFrame(frame.current), [])

  const onScroll = useCallback((e) => {
    const top = e.currentTarget.scrollTop
    cancelAnimationFrame(frame.current)
    frame.current = requestAnimationFrame(() => setScrollTop(top))
  }, [])

  const scrollToTop = useCallback(() => {
    if (ref.current) ref.current.scrollTop = 0
    setScrollTop(0)
  }, [])

  const scrollToIndex = useCallback((i) => {
    const el = ref.current
    if (!el) return
    const top = i * rowHeight
    const bottom = top + rowHeight
    if (top < el.scrollTop) el.scrollTop = top
    else if (bottom > el.scrollTop + el.clientHeight) el.scrollTop = bottom - el.clientHeight
  }, [rowHeight])

  const start = Math.max(0, Math.floor(scrollTop / rowHeight) - overscan)
  const end = Math.min(count, Math.ceil((scrollTop + (viewport || 600)) / rowHeight) + overscan)

  return {
    ref,
    onScroll,
    scrollToTop,
    scrollToIndex,
    start,
    end,
    padTop: start * rowHeight,
    totalHeight: count * rowHeight,
  }
}
