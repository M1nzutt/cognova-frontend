import { chromium, expect } from '@playwright/test'
import { mkdir } from 'node:fs/promises'

const origin = process.env.ANALYTICS_CHAT_ORIGIN ?? 'http://localhost:8080'
const screenshotDir = process.env.ANALYTICS_CHAT_SCREENSHOT_DIR
if (screenshotDir) await mkdir(screenshotDir, { recursive: true })
const browser = await chromium.launch({ channel: 'chrome', headless: true })
const context = await browser.newContext({ viewport: { width: 390, height: 844 } })
await context.addCookies([{ name: 'cognova_csrf', value: 'chat-browser-test', url: origin, sameSite: 'Lax' }])
const page = await context.newPage()
const accessToken = `eyJhbGciOiJIUzI1NiJ9.${Buffer.from(JSON.stringify({
  sub: '36', email: 'analytics-chat@example.test', exp: Math.floor(Date.now() / 1000) + 3600,
})).toString('base64url')}.test-signature`
const created = {
  id: 12, title: 'Nueva conversación', created_at: '2030-04-15T10:00:00Z', updated_at: '2030-04-15T10:00:00Z',
}
const previous = {
  id: 7, title: 'Historial guardado', created_at: '2030-04-14T10:00:00Z', updated_at: '2030-04-15T09:00:00Z',
}
const stamp = '2030-04-15T10:00:00Z'
const oldMessages = {
  items: [{ id: 4, role: 'user', content: 'Mensaje anterior del historial.', evidence: [], created_at: stamp }],
  next_before_id: null,
}
const recentMessages = {
  items: Array.from({ length: 12 }, (_, index) => ({
    id: 5 + index,
    role: index % 2 ? 'assistant' : 'user',
    content: index === 11 ? 'Respuesta reciente guardada.' : `Mensaje extenso ${index}: ${'texto académico de demostración '.repeat(12)}`,
    evidence: index === 11 ? ['Registro académico simulado'] : [],
    created_at: stamp,
  })),
  next_before_id: 4,
}
let historyReads = 0

await page.route('**/api/v1/**', async route => {
  const request = route.request()
  const url = new URL(request.url())
  const path = url.pathname
  if (path.endsWith('/auth/refresh')) {
    await route.fulfill({ json: { access_token: accessToken, token_type: 'bearer' } })
  } else if (path.endsWith('/auth/me')) {
    await route.fulfill({ json: {
      id: 36, name: 'Validación de interfaz', email: 'analytics-chat@example.test',
      degree_program: 'Ingeniería', semester: 4,
      onboarding: { status: 'complete', academic_profile_complete: true, questionnaire_complete: true, next_step: 'complete' },
    } })
  } else if (path.endsWith('/analytics/overview')) {
    await route.fulfill({ json: {
      total_studied_seconds: '10800.000000', total_studied_minutes: '180.000000',
      cancelled_session_seconds: '0.000000', cancelled_session_minutes: '0.000000',
      finished_sessions: 3, completed_sessions: 2, partial_sessions: 1, postponed_sessions: 0,
      cancelled_sessions: 0, subjects_with_activity: 2, completed_activities: 4,
      pending_activities: 2, in_progress_activities: 1, active_plans: 1, completed_plans: 1,
      completed_challenges: 2, failed_challenges: 1,
    } })
  } else if (path.endsWith('/analytics/study-time')) {
    await route.fulfill({ json: {
      from: '2030-04-15T00:00:00Z', to: '2030-04-22T00:00:00Z', timezone: 'UTC',
      granularity: 'day', total_seconds: '10800.000000', total_minutes: '180.000000',
      cancelled_seconds: '0.000000', cancelled_minutes: '0.000000',
      cancelled_sessions_count: 0, sessions_count: 3,
      by_subject: [{ subject_id: 4, name: 'Física', seconds: '7200.000000', minutes: '120.000000', sessions_count: 2 }],
      buckets: [{ from: '2030-04-15T00:00:00Z', to: '2030-04-16T00:00:00Z', seconds: '3600.000000', minutes: '60.000000' }],
    } })
  } else if (path.endsWith('/analytics/timeline')) {
    await route.fulfill({ json: { items: [], next_cursor: null } })
  } else if (path.endsWith('/analytics/search')) {
    await route.fulfill({ json: { items: [], next_cursor: null } })
  } else if (path.endsWith('/academic-chat/conversations') && request.method() === 'GET') {
    historyReads += 1
    await route.fulfill({ json: { items: [previous] } })
  } else if (path.endsWith('/academic-chat/conversations') && request.method() === 'POST') {
    await route.fulfill({ status: 201, json: created })
  } else if (/\/academic-chat\/conversations\/\d+\/messages$/.test(path) && request.method() === 'GET') {
    await route.fulfill({ json: url.searchParams.has('before_id') ? oldMessages : recentMessages })
  } else if (/\/academic-chat\/conversations\/\d+\/messages$/.test(path) && request.method() === 'POST') {
    const content = String(request.postDataJSON().content)
    await route.fulfill({ status: 201, json: {
      conversation: { ...previous, updated_at: stamp },
      user_message: { id: 30, role: 'user', content, evidence: [], created_at: stamp },
      assistant_message: { id: 31, role: 'assistant', content: 'Respuesta simulada, sin llamar a Gemini.', evidence: ['Evidencia simulada'], created_at: stamp },
    } })
  } else {
    throw new Error(`Unexpected browser request: ${request.method()} ${path}`)
  }
})

