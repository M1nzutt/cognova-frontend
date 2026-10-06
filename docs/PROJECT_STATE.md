# Cognova — Estado del Proyecto (Frontend)

Fecha: 2026-10-05.

## Alcance temporal confirmado
Preparar un avance desplegable de autenticación y dashboard provisional. No desarrollar cuestionario, materias, calendario, IA ni otros módulos en esta fase.

## Estado real
- Repositorio inicial limpio; se conservaron los avances `33d6961` y `7e12cb0`.
- CSRF Path=/ confirmado y actualizado en AUTH_CONTRACT. Refresh sigue HttpOnly Path=/api/v1/auth; access token solo en memoria.
- Topología confirmada: navegador → Netlify /api/* → Render; PostgreSQL en Render, gestionado exclusivamente por backend.
- Frontend implementado: registro, login, restore, refresh coordinado, retry único, logout real con error/reintento, rutas protegidas/guest y mensajes seguros.
- Se corrigió restore para descartar tokens de memoria anteriores y no restaurar mientras logout no esté resuelto.
- Dashboard provisional presentable: perfil/objetivo reales, consulta de /auth/me para actualizar, estados loading/success/error y aviso claro de alcance. No inventa estadísticas.
- Registro conserva destino /questionnaire del contrato, con enlace hacia el dashboard provisional; no se implementó cuestionario.

## Validación actual
- 42 pruebas frontend de auth/rutas/validación pasan; 12 pruebas adicionales de generación de configuración Netlify pasan (54 en total).
- Build, TypeScript y lint correctos; diff revisado.
- No se verificó todavía contra backend real: no responde http://127.0.0.1:8000 y aún no se proporcionó origen Render/Netlify.
- No desplegado. La conexión de producción no se declara probada con mocks.

## Preparación de deploy en curso
- Configuración Netlify y generación de redirects desde RENDER_API_ORIGIN, con /api/* antes del fallback SPA.
- Base pública /api/v1; proxy Vite para desarrollo.
- CSP y cabeceras estáticas; API debe emitir Cache-Control: no-store desde Render.
- Smoke HTTP real preparado; requiere sitio HTTPS y cuenta de prueba.

## Siguiente paso exacto
1. Terminar/revisar configuración y guía Netlify, ejecutar checks y commit.
2. Configurar en Netlify RENDER_API_ORIGIN con el origen HTTPS real de Render, sin /api/v1.
3. Sincronizar en backend CSRF Path=/, refresh HttpOnly, cookies host-only sin Domain, Secure/Lax, borrado con paths correctos y no-store en auth. Este agente no modificó backend.
4. Desplegar el avance y ejecutar smoke HTTP real + recorrido de navegador (registro/login/recarga/logout/ruta protegida). Registrar resultados.
5. Mantener módulos académicos fuera de alcance hasta nueva instrucción.

## Pendientes fuera del avance
Opciones/cardinalidad del cuestionario y DTOs académicos siguen pendientes, registrados en CONTRACT_GAPS. No bloquean preparar el avance auth/dashboard autorizado. El producto completo permanece incompleto.
