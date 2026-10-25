# Frontend Actividades — release cerrado 2026-10-24

Estado vigente — 2026-10-25: Materias y Actividades están cerrados en el frontend productivo.
Backend: `fe5989b86d93d10e724cbf28de4f9d64048bb711`; schema `0005_activities`.
Siguiente módulo funcional: **Calendario**, con contrato aún por definir.
Este cierre no añade endpoints, DTOs, reglas ni diseño de Calendario.

Esta revisión solo rectifica documentación, con [skip ci] [skip netlify]; no
redeploya. Los bloqueos de publicación del onboarding inferiores son históricos.

Sitio existente bf6ef7b1-c280-4de9-8ea1-f70630cc14c1;
https://cognova-frontend.netlify.app. Main integra feat/activities-ui sin squash.
SHA productivo 27a2c29a61fb0b393d27cd6a591e0f025581a13d; deploy 6add4f267df000662f67a235,ready,
confirmado tras smoke. Publicación automática con npm run build:netlify;
proxy, variables, sitio y configuración de sesión conservados.

Build local y Netlify aprobados. 170 tests, lint, TypeScript y Vite; auditoría sin
vulnerabilidades tras parche transitivo undici/zod. Warning no fatal PostCSS from;
CSS publicado revisado a1440/375px en ambos temas. No cambios de schema ni Backend.
Readiness200 por /api/v1/ready; backend compatible0005 confirmado por operación.

Smoke real autorizado: SMOKE_ALLOW_PRODUCTION_WRITE=1 y
node --experimental-strip-types scripts/smokeActivitiesBrowser.ts.
Ejecutado una vez con resultado aprobado. Crea cuenta/materia y dos actividades;
elimina la que no tiene historia, conserva y cancela la histórica, archiva su
materia y revoca sesión. No ejecutar como simple consulta documental.
Credenciales solo en memoria; capturas .local/activities-*.png ignoradas por Git.
[Evidencia sanitizada](evidence/activities-release-2026-10-24.json) registra SHA,
resultados HTTP, IDs sintéticos y hashes de las capturas revisadas.

Cierre documental [skip ci] [skip netlify], sin redeploy adicional. Fallback,
refresh, guard tras logout, CSRF y no-store comprobados en Chrome por Netlify.
Los avisos CSP inline también aparecen en /login público; no se relajó política.
Actividades cerrado; no desplegar una versión anterior que retire estos flujos
sin coordinar el release. Las secciones siguientes son historial.

# Histórico — Frontend Materias — release cerrado 2026-10-21

Sitio existente https://cognova-frontend.netlify.app, ID
bf6ef7b1-c280-4de9-8ea1-f70630cc14c1. Producción main; proxy y variables sin cambios.
Deploy 6ad8630286df0857a21d2ec0 ready, publicado 2026-10-21T07:00:48.532Z;
SHA c439a821db99157fae01b0c44abd69993d68cce2. Build obligatorio build:netlify aprobado:
lint, 139 tests, TypeScript, Vite y redirects.

La corrección de foco cierra el dialog antes de restaurar foco en el trigger;
se conserva la advertencia, confirmación explícita y el bloqueo durante DELETE.
Smoke limitado en Chrome real aprobado, sin volver a ejecutar el CRUD completo.
Los commits posteriores de tooling/documentación tienen [skip ci] [skip netlify]
para mantener el despliegue validado. No se cambia diseño ni contratos API.

Reproducción autorizada: SMOKE_ALLOW_PRODUCTION_WRITE=1 y
node --experimental-strip-types scripts/smokeSubjectsFocus.ts.
Crea una cuenta sintética y una materia, prueba Escape/Tab/Enter y DELETE, elimina
la materia de prueba y revoca sesión. Credenciales solo en memoria. Evidencia
.local/subjects-focus-smoke.json y captura .local/subjects-focus-confirmation.png,
ignoradas por Git. Cuenta15/perfil/cuestionario permanecen como evidencia sintética.

## Historial de despliegues anteriores

# Despliegue del avance: Netlify + Render

## Estado

## Histórico — Release operativo 2026-10-17

