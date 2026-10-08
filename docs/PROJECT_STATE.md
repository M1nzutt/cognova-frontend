# Cognova — Estado del Proyecto (Frontend)

Fecha: 2026-10-08.

## Fase actual: reconciliación de arquitectura

Cognova adopta tres repositorios independientes: cognova-frontend, cognova-backend y cognova-database. Esta fase solo actualiza documentación del frontend; no realiza la separación técnica de PostgreSQL ni desarrolla funcionalidades.

- Frontend consume exclusivamente REST del backend. El backend accede a PostgreSQL en ejecución.
- cognova-database es propietario de Alembic, migraciones, esquema físico, constraints, índices, seeds de DB y administración del schema. No es una dependencia ni un destino HTTP del frontend.
- No se inspeccionaron ni modificaron archivos fuera de cognova-frontend.

## Estado reconciliado

Git comenzó limpio y sincronizado con origin/main en af82bc9. Se conservaron los commits 33d6961, 7e12cb0, c8c3e19 y af82bc9.

El código mantiene registro, login, AuthSession/AuthProvider, restore, refresh coordinado, retry único, logout real con error/reintento, guest/protected routes, dashboard provisional y smoke auth. No se modificó código, dependencias, tests ni configuración de despliegue.

Auth permanece intacta: access JWT solo en memoria; refresh HttpOnly Path=/api/v1/auth; CSRF Path=/; credentials include; ningún token o perfil en Web Storage. AUTH_CONTRACT.md no cambió. API_CONTRACT.md solo cambia la instrucción de sincronización hacia los repositorios afectados, sin modificar endpoints ni DTOs.

## Despliegue existente

Confirmado por el usuario, no recreado ni revalidado funcionalmente en esta fase:

- Frontend: https://cognova-frontend.netlify.app
- Backend: https://cognova-backend-1psi.onrender.com
- Netlify: RENDER_API_ORIGIN=https://cognova-backend-1psi.onrender.com
- Navegador → Netlify /api/* → Render backend → Render Postgres.

La documentación anterior que indicaba ausencia de URLs o despliegue quedó corregida. Las comprobaciones de cookies, revocación y flujos reales requieren evidencia propia; esta fase no ejecutó smoke auth ni creó usuarios.

## Evidencia de validación

- Revisión de archivos versionados, cliente HTTP, proveedor/sesión auth, servicios, dependencias/lockfile y configuración: sin drivers DB, migraciones, schema SQL, DATABASE_URL ni dependencia de cognova-database en frontend.
- npm run build:netlify ejecutado localmente con el origen Render confirmado: lint sin advertencias, 54 tests aprobados, TypeScript y build correctos.
- dist/_redirects generado conserva /api y /api/* hacia Render antes del fallback SPA. No se publicó ningún artefacto.
- Revisión de diff: cambios exclusivamente documentales. Contrato auth, código y configuración de deploy preservados.

## Documentación actualizada

ARCHITECTURE, DECISIONS, AGENT_RULES, DEPLOYMENT y CONTRACT_GAPS reconocen responsabilidades y no interferencia entre tres repositorios. README refleja el despliegue existente; API_CONTRACT generaliza la sincronización; DATA_MODEL y SECURITY_BASELINE atribuyen administración del schema a database; APP_CONTEXT aclara que faltan opciones/cardinalidad del cuestionario.

## Pendientes y siguiente paso exacto

1. Los responsables de backend/database coordinan la separación técnica y sincronizan la documentación de los repositorios afectados. Las dependencias externas se registran con formato DEPENDENCY en [CONTRACT_GAPS](CONTRACT_GAPS.md); no se implementan aquí.
2. Preservar academic_goal en registro/perfil hasta acordar el refactor posterior a la separación. Conceptualmente pertenece al cuestionario, pero el contrato actual sigue vigente.
3. Completar las opciones y cardinalidad de las 10 preguntas antes de implementar el formulario definitivo; no inventarlas.
4. Esperar una nueva fase explícita para funcionalidades o validación funcional del despliegue. No avanzar a cuestionario, materias, calendario, IA ni otros módulos.
