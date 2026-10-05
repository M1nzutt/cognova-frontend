# Cognova — Estado del Proyecto

**Estado:** fase inicial del frontend completada. Base React + TypeScript + Vite, routing y shell responsive listos. Backend fuera del alcance de este repositorio.

## Decisiones principales
- Frontend: React + TypeScript + Vite.
- Backend: Python + FastAPI.
- Base de datos: PostgreSQL.
- Dos repositorios separados.
- API REST.
- POO obligatoria.
- Una clase relevante por archivo.
- Código en inglés; interfaz en español.
- Multiusuario.
- Tema claro y oscuro.
- Estética: Notion + pastel suave + detalles cósmicos.
- IA real vía API.
- Mínimo 5 sesiones antes de hablar de patrones.
- Seed/demo data.

## Funcionalidades confirmadas
- Registro e inicio de sesión.
- Perfil: nombre, carrera, semestre, objetivo académico.
- Cuestionario obligatorio de 10 preguntas.
- Materias personalizables.
- Actividades con tipo, prioridad y fecha límite.
- Calendario visual.
- Temporizador.
- Estados: completed, partial, postponed, cancelled.
- Motivos predefinidos y personalizados.
- Historial, dashboard y racha.
- Acompañante IA conversacional limitado al contexto académico.
- Retos sugeridos por IA y aceptados/rechazados por el usuario.
- Grafo de dependencias académicas.

## Avance frontend — 2026-10-05
- Leídos los diez documentos maestros; repositorio inicialmente limpio, último commit previo: `b2a5bdd`.
- Creada base React + TypeScript estricto + Vite y configuración ESLint.
- Agregados comandos de desarrollo, build y preview, y exclusiones para secretos, dependencias y artefactos.
- No se implementaron funcionalidades académicas ni integración API.
- Validación de la base: `npm.cmd run build` y `npm.cmd run lint` correctos; `git diff --check` sin errores. No existen tests todavía.
- Primer commit: `22cfc82 chore: initialize React TypeScript frontend`.
- Segundo incremento: React Router con bienvenida y 404, componentes separados, CSS Modules, tema claro/oscuro persistente y navegación accesible básica.
- README ampliado con instalación, comandos, estructura, alcance y requisitos del futuro hosting; arquitectura frontend documentada.

## Validación de cierre
- Build de producción y TypeScript correctos; ESLint sin errores ni advertencias; diagnósticos del editor sin errores.
- Comprobaciones de navegador sobre el bundle: inicio, ruta inexistente, retorno al inicio, ambos temas persistentes tras recarga y salto al contenido con teclado correctos.
- Sin desbordamiento horizontal en anchos de 1440, 375 y 320 px; sin errores de ejecución capturados durante la comprobación de inicio/tema.
- No existía ni se añadió suite automatizada de tests en esta fase de skeleton. Las verificaciones de navegador no sustituyen las futuras pruebas de negocio.
- Diff revisado; instalación final reportó cero vulnerabilidades conocidas.
- Sin despliegue ni cambios al backend. Auth, cliente HTTP con Fetch, cuestionario y demás funcionalidades continúan pendientes.

## Pendientes de especificación
- `API_CONTRACT.md` define rutas, Bearer JWT y formato de error, pero no los esquemas de peticiones/respuestas exitosas, paginación ni detalles de expiración del token. Acordarlos antes de implementar servicios y auth.
- `QUESTIONNAIRE.md` contiene las diez preguntas, pero faltan las opciones y el tipo de selección de cada pregunta. `APP_CONTEXT.md` indica que allí están las opciones completas; documentar y completar esta diferencia antes de implementar el formulario.
- No inferir DTOs públicos a partir del modelo de persistencia ni inventar opciones o endpoints.

## Próximo paso
Acordar los esquemas API de autenticación (registro/login, respuesta JWT, expiración y errores), luego implementar cliente HTTP centralizado con Fetch, estado de auth y rutas protegidas en una tarea independiente. Definir también las opciones del cuestionario antes de abordar onboarding.

## Continuidad
Antes de trabajar, leer:
1. APP_CONTEXT.md
2. PROJECT_STATE.md
3. DECISIONS.md
4. API_CONTRACT.md
5. ARCHITECTURE.md
6. DATA_MODEL.md
7. DATA_STRUCTURES.md
8. AI_BEHAVIOR.md
9. QUESTIONNAIRE.md
10. AGENT_RULES.md

Si código y documentación se contradicen, no asumir: registrar y resolver.
