# Materias — validación final aprobada 2026-10-21

Producción: https://cognova-frontend.netlify.app.
SHA c439a821db99157fae01b0c44abd69993d68cce2; deploy 6ad8630286df0857a21d2ec0 ready.
Smoke limitado real con Chrome155 finalizado 2026-10-21T07:03:54.525Z.

| Control | Resultado |
| --- | --- |
| Abrir DELETE desde trigger con Enter | Diálogo visible |
| Cancelar con Escape | Diálogo cerrado; foco vuelve al trigger |
| Tab hasta Cancelar y Enter | Diálogo cerrado; foco vuelve al trigger |
| Cancelaciones | Cero solicitudes DELETE |
| Sin confirmación explícita | Botón definitivo deshabilitado |
| Casilla con Space y confirmación con Enter | Un único DELETE204, no-store |
| GET posterior / segundo DELETE | 404 / 404 SUBJECT_NOT_FOUND |
| Listado posterior | Materia ausente |
| Readiness | 200 |
| Refresh sin CSRF / válido | 403 / 200 |
| Logout sin CSRF / válido / access revocado | 403 / 204 / 401 |
| Regresión local | 139 tests en13 archivos; lint, TypeScript y build:netlify verdes |

Cuenta sintética15; materia eliminada, sesión revocada. No se borra perfil ni
cuestionario. Intentos anteriores: timeout de readiness antes de crear cuenta;
cuentas13/14 por aserción del smoke sobre foco inicial (Chrome enfoca casilla),
ambas con materia eliminada y sesión revocada. El smoke ahora navega con Tab a
Cancelar, sin suponer el foco inicial. Ninguno exigió otro cambio de aplicación.

La prueba de regresión asegura cerrar el dialog nativo antes de enfocar el botón
externo, evitando que el modal todavía abierto impida el retorno de foco.
Solo cambió esa restauración; no se modificaron diseño ni otros flujos.

Evidencia previa de Materias conservada: HTTP y navegador validaron crear, listar,
detalle, PUT corregido, archivar/reactivar, cupo5, duplicados, aislamiento, restore
y rutas directas. Capturas revisadas a1440 y375px, claro/oscuro, sin desbordamiento
horizontal ni gradientes. No repetir esas pruebas como si fueran nuevas aquí.
Avisos CSP inline preexistentes también presentes en ruta pública, sin excepciones
JS no controladas ni bloqueo de los flujos verificados; CSP no se relajó.

**Frontend Materias cerrado.** No quedan dependencias de Backend/Database para
este módulo. El historial siguiente corresponde a estados anteriores del proyecto.

## Evidencia histórica

# Integración real frontend → backend

## Release operativo 2026-10-17

Main integra feat/onboarding-questionnaire sin squash (merge dae333d254974093b6422e2594c92782586df53f). Netlify publicó ese SHA en https://cognova-frontend.netlify.app: deploy 6ad443bb9de5414fc3a0c500, ready. Los commits posteriores de tooling/documentación conservan el mismo bundle de aplicación.

Sitio existente bf6ef7b1-c280-4de9-8ea1-f70630cc14c1, rama main, build npm run build:netlify, publish dist. RENDER_API_ORIGIN ya era https://cognova-backend-lpsi.onrender.com; no se modificó. VITE_API_BASE_URL=/api/v1 en netlify.toml. Backend 9309effdd1b71acc3fe5e24bc8c19b70c3d8c0c8 y schema 0003 confirmados por operación; readiness/OpenAPI compatibles comprobados aquí. La dependencia antigua de backend sin onboarding queda resuelta.

El smoke HTTP nuevo pasó por Netlify. El release completo continúa pendiente del E2E en navegador: el adaptador no tiene apps ni browsers disponibles. No confundir HTTP y tests con mocks con validación visual. No se modificaron backend ni database.

Smoke reproducible: establecer SMOKE_ALLOW_PRODUCTION_WRITE=1 y ejecutar node --experimental-strip-types scripts/smokeOnboarding.ts, solo con autorización para crear una cuenta sintética de producción. Conserva respuestas y cierra sesiones. NETLIFY_AUTH_TOKEN se almacena exclusivamente en .env ignorado, nunca en .env.example ni variables VITE.

### Evidencia nueva de integración

- Build de release: lint sin advertencias, 118/118 pruebas en 11 archivos, TypeScript y Vite aprobados. npm audit: 0 vulnerabilidades. Smoke nuevo: lint y tsc -b aprobados.
- scripts/smokeOnboarding.ts ejecutado contra /api/v1 de Netlify sin mocks. Cuenta sintética user_id=3, nombre Frontend release smoke, perfil sintético y revisiones 1/2 conservados. Sesiones de registro y login cerradas. Credenciales solo en memoria.

