import { useEffect, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { useQuestionnaire } from '../hooks/useQuestionnaire'
import { validateAnswer } from '../utils/questionnaireValidation'
import { QuestionnaireQuestion } from '../components/QuestionnaireQuestion'
import { QuestionnaireSummary } from '../components/QuestionnaireSummary'
import { QuestionnaireHistory } from '../components/QuestionnaireHistory'
import styles from '../components/Questionnaire.module.css'

export function QuestionnairePage() {
  const model = useQuestionnaire()
  const [step, setStep] = useState(0)
  const [validation, setValidation] = useState<string | null>(null)
  const [showHistory, setShowHistory] = useState(false)
  const heading = useRef<HTMLHeadingElement>(null)
  useEffect(() => { heading.current?.focus() }, [step, model.loading])

  if (model.loading) return <p role="status">Preparando tu cuestionario…</p>
  if (!model.catalog) return <section className={styles.panel}><h1>Tu percepción inicial</h1><p role="alert">{model.error ?? 'No hay un catálogo disponible.'}</p><button className="button" onClick={() => void model.load()}>Reintentar cuestionario</button></section>
  const { catalog, draft } = model
  const question = catalog.questions[step]
  const completed = catalog.questions.filter(q => !validateAnswer(q, draft[q.id])).length
  function next(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const issue = validateAnswer(question, draft[question.id])
    setValidation(issue)
    if (issue) return
    if (step < catalog.questions.length - 1) setStep(step + 1)
    else {
      const missing = catalog.questions.findIndex(q => validateAnswer(q, draft[q.id]))
      if (missing >= 0) { setStep(missing); setValidation('Completa esta pregunta antes de guardar.'); return }
      void model.save()
    }
  }
  return <section className={styles.panel} aria-labelledby="questionnaire-title">
    <p className="eyebrow">TU PERCEPCIÓN · UN PUNTO DE PARTIDA</p>
    <h1 id="questionnaire-title" ref={heading} tabIndex={-1}>{model.current ? 'Tu forma de estudiar' : 'Conozcamos cómo estudias'}</h1>
    <p className={styles.hint}>No hay respuestas correctas. Esto refleja cómo te ves hoy, y puede cambiar contigo.</p>
    {model.current && <p>Revisión vigente: {model.current.revision}. Guardar creará una nueva revisión.</p>}
    <p id="questionnaire-progress">Pregunta {step + 1} de {catalog.questions.length} · {completed} respondidas</p>
    <progress className={styles.progress} max={catalog.questions.length} value={completed} aria-labelledby="questionnaire-progress" />
    {model.saved && <p role="status" className={styles.notice}>Revisión {model.saved.revision} guardada correctamente.</p>}
    {model.error && <p role="alert" className={styles.notice}>{model.error}</p>}
    {model.needsSync && <div className={styles.notice}><p>Tus respuestas ya se guardaron. Solo falta actualizar el estado de tu cuenta.</p><button className="button" disabled={model.busy} onClick={() => void model.syncProfile()}>Reintentar actualización de cuenta</button></div>}
    {model.conflict && <section className={styles.notice} aria-label="Conflicto de revisión">
      <h2>Hay respuestas más recientes</h2><p>Conservamos tus respuestas locales. Revisa la versión actual antes de decidir; no se combinarán automáticamente.</p>
      {model.latest ? <>
        <details><summary>Ver revisión vigente {model.latest.revision}</summary><QuestionnaireSummary catalog={catalog} response={model.latest} /></details>
        <div className={styles.actions}>
          <button className="button" disabled={model.busy} onClick={() => void model.save(model.latest!.revision)}>Guardar mis respuestas sobre revisión {model.latest.revision}</button>
          <button className="button" disabled={model.busy} onClick={() => { model.useLatest(); setStep(0); setValidation(null) }}>Descartar mi borrador y usar revisión vigente</button>
        </div>
      </> : <button className="button" disabled={model.busy} onClick={() => void model.checkLatest()}>Consultar revisión vigente</button>}
    </section>}
    <form onSubmit={next} noValidate aria-busy={model.busy}>
      <QuestionnaireQuestion key={question.id} question={question} answer={draft[question.id]} disabled={model.busy || model.needsSync}
        error={validation} onChange={answer => { model.setDraft(previous => ({ ...previous, [question.id]: answer })); setValidation(null) }} />
      <div className={styles.actions}>
        <button className="button" type="button" disabled={step === 0 || model.busy} onClick={() => { setStep(step - 1); setValidation(null) }}>Volver</button>
        <button className="button" type="submit" disabled={model.busy || model.needsSync || (model.conflict && step === catalog.questions.length - 1)}>
          {model.busy ? 'Procesando…' : step < catalog.questions.length - 1 ? 'Continuar' : model.current ? 'Guardar nueva revisión' : 'Guardar percepción inicial'}
        </button>
      </div>
    </form>
    {model.busy && <p role="status">Comunicando tus respuestas con Cognova…</p>}
    <p className={styles.hint}>Puedes volver sin perder tus elecciones. Las respuestas sin guardar permanecen solo en esta pantalla; una recarga descarta ese borrador.</p>
    {model.current && <div className={styles.actions}>
      <button className="button" onClick={() => setShowHistory(!showHistory)} aria-expanded={showHistory}>{showHistory ? 'Ocultar revisiones' : 'Consultar revisiones'}</button>
      <Link className="button" to="/dashboard">Ir a mi espacio</Link>
    </div>}
    {showHistory && <QuestionnaireHistory key={model.current?.revision ?? 0} catalog={catalog} service={model.service} />}
  </section>
}
