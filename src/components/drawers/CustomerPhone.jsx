import Button from '../ui/Button.jsx'
import styles from './CustomerPhone.module.css'

const QUICK_ACTIONS = [
  { label: 'Pay bill', art: (
    <svg width="30" height="30" viewBox="0 0 32 32">
      <defs>
        <linearGradient id="qa-g1" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#fdf3d4" />
          <stop offset="1" stopColor="#e3c06a" />
        </linearGradient>
      </defs>
      <rect x="3" y="8" width="26" height="17" rx="2.5" fill="#e9ecf2" />
      <rect x="3" y="8" width="26" height="17" rx="2.5" fill="url(#qa-g1)" />
      <rect x="3" y="12" width="26" height="4" fill="#2b2b2b" />
      <rect x="6" y="19" width="9" height="3" rx="1" fill="#b08f3c" />
      <rect x="18" y="19" width="8" height="3" rx="1" fill="#c9a558" />
    </svg>
  ) },
  { label: 'Rewards', art: (
    <svg width="30" height="30" viewBox="0 0 32 32">
      <rect x="4" y="13" width="24" height="15" rx="2" fill="#e0453a" />
      <rect x="4" y="13" width="24" height="4" fill="#c93a30" />
      <rect x="14" y="13" width="4" height="15" fill="#f2c14b" />
      <path d="M16 13c-4 0-7-1.5-7-4s4-1 7 4c3-5 7-6.5 7-4s-3 4-7 4z" fill="#f2c14b" />
    </svg>
  ) },
  { label: 'Convert to EMI', art: (
    <svg width="30" height="30" viewBox="0 0 32 32">
      <rect x="6" y="4" width="20" height="24" rx="2" fill="#fff" stroke="#c8cdd6" />
      <rect x="9" y="8" width="14" height="2" fill="#3b4250" />
      <rect x="9" y="13" width="14" height="1.6" fill="#c8cdd6" />
      <rect x="9" y="17" width="14" height="1.6" fill="#c8cdd6" />
      <rect x="9" y="21" width="8" height="1.6" fill="#c8cdd6" />
      <path d="M6 28l3-2 3 2 3-2 3 2 3-2 3 2v-1H6z" fill="#e6e9ef" />
    </svg>
  ) },
  { label: 'Manage card', art: (
    <svg width="30" height="30" viewBox="0 0 32 32">
      <circle cx="16" cy="16" r="10" fill="#c4cad4" />
      <circle cx="16" cy="16" r="4.5" fill="#8d95a3" />
      <g fill="#aab1bd">
        <rect x="14.6" y="2.5" width="2.8" height="5" rx="1" />
        <rect x="14.6" y="24.5" width="2.8" height="5" rx="1" />
        <rect x="2.5" y="14.6" width="5" height="2.8" rx="1" />
        <rect x="24.5" y="14.6" width="5" height="2.8" rx="1" />
      </g>
      <circle cx="16" cy="16" r="2" fill="#69707d" />
    </svg>
  ) },
]

const PHONE_TABS = ['Home', 'Cards', 'Rewards', 'One Intel']

