# Frontend IA — integrado a nivel código/CI, 2026-11-12

Merge `--no-ff` `f416679bc692661e2ad36eaebfa8f45d8c104f61` integró `feat/ai-frontend` a `main`. GitHub Actions run `43155103439` en la rama y run `43155808579` en `main` concluyeron `success`; ambos jobs (checks frontend y Gitleaks) pasaron. La validación cubrió instalación `npm ci`, lint, `typecheck`, 349/349 tests en UTC, build, `build:netlify`, audit de producción y escaneo de secretos.
No hubo deploy a Netlify; los pushes usan `[skip netlify]` y `build:netlify` únicamente prepara el artefacto en Actions. `npm audit --omit=dev` encontró cero vulnerabilidades. La auditoría completa tiene diez moderadas transitivas de herramientas de desarrollo por `minimatch`; se mantienen documentadas y no se aplica downgrade mayor. No se necesita `GEMINI_API_KEY` en el frontend ni en CI.
No se ejecutó smoke real Gemini ni smoke visual final multi-breakpoint. Ambos quedan para Docker integrado y el rediseño; no bloquean otros desarrollos. Rediseño visual completo pendiente.


Código integrado a `main` por el merge indicado arriba; no desplegado a Netlify. Pruebas con fetch interceptado
validan el contrato esperado de Backend `feat/gemini-behavior` SHA
`110978bc1931fd0fc5882c7a0316acd57e0e9183`; no representan smoke con Gemini ni
Backend real. Snapshot en refresh, generación borrador, regeneración exitosa y
fallida, historial de decisiones, misiones IA, análisis con historial menor o
igual/mayor a cinco sesiones, error seguro y `Retry-After` tienen cobertura
automatizada. El cleanup/auth de producción no aplica; no se crearon recursos
externos.

Resultados locales finales: `npm test` y `npm run build:netlify` aprobaron
349/349 pruebas en 45 archivos; lint, TypeScript y build aprobaron. `npm audit
--omit=dev`: cero vulnerabilidades. `npm audit` completo: diez vulnerabilidades
moderadas transitivas de desarrollo por `minimatch` bajo ESLint/TypeScript-ESLint;
la corrección ofrecida exige `--force` y baja ESLint a 9, cambio mayor que queda
sin aplicar. Vite imprime el warning no fatal existente de PostCSS `from`.
Dependencia de release: Docker Backend sobre Database 0008 con `GEMINI_API_KEY`
como secreto; después se deberá verificar auth, `no-store`, rutas directas,
refresh, responsive/teclado, errores JS y cleanup con cuenta sintética.

# Planes y Retos — validación productiva, 2026-11-05

Netlify `https://cognova-frontend.netlify.app`, deploy
`6aec118ff6c3ff162f7334de` `ready`, SHA servido
`5baf625e14fbb543a9fd715dbfaaf3b43c2f8c6d`. Backend 0007 en
producción. Pipeline `build:netlify` bajo UTC: 324/324 pruebas en el SHA
productivo; suite final con prueba de rechazo IA: 325/325 en 42 archivos,
lint, TypeScript y Vite verdes. Auditoría producción 0; completa 10 moderadas
transitivas de desarrollo por `minimatch`.

Chrome productivo final `2026-11-05T05:22:51Z`, 1440 y 375 px, zona Bogota.
Se comprobó lista vacía, creación y edición de Plan, vínculos con Materia,
Actividad y Sesión, jerarquía/prioridad/dependencias/ritmo/huecos del Backend,
decisión `edited` con valores anterior y elegido, activación, completar y
abandonar. Los Retos se crearon dentro del Plan, se editaron, iniciaron,
completaron, fallaron y cancelaron. Se verificaron rutas directas, refresh,
teclado, ausencia de desbordamiento horizontal, auth anónima redirigida,
revocación 401, 129 respuestas API con `no-store` y cero errores JS.
El borrador vacío 11 se eliminó con confirmación; consulta posterior 404.

