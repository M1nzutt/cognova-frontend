# Cognova · Frontend

React, TypeScript, Vite y React Router. Interfaz en español, responsive, con tema claro/oscuro.

El avance incluye registro, login, restauración, refresh coordinado, logout real y dashboard provisional con perfil del backend. Los módulos académicos siguen pendientes; no se simulan estadísticas ni IA.

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

54 pruebas de servicios, auth, rutas, formularios y configuración Netlify. HTTP se intercepta exclusivamente en tests; esto no certifica cookies, revocación ni CORS reales. `verify` reúne lint, tests y build.

## Autenticación

- Access token solo en memoria; ningún token o perfil se guarda en Web Storage.
- Refresh HttpOnly con `Path=/api/v1/auth`; CSRF legible con `Path=/`, enviado como `X-CSRF-Token`.
- Peticiones con credenciales; restauración mediante refresh y `/auth/me`.
- Un refresh compartido ante 401 concurrentes y un único retry por petición; 403 no dispara refresh.
- Logout revoca en backend. Si falla, se borra memoria y se ofrece reintentar sin afirmar que la revocación terminó.
- Registro dirige a `/questionnaire`, pendiente, con acceso al dashboard provisional. Login dirige a `/dashboard`.
- Solo el tema persiste en localStorage. La migración elimina la antigua clave de token sin leerla.

## Publicar en Netlify

Seguir [DEPLOYMENT](docs/DEPLOYMENT.md). [netlify.toml](netlify.toml) configura Node 24, build, CSP y cabeceras. Configurar `RENDER_API_ORIGIN` con el origen HTTPS real del backend Render; el build genera el proxy `/api/*` y después el fallback de BrowserRouter. Si falta el origen o es incompatible, falla explícitamente.

```sh
npm run build:netlify
npm run smoke:auth
```

El smoke requiere un sitio HTTPS y las variables `SMOKE_BASE_URL`, `SMOKE_EMAIL`, `SMOKE_PASSWORD` de una cuenta de prueba existente. No guardar credenciales en Git ni usar variables VITE para secretos. El smoke HTTP no sustituye el recorrido en navegador.

No se ha verificado integración real ni realizado despliegue en esta sesión: faltan las URLs de Render/Netlify. El backend debe sincronizar los paths confirmados y emitir `Cache-Control: no-store` en auth, incluidos errores.

## Continuidad

Código separado en [api](src/api), [auth](src/auth), [services](src/services), [hooks](src/hooks), [components](src/components), [pages](src/pages) y [routes](src/routes). CSS Modules y tokens compartidos. El frontend no accede a PostgreSQL ni al proveedor de IA.

Leer [PROJECT_STATE](docs/PROJECT_STATE.md), [ARCHITECTURE](docs/ARCHITECTURE.md), [SECURITY_BASELINE](docs/SECURITY_BASELINE.md) y [AGENT_RULES](docs/AGENT_RULES.md) antes de continuar. Los [contratos académicos pendientes](docs/CONTRACT_GAPS.md) están fuera del avance temporal autorizado.
