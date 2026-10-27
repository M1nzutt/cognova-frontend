#  Cognova · Frontend

React, TypeScript, Vite y React Router. Interfaz en español, responsive, con tema claro/oscuro.

El frontend productivo incluye registro mínimo, perfil académico, cuestionario
versionado, auth y los módulos **Materias, Actividades y Calendario cerrados**.

Backend productivo: `61a2f98668f0d3452f0582d7a074f1290dbae43d`, schema `0005_activities`.
Netlify publicado: `0541a59ab048cbc2687400a68eab53d1d85716a9`. El bloqueo histórico
de publicación de onboarding está resuelto. Calendario ofrece mes/semana y filtros como vista académica de solo lectura; abre el detalle de Actividades.

## Ejecutar y verificar

Usar Node.js 24 y npm. Copiar [.env.example](.env.example) a `.env.local`.

```sh
npm ci
npm run dev
npm test
npm run lint
npm run build
npm run preview
npm run verify
```

En PowerShell puede usarse `npm.cmd` si se bloquea `npm.ps1`. La API pública es `/api/v1`; Vite reenvía `/api` a `BACKEND_PROXY_TARGET` (por defecto `http://127.0.0.1:8000`). El backend debe estar iniciado y configurado según [AUTH_CONTRACT](docs/AUTH_CONTRACT.md). No hay backend simulado.

Último release validado: 214 pruebas, lint, TypeScript y build aprobados. `verify`
reúne lint, tests y build. [INTEGRATION_VALIDATION](docs/INTEGRATION_VALIDATION.md)
conserva resultados locales y smoke real de navegador, con sus fechas y límites.
Calendario tiene smoke productivo de navegador y revisión visual; ver la evidencia fechada.

## Autenticación

- Access token solo en memoria; ningún token o perfil se guarda en Web Storage.
- Refresh HttpOnly con `Path=/api/v1/auth`; CSRF legible con `Path=/`, enviado como `X-CSRF-Token`.
- Peticiones con credenciales; restauración mediante refresh y `/auth/me`.
- Un refresh compartido ante 401 concurrentes y un único retry por petición; 403 no dispara refresh.
- Logout revoca en backend. Si falla, se borra memoria y se ofrece reintentar sin afirmar que la revocación terminó.
- Registro envía solo name/email/password (30/50/8–12). Login no impone esos máximos nuevos a cuentas legacy.
- Registro, login y restore siguen `onboarding.next_step`: `/onboarding/academic-profile` → `/onboarding/questionnaire` → `/dashboard`. Una cuenta completa no vuelve al onboarding.
- `/app/questionnaire` permite consultar, actualizar y revisar el historial después del onboarding. PUT usa `expected_revision`; un 409 conserva las respuestas y exige una decisión explícita.
- El borrador solo vive en memoria de la pantalla: volver/avanzar lo conserva; una recarga recupera la revisión guardada. No se persisten respuestas en Web Storage.
- Solo el tema persiste en localStorage. La migración elimina la antigua clave de token sin leerla.

## Publicar en Netlify

El sitio existente está publicado. Para futuros releases, seguir [DEPLOYMENT](docs/DEPLOYMENT.md). [netlify.toml](netlify.toml) conserva Node 24, build, CSP y cabeceras. El build genera el proxy `/api/*` y después el fallback de BrowserRouter; si falta RENDER_API_ORIGIN o es incompatible, falla explícitamente. El build local no publica el sitio.

```sh
npm run build:netlify
npm run smoke:auth
```

El smoke requiere un sitio HTTPS y las variables `SMOKE_BASE_URL`, `SMOKE_EMAIL`, `SMOKE_PASSWORD` de una cuenta de prueba existente. No guardar credenciales en Git ni usar variables VITE para secretos. El smoke HTTP no sustituye el recorrido en navegador.

Producción: [Netlify](https://cognova-frontend.netlify.app) con proxy al
[backend Render](https://cognova-backend-lpsi.onrender.com). Materias y Actividades
ya se integraron a main y publicaron; las referencias a releases anteriores se
conservan como históricas en DEPLOYMENT e INTEGRATION_VALIDATION.

## Continuidad

Código separado en [api](src/api), [auth](src/auth), [services](src/services), [hooks](src/hooks), [components](src/components), [pages](src/pages) y [routes](src/routes). CSS Modules y tokens compartidos. El frontend no accede a PostgreSQL ni al proveedor de IA.

Cognova tiene tres repositorios independientes: cognova-frontend, cognova-backend y cognova-database. Frontend solo consume la API del backend. Database es propietario de Alembic, migraciones, esquema físico, constraints, índices, seeds de DB y administración del schema; no es una dependencia del frontend.

Leer [PROJECT_STATE](docs/PROJECT_STATE.md), [ARCHITECTURE](docs/ARCHITECTURE.md), [SECURITY_BASELINE](docs/SECURITY_BASELINE.md) y [AGENT_RULES](docs/AGENT_RULES.md) antes de continuar. [CONTRACT_GAPS](docs/CONTRACT_GAPS.md) distingue los gaps resueltos del historial. Calendario es el siguiente módulo, aún sin contrato.
