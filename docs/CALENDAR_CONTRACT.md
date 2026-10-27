# Calendario — contrato de interfaz, 2026-10-26

Backend productivo 61a2f98668f0d3452f0582d7a074f1290dbae43d, schema 0005_activities.
OpenAPI productivo consultado el 2026-10-26. Sin dependencia nueva de Database.

GET /api/v1/calendar requiere Bearer y onboarding completo, responde no-store.
deadline_from/deadline_to obligatorios con zona; intervalo [desde,hasta), positivo,
máximo 366 días transcurridos. Filtros AND: subject_id, status, priority.
Incluye todos los estados y materias archivadas. Materia ajena produce lista vacía.
limit 1..100 (50 por defecto); cursor exclusivo after_deadline + after_id,
ambos juntos. Orden deadline ASC, id ASC. Respuesta {items,next_cursor};
next_cursor es null o {after_deadline,after_id}. Conservar precisión del cursor.

Cada item: id, type:"activity", title, subject_id, deadline, original_deadline,
priority (low/medium/high/urgent), status (pending/in_progress/completed/postponed/cancelled),
estimated_duration. Identidad por (type,id). No user_id ni notas.
401 sesión, 403 onboarding, 422 consulta inválida, 503 indisponibilidad.
No renderizar mensajes arbitrarios del servidor.

Vista mensual y semanal, semanas lunes–domingo, fechas y horas en zona local
indicada. Mes incluye días contiguos para completar semanas. El rango consultado
coincide con días visibles y nunca supera 42 días. Se usa aritmética de fechas
locales (no sumas fijas de 24 horas), conservando cambios de horario.
Anterior/siguiente/hoy y selector de fecha; vista/fecha/filtros en URL para
refresh, rutas directas y volver atrás. Solo preferencias de consulta en URL.
No persistir actividades, respuestas, credenciales ni borradores en Web Storage.

Cargar todas las páginas antes de presentar un periodo como completo, abortar al
cambiar consulta y no mostrar resultados antiguos bajo fechas/filtros nuevos.
Validar DTO, orden, rango y progreso del cursor; rechazar respuestas inconsistentes.
Mostrar loading, vacío contextual y error con reintento. La materia se resuelve
desde Subjects, incluyendo archivadas. Texto de materia/prioridad/estado además
del color; links nativos, foco visible, controles etiquetados y estado anunciado.
En móvil los días se apilan sin perder actividades.

Calendario es una vista académica transversal de solo lectura. No eventos libres,
creación, arrastre ni edición directa. Cada item abre /app/activities/:id y utiliza
el flujo normal de detalle/edición, fecha original e historial de Actividades.
Futuros tipos (Sesiones, Planes, Retos) requieren ampliar contrato; no implementados.


## Evidencia local previa a publicación
214 pruebas totales (44 nuevas), incluyendo mensual/semanal, límites y cursores,
microsegundos, cancelación y respuestas tardías, filtros, rutas, guards, teclado,
loading/empty/error. Lint, TypeScript, build:netlify y auditoría0 verdes.
Smoke real preparado en scripts/smokeCalendarBrowser.ts; resultados productivos
se registrarán en INTEGRATION_VALIDATION, sin sustituirlos por mocks.

## Cierre productivo — 2026-10-26
Contrato consumido en producción Netlify SHA0541a59ab048cbc2687400a68eab53d1d85716a9.
Smoke real aprobado y capturas revisadas; ver INTEGRATION_VALIDATION.md.
Solo consulta, sin alteraciones de actividades. Filtros/rutas/zona local/teclado
aprobados. Materias archivadas se incluyen. Mes móvil muestra todos los días
apilados. Cursores de varias páginas y carreras cubiertos por tests locales.
No eventos propios ni endpoints adicionales; futuros tipos siguen fuera de alcance.
