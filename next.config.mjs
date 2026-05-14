import nextra from 'nextra'

const withNextra = nextra({
  theme: 'nextra-theme-docs',
  themeConfig: './theme.config.tsx',
  search: {
    codeblocks: true,
  },
  defaultShowCopyCode: true,
})

const isProd = process.env.NODE_ENV === 'production'

// Production CSP — tight. Dev mode needs unsafe-eval for React refresh and
// inline scripts for hot reload, so we relax the script-src / style-src
// directives there.
const csp = isProd
  ? [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' va.vercel-scripts.com",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: https://*.vercel-storage.com",
      "connect-src 'self' vitals.vercel-insights.com",
      "frame-ancestors 'none'",
    ].join('; ')
  : [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' va.vercel-scripts.com",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob: https://*.vercel-storage.com",
      "connect-src 'self' ws: wss: vitals.vercel-insights.com",
      "frame-ancestors 'none'",
    ].join('; ')

const securityHeaders = [
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
  ...(isProd
    ? [{ key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' }]
    : []),
  { key: 'Content-Security-Policy', value: csp },
]

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  pageExtensions: ['mdx', 'tsx', 'ts'],
  async headers() {
    return [{ source: '/(.*)', headers: securityHeaders }]
  },
}

export default withNextra(nextConfig)