| Comprobación | Resultado |
| --- | --- |
| ready / me sin sesión | 200 / 401 JSON |
| register mínimo / login / me | 201 / 200 / 200; perfil inicialmente null |
| PUT perfil / catálogo | 200 / 200; diez preguntas |
| POST inicial / GET actual | 201 / 200; revisión 1 |
| Exceso multi / Otro sin texto | 422 / 422; sin revisión adicional |
| PUT expected_revision=1 | 200; revisión 2 |
| PUT con revisión vieja | 409 QUESTIONNAIRE_VERSION_CONFLICT |
| Historial | [2,1]; respuestas iniciales idénticas al POST |
| Estado final | onboarding complete |
| Refresh sin CSRF / válido | 403 / 200; ambas cookies rotadas |
| Restauración HTTP y me | 200, estado complete |
| Sesiones antes del logout | Una, del login |
| Logout / access revocado | 204 / 401; cookies eliminadas |
| no-store | Todas las respuestas API del smoke, errores y 204 incluidos |

Set-Cookie comprobado sin valores: Secure/Lax, host-only; HttpOnly solo refresh; paths /api/v1/auth y /. Preflight backend para Netlify: 200 con origen exacto y credentials=true; origen ajeno: 400 sin allow-origin. Proxy mismo origen conservado.

Rutas HTTP /, /login, /register, /dashboard, /onboarding/academic-profile, /onboarding/questionnaire y /app/questionnaire: HTML 200 con bundle index-DAmSllbe.js y CSP. Token Netlify ausente del bundle y archivos versionados; sin URI PostgreSQL en el bundle.

### Bloqueo de E2E real

El adaptador devolvió apps=[] y browsers=[]. Pendientes: recorrido visual de diez pasos, atrás/adelante, multi/Otro por UI, POST/PUT y recuperación visual del 409, historial visual, recarga/restore, guards, cookies de navegador, Web Storage y consola. Los tests jsdom/mocks y HTTP no sustituyen esas comprobaciones. Conectar navegador y registrar resultados antes de declarar cerrado el release.

## Archivo histórico


## Cierre de onboarding — 2026-10-13

Rama `feat/onboarding-questionnaire`, contrato backend consumido desde fuentes: `a277af2ba5f2e7227b5b329aa7d935e5e12b8f94`. Database fijado por backend: `232c43130c0fb3eddd32e1dd3707368ba0d87d4c`; schema requerido `0003_onboarding_questionnaire`.

**La integración real nueva NO pudo validarse contra Render.** OpenAPI consultado en esta fase solo expone auth/health/ready y UserResponse antiguo con academic_goal, sin onboarding ni catálogo. No se verificó la aplicación física de schema 0003; corresponde a operación confirmarla. No se enviaron escrituras del flujo nuevo al backend antiguo. No se desplegó esta rama a producción.

Verificaciones del cierre:

