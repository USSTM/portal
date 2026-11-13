import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { withPayload } from '@payloadcms/next/withPayload'

const dirname = path.dirname(fileURLToPath(import.meta.url))

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  // Trace dependencies from the workspace root so the standalone output
  // includes hoisted pnpm packages.
  outputFileTracingRoot: path.join(dirname, '../..'),
  // The shared session package ships TypeScript source.
  transpilePackages: ['@usstm/auth-session'],
  // /auth/* goes to the auth service: through Caddy in production, and through
  // src/app/auth/[...path]/route.ts in development.
  webpack: (webpackConfig) => {
    webpackConfig.resolve.extensionAlias = {
      '.cjs': ['.cts', '.cjs'],
      '.js': ['.ts', '.tsx', '.js', '.jsx'],
      '.mjs': ['.mts', '.mjs'],
    }

    return webpackConfig
  },
}

export default withPayload(nextConfig, { devBundleServerPackages: false })
