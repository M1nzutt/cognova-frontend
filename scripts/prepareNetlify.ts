import { access, writeFile } from 'node:fs/promises'
import { renderNetlifyRedirects } from './netlifyRedirects.ts'

const redirects = renderNetlifyRedirects(process.env.RENDER_API_ORIGIN, process.env.VITE_API_BASE_URL)
if (!process.argv.includes('--check')) {
  await access(new URL('../dist/index.html', import.meta.url))
  await writeFile(new URL('../dist/_redirects', import.meta.url), redirects, 'utf8')
}
