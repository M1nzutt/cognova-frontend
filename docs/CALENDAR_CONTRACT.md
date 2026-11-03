# Calendario — contrato de interfaz mixto, 2026-11-02

Backend productivo `4735a697aed69f66f3055c902a00507b66a556e0`, schema
`0006_study_sessions`. El Calendario consume una vista transversal y de solo lectura
de Actividades y Sesiones de Estudio. No crea ni modifica recursos, no sintetiza ni
duplica eventos y no requiere migración ni tabla propia.

La implementación de este contrato está integrada en `main` y pasa la suite local.
Los deploys Netlify asociados a `a21858d` y `f2c103a` fallaron en build; la UI mixta
aún no está en producción ni se ha ejecutado su smoke productivo. Estado actual en
`PROJECT_STATE.md`, diagnóstico de publicación en `DEPLOYMENT.md` y matriz de
validación en `INTEGRATION_VALIDATION.md`.

## Lectura del API

`GET /api/v1/calendar` requiere Bearer y onboarding completo; todas las respuestas
son `Cache-Control: no-store`. `deadline_from` y `deadline_to` son ISO 8601 con zona,
obligatorios, con intervalo semiabierto `[desde,hasta)`, `desde < hasta` y máximo de
366 días transcurridos. Backend compara el deadline vigente de Actividades y
`planned_start_at` de Sesiones. Frontend calcula los límites de los días visibles en
zona local y los envía con offset; no agrupa días en el API.

Filtros AND:

- `type` opcional: `activity` o `study_session`; sin él se reciben ambos tipos.
- `subject_id` positivo: aplica a ambas fuentes; materia ajena/inexistente da lista
  vacía.
- `status` y `priority` conservan valores de Actividades y se aplican únicamente a
  ellas. Si cualquiera se envía, backend omite Sesiones del resultado. Combinar esos
  filtros con `type=study_session` es inválido (422); Frontend nunca los envía en esa
  combinación.
- `limit` 1..100, predeterminado 50; se lee un elemento adicional para decidir si hay
  siguiente página.

Cursor exclusivo. Solicitudes nuevas incluyen `after_deadline`, `after_type` y
`after_id`; `after_deadline` representa el instante del item. Para compatibilidad,
Backend acepta la pareja antigua `after_deadline` + `after_id` sin `after_type` como
cursor de Actividad. Conservar rango y filtros al continuar. IDs son locales al tipo,
por eso la identidad pública es `(type,id)`.

## Elementos

`200 {items: CalendarItem[], next_cursor: CalendarCursor | null}`. `CalendarItem` es
una unión discriminada por `type`:

- `activity`: conserva el DTO publicado: `id`, `type`, `title`, `subject_id`,
  `deadline`, `original_deadline`, `priority`, `status`, `estimated_duration`. Se
  ubica siempre por `deadline` vigente.
- `study_session`: `id`, `type`, `subject_id`, `activity_id` nullable,
  `planned_start_at`, `planned_duration`, `lifecycle`, `result` nullable,
  `start_at` nullable y `end_at` nullable. `lifecycle` es `planned`, `running`,
  `paused` o `finished`; `result` es `completed`, `partial`, `postponed` o
  `cancelled`. Se ubica siempre por `planned_start_at`, incluso si ya se ejecutó.

Todos los timestamps son ISO 8601 con zona. No exponer `user_id`, notas ni historial.
Un recurso original produce como máximo un item. No copiar datos que el cliente ya
puede consultar desde sus endpoints originales.

El orden total del backend es ascendente por instante, luego rango de tipo (Actividad
antes que Sesión) y luego `id` ascendente. Frontend valida y conserva este orden al
agrupar items por día local; no reordena empates. El cursor siguiente conserva los
tres campos. La paginación no ofrece snapshot: ante cambios de fecha durante un
recorrido, actualizar el periodo.

## Interfaz

Mes y semana muestran fechas en zona local indicada; semanas lunes–domingo y mes con
días contiguos para completar semanas (máximo 42 días). Anterior, siguiente, hoy,
selector de fecha, vista y filtros permanecen en la URL para refresh, rutas directas y
historial del navegador. La consulta carga todas las páginas antes de mostrar el
periodo completo, cancela consultas obsoletas, valida DTO/rango/orden/cursor y nunca
mezcla resultados viejos con una consulta nueva.

Filtro visible de tipo: Todos, Actividades, Sesiones. Materia aplica a ambos. Estado y
prioridad son controles de Actividades; al elegir solo Sesiones se ocultan y eliminan
de la consulta. Con Todos, si se usan estado o prioridad, backend aplica el filtro a
Actividades y excluye Sesiones. Los campos de resultado se muestran con texto además
del color. Actividad abre `/app/activities/:id`; Sesión abre `/app/sessions/:id`.
Links nativos, foco visible, etiquetas y anuncios de estado. Móvil apila días/items
sin perder información.

Calendario no admite eventos libres, creación, arrastre, edición directa ni endpoint
de detalle propio. Las ediciones se realizan en el recurso original.

401 sesión, 403 onboarding, 422 consulta inválida y 503 indisponibilidad. Traducir a
mensajes seguros; no presentar texto arbitrario del servidor. Estados loading, vacío,
error y reintento son explícitos.

## Estado

Backend ampliado y cerrado. Frontend consume SHA productivo
`4735a697aed69f66f3055c902a00507b66a556e0` en `0006_study_sessions`. No hay cambios
requeridos en Backend ni Database. El smoke productivo frontend y el despliegue de
Netlify se registran en `PROJECT_STATE.md`, `DEPLOYMENT.md` e
`INTEGRATION_VALIDATION.md`.
