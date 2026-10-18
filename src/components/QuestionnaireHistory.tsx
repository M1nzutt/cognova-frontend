import { useCallback, useEffect, useRef, useState } from 'react'
import type { QuestionnaireCatalog, QuestionnaireHistory as History } from '../types/questionnaire'
import { QuestionnaireService } from '../services/QuestionnaireService'
import { ApiError } from '../api/ApiError'
import { QuestionnaireSummary } from './QuestionnaireSummary'

export function QuestionnaireHistory({ service, catalog }: { service: QuestionnaireService; catalog: QuestionnaireCatalog }) {
  const [history, setHistory] = useState<History | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const pending = useRef<AbortController | null>(null)
  const load = useCallback((cursor?: number) => {
    if (pending.current) return
    const controller = new AbortController(); pending.current = controller
    return service.history(cursor, controller.signal).then(page => {
      if (!controller.signal.aborted) setHistory(previous => ({ ...page, items: cursor === undefined ? page.items : [...(previous?.items ?? []), ...page.items] }))
    }).catch((error: unknown) => {
      if (!controller.signal.aborted) setError(error instanceof ApiError ? error.message : 'No pudimos consultar las revisiones.')
    }).finally(() => { if (pending.current === controller) pending.current = null; if (!controller.signal.aborted) setLoading(false) })
  }, [service])
  useEffect(() => {
    void load()
    return () => { pending.current?.abort(); pending.current = null }
  }, [load])
  function requestPage(cursor?: number) { setLoading(true); setError(null); void load(cursor) }
  return <section aria-label="Historial de percepciones">
    <h2>Tus revisiones</h2><p>Tu percepción inicial se conserva. Cada actualización es una nueva revisión.</p>
    {history?.items.map(response => <details key={response.revision}>
      <summary>Revisión {response.revision} · {new Date(response.recorded_at).toLocaleString('es')}{response.revision === 1 ? ' · Percepción inicial' : ''}</summary>
      <QuestionnaireSummary catalog={catalog} response={response} />
    </details>)}
    {history?.items.length === 0 && <p>Aún no hay revisiones guardadas.</p>}
    {loading && <p role="status">Consultando revisiones…</p>}
    {error && <><p role="alert">{error}</p><button className="button" disabled={loading} onClick={() => requestPage(history?.next_before_revision ?? undefined)}>Reintentar historial</button></>}
    {!error && history?.next_before_revision != null && <button className="button" disabled={loading} onClick={() => requestPage(history.next_before_revision!)}>Ver revisiones anteriores</button>}
  </section>
}
