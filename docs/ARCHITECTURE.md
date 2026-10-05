# Cognova — Arquitectura

```text
Usuario
  ↓
Frontend (React + TypeScript + Vite)
  ↓ HTTPS/JSON
Backend (Python + FastAPI)
  ├── PostgreSQL
  └── Servicio de IA
```

## Reglas
- Frontend solo consume backend.
- Frontend no toca DB ni IA.
- Backend concentra lógica, estructuras, persistencia e IA.
- Routers delgados; servicios con lógica.
- Una clase relevante por archivo.
- Repos: `cognova-backend` y `cognova-frontend`.

## Base frontend implementada — 2026-10-05
- `src/main.tsx` monta React; `src/App.tsx` configura BrowserRouter.
- `src/routes/AppRoutes.tsx` declara la bienvenida (`/`) y el fallback 404 dentro de `AppShell`.
- Componentes y páginas en archivos separados; estilos de layout/página con CSS Modules y tokens globales compartidos.
- `useTheme` conecta React con `ThemePreference`, clase que encapsula la lectura/escritura de la preferencia visual. Solo esta preferencia se almacena localmente en esta fase.
- Los componentes funcionales y hooks siguen el modelo idiomático de React; los servicios con responsabilidad propia se encapsulan en clases separadas, sin herencia artificial.
- Aún no hay cliente HTTP, sesión de usuario, modelos de negocio ni rutas protegidas. Se implementarán conforme se completen los esquemas del contrato.
- Las estructuras académicas y el estado oficial de sesiones corresponden al backend; el frontend no los replica.
- El futuro hosting debe soportar fallback a `index.html` para las rutas de BrowserRouter.
