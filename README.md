#  Cognova · Frontend

Aplicación web de acompañamiento académico para organizar el recorrido de estudio y reflexionar sobre el progreso. Construida con React 19, TypeScript, Vite y React Router; interfaz en español, adaptable a móvil y escritorio, con tema claro.

## Estado del producto — 2026-11-20

El alcance funcional del frontend está completo: autenticación y onboarding,
Inicio, Calendario, Materias, Actividades, Sesiones con temporizador, Planes y
Retos, Acompañamiento académico, Observaciones, Análisis y perfil. El panel de
administración, importación de archivos y voz no forman parte de las funciones
implementadas.

El frontend consume contratos implementados por la API; no simula persistencia ni
funciones del backend.

La cuenta de demostración está disponible en la pantalla de inicio de sesión:

- **Correo:** `demo.software@example.com`
- **Contraseña:** `eyuNKVCBroH7`

Calendario presenta actividades y sesiones existentes en una vista de solo lectura.

El login muestra la cuenta de demostración para acceso público. No contiene datos
personales reales; sus credenciales son públicas y deben corresponder a una clave
configurada en el backend. El README del frontend y el login contienen la clave
intencionalmente; no reutilizarla para cuentas personales ni entornos productivos.

El corte del frontend pasó lint, TypeScript, build y **413 pruebas en 54 archivos**.
La imagen frontend fue reconstruida y quedó saludable en Docker local en
`http://localhost:8080`. No se hizo un nuevo deploy remoto de Netlify en este corte.

### Alineación del stack local

El Compose activo respondió en `/api/v1/ready`, pero la base inspeccionada está en
`0009_academic_companion_chat`. El backend del checkout exige exactamente
`0010_nullable_password_hash`, y `cognova-backend/tools/database-ref.json` aún fija
Database 0009. Por tanto, el código fuente de los tres repositorios y los
contenedores activos no están completamente alineados. Antes de declarar el stack
integrado reproducible desde estos checkouts, hay que actualizar el pin de Database,
aplicar 0010 y reconstruir/verificar el backend. Esa operación no se realizó aquí.

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

En PowerShell puede usarse `npm.cmd` si se bloquea `npm.ps1`. La API pública es `/api/v1`; Vite reenvía `/api` a `BACKEND_PROXY_TARGET` (por defecto `http://127.0.0.1:8000`). Si CORS del backend no permite el origen del dev server, define `BACKEND_PROXY_ORIGIN` con un origen local permitido; Vite solo reenvía ese `Origin` en desarrollo. Mantén el dev server ligado a loopback al usar esta opción. `preview` no altera el encabezado. El backend debe estar iniciado y configurado según [AUTH_CONTRACT](docs/AUTH_CONTRACT.md). No hay backend simulado.

`verify` reúne lint, pruebas, TypeScript y build. [INTEGRATION_VALIDATION](docs/INTEGRATION_VALIDATION.md)
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
- La preferencia visual es de tema claro. La migración elimina la antigua clave de token sin leerla.

## Publicar en Netlify

La configuración Netlify se conserva para releases anteriores. Para futuros releases
autorizados, seguir [DEPLOYMENT](docs/DEPLOYMENT.md). [netlify.toml](netlify.toml)
conserva Node 24, build, CSP y cabeceras. El build genera el proxy `/api/*` y después
el fallback de BrowserRouter; si falta RENDER_API_ORIGIN o es incompatible, falla
explícitamente. El build local no publica el sitio.

```sh
npm run build:netlify
npm run smoke:auth
```

El smoke requiere un sitio HTTPS y las variables `SMOKE_BASE_URL`, `SMOKE_EMAIL`, `SMOKE_PASSWORD` de una cuenta de prueba existente. No guardar credenciales en Git ni usar variables VITE para secretos. El smoke HTTP no sustituye el recorrido en navegador.

Netlify y Render fueron los destinos de releases anteriores. Sus URLs y SHAs son
históricos y no certifican que el stack final descrito arriba esté publicado allí.
El entorno de demostración local se configura desde el `compose.yaml` del repositorio
backend.

## Continuidad

Código separado en [api](src/api), [auth](src/auth), [services](src/services), [hooks](src/hooks), [components](src/components), [pages](src/pages) y [routes](src/routes). CSS Modules y tokens compartidos. El frontend no accede a PostgreSQL ni al proveedor de IA.

Cognova tiene tres repositorios independientes: cognova-frontend, cognova-backend y cognova-database. Frontend solo consume la API del backend. Database es propietario de Alembic, migraciones, esquema físico, constraints, índices, seeds de DB y administración del schema; no es una dependencia del frontend.

Leer [PROJECT_STATE](docs/PROJECT_STATE.md), [ARCHITECTURE](docs/ARCHITECTURE.md), [SECURITY_BASELINE](docs/SECURITY_BASELINE.md) y [AGENT_RULES](docs/AGENT_RULES.md) para el estado técnico y los contratos de la aplicación.
