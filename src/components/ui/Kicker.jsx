import styles from './Kicker.module.css'

export default function Kicker({ size = 'sm', variant = '', chip = false, className = '', children }) {
  const cls = [
    styles.kicker,
    styles[size],
    variant === 'brand' ? styles.brand : '',
    variant === 'muted' ? styles.muted : '',
    chip ? styles.chip : '',
    className,
  ].filter(Boolean).join(' ')
  return <div className={cls}>{children}</div>
}
