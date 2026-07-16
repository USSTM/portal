import { defineConfig } from 'vite'
import { tanstackStart } from '@tanstack/react-start/plugin/vite'

import viteReact from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { nitro } from 'nitro/vite'

const config = defineConfig({
  resolve: { tsconfigPaths: true },
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
})

export default config
