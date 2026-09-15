import styles from './StatusPill.module.css'

export default function StatusPill({ status, children }) {
  const cls = [styles.pill, styles[status] || ''].filter(Boolean).join(' ')
  return <div className={cls}>{children ?? status.toUpperCase()}</div>
}
