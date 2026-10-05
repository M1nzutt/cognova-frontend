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
npm run preview
```

Todavía no hay suite de tests. La base se valida con TypeScript, ESLint y el build. Se incorporarán pruebas de comportamiento al implementar funcionalidades.

## Alcance inicial

Configuración del proyecto y punto de entrada de la aplicación. Las funciones de autenticación, planificación e IA se implementarán en fases posteriores.

El frontend solo consumirá el backend según [el contrato API](docs/API_CONTRACT.md). No accede a PostgreSQL ni al proveedor de IA. Las variables `VITE_*` son públicas: nunca deben contener secretos.

Consultar [el estado del proyecto](docs/PROJECT_STATE.md), [la arquitectura](docs/ARCHITECTURE.md) y [las reglas de trabajo](docs/AGENT_RULES.md) antes de continuar.
