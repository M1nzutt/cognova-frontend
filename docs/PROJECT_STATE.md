# Cognova — Estado del Proyecto (Frontend)

**Fecha de referencia:** 2026-10-05

**Estado general:** frontend base implementado; autenticación quedó a medias cuando el agente se quedó sin uso/contexto.

## Regla crítica al reanudar

Antes de modificar nada:

```bash
git status
git diff
git log --oneline -15
```

Hay posibilidad real de cambios sin commit del segundo incremento de auth. Revisarlos antes de escribir encima.

## Base confirmada

Implementado:
- React + TypeScript estricto + Vite;
- React Router;
- AppShell;
- bienvenida;
- 404;
- CSS Modules;
- tema claro/oscuro persistente;
- responsive base;
- accesibilidad básica.

Commits confirmados:
- `22cfc82 chore: initialize React TypeScript frontend`
- `e1c575c` — routing/shell/themes

La rama fue empujada a GitHub después de estos commits.

## Autenticación — primer incremento confirmado

Se implementó y se llegó a commit estable:
- cliente Fetch centralizado;
- `ApiError`;
- `AuthService`;
- DTOs/types;
- almacenamiento JWT inicial;
- lector de expiración;
- Vitest/jsdom/Testing Library;
- pruebas del servicio.

Se reportaron 9 pruebas de auth service aprobadas.

Commit descrito como:

```text
feat: add authentication API client and JWT storage
```

El hash exacto debe obtenerse con Git.

## Trabajo interrumpido

Antes del corte, el agente empezó el segundo incremento.

Pueden existir cambios sin commit en archivos relacionados con:
- `App.tsx`;
- `AuthContext`;
- `AuthProvider`;
- `AuthSession`;
- `AppShell`;
- `AuthFormLayout`;
- `SessionGate`;
- `useAuth`;
- `useAuthForm`;
- `DashboardPendingPage`;
- `LoginPage`;
- `QuestionnairePendingPage`;
- `RegisterPage`;
- `WelcomePage`;
- `AppRoutes`;
- `GuestRoute`;
- `ProtectedRoute`;
- estilos;
- validación de auth.

NO asumir que todos existen ni que compilan. `git status`/`git diff` decide.

## Cambio de arquitectura de autenticación

El primer incremento usaba JWT en `localStorage`.

Eso quedó obsoleto.

Debe migrarse al nuevo `AUTH_CONTRACT.md`:
- access token solo en memoria;
- refresh token HttpOnly;
- CSRF;
- restauración de sesión;
- refresh coordinado;
- logout real.

No borrar indiscriminadamente el trabajo existente:
- reutilizar `AuthService`, tipos, UI y tests cuando sea válido;
- retirar/migrar `TokenStorage`;
- actualizar pruebas.

## Gaps conocidos

- `QUESTIONNAIRE.md` tiene las 10 preguntas, pero no las opciones completas.
- Contratos de varias funcionalidades aún requieren DTOs exactos antes de crear servicios.
- Dashboard/cuestionario pendientes no deben permanecer como placeholders al finalizar el proyecto.

## Próximo paso exacto

1. Inspeccionar Git.
2. Revisar cambios no commiteados del segundo incremento.
3. Resolverlos contra el contrato de producción.
4. Terminar auth frontend segura.
5. Ejecutar:
   - tests;
   - build;
   - lint;
   - diff check.
6. Actualizar este documento.
7. Commit.
8. Continuar por fases del prompt definitivo.

## Funcionalidades posteriores pendientes

- cuestionario;
- materias;
- objetivos;
- actividades;
- calendario;
- temporizador;
- historial;
- dashboard;
- analytics;
- racha;
- IA;
- observaciones;
- retos;
- integración final;
- E2E;
- despliegue.

## Continuidad

Si se interrumpe:
- guardar estado;
- documentar archivos;
- registrar pruebas;
- indicar siguiente paso exacto;
- nunca asumir que una tarea parcial está terminada.
