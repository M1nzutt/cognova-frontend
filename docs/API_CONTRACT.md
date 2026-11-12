# Cognova — Contrato API v1

Backend productivo `d9fff7c36e6a1c1c98079e9be225c1d273e0e9d0`, schema
`0007_study_plans_and_challenges`. `GET /calendar` devuelve Actividades y Sesiones
como vista de solo lectura. La UI mixta vigente está publicada en Netlify desde
`5baf625e14fbb543a9fd715dbfaaf3b43c2f8c6d`, deploy
`6aec118ff6c3ff162f7334de`. Planes y Retos siguen el contrato
[STUDY_PLANS_CONTRACT](STUDY_PLANS_CONTRACT.md). Otros contratos:
[CALENDAR_CONTRACT](CALENDAR_CONTRACT.md) y
[STUDY_SESSIONS_CONTRACT](STUDY_SESSIONS_CONTRACT.md).

Fuente productiva vigente indicada arriba; ver [INTEGRATION_VALIDATION](INTEGRATION_VALIDATION.md).
Procedencia histórica de auth/onboarding: backend `a277af2ba5f2e7227b5b329aa7d935e5e12b8f94`
sobre 0003. Esa referencia no es el backend desplegado actual. Las secciones de
otros módulos conservan planificación conceptual, no funcionalidades publicadas.

Base:

```text
/api/v1
```

Formato de error:

```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Mensaje legible."
  }
}
```

Fechas y horas: ISO 8601.

Los recursos privados requieren autenticación salvo indicación contraria.

## Operación

- GET `/health`: público, `200 {"status":"ok"}`; liveness del proceso, no consulta DB.
- GET `/ready`: público, `200 {"status":"ready"}` si `SELECT 1` funciona y Alembic
  está en la revisión esperada; `503 {"error":{"code":"SERVICE_UNAVAILABLE",
  "message":"Servicio temporalmente no disponible."}}` si falla. No expone hosts,
  credenciales, versiones ni detalles internos. Ambos usan Cache-Control: no-store.

## Auth

Fuente de verdad detallada: `AUTH_CONTRACT.md`.

- POST `/auth/register`
- POST `/auth/login`
- GET `/auth/me`
- POST `/auth/refresh`
- POST `/auth/logout`
- GET `/auth/sessions`
- DELETE `/auth/sessions/{session_id}`

## Questionnaire

- GET `/questionnaire`
- POST `/questionnaire`
- PUT `/questionnaire`

Contrato vigente de onboarding y cuestionario: [ONBOARDING_CONTRACT.md](ONBOARDING_CONTRACT.md).
Incluye GET `/questionnaire/catalog`, GET `/questionnaire/history` y
PUT `/onboarding/academic-profile`. Los tres endpoints existentes se conservan.
Todas estas rutas requieren Bearer; permiten onboarding incompleto y solo operan
sobre el usuario autenticado. No reciben user_id. Materias, Actividades,
Calendario, Sesiones, Planes y Retos están implementados en Backend. El Frontend
incorpora Planes y Retos según su contrato específico.

## Subjects — contrato productivo verificado 2026-10-20

Fuente: OpenAPI de https://cognova-backend-lpsi.onrender.com/openapi.json.
Referencia histórica de la verificación inicial: backend
430c64a3c299f82853f7947498f663f1cded590c / 0004_subjects. El contrato se conserva
en el backend vigente 61a2f98 / 0005. Sustituye la especificación preliminar.
Bearer y onboarding completo obligatorios; identidad derivada de sesión.

- GET /subjects/catalog: {version:1,color_bases:string[],color_shades:number[]}.
  Opciones obtenidas del backend; CSS solo traduce sus IDs a presentación.
- SubjectWrite: {name:string,difficulty:"easy"|"medium"|"hard",
  color_base:string,color_shade:number}. Nombre trim, 1..20 caracteres.
- Subject: SubjectWrite + {id:number,status:"active"|"archived",
  created_at:datetime,updated_at:datetime}. Sin user_id ni description.
- GET /subjects?status=active|archived|all&limit=20&after_id=<id>:
  {items:Subject[],next_after_id:number|null}. Limit 1..100; cursor positivo
  exclusivo, orden ascendente por id. La UI ofrece cargar más archivadas.