Main integra feat/onboarding-questionnaire sin squash (merge dae333d254974093b6422e2594c92782586df53f). Netlify publicó ese SHA en https://cognova-frontend.netlify.app: deploy 6ad443bb9de5414fc3a0c500, ready. Los commits posteriores de tooling/documentación conservan el mismo bundle de aplicación.

Sitio existente bf6ef7b1-c280-4de9-8ea1-f70630cc14c1, rama main, build npm run build:netlify, publish dist. RENDER_API_ORIGIN ya era https://cognova-backend-lpsi.onrender.com; no se modificó. VITE_API_BASE_URL=/api/v1 en netlify.toml. Backend 9309effdd1b71acc3fe5e24bc8c19b70c3d8c0c8 y schema 0003 confirmados por operación; readiness/OpenAPI compatibles comprobados aquí. La dependencia antigua de backend sin onboarding queda resuelta.

El smoke HTTP nuevo pasó por Netlify. El release completo continúa pendiente del E2E en navegador: el adaptador no tiene apps ni browsers disponibles. No confundir HTTP y tests con mocks con validación visual. No se modificaron backend ni database.

Smoke reproducible: establecer SMOKE_ALLOW_PRODUCTION_WRITE=1 y ejecutar node --experimental-strip-types scripts/smokeOnboarding.ts, solo con autorización para crear una cuenta sintética de producción. Conserva respuestas y cierra sesiones. NETLIFY_AUTH_TOKEN se almacena exclusivamente en .env ignorado, nunca en .env.example ni variables VITE.

## Referencia histórica anterior al release


Despliegue existente verificado el 2026-10-12:

- Frontend: https://cognova-frontend.netlify.app
- Backend: https://cognova-backend-lpsi.onrender.com
- Netlify: `RENDER_API_ORIGIN=https://cognova-backend-lpsi.onrender.com`.

La UI Netlify tenía el hostname con número 1. Se corrigió únicamente RENDER_API_ORIGIN a lpsi (letra l), conservando sus scopes/contextos existentes, y se reconstruyó el sitio sobre main@53e7001. Deploy publicado: `6acd2c48eb986d01cdad2dff`. No se creó otro sitio ni se modificó backend/database. Smoke HTTP y navegador aprobados: [evidencia](INTEGRATION_VALIDATION.md).

El navegador consume `/api/v1` del mismo origen Netlify. Netlify reenvía `/api/*` hacia Render conservando la ruta; Render accede a Render Postgres. Las credenciales de PostgreSQL nunca pertenecen al frontend.

Hay tres repositorios independientes: cognova-frontend publica la SPA; cognova-backend publica la API; cognova-database administra Alembic, migraciones, esquema físico, constraints, índices y seeds de DB. Database no es un servicio HTTP para el frontend. El cambio de propiedad del schema no modifica el proxy, las cookies ni los DTOs.

## Contrato de backend ya sincronizado

El contrato vigente de [AUTH_CONTRACT](AUTH_CONTRACT.md) ya fue sincronizado y validado; conservarlo:

- `cognova_refresh`: HttpOnly, Secure, SameSite=Lax, Path=/api/v1/auth.
- `cognova_csrf`: legible por JS, Secure, SameSite=Lax, Path=/.
- Ambas host-only, sin Domain apuntando a Render; borrar con los mismos paths. Eliminar la antigua cookie CSRF con Path=/api/v1/auth durante la migración para evitar duplicados.
- Refresh y logout validan cookie/header CSRF; rotación y revocación reales.
- Todas las respuestas auth, incluidos errores, emiten `Cache-Control: no-store`. Las cabeceras estáticas de Netlify no se aplican a respuestas proxied.
- Permitir el origen HTTPS exacto del frontend en las comprobaciones de origen/CORS correspondientes, credenciales y headers Authorization, Content-Type y X-CSRF-Token. No usar wildcard con credenciales.
- Backend conserva configuración de conexión a PostgreSQL, secretos de aplicación, HTTPS y disponibilidad. La administración del schema y sus migraciones pertenece a cognova-database; coordinarla entre los repositorios afectados, nunca desde frontend.

## Configuración de Netlify (referencia para mantenimiento)

