import { createContext, useContext } from 'react'
import { createPortal } from 'react-dom'

/**
 * The flow's navigation bar is chrome, not content: it sits outside the
 * scrolling step body so back and forward never scroll out of reach. Steps
 * still own their own labels, guards and handlers — they just declare the
 * controls here and the bar hosts them.
 */
export const StepActionsSlot = createContext(null)

export default function StepActions({ children }) {
  const slot = useContext(StepActionsSlot)
  // Null on the first pass, before the bar's callback ref has reported in.
  if (!slot) return null
  return createPortal(children, slot)
}
