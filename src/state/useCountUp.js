import { useEffect, useRef, useState } from 'react'

/**
 * Ease a number from 0 to `to` over `ms`, on rAF.
 *
 * useStreamCounter reveals items one tick at a time, which is right for a list
 * of eight but not for 2.4 million. This eases instead, so large and small
 * tallies in the same row finish together.
 */
export function useCountUp(to, ms = 1100) {
  const [n, setN] = useState(0)
  const frame = useRef(0)

  useEffect(() => {
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) {
      setN(to)
      return undefined
    }

    const start = performance.now()
    const tick = (now) => {
      const t = Math.min(1, (now - start) / ms)
      // easeOutCubic — fast off the line, settles onto the final value.
      setN(Math.round(to * (1 - (1 - t) ** 3)))
      if (t < 1) frame.current = requestAnimationFrame(tick)
    }
    frame.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame.current)
  }, [to, ms])

  return n
}

/**
 * Count `seconds` down in real time, wrapping back to `seconds` at zero so the
 * next sweep is always pending. Returns [mm, ss] already padded.
 */
export function useCountdown(seconds) {
  const [left, setLeft] = useState(seconds)

  useEffect(() => {
    setLeft(seconds)
    const id = setInterval(() => {
      setLeft((v) => (v <= 1 ? seconds : v - 1))
    }, 1000)
    return () => clearInterval(id)
  }, [seconds])

  const mm = String(Math.floor(left / 60)).padStart(2, '0')
  const ss = String(left % 60).padStart(2, '0')
  return [mm, ss]
}