- POST /subjects: SubjectWrite + status opcional (active por defecto); 201 Subject.
- GET /subjects/{subject_id}: 200 Subject.
- PUT /subjects/{subject_id}: SubjectWrite completo, sin status; 200 Subject.
- POST /subjects/{subject_id}/archive y /reactivate: sin body; 200 Subject.
- DELETE /subjects/{subject_id}?confirm=true: 204 sin body, irreversible.
  Confirm obligatorio; advertencia y confirmación explícita antes de enviar.

Máximo cinco activas; archivadas excluidas. Nombres únicos por usuario.
Reactivar exige cupo; conflictos 409 conservan borrador. Ajena/inexistente:404;
sin sesión:401; onboarding incompleto:403; validación:422; indisponibilidad:503.
Formato global error/code/message; no mostrar mensajes arbitrarios del servidor.
Responses API no-store. Grants y persistencia pertenecen a Database.

## Goals

- GET `/goals`
- POST `/goals`
- GET `/goals/{id}`
- PUT `/goals/{id}`
- DELETE `/goals/{id}`

`subject_id` puede ser opcional si así lo define `DATA_MODEL.md`.

## Activities — contrato productivo verificado 2026-10-24

Backend fe5989b86d93d10e724cbf28de4f9d64048bb711 / 0005_activities.
OpenAPI productivo sustituye la propuesta anterior: no type, goal_id ni prioritized.
Bearer y onboarding completo; propietario derivado de sesión; no-store.
ActivityWrite: {title:string trim 1..50,subject_id:integer positivo,
deadline:ISO8601 con zona,priority:low|medium|high|urgent,
status:pending|in_progress|completed|postponed|cancelled,
estimated_duration:integer 10..300,notes:string(max200)|null}.
Activity añade id,original_deadline,deadline_revision,created_at,updated_at.
Nunca enviar campos de lectura ni user_id.

- POST /activities:201; GET /activities/{id}:200; PUT /activities/{id}:200.
  POST/PUT reciben ActivityWrite completo y devuelven Activity.
- GET /activities: subject_id,status,priority,deadline exacto,deadline_from/to
  inclusivos; limit1..100 (20),after_id positivo. {items,next_after_id}, id ASC.
- PATCH /activities/{id}/status: {status,expected_status};200 Activity.
- PATCH /activities/{id}/deadline: {deadline,expected_revision>=0};200 Activity.
- GET /activities/{id}/deadline-history?limit=20&after_revision=<positivo>:
  {items:[{revision,previous_deadline,new_deadline,event_type,occurred_at}],
  next_after_revision:number|null}, revision ASC.
- DELETE /activities/{id}?confirm=true:204 sin cuerpo; historial/dependencias409.

Fecha mayor:postponed; menor:rescheduled; mismo instante no crea evento.
Original inmutable; cambiar fecha no cambia estado. Completada/cancelada requieren
reabrir a pending antes de otro estado. Precondición obsoleta409, sin retry automático.
Materia propia obligatoria, también archivada. Ajena/inexistente404; invalidación422;
indisponibilidad503. Conflictos ACTIVITY_HAS_DEPENDENCIES, ACTIVITY_STATE_CONFLICT,
ACTIVITY_DEADLINE_CONFLICT, ACTIVITY_TRANSITION_CONFLICT y ACTIVITY_WRITE_CONFLICT.
UI etiqueta zona local y envía ISO con zona. Edición general conserva estado/fecha;
controles separados usan PATCH. Borrador solo en memoria, mensajes locales seguros.

## Dependencies

- GET `/dependencies`
- POST `/dependencies`
- DELETE `/dependencies/{id}`

Representan dependencias reales entre actividades.

## Sessions

Contrato productivo consultado en OpenAPI el 2026-11-02; detalle de interfaz:
[STUDY_SESSIONS_CONTRACT](STUDY_SESSIONS_CONTRACT.md). Backend productivo
`4735a697aed69f66f3055c902a00507b66a556e0`, schema `0006_study_sessions`.
Bearer y onboarding completo son obligatorios; las respuestas privadas son
`no-store`. Identidad y ownership se derivan de la sesión autenticada.

