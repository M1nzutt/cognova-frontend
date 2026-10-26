export function CalendarLoading() {
  return <p role="status" aria-live="polite">Cargando calendario completo…</p>
}
export function CalendarError({ message, onRetry }: { message: string; onRetry: () => void }) {
  return <div role="alert"><p>{message}</p><button className="button" onClick={onRetry}>Reintentar calendario</button></div>
}
export function CalendarEmpty({ filtered }: { filtered: boolean }) {
  return <div role="status"><h3>{filtered ? 'No hay actividades con estos filtros' : 'No hay actividades en este periodo'}</h3>
    <p>{filtered ? 'Limpia los filtros o consulta otro periodo.' : 'Consulta otras fechas o planifica tu trabajo desde Actividades.'}</p></div>
}
