import { Link, useNavigate } from 'react-router-dom'
import { SubjectForm } from '../components/SubjectForm'
import { useSubjectData } from '../hooks/useSubjectData'
import { useSubjectMutation } from '../hooks/useSubjectMutation'
import styles from '../components/Subjects.module.css'
export function SubjectCreatePage() {
  const { service, data, loading, error, retry } = useSubjectData()
  const mutation = useSubjectMutation(); const navigate = useNavigate()
  return <section className={styles.page}><Link to="/app/subjects">← Materias</Link><h1>Nueva materia</h1>
    {loading && <p role="status">Preparando tu materia…</p>}
    {error && <div role="alert"><p>{error}</p><button className="button" onClick={retry}>Reintentar</button></div>}
    {!loading && data && (data.activeCount >= 5 ? <p className={styles.notice}>Ya tienes cinco materias activas. Archiva una antes de crear otra.</p> : <SubjectForm catalog={data.catalog} busy={mutation.busy} error={mutation.error} onCancel={() => navigate('/app/subjects')} onSave={body => void mutation.run(signal => service.create(body, signal), item => navigate('/app/subjects/' + item.id, { replace: true, state: { subjectCreated: true } }))} />)}
  </section>
}
