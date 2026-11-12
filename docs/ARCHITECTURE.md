# Cognova — Arquitectura Frontend

```text
Usuario
  ↓
React + TypeScript + Vite
  ↓ HTTPS / JSON
FastAPI (cognova-backend)
  ↓
PostgreSQL
```

## Tres repositorios independientes — decisión 2026-10-08

- `cognova-frontend`: interfaz, cliente REST y configuración de publicación frontend.
- `cognova-backend`: API, autenticación, autorización y lógica de aplicación; accede a PostgreSQL en ejecución.
- `cognova-database`: propietario de Alembic, migraciones, esquema físico, constraints, índices, seeds de DB y administración del schema.

El repositorio database administra la persistencia; no es una API ni un destino del navegador. El frontend solo habla con backend mediante REST y no importa código, dependencias ni artefactos de database. La separación técnica se realiza fuera de este repositorio y no cambia los contratos públicos de auth.

## Límites

- Frontend consume únicamente backend.
- No accede a PostgreSQL.
- No accede directamente al proveedor de IA.
- No replica las estructuras académicas del backend.
- El backend es fuente de verdad para auth, ownership, temporizador y datos académicos.

Planes y Retos consumen `GET/POST/PUT` y acciones REST de `/api/v1/study-plans`
y sus `challenges` anidados a través de `ApiClient`. `StudyPlanService` y
`StudyChallengeService` validan respuestas y las páginas solo presentan las
proyecciones del Backend: jerarquía, prioridad, dependencias, ritmo y huecos.
El Frontend no replica sus estructuras de dominio ni accede a Gemini.

## Base existente

Ya existe:
- React + TypeScript + Vite;
- React Router;
- AppShell;
- tema claro único mediante CSS Modules y tokens;
- CSS Modules/tokens;
- cliente Fetch/AuthService inicial;
- tests iniciales de auth service.

Materias, Actividades, Calendario y Sesiones están implementados en producción.
El frontend de Sesiones consume Backend `4735a697aed69f66f3055c902a00507b66a556e0`
en schema `0006_study_sessions`; el backend confirma ciclo, intervalos y duración
efectiva. Calendario consume el endpoint transversal `GET /api/v1/calendar` para
Actividades y Sesiones y no persiste eventos propios. El detalle vigente está en
`PROJECT_STATE.md` y los contratos en `CALENDAR_CONTRACT.md` y `API_CONTRACT.md`.

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

Decisión confirmada: CSRF Path=/ y refresh HttpOnly Path=/api/v1/auth. Netlify publica la SPA y reenvía /api/* a Render, con cookies host-only. El contrato está sincronizado; la integración productiva verificada se registra
en INTEGRATION_VALIDATION. No se reescriben cookies ni se omite CSRF.

LocalStorage queda permitido para preferencias no sensibles. El tema visual vigente
es único y claro; la autenticación nunca usa Web Storage.

## Estado de sesión

La rama de onboarding consume UserResponse con estado explícito del backend. `onboarding.next_step` decide perfil académico, cuestionario o dashboard; no se infiere de strings vacíos. EntryShell presenta registro/login/onboarding sin sidebar. La app conserva AppShell, y `/app/questionnaire` ofrece consulta, edición versionada e historial. QuestionnaireService usa el cliente REST existente; los borradores permanecen en memoria de la pantalla. Ver [ONBOARDING_CONTRACT](ONBOARDING_CONTRACT.md).

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
- tema claro único;
- responsive;
- accesible;
- sin estética infantil/gamer.

El rediseño global de noviembre de 2026 usa tokens de color, tipografía, espacio,
radios y elevación compartidos. El rail de escritorio usa ciruela con navegación
de alto contraste; en móvil se transforma en navegación inferior clara con accesos
principales y un menú secundario. Los calendarios cambian a tarjetas de días en
pantallas estrechas. No se modifican rutas, contratos, permisos ni flujos de API.

## Build/hosting

Producción debe:
- usar HTTPS;
- configurar fallback de BrowserRouter;
- inyectar URL de API por entorno;
- aplicar CSP/security headers desde hosting/CDN cuando sea posible.

El build Netlify genera redirects desde RENDER_API_ORIGIN, antes del fallback SPA. Vite usa proxy local. CSP y cabeceras estáticas están configuradas; no-store en respuestas auth corresponde al backend. Ver [DEPLOYMENT](DEPLOYMENT.md).

## Calendario — 2026-10-26
CalendarService consulta GET /calendar con ApiClient; DTO propio sin duplicar Activity.
CalendarPage coordina controles y componentes Month/Week/Day/Event separados.
El recurso de consulta se remonta con clave completa (rango y filtros), cancela al
salir y descarta respuestas abortadas. Todas las páginas se validan antes de mostrar.
La URL conserva solo fecha/vista/filtros, nunca respuestas ni secretos. Presentación
en zona local, links al recurso original. Contrato: CALENDAR_CONTRACT.md.


## Experiencia pública y rutas de autenticación — 2026-11-12

`PublicShell` agrupa bienvenida, login, registro y 404 con marca, skip-link, navegación pública y pie. No monta `AppShell` ni navegación interna antes de autenticar.

`GuestRoute` conserva el redirect existente para usuarios autenticados en bienvenida, login y registro. El 404 está fuera de ese guard para conservar las URLs desconocidas. `EntryShell` queda reservado a onboarding bajo sus guards.

`AuthFormLayout` comparte el panel visual de login/registro. `PasswordField` solo cambia el tipo visible del input; no persiste credenciales. Login y registro conservan `AuthSession`, validadores, `FormData`, endpoints y payloads. No se ofrece recuperar contraseña mientras Backend no provea endpoint y flujo contractual.


## Herramientas de interfaz para la experiencia pública

El HTML semántico/JSX y CSS/CSS Modules son herramientas válidas para las vistas React + TypeScript. Las bibliotecas visuales compatibles siguen permitidas dentro de esta arquitectura cuando el producto las requiera; este rediseño no agrega dependencias.
