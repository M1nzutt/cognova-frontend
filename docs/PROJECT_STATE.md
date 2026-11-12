# Frontend IA — integrado a nivel código/CI, 2026-11-12

`feat/ai-frontend` se integró a `main` con merge `--no-ff` `f416679bc692661e2ad36eaebfa8f45d8c104f61`. CI de rama: run `43155103439`, `success`; CI de main sobre el merge: run `43155808579`, `success`. El workflow `.github/workflows/frontend-ci.yml` corre en push, pull request a `main` y `workflow_dispatch`. Node 24 coincide con `netlify.toml` y cumple `engines.node >=22.12.0`.
GitHub Actions ejecuta `npm ci`, `npm run lint`, `npm run typecheck` (`tsc -b`), `npm test` con `TZ=UTC`, `npm run build`, `npm run build:netlify`, `npm audit --omit=dev` y Gitleaks v3. `build:netlify` solo genera el artefacto en el runner; no despliega. Pushes de release usan `[skip netlify]` sin suprimir CI. Gitleaks cumple la línea base de escaneo de secretos; comentarios y artifacts están desactivados. CI no usa `GEMINI_API_KEY` ni otros secretos propios.
La auditoría de producción dio cero vulnerabilidades. La auditoría completa conserva diez vulnerabilidades moderadas transitivas de herramientas de desarrollo (`minimatch` en ESLint/TypeScript-ESLint); no bloquea el audit de producción y no se fuerza un downgrade mayor para silenciarla. No se desplegó a Netlify. No hubo smoke real Gemini ni smoke visual final multi-breakpoint; quedan para Docker integrado/rediseño y no bloquean el desarrollo. El rediseño visual completo sigue pendiente.


La rama `feat/ai-frontend` añade generación/revisión de Planes IA, snapshot
persistido, decisiones legibles, presentación diferenciada de misiones IA y
análisis de comportamiento desde el Backend. Contrato de Backend esperado:
`feat/gemini-behavior` SHA `110978bc1931fd0fc5882c7a0316acd57e0e9183`, Database
0008. El código IA está integrado en `main`, pero aún no se ha probado con Gemini
ni con un Backend productivo. El despliegue y el smoke real esperan Docker con
Database 0008 y `GEMINI_API_KEY` como secreto del Backend.

Se usan snapshots JSON ya expuestos por Backend, sin estructuras de dominio ni
reglas de negocio duplicadas. El timeout no repite escrituras; errores de
proveedor no se muestran en bruto y el cliente respeta `Retry-After`. La página
de comportamiento identifica historial menor a cinco sesiones y evita
afirmaciones diagnósticas o causales.

Validación local final: `npm test` y `build:netlify` aprobaron 349/349 pruebas
en 45 archivos; lint, TypeScript y Vite también pasaron. `npm audit --omit=dev`
reportó cero vulnerabilidades. `npm audit` completo reportó diez moderadas
transitivas de tooling por `minimatch` bajo ESLint/TypeScript-ESLint; resolverlas
requiere `npm audit fix --force` y el cambio mayor de ESLint 9, por eso no se
alteró el toolchain. Sigue el warning no fatal de PostCSS `from`. No hubo cambios
en Backend, Database ni Netlify.
Contratos: [API_CONTRACT](API_CONTRACT.md), [AI_BEHAVIOR](AI_BEHAVIOR.md) y
[STUDY_PLANS_CONTRACT](STUDY_PLANS_CONTRACT.md).

# Frontend Planes de Estudio + Retos — publicado, 2026-11-05

Netlify `https://cognova-frontend.netlify.app` publicó el merge `--no-ff`
`5baf625e14fbb543a9fd715dbfaaf3b43c2f8c6d` (deploy
`6aec118ff6c3ff162f7334de`, `ready`). Backend productivo
`d9fff7c36e6a1c1c98079e9be225c1d273e0e9d0` usa
`0007_study_plans_and_challenges`. Planes manuales y Retos anidados están
operativos con auth/onboarding existentes, sin cambios en Backend ni Database.

