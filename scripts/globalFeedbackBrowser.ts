import { chromium, expect } from '@playwright/test'

const origin = process.env.COGNOVA_BROWSER_ORIGIN ?? 'http://127.0.0.1:8080'
const browser = await chromium.launch({ channel: 'chrome', headless: true })
const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } })
await context.addCookies([{
  name: 'cognova_csrf',
  value: 'global-feedback-browser-check',
  url: origin,
  sameSite: 'Lax',
}])
const page = await context.newPage()
const accessToken = `eyJhbGciOiJIUzI1NiJ9.${Buffer.from(JSON.stringify({
  sub: '36',
  email: 'browser-validation@example.test',
  exp: Math.floor(Date.now() / 1000) + 3600,
})).toString('base64url')}.test-signature`

const evidence = Array.from({ length: 4 }, (_, index) => ({
  session_id: 100 + index,
  planned_minutes: 10,
  actual_seconds: index < 3 ? '60.000000' : '600.000000',
  result: index === 3 ? 'partial' : 'completed',
  summary: `Biología · Sesión ${index + 1}: 10 min planificados`,
}))

let interpretationSource: 'gemini' | 'deterministic' | 'fallback' = 'gemini'
let generationRequests = 0
let releaseGeneration: (() => Promise<void>) | null = null
let failNextGeneration = false
let failedGenerationRequests = 0
const generationRequestFailures: string[] = []
page.on('requestfailed', request => {
  if (new URL(request.url()).pathname.endsWith('/study-plans/generate')) {
    generationRequestFailures.push(request.failure()?.errorText ?? 'unknown failure')
  }
})

function behaviorResponse() {
  const interpretation = interpretationSource === 'gemini'
    ? 'Gemini interpreta la comparación como una referencia útil para ajustar bloques.'
    : interpretationSource === 'deterministic'
      ? 'Comparar ambos tiempos puede ayudar a ajustar la duración prevista.'
      : 'La comparación ofrece una referencia, aunque la interpretación automatizada no está disponible.'
  return {
    completed_session_count: 3,
    partial_session_count: 1,
    cancelled_session_count: 1,
    reviewed_session_count: 4,
    state: 'factual_summary',
    insufficient_data_guidance: 'Aún faltan sesiones finalizadas con duración registrada.',
    observations: [{
      conclusion: 'En 3 de 4 sesiones, el tiempo registrado fue menor que el planificado.',
      observation: 'En 3 de 4 sesiones, el tiempo registrado fue menor que el planificado.',
      interpretation,
      uncertainty: 'Los registros no indican por qué ocurrió.',
      suggestion: 'Podrías probar sesiones más breves y comparar los próximos resultados.',
      interpretation_source: interpretationSource,
      evidence,
      question: '¿Qué contexto ayudaría a entender estas diferencias?',
      confidence_basis: 'Se revisaron sesiones completadas y parciales; las canceladas se contabilizan aparte.',
      related_resources: evidence.map((item, index) => ({
        kind: 'session',
        id: item.session_id,
        label: `Sesión ${index + 1}`,
        href: `/app/sessions/${item.session_id}`,
      })),
    }],
  }
}

const generatedPlan = {
  id: 10,
  name: 'Plan simulado de biología',
  objective: 'Repasar los temas pendientes',
  start_at: '2030-01-01T10:00:00Z',
  end_at: '2030-02-01T10:00:00Z',
  status: 'draft',
  source: 'ai',
  ai_proposal_snapshot: {
    schema_version: 1,
    model: 'mock-model-no-gemini-call',
    generated_at: '2030-01-01T10:00:00Z',
    explanation: 'Propuesta simulada para verificar la navegación.',
    reasoning_summary: 'Respuesta de prueba del navegador.',
    plan: {
      name: 'Plan simulado de biología',
      objective: 'Repasar los temas pendientes',
      start_date: '2030-01-01',
      end_date: '2030-02-01',
      subject_ids: [],
      activity_ids: [],
      session_ids: [],
    },
    proposed_challenges: [],
  },
  created_at: '2030-01-01T10:00:00Z',
  updated_at: '2030-01-01T10:00:00Z',
  subjects: [],
  activities: [],
  study_sessions: [],
  decisions: [],
  challenge_count: 0,
  hierarchy: { key: 'plan:10', kind: 'plan', label: 'Plan simulado de biología', children: [] },
  priority_order: [],
  activity_dependency_order: [],
  weekly_rhythm: [],
  candidate_slots: [],
  schedule_conflict: false,
}

