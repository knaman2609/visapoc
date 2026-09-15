import { useEffect, useRef, useState } from 'react'
import { Check, ChevronDown } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import styles from './Header.module.css'
import { VIEW_LIST, useIdentity, usePmPage, useRmPage, useRole } from './useLayoutInfo.js'

const PM_TITLES = {
  scans: 'Growth · Scans',
  campaigns: 'Growth · Campaigns',
  assistant: 'Growth · Assistant',
  deepdive: 'Growth · Deep dive',
  analytics: 'Onboarding · Analytics',
  users: 'Team management · Users',
  roles: 'Team management · Roles and permissions',
  support: 'Service · Support',
  customers: 'My book · Customer queue',
}

const RM_TITLES = { analytics: 'Insights · My performance' }

export default function Header() {
  const role = useRole()
  const page = usePmPage()
  const rmPage = useRmPage()
  const navigate = useNavigate()
  const { userInit, userName, userRole: userRoleText } = useIdentity()

  // The profile is the only way across to the other console now that the front
  // door is gone, so it opens a menu rather than being a label.
  const [open, setOpen] = useState(false)
  const wrap = useRef(null)

  useEffect(() => {
    if (!open) return undefined
    const onDown = (e) => { if (!wrap.current?.contains(e.target)) setOpen(false) }
    const onKey = (e) => { if (e.key === 'Escape') setOpen(false) }
    document.addEventListener('mousedown', onDown)
    window.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      window.removeEventListener('keydown', onKey)
    }
  }, [open])

  const consoleName = role === 'pm'
    ? (PM_TITLES[page] || 'Growth · Opportunities')
    : (RM_TITLES[rmPage] || 'My book · Customer queue')

  return (
    <header className={styles.header}>
      <div className={styles.left}>
        <div className={styles.title}>{consoleName}</div>
      </div>

      <div className={styles.right}>
        <div className={styles.stamp}>MON 07 SEP · 09:41</div>

        <div className={styles.profile} ref={wrap}>
          <button
            type="button"
            className={styles.user}
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-haspopup="menu"
            aria-label={`${userName}. Switch view`}
          >
            <div className={styles.userText}>
              <div className={styles.userName}>{userName}</div>
              <div className={styles.userRole}>{userRoleText}</div>
            </div>
            <div className={styles.avatar}>{userInit}</div>
            <ChevronDown
              className={`${styles.chev} ${open ? styles.chevOpen : ''}`}
              size={14} strokeWidth={2} aria-hidden="true"
            />
          </button>

          {open && (
            <div className={styles.menu} role="menu">
              <div className={styles.menuLabel}>Switch view</div>
              {VIEW_LIST.map((v) => (
                <button
                  key={v.id}
                  type="button"
                  role="menuitem"
                  className={`${styles.menuItem} ${v.id === role ? styles.menuOn : ''}`}
                  onClick={() => { setOpen(false); navigate(v.to) }}
                >
                  <div className={styles.menuText}>
                    <div className={styles.menuName}>{v.label}</div>
                    <div className={styles.menuWho}>{v.userName} · {v.userRole}</div>
                  </div>
                  {v.id === role && <Check size={14} strokeWidth={2.5} aria-hidden="true" />}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