La interfaz ofrece lista, filtro, detalle, creación/edición de borrador,
relaciones con Materias/Actividades/Sesiones, estados, decisiones y borrado
seguro. Los Retos se muestran como misiones con objetivo contextual, enlaces a
recursos y transiciones. Jerarquía, prioridad, dependencias, ritmo y huecos
se consumen de las proyecciones del Backend. Calendario permanece en
Actividades y Sesiones.

`npm run build:netlify` pasó bajo UTC con 324 pruebas; tras añadir la aserción
de rechazo de propuesta, la suite final tiene 325/325 en 42 archivos; lint,
TypeScript y build también pasaron. `npm audit --omit=dev`: cero vulnerabilidades. Auditoría
completa: diez moderadas transitivas de desarrollo en `minimatch` bajo ESLint;
la corrección propuesta por npm exige un cambio mayor de ESLint. Warning de
PostCSS `from` preexistente y no fatal.

Smoke Chrome productivo aprobado `2026-11-05T05:22:51Z`: cuenta 44,
Planes 9/10 retenidos por historia, borrador 11 eliminado, Materia 69,
Actividad 43 y Sesión 46 retenidas por relaciones. Auth revocada, acceso
posterior 401, 129 respuestas `no-store`, cero errores JS. Evidencia:
`evidence/study-plans-release-2026-11-05.json`. Hubo tres intentos previos:
uno agotó readiness antes de registrar; dos dejaron cuentas y recursos
sintéticos con auth revocada tras fallos de selectores del script. La corrida
final corrigió ambos selectores.

Gemini real sigue pendiente. La creación pública produce solo Planes manuales:
no hay ruta pública para generar una propuesta `ai` productiva. La UI de
`regenerate` y su 503 se validaron con respuesta contractual en pruebas; en
producción se comprobó el 409 correcto para un Plan manual. No se atribuye
una respuesta de Gemini ni un 503 productivo que no pudieron observarse.
**Frontend Planes + Retos queda cerrado para el contrato disponible; la
generación IA depende de una entrega futura de Backend.**

Git: 126 commits iniciales, 20 creados (17 en feature, merge `--no-ff`,
smoke/prueba y cierre documental), 146 totales en main; faltan 355 para 501.
El commit documental usa `[skip ci] [skip netlify]` y conserva el SHA servido.

# Frontend Calendario mixto — publicado y cerrado, 2026-11-03

Backend productivo `4735a697aed69f66f3055c902a00507b66a556e0`, schema
`0006_study_sessions`. El merge `--no-ff` `a21858de6624f6b8e0f289ce454619566bed55a3`
y el fix de timezone `c2edfd29912354100bb54ff2373aeaa1ee138723` están publicados.
Netlify deploy `6ae94b7544b5e9672d6466e0` está `ready`; sirve ese SHA en
https://cognova-frontend.netlify.app. Contrato mixto y matriz en
`CALENDAR_CONTRACT.md` e `INTEGRATION_VALIDATION.md`.

El smoke Chrome productivo pasó el 2026-11-03T02:51:03Z (21:51 Bogota): Actividad
y Sesión en la misma hora, orden Backend, filtros, mes/semana, rutas/refresh,
detalles por teclado, desktop/móvil, auth, 36 respuestas `no-store`, snapshots
idénticos, cero errores JS y cleanup completo. Hubo 14 avisos CSP preexistentes.
Evidencia sanitizada: `evidence/calendar-study-sessions-release-2026-11-03.json`.

`npm test`: 302/302; lint, TypeScript, `npm run build` y `npm run build:netlify`
verdes, incluyendo build en UTC. La expectativa horaria de prueba ahora deriva la
zona local y valida `planned_start_at`; no cambió el render de aplicación. Auditoría
de producción: cero vulnerabilidades; auditoría completa: 12 moderadas transitivas
de desarrollo bajo ESLint/TypeScript-ESLint, sin arreglo compatible. Persiste el
warning previo de PostCSS `from`.

El primer readiness del smoke agotó 25 s antes de crear una cuenta; readiness
directo y por proxy respondió después 200/no-store y el segundo smoke pasó. Cuenta
sintética 39 quedó como registro sin datos de estudio (no hay endpoint de borrado
de cuenta); materias 63/64, actividades 36/37 y sesiones 40/41 se eliminaron y la
sesión de autenticación se revocó. No se modificó Backend ni Database.