await page.route('**/api/v1/**', async route => {
  const request = route.request()
  const url = new URL(request.url())
  const path = url.pathname
  const json = (body: unknown, status = 200) => route.fulfill({
    status,
    contentType: 'application/json',
    headers: { 'Cache-Control': 'no-store' },
    body: JSON.stringify(body),
  })

  if (path.endsWith('/auth/refresh')) {
    await json({ access_token: accessToken, token_type: 'bearer' })
  } else if (path.endsWith('/auth/me')) {
    await json({
      id: 36,
      name: 'Verificación local',
      email: 'browser-validation@example.test',
      degree_program: 'Ingeniería',
      semester: 4,
      onboarding: {
        status: 'complete',
        academic_profile_complete: true,
        questionnaire_complete: true,
        next_step: 'complete',
      },
    })
  } else if (path.endsWith('/analysis/behavior') && request.method() === 'POST') {
    await json(behaviorResponse())
  } else if (path.endsWith('/study-plans/generate') && request.method() === 'POST') {
    generationRequests += 1
    if (failNextGeneration) {
      failNextGeneration = false
      failedGenerationRequests += 1
      await json({ error: { code: 'STUDY_PLAN_GENERATION_UNAVAILABLE' } }, 503)
    } else {
      await new Promise<void>(resolve => { releaseGeneration = resolve })
      await json({
        plan: generatedPlan,
        explanation: 'Propuesta simulada para verificar la navegación.',
        reasoning_summary: 'Respuesta de prueba del navegador.',
      }, 201)
    }
  } else if (path.endsWith('/study-plans') && request.method() === 'GET') {
    await json({ items: [], next_after_id: null })
  } else {
    throw new Error(`Unexpected API request during browser verification: ${request.method()} ${path}`)
  }
})

try {
  await page.goto(`${origin}/app/behavior`)
  await expect(page.getByRole('heading', { name: 'Observaciones de tus sesiones' })).toBeVisible()
  await expect(page.getByText('Interpretación generada por Gemini')).toBeVisible()
  await expect(page.getByText('sesiones completadas', { exact: true })).toBeVisible()
  await expect(page.getByText(/1 sesión parcial · 1 sesión cancelada/)).toBeVisible()
  await expect(page.getByRole('heading', { name: /3 de 4 sesiones/ })).toBeVisible()
  await page.getByText(/Ver los 4 registros/).click()
  await expect(page.getByText(/Estado del registro: parcial/)).toBeVisible()

  const sourceLabels = [
    ['deterministic', 'Interpretación basada en reglas locales'],
    ['fallback', 'Interpretación de respaldo: Gemini no estuvo disponible o su respuesta no superó la validación'],
  ] as const
  for (const [source, label] of sourceLabels) {
    interpretationSource = source
    await page.getByRole('button', { name: 'Actualizar' }).click()
    await expect(page.getByText(label)).toBeVisible()
  }

  for (const width of [320, 375, 390, 768, 1440]) {
    await page.setViewportSize({ width, height: width < 700 ? 780 : 960 })
    const dimensions = await page.evaluate(() => ({
      viewport: document.documentElement.clientWidth,
      document: document.documentElement.scrollWidth,
    }))
    expect(dimensions.document - dimensions.viewport).toBeLessThanOrEqual(1)
  }

  await page.getByRole('link', { name: 'Planes' }).click()
  await expect(page.getByRole('heading', { name: 'Planes de estudio' })).toBeVisible()
  const firstRequest = page.waitForRequest(request => (
    new URL(request.url()).pathname.endsWith('/study-plans/generate')
    && request.method() === 'POST'
  ))
  await page.getByRole('button', { name: 'Proponer un plan con IA' }).click()
  await firstRequest
  await expect(page.getByRole('button', { name: 'Gemini está preparando tu plan…' })).toBeDisabled()

  await page.getByRole('link', { name: 'IA y reflexiones' }).click()
  await expect(page.getByRole('heading', { name: 'Observaciones de tus sesiones' })).toBeVisible()
  await page.getByRole('link', { name: 'Planes' }).click()
  await expect(page.getByRole('button', { name: 'Gemini está preparando tu plan…' })).toBeDisabled()
  expect(generationRequests).toBe(1)

  await page.getByRole('link', { name: 'IA y reflexiones' }).click()
  if (!releaseGeneration) throw new Error('Mock generation did not reach its pending state')
  await releaseGeneration()
  await expect(page.getByRole('link', { name: 'Abrir resultado' })).toHaveAttribute('href', '/app/study-plans/10')
  await expect(page.getByRole('status').filter({ hasText: 'Tu plan está listo' })).toBeVisible()
  expect(generationRequests).toBe(1)

  await page.getByRole('link', { name: 'Planes' }).click()
  await expect(page.getByRole('button', { name: 'Proponer un plan con IA' })).toBeEnabled()
  failNextGeneration = true
  await page.getByRole('button', { name: 'Proponer un plan con IA' }).click()
  await expect(page.getByRole('alert')).toContainText('No pudimos generar tu plan')
  await expect(page.getByRole('link', { name: 'Abrir resultado' })).toHaveAttribute('href', '/app/study-plans')
  expect(generationRequests).toBe(2)
  expect(failedGenerationRequests).toBe(1)
  expect(generationRequestFailures).toEqual([])
  expect(generationRequests).toBe(failedGenerationRequests + 1)

  console.log(JSON.stringify({
    result: 'passed',
    origin,
    observation_sources: ['gemini', 'deterministic', 'fallback'],
    session_states: ['completed', 'partial', 'cancelled'],
    responsive_widths: [320, 375, 390, 768, 1440],
    simulated_generation_requests: generationRequests,
    failed_requests_cancelled: generationRequestFailures.length,
    successful_generation_completed_after_navigation: true,
    failed_generation_notification_and_recovery_link: true,
    gemini_provider_calls: 0,
  }, null, 2))
} finally {
  await context.close()
  await browser.close()
}
