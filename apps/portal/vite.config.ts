import { defineConfig, loadEnv } from 'vite'
import { tanstackStart } from '@tanstack/react-start/plugin/vite'
import { fileURLToPath } from 'node:url'

import viteReact from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { nitro } from 'nitro/vite'

const repoRoot = fileURLToPath(new URL('../..', import.meta.url))

const config = defineConfig(({ mode }) => {
  const environment = loadEnv(mode, repoRoot, '')
  for (const [name, value] of Object.entries(environment)) {
    process.env[name] ??= value
  }

  return {
    envDir: repoRoot,
    resolve: { tsconfigPaths: true },
    server: {
      proxy: {
        '/auth': {
          target: `http://localhost:${process.env.AUTH_PORT ?? '3001'}`,
        },
      },
    },
    plugins: [
    nitro({
      config: {
        handlers: [
          {
            route: '/health/live',
            method: 'GET',
            handler: './server/health-live.ts',
          },
          {
            route: '/health/ready',
            method: 'GET',
            handler: './server/health-ready.ts',
          },
          {
            route: '/api/v1/events',
            handler: './server/public-events.ts',
          },
        ],
      },
    }),
    tailwindcss(),
    tanstackStart(),
    viteReact(),
    ],
  }
})

export default config