- GET `/sessions`: filtros opcionales `subject_id`, `activity_id`,
  `execution_state`, `status`, `planned_start_from`, `planned_start_to`;
  `limit` 1..100 (50 predeterminado). Cursores exclusivos
  `after_planned_start_at` y `after_id` se envían juntos. Orden
  `planned_start_at ASC, id ASC`; respuesta `{items,next_cursor}`, donde el
  cursor es `null` o `{after_planned_start_at,after_id}`.
- POST `/sessions`: `{subject_id,activity_id?,planned_start_at,planned_duration}`;
  fecha/hora ISO 8601 con zona, duración 10..180; responde 201 con detalle.
- GET `/sessions/{id}`: devuelve detalle e intervalos.
- PUT `/sessions/{id}`: reemplaza los campos de planificación; solo plan sin
  ejecución; responde detalle.
- DELETE `/sessions/{id}?confirm=true`: 204 solamente para plan sin inicio ni
  intervalos; conflictos/dependencias responden 409.
- POST `/sessions/{id}/start`, `/pause` y `/resume`: sin body; devuelven detalle
  actualizado.
- POST `/sessions/{id}/finish`: `{status,context?,other_text?}`; devuelve
  detalle actualizado. `other_text` solo aplica a `context=other`, máximo 200.

Ciclo: `planned`, `running`, `paused`, `finished`. Resultado nullable hasta
finalizar: `completed`, `partial`, `postponed`, `cancelled`. Contexto nullable:
`finished_early`, `distracted`, `tired`, `interrupted`, `changed_activity`,
`other`. Se permiten `postponed`/`cancelled` sin ejecución; `completed`/`partial`
requieren ejecución real.

El detalle incluye `id`, `subject_id`, `activity_id`, `planned_start_at`,
`planned_duration`, `execution_state`, `status`, `start_at`, `end_at`,
`actual_duration` (segundos decimales como string), `context`, `other_text`,
`created_at`, `updated_at` e `intervals[{id,started_at,ended_at}]`.
El backend es la fuente de verdad del temporizador. La UI puede animar un valor
provisional desde el intervalo abierto, pero sincroniza cada transición con API
y solo presenta `actual_duration` como tiempo efectivo confirmado.

Subject es obligatoria y propia; actividad opcional debe ser propia y pertenecer
a la misma materia. Una sesión running/paused por usuario. Transiciones o
precondiciones incompatibles producen 409; ajena/inexistente 404; validación
422; falta de sesión 401; onboarding incompleto 403; indisponibilidad 503. La UI
no muestra mensajes arbitrarios del servidor ni reintenta mutaciones en conflicto.

Calendario consume `GET /calendar` y recibe `type=activity` por `deadline` y
`type=study_session` por `planned_start_at`, además de `subject_id`, `activity_id`,
`planned_duration`, `lifecycle`, `result`, `start_at` y `end_at` para Sesiones.
Ambos tipos comparten rango semiabierto, ownership y paginación cronológica. El orden
estable en empate es Actividad antes de Sesión y luego ID. Filtro de materia aplica a
ambos; estado/prioridad solo a Actividades y no se envían al seleccionar solo Sesiones.
Calendario no crea ni edita datos; cada item enlaza a su recurso original. Contrato
detallado: [CALENDAR_CONTRACT](CALENDAR_CONTRACT.md).

La interfaz de Sesiones y la vista transversal están publicadas sobre Backend
`4735a697aed69f66f3055c902a00507b66a556e0` / `0006_study_sessions`. No sintetizar
items ni alterar recursos desde Calendario.

## Analytics

- GET `/analytics/summary`
- GET `/analytics/by-time-of-day`
- GET `/analytics/by-duration`
- GET `/analytics/by-subject`

Con menos de 5 sesiones válidas:
- puede devolver datos descriptivos;
- no debe presentar patrones como concluyentes.

## History

- GET `/history`

Debe permitir reconstruir evolución cronológica del usuario.

La paginación/filtros concretos deben documentarse antes de implementar si no están definidos todavía.

## Streak

- GET `/streak`

Respuesta conceptual:
- current_streak
- best_streak

## AI

Contrato de Backend para Planes IA y análisis de comportamiento, rama de
integración `feat/gemini-behavior`, SHA `110978bc1931fd0fc5882c7a0316acd57e0e9183`.
Este contrato aún no se ha validado contra un Backend desplegado.