Git: 107 commits iniciales, 19 creados en este cierre (13 feature, merge `--no-ff`,
3 fixes/verificación y 2 commits documentales), 126 totales; faltan 375 para 501.
Sin commits vacíos ni squash. **Calendario mixto está cerrado de punta a punta y
Frontend puede continuar.**

## Histórico — Frontend Sesiones de Estudio publicado, 2026-11-02

Materias, Actividades, Calendario de Actividades y Sesiones estaban publicados.
Sesiones consume Backend `56e7caccb247776ed93c63e949faf9b76202ebcf` sobre
`0006_study_sessions`. El bundle servido era merge SHA
`8623a1c5dfb2fd6b53c00af8833fee1c883a0c19`, Netlify deploy
`6ae92b488d942822e102cae8`. El reporte histórico de smoke está en
`evidence/study-sessions-release-2026-11-02.json`.

## Histórico — Frontend Calendario cerrado, 2026-10-26 (America/Bogota)

Main integra feat/calendar-ui con --no-ff, sin squash. Netlify ready:
0541a59ab048cbc2687400a68eab53d1d85716a9, deploy 6ae010bbf41b67a5e8c44bfa,
https://cognova-frontend.netlify.app. Backend consumido:
61a2f98668f0d3452f0582d7a074f1290dbae43d / 0005_activities.
Solo este repositorio fue modificado. Auth/proxy y estilo existentes conservados.

Calendario transversal de solo lectura: mes/semana, anterior/siguiente/hoy/fecha,
zona local, filtros materia/estado/prioridad, paginación completa y enlace al
detalle/edición normal de Actividades. Sin eventos libres ni persistencia local.
Loading, vacío, errores seguros y reintento. Respuestas tardías abortadas/descartadas.
URL conserva fecha/vista/filtros; guards de sesión y onboarding existentes.

214 tests en 26 archivos (44 nuevos); lint, TypeScript, build:netlify y auditoría0.
Netlify ejecutó build obligatorio antes de publicar. Warning PostCSS from previo,
sin fallo de CSS/build. Smoke Chrome real aprobado a las 21:54:38 del 26/oct
(2026-10-27T02:54:38.691Z): mes/semana, filtros, navegación/año/hoy, fecha local
correcta, detalle, refresh/ruta directa, 1440/375, ambos temas, teclado y auth.
Ocho capturas revisadas. Cero errores JS no controlados; 10 avisos CSP preexistentes,
también observados en acceso público. CSP conservada, sin relajación.
Los cursores de varias páginas tienen regresión local; el smoke UI usó tres items.

Snapshots API de actividades antes/después idénticos; Calendario solo envió GET.
Usuario sintético26: actividades21–23 y materias42–43 eliminadas; sesión revocada.
Intentos anteriores: timeout de readiness sin cuenta; usuarios23–25 limpiados tras
fallos del tooling (selector de encabezados, espera). Ningún cambio de aplicación
ni redeploy fue necesario. En total 12 actividades y 8 materias eliminadas.
Se retienen solo las cuatro cuentas/perfiles/cuestionarios iniciales y registros
de sesiones revocadas; sin endpoint de borrado de cuenta. Ningún dato ajeno alterado.

Git: 54 commits iniciales; 69 al reanudar (15 de Calendario existentes).
12 adicionales tras reanudar, 27 creados desde inicio, 81 totales; faltan420 para501.
Incluye merge y correcciones reales del smoke; sin commits vacíos ni squash.
Commits finales de tooling/documentación [skip ci] [skip netlify] no cambian SHA live.

**Calendario queda cerrado de punta a punta.** Materias/Actividades conservan su cierre.
[Evidencia](evidence/calendar-release-2026-10-26.json) y
[validación](INTEGRATION_VALIDATION.md). No se implementaron Sesiones/Planes/Retos/IA.

## Historia anterior — estados y pendientes ya superados

# Calendario — listo para publicación, 2026-10-26