- `npm run verify`: 118 tests en 11 archivos, lint sin advertencias, TypeScript y build aprobados.
- `npm run build:netlify`: aprobado con `RENDER_API_ORIGIN=https://cognova-backend-lpsi.onrender.com`; redirects /api y /api/* primero, fallback SPA después.
- `git diff --check`: sin errores. Sin cambios nuevos en auth/infraestructura durante el cierre, salvo el bloque staged de validación 409 ya autorizado.
- Tests con HTTP interceptado: registro mínimo y límites, restauración/refresh/logout/CSRF, navegación por estado backend, perfil académico, catálogo, diez preguntas, single/multi, máximos, Otro, POST/GET/PUT, 409, borradores preservados, reintento tras fallo de lectura/sincronización e historial paginado.
- Preview local de registro: tres campos, sin sidebar, sin overflow horizontal en viewport de 375 px; temas claro/oscuro comprobados por DOM y estilos calculados. No equivale a un E2E nuevo contra backend real.

Validación real pendiente, cuando operación entregue un entorno compatible: confirmar SHA/schema; usar una cuenta dedicada para register/login/me, guardar perfil, cargar catálogo, POST inicial, GET actual, PUT con expected_revision, conflicto 409, history paginada, recarga/restore y logout; comprobar cookies, CSRF y no-store. Registrar URL/fecha/resultados sin secretos. No ejecutar migraciones ni modificar backend/database desde frontend.

## Evidencia histórica: contrato de auth anterior

Fecha: 2026-10-12. Pruebas sobre https://cognova-frontend.netlify.app, sin llamadas de auth directas a Render y sin modificar backend/database.

## Configuración observada y corregida

Sitio Netlify cognova-frontend, ID bf6ef7b1-c280-4de9-8ea1-f70630cc14c1, repositorio M1nzutt/cognova-frontend, producción main. Build npm run build:netlify, publish dist, Node 24. VITE_API_BASE_URL=/api/v1 en netlify.toml, sin override UI.

La variable RENDER_API_ORIGIN usaba `https://cognova-backend-1psi.onrender.com`. Se guardó `https://cognova-backend-lpsi.onrender.com` y se verificó en la UI. Ninguna otra variable fue modificada. Se conservó la configuración existente de scopes y contextos.

Deploy anterior: 6ac81d35f26a52000845f0fd. Reconstrucción publicada: [6acd2c48eb986d01cdad2dff](https://app.netlify.com/projects/cognova-frontend/deploys/6acd2c48eb986d01cdad2dff), main@53e7001, 18:52 UTC. Netlify procesó tres reglas de redirect y una de headers. El código auth desplegado no cambió.

El generador local añade rechazo explícito al hostname erróneo y dos tests de regresión. Ese cambio queda en la rama fix/netlify-backend-origin para revisión; no fue necesario fusionarlo en main para corregir la variable remota.

## Resultados

| Comprobación | Resultado |
| --- | --- |
| Health y ready antes del cambio | 404 text/plain, X-Render-Routing: no-server |
| GET /api/v1/health después | 200, {"status":"ok"} |
| GET /api/v1/ready después | 200, {"status":"ready"} |
| GET /api/v1/auth/me sin token | 401 JSON, INVALID_OR_EXPIRED_TOKEN; nunca index.html |
| Registro mediante UI | 201 JSON, destino /questionnaire; enlace al dashboard operativo |
| Login mediante UI | 200 JSON y /dashboard con perfil real de prueba |
| Recarga de dashboard | Refresh 200 con X-CSRF-Token, luego me 200; perfil restaurado |
| Estado inicial protegido | Perfil oculto y mensaje Comprobando tu sesión mientras se retiene temporalmente la petición real de refresh; al liberarla se restaura |
| Ausencia de loops en recarga | Resource Timing del navegador registra un refresh y un me |
| Logout mediante UI | 204 con CSRF y expiración de ambas cookies con sus paths correctos |
| Dashboard tras logout y navegación directa | Redirige a /login; no realiza nuevas peticiones auth sin cookies |
| Web Storage | localStorage solo cognova.theme; sessionStorage vacío; sin JWT ni perfil |
| npm run smoke:auth | Exit 0: login, me, cookies, refresh sin CSRF rechazado 403, rotación, logout y access revocado con 401 |
| Cache-Control | no-store en respuestas auth examinadas y exigido por el smoke, incluidos errores |
| Verificación local | 56 tests, lint, TypeScript y build:netlify aprobados con origen correcto |

La comprobación de initializing retuvo la petición antes de enviarla y después permitió la respuesta real; no sustituyó respuestas del backend. La coordinación de 401 concurrentes y los fallos de restore siguen cubiertos por los tests existentes, no se presentan como pruebas nuevas de carga en producción.

## Cookies en navegador

Se inspeccionaron Set-Cookie en la respuesta real de refresh y los nombres del header Cookie de la siguiente petición real, sin guardar valores:

| Cookie | HttpOnly | Secure | SameSite | Path | Domain |
| --- | --- | --- | --- | --- | --- |
| cognova_refresh | Sí | Sí | Lax | /api/v1/auth | Ausente: host-only |
| cognova_csrf | No | Sí | Lax | / | Ausente: host-only |

La petición del navegador contenía exactamente una cookie de cada nombre, sin duplicados antiguos. document.cookie solo mostraba cognova_csrf. Después del logout no quedaron cookies visibles y una nueva navegación no restauró sesión. El smoke HTTP verificó además borrado de ambas cookies y revocación del access. La API de enumeración de cookies del navegador no estaba disponible; se usaron las cabeceras reales y el comportamiento observado como evidencia.

## Cuenta y límites de la prueba

Se creó exactamente una cuenta sintética: cognova-smoke-20261012@example.com, nombre Prueba integración Cognova, carrera Cuenta sintética de pruebas. No contiene datos personales reales ni actividad académica. No se guardaron credenciales en el repositorio; las sesiones de prueba se cerraron al terminar. La cuenta permanece identificada como prueba; no se intentó borrarla mediante un endpoint inexistente.

La primera consulta health tras publicar agotó el tiempo del proxy (504); al repetir después respondió 200. Ready también respondió 200. Es compatible con arranque lento, pero no se atribuye una causa definitiva sin logs backend. No se añadieron retries de escritura ni se reabrió el incidente del hostname.

La consola muestra bloqueos CSP de script/style inline en el HTML desplegado, que también contiene la insignia Netlify. No impidieron los flujos probados; no se relajó CSP ni se modificaron otras opciones de Netlify. El adaptador del navegador reportó ERR_ABORTED en eventos de logout, pero entregó respuesta 204 con eliminación de cookies y se comprobó el cierre tras navegar; se conserva la distinción entre aviso del adaptador y resultado HTTP.

Esta evidencia histórica valida únicamente el recorrido anterior, no el onboarding nuevo ni disponibilidad continua. El contrato nuevo ya define academic_goal como q1 y el cuestionario completo; su validación real pendiente se detalla al principio. Subjects no forma parte de este cierre.

## Preflight Materias — 2026-10-20

138 tests locales, lint, TypeScript y build aprobados antes del release.
Smoke HTTP por proxy Netlify aprobado con cuenta sintética 8: catálogo real,
crear/editar/archivar/reactivar, duplicado409, sexta activa409, reactivación sin cupo409,
DELETE sin confirm422, DELETE204, GET posterior404, segundo DELETE404 y ausencia
en listado. Se eliminaron las seis materias sintéticas y se revocó la sesión;
refresh/logout sin CSRF403, válido200/204, access revocado401, no-store en todo.
Primer intento agotó timeout en readiness antes de registrar datos; segundo aprobado.
La evidencia HTTP no sustituye la validación visual, todavía pendiente de publicación.
