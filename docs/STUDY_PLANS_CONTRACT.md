# Planes de Estudio y Retos — contrato Frontend

Backend productivo `d9fff7c36e6a1c1c98079e9be225c1d273e0e9d0`, Database
`0007_study_plans_and_challenges`. Fuente de verdad: API `/api/v1`. La UI
consume recursos propios con Bearer y onboarding completo; auth y `no-store`
siguen el cliente central. No se envía `user_id`.

## Planes

`GET /study-plans?status=&limit=&after_id=` devuelve `items` y
`next_after_id`; orden por ID ascendente, límite 1–100. Estado `draft`,
`active`, `completed`, `abandoned`; origen `manual` o `ai`.
`POST /study-plans` y `PUT /study-plans/{id}` reciben nombre (1–100),
objetivo (1–2000), `start_at` y `end_at` ISO 8601 con zona, y tres listas
de IDs: `subject_ids`, `activity_ids`, `study_session_ids`. Las relaciones
de Actividad/Sesión deben corresponder a Materias del mismo Plan. Esta entrega
crea solo Planes manuales.

`GET /study-plans/{id}` devuelve el resumen más recursos vinculados,
`decisions`, `challenge_count`, `hierarchy`, `priority_order`,
`activity_dependency_order`, `weekly_rhythm`, `candidate_slots` y
`schedule_conflict`. Son proyecciones del Backend; Frontend no recalcula
prioridad, dependencias ni disponibilidad.

`POST /study-plans/{id}/activate` admite borrador manual;
`/complete` admite activo; `/abandon` admite borrador o activo.
`DELETE /study-plans/{id}?confirm=true` admite solo borrador manual sin
relaciones, decisiones ni Retos. La UI pide confirmación explícita y respeta
409. `/undo` deshace una edición de borrador y agrega evidencia inversa.
`/accept` y `/reject` solo admiten propuestas `ai` en borrador; su
creación pública aún no existe. `/regenerate` sobre propuesta `ai` sin
proveedor devuelve 503; la UI informa indisponibilidad y conserva el estado.

Decisiones `accepted`, `edited`, `rejected`, `regenerated` incluyen
`proposed_value` y `chosen_value` nullable. La UI traduce campos conocidos
a español y presenta un resumen legible; nunca expone JSON técnico.

## Retos dentro del Plan

`GET /study-plans/{id}/challenges?limit=&after_id=` devuelve `items` y
`next_after_id`. `POST` y `PUT /challenges/{challenge_id}` usan título,
descripción, `target_type`, `target_value`, criterio no vacío, fechas
opcionales y relaciones opcionales a Materia, Actividad y Sesión del Plan.
Un Reto no existe fuera de su Plan. Estados: `pending`, `in_progress`,
`completed`, `failed`, `cancelled`; origen `manual` o `ai`.
`/start`, `/complete`, `/fail` y `/cancel` aplican las transiciones
del Backend. Solo un pendiente se edita. No hay DELETE de Retos.

Objetivos públicos: `study_minutes` (1–1440 con Materia/Sesión),
`activity_completion` (Actividad), `session_completion` (Sesión),
`subject_mastery` (Materia, criterio y umbral 1–100), y `custom`
(objeto no vacío). El formulario ofrece opciones comprensibles y arma la
configuración exacta sin pedir JSON al usuario.

## Errores y alcance

401 requiere iniciar sesión; 403, completar onboarding; 404 oculta recursos
ajenos o inexistentes; 409 indica estado o vínculo cambiado y obliga a
actualizar detalle antes de reintentar; 422 preserva el formulario para
corregirlo; 503 de regeneración informa que la función no está disponible.
Calendario sigue mostrando solo Actividades y Sesiones hasta que Backend
exponga Retos en `GET /calendar`.