Rama feat/calendar-ui; inicio 54 commits, reanudación en 6ce8594 con 69 (15 nuevos).
Implementación de solo lectura: cliente validado/paginado, mes/semana, filtros,
zona local, URL restaurable, detalle de Actividades, guards existentes, sin
persistencia académica local ni cambios en Backend/Database.
214 pruebas/26 archivos, lint, TypeScript, build:netlify y auditoría0 aprobados.
Regresión de respuestas tardías: cancela y descarta la consulta anterior; nunca
presenta datos del periodo previo durante carga/error. Teclado y estados probados.
Responsive local implementado; revisión visual y smoke real todavía pendientes.
PostCSS mantiene su warning previo sobre from; build genera CSS y bundle.

Siguiente: merge --no-ff, push main, esperar Netlify existente, ejecutar
scripts/smokeCalendarBrowser.ts con opt-in SMOKE_ALLOW_PRODUCTION_WRITE=1.
El smoke crea una cuenta sintética, dos materias y tres actividades sin historial;
elimina sus recursos, conserva perfil/cuestionario y revoca la sesión.
Credenciales aleatorias solo en memoria. No cerrar hasta revisar evidencia visual.

## Historia anterior — los estados de publicación inferiores son fechados
# Cognova — Frontend Actividades cerrado

## Estado vigente — 2026-10-25

Materias y Actividades están cerrados en el frontend productivo.
Backend: `fe5989b86d93d10e724cbf28de4f9d64048bb711`; schema `0005_activities`.
Siguiente módulo funcional: **Calendario**, con contrato aún por definir.
Este cierre no añade endpoints, DTOs, reglas ni diseño de Calendario.

Netlify conserva el SHA `27a2c29a61fb0b393d27cd6a591e0f025581a13d`.
El bloqueo de publicación por backend sin onboarding/0003 está resuelto.
Los registros siguientes conservan resultados y límites de cada fecha; no son
bloqueos actuales de Materias/Actividades ni acreditan pruebas nuevas.

Esta tarea parte de main limpio edde382 (53 commits). Un commit documental con
[skip ci] [skip netlify] deja 54. Solo Markdown: sin código, diseño, deploy ni smoke
productivo. Controles del cierre: diff, enlaces locales, evidencia JSON y alcance Git.

## Estado final — 2026-10-24 (America/Bogota)

Rama feat/activities-ui integrada a main con --no-ff, sin squash.
Netlify https://cognova-frontend.netlify.app, SHA 27a2c29a61fb0b393d27cd6a591e0f025581a13d,
deploy 6add4f267df000662f67a235 ready. Backend consumido fe5989b / 0005_activities,
readiness200 por proxy; no cambios en Backend/Database ni en auth/proxy.

CRUD, filtros materia/estado/prioridad/fecha exacta/rango, transiciones con
precondición, cambios de fecha e historial paginado. Fecha original visible e
inmutable; fechas en hora local indicada, API con zona. DELETE exige confirmación;
409 explica la conservación de actividades con historia. Borradores conservados
ante404/409/422/503, consulta explícita de versión actual ante conflicto.
Acceso desde navegación y dashboard, guards existentes, sin rediseño global.

170 pruebas en15 archivos; lint, TypeScript y build:netlify verdes. Auditoría0
tras actualizar únicamente undici8.12.3 y zod4.6.7 en lock. Build advierte sobre
PostCSS sin opción from; bundle/CSS se generaron y validaron visualmente.

Smoke Chrome155 real aprobado el24/oct a19:37:55 Bogotá (25/oct00:37:55Z):
crear/editar/filtrar, cambiar estado, postergar/adelantar, historial, DELETE204
con GET/segundo DELETE404, DELETE409 con fila conservada, refresh y rutas directas.
Escritorio1440/móvil375, claro/oscuro y teclado aprobados; sin overflow ni errores
JS no controlados. Diez avisos CSP; también observados en /login público, como en
releases anteriores; CSP no relajada. Evidencia en INTEGRATION_VALIDATION.

Usuario sintético20: actividad5 borrada; actividad4 cancelada con sus dos eventos,
materia archivada; perfil/cuestionario conservados y sesión revocada. Solo REST;
ninguna consulta PostgreSQL ni modificación de datos ajenos.

