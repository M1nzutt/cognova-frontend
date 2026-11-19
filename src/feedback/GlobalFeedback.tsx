/* eslint-disable react-refresh/only-export-components */
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { ApiError } from '../api/ApiError'
import { planError } from '../utils/studyPlanPresentation'
import styles from './GlobalFeedback.module.css'

type FeedbackKind = 'progress' | 'success' | 'error'

interface FeedbackNotice {
  id: string
  kind: FeedbackKind
  title: string
  message: string
  href?: string
  urgent?: boolean
}

interface FeedbackContextValue {
  publish: (notice: Omit<FeedbackNotice, 'id'> & { id?: string }) => string
  update: (id: string, notice: Omit<FeedbackNotice, 'id'>) => void
  dismiss: (id: string) => void
  runningTasks: ReadonlySet<string>
  runPlanGeneration: (operation: (signal: AbortSignal) => Promise<{ plan: { id: number } }>) => void
  runPlanRegeneration: (planId: number, operation: (signal: AbortSignal) => Promise<unknown>, onSuccess?: () => void) => void
  chatSelectedId: number | null
  setChatSelectedId: (id: number | null) => void
  chatDraft: string
  setChatDraft: (value: string) => void
  runAcademicChatSend: (operation: () => Promise<void>) => Promise<boolean>
}

const FeedbackContext = createContext<FeedbackContextValue | null>(null)

