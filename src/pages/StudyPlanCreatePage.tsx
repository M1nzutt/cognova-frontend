import { useCallback } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { StudyPlanForm } from '../components/StudyPlanForm'
import { useStudyPlanServices } from '../hooks/useStudyPlanServices'
import { useStudyPlanResource } from '../hooks/useStudyPlanResource'
import { useStudyPlanMutation } from '../hooks/useStudyPlanMutation'
import styles from '../components/StudyPlans.module.css'

export function StudyPlanCreatePage() {
  const services = useStudyPlanServices()
  const load = useCallback((signal: AbortSignal) => services.loadChoices(signal), [services])
  const choices = useStudyPlanResource(load)
  const mutation = useStudyPlanMutation()
  const navigate = useNavigate()
  return <section className={styles.page}>
    <Link to="/app/study-plans">← Planes de estudio</Link>
    <h1>Crear plan de estudio</h1>
    <p>Define tu objetivo y reúne tus recursos existentes. Podrás editar el borrador antes de activarlo.</p>
    {choices.loading && <p role="status">Cargando opciones del plan…</p>}
    {choices.error && <div role="alert"><p>{choices.error}</p><button className="button" type="button" onClick={choices.retry}>Reintentar</button></div>}
    {choices.data && <StudyPlanForm {...choices.data} busy={mutation.busy} error={mutation.error}
      onCancel={() => navigate('/app/study-plans')}
      onSave={value => void mutation.run(
        signal => services.plans.create(value, signal),
        plan => navigate(`/app/study-plans/${plan.id}`, { replace: true, state: { planCreated: true } }),
      )} />}
  </section>
}
