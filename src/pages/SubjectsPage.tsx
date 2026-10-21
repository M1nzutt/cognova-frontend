import { Link, useLocation } from 'react-router-dom'
import { useSubjectData } from '../hooks/useSubjectData'
import { difficultyLabels } from '../utils/subjectPresentation'
import styles from '../components/Subjects.module.css'
export function SubjectsPage() {
  const location = useLocation()
  const status = location.pathname.endsWith('/archived') ? 'archived' : 'active'
  return <SubjectListView key={status} status={status} />
}
function SubjectListView({ status }: { status: 'active' | 'archived' }) {
  const { data, loading, error, retry, loadMore, moreBusy } = useSubjectData(undefined, status)
  const location = useLocation()
  return <section className={styles.page}>
    <p className="eyebrow">TU ESPACIO ACADÉMICO</p>
    <div className={styles.heading}><div><h1>Materias</h1><p>Organiza lo que estás aprendiendo, a tu ritmo.</p></div>{data && data.activeCount < 5 && <Link className={styles.primary} to="/app/subjects/new">Nueva materia</Link>}</div>
    <nav className={styles.tabs} aria-label="Estado de materias"><Link to="/app/subjects" aria-current={status === 'active' ? 'page' : undefined}>Activas</Link><Link to="/app/subjects/archived" aria-current={status === 'archived' ? 'page' : undefined}>Archivadas</Link></nav>
    {location.state?.subjectDeleted && <p role="status">Materia eliminada.</p>}
    {loading && <p role="status">Cargando tus materias…</p>}
    {error && <div role="alert"><p>{error}</p><button className="button" onClick={retry}>Reintentar</button></div>}
    {!loading && data && <>
      <p className={styles.muted}>{data.activeCount} de 5 materias activas. Las archivadas no ocupan cupo.</p>
      {data.activeCount >= 5 && <p className={styles.notice}>Ya tienes cinco materias activas. Archiva una para crear o reactivar otra.</p>}
      {!data.list.items.length ? <div className={styles.empty}><h2>{status === 'active' ? 'Un espacio para tus materias' : 'No tienes materias archivadas'}</h2><p>{status === 'active' ? 'Añade tu primera materia para tenerla siempre a mano.' : 'Aquí encontrarás las materias que decidas guardar para después.'}</p></div>
        : <ul className={styles.grid}>{data.list.items.map(item => <li key={item.id}><Link className={styles.card} to={'/app/subjects/' + item.id}><span className={styles.swatch} data-color={item.color_base} data-shade={item.color_shade} aria-hidden="true" /><h2>{item.name}</h2><p>Dificultad {difficultyLabels[item.difficulty].toLowerCase()}</p><span>{item.status === 'archived' ? 'Archivada' : 'Ver materia'} →</span></Link></li>)}</ul>}
      {data.list.next_after_id !== null && <button className="button" disabled={moreBusy} onClick={() => void loadMore()}>{moreBusy ? 'Cargando…' : 'Cargar más materias'}</button>}
    </>}
  </section>
}
