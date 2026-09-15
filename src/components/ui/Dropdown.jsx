import { useEffect, useId, useRef, useState } from 'react'
import styles from './Dropdown.module.css'

/**
 * A single-choice dropdown.
 *
 * Built rather than borrowed from `<select>` so the trigger can carry the
 * option's description and the list can show it too, but it keeps the parts
 * that matter: the trigger owns the label, Escape and a click outside close it,
 * the arrow keys walk the list, and the open state is announced.
 */
export default function Dropdown({ label, options, value, onChange, align = 'left' }) {
  const [open, setOpen] = useState(false)
  const wrap = useRef(null)
  const listId = useId()
  const current = options.find((o) => o.id === value) || options[0]

  useEffect(() => {
    if (!open) return undefined
    const away = (e) => { if (!wrap.current?.contains(e.target)) setOpen(false) }
    const key = (e) => { if (e.key === 'Escape') setOpen(false) }
    document.addEventListener('pointerdown', away)
    document.addEventListener('keydown', key)
    return () => {
      document.removeEventListener('pointerdown', away)
      document.removeEventListener('keydown', key)
    }
  }, [open])

  const move = (dir) => {
    const i = options.findIndex((o) => o.id === current.id)
    const next = options[Math.max(0, Math.min(options.length - 1, i + dir))]
    if (next) onChange(next.id)
  }

  return (
    <div className={styles.wrap} ref={wrap}>
      {label && <span className={styles.label}>{label}</span>}

      <button
        type="button"
        className={`${styles.trigger} ${open ? styles.triggerOpen : ''}`}
        onClick={() => setOpen(!open)}
        onKeyDown={(e) => {
          if (e.key === 'ArrowDown') {
            e.preventDefault()
            if (open) move(1)
            else setOpen(true)
          }
          if (e.key === 'ArrowUp') { e.preventDefault(); move(-1) }
        }}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
      >
        {current.icon && <span className={styles.triggerIcon}>{current.icon}</span>}
        <span className={styles.value}>{current.label}</span>
        <span className={`${styles.caret} ${open ? styles.caretOpen : ''}`} aria-hidden="true">▾</span>
      </button>

      {open && (
        <ul className={`${styles.list} ${align === 'right' ? styles.right : ''}`} id={listId} role="listbox">
          {options.map((o) => (
            <li key={o.id} role="none">
              <button
                type="button"
                role="option"
                aria-selected={o.id === current.id}
                className={`${styles.option} ${o.id === current.id ? styles.optionOn : ''}`}
                onClick={() => { onChange(o.id); setOpen(false) }}
              >
                <span className={styles.optLabel}>
                  {o.icon && <span className={styles.optIcon}>{o.icon}</span>}
                  {o.label}
                </span>
                {o.sub && <span className={styles.optSub}>{o.sub}</span>}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
