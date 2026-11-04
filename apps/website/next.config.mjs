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
  // In production Caddy routes /auth/* to the auth service before requests
  // reach Next. In development, proxy it like the Portal's Vite config does.
  async rewrites() {
    if (process.env.NODE_ENV !== 'development') return []
    return [
      {
        source: '/auth/:path*',
        destination: `http://127.0.0.1:${process.env.AUTH_PORT ?? '3001'}/auth/:path*`,
      },
    ]
  },
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
