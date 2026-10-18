# Contratos pendientes — frontend

Fecha: 2026-10-13. Solo se modifica cognova-frontend. Registro, onboarding y cuestionario ya tienen contratos completos fijados en backend a277af2ba5f2e7227b5b329aa7d935e5e12b8f94.

## Auth anterior: integración histórica verificada

El usuario confirmó CSRF Path=/ y refresh HttpOnly Path=/api/v1/auth. AUTH_CONTRACT ya refleja la decisión. Netlify sirve la SPA y reenvía /api/* a Render; cookies host-only, Secure/Lax. Backend debe sincronizar paths, eliminar la antigua cookie CSRF y enviar no-store en auth. No se reescriben cookies para ocultar diferencias.

El 2026-10-12 se corrigió el origen Netlify a lpsi y se comprobaron cookies, rotación, CSRF, login, restore, logout y revocación del contrato anterior. Esa evidencia no valida el registro mínimo ni el onboarding nuevo. Ver [INTEGRATION_VALIDATION](INTEGRATION_VALIDATION.md).

## Matriz de especificaciones pendientes

| Módulo | Información requerida antes de implementar |
| --- | --- |
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

El gap de cuestionario quedó resuelto por QUESTIONNAIRE y ONBOARDING_CONTRACT del SHA fijado: catálogo 1, DTOs, cardinalidades, Otro, revisiones, 409 e historial paginado. `academic_goal` se retiró del registro por ese mismo contrato; no queda una decisión funcional pendiente sobre su ubicación.

## Procedimiento para desbloquear

1. Para los módulos futuros fuera de alcance, acordar la especificación que falte antes de implementarlos.
2. Frontend/backend acuerdan cada DTO público y errores, sin inferirlos del modelo persistente.
3. Sincronizar contratos en los repositorios afectados; este agente no modifica backend ni database.
4. Backend implementa/expone lo acordado; validar respuestas reales.
5. Implementar cada módulo frontend con tests y sus estados loading/success/empty/error.

## Integración y despliegue

Despliegue existente: Netlify frontend y Render backend, con Render Postgres. La separación en tres repositorios terminó. Frontend solo consume REST del backend. La rama nueva no está desplegada; Render sigue exponiendo el contrato anterior sin onboarding. No iniciar Subjects ni otros módulos.

## Dependencias externas documentadas

La dependencia anterior de separación backend/database está resuelta según confirmación del usuario; no queda como siguiente paso ni bloqueo del frontend.

DEPENDENCY:
- Repo afectado: cognova-backend y cognova-database, coordinados por operación; frontend consume el entorno que habiliten.
- Archivo/contrato relacionado: AUTH_CONTRACT.md y ONBOARDING_CONTRACT.md; backend a277af2ba5f2e7227b5b329aa7d935e5e12b8f94; database 232c43130c0fb3eddd32e1dd3707368ba0d87d4c; schema 0003_onboarding_questionnaire.
- Cambio requerido: proporcionar un entorno compatible y confirmar aplicación de schema 0003 antes de validar el flujo nuevo y autorizar su publicación.
- Motivo: OpenAPI de Render consultado en esta fase solo contiene auth/health/ready y UserResponse antiguo con academic_goal. No pudo realizarse la integración real nueva. No se ejecutan migraciones ni se cambia operación desde frontend.
