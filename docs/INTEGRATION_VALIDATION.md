# Integración real frontend → backend

Fecha: 2026-10-12. Pruebas sobre https://cognova-frontend.netlify.app, sin llamadas de auth directas a Render y sin modificar backend/database.

## Configuración observada y corregida

Sitio Netlify cognova-frontend, ID bf6ef7b1-c280-4de9-8ea1-f70630cc14c1, repositorio M1nzutt/cognova-frontend, producción main. Build npm run build:netlify, publish dist, Node 24. VITE_API_BASE_URL=/api/v1 en netlify.toml, sin override UI.

La variable RENDER_API_ORIGIN usaba `https://cognova-backend-1psi.onrender.com`. Se guardó `https://cognova-backend-lpsi.onrender.com` y se verificó en la UI. Ninguna otra variable fue modificada. Se conservó la configuración existente de scopes y contextos.

Deploy anterior: 6ac81d35f26a52000845f0fd. Reconstrucción publicada: [6acd2c48eb986d01cdad2dff](https://app.netlify.com/projects/cognova-frontend/deploys/6acd2c48eb986d01cdad2dff), main@53e7001, 18:52 UTC. Netlify procesó tres reglas de redirect y una de headers. El código auth desplegado no cambió.

El generador local añade rechazo explícito al hostname erróneo y dos tests de regresión. Ese cambio queda en la rama fix/netlify-backend-origin para revisión; no fue necesario fusionarlo en main para corregir la variable remota.

## Resultados

| Comprobación | Resultado |
| --- | --- |
| Health y ready antes del cambio | 404 text/plain, X-Render-Routing: no-server |
| GET /api/v1/health después | 200, {"status":"ok"} |
| GET /api/v1/ready después | 200, {"status":"ready"} |
| GET /api/v1/auth/me sin token | 401 JSON, INVALID_OR_EXPIRED_TOKEN; nunca index.html |
| Registro mediante UI | 201 JSON, destino /questionnaire; enlace al dashboard operativo |
| Login mediante UI | 200 JSON y /dashboard con perfil real de prueba |
| Recarga de dashboard | Refresh 200 con X-CSRF-Token, luego me 200; perfil restaurado |
| Estado inicial protegido | Perfil oculto y mensaje Comprobando tu sesión mientras se retiene temporalmente la petición real de refresh; al liberarla se restaura |
| Ausencia de loops en recarga | Resource Timing del navegador registra un refresh y un me |
| Logout mediante UI | 204 con CSRF y expiración de ambas cookies con sus paths correctos |
| Dashboard tras logout y navegación directa | Redirige a /login; no realiza nuevas peticiones auth sin cookies |
| Web Storage | localStorage solo cognova.theme; sessionStorage vacío; sin JWT ni perfil |
| npm run smoke:auth | Exit 0: login, me, cookies, refresh sin CSRF rechazado 403, rotación, logout y access revocado con 401 |
| Cache-Control | no-store en respuestas auth examinadas y exigido por el smoke, incluidos errores |
| Verificación local | 56 tests, lint, TypeScript y build:netlify aprobados con origen correcto |

La comprobación de initializing retuvo la petición antes de enviarla y después permitió la respuesta real; no sustituyó respuestas del backend. La coordinación de 401 concurrentes y los fallos de restore siguen cubiertos por los tests existentes, no se presentan como pruebas nuevas de carga en producción.

## Cookies en navegador

Se inspeccionaron Set-Cookie en la respuesta real de refresh y los nombres del header Cookie de la siguiente petición real, sin guardar valores:

| Cookie | HttpOnly | Secure | SameSite | Path | Domain |
| --- | --- | --- | --- | --- | --- |
| cognova_refresh | Sí | Sí | Lax | /api/v1/auth | Ausente: host-only |
| cognova_csrf | No | Sí | Lax | / | Ausente: host-only |

La petición del navegador contenía exactamente una cookie de cada nombre, sin duplicados antiguos. document.cookie solo mostraba cognova_csrf. Después del logout no quedaron cookies visibles y una nueva navegación no restauró sesión. El smoke HTTP verificó además borrado de ambas cookies y revocación del access. La API de enumeración de cookies del navegador no estaba disponible; se usaron las cabeceras reales y el comportamiento observado como evidencia.

## Cuenta y límites de la prueba

Se creó exactamente una cuenta sintética: cognova-smoke-20261012@example.com, nombre Prueba integración Cognova, carrera Cuenta sintética de pruebas. No contiene datos personales reales ni actividad académica. No se guardaron credenciales en el repositorio; las sesiones de prueba se cerraron al terminar. La cuenta permanece identificada como prueba; no se intentó borrarla mediante un endpoint inexistente.

La primera consulta health tras publicar agotó el tiempo del proxy (504); al repetir después respondió 200. Ready también respondió 200. Es compatible con arranque lento, pero no se atribuye una causa definitiva sin logs backend. No se añadieron retries de escritura ni se reabrió el incidente del hostname.

La consola muestra bloqueos CSP de script/style inline en el HTML desplegado, que también contiene la insignia Netlify. No impidieron los flujos probados; no se relajó CSP ni se modificaron otras opciones de Netlify. El adaptador del navegador reportó ERR_ABORTED en eventos de logout, pero entregó respuesta 204 con eliminación de cookies y se comprobó el cierre tras navegar; se conserva la distinción entre aviso del adaptador y resultado HTTP.

Esta evidencia valida el recorrido descrito, no certifica todas las funciones futuras ni disponibilidad continua. Siguiente fase funcional: resolver academic_goal y cuestionario; si continúa sin especificación, preparar para revisión el contrato exacto de Subjects antes de implementar.
