# Cognova — Decisiones Congeladas

## Producto

- Nombre: Cognova.
- Aplicación web multiusuario.
- Propósito: acompañamiento académico basado en evidencia.
- No es un chatbot genérico ni una herramienta terapéutica.
- Interfaz en español; código interno en inglés.
- Aplicación desplegada y funcional.
- Calidad objetivo: producción; no se aceptan atajos por tratarse de una entrega académica.

## Stack

- Backend: Python + FastAPI.
- Frontend: React + TypeScript + Vite.
- DB: PostgreSQL.
- API REST.
- Tres repositorios independientes: cognova-frontend, cognova-backend y cognova-database. Esta decisión del 2026-10-08 sustituye la anterior de dos repositorios.
- En ejecución, frontend consume únicamente la API del backend; backend accede a PostgreSQL y al proveedor de IA.
- cognova-database es propietario de Alembic, migraciones, esquema físico, constraints, índices, seeds de DB y administración del schema. No existe conexión frontend → database.

## Código

- POO obligatoria.
- Una clase relevante por archivo.
- Responsabilidades separadas.
- Nivel técnico intermedio/alto sin sobreingeniería innecesaria.
- Estructuras de datos implementadas manualmente y usadas de verdad.

## Funcionalidad

- Perfil: nombre, carrera, semestre, objetivo académico.
- Materias personalizables.
- Actividad genérica con `type`.
- Prioridades manuales y deadlines.
- Calendario visual.
- Temporizador integrado con backend como fuente oficial.
- Motivos predefinidos + personalizados.
- Cuestionario obligatorio de 10 preguntas.
- IA como acompañante académico.
- IA automática con evidencia suficiente y manual bajo demanda.
- Mínimo 5 sesiones antes de hablar de patrones.
- Retos: IA propone, usuario acepta/rechaza; aceptado no se edita.
- Gamificación: únicamente racha.
- Grafo: dependencias académicas.
- Sin pantalla especial para estructuras.
- Seed/demo reproducible.
- Diseño: Notion + pastel + detalles cósmicos discretos.
- Tema claro y oscuro.

## Autenticación — decisión vigente 2026-10-05

Reemplaza el diseño anterior de JWT persistido.

- Argon2id para contraseñas.
- Access token JWT corto (10–15 min objetivo).
- Access token solo en memoria del frontend.
- Refresh token opaco rotativo en cookie HttpOnly.
- Hash del refresh token persistido.
- AuthSession revocable.
- Logout real.
- CSRF en operaciones dependientes de cookie.
- Rate limiting.
- CORS restrictivo.
- HTTPS obligatorio en producción.
- Ownership backend obligatorio.
- No tokens de autenticación en localStorage/sessionStorage.

`AUTH_CONTRACT.md` es la fuente de verdad para detalles.

## IA

- IA real vía API.
- Proveedor/modelo se congela solo después de verificar documentación oficial vigente.
- API key únicamente backend.
- Timeouts, límites de uso/costo y manejo de fallo obligatorios.
- Nunca fingir respuesta de IA con texto local.

## Persistencia y despliegue

- Alembic administra el esquema desde cognova-database; su separación técnica no corresponde al frontend.
- No `create_all` automático en producción.
- Entornos dev/test/prod separados.
- Backups y procedimiento de restauración antes de declarar producción estable.
- CI con pruebas, build y controles de seguridad.

## Cambios a decisiones congeladas

Solo mediante:
1. motivo claro;
2. impacto documentado;
3. actualización de contratos/docs;
4. migración de código y pruebas.

## Avance temporal de despliegue — 2026-10-05

- Alcance: auth y dashboard provisional de perfil, sin módulos académicos.
- Netlify frontend, Render backend y Render Postgres.
- API de mismo origen mediante proxy /api/*; access solo en memoria.
- CSRF Path=/; refresh HttpOnly Path=/api/v1/auth; cookies Secure/Lax host-only.
- Despliegue existente confirmado por el usuario el 2026-10-08; URLs y alcance de verificación en [DEPLOYMENT](DEPLOYMENT.md). La existencia del despliegue no certifica por sí sola todos los flujos de auth.

## Pendiente posterior a la separación

`academic_goal` permanece en registro/perfil por el contrato vigente, aunque conceptualmente pertenece al cuestionario. No cambiar campos, validaciones ni DTOs hasta acordar el refactor en los repositorios afectados después de la separación. Las opciones y cardinalidad del cuestionario siguen pendientes.
