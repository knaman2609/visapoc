import Button from '../ui/Button.jsx'
import Checkmark from '../ui/Checkmark.jsx'
import styles from './LimitRecommendation.module.css'

export default function LimitRecommendation({ rec, basis, assigned, onAssign }) {
  if (!rec) return null

  return (
    <div className={styles.wrap}>
      <div className={styles.head}>
        <div>
          <div className={styles.kicker}>{rec.kicker}</div>
          <div className={styles.amount}>{rec.amount}</div>
        </div>
        <div className={styles.band}>
          {rec.band}<br />{rec.bandNote}
        </div>
      </div>

      {basis.map((b) => (
        <div key={b.k} className={styles.basisRow}>
          <div className={styles.basisK}>{b.k}</div>
          <div className={styles.basisV}>{b.v}</div>
        </div>
      ))}

      {assigned ? (
        <div className={styles.assigned}>
          <Checkmark size="sm" />
          {rec.doneNote}
        </div>
      ) : (
        <div className={styles.actions}>
          <Button variant="primary" size="lg" onClick={onAssign}>{rec.cta}</Button>
          <Button variant="secondary" size="lg">{rec.alt}</Button>
        </div>
      )}
    </div>
  )
}
