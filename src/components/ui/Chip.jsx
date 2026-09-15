import styles from './Chip.module.css'

export default function Chip({ variant = '', size = '', className = '', children }) {
  const cls = [
    styles.chip,
    variant === 'brand' ? styles.brand : '',
    size === 'mini' ? styles.mini : '',
    className,
  ].filter(Boolean).join(' ')
  return <div className={cls}>{children}</div>
}
