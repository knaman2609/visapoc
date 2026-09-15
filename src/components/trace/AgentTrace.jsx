import Checkmark from '../ui/Checkmark.jsx'
import Spinner from '../ui/Spinner.jsx'
import styles from './AgentTrace.module.css'

export default function AgentTrace({ steps }) {
  return (
    <div className={styles.list}>
      {steps.map((s, i) => (
        <div key={`${i}-${s.label}`} className={styles.row}>
          {s.busy ? <Spinner /> : <Checkmark size="sm" />}
          <div className={styles.label}>{s.label}</div>
          <div className={styles.result}>{s.result}</div>
        </div>
      ))}
    </div>
  )
}
