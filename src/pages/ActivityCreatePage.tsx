import { Link, useNavigate } from 'react-router-dom'
import { ActivityForm } from '../components/ActivityForm'
import { useActivityServices } from '../hooks/useActivityServices'
import { useActivityResource } from '../hooks/useActivityResource'
import { useActivityMutation } from '../hooks/useActivityMutation'
import styles from '../components/Activities.module.css'
export function ActivityCreatePage() {
  const { service, loadSubjects } = useActivityServices(), resource = useActivityResource(loadSubjects), mutation = useActivityMutation(), navigate = useNavigate()
  return <section className={styles.page}><Link to="/app/activities">← Actividades</Link><h1>Nueva actividad</h1><p>Define lo que quieres hacer y el tiempo que estimas dedicarle.</p>
    {resource.loading && <p role="status">Cargando materias…</p>}{resource.error && <div role="alert"><p>{resource.error}</p><button className="button" onClick={resource.retry}>Reintentar</button></div>}
    {resource.data && !resource.loading && (resource.data.length ? <ActivityForm subjects={resource.data} busy={mutation.busy} error={mutation.error} onCancel={() => navigate('/app/activities')} onSave={body => void mutation.run(signal => service.create(body, signal), item => navigate('/app/activities/' + item.id, { replace: true, state: { activityCreated: true } }))} /> : <div className={styles.empty}><h2>Primero necesitas una materia</h2><p>Cada actividad pertenece a una de tus materias.</p><Link to="/app/subjects/new">Crear una materia</Link></div>)}
  </section>
}
