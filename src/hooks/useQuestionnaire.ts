import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { ApiError } from '../api/ApiError'
import { useAuth } from './useAuth'
import { QuestionnaireService } from '../services/QuestionnaireService'
import type { QuestionnaireCatalog, QuestionnaireResponse } from '../types/questionnaire'
import type { QuestionnaireDraft } from '../utils/questionnaireValidation'
import { questionnaireRequest } from '../utils/questionnaireValidation'

const message = (error: unknown) => error instanceof ApiError ? error.message : 'No pudimos completar la solicitud. Inténtalo de nuevo.'

export function useQuestionnaire() {
  const { session } = useAuth()
  const service = useMemo(() => new QuestionnaireService(session.api), [session])
  const [catalog, setCatalog] = useState<QuestionnaireCatalog | null>(null)
  const [current, setCurrent] = useState<QuestionnaireResponse | null>(null)
  const [draft, setDraft] = useState<QuestionnaireDraft>({})
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [conflict, setConflict] = useState(false)
  const [latest, setLatest] = useState<QuestionnaireResponse | null>(null)
  const [saved, setSaved] = useState<QuestionnaireResponse | null>(null)
  const [needsSync, setNeedsSync] = useState(false)
  const pending = useRef<AbortController | null>(null)
  const loader = useRef<AbortController | null>(null)

  const load = useCallback(() => {
    loader.current?.abort()
    const controller = new AbortController()
    loader.current = controller
    return Promise.all([service.catalog(controller.signal), service.current(controller.signal)]).then(([catalog, current]) => {
      if (controller.signal.aborted) return
      setCatalog(catalog); setCurrent(current); setDraft(current?.answers ?? {})
    }).catch((error: unknown) => {
      if (!controller.signal.aborted) setError(message(error))
    }).finally(() => { if (!controller.signal.aborted) setLoading(false) })
  }, [service])

  useEffect(() => {
    void load()
    return () => { loader.current?.abort(); pending.current?.abort() }
  }, [load])

  async function refreshLatest(signal: AbortSignal) {
    const value = await service.current(signal)
    if (!signal.aborted) {
      setLatest(value)
      if (!value) setError('No pudimos encontrar la revisión vigente. Tus respuestas locales siguen aquí.')
    }
  }

  async function checkLatest() {
    if (pending.current) return
    const controller = new AbortController(); pending.current = controller
    setBusy(true); setError(null)
    try { await refreshLatest(controller.signal) }
    catch (error) { if (!controller.signal.aborted) setError(message(error)) }
    finally { pending.current = null; if (!controller.signal.aborted) setBusy(false) }
  }

  async function syncProfile() {
    if (pending.current) return
    const controller = new AbortController(); pending.current = controller
    setBusy(true); setError(null)
    try {
      await session.reloadProfile(controller.signal)
      if (!controller.signal.aborted) setNeedsSync(false)
    } catch (error) { if (!controller.signal.aborted) setError(message(error)) }
    finally { pending.current = null; if (!controller.signal.aborted) setBusy(false) }
  }

  async function save(expectedRevision?: number) {
    if (pending.current || !catalog || needsSync || (conflict && expectedRevision === undefined)) return
    const controller = new AbortController(); pending.current = controller
    setBusy(true); setError(null); setSaved(null)
    try {
      const request = questionnaireRequest(catalog, draft)
      const revision = expectedRevision ?? current?.revision
      const result = revision === undefined ? await service.create(request, controller.signal)
        : await service.update({ ...request, expected_revision: revision }, controller.signal)
      if (controller.signal.aborted) return
      setSaved(result); setCurrent(result); setDraft(result.answers); setConflict(false); setLatest(null)
      // A successful write must never be repeated just because reading /me failed.
      setNeedsSync(true)
      await session.reloadProfile(controller.signal)
      if (!controller.signal.aborted) setNeedsSync(false)
    } catch (error) {
      if (controller.signal.aborted) return
      setError(message(error))
      if (error instanceof ApiError && error.status === 409
        && ['QUESTIONNAIRE_VERSION_CONFLICT', 'QUESTIONNAIRE_ALREADY_EXISTS'].includes(error.code)) {
        setConflict(true); setLatest(null)
        try { await refreshLatest(controller.signal) }
        catch (failure) { if (!controller.signal.aborted) setError(message(failure)) }
      }
    } finally { pending.current = null; if (!controller.signal.aborted) setBusy(false) }
  }

  function useLatest() {
    if (!latest || busy) return
    setDraft(latest.answers); setCurrent(latest); setLatest(null); setConflict(false); setError(null); setSaved(null)
  }

  const retryLoad = () => { setLoading(true); setError(null); return load() }
  return { service, catalog, current, draft, setDraft, loading, busy, error, load: retryLoad, save, conflict, latest, checkLatest, useLatest, saved, needsSync, syncProfile }
}
