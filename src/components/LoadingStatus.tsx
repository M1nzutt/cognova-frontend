import styles from './LoadingStatus.module.css'

export function LoadingStatus({ label }: { label: string }) {
  return <p className={styles.status} role="status" aria-live="polite">
    <span className={styles.indicator} aria-hidden="true" />
    <span>{label}</span>
  </p>
}