try {
  for (const width of [375, 390, 768, 1024, 1280, 1440]) {
    await page.setViewportSize({ width, height: width < 761 ? 844 : 900 })
    await page.goto(`${origin}/app/analytics`)
    await expect(page.getByRole('heading', { name: 'Análisis' })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Tiempo de estudio' })).toBeVisible()
    await page.getByRole('button', { name: 'Abrir IA Cognova' }).click()
    await expect(page.getByRole('heading', { name: /IA Cognova/ })).toBeVisible()
    const panel = page.locator('[aria-label="Asistente IA Cognova"]')
    const bounds = await panel.boundingBox()
    if (!bounds || bounds.x < 0 || bounds.x + bounds.width > width + 1) {
      throw new Error(`Assistant panel exceeds ${width}px viewport`)
    }
    if (screenshotDir && [390, 768, 1440].includes(width)) {
      await page.screenshot({ path: `${screenshotDir}/analytics-chat-${width}.png`, fullPage: width > 760 })
    }
    if (width <= 760) {
      await expect(page.getByRole('dialog', { name: /IA Cognova/ })).toHaveAttribute('aria-modal', 'true')
      await expect(page.getByRole('button', { name: 'Volver a las estadísticas' })).toBeFocused()
    } else {
      await expect(page.getByRole('heading', { name: 'Análisis' })).toBeVisible()
      if (width > 1200) {
        await page.getByRole('button', { name: 'Expandir panel de IA Cognova' }).click()
        await expect(page.locator('[data-assistant-open="true"]')).toHaveAttribute('data-assistant-expanded', 'true')
      } else {
        await page.getByRole('button', { name: 'Expandir panel de IA Cognova' }).click()
        const expanded = await panel.boundingBox()
        if (!expanded || expanded.width <= bounds.width) throw new Error('Tablet panel did not expand')
      }
    }

    await expect(page.getByRole('button', { name: /Historial guardado/ })).toBeVisible()
    await page.getByRole('button', { name: /Historial guardado/ }).click()
    await expect(page.getByText('Respuesta reciente guardada.')).toBeVisible()
    const messages = page.locator('[aria-live="polite"]')
    const overflow = await messages.evaluate(node => node.scrollHeight > node.clientHeight)
    if (!overflow) throw new Error(`Conversation messages are not scrollable at ${width}px`)
    await page.getByRole('button', { name: 'Ver mensajes anteriores' }).click()
    await expect(page.getByText('Mensaje anterior del historial.')).toBeVisible()
    await page.getByLabel('Escribe tu consulta académica').fill('¿Qué puedo priorizar?')
    await page.getByRole('button', { name: 'Enviar mensaje' }).click()
    await expect(page.getByText('Respuesta simulada, sin llamar a Gemini.')).toBeVisible()
    await page.getByRole('button', { name: 'Nueva conversación' }).click()
    await expect(page.getByRole('heading', { name: 'Nueva conversación' })).toBeVisible()

    if (width <= 760) {
      await page.getByRole('button', { name: 'Volver a las estadísticas' }).click()
    } else {
      await page.getByRole('button', { name: 'Volver a las estadísticas' }).click()
    }
    await expect(page.getByRole('heading', { name: 'Análisis' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Abrir IA Cognova' })).toBeFocused()
    await page.getByRole('button', { name: 'Abrir IA Cognova' }).click()
    await expect(page.getByRole('heading', { name: 'Nueva conversación' })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Tiempo de estudio' })).toBeVisible()
    await page.getByRole('button', { name: 'Volver a las estadísticas' }).click()

    const dimensions = await page.evaluate(() => ({
      client: document.documentElement.clientWidth,
      scroll: document.documentElement.scrollWidth,
    }))
    expect(dimensions.scroll - dimensions.client).toBeLessThanOrEqual(1)
    console.log(`Analytics + IA Cognova browser check passed at ${width}px; authenticated UI used simulated chat responses.`)
  }
  expect(historyReads).toBeGreaterThanOrEqual(6)

  await page.setViewportSize({ width: 1280, height: 900 })
  await page.goto(`${origin}/app/companion`)
  await expect(page).toHaveURL(/\/app\/analytics$/)
  await expect(page.getByRole('heading', { name: 'Análisis' })).toBeVisible()
  await expect(page.getByRole('heading', { name: /IA Cognova/ })).toBeVisible()
  await page.getByRole('button', { name: 'Volver a las estadísticas' }).click()
  console.log('Legacy chat route redirects to Analytics with assistant opened.')
} finally {
  await context.close()
  await browser.close()
}
