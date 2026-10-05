# Cognova — Estado del Proyecto

**Estado:** fase inicial del frontend en curso. Repositorio documental convertido en base React + TypeScript + Vite. Backend fuera del alcance de este repositorio.

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

## Pendientes de especificación
- `API_CONTRACT.md` define rutas, Bearer JWT y formato de error, pero no los esquemas de peticiones/respuestas exitosas, paginación ni detalles de expiración del token. Acordarlos antes de implementar servicios y auth.
- `QUESTIONNAIRE.md` contiene las diez preguntas, pero faltan las opciones y el tipo de selección de cada pregunta. `APP_CONTEXT.md` indica que allí están las opciones completas; documentar y completar esta diferencia antes de implementar el formulario.
- No inferir DTOs públicos a partir del modelo de persistencia ni inventar opciones o endpoints.

## Próximo paso
Completar la fase inicial con routing, shell responsive y base visual. Después, acordar los esquemas API de autenticación y avanzar al cliente HTTP y auth en una tarea independiente.

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
9. AGENT_RULES.md

Si código y documentación se contradicen, no asumir: registrar y resolver.
