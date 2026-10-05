# Cognova — Estado del Proyecto (Frontend)

Fecha: 2026-10-05.

## Estado real
Proyecto incompleto. Fase 0 reconciliada; fase 1 implementada a nivel de cliente y pendiente de ampliar pruebas de UI/integración real. No se declara listo para producción.

## Reconciliación de trabajo interrumpido
- Punto de partida: `3442f0f`; primer cliente auth anterior: `e3794b1`.
- Se conservaron formularios Login/Register, estilos, AuthProvider/context, hooks y rutas que estaban sin commit.
- Se retiró TokenStorage. El access token vive únicamente en AuthSession (memoria).
- La migración solo elimina `cognova.access_token` obsoleto de localStorage/sessionStorage; nunca lo lee ni reutiliza.
- localStorage se mantiene para el tema, no para credenciales.
- AuthService incorpora refresh/logout del contrato vigente, CSRF y cookies.
- Restauración: cookie CSRF legible → refresh compartido → me.
- Cliente Fetch: Bearer, credentials include, timeout, errores públicos controlados, 401 coordinado y un solo retry; 403 no dispara refresh.
- Rotación y logout se serializan; Web Locks coordina pestañas cuando está disponible.
- Logout borra memoria inmediatamente, revoca en backend y permite reintentar si falla. No presenta una revocación fallida como exitosa.
- Cuestionario/dashboard siguen siendo destinos provisionales; no son funcionalidades terminadas.

## Validación fase 0
- 22 pruebas Vitest aprobadas: contrato, migración, CSRF, restore, 401 concurrentes, retry acotado, 403, logout fallido y carrera logout/refresh.
- Build, TypeScript y lint correctos; editor sin errores; diff revisado.
- Backend no modificado; no se probó todavía contra servidor real.

## Bloqueos de contrato
1. AUTH_CONTRACT define cookie cognova_csrf con Path=/api/v1/auth. El navegador no la expone a document.cookie en /login, /dashboard ni /. Se propuso Path=/ para CSRF, manteniendo refresh HttpOnly en /api/v1/auth, y mismo origen mediante proxy. Pendiente de decisión/sincronización backend. No se cambió el contrato ni se implementó un bypass.
2. QUESTIONNAIRE no contiene opciones ni cardinalidad. No se inventaron.
3. API_CONTRACT no define DTOs públicos de recursos académicos, transiciones completas, filtros/paginación ni respuestas de IA. El modelo conceptual no sustituye DTOs. Fases 3–9 bloqueadas hasta contratos compartidos y backend correspondiente.

## Siguiente paso exacto
1. Completar pruebas de formularios/rutas y carreras de autenticación; revisar errores y accesibilidad.
2. Resolver y sincronizar alcance/origen de cookie CSRF con backend; validar cookies reales, refresh y logout desde navegador.
3. Cerrar fase 1 con tests/build/lint/diff/docs/commit.
4. Registrar matriz de contratos faltantes (fase 2), recuperar opciones aprobadas si existen; solo entonces comenzar módulos funcionales.
5. No iniciar despliegue ni declarar cierre con placeholders.

## Pendiente global
Cuestionario, CRUD académico/dependencias, calendario/temporizador, historial, dashboard/analytics/racha, IA, feedback/retos, E2E real, seguridad de hosting, CI/CD, despliegue y smoke test.

## Continuidad
Leer los doce documentos maestros, inspeccionar Git y conservar trabajo útil. Cada fase debe pasar tests/build/lint, actualizar documentación y terminar con commit coherente.