- POST `/study-plans/generate`, sin body, requiere auth y onboarding completo;
  responde `{plan, explanation, reasoning_summary}` con Plan `source=ai`,
  `status=draft` y `ai_proposal_snapshot` persistido. La UI lo abre como borrador;
  nunca lo activa automáticamente.
- GET `/study-plans/{id}` vuelve a incluir el snapshot, para conservar explicación,
  resumen visible y propuesta original tras refresh. No mostrar `model`, nombres
  internos de esquema ni objetos JSON crudos.
- POST `/study-plans/{id}/accept`, `/reject` y `/regenerate`, sin body. Accept/reject
  registran la decisión y conservan el snapshot actual. Regenerate exitoso registra
  la propuesta previa en `study_plan_decisions.proposed_value` y guarda la propuesta
  nueva como snapshot vigente. Un fallo de proveedor no cambia Plan, snapshot ni
  decisiones.
- POST `/analysis/behavior`, sin body, requiere auth y onboarding completo;
  responde `{finished_session_count, pattern_eligible, observations}`. Cada
  observación contiene texto, evidencia, pregunta, base de confianza e IDs de
  recursos relacionados. Con menos de cinco sesiones se presenta el estado de
  historial insuficiente y no se afirma que exista un patrón.

El Backend puede responder 503 `STUDY_PLAN_GENERATION_UNAVAILABLE`; rate limit de
Gemini usa `GEMINI_RATE_LIMIT` y `Retry-After`. El cliente mantiene mensajes
controlados, no muestra detalles del proveedor, no reintenta mutaciones y permite
actualizar el recurso antes de repetir una solicitud con timeout.

La API key solo existe en Backend. Frontend no envía prompts ni contexto académico
directamente al proveedor. La respuesta persistida contiene explicación y resumen
visibles, nunca chain-of-thought, prompts completos ni respuesta cruda.

## Observations

- GET `/observations`
- GET `/observations/{id}`
- PATCH `/observations/{id}/feedback`

Feedback debe poder expresar:
- aceptación/rechazo;
- contexto;
- periodo atípico;
- exclusión justificada de futuros análisis cuando el dominio lo permita.

## Challenges

- GET `/challenges`
- POST `/challenges/{id}/accept`
- POST `/challenges/{id}/reject`
- POST `/challenges/{id}/complete`

Un reto aceptado no se edita.

## Profile

Datos académicos: PUT `/onboarding/academic-profile` según ONBOARDING_CONTRACT.md.
Lectura y estado en `/auth/me`. Nombre/email no se editan en esta fase. Los futuros
módulos académicos requieren get_onboarded_user, con403 ONBOARDING_REQUIRED cuando
el perfil o cuestionario inicial no estén completos. Auth/onboarding no lo exigen.

## DTOs y paginación

Este archivo fija rutas y reglas de dominio.

Antes de implementar cualquier endpoint que todavía no tenga request/response exactos:
1. definir DTO;
2. definir status codes;
3. definir errores;
4. definir paginación/filtros si aplica;
5. actualizar este contrato local y coordinar los repositorios afectados;
6. implementar backend;
7. consumir desde frontend.

No inferir un DTO público directamente de una tabla SQLAlchemy.

## Errores Subjects confirmados por smoke real 2026-10-20

409 SUBJECT_NAME_CONFLICT (duplicado), SUBJECT_ACTIVE_LIMIT (sexta activa),
SUBJECT_REACTIVATION_LIMIT (reactivar sin cupo). 404 SUBJECT_NOT_FOUND para
inexistente/segunda eliminación. DELETE sin confirmación:422 VALIDATION_ERROR.
Smoke por Netlify con cuenta sintética 8, materias eliminadas y sesión revocada.

## Calendario — contrato productivo mixto 2026-11-02

GET `/api/v1/calendar` de solo lectura consume backend
`4735a697aed69f66f3055c902a00507b66a556e0` / `0006_study_sessions`. Devuelve
Actividades por deadline y Sesiones por planned_start_at como unión discriminada.
Tipos, filtros, cursor, empate, ownership y presentación: [CALENDAR_CONTRACT](CALENDAR_CONTRACT.md).
