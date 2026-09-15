import { useEffect, useRef, useState } from 'react'

/**
 * Reveal 0..total items over time, incrementing every `ms`.
 *
 * When any of `deps` change, the counter resets to 0 and restarts.
 *
 * The updater stays pure. React runs state updaters twice under StrictMode to
 * surface impure ones, so stopping the timer happens in an effect that watches
 * the count rather than inside the updater itself.
 */
export function useStreamCounter(total, ms, deps = []) {
  const [n, setN] = useState(0)
  const id = useRef(null)

  useEffect(() => {
    setN(0)
    if (total <= 0 || ms <= 0) return undefined
    id.current = setInterval(() => setN((v) => Math.min(v + 1, total)), ms)
    return () => {
      clearInterval(id.current)
      id.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [total, ms, ...deps])

  useEffect(() => {
    if (id.current && total > 0 && n >= total) {
      clearInterval(id.current)
      id.current = null
    }
  }, [n, total])

  return n
}
