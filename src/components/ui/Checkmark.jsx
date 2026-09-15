import styles from './Checkmark.module.css'

export default function Checkmark({ size = 'sm', variant = 'brand', className = '' }) {
  const cls = [
    styles.check,
    styles[size],
    variant === 'ok' ? styles.ok : '',
    variant === 'blueBg' ? styles.blueBg : '',
    className,
  ].filter(Boolean).join(' ')
  return <div className={cls}>✓</div>
}