export function GlobalFeedbackProvider({ children }: { children: ReactNode }) {
  const [notices, setNotices] = useState<FeedbackNotice[]>([])
  const [runningTasks, setRunningTasks] = useState<ReadonlySet<string>>(() => new Set())
  const [chatSelectedId, setChatSelectedId] = useState<number | null>(null)
  const [chatDraft, setChatDraft] = useState('')
  const controllers = useRef(new Map<string, AbortController>())
  const chatNoticeRef = useRef(false)
  const location = useLocation()
  const locationRef = useRef(location.pathname)
  const navigate = useNavigate()

  useEffect(() => { locationRef.current = location.pathname }, [location.pathname])
  useEffect(() => () => {
    for (const controller of controllers.current.values()) controller.abort()
    controllers.current.clear()
  }, [])

  const publish = useCallback((notice: Omit<FeedbackNotice, 'id'> & { id?: string }) => {
    const id = notice.id ?? `feedback-${globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`}`
    const next = { ...notice, id }
    setNotices(previous => [...previous.filter(item => item.id !== id), next].slice(-4))
    return id
  }, [])
  const update = useCallback((id: string, notice: Omit<FeedbackNotice, 'id'>) => {
    setNotices(previous => [...previous.filter(item => item.id !== id), { ...notice, id }].slice(-4))
  }, [])
  const dismiss = useCallback((id: string) => {
    setNotices(previous => previous.filter(item => item.id !== id))
  }, [])
  useEffect(() => {
    if (runningTasks.has('academic-chat-send') && location.pathname !== '/app/analytics' && !chatNoticeRef.current) {
      chatNoticeRef.current = true
      publish({ id: 'task-academic-chat-send', kind: 'progress', title: 'Gemini está preparando una respuesta', message: 'El envío sigue en curso; podrás volver a Análisis para consultar la conversación.' })
    } else if (location.pathname === '/app/analytics' && chatNoticeRef.current) {
      chatNoticeRef.current = false
      dismiss('task-academic-chat-send')
    }
  }, [dismiss, location.pathname, publish, runningTasks])

  const setTaskRunning = useCallback((key: string, running: boolean) => {
    setRunningTasks(previous => {
      const next = new Set(previous)
      if (running) next.add(key)
      else next.delete(key)
      return next
    })
  }, [])

  const runPlanGeneration = useCallback((operation: (signal: AbortSignal) => Promise<{ plan: { id: number } }>) => {
    const key = 'study-plan-generation'
    if (controllers.current.has(key)) return
    const controller = new AbortController()
    const noticeId = `task-${key}`
    controllers.current.set(key, controller)
    setTaskRunning(key, true)
    publish({ id: noticeId, kind: 'progress', title: 'Gemini está preparando tu plan', message: 'Puedes navegar por Cognova sin detenerla. Si recargas o cierras el navegador, no se garantiza que continúe.' })
    void operation(controller.signal).then(result => {
      if (controller.signal.aborted) return
      update(noticeId, {
        kind: 'success',
        title: 'Tu plan está listo',
        message: 'Ya puedes revisar la propuesta y decidir qué hacer con ella.',
        href: `/app/study-plans/${result.plan.id}`,
      })
      if (locationRef.current === '/app/study-plans') navigate(`/app/study-plans/${result.plan.id}`)
    }).catch((reason: unknown) => {
      if (controller.signal.aborted) return
      update(noticeId, {
        kind: 'error',
        title: 'No pudimos generar tu plan',
        message: `${planError(reason)} Puedes intentarlo de nuevo desde Planes.`,
        href: '/app/study-plans',
        urgent: true,
      })
    }).finally(() => {
      if (controllers.current.get(key) === controller) controllers.current.delete(key)
      if (!controller.signal.aborted) setTaskRunning(key, false)
    })
  }, [navigate, publish, setTaskRunning, update])

  const runPlanRegeneration = useCallback((
    planId: number,
    operation: (signal: AbortSignal) => Promise<unknown>,
    onSuccess?: () => void,
  ) => {
    const key = `study-plan-regeneration-${planId}`
    if (controllers.current.has(key)) return
    const controller = new AbortController()
    const noticeId = `task-${key}`
    const href = `/app/study-plans/${planId}`
    controllers.current.set(key, controller)
    setTaskRunning(key, true)
    publish({ id: noticeId, kind: 'progress', title: 'Gemini está preparando otra propuesta', message: 'Puedes cambiar de sección; el plan actual se conserva mientras tanto.' })
    void operation(controller.signal).then(() => {
      if (controller.signal.aborted) return
      update(noticeId, { kind: 'success', title: 'La nueva propuesta está lista', message: 'Revisa la propuesta actualizada y su historial.', href })
      if (locationRef.current === href) onSuccess?.()
    }).catch((reason: unknown) => {
      if (controller.signal.aborted) return
      const message = reason instanceof ApiError && reason.status === 429
        ? planError(reason)
        : 'No pudimos preparar otra propuesta. Tu plan actual se conserva sin cambios; puedes intentarlo de nuevo desde el plan.'
      update(noticeId, { kind: 'error', title: 'No pudimos generar otra propuesta', message, href, urgent: true })
    }).finally(() => {
      if (controllers.current.get(key) === controller) controllers.current.delete(key)
      if (!controller.signal.aborted) setTaskRunning(key, false)
    })
  }, [publish, setTaskRunning, update])

  const runAcademicChatSend = useCallback(async (operation: () => Promise<void>) => {
    const key = 'academic-chat-send'
    if (controllers.current.has(key)) return false
    const controller = new AbortController()
    controllers.current.set(key, controller)
    setTaskRunning(key, true)
    try {
      await operation()
      if (chatNoticeRef.current) {
        update('task-academic-chat-send', {
          kind: 'success',
          title: 'La respuesta está lista',
          message: 'Tu mensaje ya está disponible en la conversación.',
          href: '/app/analytics',
        })
      }
      return true
    } catch (reason) {
      if (chatNoticeRef.current) {
        const message = reason instanceof ApiError
          ? reason.message
          : 'No pudimos enviar tu mensaje. Comprueba tu conexión e inténtalo de nuevo.'
        update('task-academic-chat-send', {
          kind: 'error',
          title: 'No se pudo completar tu respuesta',
          message: `${message} Tu texto se conserva; vuelve a Análisis para reintentarlo.`,
          href: '/app/analytics',
          urgent: true,
        })
      }
      return false
    } finally {
      if (controllers.current.get(key) === controller) controllers.current.delete(key)
      setTaskRunning(key, false)
    }
  }, [setTaskRunning, update])

  const value = useMemo(() => ({
    publish, update, dismiss, runningTasks, runPlanGeneration, runPlanRegeneration,
    chatSelectedId, setChatSelectedId, chatDraft, setChatDraft, runAcademicChatSend,
  }), [chatDraft, chatSelectedId, dismiss, publish, runAcademicChatSend, runPlanGeneration, runPlanRegeneration, runningTasks, update])

  return <FeedbackContext.Provider value={value}>
    {children}
    <div className={styles.stack} aria-label="Notificaciones de Cognova">
      {notices.map(notice => <FeedbackToast key={notice.id} notice={notice} dismiss={dismiss} />)}
    </div>
  </FeedbackContext.Provider>
}

function FeedbackToast({ notice, dismiss }: { notice: FeedbackNotice; dismiss: (id: string) => void }) {
  useEffect(() => {
    if (notice.kind === 'progress') return
    const timer = window.setTimeout(() => dismiss(notice.id), 7000)
    return () => window.clearTimeout(timer)
  }, [dismiss, notice.id, notice.kind])

  return <section
    className={`${styles.toast} ${styles[notice.kind]}`}
    role={notice.kind === 'error' && notice.urgent ? 'alert' : 'status'}
    aria-live={notice.kind === 'error' ? 'assertive' : 'polite'}
  >
    <div className={styles.copy}>
      <strong>{notice.title}</strong>
      <p>{notice.message}</p>
      {notice.href && <Link to={notice.href}>Abrir resultado <span aria-hidden="true">→</span></Link>}
    </div>
    <button type="button" className={styles.dismiss} onClick={() => dismiss(notice.id)} aria-label={`Cerrar notificación: ${notice.title}`}>×</button>
  </section>
}

export function useGlobalFeedback(): FeedbackContextValue {
  const value = useContext(FeedbackContext)
  if (!value) throw new Error('useGlobalFeedback must be used within GlobalFeedbackProvider')
  return value
}

export function feedbackErrorMessage(reason: unknown): string {
  if (reason instanceof ApiError) return reason.message
  return 'No pudimos completar la operación. Comprueba tu conexión e inténtalo de nuevo.'
}
