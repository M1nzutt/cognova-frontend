# Cognova · Frontend

Interfaz en español para el acompañamiento académico de Cognova. Frontend independiente con React, TypeScript y Vite.

## Requisitos y ejecución

- Node.js 22.12 o superior (validación inicial con Node.js 24).
- npm.

```sh
npm ci
npm run dev
```

En Windows, si PowerShell bloquea `npm.ps1`, utilizar `npm.cmd` en lugar de `npm`; no es necesario cambiar la política de ejecución.

## Comandos

```sh
npm run build   # TypeScript y bundle de producción en dist/
npm run lint    # ESLint, sin advertencias permitidas
npm test        # Vitest: contrato API, almacenamiento y comportamiento
npm run preview
```

Las pruebas usan Vitest y Testing Library con HTTP interceptado exclusivamente en tests. La aplicación no simula respuestas de autenticación.

## Alcance inicial

- React + TypeScript estricto + Vite + React Router.
- Ruta `/` de bienvenida y página 404 con retorno al inicio.
- Shell responsive, CSS Modules y variables de color compartidas.
- Tema claro/oscuro: toma la preferencia del sistema en la primera visita y guarda la selección en `localStorage`. Si el almacenamiento está bloqueado, permite cambiar de tema durante la visita.
- Navegación por teclado, foco visible y enlace para saltar al contenido.

Registro y login consumen el backend real. El access token se conserva solo en memoria; refresh/logout usan cookies y CSRF. Cuestionario y dashboard siguen como destinos provisionales: el producto todavía no está completo ni listo para producción.

**Bloqueo de integración:** el contrato actual limita la cookie CSRF a `Path=/api/v1/auth`, por lo que no es legible desde las rutas SPA. Se debe acordar y sincronizar su alcance antes de verificar restauración/logout en producción. Ver [contratos pendientes](docs/CONTRACT_GAPS.md).

## Organización

```text
src/
├── components/  # Shell y controles compartidos
├── api/         # Fetch centralizado, errores y retry acotado
├── auth/        # Sesión en memoria y coordinación de cookies
├── hooks/       # Auth, formularios y tema
├── pages/       # Bienvenida, auth y destinos pendientes
├── routes/      # Configuración de navegación
├── services/    # API auth y preferencia visual
├── styles/      # Tokens y estilos globales
├── types/       # Tipos compartidos
├── App.tsx
└── main.tsx
```

Cada componente/servicio relevante tiene su archivo. Las funciones académicas se añadirán cuando tengan contratos compartidos completos.

## Conexión y autenticación

Copiar `.env.example` a `.env.local` y configurar `VITE_API_BASE_URL` con la base completa, incluido `/api/v1`. Reiniciar Vite después de cambiar variables; en producción se fijan durante el build. Si se omite, se usa `/api/v1` en el mismo origen, que necesita un gateway hacia FastAPI. No existe backend simulado dentro de Vite.

Para desarrollo con API en otro puerto, usar el mismo hostname en frontend y backend (no mezclar `localhost` y `127.0.0.1`) y una allowlist CORS del backend con el origen exacto, credenciales, `Authorization`, `Content-Type` y `X-CSRF-Token`. Un frontend en un dominio distinto no puede leer una cookie host-only del backend: esa topología requiere un contrato explícito. El despliegue de mismo origen está propuesto, pendiente de confirmación.

- `/register`: envía los seis campos aprobados y dirige a `/questionnaire`.
- `/login`: envía email/contraseña y dirige a `/dashboard`.
- Ambas rutas de destino esperan la restauración antes de admitir acceso.
- Recarga: CSRF legible → refresh → access token en memoria → `/auth/me`.
- 401 protegido: un refresh compartido y un solo retry. 403/429 muestran errores sin renovar automáticamente.
- Logout: petición real con CSRF y cookies; si falla, se borra memoria y se ofrece reintentar la revocación. No se presenta como cierre completo.
- No se guarda usuario, contraseña o tokens en Web Storage. La única operación de migración es borrar la antigua clave `cognova.access_token`; el tema se conserva.
- Cookie refresh nunca se lee desde JavaScript. Rotaciones/logout se serializan y usan Web Locks entre pestañas cuando está disponible; el fallback coordina solo la pestaña actual.

Las pruebas de contrato y UI interceptan HTTP exclusivamente dentro de Vitest. No validan configuración real de cookies, CORS, revocación en base de datos ni HTTPS.

## Verificación y publicación posterior

En VS Code están disponibles las tareas `Build frontend` y `Preview frontend`. Compilar antes de ejecutar la segunda; la vista previa utiliza `http://127.0.0.1:4173`.

Comprobación básica: abrir el inicio, cambiar de tema, recargar y verificar que se conserve; abrir una dirección inexistente y volver al inicio; revisar anchos móvil/escritorio y el enlace de salto usando Tab y Enter.

Para publicar el bundle de `dist/`, el hosting deberá servir `index.html` como fallback para rutas de la SPA, conservando las rutas de archivos estáticos y de API. `vite preview` solo sirve para comprobar el bundle localmente. El despliegue no forma parte de esta fase y todavía no hay un proveedor configurado.

## Integración pendiente

El frontend solo consumirá el backend según [el contrato API](docs/API_CONTRACT.md). No accede a PostgreSQL ni al proveedor de IA. Las variables `VITE_*` son públicas: nunca deben contener secretos.

Antes de continuar se debe resolver el alcance de CSRF, sincronizar los DTOs de recursos académicos y definir las opciones/cardinalidad del cuestionario. Consultar [CONTRACT_GAPS.md](docs/CONTRACT_GAPS.md) y [SECURITY_BASELINE.md](docs/SECURITY_BASELINE.md).

Consultar [el estado del proyecto](docs/PROJECT_STATE.md), [la arquitectura](docs/ARCHITECTURE.md) y [las reglas de trabajo](docs/AGENT_RULES.md) antes de continuar.