Cuenta sintética 44: Planes 9 y 10 retenidos por estado/historial y FK,
Materia 69, Actividad 43 y Sesión 46 retenidas por vínculos; auth revocada.
Intento inicial: timeout de readiness 25 s antes de registrar cuenta;
comprobación posterior 200/no-store. Dos intentos de script posteriores
fallaron por selectores de Sesión y misión, fueron corregidos; sus sesiones
auth se revocaron en `finally`. Sus datos académicos vinculados no son
eliminables por las reglas de historia del Backend.

La creación pública de Planes `ai` aún no existe. Por ello el 503 de
`regenerate`, las decisiones `accepted`/`rejected` y el flujo de propuesta
se validaron en pruebas con fixtures del contrato, sin fingir un evento
productivo. La llamada productiva a `regenerate` sobre Plan manual devolvió
409 `STUDY_PLAN_STATE_CONFLICT`, como corresponde. Ownership 404, onboarding,
errores 409 y 503 tienen cobertura de frontend; el Backend ya tiene su smoke
productivo independiente. Retos en Calendario dependen de que Backend los
exponga en `GET /calendar`.

Evidencia sanitizada: `evidence/study-plans-release-2026-11-05.json`.

# Estado vigente — Calendario mixto publicado y validado, 2026-11-03

Netlify deploy `6ae94b7544b5e9672d6466e0` (`ready`) sirve
`c2edfd29912354100bb54ff2373aeaa1ee138723` en
https://cognova-frontend.netlify.app. Suite 302/302; build:netlify pasó en UTC.
Smoke Chrome productivo mixto aprobado, con cleanup completo y cero errores JS.
Detalle, límites y evidencia en la sección `Calendario mixto — smoke productivo
aprobado` y `docs/evidence/calendar-study-sessions-release-2026-11-03.json`.

## Histórico — Calendario, integración productiva aprobada, 2026-10-26

URL https://cognova-frontend.netlify.app; SHA 0541a59ab048cbc2687400a68eab53d1d85716a9.
Deploy Netlify 6ae010bbf41b67a5e8c44bfa ready. Backend 61a2f98668f0d3452f0582d7a074f1290dbae43d
sobre0005. Smoke Chrome real finalizado el26/oct a21:54:38 America/Bogota
(2026-10-27T02:54:38.691Z). Solo REST del frontend por proxy.

| Control | Resultado |
| --- | --- |
| Mes / semana | Fechas visibles y actividades correctas |
| Zona local | UTC16/ene01:30 aparece el15/ene20:30 en Bogotá |
| Navegación / hoy | Cambio de periodo, diciembre2030→enero2031, fecha y hoy aprobados |
| Filtros | Materia/estado/prioridad combinados, vacío contextual y limpieza |
| Actividad | Enlace por teclado al detalle; edición normal disponible |
| Refresh / directa | Sesión restaurada y fecha/vista/filtro conservados |
| Responsive / temas | 1440/375px, mes/semana, claro/oscuro; sin overflow horizontal |
| Teclado | Botones y enlaces operables; foco conservado al cambiar vista |
| Auth / CSRF | Ruta anónima→login; refresh sin CSRF403, válido200; logout403/204 |
| Revocación | Bearer revocado401; recarga protegida→login |
| Caché / Storage | Respuestas observadas no-store; solo preferencia de tema persistida |
| Escrituras de Calendario | Solo GET, snapshots API idénticos antes/después |
| JavaScript | Cero excepciones no controladas |

Hash antes/después: 1b99a6895f8b239b608f6f8b84e2bddabd9dfa77cf497d1fa34d7f66d51cc9c1.
Alcance de comparación: listado completo de las actividades sintéticas con sus
campos públicos, incluidos timestamps. No acceso directo a PostgreSQL.
La paginación de más de50 items, precisión de cursor, límites366 y respuestas
tardías están cubiertas por tests locales; no se crearon51 fixtures productivos.

214 tests/26 archivos verdes; 44 nuevos frente a170. Incluyen cliente/DTO,
mes/semana, filtros, cambio de año, URL/restauración, onboarding, apertura,
loading/empty/error/reintento y carreras. Lint, TypeScript, build:netlify y auditoría0.
No se provocó indisponibilidad del backend para probar errores productivos.

