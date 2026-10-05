import { useAuth } from '../hooks/useAuth'

export function DashboardPendingPage() {
  const { user } = useAuth()
  return (
    <section>
      <p className="eyebrow">TU ESPACIO ACADÉMICO</p>
      <h1>Te damos la bienvenida, {user?.name}</h1>
      <p>Has iniciado sesión correctamente.</p>
      <p>Tu dashboard está en preparación. Aquí podrás consultar tu progreso cuando esté disponible.</p>
    </section>
  )
}
