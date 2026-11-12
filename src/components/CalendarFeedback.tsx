import styles from './CalendarViews.module.css'

export function CalendarLoading() {
  return <p className={styles.feedback} role="status" aria-live="polite">Cargando calendario completo…</p>
}
export function CalendarError({ message, onRetry }: { message: string; onRetry: () => void }) {
  return <div className={`${styles.feedback} ${styles.error}`} role="alert"><p>{message}</p><button className="button" type="button" onClick={onRetry}>Reintentar calendario</button></div>
}
export function CalendarEmpty({ filtered }: { filtered: boolean }) {
  return <div className={styles.feedback} role="status"><h3>{filtered ? 'No hay elementos con estos filtros' : 'No hay elementos en este periodo'}</h3>
    <p>{filtered ? 'Limpia los filtros o consulta otro periodo.' : 'Consulta otras fechas o revisa tus Actividades y Sesiones.'}</p></div>
}