El sitio ya está importado y desplegado. Configuración inspeccionada: producción main, build npm run build:netlify, publish dist y Node 24. La lista UI solo contenía RENDER_API_ORIGIN; VITE_API_BASE_URL=/api/v1 procede de netlify.toml. Los pasos siguientes son referencia de mantenimiento.

1. Publicar los commits autorizados en el remoto del sitio Netlify existente; no volver a importarlo.
2. Usar raíz del repositorio; [netlify.toml](../netlify.toml) define build `npm run build:netlify`, publicación `dist` y Node 24.
3. En variables de build configurar `RENDER_API_ORIGIN` con el origen real `https://<servicio>.onrender.com`, sin ruta. Reemplazar el marcador por el servicio existente. Mantener `VITE_API_BASE_URL=/api/v1`.
4. No agregar secretos, JWT, credenciales de base de datos ni keys a variables VITE. RENDER_API_ORIGIN es configuración pública de routing.
5. Desplegar. El comando valida el origen, ejecuta lint/tests/build y genera `dist/_redirects`: `/api` y `/api/*` primero, fallback `/* /index.html 200` al final. Un build normal no genera estos redirects.
6. Configurar deploy previews con backend de pruebas separado o desactivarlas; no compartir sesiones/datos de producción entre entornos.

No se interpola una variable dentro de TOML: [el generador](../scripts/netlifyRedirects.ts) escribe el destino concreto durante build y rechaza orígenes no HTTPS, rutas, credenciales y hosts ajenos a onrender.com. Un futuro dominio propio requiere revisar esta validación explícita.

El generador también rechaza el hostname erróneo conocido con número 1; el correcto es `cognova-backend-lpsi.onrender.com`. El cambio de variable requiere un nuevo build para actualizar los redirects publicados. No cambiar /api/v1 ni agregar un redirect para /api/v1/openapi.json: OpenAPI está en /openapi.json del backend.

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
2. Registrar usuario, completar perfil académico y cuestionario según onboarding.next_step;
   comprobar que el acceso académico requiere onboarding completo.
3. Login → dashboard; recargar y comprobar restauración. Cambiar tema y revisar móvil/teclado.
4. Inspeccionar cookies: paths, HttpOnly solo refresh, Secure y Lax. Confirmar ausencia de tokens/perfil en localStorage y sessionStorage.
5. Verificar refresh con header CSRF y peticiones Bearer; comprobar error de red y reintento de restauración sin bucles.
6. Logout → login; recargar/volver atrás sin recuperar datos protegidos. Verificar eliminación de cookies y revocación.
7. Revisar CSP/cabeceras de HTML, no-store en API y que un 401 de API sea JSON, no index.html.

Si contrato y backend difieren, registrar y corregir explícitamente antes de presentar la integración como aprobada. No reescribir cookies para ocultarlo.

Netlify limita sus proxies a 26 segundos; el cliente tiene timeout de 20 segundos. Un arranque lento de Render puede fallar: comprobar disponibilidad antes de la presentación y usar errores/reintentos visibles. No reintentar automáticamente un registro POST por timeout.

Referencias oficiales: [rewrites y proxies](https://docs.netlify.com/manage/routing/redirects/rewrites-proxies/), [cabeceras](https://docs.netlify.com/manage/routing/headers/), [configuración de build](https://docs.netlify.com/build/configure-builds/file-based-configuration/).

## Histórico — Preparación de Materias — 2026-10-20

Rama feat/subjects-ui; sitio Netlify existente, sin cambios de proxy ni secretos.
Build obligatorio npm run build:netlify (lint, tests, TypeScript, build y redirects).
Chrome instalado y @playwright/test permiten smoke real aislado. Opt-in explícito:
SMOKE_ALLOW_PRODUCTION_WRITE=1; node --experimental-strip-types scripts/smokeSubjectsBrowser.ts.
Crea dos cuentas sintéticas, completa su onboarding, prueba Materias y borra únicamente
sus materias. Conserva cuentas/perfil/cuestionario, revoca sesiones. Credenciales solo
en memoria; capturas/evidencias sin secretos en .local ignorado.
Smoke HTTP adicional: scripts/smokeSubjectsApi.ts. No accede a PostgreSQL.
Vite actualizado de 8.3.2 a 8.3.4 por npm audit; cero vulnerabilidades.