Inicio45 commits (2be1f8f); ocho nuevos,53 totales: contrato, cliente API,
componentes/estado, vistas/regresiones, parche seguridad, smoke, merge y cierre.
Último commit documental con [skip ci] [skip netlify] conserva el SHA desplegado.
**Actividades queda cerrado.** Sesiones e IA no se implementaron en ese release.
Calendario es el siguiente módulo funcional, con contrato todavía por definir.
Las secciones siguientes son historia de Materias/onboarding, no bloqueos actuales.

# Histórico — Cognova — Frontend Materias cerrado

## Histórico — Estado final — 2026-10-21

Materias queda cerrado. Netlify publicado en https://cognova-frontend.netlify.app,
SHA c439a821db99157fae01b0c44abd69993d68cce2, deploy 6ad8630286df0857a21d2ec0 ready.
La rama fix/subjects-dialog-focus se integró a main con --no-ff, sin squash.
Único cambio funcional de este cierre: cerrar el diálogo nativo antes de restaurar
el foco al botón que lo abrió. Sin cambios de diseño ni de backend/database.

Regresión accesible: cancelación por Escape, cierre antes de focus, foco en trigger
y ninguna solicitud DELETE al cancelar. 139 tests en 13 archivos, lint, TypeScript
y build:netlify aprobados. Auditoría previa verde; dependencias sin cambios aquí.
Smoke Chrome productivo limitado aprobado el 2026-10-21 07:03:54Z:
Escape y Tab/Enter en Cancelar restauran foco; confirmación explícita por teclado
produce un único DELETE204/no-store, GET404, segundo DELETE404 y ausencia en listado.
Cuenta sintética15: materia eliminada, sesión revocada; perfil/cuestionario retenidos.

CRUD, archivo/reactivación, cupo5, duplicados, aislamiento, rutas directas y vistas
claro/oscuro escritorio/móvil conservan su evidencia anterior. No se repitieron
ni cambiaron en este cierre. Avisos CSP inline preexistentes documentados; política
sin relajaciones. No bloquean el flujo Materias validado.

Base de esta continuación: bd417b6, 41 commits. Cierre: cuatro commits nuevos
(corrección, merge, ajuste del smoke, documentación), 45 totales. Desde el inicio
de Materias en dd87718/31 son14 nuevos. Tooling/documentación finales usan
[skip ci] [skip netlify] y no sustituyen el SHA productivo validado.

## Historial anterior (bloqueos de Materias resueltos)

# Histórico — Ajuste de foco durante smoke — 2026-10-21

Deploy bd417b6: edición PUT corregida y validada en Chrome real; activas/archivadas,
cupo, duplicados, aislamiento y vistas claro/oscuro 1440/375 px aprobados.
Cancelar diálogo DELETE no restauraba foco: cerrar el dialog nativo antes de
restaurar foco en su botón disparador. Prueba UI y smoke verifican este comportamiento.
Cuentas sintéticas 11/12 limpiadas (materias), sesiones revocadas.
139 tests, lint, TypeScript y build:netlify aprobados. Regresión comprueba cierre
nativo antes de focus y cancelación sin DELETE. Smoke limitado reproducible:
SMOKE_ALLOW_PRODUCTION_WRITE=1; node --experimental-strip-types scripts/smokeSubjectsFocus.ts.
Pendiente publicación y smoke final de teclado/DELETE; no cerrar aún.

# Histórico — Corrección durante smoke visual — 2026-10-20

Primer deploy Materias e5f72ac publicado, smoke real detectó PUT422:
el formulario extendía el objeto Subject y enviaba campos de lectura adicionales.
Se inicializa ahora el borrador exclusivamente con name/difficulty/color_base/color_shade.
Regresión comprueba payload PUT exacto. Cuentas sintéticas 9/10: materias eliminadas,
sesiones revocadas. Release aún abierto hasta repetir deploy y smoke completo.

# Histórico — Materias en implementación — 2026-10-20

