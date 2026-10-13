# Cognova — Estado frontend

Fecha: 2026-10-13. Fase activa: registro mínimo, perfil académico y cuestionario.

## Base y contratos

Turno iniciado en dc31fe2, 16 commits, rama fix/netlify-backend-origin. Se conservaron/revisaron los cuatro documentos pendientes y se cerraron en 1192fc4, publicado en esa rama. Nueva rama feat/onboarding-questionnaire parte de 17 commits.

Autoridad: backend a277af2ba5f2e7227b5b329aa7d935e5e12b8f94 (feat/onboarding-questionnaire). Database fijado por backend: 232c43130c0fb3eddd32e1dd3707368ba0d87d4c; schema requerido 0003_onboarding_questionnaire. Solo se consultaron fuentes remotas; no se modifican otros repositorios.

API_CONTRACT, AUTH_CONTRACT, QUESTIONNAIRE y ONBOARDING_CONTRACT sincronizados desde ese SHA. Registro ahora solo name/email/password (30/50/8–12); login no aplica máximos de registro a cuentas legacy. Catálogo completo y revisiones disponibles; el frontend debe navegar por onboarding.next_step.

## Evidencia y entorno

Base antes de cambios funcionales: 56 tests, lint, TypeScript y build:netlify aprobados. Evidencia histórica de auth y proxy en INTEGRATION_VALIDATION.md.

Render consultado el 2026-10-13 expone únicamente auth/health/ready y UserResponse antiguo con academic_goal. No tiene onboarding/catalog publicados. Esto no bloquea implementar contra el contrato fijado, pero impide validar integración real nueva allí. No desplegar frontend incompatible; pendiente URL compatible/confirmación operativa de schema 0003.

## Siguiente paso

Implementar tipos/servicios/validación, registro mínimo, navegación explícita, perfil y cuestionario/revisiones; tests y documentación por bloques, commits pequeños y push periódicos. Mantener auth en memoria, cookies/CSRF, refresh coordinado y retry único. No Subjects ni otros módulos.

Meta de historial: superar 500 commits con cambios reales, sin inflación ni squash. Inicio funcional: 17; contar al cierre y reportar restantes hasta 501.

Avance: tipos contractuales, registro mínimo y límites, lectura UserResponse nullable, navegación por next_step y formulario académico implementados. Refresh conserva coordinación y consulta me sin retry recursivo. 73 tests, lint y build correctos. Falta sustituir la pantalla pendiente de cuestionario y completar edición/historial/UX e integración nueva.

Continuación desde 7a232d3 (20 commits): QuestionnaireService, validación, lectores de respuesta y query paginada completados; 96 tests, lint y build correctos. Se preservaron los cambios pendientes. UI del cuestionario es el siguiente bloque.

UI de cuestionario conectada: catálogo backend, diez pasos, POST inicial, GET actual, PUT con expected_revision, 409 conserva borrador y requiere decisión explícita, historial simple y reintento de sincronización de perfil sin repetir escritura. 105 tests y lint pasan; TypeScript detectó una opción de Testing Library incompatible en los tests, corregida en el commit siguiente; falta pulido del contenedor de onboarding y ampliar pruebas de rutas/historial.
