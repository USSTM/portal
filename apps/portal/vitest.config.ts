import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.test.{ts,tsx}', 'server/**/*.test.ts'],
    exclude: ['src/**/*.integration.test.ts'],
  },
})