Rama feat/subjects-ui; base main dd87718 (31 commits), árbol inicial limpio.
Contrato Subjects contrastado con OpenAPI productivo 0004; backend cerrado por operación.
Se conserva auth/proxy. Cliente tipado y validadores implementados; 10 pruebas API, lint y TypeScript aprobados.
Vistas activas/archivadas, detalle, edición, acciones y confirmación DELETE integradas.
138 tests (13 archivos), lint, TypeScript y build:netlify aprobados.
Smoke HTTP productivo pasó con usuario sintético 8; materias eliminadas, sesión revocada.
Códigos 409 de duplicado/cupo/reactivación confirmados y mensajes específicos añadidos.
Siguiente: merge --no-ff, push main, deploy automático y smoke visual de Materias.
Adaptador integrado sin navegador; Chrome 155 aislado disponible mediante Playwright.
Validación visual productiva aún pendiente.
Las secciones siguientes conservan evidencia histórica.

# Histórico — Cognova — Estado frontend

Fecha: 2026-10-17. Rama de despliegue: main.

## Histórico — Release onboarding publicado; cierre visual pendiente

Se integró feat/onboarding-questionnaire sin squash mediante dae333d254974093b6422e2594c92782586df53f, conservando todos los commits. Netlify publicó ese SHA en el sitio existente https://cognova-frontend.netlify.app, deploy 6ad443bb9de5414fc3a0c500 (ready). No se modificaron backend ni database.

Backend de producción confirmado por operación: 9309effdd1b71acc3fe5e24bc8c19b70c3d8c0c8, schema 0003_onboarding_questionnaire. En esta fase se consultaron readiness 200 y OpenAPI 200 con las rutas de perfil y cuestionario. La dependencia anterior de backend sin onboarding queda resuelta; no repetir migraciones ni implementación funcional.

## Histórico — Configuración y pruebas

- Sitio Netlify bf6ef7b1-c280-4de9-8ea1-f70630cc14c1, repo M1nzutt/cognova-frontend, rama main, build npm run build:netlify, publish dist.
- RENDER_API_ORIGIN ya apunta a https://cognova-backend-lpsi.onrender.com; VITE_API_BASE_URL=/api/v1 en netlify.toml. No se cambió el recurso ni el proxy.
- npm run build:netlify: lint, 118 tests/11 archivos, TypeScript y build aprobados. npm audit: 0 vulnerabilidades. Nuevo smoke comprobado con lint y tsc -b.
- scripts/smokeOnboarding.ts ejecutado sobre Netlify: register mínimo, login/me, perfil, catálogo de diez preguntas, POST/GET, límites multi y Otro rechazados con 422, PUT revisión 2, conflicto 409, historial con revisión 1 intacta, estado complete, refresh/CSRF/rotación, sesiones, logout y revocación aprobados.
- Cuenta sintética user_id=3, nombre Frontend release smoke; conserva perfil y revisiones 1/2. Sus dos sesiones se cerraron. No se guardaron credenciales; el script no borra datos y crea una cuenta por ejecución explícita.
- Todas las respuestas API del smoke incluyen no-store. Cookies Secure/Lax, host-only, HttpOnly solo refresh, paths correctos; logout elimina ambas. Evidencia HTTP, no inspección del almacén de cookies de navegador.
- Rutas /, /login, /register, /dashboard, /onboarding/academic-profile, /onboarding/questionnaire y /app/questionnaire: HTTP 200 HTML con bundle index-DAmSllbe.js y CSP. Esto comprueba fallback, no ejecución de guards ni recarga visual.
- CORS: preflight del origen Netlify 200 con origen exacto y credentials=true; origen ajeno 400 sin allow-origin. No wildcard.
- Token real Netlify ausente del bundle y de archivos versionados; .env ignorado. No se versionaron secretos.

## Histórico — Bloqueo real y siguiente paso

El adaptador de navegador devuelve apps=[] y browsers=[]. No pudo ejecutarse E2E en navegador real. No declarar cerrado el release completo basándose solo en HTTP y pruebas con mocks.

Conectar un navegador y validar sobre el sitio publicado: register/login, restore tras recarga, perfil académico, diez pasos con atrás/adelante, límites multi y Otro, POST inicial, edición PUT, conflicto 409 conservando borrador, historial, refresh y logout; verificar guards, Web Storage, cookies y ausencia de errores de consola. No repetir el despliegue de backend/database ni reimplementar auth/onboarding. Registrar la evidencia en INTEGRATION_VALIDATION.md y actualizar este estado.

