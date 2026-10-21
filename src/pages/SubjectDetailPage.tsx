import { useRef, useState } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import { SubjectForm } from '../components/SubjectForm'
import { SubjectDeleteConfirmation } from '../components/SubjectDeleteConfirmation'
import { useSubjectData } from '../hooks/useSubjectData'
import { useSubjectMutation } from '../hooks/useSubjectMutation'
import { colorLabels, difficultyLabels } from '../utils/subjectPresentation'
import styles from '../components/Subjects.module.css'
export function SubjectDetailPage() {
  const { subjectId } = useParams()
  return <SubjectDetail key={subjectId} id={Number(subjectId)} />
}
function SubjectDetail({ id }: { id: number }) {
  const { service, data, loading, error, retry, setItem } = useSubjectData(id)
  const mutation = useSubjectMutation(); const navigate = useNavigate(); const location = useLocation()
  const [editing, setEditing] = useState(false); const [deleting, setDeleting] = useState(false)
  const [notice, setNotice] = useState(location.state?.subjectCreated ? 'Materia creada.' : '')
  const deleteButton = useRef<HTMLButtonElement>(null)
  const item = data?.item
  const closeDelete = () => { setDeleting(false); mutation.clearError(); deleteButton.current?.focus() }
  return <section className={styles.page}><Link to="/app/subjects">← Materias</Link>
    {loading && <p role="status">Cargando materia…</p>}
    {error && <div role="alert"><h1>No pudimos abrir la materia</h1><p>{error}</p><button className="button" onClick={retry}>Reintentar</button></div>}
    {!loading && item && data && <>
      <div className={styles.heading}><h1>{editing ? 'Editar materia' : item.name}</h1><span className={styles.badge}>{item.status === 'active' ? 'Activa' : 'Archivada'}</span></div>
      {notice && <p role="status">{notice}</p>}
      {editing ? <SubjectForm catalog={data.catalog} initial={item} busy={mutation.busy} error={mutation.error} onCancel={() => { setEditing(false); mutation.clearError() }} onSave={body => void mutation.run(signal => service.update(id, body, signal), updated => { setItem(updated); setEditing(false); setNotice('Cambios guardados.') })} /> : <>
        <div className={styles.detail}><span className={styles.swatch} data-color={item.color_base} data-shade={item.color_shade} aria-hidden="true" /><dl><dt>Dificultad</dt><dd>{difficultyLabels[item.difficulty]}</dd><dt>Color</dt><dd>{colorLabels[item.color_base] ?? 'Color seleccionado'}</dd><dt>Estado</dt><dd>{item.status === 'active' ? 'Cuenta entre tus materias activas.' : 'No ocupa un cupo entre tus materias activas.'}</dd></dl></div>
        {!deleting && mutation.error && <p role="alert" className={styles.error}>{mutation.error}</p>}
        {item.status === 'archived' && data.activeCount >= 5 && <p className={styles.notice}>No hay cupo para reactivar esta materia. Archiva otra primero.</p>}
        <div className="actions"><button className={styles.primary} disabled={mutation.busy} onClick={() => { setEditing(true); setNotice(''); mutation.clearError() }}>Editar materia</button>
          <button className="button" disabled={mutation.busy || (item.status === 'archived' && data.activeCount >= 5)} onClick={() => { setNotice(''); void mutation.run(signal => item.status === 'active' ? service.archive(id, signal) : service.reactivate(id, signal), updated => { setItem(updated); setNotice(updated.status === 'archived' ? 'Materia archivada.' : 'Materia reactivada.') }) }}>{item.status === 'active' ? 'Archivar materia' : 'Reactivar materia'}</button></div>
        <section className={styles.dangerZone}><h2>Eliminar materia</h2><p>Elimina esta materia de forma permanente. Para conservarla, puedes archivarla.</p><button ref={deleteButton} className={styles.danger} disabled={mutation.busy} onClick={() => { mutation.clearError(); setDeleting(true) }}>Eliminar materia</button></section>
      </>}
      {deleting && <SubjectDeleteConfirmation name={item.name} busy={mutation.busy} error={mutation.error} onCancel={closeDelete} onConfirm={() => void mutation.run(signal => service.remove(id, true, signal), () => navigate('/app/subjects', { replace: true, state: { subjectDeleted: true } }))} />}
    </>}
  </section>
}
