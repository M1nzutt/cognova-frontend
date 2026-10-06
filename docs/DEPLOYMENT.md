# Despliegue del avance: Netlify + Render

## Estado

Configuración preparada, no desplegada ni verificada contra backend real. Hace falta el origen HTTPS de Render. No modificar backend desde este repositorio.

El navegador consume `/api/v1` del mismo origen Netlify. Netlify reenvía `/api/*` hacia Render conservando la ruta; Render accede a Render Postgres. Las credenciales de PostgreSQL nunca pertenecen al frontend.

## Preparación del backend

El responsable del backend debe sincronizar [AUTH_CONTRACT](AUTH_CONTRACT.md):

- `cognova_refresh`: HttpOnly, Secure, SameSite=Lax, Path=/api/v1/auth.
- `cognova_csrf`: legible por JS, Secure, SameSite=Lax, Path=/.
- Ambas host-only, sin Domain apuntando a Render; borrar con los mismos paths. Eliminar la antigua cookie CSRF con Path=/api/v1/auth durante la migración para evitar duplicados.
- Refresh y logout validan cookie/header CSRF; rotación y revocación reales.
- Todas las respuestas auth, incluidos errores, emiten `Cache-Control: no-store`. Las cabeceras estáticas de Netlify no se aplican a respuestas proxied.
- Permitir el origen HTTPS exacto del frontend en las comprobaciones de origen/CORS correspondientes, credenciales y headers Authorization, Content-Type y X-CSRF-Token. No usar wildcard con credenciales.
- Configurar PostgreSQL, migraciones, secretos, HTTPS y disponibilidad desde el proyecto backend.

## Configuración de Netlify

1. Publicar los commits en el remoto e importar cognova-frontend en Netlify.
2. Usar raíz del repositorio; [netlify.toml](../netlify.toml) define build `npm run build:netlify`, publicación `dist` y Node 24.
3. En variables de build configurar `RENDER_API_ORIGIN` con el origen real `https://<servicio>.onrender.com`, sin ruta. Reemplazar el marcador por el servicio existente. Mantener `VITE_API_BASE_URL=/api/v1`.
4. No agregar secretos, JWT, credenciales de base de datos ni keys a variables VITE. RENDER_API_ORIGIN es configuración pública de routing.
5. Desplegar. El comando valida el origen, ejecuta lint/tests/build y genera `dist/_redirects`: `/api` y `/api/*` primero, fallback `/* /index.html 200` al final. Un build normal no genera estos redirects.
6. Configurar deploy previews con backend de pruebas separado o desactivarlas; no compartir sesiones/datos de producción entre entornos.

No se interpola una variable dentro de TOML: [el generador](../scripts/netlifyRedirects.ts) escribe el destino concreto durante build y rechaza orígenes no HTTPS, rutas, credenciales y hosts ajenos a onrender.com. Un futuro dominio propio requiere revisar esta validación explícita.

CSP permite scripts, estilos y conexiones del mismo origen, sin unsafe-inline/unsafe-eval. Revisar las cabeceras desplegadas, no las de HMR. HTTPS obligatorio; evaluar HSTS según dominio y subdominios antes de habilitar preload.

## Pruebas reales después de desplegar

Crear mediante la UI una cuenta dedicada a prueba. Configurar en el entorno de terminal, sin guardar en Git ni logs:

| Variable | Valor |
| --- | --- |
| SMOKE_BASE_URL | Origen HTTPS de Netlify, sin ruta |
| SMOKE_EMAIL | Email de la cuenta de prueba existente |
| SMOKE_PASSWORD | Contraseña de esa cuenta |

Ejecutar `npm run smoke:auth`. Usa cookies/tokens en memoria y comprueba login, me, atributos de cookies, rechazo de refresh sin CSRF, rotación, logout y revocación del access. Exige no-store. Intenta cerrar la sesión de prueba al terminar; no imprime credenciales. Registrar fecha, URL pública y resultado sin datos sensibles.

El smoke HTTP no implementa las políticas de un navegador. Completar también:

1. Abrir `/login` y `/dashboard` directamente para comprobar fallback; la segunda debe exigir sesión.
2. Registrar usuario, llegar al cuestionario pendiente y usar el enlace al dashboard. Verificar perfil real.
3. Login → dashboard; recargar y comprobar restauración. Cambiar tema y revisar móvil/teclado.
4. Inspeccionar cookies: paths, HttpOnly solo refresh, Secure y Lax. Confirmar ausencia de tokens/perfil en localStorage y sessionStorage.
5. Verificar refresh con header CSRF y peticiones Bearer; comprobar error de red y reintento de restauración sin bucles.
6. Logout → login; recargar/volver atrás sin recuperar datos protegidos. Verificar eliminación de cookies y revocación.
7. Revisar CSP/cabeceras de HTML, no-store en API y que un 401 de API sea JSON, no index.html.

Si contrato y backend difieren, registrar y corregir explícitamente antes de presentar la integración como aprobada. No reescribir cookies para ocultarlo.

Netlify limita sus proxies a 26 segundos; el cliente tiene timeout de 20 segundos. Un arranque lento de Render puede fallar: comprobar disponibilidad antes de la presentación y usar errores/reintentos visibles. No reintentar automáticamente un registro POST por timeout.

Referencias oficiales: [rewrites y proxies](https://docs.netlify.com/manage/routing/redirects/rewrites-proxies/), [cabeceras](https://docs.netlify.com/manage/routing/headers/), [configuración de build](https://docs.netlify.com/build/configure-builds/file-based-configuration/).