## Histórico — Smoke operativo reproducible

En PowerShell, únicamente con autorización para crear una cuenta sintética en producción:

```powershell
$env:SMOKE_ALLOW_PRODUCTION_WRITE='1'
node --experimental-strip-types scripts/smokeOnboarding.ts
```

El destino está fijado al sitio existente. Passwords/tokens/cookies permanecen en memoria; errores nativos no se imprimen. Un fallo detiene el smoke y se intenta logout de limpieza. El smoke HTTP no sustituye pruebas de UI.

## Trabajo vigente — Calendario 2026-10-26

Rama feat/calendar-ui desde main 3b4c057, 54 commits iniciales, árbol limpio.
Implementación y release autorizados; sustituye el alcance documental anterior.
Contrato productivo verificado; ver CALENDAR_CONTRACT.md. Validación y deploy pendientes.
# Frontend Sesiones de Estudio — publicado, 2026-11-02 (America/Bogota)

`feat/study-sessions-ui` se integró en `main` con merge `--no-ff` y sin squash.
SHA de merge y bundle publicado: `8623a1c5dfb2fd6b53c00af8833fee1c883a0c19`.
Netlify deploy `6ae92b488d942822e102cae8` está `ready` en
https://cognova-frontend.netlify.app. Commits posteriores de smoke/documentación
usan `[skip ci] [skip netlify]` y no alteran el bundle servido.

Backend consumido: `56e7caccb247776ed93c63e949faf9b76202ebcf`, producción en
`0006_study_sessions`. Se implementaron listado/creación/edición/detalle/borrado
seguro, ciclo start/pause/resume/finish, tiempo efectivo confirmado por servidor,
intervalos, resultados/contextos, filtros, conflictos y recuperación tras refresh.
Calendario permanece en v1 solo Actividades. Integrarlo con Sesiones requiere
ampliación del backend en `GET /api/v1/calendar`; ver `CALENDAR_CONTRACT.md`.

Validación final: 281 tests en 40 archivos, lint, TypeScript, build y
`build:netlify` verdes; `npm audit --omit=dev` sin vulnerabilidades. La auditoría
completa reporta 12 hallazgos moderados transitivos de `minimatch` (<11.0.1) en
ESLint/TypeScript-ESLint, dependencias de desarrollo; npm reporta que no hay fix
compatible disponible. No se forzó una versión mayor. Build conserva el warning
PostCSS `from` previo.

Smoke Chrome final el 2026-11-02 19:51:34 America/Bogota
(2026-11-03T00:51:34Z): Auth/CSRF/no-store, recuperación running/paused, teclado,
1440/375 px, 0 errores JS no controlados; 12 avisos CSP de consola. Una cuenta
sintética de esta corrida (user_id 36) mantiene perfil/cuestionario porque no hay
endpoint de borrado de cuenta. Materia 59 archivada, materia 60 eliminada,
actividad 32 y sesiones 29/32/33/34 conservadas como historia sintética; planes
30/31 eliminados. Logout 204 y access revocado 401.

Límite de limpieza de intentos: un intento anterior con cuenta sintética
`user_id=35` no confirmó logout tras fallar el refresh al final. Sus recursos de
Sesiones se cerraron/retuvieron como historia sintética y se retiraron las
dependencias eliminables, pero la revocación de esa sesión no quedó acreditada.
No se guardaron credenciales/tokens, así que ese intento no puede reautenticarse
desde frontend. Ningún dato de cuentas reales fue usado o modificado.

Git: 81 commits iniciales; 26 commits creados en esta tarea, 107 totales; faltan
394 para 501. La evidencia sanitizada está en
[`evidence/study-sessions-release-2026-11-02.json`](evidence/study-sessions-release-2026-11-02.json).

**Sesiones queda implementada y publicada.** La integración de Sesiones en
Calendario y la auditoría moderada de herramientas de desarrollo son pendientes
separados; no bloquean el flujo independiente de Sesiones.
