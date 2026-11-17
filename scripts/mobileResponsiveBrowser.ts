import { chromium, expect } from '@playwright/test'
import { randomBytes } from 'node:crypto'
import { mkdir } from 'node:fs/promises'

// Local-only synthetic account. Never use the sustentation account or call Gemini.
const origin = 'http://127.0.0.1:5187'
if (process.env.MOBILE_SMOKE_ALLOW_SYNTHETIC_WRITE !== '1') {
  throw new Error('Set MOBILE_SMOKE_ALLOW_SYNTHETIC_WRITE=1 to create local synthetic data')
}
const browser = await chromium.launch({ channel: 'chrome', headless: true })
const context = await browser.newContext({ viewport: { width: 320, height: 700 } })
const setupContext = await browser.newContext()
const page = await context.newPage()
const email = `mobile-${randomBytes(6).toString('hex')}@example.com`
const password = 'Mobile26!a'
const findings: Array<{ width: number; route: string; overflow: number; elements: string[] }> = []
const routes = [
  '/dashboard', '/app/calendar', '/app/subjects', '/app/subjects/new',
  '/app/activities', '/app/activities/new', '/app/sessions', '/app/sessions/new',
  '/app/study-plans', '/app/study-plans/new', '/app/behavior', '/app/analytics',
  '/app/companion', '/app/profile',
]
try {
  await mkdir('.local', { recursive: true })
  const api = setupContext.request
  let access = ''
  const call = async (path: string, method = 'GET', data?: object) => {
    const response = await api.fetch(`${origin}/api/v1/${path}`, {
      method, data, headers: { Origin: 'http://127.0.0.1:8080', ...(access ? { Authorization: `Bearer ${access}` } : {}) },
    })
    if (!response.ok()) throw new Error(`${path}: HTTP ${response.status()}`)
    return response.json()
  }
  const registration = await call('auth/register', 'POST', { name: 'Validacion Movil', email, password })
  access = registration.access_token
  await call('onboarding/academic-profile', 'PUT', { degree_program: 'Software', semester: 1 })
  const catalog = await call('questionnaire/catalog')
  await call('questionnaire', 'POST', {
    questionnaire_version: 1,
    answers: Object.fromEntries(catalog.questions.map((q: { id: string; options: { id: string }[] }) =>
      [q.id, { choices: [q.options.find(o => o.id !== 'other')?.id], other_text: null }])),
  })
  const subject = await call('subjects', 'POST', {
    name: 'Validación móvil', difficulty: 'medium', color_base: 'blue',
    color_shade: 300, status: 'active',
  })
  const activity = await call('activities', 'POST', {
    title: 'Actividad de prueba móvil', subject_id: subject.id,
    deadline: '2030-01-15T12:00:00Z', priority: 'medium',
    status: 'pending', estimated_duration: 30, notes: null,
  })
  routes.push(`/app/subjects/${subject.id}`, `/app/activities/${activity.id}`)
  await page.goto(`${origin}/login`)
  await page.getByLabel(/correo/i).fill(email)
  await page.locator('#login-password').fill(password)
  await page.getByRole('button', { name: /iniciar sesión/i }).click()
  await page.waitForURL(/dashboard/, { timeout: 15000 })
  const visit = async (route: string) => {
    await page.evaluate(path => {
      window.history.pushState({}, '', path)
      window.dispatchEvent(new PopStateEvent('popstate'))
    }, route)
    await expect(page).toHaveURL(new RegExp(`${route.replaceAll('/', '\\/')}$`))
  }
  await visit('/app/study-plans/new')
  await page.getByLabel('Nombre del plan').fill('Plan responsive sintético')
  await page.getByLabel('¿Qué quieres lograr?').fill('Validar los controles móviles sin generar IA')
  await page.getByRole('checkbox', { name: 'Validación móvil' }).check()
  await page.getByRole('button', { name: 'Crear plan', exact: true }).click()
  await expect(page).toHaveURL(/\/app\/study-plans\/\d+$/)
  const planRoute = new URL(page.url()).pathname
  await page.getByRole('button', { name: 'Añadir misión' }).click()
  await page.getByLabel('Nombre de la misión').fill('Misión responsive')
  await page.getByLabel('¿Cómo vas a cumplirla?').fill('Repasar el material')
  await page.getByLabel('Materia relacionada').selectOption(String(subject.id))
  await page.getByRole('button', { name: 'Añadir misión', exact: true }).click()
  const challenge = page.getByRole('list', { name: 'Misiones del plan' }).getByRole('link', { name: 'Misión responsive' })
  await expect(challenge).toBeVisible()
  const challengeRoute = await challenge.getAttribute('href')
  if (!challengeRoute) throw new Error('Challenge route missing')
  routes.push(planRoute, challengeRoute)
  await page.goto(`${origin}/dashboard`)
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
  for (const width of [320, 360, 375, 390, 414, 768, 1440]) {
    await page.setViewportSize({ width, height: width === 1440 ? 900 : 700 })
    for (const route of routes) {
      await visit(route)
      await expect(page.getByRole('main')).toBeVisible()
      await page.waitForTimeout(250)
      if (route === '/app/companion' && width < 900) {
        const composer = page.getByLabel('Escribe tu consulta académica')
        await composer.fill('Una consulta de prueba que no se enviará.')
        await composer.click()
        await page.waitForTimeout(100)
        const usable = await composer.evaluate(node => {
          const nav = document.querySelector('nav[aria-label="Navegación principal"]')!.getBoundingClientRect()
          const input = node.getBoundingClientRect()
          return input.bottom <= nav.top && input.left >= 0 && input.right <= innerWidth
        })
        if (!usable) findings.push({ width, route, overflow: 0, elements: ['chat composer covered by bottom navigation'] })
      }
      const measurement = await page.evaluate(() => {
        const viewport = document.documentElement.clientWidth
        const elements = [...document.querySelectorAll<HTMLElement>('button, a, input, textarea, select')]
          .filter(node => {
            const rect = node.getBoundingClientRect()
            if (!rect.width || !rect.height) return false
            if ((rect.right > viewport + 2 || rect.left < -2) && getComputedStyle(node).position !== 'fixed') return true
            let parent = node.parentElement
            while (parent) {
              const style = getComputedStyle(parent)
              if (style.overflowX === 'hidden' || style.overflowY === 'hidden') {
                const bounds = parent.getBoundingClientRect()
                if (rect.left < bounds.left - 2 || rect.right > bounds.right + 2 ||
                  rect.top < bounds.top - 2 || rect.bottom > bounds.bottom + 2) return true
              }
              parent = parent.parentElement
            }
            return false
          })
          .slice(0, 8).map(node => `${node.tagName}:${node.textContent?.trim().slice(0, 45) || node.getAttribute('aria-label')}`)
        return { overflow: document.documentElement.scrollWidth - viewport, elements }
      })
      if (measurement.overflow > 2 || measurement.elements.length) findings.push({ width, route, ...measurement })
      if (width === 320 && ['/app/companion', '/app/study-plans', '/app/analytics'].includes(route)) {
        await page.screenshot({ path: `.local/responsive-${width}-${route.split('/').at(-1)}.png` })
      }
    }
    console.log('width findings', width, findings.filter(f => f.width === width))
    await visit(`/app/activities/${activity.id}`)
    await expect(page.getByRole('button', { name: 'Editar actividad' })).toBeVisible()
    await page.getByRole('button', { name: 'Eliminar actividad' }).click()
    const dialog = page.getByRole('dialog')
    await expect(dialog.getByRole('button', { name: 'Cancelar' })).toBeVisible()
    await dialog.getByRole('button', { name: 'Cancelar' }).click()
    await expect(dialog).toHaveCount(0)
    await visit('/app/calendar')
    await page.getByRole('button', { name: 'Semana', exact: true }).click()
    await expect(page.getByRole('region', { name: 'Vista semanal' })).toBeVisible()
    await page.getByRole('button', { name: 'Mes', exact: true }).click()
    await expect(page.getByRole('region', { name: 'Vista mensual' })).toBeVisible()
    if (width < 900) {
      await visit('/app/companion')
      await page.setViewportSize({ width, height: 450 })
      const composer = page.getByLabel('Escribe tu consulta académica')
      await composer.fill('Solo compruebo el teclado móvil.')
      await composer.click()
      await page.waitForTimeout(100)
      const navTop = await page.getByRole('navigation', { name: 'Navegación principal' }).evaluate(node => node.getBoundingClientRect().top)
      const composerBottom = await composer.evaluate(node => node.getBoundingClientRect().bottom)
      if (composerBottom > navTop) findings.push({ width, route: '/app/companion', overflow: 0, elements: ['composer covered at short keyboard viewport'] })
      await page.setViewportSize({ width, height: 700 })
    }
    if (width < 900) {
      await visit('/dashboard')
      const more = page.getByRole('button', { name: 'Más secciones' })
      await more.click()
      await expect(more).toHaveAttribute('aria-expanded', 'true')
      if (width === 320) await page.screenshot({ path: '.local/responsive-320-more.png' })
      for (const label of ['Actividades', 'Sesiones', 'IA y reflexiones', 'Análisis']) {
        await expect(page.getByRole('navigation', { name: 'Navegación principal' }).getByRole('link', { name: label })).toBeVisible()
      }
      const hit = await page.getByRole('link', { name: 'Actividades', exact: true }).evaluate(node => {
        const rect = node.getBoundingClientRect()
        return document.elementFromPoint(rect.x + rect.width / 2, rect.y + rect.height / 2) === node ||
          node.contains(document.elementFromPoint(rect.x + rect.width / 2, rect.y + rect.height / 2))
      })
      if (!hit) throw new Error(`More menu covered by another element at ${width}px`)
      await page.keyboard.press('Escape')
      await expect(more).toHaveAttribute('aria-expanded', 'false')
      await more.click()
      for (const [label, route] of [
        ['Actividades', '/app/activities'],
        ['Sesiones', '/app/sessions'],
        ['IA y reflexiones', '/app/behavior'],
        ['Análisis', '/app/analytics'],
      ]) {
        await page.getByRole('navigation', { name: 'Navegación principal' }).getByRole('link', { name: label }).click()
        await expect(page).toHaveURL(new RegExp(`${route}$`))
        await expect(more).toHaveAttribute('aria-expanded', 'false')
        await page.goBack()
        await expect(page).toHaveURL(/\/dashboard/)
        if (label !== 'Análisis') await more.click()
      }
    }
  }
  console.log(JSON.stringify({ findings, visited: routes.length * 7, widths: [320, 360, 375, 390, 414, 768, 1440] }))
  if (findings.length) process.exitCode = 1
} finally {
  await setupContext.close()
  await browser.close()
}