Usuario26: actividades21,22,23 y materias42,43 eliminadas204. Sesión revocada.
Intentos previos: readiness falló antes de crear cuenta; luego usuarios23,24,25
con recursos eliminados y sesión revocada, documentados en evidencia.
El tooling necesitó encabezado nivel2 inequívoco y espera acorde al timeout API;
no hubo cambio funcional ni redeploy. Total12 actividades/8 materias eliminadas.
Retenidas las cuentas23–26, perfiles, revisión inicial del cuestionario y registros
de sesión revocada; no existe DELETE de cuenta. Credenciales nunca persistidas.

Ocho capturas revisadas; hashes en [evidencia](evidence/calendar-release-2026-10-26.json).
Mes móvil apila todos los días, sin ocultar actividades. Diez avisos CSP durante
el smoke; también se observaron2 en acceso público inicial y ya constan en releases
anteriores. No se relajó CSP; no bloquearon flujo ni generaron excepciones JS.
Warning PostCSS from previo, sin fallo de build ni visual.

**Frontend Calendario cerrado.** Sin eventos libres, sin edición directa ni nuevos
módulos. La historia inferior conserva sus fechas y no expresa bloqueos vigentes.

## Sesiones de estudio — smoke productivo final, 2026-11-02

Producción `https://cognova-frontend.netlify.app`, Netlify deploy
`6ae92b488d942822e102cae8` (`ready`), commit servido
`8623a1c5dfb2fd6b53c00af8833fee1c883a0c19`. Backend
`56e7caccb247776ed93c63e949faf9b76202ebcf` / `0006_study_sessions`.
Chrome 155; corrida final `2026-11-03T00:51:34.055Z` (19:51:34 Bogota).

| Control | Resultado |
| --- | --- |
| Planificación | Crear, editar, materia requerida, actividad compatible opcional; actividad ajena/incompatible protegida con 404 |
| Ciclo y timer | Start, pause, resume, finish; running/paused sobreviven refresh; conflicto de segunda sesión activa 409 con mensaje seguro |
| Intervalos | Tres intervalos cerrados; `actual_duration` coincide con su suma y excluye pausas |
| Resultados/contexto | `partial` + `other`/texto; `completed` + `finished_early`; `postponed` y `cancelled` sin ejecución |
| DELETE | Plan sin ejecución 204 y desaparece; sesión con historial 409, permanece; dependencia protegida |
| Autenticación | Ruta privada redirige a login anónimo; CSRF presente en mutaciones; logout 204 y token de acceso posterior 401 |
| Caché | Respuestas autenticadas comprobadas con `Cache-Control: no-store` |
| Refresh/rutas | Lista y detalle directos restauran datos/ciclo desde API; sin storage de tokens o borradores |
| Teclado/responsive | Diálogos operables y foco; escritorio 1440 px y móvil 375 px sin overflow horizontal |
| JavaScript | 0 errores no controlados; 12 avisos CSP en consola, sin fallo funcional |

Smoke permitió escrituras sintéticas. Corrida final creó user 36; plan/sesiones
sin historia (IDs 30/31) y materia 60 se eliminaron; materia 59 se archivó porque
conserva sesiones históricas 29/32/33/34; actividad 32 se retuvo como dependencia.
La cuenta sintética, perfil y cuestionario quedan porque no existe endpoint de
borrado de cuenta. Logout final fue 204 y el access token quedó revocado (401).

Límite de una corrida previa: para el usuario sintético 35 no se confirmó logout,
porque falló el refresh/CSRF durante cleanup. Sus recursos son sintéticos y se
retiraron las dependencias eliminables; las sesiones ejecutadas se conservaron
por historial. No se almacenaron credenciales, por lo que no se pudo reautenticar
para repetir la revocación. El smoke final sí confirmó revocación completa del
usuario 36. No se usaron cuentas reales ni se modificaron datos ajenos.

Validación local final: 281 tests en 40 archivos, lint, TypeScript, `npm run build`,
`npm run build:netlify` y auditoría de producción (0 vulnerabilidades). La
auditoría completa mantiene 12 moderadas transitivas de herramientas de desarrollo;
ver `DEPLOYMENT.md`. Calendario no muestra Sesiones todavía: su única dependencia
pendiente es ampliar `GET /api/v1/calendar` en Backend.

## Histórico — validaciones previas

# Actividades — validación productiva aprobada 2026-10-24

