export function renderNetlifyRedirects(origin: string | undefined, apiBase = '/api/v1'): string {
  if (!origin) throw new Error('Configura RENDER_API_ORIGIN en Netlify con el origen HTTPS real del backend (sin /api/v1).')
  if (apiBase !== '/api/v1') throw new Error('VITE_API_BASE_URL debe ser /api/v1 para mantener las cookies en el origen Netlify.')
  let url: URL
  try { url = new URL(origin) } catch { throw new Error('RENDER_API_ORIGIN no es una URL válida.') }
  if (url.protocol !== 'https:' || url.username || url.password || url.port || url.search || url.hash
    || url.pathname !== '/' || !/^[a-z0-9-]+\.onrender\.com$/.test(url.hostname)
    || /\s/.test(origin)) {
    throw new Error('RENDER_API_ORIGIN debe ser https://<servicio>.onrender.com, sin ruta, puerto, credenciales ni parámetros.')
  }
  return `/api ${url.origin}/api 200!\n/api/* ${url.origin}/api/:splat 200!\n/* /index.html 200\n`
}
