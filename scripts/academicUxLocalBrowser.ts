import { chromium, expect } from '@playwright/test'
import { randomUUID } from 'node:crypto'
import { mkdir, writeFile } from 'node:fs/promises'

const baseURL = process.env.ACADEMIC_UX_BASE_URL ?? 'http://localhost:8080'
const base = new URL(baseURL)
if (base.protocol !== 'http:' || !['localhost', '127.0.0.1'].includes(base.hostname) || base.port !== '8080') {
  throw new Error('Este recorrido solo admite el Frontend local en localhost:8080.')
}

const output = '.local/academic-ux'
await mkdir(output, { recursive: true })
const browser = await chromium.launch({ channel: 'chrome', headless: true })
const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, colorScheme: 'light', timezoneId: 'America/Bogota' })
const page = await context.newPage()
page.setDefaultTimeout(20_000)
const errors: string[] = []
const screenshots: string[] = []
const registerResponses: string[] = []
const registerIssues: string[] = []
const operations: string[] = []
page.on('pageerror', error => errors.push(error.message))
page.on('response', response => {
  const pathname = new URL(response.url()).pathname
  if (pathname.includes('/api/')) registerResponses.push(`${response.status()} ${pathname}`)
  if (pathname.endsWith('/auth/register') && response.status() >= 400) {
    void response.json().then(data => {
      const issue = data?.error
      if (typeof issue?.code === 'string') registerIssues.push(issue.code)
    }).catch(() => undefined)
  }
})

