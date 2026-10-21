# Ajuste de foco durante smoke — 2026-10-21

Deploy bd417b6: edición PUT corregida y validada en Chrome real; activas/archivadas,
cupo, duplicados, aislamiento y vistas claro/oscuro 1440/375 px aprobados.
Cancelar diálogo DELETE no restauraba foco: cerrar el dialog nativo antes de
restaurar foco en su botón disparador. Prueba UI y smoke verifican este comportamiento.
Cuentas sintéticas 11/12 limpiadas (materias), sesiones revocadas.
139 tests, lint, TypeScript y build:netlify aprobados. Regresión comprueba cierre
nativo antes de focus y cancelación sin DELETE. Smoke limitado reproducible:
SMOKE_ALLOW_PRODUCTION_WRITE=1; node --experimental-strip-types scripts/smokeSubjectsFocus.ts.
Pendiente publicación y smoke final de teclado/DELETE; no cerrar aún.

# Corrección durante smoke visual — 2026-10-20

Primer deploy Materias e5f72ac publicado, smoke real detectó PUT422:
el formulario extendía el objeto Subject y enviaba campos de lectura adicionales.
Se inicializa ahora el borrador exclusivamente con name/difficulty/color_base/color_shade.
Regresión comprueba payload PUT exacto. Cuentas sintéticas 9/10: materias eliminadas,
sesiones revocadas. Release aún abierto hasta repetir deploy y smoke completo.

# Materias en implementación — 2026-10-20

Rama feat/subjects-ui; base main dd87718 (31 commits), árbol inicial limpio.
Contrato Subjects contrastado con OpenAPI productivo 0004; backend cerrado por operación.
Se conserva auth/proxy. Cliente tipado y validadores implementados; 10 pruebas API, lint y TypeScript aprobados.
Vistas activas/archivadas, detalle, edición, acciones y confirmación DELETE integradas.
138 tests (13 archivos), lint, TypeScript y build:netlify aprobados.
Smoke HTTP productivo pasó con usuario sintético 8; materias eliminadas, sesión revocada.
Códigos 409 de duplicado/cupo/reactivación confirmados y mensajes específicos añadidos.
Siguiente: merge --no-ff, push main, deploy automático y smoke visual de Materias.
Adaptador integrado sin navegador; Chrome 155 aislado disponible mediante Playwright.
Validación visual productiva aún pendiente.
Las secciones siguientes conservan evidencia histórica.

# Cognova — Estado frontend

Fecha: 2026-10-17. Rama de despliegue: main.

## Release onboarding publicado; cierre visual pendiente

Se integró feat/onboarding-questionnaire sin squash mediante dae333d254974093b6422e2594c92782586df53f, conservando todos los commits. Netlify publicó ese SHA en el sitio existente https://cognova-frontend.netlify.app, deploy 6ad443bb9de5414fc3a0c500 (ready). No se modificaron backend ni database.

Backend de producción confirmado por operación: 9309effdd1b71acc3fe5e24bc8c19b70c3d8c0c8, schema 0003_onboarding_questionnaire. En esta fase se consultaron readiness 200 y OpenAPI 200 con las rutas de perfil y cuestionario. La dependencia anterior de backend sin onboarding queda resuelta; no repetir migraciones ni implementación funcional.

## Configuración y pruebas

- Sitio Netlify bf6ef7b1-c280-4de9-8ea1-f70630cc14c1, repo M1nzutt/cognova-frontend, rama main, build npm run build:netlify, publish dist.
- RENDER_API_ORIGIN ya apunta a https://cognova-backend-lpsi.onrender.com; VITE_API_BASE_URL=/api/v1 en netlify.toml. No se cambió el recurso ni el proxy.
- npm run build:netlify: lint, 118 tests/11 archivos, TypeScript y build aprobados. npm audit: 0 vulnerabilidades. Nuevo smoke comprobado con lint y tsc -b.
- scripts/smokeOnboarding.ts ejecutado sobre Netlify: register mínimo, login/me, perfil, catálogo de diez preguntas, POST/GET, límites multi y Otro rechazados con 422, PUT revisión 2, conflicto 409, historial con revisión 1 intacta, estado complete, refresh/CSRF/rotación, sesiones, logout y revocación aprobados.
- Cuenta sintética user_id=3, nombre Frontend release smoke; conserva perfil y revisiones 1/2. Sus dos sesiones se cerraron. No se guardaron credenciales; el script no borra datos y crea una cuenta por ejecución explícita.
- Todas las respuestas API del smoke incluyen no-store. Cookies Secure/Lax, host-only, HttpOnly solo refresh, paths correctos; logout elimina ambas. Evidencia HTTP, no inspección del almacén de cookies de navegador.
- Rutas /, /login, /register, /dashboard, /onboarding/academic-profile, /onboarding/questionnaire y /app/questionnaire: HTTP 200 HTML con bundle index-DAmSllbe.js y CSP. Esto comprueba fallback, no ejecución de guards ni recarga visual.
- CORS: preflight del origen Netlify 200 con origen exacto y credentials=true; origen ajeno 400 sin allow-origin. No wildcard.
- Token real Netlify ausente del bundle y de archivos versionados; .env ignorado. No se versionaron secretos.

## Bloqueo real y siguiente paso

El adaptador de navegador devuelve apps=[] y browsers=[]. No pudo ejecutarse E2E en navegador real. No declarar cerrado el release completo basándose solo en HTTP y pruebas con mocks.

Conectar un navegador y validar sobre el sitio publicado: register/login, restore tras recarga, perfil académico, diez pasos con atrás/adelante, límites multi y Otro, POST inicial, edición PUT, conflicto 409 conservando borrador, historial, refresh y logout; verificar guards, Web Storage, cookies y ausencia de errores de consola. No repetir el despliegue de backend/database ni reimplementar auth/onboarding. Registrar la evidencia en INTEGRATION_VALIDATION.md y actualizar este estado.

## Smoke operativo reproducible

En PowerShell, únicamente con autorización para crear una cuenta sintética en producción:

```powershell
$env:SMOKE_ALLOW_PRODUCTION_WRITE='1'
node --experimental-strip-types scripts/smokeOnboarding.ts
```

El destino está fijado al sitio existente. Passwords/tokens/cookies permanecen en memoria; errores nativos no se imprimen. Un fallo detiene el smoke y se intenta logout de limpieza. El smoke HTTP no sustituye pruebas de UI.
