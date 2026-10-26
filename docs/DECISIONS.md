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

- Identidad: nombre y correo. Perfil académico: carrera y semestre, nullable hasta completarse. Objetivo académico vigente: q1 del cuestionario.
- Materias personalizables.
- Actividades según API_CONTRACT, sin `type`; la propuesta inicial fue sustituida.
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

## Histórico — Avance temporal de despliegue — 2026-10-05

- Alcance: auth y dashboard provisional de perfil, sin módulos académicos.
- Netlify frontend, Render backend y Render Postgres.
- API de mismo origen mediante proxy /api/*; access solo en memoria.
- CSRF Path=/; refresh HttpOnly Path=/api/v1/auth; cookies Secure/Lax host-only.
- Despliegue existente confirmado por el usuario el 2026-10-08; URLs y alcance de verificación en [DEPLOYMENT](DEPLOYMENT.md). La existencia del despliegue no certifica por sí sola todos los flujos de auth.

## Onboarding — contrato conservado; contexto histórico 2026-10-13

El backend fijado históricamente en `a277af2ba5f2e7227b5b329aa7d935e5e12b8f94` sustituye las decisiones anteriores de registro ampliado y cuestionario sin opciones:

- Registro solo name/email/password: máximos 30/50 y contraseña 8–12 sin trim. Login conserva compatibilidad con credenciales legacy.
- Carrera y semestre se guardan con PUT /onboarding/academic-profile. La navegación usa onboarding.next_step devuelto por backend, también tras login/restore/refresh.
- `academic_goal` no se envía en registro ni se interpreta como objetivo vigente del User. `legacy_academic_goal` es evidencia histórica opcional; nunca completa onboarding. La declaración actual corresponde a q1.
- Catálogo backend completo: diez preguntas, single/multi y máximos definidos. Otro solo en q1/q6/q7, trim y máximo 50.
- POST conserva percepción inicial; PUT agrega revisión y exige expected_revision. No se sobrescribe ni se combinan respuestas silenciosamente ante 409.
- Borrador en memoria de la pantalla; volver/avanzar lo conserva. Una recarga recupera lo guardado en backend, no el borrador sin enviar. No guardar datos de perfil, respuestas o credenciales en Web Storage.
- Registro/onboarding sin sidebar pública, paleta #49225B/#6E3482/#A56ABD/#E7DBEF/#F5EBFA, sin gradientes.
- Restricción histórica de aquella fase, ya resuelta: no publicar sin backend
  compatible/0003 ni iniciar Subjects. Materias y Actividades ya están cerrados
  sobre fe5989b / 0005; siguiente módulo Calendario, con contrato por definir.

## Calendario — decisión vigente 2026-10-26

Vista académica transversal, sin eventos libres ni edición directa. Solo Actividades
en esta fase; mes/semana en zona local. Sesiones, Planes y Retos quedan futuros.
Contrato: CALENDAR_CONTRACT.md. No migraciones ni cambios externos.
