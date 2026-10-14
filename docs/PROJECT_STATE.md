# Cognova — Estado frontend

Fecha: 2026-10-13. Rama: feat/onboarding-questionnaire.

## Resultado de la fase

Implementación frontend de registro mínimo → perfil académico → cuestionario → app completada y verificada localmente. Cierre pendiente únicamente de validación real en entorno compatible; esta rama NO está desplegada a producción. No se iniciaron Subjects ni otros módulos.

Autoridad contractual: backend a277af2ba5f2e7227b5b329aa7d935e5e12b8f94 (feat/onboarding-questionnaire). Database fijado por backend: 232c43130c0fb3eddd32e1dd3707368ba0d87d4c; schema requerido 0003_onboarding_questionnaire. Solo se modificó cognova-frontend.

## Implementado y preservado

- Registro solo name/email/password, límites 30/50/8–12; login mantiene compatibilidad legacy.
- AuthUser nullable y onboarding explícito; navegación por next_step tras registro, login, restore y refresh + me.
- /onboarding/academic-profile: guardado de carrera/semestre y manejo de errores.
- /onboarding/questionnaire: catálogo backend, diez pasos, single/multi y máximos, Otro, validación, progreso, volver/avanzar y respuestas en memoria.
- /app/questionnaire: GET actual, PUT con expected_revision, revisión nueva sin sobrescritura e historial paginado. POST conserva la percepción inicial.
- 409: borrador conservado, lectura de revisión vigente, reintento confirmado o descarte explícito del borrador. Si falla sincronizar el perfil después de guardar, se reintenta solo esa lectura, no la escritura.
- EntryShell sin sidebar para entrada/onboarding, claro/oscuro, paleta aprobada y sin gradientes.
- Access solo en memoria; cookies refresh HttpOnly Path=/api/v1/auth y CSRF Path=/; credentials include, refresh coordinado, retry único, logout real y rutas protegidas preservados. Solo cognova.theme en Web Storage.

## Verificaciones finales

- npm run verify: 118 tests en 11 archivos, lint sin advertencias, TypeScript y build aprobados.
- npm run build:netlify: aprobado con el origen correcto https://cognova-backend-lpsi.onrender.com.
- dist/_redirects revisado: /api y /api/* hacia lpsi antes del fallback SPA.
- git diff --check sin errores; diagnóstico del editor sin problemas.
- Tests locales usan HTTP interceptado y contratos fijados. No sustituyen integración real nueva. El informe histórico de auth anterior se conserva separado en INTEGRATION_VALIDATION.md.

## Integración real pendiente y prohibición de deploy

Render consultado en esta fase solo expone auth/health/ready y UserResponse antiguo con academic_goal. No están publicadas las rutas nuevas de onboarding/catalog. La integración real nueva NO pudo validarse; tampoco se confirmó físicamente schema 0003. No se desplegó esta rama ni se modificó main, backend o database.

DEPENDENCY:
- Repo afectado: cognova-backend y cognova-database, coordinados por operación.
- Contrato/archivo: AUTH_CONTRACT y ONBOARDING_CONTRACT; SHAs fijados arriba.
- Cambio requerido: entregar URL de integración con backend compatible y confirmar schema 0003 aplicado.
- Motivo: ejecutar el recorrido real completo antes de considerar compatible un release de frontend. No se ejecutan migraciones desde este repositorio.

Siguiente paso exacto: con ese entorno disponible, verificar registro, login/me, perfil, catálogo, POST/GET/PUT, 409, historial, reload/restore, logout y cookies/CSRF/no-store; registrar resultados. No comenzar funcionalidades nuevas ni desplegar mientras esta dependencia siga pendiente.

## Git e historial

Inicio del encargo antes de cerrar documentación anterior: dc31fe2, 16 commits. El cierre previo 1192fc4 agregó uno y fue publicado en fix/netlify-backend-origin. Inicio de la fase funcional en feat/onboarding-questionnaire: 17 commits.

Este cierre comenzó en 031683f con 25 commits y tres archivos staged del bloque 409. Se revisaron y guardaron en 5750258. Luego 143a275 cerró decisiones/procedencia contractual; el commit que contiene este informe cierra evidencia/README/estado.

Conteo al incluir este cierre: 28 commits totales; 11 creados en la fase funcional desde 1192fc4 (12 desde los 16 del encargo original, incluyendo el cierre previo). Faltan 473 para llegar a 501. No hubo squash, commits vacíos ni inflación de historial.

La rama tiene upstream origin/feat/onboarding-questionnaire. Publicar todos los commits de cierre y confirmar git status limpio y divergencia 0/0 antes de entregar; el SHA final y resultado del push se obtienen de Git, no se inventan en este documento.
