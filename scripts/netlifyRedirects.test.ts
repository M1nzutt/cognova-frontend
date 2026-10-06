import { describe, expect, it } from 'vitest'
import { renderNetlifyRedirects } from './netlifyRedirects'

describe('Netlify routing', () => {
  it('preserves /api, forces the Render proxy and leaves SPA last', () => {
    expect(renderNetlifyRedirects('https://test-backend.onrender.com/')).toBe(
      '/api https://test-backend.onrender.com/api 200!\n/api/* https://test-backend.onrender.com/api/:splat 200!\n/* /index.html 200\n',
    )
  })
  it.each([undefined, '', 'http://test.onrender.com', 'https://test.onrender.com/api/v1',
    'https://secret@test.onrender.com', 'https://test.onrender.com?x=1', 'https://test.onrender.com#x',
    'https://test.onrender.com:123', 'https://example.com', 'https://test.onrender.com\n/* /fake 200'])(
    'rejects missing or unsafe proxy target %s', (origin) => {
    expect(() => renderNetlifyRedirects(origin)).toThrow()
  })
  it('rejects a browser API base that bypasses the same-origin proxy', () => {
    expect(() => renderNetlifyRedirects('https://test.onrender.com', 'https://test.onrender.com/api/v1')).toThrow()
  })
})