export default function CustomerPhone({
  customer,
  profile,
  initials,
  rec,
  limitAssigned,
  showToast,
  onDismissToast,
}) {
  const isNewNoLimit = profile?.isNew && !limitAssigned

  const phoneLimit = isNewNoLimit ? 'Not assigned' : profile?.limit
  const phoneLimitNote = isNewNoLimit ? 'Limit under review' : 'Ready to use'
  const phoneStatus = isNewNoLimit ? 'Pending' : 'Active'
  const phoneDue = profile?.isNew ? '₹0' : '₹18,240'
  const phoneDueNote = profile?.isNew ? 'No bill yet' : 'Due 18 Sep'
  const phonePoints = profile?.isNew ? '0' : '12,400'
  const phoneSince = profile?.isNew ? 'Newly issued' : `Since ${customer?.since || ''}`

  return (
    <>
      {showToast && rec && (
        <div className={styles.toastOver}>
          <div className={styles.toastCard}>
            <div className={styles.toastHead}>
              <div style={{ width: 16, height: 16, background: 'var(--c-brand)', color: '#fff', fontSize: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 'none' }}>✓</div>
              <div className={styles.toastTag}>{rec.toastTag}</div>
            </div>
            <div className={styles.toastTitle}>{rec.toastTitle}</div>
            <div className={styles.toastBody}>{rec.toastBody}</div>
            <div style={{ marginTop: 14 }}>
              <Button variant="primary" size="lg" block onClick={onDismissToast}>Got it</Button>
            </div>
          </div>
        </div>
      )}

      <div className={styles.topBar}>
        <div className={styles.brand}>VISA</div>
        <div className={styles.avatar}>{initials}</div>
      </div>

      <div className={styles.wrap}>
        <div className={styles.greet}>
          <div className={styles.greetRow}>
            <div>
              <div className={styles.greetHi}>Good morning</div>
              <div className={styles.greetName}>{customer?.name}</div>
            </div>
            <div className={styles.kyc}>FULL KYC ✓</div>
          </div>
          <div className={styles.search}>Pay, recharge, invest &amp; more</div>
        </div>

        <div className={styles.quick}>
          {QUICK_ACTIONS.map((q) => (
            <div key={q.label} className={styles.qCell}>
              <div className={styles.qDisc}>{q.art}</div>
              <div className={styles.qLabel}>{q.label}</div>
            </div>
          ))}
        </div>

        <div className={styles.glance}>Your card at a glance</div>

        <div className={styles.list}>
          <div className={styles.card}>
            <div className={styles.ring1} />
            <div className={styles.ring2} />
            <div className={styles.cardTop}>
              <div>
                <div className={styles.cardKick}>AVAILABLE LIMIT</div>
                <div className={styles.cardAmt}>{phoneLimit}</div>
                <div className={styles.cardNote}>{phoneLimitNote}</div>
              </div>
              <div className={styles.visa}>VISA</div>
            </div>
            <div className={styles.chipRow}>
              <div className={styles.chip} />
              <div className={styles.num}>•••• •••• •••• 4417</div>
            </div>
            <div className={styles.footRow}>
              <div>
                <div className={styles.tinyK}>CARDHOLDER</div>
                <div className={styles.name}>{customer?.name}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div className={styles.tinyK}>VALID THRU</div>
                <div className={styles.valid}>08/31</div>
              </div>
            </div>
          </div>

          <div className={styles.mini}>
            <div className={styles.miniCard}>
              <div className={styles.miniK}>TOTAL LIMIT</div>
              <div className={styles.miniV}>{phoneLimit}</div>
              <div className={styles.miniN}>{customer?.card}</div>
            </div>
            <div className={styles.miniCard}>
              <div className={styles.miniK}>CURRENT DUE</div>
              <div className={styles.miniV}>{phoneDue}</div>
              <div className={styles.miniN}>{phoneDueNote}</div>
            </div>
            <div className={styles.miniCard}>
              <div className={styles.miniK}>REWARD POINTS</div>
              <div className={styles.miniV}>{phonePoints}</div>
              <div className={styles.miniN}>Available to redeem</div>
            </div>
            <div className={styles.miniCard}>
              <div className={styles.miniK}>CARD STATUS</div>
              <div className={styles.miniV}>{phoneStatus}</div>
              <div className={styles.miniN}>{phoneSince}</div>
            </div>
          </div>

          {limitAssigned && rec && (
            <div className={styles.noteBox}>
              <div className={styles.noteJust}>JUST NOW</div>
              <div className={styles.noteTitle}>{rec.noteTitle}</div>
              <div className={styles.noteBody}>{rec.noteBody}</div>
            </div>
          )}
        </div>
      </div>

      <div className={styles.tabs}>
        {PHONE_TABS.map((t) => <div key={t} className={styles.tab}>{t}</div>)}
      </div>
    </>
  )
}
