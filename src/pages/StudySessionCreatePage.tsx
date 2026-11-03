import { Link, useNavigate } from 'react-router-dom'
import { StudySessionPlanForm } from '../components/StudySessionPlanForm'
import { useStudySessionMutation } from '../hooks/useStudySessionMutation'
import { useStudySessionPlanOptions } from '../hooks/useStudySessionPlanOptions'
import { useStudySessionServices } from '../hooks/useStudySessionServices'
import styles from '../components/StudySessions.module.css'

export function StudySessionCreatePage() {
  const services = useStudySessionServices()
  const options = useStudySessionPlanOptions()
  const mutation = useStudySessionMutation()
  const navigate = useNavigate()
  const selectSubject = options.selectSubject
  return <section className={styles.page}>
    <Link to="/app/sessions">← Sesiones</Link><h1>Planificar sesión</h1>
    <p>Elige cuándo estudiar y la materia. El tiempo real se registra al iniciar el temporizador.</p>
    {options.loading && <p role="status">Cargando materias…</p>}
    {options.error && <div role="alert"><p>{options.error}</p><button className="button" type="button" onClick={options.retry}>Reintentar</button></div>}
    {!options.loading && options.subjects.length === 0 && !options.error && <div className={styles.empty}><h2>Primero necesitas una materia</h2><p>Cada sesión pertenece a una materia tuya.</p><Link to="/app/subjects/new">Crear una materia</Link></div>}
    {!options.loading && options.subjects.length > 0 && <StudySessionPlanForm subjects={options.subjects} activities={options.activities} activitiesLoading={options.activitiesLoading} busy={mutation.busy} error={mutation.error || options.error} onSubjectChange={selectSubject} onCancel={() => navigate('/app/sessions')} onSave={body => void mutation.run(signal => services.sessions.create(body, signal), item => navigate(`/app/sessions/${item.id}`, { replace: true, state: { sessionCreated: true } }))} />}
  </section>
}