Producción https://cognova-frontend.netlify.app; SHA 27a2c29a61fb0b393d27cd6a591e0f025581a13d;
Netlify 6add4f267df000662f67a235 ready. Smoke Chrome155 finalizado
2026-10-24 19:37:55 America/Bogota (2026-10-25T00:37:55.759Z).
Backend fe5989b86d93d10e724cbf28de4f9d64048bb711 / 0005_activities cerrado por
operación; frontend solo consume REST por proxy. Materias y Actividades cerrados.
Esta rectificación documental no repite smoke ni amplía las pruebas acreditadas.

| Control | Resultado real |
| --- | --- |
| Crear / detalle / editar | 201 / 200 / 200; campos de lectura excluidos del PUT |
| Filtros materia, estado, prioridad | inclusión/exclusión y limpieza correctas |
| Fecha exacta / rango inclusivo | filtros aplicados desde la UI, hora local Bogotá |
| Cambiar estado | Pendiente→En progreso200 con expected_status |
| Postergar / adelantar fecha | PATCH200; historial «Fecha postergada» / «Fecha adelantada» |
| Fecha original | intacta tras dos cambios, visible en detalle |
| DELETE con historial | 409; explicación clara, actividad idéntica antes/después |
| DELETE sin historial | casilla explícita, teclado,204; GET404 y segundo DELETE404 |
| Listado después de DELETE | actividad eliminada ausente |
| Escape y Cancelar por teclado | cierra diálogo y restaura foco al trigger |
| Refresh / ruta directa | sesión restaurada, detalle e historial visibles |
| Cookies / Web Storage | Secure/Lax/HttpOnly esperado; sin tokens/perfil en Storage |
| CSRF / logout | refresh/logout sin CSRF403; válidos200/204; acceso revocado401 |
| Caché | todas las respuestas API observadas con no-store |
| Escritorio/móvil | capturas1440/375px claro/oscuro revisadas; sin overflow horizontal |
| Errores JavaScript no controlados | cero |

Usuario sintético20, actividad4 retenida cancelada con dos eventos inmutables;
actividad5 eliminada y materia de prueba archivada. Cuenta/perfil/cuestionario
retenidos; sesión revocada. No se modificaron datos ajenos ni otros repositorios.
No se usó PostgreSQL desde Frontend. Los estados404/409/422/503, conservación del
borrador, consultas explícitas tras conflicto, límites y guards tienen regresión
local. No se provocó indisponibilidad503 del backend productivo para probar la UI.

170 tests/15 archivos aprobados,31 más que la base139. Lint, TypeScript, build:netlify
y auditoría0 verdes. Netlify ejecutó el build obligatorio antes de publicar.
PostCSS reportó warning from, no bloqueo de compilación ni fallo visual observado.
Diez avisos CSP durante el smoke; una visita separada a /login también muestra
style-src/script-src inline bloqueados, como el historial previo. No hay excepción
JS ni flujo bloqueado; no se añadieron excepciones CSP para ocultarlos.

[Evidencia del release](evidence/activities-release-2026-10-24.json) sin secretos;
capturas locales: activities-1440-light/dark, activities-375-light/dark y
activities-delete409-mobile.png. Hashes registrados después de revisión visual.
**Frontend Actividades queda cerrado.** El historial siguiente pertenece a releases
anteriores y no implica dependencias pendientes para Actividades.

# Histórico — Materias — validación final aprobada 2026-10-21

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

## Histórico — Release operativo 2026-10-17

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

### Histórico — Límite de E2E registrado en aquel release

El adaptador devolvió apps=[] y browsers=[]. Pendientes: recorrido visual de diez pasos, atrás/adelante, multi/Otro por UI, POST/PUT y recuperación visual del 409, historial visual, recarga/restore, guards, cookies de navegador, Web Storage y consola. Los tests jsdom/mocks y HTTP no sustituyen esas comprobaciones. Conectar navegador y registrar resultados antes de declarar cerrado el release.

## Archivo histórico


## Histórico — Cierre de onboarding — 2026-10-13

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

## Histórico — Preflight Materias — 2026-10-20

