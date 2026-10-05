import { Link } from 'react-router-dom'

export function NotFoundPage() {
  return (
    <section aria-labelledby="not-found-title">
      <p className="eyebrow">404 · PÁGINA NO ENCONTRADA</p>
      <h1 id="not-found-title">No encontramos esta página</h1>
      <p>La dirección no existe. Puedes volver al inicio de tu espacio.</p>
      <Link className="button" to="/">Volver al inicio</Link>
    </section>
  )
}
