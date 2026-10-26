# Cognova — Contrato API v1

Materias y Actividades están cerrados en el frontend productivo.
Backend: `fe5989b86d93d10e724cbf28de4f9d64048bb711`; schema `0005_activities`.
Siguiente módulo funcional: **Calendario**, con contrato aún por definir.
Este cierre no añade endpoints, DTOs, reglas ni diseño de Calendario.

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
sobre el usuario autenticado. No reciben user_id. Materias y Actividades ya están implementados y cerrados;
los restantes módulos son planificación futura.

## Subjects — contrato productivo verificado 2026-10-20

Fuente: OpenAPI de https://cognova-backend-lpsi.onrender.com/openapi.json.
Referencia histórica de la verificación inicial: backend
430c64a3c299f82853f7947498f663f1cded590c / 0004_subjects. El contrato se conserva
en el backend vigente fe5989b / 0005. Sustituye la especificación preliminar.
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

- GET `/sessions`
- POST `/sessions`
- GET `/sessions/{id}`
- DELETE `/sessions/{id}`
- POST `/sessions/{id}/start`
- POST `/sessions/{id}/pause`
- POST `/sessions/{id}/resume`
- POST `/sessions/{id}/finish`

El backend es la fuente de verdad del temporizador.

`finish` registra:
- resultado;
- motivo cuando corresponda;
- motivo personalizado opcional;
- contexto opcional.

Resultados:
- completed
- partial
- postponed
- cancelled

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

- POST `/ai/analyze`
- GET `/ai/conversations`
- POST `/ai/conversations`
- GET `/ai/conversations/{id}/messages`
- POST `/ai/conversations/{id}/messages`

Reglas:
- IA real;
- contexto académico;
- evidencia desde backend;
- rate limiting/cost controls;
- manejo de proveedor no disponible.

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

## Calendario — contrato vigente 2026-10-26

GET /calendar de solo lectura: [CALENDAR_CONTRACT](CALENDAR_CONTRACT.md).
Backend vigente 61a2f98668f0d3452f0582d7a074f1290dbae43d, schema 0005_activities.
Esta decisión sustituye las referencias anteriores a contrato pendiente.
