import styles from './Button.module.css'

export default function Button({
  variant = 'primary',
  size = 'md',
  block = false,
  className = '',
  type = 'button',
  ...rest
}) {
  const cls = [
    styles.btn,
    styles[variant],
    styles[size],
    block ? styles.block : '',
    className,
  ].filter(Boolean).join(' ')

  return <button type={type} className={cls} {...rest} />
}
