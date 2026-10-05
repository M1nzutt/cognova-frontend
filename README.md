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

- React + TypeScript estricto + Vite + React Router.
- Ruta `/` de bienvenida y página 404 con retorno al inicio.
- Shell responsive, CSS Modules y variables de color compartidas.
- Tema claro/oscuro: toma la preferencia del sistema en la primera visita y guarda la selección en `localStorage`. Si el almacenamiento está bloqueado, permite cambiar de tema durante la visita.
- Navegación por teclado, foco visible y enlace para saltar al contenido.

Las funciones de autenticación, cuestionario, planificación, estadísticas e IA se implementarán en fases posteriores. No hay llamadas API, datos académicos simulados ni formularios de acceso todavía.

## Organización

```text
src/
├── components/  # Shell y controles compartidos
├── hooks/       # Comportamiento reutilizable de React
├── pages/       # Bienvenida y página no encontrada
├── routes/      # Configuración de navegación
├── services/    # Persistencia de preferencia visual
├── styles/      # Tokens y estilos globales
├── types/       # Tipos compartidos
├── App.tsx
└── main.tsx
```

Cada componente relevante tiene su archivo. Se incorporarán `api/`, `models/` y `utils/` cuando exista código que les corresponda, sin anticipar contratos ni lógica de negocio.

## Verificación y publicación posterior

En VS Code están disponibles las tareas `Build frontend` y `Preview frontend`. Compilar antes de ejecutar la segunda; la vista previa utiliza `http://127.0.0.1:4173`.

Comprobación básica: abrir el inicio, cambiar de tema, recargar y verificar que se conserve; abrir una dirección inexistente y volver al inicio; revisar anchos móvil/escritorio y el enlace de salto usando Tab y Enter.

Para publicar el bundle de `dist/`, el hosting deberá servir `index.html` como fallback para rutas de la SPA, conservando las rutas de archivos estáticos y de API. `vite preview` solo sirve para comprobar el bundle localmente. El despliegue no forma parte de esta fase y todavía no hay un proveedor configurado.

## Integración pendiente

El frontend solo consumirá el backend según [el contrato API](docs/API_CONTRACT.md). No accede a PostgreSQL ni al proveedor de IA. Las variables `VITE_*` son públicas: nunca deben contener secretos.

Antes de implementar auth se deben acordar los esquemas de petición/respuesta y el ciclo de vida del JWT. Antes de implementar el cuestionario deben definirse las opciones y la selección única/múltiple de cada pregunta.

Consultar [el estado del proyecto](docs/PROJECT_STATE.md), [la arquitectura](docs/ARCHITECTURE.md) y [las reglas de trabajo](docs/AGENT_RULES.md) antes de continuar.