138 tests locales, lint, TypeScript y build aprobados antes del release.
Smoke HTTP por proxy Netlify aprobado con cuenta sintética 8: catálogo real,
crear/editar/archivar/reactivar, duplicado409, sexta activa409, reactivación sin cupo409,
DELETE sin confirm422, DELETE204, GET posterior404, segundo DELETE404 y ausencia
en listado. Se eliminaron las seis materias sintéticas y se revocó la sesión;
refresh/logout sin CSRF403, válido200/204, access revocado401, no-store en todo.
Primer intento agotó timeout en readiness antes de registrar datos; segundo aprobado.
La evidencia HTTP no sustituye la validación visual, todavía pendiente de publicación.
## Calendario mixto — smoke productivo aprobado, 2026-11-03

Backend `4735a697aed69f66f3055c902a00507b66a556e0` / `0006_study_sessions`.
Netlify deploy `6ae94b7544b5e9672d6466e0`, `ready`, sirve SHA
`c2edfd29912354100bb54ff2373aeaa1ee138723`; URL
https://cognova-frontend.netlify.app. Chrome Headless 156; smoke final
`2026-11-03T02:51:03.156Z`.

### Validación local

`npm test`: 302/302 en 41 archivos. También pasaron `npm run lint`, TypeScript,
`npm run build` y `npm run build:netlify` con `TZ=UTC` y el `RENDER_API_ORIGIN`
productivo. El test de sesión ahora deriva el valor de hora de la zona local del
runner, comprueba `planned_start_at` y distingue el `start_at` desplazado dos
minutos. El caso pasa con `TZ=UTC` y `TZ=America/Bogota`; no hubo cambio al
formateador de producción.

`npm audit --omit=dev`: cero vulnerabilidades. La auditoría completa muestra 12
moderadas transitivas de desarrollo bajo ESLint/TypeScript-ESLint (`minimatch`), sin
arreglo compatible. Persiste el warning no fatal de PostCSS `from`.

### Smoke Chrome productivo

| Control | Resultado |
| --- | --- |
| Actividad + Sesión | Ambos aparecen; Actividad se ubica por `deadline` y Sesión por `planned_start_at`; la sesión muestra materia, hora, duración y lifecycle |
| Mismo instante / orden | API y UI conservan Actividad antes que Sesión según orden Backend |
| Tipos y filtros | Todos/Actividades/Sesiones; materia aplica a ambos; estado/prioridad filtran Actividades y no se envían en `type=study_session` |
| Vistas y navegación | Mensual y semanal correctas; navegación de calendario y fechas del smoke aprobadas |
| URL / refresh / ruta directa | Fecha/vista/filtro persisten en URL, refresh y apertura directa |
| Detalles originales | Enter desde links abre detalle de Actividad y de Sesión |
| Responsive / teclado | 1440 px y 375 px, mes y semana; sin overflow horizontal, filtros y links operables por teclado |
| Auth | Ruta anónima redirige a login; logout revoca la sesión y la ruta protegida vuelve a login |
| Caché / solo lectura | 36/36 respuestas de navegador HTTP 200 con `no-store`; `/calendar` solo GET; snapshots pre/post idénticos |
| Errores | 0 excepciones JS, 0 errores de consola; 14 avisos CSP observados y no bloqueantes |

Hash de snapshots Actividades/Sesiones antes y después: `cfb37bfb4fc956b8780c7847160fff8074f9583801f4d04582def312ad5484ba`.
Fixtures sintéticos de user 39: subjects 63/64, activities 36/37, sessions 40/41.
Planes, actividades y materias fueron eliminados; sesión de auth revocada. La cuenta,
perfil y cuestionario iniciales permanecen porque no hay endpoint de borrado de
cuenta. No se alteraron recursos de otros usuarios.

El primer intento de readiness agotó 25 s antes de crear la cuenta; no dejó fixtures.
Readiness directo y por proxy devolvió después 200/no-store y el segundo smoke pasó.
Las cuatro capturas revisadas y sus hashes están en
[`evidence/calendar-study-sessions-release-2026-11-03.json`](evidence/calendar-study-sessions-release-2026-11-03.json); PNG locales ignorados por Git en `.local/`.

**Frontend Calendario mixto queda cerrado de punta a punta y puede continuar la siguiente fase.**

## Historial — Calendario, integración productiva aprobada, 2026-10-26
