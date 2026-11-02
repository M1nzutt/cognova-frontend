# Sesiones de estudio — contrato de interfaz, 2026-11-02

Backend productivo `56e7caccb247776ed93c63e949faf9b76202ebcf`, schema
`0006_study_sessions`. OpenAPI productivo consultado el 2026-11-02.

## Seguridad y transporte

- API base `/api/v1`; rutas privadas requieren Bearer y onboarding completo.
- Frontend usa `ApiClient` existente: credencial solo en memoria, cookies
  incluidas, CSRF para mutaciones y `cache: no-store`.
- No persistir credenciales, sesiones ni borradores en Web Storage.
- Ownership y validación final corresponden al backend; no enviar `user_id`.
- Traducir errores HTTP con mensajes seguros. No exponer códigos internos ni
  mensajes arbitrarios de PostgreSQL/API.

## Recursos y campos

Escritura de planificación:

```text
{subject_id: integer positivo,
 activity_id?: integer positivo | null,
 planned_start_at: ISO 8601 con zona,
 planned_duration: integer 10..180}
```

La materia es obligatoria y propia. La actividad puede omitirse; si se envía,
debe pertenecer al mismo usuario y materia. `PUT` sustituye todos los campos de
planificación y solo es válido antes de iniciar/crear intervalos.

Resumen de sesión:

```text
{id, subject_id, activity_id, planned_start_at, planned_duration,
 execution_state, status, start_at, end_at, actual_duration, context,
 created_at, updated_at}
```

Detalle añade `other_text` y `intervals[{id,started_at,ended_at}]`. Nullable:
`activity_id`, `status`, `start_at`, `end_at`, `context`, `other_text` y
`ended_at` del intervalo abierto. `actual_duration` es string decimal en segundos
con precisión de seis posiciones según el backend.

## Ciclo, timer y resultado

| Estado | Acción permitida | Efecto confirmado por backend |
| --- | --- | --- |
| planned | start | `running`, `start_at` y primer intervalo |
| running | pause | `paused`, cierra intervalo actual |
| running | finish | `finished`, cierra intervalo y fija resultado |
| paused | resume | `running`, abre intervalo nuevo |
| paused | finish | `finished`, conserva intervalos cerrados |
| finished | ninguna | estado terminal |

Resultado requerido al finalizar: `completed`, `partial`, `postponed` o
`cancelled`. `completed` y `partial` requieren ejecución; un plan sin ejecución
puede finalizar `postponed` o `cancelled`. Contexto opcional: `finished_early`,
`distracted`, `tired`, `interrupted`, `changed_activity`, `other`.
`other_text` solo se permite con contexto `other`, máximo 200 caracteres. En UI,
cancelar/postergar un plan sin iniciar es finalizar con ese resultado, con
confirmación explícita.

`actual_duration` confirmado es la suma real de intervalos cerrados y no incluye
pausas. El backend es fuente de verdad. En estado `running`, la UI puede mostrar
un contador estimado sumando al total confirmado el tiempo desde `started_at` del
intervalo abierto; marcarlo como provisional. Al pausar/finalizar y tras
restaurar la vista, sincronizar desde API. No reconstruir estado desde reloj local
ni Web Storage.

## Endpoints

- `GET /sessions`: filtros opcionales `subject_id`, `activity_id`,
  `execution_state`, `status`, `planned_start_from`, `planned_start_to`; `limit`
  1..100 (50 por defecto); cursores `after_planned_start_at` y `after_id` deben
  ir juntos. Orden ascendente por `(planned_start_at,id)`. Respuesta
  `{items:StudySessionSummary[],next_cursor:StudySessionCursor|null}`.
- `POST /sessions`: crea plan; 201 `StudySessionDetail`.
- `GET /sessions/{id}`: 200 `StudySessionDetail`.
- `PUT /sessions/{id}`: reemplaza planificación sin ejecución; 200 detalle.
- `DELETE /sessions/{id}?confirm=true`: 204 solo si está planificada sin
  ejecución/intervalos; 409 en otro caso.
- `POST /sessions/{id}/start`, `/pause`, `/resume`: sin body; 200 detalle.
- `POST /sessions/{id}/finish`: `{status,context?,other_text?}`; 200 detalle.

Las respuestas 401/403/404/409/422/503 se manejan en lenguaje claro y sin
reintento automático de mutaciones. 409 conserva el recurso y actualiza el
detalle/listado desde servidor. Solo puede existir una sesión `running` o `paused`
por usuario; errores de concurrencia se presentan como conflicto recuperable.

## Calendario

Calendario productivo v1 sigue consultando solo Actividades. No se sintetizan ni
persisten items de sesión desde Frontend. `DEPENDENCY` para fase posterior:

- repo afectado: `cognova-backend`;
- contrato relacionado: `CALENDAR_CONTRACT.md` en backend;
- cambio requerido: ampliar `GET /api/v1/calendar` para devolver sesiones con
  esquema, filtros, ownership y reglas de rango/paginación explícitos;
- motivo: el contrato vigente solo declara `type: activity`; el frontend no
  puede inventar ni derivar eventos de calendario.

No bloquea el release independiente de la interfaz de Sesiones.
