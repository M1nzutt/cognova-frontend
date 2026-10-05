# Cognova — Estado del Proyecto (Frontend)

Fecha: 2026-10-05.

## Estado real
Proyecto incompleto. Fase 0 reconciliada en `33d6961`; fase 1 implementada y probada a nivel de frontend, pero bloqueada para validación real por contrato CSRF. Fase 2: gaps inventariados, no resueltos. No se declara listo para producción.

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
1. Confirmar decisión sobre CSRF Path/origen y sincronizar AUTH_CONTRACT con backend. Ver `CONTRACT_GAPS.md`.
2. Con backend configurado, probar registro/login → refresh → me → logout y recarga en navegador real, incluyendo CSRF/401/403/concurrencia y revocación.
3. Obtener opciones/cardinalidad aprobadas del cuestionario y DTOs públicos de la matriz de gaps; no empezar módulos sin sincronizarlos.
4. Continuar fase 3 cuando el cuestionario esté especificado; luego módulos académicos en orden. No desplegar ni declarar cierre con placeholders.

## Verificación de auth e inventario de contratos
- 39 pruebas Vitest aprobadas: servicios, restore bajo StrictMode, rutas protegidas/guest, registro→cuestionario, login→dashboard, logout, concurrencia 401, sesión anterior, validación y errores.
- Build/lint/TypeScript correctos. Comprobación en navegador del bundle: login/registro a 320 px sin desbordamiento y /dashboard sin sesión redirige a /login.
- Path de CSRF comprobado con cookie de prueba en navegador: no visible desde /login. No se rebajó la protección ni se cambió el contrato sin decisión compartida.
- npm audit: 0 vulnerabilidades. Propuesta CSP/cabeceras documentada, no desplegada.
- README actualizado al estado real; AUTH_CONTRACT no modificado, backend no modificado. No hay pruebas E2E contra backend ni despliegue real.

## Pendiente global
Cuestionario, CRUD académico/dependencias, calendario/temporizador, historial, dashboard/analytics/racha, IA, feedback/retos, E2E real, seguridad de hosting, CI/CD, despliegue y smoke test.

## Continuidad
Leer los doce documentos maestros, inspeccionar Git y conservar trabajo útil. Cada fase debe pasar tests/build/lint, actualizar documentación y terminar con commit coherente.
