import { defineConfig, loadEnv, type ProxyOptions } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ command, mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  if (command === 'build' && env.VITE_API_BASE_URL && env.VITE_API_BASE_URL !== '/api/v1') {
    throw new Error('El build de producción requiere VITE_API_BASE_URL=/api/v1 y proxy de mismo origen.')
  }
  const proxyTarget = env.BACKEND_PROXY_TARGET || 'http://127.0.0.1:8000'
  const proxyOrigin = env.BACKEND_PROXY_ORIGIN?.trim()
  const apiProxy: ProxyOptions = {
    target: proxyTarget,
    changeOrigin: true,
    ...(proxyOrigin ? {
      configure(proxy) {
        proxy.on('proxyReq', (proxyRequest) => proxyRequest.setHeader('Origin', proxyOrigin))
      },
    } : {}),
  }
  const previewProxy = { '/api': { target: proxyTarget, changeOrigin: true } }
  return { plugins: [react()], server: { proxy: { '/api': apiProxy } }, preview: { proxy: previewProxy } }
})
