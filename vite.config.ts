import { fileURLToPath, URL } from 'node:url'

import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const hiveProxy = env.VITE_DEV_FLORA_HIVE_PROXY_TARGET || 'http://localhost:8080'

  return {
    plugins: [vue(), ...(mode === 'development' ? [vueDevTools()] : [])],
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
      },
    },
    server: {
      // WSL2 / Docker: listen on all interfaces so Windows → localhost:5173 forwarding is reliable.
      host: true,
      proxy: {
        '/v1': {
          target: hiveProxy,
          changeOrigin: true,
          timeout: 15_000,
          proxyTimeout: 15_000,
          configure(proxy) {
            proxy.on('error', (err, _req, res) => {
              const msg = err instanceof Error ? err.message : String(err)
              console.warn(`[vite proxy] /v1 → ${hiveProxy}: ${msg}`)
              if (res && 'writeHead' in res && typeof res.writeHead === 'function' && !res.headersSent) {
                res.writeHead(502, { 'Content-Type': 'text/plain; charset=utf-8' })
                res.end(
                  `Bad gateway (dev proxy): cannot reach Flora Hive at ${hiveProxy}. Start the API or set VITE_DEV_FLORA_HIVE_PROXY_TARGET.\n`,
                )
              }
            })
          },
        },
        '/healthz': {
          target: hiveProxy,
          changeOrigin: true,
          timeout: 5_000,
          proxyTimeout: 5_000,
          configure(proxy) {
            proxy.on('error', (err, _req, res) => {
              const msg = err instanceof Error ? err.message : String(err)
              console.warn(`[vite proxy] /healthz → ${hiveProxy}: ${msg}`)
              if (res && 'writeHead' in res && typeof res.writeHead === 'function' && !res.headersSent) {
                res.writeHead(502, { 'Content-Type': 'text/plain; charset=utf-8' })
                res.end(`Bad gateway (dev proxy): ${hiveProxy} — ${msg}\n`)
              }
            })
          },
        },
      },
    },
  }
})