try {
  const email = `ux${randomUUID().replaceAll('-', '').slice(0, 8)}@example.com`
  const password = `Cgno${randomUUID().replaceAll('-', '').slice(0, 4)}`

  await page.goto(`${baseURL}/register`)
  await page.getByLabel('Nombre', { exact: true }).fill('Estudiante de prueba')
  await page.getByLabel('Correo electrónico', { exact: true }).fill(email)
  await page.getByLabel('Contraseña', { exact: true }).fill(password)
  const invalidFields = await page.locator('form input').evaluateAll(inputs =>
    inputs.filter((input): input is HTMLInputElement => input instanceof HTMLInputElement)
      .filter(input => !input.checkValidity()).map(input => input.name || input.type))
  if (invalidFields.length) throw new Error(`Validación nativa inesperada en campos: ${invalidFields.join(', ')}`)
  await page.getByRole('button', { name: 'Crear cuenta' }).click()

  try {
    await expect(page.getByRole('heading', { name: 'Tu perfil académico' })).toBeVisible()
  } catch {
    const publicError = await page.getByRole('alert').allInnerTexts().catch(() => [])
    await Promise.resolve()
    throw new Error(`Registro detenido; respuestas HTTP: ${registerResponses.join(',') || 'ninguna'}; contrato: ${registerIssues.join(',') || 'sin código'}; aviso: ${publicError.join(' ') || 'ninguno'}`)
  }
  await page.getByLabel('Carrera', { exact: true }).fill('Ciencias de datos')
  await page.getByLabel('Semestre', { exact: true }).fill('3')
  await page.getByRole('button', { name: 'Guardar y continuar' }).click()

  await expect(page.getByRole('heading', { name: 'Conozcamos cómo estudias' })).toBeVisible()
  for (let step = 0; step < 10; step++) {
    const firstChoice = page.locator('fieldset input[type="radio"], fieldset input[type="checkbox"]').first()
    await expect(firstChoice).toBeVisible()
    await firstChoice.check()
    await page.getByRole('button', { name: step === 9 ? 'Guardar percepción inicial' : 'Continuar' }).click()
  }
  await expect(page).toHaveURL(/\/dashboard$/)

  const tag = randomUUID().replaceAll('-', '').slice(0, 5)
  const subjectName = `UX ${tag}`
  const activityTitle = `Repaso ${tag}`
  const planName = `Semana ${tag}`
  const challengeTitle = `Meta ${tag}`
  const localDateTime = (hours: number) => page.evaluate((offset) => {
    const date = new Date(Date.now() + offset * 60 * 60 * 1000)
    const part = (value: number) => String(value).padStart(2, '0')
    return `${date.getFullYear()}-${part(date.getMonth() + 1)}-${part(date.getDate())}T${part(date.getHours())}:${part(date.getMinutes())}`
  }, hours)

  await page.goto(`${baseURL}/app/subjects`)
  await expect(page.getByRole('heading', { name: 'Materias', exact: true })).toBeVisible()
  await page.getByRole('link', { name: 'Nueva materia' }).click()
  await page.getByLabel('Nombre', { exact: true }).fill(subjectName)
  await page.getByRole('button', { name: 'Crear materia', exact: true }).click()
  await expect(page.getByRole('heading', { name: subjectName, exact: true })).toBeVisible()
  operations.push('materia:crear')

  await page.getByRole('link', { name: 'Actividades', exact: true }).first().click()
  await page.getByRole('link', { name: 'Nueva actividad' }).click()
  await page.getByLabel('Título', { exact: true }).fill(activityTitle)
  await page.getByLabel('Materia', { exact: true }).selectOption({ label: subjectName })
  await page.getByLabel('Fecha límite', { exact: true }).fill(await localDateTime(24))
  await page.getByLabel('Prioridad', { exact: true }).selectOption('high')
  await page.getByRole('button', { name: 'Crear actividad', exact: true }).click()
  await expect(page.getByRole('heading', { name: activityTitle, exact: true })).toBeVisible()
  operations.push('actividad:crear')

  await page.getByRole('link', { name: 'Sesiones', exact: true }).first().click()
  await page.getByRole('link', { name: 'Planificar sesión' }).click()
  await page.getByLabel('Materia', { exact: true }).selectOption({ label: subjectName })
  await page.getByLabel('Actividad (opcional)').selectOption({ label: activityTitle })
  await page.getByLabel('Fecha y hora planificadas').fill(await localDateTime(2))
  await page.getByLabel('Duración planificada (minutos)').fill('20')
  await page.getByRole('button', { name: 'Crear sesión planificada' }).click()
  await expect(page.getByRole('heading', { name: `Sesión de ${subjectName}`, exact: true })).toBeVisible()
  await page.getByRole('button', { name: 'Iniciar sesión' }).click()
  await expect(page.getByRole('button', { name: 'Pausar' })).toBeVisible()
  await page.getByRole('button', { name: 'Pausar' }).click()
  await expect(page.getByRole('button', { name: 'Reanudar' })).toBeVisible()
  await page.getByRole('button', { name: 'Reanudar' }).click()
  await expect(page.getByRole('button', { name: 'Pausar' })).toBeVisible()
  await page.getByRole('button', { name: 'Pausar' }).click()
  await page.getByRole('button', { name: 'Finalizar sesión' }).click()
  await page.getByLabel('Confirmo que deseo finalizar con este resultado.').check()
  await page.getByRole('button', { name: 'Confirmar resultado' }).click()
  await expect(page.getByText('Sesión finalizada y sincronizada.')).toBeVisible()
  operations.push('sesion:crear,iniciar,pausar,reanudar,pausar,finalizar')

  await page.getByRole('link', { name: 'Planes', exact: true }).first().click()
  await page.getByRole('link', { name: 'Crear plan', exact: true }).click()
  await page.getByLabel('Nombre del plan').fill(planName)
  await page.getByLabel('¿Qué quieres lograr?').fill('Estudiar y revisar los recursos de prueba.')
  await page.getByLabel(subjectName, { exact: true }).check()
  await page.getByLabel(activityTitle, { exact: true }).check()
  await page.getByRole('button', { name: 'Crear plan', exact: true }).click()
  await expect(page.getByRole('heading', { name: planName, exact: true })).toBeVisible()
  await page.getByRole('button', { name: 'Añadir misión' }).click()
  await page.getByLabel('Nombre de la misión').fill(challengeTitle)
  await page.getByLabel('¿Cómo vas a cumplirla?').fill('Completar una sesión breve y revisar la actividad asociada.')
  await page.getByLabel('Materia relacionada').selectOption({ label: subjectName })
  await page.getByRole('button', { name: 'Añadir misión', exact: true }).click()
  const missionLink = page.getByRole('list', { name: 'Misiones del plan' }).getByRole('link', { name: challengeTitle, exact: true })
  await expect(missionLink).toBeVisible()
  await missionLink.click()
  await page.getByRole('button', { name: 'Iniciar misión' }).click()
  await page.getByRole('button', { name: 'Completar misión' }).click()
  operations.push('plan:crear,vincular;reto:crear,iniciar,completar')

  await page.getByRole('link', { name: 'Calendario', exact: true }).first().click()
  await expect(page.getByRole('link', { name: new RegExp(activityTitle) })).toBeVisible()
  await page.getByRole('button', { name: 'Semana', exact: true }).click()
  await expect(page.getByRole('button', { name: 'Semana', exact: true })).toHaveAttribute('aria-pressed', 'true')
  operations.push('calendario:mes,semana')

  await page.getByRole('link', { name: 'Análisis', exact: true }).first().click()
  await page.getByLabel('Buscar por nombre').fill(subjectName)
  await expect(page.getByRole('link', { name: subjectName, exact: true })).toBeVisible()
  operations.push('analytics:resumen,tiempo,cronologia,busqueda')

  await page.reload()
  await expect(page.getByRole('button', { name: 'Cerrar sesión' })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Análisis', exact: true })).toBeVisible()
  await page.getByLabel('Buscar por nombre').fill(subjectName)
  await expect(page.getByRole('link', { name: subjectName, exact: true })).toBeVisible()
  operations.push('refresh:analytics,busqueda')

  const pages = [
    ['subjects', 'Materias', '/app/subjects', 'Materias'],
    ['activities', 'Actividades', '/app/activities', 'Actividades'],
    ['sessions', 'Sesiones', '/app/sessions', 'Sesiones de estudio'],
    ['calendar', 'Calendario', '/app/calendar', 'Calendario'],
    ['plans', 'Planes', '/app/study-plans', 'Planes de estudio'],
    ['analytics', 'Análisis', '/app/analytics', 'Análisis'],
  ] as const
  await page.setViewportSize({ width: 1440, height: 1000 })
  await page.getByRole('link', { name: pages[0][1], exact: true }).first().click()
  for (const [index, [name, navLabel, route, heading]] of pages.entries()) {
    await page.setViewportSize({ width: 1440, height: 1000 })
    if (index > 0) await page.getByRole('link', { name: navLabel, exact: true }).first().click()
    await expect(page).toHaveURL(new RegExp(`${route.replaceAll('/', '\\/')}(?:$|\\?)`))
    await expect(page.getByRole('heading', { name: heading, exact: true })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Cerrar sesión' })).toBeVisible()
    await expect(page.getByRole('status').filter({ hasText: /Cargando|Comprobando tu sesión/ })).toHaveCount(0, { timeout: 30_000 })
    await page.screenshot({ path: `${output}/${name}-desktop.png`, fullPage: true })
    screenshots.push(`${name}-desktop.png`)
    await page.setViewportSize({ width: 390, height: 844 })
    await expect(page.getByRole('heading', { name: heading, exact: true })).toBeVisible()
    const dimensions = await page.evaluate(() => ({ viewport: window.innerWidth, document: document.documentElement.scrollWidth }))
    if (dimensions.document > dimensions.viewport) throw new Error(`Overflow horizontal en ${name}: ${JSON.stringify(dimensions)}`)
    await page.screenshot({ path: `${output}/${name}-mobile.png`, fullPage: true })
    screenshots.push(`${name}-mobile.png`)
  }

  const report = { createdByNormalRegistration: true, cleanupPerformed: false, operations, screenshots, pageErrors: errors }
  await writeFile(`${output}/report.json`, JSON.stringify(report, null, 2))
  if (errors.length) throw new Error(`Errores JavaScript: ${errors.length}`)
  process.stdout.write(`Recorrido local aprobado; evidencia en ${output}. Cuenta sintética conservada, sin limpieza.\n`)
} finally {
  await context.close()
  await browser.close()
}
