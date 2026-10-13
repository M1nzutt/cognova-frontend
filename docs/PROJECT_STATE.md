# Cognova — Estado del Proyecto (Frontend)

Fecha: 2026-10-12.

## Fase actual

Validación real frontend → backend a través de Netlify. La separación en cognova-frontend, cognova-backend y cognova-database ya terminó según confirmación del usuario. Backend operativo; no se reabre el incidente de URL ni se modifican otros repositorios.

## Git y alcance

Rama fix/netlify-backend-origin. Inicio local limpio en 3c3c7d3 (14 commits). Al inspeccionar Netlify se detectó producción en 53e7001; se hizo fetch e incorporó ese cambio de README por fast-forward en esta rama (15 commits de base), sin modificar main.

Auth existente preservada: access solo memoria, refresh HttpOnly Path=/api/v1/auth, CSRF Path=/, credentials include, refresh coordinado, retry único, restore, logout y rutas protegidas. academic_goal sigue en registro/perfil; no se implementan módulos académicos.

## Proxy

- Frontend: https://cognova-frontend.netlify.app
- Backend correcto: https://cognova-backend-lpsi.onrender.com (letra l).
- La UI Netlify confirmó RENDER_API_ORIGIN con 1psi antes del cambio. Se corrigió y verificó el valor guardado con lpsi; no se cambiaron otras variables.
- Build npm run build:netlify, publicación dist, rama producción main, Node 24. VITE_API_BASE_URL=/api/v1 se conserva en netlify.toml; no había override en la lista de variables UI.
- Antes del cambio: health/ready por Netlify devuelven 404 text/plain con X-Render-Routing: no-server.
- Reconstrucción del sitio existente solicitada para aplicar la variable: deploy 6acd2c48eb986d01cdad2dff, publicado correctamente sobre main@53e7001; tres redirects procesados.
- Generador local rechaza explícitamente el hostname erróneo conocido; dos tests de regresión nuevos verifican rechazo y redirects correctos.

## Validación local

npm run build:netlify con RENDER_API_ORIGIN correcto: 56 tests pasan, lint y TypeScript/build correctos. dist/_redirects conserva /api y /api/* hacia lpsi antes del fallback SPA. Auth y sus contratos no se modificaron.

## Siguiente paso exacto

Fase cerrada: health/ready responden 200; smoke HTTP aprobado. Registro 201, login 200, restore refresh/me 200 y logout 204 comprobados en navegador con una sola cuenta sintética. Informe completo en INTEGRATION_VALIDATION.md. Checks repetidos el 2026-10-13: 56 tests, lint y build:netlify correctos.

Nueva fase autorizada el 2026-10-13: consumir contratos backend a277af2ba5f2e7227b5b329aa7d935e5e12b8f94 para registro mínimo, perfil y cuestionario. Primero publicar este cierre documental. Inicio del turno: dc31fe2, 16 commits, rama fix/netlify-backend-origin, con README/CONTRACT_GAPS/DEPLOYMENT modificados e INTEGRATION_VALIDATION sin versionar. No implementar Subjects.

Objetivo de historial vigente: superar 500 commits mediante cambios reales y granulares, sin commits vacíos, inflación ni squash. El cierre documental agrega un commit a los 16 iniciales.
