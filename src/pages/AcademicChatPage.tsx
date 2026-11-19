import { useEffect, useRef, useState } from 'react'
import type { FormEvent, KeyboardEvent } from 'react'
import { ApiError } from '../api/ApiError'
import { Icon } from '../components/Icon'
import { useAcademicChatService } from '../hooks/useAcademicChatService'
import type { AcademicConversation, AcademicMessage } from '../types/academicChat'
import { useGlobalFeedback } from '../feedback/GlobalFeedback'
import styles from './AcademicChatPage.module.css'

const suggestions = [
  '¿Qué actividad debería priorizar esta semana?',
  '¿Cómo ha sido mi tiempo de estudio últimamente?',
  'Ayúdame a pensar un plan realista para mis pendientes.',
]

function dateLabel(value: string): string {
  return new Intl.DateTimeFormat('es', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value))
}

export function AcademicChatPage({
  variant = 'page',
}: {
  variant?: 'page' | 'sidebar'
} = {}) {
  const service = useAcademicChatService()
  const {
    chatSelectedId: selectedId,
    setChatSelectedId: setSelectedId,
    chatDraft: draft,
    setChatDraft: setDraft,
    runningTasks,
    runAcademicChatSend,
  } = useGlobalFeedback()
  const [conversations, setConversations] = useState<AcademicConversation[]>([])
  const [messages, setMessages] = useState<AcademicMessage[]>([])
  const [nextBeforeId, setNextBeforeId] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const sending = runningTasks.has('academic-chat-send')
  const [error, setError] = useState<string | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const startingRef = useRef(false)

  useEffect(() => {
    const controller = new AbortController()
    void service.listConversations(controller.signal)
      .then(setConversations)
      .catch((reason: unknown) => {
        if (!controller.signal.aborted) setError(readError(reason))
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false)
      })
    return () => controller.abort()
  }, [service])

  useEffect(() => {
    if (selectedId === null) {
      return
    }
    const controller = new AbortController()
    void service.messages(selectedId, undefined, controller.signal)
      .then(page => {
        setMessages(page.items)
        setNextBeforeId(page.next_before_id)
      })
      .catch((reason: unknown) => {
        if (!controller.signal.aborted) setError(readError(reason))
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false)
      })
    return () => controller.abort()
  }, [selectedId, service])

  useEffect(() => {
    const bottom = bottomRef.current
    if (typeof bottom?.scrollIntoView === 'function') {
      const reduceMotion = window.matchMedia(
        '(prefers-reduced-motion: reduce)',
      ).matches
      bottom.scrollIntoView({
        behavior: reduceMotion ? 'auto' : 'smooth',
        block: 'end',
      })
    }
  }, [messages, sending])

  const refreshConversations = async () => {
    const rows = await service.listConversations()
    setConversations(rows)
  }

  const startConversation = async () => {
    if (startingRef.current || sending) return
    startingRef.current = true
    setError(null)
    try {
      const conversation = await service.createConversation()
      setConversations(items => [conversation, ...items])
      setMessages([])
      setLoading(true)
      setError(null)
      setSelectedId(conversation.id)
      setDraft('')
      textareaRef.current?.focus()
    } catch (reason) {
      setError(readError(reason))
    } finally {
      startingRef.current = false
    }
  }

  const loadOlder = async () => {
    if (selectedId === null || nextBeforeId === null) return
    try {
      const page = await service.messages(selectedId, nextBeforeId)
      setMessages(items => [...page.items, ...items])
      setNextBeforeId(page.next_before_id)
    } catch (reason) {
      setError(readError(reason))
    }
  }

  const submit = async (event?: FormEvent, suggested?: string) => {
    event?.preventDefault()
    const content = (suggested ?? draft).trim()
    if (!content || sending) return
    await runAcademicChatSend(async () => {
      setError(null)
      let conversationId = selectedId
      let createdForMessage = false
      try {
        if (conversationId === null) {
          const conversation = await service.createConversation()
          conversationId = conversation.id
          createdForMessage = true
          setConversations(items => [conversation, ...items])
          setMessages([])
          setSelectedId(conversation.id)
        }
        const result = await service.send(conversationId, content)
        setConversations(items => [
          result.conversation,
          ...items.filter(item => item.id !== result.conversation.id),
        ])
        setSelectedId(conversationId)
        setMessages(items => createdForMessage ? [result.user_message, result.assistant_message] : [...items, result.user_message, result.assistant_message])
        setDraft('')
        await refreshConversations()
      } catch (reason) {
        setError(readError(reason))
        if (conversationId !== null) {
          try {
            setSelectedId(conversationId)
            const page = await service.messages(conversationId)
            setMessages(page.items)
            setNextBeforeId(page.next_before_id)
            if (page.items.some(item => item.role === 'user' && item.content === content)) {
              setDraft('')
            }
            await refreshConversations()
          } catch {
            // Keep the original API failure and preserve the unsent draft.
          }
        }
        throw reason
      }
    })
  }

  const onComposerKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault()
      void submit()
    }
  }

  const keepComposerVisible = () => {
    if (window.matchMedia('(max-width: 900px)').matches) {
      window.requestAnimationFrame(() => {
        textareaRef.current?.scrollIntoView({ block: 'center', behavior: 'instant' })
      })
    }
  }

  const selected = conversations.find(item => item.id === selectedId)
  const embedded = variant === 'sidebar'

  return (
    <section
      className={`${styles.page} ${embedded ? styles.pageEmbedded : ''}`}
      aria-labelledby="chat-title"
    >
      <header className={`${styles.heading} ${embedded ? styles.headingEmbedded : ''}`}>
        {embedded ? (
          <>
            <div className={styles.embeddedTitle}>
            <p className="eyebrow">ACOMPAÑAMIENTO ACADÉMICO</p>
            <h2 id="chat-title">IA Cognova <span aria-hidden="true">✦</span></h2>
            <p className={styles.subtitle}>Tu acompañante académico, integrado en tu recorrido.</p>
            </div>
            <button className={styles.newButton} type="button" onClick={() => void startConversation()} disabled={sending}>
              <Icon name="chat" size={18} /><span>Nueva conversación</span>
            </button>
          </>
        ) : (
          <>
          <div>
            <p className="eyebrow">ACOMPAÑAMIENTO ACADÉMICO</p>
            <h1 id="chat-title">IA Cognova <span aria-hidden="true">✦</span></h1>
            <p className={styles.subtitle}>Observa tu recorrido, conecta tus ideas y decide tu siguiente paso.</p>
          </div>
          <button className={styles.newButton} type="button" onClick={() => void startConversation()} disabled={sending}>
            <Icon name="chat" size={18} /><span>Nueva conversación</span>
          </button>
          </>
        )}
      </header>

      <div className={`${styles.layout} ${embedded ? styles.layoutEmbedded : ''}`}>
        <nav className={`${styles.history} ${embedded ? styles.historyEmbedded : ''}`} aria-label="Historial de conversaciones">
          <div className={styles.historyHeading}>
            <h2>Conversaciones</h2>
            <span>{conversations.length}/50</span>
          </div>
          {loading && conversations.length === 0 ? <p className={styles.muted}>Cargando historial…</p>
            : conversations.length === 0 ? <p className={styles.muted}>Tus conversaciones aparecerán aquí.</p>
              : <ul className={styles.conversationList}>
        {conversations.map(conversation => <li key={conversation.id}>
                  <button
                    type="button"
                    className={`${styles.conversationButton} ${selectedId === conversation.id ? styles.selected : ''}`}
                    aria-pressed={selectedId === conversation.id}
                    disabled={sending}
                    onClick={() => {
                      if (selectedId === conversation.id) return
                      setMessages([])
                      setLoading(true)
                      setError(null)
                      setSelectedId(conversation.id)
                    }}
                  >
                    <span className={styles.conversationTitle}>{conversation.title}</span>
                    <span className={styles.conversationDate}>{dateLabel(conversation.updated_at)}</span>
                  </button>
                </li>)}
              </ul>}
        </nav>

        <section className={`${styles.chat} ${embedded ? styles.chatEmbedded : ''}`} aria-label="Conversación académica">
          {selected && <div className={styles.chatBar}>
            <div className={styles.chatIdentity}>
              <span className={styles.orbit}><Icon name="orbit" size={20} /></span>
              <div><h2>{selected.title}</h2><p>Tu espacio de conversación privada</p></div>
            </div>
            <span className={styles.privateBadge}>Solo tú</span>
          </div>}

          <div className={styles.messages} aria-live="polite" aria-relevant="additions text">
            {!selectedId && !loading && <div className={styles.welcome}>
              <span className={styles.welcomeIcon}><Icon name="orbit" size={30} /></span>
              <h2>¿Qué te gustaría conversar hoy?</h2>
              <p>Soy tu acompañante académico. Puedo ayudarte a mirar tus materias, actividades, planes y sesiones registradas.</p>
              <p className={styles.principle}>La IA observa, relaciona, cuestiona y pregunta. Tú interpretas y decides.</p>
              <div className={styles.suggestions}>
                {suggestions.map(item => <button type="button" key={item} onClick={() => void submit(undefined, item)}>{item}<span aria-hidden="true">→</span></button>)}
              </div>
            </div>}
            {loading && selectedId !== null && <p className={styles.loadingState}>Cargando conversación…</p>}
            {nextBeforeId !== null && !loading && <button className={styles.olderButton} type="button" onClick={() => void loadOlder()}>Ver mensajes anteriores</button>}
            {messages.map(message => <article key={message.id} className={`${styles.message} ${message.role === 'user' ? styles.userMessage : styles.assistantMessage}`}>
              {message.role === 'assistant' && <span className={styles.messageAvatar}><Icon name="orbit" size={17} /></span>}
              <div className={styles.bubble}>
                <p className={styles.messageText}>{message.content}</p>
                {message.evidence.length > 0 && <details className={styles.evidence}>
                  <summary>En qué se basa · {message.evidence.length}</summary>
                  <ul>{message.evidence.map((item, index) => <li key={`${message.id}-${index}`}>{item}</li>)}</ul>
                </details>}
                <time dateTime={message.created_at}>{dateLabel(message.created_at)}</time>
              </div>
            </article>)}
            {sending && <div className={`${styles.message} ${styles.assistantMessage}`} role="status">
              <span className={styles.messageAvatar}><Icon name="orbit" size={17} /></span>
              <div className={`${styles.bubble} ${styles.typing}`}><span /><span /><span /><span className={styles.srOnly}>Cognova está pensando</span></div>
            </div>}
            {error && <div className={styles.error} role="alert"><p>{error}</p><button type="button" onClick={() => setError(null)}>Cerrar</button></div>}
            <div ref={bottomRef} />
          </div>

          <form className={styles.composer} onSubmit={event => void submit(event)}>
            <label className={styles.srOnly} htmlFor="chat-message">Escribe tu consulta académica</label>
            <textarea
              ref={textareaRef}
              id="chat-message"
              value={draft}
              onChange={event => setDraft(event.target.value)}
              onKeyDown={onComposerKeyDown}
              onFocus={keepComposerVisible}
              maxLength={4000}
              rows={1}
              placeholder="Cuéntame en qué quieres que te apoye hoy…"
              disabled={sending}
            />
            <div className={styles.composerActions}>
              <span>{draft.length}/4000 · Enter para enviar · Shift+Enter para salto</span>
              <button type="submit" aria-label="Enviar mensaje" disabled={!draft.trim() || sending}>
                <span aria-hidden="true">↑</span>
              </button>
            </div>
          </form>
          <p className={styles.disclaimer}>Respuestas basadas en tus registros académicos. Cognova no modifica tus recursos.</p>
        </section>
      </div>
    </section>
  )
}

function readError(reason: unknown): string {
  if (reason instanceof ApiError) {
    if (reason.code === 'ACADEMIC_CHAT_LIMIT') return 'Has enviado varios mensajes. Espera un momento y vuelve a intentarlo.'
    if (reason.code === 'ACADEMIC_CHAT_UNAVAILABLE' || reason.code === 'GEMINI_RATE_LIMIT') {
      return 'Ahora mismo no puedo responder. Tu mensaje se conserva; inténtalo de nuevo más tarde.'
    }
    return reason.message
  }
  return 'No pudimos completar la solicitud. Comprueba tu conexión e inténtalo de nuevo.'
}
