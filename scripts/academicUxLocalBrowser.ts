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

  const pages = [
    ['subjects', '/app/subjects'],
    ['activities', '/app/activities'],
    ['sessions', '/app/sessions'],
    ['calendar', '/app/calendar'],
    ['plans', '/app/study-plans'],
    ['analytics', '/app/analytics'],
  ] as const
  for (const [name, route] of pages) {
    await page.setViewportSize({ width: 1440, height: 1000 })
    await page.goto(`${baseURL}${route}`)
    await expect(page.locator('main')).toBeVisible()
    await expect(page.getByRole('status').filter({ hasText: /Cargando|Comprobando tu sesión/ })).toHaveCount(0, { timeout: 30_000 })
    await page.screenshot({ path: `${output}/${name}-desktop.png`, fullPage: true })
    screenshots.push(`${name}-desktop.png`)
    await page.setViewportSize({ width: 390, height: 844 })
    await page.reload()
    await expect(page.locator('main')).toBeVisible()
    await expect(page.getByRole('status').filter({ hasText: /Cargando|Comprobando tu sesión/ })).toHaveCount(0, { timeout: 30_000 })
    const dimensions = await page.evaluate(() => ({ viewport: window.innerWidth, document: document.documentElement.scrollWidth }))
    if (dimensions.document > dimensions.viewport) throw new Error(`Overflow horizontal en ${name}: ${JSON.stringify(dimensions)}`)
    await page.screenshot({ path: `${output}/${name}-mobile.png`, fullPage: true })
    screenshots.push(`${name}-mobile.png`)
  }

  const report = { createdByNormalRegistration: true, cleanupPerformed: false, screenshots, pageErrors: errors }
  await writeFile(`${output}/report.json`, JSON.stringify(report, null, 2))
  if (errors.length) throw new Error(`Errores JavaScript: ${errors.length}`)
  process.stdout.write(`Recorrido local aprobado; evidencia en ${output}. Cuenta sintética conservada, sin limpieza.\n`)
} finally {
  await context.close()
  await browser.close()
}
