# Contratos pendientes — frontend

Fecha: 2026-10-05. Este registro describe bloqueos; no define DTOs ni decisiones de producto nuevas. Solo se modifica cognova-frontend.

## Auth: decisión resuelta, verificación pendiente

El usuario confirmó CSRF Path=/ y refresh HttpOnly Path=/api/v1/auth. AUTH_CONTRACT ya refleja la decisión. Netlify sirve la SPA y reenvía /api/* a Render; cookies host-only, Secure/Lax. Backend debe sincronizar paths, eliminar la antigua cookie CSRF y enviar no-store en auth. No se reescriben cookies para ocultar diferencias.

La integración real sigue pendiente de URLs y backend disponible. Consultar [DEPLOYMENT](DEPLOYMENT.md).

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
3. Sincronizar contratos en ambos repos; este agente no modifica el backend.
4. Backend implementa/expone lo acordado; validar respuestas reales.
5. Implementar cada módulo frontend con tests y sus estados loading/success/empty/error.

## Integración y despliegue

Proveedores confirmados: Netlify, Render y Render Postgres. Faltan URLs/entorno y comprobación real. No se han creado recursos remotos ni presentado pruebas interceptadas como E2E. Los gaps académicos quedan fuera del avance temporal auth/dashboard.
