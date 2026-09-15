import { useCallback, useState } from 'react'

/**
 * Undo/redo over a single state object.
 *
 * A builder without undo is a builder you cannot experiment in — every delete
 * is permanent, so nobody tries anything.
 *
 * The past, the present and the future are one piece of state and every
 * transition is a pure function of the previous one. That is not tidiness: an
 * earlier version kept the stacks in refs and mutated them inside the state
 * updater, and React invokes an updater twice in development. `undo` popped
 * the stack on the first invocation and then, finding it empty on the second,
 * returned the value it had just undone — so undo silently did nothing.
 *
 * `merge` collapses a run of edits into one entry: typing a headline should be
 * one undo, not forty. Consecutive edits carrying the same merge key inside
 * the window replace the top of the stack instead of stacking on it.
 */
const LIMIT = 60
const MERGE_MS = 600

const start = (value) => ({ present: value, past: [], future: [], key: null, at: 0 })

export function useHistory(initial) {
  const [hist, setHist] = useState(
    () => start(typeof initial === 'function' ? initial() : initial),
  )

  const set = useCallback((next, mergeKey = null) => {
    // Read the clock out here: an updater has to be a pure function of its
    // argument, or running it twice can reach two different answers.
    const now = Date.now()
    setHist((h) => {
      const value = typeof next === 'function' ? next(h.present) : next
      if (value === h.present) return h
      const canMerge = mergeKey != null
        && mergeKey === h.key
        && now - h.at < MERGE_MS
        && h.past.length > 0
      return {
        present: value,
        past: canMerge ? h.past : [...h.past.slice(-(LIMIT - 1)), h.present],
        future: [],
        key: mergeKey,
        at: now,
      }
    })
  }, [])

  const undo = useCallback(() => setHist((h) => (
    h.past.length === 0 ? h : {
      present: h.past[h.past.length - 1],
      past: h.past.slice(0, -1),
      future: [h.present, ...h.future].slice(0, LIMIT),
      key: null,
      at: 0,
    }
  )), [])

  const redo = useCallback(() => setHist((h) => (
    h.future.length === 0 ? h : {
      present: h.future[0],
      past: [...h.past.slice(-(LIMIT - 1)), h.present],
      future: h.future.slice(1),
      key: null,
      at: 0,
    }
  )), [])

  /** A different document, with a history of its own. */
  const reset = useCallback((value) => setHist(start(value)), [])

  return {
    state: hist.present,
    set,
    reset,
    undo,
    redo,
    canUndo: hist.past.length > 0,
    canRedo: hist.future.length > 0,
  }
}
