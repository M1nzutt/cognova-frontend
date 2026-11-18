import { chromium, expect } from '@playwright/test'
import { readFile } from 'node:fs/promises'

const origin = process.env.BEHAVIOR_BROWSER_ORIGIN ?? 'http://127.0.0.1:5187'
const browser = await chromium.launch({ channel: 'chrome', headless: true })
const context = await browser.newContext({ viewport: { width: 320, height: 740 } })
await context.addCookies([{
  name: 'cognova_csrf',
  value: 'browser-test-csrf',
  url: origin,
  sameSite: 'Lax',
}])
const page = await context.newPage()
const accessToken = `eyJhbGciOiJIUzI1NiJ9.${Buffer.from(JSON.stringify({
  sub: '36', email: 'demo-readonly@example.test', exp: Math.floor(Date.now() / 1000) + 3600,
})).toString('base64url')}.test-signature`
const evidence = Array.from({ length: 5 }, (_, index) => ({
  session_id: 100 + index,
  planned_minutes: 10,
  actual_seconds: '60.140789',
  result: index === 0 ? 'completed' : 'partial',
  summary: `Biología · Repasar células: 10 min planificados`,
}))
const fixture = {
  completed_session_count: 1,
  reviewed_session_count: 5,
  state: 'factual_summary',
  observations: [{
    observation: 'En 5 de 5 registros se registró cerca de 1 min frente a 10 min planificados.',
    interpretation: 'Estos datos describen solo las sesiones registradas; no explican la diferencia ni permiten concluir que sea un hábito.',
    evidence,
    question: '¿Qué contexto ayudaría a entender la diferencia entre el tiempo previsto y el registrado?',
    confidence_basis: 'Se basa en 5 registros finalizados o parciales; las sesiones parciales se identifican por separado y no cuentan como completadas.',
    related_resources: [
      { kind: 'subject', id: 3, label: 'Biología', href: '/app/subjects/3' },
      { kind: 'activity', id: 8, label: 'Repasar células', href: '/app/activities/8' },
      ...evidence.map((item, index) => ({
        kind: 'session', id: item.session_id, label: `Biología · Repasar células · 16/11 12:0${index}`,
        href: `/app/sessions/${item.session_id}`,
      })),
    ],
  }],
}
const behavior = process.env.BEHAVIOR_DEMO_RESPONSE_PATH
  ? JSON.parse(await readFile(process.env.BEHAVIOR_DEMO_RESPONSE_PATH, 'utf8'))
  : fixture

await page.route('**/api/v1/**', async route => {
  const url = new URL(route.request().url())
  if (url.pathname.endsWith('/auth/refresh')) {
    await route.fulfill({ json: { access_token: accessToken, token_type: 'bearer' } })
  } else if (url.pathname.endsWith('/auth/me')) {
    await route.fulfill({ json: {
      id: 36, name: 'Cuenta demo (solo lectura)', email: 'demo-readonly@example.test',
      degree_program: 'Ingeniería', semester: 4,
      onboarding: { status: 'complete', academic_profile_complete: true, questionnaire_complete: true, next_step: 'complete' },
    } })
  } else if (url.pathname.endsWith('/analysis/behavior') && route.request().method() === 'POST') {
    await route.fulfill({ json: behavior, headers: { 'Cache-Control': 'no-store' } })
  } else {
    throw new Error(`Unexpected API request in read-only browser test: ${route.request().method()} ${url.pathname}`)
  }
})

try {
  await page.goto(`${origin}/app/behavior`)
  await expect(page.getByRole('heading', { name: 'Observaciones de tus sesiones' })).toBeVisible()
  const observation = behavior.observations[0]
  if (!observation) throw new Error('Browser behavior scenario needs one factual observation')
  await expect(page.getByRole('heading', { name: observation.observation })).toBeVisible()
  const summary = page.getByText(`Ver los ${observation.evidence.length} registros que lo respaldan`)

  for (const width of [320, 360, 375, 390, 414, 768, 1440]) {
    await page.setViewportSize({ width, height: width < 700 ? 740 : 900 })
    const dimensions = await page.evaluate(() => ({
      client: document.documentElement.clientWidth,
      scroll: document.documentElement.scrollWidth,
    }))
    expect(dimensions.scroll - dimensions.client).toBeLessThanOrEqual(1)
    if (width === 320) await summary.focus()
    await page.keyboard.press('Enter')
    await expect(page.locator('details')).toHaveAttribute('open', '')
    await expect(page.getByText(/planificados; se registraron/)).toHaveCount(observation.evidence.length)
    for (const related of observation.related_resources) {
      await expect(page.locator(`a[href="${related.href}"]`, { hasText: related.label })).toBeVisible()
    }
    await page.keyboard.press('Enter')
  }
  console.log('Behavior observations browser regression passed at 320, 360, 375, 390, 414, 768, and 1440px.')
} finally {
  await context.close()
  await browser.close()
}
