# Contratos pendientes — frontend

Fecha: 2026-10-08. Este registro describe pendientes; no define DTOs nuevos. Solo se modifica cognova-frontend.

## Auth: decisión resuelta, verificación pendiente

El usuario confirmó CSRF Path=/ y refresh HttpOnly Path=/api/v1/auth. AUTH_CONTRACT ya refleja la decisión. Netlify sirve la SPA y reenvía /api/* a Render; cookies host-only, Secure/Lax. Backend debe sincronizar paths, eliminar la antigua cookie CSRF y enviar no-store en auth. No se reescriben cookies para ocultar diferencias.

Las URLs y el despliegue existente están confirmados por el usuario en [DEPLOYMENT](DEPLOYMENT.md). Esta fase no revalida los flujos reales ni presupone fallos en backend; las condiciones anteriores siguen siendo requisitos contractuales.

## Matriz de especificaciones pendientes

| Módulo | Información requerida antes de implementar |
| --- | --- |
| Cuestionario | Opciones/IDs y single/multi exactos por pregunta; límites; esquema GET/POST/PUT; estado de onboarding; respuesta y destino tras envío; errores |
| Materias | DTO público, longitudes, color válido, campos opcionales, lista y detalle, efectos de borrar materia con recursos relacionados |
| Objetivos | DTO, estados válidos/transiciones, fechas/zonas, nulabilidad de subject_id y reglas de borrado |
| Actividades | DTO, enums definitivos de type/priority/status, fechas, relaciones, priorización, filtros y paginación |
| Dependencias | DTOs, dirección de aristas, errores de ciclo/duplicado, lista y creación/borrado |
| Sesiones/timer | DTOs de cada acción, estados oficiales, timestamps/unidades, reloj del servidor, concurrencia/idempotencia, reglas de resultado/motivos, lista/filtros |
| Historial | Tipos de evento, payload público, orden estable, detalle, filtros, cursor/paginación |
| Analytics/racha | Esquemas exactos, periodo/zona, denominador de completion rate, muestra insuficiente, próximas actividades/observación/retos |
| IA | Request/response de análisis, conversación y mensaje; evidencia tipada, contexto, timeout, error de proveedor/scope/rate limit; paginación |
| Observaciones/feedback | DTOs, campos de aceptación/contexto/periodo/exclusión, reglas y errores |
| Retos | Estados/transiciones, DTOs aceptar/rechazar/completar, resultado, lista y evidencia, inmutabilidad |

Se revisó el historial disponible de QUESTIONNAIRE: las versiones del repositorio solo contienen preguntas y la advertencia de opciones faltantes; no hay una lista aprobada que recuperar.

## Procedimiento para desbloquear

1. Responsable de producto aporta opciones/cardinalidad aprobadas del cuestionario.
2. Frontend/backend acuerdan cada DTO público y errores, sin inferirlos del modelo persistente.
3. Sincronizar contratos en los repositorios afectados; este agente no modifica backend ni database.
4. Backend implementa/expone lo acordado; validar respuestas reales.
5. Implementar cada módulo frontend con tests y sus estados loading/success/empty/error.

## Integración y despliegue

Despliegue existente: Netlify frontend y Render backend, con Render Postgres. Tres repositorios independientes: frontend, backend y database. Frontend solo consume REST del backend. Esta fase conserva la configuración y no realiza nuevos despliegues ni E2E de auth. Los gaps académicos siguen fuera de alcance.

## Dependencias externas documentadas

DEPENDENCY:
- Repo afectado: cognova-backend y cognova-database.
- Archivo/contrato relacionado: ARCHITECTURE.md, DECISIONS.md, DATA_MODEL.md y documentación de despliegue de los repositorios afectados.
- Cambio requerido: reflejar la propiedad de Alembic, migraciones, esquema físico, constraints, índices y seeds de DB en cognova-database y coordinar la separación técnica fuera de frontend.
- Motivo: mantener coherencia entre tres repositorios sin introducir una dependencia frontend → database. No se inspeccionaron ni modificaron los repositorios externos.

DEPENDENCY:
- Repo afectado: cognova-frontend y cognova-backend; cognova-database si el refactor posterior afecta persistencia.
- Archivo/contrato relacionado: AUTH_CONTRACT.md, QUESTIONNAIRE.md y DATA_MODEL.md.
- Cambio requerido: después de terminar la separación, acordar el traslado conceptual de academic_goal desde registro/perfil al cuestionario y completar opciones/cardinalidad. No cambiar el contrato vigente ahora.
- Motivo: academic_goal sigue siendo requerido por auth, aunque conceptualmente pertenece al cuestionario; faltan decisiones antes de modificar DTOs o datos.
