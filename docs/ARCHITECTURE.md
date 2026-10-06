# Cognova — Arquitectura Frontend

```text
Usuario
  ↓
React + TypeScript + Vite
  ↓ HTTPS / JSON
FastAPI
```

## Límites

- Frontend consume únicamente backend.
- No accede a PostgreSQL.
- No accede directamente al proveedor de IA.
- No replica las estructuras académicas del backend.
- El backend es fuente de verdad para auth, ownership, temporizador y datos académicos.

## Base existente

Ya existe:
- React + TypeScript + Vite;
- React Router;
- AppShell;
- tema claro/oscuro;
- CSS Modules/tokens;
- cliente Fetch/AuthService inicial;
- tests iniciales de auth service.

El trabajo de autenticación interrumpido se reconcilió. `PROJECT_STATE.md` registra alcance verificado y bloqueos de integración.

## Capas sugeridas

```text
src/
├── api/
├── auth/
├── components/
├── hooks/
├── pages/
├── routes/
├── services/
├── styles/
├── types/
└── utils/
```

Evitar componentes gigantes y lógica de red duplicada.

## Autenticación de producción

- access token solo en memoria;
- refresh token en cookie HttpOnly;
- CSRF cookie legible + `X-CSRF-Token`;
- `credentials: "include"` en peticiones que lo requieran;
- restauración de sesión al iniciar;
- refresh coordinado para múltiples 401;
- un solo retry por petición;
- sin loops;
- logout real.

`TokenStorage` fue retirado. La migración elimina únicamente la clave de credencial antigua, sin leerla. `AuthSession` conserva access token en memoria y expone un snapshot mediante `useSyncExternalStore`; `AuthProvider` administra esa instancia.

`ApiClient` delega refresh a la misma sesión. Las peticiones concurrentes comparten una promesa; solo se reintenta una vez. Las mutaciones de cookies se serializan con una cola y Web Locks entre pestañas cuando está disponible. Un fallo de logout elimina memoria y se informa con opción de reintentar la revocación.

Decisión confirmada: CSRF Path=/ y refresh HttpOnly Path=/api/v1/auth. Netlify publica la SPA y reenvía /api/* a Render, con cookies host-only. El backend debe sincronizar el contrato antes de validar integración real. No se reescriben cookies ni se omite CSRF.

LocalStorage queda permitido para preferencias no sensibles, por ejemplo tema visual.

## Estado de sesión

El estado global de auth debe distinguir:
- initializing;
- authenticated;
- unauthenticated.

No renderizar rutas protegidas como autenticadas antes de terminar restauración.

## Temporizador

El frontend presenta la experiencia del contador, pero backend es la fuente de verdad.

Al recargar:
- consultar sesión;
- reconstruir visualmente el tiempo desde estado/timestamps del backend.

## API

Cliente HTTP centralizado:
- base URL por entorno;
- errores tipados;
- auth header;
- credentials;
- refresh coordination;
- cancelación/timeout donde aplique.

No inventar endpoints.

## UX obligatoria

Toda vista con datos:
- loading;
- success;
- empty;
- error.

Formularios:
- validación accesible;
- mensajes claros;
- foco visible;
- navegación por teclado.

## Seguridad

Ver `SECURITY_BASELINE.md`.

Frontend nunca contiene:
- JWT persistido;
- refresh token;
- API keys;
- secretos.

## Diseño

- Notion-like;
- pastel suave;
- detalles cósmicos discretos;
- claro/oscuro;
- responsive;
- accesible;
- sin estética infantil/gamer.

## Build/hosting

Producción debe:
- usar HTTPS;
- configurar fallback de BrowserRouter;
- inyectar URL de API por entorno;
- aplicar CSP/security headers desde hosting/CDN cuando sea posible.

El build Netlify genera redirects desde RENDER_API_ORIGIN, antes del fallback SPA. Vite usa proxy local. CSP y cabeceras estáticas están configuradas; no-store en respuestas auth corresponde al backend. Ver [DEPLOYMENT](DEPLOYMENT.md).
